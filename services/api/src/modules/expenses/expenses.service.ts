import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type ExpenseStatus, type PaymentMethod } from '@royalcare/db';
import { PrismaService } from '../../common/database/prisma.service';
import { hasTenantPermission } from '../../common/permissions/tenant-permissions';

type ExpensePermission =
  | 'expenses:view'
  | 'expenses:create'
  | 'expenses:edit'
  | 'expenses:delete'
  | 'expenses:reports';

type ExpenseQuery = {
  search?: string;
  status?: string;
  categoryId?: string;
  branchId?: string;
  from?: string;
  to?: string;
};

type ExpensePayload = {
  title?: unknown;
  description?: unknown;
  categoryId?: unknown;
  branchId?: unknown;
  amount?: unknown;
  currency?: unknown;
  expenseDate?: unknown;
  dueDate?: unknown;
  paymentMethod?: unknown;
  status?: unknown;
  receiptUrl?: unknown;
  invoiceNumber?: unknown;
  vendorName?: unknown;
  notes?: unknown;
  tags?: unknown;
  recurring?: unknown;
  recurrenceId?: unknown;
};

type CategoryPayload = {
  name?: unknown;
  color?: unknown;
  icon?: unknown;
  isActive?: unknown;
  sortOrder?: unknown;
};

const defaultCategories = [
  { name: 'رواتب', color: '#2563EB', icon: 'users', sortOrder: 10 },
  { name: 'إيجار', color: '#7C3AED', icon: 'building', sortOrder: 20 },
  { name: 'كهرباء', color: '#F59E0B', icon: 'zap', sortOrder: 30 },
  { name: 'ماء', color: '#0EA5E9', icon: 'droplet', sortOrder: 40 },
  { name: 'إنترنت', color: '#14B8A6', icon: 'wifi', sortOrder: 50 },
  { name: 'مواد استهلاكية', color: '#10B981', icon: 'package', sortOrder: 60 },
  { name: 'أجهزة وصيانة', color: '#64748B', icon: 'wrench', sortOrder: 70 },
  {
    name: 'تسويق وإعلانات',
    color: '#EC4899',
    icon: 'megaphone',
    sortOrder: 80,
  },
  { name: 'عمولات', color: '#8B5CF6', icon: 'percent', sortOrder: 90 },
  { name: 'ضرائب', color: '#EF4444', icon: 'receipt', sortOrder: 100 },
  { name: 'ضيافة', color: '#F97316', icon: 'coffee', sortOrder: 110 },
  { name: 'أخرى', color: '#475569', icon: 'more-horizontal', sortOrder: 120 },
];

const expenseStatuses = ['PAID', 'PENDING', 'RECURRING', 'CANCELLED'] as const;
const paymentMethods = ['CASH', 'BANK_TRANSFER', 'CHECK', 'OTHER'] as const;

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalString(value: unknown) {
  const next = trim(value);
  return next.length > 0 ? next : null;
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function parseDate(
  value: unknown,
  field: string,
  errors: Record<string, string>,
) {
  const raw = trim(value);
  if (!raw) return null;
  const date = new Date(raw.length === 10 ? `${raw}T00:00:00.000Z` : raw);
  if (Number.isNaN(date.getTime())) {
    errors[field] = 'Invalid date.';
    return null;
  }
  return date;
}

function formatDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function decimal(
  value: unknown,
  field: string,
  errors: Record<string, string>,
) {
  const number = typeof value === 'number' ? value : Number(trim(value));
  if (!Number.isFinite(number) || number <= 0) {
    errors[field] = 'Enter a valid amount greater than zero.';
    return new Prisma.Decimal(0);
  }
  return new Prisma.Decimal(number.toFixed(2));
}

function addMonths(date: Date, months = 1) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function decimalString(value: unknown) {
  return Number(value ?? 0).toFixed(2);
}

const expenseSelect = {
  id: true,
  centerId: true,
  categoryId: true,
  branchId: true,
  createdByUserId: true,
  recurrenceId: true,
  title: true,
  description: true,
  amount: true,
  currency: true,
  expenseDate: true,
  dueDate: true,
  paymentMethod: true,
  status: true,
  receiptUrl: true,
  invoiceNumber: true,
  vendorName: true,
  notes: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: { id: true, name: true, color: true, icon: true, isActive: true },
  },
  branch: {
    select: { id: true, name: true, cityAr: true, cityEn: true, cityHe: true },
  },
  createdBy: { select: { id: true, fullName: true, email: true } },
} as const;

