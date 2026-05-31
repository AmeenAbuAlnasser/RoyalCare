import { Injectable } from '@nestjs/common';
import type { Prisma } from '@royalcare/db';
import { PrismaService } from '../../common/database/prisma.service';

export type AuditAction =
  | 'CENTER_ACTIVATED'
  | 'CENTER_DEACTIVATED'
  | 'CENTER_STATUS_CHANGED'
  | 'PASSWORD_RESET'
  | 'STAFF_PASSWORD_RESET'
  | 'STAFF_STATUS_CHANGED'
  | 'TENANT_STAFF_STATUS_CHANGED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_STATUS_CHANGED'
  | 'SUBSCRIPTION_INVOICE_CREATED'
  | 'SUBSCRIPTION_INVOICE_PAID'
  | 'SUBSCRIPTION_INVOICE_CANCELLED'
  | 'SUBSCRIPTION_INVOICE_DOWNLOADED'
  | 'TENANT_INVOICE_CREATED'
  | 'TENANT_INVOICE_CANCELLED'
  | 'TENANT_INVOICE_RESTORED'
  | 'TENANT_INVOICE_STATUS_CHANGED'
  | 'TENANT_PAYMENT_ADDED'
  | 'TENANT_CREDIT_CREATED'
  | 'TENANT_CREDIT_USED'
  | 'TENANT_PATIENT_CREATED'
  | 'TENANT_PATIENT_UPDATED'
  | 'TENANT_PATIENT_STATUS_CHANGED'
  | 'TENANT_PATIENT_RESTORED'
  | 'TENANT_PATIENT_DELETED'
  | 'TENANT_APPOINTMENT_CREATED'
  | 'TENANT_APPOINTMENT_UPDATED'
  | 'TENANT_APPOINTMENT_STATUS_CHANGED'
  | 'TENANT_APPOINTMENT_CANCELLED'
  | 'TENANT_APPOINTMENT_RESTORED'
  | 'USER_UPDATED'
  | 'USER_STATUS_CHANGED'
  | 'LOGIN_AS_CENTER'
  | 'user.created'
  | 'user.updated'
  | 'user.status_changed'
  | 'user.password_reset'
  | 'user.center_role_assigned'
  | 'user.center_role_removed'
  | 'center.login_as'
  | 'center.public_visibility_updated'
  | 'SUBSCRIPTION_RENEWAL_REQUESTED'
  | 'BOOKING_REQUEST_ACCEPTED'
  | 'BOOKING_REQUEST_REJECTED'
  | 'APPOINTMENT_REMINDER_SENT';

export type LogAuditParams = {
  action: AuditAction;
  actorUserId?: string;
  targetUserId?: string;
  centerId?: string;
  metadata?: Prisma.InputJsonValue;
};

