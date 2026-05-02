import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import type { CreateInvoiceDto } from '../dto/create-invoice.dto';
import type { UpdateInvoiceStatusDto } from '../dto/update-invoice-status.dto';

type BillingPermission =
  | 'billing.view'
  | 'billing.create'
  | 'billing.update'
  | 'billing.mark_paid';

const invoiceStatuses = ['PENDING', 'PAID', 'CANCELLED'] as const;
type InvoiceStatus = (typeof invoiceStatuses)[number];

// All valid DB statuses (PARTIAL is auto-set by payment logic, never set manually)
type AnyInvoiceStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';

const rolePermissions: Record<string, BillingPermission[]> = {
  CENTER_OWNER: [
    'billing.view',
    'billing.create',
    'billing.update',
    'billing.mark_paid',
  ],
  CENTER_MANAGER: [
    'billing.view',
    'billing.create',
    'billing.update',
    'billing.mark_paid',
  ],
  ACCOUNTANT: [
    'billing.view',
    'billing.create',
    'billing.update',
    'billing.mark_paid',
  ],
  RECEPTIONIST: ['billing.view', 'billing.create'],
  DOCTOR: ['billing.view'],
  STAFF: ['billing.view'],
};

const invoiceSelect = {
  id: true,
  centerId: true,
  patientId: true,
  serviceId: true,
  staffUserId: true,
  amount: true,
  currency: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  patient: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      status: true,
    },
  },
  service: {
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      nameHe: true,
      price: true,
      currency: true,
      isActive: true,
    },
  },
  staff: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
};

function optionalTrimmed(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function isValidUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isValidAmount(value: unknown): boolean {
  if (typeof value === 'number') return isFinite(value) && value > 0;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return !isNaN(n) && isFinite(n) && n > 0;
  }
  return false;
}

function isAllowedStatus(value: unknown): value is InvoiceStatus {
  return (
    typeof value === 'string' &&
    (invoiceStatuses as readonly string[]).includes(value)
  );
}

function validationFailed(errors: Record<string, string>) {
  return new BadRequestException({ message: 'Validation failed', errors });
}

function forbidden(permission: string) {
  return new ForbiddenException({
    message: 'Permission denied',
    errors: { permission: `Missing permission: ${permission}` },
  });
}

function formatInvoice(invoice: {
  id: string;
  centerId: string;
  patientId: string;
  serviceId: string;
  staffUserId: string | null;
  amount: { toString(): string };
  currency: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    status: string;
  };
  service: {
    id: string;
    nameEn: string;
    nameAr: string;
    nameHe: string;
    price: { toString(): string } | null;
    currency: string;
    isActive: boolean;
  };
  staff: { id: string; fullName: string; email: string | null } | null;
}) {
  return {
    id: invoice.id,
    centerId: invoice.centerId,
    patientId: invoice.patientId,
    serviceId: invoice.serviceId,
    staffUserId: invoice.staffUserId,
    amount: invoice.amount.toString(),
    currency: invoice.currency,
    status: invoice.status,
    notes: invoice.notes,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    patient: invoice.patient,
    service: {
      ...invoice.service,
      price: invoice.service.price ? invoice.service.price.toString() : null,
    },
    staffUser: invoice.staff,
  };
}

