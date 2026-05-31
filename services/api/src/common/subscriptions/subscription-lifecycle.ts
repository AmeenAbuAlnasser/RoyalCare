import type {
  CenterStatus,
  SubscriptionStatus,
} from '@royalcare/db';

export const SUBSCRIPTION_EXPIRING_SOON_DAYS = 7;

export const blockedSubscriptionCenterStatuses: CenterStatus[] = [
  'SUSPENDED',
  'CANCELLED',
  'ARCHIVED',
];

export const blockedSubscriptionStatuses: SubscriptionStatus[] = [
  'SUSPENDED',
  'CANCELLED',
];

export const expiringSoonSubscriptionStatuses: SubscriptionStatus[] = [
  'ACTIVE',
  'TRIALING',
];

export type NormalizedSubscriptionLifecycle =
  | 'ACTIVE'
  | 'TRIALING'
  | 'EXPIRING_SOON'
  | 'EXPIRED_GRACE_PERIOD'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'UNKNOWN';

export type SubscriptionLifecycleColor =
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted'
  | 'neutral';

export type SubscriptionLifecycleInput = {
  center?: { status?: string | null } | null;
  currentPeriodEnd?: Date | string | null;
  gracePeriodEndsAt?: Date | string | null;
  status?: string | null;
};

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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalizeStatus(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? '';
}

export function startOfDay(value: Date | string = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

export function getExpiringSoonDateWindow(reference = new Date()) {
  const start = startOfDay(reference);
  return {
    endExclusive: addDays(start, SUBSCRIPTION_EXPIRING_SOON_DAYS + 1),
    start,
  };
}

export function getDaysRemaining(
  currentPeriodEnd?: Date | string | null,
  reference = new Date(),
) {
  if (!currentPeriodEnd) return null;

  const end = startOfDay(currentPeriodEnd);

  if (Number.isNaN(end.getTime())) {
    return null;
  }

  const today = startOfDay(reference);
  return Math.ceil((end.getTime() - today.getTime()) / MS_PER_DAY);
}

export function normalizeSubscriptionLifecycle(
  input: SubscriptionLifecycleInput,
  reference = new Date(),
): SubscriptionLifecycleResult {
  const status = normalizeStatus(input.status);
  const centerStatus = normalizeStatus(input.center?.status ?? null);
  let daysRemaining = getDaysRemaining(input.currentPeriodEnd, reference);
  let graceDaysRemaining: number | null = null;

  let lifecycle: NormalizedSubscriptionLifecycle = 'UNKNOWN';

  if (status === 'CANCELLED' || centerStatus === 'CANCELLED') {
    lifecycle = 'CANCELLED';
  } else if (
    status === 'SUSPENDED' ||
    centerStatus === 'SUSPENDED' ||
    centerStatus === 'ARCHIVED' ||
    status === 'STOPPED' ||
    centerStatus === 'STOPPED' ||
    status === 'INACTIVE' ||
    centerStatus === 'INACTIVE'
  ) {
    lifecycle = 'SUSPENDED';
  } else if (status === 'EXPIRED') {
    // Check for active grace period before classifying as plain EXPIRED.
    // Grace period only applies to subscriptions where the cron explicitly set
    // gracePeriodEndsAt; old records with null remain plain EXPIRED.
    if (input.gracePeriodEndsAt) {
      const graceEnd = startOfDay(input.gracePeriodEndsAt);
      const refDay = startOfDay(reference);
      const graceMs = graceEnd.getTime() - refDay.getTime();
      if (graceMs > 0) {
        graceDaysRemaining = Math.ceil(graceMs / MS_PER_DAY);
        lifecycle = 'EXPIRED_GRACE_PERIOD';
      } else {
        lifecycle = 'EXPIRED';
      }
    } else {
      lifecycle = 'EXPIRED';
    }
  } else if (typeof daysRemaining === 'number' && daysRemaining < 0) {
    // Subscription period ended but cron hasn't flipped status yet.
    lifecycle = 'EXPIRED';
  } else if (
    (status === 'ACTIVE' || status === 'TRIALING') &&
    typeof daysRemaining === 'number' &&
    daysRemaining >= 0 &&
    daysRemaining <= SUBSCRIPTION_EXPIRING_SOON_DAYS
  ) {
    lifecycle = 'EXPIRING_SOON';
  } else if (status === 'ACTIVE') {
    lifecycle = 'ACTIVE';
  } else if (status === 'TRIALING' || status === 'TRIAL') {
    lifecycle = 'TRIALING';
  }

  if (
    lifecycle === 'EXPIRED' &&
    typeof daysRemaining === 'number' &&
    daysRemaining >= 0
  ) {
    daysRemaining = -1;
  }

  const isInGracePeriod = lifecycle === 'EXPIRED_GRACE_PERIOD';

  return {
    color: getLifecycleColor(lifecycle),
    daysRemaining,
    graceDaysRemaining,
    isExpired: lifecycle === 'EXPIRED',
    isExpiringSoon: lifecycle === 'EXPIRING_SOON',
    isInGracePeriod,
    label: getLifecycleLabel(lifecycle),
    lifecycle,
    normalizedLifecycle: lifecycle,
  };
}

function getLifecycleLabel(lifecycle: NormalizedSubscriptionLifecycle) {
  const labels: Record<NormalizedSubscriptionLifecycle, string> = {
    ACTIVE: 'Active',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
    EXPIRED_GRACE_PERIOD: 'Grace Period',
    EXPIRING_SOON: 'Expiring Soon',
    SUSPENDED: 'Suspended',
    TRIALING: 'Trialing',
    UNKNOWN: 'Unknown',
  };

  return labels[lifecycle];
}

function getLifecycleColor(
  lifecycle: NormalizedSubscriptionLifecycle,
): SubscriptionLifecycleColor {
  if (lifecycle === 'ACTIVE' || lifecycle === 'TRIALING') return 'success';
  if (lifecycle === 'EXPIRING_SOON' || lifecycle === 'EXPIRED_GRACE_PERIOD')
    return 'warning';
  if (lifecycle === 'EXPIRED' || lifecycle === 'CANCELLED') return 'danger';
  if (lifecycle === 'SUSPENDED') return 'muted';
  return 'neutral';
}
