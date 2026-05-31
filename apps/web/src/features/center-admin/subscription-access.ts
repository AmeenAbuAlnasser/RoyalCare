import type { CenterAdminDictionary } from "@/i18n/dictionaries/center-admin";
import type { CenterSession } from "@/lib/api/center-auth";

export function isTenantWriteBlocked(session: CenterSession) {
  const access = session.subscriptionAccess;
  if (!access) return false;

  // Grace period allows full write access
  if (access.isInGracePeriod) return false;

  return Boolean(
    (access.isExpired && !access.isInGracePeriod) ||
      access.isSuspended ||
      access.status === "CANCELLED",
  );
}

export function isTenantInGracePeriod(session: CenterSession) {
  return Boolean(session.subscriptionAccess?.isInGracePeriod);
}

export function getTenantSubscriptionRestrictionMessage(
  session: CenterSession,
  dictionary: CenterAdminDictionary,
) {
  if (
    session.subscriptionAccess?.isSuspended ||
    session.subscriptionAccess?.status === "CANCELLED"
  ) {
    return dictionary.subscriptionBanner.suspendedTitle;
  }

  if (session.subscriptionAccess?.isExpired && !session.subscriptionAccess?.isInGracePeriod) {
    return dictionary.subscriptionBanner.expiredTitle;
  }

  return "";
}

export function canUseTenantAction(
  session: CenterSession,
  permission: string,
) {
  return session.permissions.includes(permission) && !isTenantWriteBlocked(session);
}
