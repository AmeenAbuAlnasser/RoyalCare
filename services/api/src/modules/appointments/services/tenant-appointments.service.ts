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
  type ServiceFollowUpType,
} from '@royalcare/db';
import { PrismaService } from '../../../common/database/prisma.service';
import { safeUserSelect } from '../../../common/database/safe-user-select';
import { hasTenantPermission } from '../../../common/permissions/tenant-permissions';
import { ScheduleService } from '../../../common/schedule/schedule.service';
import { AuditService } from '../../audit/audit.service';
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

const providerCapableRoles = ['CENTER_MANAGER', 'DOCTOR', 'STAFF'] as const;

const appointmentSelect = {
  id: true,
  centerId: true,
  patientId: true,
  serviceId: true,
  customServiceName: true,
  customServiceDuration: true,
  customServicePrice: true,
  customServiceCurrency: true,
  customServiceSaved: true,
  offerTitle: true,
  offerPrice: true,
  offerCurrency: true,
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
  service: {
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      nameHe: true,
      durationMinutes: true,
      isActive: true,
      followUpEnabled: true,
      followUpType: true,
      defaultIntervalDays: true,
      totalRecommendedSessions: true,
      autoCreateNextReminder: true,
      followUpRules: true,
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
      dueDate: true,
      status: true,
      sessionNumber: true,
    },
    orderBy: { dueDate: 'asc' as const },
    take: 1,
  },
} satisfies Prisma.AppointmentSelect;

type AppointmentWithBookingRequest = Prisma.AppointmentGetPayload<{
  select: typeof appointmentSelect;
}>;

