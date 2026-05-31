import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../common/database/prisma.service';
import { safeUserSelect } from '../../common/database/safe-user-select';
import { hashPassword } from '../../common/security/password-hashing';
import { parsePagination } from '../../common/utils/pagination';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  Prisma,
  SupportedLanguage,
} from '@royalcare/db';
import { CreateCenterInternalNoteDto } from './dto/create-center-internal-note.dto';
import { CreateAdminCenterManagerDto } from './dto/create-admin-center-manager.dto';
import {
  CreateCenterStaffDto,
  type CenterStaffRole,
  type CenterStaffStatus,
} from './dto/create-center-staff.dto';
import { CreateCenterDto } from './dto/create-center.dto';
import { ListCentersQueryDto } from './dto/list-centers-query.dto';
import { ResetCenterStaffPasswordDto } from './dto/reset-center-staff-password.dto';
import { UpdateCenterStaffStatusDto } from './dto/update-center-staff-status.dto';
import { UpdateCenterStaffDto } from './dto/update-center-staff.dto';
import { UpdateCenterStatusDto } from './dto/update-center-status.dto';
import { UpdateCenterSubscriptionDto } from './dto/update-center-subscription.dto';
import { UpdateCenterDto } from './dto/update-center.dto';

const ACTIVE_USER_ROLE_STATUS = 'ACTIVE';
const DEFAULT_BILLING_INTERVAL = 'MONTHLY';
const DEFAULT_CENTER_STATUS = 'TRIAL';
const DEFAULT_SUBSCRIPTION_STATUS = 'TRIALING';
const DEFAULT_USER_STATUS = 'ACTIVE';
const DEFAULT_TIMEZONE = 'Asia/Jerusalem';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CENTER_STATUSES = [
  'TRIAL',
  'ACTIVE',
  'PAST_DUE',
  'SUSPENDED',
  'CANCELLED',
  'ARCHIVED',
] as const;
const CENTER_STATUS_ACTIONS = ['ACTIVE', 'SUSPENDED', 'CANCELLED'] as const;
const CENTER_STAFF_ROLES = [
  'CENTER_OWNER',
  'CENTER_MANAGER',
  'DOCTOR',
  'RECEPTIONIST',
  'ACCOUNTANT',
  'STAFF',
] as const;
const CENTER_STAFF_STATUSES = [
  'INVITED',
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
] as const;
const CENTER_TYPES = [
  'LASER',
  'PHYSIOTHERAPY',
  'HIJAMA',
  'BEAUTY',
  'WELLNESS',
  'MULTI_SPECIALTY',
] as const;
const SUBSCRIPTION_STATUSES = [
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'SUSPENDED',
  'CANCELLED',
  'EXPIRED',
] as const;
const BILLING_INTERVALS = ['MONTHLY', 'YEARLY', 'CUSTOM'] as const;
const DOMAIN_STATUSES = [
  'PENDING',
  'VERIFIED',
  'ACTIVE',
  'FAILED',
  'DISABLED',
] as const;
const DOMAIN_TYPES = ['CUSTOM', 'SUBDOMAIN'] as const;
const SUPPORTED_LANGUAGES = ['AR', 'HE', 'EN'] as const;
const MANUAL_SUBSCRIPTION_PLANS = [
  'BASIC',
  'STANDARD',
  'PREMIUM',
  'ENTERPRISE',
] as const;
const MANUAL_SUBSCRIPTION_STATUSES = [
  'TRIAL',
  'ACTIVE',
  'EXPIRED',
  'OVERDUE',
  'SUSPENDED',
  'CANCELLED',
] as const;
const PLAN_NAMES: Record<(typeof MANUAL_SUBSCRIPTION_PLANS)[number], string> = {
  BASIC: 'Basic',
  ENTERPRISE: 'Enterprise',
  PREMIUM: 'Premium',
  STANDARD: 'Standard',
};
const SUBSCRIPTION_STATUS_MAP: Record<
  (typeof MANUAL_SUBSCRIPTION_STATUSES)[number],
  (typeof SUBSCRIPTION_STATUSES)[number]
> = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  OVERDUE: 'PAST_DUE',
  SUSPENDED: 'SUSPENDED',
  TRIAL: 'TRIALING',
};

type CenterStatusAuditContext = {
  ip?: string;
  userAgent?: string | string[];
};

type SubscriptionAuditContext = CenterStatusAuditContext;

const safeDomainSelect = {
  id: true,
  centerId: true,
  hostname: true,
  type: true,
  status: true,
  isPrimary: true,
  verifiedAt: true,
  activatedAt: true,
  failedAt: true,
  disabledAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DomainSelect;

const safeSubscriptionSelect = {
  id: true,
  centerId: true,
  planCode: true,
  planName: true,
  status: true,
  billingInterval: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  gracePeriodEndsAt: true,
  nextRenewalDate: true,
  billingNotes: true,
  trialEndsAt: true,
  expiresAt: true,
  cancelAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SubscriptionSelect;

const safeCenterInternalNoteSelect = {
  id: true,
  centerId: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  author: { select: safeUserSelect },
} satisfies Prisma.CenterInternalNoteSelect;

const safeCenterStaffUserRoleSelect = {
  id: true,
  centerId: true,
  status: true,
  assignedAt: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      id: true,
      key: true,
      name: true,
    },
  },
  user: { select: safeUserSelect },
} satisfies Prisma.UserRoleSelect;

const duplicateAdminEmailError = {
  en: 'Email is already used by another user.',
  ar: 'البريد الإلكتروني مستخدم مسبقًا.',
  he: 'האימייל כבר בשימוש.',
};

const duplicateAdminPhoneError = {
  en: 'Phone number is already used by another user.',
  ar: 'رقم الهاتف مستخدم مسبقًا.',
  he: 'מספר הטלפון כבר בשימוש.',
};

const requiredAdminPhoneError = {
  en: 'Owner phone is required.',
  ar: 'رقم هاتف المالك مطلوب.',
  he: 'טלפון הבעלים הוא שדה חובה.',
};

const requiredAdminNameError = {
  en: 'Owner name is required.',
  ar: 'اسم المالك مطلوب.',
  he: 'שם הבעלים הוא שדה חובה.',
};

const requiredTemporaryPasswordError = {
  en: 'Temporary password is required.',
  ar: 'كلمة المرور المؤقتة مطلوبة.',
  he: 'סיסמה זמנית היא שדה חובה.',
};

const shortTemporaryPasswordError = {
  en: 'Temporary password must be at least 8 characters.',
  ar: 'يجب أن تتكون كلمة المرور المؤقتة من 8 أحرف على الأقل.',
  he: 'הסיסמה הזמנית חייבת להכיל לפחות 8 תווים.',
};

const invalidAdminEmailError = {
  en: 'Enter a valid admin email.',
  ar: 'أدخل بريد المدير بشكل صحيح.',
  he: 'יש להזין אימייל מנהל תקין.',
};

const invalidAdminPhoneError = {
  en: 'Enter a valid owner phone number.',
  ar: 'أدخل رقم هاتف المالك بشكل صحيح.',
  he: 'יש להזין מספר טלפון בעלים תקין.',
};

const duplicateDomainError = {
  en: 'Domain is already used by another center.',
  ar: 'النطاق مستخدم مسبقًا لمركز آخر.',
  he: 'הדומיין כבר בשימוש על ידי מרכז אחר.',
};

const requiredCenterNameError = {
  en: 'Center name is required.',
  ar: 'Center name is required.',
  he: 'Center name is required.',
};

const invalidSubscriptionDatesError = {
  en: 'Expiry date must be after the start date.',
  ar: 'Expiry date must be after the start date.',
  he: 'Expiry date must be after the start date.',
};

const requiredInternalNoteError = {
  en: 'Internal note is required.',
  ar: 'Internal note is required.',
  he: 'Internal note is required.',
};

const invalidCenterStatusError = {
  en: 'Enter a valid center status.',
  ar: 'Enter a valid center status.',
  he: 'Enter a valid center status.',
};

const requiredStatusReasonError = {
  en: 'Reason is required for this status change.',
  ar: 'Reason is required for this status change.',
  he: 'Reason is required for this status change.',
};

const invalidSubscriptionPlanError = {
  en: 'Enter a valid subscription plan.',
  ar: 'Enter a valid subscription plan.',
  he: 'Enter a valid subscription plan.',
};

const invalidSubscriptionStatusError = {
  en: 'Enter a valid subscription status.',
  ar: 'Enter a valid subscription status.',
  he: 'Enter a valid subscription status.',
};

const invalidDefaultLanguageError = {
  en: 'Select a valid default language.',
  ar: 'اختر لغة افتراضية صحيحة.',
  he: 'בחרו שפת ברירת מחדל תקינה.',
};

const requiredStaffNameError = {
  en: 'Staff name is required.',
  ar: 'Staff name is required.',
  he: 'Staff name is required.',
};

const invalidStaffEmailError = {
  en: 'Enter a valid staff email.',
  ar: 'Enter a valid staff email.',
  he: 'Enter a valid staff email.',
};

const invalidStaffPhoneError = {
  en: 'Enter a valid staff phone number.',
  ar: 'Enter a valid staff phone number.',
  he: 'Enter a valid staff phone number.',
};

const invalidStaffRoleError = {
  en: 'Select a valid staff role.',
  ar: 'Select a valid staff role.',
  he: 'Select a valid staff role.',
};

const invalidStaffStatusError = {
  en: 'Select a valid staff status.',
  ar: 'Select a valid staff status.',
  he: 'Select a valid staff status.',
};

const duplicateStaffEmailError = {
  en: 'Email is already used by another user.',
  ar: 'Email is already used by another user.',
  he: 'Email is already used by another user.',
};

const duplicateStaffPhoneError = {
  en: 'Phone number is already used by another user.',
  ar: 'Phone number is already used by another user.',
  he: 'Phone number is already used by another user.',
};

const shortStaffTemporaryPasswordError = {
  en: 'Temporary password must be at least 8 characters.',
  ar: 'Temporary password must be at least 8 characters.',
  he: 'Temporary password must be at least 8 characters.',
};

