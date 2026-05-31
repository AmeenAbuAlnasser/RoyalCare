import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type PatientFollowUpStatus,
} from '@royalcare/db';
import { PrismaService } from '../../../common/database/prisma.service';
import { hasTenantPermission } from '../../../common/permissions/tenant-permissions';

type FollowUpPermission = 'appointments:view' | 'appointments:update';

const followUpStatuses = [
  'DUE',
  'UPCOMING',
  'CONTACTED',
  'BOOKED',
  'COMPLETED',
  'MISSED',
  'CANCELLED',
] as const;

const followUpSelect = {
  id: true,
  centerId: true,
  patientId: true,
  serviceId: true,
  appointmentId: true,
  sourceType: true,
  title: true,
  notes: true,
  sessionNumber: true,
  dueDate: true,
  status: true,
  lastContactedAt: true,
  nextAppointmentId: true,
  createdAt: true,
  updatedAt: true,
  patient: {
    select: {
      id: true,
      fullName: true,
      fullNameAr: true,
      fullNameEn: true,
      fullNameHe: true,
      phone: true,
      email: true,
      status: true,
    },
  },
  service: {
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      nameHe: true,
    },
  },
  nextAppointment: {
    select: {
      id: true,
      appointmentDate: true,
      startTime: true,
      status: true,
    },
  },
} satisfies Prisma.PatientFollowUpSelect;

type FollowUpItem = Prisma.PatientFollowUpGetPayload<{
  select: typeof followUpSelect;
}>;

type SessionRule = {
  fromSessionNumber: number;
  intervalDays: number;
  toSessionNumber: number;
};

function forbidden(permission: FollowUpPermission) {
  return new ForbiddenException({
    message: 'Permission denied',
    errors: {
      permission: `Missing permission: ${permission}`,
    },
  });
}

