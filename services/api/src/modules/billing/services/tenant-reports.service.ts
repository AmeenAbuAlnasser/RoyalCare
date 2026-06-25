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
  openOnly?: string;
  overdueOnly?: string;
  to?: string;
  allUnbilled?: string;
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

function paymentStatusFor(
  totalAmount: number,
  paidAmount: number,
  remainingAmount: number,
  dueDate: Date,
  todayStart: Date,
  invoiceStatus?: string,
) {
  if (remainingAmount <= 0 || paidAmount >= totalAmount) return 'PAID';
  if (dueDate < todayStart) return 'OVERDUE';
  if (invoiceStatus === 'PARTIAL') return 'PARTIAL';
  if (paidAmount > 0) return 'PARTIAL';
  return 'PENDING';
}

function isTrue(value: string | undefined) {
  return value === 'true' || value === '1';
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
    const invoiceReportSelect = {
      id: true,
      invoiceNumber: true,
      amount: true,
      currency: true,
      status: true,
      createdAt: true,
      serviceId: true,
      customServiceName: true,
      patient: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
      service: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          nameHe: true,
        },
      },
      payments: {
        select: { amount: true, paidAt: true },
        orderBy: { paidAt: 'desc' as const },
      },
      creditTransactions: {
        where: { type: 'CREDIT_USE' as const },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'desc' as const },
      },
    } as const;

    try {
      // Invoice-scope metrics use invoice.createdAt so date filters answer:
      // "which invoices were issued in this period?" Revenue is handled below
      // from actual collection dates instead of invoice creation dates.
      // Open receivables are intentionally queried without the selected date
      // range: an unpaid balance remains collectible until it is fully paid.
      const [
        periodInvoices,
        allCenterInvoices,
        patientCreditAgg,
        currencyResult,
      ] = await Promise.all([
        prisma.invoice.findMany({
          where: {
            ...nonCancelledInvoiceWhere,
            createdAt: { gte: start, lte: end },
          },
          select: invoiceReportSelect,
        }),
        prisma.invoice.findMany({
          where: { centerId },
          select: invoiceReportSelect,
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

      // Revenue metrics use paidAt for payments and createdAt for credit usage
      // because they represent money/credit collected during the selected range,
      // even when the related invoice was issued earlier.
      // orphanPaidInvoices captures invoices marked PAID via status update only
      // (no Payment rows and no credit-use rows) — updatedAt is the effective
      // collection date in that case.
      const [periodPayments, periodCreditUses, orphanPaidInvoices] = await Promise.all([
        prisma.payment.findMany({
          where: {
            centerId,
            paidAt: { gte: start, lte: end },
            invoice: { status: { not: 'CANCELLED' } },
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
                status: true,
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
            createdAt: { gte: start, lte: end },
            relatedInvoice: { status: { not: 'CANCELLED' } },
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
                status: true,
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
        // Invoices marked PAID directly (no Payment rows, no credit-use rows).
        // These are collected within the period based on updatedAt.
        prisma.invoice.findMany({
          where: {
            centerId,
            status: 'PAID',
            updatedAt: { gte: start, lte: end },
            payments: { none: {} },
            creditTransactions: { none: { type: 'CREDIT_USE' } },
          },
          select: {
            id: true,
            amount: true,
            updatedAt: true,
            serviceId: true,
            customServiceName: true,
            patientId: true,
            service: {
              select: { nameAr: true, nameEn: true, nameHe: true },
            },
          },
        }),
      ]);

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
          payment.invoice.status ?? 'PENDING',
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
        if (credit.relatedInvoice) {
          addMoney(
            revenueByStatus,
            credit.relatedInvoice.status ?? 'PENDING',
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

      // Fold orphan-paid invoices into revenue maps (effective date = updatedAt)
      for (const invoice of orphanPaidInvoices) {
        const amount = Number(invoice.amount ?? 0);
        periodRevenue += amount;
        addMoney(revenueByDay, formatDateKey(invoice.updatedAt), invoice.amount);
        addMoney(revenueByPatient, invoice.patientId, invoice.amount);
        addMoney(revenueByStatus, 'PAID', invoice.amount);
        const svc = invoice.service;
        const serviceId =
          invoice.serviceId ?? `custom:${invoice.customServiceName ?? 'service'}`;
        const fallbackName = invoice.customServiceName ?? svc?.nameAr ?? 'Custom service';
        const current = revenueByService.get(serviceId) ?? {
          serviceId,
          serviceNameAr: svc?.nameAr ?? fallbackName,
          serviceNameEn: svc?.nameEn ?? fallbackName,
          serviceNameHe: svc?.nameHe ?? fallbackName,
          amount: 0,
        };
        current.amount += amount;
        revenueByService.set(serviceId, current);
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

      const mapInvoiceDetails = (invoice: (typeof periodInvoices)[number]) => {
        const invoiceTotal = Number(invoice.amount ?? 0);
        const paidFromPayments = invoice.payments.reduce(
          (sum, payment) => sum + Number(payment.amount ?? 0),
          0,
        );
        const paidFromCredit = invoice.creditTransactions.reduce(
          (sum, transaction) => sum + Number(transaction.amount ?? 0),
          0,
        );
        const rawPaidAmount = paidFromPayments + paidFromCredit;
        // Orphan-PAID: invoice marked PAID via direct status update with no
        // payment/credit records. Treat the full invoice amount as collected.
        const paidAmount =
          invoice.status === 'PAID' && rawPaidAmount === 0
            ? invoiceTotal
            : rawPaidAmount;
        const remainingAmount = Math.max(0, invoiceTotal - paidAmount);
        // Invoice has no dedicated dueDate yet; createdAt is the consistent
        // due-date fallback for receivables and overdue calculations.
        const dueDate = invoice.createdAt;
        const paymentStatus = paymentStatusFor(
          invoiceTotal,
          paidAmount,
          remainingAmount,
          dueDate,
          todayStart,
          invoice.status,
        );
        const isPaid = remainingAmount <= 0 || invoice.status === 'PAID';
        const isPartial =
          remainingAmount > 0 && (paidAmount > 0 || invoice.status === 'PARTIAL');
        const isUnpaid =
          remainingAmount > 0 && paidAmount <= 0 && invoice.status !== 'PARTIAL';
        const isOverdue = remainingAmount > 0 && dueDate < todayStart;
        const serviceName =
          invoice.customServiceName ??
          invoice.service?.nameAr ??
          invoice.service?.nameEn ??
          invoice.service?.nameHe ??
          '';
        const serviceNameAr = invoice.service?.nameAr ?? invoice.customServiceName ?? serviceName;
        const serviceNameEn = invoice.service?.nameEn ?? invoice.customServiceName ?? serviceName;
        const serviceNameHe = invoice.service?.nameHe ?? invoice.customServiceName ?? serviceName;
        const lastPaymentDate =
          invoice.payments[0]?.paidAt ??
          invoice.creditTransactions[0]?.createdAt ??
          null;

        return {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          patientId: invoice.patient.id,
          patientName: invoice.patient.fullName,
          patientPhone: invoice.patient.phone,
          serviceId:
            invoice.serviceId ?? `custom:${invoice.customServiceName ?? invoice.id}`,
          serviceName,
          serviceNameAr,
          serviceNameEn,
          serviceNameHe,
          totalAmount: decimalString(invoiceTotal),
          paidAmount: decimalString(paidAmount),
          remainingAmount: decimalString(remainingAmount),
          paymentStatus,
          rawPaymentStatus: invoice.status,
          computedRemaining: decimalString(remainingAmount),
          lastPaymentDate: lastPaymentDate ? formatDateKey(lastPaymentDate) : null,
          dueDate: formatDateKey(dueDate),
          createdAt: formatDateKey(invoice.createdAt),
          paidAt: lastPaymentDate ? formatDateKey(lastPaymentDate) : null,
          isPaid,
          isPartial,
          isUnpaid,
          isOverdue,
        };
      };

      const computedInvoiceDetails = periodInvoices
        .map((invoice) => {
          return mapInvoiceDetails(invoice);
        });

      // Rebuild all revenue maps from the period-invoice scope so that
      // periodRevenue, revenueByStatus, and revenueByService are consistent
      // with paidInvoicesCount / partiallyPaidInvoicesCount (which also use
      // the period-invoice scope).  The payment-loop values computed above are
      // discarded here because they use paidAt (payment date) which can fall
      // outside the selected period even for invoices created in it.
      periodRevenue = 0;
      revenueByStatus.set('PAID', 0);
      revenueByStatus.set('PARTIAL', 0);
      revenueByStatus.set('PENDING', 0);
      revenueByStatus.set('OVERDUE', 0);
      revenueByService.clear();
      for (const key of revenueByDay.keys()) {
        revenueByDay.set(key, 0);
      }

      for (const row of computedInvoiceDetails) {
        const paid = Number(row.paidAmount);
        periodRevenue += paid;

        if (row.isPaid) {
          addMoney(revenueByStatus, 'PAID', row.paidAmount);
        } else if (row.isPartial) {
          addMoney(revenueByStatus, 'PARTIAL', row.paidAmount);
        } else if (row.isOverdue) {
          addMoney(revenueByStatus, 'OVERDUE', row.remainingAmount);
        } else {
          addMoney(revenueByStatus, 'PENDING', row.totalAmount);
        }

        if (paid > 0) {
          // Use invoice createdAt for the day key — it is always within the
          // selected range, unlike payment.paidAt which may be a different day.
          addMoney(revenueByDay, row.createdAt, row.paidAmount);

          const svcCurrent = revenueByService.get(row.serviceId) ?? {
            serviceId: row.serviceId,
            serviceNameAr: row.serviceNameAr,
            serviceNameEn: row.serviceNameEn,
            serviceNameHe: row.serviceNameHe,
            amount: 0,
          };
          svcCurrent.amount += paid;
          revenueByService.set(row.serviceId, svcCurrent);
        }
      }

      const debugInvoices = allCenterInvoices
        .map((invoice) => mapInvoiceDetails(invoice))
        .map((row) => ({
          id: row.invoiceId,
          patientId: row.patientId,
          patientName: row.patientName,
          totalAmount: row.totalAmount,
          paidAmount: row.paidAmount,
          remainingAmount: row.remainingAmount,
          computedRemaining: row.computedRemaining,
          paymentStatus: row.paymentStatus,
          status: row.rawPaymentStatus,
          createdAt: row.createdAt,
          dueDate: row.dueDate,
          paidAt: row.paidAt,
        }));
      const openReceivableDetails = allCenterInvoices
        .map((invoice) => mapInvoiceDetails(invoice))
        .filter(
          // Exclude terminal statuses: CANCELLED/VOID = explicitly voided,
          // PAID = invoice settled (even if payment records are missing due to
          // data inconsistency — DB status is authoritative for closed invoices).
          (row) => !['CANCELLED', 'VOID', 'PAID'].includes(String(row.rawPaymentStatus)),
        )
        .filter((row) => Number(row.remainingAmount) > 0);

      console.info('[TenantReportsService.getFinancial] centerId=%s', centerId);
      console.table(debugInvoices);

      const filteredReceivableDetails = openReceivableDetails.filter((row) => {
        if (isTrue(filters.overdueOnly) && !row.isOverdue) {
          return false;
        }
        return true;
      });
      const paidInvoicesCount = computedInvoiceDetails.filter(
        (row) => row.isPaid,
      ).length;

      console.log('[reports] financialReportDebug', {
        rangeStart: formatDateKey(start),
        rangeEnd: formatDateKey(end),
        paidInvoicesFound: paidInvoicesCount,
        paymentsFound: periodPayments.length,
        orphanPaidInvoicesFound: orphanPaidInvoices.length,
        revenueSum: decimalString(periodRevenue),
        samplePaidInvoices: orphanPaidInvoices.slice(0, 3).map((i) => ({
          id: i.id,
          amount: i.amount,
          updatedAt: i.updatedAt,
        })),
      });

      const unpaidInvoicesCount = filteredReceivableDetails.filter(
        (row) => row.isUnpaid,
      ).length;
      const partiallyPaidInvoicesCount = computedInvoiceDetails.filter(
        (row) => row.isPartial,
      ).length;
      const overdueInvoicesCount = filteredReceivableDetails.filter(
        (row) => row.isOverdue,
      ).length;

      const partialInvoicesDebug = computedInvoiceDetails.filter((r) => r.isPartial);
      if (partialInvoicesDebug.length > 0) {
        console.log('[reports] partialInvoicesDebug', {
          count: partialInvoicesDebug.length,
          invoices: partialInvoicesDebug.map((r) => ({
            invoiceId: r.invoiceId,
            totalAmount: r.totalAmount,
            paidAmount: r.paidAmount,
            remainingAmount: r.remainingAmount,
            createdAt: r.createdAt,
          })),
          revenueByStatusPARTIAL: decimalString(revenueByStatus.get('PARTIAL') ?? 0),
        });
      }
      const receivablesByStatus = new Map<string, number>([
        ['PAID', 0],
        ['PARTIAL', 0],
        ['PENDING', 0],
        ['OVERDUE', 0],
      ]);
      const debtByPatient = new Map<
        string,
        { patientId: string; patientName: string; patientPhone: string; amount: number }
      >();

      for (const row of filteredReceivableDetails) {
        addMoney(receivablesByStatus, row.paymentStatus, row.remainingAmount);
        const remaining = Number(row.remainingAmount);
        if (remaining > 0) {
          const current = debtByPatient.get(row.patientId) ?? {
            patientId: row.patientId,
            patientName: row.patientName,
            patientPhone: row.patientPhone,
            amount: 0,
          };
          current.amount += remaining;
          debtByPatient.set(row.patientId, current);
        }
      }

      const topPatientsByDebt = [...debtByPatient.values()]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)
        .map((row, index) => ({
          rank: index + 1,
          patientId: row.patientId,
          patientName: row.patientName,
          patientPhone: row.patientPhone,
          remainingAmount: decimalString(row.amount),
        }));

      const totalReceivables = filteredReceivableDetails.reduce(
        (sum, row) => sum + Number(row.remainingAmount),
        0,
      );
      const highestDebt = topPatientsByDebt[0]?.remainingAmount ?? '0.00';
      const invoiceCountIncluded = computedInvoiceDetails.length;

      // ── Operational + appointment metrics ────────────────────────────────────
      const nowDate = new Date();
      const monthStart = new Date(
        Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), 1),
      );
      const monthEnd = new Date(
        Date.UTC(
          nowDate.getUTCFullYear(),
          nowDate.getUTCMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        ),
      );

      const [
        todayApptGrouped,
        delayedFollowUpsCount,
        newPatientsThisMonthCount,
        activePlansCount,
        periodApptGrouped,
        rawTopProviders,
        completedWithoutInvoiceRows,
      ] = await Promise.all([
        prisma.appointment.groupBy({
          by: ['status'],
          where: {
            centerId,
            appointmentDate: { gte: todayRange.start, lte: todayRange.end },
          },
          _count: { id: true },
        }),
        prisma.patientFollowUp.count({
          where: {
            centerId,
            status: { notIn: ['COMPLETED', 'CANCELLED', 'MISSED'] },
            dueDate: { lt: todayRange.start },
          },
        }),
        prisma.patient.count({
          where: {
            centerId,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        }),
        prisma.patientFollowUp.count({
          where: {
            centerId,
            status: { in: ['UPCOMING', 'DUE', 'CONTACTED', 'BOOKED'] },
          },
        }),
        prisma.appointment.groupBy({
          by: ['status'],
          where: {
            centerId,
            appointmentDate: { gte: start, lte: end },
          },
          _count: { id: true },
        }),
        prisma.appointment.groupBy({
          by: ['staffUserId'],
          where: {
            centerId,
            appointmentDate: { gte: start, lte: end },
            status: { not: 'CANCELLED' },
          },
          _count: { id: true },
        }),
        // Completed appointments that have no linked invoice.
        // When allUnbilled=true, the date range is ignored so the full
        // operational backlog is visible regardless of the selected period.
        prisma.appointment.findMany({
          where: {
            centerId,
            status: 'COMPLETED',
            ...(isTrue(filters.allUnbilled)
              ? {}
              : { appointmentDate: { gte: start, lte: end } }),
            invoices: { none: {} },
          },
          select: {
            id: true,
            appointmentDate: true,
            startTime: true,
            endTime: true,
            customServiceName: true,
            patient: { select: { id: true, fullName: true, phone: true } },
            service: {
              select: { id: true, nameAr: true, nameEn: true, nameHe: true },
            },
            staffUser: { select: { id: true, fullName: true } },
          },
          orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
        }),
      ]);

      // Diagnostic log — helps verify the unbilled query is correct at runtime
      console.log('[reports] unbilled-completed', {
        centerId,
        rangeStart: formatDateKey(start),
        rangeEnd: formatDateKey(end),
        completedAppointmentsInRange: periodApptGrouped
          .filter((r) => r.status === 'COMPLETED')
          .reduce((s, r) => s + (r._count as { id: number }).id, 0),
        completedWithoutInvoiceCount: completedWithoutInvoiceRows.length,
        sampleRows: completedWithoutInvoiceRows.slice(0, 3).map((a) => ({
          appointmentId: a.id,
          patientName: a.patient.fullName,
          appointmentDate: a.appointmentDate,
          invoiceCount: 0,
        })),
      });

      // Process today's appointment stats
      const todayStatusMap = new Map<string, number>();
      for (const row of todayApptGrouped) {
        todayStatusMap.set(row.status, row._count.id);
      }
      const appointmentsTodayTotal = [...todayStatusMap.values()].reduce(
        (s, v) => s + v,
        0,
      );
      const appointmentsTodayCompleted = todayStatusMap.get('COMPLETED') ?? 0;
      const appointmentsTodayCancelled = todayStatusMap.get('CANCELLED') ?? 0;
      const appointmentsTodayUpcoming =
        (todayStatusMap.get('SCHEDULED') ?? 0) +
        (todayStatusMap.get('CONFIRMED') ?? 0) +
        (todayStatusMap.get('IN_PROGRESS') ?? 0);

      // Process period appointment stats
      const periodStatusMap = new Map<string, number>();
      for (const row of periodApptGrouped) {
        periodStatusMap.set(row.status, row._count.id);
      }
      const totalInPeriod = [...periodStatusMap.values()].reduce(
        (s, v) => s + v,
        0,
      );
      const completedInPeriod = periodStatusMap.get('COMPLETED') ?? 0;
      const cancelledInPeriod = periodStatusMap.get('CANCELLED') ?? 0;
      const noShowInPeriod = periodStatusMap.get('NO_SHOW') ?? 0;
      const cancellationRatePct =
        totalInPeriod > 0
          ? Math.round((cancelledInPeriod / totalInPeriod) * 100)
          : 0;
      const noShowRatePct =
        totalInPeriod > 0
          ? Math.round((noShowInPeriod / totalInPeriod) * 100)
          : 0;

      // Top providers by appointment count in period
      const sortedProviders = [...rawTopProviders]
        .sort((a, b) => (b._count as { id: number }).id - (a._count as { id: number }).id)
        .slice(0, 5);
      const providerUserIds = sortedProviders
        .map((r) => r.staffUserId)
        .filter((id): id is string => id !== null);
      const providerUsers =
        providerUserIds.length > 0
          ? await prisma.user.findMany({
              where: { id: { in: providerUserIds } },
              select: { id: true, fullName: true },
            })
          : [];
      const providerNameMap = new Map(
        providerUsers.map((u) => [u.id, u.fullName]),
      );
      const topProviders = sortedProviders
        .filter((r) => r.staffUserId !== null)
        .map((r) => ({
          userId: r.staffUserId!,
          name: providerNameMap.get(r.staffUserId!) ?? '',
          count: (r._count as { id: number }).id,
        }))
        .filter((r) => r.name.length > 0);

      const periodExpenses = await prisma.expense.findMany({
        where: {
          centerId,
          status: { not: 'CANCELLED' },
          expenseDate: { gte: start, lte: end },
        },
        select: {
          amount: true,
          status: true,
          category: { select: { id: true, name: true, color: true } },
          branch: { select: { id: true, name: true } },
        },
      });
      const totalExpenses = periodExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount ?? 0),
        0,
      );
      const pendingExpensesAmount = periodExpenses
        .filter((expense) => expense.status === 'PENDING' || expense.status === 'RECURRING')
        .reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
      const netProfit = periodRevenue - totalExpenses;
      const profitMargin =
        periodRevenue > 0 ? Math.round((netProfit / periodRevenue) * 1000) / 10 : 0;
      const expensesByCategory = new Map<
        string,
        { categoryId: string; name: string; color: string; amount: number }
      >();
      const expensesByBranch = new Map<
        string,
        { branchId: string | null; name: string; amount: number }
      >();
      for (const expense of periodExpenses) {
        const amount = Number(expense.amount ?? 0);
        const categoryId = expense.category?.id ?? 'uncategorized';
        const category = expensesByCategory.get(categoryId) ?? {
          categoryId,
          name: expense.category?.name ?? 'أخرى',
          color: expense.category?.color ?? '#475569',
          amount: 0,
        };
        category.amount += amount;
        expensesByCategory.set(categoryId, category);

        const branchId = expense.branch?.id ?? 'center';
        const branch = expensesByBranch.get(branchId) ?? {
          branchId: expense.branch?.id ?? null,
          name: expense.branch?.name ?? 'المركز الرئيسي',
          amount: 0,
        };
        branch.amount += amount;
        expensesByBranch.set(branchId, branch);
      }

      return {
        cards: {
          periodRevenue: decimalString(periodRevenue),
          revenueToday: decimalString(periodRevenue),
          revenueThisMonth: decimalString(periodRevenue),
          paidInvoices: paidInvoicesCount,
          pendingInvoices: unpaidInvoicesCount,
          overdueInvoices: overdueInvoicesCount,
          totalPatientCredit: decimalString(
            Number(patientCreditAgg._sum.creditBalance ?? 0),
          ),
          averageInvoiceValue: decimalString(
            periodInvoices.length > 0 ? periodRevenue / periodInvoices.length : 0,
          ),
          totalReceivables: decimalString(totalReceivables),
          patientsWithDebt: debtByPatient.size,
          unpaidInvoices: unpaidInvoicesCount,
          partiallyPaidInvoices: partiallyPaidInvoicesCount,
          highestDebt,
          totalExpenses: decimalString(totalExpenses),
          netProfit: decimalString(netProfit),
          revenueAfterExpenses: decimalString(netProfit),
          profitMargin,
        },
        summary: {
          revenue: decimalString(periodRevenue),
          expenses: decimalString(totalExpenses),
          netProfit: decimalString(netProfit),
          revenueAfterExpenses: decimalString(netProfit),
          profitMargin,
          totalReceivables: decimalString(totalReceivables),
          overdueInvoicesCount,
          unpaidInvoicesCount,
          partiallyPaidInvoicesCount,
          paidInvoicesCount,
          invoiceCountIncluded,
          patientsWithBalanceCount: debtByPatient.size,
          highestDebt,
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
          receivablesByPaymentStatus: [...receivablesByStatus.entries()].map(
            ([status, amount]) => ({
              status,
              amount: decimalString(amount),
            }),
          ),
          topPatientsByDebt,
          topDebtors: topPatientsByDebt,
          revenueVsReceivables: [
            { key: 'REVENUE', amount: decimalString(periodRevenue) },
            { key: 'RECEIVABLES', amount: decimalString(totalReceivables) },
          ],
          expensesByCategory: [...expensesByCategory.values()]
            .sort((a, b) => b.amount - a.amount)
            .map((row) => ({
              categoryId: row.categoryId,
              name: row.name,
              color: row.color,
              amount: decimalString(row.amount),
            })),
          expensesByBranch: [...expensesByBranch.values()]
            .sort((a, b) => b.amount - a.amount)
            .map((row) => ({
              branchId: row.branchId,
              name: row.name,
              amount: decimalString(row.amount),
            })),
          revenueVsExpenses: [
            { key: 'REVENUE', amount: decimalString(periodRevenue) },
            { key: 'EXPENSES', amount: decimalString(totalExpenses) },
            { key: 'NET_PROFIT', amount: decimalString(netProfit) },
          ],
        },
        expenses: {
          total: decimalString(totalExpenses),
          pending: decimalString(pendingExpensesAmount),
          count: periodExpenses.length,
          netProfit: decimalString(netProfit),
          profitMargin,
        },
        receivables: {
          details: filteredReceivableDetails.sort(
            (a, b) =>
              Number(b.remainingAmount) - Number(a.remainingAmount) ||
              a.dueDate.localeCompare(b.dueDate),
          ),
        },
        reportMeta: {
          rangeType: filters.period ?? 'today',
          startDate: formatDateKey(start),
          endDate: formatDateKey(end),
          invoiceCountIncluded,
          paymentCountIncluded: periodPayments.length,
        },
        debugCenterId: centerId,
        debugInvoices: debugInvoices.slice(0, 10),
        currency: currencyResult?.currency ?? 'ILS',
        periodStart: formatDateKey(start),
        periodEnd: formatDateKey(end),
        operational: {
          appointmentsTodayTotal,
          appointmentsTodayCompleted,
          appointmentsTodayUpcoming,
          appointmentsTodayCancelled,
          delayedFollowUps: delayedFollowUpsCount,
          newPatientsThisMonth: newPatientsThisMonthCount,
          activeTreatmentPlans: activePlansCount,
          completedWithoutInvoiceCount: completedWithoutInvoiceRows.length,
          completedWithoutInvoice: completedWithoutInvoiceRows.map((appt) => ({
            id: appt.id,
            appointmentDate: formatDateKey(appt.appointmentDate),
            startTime: appt.startTime,
            endTime: appt.endTime,
            patientId: appt.patient.id,
            patientName: appt.patient.fullName,
            patientPhone: appt.patient.phone,
            serviceId: appt.service?.id ?? null,
            serviceNameAr: appt.service?.nameAr ?? appt.customServiceName ?? null,
            serviceNameEn: appt.service?.nameEn ?? appt.customServiceName ?? null,
            serviceNameHe: appt.service?.nameHe ?? appt.customServiceName ?? null,
            providerName: appt.staffUser?.fullName ?? null,
          })),
        },
        appointmentAnalytics: {
          totalInPeriod,
          completedInPeriod,
          cancelledInPeriod,
          noShowInPeriod,
          cancellationRatePct,
          noShowRatePct,
          topProviders,
        },
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
