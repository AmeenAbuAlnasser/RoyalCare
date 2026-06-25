import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type AppointmentStatus,
  type RecurringIntervalUnit,
  type ServiceFollowUpMode,
} from '@royalcare/db';
import { PrismaService } from '../../../common/database/prisma.service';
import { safeUserSelect } from '../../../common/database/safe-user-select';
import { hasTenantPermission } from '../../../common/permissions/tenant-permissions';
import { ScheduleService } from '../../../common/schedule/schedule.service';
import { AuditService } from '../../audit/audit.service';
import { TenantBillingService } from '../../billing/services/tenant-billing.service';
import { PatientFollowUpsService } from '../../patient-follow-ups/services/patient-follow-ups.service';
import type { CancelTenantAppointmentDto } from '../dto/cancel-tenant-appointment.dto';
import type { CreateTenantAppointmentDto } from '../dto/create-tenant-appointment.dto';
import type { UpdateTenantAppointmentStatusDto } from '../dto/update-tenant-appointment-status.dto';
import type { UpdateTenantAppointmentDto } from '../dto/update-tenant-appointment.dto';

type AppointmentPermission =
  | 'appointments:view'
  | 'appointments:create'
  | 'appointments:update'
  | 'appointments:cancel'
  | 'appointments:status';

const appointmentStatuses = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

const appointmentSelect = {
  id: true,
  centerId: true,
  patientId: true,
  serviceId: true,
  branchId: true,
  customServiceName: true,
  customServiceDuration: true,
  customServicePrice: true,
  customServiceCurrency: true,
  customServiceSaved: true,
  offerTitle: true,
  offerPrice: true,
  offerCurrency: true,
  treatmentTemplateId: true,
  treatmentTemplateNameAr: true,
  treatmentTemplateNameEn: true,
  treatmentTemplateNameHe: true,
  treatmentTemplateTotalSessions: true,
  treatmentTemplateDefaultIntervalDays: true,
  treatmentTemplatePhases: true,
  staffUserId: true,
  createdByUserId: true,
  appointmentDate: true,
  startTime: true,
  endTime: true,
  durationMinutes: true,
  status: true,
  notes: true,
  internalNotes: true,
  isCancelled: true,
  cancellationReason: true,
  reminderSent: true,
  lastReminderSentAt: true,
  reminderCount: true,
  reminder24hSent: true,
  reminder2hSent: true,
  cancelledAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  patient: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      status: true,
    },
  },
  branch: {
    select: {
      id: true,
      name: true,
      cityAr: true,
      cityEn: true,
      cityHe: true,
      addressAr: true,
      addressEn: true,
      addressHe: true,
    },
  },
  service: {
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      nameHe: true,
      durationMinutes: true,
      isActive: true,
      followUpEnabled: true,
      followUpMode: true,
      defaultIntervalDays: true,
      totalRecommendedSessions: true,
      recurringIntervalValue: true,
      recurringIntervalUnit: true,
      autoCreateNextReminder: true,
      followUpRules: true,
      treatmentTemplates: {
        where: { isActive: true },
        orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          nameHe: true,
          totalSessions: true,
          defaultIntervalDays: true,
          phases: true,
          isDefault: true,
          isActive: true,
          sortOrder: true,
        },
      },
    },
  },
  staffUser: {
    select: safeUserSelect,
  },
  createdByUser: {
    select: safeUserSelect,
  },
  bookingRequest: {
    select: {
      fullName: true,
      phone: true,
      notes: true,
    },
  },
  followUpsCreated: {
    select: {
      id: true,
      appointmentId: true,
      nextAppointmentId: true,
      patientId: true,
      serviceId: true,
      dueDate: true,
      status: true,
      sessionNumber: true,
      isRecurring: true,
      recurringIntervalValue: true,
      recurringIntervalUnit: true,
      planTotalSessions: true,
    },
    orderBy: { dueDate: 'asc' as const },
    take: 1,
  },
  followUpsNext: {
    select: {
      id: true,
      appointmentId: true,
      nextAppointmentId: true,
      patientId: true,
      serviceId: true,
      dueDate: true,
      status: true,
      sessionNumber: true,
      isRecurring: true,
      recurringIntervalValue: true,
      recurringIntervalUnit: true,
      planTotalSessions: true,
    },
    orderBy: { dueDate: 'asc' as const },
    take: 1,
  },
} satisfies Prisma.AppointmentSelect;

function calculateTotalSessionsFromRules(
  rules: Array<{ toSessionNumber: number }> | null | undefined,
) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return null;
  }

  const totals = rules
    .map((rule) => rule.toSessionNumber)
    .filter((value) => Number.isInteger(value) && value > 0);

  return totals.length > 0 ? Math.max(...totals) : null;
}

function parseFollowUpRulesSnapshot(
  value:
    | CreateTenantAppointmentDto['followUpRules']
    | CreateTenantAppointmentDto['followUpSessionRules']
    | null
    | undefined,
) {
  if (!Array.isArray(value) || value.length === 0) return null;

  const parsed = value.map((rule) => ({
    fromSessionNumber: Number(rule.fromSessionNumber),
    intervalDays: Number(rule.intervalDays),
    toSessionNumber: Number(rule.toSessionNumber),
  }));

  if (
    parsed.some(
      (rule) =>
        !Number.isInteger(rule.fromSessionNumber) ||
        !Number.isInteger(rule.toSessionNumber) ||
        !Number.isInteger(rule.intervalDays) ||
        rule.fromSessionNumber <= 0 ||
        rule.toSessionNumber < rule.fromSessionNumber ||
        rule.intervalDays <= 0,
    )
  ) {
    return null;
  }

  return parsed;
}

type AppointmentWithBookingRequest = Prisma.AppointmentGetPayload<{
  select: typeof appointmentSelect;
}>;

const appointmentFollowUpSummarySelect = {
  id: true,
  appointmentId: true,
  nextAppointmentId: true,
  patientId: true,
  serviceId: true,
  dueDate: true,
  status: true,
  sessionNumber: true,
  isRecurring: true,
  recurringIntervalValue: true,
  recurringIntervalUnit: true,
  planTotalSessions: true,
} satisfies Prisma.PatientFollowUpSelect;

type AppointmentFollowUpSummaryRow = Prisma.PatientFollowUpGetPayload<{
  select: typeof appointmentFollowUpSummarySelect;
}>;

function isFollowUpRelatedToAppointment(
  appointment: AppointmentWithBookingRequest,
  followUp: AppointmentFollowUpSummaryRow,
) {
  const directlyLinked =
    followUp.appointmentId === appointment.id ||
    followUp.nextAppointmentId === appointment.id;
  const sameRecurringPlan =
    followUp.isRecurring &&
    appointment.service?.followUpMode === 'RECURRING_CONTINUOUS' &&
    Boolean(appointment.serviceId) &&
    followUp.patientId === appointment.patientId &&
    followUp.serviceId === appointment.serviceId;

  return directlyLinked || sameRecurringPlan;
}