function validationFailed(errors: Record<string, string>) {
  return new BadRequestException({
    message: 'Validation failed',
    errors,
  });
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function startOfToday() {
  return new Date(`${dateOnly(new Date())}T00:00:00.000Z`);
}

function addDays(date: Date, days: number) {
  const next = new Date(`${dateOnly(date)}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function parseRules(value: Prisma.JsonValue | null | undefined): SessionRule[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((rule) => {
      if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
        return null;
      }

      const source = rule as Record<string, unknown>;
      const fromSessionNumber = Number(source.fromSessionNumber);
      const toSessionNumber = Number(source.toSessionNumber);
      const intervalDays = Number(source.intervalDays);

      if (
        !Number.isInteger(fromSessionNumber) ||
        !Number.isInteger(toSessionNumber) ||
        !Number.isInteger(intervalDays)
      ) {
        return null;
      }

      return { fromSessionNumber, intervalDays, toSessionNumber };
    })
    .filter((rule): rule is SessionRule => Boolean(rule));
}

function statusForDueDate(dueDate: Date): PatientFollowUpStatus {
  return dueDate.getTime() <= startOfToday().getTime() ? 'DUE' : 'UPCOMING';
}

function ensureAllowedStatus(value?: string): PatientFollowUpStatus {
  if (!value || !followUpStatuses.includes(value as PatientFollowUpStatus)) {
    throw validationFailed({ status: 'Select a valid follow-up status.' });
  }

  return value as PatientFollowUpStatus;
}

@Injectable()
export class PatientFollowUpsService {
  constructor(private readonly prisma: PrismaService) {}

  async createFromCompletedAppointment(
    centerId: string,
    appointmentId: string,
  ) {
    const prisma = await this.prisma.getClient();
    const appointment = await prisma.appointment.findFirst({
      where: { centerId, id: appointmentId, status: 'COMPLETED' },
      select: {
        id: true,
        centerId: true,
        patientId: true,
        serviceId: true,
        appointmentDate: true,
        service: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            nameHe: true,
            followUpEnabled: true,
            followUpType: true,
            defaultIntervalDays: true,
            totalRecommendedSessions: true,
            autoCreateNextReminder: true,
            followUpRules: true,
          },
        },
      },
    });

    if (appointment && !appointment.serviceId) {
      console.warn(
        'Cannot create follow-up: appointment has no linked service',
        {
          appointmentId,
          centerId,
        },
      );
      return null;
    }

    console.log('[follow-up:create-check]', {
      appointmentId,
      centerId,
      followUpEnabled: appointment?.service?.followUpEnabled ?? null,
      followUpType: appointment?.service?.followUpType ?? null,
      serviceId: appointment?.serviceId ?? null,
      serviceLoaded: Boolean(appointment?.service),
    });

    if (!appointment?.service?.followUpEnabled) {
      return null;
    }

    if (!appointment.service.autoCreateNextReminder) {
      return null;
    }

    const sessionNumber = await prisma.appointment.count({
      where: {
        centerId,
        patientId: appointment.patientId,
        serviceId: appointment.serviceId,
        status: 'COMPLETED',
      },
    });

    if (
      appointment.service.totalRecommendedSessions &&
      sessionNumber >= appointment.service.totalRecommendedSessions
    ) {
      return null;
    }

    const intervalDays = this.resolveIntervalDays(
      appointment.service.followUpType,
      appointment.service.defaultIntervalDays,
      parseRules(appointment.service.followUpRules),
      sessionNumber,
    );

    if (!intervalDays) {
      return null;
    }

    const activeExisting = await prisma.patientFollowUp.findFirst({
      where: {
        centerId,
        appointmentId: appointment.id,
        status: { notIn: ['CANCELLED'] },
      },
      select: { id: true },
    });

    if (activeExisting) {
      console.log('[follow-up:create-skip-existing]', {
        appointmentId,
        centerId,
        followUpId: activeExisting.id,
        serviceId: appointment.serviceId,
      });
      return activeExisting;
    }

    const dueDate = addDays(appointment.appointmentDate, intervalDays);

    const cancelledExisting = await prisma.patientFollowUp.findFirst({
      where: {
        centerId,
        appointmentId: appointment.id,
        sourceType: 'APPOINTMENT_COMPLETED',
        status: 'CANCELLED',
      },
      select: { id: true },
    });

    if (cancelledExisting) {
      await prisma.patientFollowUp.update({
        where: { id: cancelledExisting.id },
        data: { status: statusForDueDate(dueDate), dueDate },
      });
      console.log('[follow-up:reactivated]', {
        appointmentId,
        centerId,
        dueDate,
        followUpId: cancelledExisting.id,
        intervalDays,
        serviceId: appointment.serviceId,
      });
      return { id: cancelledExisting.id };
    }
    const title =
      appointment.service.nameAr ||
      appointment.service.nameEn ||
      appointment.service.nameHe ||
      'Follow-up';

    const followUp = await prisma.patientFollowUp.create({
      data: {
        centerId,
        patientId: appointment.patientId,
        serviceId: appointment.serviceId,
        appointmentId: appointment.id,
        sourceType: 'APPOINTMENT_COMPLETED',
        title,
        sessionNumber: sessionNumber + 1,
        dueDate,
        status: statusForDueDate(dueDate),
      },
      select: { id: true },
    });

    console.log('[follow-up:created]', {
      appointmentId,
      centerId,
      dueDate,
      followUpId: followUp.id,
      intervalDays,
      serviceId: appointment.serviceId,
      sessionNumber: sessionNumber + 1,
    });

    return followUp;
  }

  async cancelFollowUpsForAppointment(
    centerId: string,
    appointmentId: string,
  ) {
    const prisma = await this.prisma.getClient();

    const followUps = await prisma.patientFollowUp.findMany({
      where: {
        centerId,
        appointmentId,
        sourceType: 'APPOINTMENT_COMPLETED',
        status: { in: ['UPCOMING', 'DUE', 'CONTACTED'] },
      },
      select: { id: true },
    });

    console.log('[follow-up:cancel-check]', {
      appointmentId,
      centerId,
      found: followUps.length,
    });

    if (followUps.length === 0) {
      console.log('[follow-up:cancel-skipped]', {
        appointmentId,
        centerId,
        reason: 'no active auto-created follow-ups found',
      });
      return;
    }

    await prisma.patientFollowUp.updateMany({
      where: {
        centerId,
        appointmentId,
        sourceType: 'APPOINTMENT_COMPLETED',
        status: { in: ['UPCOMING', 'DUE', 'CONTACTED'] },
      },
      data: { status: 'CANCELLED' },
    });

    console.log('[follow-up:cancelled]', {
      appointmentId,
      cancelledIds: followUps.map((f) => f.id),
      centerId,
    });
  }

  async list(
    centerId: string,
    permissions: string[],
    query?: { filter?: string; patientId?: string },
  ) {
    this.requirePermission(permissions, 'appointments:view');

    const t0 = Date.now();
    const where = this.buildListWhere(centerId, query);
    const prisma = await this.prisma.getClient();
    const [items, total] = await Promise.all([
      prisma.patientFollowUp.findMany({
        where,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        select: followUpSelect,
        take: 200,
      }),
      prisma.patientFollowUp.count({ where }),
    ]);

    console.debug(
      `[follow-ups:list] centerId=${centerId} filter=${query?.filter ?? 'none'} found=${total} in ${Date.now() - t0}ms`,
    );

    const contextMap = await this.buildClinicalContextBatch(centerId, items);
    const today = startOfToday().getTime();

    return {
      items: items.map((item) => {
        const due = new Date(item.dueDate).getTime();
        const overdueDays =
          due < today ? Math.floor((today - due) / 86400000) : 0;
        const clinicalContext = contextMap.get(item.id) ?? {
          lastTreatment: null,
          treatmentTimeline: [] as Array<{
            id: string;
            sessionNumber: number;
            date: string;
            status: string;
            provider: {
              id: string;
              fullName: string;
              email: string | null;
            } | null;
            type: 'COMPLETED' | 'FOLLOW_UP';
          }>,
        };
        return {
          ...item,
          dueDate: dateOnly(item.dueDate),
          nextAppointment: item.nextAppointment
            ? {
                ...item.nextAppointment,
                appointmentDate: dateOnly(
                  item.nextAppointment.appointmentDate,
                ),
              }
            : null,
          overdueDays,
          ...clinicalContext,
        };
      }),
      total,
    };
  }

  async getByIdForTenant(
    centerId: string,
    permissions: string[],
    followUpId: string,
  ) {
    this.requirePermission(permissions, 'appointments:view');

    return this.getById(centerId, followUpId);
  }

  async analytics(centerId: string, permissions: string[]) {
    this.requirePermission(permissions, 'appointments:view');

    const prisma = await this.prisma.getClient();
    const today = startOfToday();
    const tomorrow = addDays(today, 1);
    const [dueToday, overdue, contacted, booked, totalActionable] =
      await Promise.all([
        prisma.patientFollowUp.count({
          where: {
            centerId,
            dueDate: { gte: today, lt: tomorrow },
            status: { in: ['DUE', 'UPCOMING'] },
          },
        }),
        prisma.patientFollowUp.count({
          where: {
            centerId,
            dueDate: { lt: today },
            status: { in: ['DUE', 'UPCOMING', 'CONTACTED'] },
          },
        }),
        prisma.patientFollowUp.count({
          where: { centerId, status: 'CONTACTED' },
        }),
        prisma.patientFollowUp.count({
          where: { centerId, status: { in: ['BOOKED', 'COMPLETED'] } },
        }),
        prisma.patientFollowUp.count({
          where: { centerId, status: { notIn: ['CANCELLED', 'MISSED'] } },
        }),
      ]);

    return {
      dueToday,
      overdue,
      contacted,
      bookedFromFollowUps: booked,
      conversionRate:
        totalActionable > 0 ? Math.round((booked / totalActionable) * 100) : 0,
    };
  }

  async updateStatus(
    centerId: string,
    permissions: string[],
    followUpId: string,
    status: string | undefined,
  ) {
    this.requirePermission(permissions, 'appointments:update');

    const nextStatus = ensureAllowedStatus(status);
    const prisma = await this.prisma.getClient();
    const result = await prisma.patientFollowUp.updateMany({
      where: { id: followUpId, centerId },
      data: {
        status: nextStatus,
        lastContactedAt: nextStatus === 'CONTACTED' ? new Date() : undefined,
      },
    });

    if (result.count !== 1) {
      throw this.notFound();
    }

    return this.getById(centerId, followUpId);
  }

  async updateNotes(
    centerId: string,
    permissions: string[],
    followUpId: string,
    notes?: string | null,
  ) {
    this.requirePermission(permissions, 'appointments:update');

    const prisma = await this.prisma.getClient();
    const result = await prisma.patientFollowUp.updateMany({
      where: { id: followUpId, centerId },
      data: { notes: typeof notes === 'string' ? notes.trim() || null : null },
    });

    if (result.count !== 1) {
      throw this.notFound();
    }

    return this.getById(centerId, followUpId);
  }

  private async getById(centerId: string, followUpId: string) {
    const prisma = await this.prisma.getClient();
    const followUp = await prisma.patientFollowUp.findFirst({
      where: { id: followUpId, centerId },
      select: followUpSelect,
    });

    if (!followUp) {
      throw this.notFound();
    }

    return this.withComputedFields(followUp);
  }

  private buildListWhere(
    centerId: string,
    query?: { filter?: string; patientId?: string },
  ): Prisma.PatientFollowUpWhereInput {
    const today = startOfToday();
    const tomorrow = addDays(today, 1);
    const weekEnd = addDays(today, 7);
    const filter = query?.filter;
    const base: Prisma.PatientFollowUpWhereInput = {
      centerId,
      ...(query?.patientId ? { patientId: query.patientId } : {}),
    };

    if (!filter && query?.patientId) {
      return base;
    }

    if (filter === 'THIS_WEEK') {
      return {
        ...base,
        dueDate: { gte: today, lt: weekEnd },
        status: { in: ['DUE', 'UPCOMING', 'CONTACTED'] },
      };
    }

    if (filter === 'OVERDUE') {
      return {
        ...base,
        dueDate: { lt: today },
        status: { in: ['DUE', 'UPCOMING', 'CONTACTED'] },
      };
    }

    if (filter === 'UPCOMING') {
      return {
        ...base,
        dueDate: { gte: tomorrow },
        status: { in: ['UPCOMING', 'DUE'] },
      };
    }

    if (filter && ['CONTACTED', 'BOOKED', 'COMPLETED'].includes(filter)) {
      return { ...base, status: filter as PatientFollowUpStatus };
    }

    return {
      ...base,
      dueDate: { gte: today, lt: tomorrow },
      status: { in: ['DUE', 'UPCOMING', 'CONTACTED'] },
    };
  }

  private resolveIntervalDays(
    type: string,
    defaultIntervalDays: number | null,
    rules: SessionRule[],
    sessionNumber: number,
  ) {
    if (type === 'SESSION_PLAN') {
      const rule = rules.find(
        (item) =>
          sessionNumber >= item.fromSessionNumber &&
          sessionNumber <= item.toSessionNumber,
      );

      if (rule) {
        return rule.intervalDays;
      }
    }

    return defaultIntervalDays;
  }

  private async buildClinicalContext(item: FollowUpItem) {
    if (!item.serviceId) {
      return { lastTreatment: null, treatmentTimeline: [] };
    }

    const prisma = await this.prisma.getClient();
    const appointmentClinicalSelect = {
      id: true,
      appointmentDate: true,
      startTime: true,
      durationMinutes: true,
      status: true,
      notes: true,
      internalNotes: true,
      staffUser: { select: { id: true, fullName: true, email: true } },
    } satisfies Prisma.AppointmentSelect;

    const [
      latestCompletedTreatment,
      latestConfirmedTreatment,
      latestTreatmentWithNotes,
      completedAppointments,
    ] = await Promise.all([
      prisma.appointment.findFirst({
        where: {
          centerId: item.centerId,
          patientId: item.patientId,
          serviceId: item.serviceId,
          status: 'COMPLETED',
        },
        orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
        select: appointmentClinicalSelect,
      }),
      prisma.appointment.findFirst({
        where: {
          centerId: item.centerId,
          patientId: item.patientId,
          serviceId: item.serviceId,
          status: 'CONFIRMED',
        },
        orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
        select: appointmentClinicalSelect,
      }),
      prisma.appointment.findFirst({
        where: {
          centerId: item.centerId,
          patientId: item.patientId,
          serviceId: item.serviceId,
          status: { not: 'CANCELLED' },
          OR: [{ notes: { not: null } }, { internalNotes: { not: null } }],
        },
        orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
        select: appointmentClinicalSelect,
      }),
      prisma.appointment.findMany({
        where: {
          centerId: item.centerId,
          patientId: item.patientId,
          serviceId: item.serviceId,
          status: 'COMPLETED',
        },
        orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
        select: {
          id: true,
          appointmentDate: true,
          status: true,
          staffUser: { select: { id: true, fullName: true, email: true } },
        },
        take: 12,
      }),
    ]);

    const lastTreatment =
      latestCompletedTreatment ??
      latestConfirmedTreatment ??
      latestTreatmentWithNotes;

    const timeline: Array<{
      id: string;
      sessionNumber: number;
      date: string;
      status: string;
      provider: { id: string; fullName: string; email: string | null } | null;
      type: 'COMPLETED' | 'FOLLOW_UP';
    }> = completedAppointments.map((appointment, index) => ({
      id: appointment.id,
      sessionNumber: index + 1,
      date: dateOnly(appointment.appointmentDate),
      status: appointment.status,
      provider: appointment.staffUser,
      type: 'COMPLETED',
    }));

    timeline.push({
      id: item.id,
      sessionNumber: item.sessionNumber ?? timeline.length + 1,
      date: dateOnly(item.dueDate),
      status: item.status,
      provider: lastTreatment?.staffUser ?? null,
      type: 'FOLLOW_UP' as const,
    });

    return {
      lastTreatment: lastTreatment
        ? {
            id: lastTreatment.id,
            appointmentDate: dateOnly(lastTreatment.appointmentDate),
            startTime: lastTreatment.startTime,
            durationMinutes: lastTreatment.durationMinutes,
            status: lastTreatment.status,
            notes: lastTreatment.notes,
            internalNotes: lastTreatment.internalNotes,
            provider: lastTreatment.staffUser,
          }
        : null,
      treatmentTimeline: timeline.sort((a, b) =>
        a.date === b.date
          ? a.type.localeCompare(b.type)
          : a.date.localeCompare(b.date),
      ),
    };
  }

  private async withComputedFields(item: FollowUpItem) {
    const today = startOfToday().getTime();
    const due = new Date(item.dueDate).getTime();
    const overdueDays = due < today ? Math.floor((today - due) / 86400000) : 0;
    const clinicalContext = await this.buildClinicalContext(item);

    return {
      ...item,
      dueDate: dateOnly(item.dueDate),
      nextAppointment: item.nextAppointment
        ? {
            ...item.nextAppointment,
            appointmentDate: dateOnly(item.nextAppointment.appointmentDate),
          }
        : null,
      overdueDays,
      ...clinicalContext,
    };
  }

  private async buildClinicalContextBatch(
    centerId: string,
    items: FollowUpItem[],
  ) {
    type ClinicalCtx = {
      lastTreatment: {
        id: string;
        appointmentDate: string;
        startTime: string;
        durationMinutes: number;
        status: string;
        notes: string | null;
        internalNotes: string | null;
        provider: { id: string; fullName: string; email: string | null };
      } | null;
      treatmentTimeline: Array<{
        id: string;
        sessionNumber: number;
        date: string;
        status: string;
        provider: {
          id: string;
          fullName: string;
          email: string | null;
        } | null;
        type: 'COMPLETED' | 'FOLLOW_UP';
      }>;
    };

    const resultMap = new Map<string, ClinicalCtx>();

    for (const item of items) {
      if (!item.serviceId) {
        resultMap.set(item.id, { lastTreatment: null, treatmentTimeline: [] });
      }
    }

    const itemsWithService = items.filter(
      (item): item is FollowUpItem & { serviceId: string } =>
        item.serviceId !== null,
    );

    if (itemsWithService.length === 0) return resultMap;

    const prisma = await this.prisma.getClient();

    const batchSelect = {
      id: true,
      patientId: true,
      serviceId: true,
      appointmentDate: true,
      startTime: true,
      durationMinutes: true,
      status: true,
      notes: true,
      internalNotes: true,
      staffUser: { select: { id: true, fullName: true, email: true } },
    } satisfies Prisma.AppointmentSelect;

    // Deduplicate (patientId, serviceId) pairs
    const pairSet = new Set<string>();
    const pairConditions: Array<{ patientId: string; serviceId: string }> = [];

    for (const item of itemsWithService) {
      const key = `${item.patientId}:${item.serviceId}`;
      if (!pairSet.has(key)) {
        pairSet.add(key);
        pairConditions.push({
          patientId: item.patientId,
          serviceId: item.serviceId,
        });
      }
    }

    // Fetch all relevant non-cancelled appointments in one query, oldest first
    const allAppointments = await prisma.appointment.findMany({
      where: {
        centerId,
        status: { not: 'CANCELLED' },
        OR: pairConditions.map((pair) => ({
          patientId: pair.patientId,
          serviceId: pair.serviceId,
        })),
      },
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
      select: batchSelect,
      take: Math.min(pairConditions.length * 15, 500),
    });

    // Group by patientId:serviceId key
    const pairToAppts = new Map<string, typeof allAppointments>();
    for (const appt of allAppointments) {
      if (!appt.serviceId) continue;
      const key = `${appt.patientId}:${appt.serviceId}`;
      if (!pairSet.has(key)) continue;
      if (!pairToAppts.has(key)) pairToAppts.set(key, []);
      pairToAppts.get(key)!.push(appt);
    }

    // Build clinical context for each item using grouped data
    for (const item of itemsWithService) {
      const key = `${item.patientId}:${item.serviceId}`;
      const appts = pairToAppts.get(key) ?? []; // asc: oldest first

      const completedAppts = appts.filter((a) => a.status === 'COMPLETED');
      // Most recent = last in asc-sorted array
      const latestCompleted =
        completedAppts.length > 0
          ? completedAppts[completedAppts.length - 1]
          : null;
      const latestConfirmed =
        [...appts]
          .reverse()
          .find((a) => a.status === 'CONFIRMED') ?? null;
      const latestWithNotes =
        [...appts]
          .reverse()
          .find((a) => a.notes !== null || a.internalNotes !== null) ?? null;

      const lastTreatment =
        latestCompleted ?? latestConfirmed ?? latestWithNotes;

      // Timeline: oldest 12 completed, in chronological order
      const timelineAppts = completedAppts.slice(0, 12);
      const timeline: ClinicalCtx['treatmentTimeline'] = timelineAppts.map(
        (appt, index) => ({
          id: appt.id,
          sessionNumber: index + 1,
          date: dateOnly(appt.appointmentDate),
          status: appt.status,
          provider: appt.staffUser,
          type: 'COMPLETED' as const,
        }),
      );

      timeline.push({
        id: item.id,
        sessionNumber: item.sessionNumber ?? timeline.length + 1,
        date: dateOnly(item.dueDate),
        status: item.status,
        provider: lastTreatment?.staffUser ?? null,
        type: 'FOLLOW_UP',
      });

      resultMap.set(item.id, {
        lastTreatment: lastTreatment
          ? {
              id: lastTreatment.id,
              appointmentDate: dateOnly(lastTreatment.appointmentDate),
              startTime: lastTreatment.startTime,
              durationMinutes: lastTreatment.durationMinutes,
              status: lastTreatment.status,
              notes: lastTreatment.notes,
              internalNotes: lastTreatment.internalNotes,
              provider: lastTreatment.staffUser,
            }
          : null,
        treatmentTimeline: timeline.sort((a, b) =>
          a.date === b.date
            ? a.type.localeCompare(b.type)
            : a.date.localeCompare(b.date),
        ),
      });
    }

    return resultMap;
  }

  private requirePermission(
    permissions: string[],
    permission: FollowUpPermission,
  ) {
    if (!hasTenantPermission(permissions, permission)) {
      throw forbidden(permission);
    }
  }

  private notFound() {
    return new NotFoundException({
      message: 'Follow-up not found',
      errors: { followUp: 'Follow-up not found.' },
    });
  }
}
