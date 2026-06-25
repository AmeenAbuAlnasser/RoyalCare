import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  PatientGender,
  PatientStatus,
  Prisma,
} from '@royalcare/db';
import { PrismaService } from '../../../common/database/prisma.service';
import { hasTenantPermission } from '../../../common/permissions/tenant-permissions';
import { AuditService } from '../../audit/audit.service';
import type { CreatePatientDto } from '../dto/create-patient.dto';
import type { UpdatePatientStatusDto } from '../dto/update-patient-status.dto';
import type { UpdatePatientDto } from '../dto/update-patient.dto';

const PATIENT_GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] as const;
const PATIENT_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

type PatientPermission =
  | 'patients:view'
  | 'patients:create'
  | 'patients:update'
  | 'patients:status'
  | 'patients:delete';

const patientSelect = {
  id: true,
  centerId: true,
  fullName: true,
  fullNameAr: true,
  fullNameHe: true,
  fullNameEn: true,
  phone: true,
  email: true,
  gender: true,
  dateOfBirth: true,
  nationalId: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PatientSelect;

const linkedRecordCountSelect = {
  appointments: true,
  invoices: true,
  payments: true,
  followUps: true,
  creditTransactions: true,
} as const;

type LinkedRecordCounts = {
  appointments: number;
  invoices: number;
  payments: number;
  followUps: number;
  creditTransactions: number;
};

type PatientSummaryAppointment = {
  appointmentId: string;
  appointmentDate: string;
  startTime: string;
  status: string;
  serviceName: string | null;
};

type PatientSummary = {
  latestSession: PatientSummaryAppointment | null;
  upcomingSession: PatientSummaryAppointment | null;
  treatmentPlansCount: number;
  overdueSessionsCount: number;
  outstandingBalance: string;
  outstandingCurrency: string;
  upcomingAppointmentsCount: number;
  linkedRecordsCount: number;
};

type PatientSummaryAccumulator = Omit<
  PatientSummary,
  'outstandingBalance' | 'treatmentPlansCount'
> & {
  outstandingAmount: number;
  planKeys: Set<string>;
};

function computeCanDelete(count: {
  appointments: number;
  invoices: number;
  payments: number;
  followUps: number;
  creditTransactions: number;
}) {
  return (
    count.appointments === 0 &&
    count.invoices === 0 &&
    count.payments === 0 &&
    count.followUps === 0 &&
    count.creditTransactions === 0
  );
}

function computeLinkedRecordsCount(count: LinkedRecordCounts) {
  return (
    count.appointments +
    count.invoices +
    count.payments +
    count.followUps +
    count.creditTransactions
  );
}

function makeSummaryAccumulator(
  counts?: LinkedRecordCounts,
): PatientSummaryAccumulator {
  return {
    latestSession: null,
    linkedRecordsCount: counts ? computeLinkedRecordsCount(counts) : 0,
    overdueSessionsCount: 0,
    outstandingAmount: 0,
    outstandingCurrency: 'ILS',
    planKeys: new Set<string>(),
    upcomingAppointmentsCount: 0,
    upcomingSession: null,
  };
}

function serializeAppointmentSummary(appointment: {
  appointmentDate: Date;
  id: string;
  startTime: string;
  status: string;
  customServiceName: string | null;
  service: { nameAr: string; nameEn: string; nameHe: string } | null;
}): PatientSummaryAppointment {
  const serviceName =
    appointment.service?.nameAr?.trim() ||
    appointment.service?.nameEn?.trim() ||
    appointment.service?.nameHe?.trim() ||
    appointment.customServiceName?.trim() ||
    null;
  return {
    appointmentDate: appointment.appointmentDate.toISOString(),
    appointmentId: appointment.id,
    startTime: appointment.startTime,
    status: appointment.status,
    serviceName,
  };
}

function toDecimalString(value: number) {
  return Math.max(0, value).toFixed(2);
}

function getFollowUpPlanKey(followUp: {
  appointmentId: string | null;
  id: string;
  originFollowUpId: string | null;
  planTotalSessions: number | null;
  serviceId: string | null;
  treatmentTemplateId: string | null;
}) {
  if (followUp.originFollowUpId) {
    return `origin:${followUp.originFollowUpId}`;
  }

  if (followUp.appointmentId) {
    return `appointment:${followUp.appointmentId}`;
  }

  if (followUp.treatmentTemplateId && followUp.serviceId) {
    return `template:${followUp.serviceId}:${followUp.treatmentTemplateId}`;
  }

  if (followUp.serviceId) {
    return `service:${followUp.serviceId}:${followUp.planTotalSessions ?? 'open'}`;
  }

  return `follow-up:${followUp.id}`;
}

function finalizePatientSummary(
  accumulator: PatientSummaryAccumulator,
): PatientSummary {
  return {
    latestSession: accumulator.latestSession,
    linkedRecordsCount: accumulator.linkedRecordsCount,
    overdueSessionsCount: accumulator.overdueSessionsCount,
    outstandingBalance: toDecimalString(accumulator.outstandingAmount),
    outstandingCurrency: accumulator.outstandingCurrency,
    treatmentPlansCount: accumulator.planKeys.size,
    upcomingAppointmentsCount: accumulator.upcomingAppointmentsCount,
    upcomingSession: accumulator.upcomingSession,
  };
}

function optionalTrimmed(value?: string | null) {
  return typeof value === 'string' ? value.trim() : value;
}

function optionalLowerTrimmed(value?: string | null) {
  const trimmed = optionalTrimmed(value);

  return typeof trimmed === 'string' ? trimmed.toLowerCase() : trimmed;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  return /^\+?[0-9][0-9\s().-]{6,24}$/.test(value);
}

function isAllowedValue<T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
): value is T[number] {
  return typeof value === 'string' && allowedValues.includes(value);
}

