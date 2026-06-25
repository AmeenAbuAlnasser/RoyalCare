import { Injectable } from '@nestjs/common';
import { Prisma } from '@royalcare/db';
import { PrismaService } from '../../../common/database/prisma.service';
import { safeUserSelect } from '../../../common/database/safe-user-select';

const staffRoles = [
  'CENTER_OWNER',
  'CENTER_MANAGER',
  'DOCTOR',
  'RECEPTIONIST',
  'ACCOUNTANT',
  'STAFF',
] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const EXPIRING_SOON_DAYS = 7;

type TenantDashboardNotificationRow = {
  body: Prisma.JsonValue;
  createdAt: Date;
  id: string;
  readAt: Date | null;
  status: string;
  title: Prisma.JsonValue;
  type: string | null;
};

@Injectable()
export class TenantDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(
    centerId: string,
    clientNow?: string,
    clientDate?: string,
    branchId?: string,
  ) {
    const prisma = await this.prisma.getClient();
    const serverNow = new Date();

    // Branch scoping fragments. Appointments carry branchId directly; invoices
    // are scoped through their linked appointment. Patients/services/staff are
    // center-level entities (not per-branch), so their counters stay global.
    const apptBranch: Prisma.AppointmentWhereInput = branchId ? { branchId } : {};
    const invoiceBranch: Prisma.InvoiceWhereInput = branchId
      ? { appointment: { is: { branchId } } }
      : {};

    // Prefer the browser's local time over the server clock.
    // The server may run in a different timezone (e.g. UTC+2) while appointments
    // are stored in center local time. clientNow / clientDate come from the
    // browser so they always reflect the user's actual local clock.
    let nowMinutes: number;
    if (clientNow && /^\d{2}:\d{2}$/.test(clientNow)) {
      const [h, m] = clientNow.split(':').map(Number);
      nowMinutes = h * 60 + m;
    } else {
      nowMinutes = serverNow.getHours() * 60 + serverNow.getMinutes();
    }

    const todayText =
      clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)
        ? clientDate
        : `${serverNow.getFullYear()}-${String(serverNow.getMonth() + 1).padStart(2, '0')}-${String(serverNow.getDate()).padStart(2, '0')}`;

    const twoHoursFromNow = nowMinutes + 120;
    const today = new Date(`${todayText}T00:00:00.000Z`);

    console.log('[dashboard-kpi]', {
      clientNow: clientNow ?? null,
      clientDate: clientDate ?? null,
      resolvedNowHHMM: minutesToTime(nowMinutes),
      resolvedTodayText: todayText,
      windowStart: minutesToTime(nowMinutes),
      windowEnd: minutesToTime(Math.min(twoHoursFromNow, 24 * 60 - 1)),
    });

    const [
      patients,
      appointments,
      services,
      staff,
      todayAppointments,
      upcomingSoon,
      noShowToday,
      patientsWithCredit,
      pendingInvoices,
      recentAppointments,
      recentInvoices,
      latestSubscription,
      notificationUnreadCount,
      latestNotifications,
      completedToday,
    ] = await Promise.all([
      prisma.patient.count({ where: { centerId } }),
      prisma.appointment.count({ where: { centerId, ...apptBranch } }),
      prisma.service.count({ where: { centerId } }),
      prisma.userRole.count({
        where: {
          centerId,
          status: { not: 'REVOKED' },
          role: {
            key: { in: [...staffRoles] },
            scope: 'CENTER',
          },
          user: {
            deletedAt: null,
          },
        },
      }),
      prisma.appointment.count({
        where: {
          centerId,
          ...apptBranch,
          appointmentDate: today,
        },
      }),
      // Overlap logic: appointment overlaps [now, now+2h]
      // endTime >= now  →  appointment hasn't finished yet
      // startTime <= now+2h  →  appointment starts within the window
      prisma.appointment.count({
        where: {
          centerId,
          ...apptBranch,
          appointmentDate: today,
          status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
          endTime: { gte: minutesToTime(nowMinutes) },
          startTime: { lte: minutesToTime(Math.min(twoHoursFromNow, 24 * 60 - 1)) },
        },
      }),
      // "Missed / no-show": NO_SHOW status OR appointments whose endTime has
      // already passed today but are still in an active status.
      prisma.appointment.count({
        where: {
          centerId,
          ...apptBranch,
          appointmentDate: today,
          OR: [
            { status: 'NO_SHOW' },
            {
              status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
              endTime: { lt: minutesToTime(nowMinutes) },
            },
          ],
        },
      }),
      prisma.patient.count({
        where: {
          centerId,
          creditBalance: { gt: new Prisma.Decimal(0) },
        },
      }),
      prisma.invoice.count({
        where: {
          centerId,
          ...invoiceBranch,
          status: { in: ['PENDING', 'PARTIAL'] },
        },
      }),
      prisma.appointment.findMany({
        where: { centerId, ...apptBranch },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          appointmentDate: true,
          startTime: true,
          status: true,
          patient: { select: { fullName: true } },
          service: {
            select: { nameEn: true, nameAr: true, nameHe: true },
          },
          staffUser: { select: safeUserSelect },
        },
      }),
      prisma.invoice.findMany({
        where: { centerId, ...invoiceBranch },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          customServiceName: true,
          patient: { select: { fullName: true } },
          service: {
            select: { nameEn: true, nameAr: true, nameHe: true },
          },
        },
      }),
      prisma.subscription.findFirst({
        where: { centerId },
        orderBy: { createdAt: 'desc' },
        select: {
          status: true,
          currentPeriodEnd: true,
          planName: true,
        },
      }),
      // Notification queries are wrapped so a future schema/DB issue never
      // collapses the entire dashboard endpoint.
      prisma.notification
        .count({ where: { centerId, readAt: null } })
        .catch(() => 0),
      prisma.notification
        .findMany({
          where: { centerId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            type: true,
            title: true,
            body: true,
            status: true,
            readAt: true,
            createdAt: true,
          },
        })
        .catch(() => [] as TenantDashboardNotificationRow[]),
      prisma.appointment.count({
        where: { centerId, ...apptBranch, appointmentDate: today, status: 'COMPLETED' },
      }),
    ]);

    const notificationRows =
      latestNotifications as TenantDashboardNotificationRow[];

    const subEnd = latestSubscription?.currentPeriodEnd ?? null;
    const subDaysRemaining = subEnd
      ? Math.ceil((subEnd.getTime() - serverNow.getTime()) / MS_PER_DAY)
      : null;
    const subIsExpired = subDaysRemaining !== null && subDaysRemaining < 0;
    const subIsExpiringSoon =
      !subIsExpired &&
      subDaysRemaining !== null &&
      subDaysRemaining <= EXPIRING_SOON_DAYS;

    return {
      alerts: {
        patientsWithCredit,
        pendingInvoices,
        upcomingSoon,
      },
      appointments,
      patients,
      recentAppointments: recentAppointments.map((appointment) => ({
        appointmentDate: appointment.appointmentDate,
        id: appointment.id,
        patientName: appointment.patient.fullName,
        providerName:
          appointment.staffUser.fullName ?? appointment.staffUser.email ?? '',
        serviceNameAr: appointment.service?.nameAr ?? '',
        serviceNameEn: appointment.service?.nameEn ?? '',
        serviceNameHe: appointment.service?.nameHe ?? '',
        startTime: appointment.startTime,
        status: appointment.status,
      })),
      recentInvoices: recentInvoices.map((invoice) => ({
        amount: Number(invoice.amount).toFixed(2),
        createdAt: invoice.createdAt,
        currency: invoice.currency,
        id: invoice.id,
        patientName: invoice.patient.fullName,
        serviceNameAr:
          invoice.service?.nameAr ?? invoice.customServiceName ?? '',
        serviceNameEn:
          invoice.service?.nameEn ?? invoice.customServiceName ?? '',
        serviceNameHe:
          invoice.service?.nameHe ?? invoice.customServiceName ?? '',
        status: invoice.status,
      })),
      services,
      staff,
      subscription: latestSubscription
        ? {
            daysRemaining: subDaysRemaining,
            endDate: latestSubscription.currentPeriodEnd,
            isExpired: subIsExpired,
            isExpiringSoon: subIsExpiringSoon,
            planName: latestSubscription.planName,
            status: latestSubscription.status,
          }
        : null,
      todayActivity: {
        appointmentsToday: todayAppointments,
        completedToday,
        noShow: noShowToday,
        upcomingNextTwoHours: upcomingSoon,
      },
      notifications: {
        unreadCount: notificationUnreadCount,
        latest: notificationRows.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          status: n.status,
          isRead: n.readAt !== null,
          createdAt: n.createdAt,
        })),
      },
    };
  }
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return `${hours.toString().padStart(2, '0')}:${remainder
    .toString()
    .padStart(2, '0')}`;
}

