import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AppointmentStatus,
  Prisma,
} from '../../../../../../packages/database/node_modules/@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import { safeUserSelect } from '../../../common/database/safe-user-select';
import type { CancelTenantAppointmentDto } from '../dto/cancel-tenant-appointment.dto';
import type { CreateTenantAppointmentDto } from '../dto/create-tenant-appointment.dto';
import type { UpdateTenantAppointmentStatusDto } from '../dto/update-tenant-appointment-status.dto';
import type { UpdateTenantAppointmentDto } from '../dto/update-tenant-appointment.dto';

type AppointmentPermission =
  | 'appointments.view'
  | 'appointments.create'
  | 'appointments.update'
  | 'appointments.cancel'
  | 'appointments.status.update';

const appointmentStatuses = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

const providerCapableRoles = ['CENTER_MANAGER', 'DOCTOR', 'STAFF'] as const;

const rolePermissions: Record<string, AppointmentPermission[]> = {
  CENTER_OWNER: [
    'appointments.view',
    'appointments.create',
    'appointments.update',
    'appointments.cancel',
    'appointments.status.update',
  ],
  CENTER_MANAGER: [
    'appointments.view',
    'appointments.create',
    'appointments.update',
    'appointments.cancel',
    'appointments.status.update',
  ],
  DOCTOR: [
    'appointments.view',
    'appointments.update',
    'appointments.status.update',
  ],
  RECEPTIONIST: [
    'appointments.view',
    'appointments.create',
    'appointments.update',
    'appointments.cancel',
    'appointments.status.update',
  ],
  ACCOUNTANT: ['appointments.view'],
  STAFF: ['appointments.view'],
};