function parseDateOfBirth(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value.trim() === '') {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'invalid';
  }

  return parsed;
}

function validationFailed(errors: Record<string, string>) {
  return new BadRequestException({
    message: 'Validation failed',
    errors,
  });
}

function duplicatePhone() {
  return new ConflictException({
    message: 'Validation failed',
    errors: {
      phone: 'A patient with this phone already exists in this center.',
    },
  });
}

function forbidden(permission: PatientPermission) {
  return new ForbiddenException({
    message: 'Permission denied',
    errors: { permission: `Missing permission: ${permission}` },
  });
}

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(
    centerId: string,
    permissions: string[],
    query?: { search?: string },
  ) {
    this.requirePermission(permissions, 'patients:view');

    const prisma = await this.prisma.getClient();
    const search = optionalTrimmed(query?.search);
    const where: Prisma.PatientWhereInput = {
      centerId,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };
    const [rawItems, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          ...patientSelect,
          _count: { select: linkedRecordCountSelect },
        },
        take: 100,
      }),
      prisma.patient.count({ where }),
    ]);

    const countsByPatientId = new Map(
      rawItems.map(({ _count, id }) => [id, _count]),
    );
    const summaries = await this.buildPatientSummaryMap(
      centerId,
      rawItems.map((patient) => patient.id),
      countsByPatientId,
    );

    const items = rawItems.map(({ _count, ...p }) => ({
      ...p,
      canDelete: computeCanDelete(_count),
      linkedRecordCounts: {
        appointments: _count.appointments,
        invoices: _count.invoices,
        payments: _count.payments,
        followUps: _count.followUps,
        creditTransactions: _count.creditTransactions,
      },
      summary: summaries.get(p.id) ?? finalizePatientSummary(makeSummaryAccumulator(_count)),
    }));

    return { items, total };
  }

  async create(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    dto: CreatePatientDto,
  ) {
    this.requirePermission(permissions, 'patients:create');

    const validated = this.validateCreate(dto);
    const prisma = await this.prisma.getClient();

    try {
      const patient = await prisma.patient.create({
        data: {
          centerId,
          fullName: validated.fullName,
          fullNameAr: validated.fullNameAr,
          fullNameHe: validated.fullNameHe,
          fullNameEn: validated.fullNameEn,
          phone: validated.phone,
          email: validated.email,
          gender: validated.gender,
          dateOfBirth: validated.dateOfBirth,
          nationalId: validated.nationalId,
          notes: validated.notes,
          status: validated.status,
        },
        select: patientSelect,
      });

      await this.auditService.log({
        action: 'TENANT_PATIENT_CREATED',
        actorUserId,
        centerId,
        metadata: {
          centerId,
          patientId: patient.id,
          patientName: patient.fullName,
          patientNameAr: patient.fullNameAr ?? undefined,
          patientNameEn: patient.fullNameEn ?? undefined,
          patientNameHe: patient.fullNameHe ?? undefined,
          status: patient.status,
          source: 'TENANT_PATIENTS',
        },
      });

      return patient;
    } catch (error) {
      if (this.isDuplicatePhoneError(error)) {
        throw duplicatePhone();
      }

      throw error;
    }
  }

  async getById(centerId: string, permissions: string[], patientId: string) {
    this.requirePermission(permissions, 'patients:view');

    const prisma = await this.prisma.getClient();
    const raw = await prisma.patient.findFirst({
      where: { centerId, id: patientId },
      select: {
        ...patientSelect,
        _count: { select: linkedRecordCountSelect },
      },
    });

    if (!raw) {
      throw new NotFoundException({
        message: 'Patient not found',
        errors: { patient: 'Patient not found.' },
      });
    }

    const { _count, ...patient } = raw;
    const summaries = await this.buildPatientSummaryMap(
      centerId,
      [patient.id],
      new Map([[patient.id, _count]]),
    );

    return {
      ...patient,
      canDelete: computeCanDelete(_count),
      linkedRecordCounts: {
        appointments: _count.appointments,
        invoices: _count.invoices,
        payments: _count.payments,
        followUps: _count.followUps,
        creditTransactions: _count.creditTransactions,
      },
      summary:
        summaries.get(patient.id) ??
        finalizePatientSummary(makeSummaryAccumulator(_count)),
    };
  }

  async update(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    patientId: string,
    dto: UpdatePatientDto,
  ) {
    this.requirePermission(permissions, 'patients:update');
    const current = await this.getById(centerId, permissions, patientId);

    const validated = this.validateUpdate(dto);
    const prisma = await this.prisma.getClient();

    try {
      const result = await prisma.patient.updateMany({
        where: { id: patientId, centerId },
        data: validated,
      });

      if (result.count !== 1) {
        throw new NotFoundException({
          message: 'Patient not found',
          errors: { patient: 'Patient not found.' },
        });
      }

      const patient = await this.getById(centerId, permissions, patientId);

      await this.auditService.log({
        action: 'TENANT_PATIENT_UPDATED',
        actorUserId,
        centerId,
        metadata: {
          centerId,
          oldStatus: current.status,
          patientId: patient.id,
          patientName: patient.fullName,
          patientNameAr: patient.fullNameAr ?? undefined,
          patientNameEn: patient.fullNameEn ?? undefined,
          patientNameHe: patient.fullNameHe ?? undefined,
          source: 'TENANT_PATIENTS',
          status: patient.status,
        },
      });

      return patient;
    } catch (error) {
      if (this.isDuplicatePhoneError(error)) {
        throw duplicatePhone();
      }

      throw error;
    }
  }

  async updateStatus(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    patientId: string,
    dto: UpdatePatientStatusDto,
  ) {
    this.requirePermission(permissions, 'patients:status');

    const status = optionalTrimmed(dto.status);

    if (!isAllowedValue(status, PATIENT_STATUSES)) {
      throw validationFailed({
        status: 'Select a valid patient status.',
      });
    }

    const prisma = await this.prisma.getClient();
    const current = await prisma.patient.findFirst({
      where: { centerId, id: patientId },
      select: patientSelect,
    });

    if (!current) {
      throw new NotFoundException({
        message: 'Patient not found',
        errors: { patient: 'Patient not found.' },
      });
    }

    const result = await prisma.patient.updateMany({
      where: { id: patientId, centerId },
      data: { status },
    });

    if (result.count !== 1) {
      throw new NotFoundException({
        message: 'Patient not found',
        errors: { patient: 'Patient not found.' },
      });
    }

    const patient = await this.getById(centerId, permissions, patientId);
    const action =
      current.status === 'ARCHIVED' && status !== 'ARCHIVED'
        ? 'TENANT_PATIENT_RESTORED'
        : 'TENANT_PATIENT_STATUS_CHANGED';

    await this.auditService.log({
      action,
      actorUserId,
      centerId,
      metadata: {
        centerId,
        newStatus: patient.status,
        oldStatus: current.status,
        patientId: patient.id,
        patientName: patient.fullName,
        patientNameAr: patient.fullNameAr ?? undefined,
        patientNameEn: patient.fullNameEn ?? undefined,
        patientNameHe: patient.fullNameHe ?? undefined,
        source: 'TENANT_PATIENTS',
      },
    });

    return patient;
  }

  async delete(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    patientId: string,
  ) {
    this.requirePermission(permissions, 'patients:delete');

    const prisma = await this.prisma.getClient();

    const raw = await prisma.patient.findFirst({
      where: { centerId, id: patientId },
      select: {
        id: true,
        fullName: true,
        _count: { select: linkedRecordCountSelect },
      },
    });

    if (!raw) {
      throw new NotFoundException({
        message: 'Patient not found',
        errors: { patient: 'Patient not found.' },
      });
    }

    const { _count, ...patientData } = raw;

    if (!computeCanDelete(_count)) {
      throw new BadRequestException({
        message: 'Cannot delete patient',
        errors: {
          patient:
            'This patient has linked records and cannot be deleted permanently.',
        },
      });
    }

    await prisma.patient.delete({ where: { id: patientId } });

    await this.auditService.log({
      action: 'TENANT_PATIENT_DELETED',
      actorUserId,
      centerId,
      metadata: {
        centerId,
        patientId,
        patientName: patientData.fullName,
        source: 'TENANT_PATIENTS',
      },
    });

    return { deleted: true };
  }

  private requirePermission(
    permissions: string[],
    permission: PatientPermission,
  ) {
    if (!hasTenantPermission(permissions, permission)) {
      throw forbidden(permission);
    }
  }

  private async buildPatientSummaryMap(
    centerId: string,
    patientIds: string[],
    countsByPatientId: Map<string, LinkedRecordCounts>,
  ) {
    const summaries = new Map<string, PatientSummaryAccumulator>();

    for (const patientId of patientIds) {
      summaries.set(
        patientId,
        makeSummaryAccumulator(countsByPatientId.get(patientId)),
      );
    }

    if (patientIds.length === 0) {
      return new Map<string, PatientSummary>();
    }

    const prisma = await this.prisma.getClient();
    const now = new Date();

    const [appointments, followUps, invoices] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          centerId,
          patientId: { in: patientIds },
          // History (latestSession) includes CANCELLED; upcoming uses SCHEDULED/CONFIRMED.
          status: {
            in: ['COMPLETED', 'CONFIRMED', 'SCHEDULED', 'IN_PROGRESS', 'CANCELLED'],
          },
        },
        orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
        select: {
          appointmentDate: true,
          id: true,
          patientId: true,
          startTime: true,
          status: true,
          customServiceName: true,
          service: { select: { nameAr: true, nameEn: true, nameHe: true } },
        },
      }),
      prisma.patientFollowUp.findMany({
        where: {
          centerId,
          patientId: { in: patientIds },
          // Active treatment plans only — exclude cancelled and closed-early plans.
          planStatus: { notIn: ['CANCELLED', 'CLOSED_EARLY'] },
          status: { notIn: ['CANCELLED', 'CLOSED_EARLY'] },
        },
        select: {
          appointmentId: true,
          id: true,
          dueDate: true,
          originFollowUpId: true,
          patientId: true,
          planTotalSessions: true,
          serviceId: true,
          status: true,
          treatmentTemplateId: true,
        },
      }),
      prisma.invoice.findMany({
        where: {
          centerId,
          patientId: { in: patientIds },
          status: { not: 'CANCELLED' },
        },
        select: {
          amount: true,
          creditTransactions: {
            where: { type: 'CREDIT_USE' },
            select: { amount: true },
          },
          currency: true,
          patientId: true,
          payments: { select: { amount: true } },
        },
      }),
    ]);

    // Compare by LOCAL calendar date (not time-of-day) so an appointment today
    // counts as upcoming and a past-dated booking counts as history.
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    for (const appointment of appointments) {
      const summary = summaries.get(appointment.patientId);

      if (!summary) {
        continue;
      }

      const appointmentDay = new Date(appointment.appointmentDate);
      appointmentDay.setHours(0, 0, 0, 0);
      const isPast = appointmentDay.getTime() < todayStart.getTime();
      const isActiveBooking =
        appointment.status === 'SCHEDULED' ||
        appointment.status === 'CONFIRMED';

      // History (آخر جلسة): completed/cancelled records, plus active bookings whose
      // date has already passed. Appointments are ordered ascending, so the last
      // history match wins — i.e. the most recent one.
      const isHistory =
        appointment.status === 'COMPLETED' ||
        appointment.status === 'CANCELLED' ||
        ((isActiveBooking || appointment.status === 'IN_PROGRESS') && isPast);

      // Upcoming (الجلسة القادمة / المواعيد القادمة): active bookings due today or later.
      const isUpcoming = isActiveBooking && !isPast;

      if (isHistory) {
        summary.latestSession = serializeAppointmentSummary(appointment);
      }

      if (isUpcoming) {
        summary.upcomingAppointmentsCount += 1;

        if (!summary.upcomingSession) {
          summary.upcomingSession = serializeAppointmentSummary(appointment);
        }
      }
    }

    for (const followUp of followUps) {
      const summary = summaries.get(followUp.patientId);

      if (!summary) {
        continue;
      }

      summary.planKeys.add(getFollowUpPlanKey(followUp));

      const dueDate = new Date(followUp.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const isOverdueStatus =
        followUp.status === 'DUE' ||
        followUp.status === 'UPCOMING' ||
        followUp.status === 'CONTACTED' ||
        followUp.status === 'MISSED';

      if (isOverdueStatus && dueDate.getTime() < today.getTime()) {
        summary.overdueSessionsCount += 1;
      }
    }

    for (const invoice of invoices) {
      const summary = summaries.get(invoice.patientId);

      if (!summary) {
        continue;
      }

      const paidFromPayments = invoice.payments.reduce(
        (total, payment) => total + Number(payment.amount),
        0,
      );
      const paidFromCredits = invoice.creditTransactions.reduce(
        (total, transaction) => total + Number(transaction.amount),
        0,
      );
      const remaining = Math.max(
        0,
        Number(invoice.amount) - paidFromPayments - paidFromCredits,
      );

      summary.outstandingAmount += remaining;
      summary.outstandingCurrency = invoice.currency || summary.outstandingCurrency;
    }

    return new Map(
      Array.from(summaries.entries()).map(([patientId, summary]) => [
        patientId,
        finalizePatientSummary(summary),
      ]),
    );
  }

  private validateCreate(dto: CreatePatientDto) {
    const errors: Record<string, string> = {};
    const fullName = optionalTrimmed(dto.fullName);
    const phone = optionalTrimmed(dto.phone);
    const email = optionalLowerTrimmed(dto.email);
    const gender = optionalTrimmed(dto.gender) ?? 'UNKNOWN';
    const status = optionalTrimmed(dto.status) ?? 'ACTIVE';
    const dateOfBirth = parseDateOfBirth(dto.dateOfBirth);

    if (!fullName) {
      errors.fullName = 'Patient name is required.';
    }

    if (!phone || !isValidPhone(phone)) {
      errors.phone = 'Enter a valid phone number.';
    }

    if (email && !isValidEmail(email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!isAllowedValue(gender, PATIENT_GENDERS)) {
      errors.gender = 'Select a valid gender.';
    }

    if (!isAllowedValue(status, PATIENT_STATUSES)) {
      errors.status = 'Select a valid patient status.';
    }

    if (dateOfBirth === 'invalid') {
      errors.dateOfBirth = 'Enter a valid date of birth.';
    }

    if (Object.keys(errors).length > 0) {
      throw validationFailed(errors);
    }

    return {
      fullName: fullName as string,
      fullNameAr: optionalTrimmed(dto.fullNameAr) || null,
      fullNameHe: optionalTrimmed(dto.fullNameHe) || null,
      fullNameEn: optionalTrimmed(dto.fullNameEn) || null,
      phone: phone as string,
      email: email || null,
      gender: gender as PatientGender,
      dateOfBirth: dateOfBirth instanceof Date ? dateOfBirth : null,
      nationalId: optionalTrimmed(dto.nationalId) || null,
      notes: optionalTrimmed(dto.notes) || null,
      status: status as PatientStatus,
    };
  }

  private validateUpdate(dto: UpdatePatientDto) {
    const errors: Record<string, string> = {};
    const data: Prisma.PatientUpdateInput = {};

    if (dto.fullName !== undefined) {
      const fullName = optionalTrimmed(dto.fullName);

      if (!fullName) {
        errors.fullName = 'Patient name is required.';
      } else {
        data.fullName = fullName;
      }
    }

    if (dto.phone !== undefined) {
      const phone = optionalTrimmed(dto.phone);

      if (!phone || !isValidPhone(phone)) {
        errors.phone = 'Enter a valid phone number.';
      } else {
        data.phone = phone;
      }
    }

    if (dto.email !== undefined) {
      const email = optionalLowerTrimmed(dto.email);

      if (email && !isValidEmail(email)) {
        errors.email = 'Enter a valid email address.';
      } else {
        data.email = email || null;
      }
    }

    if (dto.gender !== undefined) {
      const gender = optionalTrimmed(dto.gender);

      if (!isAllowedValue(gender, PATIENT_GENDERS)) {
        errors.gender = 'Select a valid gender.';
      } else {
        data.gender = gender;
      }
    }

    if (dto.status !== undefined) {
      const status = optionalTrimmed(dto.status);

      if (!isAllowedValue(status, PATIENT_STATUSES)) {
        errors.status = 'Select a valid patient status.';
      } else {
        data.status = status;
      }
    }

    if (dto.dateOfBirth !== undefined) {
      const dateOfBirth = parseDateOfBirth(dto.dateOfBirth);

      if (dateOfBirth === 'invalid') {
        errors.dateOfBirth = 'Enter a valid date of birth.';
      } else {
        data.dateOfBirth = dateOfBirth;
      }
    }

    if (dto.fullNameAr !== undefined) {
      data.fullNameAr = optionalTrimmed(dto.fullNameAr) || null;
    }

    if (dto.fullNameHe !== undefined) {
      data.fullNameHe = optionalTrimmed(dto.fullNameHe) || null;
    }

    if (dto.fullNameEn !== undefined) {
      data.fullNameEn = optionalTrimmed(dto.fullNameEn) || null;
    }

    if (dto.nationalId !== undefined) {
      data.nationalId = optionalTrimmed(dto.nationalId) || null;
    }

    if (dto.notes !== undefined) {
      data.notes = optionalTrimmed(dto.notes) || null;
    }

    if (Object.keys(errors).length > 0) {
      throw validationFailed(errors);
    }

    return data;
  }

  private isDuplicatePhoneError(error: unknown) {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('code' in error) ||
      (error as { code?: unknown }).code !== 'P2002'
    ) {
      return false;
    }

    const raw = (error as { meta?: { target?: unknown } }).meta?.target;
    const fields: string[] = Array.isArray(raw)
      ? raw.filter((f): f is string => typeof f === 'string')
      : typeof raw === 'string'
        ? [raw]
        : [];

    // Patient uniqueness is @@unique([centerId, phone]) — target contains 'phone'
    return fields.includes('phone') || fields.length === 0;
  }
}
