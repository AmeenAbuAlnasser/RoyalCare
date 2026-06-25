import { API_BASE_URL, ApiRequestError } from "./super-admin-centers";

export type ExpenseStatus = "PAID" | "PENDING" | "RECURRING" | "CANCELLED";
export type ExpensePaymentMethod = "CASH" | "BANK_TRANSFER" | "CHECK" | "OTHER";

export type ExpenseCategory = {
  id: string;
  centerId: string;
  name: string;
  color: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseBranch = {
  id: string;
  name: string;
  cityAr: string | null;
  cityEn: string | null;
  cityHe: string | null;
  addressAr?: string | null;
  addressEn?: string | null;
  addressHe?: string | null;
  isActive?: boolean;
  isMain?: boolean;
};

export type TenantExpense = {
  id: string;
  centerId: string;
  categoryId: string | null;
  branchId: string | null;
  createdByUserId: string;
  recurrenceId: string | null;
  title: string;
  description: string | null;
  amount: string;
  currency: string;
  expenseDate: string;
  dueDate: string | null;
  paymentMethod: ExpensePaymentMethod;
  status: ExpenseStatus;
  receiptUrl: string | null;
  invoiceNumber: string | null;
  vendorName: string | null;
  notes: string | null;
  tags: unknown;
  createdAt: string;
  updatedAt: string;
  category: Pick<
    ExpenseCategory,
    "id" | "name" | "color" | "icon" | "isActive"
  > | null;
  branch: ExpenseBranch | null;
  createdBy: { id: string; fullName: string; email: string | null };
};

export type ExpenseListResponse = {
  items: TenantExpense[];
  total: number;
};

export type ExpenseOptions = {
  categories: ExpenseCategory[];
  branches: ExpenseBranch[];
  paymentMethods: ExpensePaymentMethod[];
  statuses: ExpenseStatus[];
};

export type ExpenseOverview = {
  cards: {
    totalExpenses: string;
    paidExpenses: string;
    pendingExpenses: string;
    monthlyExpenses: string;
    yearlyExpenses: string;
    revenue: string;
    netProfit: string;
    profitMargin: number;
    unpaidExpenseAlerts: number;
  };
  charts: {
    monthlyExpenseTrend: Array<{ month: string; amount: string }>;
    categoryBreakdown: Array<{
      categoryId: string;
      name: string;
      color: string;
      amount: string;
    }>;
    branchComparison: Array<{
      branchId: string | null;
      name: string;
      amount: string;
    }>;
    revenueVsExpenses: Array<{
      key: "REVENUE" | "EXPENSES" | "NET_PROFIT";
      amount: string;
    }>;
  };
  insights: {
    highestExpenseCategory: { name: string; amount: string } | null;
    branchConsumingMostBudget: { name: string; amount: string } | null;
    marketingSpend: string;
    payrollRatio: number;
    unpaidExpenseAlerts: number;
    unpaidExpenseAmount: string;
  };
  currency: string;
  periodStart: string;
  periodEnd: string;
};

export type ExpensePayload = {
  title: string;
  description?: string | null;
  categoryId?: string | null;
  branchId?: string | null;
  amount: string;
  currency: string;
  expenseDate: string;
  dueDate?: string | null;
  paymentMethod: ExpensePaymentMethod;
  status: ExpenseStatus;
  receiptUrl?: string | null;
  invoiceNumber?: string | null;
  vendorName?: string | null;
  notes?: string | null;
  tags?: string[];
  recurring?: boolean;
};

function safelyParseJson(rawBody: string) {
  if (!rawBody.trim()) return null;
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const rawResponseBody = await response.text();
    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "RoyalCare tenant expenses request failed.",
      rawResponseBody,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}

function buildExpenseQuery(filters?: {
  search?: string;
  status?: string;
  categoryId?: string;
  branchId?: string;
  from?: string;
  to?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.set("search", filters.search.trim());
  if (filters?.status && filters.status !== "ALL")
    params.set("status", filters.status);
  if (filters?.categoryId && filters.categoryId !== "ALL")
    params.set("categoryId", filters.categoryId);
  if (filters?.branchId && filters.branchId !== "ALL")
    params.set("branchId", filters.branchId);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  return params.toString();
}

export function getExpenseOverview(filters?: { from?: string; to?: string }) {
  const query = buildExpenseQuery(filters);
  return request<ExpenseOverview>(
    `/tenant/expenses/overview${query ? `?${query}` : ""}`,
  );
}

export function listTenantExpenses(
  filters?: Parameters<typeof buildExpenseQuery>[0],
) {
  const query = buildExpenseQuery(filters);
  return request<ExpenseListResponse>(
    `/tenant/expenses${query ? `?${query}` : ""}`,
  );
}

export function getExpenseOptions() {
  return request<ExpenseOptions>("/tenant/expenses/options");
}

export function createTenantExpense(payload: ExpensePayload) {
  return request<TenantExpense>("/tenant/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTenantExpense(
  expenseId: string,
  payload: ExpensePayload,
) {
  return request<TenantExpense>(`/tenant/expenses/${expenseId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTenantExpense(expenseId: string) {
  return request<{ deleted: true }>(`/tenant/expenses/${expenseId}`, {
    method: "DELETE",
  });
}

export function listExpenseCategories() {
  return request<ExpenseCategory[]>("/tenant/expenses/categories/list");
}

export function createExpenseCategory(
  payload: Partial<ExpenseCategory> & { name: string },
) {
  return request<ExpenseCategory>("/tenant/expenses/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateExpenseCategory(
  categoryId: string,
  payload: Partial<ExpenseCategory>,
) {
  return request<ExpenseCategory>(`/tenant/expenses/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function uploadExpenseReceipt(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/tenant/expenses/receipt`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!response.ok) {
    const rawResponseBody = await response.text();
    throw new ApiRequestError({
      details: safelyParseJson(rawResponseBody),
      message: "RoyalCare tenant expense receipt upload failed.",
      rawResponseBody,
      status: response.status,
    });
  }
  return (await response.json()) as { url: string };
}