const appointmentSelect = {
  id: true,
  centerId: true,
  patientId: true,
  serviceId: true,
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
    },
  },
  staffUser: {
    select: safeUserSelect,
  },
  createdByUser: {
    select: safeUserSelect,
  },
} satisfies Prisma.AppointmentSelect;

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
  constructor(private readonly prisma: PrismaService) {}

  async list(
    centerId: string,
    roleKey: string,
    query?: {
      date?: string;
      patient?: string;
      provider?: string;
      search?: string;
      status?: string;
    },
  ) {
    this.requirePermission(roleKey, 'appointments.view');

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

    return { items, total };
  }

  async options(centerId: string, roleKey: string) {
    this.requirePermission(roleKey, 'appointments.view');

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

  async create(
    centerId: string,
    roleKey: string,
    currentUserId: string,
    dto: CreateTenantAppointmentDto,
  ) {
    this.requirePermission(roleKey, 'appointments.create');

    const validated = this.validateCreate(dto);
    const prisma = await this.prisma.getClient();

    await this.validateRelations(centerId, validated);
    await this.ensureNoOverlap(centerId, validated);

    return prisma.appointment.create({
      data: {
        centerId,
        createdByUserId: currentUserId,
        ...validated,
      },
      select: appointmentSelect,
    });
  }

  async getById(centerId: string, roleKey: string, appointmentId: string) {
    this.requirePermission(roleKey, 'appointments.view');

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

  async update(
    centerId: string,
    roleKey: string,
    appointmentId: string,
    dto: UpdateTenantAppointmentDto,
  ) {
    this.requirePermission(roleKey, 'appointments.update');

    const current = await this.getById(centerId, roleKey, appointmentId);
    const validated = this.validateUpdate(dto, current);
    const prisma = await this.prisma.getClient();

    await this.validateRelations(centerId, validated);
    await this.ensureNoOverlap(centerId, validated, appointmentId);

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: validated,
      select: appointmentSelect,
    });
  }

  async updateStatus(
    centerId: string,
    roleKey: string,
    appointmentId: string,
    dto: UpdateTenantAppointmentStatusDto,
  ) {
    this.requirePermission(roleKey, 'appointments.status.update');

    const status = optionalTrimmed(dto.status);

    if (!isAllowedValue(status, appointmentStatuses)) {
      throw validationFailed({ status: 'Select a valid appointment status.' });
    }

    await this.getById(centerId, roleKey, appointmentId);
    const prisma = await this.prisma.getClient();

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status,
        isCancelled: status === 'CANCELLED',
        cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
      select: appointmentSelect,
    });
  }

  async cancel(
    centerId: string,
    roleKey: string,
    appointmentId: string,
    dto: CancelTenantAppointmentDto,
  ) {
    this.requirePermission(roleKey, 'appointments.cancel');

    const reason = optionalTrimmed(dto.reason);

    if (!reason) {
      throw validationFailed({
        cancellationReason: 'Cancellation reason is required.',
      });
    }

    await this.getById(centerId, roleKey, appointmentId);
    const prisma = await this.prisma.getClient();

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        cancellationReason: reason,
        cancelledAt: new Date(),
        isCancelled: true,
        status: 'CANCELLED',
      },
      select: appointmentSelect,
    });
  }

  private requirePermission(
    roleKey: string,
    permission: AppointmentPermission,
  ) {
    if (!rolePermissions[roleKey]?.includes(permission)) {
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
    return this.validateShared(
      {
        appointmentDate: dateOnlyText(current.appointmentDate),
        durationMinutes: current.durationMinutes,
        endTime: dto.endTime,
        internalNotes: current.internalNotes,
        notes: current.notes,
        patientId: current.patientId,
        serviceId: current.serviceId,
        staffUserId: current.staffUserId,
        startTime: current.startTime,
        ...dto,
      },
      true,
    );
  }

  private validateShared(
    dto: CreateTenantAppointmentDto | UpdateTenantAppointmentDto,
    requireAll: boolean,
  ) {
    const errors: Record<string, string> = {};
    const patientId = optionalTrimmed(dto.patientId);
    const serviceId = optionalTrimmed(dto.serviceId);
    const staffUserId = optionalTrimmed(dto.staffUserId);
    const appointmentDate = parseDateOnly(dto.appointmentDate);
    const startTime = parseTime(dto.startTime);
    const duration = parseDuration(dto.durationMinutes);
    const rawEndTime = parseTime(dto.endTime);

    if (requireAll && !patientId) {
      errors.patientId = 'Select a patient.';
    }

    if (requireAll && !serviceId) {
      errors.serviceId = 'Select a service.';
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
      serviceId: serviceId as string,
      staffUserId: staffUserId as string,
      startTime: (startTime as { text: string }).text,
      ...(status ? { status: status as AppointmentStatus } : {}),
    };
  }

  private async validateRelations(
    centerId: string,
    data: {
      patientId: string;
      serviceId: string;
      staffUserId: string;
    },
  ) {
    const prisma = await this.prisma.getClient();
    const [patient, service, provider] = await Promise.all([
      prisma.patient.findFirst({
        where: { centerId, id: data.patientId },
        select: { id: true, status: true },
      }),
      prisma.service.findFirst({
        where: { centerId, id: data.serviceId },
        select: { id: true, isActive: true },
      }),
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

    if (!service || !service.isActive) {
      errors.serviceId = 'Select an active service from this center.';
    }

    if (!provider) {
      errors.staffUserId = 'Select a valid provider from this center.';
    }

    if (Object.keys(errors).length > 0) {
      throw validationFailed(errors);
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
          appointmentDate: dateOnlyText(appointment.appointmentDate),
          endTime: appointment.endTime,
          patientName: appointment.patient?.fullName ?? '',
          providerName: appointment.staffUser?.fullName ?? '',
          serviceNameAr: appointment.service?.nameAr ?? '',
          serviceNameEn: appointment.service?.nameEn ?? '',
          serviceNameHe: appointment.service?.nameHe ?? '',
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
      throw new BadRequestException({
        message: 'Appointment conflict detected',
        errors,
        conflictDetails: conflictDetails ?? {
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
