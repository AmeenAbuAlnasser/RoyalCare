import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PatientFollowUpSourceType,
  PatientFollowUpStatus,
  type RecurringIntervalUnit,
} from '@royalcare/db';
import { PrismaService } from '../../../common/database/prisma.service';
import { hasTenantPermission } from '../../../common/permissions/tenant-permissions';

type FollowUpPermission = 'appointments:view' | 'appointments:update';

type FollowUpListQuery = {
  filter?: string;
  includeAll?: boolean | string;
  includeAllForPatient?: boolean | string;
  patientId?: string;
  branchId?: string;
  kind?: string;
};

const followUpStatuses = [
  'DUE',
  'UPCOMING',
  'CONTACTED',
  'BOOKED',
  'COMPLETED',
  'MISSED',
  'CLOSED_EARLY',
  'CANCELLED',
  'SKIPPED',
  'PAUSED',
] as const;

const activeRecurringStatuses: PatientFollowUpStatus[] = [
  'UPCOMING',
  'DUE',
  'CONTACTED',
  'MISSED',
];

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
  isRecurring: true,
  recurringIntervalValue: true,
  recurringIntervalUnit: true,
  nextRecurringAt: true,
  originFollowUpId: true,
  status: true,
  planStatus: true,
  closedEarlyReason: true,
  closedEarlyAt: true,
  closedEarlyByUserId: true,
  closedEarlyAfterSession: true,
  treatmentTemplateId: true,
  treatmentTemplateNameAr: true,
  treatmentTemplateNameEn: true,
  treatmentTemplateNameHe: true,
  planTotalSessions: true,
  planDefaultIntervalDays: true,
  planPhases: true,
  lastContactedAt: true,
  lastContactedByUserId: true,
  reminderCount: true,
  lastReminderAt: true,
  lastReminderByUserId: true,
  skippedAt: true,
  skippedByUserId: true,
  pausedAt: true,
  pausedByUserId: true,
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
      followUpMode: true,
      followUpRules: true,
      totalRecommendedSessions: true,
    },
  },
  appointment: {
    select: {
      id: true,
      appointmentDate: true,
      branch: {
        select: {
          id: true,
          name: true,
          cityAr: true,
          cityEn: true,
          cityHe: true,
        },
      },
    },
  },
  // The SINGLE universal linked appointment for every session (session 1 included).
  // The provenance `appointmentId` scalar above is kept for plan grouping only and is
  // intentionally NOT expanded into a relation — it must never drive status.
  nextAppointment: {
    select: {
      id: true,
      appointmentDate: true,
      startTime: true,
      endTime: true,
      status: true,
      staffUser: { select: { id: true, fullName: true, email: true } },
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

function linkedAppointmentPayload(item: FollowUpItem) {
  // SINGLE universal link: nextAppointment. Session 1 carries it too (set at plan
  // creation), so there is no session-1 fallback to the provenance appointment.
  if (item.nextAppointment) {
    const a = item.nextAppointment;
    return {
      id: a.id,
      date: dateOnly(a.appointmentDate),
      appointmentDate: dateOnly(a.appointmentDate),
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
      provider: a.staffUser,
    };
  }
  return null;
}

// Extract the calendar date (YYYY-MM-DD) using LOCAL time methods.
// pg-types@2 parses PostgreSQL `date` columns as new Date(year, month, day) — local midnight.
// On a UTC+ server toISOString() shifts this to the previous day; local methods give the correct date.
function localDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convert a Prisma @db.Date field to a canonical UTC-midnight Date for arithmetic.
// Prisma/pg may return @db.Date as local midnight, causing toISOString() to shift the
// calendar date on UTC+ servers. localDateKey extracts the correct calendar date first.
function normalizePrismaDate(value: Date): Date {
  return new Date(`${localDateKey(value)}T00:00:00.000Z`);
}

function startOfToday() {
  return new Date(`${localDateKey(new Date())}T00:00:00.000Z`);
}

function addDays(date: Date, days: number) {
  const next = new Date(`${dateOnly(date)}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addRecurringInterval(
  date: Date,
  value: number,
  unit: RecurringIntervalUnit,
) {
  const next = new Date(`${dateOnly(date)}T00:00:00.000Z`);

  if (unit === 'DAY') {
    next.setUTCDate(next.getUTCDate() + value);
  } else if (unit === 'WEEK') {
    next.setUTCDate(next.getUTCDate() + value * 7);
  } else if (unit === 'MONTH') {
    next.setUTCMonth(next.getUTCMonth() + value);
  } else if (unit === 'YEAR') {
    next.setUTCFullYear(next.getUTCFullYear() + value);
  }

  return next;
}

function dateFilterStatusWhere(): Prisma.EnumPatientFollowUpStatusFilter {
  return {
    notIn: ['COMPLETED', 'CLOSED_EARLY', 'CANCELLED', 'SKIPPED', 'PAUSED'],
  };
}

function nextSevenDaysStatusWhere(): Prisma.EnumPatientFollowUpStatusFilter {
  // "خلال 7 أيام" (THIS_WEEK) shows every non-terminal session due in the window —
  // UPCOMING, DUE, BOOKED and CONTACTED. Only terminal states are excluded so a
  // BOOKED session due within 7 days still surfaces here.
  return {
    notIn: [
      'COMPLETED',
      'MISSED',
      'CLOSED_EARLY',
      'CANCELLED',
      'SKIPPED',
      'PAUSED',
    ],
  };
}

function recurringDateWindow(
  bucket: 'OVERDUE' | 'TODAY' | 'THIS_WEEK',
  today: Date,
): Prisma.DateTimeNullableFilter {
  const tomorrow = addDays(today, 1);

  if (bucket === 'OVERDUE') return { lt: today };
  if (bucket === 'TODAY') return { gte: today, lt: tomorrow };

  // DUE_SOON / THIS_WEEK is strictly after today through seven days ahead,
  // inclusive. The exclusive upper bound is therefore today + 8 days.
  return { gte: tomorrow, lt: addDays(today, 8) };
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

// ─── Effective-status helpers ─────────────────────────────────────────────────
// The API computes these so the UI always reflects the linked appointment's
// current state instead of a potentially stale PatientFollowUp.status value.

type EffectiveVisualState =
  | 'BOOKED'
  | 'COMPLETED'
  | 'MISSED'
  | 'CANCELLED'
  | 'CLOSED_EARLY'
  | 'SKIPPED'
  | 'PAUSED'
  | 'UNBOOKED';

type LinkedApptInfo = {
  id: string;
  status: string;
  appointmentDate: Date;
  startTime: string;
};

// Returns the linked appointment for a session via the SINGLE universal mechanism:
// `nextAppointment` (set for every session including session 1). No session-1
// special-case, no fallback to the provenance `appointmentId`. Consumed once per item.
function computeLinkedAppt(item: FollowUpItem): LinkedApptInfo | null {
  if (item.nextAppointment) {
    return {
      id: item.nextAppointment.id,
      status: item.nextAppointment.status,
      appointmentDate: item.nextAppointment.appointmentDate,
      startTime: item.nextAppointment.startTime,
    };
  }
  return null;
}

function computeEffectiveLinkedAppointmentId(item: FollowUpItem): string | null {
  return item.nextAppointmentId ?? null;
}

function computeEffectiveStatus(item: FollowUpItem, linked: LinkedApptInfo | null): string {
  // Plan-level closure states are always preserved regardless of appointment.
  if (
    item.status === 'CANCELLED' ||
    item.status === 'CLOSED_EARLY' ||
    item.status === 'SKIPPED' ||
    item.status === 'PAUSED'
  ) return item.status;
  // No usable linked appointment → the stored status is the truth.
  if (!linked) return item.status;
  // A linked appointment exists → it is the source of truth for THIS session.
  // (The sync clears the link on NO_SHOW/CANCELLED, so in practice a live link is
  // SCHEDULED/CONFIRMED/COMPLETED; the other cases remain as defensive fallbacks
  // for any momentarily-stale link.)
  switch (linked.status) {
    case 'SCHEDULED':
    case 'CONFIRMED':
      return 'BOOKED';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'NO_SHOW':
      return 'MISSED';
    case 'CANCELLED':
      // A cancelled linked appointment makes the session terminally CANCELLED —
      // it must not reappear in upcoming/overdue as if it still needs booking.
      return 'CANCELLED';
    default:
      return item.status;
  }
}

function computeEffectiveVisualState(effectiveStatus: string): EffectiveVisualState {
  switch (effectiveStatus) {
    case 'BOOKED':       return 'BOOKED';
    case 'COMPLETED':    return 'COMPLETED';
    case 'MISSED':       return 'MISSED';
    case 'CANCELLED':    return 'CANCELLED';
    case 'CLOSED_EARLY': return 'CLOSED_EARLY';
    case 'SKIPPED':      return 'SKIPPED';
    case 'PAUSED':       return 'PAUSED';
    default:             return 'UNBOOKED';
  }
}

// Whether the session can be booked (shows "حجز جلسة"). Pure status logic — no
// session-1 branch. A session is bookable only in an actionable, non-terminal state
// (DUE/UPCOMING/CONTACTED/MISSED). BOOKED/COMPLETED/CANCELLED/CLOSED_EARLY are not
// bookable — so a cancelled session never offers a booking action.
function computeEffectiveCanBook(effectiveStatus: string, item: FollowUpItem): boolean {
  if (item.planStatus !== 'ACTIVE') return false;
  return (
    effectiveStatus === 'DUE' ||
    effectiveStatus === 'UPCOMING' ||
    effectiveStatus === 'CONTACTED' ||
    effectiveStatus === 'MISSED'
  );
}

function ensureAllowedStatus(value?: string): PatientFollowUpStatus {
  if (!value || !followUpStatuses.includes(value as PatientFollowUpStatus)) {
    throw validationFailed({ status: 'Select a valid follow-up status.' });
  }

  return value as PatientFollowUpStatus;
}

function parseDueDate(value?: string): Date {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw validationFailed({ dueDate: 'Select a valid follow-up due date.' });
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || dateOnly(parsed) !== value) {
    throw validationFailed({ dueDate: 'Select a valid follow-up due date.' });
  }

  return parsed;
}

@Injectable()
export class PatientFollowUpsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pre-create all follow-ups for a multi-session treatment plan at appointment
   * creation time.  For a service configured with totalRecommendedSessions = 8
   * and a 30-day interval, this creates 8 records immediately so the Follow-ups
   * page can show the full plan without waiting for each session to complete.
   *
   * Idempotent: if active (non-cancelled) follow-ups already exist for this
   * patient+service combination the method exits without inserting anything.
   *
   * Single-session services (totalRecommendedSessions <= 1) are intentionally
   * ignored here; they continue to use the createFromCompletedAppointment chain.
   */
  async createPlanFromAppointment(
    centerId: string,
    appointmentId: string,
  ) {
    const prisma = await this.prisma.getClient();
    const appointment = await prisma.appointment.findFirst({
      where: { centerId, id: appointmentId },
      select: {
        id: true,
        centerId: true,
        patientId: true,
        serviceId: true,
        appointmentDate: true,
        completedAt: true,
        treatmentTemplateId: true,
        treatmentTemplateNameAr: true,
        treatmentTemplateNameEn: true,
        treatmentTemplateNameHe: true,
        treatmentTemplateTotalSessions: true,
        treatmentTemplateDefaultIntervalDays: true,
        treatmentTemplatePhases: true,
        service: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            nameHe: true,
            followUpEnabled: true,
            followUpMode: true,
            defaultIntervalDays: true,
            totalRecommendedSessions: true,
            autoCreateNextReminder: true,
            followUpRules: true,
          },
        },
      },
    });

    if (!appointment?.serviceId || !appointment.service?.followUpEnabled) {
      return null;
    }

    if (appointment.service.followUpMode === 'RECURRING_CONTINUOUS') {
      return null;
    }

    // When a treatment template snapshot is stored on the appointment, use ONLY
    // that snapshot's phases and session count. Never fall through to service-level
    // data: service.followUpRules may contain more phases than the selected template.
    const hasTemplateSnapshot = appointment.treatmentTemplateId !== null;
    const rules = parseRules(
      hasTemplateSnapshot
        ? appointment.treatmentTemplatePhases
        : (appointment.treatmentTemplatePhases ?? appointment.service.followUpRules),
    );

    // Derive total sessions from the snapshot when present; only consult the
    // service when no template was selected.
    const derivedTotalSessions = hasTemplateSnapshot
      ? (appointment.treatmentTemplateTotalSessions ??
         (rules.length > 0 ? Math.max(...rules.map((r) => r.toSessionNumber)) : null))
      : (appointment.treatmentTemplateTotalSessions ??
         appointment.service.totalRecommendedSessions ??
         (rules.length > 0 ? Math.max(...rules.map((r) => r.toSessionNumber)) : null));

    const totalSessions = derivedTotalSessions;

    if (!totalSessions || totalSessions < 2) {
      // Single-session service: handled by createFromCompletedAppointment
      console.log('[follow-up:plan-skip-single-session]', {
        appointmentId,
        totalRecommendedSessions:
          appointment.treatmentTemplateTotalSessions ??
          appointment.service.totalRecommendedSessions,
        derivedTotalSessions,
        rulesCount: rules.length,
      });
      return null;
    }

    // autoCreateNextReminder blocks single-session reminders but must NOT block
    // full SESSION_BASED_PLAN generation — the plan is the core feature of the service.
    if (appointment.service.followUpMode !== 'SESSION_BASED_PLAN' && !appointment.service.autoCreateNextReminder) {
      return null;
    }

    console.log('[follow-up:plan-service-inspection]', {
      appointmentId,
      centerId,
      serviceId: appointment.serviceId,
      followUpMode: appointment.service.followUpMode,
      totalRecommendedSessions: totalSessions,
      defaultIntervalDays:
        appointment.treatmentTemplateDefaultIntervalDays ??
        appointment.service.defaultIntervalDays,
      followUpRulesRaw:
        appointment.treatmentTemplatePhases ?? appointment.service.followUpRules,
      autoCreateNextReminder: appointment.service.autoCreateNextReminder,
    });

    // Idempotency: skip only when the full plan already exists (non-cancelled
    // count >= totalSessions). A partial plan (e.g. created before the phase-
    // rules bug was fixed) is allowed to proceed so the missing rows are added.
    const existingNonCancelledCount = await prisma.patientFollowUp.count({
      where: {
        centerId,
        patientId: appointment.patientId,
        serviceId: appointment.serviceId,
        status: { notIn: ['CANCELLED', 'CLOSED_EARLY'] },
      },
    });

    if (existingNonCancelledCount >= totalSessions) {
      console.log('[follow-up:plan-skip-full-plan-exists]', {
        appointmentId,
        centerId,
        existingNonCancelledCount,
        totalSessions,
        serviceId: appointment.serviceId,
      });
      return null;
    }

    // Collect which session numbers already exist so we don't create duplicates.
    const existingSessionNumbers = new Set<number>();
    if (existingNonCancelledCount > 0) {
      const existingRows = await prisma.patientFollowUp.findMany({
        where: {
          centerId,
          patientId: appointment.patientId,
          serviceId: appointment.serviceId,
          status: { notIn: ['CANCELLED', 'CLOSED_EARLY'] },
          sessionNumber: { not: null },
        },
        select: { sessionNumber: true },
      });
      for (const row of existingRows) {
        if (row.sessionNumber !== null) existingSessionNumbers.add(row.sessionNumber);
      }
    }

    // rules already computed above when deriving totalSessions
    const title =
      appointment.service.nameAr ||
      appointment.service.nameEn ||
      appointment.service.nameHe ||
      'Follow-up';

    // Build one record per session.
    // runningDate accumulates: each session's due date = previous + that session's interval.
    const followUpsData: Prisma.PatientFollowUpCreateManyInput[] = [];

    // Normalize the appointment date to UTC midnight before arithmetic.
    // Prisma/pg may return @db.Date as local midnight; normalizePrismaDate corrects this.
    const rawDate = appointment.appointmentDate;
    const rawDateObj = rawDate instanceof Date ? rawDate : new Date(rawDate as string);
    let runningDate: Date = normalizePrismaDate(rawDateObj);

    console.log('[follow-up:plan-generate]', {
      appointmentId,
      centerId,
      serviceId: appointment.serviceId,
      defaultIntervalDays:
        appointment.treatmentTemplateDefaultIntervalDays ??
        appointment.service.defaultIntervalDays,
      rulesCount: rules.length,
      rules,
      totalSessions,
      existingNonCancelledCount,
      existingSessionNumbers: [...existingSessionNumbers],
    });

    for (let session = 1; session <= totalSessions; session++) {
      // Session 1 IS the appointment itself — dueDate = appointment date, no interval added.
      // Sessions 2..N each advance runningDate by the interval for that session number.
      if (session > 1) {
        const intervalDays = this.resolveIntervalDays(
          hasTemplateSnapshot
            ? appointment.treatmentTemplateDefaultIntervalDays
            : (appointment.treatmentTemplateDefaultIntervalDays ?? appointment.service.defaultIntervalDays),
          rules,
          session,
        );

        console.log('[follow-up:plan-session-interval]', {
          session,
          intervalDays,
          rulesMatched: rules.find(r => session >= r.fromSessionNumber && session <= r.toSessionNumber) ?? null,
        });

        if (!intervalDays || intervalDays <= 0) {
          console.log('[follow-up:plan-skip-no-interval]', { session, intervalDays, appointmentId });
          continue;
        }

        runningDate = addDays(runningDate, intervalDays);
      }

      if (existingSessionNumbers.has(session)) {
        console.log('[follow-up:plan-skip-session-exists]', { session, appointmentId });
        continue;
      }

      followUpsData.push({
        centerId,
        patientId: appointment.patientId,
        serviceId: appointment.serviceId,
        appointmentId: appointment.id,
        sourceType: PatientFollowUpSourceType.APPOINTMENT_COMPLETED,
        title,
        sessionNumber: session,
        dueDate: runningDate,
        treatmentTemplateId: appointment.treatmentTemplateId,
        treatmentTemplateNameAr: appointment.treatmentTemplateNameAr,
        treatmentTemplateNameEn: appointment.treatmentTemplateNameEn,
        treatmentTemplateNameHe: appointment.treatmentTemplateNameHe,
        planTotalSessions: totalSessions,
        planDefaultIntervalDays: hasTemplateSnapshot
          ? appointment.treatmentTemplateDefaultIntervalDays
          : (appointment.treatmentTemplateDefaultIntervalDays ?? appointment.service.defaultIntervalDays),
        planPhases: hasTemplateSnapshot
          ? (appointment.treatmentTemplatePhases ?? Prisma.JsonNull)
          : (appointment.treatmentTemplatePhases ?? appointment.service.followUpRules ?? Prisma.JsonNull),
        // Session 1 IS the source appointment. Link it through the SAME universal
        // mechanism as every other session — nextAppointmentId — so it shows
        // "عرض الموعد / تعديل الموعد" instead of "حجز جلسة" and starts BOOKED.
        // syncFollowUpSessionFromAppointment then mirrors later status changes
        // (e.g. COMPLETED, or CANCELLED → detach) onto this one row only.
        ...(session === 1
          ? {
              nextAppointmentId: appointment.id,
              status: PatientFollowUpStatus.BOOKED,
            }
          : { status: statusForDueDate(runningDate) }),
      });
    }

    if (followUpsData.length === 0) {
      console.log('[follow-up:plan-no-sessions-to-create]', { appointmentId, centerId, totalSessions });
      return null;
    }

    await prisma.patientFollowUp.createMany({ data: followUpsData });

    console.log('[follow-up:plan-created]', {
      appointmentId,
      centerId,
      serviceId: appointment.serviceId,
      sessionsCreated: followUpsData.length,
      sessionNumbers: followUpsData.map(f => f.sessionNumber),
    });

    return { count: followUpsData.length };
  }

  async recalculateScheduleForAppointment(
    centerId: string,
    appointmentId: string,
    nextAppointmentDate: Date,
  ) {
    const prisma = await this.prisma.getClient();
    const appointment = await prisma.appointment.findFirst({
      where: { centerId, id: appointmentId },
      select: {
        id: true,
        appointmentDate: true,
        treatmentTemplateId: true,
        treatmentTemplateDefaultIntervalDays: true,
        treatmentTemplatePhases: true,
        service: {
          select: {
            defaultIntervalDays: true,
            followUpRules: true,
          },
        },
      },
    });

    if (!appointment) {
      return {
        linkedFollowUpId: null,
        linkedFollowUpSessionId: null,
        sessionsFound: 0,
        sessionsUpdated: 0,
        updatedSessionDates: [] as Array<{
          dueDate: string;
          id: string;
          sessionNumber: number | null;
        }>,
      };
    }

    const linkedRows = await prisma.patientFollowUp.findMany({
      where: {
        centerId,
        isRecurring: false,
        OR: [{ appointmentId }, { nextAppointmentId: appointmentId }],
      },
      orderBy: [{ sessionNumber: 'asc' }, { dueDate: 'asc' }],
      select: {
        appointmentId: true,
        dueDate: true,
        id: true,
        nextAppointmentId: true,
        planDefaultIntervalDays: true,
        planPhases: true,
        sessionNumber: true,
        status: true,
      },
    });

    if (linkedRows.length === 0) {
      return {
        linkedFollowUpId: null,
        linkedFollowUpSessionId: null,
        sessionsFound: 0,
        sessionsUpdated: 0,
        updatedSessionDates: [] as Array<{
          dueDate: string;
          id: string;
          sessionNumber: number | null;
        }>,
      };
    }

    const anchorRow =
      linkedRows.find((row) => row.nextAppointmentId === appointmentId) ??
      linkedRows.find((row) => row.appointmentId === appointmentId && row.sessionNumber === 1) ??
      linkedRows[0];
    const anchorSession = anchorRow.sessionNumber ?? 1;
    const planAppointmentId = anchorRow.appointmentId ?? appointmentId;
    const planRows = await prisma.patientFollowUp.findMany({
      where: {
        centerId,
        appointmentId: planAppointmentId,
        isRecurring: false,
        sessionNumber: { not: null },
      },
      orderBy: [{ sessionNumber: 'asc' }, { dueDate: 'asc' }],
      select: {
        dueDate: true,
        id: true,
        nextAppointmentId: true,
        planDefaultIntervalDays: true,
        planPhases: true,
        sessionNumber: true,
        status: true,
      },
    });

    const rows = planRows.length > 0 ? planRows : linkedRows;
    const firstPlanRow = rows.find((row) => row.planPhases || row.planDefaultIntervalDays);
    const recalcHasTemplate = appointment.treatmentTemplateId !== null;
    const rules = parseRules(
      (firstPlanRow?.planPhases ??
        appointment.treatmentTemplatePhases ??
        (recalcHasTemplate ? null : appointment.service?.followUpRules) ??
        null) as Prisma.JsonValue | null,
    );
    const defaultIntervalDays =
      firstPlanRow?.planDefaultIntervalDays ??
      appointment.treatmentTemplateDefaultIntervalDays ??
      (recalcHasTemplate ? null : appointment.service?.defaultIntervalDays) ??
      null;
    const mutableStatuses: PatientFollowUpStatus[] = [
      'UPCOMING',
      'DUE',
      'CONTACTED',
      'MISSED',
    ];

    let runningDate = normalizePrismaDate(nextAppointmentDate);
    const updatedSessionDates: Array<{
      dueDate: string;
      id: string;
      sessionNumber: number | null;
    }> = [];

    for (const row of rows) {
      const sessionNumber = row.sessionNumber ?? 0;

      if (sessionNumber < anchorSession) {
        runningDate = normalizePrismaDate(row.dueDate);
        continue;
      }

      if (sessionNumber > anchorSession) {
        const intervalDays = this.resolveIntervalDays(
          defaultIntervalDays,
          rules,
          sessionNumber,
        );

        if (!intervalDays || intervalDays <= 0) {
          runningDate = normalizePrismaDate(row.dueDate);
          continue;
        }

        runningDate = addDays(runningDate, intervalDays);
      }

      const isAnchorLinkedAppointment = row.nextAppointmentId === appointmentId;
      const canUpdate =
        isAnchorLinkedAppointment ||
        (mutableStatuses.includes(row.status) && !row.nextAppointmentId);

      if (!canUpdate) {
        runningDate = normalizePrismaDate(row.dueDate);
        continue;
      }

      await prisma.patientFollowUp.update({
        where: { id: row.id },
        data: {
          dueDate: runningDate,
          status:
            row.status === 'MISSED' || row.status === 'DUE' || row.status === 'UPCOMING'
              ? statusForDueDate(runningDate)
              : row.status,
        },
      });
      updatedSessionDates.push({
        dueDate: dateOnly(runningDate),
        id: row.id,
        sessionNumber: row.sessionNumber,
      });
    }

    return {
      linkedFollowUpId: anchorRow.id,
      linkedFollowUpSessionId: anchorRow.id,
      sessionsFound: rows.length,
      sessionsUpdated: updatedSessionDates.length,
      updatedSessionDates,
    };
  }

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
        completedAt: true,
        treatmentTemplateTotalSessions: true,
        service: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            nameHe: true,
            followUpEnabled: true,
            followUpMode: true,
            defaultIntervalDays: true,
            totalRecommendedSessions: true,
            recurringIntervalValue: true,
            recurringIntervalUnit: true,
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
      serviceId: appointment?.serviceId ?? null,
      serviceLoaded: Boolean(appointment?.service),
    });

    if (!appointment?.service) {
      return null;
    }

    const service = appointment.service;

    console.log('[follow-up:completion-check]', {
      appointmentId,
      centerId,
      serviceId: appointment.serviceId,
      followUpMode: service.followUpMode,
      totalRecommendedSessions: service.totalRecommendedSessions,
      treatmentTemplateTotalSessions: appointment.treatmentTemplateTotalSessions,
      defaultIntervalDays: service.defaultIntervalDays,
      rulesCount: Array.isArray(service.followUpRules)
        ? (service.followUpRules as unknown[]).length
        : 0,
      autoCreateNextReminder: service.autoCreateNextReminder,
    });

    if (
      service.followUpMode === 'NONE' ||
      !service.followUpEnabled
    ) {
      return null;
    }

    if (service.followUpMode === 'RECURRING_CONTINUOUS') {
      return this.createRecurringFromAppointment(centerId, {
        ...appointment,
        service,
      });
    }

    // SESSION_BASED_PLAN with multiple sessions: always delegate to the full plan
    // generator so all sessions 1..N are created, not just the next one.
    if (
      service.followUpMode === 'SESSION_BASED_PLAN' &&
      (appointment.treatmentTemplateTotalSessions ??
        service.totalRecommendedSessions) &&
      (appointment.treatmentTemplateTotalSessions ??
        service.totalRecommendedSessions ??
        0) > 1
    ) {
      console.log('[follow-up:completion-delegate-to-plan]', {
        appointmentId,
        centerId,
        totalRecommendedSessions:
          appointment.treatmentTemplateTotalSessions ??
          service.totalRecommendedSessions,
      });
      return this.createPlanFromAppointment(centerId, appointmentId);
    }

    // Single-session / legacy: respect autoCreateNextReminder flag.
    if (!service.autoCreateNextReminder) {
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
        status: { notIn: ['CANCELLED', 'CLOSED_EARLY'] },
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

  private async backfillMissingRecurringFollowUps(centerId: string) {
    const prisma = await this.prisma.getClient();
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        centerId,
        status: 'COMPLETED',
        serviceId: { not: null },
        service: {
          followUpEnabled: true,
          followUpMode: 'RECURRING_CONTINUOUS',
          recurringIntervalValue: { not: null },
          recurringIntervalUnit: { not: null },
        },
      },
      orderBy: [{ completedAt: 'desc' }, { appointmentDate: 'desc' }],
      select: {
        id: true,
        patientId: true,
        serviceId: true,
      },
      take: 500,
    });

    const checkedPatientServices = new Set<string>();
    let generated = 0;

    for (const appointment of completedAppointments) {
      if (!appointment.serviceId) continue;
      const lifecycleKey = `${appointment.patientId}:${appointment.serviceId}`;
      if (checkedPatientServices.has(lifecycleKey)) continue;
      checkedPatientServices.add(lifecycleKey);

      const existingLifecycle = await prisma.patientFollowUp.findFirst({
        where: {
          centerId,
          isRecurring: true,
          OR: [
            { appointmentId: appointment.id },
            {
              patientId: appointment.patientId,
              serviceId: appointment.serviceId,
              status: { in: activeRecurringStatuses },
              planStatus: 'ACTIVE',
            },
          ],
        },
        select: { id: true },
      });

      if (existingLifecycle) continue;

      const created = await this.createFromCompletedAppointment(
        centerId,
        appointment.id,
      );
      if (created) generated += 1;
    }

    return { checked: checkedPatientServices.size, generated };
  }

  private async createRecurringFromAppointment(
    centerId: string,
    appointment: {
      id: string;
      patientId: string;
      serviceId: string | null;
      appointmentDate: Date;
      completedAt: Date | null;
      service: {
        nameAr: string;
        nameEn: string;
        nameHe: string;
        recurringIntervalValue: number | null;
        recurringIntervalUnit: RecurringIntervalUnit | null;
      };
    },
  ) {
    if (
      !appointment.serviceId ||
      !appointment.service.recurringIntervalValue ||
      !appointment.service.recurringIntervalUnit
    ) {
      console.warn('[follow-up:recurring-skipped-invalid-settings]', {
        appointmentId: appointment.id,
        centerId,
        serviceId: appointment.serviceId,
      });
      return null;
    }

    const prisma = await this.prisma.getClient();
    const activeExisting = await prisma.patientFollowUp.findFirst({
      where: {
        centerId,
        patientId: appointment.patientId,
        serviceId: appointment.serviceId,
        isRecurring: true,
        status: { in: activeRecurringStatuses },
      },
      select: { id: true },
      orderBy: { dueDate: 'asc' },
    });

    if (activeExisting) {
      console.log('[follow-up:recurring-skip-active-existing]', {
        appointmentId: appointment.id,
        centerId,
        existingFollowUpId: activeExisting.id,
        patientId: appointment.patientId,
        serviceId: appointment.serviceId,
      });
      return activeExisting;
    }

    const baseDate = appointment.completedAt ?? appointment.appointmentDate;
    const dueDate = addRecurringInterval(
      baseDate,
      appointment.service.recurringIntervalValue,
      appointment.service.recurringIntervalUnit,
    );
    const title =
      appointment.service.nameAr ||
      appointment.service.nameEn ||
      appointment.service.nameHe ||
      'Recurring follow-up';

    const followUp = await prisma.patientFollowUp.create({
      data: {
        centerId,
        patientId: appointment.patientId,
        serviceId: appointment.serviceId,
        appointmentId: appointment.id,
        sourceType: PatientFollowUpSourceType.APPOINTMENT_COMPLETED,
        title,
        sessionNumber: null,
        dueDate,
        isRecurring: true,
        recurringIntervalValue: appointment.service.recurringIntervalValue,
        recurringIntervalUnit: appointment.service.recurringIntervalUnit,
        nextRecurringAt: dueDate,
        planStatus: 'ACTIVE',
        status: statusForDueDate(dueDate),
      },
      select: { id: true },
    });

    console.log('[follow-up:recurring-created]', {
      appointmentId: appointment.id,
      centerId,
      baseDate,
      dueDate,
      followUpId: followUp.id,
      intervalUnit: appointment.service.recurringIntervalUnit,
      intervalValue: appointment.service.recurringIntervalValue,
      serviceId: appointment.serviceId,
    });

    return followUp;
  }

  // ─── CANONICAL appointment → follow-up session sync ─────────────────────────
  //
  // Mirrors ONE appointment's status onto the ONE follow-up session linked to it
  // via `nextAppointmentId`. This is the universal link mechanism for EVERY
  // session, session 1 included: createPlanFromAppointment sets
  // `nextAppointmentId = origin appointment id` on session 1 at creation, so
  // session 1 needs no special-casing here.
  //
  // HARD GUARANTEES (root-cause protections against the historical mass-cancel bug):
  //   • Queries ONLY by nextAppointmentId. Never by appointmentId (which is mere
  //     provenance stamped on every plan row), never by planId, patientId+serviceId,
  //     or date. This is what makes a single-appointment edit touch a single session.
  //   • Updates AT MOST ONE row, by primary key.
  //   • THROWS if more than one session is linked to the same appointment — that is
  //     data corruption that must never silently mass-mutate a plan.
  //   • Exits silently when no session is linked.
  //   • Idempotent: re-running against an unchanged appointment is a no-op.
  //
  // Status mapping (appointment status → linked session status):
  //   SCHEDULED | CONFIRMED → BOOKED      (link kept — appointment fulfils the session)
  //   COMPLETED             → COMPLETED   (link kept)
  //   NO_SHOW               → MISSED      (link CLEARED — session must be re-bookable)
  //   CANCELLED             → CANCELLED   (link KEPT for history — terminal session)
  //
  // A cancelled appointment makes the linked session terminally CANCELLED: it leaves
  // the upcoming/overdue views and surfaces only in the cancelled view / patient full
  // history. NO_SHOW instead clears the link so the missed session can be re-booked.
  // Either way ONLY the linked session changes — never the wider plan.
  async syncFollowUpSessionFromAppointment(
    centerId: string,
    appointmentId: string,
  ): Promise<void> {
    const prisma = await this.prisma.getClient();

    const appointment = await prisma.appointment.findFirst({
      where: { centerId, id: appointmentId },
      select: { id: true, status: true },
    });
    if (!appointment) return;

    // The linked session(s) — universal mechanism, no session-1 fallback.
    const linked = await prisma.patientFollowUp.findMany({
      where: { centerId, nextAppointmentId: appointmentId },
      select: { id: true, status: true, dueDate: true, sessionNumber: true },
    });

    if (linked.length === 0) {
      return; // Nothing is linked to this appointment — never scan the wider plan.
    }

    // HARD ASSERTION: one appointment must fulfil at most one follow-up session.
    // If this ever fires, the data is corrupt — fail loudly rather than mass-mutate.
    if (linked.length > 1) {
      console.error('[follow-up:sync:FATAL-multiple-links]', {
        appointmentId,
        centerId,
        linkedSessionIds: linked.map((s) => s.id),
      });
      throw new Error(
        `Follow-up sync integrity violation: appointment ${appointmentId} is linked to ${linked.length} sessions (expected at most 1). Refusing to mass-update.`,
      );
    }

    const session = linked[0];

    // Never override an explicit plan-level closure.
    if (session.status === 'CANCELLED' || session.status === 'CLOSED_EARLY') {
      return;
    }

    let targetStatus: PatientFollowUpStatus;
    let clearLink = false;
    switch (appointment.status) {
      case 'SCHEDULED':
      case 'CONFIRMED':
        targetStatus = PatientFollowUpStatus.BOOKED;
        break;
      case 'COMPLETED':
        targetStatus = PatientFollowUpStatus.COMPLETED;
        break;
      case 'NO_SHOW':
        targetStatus = PatientFollowUpStatus.MISSED;
        clearLink = true; // patient missed it — detach so the session can be re-booked
        break;
      case 'CANCELLED':
        // A cancelled appointment makes the linked session terminally CANCELLED.
        // KEEP the link for history; do NOT clear it and do NOT revert to DUE/UPCOMING.
        // The session then shows only in the cancelled view / patient full history.
        targetStatus = PatientFollowUpStatus.CANCELLED;
        break;
      default:
        return; // Unknown appointment status — leave the session untouched.
    }

    const statusChanged = session.status !== targetStatus;
    if (!statusChanged && !clearLink) {
      return; // Idempotent no-op.
    }

    console.log('[follow-up:sync]', {
      appointmentId,
      appointmentStatus: appointment.status,
      sessionId: session.id,
      sessionNumber: session.sessionNumber,
      from: session.status,
      to: targetStatus,
      clearLink,
      rowsTouched: 1,
    });

    // EXACTLY ONE row, addressed by primary key. Never updateMany.
    await prisma.patientFollowUp.update({
      where: { id: session.id },
      data: {
        status: targetStatus,
        ...(clearLink ? { nextAppointmentId: null } : {}),
      },
    });
  }

  async list(
    centerId: string,
    permissions: string[],
    query?: FollowUpListQuery,
  ) {
    this.requirePermission(permissions, 'appointments:view');

    if (query?.kind === 'RECURRING_CONTINUOUS') {
      await this.backfillMissingRecurringFollowUps(centerId);
    }

    const t0 = Date.now();
    const where = this.buildListWhere(centerId, query);
    console.log('[follow-ups:list:where]', JSON.stringify(where));

    const prisma = await this.prisma.getClient();

    // Raw count — no conditions except centerId — to prove records exist
    const rawCountForCenter = await prisma.patientFollowUp.count({
      where: { centerId },
    });
    console.log('[follow-ups:list:raw-count]', { centerId, rawCountForCenter });

    const [items, total] = await Promise.all([
      prisma.patientFollowUp.findMany({
        where,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        select: followUpSelect,
        take: 1000,
      }),
      prisma.patientFollowUp.count({ where }),
    ]);

    console.log('[follow-ups:list:result]', {
      centerId,
      rawFilter: query?.filter,
      rawIncludeAll: query?.includeAll,
      total,
      itemsCount: items.length,
      queryWhereKeys: Object.keys(where),
    });
    console.debug(
      `[follow-ups:list] centerId=${centerId} filter=${query?.filter ?? 'none'} found=${total} in ${Date.now() - t0}ms`,
    );

    const todayStart = startOfToday();
    const todayEnd = addDays(todayStart, 1);
    for (const item of items.slice(0, 50)) {
      console.debug('[follow-ups:filter:item]', {
        filterType: query?.filter ?? 'none',
        dueDate: dateOnly(item.dueDate),
        todayStart: dateOnly(todayStart),
        todayEnd: dateOnly(todayEnd),
        computedVisibility: true,
      });
    }

    const contextMap = await this.buildClinicalContextBatch(centerId, items);
    const today = startOfToday().getTime();

    const mapped = items.map((item) => {
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
      const _linked = computeLinkedAppt(item);
      const _effStatus = computeEffectiveStatus(item, _linked);
      const { appointment: sourceAppointment, ...followUp } = item;
      return {
        ...followUp,
        dueDate: dateOnly(item.dueDate),
        nextDueDate: dateOnly(item.nextRecurringAt ?? item.dueDate),
        nextRecurringAt: item.nextRecurringAt
          ? dateOnly(item.nextRecurringAt)
          : null,
        linkedAppointmentId: computeEffectiveLinkedAppointmentId(item),
        linkedAppointmentStatus: _linked?.status ?? null,
        linkedAppointmentDate: _linked?.appointmentDate
          ? dateOnly(_linked.appointmentDate)
          : null,
        linkedAppointmentTime: _linked?.startTime ?? null,
        linkedAppointment: linkedAppointmentPayload(item),
        nextAppointment: item.nextAppointment
          ? {
              ...item.nextAppointment,
              appointmentDate: dateOnly(
                item.nextAppointment.appointmentDate,
              ),
              provider: item.nextAppointment.staffUser,
            }
          : null,
        effectiveStatus: _effStatus,
        effectiveVisualState: computeEffectiveVisualState(_effStatus),
        effectiveCanBook: computeEffectiveCanBook(_effStatus, item),
        overdueDays,
        sourceAppointment: sourceAppointment
          ? {
              ...sourceAppointment,
              appointmentDate: dateOnly(sourceAppointment.appointmentDate),
            }
          : null,
        ...clinicalContext,
      };
    });

    // ── DEFENSIVE BOUNDARY GUARD ────────────────────────────────────────────
    // buildListWhere already filters by stored status, but we additionally enforce
    // the rule on the COMPUTED effectiveStatus so a CANCELLED session can never leak
    // into a forward-looking filter even if stored status drifted from the linked
    // appointment. Full-history calls (includeAll / includeAllForPatient) pass no
    // `filter`, so they are untouched and still return cancelled sessions.
    const dateFilters = ['UPCOMING', 'OVERDUE', 'TODAY', 'THIS_WEEK'];
    let outItems = mapped;
    if (query?.filter && dateFilters.includes(query.filter)) {
      outItems = outItems.filter(
        (it) =>
          it.effectiveStatus !== 'CANCELLED' &&
          it.effectiveStatus !== 'CLOSED_EARLY' &&
          it.linkedAppointmentStatus !== 'CANCELLED',
      );
    }
    if (query?.filter === 'UPCOMING') {
      // UPCOMING is strictly forward-looking: only UPCOMING / DUE / BOOKED.
      outItems = outItems.filter((it) =>
        ['UPCOMING', 'DUE', 'BOOKED'].includes(it.effectiveStatus),
      );
    }
    if (query?.filter === 'THIS_WEEK') {
      // THIS_WEEK shows non-terminal sessions due within the window:
      // UPCOMING / DUE / BOOKED / CONTACTED. Terminal states are excluded.
      outItems = outItems.filter((it) =>
        ['UPCOMING', 'DUE', 'BOOKED', 'CONTACTED'].includes(it.effectiveStatus),
      );
    }
    if (query?.filter === 'CANCELLED') {
      // CANCELLED tab returns ONLY effectively-cancelled sessions.
      outItems = outItems.filter((it) => it.effectiveStatus === 'CANCELLED');
    }

    return {
      items: outItems,
      total: outItems.length,
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

  async analytics(
    centerId: string,
    permissions: string[],
    branchId?: string,
  ) {
    this.requirePermission(permissions, 'appointments:view');

    const prisma = await this.prisma.getClient();
    const today = startOfToday();
    const tomorrow = addDays(today, 1);
    const nextSevenDaysEnd = addDays(today, 8);
    const dateStatus = dateFilterStatusWhere();
    const nextSevenDaysStatus = nextSevenDaysStatusWhere();
    const branchWhere: Prisma.PatientFollowUpWhereInput = branchId
      ? { appointment: { is: { branchId } } }
      : {};
    const activeRecurringWhere: Prisma.PatientFollowUpWhereInput = {
      ...branchWhere,
      isRecurring: true,
      planStatus: 'ACTIVE',
    };
    const [
      dueToday,
      overdue,
      thisWeek,
      upcoming,
      contacted,
      booked,
      totalActionable,
      recurringDueToday,
      recurringThisWeek,
      recurringOverdue,
      recurringRetentionPatients,
      cancelled,
    ] =
      await Promise.all([
        prisma.patientFollowUp.count({
          where: {
            centerId,
            ...branchWhere,
            dueDate: { gte: today, lt: tomorrow },
            status: dateStatus,
          },
        }),
        prisma.patientFollowUp.count({
          where: {
            centerId,
            ...branchWhere,
            dueDate: { lt: today },
            status: dateStatus,
          },
        }),
        prisma.patientFollowUp.count({
          where: {
            centerId,
            ...branchWhere,
            dueDate: { gte: today, lt: nextSevenDaysEnd },
            status: nextSevenDaysStatus,
          },
        }),
        prisma.patientFollowUp.count({
          where: {
            centerId,
            ...branchWhere,
            dueDate: { gte: tomorrow },
            status: dateStatus,
          },
        }),
        prisma.patientFollowUp.count({
          where: { centerId, ...branchWhere, status: 'CONTACTED' },
        }),
        prisma.patientFollowUp.count({
          where: { centerId, ...branchWhere, status: { in: ['BOOKED', 'COMPLETED'] } },
        }),
        prisma.patientFollowUp.count({
          where: {
            centerId,
            ...branchWhere,
            status: {
              notIn: ['CANCELLED', 'CLOSED_EARLY', 'MISSED', 'SKIPPED', 'PAUSED'],
            },
          },
        }),
        prisma.patientFollowUp.count({
          where: {
            centerId,
            ...activeRecurringWhere,
            nextRecurringAt: recurringDateWindow('TODAY', today),
            status: dateStatus,
          },
        }),
        prisma.patientFollowUp.count({
          where: {
            centerId,
            ...activeRecurringWhere,
            nextRecurringAt: recurringDateWindow('THIS_WEEK', today),
            status: nextSevenDaysStatus,
          },
        }),
        prisma.patientFollowUp.count({
          where: {
            centerId,
            ...activeRecurringWhere,
            nextRecurringAt: recurringDateWindow('OVERDUE', today),
            status: dateStatus,
          },
        }),
        prisma.patientFollowUp.findMany({
          where: {
            centerId,
            ...activeRecurringWhere,
            status: {
              notIn: ['CANCELLED', 'CLOSED_EARLY', 'SKIPPED', 'PAUSED'],
            },
          },
          distinct: ['patientId'],
          select: { patientId: true },
        }),
        prisma.patientFollowUp.count({
          where: { centerId, ...branchWhere, status: 'CANCELLED' },
        }),
      ]);

    return {
      dueToday,
      overdue,
      thisWeek,
      upcoming,
      contacted,
      bookedFromFollowUps: booked,
      cancelled,
      recurringDueToday,
      recurringThisWeek,
      recurringOverdue,
      recurringPatientsRetention: recurringRetentionPatients.length,
      conversionRate:
        totalActionable > 0 ? Math.round((booked / totalActionable) * 100) : 0,
    };
  }

  async updateStatus(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    followUpId: string,
    status: string | undefined,
    nextAppointmentId?: string,
  ) {
    this.requirePermission(permissions, 'appointments:update');

    const nextStatus = ensureAllowedStatus(status);
    const prisma = await this.prisma.getClient();
    const existing = await prisma.patientFollowUp.findFirst({
      where: { id: followUpId, centerId },
      select: {
        id: true,
        appointmentId: true,
        patientId: true,
        serviceId: true,
        title: true,
        dueDate: true,
        isRecurring: true,
        recurringIntervalValue: true,
        recurringIntervalUnit: true,
        status: true,
      },
    });

    if (!existing) {
      throw this.notFound();
    }

    if (nextAppointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          centerId,
          id: nextAppointmentId,
          patientId: existing.patientId,
          ...(existing.serviceId ? { serviceId: existing.serviceId } : {}),
        },
        select: { id: true },
      });

      if (!appointment) {
        throw new BadRequestException({
          errors: {
            nextAppointmentId: 'Selected appointment does not match this follow-up.',
          },
          message: 'Validation failed',
        });
      }
    }

    const result = await prisma.patientFollowUp.updateMany({
      where: { id: followUpId, centerId },
      data: {
        status: nextStatus,
        lastContactedAt: nextStatus === 'CONTACTED' ? new Date() : undefined,
        lastContactedByUserId:
          nextStatus === 'CONTACTED' ? actorUserId : undefined,
        reminderCount:
          nextStatus === 'CONTACTED' ? { increment: 1 } : undefined,
        nextAppointmentId:
          nextStatus === 'BOOKED' && nextAppointmentId
            ? nextAppointmentId
            : undefined,
      },
    });

    if (result.count !== 1) {
      throw this.notFound();
    }

    if (nextStatus === 'COMPLETED') {
      if (existing.isRecurring) {
        await this.createNextRecurringAfterCompletion(centerId, existing);
      } else if (existing.appointmentId) {
        const remainingSessions = await prisma.patientFollowUp.count({
          where: {
            centerId,
            appointmentId: existing.appointmentId,
            isRecurring: false,
            status: { not: 'COMPLETED' },
          },
        });

        if (remainingSessions === 0) {
          await prisma.patientFollowUp.updateMany({
            where: {
              centerId,
              appointmentId: existing.appointmentId,
              isRecurring: false,
            },
            data: { planStatus: 'COMPLETED' },
          });
        }
      }
    }

    return this.getById(centerId, followUpId);
  }

  async recordRecurringReminder(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    followUpId: string,
  ) {
    this.requirePermission(permissions, 'appointments:update');
    const prisma = await this.prisma.getClient();
    const result = await prisma.patientFollowUp.updateMany({
      where: {
        centerId,
        id: followUpId,
        isRecurring: true,
        status: { notIn: ['PAUSED', 'CANCELLED', 'COMPLETED'] },
      },
      data: {
        lastReminderAt: new Date(),
        lastReminderByUserId: actorUserId,
        reminderCount: { increment: 1 },
      },
    });

    if (result.count !== 1) throw this.notFound();
    return this.getById(centerId, followUpId);
  }

  async skipRecurringCycle(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    followUpId: string,
  ) {
    this.requirePermission(permissions, 'appointments:update');
    const prisma = await this.prisma.getClient();

    await prisma.$transaction(async (tx) => {
      const existing = await tx.patientFollowUp.findFirst({
        where: { centerId, id: followUpId, isRecurring: true },
        select: {
          id: true,
          patientId: true,
          serviceId: true,
          title: true,
          dueDate: true,
          recurringIntervalValue: true,
          recurringIntervalUnit: true,
          status: true,
        },
      });

      if (
        !existing?.serviceId ||
        !existing.recurringIntervalValue ||
        !existing.recurringIntervalUnit ||
        ['PAUSED', 'CANCELLED', 'COMPLETED', 'SKIPPED'].includes(existing.status)
      ) {
        throw validationFailed({
          followUp: 'This recurring follow-up cycle cannot be skipped.',
        });
      }

      const nextDueDate = addRecurringInterval(
        existing.dueDate,
        existing.recurringIntervalValue,
        existing.recurringIntervalUnit,
      );

      await tx.patientFollowUp.update({
        where: { id: existing.id },
        data: {
          status: 'SKIPPED',
          skippedAt: new Date(),
          skippedByUserId: actorUserId,
          nextRecurringAt: nextDueDate,
        },
      });

      const activeNext = await tx.patientFollowUp.findFirst({
        where: {
          centerId,
          patientId: existing.patientId,
          serviceId: existing.serviceId,
          isRecurring: true,
          id: { not: existing.id },
          status: { in: activeRecurringStatuses },
        },
        select: { id: true },
      });

      if (!activeNext) {
        await tx.patientFollowUp.create({
          data: {
            centerId,
            patientId: existing.patientId,
            serviceId: existing.serviceId,
            appointmentId: null,
            sourceType: PatientFollowUpSourceType.MANUAL,
            title: existing.title,
            sessionNumber: null,
            dueDate: nextDueDate,
            isRecurring: true,
            recurringIntervalValue: existing.recurringIntervalValue,
            recurringIntervalUnit: existing.recurringIntervalUnit,
            nextRecurringAt: nextDueDate,
            originFollowUpId: existing.id,
            status: statusForDueDate(nextDueDate),
          },
        });
      }
    });

    return this.getById(centerId, followUpId);
  }

  async pauseRecurringFollowUp(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    followUpId: string,
  ) {
    this.requirePermission(permissions, 'appointments:update');
    const prisma = await this.prisma.getClient();
    const result = await prisma.patientFollowUp.updateMany({
      where: {
        centerId,
        id: followUpId,
        isRecurring: true,
        status: { notIn: ['CANCELLED', 'COMPLETED', 'SKIPPED', 'PAUSED'] },
      },
      data: {
        status: 'PAUSED',
        planStatus: 'PAUSED',
        pausedAt: new Date(),
        pausedByUserId: actorUserId,
      },
    });

    if (result.count !== 1) {
      throw validationFailed({
        followUp: 'This recurring follow-up cannot be paused.',
      });
    }
    return this.getById(centerId, followUpId);
  }

  async scheduleNextRecurringAfterBooking(
    centerId: string,
    followUpId: string,
    appointmentId: string,
  ) {
    const prisma = await this.prisma.getClient();
    return prisma.$transaction(async (tx) => {
      const source = await tx.patientFollowUp.findFirst({
        where: { centerId, id: followUpId, isRecurring: true },
        select: {
          id: true,
          patientId: true,
          serviceId: true,
          title: true,
          recurringIntervalValue: true,
          recurringIntervalUnit: true,
        },
      });
      if (
        !source?.serviceId ||
        !source.recurringIntervalValue ||
        !source.recurringIntervalUnit
      ) return null;

      const appointment = await tx.appointment.findFirst({
        where: { centerId, id: appointmentId },
        select: { appointmentDate: true },
      });
      if (!appointment) return null;

      const existingNext = await tx.patientFollowUp.findFirst({
        where: {
          centerId,
          patientId: source.patientId,
          serviceId: source.serviceId,
          isRecurring: true,
          id: { not: source.id },
          status: { in: activeRecurringStatuses },
        },
        select: { id: true },
      });
      if (existingNext) return existingNext;

      const dueDate = addRecurringInterval(
        appointment.appointmentDate,
        source.recurringIntervalValue,
        source.recurringIntervalUnit,
      );
      const created = await tx.patientFollowUp.create({
        data: {
          centerId,
          patientId: source.patientId,
          serviceId: source.serviceId,
          appointmentId,
          sourceType: PatientFollowUpSourceType.MANUAL,
          title: source.title,
          sessionNumber: null,
          dueDate,
          isRecurring: true,
          recurringIntervalValue: source.recurringIntervalValue,
          recurringIntervalUnit: source.recurringIntervalUnit,
          nextRecurringAt: dueDate,
          originFollowUpId: source.id,
          status: statusForDueDate(dueDate),
        },
        select: { id: true },
      });
      await tx.patientFollowUp.update({
        where: { id: source.id },
        data: { nextRecurringAt: dueDate },
      });
      return created;
    });
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

  async updateDueDate(
    centerId: string,
    permissions: string[],
    followUpId: string,
    dueDate?: string,
  ) {
    this.requirePermission(permissions, 'appointments:update');

    const nextDueDate = parseDueDate(dueDate);
    const prisma = await this.prisma.getClient();
    const existing = await prisma.patientFollowUp.findFirst({
      where: { id: followUpId, centerId },
      select: { status: true },
    });

    if (!existing) {
      throw this.notFound();
    }

    const shouldRecalculateStatus =
      existing.status === 'DUE' || existing.status === 'UPCOMING';

    await prisma.patientFollowUp.update({
      where: { id: followUpId },
      data: {
        dueDate: nextDueDate,
        status: shouldRecalculateStatus
          ? statusForDueDate(nextDueDate)
          : existing.status,
      },
    });

    return this.getById(centerId, followUpId);
  }

  async closePlanEarly(
    centerId: string,
    permissions: string[],
    userId: string,
    followUpId: string,
    reason?: string | null,
  ) {
    this.requirePermission(permissions, 'appointments:update');

    const prisma = await this.prisma.getClient();
    const anchor = await prisma.patientFollowUp.findFirst({
      where: { id: followUpId, centerId },
      select: {
        appointmentId: true,
        id: true,
        isRecurring: true,
        patientId: true,
        serviceId: true,
      },
    });

    if (!anchor) {
      throw this.notFound();
    }

    if (anchor.isRecurring) {
      throw validationFailed({
        followUp: 'Recurring follow-ups cannot be closed as a treatment plan.',
      });
    }

    const planWhere: Prisma.PatientFollowUpWhereInput = {
      centerId,
      isRecurring: false,
      patientId: anchor.patientId,
      ...(anchor.appointmentId
        ? { appointmentId: anchor.appointmentId }
        : { serviceId: anchor.serviceId }),
    };

    const planRows = await prisma.patientFollowUp.findMany({
      where: planWhere,
      orderBy: [{ sessionNumber: 'asc' }, { dueDate: 'asc' }],
      select: {
        id: true,
        nextAppointmentId: true,
        sessionNumber: true,
        status: true,
      },
    });

    const futureStatuses: PatientFollowUpStatus[] = [
      'DUE',
      'UPCOMING',
      'CONTACTED',
      'MISSED',
    ];
    const futureRows = planRows.filter(
      (row) => futureStatuses.includes(row.status) && !row.nextAppointmentId,
    );

    if (futureRows.length === 0) {
      throw validationFailed({
        followUp: 'This treatment plan has no remaining future sessions to close.',
      });
    }

    const closedAfterSession =
      Math.max(
        0,
        ...planRows
          .filter(
            (row) =>
              row.status === 'COMPLETED' ||
              row.status === 'BOOKED' ||
              Boolean(row.nextAppointmentId),
          )
          .map((row) => row.sessionNumber ?? 0),
      ) || null;
    const closedAt = new Date();
    const normalizedReason =
      typeof reason === 'string' && reason.trim() ? reason.trim() : null;

    await prisma.$transaction([
      prisma.patientFollowUp.updateMany({
        where: planWhere,
        data: {
          closedEarlyAfterSession: closedAfterSession,
          closedEarlyAt: closedAt,
          closedEarlyByUserId: userId,
          closedEarlyReason: normalizedReason,
          planStatus: 'CLOSED_EARLY',
        },
      }),
      prisma.patientFollowUp.updateMany({
        where: { ...planWhere, id: { in: futureRows.map((row) => row.id) } },
        data: { status: 'CLOSED_EARLY' },
      }),
    ]);

    return this.getById(centerId, followUpId);
  }

  private async createNextRecurringAfterCompletion(
    centerId: string,
    completed: {
      id: string;
      patientId: string;
      serviceId: string | null;
      title: string;
      dueDate: Date;
      isRecurring: boolean;
      recurringIntervalValue: number | null;
      recurringIntervalUnit: RecurringIntervalUnit | null;
      status: PatientFollowUpStatus;
    },
  ) {
    if (
      !completed.isRecurring ||
      !completed.serviceId ||
      !completed.recurringIntervalValue ||
      !completed.recurringIntervalUnit ||
      completed.status === 'COMPLETED'
    ) {
      return null;
    }

    const prisma = await this.prisma.getClient();
    const activeExisting = await prisma.patientFollowUp.findFirst({
      where: {
        centerId,
        patientId: completed.patientId,
        serviceId: completed.serviceId,
        isRecurring: true,
        status: { in: activeRecurringStatuses },
        id: { not: completed.id },
      },
      select: { id: true, dueDate: true, status: true },
      orderBy: { dueDate: 'asc' },
    });

    if (activeExisting) {
      console.log('[follow-up:recurring-next-skip-active-existing]', {
        activeFollowUpId: activeExisting.id,
        centerId,
        completedFollowUpId: completed.id,
        patientId: completed.patientId,
        serviceId: completed.serviceId,
      });
      return activeExisting;
    }

    const dueDate = addRecurringInterval(
      completed.dueDate,
      completed.recurringIntervalValue,
      completed.recurringIntervalUnit,
    );

    const next = await prisma.patientFollowUp.create({
      data: {
        centerId,
        patientId: completed.patientId,
        serviceId: completed.serviceId,
        appointmentId: null,
        sourceType: PatientFollowUpSourceType.MANUAL,
        title: completed.title,
        sessionNumber: null,
        dueDate,
        isRecurring: true,
        recurringIntervalValue: completed.recurringIntervalValue,
        recurringIntervalUnit: completed.recurringIntervalUnit,
        nextRecurringAt: dueDate,
        originFollowUpId: completed.id,
        status: statusForDueDate(dueDate),
      },
      select: { id: true },
    });

    await prisma.patientFollowUp.update({
      where: { id: completed.id },
      data: { nextRecurringAt: dueDate },
    });

    console.log('[follow-up:recurring-next-created]', {
      centerId,
      completedFollowUpId: completed.id,
      dueDate,
      nextFollowUpId: next.id,
      patientId: completed.patientId,
      serviceId: completed.serviceId,
    });

    return next;
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
    query?: FollowUpListQuery,
  ): Prisma.PatientFollowUpWhereInput {
    const today = startOfToday();
    const tomorrow = addDays(today, 1);
    const nextSevenDaysEnd = addDays(today, 8);
    const filter = query?.filter;
    const base: Prisma.PatientFollowUpWhereInput = {
      centerId,
      ...(query?.kind === 'RECURRING_CONTINUOUS'
        ? {
            isRecurring: true,
            planStatus: 'ACTIVE' as const,
            status: {
              in: activeRecurringStatuses,
            },
          }
        : query?.kind === 'SESSION_BASED_PLAN'
          ? { isRecurring: false }
          : {}),
      ...(query?.patientId ? { patientId: query.patientId } : {}),
      // Branch scope via the source appointment. Follow-ups without a source
      // appointment (e.g. manual/recurring) only appear under "All Branches".
      ...(query?.branchId
        ? { appointment: { is: { branchId: query.branchId } } }
        : {}),
    };

    const includeAllForPatient =
      query?.includeAllForPatient === true ||
      query?.includeAllForPatient === 'true' ||
      query?.includeAllForPatient === '1';
    const includeAll =
      query?.includeAll === true ||
      query?.includeAll === 'true' ||
      query?.includeAll === '1';

    console.log('[follow-ups:buildListWhere]', {
      centerId,
      rawFilter: filter,
      rawIncludeAll: query?.includeAll,
      rawIncludeAllType: typeof query?.includeAll,
      parsedIncludeAll: includeAll,
      parsedIncludeAllForPatient: includeAllForPatient,
      rawPatientId: query?.patientId,
      baseKeys: Object.keys(base),
    });

    if (includeAll) {
      console.log('[follow-ups:buildListWhere:branch] → includeAll=true, returning base', { centerId, base: JSON.stringify(base) });
      return base;
    }

    if (includeAllForPatient && query?.patientId) {
      return base;
    }

    if (!filter && query?.patientId) {
      return base;
    }

    const dateStatus = dateFilterStatusWhere();
    const nextSevenDaysStatus = nextSevenDaysStatusWhere();
    console.debug('[follow-ups:filter:backend]', {
      filterType: filter ?? 'TODAY',
      todayStart: dateOnly(today),
      todayEnd: dateOnly(tomorrow),
      nextSevenDaysEnd: dateOnly(nextSevenDaysEnd),
      computedVisibility: 'database-where',
    });

    if (filter === 'TODAY') {
      return {
        ...base,
        ...(query?.kind === 'RECURRING_CONTINUOUS'
          ? { nextRecurringAt: recurringDateWindow('TODAY', today) }
          : { dueDate: { gte: today, lt: tomorrow } }),
        status: dateStatus,
      };
    }

    if (filter === 'THIS_WEEK') {
      return {
        ...base,
        ...(query?.kind === 'RECURRING_CONTINUOUS'
          ? { nextRecurringAt: recurringDateWindow('THIS_WEEK', today) }
          : { dueDate: { gte: today, lt: nextSevenDaysEnd } }),
        status: nextSevenDaysStatus,
      };
    }

    if (filter === 'OVERDUE') {
      return {
        ...base,
        ...(query?.kind === 'RECURRING_CONTINUOUS'
          ? { nextRecurringAt: recurringDateWindow('OVERDUE', today) }
          : { dueDate: { lt: today } }),
        status: dateStatus,
      };
    }

    if (filter === 'UPCOMING') {
      return {
        ...base,
        dueDate: { gte: tomorrow },
        status: dateStatus,
      };
    }

    if (filter === 'CONTACTED') {
      return { ...base, status: 'CONTACTED' as PatientFollowUpStatus };
    }

    // BOOKED filter: derive from linked appointment status, not stored status.
    // A session is effectively BOOKED when its linked appointment is SCHEDULED or CONFIRMED.
    if (filter === 'BOOKED') {
      return {
        ...base,
        status: { notIn: ['CANCELLED', 'CLOSED_EARLY'] as PatientFollowUpStatus[] },
        OR: [
          // Any session with an explicit next-appointment that is active
          { nextAppointment: { status: { in: ['SCHEDULED', 'CONFIRMED'] } } },
          // Session 1 of a finite plan: origin appointment is active
          {
            sessionNumber: 1,
            isRecurring: false,
            appointment: { status: { in: ['SCHEDULED', 'CONFIRMED'] } },
          },
          // No linked appointment but stored status is BOOKED (edge case / legacy data)
          {
            nextAppointmentId: null,
            status: 'BOOKED' as PatientFollowUpStatus,
            NOT: { sessionNumber: 1, isRecurring: false },
          },
        ],
      };
    }

    // COMPLETED filter: derive from linked appointment status, not stored status.
    // A session is effectively COMPLETED only when its linked appointment is COMPLETED.
    // This prevents stale stored-COMPLETED rows from showing here when appointment reverted.
    if (filter === 'COMPLETED') {
      return {
        ...base,
        status: { notIn: ['CANCELLED', 'CLOSED_EARLY'] as PatientFollowUpStatus[] },
        OR: [
          // Any session with an explicit next-appointment that completed
          { nextAppointment: { status: 'COMPLETED' } },
          // Session 1 of a finite plan: origin appointment completed
          {
            sessionNumber: 1,
            isRecurring: false,
            appointment: { status: 'COMPLETED' },
          },
          // Recurring sessions: no appointment-link model, stored status is truth.
          // Finite-plan sessions MUST have a completed appointment — never trust stored status alone.
          {
            isRecurring: true,
            status: 'COMPLETED' as PatientFollowUpStatus,
          },
        ],
      };
    }

    // CANCELLED filter: sessions whose effectiveStatus is CANCELLED — i.e. the
    // stored status is CANCELLED (set by the sync when the linked appointment is
    // cancelled) OR the linked appointment itself is CANCELLED. CLOSED_EARLY is
    // explicitly excluded so plan-closed sessions never leak in. The list() post
    // filter additionally enforces effectiveStatus === 'CANCELLED'.
    if (filter === 'CANCELLED') {
      return {
        ...base,
        status: { not: 'CLOSED_EARLY' as PatientFollowUpStatus },
        OR: [
          { status: 'CANCELLED' as PatientFollowUpStatus },
          { nextAppointment: { status: 'CANCELLED' } },
        ],
      };
    }

    // Default: TODAY (explicit fallback to keep future filters from silently returning everything)
    return {
      ...base,
      dueDate: { gte: today, lt: tomorrow },
      status: dateStatus,
    };
  }

  private resolveIntervalDays(
    defaultIntervalDays: number | null,
    rules: SessionRule[],
    sessionNumber: number,
  ) {
    // Phase rules define per-session intervals when present.
    if (rules.length > 0) {
      const rule = rules.find(
        (item) =>
          sessionNumber >= item.fromSessionNumber &&
          sessionNumber <= item.toSessionNumber,
      );
      if (rule) {
        return rule.intervalDays;
      }
    }

    // Otherwise the session plan uses one default interval for every session.
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
      branch: {
        select: {
          id: true,
          name: true,
          cityAr: true,
          cityEn: true,
          cityHe: true,
        },
      },
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
            branch: lastTreatment.branch,
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
    const _linked = computeLinkedAppt(item);
    const _effStatus = computeEffectiveStatus(item, _linked);
    const { appointment: sourceAppointment, ...followUp } = item;

    return {
      ...followUp,
      dueDate: dateOnly(item.dueDate),
      nextRecurringAt: item.nextRecurringAt
        ? dateOnly(item.nextRecurringAt)
        : null,
      linkedAppointmentId: computeEffectiveLinkedAppointmentId(item),
      linkedAppointmentStatus: _linked?.status ?? null,
      linkedAppointmentDate: _linked?.appointmentDate
        ? dateOnly(_linked.appointmentDate)
        : null,
      linkedAppointmentTime: _linked?.startTime ?? null,
      linkedAppointment: linkedAppointmentPayload(item),
      nextAppointment: item.nextAppointment
        ? {
            ...item.nextAppointment,
            appointmentDate: dateOnly(item.nextAppointment.appointmentDate),
            provider: item.nextAppointment.staffUser,
          }
        : null,
      effectiveStatus: _effStatus,
      effectiveVisualState: computeEffectiveVisualState(_effStatus),
      effectiveCanBook: computeEffectiveCanBook(_effStatus, item),
      overdueDays,
      sourceAppointment: sourceAppointment
        ? {
            ...sourceAppointment,
            appointmentDate: dateOnly(sourceAppointment.appointmentDate),
          }
        : null,
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
        branch: {
          id: string;
          name: string;
          cityAr: string | null;
          cityEn: string | null;
          cityHe: string | null;
        } | null;
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
      branch: {
        select: {
          id: true,
          name: true,
          cityAr: true,
          cityEn: true,
          cityHe: true,
        },
      },
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
              branch: lastTreatment.branch,
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
