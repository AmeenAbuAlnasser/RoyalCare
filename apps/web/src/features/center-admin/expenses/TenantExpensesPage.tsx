"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminState } from "@/components/ui/admin-surfaces";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate, formatNumber } from "@/i18n/formatters";
import type { SupportedLocale } from "@/i18n/locales";
import { formatBranchLabel } from "@/lib/branch-label";
import {
  createExpenseCategory,
  createTenantExpense,
  deleteTenantExpense,
  getExpenseOptions,
  getExpenseOverview,
  listExpenseCategories,
  listTenantExpenses,
  updateExpenseCategory,
  updateTenantExpense,
  uploadExpenseReceipt,
  type ExpenseCategory,
  type ExpenseOptions,
  type ExpenseOverview,
  type ExpensePaymentMethod,
  type ExpenseStatus,
  type TenantExpense,
} from "@/lib/api/tenant-expenses";
import { CenterAdminShell } from "../layout/CenterAdminShell";

type ExpensesMode = "overview" | "list" | "new" | "categories" | "reports";

const copy = {
  en: {
    title: "Expenses",
    subtitle:
      "Track operational costs, unpaid expenses, and true profitability.",
    overview: "Overview",
    all: "All expenses",
    add: "Add expense",
    categories: "Categories",
    reports: "Financial reports",
    totalExpenses: "Total expenses",
    paidExpenses: "Paid expenses",
    pendingExpenses: "Pending expenses",
    monthlyExpenses: "Monthly expenses",
    yearlyExpenses: "Yearly expenses",
    netProfit: "Net profit",
    revenueVsExpenses: "Revenue vs expenses",
    categoryBreakdown: "Category breakdown",
    branchComparison: "Branch comparison",
    insights: "Insights",
    highestCategory: "Highest expense category",
    budgetBranch: "Branch consuming most budget",
    unpaidAlerts: "Unpaid expense alerts",
    marketingSpend: "Marketing spend",
    payrollRatio: "Payroll ratio",
    search: "Search title, supplier, or invoice",
    allStatuses: "All statuses",
    allCategories: "All categories",
    allBranches: "All branches",
    empty: "No expense data for this period.",
    titleField: "Title",
    amount: "Amount",
    currency: "Currency",
    date: "Expense date",
    dueDate: "Due date",
    category: "Category",
    branch: "Branch",
    supplier: "Supplier / vendor",
    invoiceNumber: "Invoice number",
    paymentMethod: "Payment method",
    status: "Status",
    notes: "Notes",
    receipt: "Receipt image or PDF",
    recurring: "Monthly recurring",
    save: "Save expense",
    saving: "Saving...",
    saved: "Expense saved.",
    name: "Name",
    color: "Color",
    active: "Active",
    saveCategory: "Save category",
    addCategory: "Add category",
    loadError: "Expenses could not be loaded. Please try again.",
    fieldRequired: "This field is required.",
  },
  ar: {
    title: "المصاريف",
    subtitle: "تتبّع تكاليف التشغيل والمصاريف غير المدفوعة والربحية الفعلية.",
    overview: "نظرة عامة",
    all: "جميع المصاريف",
    add: "إضافة مصروف",
    categories: "التصنيفات",
    reports: "التقارير المالية",
    totalExpenses: "إجمالي المصاريف",
    paidExpenses: "المصاريف المدفوعة",
    pendingExpenses: "المصاريف المعلقة",
    monthlyExpenses: "مصاريف الشهر",
    yearlyExpenses: "مصاريف السنة",
    netProfit: "صافي الربح",
    revenueVsExpenses: "الإيرادات مقابل المصاريف",
    categoryBreakdown: "تحليل التصنيفات",
    branchComparison: "مقارنة الفروع",
    insights: "رؤى مالية",
    highestCategory: "أعلى تصنيف مصروفات",
    budgetBranch: "الفرع الأعلى استهلاكًا للميزانية",
    unpaidAlerts: "تنبيهات المصاريف غير المدفوعة",
    marketingSpend: "إنفاق التسويق",
    payrollRatio: "نسبة الرواتب",
    search: "ابحث بالعنوان أو المورد أو رقم الفاتورة",
    allStatuses: "كل الحالات",
    allCategories: "كل التصنيفات",
    allBranches: "كل الفروع",
    empty: "لا توجد بيانات مصاريف لهذه الفترة.",
    titleField: "العنوان",
    amount: "المبلغ",
    currency: "العملة",
    date: "تاريخ المصروف",
    dueDate: "تاريخ الاستحقاق",
    category: "التصنيف",
    branch: "الفرع",
    supplier: "المورد",
    invoiceNumber: "رقم الفاتورة",
    paymentMethod: "طريقة الدفع",
    status: "الحالة",
    notes: "ملاحظات",
    receipt: "صورة أو PDF للإيصال",
    recurring: "مصروف شهري متكرر",
    save: "حفظ المصروف",
    saving: "جار الحفظ...",
    saved: "تم حفظ المصروف.",
    name: "الاسم",
    color: "اللون",
    active: "نشط",
    saveCategory: "حفظ التصنيف",
    addCategory: "إضافة تصنيف",
    loadError: "تعذر تحميل المصاريف. يرجى المحاولة مرة أخرى.",
    fieldRequired: "هذا الحقل مطلوب.",
  },
  he: {
    title: "הוצאות",
    subtitle: "מעקב אחרי עלויות תפעול, הוצאות פתוחות ורווחיות אמיתית.",
    overview: "סקירה",
    all: "כל ההוצאות",
    add: "הוספת הוצאה",
    categories: "קטגוריות",
    reports: "דוחות כספיים",
    totalExpenses: "סך הוצאות",
    paidExpenses: "הוצאות ששולמו",
    pendingExpenses: "הוצאות פתוחות",
    monthlyExpenses: "הוצאות חודשיות",
    yearlyExpenses: "הוצאות שנתיות",
    netProfit: "רווח נקי",
    revenueVsExpenses: "הכנסות מול הוצאות",
    categoryBreakdown: "פילוח קטגוריות",
    branchComparison: "השוואת סניפים",
    insights: "תובנות",
    highestCategory: "קטגוריית ההוצאה הגבוהה ביותר",
    budgetBranch: "הסניף שצורך הכי הרבה תקציב",
    unpaidAlerts: "התראות הוצאות פתוחות",
    marketingSpend: "הוצאות שיווק",
    payrollRatio: "יחס שכר",
    search: "חיפוש לפי כותרת, ספק או חשבונית",
    allStatuses: "כל הסטטוסים",
    allCategories: "כל הקטגוריות",
    allBranches: "כל הסניפים",
    empty: "אין נתוני הוצאות לתקופה זו.",
    titleField: "כותרת",
    amount: "סכום",
    currency: "מטבע",
    date: "תאריך הוצאה",
    dueDate: "תאריך יעד",
    category: "קטגוריה",
    branch: "סניף",
    supplier: "ספק",
    invoiceNumber: "מספר חשבונית",
    paymentMethod: "אמצעי תשלום",
    status: "סטטוס",
    notes: "הערות",
    receipt: "תמונה או PDF של קבלה",
    recurring: "הוצאה חודשית חוזרת",
    save: "שמירת הוצאה",
    saving: "שומר...",
    saved: "ההוצאה נשמרה.",
    name: "שם",
    color: "צבע",
    active: "פעיל",
    saveCategory: "שמירת קטגוריה",
    addCategory: "הוספת קטגוריה",
    loadError: "לא ניתן לטעון הוצאות. נסו שוב.",
    fieldRequired: "שדה זה חובה.",
  },
} as const;

