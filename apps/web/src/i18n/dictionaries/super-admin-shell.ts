import type { SupportedLocale } from "../locales";

export const superAdminShellDictionaries: Record<
  SupportedLocale,
  {
    logout: string;
    notifications: {
      bell: string;
      empty: string;
      markAllRead: string;
      markRead: string;
      unread: string;
      viewAll: string;
      today: string;
      yesterday: string;
      daysAgo: (days: number) => string;
    };
  }
> = {
  en: {
    logout: "Logout",
    notifications: {
      bell: "Notifications",
      empty: "No unread notifications",
      markAllRead: "Mark all read",
      markRead: "Mark read",
      unread: "Unread",
      viewAll: "View all",
      today: "Today",
      yesterday: "Yesterday",
      daysAgo: (days) => `${days} days ago`,
    },
  },
  ar: {
    logout: "تسجيل الخروج",
    notifications: {
      bell: "الإشعارات",
      empty: "لا توجد إشعارات غير مقروءة",
      markAllRead: "تحديد الكل كمقروء",
      markRead: "تحديد كمقروء",
      unread: "غير مقروء",
      viewAll: "عرض الكل",
      today: "اليوم",
      yesterday: "أمس",
      daysAgo: (days) => `منذ ${days} أيام`,
    },
  },
  he: {
    logout: "התנתקות",
    notifications: {
      bell: "התראות",
      empty: "אין התראות שלא נקראו",
      markAllRead: "סמן הכל כנקרא",
      markRead: "סמן כנקרא",
      unread: "לא נקרא",
      viewAll: "צפה בהכל",
      today: "היום",
      yesterday: "אתמול",
      daysAgo: (days) => `לפני ${days} ימים`,
    },
  },
};