function optionalDate(value?: string) {
  return value ? new Date(value) : undefined;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

async function createUniqueSlug(
  tx: Prisma.TransactionClient,
  name: string,
  requestedSlug?: string,
) {
  const baseSlug =
    normalizeSlug(requestedSlug || name) || `center-${Date.now()}`;
  let candidate = baseSlug;
  let suffix = 1;

  while (await tx.center.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  return candidate;
}

function validateCreateCenterDto(dto: CreateCenterDto) {
  const errors: Record<string, unknown> = {};
  const adminEmail = dto.admin?.email?.trim();
  const adminPhone = dto.admin?.phone?.trim();
  const temporaryPassword = dto.admin?.temporaryPassword ?? '';

  if (!dto.name?.trim()) {
    errors.centerName = 'Center name is required.';
  }

  if (!dto.admin?.fullName?.trim()) {
    errors.adminName = requiredAdminNameError;
  }

  if (!adminEmail) {
    errors.adminEmail = 'Owner/admin email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    errors.adminEmail = invalidAdminEmailError;
  }

  if (!adminPhone) {
    errors.adminPhone = requiredAdminPhoneError;
  } else if (!/^\+?[0-9][0-9\s().-]{6,24}$/.test(adminPhone)) {
    errors.adminPhone = invalidAdminPhoneError;
  }

  if (!temporaryPassword) {
    errors.temporaryPassword = requiredTemporaryPasswordError;
  } else if (temporaryPassword.length < 8) {
    errors.temporaryPassword = shortTemporaryPasswordError;
  }

  if (!dto.subscription?.planCode?.trim()) {
    errors.subscriptionPlan = 'Subscription plan is required.';
  }

  const defaultLanguage = dto.branding?.defaultLanguage ?? dto.primaryLanguage;
  if (!defaultLanguage) {
    errors.defaultLanguage = 'Default language is required.';
  }

  if (!dto.branding?.enabledLanguages?.length) {
    errors.enabledLanguages = 'At least one enabled language is required.';
  }

  if (
    defaultLanguage &&
    dto.branding?.enabledLanguages?.length &&
    !dto.branding.enabledLanguages.includes(defaultLanguage)
  ) {
    errors.enabledLanguages =
      'Enabled languages must include the default language.';
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestException({
      message: 'Center creation validation failed.',
      errors,
    });
  }
}

function isPrismaKnownRequestError(
  error: unknown,
): error is { code: string; meta?: { target?: unknown } } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

function throwDuplicateAdminError(errors: Record<string, unknown>) {
  throw new ConflictException({
    message: 'Center admin validation failed.',
    errors,
  });
}

function hasValue(value: unknown) {
  return value !== undefined && value !== null;
}

function isAllowedValue<T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
): value is T[number] {
  return typeof value === 'string' && allowedValues.includes(value);
}

function optionalTrimmed(value: unknown) {
  return typeof value === 'string' ? value.trim() : undefined;
}

function optionalLowerTrimmed(value?: string) {
  return optionalTrimmed(value)?.toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  return /^\+?[0-9][0-9\s().-]{6,24}$/.test(value);
}

function parseDateField(
  value: string | undefined,
  fieldKey: 'startDate' | 'expiryDate',
  errors: Record<string, unknown>,
) {
  if (!hasValue(value)) {
    return undefined;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    errors[fieldKey] =
      fieldKey === 'startDate'
        ? 'Enter a valid start date.'
        : 'Enter a valid expiry date.';
    return undefined;
  }

  return parsed;
}

function getManualSubscriptionValidation(dto: UpdateCenterSubscriptionDto) {
  const errors: Record<string, unknown> = {};
  const plan = optionalTrimmed(dto.subscriptionPlan)?.toUpperCase();
  const status = optionalTrimmed(dto.subscriptionStatus)?.toUpperCase();
  const notificationPhone = hasValue(dto.notificationPhone)
    ? optionalTrimmed(dto.notificationPhone)
    : undefined;
  const notificationLanguage = hasValue(dto.notificationLanguage)
    ? (optionalTrimmed(
        dto.notificationLanguage,
      )?.toUpperCase() as SupportedLanguage)
    : undefined;
  const startDate = parseDateField(
    dto.subscriptionStartDate,
    'startDate',
    errors,
  );
  const endDate = parseDateField(dto.subscriptionEndDate, 'expiryDate', errors);
  const nextRenewalDate = parseDateField(
    dto.nextRenewalDate,
    'expiryDate',
    errors,
  );

  if (errors.startDate || errors.expiryDate) {
    errors.subscriptionDates = 'Enter valid subscription dates.';
    delete errors.startDate;
    delete errors.expiryDate;
  }

  if (
    hasValue(dto.subscriptionPlan) &&
    !isAllowedValue(plan, MANUAL_SUBSCRIPTION_PLANS)
  ) {
    errors.subscriptionPlan = invalidSubscriptionPlanError;
  }

  if (
    hasValue(dto.subscriptionStatus) &&
    !isAllowedValue(status, MANUAL_SUBSCRIPTION_STATUSES)
  ) {
    errors.subscriptionStatus = invalidSubscriptionStatusError;
  }

  if (
    notificationLanguage !== undefined &&
    !isAllowedValue(notificationLanguage, SUPPORTED_LANGUAGES)
  ) {
    errors.notificationLanguage = 'Enter a valid notification language.';
  }

  if (
    notificationPhone !== undefined &&
    notificationPhone &&
    !isValidPhone(notificationPhone)
  ) {
    errors.notificationPhone = 'Enter a valid notification phone number.';
  }

  if (startDate && endDate && endDate <= startDate) {
    errors.subscriptionDates = invalidSubscriptionDatesError;
  }

  const billingNotes = hasValue(dto.billingNotes)
    ? (dto.billingNotes ?? '').trim()
    : hasValue(dto.subscriptionNotes)
      ? (dto.subscriptionNotes ?? '').trim()
      : undefined;

  return {
    billingNotes,
    endDate,
    errors,
    nextRenewalDate,
    notificationLanguage,
    notificationPhone,
    plan,
    startDate,
    status,
  };
}

function getUpdateCenterValidation(dto: UpdateCenterDto) {
  const errors: Record<string, unknown> = {};
  const centerName = hasValue(dto.centerName)
    ? optionalTrimmed(dto.centerName)
    : hasValue(dto.name)
      ? optionalTrimmed(dto.name)
      : undefined;
  const centerNameAr = hasValue(dto.nameAr)
    ? optionalTrimmed(dto.nameAr) || null
    : undefined;
  const centerNameEn = hasValue(dto.nameEn)
    ? optionalTrimmed(dto.nameEn) || null
    : undefined;
  const centerNameHe = hasValue(dto.nameHe)
    ? optionalTrimmed(dto.nameHe) || null
    : undefined;
  const adminEmail = optionalLowerTrimmed(dto.admin?.email);
  const adminPhone = optionalTrimmed(dto.admin?.phone);
  const domainHostname = optionalLowerTrimmed(dto.domain?.hostname);
  const primaryLanguage = hasValue(dto.primaryLanguage)
    ? (optionalTrimmed(dto.primaryLanguage)?.toUpperCase() as SupportedLanguage)
    : undefined;
  const startDate = parseDateField(
    dto.subscription?.currentPeriodStart,
    'startDate',
    errors,
  );
  const expiryDate = parseDateField(
    dto.subscription?.currentPeriodEnd,
    'expiryDate',
    errors,
  );

  if ((hasValue(dto.centerName) || hasValue(dto.name)) && !centerName) {
    errors.centerName = requiredCenterNameError;
  }

  if (adminEmail !== undefined && (!adminEmail || !isValidEmail(adminEmail))) {
    errors.adminEmail = invalidAdminEmailError;
  }

  if (adminPhone !== undefined && (!adminPhone || !isValidPhone(adminPhone))) {
    errors.adminPhone = invalidAdminPhoneError;
  }

  if (hasValue(dto.admin?.fullName) && !optionalTrimmed(dto.admin?.fullName)) {
    errors.adminName = requiredAdminNameError;
  }

  if (hasValue(dto.status) && !isAllowedValue(dto.status, CENTER_STATUSES)) {
    errors.status = 'Enter a valid center status.';
  }

  if (hasValue(dto.type) && !isAllowedValue(dto.type, CENTER_TYPES)) {
    errors.centerType = 'Enter a valid center type.';
  }

  if (
    hasValue(dto.primaryLanguage) &&
    !isAllowedValue(primaryLanguage, SUPPORTED_LANGUAGES)
  ) {
    errors.defaultLanguage = invalidDefaultLanguageError;
  }

  if (
    hasValue(dto.subscription?.status) &&
    !isAllowedValue(dto.subscription?.status, SUBSCRIPTION_STATUSES)
  ) {
    errors.subscriptionStatus = 'Enter a valid subscription status.';
  }

  if (
    hasValue(dto.subscription?.billingInterval) &&
    !isAllowedValue(dto.subscription?.billingInterval, BILLING_INTERVALS)
  ) {
    errors.billingInterval = 'Enter a valid billing interval.';
  }

  if (
    hasValue(dto.subscription?.planCode) &&
    !optionalTrimmed(dto.subscription?.planCode)
  ) {
    errors.subscriptionPlan = 'Subscription plan is required.';
  }

  if (
    hasValue(dto.subscription?.planName) &&
    !optionalTrimmed(dto.subscription?.planName)
  ) {
    errors.subscriptionPlan = 'Subscription plan is required.';
  }

  if (startDate && expiryDate && expiryDate <= startDate) {
    errors.expiryDate = invalidSubscriptionDatesError;
  }

  if (hasValue(dto.domain?.hostname) && !domainHostname) {
    errors.domain = 'Domain is required.';
  }

  if (
    hasValue(dto.domain?.status) &&
    !isAllowedValue(dto.domain?.status, DOMAIN_STATUSES)
  ) {
    errors.domain = 'Enter a valid domain status.';
  }

  if (
    hasValue(dto.domain?.type) &&
    !isAllowedValue(dto.domain?.type, DOMAIN_TYPES)
  ) {
    errors.domain = 'Enter a valid domain type.';
  }

  return {
    adminEmail,
    adminFullName: optionalTrimmed(dto.admin?.fullName),
    adminPhone,
    centerName,
    centerNameAr,
    centerNameEn,
    centerNameHe,
    domainHostname,
    errors,
    expiryDate,
    primaryLanguage,
    startDate,
  };
}

function throwUpdateValidationErrors(errors: Record<string, unknown>) {
  if (Object.keys(errors).length > 0) {
    throw new BadRequestException({
      message: 'Center update validation failed.',
      errors,
    });
  }
}

function formatCenterStaffAssignment(
  assignment: Prisma.UserRoleGetPayload<{
    select: typeof safeCenterStaffUserRoleSelect;
  }>,
) {
  return {
    id: assignment.user.id,
    fullName: assignment.user.fullName,
    email: assignment.user.email,
    phone: assignment.user.phone,
    role: assignment.role.key,
    roleName: assignment.role.name,
    status: assignment.user.status,
    assignmentStatus: assignment.status,
    createdAt: assignment.user.createdAt,
    updatedAt: assignment.updatedAt,
  };
}

function formatAdminCenterSummary(
  center: {
    id: string;
    name: string;
    slug: string;
    status: string;
    publicVisible: boolean;
    createdAt: Date;
    subscriptions?: Array<{
      status: string;
      currentPeriodEnd: Date;
      planCode: string;
      planName: string;
    }>;
  },
  usersCount: number,
) {
  return {
    id: center.id,
    name: center.name,
    slug: center.slug,
    status: center.status,
    publicVisible: center.publicVisible,
    createdAt: center.createdAt,
    usersCount,
    subscriptions: (center.subscriptions ?? []).map((s) => ({
      currentPeriodEnd: s.currentPeriodEnd,
      planCode: s.planCode,
      planName: s.planName,
      status: s.status,
    })),
  };
}

function getStaffValidation(
  dto: CreateCenterStaffDto | UpdateCenterStaffDto,
  isCreate: boolean,
) {
  const errors: Record<string, unknown> = {};
  const fullName = hasValue(dto.fullName)
    ? optionalTrimmed(dto.fullName)
    : undefined;
  const email = hasValue(dto.email)
    ? optionalLowerTrimmed(dto.email)
    : undefined;
  const phone = hasValue(dto.phone) ? optionalTrimmed(dto.phone) : undefined;
  const role = hasValue(dto.role)
    ? optionalTrimmed(dto.role)?.toUpperCase()
    : undefined;
  const status = hasValue(dto.status)
    ? optionalTrimmed(dto.status)?.toUpperCase()
    : undefined;

  if ((isCreate || hasValue(dto.fullName)) && !fullName) {
    errors.fullName = requiredStaffNameError;
  }

  if ((isCreate || hasValue(dto.email)) && (!email || !isValidEmail(email))) {
    errors.email = invalidStaffEmailError;
  }

  if ((isCreate || hasValue(dto.phone)) && (!phone || !isValidPhone(phone))) {
    errors.phone = invalidStaffPhoneError;
  }

  if (
    (isCreate || hasValue(dto.role)) &&
    !isAllowedValue(role, CENTER_STAFF_ROLES)
  ) {
    errors.role = invalidStaffRoleError;
  }

  if (hasValue(dto.status) && !isAllowedValue(status, CENTER_STAFF_STATUSES)) {
    errors.status = invalidStaffStatusError;
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestException({
      message: 'Staff validation failed.',
      errors,
    });
  }

  return {
    email,
    fullName,
    phone,
    role: role as CenterStaffRole | undefined,
    status: status as CenterStaffStatus | undefined,
  };
}

function getStaffRoleName(roleKey: CenterStaffRole) {
  return roleKey
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

@Injectable()
export class CentersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async list(query: ListCentersQueryDto) {
    const prisma = await this.prisma.getClient();
    const { page, pageSize, skip, take } = parsePagination(query);
    const where: Prisma.CenterWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.center.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          owner: { select: safeUserSelect },
          branding: true,
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: safeSubscriptionSelect,
          },
          domains: {
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
            take: 1,
            select: safeDomainSelect,
          },
        },
      }),
      prisma.center.count({ where }),
    ]);

    return {
      data,
      pagination: { page, pageSize, total },
    };
  }

  async getById(centerId: string) {
    if (!UUID_REGEX.test(centerId)) {
      throw new NotFoundException('Center not found.');
    }

    const prisma = await this.prisma.getClient();
    const center = await prisma.center.findUnique({
      where: { id: centerId },
      include: {
        owner: { select: safeUserSelect },
        branding: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          select: safeSubscriptionSelect,
        },
        domains: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          select: safeDomainSelect,
        },
        userRoles: {
          where: { status: ACTIVE_USER_ROLE_STATUS },
          include: { role: true, user: { select: safeUserSelect } },
        },
      },
    });

    if (!center) {
      throw new NotFoundException('Center not found.');
    }

    return center;
  }

  async listAdminCenters() {
    const prisma = await this.prisma.getClient();
    const centers = await prisma.center.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        publicVisible: true,
        createdAt: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            currentPeriodEnd: true,
            planCode: true,
            planName: true,
            status: true,
          },
        },
      },
    });

    const centerIds = centers.map((center) => center.id);
    const assignments = centerIds.length
      ? await prisma.userRole.findMany({
          where: {
            centerId: { in: centerIds },
            status: { not: 'REVOKED' },
            user: { deletedAt: null },
            role: { scope: 'CENTER' },
          },
          select: {
            centerId: true,
            userId: true,
          },
        })
      : [];

    const usersByCenter = new Map<string, Set<string>>();
    for (const assignment of assignments) {
      if (!assignment.centerId) {
        continue;
      }

      const centerUsers =
        usersByCenter.get(assignment.centerId) ?? new Set<string>();
      centerUsers.add(assignment.userId);
      usersByCenter.set(assignment.centerId, centerUsers);
    }

    return {
      data: centers.map((center) =>
        formatAdminCenterSummary(
          center,
          usersByCenter.get(center.id)?.size ?? 0,
        ),
      ),
    };
  }

  async getAdminCenter(centerId: string) {
    if (!UUID_REGEX.test(centerId)) {
      throw new NotFoundException('Center not found.');
    }

    const prisma = await this.prisma.getClient();
    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        publicVisible: true,
        createdAt: true,
      },
    });

    if (!center) {
      throw new NotFoundException('Center not found.');
    }

    const assignments = await prisma.userRole.findMany({
      where: {
        centerId,
        status: { not: 'REVOKED' },
        user: { deletedAt: null },
        role: { scope: 'CENTER' },
      },
      orderBy: { assignedAt: 'asc' },
      select: safeCenterStaffUserRoleSelect,
    });

    const seenUsers = new Set<string>();
    const users = assignments
      .map(formatCenterStaffAssignment)
      .filter((user) => {
        if (seenUsers.has(user.id)) {
          return false;
        }

        seenUsers.add(user.id);
        return true;
      });

    return {
      ...formatAdminCenterSummary(center, users.length),
      users,
    };
  }

  async updateAdminCenterStatus(
    centerId: string,
    dto: UpdateCenterStatusDto,
    authorId: string,
    auditContext?: CenterStatusAuditContext,
  ) {
    await this.updateStatus(centerId, dto, authorId, auditContext);
    const result = await this.getAdminCenter(centerId);
    return result;
  }

  async updateAdminCenterPublicVisibility(
    centerId: string,
    publicVisible: boolean,
    authorId: string,
  ) {
    if (!UUID_REGEX.test(centerId)) {
      throw new NotFoundException('Center not found.');
    }

    const prisma = await this.prisma.getClient();

    await prisma.center.update({
      where: { id: centerId },
      data: { publicVisible },
    });

    await this.auditService.log({
      action: 'center.public_visibility_updated',
      actorUserId: authorId,
      centerId,
      metadata: { publicVisible },
    });

    return this.getAdminCenter(centerId);
  }

  async createAdminCenterLogin(centerId: string, superAdminUserId: string) {
    if (!UUID_REGEX.test(centerId)) {
      throw new NotFoundException('Center not found.');
    }

    const prisma = await this.prisma.getClient();

    return prisma.$transaction(async (tx) => {
      const center = await tx.center.findUnique({
        where: { id: centerId },
        select: {
          id: true,
          name: true,
          ownerUserId: true,
          slug: true,
          status: true,
        },
      });

      if (!center) {
        throw new NotFoundException('Center not found.');
      }

      const superAdmin = await tx.user.findFirst({
        where: {
          id: superAdminUserId,
          deletedAt: null,
          roles: {
            some: {
              centerId: null,
              status: ACTIVE_USER_ROLE_STATUS,
              role: {
                key: 'super_admin',
                scope: 'PLATFORM',
                status: 'ACTIVE',
              },
            },
          },
        },
        select: safeUserSelect,
      });

      if (!superAdmin) {
        throw new BadRequestException({
          message: 'Impersonation validation failed.',
          errors: { superAdmin: 'SUPER_ADMIN role is required.' },
        });
      }

      const ownerAssignment = center.ownerUserId
        ? await tx.userRole.findFirst({
            where: {
              centerId,
              userId: center.ownerUserId,
              status: ACTIVE_USER_ROLE_STATUS,
              user: {
                deletedAt: null,
                status: 'ACTIVE',
                roles: {
                  none: {
                    centerId: null,
                    status: ACTIVE_USER_ROLE_STATUS,
                    role: { key: 'super_admin', scope: 'PLATFORM' },
                  },
                },
              },
              role: {
                key: { in: ['CENTER_OWNER', 'CENTER_MANAGER'] },
                scope: 'CENTER',
                status: 'ACTIVE',
              },
            },
            include: {
              role: { select: { id: true, key: true, name: true } },
              user: { select: safeUserSelect },
            },
          })
        : null;

      const assignment =
        ownerAssignment ??
        (await tx.userRole.findFirst({
          where: {
            centerId,
            status: ACTIVE_USER_ROLE_STATUS,
            user: {
              deletedAt: null,
              status: 'ACTIVE',
              roles: {
                none: {
                  centerId: null,
                  status: ACTIVE_USER_ROLE_STATUS,
                  role: { key: 'super_admin', scope: 'PLATFORM' },
                },
              },
            },
            role: {
              key: { in: ['CENTER_OWNER', 'CENTER_MANAGER'] },
              scope: 'CENTER',
              status: 'ACTIVE',
            },
          },
          orderBy: [{ role: { key: 'asc' } }, { assignedAt: 'asc' }],
          include: {
            role: { select: { id: true, key: true, name: true } },
            user: { select: safeUserSelect },
          },
        }));

      if (!assignment?.user || !assignment.role) {
        throw new ConflictException({
          message: 'Center admin not found',
          errorCode: 'NO_ACTIVE_CENTER_MANAGER',
          errors: {
            user: 'No active center owner or manager is available for this center.',
          },
        });
      }

      await tx.centerInternalNote.create({
        data: {
          authorId: superAdmin.id,
          centerId,
          note: `Super Admin ${superAdmin.fullName || superAdmin.email} (${superAdmin.id}) logged in as ${assignment.user.fullName || assignment.user.email} (${assignment.user.id}) for center ${center.name} (${center.id}).`,
        },
        select: { id: true },
      });

      return {
        center: {
          id: center.id,
          name: center.name,
          slug: center.slug,
          status: center.status,
        },
        impersonatedUser: {
          id: assignment.user.id,
          email: assignment.user.email,
          fullName: assignment.user.fullName,
          status: assignment.user.status,
        },
        role: assignment.role,
      };
    });
  }

  async createAdminCenterManager(
    centerId: string,
    dto: CreateAdminCenterManagerDto,
  ) {
    if (!UUID_REGEX.test(centerId)) {
      throw new NotFoundException('Center not found.');
    }

    const email = optionalLowerTrimmed(dto.email);
    const fullName = optionalTrimmed(dto.fullName);
    const phone = optionalTrimmed(dto.phone);
    const temporaryPassword = dto.temporaryPassword?.trim() ?? '';
    const errors: Record<string, unknown> = {};

    if (!fullName) {
      errors.fullName = requiredStaffNameError;
    }

    if (!email || !isValidEmail(email)) {
      errors.email = invalidStaffEmailError;
    }

    if (phone && !isValidPhone(phone)) {
      errors.phone = invalidStaffPhoneError;
    }

    if (!temporaryPassword) {
      errors.temporaryPassword = requiredTemporaryPasswordError;
    } else if (temporaryPassword.length < 8) {
      errors.temporaryPassword = shortTemporaryPasswordError;
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Center manager validation failed.',
        errors,
      });
    }

    const prisma = await this.prisma.getClient();
    const passwordHash = await hashPassword(temporaryPassword);

    try {
      return await prisma.$transaction(async (tx) => {
        const center = await tx.center.findUnique({
          where: { id: centerId },
          select: { id: true },
        });

        if (!center) {
          throw new NotFoundException('Center not found.');
        }

        const role = await this.ensureCenterStaffRole(
          tx,
          centerId,
          'CENTER_MANAGER',
        );

        const existingUser = await tx.user.findUnique({
          where: { email },
          include: {
            roles: {
              include: { role: true },
            },
          },
        });

        if (
          existingUser?.roles.some(
            (assignment) =>
              assignment.centerId === null &&
              assignment.status === ACTIVE_USER_ROLE_STATUS &&
              assignment.role.key === 'super_admin' &&
              assignment.role.scope === 'PLATFORM',
          )
        ) {
          throw new ConflictException({
            message: 'Center manager validation failed.',
            errors: {
              email:
                'A platform Super Admin cannot be assigned as a center manager.',
            },
          });
        }

        if (existingUser?.deletedAt) {
          throw new ConflictException({
            message: 'Center manager validation failed.',
            errors: {
              email:
                'This user cannot be assigned because the account is deleted.',
            },
          });
        }

        const user = existingUser
          ? await tx.user.update({
              where: { id: existingUser.id },
              data: {
                fullName,
                passwordHash,
                phone: phone || null,
                status: 'ACTIVE',
              },
              select: { id: true },
            })
          : await tx.user.create({
              data: {
                email,
                fullName: fullName ?? '',
                passwordHash,
                phone: phone || null,
                status: 'ACTIVE',
              },
              select: { id: true },
            });

        const existingAssignment = await tx.userRole.findFirst({
          where: {
            centerId,
            userId: user.id,
            role: { scope: 'CENTER' },
          },
          select: { id: true },
        });

        const assignment = existingAssignment
          ? await tx.userRole.update({
              where: { id: existingAssignment.id },
              data: {
                roleId: role.id,
                revokedAt: null,
                status: ACTIVE_USER_ROLE_STATUS,
              },
              select: safeCenterStaffUserRoleSelect,
            })
          : await tx.userRole.create({
              data: {
                centerId,
                roleId: role.id,
                status: ACTIVE_USER_ROLE_STATUS,
                userId: user.id,
              },
              select: safeCenterStaffUserRoleSelect,
            });

        return formatCenterStaffAssignment(assignment);
      });
    } catch (error) {
      this.mapStaffUniqueError(error);
      throw error;
    }
  }

  async listStaff(centerId: string) {
    await this.ensureCenterExists(centerId);
    const prisma = await this.prisma.getClient();
    const assignments = await prisma.userRole.findMany({
      where: {
        centerId,
        role: { scope: 'CENTER', key: { in: [...CENTER_STAFF_ROLES] } },
        status: { not: 'REVOKED' },
        user: { deletedAt: null },
      },
      orderBy: { assignedAt: 'asc' },
      select: safeCenterStaffUserRoleSelect,
    });

    return {
      data: assignments.map(formatCenterStaffAssignment),
    };
  }

  async createStaff(centerId: string, dto: CreateCenterStaffDto) {
    await this.ensureCenterExists(centerId);
    const validation = getStaffValidation(dto, true);
    const prisma = await this.prisma.getClient();

    try {
      return await prisma.$transaction(async (tx) => {
        await this.throwStaffDuplicateErrors(tx, {
          email: validation.email,
          phone: validation.phone,
        });

        const role = await this.ensureCenterStaffRole(
          tx,
          centerId,
          validation.role ?? 'STAFF',
        );
        const user = await tx.user.create({
          data: {
            email: validation.email,
            fullName: validation.fullName ?? '',
            phone: validation.phone,
            status: validation.status ?? 'ACTIVE',
          },
          select: { id: true },
        });

        const assignment = await tx.userRole.create({
          data: {
            centerId,
            roleId: role.id,
            status: ACTIVE_USER_ROLE_STATUS,
            userId: user.id,
          },
          select: safeCenterStaffUserRoleSelect,
        });

        return formatCenterStaffAssignment(assignment);
      });
    } catch (error) {
      this.mapStaffUniqueError(error);
      throw error;
    }
  }

  async updateStaff(
    centerId: string,
    userId: string,
    dto: UpdateCenterStaffDto,
  ) {
    await this.ensureCenterExists(centerId);
    const validation = getStaffValidation(dto, false);
    const prisma = await this.prisma.getClient();

    try {
      return await prisma.$transaction(async (tx) => {
        const existingAssignment = await this.getCenterStaffAssignment(
          tx,
          centerId,
          userId,
        );

        await this.throwStaffDuplicateErrors(tx, {
          email: validation.email,
          phone: validation.phone,
          userId,
        });

        let nextRoleId = existingAssignment.role.id;

        if (validation.role) {
          const role = await this.ensureCenterStaffRole(
            tx,
            centerId,
            validation.role,
          );
          nextRoleId = role.id;
        }

        await tx.user.update({
          where: { id: userId },
          data: {
            ...(validation.email !== undefined
              ? { email: validation.email }
              : {}),
            ...(validation.fullName !== undefined
              ? { fullName: validation.fullName }
              : {}),
            ...(validation.phone !== undefined
              ? { phone: validation.phone }
              : {}),
            ...(validation.status !== undefined
              ? { status: validation.status }
              : {}),
          },
          select: { id: true },
        });

        const assignment = await tx.userRole.update({
          where: { id: existingAssignment.id },
          data: {
            roleId: nextRoleId,
            status:
              validation.status && validation.status !== 'ACTIVE'
                ? 'INACTIVE'
                : ACTIVE_USER_ROLE_STATUS,
            revokedAt: null,
          },
          select: safeCenterStaffUserRoleSelect,
        });

        return formatCenterStaffAssignment(assignment);
      });
    } catch (error) {
      this.mapStaffUniqueError(error);
      throw error;
    }
  }

  async updateStaffStatus(
    centerId: string,
    userId: string,
    dto: UpdateCenterStaffStatusDto,
    actorUserId?: string,
  ) {
    const center = await this.ensureCenterExists(centerId);
    const status = optionalTrimmed(dto.status)?.toUpperCase();

    if (!isAllowedValue(status, CENTER_STAFF_STATUSES)) {
      throw new BadRequestException({
        message: 'Staff validation failed.',
        errors: { status: invalidStaffStatusError },
      });
    }

    const prisma = await this.prisma.getClient();

    const result = await prisma.$transaction(async (tx) => {
      const existingAssignment = await this.getCenterStaffAssignment(
        tx,
        centerId,
        userId,
      );
      const oldStatus =
        existingAssignment.user.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
      const targetEmail = existingAssignment.user.email;
      const targetName = existingAssignment.user.fullName;

      await tx.user.update({
        where: { id: userId },
        data: { status },
        select: { id: true },
      });

      const assignment = await tx.userRole.update({
        where: { id: existingAssignment.id },
        data: {
          status: status === 'ACTIVE' ? ACTIVE_USER_ROLE_STATUS : 'INACTIVE',
          revokedAt: null,
        },
        select: safeCenterStaffUserRoleSelect,
      });

      return {
        oldStatus,
        targetEmail,
        targetName,
        user: formatCenterStaffAssignment(assignment),
      };
    });

    try {
      const actor = actorUserId
        ? await prisma.user.findFirst({
            where: { deletedAt: null, id: actorUserId },
            select: { email: true, fullName: true },
          })
        : null;

      await this.auditService.log({
        action: 'STAFF_STATUS_CHANGED',
        actorUserId,
        centerId,
        targetUserId: userId,
        metadata: {
          actorName: actor?.fullName ?? actor?.email ?? null,
          centerName: center.name,
          newStatus: result.user.status,
          oldStatus: result.oldStatus,
          source: 'CENTER_DETAILS_PAGE',
          targetEmail: result.targetEmail,
          targetName: result.targetName,
        },
      });
    } catch (error) {
      console.error(
        '[CentersService] Failed to write staff status audit log:',
        error,
      );
    }

    return result.user;
  }

  async resetStaffPassword(
    centerId: string,
    userId: string,
    dto: ResetCenterStaffPasswordDto,
    actorUserId?: string,
  ) {
    const center = await this.ensureCenterExists(centerId);
    const temporaryPassword =
      dto.temporaryPassword?.trim() ||
      `RC-temp-${randomBytes(3).toString('hex')}`;

    if (temporaryPassword.length < 8) {
      throw new BadRequestException({
        message: 'Staff validation failed.',
        errors: {
          temporaryPassword: shortStaffTemporaryPasswordError,
        },
      });
    }

    const prisma = await this.prisma.getClient();
    const passwordHash = await hashPassword(temporaryPassword);

    const result = await prisma.$transaction(async (tx) => {
      const existingAssignment = await this.getCenterStaffAssignment(
        tx,
        centerId,
        userId,
      );
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash },
        select: { id: true },
      });
      const assignment = await tx.userRole.findUniqueOrThrow({
        where: { id: existingAssignment.id },
        select: safeCenterStaffUserRoleSelect,
      });

      return {
        user: formatCenterStaffAssignment(assignment),
        resetComplete: true,
        temporaryPassword,
      };
    });

    try {
      const actor = actorUserId
        ? await prisma.user.findFirst({
            where: { deletedAt: null, id: actorUserId },
            select: { email: true, fullName: true },
          })
        : null;

      await this.auditService.log({
        action: 'STAFF_PASSWORD_RESET',
        actorUserId,
        centerId,
        targetUserId: userId,
        metadata: {
          actorName: actor?.fullName ?? actor?.email ?? null,
          centerName: center.name,
          source: 'PASSWORD_RESET',
          targetEmail: result.user.email ?? null,
          targetName: result.user.fullName,
        },
      });
    } catch (error) {
      console.error(
        '[CentersService] Failed to write staff password reset audit log:',
        error,
      );
    }

    return result;
  }

  async listInternalNotes(centerId: string) {
    if (!UUID_REGEX.test(centerId)) {
      throw new NotFoundException('Center not found.');
    }

    const prisma = await this.prisma.getClient();
    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: { id: true, name: true },
    });

    if (!center) {
      throw new NotFoundException('Center not found.');
    }

    return {
      data: await prisma.centerInternalNote.findMany({
        where: { centerId },
        orderBy: { createdAt: 'desc' },
        select: safeCenterInternalNoteSelect,
      }),
    };
  }

  async createInternalNote(
    centerId: string,
    dto: CreateCenterInternalNoteDto,
    requestedAuthorId?: string,
  ) {
    if (!UUID_REGEX.test(centerId)) {
      throw new NotFoundException('Center not found.');
    }

    const note = dto.note?.trim();

    if (!note) {
      throw new BadRequestException({
        message: 'Internal note validation failed.',
        errors: { note: requiredInternalNoteError },
      });
    }

    const prisma = await this.prisma.getClient();

    return prisma.$transaction(async (tx) => {
      const center = await tx.center.findUnique({
        where: { id: centerId },
        select: { id: true },
      });

      if (!center) {
        throw new NotFoundException('Center not found.');
      }

      const author = await this.resolveInternalNoteAuthor(
        tx,
        requestedAuthorId,
      );

      return tx.centerInternalNote.create({
        data: {
          authorId: author.id,
          centerId,
          note,
        },
        select: safeCenterInternalNoteSelect,
      });
    });
  }

  async updateStatus(
    centerId: string,
    dto: UpdateCenterStatusDto,
    requestedAuthorId?: string,
    auditContext?: CenterStatusAuditContext,
  ) {
    if (!UUID_REGEX.test(centerId)) {
      throw new NotFoundException('Center not found.');
    }

    const status = dto.status;
    const reason = dto.reason?.trim();
    const errors: Record<string, unknown> = {};

    if (!isAllowedValue(status, CENTER_STATUS_ACTIONS)) {
      errors.status = invalidCenterStatusError;
    }

    if ((status === 'SUSPENDED' || status === 'CANCELLED') && !reason) {
      errors.reason = requiredStatusReasonError;
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Center status validation failed.',
        errors,
      });
    }

    const prisma = await this.prisma.getClient();

    const result = await prisma.$transaction(async (tx) => {
      const existingCenter = await tx.center.findUnique({
        where: { id: centerId },
        select: { id: true, name: true, slug: true, status: true },
      });

      if (!existingCenter) {
        throw new NotFoundException('Center not found.');
      }

      await tx.center.update({
        where: { id: centerId },
        data: {
          status,
          ...(status === 'ACTIVE' ? { activatedAt: new Date() } : {}),
          ...(status === 'SUSPENDED' ? { suspendedAt: new Date() } : {}),
          ...(status === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
        },
      });

      const author = await this.resolveInternalNoteAuthor(
        tx,
        requestedAuthorId,
      );
      const noteReason = reason ? ` Reason: ${reason}` : '';

      await tx.centerInternalNote.create({
        data: {
          authorId: author.id,
          centerId,
          note: `Status changed from ${existingCenter.status} to ${status}.${noteReason}`,
        },
        select: { id: true },
      });

      const center = await tx.center.findUniqueOrThrow({
        where: { id: centerId },
        include: {
          branding: true,
          domains: {
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
            select: safeDomainSelect,
          },
          owner: { select: safeUserSelect },
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            select: safeSubscriptionSelect,
          },
          userRoles: {
            where: { status: ACTIVE_USER_ROLE_STATUS },
            include: { role: true, user: { select: safeUserSelect } },
          },
        },
      });

      return {
        center,
        oldStatus: existingCenter.status,
      };
    });

    try {
      const actor = requestedAuthorId
        ? await prisma.user.findFirst({
            where: { deletedAt: null, id: requestedAuthorId },
            select: { email: true, fullName: true },
          })
        : null;
      const userAgent = Array.isArray(auditContext?.userAgent)
        ? auditContext?.userAgent[0]
        : auditContext?.userAgent;

      await this.auditService.log({
        action: 'CENTER_STATUS_CHANGED',
        actorUserId: requestedAuthorId,
        centerId,
        metadata: {
          actorEmail: actor?.email ?? null,
          actorName: actor?.fullName ?? actor?.email ?? null,
          centerName: result.center.name,
          centerSlug: result.center.slug,
          changedBy: actor?.fullName ?? actor?.email ?? null,
          device: userAgent ?? null,
          ip: auditContext?.ip ?? null,
          newIsActive: result.center.status === 'ACTIVE',
          newStatus: result.center.status,
          oldIsActive: result.oldStatus === 'ACTIVE',
          oldStatus: result.oldStatus,
          source: 'CENTER_STATUS_UPDATE',
          targetEmail: null,
          targetId: result.center.id,
          targetName: result.center.name,
          targetType: 'CENTER',
          userAgent: userAgent ?? null,
        },
      });
    } catch (error) {
      console.error(
        '[CentersService] Failed to write center status audit log:',
        error,
      );
    }

    return result.center;
  }

  async updateSubscription(
    centerId: string,
    dto: UpdateCenterSubscriptionDto,
    requestedAuthorId?: string,
    auditContext?: SubscriptionAuditContext,
  ) {
    if (!UUID_REGEX.test(centerId)) {
      throw new NotFoundException('Center not found.');
    }

    const validation = getManualSubscriptionValidation(dto);

    if (Object.keys(validation.errors).length > 0) {
      throw new BadRequestException({
        message: 'Subscription validation failed.',
        errors: validation.errors,
      });
    }

    const prisma = await this.prisma.getClient();

    const result = await prisma.$transaction(async (tx) => {
      const existingCenter = await tx.center.findUnique({
        where: { id: centerId },
        include: {
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              currentPeriodEnd: true,
              currentPeriodStart: true,
              id: true,
              planCode: true,
              planName: true,
              status: true,
            },
          },
        },
      });

      if (!existingCenter) {
        throw new NotFoundException('Center not found.');
      }

      const latestSubscription = existingCenter.subscriptions[0];
      const oldStatus = latestSubscription?.status ?? null;
      const oldEndDate = latestSubscription?.currentPeriodEnd ?? null;
      const nextPlan =
        validation.plan ?? latestSubscription?.planCode ?? 'BASIC';
      const nextStatus =
        validation.status &&
        isAllowedValue(validation.status, MANUAL_SUBSCRIPTION_STATUSES)
          ? SUBSCRIPTION_STATUS_MAP[validation.status]
          : (latestSubscription?.status ?? DEFAULT_SUBSCRIPTION_STATUS);
      const nextStartDate =
        validation.startDate ??
        latestSubscription?.currentPeriodStart ??
        new Date();
      const nextEndDate =
        validation.endDate ??
        latestSubscription?.currentPeriodEnd ??
        new Date(nextStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const subscriptionData = {
        ...(validation.billingNotes !== undefined
          ? { billingNotes: validation.billingNotes }
          : {}),
        ...(validation.nextRenewalDate !== undefined
          ? { nextRenewalDate: validation.nextRenewalDate }
          : {}),
        ...(validation.notificationPhone !== undefined
          ? { notificationPhone: validation.notificationPhone || null }
          : {}),
        ...(validation.notificationLanguage !== undefined
          ? { notificationLanguage: validation.notificationLanguage }
          : {}),
        currentPeriodEnd: nextEndDate,
        currentPeriodStart: nextStartDate,
        expiresAt: nextEndDate,
        gracePeriodEndsAt: null,
        planCode: nextPlan,
        planName: PLAN_NAMES[nextPlan as keyof typeof PLAN_NAMES] ?? nextPlan,
        status: nextStatus,
      };

      if (latestSubscription) {
        await tx.subscription.update({
          where: { id: latestSubscription.id },
          data: subscriptionData,
        });
      } else {
        await tx.subscription.create({
          data: {
            ...subscriptionData,
            billingInterval: DEFAULT_BILLING_INTERVAL,
            centerId,
          },
        });
      }

      const author = await this.resolveInternalNoteAuthor(
        tx,
        requestedAuthorId,
      );
      const previousSummary = latestSubscription
        ? `${latestSubscription.planCode}/${latestSubscription.status}`
        : 'none';
      const nextSummary = `${nextPlan}/${nextStatus}`;
      const billingNoteSuffix = validation.billingNotes
        ? ` Billing note: ${validation.billingNotes}`
        : '';

      await tx.centerInternalNote.create({
        data: {
          authorId: author.id,
          centerId,
          note: `Subscription changed from ${previousSummary} to ${nextSummary}.${billingNoteSuffix}`,
        },
        select: { id: true },
      });

      const center = await tx.center.findUniqueOrThrow({
        where: { id: centerId },
        include: {
          branding: true,
          domains: {
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
            select: safeDomainSelect,
          },
          owner: { select: safeUserSelect },
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            select: safeSubscriptionSelect,
          },
          userRoles: {
            where: { status: ACTIVE_USER_ROLE_STATUS },
            include: { role: true, user: { select: safeUserSelect } },
          },
        },
      });

      return {
        center,
        centerName: existingCenter.name,
        newEndDate: nextEndDate,
        newPlanName:
          PLAN_NAMES[nextPlan as keyof typeof PLAN_NAMES] ?? nextPlan,
        newStartDate: nextStartDate,
        newStatus: nextStatus,
        oldEndDate,
        oldPlanName: latestSubscription?.planName ?? null,
        oldStartDate: latestSubscription?.currentPeriodStart ?? null,
        oldStatus,
        planCode: nextPlan,
      };
    });

    try {
      const actor = requestedAuthorId
        ? await prisma.user.findFirst({
            where: { deletedAt: null, id: requestedAuthorId },
            select: { email: true, fullName: true },
          })
        : null;
      const changedFields: string[] = [];
      const oldStartDate = result.oldStartDate?.toISOString() ?? null;
      const newStartDate = result.newStartDate?.toISOString() ?? null;
      const oldEndDate = result.oldEndDate?.toISOString() ?? null;
      const newEndDate = result.newEndDate?.toISOString() ?? null;
      const oldNotificationPhone = null;
      const newNotificationPhone = validation.notificationPhone ?? null;
      const oldNotificationLanguage = null;
      const newNotificationLanguage = validation.notificationLanguage ?? null;

      if (result.oldStatus !== result.newStatus) {
        changedFields.push('status');
      }
      if (result.oldPlanName !== result.newPlanName) {
        changedFields.push('planName');
      }
      if (oldStartDate !== newStartDate) {
        changedFields.push('startDate');
      }
      if (oldEndDate !== newEndDate) {
        changedFields.push('endDate');
      }
      if (validation.notificationPhone !== undefined) {
        changedFields.push('notificationPhone');
      }
      if (validation.notificationLanguage !== undefined) {
        changedFields.push('notificationLanguage');
      }
      if (validation.billingNotes !== undefined) {
        changedFields.push('billingNotes');
      }
      if (validation.nextRenewalDate !== undefined) {
        changedFields.push('nextRenewalDate');
      }

      const baseMetadata = {
        actorEmail: actor?.email ?? null,
        actorName: actor?.fullName ?? actor?.email ?? null,
        centerId,
        centerName: result.centerName,
        changedBy: actor?.fullName ?? actor?.email ?? null,
        changedByEmail: actor?.email ?? null,
        changedFields,
        device: Array.isArray(auditContext?.userAgent)
          ? auditContext.userAgent.join(' ')
          : auditContext?.userAgent,
        ip: auditContext?.ip,
        newEndDate,
        newNotificationLanguage,
        newNotificationPhone,
        newPlanName: result.newPlanName,
        newStartDate,
        newStatus: result.newStatus,
        oldEndDate,
        oldNotificationLanguage,
        oldNotificationPhone,
        oldPlanName: result.oldPlanName,
        oldStartDate,
        oldStatus: result.oldStatus,
        targetEmail: null,
        targetId: centerId,
        targetName: result.centerName,
        targetType: 'CENTER',
        userAgent: Array.isArray(auditContext?.userAgent)
          ? auditContext.userAgent.join(' ')
          : auditContext?.userAgent,
      };
      const nonStatusFields = changedFields.filter(
        (field) => field !== 'status',
      );

      if (nonStatusFields.length > 0) {
        await this.auditService.log({
          action: 'SUBSCRIPTION_UPDATED',
          actorUserId: requestedAuthorId,
          centerId,
          metadata: {
            ...baseMetadata,
            changedFields: nonStatusFields,
          },
        });
      }

      if (result.oldStatus !== result.newStatus) {
        await this.auditService.log({
          action: 'SUBSCRIPTION_STATUS_CHANGED',
          actorUserId: requestedAuthorId,
          centerId,
          metadata: {
            ...baseMetadata,
            changedFields: ['status'],
          },
        });
      }
    } catch (error) {
      console.error(
        '[CentersService] Failed to write subscription audit log:',
        error,
      );
    }

    // Trigger subscription lifecycle notifications (fire-and-forget)
    this.triggerSubscriptionNotifications({
      centerId,
      centerName: result.centerName,
      newPlanName: result.newPlanName,
      newStatus: result.newStatus,
      oldStatus: result.oldStatus,
      newEndDate: result.newEndDate,
    }).catch((error) => {
      console.error(
        '[CentersService] Failed to create subscription notification:',
        error,
      );
    });

    return result.center;
  }

  private async triggerSubscriptionNotifications(context: {
    centerId: string;
    centerName: string;
    newPlanName: string;
    newStatus: string;
    oldStatus: string | null;
    newEndDate: Date;
  }) {
    const {
      centerId,
      centerName,
      newPlanName,
      newStatus,
      oldStatus,
      newEndDate,
    } = context;
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysRemaining = Math.ceil(
      (newEndDate.getTime() - now.getTime()) / msPerDay,
    );

    if (newStatus === 'EXPIRED' || daysRemaining < 0) {
      await this.notificationsService.createSuperAdminSubscriptionNotification({
        centerId,
        type: 'SUBSCRIPTION_EXPIRED',
        titleEn: 'Subscription expired',
        titleAr: 'انتهى الاشتراك',
        titleHe: 'המינוי פג',
        messageEn: `The subscription for ${centerName} has expired.`,
        messageAr: `انتهى اشتراك مركز ${centerName}.`,
        messageHe: `המינוי של ${centerName} פג תוקפו.`,
        metadata: {
          centerName,
          newStatus,
          daysRemaining,
          endDate: newEndDate.toISOString(),
        },
      });
      return;
    }

    if (newStatus === 'SUSPENDED') {
      await this.notificationsService.createSuperAdminSubscriptionNotification({
        centerId,
        type: 'SUBSCRIPTION_SUSPENDED',
        titleEn: 'Subscription suspended',
        titleAr: 'تم إيقاف الاشتراك',
        titleHe: 'המינוי הושעה',
        messageEn: `The subscription for ${centerName} was suspended.`,
        messageAr: `تم إيقاف اشتراك مركز ${centerName}.`,
        messageHe: `המינוי של ${centerName} הושעה.`,
        metadata: {
          centerName,
          newStatus,
          oldStatus,
          endDate: newEndDate.toISOString(),
        },
      });
      return;
    }

    if (newStatus === 'ACTIVE' && oldStatus && oldStatus !== 'ACTIVE') {
      await this.notificationsService.createSuperAdminSubscriptionNotification({
        centerId,
        type: 'SUBSCRIPTION_RENEWED',
        titleEn: 'Subscription renewed',
        titleAr: 'تم تجديد الاشتراك',
        titleHe: 'המינוי חודש',
        messageEn: `The subscription for ${centerName} was renewed on ${newPlanName}.`,
        messageAr: `تم تجديد اشتراك مركز ${centerName} على باقة ${newPlanName}.`,
        messageHe: `המינוי של ${centerName} חודש בתוכנית ${newPlanName}.`,
        metadata: {
          centerName,
          newPlanName,
          newStatus,
          oldStatus,
          endDate: newEndDate.toISOString(),
        },
      });
    }

    if (
      (newStatus === 'ACTIVE' || newStatus === 'TRIALING') &&
      daysRemaining >= 0 &&
      daysRemaining <= 3
    ) {
      await this.notificationsService.createSuperAdminSubscriptionNotification({
        centerId,
        type:
          newStatus === 'TRIALING'
            ? 'TRIAL_ENDING_SOON'
            : 'SUBSCRIPTION_EXPIRING',
        titleEn:
          newStatus === 'TRIALING'
            ? 'Trial ending soon'
            : 'Subscription expiring soon',
        titleAr:
          newStatus === 'TRIALING'
            ? 'الفترة التجريبية تنتهي قريباً'
            : 'الاشتراك ينتهي قريباً',
        titleHe:
          newStatus === 'TRIALING'
            ? 'תקופת הניסיון עומדת להסתיים'
            : 'המינוי עומד לפוג בקרוב',
        messageEn: `The subscription for ${centerName} expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`,
        messageAr: `ينتهي اشتراك مركز ${centerName} خلال ${daysRemaining} ${daysRemaining === 1 ? 'يوم' : 'أيام'}.`,
        messageHe: `המינוי של ${centerName} יפוג בעוד ${daysRemaining} ${daysRemaining === 1 ? 'יום' : 'ימים'}.`,
        metadata: {
          centerName,
          newStatus,
          daysRemaining,
          endDate: newEndDate.toISOString(),
        },
      });
    }
  }

  private async ensureCenterExists(centerId: string) {
    if (!UUID_REGEX.test(centerId)) {
      throw new NotFoundException('Center not found.');
    }

    const prisma = await this.prisma.getClient();
    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: { id: true, name: true },
    });

    if (!center) {
      throw new NotFoundException('Center not found.');
    }

    return center;
  }

  private async ensureCenterStaffRole(
    tx: Prisma.TransactionClient,
    centerId: string,
    roleKey: CenterStaffRole,
  ) {
    const existingRole = await tx.role.findFirst({
      where: {
        centerId,
        key: roleKey,
        scope: 'CENTER',
      },
      select: { id: true },
    });

    if (existingRole) {
      return existingRole;
    }

    return tx.role.create({
      data: {
        centerId,
        key: roleKey,
        name: getStaffRoleName(roleKey),
        description: `${getStaffRoleName(roleKey)} center staff role.`,
        scope: 'CENTER',
        status: 'ACTIVE',
        isSystem: true,
      },
      select: { id: true },
    });
  }

  private async getCenterStaffAssignment(
    tx: Prisma.TransactionClient,
    centerId: string,
    userId: string,
  ) {
    if (!UUID_REGEX.test(userId)) {
      throw new NotFoundException('Staff user not found.');
    }

    const assignment = await tx.userRole.findFirst({
      where: {
        centerId,
        userId,
        role: { scope: 'CENTER', key: { in: [...CENTER_STAFF_ROLES] } },
        user: { deletedAt: null },
      },
      select: safeCenterStaffUserRoleSelect,
    });

    if (!assignment) {
      throw new NotFoundException('Staff user not found.');
    }

    return assignment;
  }

  private async throwStaffDuplicateErrors(
    tx: Prisma.TransactionClient,
    values: { email?: string; phone?: string; userId?: string },
  ) {
    const errors: Record<string, unknown> = {};

    if (values.email) {
      const existingUser = await tx.user.findUnique({
        where: { email: values.email },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== values.userId) {
        errors.email = duplicateStaffEmailError;
      }
    }

    if (values.phone) {
      const existingUser = await tx.user.findUnique({
        where: { phone: values.phone },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== values.userId) {
        errors.phone = duplicateStaffPhoneError;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ConflictException({
        message: 'Staff validation failed.',
        errors,
      });
    }
  }

  private mapStaffUniqueError(error: unknown) {
    if (!isPrismaKnownRequestError(error) || error.code !== 'P2002') {
      return;
    }

    const rawTarget = (error as { meta?: { target?: unknown } }).meta?.target;
    const target: string[] = Array.isArray(rawTarget)
      ? rawTarget.filter((item): item is string => typeof item === 'string')
      : typeof rawTarget === 'string'
        ? [rawTarget]
        : [];

    if (target.includes('phone')) {
      throw new ConflictException({
        message: 'Staff validation failed.',
        errors: { phone: duplicateStaffPhoneError },
      });
    }

    if (target.includes('email')) {
      throw new ConflictException({
        message: 'Staff validation failed.',
        errors: { email: duplicateStaffEmailError },
      });
    }
  }

  private async resolveInternalNoteAuthor(
    tx: Prisma.TransactionClient,
    requestedAuthorId?: string,
  ) {
    if (requestedAuthorId && UUID_REGEX.test(requestedAuthorId)) {
      const requestedAuthor = await tx.user.findFirst({
        where: { id: requestedAuthorId, status: { not: 'DELETED' } },
        select: { id: true },
      });

      if (requestedAuthor) {
        return requestedAuthor;
      }
    }

    const platformUserRole = await tx.userRole.findFirst({
      where: {
        status: ACTIVE_USER_ROLE_STATUS,
        role: { scope: 'PLATFORM', status: 'ACTIVE' },
        user: { status: { not: 'DELETED' } },
      },
      orderBy: { assignedAt: 'asc' },
      select: { userId: true },
    });

    if (platformUserRole) {
      return { id: platformUserRole.userId };
    }

    const fallbackUser = await tx.user.findFirst({
      where: { status: { not: 'DELETED' } },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!fallbackUser) {
      throw new BadRequestException({
        message: 'Internal note author could not be resolved.',
        errors: {
          authorId:
            'A Super Admin author is required before creating internal notes.',
        },
      });
    }

    return fallbackUser;
  }

  async update(centerId: string, dto: UpdateCenterDto) {
    if (!UUID_REGEX.test(centerId)) {
      throw new NotFoundException('Center not found.');
    }

    const validation = getUpdateCenterValidation(dto);
    throwUpdateValidationErrors(validation.errors);

    const prisma = await this.prisma.getClient();

    try {
      return await prisma.$transaction(async (tx) => {
        const existingCenter = await tx.center.findUnique({
          where: { id: centerId },
          include: {
            domains: {
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
              take: 1,
              select: { id: true, hostname: true },
            },
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true },
            },
            userRoles: {
              where: { status: ACTIVE_USER_ROLE_STATUS },
              orderBy: { assignedAt: 'desc' },
              take: 1,
              select: { userId: true },
            },
            branding: {
              select: { centerId: true, enabledLanguages: true },
            },
          },
        });

        if (!existingCenter) {
          throw new NotFoundException('Center not found.');
        }

        // Resolve the admin user ID: prefer ownerUserId, fall back to first active role.
        const adminUserId =
          existingCenter.ownerUserId ?? existingCenter.userRoles[0]?.userId;

        // Load the current admin user now so duplicate checks and the update step
        // both operate against the exact same user record.
        const currentAdmin = adminUserId
          ? await tx.user.findUnique({
              where: { id: adminUserId },
              select: { email: true, fullName: true, id: true, phone: true },
            })
          : null;

        const duplicateErrors: Record<string, unknown> = {};

        // Email duplicate check: only run when the incoming email differs from the
        // stored email (normalized). When unchanged, skip — no query, no false conflict.
        if (validation.adminEmail) {
          const incomingEmail = validation.adminEmail; // already lowercased by optionalLowerTrimmed
          const storedEmail = currentAdmin?.email?.trim().toLowerCase() ?? null;

          if (incomingEmail !== storedEmail) {
            const emailConflict = await tx.user.findUnique({
              where: { email: incomingEmail },
              select: { id: true },
            });

            if (emailConflict && emailConflict.id !== adminUserId) {
              duplicateErrors.adminEmail = duplicateAdminEmailError;
            }
          }
        }

        // Phone duplicate check: same strategy — skip when phone is unchanged,
        // otherwise check for a conflict on a different user.
        if (validation.adminPhone) {
          const incomingPhone = validation.adminPhone;
          const storedPhone = currentAdmin?.phone ?? null;

          if (incomingPhone !== storedPhone) {
            const phoneConflict = await tx.user.findUnique({
              where: { phone: incomingPhone },
              select: { id: true },
            });

            if (phoneConflict && phoneConflict.id !== adminUserId) {
              duplicateErrors.adminPhone = duplicateAdminPhoneError;
            }
          }
        }

        if (validation.domainHostname) {
          const existingDomain = await tx.domain.findUnique({
            where: { hostname: validation.domainHostname },
            select: { centerId: true, id: true },
          });

          if (existingDomain && existingDomain.centerId !== centerId) {
            duplicateErrors.domain = duplicateDomainError;
          }
        }

        if (Object.keys(duplicateErrors).length > 0) {
          throwDuplicateAdminError(duplicateErrors);
        }

        let nextOwnerUserId = existingCenter.ownerUserId;

        if (dto.admin) {
          if (adminUserId && currentAdmin) {
            const adminUpdateData: Record<string, string | null> = {};

            // Only include email if it actually changed after normalization.
            const incomingEmail = validation.adminEmail;
            const storedEmail =
              currentAdmin.email?.trim().toLowerCase() ?? null;
            if (incomingEmail !== undefined && incomingEmail !== storedEmail) {
              adminUpdateData.email = incomingEmail;
            }

            if (
              validation.adminPhone !== undefined &&
              validation.adminPhone !== currentAdmin.phone
            ) {
              adminUpdateData.phone = validation.adminPhone;
            }

            if (
              validation.adminFullName !== undefined &&
              validation.adminFullName !== currentAdmin.fullName
            ) {
              adminUpdateData.fullName = validation.adminFullName;
            }

            if (Object.keys(adminUpdateData).length > 0) {
              await tx.user.update({
                where: { id: adminUserId },
                data: adminUpdateData,
              });
            }

            nextOwnerUserId = existingCenter.ownerUserId ?? adminUserId;
          } else if (
            validation.adminFullName &&
            validation.adminEmail &&
            validation.adminPhone
          ) {
            const newAdminUser = await tx.user.create({
              data: {
                email: validation.adminEmail,
                fullName: validation.adminFullName,
                phone: validation.adminPhone,
                status: DEFAULT_USER_STATUS,
              },
              select: { id: true },
            });
            nextOwnerUserId = newAdminUser.id;
          }
        }

        const centerData: Prisma.CenterUncheckedUpdateInput = {
          ...(validation.centerName !== undefined
            ? { name: validation.centerName }
            : {}),
          ...(validation.centerNameAr !== undefined
            ? { nameAr: validation.centerNameAr }
            : {}),
          ...(validation.centerNameEn !== undefined
            ? { nameEn: validation.centerNameEn }
            : {}),
          ...(validation.centerNameHe !== undefined
            ? { nameHe: validation.centerNameHe }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(validation.primaryLanguage !== undefined
            ? { primaryLanguage: validation.primaryLanguage }
            : {}),
          ...(nextOwnerUserId !== existingCenter.ownerUserId
            ? { ownerUserId: nextOwnerUserId }
            : {}),
        };

        await tx.center.update({
          where: { id: centerId },
          data: centerData,
        });

        if (validation.primaryLanguage !== undefined) {
          const enabledLanguages = Array.isArray(
            existingCenter.branding?.enabledLanguages,
          )
            ? existingCenter.branding.enabledLanguages.filter(
                (language): language is string => typeof language === 'string',
              )
            : [];
          const nextEnabledLanguages = enabledLanguages.includes(
            validation.primaryLanguage,
          )
            ? enabledLanguages
            : [...enabledLanguages, validation.primaryLanguage];

          if (existingCenter.branding) {
            await tx.brandingSettings.update({
              where: { centerId },
              data: {
                defaultLanguage: validation.primaryLanguage,
                enabledLanguages: nextEnabledLanguages,
              },
            });
          }
        }

        if (dto.subscription) {
          const latestSubscription = existingCenter.subscriptions[0];
          const subscriptionData = {
            ...(dto.subscription.billingInterval !== undefined
              ? { billingInterval: dto.subscription.billingInterval }
              : {}),
            ...(validation.expiryDate !== undefined
              ? {
                  currentPeriodEnd: validation.expiryDate,
                  expiresAt: validation.expiryDate,
                }
              : {}),
            ...(validation.startDate !== undefined
              ? { currentPeriodStart: validation.startDate }
              : {}),
            ...(dto.subscription.planCode !== undefined
              ? { planCode: dto.subscription.planCode.trim() }
              : {}),
            ...(dto.subscription.planName !== undefined
              ? { planName: dto.subscription.planName.trim() }
              : {}),
            ...(dto.subscription.status !== undefined
              ? { status: dto.subscription.status }
              : {}),
            // Clear grace period when admin manually updates the subscription
            ...(dto.subscription.status !== undefined ||
            validation.expiryDate !== undefined
              ? { gracePeriodEndsAt: null }
              : {}),
          };

          if (latestSubscription) {
            await tx.subscription.update({
              where: { id: latestSubscription.id },
              data: subscriptionData,
            });
          } else if (
            dto.subscription.planCode &&
            dto.subscription.planName &&
            validation.startDate &&
            validation.expiryDate
          ) {
            await tx.subscription.create({
              data: {
                billingInterval:
                  dto.subscription.billingInterval ?? DEFAULT_BILLING_INTERVAL,
                centerId,
                currentPeriodEnd: validation.expiryDate,
                currentPeriodStart: validation.startDate,
                expiresAt: validation.expiryDate,
                planCode: dto.subscription.planCode.trim(),
                planName: dto.subscription.planName.trim(),
                status: dto.subscription.status ?? DEFAULT_SUBSCRIPTION_STATUS,
              },
            });
          }
        }

        if (dto.domain) {
          const primaryDomain = existingCenter.domains[0];
          const domainData = {
            ...(validation.domainHostname !== undefined
              ? { hostname: validation.domainHostname }
              : {}),
            ...(dto.domain.isPrimary !== undefined
              ? { isPrimary: dto.domain.isPrimary }
              : {}),
            ...(dto.domain.status !== undefined
              ? { status: dto.domain.status }
              : {}),
            ...(dto.domain.type !== undefined ? { type: dto.domain.type } : {}),
          };

          if (primaryDomain) {
            await tx.domain.update({
              where: { id: primaryDomain.id },
              data: domainData,
            });
          } else if (validation.domainHostname) {
            await tx.domain.create({
              data: {
                centerId,
                hostname: validation.domainHostname,
                isPrimary: dto.domain.isPrimary ?? true,
                status: dto.domain.status ?? 'PENDING',
                type: dto.domain.type ?? 'CUSTOM',
              },
            });
          }
        }

        return tx.center.findUniqueOrThrow({
          where: { id: centerId },
          include: {
            branding: true,
            domains: {
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
              select: safeDomainSelect,
            },
            owner: { select: safeUserSelect },
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              select: safeSubscriptionSelect,
            },
            userRoles: {
              where: { status: ACTIVE_USER_ROLE_STATUS },
              include: { role: true, user: { select: safeUserSelect } },
            },
          },
        });
      });
    } catch (error) {
      if (isPrismaKnownRequestError(error) && error.code === 'P2002') {
        const rawTarget = (error as { meta?: { target?: unknown } }).meta
          ?.target;
        const target: string[] = Array.isArray(rawTarget)
          ? rawTarget.filter((item): item is string => typeof item === 'string')
          : typeof rawTarget === 'string'
            ? [rawTarget]
            : [];

        if (target.includes('phone')) {
          throwDuplicateAdminError({ adminPhone: duplicateAdminPhoneError });
        }

        if (target.includes('email')) {
          throwDuplicateAdminError({ adminEmail: duplicateAdminEmailError });
        }

        if (
          target.includes('hostname') ||
          target.some((item) => item.toLowerCase().includes('domain'))
        ) {
          throw new ConflictException({
            message: 'Domain validation failed.',
            errors: { domain: duplicateDomainError },
          });
        }
      }

      throw error;
    }
  }

  async create(dto: CreateCenterDto) {
    validateCreateCenterDto(dto);
    const prisma = await this.prisma.getClient();

    try {
      return await prisma.$transaction(async (tx) => {
        const adminEmail = dto.admin?.email?.trim().toLowerCase();
        const adminPhone = dto.admin?.phone?.trim();
        const adminFullName = dto.admin?.fullName?.trim() || dto.name;
        const adminPasswordHash = dto.admin?.temporaryPassword
          ? await hashPassword(dto.admin.temporaryPassword)
          : undefined;

        if (dto.admin) {
          const duplicateErrors: Record<string, unknown> = {};

          if (adminEmail) {
            const existingEmailUser = await tx.user.findUnique({
              where: { email: adminEmail },
              select: { id: true },
            });

            if (
              existingEmailUser &&
              (!dto.admin.userId || existingEmailUser.id !== dto.admin.userId)
            ) {
              duplicateErrors.adminEmail = duplicateAdminEmailError;
            }
          }

          if (adminPhone) {
            const existingPhoneUser = await tx.user.findUnique({
              where: { phone: adminPhone },
              select: { id: true },
            });

            if (
              existingPhoneUser &&
              (!dto.admin.userId || existingPhoneUser.id !== dto.admin.userId)
            ) {
              duplicateErrors.adminPhone = duplicateAdminPhoneError;
            }
          }

          if (Object.keys(duplicateErrors).length > 0) {
            throwDuplicateAdminError(duplicateErrors);
          }
        }

        const adminUser = dto.admin
          ? dto.admin.userId
            ? await tx.user.update({
                where: { id: dto.admin.userId },
                data: {
                  email: adminEmail,
                  phone: adminPhone,
                  ...(adminPasswordHash
                    ? { passwordHash: adminPasswordHash }
                    : {}),
                  fullName: adminFullName,
                  status: DEFAULT_USER_STATUS,
                },
              })
            : await tx.user.create({
                data: {
                  email: adminEmail,
                  phone: adminPhone,
                  passwordHash: adminPasswordHash,
                  fullName: adminFullName,
                  status: DEFAULT_USER_STATUS,
                },
              })
          : null;

        const slug = await createUniqueSlug(tx, dto.name, dto.slug);
        const primaryLanguage =
          dto.primaryLanguage ?? dto.branding?.defaultLanguage ?? 'EN';

        const center = await tx.center.create({
          data: {
            name: dto.name,
            nameAr: optionalTrimmed(dto.nameAr) || null,
            nameEn: optionalTrimmed(dto.nameEn) || null,
            nameHe: optionalTrimmed(dto.nameHe) || null,
            slug,
            type: dto.type,
            status: dto.status ?? DEFAULT_CENTER_STATUS,
            primaryLanguage,
            timezone: dto.timezone ?? DEFAULT_TIMEZONE,
            ownerUserId: adminUser?.id,
          },
        });

        if (dto.admin && adminUser) {
          const role = await tx.role.create({
            data: {
              centerId: center.id,
              key: 'CENTER_OWNER',
              name: 'Center Owner',
              description: 'Full-access owner role assigned to the initial center admin.',
              scope: 'CENTER',
            },
          });

          await tx.userRole.create({
            data: {
              centerId: center.id,
              roleId: role.id,
              userId: adminUser.id,
              status: ACTIVE_USER_ROLE_STATUS,
            },
          });
        }

        if (dto.branding) {
          await tx.brandingSettings.create({
            data: {
              centerId: center.id,
              defaultLanguage: dto.branding.defaultLanguage,
              enabledLanguages: dto.branding.enabledLanguages,
              logoUrl: dto.branding.logoUrl,
              primaryColor: dto.branding.primaryColor,
              secondaryColor: dto.branding.secondaryColor,
              theme: dto.branding.theme as Prisma.InputJsonValue | undefined,
            },
          });
        }

        if (dto.subscription) {
          await tx.subscription.create({
            data: {
              centerId: center.id,
              planCode: dto.subscription.planCode,
              planName: dto.subscription.planName,
              billingInterval:
                dto.subscription.billingInterval ?? DEFAULT_BILLING_INTERVAL,
              status: dto.subscription.status ?? DEFAULT_SUBSCRIPTION_STATUS,
              currentPeriodStart: new Date(dto.subscription.currentPeriodStart),
              currentPeriodEnd: new Date(dto.subscription.currentPeriodEnd),
              trialEndsAt: optionalDate(dto.subscription.trialEndsAt),
            },
          });
        }

        if (dto.domain?.hostname?.trim()) {
          await tx.domain.create({
            data: {
              centerId: center.id,
              hostname: dto.domain.hostname.trim().toLowerCase(),
              type: dto.domain.type ?? 'CUSTOM',
              status: dto.domain.status ?? 'PENDING',
              isPrimary: dto.domain.isPrimary ?? true,
            },
          });
        }

        return tx.center.findUniqueOrThrow({
          where: { id: center.id },
          include: {
            branding: true,
            domains: {
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
              select: safeDomainSelect,
            },
            owner: { select: safeUserSelect },
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              select: safeSubscriptionSelect,
            },
            userRoles: {
              include: { role: true, user: { select: safeUserSelect } },
            },
          },
        });
      });
    } catch (error) {
      if (isPrismaKnownRequestError(error) && error.code === 'P2002') {
        const rawTarget = (error as { meta?: { target?: unknown } }).meta
          ?.target;
        const target: string[] = Array.isArray(rawTarget)
          ? rawTarget.filter((item): item is string => typeof item === 'string')
          : typeof rawTarget === 'string'
            ? [rawTarget]
            : [];

        if (target.includes('phone')) {
          throwDuplicateAdminError({ adminPhone: duplicateAdminPhoneError });
        }

        if (target.includes('email')) {
          throwDuplicateAdminError({ adminEmail: duplicateAdminEmailError });
        }

        if (
          target.includes('hostname') ||
          target.some((item) => item.toLowerCase().includes('domain')) ||
          dto.domain?.hostname?.trim()
        ) {
          throw new ConflictException({
            message: 'Domain validation failed.',
            errors: { domain: duplicateDomainError },
          });
        }

        throw new ConflictException({
          message: 'A unique value already exists.',
          errors: { unique: 'A unique value already exists.' },
        });
      }

      throw error;
    }
  }
}