function formatExpense(
  expense: Prisma.ExpenseGetPayload<{ select: typeof expenseSelect }>,
) {
  return {
    ...expense,
    amount: expense.amount.toString(),
    expenseDate: formatDateKey(expense.expenseDate),
    dueDate: expense.dueDate ? formatDateKey(expense.dueDate) : null,
  };
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prismaService: PrismaService) {}

  async list(
    centerId: string,
    permissions: string[],
    query: ExpenseQuery = {},
  ) {
    this.requirePermission(permissions, 'expenses:view');
    const prisma = await this.prismaService.getClient();
    await this.ensureDefaultCategories(prisma, centerId);
    await this.generateDueRecurringExpenses(centerId, permissions);

    const where = this.buildExpenseWhere(centerId, query);
    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
        select: expenseSelect,
      }),
      prisma.expense.count({ where }),
    ]);

    return { items: items.map(formatExpense), total };
  }

  async overview(
    centerId: string,
    permissions: string[],
    query: ExpenseQuery = {},
  ) {
    this.requirePermission(permissions, 'expenses:reports');
    const prisma = await this.prismaService.getClient();
    await this.ensureDefaultCategories(prisma, centerId);
    await this.generateDueRecurringExpenses(centerId, permissions);

    const { start, end } = this.rangeFromQuery(query);
    const currentYearStart = new Date(
      Date.UTC(new Date().getUTCFullYear(), 0, 1),
    );
    const monthStart = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
    );
    const monthEnd = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    );

    const expenseWhere = {
      centerId,
      status: { not: 'CANCELLED' as const },
      expenseDate: { gte: start, lte: end },
    };

    const [
      periodExpenses,
      monthlyAgg,
      yearlyAgg,
      pendingAgg,
      revenueRows,
      branches,
    ] = await Promise.all([
      prisma.expense.findMany({
        where: expenseWhere,
        select: {
          amount: true,
          currency: true,
          status: true,
          expenseDate: true,
          category: { select: { id: true, name: true, color: true } },
          branch: {
            select: {
              id: true,
              name: true,
              cityAr: true,
              cityEn: true,
              cityHe: true,
            },
          },
        },
      }),
      prisma.expense.aggregate({
        where: {
          centerId,
          status: { not: 'CANCELLED' },
          expenseDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          centerId,
          status: { not: 'CANCELLED' },
          expenseDate: { gte: currentYearStart },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { centerId, status: 'PENDING' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.findMany({
        where: {
          centerId,
          paidAt: { gte: start, lte: end },
          invoice: { status: { not: 'CANCELLED' } },
        },
        select: { amount: true, paidAt: true },
      }),
      prisma.centerBranch.findMany({
        where: { centerId },
        select: {
          id: true,
          name: true,
          cityAr: true,
          cityEn: true,
          cityHe: true,
        },
      }),
    ]);

    const revenue = revenueRows.reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0,
    );
    const totalExpenses = periodExpenses.reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0,
    );
    const paidExpenses = periodExpenses
      .filter((row) => row.status === 'PAID')
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const pendingExpenses = periodExpenses
      .filter((row) => row.status === 'PENDING' || row.status === 'RECURRING')
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const netProfit = revenue - totalExpenses;
    const profitMargin =
      revenue > 0 ? Math.round((netProfit / revenue) * 1000) / 10 : 0;

    const byCategory = new Map<
      string,
      { categoryId: string; name: string; color: string; amount: number }
    >();
    const byBranch = new Map<
      string,
      { branchId: string | null; name: string; amount: number }
    >();
    const byMonth = new Map<string, number>();
    const marketing = new Set(['تسويق وإعلانات']);
    const payroll = new Set(['رواتب', 'عمولات']);
    let marketingSpend = 0;
    let payrollSpend = 0;

    for (const row of periodExpenses) {
      const amount = Number(row.amount ?? 0);
      const categoryKey = row.category?.id ?? 'uncategorized';
      const categoryName = row.category?.name ?? 'أخرى';
      const category = byCategory.get(categoryKey) ?? {
        categoryId: categoryKey,
        name: categoryName,
        color: row.category?.color ?? '#475569',
        amount: 0,
      };
      category.amount += amount;
      byCategory.set(categoryKey, category);

      const branchKey = row.branch?.id ?? 'center';
      const branch = byBranch.get(branchKey) ?? {
        branchId: row.branch?.id ?? null,
        name: row.branch?.name ?? 'المركز الرئيسي',
        amount: 0,
      };
      branch.amount += amount;
      byBranch.set(branchKey, branch);

      const monthKey = row.expenseDate.toISOString().slice(0, 7);
      byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + amount);

      if (marketing.has(categoryName)) marketingSpend += amount;
      if (payroll.has(categoryName)) payrollSpend += amount;
    }

    const categoryBreakdown = [...byCategory.values()].sort(
      (a, b) => b.amount - a.amount,
    );
    const branchComparison = branches
      .map(
        (branch) =>
          byBranch.get(branch.id) ?? {
            branchId: branch.id,
            name: branch.name,
            amount: 0,
          },
      )
      .concat(byBranch.has('center') ? [byBranch.get('center')!] : [])
      .sort((a, b) => b.amount - a.amount);
    const highestCategory = categoryBreakdown[0] ?? null;
    const highestBranch = branchComparison[0] ?? null;

    return {
      cards: {
        totalExpenses: decimalString(totalExpenses),
        paidExpenses: decimalString(paidExpenses),
        pendingExpenses: decimalString(pendingExpenses),
        monthlyExpenses: decimalString(monthlyAgg._sum.amount ?? 0),
        yearlyExpenses: decimalString(yearlyAgg._sum.amount ?? 0),
        revenue: decimalString(revenue),
        netProfit: decimalString(netProfit),
        profitMargin,
        unpaidExpenseAlerts: pendingAgg._count.id,
      },
      charts: {
        monthlyExpenseTrend: [...byMonth.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, amount]) => ({ month, amount: decimalString(amount) })),
        categoryBreakdown: categoryBreakdown.map((row) => ({
          ...row,
          amount: decimalString(row.amount),
        })),
        branchComparison: branchComparison.map((row) => ({
          ...row,
          amount: decimalString(row.amount),
        })),
        revenueVsExpenses: [
          { key: 'REVENUE', amount: decimalString(revenue) },
          { key: 'EXPENSES', amount: decimalString(totalExpenses) },
          { key: 'NET_PROFIT', amount: decimalString(netProfit) },
        ],
      },
      insights: {
        highestExpenseCategory: highestCategory
          ? {
              name: highestCategory.name,
              amount: decimalString(highestCategory.amount),
            }
          : null,
        branchConsumingMostBudget: highestBranch
          ? {
              name: highestBranch.name,
              amount: decimalString(highestBranch.amount),
            }
          : null,
        marketingSpend: decimalString(marketingSpend),
        payrollRatio:
          totalExpenses > 0
            ? Math.round((payrollSpend / totalExpenses) * 1000) / 10
            : 0,
        unpaidExpenseAlerts: pendingAgg._count.id,
        unpaidExpenseAmount: decimalString(pendingAgg._sum.amount ?? 0),
      },
      currency: periodExpenses[0]?.currency ?? 'ILS',
      periodStart: formatDateKey(start),
      periodEnd: formatDateKey(end),
    };
  }

  async options(centerId: string, permissions: string[]) {
    this.requirePermission(permissions, 'expenses:view');
    const prisma = await this.prismaService.getClient();
    await this.ensureDefaultCategories(prisma, centerId);

    const [categories, branches] = await Promise.all([
      prisma.expenseCategory.findMany({
        where: { centerId },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.centerBranch.findMany({
        where: { centerId },
        select: {
          id: true,
          name: true,
          cityAr: true,
          cityEn: true,
          cityHe: true,
          addressAr: true,
          addressEn: true,
          addressHe: true,
          isActive: true,
          isMain: true,
        },
        orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return {
      categories,
      branches,
      paymentMethods,
      statuses: expenseStatuses,
    };
  }

  async create(
    centerId: string,
    userId: string,
    permissions: string[],
    payload: ExpensePayload,
  ) {
    this.requirePermission(permissions, 'expenses:create');
    const prisma = await this.prismaService.getClient();
    await this.ensureDefaultCategories(prisma, centerId);
    const data = await this.validateExpensePayload(
      prisma,
      centerId,
      userId,
      payload,
      true,
    );

    const created = await prisma.expense.create({
      data: data.expense as Prisma.ExpenseUncheckedCreateInput,
      select: expenseSelect,
    });

    if (data.recurrence) {
      const recurrence = await prisma.expenseRecurrence.create({
        data: data.recurrence,
        select: { id: true },
      });
      const updated = await prisma.expense.update({
        where: { id: created.id },
        data: { recurrenceId: recurrence.id, status: 'RECURRING' },
        select: expenseSelect,
      });
      return formatExpense(updated);
    }

    return formatExpense(created);
  }

  async update(
    centerId: string,
    permissions: string[],
    expenseId: string,
    payload: ExpensePayload,
  ) {
    this.requirePermission(permissions, 'expenses:edit');
    const prisma = await this.prismaService.getClient();
    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, centerId },
    });
    if (!existing)
      throw new NotFoundException({ message: 'Expense not found' });
    const data = await this.validateExpensePayload(
      prisma,
      centerId,
      existing.createdByUserId,
      payload,
      false,
    );

    const updated = await prisma.expense.update({
      where: { id: existing.id },
      data: data.expense,
      select: expenseSelect,
    });
    return formatExpense(updated);
  }

  async delete(centerId: string, permissions: string[], expenseId: string) {
    this.requirePermission(permissions, 'expenses:delete');
    const prisma = await this.prismaService.getClient();
    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, centerId },
    });
    if (!existing)
      throw new NotFoundException({ message: 'Expense not found' });
    await prisma.expense.delete({ where: { id: existing.id } });
    return { deleted: true };
  }

  async listCategories(centerId: string, permissions: string[]) {
    this.requirePermission(permissions, 'expenses:view');
    const prisma = await this.prismaService.getClient();
    await this.ensureDefaultCategories(prisma, centerId);
    return prisma.expenseCategory.findMany({
      where: { centerId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createCategory(
    centerId: string,
    permissions: string[],
    payload: CategoryPayload,
  ) {
    this.requirePermission(permissions, 'expenses:edit');
    const prisma = await this.prismaService.getClient();
    const data = this.validateCategoryPayload(payload, true);
    return prisma.expenseCategory.create({
      data: { ...data, centerId } as Prisma.ExpenseCategoryUncheckedCreateInput,
    });
  }

  async updateCategory(
    centerId: string,
    permissions: string[],
    categoryId: string,
    payload: CategoryPayload,
  ) {
    this.requirePermission(permissions, 'expenses:edit');
    const prisma = await this.prismaService.getClient();
    const existing = await prisma.expenseCategory.findFirst({
      where: { id: categoryId, centerId },
    });
    if (!existing)
      throw new NotFoundException({ message: 'Category not found' });
    const data = this.validateCategoryPayload(payload, false);
    return prisma.expenseCategory.update({ where: { id: existing.id }, data });
  }

  private async validateExpensePayload(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    centerId: string,
    userId: string,
    payload: ExpensePayload,
    isCreate: boolean,
  ) {
    const errors: Record<string, string> = {};
    const title = trim(payload.title);
    if (isCreate && !title) errors.title = 'Expense title is required.';
    const amount =
      payload.amount === undefined && !isCreate
        ? undefined
        : decimal(payload.amount, 'amount', errors);
    const expenseDate =
      payload.expenseDate === undefined && !isCreate
        ? undefined
        : parseDate(payload.expenseDate, 'expenseDate', errors);
    const dueDate =
      payload.dueDate === undefined
        ? undefined
        : parseDate(payload.dueDate, 'dueDate', errors);

    const categoryId = isUuid(payload.categoryId) ? payload.categoryId : null;
    if (payload.categoryId && !categoryId)
      errors.categoryId = 'Invalid category.';
    if (categoryId) {
      const category = await prisma.expenseCategory.findFirst({
        where: { id: categoryId, centerId },
      });
      if (!category) errors.categoryId = 'Category was not found.';
    }

    const branchId = isUuid(payload.branchId) ? payload.branchId : null;
    if (payload.branchId && !branchId) errors.branchId = 'Invalid branch.';
    if (branchId) {
      const branch = await prisma.centerBranch.findFirst({
        where: { id: branchId, centerId },
      });
      if (!branch) errors.branchId = 'Branch was not found.';
    }

    const status = trim(payload.status).toUpperCase();
    if (
      payload.status &&
      !(expenseStatuses as readonly string[]).includes(status)
    ) {
      errors.status = 'Invalid expense status.';
    }

    const paymentMethod = trim(payload.paymentMethod).toUpperCase();
    const validPaymentMethod = (paymentMethods as readonly string[]).includes(
      paymentMethod,
    )
      ? (paymentMethod as PaymentMethod)
      : undefined;
    if (payload.paymentMethod && !validPaymentMethod) {
      errors.paymentMethod = 'Invalid payment method.';
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }

    const expense:
      | Prisma.ExpenseUncheckedCreateInput
      | Prisma.ExpenseUncheckedUpdateInput = {
      ...(title ? { title } : {}),
      ...(payload.description !== undefined
        ? { description: optionalString(payload.description) }
        : {}),
      ...(payload.categoryId !== undefined ? { categoryId } : {}),
      ...(payload.branchId !== undefined ? { branchId } : {}),
      ...(amount ? { amount } : {}),
      ...(payload.currency !== undefined
        ? { currency: trim(payload.currency) || 'ILS' }
        : {}),
      ...(expenseDate ? { expenseDate } : {}),
      ...(payload.dueDate !== undefined ? { dueDate } : {}),
      ...(payload.paymentMethod !== undefined
        ? { paymentMethod: validPaymentMethod ?? 'CASH' }
        : {}),
      ...(payload.status !== undefined
        ? { status: (status as ExpenseStatus) || 'PENDING' }
        : {}),
      ...(payload.receiptUrl !== undefined
        ? { receiptUrl: optionalString(payload.receiptUrl) }
        : {}),
      ...(payload.invoiceNumber !== undefined
        ? { invoiceNumber: optionalString(payload.invoiceNumber) }
        : {}),
      ...(payload.vendorName !== undefined
        ? { vendorName: optionalString(payload.vendorName) }
        : {}),
      ...(payload.notes !== undefined
        ? { notes: optionalString(payload.notes) }
        : {}),
      ...(payload.tags !== undefined
        ? { tags: Array.isArray(payload.tags) ? payload.tags : Prisma.JsonNull }
        : {}),
      ...(isCreate ? { centerId, createdByUserId: userId } : {}),
    };

    let recurrence: Prisma.ExpenseRecurrenceUncheckedCreateInput | null = null;
    if (isCreate && payload.recurring && amount && expenseDate) {
      const dayOfMonth = Math.max(1, Math.min(28, expenseDate.getUTCDate()));
      recurrence = {
        centerId,
        categoryId,
        branchId,
        createdByUserId: userId,
        title: title || 'Recurring expense',
        description: optionalString(payload.description),
        amount,
        currency: trim(payload.currency) || 'ILS',
        paymentMethod: validPaymentMethod ?? 'CASH',
        vendorName: optionalString(payload.vendorName),
        invoiceNumber: optionalString(payload.invoiceNumber),
        notes: optionalString(payload.notes),
        tags: Array.isArray(payload.tags) ? payload.tags : Prisma.JsonNull,
        dayOfMonth,
        nextGenerationDate: addMonths(expenseDate),
      };
    }

    return { expense, recurrence };
  }

  private validateCategoryPayload(payload: CategoryPayload, isCreate: boolean) {
    const errors: Record<string, string> = {};
    const name = trim(payload.name);
    if (isCreate && !name) errors.name = 'Category name is required.';
    const sortOrder =
      payload.sortOrder === undefined
        ? undefined
        : Number.isFinite(Number(payload.sortOrder))
          ? Number(payload.sortOrder)
          : 0;
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }
    return {
      ...(name ? { name } : {}),
      ...(payload.color !== undefined
        ? { color: trim(payload.color) || '#0B2D5C' }
        : {}),
      ...(payload.icon !== undefined
        ? { icon: trim(payload.icon) || 'receipt' }
        : {}),
      ...(payload.isActive !== undefined
        ? { isActive: Boolean(payload.isActive) }
        : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
    };
  }

  private buildExpenseWhere(
    centerId: string,
    query: ExpenseQuery,
  ): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = { centerId };
    const search = trim(query.search);
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { vendorName: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    const status = trim(query.status).toUpperCase();
    if (
      status &&
      status !== 'ALL' &&
      (expenseStatuses as readonly string[]).includes(status)
    ) {
      where.status = status as never;
    }
    if (isUuid(query.categoryId)) where.categoryId = query.categoryId;
    if (isUuid(query.branchId)) where.branchId = query.branchId;
    const { start, end } = this.rangeFromQuery(query);
    where.expenseDate = { gte: start, lte: end };
    return where;
  }

  private rangeFromQuery(query: ExpenseQuery) {
    const now = new Date();
    const start =
      query.from &&
      !Number.isNaN(
        new Date(`${query.from.slice(0, 10)}T00:00:00.000Z`).getTime(),
      )
        ? new Date(`${query.from.slice(0, 10)}T00:00:00.000Z`)
        : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end =
      query.to &&
      !Number.isNaN(
        new Date(`${query.to.slice(0, 10)}T23:59:59.999Z`).getTime(),
      )
        ? new Date(`${query.to.slice(0, 10)}T23:59:59.999Z`)
        : new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth() + 1,
              0,
              23,
              59,
              59,
              999,
            ),
          );
    return start <= end ? { start, end } : { start: end, end: start };
  }

  private async ensureDefaultCategories(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    centerId: string,
  ) {
    const count = await prisma.expenseCategory.count({ where: { centerId } });
    if (count > 0) return;
    await prisma.expenseCategory.createMany({
      data: defaultCategories.map((category) => ({ ...category, centerId })),
      skipDuplicates: true,
    });
  }

  async generateDueRecurringExpenses(centerId: string, permissions: string[]) {
    if (!hasTenantPermission(permissions, 'expenses:create'))
      return { created: 0 };
    const prisma = await this.prismaService.getClient();
    const today = new Date();
    const due = await prisma.expenseRecurrence.findMany({
      where: { centerId, isPaused: false, nextGenerationDate: { lte: today } },
      take: 25,
    });
    let created = 0;
    for (const recurrence of due) {
      await prisma.$transaction(async (tx) => {
        await tx.expense.create({
          data: {
            centerId,
            categoryId: recurrence.categoryId,
            branchId: recurrence.branchId,
            createdByUserId: recurrence.createdByUserId,
            recurrenceId: recurrence.id,
            title: recurrence.title,
            description: recurrence.description,
            amount: recurrence.amount,
            currency: recurrence.currency,
            expenseDate: recurrence.nextGenerationDate,
            paymentMethod: recurrence.paymentMethod,
            status: 'RECURRING',
            vendorName: recurrence.vendorName,
            invoiceNumber: recurrence.invoiceNumber,
            notes: recurrence.notes,
            tags: recurrence.tags ?? Prisma.JsonNull,
          },
        });
        await tx.expenseRecurrence.update({
          where: { id: recurrence.id },
          data: {
            lastGeneratedAt: new Date(),
            nextGenerationDate: addMonths(recurrence.nextGenerationDate),
          },
        });
      });
      created += 1;
    }
    return { created };
  }

  requireCreatePermission(permissions: string[]) {
    this.requirePermission(permissions, 'expenses:create');
  }

  private requirePermission(
    permissions: string[],
    permission: ExpensePermission,
  ) {
    if (!hasTenantPermission(permissions, permission)) {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: { permission: `Missing permission: ${permission}` },
      });
    }
  }
}
