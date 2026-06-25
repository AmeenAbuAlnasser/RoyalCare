import { Injectable } from '@nestjs/common';
import type { Prisma } from '@royalcare/db';
import { PrismaService } from '../../common/database/prisma.service';
import {
  normalizeSubscriptionLifecycle,
  type NormalizedSubscriptionLifecycle,
} from '../../common/subscriptions/subscription-lifecycle';
import { AuditService } from '../audit/audit.service';

type CenterMetric = {
  centerId: string;
  centerName: string;
  count: number;
};

type RevenueMetric = {
  centerId: string;
  centerName: string;
  amount: string;
};

type InsightItem = {
  type: string;
  severity: 'low' | 'medium' | 'high';
  messageEn: string;
  messageAr: string;
  messageHe: string;
  relatedCenterId?: string;
  relatedCenterName?: string;
};

type ChartRevenueTrendPoint = { date: string; amount: string };
type ChartCountTrendPoint = { date: string; count: number };

type ChartsData = {
  revenueTrend: ChartRevenueTrendPoint[];
  appointmentsTrend: ChartCountTrendPoint[];
  topCentersByRevenue: RevenueMetric[];
  topCentersByAppointments: CenterMetric[];
  auditActivityTrend: ChartCountTrendPoint[];
};

const SENSITIVE_AUDIT_ACTIONS = [
  'CENTER_STATUS_CHANGED',
  'PASSWORD_RESET',
  'STAFF_PASSWORD_RESET',
  'STAFF_STATUS_CHANGED',
  'TENANT_STAFF_STATUS_CHANGED',
  'USER_STATUS_CHANGED',
  'center.login_as',
  'LOGIN_AS_CENTER',
];

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(offset = 0) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value ? Number(value) : 0;
}

function money(value: number) {
  return value.toFixed(2);
}

type CenterNameSource = {
  name?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
};

function isCorruptedText(value?: string | null): boolean {
  if (!value || !value.trim()) return false;
  const trimmed = value.trim();
  if (/\?{3,}/.test(trimmed) || /\uFFFD{2,}/.test(trimmed)) return true;
  const questionMarks = (trimmed.match(/\?/g) ?? []).length;
  return questionMarks > 0 && questionMarks / trimmed.length >= 0.35;
}

function unsafeCenterNamesLegacy(name: string): {
  en: string;
  ar: string;
  he: string;
} {
  if (isCorruptedText(name)) {
    return { en: 'This center', ar: 'هذا المركز', he: 'מרכז זה' };
  }
  return { en: name, ar: name, he: name };
}

function firstCleanName(...values: Array<string | null | undefined>) {
  return values.find((value) => value?.trim() && !isCorruptedText(value));
}

function safeCenterNames(center: CenterNameSource | string): {
  ar: string;
  en: string;
  he: string;
  relatedCenterName: string;
} {
  void unsafeCenterNamesLegacy;
  const source = typeof center === 'string' ? { name: center } : center;
  const englishName = firstCleanName(source.nameEn, source.name);
  const arabicName = firstCleanName(source.nameAr, source.nameEn, source.name);
  const hebrewName = firstCleanName(source.nameEn, source.name);

  return {
    ar: arabicName ?? 'هذا المركز',
    en: englishName ?? 'This center',
    he: hebrewName ?? 'מרכז זה',
    relatedCenterName: englishName ?? arabicName ?? 'This center',
  };
}