@Injectable()
export class TenantBillingService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    centerId: string,
    roleKey: string,
    query?: { search?: string; status?: string },
  ) {
    this.requirePermission(roleKey, 'billing.view');

    const prisma = await this.prisma.getClient();
    const status = optionalTrimmed(query?.status)?.toUpperCase();
    const search = optionalTrimmed(query?.search);

    const where = {
      centerId,
      ...(isAllowedStatus(status) ? { status } : {}),
      ...(search
        ? {
            patient: {
              OR: [
                {
                  fullName: { contains: search, mode: 'insensitive' as const },
                },
                { phone: { contains: search } },
              ],
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: invoiceSelect,
      }),
      prisma.invoice.count({ where }),
    ]);

    return { items: items.map(formatInvoice), total };
  }

  async getOptions(centerId: string, roleKey: string) {
    this.requirePermission(roleKey, 'billing.view');

    const prisma = await this.prisma.getClient();

    const [patients, services, providers] = await Promise.all([
      prisma.patient.findMany({
        where: { centerId, status: 'ACTIVE' },
        orderBy: { fullName: 'asc' },
        select: { id: true, fullName: true, phone: true, status: true },
      }),
      prisma.service.findMany({
        where: { centerId, isActive: true, archivedAt: null },
        orderBy: { nameEn: 'asc' },
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          nameHe: true,
          price: true,
          currency: true,
          isActive: true,
        },
      }),
      prisma.userRole.findMany({
        where: {
          centerId,
          status: 'ACTIVE',
          role: {
            key: {
              in: [
                'CENTER_MANAGER',
                'DOCTOR',
                'STAFF',
                'CENTER_OWNER',
                'RECEPTIONIST',
                'ACCOUNTANT',
              ],
            },
            scope: 'CENTER',
            status: 'ACTIVE',
          },
          user: { deletedAt: null, status: 'ACTIVE' },
        },
        orderBy: { user: { fullName: 'asc' } },
        select: {
          user: { select: { id: true, fullName: true, email: true } },
          role: { select: { key: true, name: true } },
        },
      }),
    ]);

    return {
      patients,
      services: services.map((s) => ({
        ...s,
        price: s.price ? s.price.toString() : null,
      })),
      providers: providers.map((p) => ({
        id: p.user.id,
        fullName: p.user.fullName,
        email: p.user.email,
        role: p.role,
      })),
    };
  }

  async create(centerId: string, roleKey: string, dto: CreateInvoiceDto) {
    this.requirePermission(roleKey, 'billing.create');

    const errors: Record<string, string> = {};

    const patientId =
      typeof dto.patientId === 'string' ? dto.patientId.trim() : '';
    const serviceId =
      typeof dto.serviceId === 'string' ? dto.serviceId.trim() : '';
    const staffUserId =
      typeof dto.staffUserId === 'string' && dto.staffUserId.trim()
        ? dto.staffUserId.trim()
        : null;
    const currency =
      typeof dto.currency === 'string' && dto.currency.trim()
        ? dto.currency.trim().toUpperCase()
        : 'ILS';
    const notes =
      typeof dto.notes === 'string' && dto.notes.trim()
        ? dto.notes.trim()
        : null;

    if (!isValidUuid(patientId)) errors.patientId = 'Select a valid patient.';
    if (!isValidUuid(serviceId)) errors.serviceId = 'Select a valid service.';
    if (!isValidAmount(dto.amount))
      errors.amount = 'Enter a valid amount greater than zero.';
    if (staffUserId !== null && !isValidUuid(staffUserId))
      errors.staffUserId = 'Select a valid provider.';

    if (Object.keys(errors).length > 0) throw validationFailed(errors);

    const prisma = await this.prisma.getClient();

    const [patient, service, staffCheck] = await Promise.all([
      prisma.patient.findFirst({
        where: { id: patientId, centerId },
        select: { id: true },
      }),
      prisma.service.findFirst({
        where: { id: serviceId, centerId, isActive: true },
        select: { id: true },
      }),
      staffUserId
        ? prisma.userRole.findFirst({
            where: {
              centerId,
              userId: staffUserId,
              status: 'ACTIVE',
              user: { deletedAt: null, status: 'ACTIVE' },
            },
            select: { id: true },
          })
        : Promise.resolve(true),
    ]);

    if (!patient)
      throw validationFailed({
        patientId: 'Patient not found in this center.',
      });
    if (!service)
      throw validationFailed({ serviceId: 'Service not found or inactive.' });
    if (staffUserId !== null && !staffCheck)
      throw validationFailed({
        staffUserId: 'Provider not found in this center.',
      });

    const amountStr = String(dto.amount);

    const invoice = await prisma.invoice.create({
      data: {
        centerId,
        patientId,
        serviceId,
        staffUserId,
        amount: amountStr,
        currency,
        notes,
        status: 'PENDING',
      },
      select: invoiceSelect,
    });

    return formatInvoice(invoice);
  }

  async getById(centerId: string, roleKey: string, invoiceId: string) {
    this.requirePermission(roleKey, 'billing.view');

    const prisma = await this.prisma.getClient();
    const invoice = await this.findInvoice(prisma, centerId, invoiceId);

    return formatInvoice(invoice);
  }

  async updateStatus(
    centerId: string,
    roleKey: string,
    invoiceId: string,
    dto: UpdateInvoiceStatusDto,
  ) {
    const status =
      typeof dto.status === 'string' ? dto.status.trim().toUpperCase() : '';

    if (!isAllowedStatus(status))
      throw validationFailed({ status: 'Select a valid invoice status.' });

    if (status === 'PAID') this.requirePermission(roleKey, 'billing.mark_paid');
    else this.requirePermission(roleKey, 'billing.update');

    const prisma = await this.prisma.getClient();
    const current = await this.findInvoice(prisma, centerId, invoiceId);

    if (current.status === 'CANCELLED' && status !== 'PENDING')
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { status: 'A cancelled invoice can only be reopened to pending.' },
      });

    if (current.status === 'PAID' && status !== 'CANCELLED')
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { status: 'A paid invoice can only be cancelled.' },
      });

    // PARTIAL acts like PENDING for manual override: allow PAID or CANCELLED
    if (
      current.status === 'PARTIAL' &&
      status !== 'PAID' &&
      status !== 'CANCELLED'
    )
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          status: 'A partially paid invoice can only be marked paid or cancelled.',
        },
      });

    // When reopening a cancelled invoice, recalculate from existing payments
    let resolvedStatus: AnyInvoiceStatus = status;
    if (current.status === 'CANCELLED' && status === 'PENDING') {
      const agg = await prisma.payment.aggregate({
        where: { invoiceId },
        _sum: { amount: true },
      });
      const paid = Number(agg._sum.amount ?? 0);
      const total = Number(current.amount);
      if (paid <= 0) resolvedStatus = 'PENDING';
      else if (paid >= total) resolvedStatus = 'PAID';
      else resolvedStatus = 'PARTIAL';
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: resolvedStatus },
      select: invoiceSelect,
    });

    return formatInvoice(invoice);
  }

  private requirePermission(roleKey: string, permission: BillingPermission) {
    if (!rolePermissions[roleKey]?.includes(permission)) {
      throw forbidden(permission);
    }
  }

  private async findInvoice(
    prisma: Awaited<ReturnType<typeof this.prisma.getClient>>,
    centerId: string,
    invoiceId: string,
  ) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, centerId },
      select: invoiceSelect,
    });

    if (!invoice) {
      throw new NotFoundException({
        message: 'Invoice not found',
        errors: { invoice: 'Invoice not found.' },
      });
    }

    return invoice;
  }
}
