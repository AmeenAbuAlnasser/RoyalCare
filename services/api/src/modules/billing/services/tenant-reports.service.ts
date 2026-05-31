import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { hasTenantPermission } from '../../../common/permissions/tenant-permissions';

interface ReportFilters {
  period?: string;
  from?: string;
  to?: string;
}

type MoneyByKey = Map<string, number>;

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function endOfUtcDay(date: Date) {
  const end = startOfUtcDay(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDateRange(filters: ReportFilters): { start: Date; end: Date } {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const todayEnd = endOfUtcDay(now);

  if (filters.period === 'custom' && filters.from && filters.to) {
    const from = filters.from.slice(0, 10);
    const to = filters.to.slice(0, 10);
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T23:59:59.999Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { start: todayStart, end: todayEnd };
    }
    if (start <= end) return { start, end };
    return { start: startOfUtcDay(end), end: endOfUtcDay(start) };
  }

  if (filters.period === 'last7days' || filters.period === 'week') {
    const start = new Date(todayStart);
    start.setUTCDate(todayStart.getUTCDate() - 6);
    return { start, end: todayEnd };
  }

  if (filters.period === 'month') {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );
    return { start, end };
  }

  return { start: todayStart, end: todayEnd };
}

function addMoney(map: MoneyByKey, key: string, amount: unknown) {
  map.set(key, (map.get(key) ?? 0) + Number(amount ?? 0));
}

function decimalString(value: number) {
  return value.toFixed(2);
}