function withBookingSource<T extends AppointmentWithBookingRequest>(
  appointment: T,
  loadedFollowUps: AppointmentFollowUpSummaryRow[] = [],
) {
  const { bookingRequest, followUpsCreated, followUpsNext, ...rest } = appointment;
  const embeddedFollowUps = [...followUpsNext, ...followUpsCreated];
  const relatedFollowUps = [...embeddedFollowUps, ...loadedFollowUps]
    .filter((followUp, index, rows) =>
      isFollowUpRelatedToAppointment(appointment, followUp) &&
      rows.findIndex((candidate) => candidate.id === followUp.id) === index,
    )
    .sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime());
  const firstFollowUp = relatedFollowUps[0];
  const hasConfiguredRecurringPlan =
    appointment.service?.followUpMode === 'RECURRING_CONTINUOUS' &&
    Boolean(appointment.service.recurringIntervalValue) &&
    Boolean(appointment.service.recurringIntervalUnit);
  const hasFollowUpPlan =
    relatedFollowUps.length > 0 || hasConfiguredRecurringPlan;
  const followUpPlanId = firstFollowUp?.appointmentId ?? null;
  const recurringFollowUp = relatedFollowUps.find((item) => item.isRecurring);
  const nextFollowUp = relatedFollowUps.find(
    (item) => !['COMPLETED', 'CANCELLED', 'CLOSED_EARLY'].includes(item.status),
  );
  const followUpPlanSummary = hasFollowUpPlan
    ? {
        type:
          recurringFollowUp || hasConfiguredRecurringPlan
            ? ('RECURRING_CONTINUOUS' as const)
            : ('SESSION_BASED_PLAN' as const),
        followUpCount: relatedFollowUps.length,
        totalSessions: recurringFollowUp || hasConfiguredRecurringPlan
          ? null
          : (relatedFollowUps.find((item) => item.planTotalSessions)?.planTotalSessions ??
            relatedFollowUps.length),
        completedSessions: relatedFollowUps.filter(
          (item) => item.status === 'COMPLETED',
        ).length,
        nextFollowUpDate: nextFollowUp
          ? dateOnlyText(nextFollowUp.dueDate)
          : null,
        recurringIntervalValue:
          recurringFollowUp?.recurringIntervalValue ??
          appointment.service?.recurringIntervalValue ??
          null,
        recurringIntervalUnit:
          recurringFollowUp?.recurringIntervalUnit ??
          appointment.service?.recurringIntervalUnit ??
          null,
      }
    : null;

  return {
    ...rest,
    bookingSource: bookingRequest
      ? {
          fullName: bookingRequest.fullName,
          phone: bookingRequest.phone,
          notes: bookingRequest.notes,
        }
      : null,
    // This is the canonical appointment-level answer. Service follow-up settings
    // describe whether new plans may be created; these persisted relations prove
    // whether this appointment actually belongs to an existing plan.
    hasFollowUpPlan,
    followUpPlanId,
    followUpPlanSummary,
    followUp: firstFollowUp
      ? {
          id: firstFollowUp.id,
          dueDate: dateOnlyText(firstFollowUp.dueDate),
          status: firstFollowUp.status,
          sessionNumber: firstFollowUp.sessionNumber,
        }
      : null,
  };
}

function optionalTrimmed(value?: string | null) {
  return typeof value === 'string' ? value.trim() : value;
}

function validationFailed(errors: Record<string, string>) {
  return new BadRequestException({
    message: 'Validation failed',
    errors,
  });
}

function followUpAlreadyBooked() {
  return new BadRequestException({
    message: 'This follow-up session already has an appointment.',
    errors: {
      followUpId: 'This follow-up session already has an appointment.',
    },
  });
}

function forbidden(permission: AppointmentPermission) {
  return new ForbiddenException({
    message: 'Permission denied',
    errors: {
      permission: `Missing permission: ${permission}`,
    },
  });
}

function isAllowedValue<T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
): value is T[number] {
  return typeof value === 'string' && allowedValues.includes(value);
}

function parseDateOnly(value: string | undefined) {
  const dateText = optionalTrimmed(value);

  if (!dateText) {
    return 'missing';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return 'invalid';
  }

  const parsed = new Date(`${dateText}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return 'invalid';
  }

  return parsed;
}

function parseTime(value: string | undefined) {
  const time = optionalTrimmed(value);

  if (!time) {
    return 'missing';
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);

  if (!match) {
    return 'invalid';
  }

  return {
    text: time,
    minutes: Number(match[1]) * 60 + Number(match[2]),
  };
}

function parseDuration(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') {
    return 'missing';
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 1440) {
    return 'invalid';
  }

  return parsed;
}

function parseOptionalPrice(value: number | string | null | undefined) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 'invalid';
  }

  return new Prisma.Decimal(parsed.toFixed(2));
}

function dateOnlyText(value: Date) {
  return value.toISOString().slice(0, 10);
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return `${hours.toString().padStart(2, '0')}:${remainder
    .toString()
    .padStart(2, '0')}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);

  return hours * 60 + minutes;
}

function intervalsOverlap(
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number,
) {
  return firstStart < secondEnd && secondStart < firstEnd;
}