const actionCopy = {
  en: {
    update: "Update expense",
    updated: "Expense updated.",
    deleted: "Expense deleted.",
    edit: "Edit",
    delete: "Delete",
    cancelEdit: "Cancel edit",
    confirmDelete: "Delete this expense?",
    inactive: "Inactive",
    enable: "Enable",
    disable: "Disable",
  },
  ar: {
    update: "تحديث المصروف",
    updated: "تم تحديث المصروف.",
    deleted: "تم حذف المصروف.",
    edit: "تعديل",
    delete: "حذف",
    cancelEdit: "إلغاء التعديل",
    confirmDelete: "هل تريد حذف هذا المصروف؟",
    inactive: "غير نشط",
    enable: "تفعيل",
    disable: "تعطيل",
  },
  he: {
    update: "עדכון הוצאה",
    updated: "ההוצאה עודכנה.",
    deleted: "ההוצאה נמחקה.",
    edit: "עריכה",
    delete: "מחיקה",
    cancelEdit: "ביטול עריכה",
    confirmDelete: "למחוק את ההוצאה הזו?",
    inactive: "לא פעיל",
    enable: "הפעלה",
    disable: "השבתה",
  },
} as const;

function money(amount: string | number, currency: string) {
  return `${currency} ${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthStart() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

function statusLabel(status: ExpenseStatus, locale: SupportedLocale) {
  const labels = {
    en: {
      PAID: "Paid",
      PENDING: "Pending",
      RECURRING: "Recurring",
      CANCELLED: "Cancelled",
    },
    ar: {
      PAID: "مدفوع",
      PENDING: "معلق",
      RECURRING: "متكرر",
      CANCELLED: "ملغي",
    },
    he: { PAID: "שולם", PENDING: "פתוח", RECURRING: "חוזר", CANCELLED: "בוטל" },
  };
  return labels[locale][status];
}

function methodLabel(method: ExpensePaymentMethod, locale: SupportedLocale) {
  const labels = {
    en: {
      CASH: "Cash",
      BANK_TRANSFER: "Bank transfer",
      CHECK: "Check",
      OTHER: "Other",
    },
    ar: {
      CASH: "نقدي",
      BANK_TRANSFER: "تحويل بنكي",
      CHECK: "شيك",
      OTHER: "أخرى",
    },
    he: {
      CASH: "מזומן",
      BANK_TRANSFER: "העברה בנקאית",
      CHECK: "המחאה",
      OTHER: "אחר",
    },
  };
  return labels[locale][method];
}

function statusClass(status: ExpenseStatus) {
  if (status === "PAID")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "CANCELLED") return "border-red-200 bg-red-50 text-red-700";
  if (status === "RECURRING") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function Bars({
  currency,
  empty,
  rows,
}: {
  currency: string;
  empty: string;
  rows: Array<{ label: string; value: string; color?: string }>;
}) {
  const max = Math.max(...rows.map((row) => Number(row.value)), 0);
  if (!rows.length || max <= 0) {
    return (
      <div className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        {empty}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0">
          <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
            <span className="truncate">{row.label}</span>
            <span dir="ltr">{money(row.value, currency)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(5, (Number(row.value) / max) * 100)}%`,
                backgroundColor: row.color ?? "#0B2D5C",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: string;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  const colors = {
    blue: "border-blue-200 bg-blue-50 text-blue-950",
    green: "border-emerald-200 bg-emerald-50 text-emerald-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    red: "border-red-200 bg-red-50 text-red-950",
  };
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${colors[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-black" dir="ltr">
        {value}
      </p>
    </div>
  );
}

function Tabs({ mode }: { mode: ExpensesMode }) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const tabs: Array<[ExpensesMode, string, string]> = [
    ["overview", t.overview, "/tenant/expenses"],
    ["list", t.all, "/tenant/expenses/list"],
    ["new", t.add, "/tenant/expenses/new"],
    ["categories", t.categories, "/tenant/expenses/categories"],
    ["reports", t.reports, "/tenant/expenses/reports"],
  ];
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      {tabs.map(([key, label, href]) => (
        <Link
          key={key}
          href={href}
          className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
            mode === key
              ? "bg-[#0B2D5C] text-white"
              : "text-slate-600 hover:bg-slate-50 hover:text-[#0B2D5C]"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export function TenantExpensesPage({
  mode = "overview",
}: {
  mode?: ExpensesMode;
}) {
  const { locale } = useLanguage();
  const t = copy[locale];
  return (
    <CenterAdminShell
      activeNav="expenses"
      requiredPermission="expenses:view"
      title={() => t.title}
      subtitle={() => t.subtitle}
    >
      {({ session }) => (
        <ExpensesContent
          mode={mode}
          canCreate={session.permissions.includes("expenses:create")}
          canDelete={session.permissions.includes("expenses:delete")}
          canEdit={session.permissions.includes("expenses:edit")}
        />
      )}
    </CenterAdminShell>
  );
}

function ExpensesContent({
  canCreate,
  canDelete,
  canEdit,
  mode,
}: {
  canCreate: boolean;
  canDelete: boolean;
  canEdit: boolean;
  mode: ExpensesMode;
}) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const actions = actionCopy[locale];
  const [overview, setOverview] = useState<ExpenseOverview | null>(null);
  const [items, setItems] = useState<TenantExpense[]>([]);
  const [options, setOptions] = useState<ExpenseOptions | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
    categoryId: "ALL",
    branchId: "ALL",
    from: monthStart(),
    to: today(),
  });
  const [form, setForm] = useState({
    title: "",
    amount: "",
    currency: "ILS",
    expenseDate: today(),
    dueDate: "",
    categoryId: "",
    branchId: "",
    paymentMethod: "CASH" as ExpensePaymentMethod,
    status: "PENDING" as ExpenseStatus,
    vendorName: "",
    invoiceNumber: "",
    notes: "",
    receiptUrl: "",
    recurring: false,
  });
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    color: "#0B2D5C",
    icon: "receipt",
  });
  const currency = overview?.currency ?? "ILS";

  const load = useMemo(() => {
    return async () => {
      setStatus("loading");
      try {
        const [overviewData, optionsData] = await Promise.all([
          getExpenseOverview({ from: filters.from, to: filters.to }),
          getExpenseOptions(),
        ]);
        setOverview(overviewData);
        setOptions(optionsData);
        if (mode === "list") {
          const list = await listTenantExpenses(filters);
          setItems(list.items);
        }
        if (mode === "categories") {
          setCategories(await listExpenseCategories());
        }
        setStatus("success");
      } catch {
        setStatus("error");
      }
    };
  }, [filters, mode]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function saveExpense(event: React.FormEvent) {
    event.preventDefault();
    if (editingExpenseId ? !canEdit : !canCreate) return;
    setMessage("");
    try {
      const payload = {
        ...form,
        branchId: form.branchId || null,
        categoryId: form.categoryId || null,
        dueDate: form.dueDate || null,
        receiptUrl: form.receiptUrl || null,
      };
      if (editingExpenseId) {
        await updateTenantExpense(editingExpenseId, payload);
        setEditingExpenseId(null);
        setMessage(actions.updated);
      } else {
        await createTenantExpense(payload);
        setMessage(t.saved);
      }
      setForm((current) => ({
        ...current,
        title: "",
        amount: "",
        vendorName: "",
        invoiceNumber: "",
        notes: "",
        receiptUrl: "",
      }));
      await load();
    } catch {
      setMessage(t.loadError);
    }
  }

  function startEdit(expense: TenantExpense) {
    setMessage("");
    setEditingExpenseId(expense.id);
    setForm({
      title: expense.title,
      amount: expense.amount,
      currency: expense.currency,
      expenseDate: expense.expenseDate,
      dueDate: expense.dueDate ?? "",
      categoryId: expense.categoryId ?? "",
      branchId: expense.branchId ?? "",
      paymentMethod: expense.paymentMethod,
      status: expense.status,
      vendorName: expense.vendorName ?? "",
      invoiceNumber: expense.invoiceNumber ?? "",
      notes: expense.notes ?? "",
      receiptUrl: expense.receiptUrl ?? "",
      recurring: expense.status === "RECURRING",
    });
  }

  async function removeExpense(expenseId: string) {
    if (!canDelete || !window.confirm(actions.confirmDelete)) return;
    setMessage("");
    try {
      await deleteTenantExpense(expenseId);
      if (editingExpenseId === expenseId) setEditingExpenseId(null);
      setMessage(actions.deleted);
      await load();
    } catch {
      setMessage(t.loadError);
    }
  }

  async function saveCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit) return;
    try {
      await createExpenseCategory(categoryForm);
      setCategoryForm({ name: "", color: "#0B2D5C", icon: "receipt" });
      setCategories(await listExpenseCategories());
    } catch {
      setMessage(t.loadError);
    }
  }

  async function uploadReceipt(file: File | undefined) {
    if (!file) return;
    try {
      const uploaded = await uploadExpenseReceipt(file);
      setForm((current) => ({ ...current, receiptUrl: uploaded.url }));
    } catch {
      setMessage(t.loadError);
    }
  }

  if (status === "loading")
    return <AdminState title={t.title} body={t.subtitle} />;
  if (status === "error")
    return <AdminState title={t.title} body={t.loadError} />;

  return (
    <div className="space-y-5">
      <Tabs mode={mode} />

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
        <Kpi
          label={t.totalExpenses}
          value={money(overview?.cards.totalExpenses ?? 0, currency)}
          tone="red"
        />
        <Kpi
          label={t.paidExpenses}
          value={money(overview?.cards.paidExpenses ?? 0, currency)}
          tone="green"
        />
        <Kpi
          label={t.pendingExpenses}
          value={money(overview?.cards.pendingExpenses ?? 0, currency)}
          tone="amber"
        />
        <Kpi
          label={t.monthlyExpenses}
          value={money(overview?.cards.monthlyExpenses ?? 0, currency)}
        />
        <Kpi
          label={t.yearlyExpenses}
          value={money(overview?.cards.yearlyExpenses ?? 0, currency)}
        />
        <Kpi
          label={t.netProfit}
          value={money(overview?.cards.netProfit ?? 0, currency)}
          tone={Number(overview?.cards.netProfit ?? 0) >= 0 ? "green" : "red"}
        />
        <Kpi
          label={t.unpaidAlerts}
          value={formatNumber(overview?.cards.unpaidExpenseAlerts ?? 0)}
          tone="amber"
        />
      </div>

      {(mode === "overview" || mode === "reports") && overview ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-black text-[#0B2D5C]">
              {t.revenueVsExpenses}
            </h2>
            <Bars
              currency={currency}
              empty={t.empty}
              rows={overview.charts.revenueVsExpenses.map((row) => ({
                label: row.key,
                value: row.amount,
                color:
                  row.key === "EXPENSES"
                    ? "#EF4444"
                    : row.key === "NET_PROFIT"
                      ? "#10B981"
                      : "#2563EB",
              }))}
            />
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-black text-[#0B2D5C]">
              {t.categoryBreakdown}
            </h2>
            <Bars
              currency={currency}
              empty={t.empty}
              rows={overview.charts.categoryBreakdown.map((row) => ({
                label: row.name,
                value: row.amount,
                color: row.color,
              }))}
            />
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-black text-[#0B2D5C]">
              {t.branchComparison}
            </h2>
            <Bars
              currency={currency}
              empty={t.empty}
              rows={overview.charts.branchComparison.map((row) => ({
                label: row.name,
                value: row.amount,
              }))}
            />
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-black text-[#0B2D5C]">
              {t.insights}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Kpi
                label={t.highestCategory}
                value={
                  overview.insights.highestExpenseCategory
                    ? money(
                        overview.insights.highestExpenseCategory.amount,
                        currency,
                      )
                    : t.empty
                }
              />
              <Kpi
                label={t.budgetBranch}
                value={
                  overview.insights.branchConsumingMostBudget
                    ? money(
                        overview.insights.branchConsumingMostBudget.amount,
                        currency,
                      )
                    : t.empty
                }
              />
              <Kpi
                label={t.marketingSpend}
                value={money(overview.insights.marketingSpend, currency)}
              />
              <Kpi
                label={t.payrollRatio}
                value={`${overview.insights.payrollRatio}%`}
              />
            </div>
          </section>
        </div>
      ) : null}

      {mode === "list" ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {message ? (
            <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
              {message}
            </p>
          ) : null}
          <div className="mb-4 grid gap-3 md:grid-cols-5">
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
              placeholder={t.search}
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="ALL">{t.allStatuses}</option>
              {(
                ["PAID", "PENDING", "RECURRING", "CANCELLED"] as ExpenseStatus[]
              ).map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s, locale)}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={filters.categoryId}
              onChange={(e) =>
                setFilters({ ...filters, categoryId: e.target.value })
              }
            >
              <option value="ALL">{t.allCategories}</option>
              {options?.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={filters.branchId}
              onChange={(e) =>
                setFilters({ ...filters, branchId: e.target.value })
              }
            >
              <option value="ALL">{t.allBranches}</option>
              {options?.branches.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                  title={formatBranchLabel(branch, locale)}
                >
                  {formatBranchLabel(branch, locale)}
                </option>
              ))}
            </select>
          </div>
          {items.length ? (
            <div className="grid gap-3">
              {items.map((expense) => (
                <article
                  key={expense.id}
                  className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1.4fr_1fr_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-black text-[#0B2D5C]">
                        {expense.title}
                      </h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-bold ${statusClass(expense.status)}`}
                      >
                        {statusLabel(expense.status, locale)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {expense.category?.name ?? t.allCategories} ·{" "}
                      {expense.vendorName ||
                        expense.branch?.name ||
                        t.allBranches}
                    </p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p className="font-black text-slate-950" dir="ltr">
                      {money(expense.amount, expense.currency)}
                    </p>
                    <p>
                      {formatDate(expense.expenseDate, locale)} ·{" "}
                      {methodLabel(expense.paymentMethod, locale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {expense.receiptUrl ? (
                      <Link
                        className={buttonClassName("secondary")}
                        href={expense.receiptUrl}
                        target="_blank"
                      >
                        PDF
                      </Link>
                    ) : null}
                    {canEdit ? (
                      <button
                        className={buttonClassName("secondary")}
                        onClick={() => startEdit(expense)}
                        type="button"
                      >
                        {actions.edit}
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        className={buttonClassName("danger")}
                        onClick={() => void removeExpense(expense.id)}
                        type="button"
                      >
                        {actions.delete}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <AdminState title={t.all} body={t.empty} />
          )}
        </section>
      ) : null}

      {mode === "new" || editingExpenseId ? (
        <form
          onSubmit={saveExpense}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">
              {t.titleField}
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              {t.amount}
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              {t.date}
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.expenseDate}
                onChange={(e) =>
                  setForm({ ...form, expenseDate: e.target.value })
                }
                required
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              {t.dueDate}
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              {t.category}
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
              >
                <option value="">{t.allCategories}</option>
                {options?.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              {t.branch}
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              >
                <option value="">{t.allBranches}</option>
                {options?.branches.map((b) => (
                  <option key={b.id} value={b.id} title={formatBranchLabel(b, locale)}>
                    {formatBranchLabel(b, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              {t.paymentMethod}
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({
                    ...form,
                    paymentMethod: e.target.value as ExpensePaymentMethod,
                  })
                }
              >
                {(
                  [
                    "CASH",
                    "BANK_TRANSFER",
                    "CHECK",
                    "OTHER",
                  ] as ExpensePaymentMethod[]
                ).map((m) => (
                  <option key={m} value={m}>
                    {methodLabel(m, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              {t.status}
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as ExpenseStatus })
                }
              >
                {(
                  [
                    "PAID",
                    "PENDING",
                    "RECURRING",
                    "CANCELLED",
                  ] as ExpenseStatus[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              {t.supplier}
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.vendorName}
                onChange={(e) =>
                  setForm({ ...form, vendorName: e.target.value })
                }
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              {t.invoiceNumber}
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.invoiceNumber}
                onChange={(e) =>
                  setForm({ ...form, invoiceNumber: e.target.value })
                }
              />
            </label>
            <label className="text-sm font-bold text-slate-700 md:col-span-2">
              {t.notes}
              <textarea
                className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
            <label className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-700 md:col-span-2">
              {t.receipt}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="mt-2 block w-full text-sm"
                onChange={(e) => void uploadReceipt(e.target.files?.[0])}
              />
              {form.receiptUrl ? (
                <span className="mt-2 block text-xs text-emerald-700">
                  {form.receiptUrl}
                </span>
              ) : null}
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(e) =>
                  setForm({ ...form, recurring: e.target.checked })
                }
              />
              {t.recurring}
            </label>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              className={buttonClassName("primary")}
              disabled={editingExpenseId ? !canEdit : !canCreate}
            >
              {editingExpenseId ? actions.update : t.save}
            </button>
            {editingExpenseId ? (
              <button
                className={buttonClassName("secondary")}
                onClick={() => setEditingExpenseId(null)}
                type="button"
              >
                {actions.cancelEdit}
              </button>
            ) : null}
            {message ? (
              <p className="text-sm font-semibold text-slate-600">{message}</p>
            ) : null}
          </div>
        </form>
      ) : null}

      {mode === "categories" ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {canEdit ? (
            <form
              onSubmit={saveCategory}
              className="mb-4 grid gap-3 md:grid-cols-[1fr_160px_auto]"
            >
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder={t.name}
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                required
              />
              <input
                type="color"
                className="h-10 rounded-lg border border-slate-200 px-2"
                value={categoryForm.color}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, color: e.target.value })
                }
              />
              <button className={buttonClassName("primary")}>
                {t.addCategory}
              </button>
            </form>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <article
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <p className="font-black text-[#0B2D5C]">{category.name}</p>
                    <p className="text-xs text-slate-500">
                      {category.isActive ? t.active : actions.inactive}
                    </p>
                  </div>
                </div>
                {canEdit ? (
                  <button
                    className="text-xs font-bold text-[#0B2D5C]"
                    onClick={() =>
                      void updateExpenseCategory(category.id, {
                        isActive: !category.isActive,
                      }).then(() => load())
                    }
                  >
                    {category.isActive ? actions.disable : actions.enable}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
