import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

const appointmentSelect = {
  id: true,
  appointmentDate: true,
  startTime: true,
  endTime: true,
  status: true,
  notes: true,
  // internalNotes intentionally excluded
  service: {
    select: {
      nameEn: true,
      nameAr: true,
      nameHe: true,
    },
  },
  staffUser: {
    select: {
      fullName: true,
    },
  },
} as const;

const invoiceSelect = {
  id: true,
  invoiceNumber: true,
  amount: true,
  currency: true,
  status: true,
  createdAt: true,
  customServiceName: true,
  service: {
    select: {
      nameEn: true,
      nameAr: true,
      nameHe: true,
    },
  },
  payments: {
    select: {
      amount: true,
      method: true,
      paidAt: true,
    },
    orderBy: { paidAt: 'asc' as const },
  },
} as const;

@Injectable()
export class PatientPortalService {
  constructor(private readonly prisma: PrismaService) {}

  async resolvePortal(centerSlug: string, token: string) {
    const prisma = await this.prisma.getClient();

    const portalToken = await prisma.patientPortalToken.findUnique({
      where: { token },
      select: {
        id: true,
        expiresAt: true,
        centerId: true,
        patientId: true,
        center: {
          select: {
            id: true,
            slug: true,
            name: true,
            nameAr: true,
            nameEn: true,
            nameHe: true,
            branding: {
              select: {
                primaryColor: true,
                logoUrl: true,
              },
            },
            subscriptions: {
              where: { status: { in: ['TRIALING', 'ACTIVE', 'PAST_DUE'] } },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { notificationPhone: true },
            },
          },
        },
        patient: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            creditBalance: true,
          },
        },
      },
    });

    if (!portalToken) {
      throw new NotFoundException({
        message: 'Portal link not found.',
        errors: { token: 'This portal link is invalid.' },
      });
    }

    if (portalToken.center.slug !== centerSlug) {
      throw new NotFoundException({
        message: 'Portal link not found.',
        errors: { token: 'This portal link is invalid.' },
      });
    }

    if (portalToken.expiresAt && portalToken.expiresAt.getTime() < Date.now()) {
      throw new GoneException({
        message: 'Portal link expired.',
        errors: { token: 'This portal link has expired.' },
      });
    }

    const { center, patient } = portalToken;
    const now = new Date();

    const [upcomingAppointments, pastAppointments, invoices] =
      await Promise.all([
        prisma.appointment.findMany({
          where: {
            centerId: center.id,
            patientId: patient.id,
            appointmentDate: { gte: now },
            isCancelled: false,
          },
          orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
          take: 10,
          select: appointmentSelect,
        }),
        prisma.appointment.findMany({
          where: {
            centerId: center.id,
            patientId: patient.id,
            OR: [{ appointmentDate: { lt: now } }, { isCancelled: true }],
          },
          orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
          take: 20,
          select: appointmentSelect,
        }),
        prisma.invoice.findMany({
          where: {
            centerId: center.id,
            patientId: patient.id,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: invoiceSelect,
        }),
      ]);

    const whatsappPhone = center.subscriptions[0]?.notificationPhone ?? null;

    return {
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        phone: patient.phone,
        email: patient.email,
        creditBalance: patient.creditBalance.toString(),
      },
      center: {
        name: center.name,
        nameAr: center.nameAr,
        nameEn: center.nameEn,
        nameHe: center.nameHe,
        slug: center.slug,
        whatsappPhone,
        branding: center.branding
          ? {
              primaryColor: center.branding.primaryColor,
              logoUrl: center.branding.logoUrl,
            }
          : null,
      },
      upcomingAppointments: upcomingAppointments.map(formatAppointment),
      pastAppointments: pastAppointments.map(formatAppointment),
      invoices: invoices.map(formatInvoice),
    };
  }

  async generatePortalToken(centerId: string, patientId: string) {
    const prisma = await this.prisma.getClient();

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, centerId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException({
        message: 'Patient not found.',
        errors: { patientId: 'Patient not found in this center.' },
      });
    }

    const { randomBytes } = await import('crypto');
    const token = randomBytes(32).toString('hex');

    const created = await prisma.patientPortalToken.create({
      data: { centerId, patientId, token },
      select: { token: true, createdAt: true },
    });

    return { token: created.token, createdAt: created.createdAt };
  }
}

function formatAppointment(appt: {
  id: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  service: { nameEn: string; nameAr: string; nameHe: string } | null;
  staffUser: { fullName: string };
}) {
  return {
    id: appt.id,
    appointmentDate: appt.appointmentDate.toISOString().slice(0, 10),
    startTime: appt.startTime,
    endTime: appt.endTime,
    status: appt.status,
    notes: appt.notes,
    service: appt.service
      ? {
          nameEn: appt.service.nameEn,
          nameAr: appt.service.nameAr,
          nameHe: appt.service.nameHe,
        }
      : { nameEn: '', nameAr: '', nameHe: '' },
    staffUser: { fullName: appt.staffUser.fullName },
  };
}

function formatInvoice(inv: {
  id: string;
  invoiceNumber: string | null;
  amount: { toString(): string };
  currency: string;
  status: string;
  createdAt: Date;
  customServiceName: string | null;
  service: { nameEn: string; nameAr: string; nameHe: string } | null;
  payments: Array<{
    amount: { toString(): string };
    method: string;
    paidAt: Date;
  }>;
}) {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    amount: inv.amount.toString(),
    currency: inv.currency,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    service: {
      nameEn: inv.service?.nameEn ?? inv.customServiceName ?? '',
      nameAr: inv.service?.nameAr ?? inv.customServiceName ?? '',
      nameHe: inv.service?.nameHe ?? inv.customServiceName ?? '',
    },
    payments: inv.payments.map((p) => ({
      amount: p.amount.toString(),
      method: p.method,
      paidAt: p.paidAt.toISOString(),
    })),
  };
}
