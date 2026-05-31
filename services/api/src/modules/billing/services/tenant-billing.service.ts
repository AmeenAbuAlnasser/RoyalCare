import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@royalcare/db';
import { PrismaService } from '../../../common/database/prisma.service';
import { hasTenantPermission } from '../../../common/permissions/tenant-permissions';
import { AuditService } from '../../audit/audit.service';
import type { CreateInvoiceDto } from '../dto/create-invoice.dto';
import type { UpdateInvoiceStatusDto } from '../dto/update-invoice-status.dto';

type BillingPermission =
  | 'billing:view'
  | 'billing:create'
  | 'billing:update'
  | 'billing:cancel';

const invoiceStatuses = ['PENDING', 'PAID', 'CANCELLED'] as const;
type InvoiceStatus = (typeof invoiceStatuses)[number];

// All valid DB statuses (PARTIAL is auto-set by payment logic, never set manually)
type AnyInvoiceStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';

const invoiceSelect = {
  id: true,
  invoiceNumber: true,
  centerId: true,
  patientId: true,
  serviceId: true,
  customServiceName: true,
  staffUserId: true,
  appointmentId: true,
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
      fullNameAr: true,
      fullNameHe: true,
      fullNameEn: true,
      phone: true,
      email: true,
      status: true,
    },
  },
  center: {
    select: {
      id: true,
      name: true,
      nameAr: true,
      nameEn: true,
      nameHe: true,
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
  invoiceNumber: string | null;
  centerId: string;
  patientId: string;
  serviceId: string | null;
  customServiceName: string | null;
  staffUserId: string | null;
  appointmentId: string | null;
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
  center: {
    id: string;
    name: string;
    nameAr?: string | null;
    nameEn?: string | null;
    nameHe?: string | null;
  };
  service: {
    id: string;
    nameEn: string;
    nameAr: string;
    nameHe: string;
    price: { toString(): string } | null;
    currency: string;
    isActive: boolean;
  } | null;
  staff: { id: string; fullName: string; email: string | null } | null;
}) {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    centerId: invoice.centerId,
    patientId: invoice.patientId,
    serviceId: invoice.serviceId,
    customServiceName: invoice.customServiceName,
    staffUserId: invoice.staffUserId,
    appointmentId: invoice.appointmentId,
    amount: invoice.amount.toString(),
    currency: invoice.currency,
    status: invoice.status,
    notes: invoice.notes,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    patient: invoice.patient,
    center: invoice.center,
    service: invoice.service
      ? {
          ...invoice.service,
          price: invoice.service.price
            ? invoice.service.price.toString()
            : null,
        }
      : null,
    staffUser: invoice.staff,
  };
}