export type ListAuditLogsParams = {
  actorUserId?: string;
  actorSearch?: string;
  targetUserId?: string;
  targetSearch?: string;
  centerId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_SYSTEM_ADMIN_EMAIL = 'super.admin@royalcare.local';

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

@Injectable()
export class AuditService {
  constructor(private readonly prismaService: PrismaService) {}

  async log(params: LogAuditParams): Promise<void> {
    try {
      const prisma = await this.prismaService.getClient();
      const actorUserId = await this.resolveOptionalUserId(
        prisma,
        params.actorUserId,
        true,
      );
      const targetUserId = await this.resolveOptionalUserId(
        prisma,
        params.targetUserId,
      );
      const centerId = await this.resolveOptionalCenterId(
        prisma,
        params.centerId,
      );
      const metadata = this.buildMetadata(params, {
        actorUserId,
        centerId,
        targetUserId,
      });

      await prisma.auditLog.create({
        data: {
          action: params.action,
          actorUserId,
          targetUserId,
          centerId,
          metadata,
        },
      });
    } catch (err) {
      console.error(
        '[AuditService] Failed to write audit log:',
        params.action,
        err,
      );
    }
  }

  async list(params: ListAuditLogsParams) {
    const prisma = await this.prismaService.getClient();

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 50));
    const skip = (page - 1) * pageSize;

    const where: {
      actorUserId?: string | { in: string[] };
      targetUserId?: string | { in: string[] };
      centerId?: string;
      action?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    // actorSearch: free-text search on actor name/email
    if (params.actorSearch?.trim()) {
      const search = params.actorSearch.trim();
      const matchingActors = await prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
        take: 200,
      });
      where.actorUserId = { in: matchingActors.map((u) => u.id) };
    } else if (
      params.actorUserId?.trim() &&
      isUuid(params.actorUserId.trim())
    ) {
      // actorUserId: exact UUID filter (ignored silently if not a valid UUID)
      where.actorUserId = params.actorUserId.trim();
    }

    if (params.targetSearch?.trim()) {
      const search = params.targetSearch.trim();
      const matchingTargets = await prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
        take: 200,
      });
      where.targetUserId = { in: matchingTargets.map((u) => u.id) };
    } else if (
      params.targetUserId?.trim() &&
      isUuid(params.targetUserId.trim())
    ) {
      where.targetUserId = params.targetUserId.trim();
    }

    // centerId: only use if valid UUID
    if (params.centerId?.trim() && isUuid(params.centerId.trim())) {
      where.centerId = params.centerId.trim();
    }

    if (params.action?.trim()) {
      where.action = params.action.trim();
    }

    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
      if (params.dateTo) {
        const end = new Date(params.dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, data] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, fullName: true, email: true } },
          target: { select: { id: true, fullName: true, email: true } },
          center: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);

    return {
      data: data.map((entry) => this.formatAuditEntry(entry)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private formatAuditEntry(
    entry: Prisma.AuditLogGetPayload<{
      include: {
        actor: { select: { id: true; fullName: true; email: true } };
        center: { select: { id: true; name: true; slug: true } };
        target: { select: { id: true; fullName: true; email: true } };
      };
    }>,
  ) {
    const metadata = this.getMetadataRecord(entry.metadata);
    const mappedTarget = this.getTenantBillingTarget(entry.action, metadata);
    const targetId = mappedTarget?.targetId ?? entry.targetUserId ?? null;
    const targetName =
      mappedTarget?.targetName ??
      this.getMetadataString(metadata, 'targetName') ??
      entry.target?.fullName ??
      entry.target?.email ??
      null;

    return {
      ...entry,
      actionLabel: this.getActionLabel(entry.action, metadata),
      actorEmail:
        this.getMetadataString(metadata, 'actorEmail') ??
        entry.actor?.email ??
        null,
      actorDisplayName:
        this.getMetadataString(metadata, 'actorName') ??
        entry.actor?.fullName ??
        entry.actor?.email ??
        null,
      actorName:
        this.getMetadataString(metadata, 'actorName') ??
        entry.actor?.fullName ??
        entry.actor?.email ??
        null,
      centerDisplayName:
        this.getMetadataString(metadata, 'centerName') ??
        entry.center?.name ??
        null,
      centerName:
        this.getMetadataString(metadata, 'centerName') ??
        entry.center?.name ??
        null,
      readableActionAr: this.getReadableActionAr(entry.action, metadata),
      targetEmail:
        this.getMetadataString(metadata, 'targetEmail') ??
        entry.target?.email ??
        null,
      targetDisplayName: targetName,
      targetDisplayEmail:
        this.getMetadataString(metadata, 'targetEmail') ??
        entry.target?.email ??
        null,
      targetId,
      targetName: targetName,
    };
  }

  private getMetadataRecord(
    metadata: Prisma.JsonValue,
  ): Record<string, Prisma.JsonValue> {
    return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Record<string, Prisma.JsonValue>)
      : {};
  }

  private getMetadataString(
    metadata: Record<string, Prisma.JsonValue>,
    key: string,
  ) {
    const value = metadata[key];

    return typeof value === 'string' ? value : null;
  }

  private getTenantBillingTarget(
    action: string,
    metadata: Record<string, Prisma.JsonValue>,
  ) {
    const invoiceTargetActions = [
      'TENANT_INVOICE_CREATED',
      'TENANT_PAYMENT_ADDED',
      'TENANT_INVOICE_CANCELLED',
      'TENANT_INVOICE_RESTORED',
      'TENANT_INVOICE_STATUS_CHANGED',
    ];
    const patientTargetActions = [
      'TENANT_CREDIT_CREATED',
      'TENANT_CREDIT_USED',
      'TENANT_PATIENT_CREATED',
      'TENANT_PATIENT_UPDATED',
      'TENANT_PATIENT_STATUS_CHANGED',
      'TENANT_PATIENT_RESTORED',
      'TENANT_PATIENT_DELETED',
    ];
    const appointmentTargetActions = [
      'TENANT_APPOINTMENT_CREATED',
      'TENANT_APPOINTMENT_UPDATED',
      'TENANT_APPOINTMENT_STATUS_CHANGED',
      'TENANT_APPOINTMENT_CANCELLED',
      'TENANT_APPOINTMENT_RESTORED',
    ];

    if (invoiceTargetActions.includes(action)) {
      return {
        targetId: this.getMetadataString(metadata, 'invoiceId'),
        targetName:
          this.getMetadataString(metadata, 'invoiceNumber') ??
          this.getMetadataString(metadata, 'patientName'),
      };
    }

    if (patientTargetActions.includes(action)) {
      return {
        targetId: this.getMetadataString(metadata, 'patientId'),
        targetName: this.getMetadataString(metadata, 'patientName'),
      };
    }

    if (appointmentTargetActions.includes(action)) {
      return {
        targetId: this.getMetadataString(metadata, 'appointmentId'),
        targetName: this.getMetadataString(metadata, 'patientName'),
      };
    }

    return null;
  }

  private getReadableActionAr(
    action: string,
    metadata: Record<string, Prisma.JsonValue>,
  ) {
    const oldStatus = this.getMetadataString(metadata, 'oldStatus');
    const newStatus = this.getMetadataString(metadata, 'newStatus');

    if (action === 'STAFF_PASSWORD_RESET') {
      return 'تم إعادة تعيين كلمة المرور للموظف';
    }

    if (action === 'PASSWORD_RESET' || action === 'user.password_reset') {
      return 'تم إعادة تعيين كلمة المرور';
    }

    if (
      [
        'CENTER_ACTIVATED',
        'CENTER_DEACTIVATED',
        'CENTER_STATUS_CHANGED',
      ].includes(action) &&
      oldStatus &&
      newStatus
    ) {
      return `تم تغيير حالة المركز من ${oldStatus} إلى ${newStatus}`;
    }

    if (action === 'CENTER_ACTIVATED') {
      return 'تم تغيير حالة المركز إلى نشط';
    }

    if (action === 'CENTER_DEACTIVATED') {
      return 'تم تغيير حالة المركز إلى غير نشط';
    }

    if (action === 'USER_STATUS_CHANGED' && oldStatus && newStatus) {
      return `تم تغيير حالة المستخدم من ${oldStatus} إلى ${newStatus}`;
    }

    if (action === 'SUBSCRIPTION_UPDATED') {
      return 'تم تحديث اشتراك المركز';
    }

    if (action === 'SUBSCRIPTION_STATUS_CHANGED' && oldStatus && newStatus) {
      return `تم تغيير حالة اشتراك المركز من ${oldStatus} إلى ${newStatus}`;
    }

    if (action === 'SUBSCRIPTION_STATUS_CHANGED') {
      return 'تم تغيير حالة اشتراك المركز';
    }

    if (action === 'center.login_as' || action === 'LOGIN_AS_CENTER') {
      return 'تم تسجيل الدخول كمدير المركز';
    }

    if (action === 'SUBSCRIPTION_RENEWAL_REQUESTED') {
      return 'تم إرسال طلب تجديد الاشتراك';
    }

    if (action === 'TENANT_INVOICE_CREATED') {
      return 'تم إنشاء فاتورة للمركز';
    }

    if (action === 'TENANT_INVOICE_CANCELLED') {
      return 'تم إلغاء فاتورة للمركز';
    }

    if (action === 'TENANT_PAYMENT_ADDED') {
      return 'تم تسجيل دفعة على فاتورة';
    }

    if (action === 'TENANT_CREDIT_CREATED') {
      return 'تم إنشاء رصيد مريض من دفعة زائدة';
    }

    if (action === 'TENANT_CREDIT_USED') {
      return 'تم استخدام رصيد مريض على فاتورة';
    }

    if (action === 'STAFF_STATUS_CHANGED' && oldStatus && newStatus) {
      return `تم تغيير حالة الموظف من ${oldStatus} إلى ${newStatus}`;
    }

    if (action !== 'STAFF_STATUS_CHANGED') return null;

    if (newStatus === 'INACTIVE') {
      return 'تم تغيير حالة الموظف إلى غير نشط';
    }

    if (newStatus === 'ACTIVE') {
      return 'تم تغيير حالة الموظف إلى نشط';
    }

    return 'تم تغيير حالة الموظف';
  }

  private getActionLabel(
    action: string,
    metadata: Record<string, Prisma.JsonValue>,
  ) {
    const oldStatus = this.getMetadataString(metadata, 'oldStatus');
    const newStatus = this.getMetadataString(metadata, 'newStatus');
    const transition =
      oldStatus && newStatus ? `: ${oldStatus} → ${newStatus}` : '';

    switch (action) {
      case 'CENTER_ACTIVATED':
        return `Center activated${transition}`;
      case 'CENTER_DEACTIVATED':
        return `Center deactivated${transition}`;
      case 'CENTER_STATUS_CHANGED':
        return `Center status changed${transition}`;
      case 'PASSWORD_RESET':
      case 'user.password_reset':
        return 'Password reset';
      case 'STAFF_PASSWORD_RESET':
        return 'Staff password reset';
      case 'STAFF_STATUS_CHANGED':
      case 'TENANT_STAFF_STATUS_CHANGED':
        return `Staff status changed${transition}`;
      case 'USER_STATUS_CHANGED':
      case 'user.status_changed':
        return `User status changed${transition}`;
      case 'USER_UPDATED':
      case 'user.updated':
        return 'User updated';
      case 'user.created':
        return 'User created';
      case 'user.center_role_assigned':
        return 'Center role assigned';
      case 'user.center_role_removed':
        return 'Center role removed';
      case 'center.login_as':
      case 'LOGIN_AS_CENTER':
        return 'Login as center';
      case 'SUBSCRIPTION_RENEWAL_REQUESTED':
        return 'Subscription renewal requested';
      case 'SUBSCRIPTION_INVOICE_CREATED':
        return 'Subscription invoice created';
      case 'SUBSCRIPTION_INVOICE_PAID':
        return `Subscription invoice paid${transition}`;
      case 'SUBSCRIPTION_INVOICE_CANCELLED':
        return `Subscription invoice cancelled${transition}`;
      case 'SUBSCRIPTION_INVOICE_DOWNLOADED':
        return 'Subscription invoice PDF downloaded';
      case 'TENANT_INVOICE_CREATED':
        return 'Tenant invoice created';
      case 'TENANT_INVOICE_CANCELLED':
        return `Tenant invoice cancelled${transition}`;
      case 'TENANT_INVOICE_RESTORED':
        return `Tenant invoice restored${transition}`;
      case 'TENANT_INVOICE_STATUS_CHANGED':
        return `Tenant invoice status changed${transition}`;
      case 'TENANT_PAYMENT_ADDED':
        return 'Tenant payment added';
      case 'TENANT_CREDIT_CREATED':
        return 'Tenant credit created';
      case 'TENANT_CREDIT_USED':
        return 'Tenant credit used';
      case 'TENANT_PATIENT_CREATED':
        return 'Tenant patient created';
      case 'TENANT_PATIENT_UPDATED':
        return 'Tenant patient updated';
      case 'TENANT_PATIENT_STATUS_CHANGED':
        return `Tenant patient status changed${transition}`;
      case 'TENANT_PATIENT_RESTORED':
        return `Tenant patient restored${transition}`;
      case 'TENANT_PATIENT_DELETED':
        return 'Tenant patient deleted';
      case 'TENANT_APPOINTMENT_CREATED':
        return 'Tenant appointment created';
      case 'TENANT_APPOINTMENT_UPDATED':
        return 'Tenant appointment updated';
      case 'TENANT_APPOINTMENT_STATUS_CHANGED':
        return `Tenant appointment status changed${transition}`;
      case 'TENANT_APPOINTMENT_CANCELLED':
        return `Tenant appointment cancelled${transition}`;
      case 'TENANT_APPOINTMENT_RESTORED':
        return `Tenant appointment restored${transition}`;
      case 'APPOINTMENT_REMINDER_SENT':
        return 'Appointment reminder sent';
      default:
        return action;
    }
  }

  private async resolveOptionalUserId(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    userId?: string,
    useDefaultActor = false,
  ) {
    if (userId && isUuid(userId)) {
      const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { id: true },
      });

      if (user) return user.id;
    }

    if (!useDefaultActor) return null;

    const defaultActor = await prisma.user.findFirst({
      where: { email: DEFAULT_SYSTEM_ADMIN_EMAIL, deletedAt: null },
      select: { id: true },
    });

    return defaultActor?.id ?? null;
  }

  private async resolveOptionalCenterId(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    centerId?: string,
  ) {
    if (!centerId || !isUuid(centerId)) return null;

    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: { id: true },
    });

    return center?.id ?? null;
  }

  private buildMetadata(
    params: LogAuditParams,
    resolved: {
      actorUserId: string | null;
      centerId: string | null;
      targetUserId: string | null;
    },
  ): Prisma.InputJsonValue | undefined {
    const metadata: Record<string, Prisma.InputJsonValue> = {};

    if (
      params.metadata &&
      typeof params.metadata === 'object' &&
      !Array.isArray(params.metadata)
    ) {
      for (const [key, value] of Object.entries(
        params.metadata as Record<string, Prisma.InputJsonValue | undefined>,
      )) {
        if (value !== undefined) {
          metadata[key] = value;
        }
      }
    } else if (params.metadata !== undefined) {
      metadata.value = params.metadata;
    }

    if (params.actorUserId && params.actorUserId !== resolved.actorUserId) {
      metadata.suppliedActorUserId = params.actorUserId;
    }

    if (params.targetUserId && params.targetUserId !== resolved.targetUserId) {
      metadata.suppliedTargetUserId = params.targetUserId;
    }

    if (params.centerId && params.centerId !== resolved.centerId) {
      metadata.suppliedCenterId = params.centerId;
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }
}