function noRecentAppointmentsArabic(center: CenterNameSource) {
  const preferredArabicName = center.nameAr ?? center.nameEn ?? center.name;

  if (!preferredArabicName || isCorruptedText(preferredArabicName)) {
    return 'هذا المركز لا يحتوي على مواعيد خلال آخر 7 أيام.';
  }

  return `المركز ${preferredArabicName} لا يحتوي على مواعيد خلال آخر 7 أيام.`;
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Injectable()
export class SuperAdminAnalyticsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getDashboard() {
    const prisma = await this.prismaService.getClient();
    const todayStart = startOfToday();
    const tomorrowStart = addDays(todayStart, 1);
    const sevenDaysAgo = addDays(todayStart, -7);
    const thirtyDaysAgo = addDays(todayStart, -29);
    const recentCenterStart = addDays(todayStart, -30);
    const thisMonthStart = startOfMonth(0);
    const nextMonthStart = startOfMonth(1);
    const previousMonthStart = startOfMonth(-1);

    const [
      centers,
      users,
      appointments,
      billing,
      audit,
      chartTrends,
      subscriptions,
      subscriptionBilling,
      platformUsage,
    ] = await Promise.all([
      this.getCenterStats(prisma, recentCenterStart, sevenDaysAgo),
      this.getUserStats(prisma),
      this.getAppointmentStats(prisma, {
        nextMonthStart,
        previousMonthStart,
        thisMonthStart,
        todayStart,
        tomorrowStart,
      }),
      this.getBillingStats(prisma, {
        nextMonthStart,
        previousMonthStart,
        thisMonthStart,
      }),
      this.getAuditStats(prisma, todayStart),
      this.getChartTrends(prisma, { thirtyDaysAgo, todayStart, tomorrowStart }),
      this.getSubscriptionStats(prisma, todayStart),
      this.getSubscriptionBillingStats(prisma, {
        nextMonthStart,
        thisMonthStart,
        todayStart,
      }),
      this.getPlatformUsageStats(prisma, thirtyDaysAgo),
    ]);

    const charts: ChartsData = {
      revenueTrend: chartTrends.revenueTrend,
      appointmentsTrend: chartTrends.appointmentsTrend,
      auditActivityTrend: chartTrends.auditActivityTrend,
      topCentersByRevenue: billing.revenueByCenter,
      topCentersByAppointments: appointments.appointmentsByCenter,
    };

    const insights = this.buildInsights({
      appointments,
      audit,
      billing,
      centers,
      subscriptions,
      users,
    });

    return {
      appointments,
      audit,
      billing,
      centers,
      charts,
      insights,
      platformUsage,
      subscriptionBilling,
      subscriptions,
      users,
    };
  }

  private async getCenterStats(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    recentCenterStart: Date,
    sevenDaysAgo: Date,
  ) {
    const [
      totalCenters,
      activeCenters,
      recentlyCreatedCenters,
      latestCenters,
      centersWithoutRecentAppointments,
    ] = await Promise.all([
      prisma.center.count(),
      prisma.center.count({ where: { status: 'ACTIVE' } }),
      prisma.center.count({
        where: { createdAt: { gte: recentCenterStart } },
      }),
      prisma.center.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          id: true,
          name: true,
          owner: { select: { email: true, fullName: true } },
          slug: true,
          status: true,
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            select: { planCode: true, planName: true, status: true },
            take: 1,
          },
        },
        take: 5,
      }),
      prisma.center.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
        },
        take: 5,
        where: {
          appointments: {
            none: {
              appointmentDate: { gte: sevenDaysAgo },
            },
          },
        },
      }),
    ]);

    return {
      activeCenters,
      centersWithoutRecentAppointments,
      inactiveCenters: Math.max(totalCenters - activeCenters, 0),
      latestCenters: latestCenters.map((center) => ({
        createdAt: center.createdAt,
        id: center.id,
        name: center.name,
        ownerEmail: center.owner?.email ?? null,
        ownerName: center.owner?.fullName ?? center.owner?.email ?? null,
        plan:
          center.subscriptions[0]?.planName ??
          center.subscriptions[0]?.planCode ??
          null,
        slug: center.slug,
        status: center.status,
      })),
      recentlyCreatedCenters,
      totalCenters,
    };
  }

  private async getUserStats(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
  ) {
    const [totalUsers, activeUsers, superAdminsCount, centerAdminAssignments] =
      await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
        prisma.user.count({
          where: {
            deletedAt: null,
            roles: {
              some: {
                centerId: null,
                status: 'ACTIVE',
                role: { key: 'super_admin', scope: 'PLATFORM' },
              },
            },
          },
        }),
        prisma.userRole.findMany({
          where: {
            centerId: { not: null },
            status: 'ACTIVE',
            user: { deletedAt: null },
            role: {
              key: { in: ['CENTER_OWNER', 'CENTER_MANAGER'] },
              scope: 'CENTER',
            },
          },
          distinct: ['userId'],
          select: { userId: true },
        }),
      ]);

    return {
      activeUsers,
      centerAdminsCount: centerAdminAssignments.length,
      inactiveUsers: Math.max(totalUsers - activeUsers, 0),
      superAdminsCount,
      totalUsers,
    };
  }

  private async getPlatformUsageStats(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    thirtyDaysAgo: Date,
  ) {
    const [
      totalPatients,
      totalAppointments,
      appointmentsLast30Days,
      totalInvoices,
      totalUsers,
      activeCenters,
    ] = await Promise.all([
      prisma.patient.count({ where: { status: { not: 'ARCHIVED' } } }),
      prisma.appointment.count(),
      prisma.appointment.count({
        where: { appointmentDate: { gte: thirtyDaysAgo } },
      }),
      prisma.invoice.count(),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.center.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      activeCenters,
      appointmentsLast30Days,
      totalAppointments,
      totalInvoices,
      totalPatients,
      totalUsers,
    };
  }

  private async getAppointmentStats(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    dates: {
      nextMonthStart: Date;
      previousMonthStart: Date;
      thisMonthStart: Date;
      todayStart: Date;
      tomorrowStart: Date;
    },
  ) {
    const [
      totalAppointments,
      todayAppointments,
      completedAppointments,
      cancelledAppointments,
      pendingAppointments,
      appointmentsThisMonth,
      appointmentsPreviousMonth,
      appointmentsByCenterRaw,
    ] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: dates.todayStart,
            lt: dates.tomorrowStart,
          },
        },
      }),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { status: 'CANCELLED' } }),
      prisma.appointment.count({
        where: {
          status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
        },
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: dates.thisMonthStart,
            lt: dates.nextMonthStart,
          },
        },
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: dates.previousMonthStart,
            lt: dates.thisMonthStart,
          },
        },
      }),
      prisma.appointment.groupBy({
        by: ['centerId'],
        _count: { _all: true },
        orderBy: { _count: { centerId: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      appointmentsByCenter: await this.mapCenterCounts(
        prisma,
        appointmentsByCenterRaw.map((item) => ({
          centerId: item.centerId,
          count: item._count._all,
        })),
      ),
      appointmentsPreviousMonth,
      appointmentsThisMonth,
      cancelledAppointments,
      completedAppointments,
      pendingAppointments,
      todayAppointments,
      totalAppointments,
    };
  }

  private async getBillingStats(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    dates: {
      nextMonthStart: Date;
      previousMonthStart: Date;
      thisMonthStart: Date;
    },
  ) {
    const nonCancelledInvoiceWhere = { status: { not: 'CANCELLED' } } as const;
    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      partialInvoices,
      cancelledInvoices,
      nonCancelledInvoiceAmount,
      nonCancelledPaymentAmount,
      patientCreditAmount,
      revenueThisMonthAmount,
      revenuePreviousMonthAmount,
      revenueByCenterRaw,
    ] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'PAID' } }),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
      prisma.invoice.count({ where: { status: 'PARTIAL' } }),
      prisma.invoice.count({ where: { status: 'CANCELLED' } }),
      prisma.invoice.aggregate({
        where: nonCancelledInvoiceWhere,
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { invoice: nonCancelledInvoiceWhere },
        _sum: { amount: true },
      }),
      prisma.patient.aggregate({
        _sum: { creditBalance: true },
      }),
      prisma.payment.aggregate({
        where: {
          invoice: nonCancelledInvoiceWhere,
          paidAt: { gte: dates.thisMonthStart, lt: dates.nextMonthStart },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          invoice: nonCancelledInvoiceWhere,
          paidAt: { gte: dates.previousMonthStart, lt: dates.thisMonthStart },
        },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ['centerId'],
        where: { invoice: nonCancelledInvoiceWhere },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 10,
      }),
    ]);

    const totalInvoiceAmount = decimalToNumber(
      nonCancelledInvoiceAmount._sum.amount,
    );
    const totalPaidAmount = decimalToNumber(
      nonCancelledPaymentAmount._sum.amount,
    );
    const totalOutstandingAmount = Math.max(
      totalInvoiceAmount - totalPaidAmount,
      0,
    );

    return {
      cancelledInvoices,
      paidInvoices,
      partialInvoices,
      pendingInvoices,
      revenueByCenter: await this.mapCenterRevenue(
        prisma,
        revenueByCenterRaw.map((item) => ({
          amount: decimalToNumber(item._sum.amount),
          centerId: item.centerId,
        })),
      ),
      revenuePreviousMonth: money(
        decimalToNumber(revenuePreviousMonthAmount._sum.amount),
      ),
      revenueThisMonth: money(
        decimalToNumber(revenueThisMonthAmount._sum.amount),
      ),
      totalInvoices,
      totalOutstandingAmount: money(totalOutstandingAmount),
      totalPaidAmount: money(totalPaidAmount),
      totalPatientCredit: money(
        decimalToNumber(patientCreditAmount._sum.creditBalance),
      ),
    };
  }

  private async getSubscriptionBillingStats(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    dates: {
      nextMonthStart: Date;
      thisMonthStart: Date;
      todayStart: Date;
    },
  ) {
    await prisma.subscriptionInvoice.updateMany({
      where: {
        dueDate: { lt: dates.todayStart },
        paidAt: null,
        status: { in: ['DRAFT', 'PENDING'] },
      },
      data: { status: 'OVERDUE' },
    });

    const [
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenueAmount,
      paidThisMonth,
      paidInvoiceRows,
    ] = await Promise.all([
      prisma.subscriptionInvoice.count({ where: { status: 'PAID' } }),
      prisma.subscriptionInvoice.count({ where: { status: 'PENDING' } }),
      prisma.subscriptionInvoice.count({ where: { status: 'OVERDUE' } }),
      prisma.subscriptionInvoice.aggregate({
        where: { status: 'PAID' },
        _sum: { total: true },
      }),
      prisma.subscriptionInvoice.findMany({
        where: {
          paidAt: { gte: dates.thisMonthStart, lt: dates.nextMonthStart },
          status: 'PAID',
        },
        select: {
          total: true,
          subscription: { select: { billingInterval: true } },
        },
      }),
      prisma.subscriptionInvoice.findMany({
        where: { status: 'PAID' },
        select: {
          total: true,
          subscription: { select: { planCode: true, planName: true } },
        },
      }),
    ]);

    const revenueByPlanMap = new Map<
      string,
      { amount: number; planCode: string; planName: string }
    >();

    for (const invoice of paidInvoiceRows) {
      const planCode = invoice.subscription.planCode;
      const planName = invoice.subscription.planName;
      const current = revenueByPlanMap.get(planCode) ?? {
        amount: 0,
        planCode,
        planName,
      };
      current.amount += decimalToNumber(invoice.total);
      revenueByPlanMap.set(planCode, current);
    }

    const mrr = paidThisMonth.reduce((sum, invoice) => {
      if (invoice.subscription.billingInterval === 'YEARLY') {
        return sum + decimalToNumber(invoice.total) / 12;
      }
      return sum + decimalToNumber(invoice.total);
    }, 0);

    return {
      mrr: money(mrr),
      overdueInvoices,
      paidInvoices,
      pendingInvoices,
      revenueByPlan: [...revenueByPlanMap.values()]
        .sort((a, b) => b.amount - a.amount)
        .map((item) => ({
          amount: money(item.amount),
          planCode: item.planCode,
          planName: item.planName,
        })),
      totalSubscriptionRevenue: money(
        decimalToNumber(totalRevenueAmount._sum.total),
      ),
    };
  }

  private async getAuditStats(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    todayStart: Date,
  ) {
    const [
      latestAuditLogs,
      sensitiveActionsCount,
      sensitiveActionsTodayCount,
      mostActiveAdminsRaw,
      recentLoginAsCenterActions,
    ] = await Promise.all([
      this.auditService.list({ page: 1, pageSize: 10 }),
      prisma.auditLog.count({
        where: { action: { in: SENSITIVE_AUDIT_ACTIONS } },
      }),
      prisma.auditLog.count({
        where: {
          action: { in: SENSITIVE_AUDIT_ACTIONS },
          createdAt: { gte: todayStart },
        },
      }),
      prisma.auditLog.groupBy({
        by: ['actorUserId'],
        where: { actorUserId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { actorUserId: 'desc' } },
        take: 5,
      }),
      this.auditService.list({
        action: 'center.login_as',
        page: 1,
        pageSize: 5,
      }),
    ]);

    return {
      latestAuditLogs: latestAuditLogs.data,
      mostActiveAdmins: await this.mapActiveAdmins(
        prisma,
        mostActiveAdminsRaw.map((item) => ({
          actorUserId: item.actorUserId,
          count: item._count._all,
        })),
      ),
      recentLoginAsCenterActions: recentLoginAsCenterActions.data,
      sensitiveActionsCount,
      sensitiveActionsTodayCount,
    };
  }

  private async getSubscriptionStats(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    todayStart: Date,
  ) {
    const [subscriptions, activeCenterRows] = await Promise.all([
      prisma.subscription.findMany({
        orderBy: { currentPeriodEnd: 'asc' },
        select: {
          centerId: true,
          currentPeriodEnd: true,
          gracePeriodEndsAt: true,
          planName: true,
          status: true,
          center: { select: { id: true, name: true, status: true } },
        },
      }),
      prisma.center.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      }),
    ]);

    const counts: Record<NormalizedSubscriptionLifecycle, number> = {
      ACTIVE: 0,
      CANCELLED: 0,
      EXPIRED: 0,
      EXPIRED_GRACE_PERIOD: 0,
      EXPIRING_SOON: 0,
      SUSPENDED: 0,
      TRIALING: 0,
      UNKNOWN: 0,
    };
    const byLifecycle: Record<
      NormalizedSubscriptionLifecycle,
      typeof subscriptions
    > = {
      ACTIVE: [],
      CANCELLED: [],
      EXPIRED: [],
      EXPIRED_GRACE_PERIOD: [],
      EXPIRING_SOON: [],
      SUSPENDED: [],
      TRIALING: [],
      UNKNOWN: [],
    };

    for (const subscription of subscriptions) {
      const lifecycle = normalizeSubscriptionLifecycle(
        subscription,
        todayStart,
      ).normalizedLifecycle;
      counts[lifecycle] += 1;
      byLifecycle[lifecycle].push(subscription);
    }

    const centersExpiringSoon = byLifecycle.EXPIRING_SOON.slice(0, 5);
    const centersExpired = byLifecycle.EXPIRED.slice(0, 5);

    const activeCentersWithActiveSub = new Set(
      byLifecycle.ACTIVE.filter((s) => s.center.status === 'ACTIVE').map((s) => s.centerId),
    ).size;

    const centersAtRisk = this.computeCentersAtRisk(
      activeCenterRows.map((c) => c.id),
      subscriptions,
      todayStart,
    );

    return {
      activeCentersWithActiveSub,
      activeSubscriptions: counts.ACTIVE,
      centersAtRisk,
      centersExpired: centersExpired.map((s) => ({
        centerId: s.centerId,
        centerName: s.center.name,
        currentPeriodEnd: s.currentPeriodEnd,
        planName: s.planName,
      })),
      centersExpiringSoon: centersExpiringSoon.map((s) => ({
        centerId: s.centerId,
        centerName: s.center.name,
        currentPeriodEnd: s.currentPeriodEnd,
        planName: s.planName,
      })),
      centersWithNoNotificationPhone: [],
      cancelledSubscriptions: counts.CANCELLED,
      expiredSubscriptions: counts.EXPIRED,
      expiringSoonSubscriptions: counts.EXPIRING_SOON,
      gracePeriodSubscriptions: counts.EXPIRED_GRACE_PERIOD,
      suspendedSubscriptions: counts.SUSPENDED,
      totalSubscriptions: subscriptions.length,
      trialingSubscriptions: counts.TRIALING,
      unknownSubscriptions: counts.UNKNOWN,
    };
  }

  private computeCentersAtRisk(
    activeCenterIds: string[],
    subscriptions: Array<{
      centerId: string;
      currentPeriodEnd: Date | null;
      gracePeriodEndsAt: Date | null;
      status: string;
      center: { status: string };
    }>,
    todayStart: Date,
  ) {
    const activeCenterIdSet = new Set(activeCenterIds);

    // For each active center, find the latest lifecycle (last write wins when ordered asc)
    const centerLatestLifecycle = new Map<string, NormalizedSubscriptionLifecycle>();
    for (const sub of subscriptions) {
      if (!activeCenterIdSet.has(sub.centerId)) continue;
      const lc = normalizeSubscriptionLifecycle(sub, todayStart).normalizedLifecycle;
      centerLatestLifecycle.set(sub.centerId, lc);
    }

    const centerIdsByReason: {
      NO_SUBSCRIPTION: string[];
      SUBSCRIPTION_EXPIRED: string[];
      SUBSCRIPTION_SUSPENDED: string[];
      SUBSCRIPTION_GRACE_PERIOD: string[];
    } = {
      NO_SUBSCRIPTION: [],
      SUBSCRIPTION_EXPIRED: [],
      SUBSCRIPTION_GRACE_PERIOD: [],
      SUBSCRIPTION_SUSPENDED: [],
    };

    for (const centerId of activeCenterIdSet) {
      const lc = centerLatestLifecycle.get(centerId);
      if (!lc) {
        centerIdsByReason.NO_SUBSCRIPTION.push(centerId);
      } else if (lc === 'EXPIRED') {
        centerIdsByReason.SUBSCRIPTION_EXPIRED.push(centerId);
      } else if (lc === 'SUSPENDED') {
        centerIdsByReason.SUBSCRIPTION_SUSPENDED.push(centerId);
      } else if (lc === 'EXPIRED_GRACE_PERIOD') {
        centerIdsByReason.SUBSCRIPTION_GRACE_PERIOD.push(centerId);
      }
      // ACTIVE, EXPIRING_SOON, TRIALING, CANCELLED, UNKNOWN → not at risk
    }

    const total =
      centerIdsByReason.NO_SUBSCRIPTION.length +
      centerIdsByReason.SUBSCRIPTION_EXPIRED.length +
      centerIdsByReason.SUBSCRIPTION_SUSPENDED.length +
      centerIdsByReason.SUBSCRIPTION_GRACE_PERIOD.length;

    return {
      centerIdsByReason,
      expired: centerIdsByReason.SUBSCRIPTION_EXPIRED.length,
      gracePeriod: centerIdsByReason.SUBSCRIPTION_GRACE_PERIOD.length,
      noSubscription: centerIdsByReason.NO_SUBSCRIPTION.length,
      suspended: centerIdsByReason.SUBSCRIPTION_SUSPENDED.length,
      total,
    };
  }

  async getCentersAtRisk() {
    const prisma = await this.prismaService.getClient();
    const todayStart = startOfToday();

    const [subscriptions, activeCenterRows] = await Promise.all([
      prisma.subscription.findMany({
        orderBy: { currentPeriodEnd: 'asc' },
        select: {
          centerId: true,
          currentPeriodEnd: true,
          gracePeriodEndsAt: true,
          status: true,
          center: { select: { id: true, status: true } },
        },
      }),
      prisma.center.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      }),
    ]);

    return this.computeCentersAtRisk(
      activeCenterRows.map((c) => c.id),
      subscriptions.map((s) => ({ ...s, center: { status: s.center.status } })),
      todayStart,
    );
  }

  private buildInsights(data: {
    appointments: Awaited<
      ReturnType<SuperAdminAnalyticsService['getAppointmentStats']>
    >;
    audit: Awaited<ReturnType<SuperAdminAnalyticsService['getAuditStats']>>;
    billing: Awaited<ReturnType<SuperAdminAnalyticsService['getBillingStats']>>;
    centers: Awaited<ReturnType<SuperAdminAnalyticsService['getCenterStats']>>;
    subscriptions: Awaited<
      ReturnType<SuperAdminAnalyticsService['getSubscriptionStats']>
    >;
    users: Awaited<ReturnType<SuperAdminAnalyticsService['getUserStats']>>;
  }) {
    const alerts: InsightItem[] = [];
    const highlights: InsightItem[] = [];
    const recommendations: InsightItem[] = [];
    const revenueThisMonth = Number(data.billing.revenueThisMonth ?? 0);
    const revenuePreviousMonth = Number(data.billing.revenuePreviousMonth ?? 0);
    const centerWithoutRecentActivity =
      data.centers.centersWithoutRecentAppointments[0];
    const topRevenueCenter = data.billing.revenueByCenter[0];
    const topAppointmentCenter = data.appointments.appointmentsByCenter[0];
    const mostActiveAdmin = data.audit.mostActiveAdmins[0];

    if (data.centers.totalCenters > 0 && data.centers.activeCenters === 0) {
      alerts.push({
        messageAr: 'لا توجد مراكز نشطة على المنصة.',
        messageEn: 'No active centers are currently available on the platform.',
        messageHe: 'אין מרכזים פעילים במערכת כרגע.',
        severity: 'high',
        type: 'NO_ACTIVE_CENTERS',
      });
    }

    if (centerWithoutRecentActivity) {
      const centerNames = safeCenterNames(centerWithoutRecentActivity.name);
      alerts.push({
        messageAr: noRecentAppointmentsArabic({
          name: centerWithoutRecentActivity.name,
        }),
        messageEn: `${centerNames.en} has no appointments in the last 7 days.`,
        messageHe: `${centerNames.he} has no appointments in the last 7 days.`,
        relatedCenterId: centerWithoutRecentActivity.id,
        relatedCenterName: centerNames.relatedCenterName,
        severity: 'medium',
        type: 'CENTER_NO_RECENT_APPOINTMENTS',
      });
    }

    if (centerWithoutRecentActivity && isCorruptedText('__never__')) {
      const centerName = centerWithoutRecentActivity.name;
      const nameCorrupted = isCorruptedText(centerName);
      alerts.push({
        messageAr: nameCorrupted
          ? 'يوجد مركز لا يحتوي على مواعيد خلال آخر 7 أيام.'
          : `المركز ${centerName} لا يحتوي على مواعيد خلال آخر 7 أيام.`,
        messageEn: nameCorrupted
          ? 'There is a center with no appointments in the last 7 days.'
          : `${centerName} has no appointments in the last 7 days.`,
        messageHe: nameCorrupted
          ? 'יש מרכז ללא תורים ב-7 הימים האחרונים.'
          : `למרכז ${centerName} אין תורים ב-7 הימים האחרונים.`,
        relatedCenterId: centerWithoutRecentActivity.id,
        relatedCenterName: centerName,
        severity: 'medium',
        type: 'CENTER_NO_RECENT_APPOINTMENTS',
      });
    }

    if (revenueThisMonth < revenuePreviousMonth) {
      alerts.push({
        messageAr: 'إيراد هذا الشهر أقل من الشهر السابق.',
        messageEn: 'Revenue this month is lower than the previous month.',
        messageHe: 'ההכנסה החודש נמוכה מהחודש הקודם.',
        severity: 'medium',
        type: 'REVENUE_DROP',
      });
    }

    if (data.billing.cancelledInvoices > data.billing.paidInvoices) {
      alerts.push({
        messageAr: 'عدد الفواتير الملغاة أعلى من الفواتير المدفوعة.',
        messageEn: 'Cancelled invoices are higher than paid invoices.',
        messageHe: 'מספר החשבוניות שבוטלו גבוה ממספר החשבוניות ששולמו.',
        severity: 'high',
        type: 'HIGH_INVOICE_CANCELLATIONS',
      });
    }

    if (data.audit.sensitiveActionsTodayCount > 10) {
      alerts.push({
        messageAr: 'تم تسجيل عدد مرتفع من الإجراءات الحساسة اليوم.',
        messageEn: 'A high number of sensitive actions was recorded today.',
        messageHe: 'נרשם היום מספר גבוה של פעולות רגישות.',
        severity: 'high',
        type: 'HIGH_SENSITIVE_ACTIONS',
      });
    }

    if (topRevenueCenter && Number(topRevenueCenter.amount) > 0) {
      const n = safeCenterNames(topRevenueCenter.centerName);
      highlights.push({
        messageAr: `${n.ar} هو أعلى مركز من حيث الإيراد.`,
        messageEn: `${n.en} is the top center by revenue.`,
        messageHe: `${n.he} הוא המרכז המוביל בהכנסות.`,
        relatedCenterId: topRevenueCenter.centerId,
        relatedCenterName: n.relatedCenterName,
        severity: 'low',
        type: 'TOP_CENTER_BY_REVENUE',
      });
    }

    if (topAppointmentCenter && topAppointmentCenter.count > 0) {
      const n = safeCenterNames(topAppointmentCenter.centerName);
      highlights.push({
        messageAr: `${n.ar} هو أعلى مركز من حيث عدد المواعيد.`,
        messageEn: `${n.en} is the top center by appointments.`,
        messageHe: `${n.he} הוא המרכז המוביל במספר התורים.`,
        relatedCenterId: topAppointmentCenter.centerId,
        relatedCenterName: n.relatedCenterName,
        severity: 'low',
        type: 'TOP_CENTER_BY_APPOINTMENTS',
      });
    }

    if (mostActiveAdmin && mostActiveAdmin.count > 0) {
      highlights.push({
        messageAr: `${mostActiveAdmin.actorName} هو المدير الأكثر نشاطا.`,
        messageEn: `${mostActiveAdmin.actorName} is the most active admin.`,
        messageHe: `${mostActiveAdmin.actorName} הוא המנהל הפעיל ביותר.`,
        severity: 'low',
        type: 'MOST_ACTIVE_ADMIN',
      });
    }

    if (revenueThisMonth > revenuePreviousMonth) {
      highlights.push({
        messageAr: 'الإيراد ينمو مقارنة بالشهر السابق.',
        messageEn: 'Revenue is growing compared with the previous month.',
        messageHe: 'ההכנסה צומחת ביחס לחודש הקודם.',
        severity: 'low',
        type: 'REVENUE_GROWTH',
      });
    }

    if (data.centers.inactiveCenters > 0) {
      recommendations.push({
        messageAr: 'راجع المراكز غير النشطة وتأكد من حالة الاشتراك أو التفعيل.',
        messageEn:
          'Review inactive centers and confirm subscription or activation status.',
        messageHe: 'בדוק מרכזים לא פעילים ואמת סטטוס מנוי או הפעלה.',
        severity: 'medium',
        type: 'REVIEW_INACTIVE_CENTERS',
      });
    }

    if (data.billing.cancelledInvoices > 0) {
      recommendations.push({
        messageAr:
          'راجع أسباب إلغاء الفواتير وحدد المراكز ذات معدل الإلغاء المرتفع.',
        messageEn:
          'Review invoice cancellation reasons and identify centers with high cancellation rates.',
        messageHe:
          'בדוק סיבות לביטול חשבוניות ואתר מרכזים עם שיעור ביטולים גבוה.',
        severity: 'medium',
        type: 'REVIEW_CANCELLATION_RATE',
      });
    }

    if (data.users.inactiveUsers > 0) {
      recommendations.push({
        messageAr: 'راجع المستخدمين غير النشطين ونظف الصلاحيات غير المستخدمة.',
        messageEn: 'Review inactive users and clean up unused access.',
        messageHe: 'בדוק משתמשים לא פעילים ונקה הרשאות שאינן בשימוש.',
        severity: 'medium',
        type: 'REVIEW_INACTIVE_USERS',
      });
    }

    if (data.centers.centersWithoutRecentAppointments.length > 0) {
      recommendations.push({
        messageAr: 'راقب المراكز التي لا تحتوي على نشاط مواعيد حديث.',
        messageEn: 'Monitor centers with no recent appointment activity.',
        messageHe: 'עקוב אחר מרכזים ללא פעילות תורים אחרונה.',
        severity: 'medium',
        type: 'MONITOR_INACTIVE_CENTERS',
      });
    }

    const centersWithoutActiveSub = Math.max(
      data.centers.activeCenters - data.subscriptions.activeCentersWithActiveSub,
      0,
    );
    if (centersWithoutActiveSub > 0) {
      recommendations.push({
        messageAr: `يوجد ${centersWithoutActiveSub} ${centersWithoutActiveSub === 1 ? 'مركز مفعّل' : 'مراكز مفعّلة'} بدون اشتراك فعال. يوصى بمراجعتها.`,
        messageEn: `${centersWithoutActiveSub} operational center${centersWithoutActiveSub > 1 ? 's have' : ' has'} no effective subscription. Review recommended.`,
        messageHe: `${centersWithoutActiveSub} מרכז${centersWithoutActiveSub > 1 ? 'ים' : ''} תפעולי${centersWithoutActiveSub > 1 ? 'ים' : ''} ללא מינוי אפקטיבי. מומלץ לבדוק.`,
        severity: 'medium',
        type: 'CENTERS_WITHOUT_ACTIVE_SUBSCRIPTION',
      });
    }

    // Subscription lifecycle insights
    if (data.subscriptions.centersExpiringSoon.length > 0) {
      const first = data.subscriptions.centersExpiringSoon[0];
      const n = safeCenterNames(first.centerName);
      const count = data.subscriptions.centersExpiringSoon.length;
      alerts.push({
        messageAr:
          count > 1
            ? `${count} اشتراكات تنتهي خلال 7 أيام. أول مركز: ${n.ar}.`
            : `اشتراك ${n.ar} ينتهي خلال 7 أيام.`,
        messageEn:
          count > 1
            ? `${count} subscriptions expiring within 7 days. First: ${n.en}.`
            : `${n.en} subscription expires within 7 days.`,
        messageHe:
          count > 1
            ? `${count} מינויים מסתיימים תוך 7 ימים. ראשון: ${n.he}.`
            : `מינוי ${n.he} מסתיים תוך 7 ימים.`,
        relatedCenterId: first.centerId,
        relatedCenterName: n.relatedCenterName,
        severity: 'high',
        type: 'SUBSCRIPTION_EXPIRING_SOON',
      });
    }

    if (data.subscriptions.centersExpired.length > 0) {
      const first = data.subscriptions.centersExpired[0];
      const n = safeCenterNames(first.centerName);
      const count = data.subscriptions.centersExpired.length;
      alerts.push({
        messageAr:
          count > 1
            ? `${count} اشتراكات منتهية الصلاحية. أول مركز: ${n.ar}.`
            : `اشتراك ${n.ar} منتهي الصلاحية.`,
        messageEn:
          count > 1
            ? `${count} expired subscriptions. First: ${n.en}.`
            : `${n.en} subscription has expired.`,
        messageHe:
          count > 1
            ? `${count} מינויים שפג תוקפם. ראשון: ${n.he}.`
            : `תוקף מינוי ${n.he} פג.`,
        relatedCenterId: first.centerId,
        relatedCenterName: n.relatedCenterName,
        severity: 'high',
        type: 'SUBSCRIPTION_EXPIRED',
      });
    }

    if (data.subscriptions.centersWithNoNotificationPhone.length > 0) {
      recommendations.push({
        messageAr:
          'بعض المراكز النشطة لا تمتلك رقم هاتف للإشعارات. أضف رقماً للتواصل عند انتهاء الاشتراك.',
        messageEn:
          'Some active centers are missing a notification phone. Add one to ensure renewal contact.',
        messageHe:
          'מרכזים פעילים מסוימים חסרים מספר טלפון להתראות. הוסף אחד לצורך יצירת קשר לחידוש.',
        severity: 'medium',
        type: 'MISSING_NOTIFICATION_PHONE',
      });
    }

    return {
      alerts,
      highlights,
      recommendations,
    };
  }

  private async mapCenterCounts(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    rows: Array<{ centerId: string; count: number }>,
  ): Promise<CenterMetric[]> {
    const centersById = await this.getCentersById(
      prisma,
      rows.map((row) => row.centerId),
    );

    return rows.map((row) => ({
      centerId: row.centerId,
      centerName: centersById.get(row.centerId)?.name ?? 'Unknown center',
      count: row.count,
    }));
  }

  private async mapCenterRevenue(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    rows: Array<{ centerId: string; amount: number }>,
  ): Promise<RevenueMetric[]> {
    const centersById = await this.getCentersById(
      prisma,
      rows.map((row) => row.centerId),
    );

    return rows.map((row) => ({
      amount: money(row.amount),
      centerId: row.centerId,
      centerName: centersById.get(row.centerId)?.name ?? 'Unknown center',
    }));
  }

  private async getCentersById(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    centerIds: string[],
  ) {
    const uniqueIds = [...new Set(centerIds)];

    if (uniqueIds.length === 0) {
      return new Map<string, { name: string }>();
    }

    const centers = await prisma.center.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, name: true },
    });

    return new Map(centers.map((center) => [center.id, { name: center.name }]));
  }

  private async mapActiveAdmins(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    rows: Array<{ actorUserId: string | null; count: number }>,
  ) {
    const actorIds = rows
      .map((row) => row.actorUserId)
      .filter((id): id is string => Boolean(id));

    if (actorIds.length === 0) {
      return [];
    }

    const users = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { email: true, fullName: true, id: true },
    });
    const usersById = new Map(users.map((user) => [user.id, user]));

    return rows
      .filter((row): row is { actorUserId: string; count: number } =>
        Boolean(row.actorUserId),
      )
      .map((row) => {
        const user = usersById.get(row.actorUserId);

        return {
          actorEmail: user?.email ?? null,
          actorName: user?.fullName ?? user?.email ?? 'Unknown admin',
          actorUserId: row.actorUserId,
          count: row.count,
        };
      });
  }

  private async getChartTrends(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    dates: { thirtyDaysAgo: Date; todayStart: Date; tomorrowStart: Date },
  ) {
    const { thirtyDaysAgo, todayStart, tomorrowStart } = dates;
    const dayRange = this.buildDayRange(thirtyDaysAgo, todayStart);

    const [payments, appointments, auditLogs] = await Promise.all([
      prisma.payment.findMany({
        where: {
          invoice: { status: { not: 'CANCELLED' } },
          paidAt: { gte: thirtyDaysAgo, lt: tomorrowStart },
        },
        select: { paidAt: true, amount: true },
      }),
      prisma.appointment.findMany({
        where: {
          appointmentDate: { gte: thirtyDaysAgo, lt: tomorrowStart },
        },
        select: { appointmentDate: true },
      }),
      prisma.auditLog.findMany({
        where: { createdAt: { gte: thirtyDaysAgo, lt: tomorrowStart } },
        select: { createdAt: true },
      }),
    ]);

    return {
      revenueTrend: this.buildRevenueTrend(dayRange, payments),
      appointmentsTrend: this.buildCountTrend(
        dayRange,
        appointments.map((a) => a.appointmentDate),
      ),
      auditActivityTrend: this.buildCountTrend(
        dayRange,
        auditLogs.map((l) => l.createdAt),
      ),
    };
  }

  private buildDayRange(from: Date, to: Date): string[] {
    const days: string[] = [];
    const current = new Date(from);
    while (current <= to) {
      days.push(toLocalDateStr(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  private buildRevenueTrend(
    dayRange: string[],
    payments: Array<{ paidAt: Date | null; amount: Prisma.Decimal | null }>,
  ): ChartRevenueTrendPoint[] {
    const map = new Map<string, number>();
    for (const p of payments) {
      if (!p.paidAt) continue;
      const dateStr = toLocalDateStr(p.paidAt);
      map.set(dateStr, (map.get(dateStr) ?? 0) + decimalToNumber(p.amount));
    }
    return dayRange.map((date) => ({
      date,
      amount: money(map.get(date) ?? 0),
    }));
  }

  private buildCountTrend(
    dayRange: string[],
    dates: Array<Date | null>,
  ): ChartCountTrendPoint[] {
    const map = new Map<string, number>();
    for (const d of dates) {
      if (!d) continue;
      const dateStr = toLocalDateStr(d);
      map.set(dateStr, (map.get(dateStr) ?? 0) + 1);
    }
    return dayRange.map((date) => ({ date, count: map.get(date) ?? 0 }));
  }
}