function emptyRevenueDays(start: Date, end: Date) {
  const days = new Map<string, number>();
  const cursor = startOfUtcDay(start);
  const last = startOfUtcDay(end);

  while (cursor <= last) {
    days.set(formatDateKey(cursor), 0);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

@Injectable()
export class TenantReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFinancial(
    centerId: string,
    permissions: string[],
    filters: ReportFilters = {},
  ) {
    this.requirePermission(permissions, 'reports:view');

    if (!centerId) {
      throw new BadRequestException('centerId is required');
    }

    const prisma = await this.prisma.getClient();
    const { start, end } = buildDateRange(filters);
    const todayRange = buildDateRange({ period: 'today' });
    const todayStart = todayRange.start;
    const nonCancelledInvoiceWhere = {
      centerId,
      status: { not: 'CANCELLED' as const },
    };

    try {
      const [invoices, patientCreditAgg, currencyResult] = await Promise.all([
        prisma.invoice.findMany({
          where: {
            ...nonCancelledInvoiceWhere,
            createdAt: { gte: start, lte: end },
          },
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
            serviceId: true,
            customServiceName: true,
            service: {
              select: {
                nameAr: true,
                nameEn: true,
                nameHe: true,
              },
            },
          },
        }),
        prisma.patient.aggregate({
          where: { centerId },
          _sum: { creditBalance: true },
        }),
        prisma.invoice.findFirst({
          where: { centerId },
          select: { currency: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const invoiceIds = invoices.map((invoice) => invoice.id);
      const [periodPayments, periodCreditUses] = await Promise.all([
        prisma.payment.findMany({
          where: {
            centerId,
            invoiceId: { in: invoiceIds },
            paidAt: { gte: start, lte: end },
          },
          select: {
            amount: true,
            invoiceId: true,
            paidAt: true,
            patientId: true,
            invoice: {
              select: {
                serviceId: true,
                customServiceName: true,
                service: {
                  select: {
                    nameAr: true,
                    nameEn: true,
                    nameHe: true,
                  },
                },
              },
            },
          },
        }),
        prisma.creditTransaction.findMany({
          where: {
            centerId,
            type: 'CREDIT_USE',
            relatedInvoiceId: { in: invoiceIds },
            createdAt: { gte: start, lte: end },
          },
          select: {
            amount: true,
            createdAt: true,
            patientId: true,
            relatedInvoiceId: true,
            relatedInvoice: {
              select: {
                serviceId: true,
                customServiceName: true,
                service: {
                  select: {
                    nameAr: true,
                    nameEn: true,
                    nameHe: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      const paidInvoices = invoices.filter(
        (invoice) => invoice.status === 'PAID',
      );
      const unpaidInvoices = invoices.filter(
        (invoice) =>
          invoice.status === 'PENDING' || invoice.status === 'PARTIAL',
      );
      const overdueInvoices = unpaidInvoices.filter(
        (invoice) => invoice.createdAt < todayStart,
      );
      const pendingInvoices = unpaidInvoices.filter(
        (invoice) => invoice.createdAt >= todayStart,
      );
      const invoiceStatusById = new Map(
        invoices.map((invoice) => [invoice.id, invoice.status]),
      );
      const overdueInvoiceIds = new Set(
        overdueInvoices.map((invoice) => invoice.id),
      );

      const revenueByDay = emptyRevenueDays(start, end);
      const revenueByStatus = new Map<string, number>([
        ['PAID', 0],
        ['PENDING', 0],
        ['PARTIAL', 0],
        ['OVERDUE', 0],
      ]);
      const revenueByService = new Map<
        string,
        {
          serviceId: string;
          serviceNameAr: string;
          serviceNameEn: string;
          serviceNameHe: string;
          amount: number;
        }
      >();
      const revenueByPatient = new Map<string, number>();
      let periodRevenue = 0;

      for (const payment of periodPayments) {
        const amount = Number(payment.amount ?? 0);
        periodRevenue += amount;
        addMoney(revenueByDay, formatDateKey(payment.paidAt), payment.amount);
        addMoney(revenueByPatient, payment.patientId, payment.amount);
        addMoney(
          revenueByStatus,
          overdueInvoiceIds.has(payment.invoiceId)
            ? 'OVERDUE'
            : (invoiceStatusById.get(payment.invoiceId) ?? 'PENDING'),
          payment.amount,
        );
        const service = payment.invoice.service;
        const serviceId =
          payment.invoice.serviceId ??
          `custom:${payment.invoice.customServiceName ?? 'service'}`;
        const serviceName =
          payment.invoice.customServiceName ?? 'Custom service';
        const current = revenueByService.get(serviceId) ?? {
          serviceId,
          serviceNameAr: service?.nameAr ?? serviceName,
          serviceNameEn: service?.nameEn ?? serviceName,
          serviceNameHe: service?.nameHe ?? serviceName,
          amount: 0,
        };
        current.amount += Number(payment.amount ?? 0);
        revenueByService.set(serviceId, current);
      }

      for (const credit of periodCreditUses) {
        const amount = Number(credit.amount ?? 0);
        periodRevenue += amount;
        addMoney(revenueByDay, formatDateKey(credit.createdAt), credit.amount);
        addMoney(revenueByPatient, credit.patientId, credit.amount);
        if (credit.relatedInvoiceId) {
          addMoney(
            revenueByStatus,
            overdueInvoiceIds.has(credit.relatedInvoiceId)
              ? 'OVERDUE'
              : (invoiceStatusById.get(credit.relatedInvoiceId) ?? 'PENDING'),
            credit.amount,
          );
        }
        if (credit.relatedInvoice) {
          const service = credit.relatedInvoice.service;
          const serviceId =
            credit.relatedInvoice.serviceId ??
            `custom:${credit.relatedInvoice.customServiceName ?? 'service'}`;
          const serviceName =
            credit.relatedInvoice.customServiceName ?? 'Custom service';
          const current = revenueByService.get(serviceId) ?? {
            serviceId,
            serviceNameAr: service?.nameAr ?? serviceName,
            serviceNameEn: service?.nameEn ?? serviceName,
            serviceNameHe: service?.nameHe ?? serviceName,
            amount: 0,
          };
          current.amount += Number(credit.amount ?? 0);
          revenueByService.set(serviceId, current);
        }
      }

      const patientIds = [...revenueByPatient.keys()];
      const [patients, appointmentsByPatient] = await Promise.all([
        patientIds.length
          ? prisma.patient.findMany({
              where: { centerId, id: { in: patientIds } },
              select: { id: true, fullName: true, creditBalance: true },
            })
          : [],
        patientIds.length
          ? prisma.appointment.groupBy({
              by: ['patientId'],
              where: {
                centerId,
                patientId: { in: patientIds },
                appointmentDate: { gte: start, lte: end },
                status: { not: 'CANCELLED' },
              },
              _count: { id: true },
            })
          : [],
      ]);

      const visitsByPatient = new Map<string, number>();
      for (const row of appointmentsByPatient) {
        visitsByPatient.set(row.patientId, row._count.id);
      }

      const patientMap = new Map<
        string,
        { id: string; fullName: string; creditBalance: unknown }
      >();
      for (const patient of patients) {
        patientMap.set(patient.id, patient);
      }

      return {
        cards: {
          periodRevenue: decimalString(periodRevenue),
          revenueToday: decimalString(periodRevenue),
          revenueThisMonth: decimalString(periodRevenue),
          paidInvoices: paidInvoices.length,
          pendingInvoices: pendingInvoices.length,
          overdueInvoices: overdueInvoices.length,
          totalPatientCredit: decimalString(
            Number(patientCreditAgg._sum.creditBalance ?? 0),
          ),
          averageInvoiceValue: decimalString(
            invoices.length > 0 ? periodRevenue / invoices.length : 0,
          ),
        },
        charts: {
          revenueByDay: [...revenueByDay.entries()].map(([date, amount]) => ({
            date,
            amount: decimalString(amount),
          })),
          revenueByPaymentStatus: [...revenueByStatus.entries()].map(
            ([status, amount]) => ({
              status,
              amount: decimalString(amount),
            }),
          ),
          revenueByService: [...revenueByService.values()]
            .sort((a, b) => b.amount - a.amount)
            .map((row) => ({
              serviceId: row.serviceId,
              serviceNameAr: row.serviceNameAr,
              serviceNameEn: row.serviceNameEn,
              serviceNameHe: row.serviceNameHe,
              amount: decimalString(row.amount),
            })),
          topPatientsBySpending: [...revenueByPatient.entries()]
            .map(([patientId, amount]) => ({ patientId, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10)
            .map((row, index) => {
              const patient = patientMap.get(row.patientId);
              return {
                rank: index + 1,
                patientId: row.patientId,
                name: patient?.fullName ?? '',
                totalPaid: decimalString(row.amount),
                totalVisits: visitsByPatient.get(row.patientId) ?? 0,
                currentCredit: decimalString(
                  Number(patient?.creditBalance ?? 0),
                ),
              };
            })
            .filter((row) => row.name),
        },
        currency: currencyResult?.currency ?? 'ILS',
        periodStart: formatDateKey(start),
        periodEnd: formatDateKey(end),
      };
    } catch (error) {
      console.error(
        '[TenantReportsService.getFinancial] centerId=%s error:',
        centerId,
        error,
      );
      throw error;
    }
  }

  async getSummary(
    centerId: string,
    permissions: string[],
    filters: ReportFilters = {},
  ) {
    const financial = await this.getFinancial(centerId, permissions, filters);
    const totalPaid = financial.charts.revenueByDay.reduce(
      (sum, row) => sum + Number(row.amount),
      0,
    );

    return {
      todayRevenue: financial.cards.revenueToday,
      totalPaid: decimalString(totalPaid),
      outstanding: financial.charts.revenueByPaymentStatus
        .filter((row) => row.status !== 'PAID')
        .reduce((sum, row) => sum + Number(row.amount), 0)
        .toFixed(2),
      patientCredit: financial.cards.totalPatientCredit,
      cancelledInvoicesCount: 0,
      appointmentsTodayCount: 0,
      currency: financial.currency,
      periodStart: financial.periodStart,
      periodEnd: financial.periodEnd,
    };
  }

  async getTopPatients(
    centerId: string,
    permissions: string[],
    filters: ReportFilters = {},
    limit = 10,
  ) {
    const financial = await this.getFinancial(centerId, permissions, filters);
    return {
      patients: financial.charts.topPatientsBySpending.slice(0, limit),
      currency: financial.currency,
      periodStart: financial.periodStart,
      periodEnd: financial.periodEnd,
    };
  }

  private requirePermission(permissions: string[], permission: 'reports:view') {
    if (!hasTenantPermission(permissions, permission)) {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: { permission: `Missing permission: ${permission}` },
      });
    }
  }
}