function withBookingSource<T extends AppointmentWithBookingRequest>(
  appointment: T,
) {
  const { bookingRequest, followUpsCreated, ...rest } = appointment;
  const firstFollowUp = followUpsCreated[0];

  return {
    ...rest,
    bookingSource: bookingRequest
      ? {
          fullName: bookingRequest.fullName,
          phone: bookingRequest.phone,
          notes: bookingRequest.notes,
        }
      : null,
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
  ) {}

  async list(
    centerId: string,
    permissions: string[],
    query?: {
      date?: string;
      patient?: string;
      provider?: string;
      search?: string;
      status?: string;
    },
  ) {
    this.requirePermission(permissions, 'appointments:view');

    const t0 = Date.now();
    const prisma = await this.prisma.getClient();
    const where: Prisma.AppointmentWhereInput = {
      centerId,
      ...(query?.status && query.status !== 'ALL'
        ? { status: query.status as AppointmentStatus }
        : {}),
      ...(query?.provider ? { staffUserId: query.provider } : {}),
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

    const itemsWithInvoice = items.map((a) =>
      withBookingSource({
        ...a,
        invoice: invoiceSummaryMap.get(a.id) ?? null,
      }),
    );

    console.debug(
      `[appointments:list] centerId=${centerId} found=${total} in ${Date.now() - t0}ms`,
    );

    return { items: itemsWithInvoice, total };
  }

  async options(centerId: string, permissions: string[]) {
    this.requirePermission(permissions, 'appointments:view');

    const prisma = await this.prisma.getClient();
    const [patients, services, providers] = await Promise.all([
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
        },
      }),
      prisma.userRole.findMany({
        where: {
          centerId,
          status: 'ACTIVE',
          role: {
            key: {
              in: [...providerCapableRoles],
            },
            status: 'ACTIVE',
          },
          user: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        },
        orderBy: { user: { fullName: 'asc' } },
        select: {
          role: { select: { key: true, name: true } },
          user: { select: safeUserSelect },
        },
      }),
    ]);

    return {
      patients,
      services,
      providers: providers.map((assignment) => ({
        ...assignment.user,
        role: assignment.role,
      })),
    };
  }

  async getAvailability(
    centerId: string,
    permissions: string[],
    serviceId?: string,
    date?: string,
    providerId?: string,
    excludeAppointmentId?: string,
  ) {
    this.requirePermission(permissions, 'appointments:view');

    const errors: Record<string, string> = {};
    if (!serviceId?.trim()) errors.serviceId = 'serviceId is required.';

    const parsedDate = parseDateOnly(date);
    if (parsedDate === 'missing' || parsedDate === 'invalid') {
      errors.date = 'date must be a valid YYYY-MM-DD date.';
    }

    if (Object.keys(errors).length > 0) {
      throw validationFailed(errors);
    }

    const prisma = await this.prisma.getClient();
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

  async create(
    centerId: string,
    permissions: string[],
    currentUserId: string,
    dto: CreateTenantAppointmentDto,
  ) {
    this.requirePermission(permissions, 'appointments:create');

    const validated = this.validateCreate(dto);
    const prisma = await this.prisma.getClient();

    const appointmentData = await this.materializeCustomServiceIfRequested(
      centerId,
      validated,
      dto,
    );

    await this.validateRelations(centerId, appointmentData);
    await this.ensureSlotAvailable(centerId, appointmentData);
    await this.ensureNoOverlap(centerId, appointmentData);

    const appointment = await prisma.appointment.create({
      data: {
        centerId,
        createdByUserId: currentUserId,
        ...appointmentData,
      },
      select: appointmentSelect,
    });

    if (dto.saveCustomService || appointment.customServiceName) {
      console.log('[custom-service:appointment-created]', {
        appointmentId: appointment.id,
        appointmentServiceId: appointment.serviceId,
        createdServiceId: appointmentData.serviceId,
        customServiceName: appointment.customServiceName,
        defaultIntervalDays: dto.defaultIntervalDays ?? null,
        followUpEnabled: dto.followUpEnabled === true,
        followUpType: dto.followUpType ?? null,
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

    return withBookingSource(appointment);
  }

  async getById(
    centerId: string,
    permissions: string[],
    appointmentId: string,
  ) {
    this.requirePermission(permissions, 'appointments:view');

    const appointment = await this.findAppointmentById(centerId, appointmentId);
    return withBookingSource(appointment);
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

    const appointmentData = await this.materializeCustomServiceIfRequested(
      centerId,
      validated,
      dto,
    );

    if (!appointmentData.customServiceSaved && current.customServiceSaved) {
      appointmentData.customServiceSaved = true;
    }

    await this.validateRelations(centerId, appointmentData);
    await this.ensureSlotAvailable(centerId, appointmentData, appointmentId);
    await this.ensureNoOverlap(centerId, appointmentData, appointmentId);

    const result = await prisma.appointment.updateMany({
      where: { id: appointmentId, centerId },
      data: appointmentData,
    });

    if (result.count !== 1) {
      throw new NotFoundException({
        message: 'Appointment not found',
        errors: { appointment: 'Appointment not found.' },
      });
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
        followUpType: dto.followUpType ?? null,
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

    if (current.status !== 'COMPLETED' && appointment.status === 'COMPLETED') {
      await this.patientFollowUpsService.createFromCompletedAppointment(
        centerId,
        appointment.id,
      );
    } else if (
      current.status === 'COMPLETED' &&
      appointment.status !== 'COMPLETED'
    ) {
      await this.patientFollowUpsService.cancelFollowUpsForAppointment(
        centerId,
        appointment.id,
      );
    }

    return withBookingSource(appointment);
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

    if (current.status !== 'COMPLETED' && appointment.status === 'COMPLETED') {
      await this.patientFollowUpsService.createFromCompletedAppointment(
        centerId,
        appointment.id,
      );
    } else if (
      current.status === 'COMPLETED' &&
      appointment.status !== 'COMPLETED'
    ) {
      await this.patientFollowUpsService.cancelFollowUpsForAppointment(
        centerId,
        appointment.id,
      );
    }

    return withBookingSource(appointment);
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

    return withBookingSource(appointment);
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

  private async materializeCustomServiceIfRequested(
    centerId: string,
    data: ReturnType<TenantAppointmentsService['validateShared']>,
    dto: CreateTenantAppointmentDto | UpdateTenantAppointmentDto,
  ) {
    if (!data.customServiceName || !dto.saveCustomService) {
      return data;
    }

    const followUpEnabled = dto.followUpEnabled === true;
    const followUpType: ServiceFollowUpType =
      dto.followUpType === 'SESSION_PLAN' ? 'SESSION_PLAN' : 'FIXED_INTERVAL';
    const defaultIntervalDays = dto.defaultIntervalDays
      ? Number(dto.defaultIntervalDays)
      : null;
    const totalRecommendedSessions = dto.totalRecommendedSessions
      ? Number(dto.totalRecommendedSessions)
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
      defaultIntervalDays !== null &&
      (!Number.isFinite(defaultIntervalDays) || defaultIntervalDays <= 0)
    ) {
      followUpErrors.defaultIntervalDays = 'Enter a valid follow-up interval.';
    }

    if (
      totalRecommendedSessions !== null &&
      (!Number.isFinite(totalRecommendedSessions) ||
        totalRecommendedSessions <= 0)
    ) {
      followUpErrors.totalRecommendedSessions = 'Enter a valid session count.';
    }

    if (
      followUpEnabled &&
      followUpType === 'SESSION_PLAN' &&
      Array.isArray(rulesSource) &&
      rulesSource.length > 0
    ) {
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
      }
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
        followUpType,
        defaultIntervalDays,
        totalRecommendedSessions,
        autoCreateNextReminder,
        reminderMessageAr,
        reminderMessageEn,
        reminderMessageHe,
        followUpRules,
      },
      select: { id: true },
    });

    console.log('[custom-service:create]', {
      createdServiceId: service.id,
      followUpEnabled,
      followUpType,
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

  private async validateRelations(
    centerId: string,
    data: {
      patientId: string;
      serviceId: string | null;
      staffUserId: string;
    },
  ) {
    const prisma = await this.prisma.getClient();
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
          userId: data.staffUserId,
          status: 'ACTIVE',
          role: {
            key: {
              in: [...providerCapableRoles],
            },
          },
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
