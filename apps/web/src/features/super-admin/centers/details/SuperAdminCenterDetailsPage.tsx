"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { buttonClassName } from "@/components/ui/button-styles";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/i18n/formatters";
import type { SupportedLocale } from "@/i18n/locales";
import { SuperAdminLayout } from "@/features/super-admin/layout/SuperAdminLayout";
import {
  ApiRequestError,
  createCenterStaff,
  createCenterInternalNote,
  getSuperAdminCenter,
  listCenterStaff,
  listCenterInternalNotes,
  resetCenterStaffPassword,
  updateCenterStaff,
  updateCenterStaffStatus,
  updateSuperAdminCenter,
  updateSuperAdminCenterSubscription,
  updateSuperAdminCenterStatus,
  type ApiCenter,
  type ApiCenterInternalNote,
  type ApiCenterStaffRole,
  type ApiCenterStaffStatus,
  type ApiCenterStaffUser,
  type ApiCenterStatus,
  type ApiCenterType,
  type ApiLanguage,
  type UpdateCenterPayload,
  type UpdateCenterSubscriptionPayload,
} from "@/lib/api/super-admin-centers";
import {
  getCurrentSuperAdminPermissions,
  hasPlatformPermission,
} from "@/lib/api/super-admin-permissions";
import { superAdminCenterDetailsDictionaries } from "@/i18n/dictionaries/super-admin-center-details";

type Dictionary = (typeof superAdminCenterDetailsDictionaries)["en"];
type CenterStatus = keyof Dictionary["statuses"];
type ManualPlanKey = keyof Dictionary["manualPlans"];
type ManualSubscriptionStatusKey = keyof Dictionary["subscriptionStatuses"];
type ActivityTimelineKey = keyof Dictionary["timeline"];
type ActivityTimelineItem = {
  date: string;
  key: ActivityTimelineKey;
};
type CenterDetails = {
  accountStatus: keyof Dictionary["accountStatuses"];
  adminEmail: string;
  adminMobile: string;
  adminName: string;
  activityTimeline: ActivityTimelineItem[];
  apiStatus: ApiCenterStatus;
  apiType: ApiCenterType;
  autoRenewal: boolean;
  centerName: string;
  centerTypeKey: keyof Dictionary["centerTypes"];
  createdDate: string;
  customDomain: string;
  defaultLanguage: "ar" | "he" | "en";
  domainStatus: keyof Dictionary["domainStatuses"];
  domainStatusApi: NonNullable<UpdateCenterPayload["domain"]>["status"];
  domainTypeApi: NonNullable<UpdateCenterPayload["domain"]>["type"];
  enabledLanguages: ReadonlyArray<"ar" | "he" | "en">;
  expiryDate: string;
  lastLogin: string;
  logoInitials: string;
  ownerName: string;
  permissionsPreset: keyof Dictionary["permissionPresets"];
  planCode: string;
  planName: string;
  primaryColor: string;
  secondaryColor: string;
  servicesOffered: ReadonlyArray<keyof Dictionary["services"]>;
  startDate: string;
  status: CenterStatus;
  subscriptionStatus: NonNullable<
    UpdateCenterPayload["subscription"]
  >["status"];
  nextRenewalDate: string;
  billingNotes: string;
  subdomain: string;
  updatedDate: string;
};
type EditFormState = {
  adminEmail: string;
  adminName: string;
  adminPhone: string;
  centerName: string;
  centerType: ApiCenterType;
  defaultLanguage: "ar" | "he" | "en";
  domain: string;
  expiryDate: string;
  planCode: string;
  planName: string;
  startDate: string;
  status: ApiCenterStatus;
};
type FieldErrors = Partial<Record<keyof EditFormState, string>>;
type LoadStatus = "loading" | "success" | "notFound" | "error";
type LoadState = {
  center: CenterDetails | null;
  centerId: string;
  status: LoadStatus;
};
type NotesLoadStatus = "loading" | "success" | "error";
type NotesState = {
  centerId: string;
  notes: ApiCenterInternalNote[];
  status: NotesLoadStatus;
};
type StaffLoadStatus = "loading" | "success" | "error";
type StaffState = {
  centerId: string;
  staff: ApiCenterStaffUser[];
  status: StaffLoadStatus;
};
type StaffFormState = {
  email: string;
  fullName: string;
  phone: string;
  role: ApiCenterStaffRole;
  status: ApiCenterStaffStatus;
  temporaryPassword: string;
};
type StaffErrors = Partial<Record<keyof StaffFormState, string>>;
type StatusAction = "ACTIVE" | "SUSPENDED" | "CANCELLED";
type StatusActionState = {
  reason: string;
  status: StatusAction;
} | null;
type SubscriptionFormState = {
  billingNotes: string;
  nextRenewalDate: string;
  subscriptionEndDate: string;
  subscriptionPlan: "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE";
  subscriptionStartDate: string;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "EXPIRED" | "OVERDUE" | "CANCELLED";
};
type SubscriptionErrors = Partial<Record<keyof SubscriptionFormState, string>>;

function mapApiStatus(status: ApiCenterStatus): CenterStatus {
  if (status === "ACTIVE") {
    return "active";
  }

  if (
    status === "SUSPENDED" ||
    status === "CANCELLED" ||
    status === "ARCHIVED"
  ) {
    return "suspended";
  }

  if (status === "PAST_DUE") {
    return "expired";
  }

  return "trial";
}

function mapApiLanguage(language: ApiLanguage) {
  return language.toLowerCase() as "ar" | "he" | "en";
}

const languageApiMap: Record<"ar" | "he" | "en", ApiLanguage> = {
  ar: "AR",
  en: "EN",
  he: "HE",
};

function mapApiCenterType(
  type: ApiCenter["type"],
): CenterDetails["centerTypeKey"] {
  if (type === "BEAUTY") {
    return "beautyCenter";
  }

  if (type === "WELLNESS") {
    return "wellnessCenter";
  }

  if (type === "MULTI_SPECIALTY") {
    return "multiSpecialtyCenter";
  }

  return "medicalCenter";
}

function mapManualPlan(planCode?: string) {
  const upperPlan = planCode?.toUpperCase();

  if (
    upperPlan === "BASIC" ||
    upperPlan === "STANDARD" ||
    upperPlan === "PREMIUM" ||
    upperPlan === "ENTERPRISE"
  ) {
    return upperPlan;
  }

  if (upperPlan === "PROFESSIONAL") {
    return "PREMIUM";
  }

  return "BASIC";
}

function mapManualPlanKey(planCode?: string): ManualPlanKey {
  return mapManualPlan(planCode).toLowerCase() as ManualPlanKey;
}

function mapManualSubscriptionStatus(status?: string) {
  if (status === "ACTIVE") {
    return "ACTIVE";
  }

  if (status === "EXPIRED") {
    return "EXPIRED";
  }

  if (status === "PAST_DUE" || status === "SUSPENDED") {
    return "OVERDUE";
  }

  if (status === "CANCELLED") {
    return "CANCELLED";
  }

  return "TRIAL";
}

function mapManualSubscriptionStatusKey(
  status?: string,
): ManualSubscriptionStatusKey {
  return mapManualSubscriptionStatus(status).toLowerCase() as ManualSubscriptionStatusKey;
}

function getSubscriptionFormState(center: CenterDetails): SubscriptionFormState {
  return {
    billingNotes: center.billingNotes,
    nextRenewalDate: center.nextRenewalDate
      ? toDateInputValue(center.nextRenewalDate)
      : "",
    subscriptionEndDate: toDateInputValue(center.expiryDate),
    subscriptionPlan: mapManualPlan(center.planCode),
    subscriptionStartDate: toDateInputValue(center.startDate),
    subscriptionStatus: mapManualSubscriptionStatus(center.subscriptionStatus),
  };
}

function getSubscriptionWarning(center: CenterDetails) {
  if (center.subscriptionStatus === "PAST_DUE" || center.subscriptionStatus === "SUSPENDED") {
    return "overdue";
  }

  const now = new Date();
  const expiry = new Date(center.expiryDate);

  if (Number.isNaN(expiry.getTime())) {
    return null;
  }

  if (expiry < now || center.subscriptionStatus === "EXPIRED") {
    return "expired";
  }

  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
  );

  return daysUntilExpiry <= 30 ? "expiringSoon" : null;
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