@Injectable()
export class TenantAppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly scheduleService: ScheduleService,
    private readonly patientFollowUpsService: PatientFollowUpsService,
    private readonly billingService: TenantBillingService,
  ) {}

  async list(
    centerId: string,
    permissions: string[],
    query?: {
      date?: string;
      patient?: string;
      provider?: string;
      branch?: string;
      search?: string;
      status?: string;
    },
  ) {
    this.requirePermission(permissions, 'appointments:view');

    const t0 = Date.now();
    const prisma = await this.prisma.getClient();
    const statusFilterProvided = Boolean(query?.status && query.status !== 'ALL');
    const where: Prisma.AppointmentWhereInput = {
      centerId,
      // Status scoping:
      //  • explicit status (e.g. CANCELLED, SCHEDULED) → match exactly
      //  • default / ALL → ACTIVE list: hide CANCELLED. Cancelled appointments are
      //    only reachable via the explicit CANCELLED filter (or patient full history,
      //    which is served by the follow-ups timeline, not this endpoint).
      ...(statusFilterProvided
        ? { status: query!.status as AppointmentStatus }
        : { status: { not: 'CANCELLED' as AppointmentStatus } }),
      ...(query?.provider ? { staffUserId: query.provider } : {}),
      ...(query?.branch ? { branchId: query.branch } : {}),
      ...(query?.date ? { appointmentDate: parseDateOnly(query.date) } : {}),
      ...(query?.search?.trim()
        ? {
            patient: {
              OR: [
                {
                  fullName: {
                    contains: query.search.trim(),
                    mode: 'insensitive',
                  },
                },
                { phone: { contains: query.search.trim() } },
              ],
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
        select: appointmentSelect,
        take: 200,
      }),
      prisma.appointment.count({ where }),
    ]);

    const invoiceSummaryMap = new Map<
      string,
      {
        id: string;
        status: string;
        currency: string;
        totalAmount: string;
        paidAmount: string;
        remainingAmount: string;
      }
    >();

    const appointmentIds = items.map((a) => a.id);

    if (appointmentIds.length > 0) {
      const invoices = await prisma.invoice.findMany({
        where: { centerId, appointmentId: { in: appointmentIds } },
        select: {
          id: true,
          appointmentId: true,
          status: true,
          amount: true,
          currency: true,
          payments: { select: { amount: true } },
        },
      });

      for (const inv of invoices) {
        if (!inv.appointmentId || invoiceSummaryMap.has(inv.appointmentId)) {
          continue;
        }
        const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const total = Number(inv.amount);
        invoiceSummaryMap.set(inv.appointmentId, {
          id: inv.id,
          status: inv.status,
          currency: inv.currency,
          totalAmount: total.toFixed(2),
          paidAmount: paid.toFixed(2),
          remainingAmount: Math.max(0, total - paid).toFixed(2),
        });
      }
    }

    const followUpRows = await this.loadAppointmentFollowUps(centerId, items);
    const itemsWithInvoice = items.map((a) =>
      withBookingSource({
        ...a,
        invoice: invoiceSummaryMap.get(a.id) ?? null,
      }, followUpRows),
    );

    console.debug(
      `[appointments:list] centerId=${centerId} found=${total} in ${Date.now() - t0}ms`,
    );

    return { items: itemsWithInvoice, total };
  }

  async options(centerId: string, permissions: string[]) {
    this.requirePermission(permissions, 'appointments:view');

    const prisma = await this.prisma.getClient();
    const [patients, services, branches, center] = await Promise.all([
      prisma.patient.findMany({
        where: { centerId, status: { not: 'ARCHIVED' } },
        orderBy: { fullName: 'asc' },
        select: {
          id: true,
          fullName: true,
          phone: true,
          status: true,
        },
      }),
      prisma.service.findMany({
        where: { centerId, isActive: true },
        orderBy: { nameEn: 'asc' },
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          nameHe: true,
          durationMinutes: true,
          isActive: true,
          followUpEnabled: true,
          followUpMode: true,
          defaultIntervalDays: true,
          totalRecommendedSessions: true,
          followUpRules: true,
          treatmentTemplates: {
            where: { isActive: true },
            orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              nameHe: true,
              totalSessions: true,
              defaultIntervalDays: true,
              phases: true,
              isDefault: true,
              isActive: true,
              sortOrder: true,
            },
          },
        },
      }),
      prisma.centerBranch.findMany({
        where: { centerId, isActive: true },
        orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          cityAr: true,
          cityEn: true,
          cityHe: true,
          addressAr: true,
          addressEn: true,
          addressHe: true,
          isMain: true,
          isActive: true,
        },
      }),
      prisma.center.findUnique({
        where: { id: centerId },
        select: { ownerUserId: true },
      }),
    ]);

    const providers = await prisma.userRole.findMany({
      where: {
        centerId,
        OR: [
          { providerEnabled: true },
          ...(center?.ownerUserId ? [{ userId: center.ownerUserId }] : []),
        ],
        status: 'ACTIVE',
        role: {
          status: 'ACTIVE',
        },
        user: {
          deletedAt: null,
          status: 'ACTIVE',
        },
      },
      orderBy: { user: { fullName: 'asc' } },
      select: {
        providerEnabled: true,
        role: { select: { key: true, name: true } },
        user: { select: safeUserSelect },
      },
    });
    const allCenterUserAssignments = await prisma.userRole.findMany({
      where: { centerId },
      orderBy: [{ user: { fullName: 'asc' } }, { assignedAt: 'asc' }],
      select: {
        providerEnabled: true,
        role: { select: { key: true, name: true } },
        status: true,
        user: {
          select: {
            email: true,
            fullName: true,
            id: true,
            status: true,
          },
        },
      },
    });
    const uniqueProviders = new Map<string, (typeof providers)[number]>();
    for (const assignment of providers) {
      if (!uniqueProviders.has(assignment.user.id)) {
        uniqueProviders.set(assignment.user.id, assignment);
      }
    }
    const providerRows = Array.from(uniqueProviders.values()).map(
      (assignment) => ({
        ...assignment.user,
        isOwner: assignment.user.id === center?.ownerUserId,
        providerEnabled: assignment.providerEnabled,
        role: assignment.role,
      }),
    );
    const allCenterUsersById = new Map<
      string,
      {
        email: string | null;
        fullName: string;
        id: string;
        isActive: boolean;
        isOwner: boolean;
        providerEnabled: boolean;
        roleNames: string[];
      }
    >();
    for (const assignment of allCenterUserAssignments) {
      const existing = allCenterUsersById.get(assignment.user.id);
      if (existing) {
        existing.providerEnabled =
          existing.providerEnabled || assignment.providerEnabled;
        existing.isActive =
          existing.isActive ||
          (assignment.status === 'ACTIVE' && assignment.user.status === 'ACTIVE');
        existing.roleNames.push(assignment.role.name);
        continue;
      }
      allCenterUsersById.set(assignment.user.id, {
        email: assignment.user.email,
        fullName: assignment.user.fullName,
        id: assignment.user.id,
        isActive:
          assignment.status === 'ACTIVE' && assignment.user.status === 'ACTIVE',
        isOwner: assignment.user.id === center?.ownerUserId,
        providerEnabled: assignment.providerEnabled,
        roleNames: [assignment.role.name],
      });
    }

    return {
      optionsDebug: {
        allCenterUsers: Array.from(allCenterUsersById.values()),
        centerId,
        ownerUserId: center?.ownerUserId ?? null,
        providersReturned: providerRows.map((provider) => ({
          email: provider.email,
          fullName: provider.fullName,
          id: provider.id,
          isOwner: provider.isOwner,
          providerEnabled: provider.providerEnabled,
          roleName: provider.role.name,
        })),
      },
      branches,
      patients,
      providers: providerRows,
      services,
    };
  }

  async getAvailability(
    centerId: string,
    permissions: string[],
    serviceId?: string,
    date?: string,
    providerId?: string,
    excludeAppointmentId?: string,
    durationMinutes?: string,
    isCustomService?: string,
  ) {
    this.requirePermission(permissions, 'appointments:view');

    const customMode = isCustomService === 'true';
    const hasServiceId = Boolean(serviceId?.trim());
    const parsedDuration = durationMinutes
      ? parseInt(durationMinutes, 10)
      : null;
    const hasValidDuration =
      parsedDuration !== null &&
      Number.isFinite(parsedDuration) &&
      parsedDuration > 0;

    const errors: Record<string, string> = {};

    if (customMode) {
      if (!hasValidDuration) {
        errors.durationMinutes = 'durationMinutes is required for custom service.';
      }
    } else {
      if (!hasServiceId) {
        errors.serviceId = 'serviceId is required.';
      }
    }

    const parsedDate = parseDateOnly(date);
    if (parsedDate === 'missing' || parsedDate === 'invalid') {
      errors.date = 'date must be a valid YYYY-MM-DD date.';
    }

    if (Object.keys(errors).length > 0) {
      throw validationFailed(errors);
    }

    const prisma = await this.prisma.getClient();

    if (!customMode) {
      const service = await prisma.service.findFirst({
        where: { id: serviceId!.trim(), centerId, isActive: true },
        select: { id: true },
      });

      if (!service) {
        throw validationFailed({ serviceId: 'Service not found or not active.' });
      }

      return this.scheduleService.computeSlots({
        centerId,
        date: (date as string).trim(),
        excludeAppointmentId,
        providerId: providerId?.trim() || undefined,
        serviceId: service.id,
      });
    }

    return this.scheduleService.computeSlots({
      centerId,
      date: (date as string).trim(),
      durationMinutes: parsedDuration!,
      excludeAppointmentId,
      providerId: providerId?.trim() || undefined,
    });
  }

  async create(
    centerId: string,
    permissions: string[],
    currentUserId: string,
    dto: CreateTenantAppointmentDto,
  ) {
    this.requirePermission(permissions, 'appointments:create');

    const validated = this.validateCreate(dto);
    const prisma = await this.prisma.getClient();

    const appointmentData = await this.withTreatmentTemplateSnapshot(
      centerId,
      await this.materializeCustomServiceIfRequested(
      centerId,
      validated,
      dto,
      ),
      dto,
    );

    await this.validateRelations(centerId, appointmentData);
    await this.ensureSlotAvailable(centerId, appointmentData);
    await this.ensureNoOverlap(centerId, appointmentData);

    // Enforce/auto-fill branch: required when the center has multiple active
    // branches, auto-assigned when it has exactly one, null when it has none.
    const branchId = await this.resolveBranchId(centerId, dto.branchId);

    const sourceFollowUpId = optionalTrimmed(dto.followUpId);
    const appointment = sourceFollowUpId
      ? await prisma.$transaction(async (tx) => {
          const followUp = await tx.patientFollowUp.findFirst({
            where: { centerId, id: sourceFollowUpId },
            select: {
              nextAppointmentId: true,
              patientId: true,
              serviceId: true,
            },
          });

          if (!followUp) {
            throw validationFailed({ followUpId: 'Follow-up session was not found.' });
          }

          if (followUp.patientId !== appointmentData.patientId) {
            throw validationFailed({
              patientId: 'Selected patient does not match this follow-up session.',
            });
          }

          if (followUp.serviceId && followUp.serviceId !== appointmentData.serviceId) {
            throw validationFailed({
              serviceId: 'Selected service does not match this follow-up session.',
            });
          }

          if (followUp.nextAppointmentId) {
            throw followUpAlreadyBooked();
          }

          const created = await tx.appointment.create({
            data: {
              centerId,
              createdByUserId: currentUserId,
              branchId,
              ...appointmentData,
            },
            select: appointmentSelect,
          });

          const linked = await tx.patientFollowUp.updateMany({
            where: {
              centerId,
              id: sourceFollowUpId,
              nextAppointmentId: null,
            },
            data: {
              nextAppointmentId: created.id,
              status: 'BOOKED',
            },
          });

          if (linked.count !== 1) {
            throw followUpAlreadyBooked();
          }

          return created;
        })
      : await prisma.appointment.create({
          data: {
            centerId,
            createdByUserId: currentUserId,
            branchId,
            ...appointmentData,
          },
          select: appointmentSelect,
        });

    if (sourceFollowUpId) {
      await this.patientFollowUpsService.scheduleNextRecurringAfterBooking(
        centerId,
        sourceFollowUpId,
        appointment.id,
      );
    }

    if (dto.saveCustomService || appointment.customServiceName) {
      console.log('[custom-service:appointment-created]', {
        appointmentId: appointment.id,
        appointmentServiceId: appointment.serviceId,
        createdServiceId: appointmentData.serviceId,
        customServiceName: appointment.customServiceName,
        defaultIntervalDays: dto.defaultIntervalDays ?? null,
        followUpEnabled: dto.followUpEnabled === true,
        saveCustomService: dto.saveCustomService === true,
        sessionRules: dto.followUpSessionRules ?? dto.followUpRules ?? null,
      });
    }

    await this.logAppointmentAudit(
      'TENANT_APPOINTMENT_CREATED',
      currentUserId,
      appointment,
      {
        newStatus: appointment.status,
      },
    );

    // Pre-create all follow-ups for multi-session treatment plans so the
    // Follow-ups page shows the complete plan immediately.
    await this.patientFollowUpsService.createPlanFromAppointment(
      centerId,
      appointment.id,
    );

    return this.withAppointmentFollowUpData(
      centerId,
      await this.findAppointmentById(centerId, appointment.id),
    );
  }

  async getById(
    centerId: string,
    permissions: string[],
    appointmentId: string,
  ) {
    this.requirePermission(permissions, 'appointments:view');

    const appointment = await this.findAppointmentById(centerId, appointmentId);
    const followUpRows = await this.loadAppointmentFollowUps(centerId, [appointment]);
    const response = withBookingSource(appointment, followUpRows);

    if (!response.hasFollowUpPlan) {
      return { ...response, followUpPlan: [] };
    }

    // Resolve the complete plan from the same persisted Prisma relations used by
    // appointment cards. `appointmentId` on PatientFollowUp is the plan/source
    // identity; `nextAppointmentId` links any booked plan session to its actual
    // appointment. Do not infer plan ownership from the current service settings.
    const followUps = await this.patientFollowUpsService.list(
      centerId,
      permissions,
      {
        patientId: appointment.patientId,
        includeAllForPatient: true,
      },
    );
    const followUpPlan = followUps.items.filter((item) => {
      if (
        response.followUpPlanSummary?.type === 'RECURRING_CONTINUOUS' &&
        item.isRecurring
      ) {
        return (
          item.patientId === appointment.patientId &&
          item.serviceId === appointment.serviceId
        );
      }

      return response.followUpPlanId
        ? item.appointmentId === response.followUpPlanId
        : item.appointmentId === appointment.id ||
            item.nextAppointmentId === appointment.id;
    });

    return { ...response, followUpPlan };
  }

  async update(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    appointmentId: string,
    dto: UpdateTenantAppointmentDto,
  ) {
    this.requirePermission(permissions, 'appointments:update');

    const current = await this.findAppointmentById(centerId, appointmentId);
    const validated = this.validateUpdate(dto, current);
    const prisma = await this.prisma.getClient();

    const appointmentData = await this.withTreatmentTemplateSnapshot(
      centerId,
      await this.materializeCustomServiceIfRequested(
      centerId,
      validated,
      dto,
      ),
      dto,
    );

    if (!appointmentData.customServiceSaved && current.customServiceSaved) {
      appointmentData.customServiceSaved = true;
    }

    await this.validateRelations(centerId, appointmentData);

    // Scheduling fields: date, startTime, provider, service.
    // If none of these changed, the slot is already booked for this appointment —
    // re-running availability/overlap checks would falsely reject past-time or
    // off-grid slots that were legitimately created.
    const schedulingChanged =
      dateOnlyText(current.appointmentDate) !==
        dateOnlyText(appointmentData.appointmentDate) ||
      current.startTime !== appointmentData.startTime ||
      current.staffUserId !== appointmentData.staffUserId ||
      (current.serviceId ?? null) !== (appointmentData.serviceId ?? null) ||
      current.durationMinutes !== appointmentData.durationMinutes;
    const appointmentDateChanged =
      dateOnlyText(current.appointmentDate) !==
      dateOnlyText(appointmentData.appointmentDate);

    console.log('[appointments:update-scheduling]', {
      appointmentId,
      schedulingChanged,
      current: {
        date: dateOnlyText(current.appointmentDate),
        serviceId: current.serviceId,
        staffUserId: current.staffUserId,
        startTime: current.startTime,
      },
      incoming: {
        date: dateOnlyText(appointmentData.appointmentDate),
        serviceId: appointmentData.serviceId,
        staffUserId: appointmentData.staffUserId,
        startTime: appointmentData.startTime,
      },
    });

    if (schedulingChanged) {
      await this.ensureSlotAvailable(centerId, appointmentData, appointmentId);
      await this.ensureNoOverlap(centerId, appointmentData, appointmentId);
    }

    // Only touch branch when the client explicitly sends branchId. When sent,
    // the same multi-branch enforcement/auto-fill applies as on create.
    const branchUpdate =
      dto.branchId !== undefined
        ? { branchId: await this.resolveBranchId(centerId, dto.branchId) }
        : {};

    const result = await prisma.appointment.updateMany({
      where: { id: appointmentId, centerId },
      data: { ...appointmentData, ...branchUpdate },
    });

    if (result.count !== 1) {
      throw new NotFoundException({
        message: 'Appointment not found',
        errors: { appointment: 'Appointment not found.' },
      });
    }

    if (appointmentDateChanged && dto.recalculateFollowUpSchedule === true) {
      await this.patientFollowUpsService.recalculateScheduleForAppointment(
        centerId,
        appointmentId,
        appointmentData.appointmentDate,
      );
    }

    const appointment = await this.findAppointmentById(centerId, appointmentId);

    if (dto.saveCustomService || appointment.customServiceName) {
      console.log('[custom-service:appointment-updated]', {
        appointmentId: appointment.id,
        appointmentServiceId: appointment.serviceId,
        createdServiceId: appointmentData.serviceId,
        customServiceName: appointment.customServiceName,
        defaultIntervalDays: dto.defaultIntervalDays ?? null,
        followUpEnabled: dto.followUpEnabled === true,
        saveCustomService: dto.saveCustomService === true,
        sessionRules: dto.followUpSessionRules ?? dto.followUpRules ?? null,
      });
    }

    await this.logAppointmentAudit(
      'TENANT_APPOINTMENT_UPDATED',
      actorUserId,
      appointment,
      {
        oldStatus: current.status,
        newStatus: appointment.status,
      },
    );

    console.log('[appointments:update-status]', {
      appointmentId,
      customServiceName: appointment.customServiceName,
      newStatus: appointment.status,
      oldStatus: current.status,
      serviceId: appointment.serviceId,
      via: 'update',
    });

    if (current.status !== appointment.status) {
      await this.patientFollowUpsService.syncFollowUpSessionFromAppointment(
        centerId,
        appointment.id,
      );

      if (current.status !== 'COMPLETED' && appointment.status === 'COMPLETED') {
        await this.patientFollowUpsService.createFromCompletedAppointment(
          centerId,
          appointment.id,
        );
        await this.billingService.autoCreateForAppointmentCompletion(
          centerId,
          appointment.id,
        );
      }

      if (current.status === 'COMPLETED' && appointment.status !== 'COMPLETED') {
        await this.billingService.cancelAutoInvoiceForAppointment(
          centerId,
          appointment.id,
        );
      }
    }

    return this.withAppointmentFollowUpData(
      centerId,
      await this.findAppointmentById(centerId, appointment.id),
    );
  }

  async updateStatus(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    appointmentId: string,
    dto: UpdateTenantAppointmentStatusDto,
  ) {
    this.requirePermission(permissions, 'appointments:status');

    const status = optionalTrimmed(dto.status);

    if (!isAllowedValue(status, appointmentStatuses)) {
      throw validationFailed({ status: 'Select a valid appointment status.' });
    }

    const current = await this.findAppointmentById(centerId, appointmentId);
    const prisma = await this.prisma.getClient();

    const result = await prisma.appointment.updateMany({
      where: { id: appointmentId, centerId },
      data: {
        status,
        isCancelled: status === 'CANCELLED',
        cancellationReason:
          status === 'CANCELLED' ? current.cancellationReason : null,
        cancelledAt: status === 'CANCELLED' ? new Date() : null,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });

    if (result.count !== 1) {
      throw new NotFoundException({
        message: 'Appointment not found',
        errors: { appointment: 'Appointment not found.' },
      });
    }

    const appointment = await this.findAppointmentById(centerId, appointmentId);
    const action =
      current.status === 'CANCELLED' && status !== 'CANCELLED'
        ? 'TENANT_APPOINTMENT_RESTORED'
        : status === 'CANCELLED'
          ? 'TENANT_APPOINTMENT_CANCELLED'
          : 'TENANT_APPOINTMENT_STATUS_CHANGED';

    await this.logAppointmentAudit(action, actorUserId, appointment, {
      oldStatus: current.status,
      newStatus: appointment.status,
    });

    console.log('[appointments:update-status]', {
      appointmentId,
      customServiceName: appointment.customServiceName,
      newStatus: appointment.status,
      oldStatus: current.status,
      serviceId: appointment.serviceId,
      via: 'updateStatus',
    });

    if (current.status !== appointment.status) {
      await this.patientFollowUpsService.syncFollowUpSessionFromAppointment(
        centerId,
        appointment.id,
      );

      if (current.status !== 'COMPLETED' && appointment.status === 'COMPLETED') {
        await this.patientFollowUpsService.createFromCompletedAppointment(
          centerId,
          appointment.id,
        );
        await this.billingService.autoCreateForAppointmentCompletion(
          centerId,
          appointment.id,
        );
      }

      if (current.status === 'COMPLETED' && appointment.status !== 'COMPLETED') {
        await this.billingService.cancelAutoInvoiceForAppointment(
          centerId,
          appointment.id,
        );
      }
    }

    return this.withAppointmentFollowUpData(
      centerId,
      await this.findAppointmentById(centerId, appointment.id),
    );
  }

  async cancel(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    appointmentId: string,
    dto: CancelTenantAppointmentDto,
  ) {
    this.requirePermission(permissions, 'appointments:cancel');

    const reason = optionalTrimmed(dto.reason);

    if (!reason) {
      throw validationFailed({
        cancellationReason: 'Cancellation reason is required.',
      });
    }

    const current = await this.findAppointmentById(centerId, appointmentId);
    const prisma = await this.prisma.getClient();

    const result = await prisma.appointment.updateMany({
      where: { id: appointmentId, centerId },
      data: {
        cancellationReason: reason,
        cancelledAt: new Date(),
        isCancelled: true,
        status: 'CANCELLED',
      },
    });

    if (result.count !== 1) {
      throw new NotFoundException({
        message: 'Appointment not found',
        errors: { appointment: 'Appointment not found.' },
      });
    }

    const appointment = await this.findAppointmentById(centerId, appointmentId);
    await this.logAppointmentAudit(
      'TENANT_APPOINTMENT_CANCELLED',
      actorUserId,
      appointment,
      {
        cancellationReason: reason,
        oldStatus: current.status,
        newStatus: appointment.status,
      },
    );

    await this.patientFollowUpsService.syncFollowUpSessionFromAppointment(
      centerId,
      appointment.id,
    );

    await this.billingService.cancelAutoInvoiceForAppointment(centerId, appointment.id);

    return this.withAppointmentFollowUpData(
      centerId,
      await this.findAppointmentById(centerId, appointment.id),
    );
  }

  private async findAppointmentById(centerId: string, appointmentId: string) {
    const prisma = await this.prisma.getClient();
    const appointment = await prisma.appointment.findFirst({
      where: { centerId, id: appointmentId },
      select: appointmentSelect,
    });

    if (!appointment) {
      throw new NotFoundException({
        message: 'Appointment not found',
        errors: { appointment: 'Appointment not found.' },
      });
    }

    return appointment;
  }

  private async loadAppointmentFollowUps(
    centerId: string,
    appointments: AppointmentWithBookingRequest[],
  ) {
    if (appointments.length === 0) return [];

    const prisma = await this.prisma.getClient();
    const appointmentIds = appointments.map((appointment) => appointment.id);
    const recurringAppointments = appointments.filter(
      (appointment) =>
        appointment.serviceId && appointment.service?.followUpMode === 'RECURRING_CONTINUOUS',
    );
    const patientIds = [
      ...new Set(recurringAppointments.map((appointment) => appointment.patientId)),
    ];
    const serviceIds = [
      ...new Set(
        recurringAppointments
          .map((appointment) => appointment.serviceId)
          .filter((serviceId): serviceId is string => Boolean(serviceId)),
      ),
    ];

    return prisma.patientFollowUp.findMany({
      where: {
        centerId,
        OR: [
          { appointmentId: { in: appointmentIds } },
          { nextAppointmentId: { in: appointmentIds } },
          ...(patientIds.length > 0 && serviceIds.length > 0
            ? [
                {
                  isRecurring: true,
                  patientId: { in: patientIds },
                  serviceId: { in: serviceIds },
                } satisfies Prisma.PatientFollowUpWhereInput,
              ]
            : []),
        ],
      },
      orderBy: { dueDate: 'asc' },
      select: appointmentFollowUpSummarySelect,
    });
  }

  private async withAppointmentFollowUpData(
    centerId: string,
    appointment: AppointmentWithBookingRequest,
  ) {
    const followUps = await this.loadAppointmentFollowUps(centerId, [appointment]);
    return withBookingSource(appointment, followUps);
  }

  private async logAppointmentAudit(
    action:
      | 'TENANT_APPOINTMENT_CREATED'
      | 'TENANT_APPOINTMENT_UPDATED'
      | 'TENANT_APPOINTMENT_STATUS_CHANGED'
      | 'TENANT_APPOINTMENT_CANCELLED'
      | 'TENANT_APPOINTMENT_RESTORED',
    actorUserId: string,
    appointment: Prisma.AppointmentGetPayload<{
      select: typeof appointmentSelect;
    }>,
    extra?: Record<string, string | null | undefined>,
  ) {
    await this.auditService.log({
      action,
      actorUserId,
      centerId: appointment.centerId,
      metadata: {
        appointmentDate: dateOnlyText(appointment.appointmentDate),
        appointmentId: appointment.id,
        centerId: appointment.centerId,
        endTime: appointment.endTime,
        patientId: appointment.patientId,
        patientName: appointment.patient?.fullName ?? undefined,
        serviceId: appointment.serviceId,
        customServiceName: appointment.customServiceName,
        source: 'TENANT_APPOINTMENTS',
        staffUserId: appointment.staffUserId,
        startTime: appointment.startTime,
        status: appointment.status,
        ...extra,
      },
    });
  }

  private requirePermission(
    permissions: string[],
    permission: AppointmentPermission,
  ) {
    if (!hasTenantPermission(permissions, permission)) {
      throw forbidden(permission);
    }
  }

  private validateCreate(dto: CreateTenantAppointmentDto) {
    return this.validateShared(dto, true);
  }

  private validateUpdate(
    dto: UpdateTenantAppointmentDto,
    current: Prisma.AppointmentGetPayload<{ select: typeof appointmentSelect }>,
  ) {
    const isOfferAppointment =
      !current.serviceId && Boolean(current.offerTitle);
    return this.validateShared(
      {
        appointmentDate: dateOnlyText(current.appointmentDate),
        durationMinutes: current.durationMinutes,
        endTime: dto.endTime,
        internalNotes: current.internalNotes,
        notes: current.notes,
        patientId: current.patientId,
        serviceId: current.serviceId ?? undefined,
        customServiceCurrency: current.customServiceCurrency,
        customServiceDuration:
          current.customServiceDuration ?? current.durationMinutes,
        customServiceName: current.customServiceName,
        customServicePrice: current.customServicePrice?.toString() ?? null,
        saveCustomService: false,
        staffUserId: current.staffUserId,
        startTime: current.startTime,
        ...dto,
      },
      true,
      isOfferAppointment,
    );
  }

  private validateShared(
    dto: CreateTenantAppointmentDto | UpdateTenantAppointmentDto,
    requireAll: boolean,
    isOfferAppointment = false,
  ) {
    const errors: Record<string, string> = {};
    const patientId = optionalTrimmed(dto.patientId);
    const serviceId = optionalTrimmed(dto.serviceId);
    const customServiceCurrency =
      optionalTrimmed(dto.customServiceCurrency)?.toUpperCase() || null;
    const customServiceName = optionalTrimmed(dto.customServiceName);
    const customServicePrice = parseOptionalPrice(dto.customServicePrice);
    const isCustomService = Boolean(customServiceName);
    const staffUserId = optionalTrimmed(dto.staffUserId);
    const appointmentDate = parseDateOnly(dto.appointmentDate);
    const startTime = parseTime(dto.startTime);
    const duration = parseDuration(
      isCustomService
        ? (dto.customServiceDuration ?? dto.durationMinutes)
        : dto.durationMinutes,
    );
    const rawEndTime = parseTime(dto.endTime);

    if (requireAll && !patientId) {
      errors.patientId = 'Select a patient.';
    }

    if (serviceId && customServiceName) {
      errors.serviceId = 'Choose either a saved service or a custom service.';
      errors.customServiceName =
        'Choose either a saved service or a custom service.';
    }

    if (requireAll && !serviceId && !customServiceName && !isOfferAppointment) {
      errors.serviceId = 'Select a service.';
    }

    if (customServiceName && customServiceName.length > 160) {
      errors.customServiceName = 'Service name is too long.';
    }

    if (customServiceCurrency && customServiceCurrency.length > 10) {
      errors.customServiceCurrency = 'Enter a valid currency.';
    }

    if (customServicePrice === 'invalid') {
      errors.customServicePrice = 'Enter a valid price.';
    }

    if (requireAll && !staffUserId) {
      errors.staffUserId = 'Select a provider.';
    }

    if (appointmentDate === 'missing' || appointmentDate === 'invalid') {
      errors.appointmentDate = 'Select a valid appointment date.';
    }

    if (startTime === 'missing' || startTime === 'invalid') {
      errors.startTime = 'Select a valid start time.';
    }

    if (duration === 'missing' || duration === 'invalid') {
      errors.durationMinutes = 'Enter a valid duration.';
    }

    let endTime: { text: string; minutes: number } | null = null;

    if (
      startTime !== 'missing' &&
      startTime !== 'invalid' &&
      duration !== 'missing' &&
      duration !== 'invalid'
    ) {
      const computedEndMinutes = startTime.minutes + duration;

      if (computedEndMinutes > 24 * 60) {
        errors.endTime = 'Appointment must end on the same day.';
      } else {
        endTime = {
          text: minutesToTime(computedEndMinutes),
          minutes: computedEndMinutes,
        };
      }
    }

    if (rawEndTime === 'invalid') {
      errors.endTime = 'Select a valid end time.';
    } else if (
      optionalTrimmed(dto.endTime) &&
      rawEndTime !== 'missing' &&
      endTime &&
      rawEndTime.minutes !== endTime.minutes
    ) {
      errors.endTime = 'End time must match the selected duration.';
    }

    const status = optionalTrimmed('status' in dto ? dto.status : undefined);

    if (status && !isAllowedValue(status, appointmentStatuses)) {
      errors.status = 'Select a valid appointment status.';
    }

    if (Object.keys(errors).length > 0) {
      throw validationFailed(errors);
    }

    return {
      appointmentDate: appointmentDate as Date,
      durationMinutes: duration as number,
      endTime: (endTime as { text: string }).text,
      internalNotes: optionalTrimmed(dto.internalNotes) || null,
      notes: optionalTrimmed(dto.notes) || null,
      patientId: patientId as string,
      serviceId:
        isOfferAppointment || isCustomService ? null : (serviceId as string),
      customServiceCurrency: isCustomService
        ? (customServiceCurrency ?? 'ILS')
        : null,
      customServiceDuration: isCustomService ? (duration as number) : null,
      customServiceName: isCustomService ? customServiceName : null,
      customServicePrice:
        customServicePrice === 'invalid' ? null : customServicePrice,
      customServiceSaved: false,
      staffUserId: staffUserId as string,
      startTime: (startTime as { text: string }).text,
      ...(status ? { status: status as AppointmentStatus } : {}),
    };
  }

  private async withTreatmentTemplateSnapshot(
    centerId: string,
    data: ReturnType<TenantAppointmentsService['validateShared']>,
    dto: CreateTenantAppointmentDto | UpdateTenantAppointmentDto,
  ) {
    if (!data.serviceId) {
      return {
        ...data,
        treatmentTemplateDefaultIntervalDays: null,
        treatmentTemplateId: null,
        treatmentTemplateNameAr: null,
        treatmentTemplateNameEn: null,
        treatmentTemplateNameHe: null,
        treatmentTemplatePhases: Prisma.JsonNull,
        treatmentTemplateTotalSessions: null,
      };
    }

    const prisma = await this.prisma.getClient();
    const service = await prisma.service.findFirst({
      where: { centerId, id: data.serviceId },
      select: {
        followUpEnabled: true,
        followUpMode: true,
        followUpRules: true,
        defaultIntervalDays: true,
        totalRecommendedSessions: true,
        treatmentTemplates: {
          where: { isActive: true },
          orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            nameHe: true,
            totalSessions: true,
            defaultIntervalDays: true,
            phases: true,
            isDefault: true,
          },
        },
      },
    });

    if (!service?.followUpEnabled || service.followUpMode !== 'SESSION_BASED_PLAN') {
      return {
        ...data,
        treatmentTemplateDefaultIntervalDays: null,
        treatmentTemplateId: null,
        treatmentTemplateNameAr: null,
        treatmentTemplateNameEn: null,
        treatmentTemplateNameHe: null,
        treatmentTemplatePhases: Prisma.JsonNull,
        treatmentTemplateTotalSessions: null,
      };
    }

    const requestedTemplateId = optionalTrimmed(dto.treatmentTemplateId);
    const selectedTemplate =
      service.treatmentTemplates.find((template) => template.id === requestedTemplateId) ??
      service.treatmentTemplates.find((template) => template.isDefault) ??
      service.treatmentTemplates[0] ??
      null;

    if (requestedTemplateId && !selectedTemplate) {
      throw validationFailed({
        treatmentTemplateId: 'Selected treatment plan template was not found.',
      });
    }

    const overrideRules = parseFollowUpRulesSnapshot(
      dto.followUpSessionRules ?? dto.followUpRules,
    );
    const overrideTotal = dto.totalRecommendedSessions
      ? Number(dto.totalRecommendedSessions)
      : null;
    const overrideInterval = dto.defaultIntervalDays
      ? Number(dto.defaultIntervalDays)
      : null;
    // When a template is selected, store only its own phases (null if the
    // template has no phases — meaning it uses its defaultIntervalDays).
    // Never merge or fall back to service.followUpRules: service phases may
    // span more sessions than the template, causing phantom extra sessions.
    const templatePhases = selectedTemplate
      ? (selectedTemplate.phases ?? null)
      : service.followUpRules;
    const phases = overrideRules ?? templatePhases ?? Prisma.JsonNull;
    // When a template is selected, totalSessions and defaultIntervalDays come
    // exclusively from the template snapshot — never from service-level config.
    const totalSessions =
      (overrideRules ? calculateTotalSessionsFromRules(overrideRules) : null) ??
      (Number.isInteger(overrideTotal) && overrideTotal! > 0 ? overrideTotal : null) ??
      selectedTemplate?.totalSessions ??
      (selectedTemplate ? null : service.totalRecommendedSessions) ??
      null;
    const defaultIntervalDays =
      (Number.isInteger(overrideInterval) && overrideInterval! > 0
        ? overrideInterval
        : null) ??
      selectedTemplate?.defaultIntervalDays ??
      (selectedTemplate ? null : service.defaultIntervalDays) ??
      null;

    if (!totalSessions || totalSessions <= 0) {
      return data;
    }

    return {
      ...data,
      treatmentTemplateDefaultIntervalDays: defaultIntervalDays,
      treatmentTemplateId: selectedTemplate?.id ?? null,
      treatmentTemplateNameAr: selectedTemplate?.nameAr ?? null,
      treatmentTemplateNameEn: selectedTemplate?.nameEn ?? null,
      treatmentTemplateNameHe: selectedTemplate?.nameHe ?? null,
      treatmentTemplatePhases: phases,
      treatmentTemplateTotalSessions: totalSessions,
    };
  }

  private async materializeCustomServiceIfRequested(
    centerId: string,
    data: ReturnType<TenantAppointmentsService['validateShared']>,
    dto: CreateTenantAppointmentDto | UpdateTenantAppointmentDto,
  ) {
    if (!data.customServiceName || !dto.saveCustomService) {
      return data;
    }

    const followUpMode: ServiceFollowUpMode =
      dto.followUpMode === 'RECURRING_CONTINUOUS'
        ? 'RECURRING_CONTINUOUS'
        : dto.followUpMode === 'SESSION_BASED_PLAN' || dto.followUpEnabled === true
          ? 'SESSION_BASED_PLAN'
          : 'NONE';
    const followUpEnabled = followUpMode !== 'NONE';
    const defaultIntervalDays = dto.defaultIntervalDays
      ? Number(dto.defaultIntervalDays)
      : null;
    let totalRecommendedSessions = dto.totalRecommendedSessions
      ? Number(dto.totalRecommendedSessions)
      : null;
    const recurringIntervalValue = dto.recurringIntervalValue
      ? Number(dto.recurringIntervalValue)
      : null;
    const recurringIntervalUnit =
      dto.recurringIntervalUnit === 'DAY' ||
      dto.recurringIntervalUnit === 'WEEK' ||
      dto.recurringIntervalUnit === 'MONTH' ||
      dto.recurringIntervalUnit === 'YEAR'
        ? (dto.recurringIntervalUnit as RecurringIntervalUnit)
        : null;
    const autoCreateNextReminder = dto.autoCreateNextReminder !== false;
    const reminderMessageAr =
      typeof dto.reminderMessageAr === 'string'
        ? dto.reminderMessageAr.trim() || null
        : null;
    const reminderMessageEn =
      typeof dto.reminderMessageEn === 'string'
        ? dto.reminderMessageEn.trim() || null
        : null;
    const reminderMessageHe =
      typeof dto.reminderMessageHe === 'string'
        ? dto.reminderMessageHe.trim() || null
        : null;

    const rulesSource = dto.followUpSessionRules ?? dto.followUpRules;
    let followUpRules: Prisma.InputJsonValue | typeof Prisma.JsonNull =
      Prisma.JsonNull;
    const followUpErrors: Record<string, string> = {};

    if (
      followUpMode === 'SESSION_BASED_PLAN' &&
      defaultIntervalDays !== null &&
      (!Number.isFinite(defaultIntervalDays) || defaultIntervalDays <= 0)
    ) {
      followUpErrors.defaultIntervalDays = 'Enter a valid follow-up interval.';
    }

    if (
      followUpMode === 'SESSION_BASED_PLAN' &&
      totalRecommendedSessions !== null &&
      (!Number.isFinite(totalRecommendedSessions) ||
        totalRecommendedSessions <= 0)
    ) {
      followUpErrors.totalRecommendedSessions = 'Enter a valid session count.';
    }

    if (
      followUpEnabled &&
      followUpMode === 'SESSION_BASED_PLAN'
    ) {
      if (!Array.isArray(rulesSource) || rulesSource.length === 0) {
        followUpErrors.followUpRules =
          'Enter valid session-plan follow-up rules.';
      } else {
        const parsedRules = rulesSource.map((rule) => ({
          fromSessionNumber: Number(rule.fromSessionNumber),
          intervalDays: Number(rule.intervalDays),
          toSessionNumber: Number(rule.toSessionNumber),
        }));

        if (
          parsedRules.some(
            (rule) =>
              !Number.isFinite(rule.fromSessionNumber) ||
              !Number.isFinite(rule.toSessionNumber) ||
              !Number.isFinite(rule.intervalDays) ||
              rule.fromSessionNumber <= 0 ||
              rule.toSessionNumber < rule.fromSessionNumber ||
              rule.intervalDays <= 0,
          )
        ) {
          followUpErrors.followUpRules =
            'Enter valid session-plan follow-up rules.';
        } else {
          followUpRules = parsedRules;
          totalRecommendedSessions =
            calculateTotalSessionsFromRules(parsedRules) ??
            totalRecommendedSessions;
        }
      }
    }

    if (
      followUpMode === 'RECURRING_CONTINUOUS' &&
      (recurringIntervalValue === null ||
        !Number.isFinite(recurringIntervalValue) ||
        recurringIntervalValue <= 0)
    ) {
      followUpErrors.recurringIntervalValue =
        'Enter a valid recurring interval.';
    }

    if (followUpMode === 'RECURRING_CONTINUOUS' && !recurringIntervalUnit) {
      followUpErrors.recurringIntervalUnit =
        'Select a recurring interval unit.';
    }

    if (Object.keys(followUpErrors).length > 0) {
      throw validationFailed(followUpErrors);
    }

    const prisma = await this.prisma.getClient();
    const service = await prisma.service.create({
      data: {
        centerId,
        currency: 'ILS',
        durationMinutes: data.durationMinutes,
        nameAr: data.customServiceName,
        nameEn: data.customServiceName,
        nameHe: data.customServiceName,
        price: data.customServicePrice,
        followUpEnabled,
        followUpMode,
        defaultIntervalDays:
          followUpMode === 'SESSION_BASED_PLAN' ? defaultIntervalDays : null,
        totalRecommendedSessions:
          followUpMode === 'SESSION_BASED_PLAN' ? totalRecommendedSessions : null,
        recurringIntervalValue:
          followUpMode === 'RECURRING_CONTINUOUS' ? recurringIntervalValue : null,
        recurringIntervalUnit:
          followUpMode === 'RECURRING_CONTINUOUS' ? recurringIntervalUnit : null,
        autoCreateNextReminder,
        reminderMessageAr,
        reminderMessageEn,
        reminderMessageHe,
        followUpRules:
          followUpMode === 'SESSION_BASED_PLAN' ? followUpRules : Prisma.JsonNull,
      },
      select: { id: true },
    });

    console.log('[custom-service:create]', {
      createdServiceId: service.id,
      followUpEnabled,
      followUpMode,
      rules: followUpRules === Prisma.JsonNull ? null : followUpRules,
      saveCustomService: dto.saveCustomService === true,
      serviceId: data.serviceId,
    });

    return {
      ...data,
      customServiceSaved: true,
      serviceId: service.id,
    };
  }

  /**
   * Resolves the branch for an appointment against the center's active branches:
   *  • explicit branchId → must be an active branch of this center
   *  • omitted + exactly one active branch → auto-assigned
   *  • omitted + multiple active branches → rejected (branch is required)
   *  • omitted + no branches configured → null
   */
  private async resolveBranchId(
    centerId: string,
    rawBranchId: string | null | undefined,
  ): Promise<string | null> {
    const prisma = await this.prisma.getClient();
    const branchId = optionalTrimmed(rawBranchId) || null;
    const activeBranches = await prisma.centerBranch.findMany({
      where: { centerId, isActive: true },
      orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
      select: { id: true },
    });

    if (branchId) {
      if (!activeBranches.some((branch) => branch.id === branchId)) {
        throw validationFailed({
          branchId: 'Select a valid branch from this center.',
        });
      }
      return branchId;
    }

    if (activeBranches.length === 1) {
      return activeBranches[0].id;
    }

    if (activeBranches.length > 1) {
      throw validationFailed({ branchId: 'Choose a branch.' });
    }

    return null;
  }

  private async validateRelations(
    centerId: string,
    data: {
      patientId: string;
      serviceId: string | null;
      staffUserId: string;
    },
  ) {
    const prisma = await this.prisma.getClient();
    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: { ownerUserId: true },
    });
    const [patient, service, provider] = await Promise.all([
      prisma.patient.findFirst({
        where: { centerId, id: data.patientId },
        select: { id: true, status: true },
      }),
      data.serviceId
        ? prisma.service.findFirst({
            where: { centerId, id: data.serviceId },
            select: { id: true, isActive: true },
          })
        : Promise.resolve(null),
      prisma.userRole.findFirst({
        where: {
          centerId,
          OR: [
            { providerEnabled: true },
            ...(center?.ownerUserId ? [{ userId: center.ownerUserId }] : []),
          ],
          userId: data.staffUserId,
          status: 'ACTIVE',
          role: { status: 'ACTIVE' },
          user: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        },
        select: { id: true },
      }),
    ]);

    const errors: Record<string, string> = {};

    if (!patient || patient.status === 'ARCHIVED') {
      errors.patientId = 'Select a valid patient from this center.';
    }

    if (data.serviceId && (!service || !service.isActive)) {
      errors.serviceId = 'Select an active service from this center.';
    }

    if (!provider) {
      errors.staffUserId = 'Select a valid provider from this center.';
    }

    if (Object.keys(errors).length > 0) {
      throw validationFailed(errors);
    }
  }

  private async ensureSlotAvailable(
    centerId: string,
    data: {
      appointmentDate: Date;
      serviceId: string | null;
      staffUserId: string;
      startTime: string;
    },
    appointmentId?: string,
  ) {
    if (!data.serviceId) return;

    const isAvailable = await this.scheduleService.isSlotAvailable({
      centerId,
      date: dateOnlyText(data.appointmentDate),
      excludeAppointmentId: appointmentId,
      providerId: data.staffUserId,
      serviceId: data.serviceId,
      startTime: data.startTime,
    });

    if (!isAvailable) {
      throw new ConflictException({
        code: 'SLOT_UNAVAILABLE',
        message: 'The selected time slot is no longer available.',
        errors: {
          startTime:
            'This time slot is outside working hours or has already been booked.',
        },
      });
    }
  }

  private async ensureNoOverlap(
    centerId: string,
    data: {
      appointmentDate: Date;
      endTime: string;
      patientId: string;
      staffUserId: string;
      startTime: string;
    },
    appointmentId?: string,
  ) {
    // Extract the date string and re-build an explicit UTC midnight Date to
    // avoid any timezone drift when Prisma serialises the value for the DATE
    // column. The in-memory filter below acts as a second safety net.
    const targetDateStr = dateOnlyText(data.appointmentDate);
    const targetDate = new Date(`${targetDateStr}T00:00:00.000Z`);

    const prisma = await this.prisma.getClient();
    const rows = await prisma.appointment.findMany({
      where: {
        centerId,
        appointmentDate: targetDate,
        status: { not: 'CANCELLED' },
        ...(appointmentId ? { id: { not: appointmentId } } : {}),
        OR: [{ staffUserId: data.staffUserId }, { patientId: data.patientId }],
      },
      select: {
        id: true,
        appointmentDate: true,
        customServiceName: true,
        endTime: true,
        patientId: true,
        staffUserId: true,
        startTime: true,
        patient: { select: { fullName: true } },
        service: { select: { nameEn: true, nameAr: true, nameHe: true } },
        staffUser: { select: { fullName: true } },
      },
    });

    // Application-layer safety: keep only rows whose stored date matches the
    // target date string, guarding against any unlikely timezone edge case.
    const appointments = rows.filter(
      (appt) => dateOnlyText(appt.appointmentDate) === targetDateStr,
    );

    const start = timeToMinutes(data.startTime);
    const end = timeToMinutes(data.endTime);
    const errors: Record<string, string> = {};
    let conflictDetails: {
      appointmentId: string;
      appointmentDate: string;
      endTime: string;
      patientName: string;
      providerName: string;
      serviceNameAr: string;
      serviceNameEn: string;
      serviceNameHe: string;
      startTime: string;
    } | null = null;

    for (const appointment of appointments) {
      const overlaps = intervalsOverlap(
        start,
        end,
        timeToMinutes(appointment.startTime),
        timeToMinutes(appointment.endTime),
      );

      if (!overlaps) {
        continue;
      }

      if (!conflictDetails) {
        conflictDetails = {
          appointmentId: appointment.id,
          appointmentDate: dateOnlyText(appointment.appointmentDate),
          endTime: appointment.endTime,
          patientName: appointment.patient?.fullName ?? '',
          providerName: appointment.staffUser?.fullName ?? '',
          serviceNameAr:
            appointment.service?.nameAr ?? appointment.customServiceName ?? '',
          serviceNameEn:
            appointment.service?.nameEn ?? appointment.customServiceName ?? '',
          serviceNameHe:
            appointment.service?.nameHe ?? appointment.customServiceName ?? '',
          startTime: appointment.startTime,
        };
      }

      if (appointment.staffUserId === data.staffUserId) {
        errors.staffUserId =
          'This provider already has an appointment at this time.';
      }

      if (appointment.patientId === data.patientId) {
        errors.patientId =
          'This patient already has an appointment at this time.';
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ConflictException({
        code: 'APPOINTMENT_CONFLICT',
        message: 'Appointment conflict detected',
        errors,
        conflictDetails: conflictDetails ?? {
          appointmentId: '',
          appointmentDate: targetDateStr,
          endTime: data.endTime,
          patientName: '',
          providerName: '',
          serviceNameAr: '',
          serviceNameEn: '',
          serviceNameHe: '',
          startTime: data.startTime,
        },
      });
    }
  }
}
