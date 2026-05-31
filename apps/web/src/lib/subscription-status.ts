export type NormalizedSubscriptionStatus =
  | "ACTIVE"
  | "TRIALING"
  | "EXPIRING_SOON"
  | "EXPIRED_GRACE_PERIOD"
  | "EXPIRED"
  | "SUSPENDED"
  | "CANCELLED"
  | "UNKNOWN";

export type NormalizedSubscriptionLifecycle = NormalizedSubscriptionStatus;

export type SubscriptionLifecycleColor =
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "neutral";

export type SubscriptionLifecycleResult = {
  color: SubscriptionLifecycleColor;
  daysRemaining: number | null;
  graceDaysRemaining: number | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  isInGracePeriod: boolean;
  label: string;
  lifecycle: NormalizedSubscriptionLifecycle;
  normalizedLifecycle: NormalizedSubscriptionLifecycle;
};

export type SubscriptionActionAvailability = {
  canView: boolean;
  canRenew: boolean;
  canSuspend: boolean;
  canCancel: boolean;
  canSendWhatsApp: boolean;
  canUpgradePlan: boolean;
  canDowngradePlan: boolean;
};

type SubscriptionStatusLike = {
  center?: { status?: string | null } | null;
  currentPeriodEnd?: string | null;
  daysRemaining?: number | null;
  daysUntilExpiry?: number | null;
  graceDaysRemaining?: number | null;
  gracePeriodEndsAt?: string | null;
  isExpired?: boolean | null;
  isExpiringSoon?: boolean | null;
  isInGracePeriod?: boolean | null;
  lifecycleStatus?: string | null;
  normalizedLifecycle?: string | null;
  remainingDays?: number | null;
  status?: string | null;
  subscriptionStatus?: string | null;
};

function normalizeRawStatus(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? "";
}