function getEditFormState(center: CenterDetails): EditFormState {
  return {
    adminEmail: center.adminEmail === "-" ? "" : center.adminEmail,
    adminName: center.adminName === "-" ? "" : center.adminName,
    adminPhone: center.adminMobile === "-" ? "" : center.adminMobile,
    centerName: center.centerName,
    centerType: center.apiType,
    defaultLanguage: center.defaultLanguage,
    domain: center.customDomain,
    expiryDate: toDateInputValue(center.expiryDate),
    planCode: center.planCode,
    planName: center.planName,
    startDate: toDateInputValue(center.startDate),
    status: center.apiStatus,
  };
}

function getErrorText(value: unknown, locale: SupportedLocale) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const localizedMessage = (value as Record<string, unknown>)[locale];
    const message = localizedMessage
      ?? (value as { en?: unknown; message?: unknown }).en
      ?? (value as { message?: unknown }).message;

    if (typeof message === "string") {
      return message;
    }
  }

  return "";
}

function getFieldErrors(error: unknown, locale: SupportedLocale): FieldErrors {
  if (!(error instanceof ApiRequestError)) {
    return {};
  }

  const details = error.details;

  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const errors = (details as { errors?: unknown }).errors;

  if (!errors || typeof errors !== "object") {
    return {};
  }

  const source = errors as Record<string, unknown>;

  return {
    adminEmail: getErrorText(source.adminEmail, locale),
    adminName: getErrorText(source.adminName, locale),
    adminPhone: getErrorText(source.adminPhone, locale),
    centerName: getErrorText(source.centerName, locale),
    defaultLanguage: getErrorText(source.defaultLanguage, locale),
    domain: getErrorText(source.domain, locale),
    expiryDate: getErrorText(source.expiryDate, locale),
    planCode: getErrorText(source.subscriptionPlan, locale),
    startDate: getErrorText(source.startDate, locale),
  };
}

function getStaffErrors(error: unknown, locale: SupportedLocale): StaffErrors {
  if (!(error instanceof ApiRequestError)) {
    return {};
  }

  const details = error.details;

  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const errors = (details as { errors?: unknown }).errors;

  if (!errors || typeof errors !== "object") {
    return {};
  }

  const source = errors as Record<string, unknown>;

  return {
    email: getErrorText(source.email, locale),
    fullName: getErrorText(source.fullName, locale),
    phone: getErrorText(source.phone, locale),
    role: getErrorText(source.role, locale),
    status: getErrorText(source.status, locale),
    temporaryPassword: getErrorText(source.temporaryPassword, locale),
  };
}

function getStaffRoleKey(role: ApiCenterStaffRole) {
  const roleMap: Record<ApiCenterStaffRole, keyof Dictionary["staffRoles"]> = {
    ACCOUNTANT: "accountant",
    CENTER_MANAGER: "centerManager",
    CENTER_OWNER: "centerOwner",
    DOCTOR: "doctor",
    RECEPTIONIST: "receptionist",
    STAFF: "staff",
  };

  return roleMap[role];
}

function getStaffStatusKey(status: ApiCenterStaffStatus) {
  return status.toLowerCase() as keyof Dictionary["staffStatuses"];
}

function getEmptyStaffForm(): StaffFormState {
  return {
    email: "",
    fullName: "",
    phone: "",
    role: "STAFF",
    status: "ACTIVE",
    temporaryPassword: "",
  };
}

function getStaffForm(staff: ApiCenterStaffUser): StaffFormState {
  return {
    email: staff.email ?? "",
    fullName: staff.fullName,
    phone: staff.phone ?? "",
    role: staff.role,
    status: staff.status,
    temporaryPassword: "",
  };
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function buildActivityTimeline(center: ApiCenter): ActivityTimelineItem[] {
  const subscription = center.subscriptions?.[0];
  const domain = center.domains?.[0];
  const timeline: ActivityTimelineItem[] = [
    { key: "centerCreated", date: center.createdAt },
  ];

  if (subscription) {
    timeline.push({
      key: "subscriptionRenewed",
      date:
        subscription.updatedAt ??
        subscription.createdAt ??
        subscription.currentPeriodStart,
    });
  }

  if (domain?.status === "VERIFIED" || domain?.status === "ACTIVE") {
    timeline.push({
      key: "domainVerified",
      date: domain.updatedAt ?? domain.createdAt ?? center.updatedAt,
    });
  }

  if (center.userRoles?.[0]?.user || center.owner) {
    timeline.push({ key: "adminUpdated", date: center.updatedAt });
  }

  return timeline.sort(
    (first, second) =>
      new Date(second.date).getTime() - new Date(first.date).getTime(),
  );
}

function mapApiCenter(center: ApiCenter): CenterDetails {
  const subscription = center.subscriptions?.[0];
  const domain = center.domains?.[0];
  const adminUser = center.userRoles?.[0]?.user ?? center.owner;
  const enabledLanguages = Array.isArray(center.branding?.enabledLanguages)
    ? center.branding.enabledLanguages.map(mapApiLanguage)
    : [mapApiLanguage(center.primaryLanguage)];

  return {
    accountStatus: adminUser ? "active" : "pendingActivation",
    adminEmail: adminUser?.email ?? "-",
    adminMobile: adminUser?.phone ?? "-",
    adminName: adminUser?.fullName ?? "-",
    activityTimeline: buildActivityTimeline(center),
    apiStatus: center.status,
    apiType: center.type,
    autoRenewal: true,
    centerName: center.name,
    centerTypeKey: mapApiCenterType(center.type),
    createdDate: center.createdAt,
    customDomain: domain?.hostname ?? center.slug,
    defaultLanguage: mapApiLanguage(center.primaryLanguage),
    domainStatus:
      domain?.status === "VERIFIED" || domain?.status === "ACTIVE"
        ? "verified"
        : domain?.status === "FAILED"
          ? "failed"
          : "pending",
    domainStatusApi: domain?.status ?? "PENDING",
    domainTypeApi: domain?.type ?? "CUSTOM",
    enabledLanguages,
    expiryDate: subscription?.currentPeriodEnd ?? center.createdAt,
    lastLogin: center.createdAt,
    logoInitials: getInitials(center.name) || "RC",
    ownerName: center.owner?.fullName ?? center.owner?.email ?? "-",
    permissionsPreset: "standardManagement",
    planCode: subscription?.planCode ?? "trial",
    planName: subscription?.planName ?? mapManualPlan(subscription?.planCode),
    billingNotes: subscription?.billingNotes ?? "",
    primaryColor: center.branding?.primaryColor ?? "#0B2D5C",
    secondaryColor: center.branding?.secondaryColor ?? "#C8A45D",
    servicesOffered: ["other"],
    startDate: subscription?.currentPeriodStart ?? center.createdAt,
    status: mapApiStatus(center.status),
    subscriptionStatus: subscription?.status ?? "TRIALING",
    nextRenewalDate: subscription?.nextRenewalDate ?? "",
    subdomain: center.slug,
    updatedDate: center.updatedAt,
  };
}

function getCenterName(center: CenterDetails) {
  return center.centerName;
}

function getOwnerName(center: CenterDetails) {
  return center.ownerName;
}

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: CenterStatus;
}) {
  const styles: Record<CenterStatus, string> = {
    active: "border-[#0B2D5C]/15 bg-[#0B2D5C]/8 text-[#0B2D5C]",
    trial: "border-[#C8A45D]/30 bg-[#C8A45D]/12 text-[#7A5C20]",
    expired: "border-rose-200 bg-rose-50 text-rose-700",
    suspended: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${styles[status]}`}
    >
      {label}
    </span>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#0B2D5C]">{title}</h3>
      </div>
      <div className="min-w-0 p-5">{children}</div>
    </section>
  );
}

function DetailList({ items }: { items: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3"
          key={label}
        >
          <dt className="text-xs font-medium text-[#66758a]">{label}</dt>
          <dd className="mt-1 min-w-0 break-words text-sm font-semibold text-[#24364f]">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ColorValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3">
      <span
        aria-label={label}
        className="h-8 w-8 shrink-0 rounded-md border border-[#E5E7EB]"
        style={{ backgroundColor: value }}
      />
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#66758a]">{label}</p>
        <p className="truncate text-sm font-semibold text-[#24364f]">
          {value.toUpperCase()}
        </p>
      </div>
    </div>
  );
}

function FormField({
  error,
  label,
  children,
}: {
  error?: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-medium text-[#24364f]">{label}</span>
      <div className="mt-2">{children}</div>
      {error ? (
        <p className="mt-1 text-xs font-medium text-[#B42318]">{error}</p>
      ) : null}
    </label>
  );
}

const inputClassName =
  "min-h-11 w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12";

function LogoMark({
  center,
  dictionary,
  size = "lg",
}: {
  center: CenterDetails;
  dictionary: Dictionary;
  size?: "lg" | "sm";
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg border border-[#C8A45D]/40 bg-[#0B2D5C] font-semibold text-[#C8A45D] ${
        size === "lg" ? "h-20 w-20 text-xl" : "h-14 w-14 text-base"
      }`}
      title={dictionary.fields.logo}
    >
      {center.logoInitials || dictionary.values.noLogo}
    </div>
  );
}