@Injectable()
export class TenantBillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(
    centerId: string,
    permissions: string[],
    query?: { search?: string; status?: string; appointmentId?: string },
  ) {
    this.requirePermission(permissions, 'billing:view');

    const prisma = await this.prisma.getClient();
    const status = optionalTrimmed(query?.status)?.toUpperCase();
    const search = optionalTrimmed(query?.search);
    const appointmentId = isValidUuid(query?.appointmentId)
      ? query.appointmentId
      : undefined;

    const listStatuses = ['PENDING', 'PARTIAL', 'PAID', 'CANCELLED'] as const;
    type ListFilterStatus = (typeof listStatuses)[number];
    const isListFilterStatus = (v: unknown): v is ListFilterStatus =>
      typeof v === 'string' && (listStatuses as readonly string[]).includes(v);

    const statusWhere: Record<string, unknown> =
      status === 'ALL'
        ? {}
        : isListFilterStatus(status)
          ? { status }
          : { status: { not: 'CANCELLED' as const } };

    const where = {
      centerId,
      ...statusWhere,
      ...(appointmentId ? { appointmentId } : {}),
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

  async getOptions(centerId: string, permissions: string[]) {
    this.requirePermission(permissions, 'billing:view');

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

  async create(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    dto: CreateInvoiceDto,
  ) {
    this.requirePermission(permissions, 'billing:create');

    const prisma = await this.prisma.getClient();
    const errors: Record<string, string> = {};

    const rawAppointmentId =
      typeof dto.appointmentId === 'string' ? dto.appointmentId.trim() : null;
    const appointmentId =
      rawAppointmentId && isValidUuid(rawAppointmentId)
        ? rawAppointmentId
        : null;

    if (rawAppointmentId && !appointmentId) {
      throw validationFailed({ appointmentId: 'Invalid appointment.' });
    }

    let resolvedPatientId: string;
    let resolvedServiceId: string | null;
    let resolvedCustomServiceName: string | null = null;
    let resolvedStaffUserId: string | null;
    let resolvedAmount: string;

    if (appointmentId) {
      // Appointment-linked creation: auto-fill from appointment
      const appt = await prisma.appointment.findFirst({
        where: { id: appointmentId, centerId },
        select: {
          id: true,
          status: true,
          patientId: true,
          serviceId: true,
          customServiceName: true,
          customServicePrice: true,
          staffUserId: true,
          service: { select: { price: true, currency: true } },
        },
      });

      if (!appt) {
        throw validationFailed({ appointmentId: 'Appointment not found.' });
      }

      if (appt.status !== 'COMPLETED') {
        throw validationFailed({
          appointmentId:
            'Invoice can only be created after the appointment is completed.',
        });
      }

      const existingInvoice = await prisma.invoice.findFirst({
        where: { appointmentId, centerId },
        select: invoiceSelect,
      });
      if (existingInvoice) {
        throw validationFailed({
          appointmentId: 'This appointment already has an invoice.',
        });
      }

      resolvedPatientId = appt.patientId;
      resolvedStaffUserId = appt.staffUserId;

      if (!appt.serviceId && !appt.customServiceName) {
        throw validationFailed({
          appointmentId:
            'This appointment is linked to an offer with no assigned service. Please create the invoice manually and select a service.',
        });
      }
      resolvedServiceId = appt.serviceId;
      resolvedCustomServiceName = appt.serviceId
        ? null
        : (appt.customServiceName ?? null);

      if (
        dto.amount !== undefined &&
        dto.amount !== null &&
        dto.amount !== ''
      ) {
        if (!isValidAmount(dto.amount)) {
          errors.amount = 'Enter a valid amount greater than zero.';
        } else {
          resolvedAmount =
            typeof dto.amount === 'number'
              ? String(dto.amount)
              : (dto.amount as string);
        }
      } else if (appt.service?.price) {
        resolvedAmount = appt.service.price.toString();
      } else if (appt.customServicePrice) {
        resolvedAmount = appt.customServicePrice.toString();
      } else {
        errors.amount = 'Service has no price set. Enter the amount manually.';
      }

      if (Object.keys(errors).length > 0) throw validationFailed(errors);
    } else {
      // Manual creation: all fields required
      const patientId =
        typeof dto.patientId === 'string' ? dto.patientId.trim() : '';
      const serviceId =
        typeof dto.serviceId === 'string' ? dto.serviceId.trim() : '';
      const staffUserId =
        typeof dto.staffUserId === 'string' && dto.staffUserId.trim()
          ? dto.staffUserId.trim()
          : null;

      if (!isValidUuid(patientId)) errors.patientId = 'Select a valid patient.';
      if (!isValidUuid(serviceId)) errors.serviceId = 'Select a valid service.';
      if (!isValidAmount(dto.amount))
        errors.amount = 'Enter a valid amount greater than zero.';
      if (staffUserId !== null && !isValidUuid(staffUserId))
        errors.staffUserId = 'Select a valid provider.';

      if (Object.keys(errors).length > 0) throw validationFailed(errors);

      resolvedPatientId = patientId;
      resolvedServiceId = serviceId;
      resolvedCustomServiceName = null;
      resolvedStaffUserId = staffUserId;
      resolvedAmount =
        typeof dto.amount === 'number'
          ? String(dto.amount)
          : (dto.amount as string);
    }

    const currency =
      typeof dto.currency === 'string' && dto.currency.trim()
        ? dto.currency.trim().toUpperCase()
        : 'ILS';
    const notes =
      typeof dto.notes === 'string' && dto.notes.trim()
        ? dto.notes.trim()
        : null;

    const [patient, service, staffCheck] = await Promise.all([
      prisma.patient.findFirst({
        where: { id: resolvedPatientId, centerId },
        select: { id: true },
      }),
      resolvedServiceId
        ? prisma.service.findFirst({
            where: { id: resolvedServiceId, centerId, isActive: true },
            select: { id: true },
          })
        : Promise.resolve(true),
      resolvedStaffUserId
        ? prisma.userRole.findFirst({
            where: {
              centerId,
              userId: resolvedStaffUserId,
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
    if (resolvedServiceId && !service)
      throw validationFailed({ serviceId: 'Service not found or inactive.' });
    if (resolvedStaffUserId !== null && !staffCheck)
      throw validationFailed({
        staffUserId: 'Provider not found in this center.',
      });

    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await this.generateInvoiceNumber(
        tx,
        new Date().getFullYear(),
      );

      return tx.invoice.create({
        data: {
          invoiceNumber,
          centerId,
          patientId: resolvedPatientId,
          serviceId: resolvedServiceId,
          customServiceName: resolvedCustomServiceName,
          staffUserId: resolvedStaffUserId,
          appointmentId,
          amount: resolvedAmount!,
          currency,
          notes,
          status: 'PENDING',
        },
        select: invoiceSelect,
      });
    });

    await this.auditService.log({
      action: 'TENANT_INVOICE_CREATED',
      actorUserId,
      centerId,
      metadata: {
        amount: resolvedAmount!,
        appointmentId,
        centerId,
        currency,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        patientId: resolvedPatientId,
        patientName: invoice.patient.fullName,
        patientNameAr: invoice.patient.fullNameAr ?? undefined,
        patientNameHe: invoice.patient.fullNameHe ?? undefined,
        patientNameEn: invoice.patient.fullNameEn ?? undefined,
        centerName: invoice.center.name,
        centerNameAr: invoice.center.nameAr ?? undefined,
        centerNameEn: invoice.center.nameEn ?? undefined,
        centerNameHe: invoice.center.nameHe ?? undefined,
        serviceId: resolvedServiceId,
        customServiceName: resolvedCustomServiceName ?? undefined,
        source: 'TENANT_BILLING',
        status: invoice.status,
      },
    });

    return formatInvoice(invoice);
  }

  async getForAppointment(
    centerId: string,
    permissions: string[],
    appointmentId: string,
  ) {
    this.requirePermission(permissions, 'billing:view');

    if (!isValidUuid(appointmentId)) return null;

    const prisma = await this.prisma.getClient();
    const invoice = await prisma.invoice.findFirst({
      where: { centerId, appointmentId },
      select: invoiceSelect,
    });

    return invoice ? formatInvoice(invoice) : null;
  }

  async getById(centerId: string, permissions: string[], invoiceId: string) {
    this.requirePermission(permissions, 'billing:view');

    const prisma = await this.prisma.getClient();
    const invoice = await this.findInvoice(prisma, centerId, invoiceId);

    return formatInvoice(invoice);
  }

  async getPatientCreditForInvoice(
    centerId: string,
    permissions: string[],
    invoiceId: string,
  ) {
    this.requirePermission(permissions, 'billing:view');

    const prisma = await this.prisma.getClient();

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, centerId },
      select: { patientId: true },
    });

    if (!invoice) return { patientCreditBalance: '0.00' };

    const patient = await prisma.patient.findFirst({
      where: { id: invoice.patientId, centerId },
      select: { creditBalance: true },
    });

    return {
      patientCreditBalance: patient
        ? Number(patient.creditBalance).toFixed(2)
        : '0.00',
    };
  }

  async updateStatus(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    invoiceId: string,
    dto: UpdateInvoiceStatusDto,
  ) {
    const status =
      typeof dto.status === 'string' ? dto.status.trim().toUpperCase() : '';

    if (!isAllowedStatus(status))
      throw validationFailed({ status: 'Select a valid invoice status.' });

    if (status === 'CANCELLED')
      this.requirePermission(permissions, 'billing:cancel');
    else this.requirePermission(permissions, 'billing:update');

    const prisma = await this.prisma.getClient();
    const current = await this.findInvoice(prisma, centerId, invoiceId);

    if (current.status === 'CANCELLED' && status !== 'PENDING')
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          status: 'A cancelled invoice can only be reopened to pending.',
        },
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
          status:
            'A partially paid invoice can only be marked paid or cancelled.',
        },
      });

    // When reopening a cancelled invoice, recalculate from existing payments
    let resolvedStatus: AnyInvoiceStatus = status;
    if (current.status === 'CANCELLED' && status === 'PENDING') {
      const agg = await prisma.payment.aggregate({
        where: { invoiceId, centerId },
        _sum: { amount: true },
      });
      const paid = Number(agg._sum.amount ?? 0);
      const total = Number(current.amount);
      if (paid <= 0) resolvedStatus = 'PENDING';
      else if (paid >= total) resolvedStatus = 'PAID';
      else resolvedStatus = 'PARTIAL';
    }

    const updateResult = await prisma.invoice.updateMany({
      where: { id: invoiceId, centerId },
      data: { status: resolvedStatus },
    });

    if (updateResult.count !== 1) {
      throw new NotFoundException({
        message: 'Invoice not found',
        errors: { invoice: 'Invoice not found.' },
      });
    }

    const invoice = await this.findInvoice(prisma, centerId, invoiceId);

    const action =
      resolvedStatus === 'CANCELLED'
        ? 'TENANT_INVOICE_CANCELLED'
        : current.status === 'CANCELLED'
          ? 'TENANT_INVOICE_RESTORED'
          : 'TENANT_INVOICE_STATUS_CHANGED';

    if (current.status !== resolvedStatus) {
      await this.auditService.log({
        action,
        actorUserId,
        centerId,
        metadata: {
          amount: invoice.amount.toString(),
          centerId,
          centerName: invoice.center.name,
          centerNameAr: invoice.center.nameAr ?? undefined,
          centerNameEn: invoice.center.nameEn ?? undefined,
          centerNameHe: invoice.center.nameHe ?? undefined,
          currency: invoice.currency,
          invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          newStatus: resolvedStatus,
          oldStatus: current.status,
          patientId: invoice.patientId,
          patientName: invoice.patient.fullName,
          patientNameAr: invoice.patient.fullNameAr ?? undefined,
          patientNameHe: invoice.patient.fullNameHe ?? undefined,
          patientNameEn: invoice.patient.fullNameEn ?? undefined,
          serviceId: invoice.serviceId,
          source: 'TENANT_BILLING',
        },
      });
    }

    return formatInvoice(invoice);
  }

  private requirePermission(
    permissions: string[],
    permission: BillingPermission,
  ) {
    if (!hasTenantPermission(permissions, permission)) {
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

  private async generateInvoiceNumber(
    prisma: Prisma.TransactionClient,
    year: number,
  ) {
    const rows = await prisma.$queryRaw<Array<{ number: bigint | number }>>(
      Prisma.sql`
        INSERT INTO "TenantInvoiceNumberCounter" ("year", "nextNumber", "createdAt", "updatedAt")
        VALUES (${year}, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("year") DO UPDATE
        SET "nextNumber" = "TenantInvoiceNumberCounter"."nextNumber" + 1,
            "updatedAt" = CURRENT_TIMESTAMP
        RETURNING "nextNumber" - 1 AS "number"
      `,
    );
    const nextNumber = Number(rows[0]?.number ?? 1);
    return `INV-${year}-${String(nextNumber).padStart(6, '0')}`;
  }
}