function getLifecycleDays(item: SubscriptionStatusLike) {
  const value = item.daysRemaining ?? item.daysUntilExpiry ?? item.remainingDays;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (!item.currentPeriodEnd) {
    return null;
  }

  const endDate = new Date(item.currentPeriodEnd);

  if (Number.isNaN(endDate.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  return Math.ceil((endDate.getTime() - today.getTime()) / 86_400_000);
}

function getGraceDaysRemaining(item: SubscriptionStatusLike): number | null {
  if (typeof item.graceDaysRemaining === "number") {
    return item.graceDaysRemaining;
  }

  if (!item.gracePeriodEndsAt) return null;

  const graceEnd = new Date(item.gracePeriodEndsAt);
  if (Number.isNaN(graceEnd.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  graceEnd.setHours(0, 0, 0, 0);

  const diff = Math.ceil((graceEnd.getTime() - today.getTime()) / 86_400_000);
  return diff > 0 ? diff : null;
}

function isActiveOrTrialing(status: string) {
  return status === "ACTIVE" || status === "TRIALING" || status === "TRIAL";
}

export function normalizeSubscriptionStatus(
  item: SubscriptionStatusLike,
): NormalizedSubscriptionStatus {
  return normalizeSubscriptionLifecycle(item).lifecycle;
}

function getLifecycleLabel(lifecycle: NormalizedSubscriptionLifecycle) {
  const labels: Record<NormalizedSubscriptionLifecycle, string> = {
    ACTIVE: "Active",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired",
    EXPIRED_GRACE_PERIOD: "Grace Period",
    EXPIRING_SOON: "Expiring Soon",
    SUSPENDED: "Suspended",
    TRIALING: "Trialing",
    UNKNOWN: "Unknown",
  };

  return labels[lifecycle];
}

function getLifecycleColor(
  lifecycle: NormalizedSubscriptionLifecycle,
): SubscriptionLifecycleColor {
  if (lifecycle === "ACTIVE" || lifecycle === "TRIALING") return "success";
  if (lifecycle === "EXPIRING_SOON" || lifecycle === "EXPIRED_GRACE_PERIOD")
    return "warning";
  if (lifecycle === "EXPIRED" || lifecycle === "CANCELLED") return "danger";
  if (lifecycle === "SUSPENDED") return "muted";
  return "neutral";
}

export function normalizeSubscriptionLifecycle(
  item: SubscriptionStatusLike,
): SubscriptionLifecycleResult {
  const status = normalizeRawStatus(item.status ?? item.subscriptionStatus);
  const lifecycleStatus = normalizeRawStatus(
    item.normalizedLifecycle ?? item.lifecycleStatus,
  );
  const centerStatus = normalizeRawStatus(item.center?.status);
  let daysRemaining = getLifecycleDays(item);
  let graceDaysRemaining: number | null = null;
  let lifecycle: NormalizedSubscriptionLifecycle = "UNKNOWN";

  if (status === "CANCELLED" || centerStatus === "CANCELLED") {
    lifecycle = "CANCELLED";
  } else if (
    status === "SUSPENDED" ||
    centerStatus === "SUSPENDED" ||
    centerStatus === "ARCHIVED" ||
    status === "STOPPED" ||
    centerStatus === "STOPPED" ||
    status === "INACTIVE" ||
    centerStatus === "INACTIVE"
  ) {
    lifecycle = "SUSPENDED";
  } else if (
    lifecycleStatus === "EXPIRED_GRACE_PERIOD" ||
    item.isInGracePeriod
  ) {
    // API already computed grace period — trust it
    graceDaysRemaining = getGraceDaysRemaining(item);
    lifecycle = "EXPIRED_GRACE_PERIOD";
  } else if (
    status === "EXPIRED" ||
    lifecycleStatus === "EXPIRED" ||
    item.isExpired
  ) {
    // Check if there is a local grace period even if API didn't set isInGracePeriod
    const localGraceDays = getGraceDaysRemaining(item);
    if (localGraceDays !== null && localGraceDays > 0) {
      graceDaysRemaining = localGraceDays;
      lifecycle = "EXPIRED_GRACE_PERIOD";
    } else {
      lifecycle = "EXPIRED";
    }
  } else if (typeof daysRemaining === "number" && daysRemaining < 0) {
    lifecycle = "EXPIRED";
  } else if (
    isActiveOrTrialing(status) &&
    (lifecycleStatus === "EXPIRING_SOON" ||
      item.isExpiringSoon ||
      (typeof daysRemaining === "number" &&
        daysRemaining >= 0 &&
        daysRemaining <= 7))
  ) {
    lifecycle = "EXPIRING_SOON";
  } else if (status === "ACTIVE") {
    lifecycle = "ACTIVE";
  } else if (status === "TRIALING" || status === "TRIAL") {
    lifecycle = "TRIALING";
  }

  // Keep the presentation internally consistent even when persisted data is not.
  if (lifecycle === "EXPIRED" && typeof daysRemaining === "number" && daysRemaining >= 0) {
    daysRemaining = -1;
  }

  const isInGracePeriod = lifecycle === "EXPIRED_GRACE_PERIOD";

  return {
    color: getLifecycleColor(lifecycle),
    daysRemaining,
    graceDaysRemaining,
    isExpired: lifecycle === "EXPIRED",
    isExpiringSoon: lifecycle === "EXPIRING_SOON",
    isInGracePeriod,
    label: getLifecycleLabel(lifecycle),
    lifecycle,
    normalizedLifecycle: lifecycle,
  };
}

export function getSubscriptionActionAvailability(
  lifecycle: NormalizedSubscriptionLifecycle,
): SubscriptionActionAvailability {
  const availability: SubscriptionActionAvailability = {
    canView: true,
    canRenew: false,
    canSuspend: false,
    canCancel: false,
    canSendWhatsApp: false,
    canUpgradePlan: false,
    canDowngradePlan: false,
  };

  if (
    lifecycle === "ACTIVE" ||
    lifecycle === "TRIALING" ||
    lifecycle === "EXPIRING_SOON" ||
    lifecycle === "EXPIRED_GRACE_PERIOD"
  ) {
    return {
      ...availability,
      canRenew: true,
      canSuspend: true,
      canSendWhatsApp: true,
    };
  }

  if (
    lifecycle === "EXPIRED" ||
    lifecycle === "SUSPENDED" ||
    lifecycle === "CANCELLED"
  ) {
    return {
      ...availability,
      canRenew: true,
      canSendWhatsApp: true,
    };
  }

  return availability;
}