export function SuperAdminCenterDetailsPage({
  centerId,
}: {
  centerId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const dictionary = superAdminCenterDetailsDictionaries[locale];
  const isEditMode = searchParams.get("mode") === "edit";
  const [loadState, setLoadState] = useState<LoadState>({
    center: null,
    centerId,
    status: "loading",
  });
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [notesState, setNotesState] = useState<NotesState>({
    centerId,
    notes: [],
    status: "loading",
  });
  const [staffState, setStaffState] = useState<StaffState>({
    centerId,
    staff: [],
    status: "loading",
  });
  const [staffForm, setStaffForm] = useState<StaffFormState | null>(null);
  const [staffEditingId, setStaffEditingId] = useState<string | null>(null);
  const [staffErrors, setStaffErrors] = useState<StaffErrors>({});
  const [staffSaveStatus, setStaffSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [pendingStaffPasswordReset, setPendingStaffPasswordReset] =
    useState<ApiCenterStaffUser | null>(null);
  const [staffPasswordResetResult, setStaffPasswordResetResult] = useState<{
    fullName: string;
    temporaryPassword: string;
  } | null>(null);
  const [hasCopiedStaffPassword, setHasCopiedStaffPassword] = useState(false);
  const [hasCopiedLoginLink, setHasCopiedLoginLink] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteError, setNoteError] = useState("");
  const [noteSaveStatus, setNoteSaveStatus] = useState<
    "idle" | "saving" | "error"
  >("idle");
  const [statusAction, setStatusAction] = useState<StatusActionState>(null);
  const [statusError, setStatusError] = useState("");
  const [statusSaveStatus, setStatusSaveStatus] = useState<
    "idle" | "saving" | "error"
  >("idle");
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionForm, setSubscriptionForm] =
    useState<SubscriptionFormState | null>(null);
  const [subscriptionErrors, setSubscriptionErrors] =
    useState<SubscriptionErrors>({});
  const [subscriptionSaveStatus, setSubscriptionSaveStatus] = useState<
    "idle" | "saving" | "error"
  >("idle");
  const [permissions, setPermissions] = useState<string[]>([]);
  const isCurrentCenter = loadState.centerId === centerId;
  const center = isCurrentCenter ? loadState.center : null;
  const loadStatus = isCurrentCenter ? loadState.status : "loading";
  const canEditCenter = hasPlatformPermission(permissions, "edit:centers");
  const canManageStatus = hasPlatformPermission(permissions, "suspend:centers");
  const canManageSubscriptions = hasPlatformPermission(
    permissions,
    "manage:subscriptions",
  );
  const canViewInternalNotes = hasPlatformPermission(
    permissions,
    "view:internal_notes",
  );
  const canManageInternalNotes = hasPlatformPermission(
    permissions,
    "manage:internal_notes",
  );
  const canViewStaffUsers = hasPlatformPermission(permissions, "view:users");
  const canManageStaffUsers = hasPlatformPermission(permissions, "manage:users");

  useEffect(() => {
    let isMounted = true;

    getCurrentSuperAdminPermissions()
      .then((response) => {
        if (isMounted) {
          setPermissions(response.permissions);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          console.error(
            "[RoyalCare center details] failed to load permissions",
            error,
          );
          setPermissions([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    getSuperAdminCenter(centerId)
      .then((response) => {
        if (isMounted) {
          setLoadState({
            center: mapApiCenter(response),
            centerId,
            status: "success",
          });
          setEditForm(null);
          setFieldErrors({});
          setSaveStatus("idle");
          setSubscriptionForm(null);
          setSubscriptionErrors({});
          setSubscriptionSaveStatus("idle");
          setHasCopiedLoginLink(false);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          if (error instanceof ApiRequestError && error.status === 404) {
            setLoadState({ center: null, centerId, status: "notFound" });
            return;
          }

          console.error("[RoyalCare center details] failed to load center", {
            centerId,
            error,
            message: error instanceof Error ? error.message : String(error),
            status: error instanceof ApiRequestError ? error.status : undefined,
          });
          setLoadState({ center: null, centerId, status: "error" });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [centerId]);

  useEffect(() => {
    let isMounted = true;

    if (!canViewInternalNotes) {
      return () => {
        isMounted = false;
      };
    }

    listCenterInternalNotes(centerId)
      .then((response) => {
        if (isMounted) {
          setNotesState({
            centerId,
            notes: response.data,
            status: "success",
          });
          setNoteText("");
          setNoteError("");
          setNoteSaveStatus("idle");
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          console.error("[RoyalCare center details] failed to load notes", {
            centerId,
            error,
            message: error instanceof Error ? error.message : String(error),
            status: error instanceof ApiRequestError ? error.status : undefined,
          });
          setNotesState({ centerId, notes: [], status: "error" });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [canViewInternalNotes, centerId]);

  useEffect(() => {
    let isMounted = true;

    if (!canViewStaffUsers) {
      return () => {
        isMounted = false;
      };
    }

    listCenterStaff(centerId)
      .then((response) => {
        if (isMounted) {
          setStaffState({
            centerId,
            staff: response.data,
            status: "success",
          });
          setStaffForm(null);
          setStaffEditingId(null);
          setStaffErrors({});
          setStaffSaveStatus("idle");
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          console.error("[RoyalCare center details] failed to load staff", {
            centerId,
            error,
            message: error instanceof Error ? error.message : String(error),
            status: error instanceof ApiRequestError ? error.status : undefined,
          });
          setStaffState({ centerId, staff: [], status: "error" });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [canViewStaffUsers, centerId]);

  if (loadStatus === "loading") {
    return (
      <SuperAdminLayout activeNav="centers" dictionary={dictionary}>
        <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
          <p className="text-sm font-medium text-[#66758a]">
            {dictionary.values.loadingTitle}
          </p>
        </section>
      </SuperAdminLayout>
    );
  }

  if (loadStatus === "notFound" || !center) {
    return (
      <SuperAdminLayout activeNav="centers" dictionary={dictionary}>
        <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_12px_30px_rgba(11,45,92,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
            {dictionary.header.eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#0B2D5C]">
            {loadStatus === "error"
              ? dictionary.values.errorTitle
              : dictionary.values.notFoundTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66758a]">
            {loadStatus === "error"
              ? dictionary.values.errorDescription
              : dictionary.values.notFoundDescription}
          </p>
          <Link
            className={buttonClassName(
              "secondary",
              "md",
              "mt-5 w-full sm:w-auto",
            )}
            href="/super-admin/centers"
          >
            {dictionary.actions.backToCenters}
          </Link>
        </section>
      </SuperAdminLayout>
    );
  }

  const serviceLabels = center.servicesOffered
    .map((service) => dictionary.services[service])
    .join(", ");
  const enabledLanguages = center.enabledLanguages
    .map((language) => dictionary.languages[language])
    .join(", ");
  const currentEditForm = editForm ?? getEditFormState(center);
  const updateEditField = (field: keyof EditFormState, value: string) => {
    setEditForm((current) => ({
      ...(current ?? getEditFormState(center)),
      [field]: value,
    }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSaveStatus("idle");
  };
  const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveStatus("saving");
    setFieldErrors({});

    const payload: UpdateCenterPayload = {
      admin: {
        email: currentEditForm.adminEmail,
        fullName: currentEditForm.adminName,
        phone: currentEditForm.adminPhone,
      },
      centerName: currentEditForm.centerName,
      domain: {
        hostname: currentEditForm.domain,
        isPrimary: true,
        status: center.domainStatusApi,
        type: center.domainTypeApi,
      },
      primaryLanguage: languageApiMap[currentEditForm.defaultLanguage],
      status: currentEditForm.status,
      subscription: {
        billingInterval: "MONTHLY",
        currentPeriodEnd: currentEditForm.expiryDate,
        currentPeriodStart: currentEditForm.startDate,
        planCode: currentEditForm.planCode,
        planName: currentEditForm.planName,
        status: center.subscriptionStatus,
      },
      type: currentEditForm.centerType,
    };

    try {
      const updatedCenter = await updateSuperAdminCenter(centerId, payload);
      setLoadState({
        center: mapApiCenter(updatedCenter),
        centerId,
        status: "success",
      });
      setSaveStatus("saved");
      router.replace(`/super-admin/centers/${centerId}`);
    } catch (error) {
      setFieldErrors(getFieldErrors(error, locale));
      setSaveStatus("error");
    }
  };
  const notes =
    notesState.centerId === centerId && notesState.status === "success"
      ? notesState.notes
      : [];
  const notesStatus =
    notesState.centerId === centerId ? notesState.status : "loading";
  const staffUsers =
    staffState.centerId === centerId && staffState.status === "success"
      ? staffState.staff
      : [];
  const staffStatus =
    staffState.centerId === centerId ? staffState.status : "loading";
  const currentStaffForm = staffForm ?? getEmptyStaffForm();
  const refreshStaff = async () => {
    if (!canViewStaffUsers) {
      return;
    }

    const response = await listCenterStaff(centerId);
    setStaffState({ centerId, staff: response.data, status: "success" });
  };
  const openStaffForm = (staff?: ApiCenterStaffUser) => {
    if (!canManageStaffUsers) {
      return;
    }

    setStaffForm(staff ? getStaffForm(staff) : getEmptyStaffForm());
    setStaffEditingId(staff?.id ?? null);
    setStaffErrors({});
    setStaffSaveStatus("idle");
  };
  const updateStaffField = (field: keyof StaffFormState, value: string) => {
    setStaffForm((current) => ({
      ...(current ?? getEmptyStaffForm()),
      [field]: value,
    }));
    setStaffErrors((current) => ({ ...current, [field]: undefined }));
    setStaffSaveStatus("idle");
  };
  const closeStaffForm = () => {
    setStaffForm(null);
    setStaffEditingId(null);
    setStaffErrors({});
    setStaffSaveStatus("idle");
  };
  const submitStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManageStaffUsers || !staffForm) {
      return;
    }

    setStaffSaveStatus("saving");
    setStaffErrors({});

    try {
      if (staffEditingId) {
        await updateCenterStaff(centerId, staffEditingId, {
          email: currentStaffForm.email,
          fullName: currentStaffForm.fullName,
          phone: currentStaffForm.phone,
          role: currentStaffForm.role,
          status: currentStaffForm.status,
        });
      } else {
        await createCenterStaff(centerId, {
          email: currentStaffForm.email,
          fullName: currentStaffForm.fullName,
          phone: currentStaffForm.phone,
          role: currentStaffForm.role,
          status: currentStaffForm.status,
        });
      }

      await refreshStaff();
      closeStaffForm();
      setStaffSaveStatus("saved");
    } catch (error) {
      setStaffErrors(getStaffErrors(error, locale));
      setStaffSaveStatus("error");
    }
  };
  const changeStaffStatus = async (
    userId: string,
    status: ApiCenterStaffStatus,
  ) => {
    if (!canManageStaffUsers) {
      return;
    }

    setStaffSaveStatus("saving");

    try {
      await updateCenterStaffStatus(centerId, userId, status);
      await refreshStaff();
      setStaffSaveStatus("saved");
    } catch (error) {
      setStaffErrors(getStaffErrors(error, locale));
      setStaffSaveStatus("error");
    }
  };
  const resetStaffPassword = async () => {
    if (!canManageStaffUsers) {
      return;
    }

    const staff = pendingStaffPasswordReset;

    if (!staff) {
      return;
    }

    setStaffSaveStatus("saving");

    try {
      const response = await resetCenterStaffPassword(centerId, staff.id);
      await refreshStaff();
      setPendingStaffPasswordReset(null);
      setStaffPasswordResetResult({
        fullName: staff.fullName,
        temporaryPassword: response.temporaryPassword,
      });
      setHasCopiedStaffPassword(false);
      setStaffSaveStatus("idle");
    } catch (error) {
      setStaffErrors(getStaffErrors(error, locale));
      setStaffSaveStatus("error");
    }
  };
  const copyStaffTemporaryPassword = async () => {
    if (!staffPasswordResetResult) {
      return;
    }

    await navigator.clipboard.writeText(
      staffPasswordResetResult.temporaryPassword,
    );
    setHasCopiedStaffPassword(true);
  };
  const submitNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNoteError("");

    if (!canManageInternalNotes) {
      return;
    }

    if (!noteText.trim()) {
      setNoteError(dictionary.values.noteSaveError);
      return;
    }

    setNoteSaveStatus("saving");

    try {
      const savedNote = await createCenterInternalNote(centerId, noteText);
      setNotesState((current) => ({
        centerId,
        notes:
          current.centerId === centerId
            ? [savedNote, ...current.notes]
            : [savedNote],
        status: "success",
      }));
      setNoteText("");
      setNoteSaveStatus("idle");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const details = error.details;
        const errors =
          details && typeof details === "object" && "errors" in details
            ? (details as { errors?: Record<string, unknown> }).errors
            : undefined;
        const noteMessage = getErrorText(errors?.note, locale);

        if (noteMessage) {
          setNoteError(noteMessage);
        }
      }

      setNoteSaveStatus("error");
    }
  };
  const refreshNotes = async () => {
    if (!canViewInternalNotes) {
      return;
    }

    const response = await listCenterInternalNotes(centerId);
    setNotesState({ centerId, notes: response.data, status: "success" });
  };
  const startStatusAction = (status: StatusAction) => {
    if (!canManageStatus) {
      return;
    }

    setStatusAction({ reason: "", status });
    setStatusError("");
    setStatusSaveStatus("idle");
  };
  const submitStatusAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!statusAction || !canManageStatus) {
      return;
    }

    const reason = statusAction.reason.trim();

    if (
      (statusAction.status === "SUSPENDED" ||
        statusAction.status === "CANCELLED") &&
      !reason
    ) {
      setStatusError(dictionary.values.statusReason);
      return;
    }

    setStatusSaveStatus("saving");
    setStatusError("");

    try {
      const updatedCenter = await updateSuperAdminCenterStatus(centerId, {
        reason: reason || undefined,
        status: statusAction.status,
      });
      setLoadState({
        center: mapApiCenter(updatedCenter),
        centerId,
        status: "success",
      });
      await refreshNotes();
      setStatusAction(null);
      setStatusSaveStatus("idle");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const details = error.details;
        const errors =
          details && typeof details === "object" && "errors" in details
            ? (details as { errors?: Record<string, unknown> }).errors
            : undefined;
        const reasonMessage = getErrorText(errors?.reason, locale);
        const statusMessage = getErrorText(errors?.status, locale);

        setStatusError(
          reasonMessage || statusMessage || dictionary.values.statusError,
        );
      } else {
        setStatusError(dictionary.values.statusError);
      }

      setStatusSaveStatus("error");
    }
  };
  const subscriptionWarning = getSubscriptionWarning(center);
  const currentSubscriptionForm =
    subscriptionForm ?? getSubscriptionFormState(center);
  const centerSlug = center.subdomain.trim();
  const loginPath = centerSlug ? `/c/${centerSlug}/login` : "";
  const dedicatedLoginUrl =
    loginPath && typeof window !== "undefined"
      ? new URL(loginPath, window.location.origin).toString()
      : loginPath;
  const copyCenterLoginLink = async () => {
    if (!dedicatedLoginUrl || !navigator.clipboard?.writeText) {
      return;
    }

    await navigator.clipboard.writeText(dedicatedLoginUrl);
    setHasCopiedLoginLink(true);
    window.setTimeout(() => setHasCopiedLoginLink(false), 3500);
  };
  const openSubscriptionModal = () => {
    if (!canManageSubscriptions) {
      return;
    }

    setSubscriptionForm(getSubscriptionFormState(center));
    setSubscriptionErrors({});
    setSubscriptionSaveStatus("idle");
    setIsSubscriptionModalOpen(true);
  };
  const updateSubscriptionField = (
    field: keyof SubscriptionFormState,
    value: string,
  ) => {
    setSubscriptionForm((current) => ({
      ...(current ?? getSubscriptionFormState(center)),
      [field]: value,
    }));
    setSubscriptionErrors((current) => ({ ...current, [field]: undefined }));
    setSubscriptionSaveStatus("idle");
  };
  const submitSubscription = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManageSubscriptions) {
      return;
    }

    setSubscriptionSaveStatus("saving");
    setSubscriptionErrors({});

    const payload: UpdateCenterSubscriptionPayload = {
      billingNotes: currentSubscriptionForm.billingNotes,
      nextRenewalDate: currentSubscriptionForm.nextRenewalDate || undefined,
      subscriptionEndDate: currentSubscriptionForm.subscriptionEndDate,
      subscriptionPlan: currentSubscriptionForm.subscriptionPlan,
      subscriptionStartDate: currentSubscriptionForm.subscriptionStartDate,
      subscriptionStatus: currentSubscriptionForm.subscriptionStatus,
    };

    try {
      const updatedCenter = await updateSuperAdminCenterSubscription(
        centerId,
        payload,
      );
      setLoadState({
        center: mapApiCenter(updatedCenter),
        centerId,
        status: "success",
      });
      await refreshNotes();
      setIsSubscriptionModalOpen(false);
      setSubscriptionSaveStatus("idle");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const details = error.details;
        const errors =
          details && typeof details === "object" && "errors" in details
            ? (details as { errors?: Record<string, unknown> }).errors
            : undefined;

        setSubscriptionErrors({
          subscriptionEndDate: getErrorText(errors?.subscriptionDates, locale),
          subscriptionPlan: getErrorText(errors?.subscriptionPlan, locale),
          subscriptionStartDate: getErrorText(errors?.subscriptionDates, locale),
          subscriptionStatus: getErrorText(errors?.subscriptionStatus, locale),
        });
      }

      setSubscriptionSaveStatus("error");
    }
  };

  return (
    <SuperAdminLayout activeNav="centers" dictionary={dictionary}>
      <div className="min-w-0 max-w-full space-y-5">
        <section className="flex min-w-0 max-w-full flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(11,45,92,0.04)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <LogoMark center={center} dictionary={dictionary} />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C8A45D]">
                {dictionary.header.eyebrow}
              </p>
              <h2 className="mt-1 break-words text-xl font-semibold leading-snug text-[#0B2D5C]">
                {getCenterName(center)}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#66758a]">
                {dictionary.header.subtitle}
              </p>
            </div>
          </div>
          <Link
            className={buttonClassName("secondary", "md", "w-full sm:w-auto")}
            href="/super-admin/centers"
          >
            {dictionary.actions.backToCenters}
          </Link>
        </section>

        <Section title={dictionary.sections.centerLoginAccess}>
          {centerSlug && dedicatedLoginUrl ? (
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <DetailList
                items={[
                  [dictionary.fields.centerSlug, centerSlug],
                  [dictionary.fields.dedicatedLoginUrl, dedicatedLoginUrl],
                ]}
              />
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row lg:flex-col">
                <button
                  className={buttonClassName("primary", "md", "w-full")}
                  onClick={copyCenterLoginLink}
                  type="button"
                >
                  {hasCopiedLoginLink
                    ? dictionary.values.loginLinkCopied
                    : dictionary.actions.copyLoginLink}
                </button>
                <a
                  className={buttonClassName("secondary", "md", "w-full")}
                  href={dedicatedLoginUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {dictionary.actions.openLoginPage}
                </a>
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-[#F3B8B8] bg-[#FFF7F7] px-4 py-3 text-sm font-semibold text-[#B42318]">
              {dictionary.values.loginLinkUnavailable}
            </p>
          )}
        </Section>

        {isEditMode && canEditCenter ? (
          <Section title={dictionary.values.editTitle}>
            <form className="space-y-4" onSubmit={submitEdit}>
              <p className="text-sm leading-6 text-[#66758a]">
                {dictionary.values.editHelper}
              </p>
              {saveStatus === "saved" || saveStatus === "error" ? (
                <div
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    saveStatus === "saved"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {saveStatus === "saved"
                    ? dictionary.values.updateSuccess
                    : dictionary.values.updateError}
                </div>
              ) : null}
              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  error={fieldErrors.centerName}
                  label={dictionary.fields.centerName}
                >
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateEditField("centerName", event.target.value)
                    }
                    value={currentEditForm.centerName}
                  />
                </FormField>
                <FormField label={dictionary.fields.centerType}>
                  <select
                    className={inputClassName}
                    onChange={(event) =>
                      updateEditField("centerType", event.target.value)
                    }
                    value={currentEditForm.centerType}
                  >
                    <option value="LASER">{dictionary.services.laser}</option>
                    <option value="PHYSIOTHERAPY">
                      {dictionary.services.physiotherapy}
                    </option>
                    <option value="HIJAMA">
                      {dictionary.services.hijama}
                    </option>
                    <option value="BEAUTY">
                      {dictionary.centerTypes.beautyCenter}
                    </option>
                    <option value="WELLNESS">
                      {dictionary.centerTypes.wellnessCenter}
                    </option>
                    <option value="MULTI_SPECIALTY">
                      {dictionary.centerTypes.multiSpecialtyCenter}
                    </option>
                  </select>
                </FormField>
                <FormField
                  error={fieldErrors.defaultLanguage}
                  label={dictionary.fields.defaultLanguage}
                >
                  <select
                    className={inputClassName}
                    onChange={(event) =>
                      updateEditField("defaultLanguage", event.target.value)
                    }
                    value={currentEditForm.defaultLanguage}
                  >
                    <option value="en">{dictionary.languages.en}</option>
                    <option value="ar">{dictionary.languages.ar}</option>
                    <option value="he">{dictionary.languages.he}</option>
                  </select>
                </FormField>
                <FormField label={dictionary.fields.status}>
                  <select
                    className={inputClassName}
                    onChange={(event) =>
                      updateEditField("status", event.target.value)
                    }
                    value={currentEditForm.status}
                  >
                    <option value="TRIAL">{dictionary.statuses.trial}</option>
                    <option value="ACTIVE">{dictionary.statuses.active}</option>
                    <option value="PAST_DUE">
                      {dictionary.statuses.expired}
                    </option>
                    <option value="SUSPENDED">
                      {dictionary.statuses.suspended}
                    </option>
                  </select>
                </FormField>
                <FormField
                  error={fieldErrors.adminName}
                  label={dictionary.fields.adminName}
                >
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateEditField("adminName", event.target.value)
                    }
                    value={currentEditForm.adminName}
                  />
                </FormField>
                <FormField
                  error={fieldErrors.adminEmail}
                  label={dictionary.fields.email}
                >
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateEditField("adminEmail", event.target.value)
                    }
                    value={currentEditForm.adminEmail}
                  />
                </FormField>
                <FormField
                  error={fieldErrors.adminPhone}
                  label={dictionary.fields.mobile}
                >
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateEditField("adminPhone", event.target.value)
                    }
                    value={currentEditForm.adminPhone}
                  />
                </FormField>
                <FormField
                  error={fieldErrors.planCode}
                  label={dictionary.fields.subscriptionPlan}
                >
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateEditField("planCode", event.target.value)
                    }
                    value={currentEditForm.planCode}
                  />
                </FormField>
                <FormField label={dictionary.fields.subscriptionPlan}>
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateEditField("planName", event.target.value)
                    }
                    value={currentEditForm.planName}
                  />
                </FormField>
                <FormField
                  error={fieldErrors.startDate}
                  label={dictionary.fields.startDate}
                >
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateEditField("startDate", event.target.value)
                    }
                    type="date"
                    value={currentEditForm.startDate}
                  />
                </FormField>
                <FormField
                  error={fieldErrors.expiryDate}
                  label={dictionary.fields.expiryDate}
                >
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateEditField("expiryDate", event.target.value)
                    }
                    type="date"
                    value={currentEditForm.expiryDate}
                  />
                </FormField>
                <FormField
                  error={fieldErrors.domain}
                  label={dictionary.fields.domain}
                >
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateEditField("domain", event.target.value)
                    }
                    value={currentEditForm.domain}
                  />
                </FormField>
              </div>
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:justify-end">
                <Link
                  className={buttonClassName("secondary", "md", "w-full sm:w-auto")}
                  href={`/super-admin/centers/${centerId}`}
                >
                  {dictionary.actions.cancelEdit}
                </Link>
                <button
                  className={buttonClassName("primary", "md", "w-full sm:w-auto")}
                  disabled={saveStatus === "saving"}
                  type="submit"
                >
                  {saveStatus === "saving"
                    ? dictionary.values.saving
                    : dictionary.actions.saveChanges}
                </button>
              </div>
            </form>
          </Section>
        ) : null}

        {canManageSubscriptions ? (
          <Section title={dictionary.sections.subscriptionManagement}>
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <DetailList
                items={[
                  [
                    dictionary.fields.subscriptionPlan,
                    dictionary.manualPlans[mapManualPlanKey(center.planCode)],
                  ],
                  [
                    dictionary.fields.status,
                    dictionary.subscriptionStatuses[
                      mapManualSubscriptionStatusKey(center.subscriptionStatus)
                    ],
                  ],
                  [
                    dictionary.fields.startDate,
                    formatDate(center.startDate, locale),
                  ],
                  [
                    dictionary.fields.expiryDate,
                    formatDate(center.expiryDate, locale),
                  ],
                  [
                    dictionary.values.nextRenewalDate,
                    center.nextRenewalDate
                      ? formatDate(center.nextRenewalDate, locale)
                      : "-",
                  ],
                  [dictionary.values.billingNotes, center.billingNotes || "-"],
                ]}
              />
              <div className="flex min-w-0 flex-col gap-3">
                {subscriptionWarning ? (
                  <span className="inline-flex min-h-8 items-center rounded-full border border-[#C8A45D]/40 bg-[#C8A45D]/12 px-3 text-xs font-semibold text-[#7A5C20]">
                    {dictionary.values[subscriptionWarning]}
                  </span>
                ) : null}
                <button
                  className={buttonClassName("primary", "md", "w-full")}
                  onClick={openSubscriptionModal}
                  type="button"
                >
                  {dictionary.values.updateSubscription}
                </button>
              </div>
            </div>
          </Section>
        ) : null}

        {canViewStaffUsers ? (
          <Section title={dictionary.sections.staffUsers}>
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  {staffStatus === "loading" ? (
                    <p className="text-sm font-medium text-[#66758a]">
                      {dictionary.values.staffLoading}
                    </p>
                  ) : null}
                  {staffSaveStatus === "saved" ? (
                    <p className="text-sm font-medium text-emerald-700">
                      {dictionary.values.staffSaved}
                    </p>
                  ) : null}
                  {staffSaveStatus === "error" ? (
                    <p className="text-sm font-medium text-[#B42318]">
                      {dictionary.values.staffSaveError}
                    </p>
                  ) : null}
                </div>
                {canManageStaffUsers ? (
                  <button
                    className={buttonClassName(
                      "primary",
                      "md",
                      "w-full sm:w-auto",
                    )}
                    onClick={() => openStaffForm()}
                    type="button"
                  >
                    {dictionary.actions.addStaffUser}
                  </button>
                ) : null}
              </div>

              {staffForm ? (
                <form
                  className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-4"
                  onSubmit={submitStaff}
                >
                  <h4 className="text-sm font-semibold text-[#0B2D5C]">
                    {dictionary.values.staffFormTitle}
                  </h4>
                  <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      error={staffErrors.fullName}
                      label={dictionary.fields.fullName}
                    >
                      <input
                        className={inputClassName}
                        onChange={(event) =>
                          updateStaffField("fullName", event.target.value)
                        }
                        value={currentStaffForm.fullName}
                      />
                    </FormField>
                    <FormField
                      error={staffErrors.email}
                      label={dictionary.fields.email}
                    >
                      <input
                        className={inputClassName}
                        onChange={(event) =>
                          updateStaffField("email", event.target.value)
                        }
                        value={currentStaffForm.email}
                      />
                    </FormField>
                    <FormField
                      error={staffErrors.phone}
                      label={dictionary.fields.mobile}
                    >
                      <input
                        className={inputClassName}
                        onChange={(event) =>
                          updateStaffField("phone", event.target.value)
                        }
                        value={currentStaffForm.phone}
                      />
                    </FormField>
                    <FormField
                      error={staffErrors.role}
                      label={dictionary.fields.role}
                    >
                      <select
                        className={inputClassName}
                        onChange={(event) =>
                          updateStaffField("role", event.target.value)
                        }
                        value={currentStaffForm.role}
                      >
                        <option value="CENTER_OWNER">
                          {dictionary.staffRoles.centerOwner}
                        </option>
                        <option value="CENTER_MANAGER">
                          {dictionary.staffRoles.centerManager}
                        </option>
                        <option value="DOCTOR">
                          {dictionary.staffRoles.doctor}
                        </option>
                        <option value="RECEPTIONIST">
                          {dictionary.staffRoles.receptionist}
                        </option>
                        <option value="ACCOUNTANT">
                          {dictionary.staffRoles.accountant}
                        </option>
                        <option value="STAFF">
                          {dictionary.staffRoles.staff}
                        </option>
                      </select>
                    </FormField>
                    <FormField
                      error={staffErrors.status}
                      label={dictionary.fields.status}
                    >
                      <select
                        className={inputClassName}
                        onChange={(event) =>
                          updateStaffField("status", event.target.value)
                        }
                        value={currentStaffForm.status}
                      >
                        <option value="INVITED">
                          {dictionary.staffStatuses.invited}
                        </option>
                        <option value="ACTIVE">
                          {dictionary.staffStatuses.active}
                        </option>
                        <option value="INACTIVE">
                          {dictionary.staffStatuses.inactive}
                        </option>
                        <option value="SUSPENDED">
                          {dictionary.staffStatuses.suspended}
                        </option>
                      </select>
                    </FormField>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      className={buttonClassName(
                        "secondary",
                        "md",
                        "w-full sm:w-auto",
                      )}
                      onClick={closeStaffForm}
                      type="button"
                    >
                      {dictionary.actions.cancelEdit}
                    </button>
                    <button
                      className={buttonClassName(
                        "primary",
                        "md",
                        "w-full sm:w-auto",
                      )}
                      disabled={staffSaveStatus === "saving"}
                      type="submit"
                    >
                      {staffSaveStatus === "saving"
                        ? dictionary.values.staffSaving
                        : dictionary.actions.saveChanges}
                    </button>
                  </div>
                </form>
              ) : null}

              {staffStatus === "success" && staffUsers.length === 0 ? (
                <p className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3 text-sm font-medium text-[#66758a]">
                  {dictionary.values.staffEmpty}
                </p>
              ) : null}

              <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
                {staffUsers.map((staff) => (
                  <article
                    className="min-w-0 rounded-md border border-[#E5E7EB] bg-white p-4"
                    key={staff.id}
                  >
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-[#0B2D5C]">
                          {staff.fullName}
                        </p>
                        <p className="mt-1 break-words text-xs text-[#66758a]">
                          {staff.email}
                        </p>
                        <p className="mt-1 break-words text-xs text-[#66758a]">
                          {staff.phone}
                        </p>
                      </div>
                      <StatusBadge
                        label={
                          dictionary.staffStatuses[
                            getStaffStatusKey(staff.status)
                          ]
                        }
                        status={
                          staff.status === "ACTIVE" ? "active" : "suspended"
                        }
                      />
                    </div>
                    <dl className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="min-w-0 rounded-md bg-[#F8FAFC] px-3 py-2">
                        <dt className="text-xs font-medium text-[#66758a]">
                          {dictionary.fields.role}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-[#24364f]">
                          {dictionary.staffRoles[getStaffRoleKey(staff.role)]}
                        </dd>
                      </div>
                      <div className="min-w-0 rounded-md bg-[#F8FAFC] px-3 py-2">
                        <dt className="text-xs font-medium text-[#66758a]">
                          {dictionary.fields.createdDate}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-[#24364f]">
                          {formatDate(staff.createdAt, locale)}
                        </dd>
                      </div>
                    </dl>
                    {canManageStaffUsers ? (
                      <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <button
                          className={buttonClassName(
                            "secondary",
                            "sm",
                            "w-full sm:w-auto",
                          )}
                          onClick={() => openStaffForm(staff)}
                          type="button"
                        >
                          {dictionary.actions.editStaffUser}
                        </button>
                        <button
                          className={buttonClassName(
                            staff.status === "ACTIVE" ? "warning" : "success",
                            "sm",
                            "w-full sm:w-auto",
                          )}
                          onClick={() =>
                            changeStaffStatus(
                              staff.id,
                              staff.status === "ACTIVE"
                                ? "INACTIVE"
                                : "ACTIVE",
                            )
                          }
                          type="button"
                        >
                          {staff.status === "ACTIVE"
                            ? dictionary.actions.deactivateStaffUser
                            : dictionary.actions.activateStaffUser}
                        </button>
                        <button
                          className={buttonClassName(
                            "secondary",
                            "sm",
                            "w-full sm:w-auto",
                          )}
                          onClick={() => {
                            setPendingStaffPasswordReset(staff);
                            setStaffErrors({});
                            setStaffSaveStatus("idle");
                          }}
                          type="button"
                        >
                          {dictionary.actions.resetStaffPassword}
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>

              {staffStatus === "error" ? (
                <p className="text-xs leading-5 text-[#66758a]">
                  {dictionary.values.errorDescription}
                </p>
              ) : null}
            </div>
          </Section>
        ) : null}

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <Section title={dictionary.sections.overview}>
            <DetailList
              items={[
                [
                  dictionary.fields.centerName,
                  getCenterName(center),
                ],
                [dictionary.fields.ownerName, getOwnerName(center)],
                [
                  dictionary.fields.centerType,
                  dictionary.centerTypes[center.centerTypeKey],
                ],
                [dictionary.fields.servicesOffered, serviceLabels],
                [
                  dictionary.fields.status,
                  <StatusBadge
                    key="status"
                    label={dictionary.statuses[center.status]}
                    status={center.status}
                  />,
                ],
                [
                  dictionary.fields.subscriptionPlan,
                  dictionary.manualPlans[mapManualPlanKey(center.planCode)],
                ],
                [
                  dictionary.fields.startDate,
                  formatDate(center.startDate, locale),
                ],
                [
                  dictionary.fields.expiryDate,
                  formatDate(center.expiryDate, locale),
                ],
                [
                  dictionary.fields.autoRenewal,
                  center.autoRenewal
                    ? dictionary.values.enabled
                    : dictionary.values.disabled,
                ],
                [dictionary.fields.domain, center.customDomain],
                [
                  dictionary.fields.dnsVerificationStatus,
                  dictionary.domainStatuses[center.domainStatus],
                ],
                [
                  dictionary.fields.createdDate,
                  formatDate(center.createdDate, locale),
                ],
                [
                  dictionary.fields.updatedDate,
                  formatDate(center.updatedDate, locale),
                ],
              ]}
            />
          </Section>

          <Section title={dictionary.sections.quickActions}>
            <div className="grid min-w-0 grid-cols-1 gap-3">
              {canEditCenter ? (
                <Link
                  className={buttonClassName("primary", "md")}
                  href={`/super-admin/centers/${centerId}?mode=edit`}
                >
                  {dictionary.actions.editCenter}
                </Link>
              ) : null}
              {canManageStatus ? (
                <>
                  <button
                    className={buttonClassName("success", "md")}
                    disabled={center.apiStatus === "ACTIVE"}
                    onClick={() => startStatusAction("ACTIVE")}
                    type="button"
                  >
                    {dictionary.actions.activateCenter}
                  </button>
                  <button
                    className={buttonClassName("warning", "md")}
                    disabled={center.apiStatus === "SUSPENDED"}
                    onClick={() => startStatusAction("SUSPENDED")}
                    type="button"
                  >
                    {dictionary.actions.suspendCenter}
                  </button>
                  <button
                    className={buttonClassName("danger", "md")}
                    disabled={center.apiStatus === "CANCELLED"}
                    onClick={() => startStatusAction("CANCELLED")}
                    type="button"
                  >
                    {dictionary.actions.deactivateCenter}
                  </button>
                </>
              ) : null}
              {canManageSubscriptions ? (
                <button
                  className={buttonClassName("warning", "md")}
                  onClick={openSubscriptionModal}
                  type="button"
                >
                  {dictionary.actions.renewSubscription}
                </button>
              ) : null}
              {canEditCenter ? (
                <>
                  <button
                    className={buttonClassName("secondary", "md")}
                    type="button"
                  >
                    {dictionary.actions.loginAsCenterAdmin}
                  </button>
                  <button
                    className={buttonClassName("secondary", "md")}
                    type="button"
                  >
                    {dictionary.actions.resetAdminPassword}
                  </button>
                  <button
                    className={buttonClassName("secondary", "md")}
                    type="button"
                  >
                    {dictionary.actions.forceAdminPasswordChange}
                  </button>
                  <button
                    className={buttonClassName("secondary", "md")}
                    type="button"
                  >
                    {dictionary.actions.sendWelcomeEmail}
                  </button>
                  <p className="text-xs leading-5 text-[#66758a]">
                    {dictionary.values.futureAction}
                  </p>
                </>
              ) : null}
            </div>
          </Section>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <Section title={dictionary.sections.adminInfo}>
            <DetailList
              items={[
                [dictionary.fields.adminName, center.adminName],
                [dictionary.fields.email, center.adminEmail],
                [dictionary.fields.mobile, center.adminMobile],
                [
                  dictionary.fields.permissionsPreset,
                  dictionary.permissionPresets[center.permissionsPreset],
                ],
                [
                  dictionary.fields.lastLogin,
                  formatDate(center.lastLogin, locale),
                ],
                [
                  dictionary.fields.accountStatus,
                  dictionary.accountStatuses[center.accountStatus],
                ],
              ]}
            />
          </Section>

          <Section title={dictionary.sections.brandingLanguages}>
            <div className="mb-4 flex min-w-0 items-center gap-3 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-3">
              <LogoMark center={center} dictionary={dictionary} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#66758a]">
                  {dictionary.fields.logo}
                </p>
                <p className="text-sm font-semibold text-[#24364f]">
                  {getCenterName(center)}
                </p>
              </div>
            </div>
            <div className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <ColorValue
                label={dictionary.fields.primaryColor}
                value={center.primaryColor}
              />
              <ColorValue
                label={dictionary.fields.secondaryColor}
                value={center.secondaryColor}
              />
            </div>
            <DetailList
              items={[
                [
                  dictionary.fields.defaultLanguage,
                  dictionary.languages[center.defaultLanguage],
                ],
                [dictionary.fields.enabledLanguages, enabledLanguages],
              ]}
            />
          </Section>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Section title={dictionary.sections.activityTimeline}>
            <ol className="space-y-4">
              {center.activityTimeline.map((item) => (
                <li className="flex min-w-0 gap-3" key={item.key}>
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-[#C8A45D] bg-[#0B2D5C]" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#24364f]">
                      {dictionary.timeline[item.key]}
                    </p>
                    <p className="text-xs text-[#66758a]">
                      {formatDate(item.date, locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          {canViewInternalNotes ? (
            <Section title={dictionary.sections.notes}>
              {canManageInternalNotes ? (
                <form className="space-y-3" onSubmit={submitNote}>
                  <label className="block min-w-0">
                    <span className="text-sm font-medium text-[#24364f]">
                      {dictionary.notes.label}
                    </span>
                    <textarea
                      className="mt-2 min-h-32 w-full min-w-0 resize-y rounded-md border border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                      onChange={(event) => {
                        setNoteText(event.target.value);
                        setNoteError("");
                        setNoteSaveStatus("idle");
                      }}
                      placeholder={dictionary.notes.placeholder}
                      value={noteText}
                    />
                    {noteError ? (
                      <p className="mt-1 text-xs font-medium text-[#B42318]">
                        {noteError}
                      </p>
                    ) : null}
                  </label>
                  {noteSaveStatus === "error" && !noteError ? (
                    <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                      {dictionary.values.noteSaveError}
                    </p>
                  ) : null}
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-[#66758a]">
                      {dictionary.notes.helper}
                    </p>
                    <button
                      className={buttonClassName(
                        "secondary",
                        "md",
                        "w-full sm:w-auto",
                      )}
                      disabled={noteSaveStatus === "saving"}
                      type="submit"
                    >
                      {noteSaveStatus === "saving"
                        ? dictionary.values.notesSaving
                        : dictionary.actions.saveNotes}
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="mt-5 min-w-0 space-y-3">
              {notesStatus === "loading" ? (
                <p className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3 text-sm font-medium text-[#66758a]">
                  {dictionary.values.notesLoading}
                </p>
              ) : null}
              {notesStatus === "success" && notes.length === 0 ? (
                <p className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3 text-sm font-medium text-[#66758a]">
                  {dictionary.values.notesEmpty}
                </p>
              ) : null}
              {notes.map((note) => (
                <article
                  className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3"
                  key={note.id}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#24364f]">
                    {note.note}
                  </p>
                  <div className="mt-3 flex min-w-0 flex-col gap-1 border-t border-[#E5E7EB] pt-2 text-xs text-[#66758a] sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium">
                      {note.author.fullName}
                    </span>
                    <span>{formatDate(note.createdAt, locale)}</span>
                  </div>
                </article>
              ))}
            </div>
            {notesStatus === "error" ? (
              <p className="text-xs leading-5 text-[#66758a]">
                {dictionary.values.errorDescription}
              </p>
            ) : null}
            </Section>
          ) : null}
        </div>

        {isSubscriptionModalOpen && canManageSubscriptions ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B2D5C]/35 p-4 sm:items-center">
            <form
              className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_24px_70px_rgba(11,45,92,0.24)]"
              onSubmit={submitSubscription}
            >
              <h3 className="text-base font-semibold text-[#0B2D5C]">
                {dictionary.values.updateSubscription}
              </h3>
              {subscriptionSaveStatus === "error" ? (
                <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {dictionary.values.subscriptionError}
                </p>
              ) : null}
              <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  error={subscriptionErrors.subscriptionPlan}
                  label={dictionary.fields.subscriptionPlan}
                >
                  <select
                    className={inputClassName}
                    onChange={(event) =>
                      updateSubscriptionField(
                        "subscriptionPlan",
                        event.target.value,
                      )
                    }
                    value={currentSubscriptionForm.subscriptionPlan}
                  >
                    <option value="BASIC">{dictionary.manualPlans.basic}</option>
                    <option value="STANDARD">
                      {dictionary.manualPlans.standard}
                    </option>
                    <option value="PREMIUM">
                      {dictionary.manualPlans.premium}
                    </option>
                    <option value="ENTERPRISE">
                      {dictionary.manualPlans.enterprise}
                    </option>
                  </select>
                </FormField>
                <FormField
                  error={subscriptionErrors.subscriptionStatus}
                  label={dictionary.fields.status}
                >
                  <select
                    className={inputClassName}
                    onChange={(event) =>
                      updateSubscriptionField(
                        "subscriptionStatus",
                        event.target.value,
                      )
                    }
                    value={currentSubscriptionForm.subscriptionStatus}
                  >
                    <option value="TRIAL">
                      {dictionary.subscriptionStatuses.trial}
                    </option>
                    <option value="ACTIVE">
                      {dictionary.subscriptionStatuses.active}
                    </option>
                    <option value="EXPIRED">
                      {dictionary.subscriptionStatuses.expired}
                    </option>
                    <option value="OVERDUE">
                      {dictionary.subscriptionStatuses.overdue}
                    </option>
                    <option value="CANCELLED">
                      {dictionary.subscriptionStatuses.cancelled}
                    </option>
                  </select>
                </FormField>
                <FormField
                  error={subscriptionErrors.subscriptionStartDate}
                  label={dictionary.fields.startDate}
                >
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateSubscriptionField(
                        "subscriptionStartDate",
                        event.target.value,
                      )
                    }
                    type="date"
                    value={currentSubscriptionForm.subscriptionStartDate}
                  />
                </FormField>
                <FormField
                  error={subscriptionErrors.subscriptionEndDate}
                  label={dictionary.fields.expiryDate}
                >
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateSubscriptionField(
                        "subscriptionEndDate",
                        event.target.value,
                      )
                    }
                    type="date"
                    value={currentSubscriptionForm.subscriptionEndDate}
                  />
                </FormField>
                <FormField label={dictionary.values.nextRenewalDate}>
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateSubscriptionField(
                        "nextRenewalDate",
                        event.target.value,
                      )
                    }
                    type="date"
                    value={currentSubscriptionForm.nextRenewalDate}
                  />
                </FormField>
                <FormField label={dictionary.values.billingNotes}>
                  <textarea
                    className="min-h-24 w-full min-w-0 resize-y rounded-md border border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                    onChange={(event) =>
                      updateSubscriptionField(
                        "billingNotes",
                        event.target.value,
                      )
                    }
                    value={currentSubscriptionForm.billingNotes}
                  />
                </FormField>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  className={buttonClassName(
                    "secondary",
                    "md",
                    "w-full sm:w-auto",
                  )}
                  onClick={() => setIsSubscriptionModalOpen(false)}
                  type="button"
                >
                  {dictionary.actions.cancelEdit}
                </button>
                <button
                  className={buttonClassName(
                    "primary",
                    "md",
                    "w-full sm:w-auto",
                  )}
                  disabled={subscriptionSaveStatus === "saving"}
                  type="submit"
                >
                  {subscriptionSaveStatus === "saving"
                    ? dictionary.values.subscriptionSaving
                    : dictionary.actions.saveChanges}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {statusAction && canManageStatus ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B2D5C]/35 p-4 sm:items-center">
            <form
              className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_24px_70px_rgba(11,45,92,0.24)]"
              onSubmit={submitStatusAction}
            >
              <h3 className="text-base font-semibold text-[#0B2D5C]">
                {dictionary.actions[
                  statusAction.status === "ACTIVE"
                    ? "activateCenter"
                    : statusAction.status === "SUSPENDED"
                      ? "suspendCenter"
                      : "deactivateCenter"
                ]}
              </h3>
              <FormField
                error={statusError}
                label={dictionary.values.statusReason}
              >
                <textarea
                  className="min-h-28 w-full min-w-0 resize-y rounded-md border border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#132238] outline-none transition focus:border-[#0B2D5C] focus:ring-3 focus:ring-[#0B2D5C]/12"
                  onChange={(event) => {
                    setStatusAction((current) =>
                      current
                        ? { ...current, reason: event.target.value }
                        : current,
                    );
                    setStatusError("");
                    setStatusSaveStatus("idle");
                  }}
                  placeholder={dictionary.values.statusReasonPlaceholder}
                  value={statusAction.reason}
                />
              </FormField>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  className={buttonClassName("secondary", "md", "w-full sm:w-auto")}
                  onClick={() => setStatusAction(null)}
                  type="button"
                >
                  {dictionary.actions.cancelEdit}
                </button>
                <button
                  className={buttonClassName("primary", "md", "w-full sm:w-auto")}
                  disabled={statusSaveStatus === "saving"}
                  type="submit"
                >
                  {statusSaveStatus === "saving"
                    ? dictionary.values.statusSaving
                    : dictionary.actions.saveChanges}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {pendingStaffPasswordReset ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B2D5C]/35 p-4 sm:items-center">
            <div className="w-full max-w-lg rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_24px_70px_rgba(11,45,92,0.24)]">
              <h3 className="text-base font-semibold text-[#0B2D5C]">
                {dictionary.values.staffResetConfirmTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#66758a]">
                {dictionary.values.staffResetConfirmDescription}
              </p>
              <p className="mt-3 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-sm font-semibold text-[#24364f]">
                {pendingStaffPasswordReset.fullName}
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  className={buttonClassName(
                    "secondary",
                    "md",
                    "w-full sm:w-auto",
                  )}
                  onClick={() => setPendingStaffPasswordReset(null)}
                  type="button"
                >
                  {dictionary.actions.cancelEdit}
                </button>
                <button
                  className={buttonClassName(
                    "warning",
                    "md",
                    "w-full sm:w-auto",
                  )}
                  disabled={staffSaveStatus === "saving"}
                  onClick={resetStaffPassword}
                  type="button"
                >
                  {staffSaveStatus === "saving"
                    ? dictionary.values.staffSaving
                    : dictionary.actions.resetStaffPassword}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {staffPasswordResetResult ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B2D5C]/35 p-4 sm:items-center">
            <div className="w-full max-w-lg rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_24px_70px_rgba(11,45,92,0.24)]">
              <h3 className="text-base font-semibold text-[#0B2D5C]">
                {dictionary.values.staffResetGeneratedTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#66758a]">
                {dictionary.values.staffResetGeneratedDescription}
              </p>
              <div className="mt-4 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                <p className="text-xs font-medium text-[#66758a]">
                  {dictionary.values.newTemporaryPassword}
                </p>
                <p className="mt-2 break-all font-mono text-lg font-semibold text-[#0B2D5C]">
                  {staffPasswordResetResult.temporaryPassword}
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  className={buttonClassName(
                    "secondary",
                    "md",
                    "w-full sm:w-auto",
                  )}
                  onClick={copyStaffTemporaryPassword}
                  type="button"
                >
                  {hasCopiedStaffPassword
                    ? dictionary.values.temporaryPasswordCopied
                    : dictionary.values.copyTemporaryPassword}
                </button>
                <button
                  className={buttonClassName(
                    "primary",
                    "md",
                    "w-full sm:w-auto",
                  )}
                  onClick={() => setStaffPasswordResetResult(null)}
                  type="button"
                >
                  {dictionary.shell.close}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </SuperAdminLayout>
  );
}
