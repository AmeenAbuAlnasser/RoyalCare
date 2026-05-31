import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DayOfWeek } from '@royalcare/db';
import { PrismaService } from '../../common/database/prisma.service';
import { hasTenantPermission } from '../../common/permissions/tenant-permissions';

type WeeklyHourInput = {
  dayOfWeek?: DayOfWeek;
  endTime?: string;
  isAvailable?: boolean;
  isClosed?: boolean;
  startTime?: string;
};

const daysOfWeek: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const providerRoleKeys = ['CENTER_MANAGER', 'DOCTOR', 'STAFF'] as const;

function forbidden(permission: string) {
  return new ForbiddenException({
    message: 'Permission denied',
    errors: { permission: `Missing permission: ${permission}` },
  });
}

function validationFailed(errors: Record<string, string>) {
  return new BadRequestException({ message: 'Validation failed', errors });
}

function optionalTrimmed(value?: string | null) {
  return typeof value === 'string' ? value.trim() : value;
}

function isDayOfWeek(value: unknown): value is DayOfWeek {
  return typeof value === 'string' && daysOfWeek.includes(value as DayOfWeek);
}

function normalizeTimeInput(value: unknown) {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  const plainMatch = raw.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (plainMatch) return raw;

  const amPmMatch = raw.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
  if (!amPmMatch) return null;

  let hours = Number(amPmMatch[1]);
  const minutes = amPmMatch[2];
  const period = amPmMatch[3].toUpperCase();

  if (hours < 1 || hours > 12) return null;
  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours !== 12) hours += 12;

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function parseDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function requireValidRange(startTime: unknown, endTime: unknown, prefix = '') {
  const errors: Record<string, string> = {};
  const normalizedStart = normalizeTimeInput(startTime);
  const normalizedEnd = normalizeTimeInput(endTime);

  if (!normalizedStart)
    errors[`${prefix}startTime`] = 'Enter a valid start time.';
  if (!normalizedEnd) errors[`${prefix}endTime`] = 'Enter a valid end time.';
  if (
    normalizedStart &&
    normalizedEnd &&
    timeToMinutes(normalizedEnd) <= timeToMinutes(normalizedStart)
  ) {
    errors[`${prefix}endTime`] = 'End time must be after start time.';
  }
  return {
    errors,
    endTime: normalizedEnd,
    startTime: normalizedStart,
  };
}

function mapCenterHour(
  hour?: {
    closeTime: string;
    dayOfWeek: DayOfWeek;
    id: string;
    isOpen: boolean;
    openTime: string;
  } | null,
  dayOfWeek?: DayOfWeek,
) {
  return {
    dayOfWeek: hour?.dayOfWeek ?? dayOfWeek,
    endTime: hour?.closeTime ?? '17:30',
    id: hour?.id ?? null,
    isClosed: hour ? !hour.isOpen : false,
    startTime: hour?.openTime ?? '09:00',
  };
}

function mapProviderHour(
  hour?: {
    dayOfWeek: DayOfWeek;
    endTime: string;
    id: string;
    isWorking: boolean;
    staffUserId?: string;
    startTime: string;
  } | null,
  dayOfWeek?: DayOfWeek,
) {
  return {
    dayOfWeek: hour?.dayOfWeek ?? dayOfWeek,
    endTime: hour?.endTime ?? '17:30',
    id: hour?.id ?? null,
    isAvailable: hour?.isWorking ?? true,
    providerId: hour?.staffUserId,
    startTime: hour?.startTime ?? '09:00',
  };
}

@Injectable()
export class TenantScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async getSchedule(centerId: string, permissions: string[]) {
    this.requirePermission(permissions);
    const prisma = await this.prisma.getClient();
    await this.ensureDefaultCenterHours(centerId);

    const [centerHours, closedDays, providers, providerHours, providerLeave] =
      await Promise.all([
        prisma.centerWorkingHours.findMany({
          where: { centerId },
          orderBy: { dayOfWeek: 'asc' },
          select: {
            closeTime: true,
            dayOfWeek: true,
            id: true,
            isOpen: true,
            openTime: true,
          },
        }),
        prisma.centerClosedDay.findMany({
          where: { centerId },
          orderBy: { date: 'asc' },
          select: { date: true, id: true, reason: true },
          take: 100,
        }),
        prisma.userRole.findMany({
          where: { centerId, role: { key: { in: [...providerRoleKeys] } } },
          orderBy: { user: { fullName: 'asc' } },
          select: {
            role: { select: { key: true, name: true } },
            user: { select: { fullName: true, id: true } },
          },
        }),
        prisma.providerWorkingHours.findMany({
          where: { centerId },
          select: {
            dayOfWeek: true,
            endTime: true,
            id: true,
            isWorking: true,
            staffUserId: true,
            startTime: true,
          },
        }),
        prisma.providerLeaveDay.findMany({
          where: { centerId },
          orderBy: { date: 'asc' },
          select: {
            date: true,
            id: true,
            reason: true,
            staffUser: { select: { fullName: true } },
            staffUserId: true,
          },
          take: 200,
        }),
      ]);

    return {
      centerHours: daysOfWeek.map((day) =>
        mapCenterHour(
          centerHours.find((hour) => hour.dayOfWeek === day),
          day,
        ),
      ),
      closedDays: closedDays.map((day) => ({
        ...day,
        date: day.date.toISOString().slice(0, 10),
      })),
      providerHours: providerHours.map((hour) => mapProviderHour(hour)),
      providerLeave: providerLeave.map((leave) => ({
        date: leave.date.toISOString().slice(0, 10),
        id: leave.id,
        providerId: leave.staffUserId,
        providerName: leave.staffUser.fullName,
        reason: leave.reason,
      })),
      providers: providers.map((provider) => ({
        id: provider.user.id,
        name: provider.user.fullName,
        roleKey: provider.role.key,
        roleName: provider.role.name,
      })),
    };
  }

  async getProviderSchedule(
    centerId: string,
    permissions: string[],
    providerId: string,
  ) {
    this.requirePermission(permissions);
    await this.ensureProvider(centerId, providerId);
    const prisma = await this.prisma.getClient();

    const [hours, leave] = await Promise.all([
      prisma.providerWorkingHours.findMany({
        where: { centerId, staffUserId: providerId },
        select: {
          dayOfWeek: true,
          endTime: true,
          id: true,
          isWorking: true,
          staffUserId: true,
          startTime: true,
        },
      }),
      prisma.providerLeaveDay.findMany({
        where: { centerId, staffUserId: providerId },
        orderBy: { date: 'asc' },
        select: { date: true, id: true, reason: true, staffUserId: true },
        take: 200,
      }),
    ]);

    return {
      hours: daysOfWeek.map((day) =>
        mapProviderHour(
          hours.find((h) => h.dayOfWeek === day),
          day,
        ),
      ),
      leave: leave.map((l) => ({
        date: l.date.toISOString().slice(0, 10),
        id: l.id,
        providerId: l.staffUserId,
        reason: l.reason,
      })),
      providerId,
    };
  }

  async updateCenterHours(
    centerId: string,
    permissions: string[],
    rows: WeeklyHourInput[],
  ) {
    this.requirePermission(permissions);
    if (!Array.isArray(rows))
      throw validationFailed({ hours: 'Hours are required.' });

    const prisma = await this.prisma.getClient();
    const validated = rows.map((row, index) =>
      this.validateWeeklyRow(row, index, 'isClosed'),
    );

    await prisma.$transaction(
      validated.map((row) =>
        prisma.centerWorkingHours.upsert({
          where: { centerId_dayOfWeek: { centerId, dayOfWeek: row.dayOfWeek } },
          create: {
            centerId,
            closeTime: row.endTime,
            dayOfWeek: row.dayOfWeek,
            isOpen: !row.isClosed,
            openTime: row.startTime,
          },
          update: {
            closeTime: row.endTime,
            isOpen: !row.isClosed,
            openTime: row.startTime,
          },
        }),
      ),
    );

    return this.getSchedule(centerId, permissions);
  }

  async addClosedDay(
    centerId: string,
    permissions: string[],
    dto: { date?: string; reason?: string | null },
  ) {
    this.requirePermission(permissions);
    const date = parseDate(dto.date);
    if (!date) throw validationFailed({ date: 'Enter a valid date.' });

    const prisma = await this.prisma.getClient();
    return prisma.centerClosedDay.upsert({
      where: { centerId_date: { centerId, date } },
      create: { centerId, date, reason: optionalTrimmed(dto.reason) || null },
      update: { reason: optionalTrimmed(dto.reason) || null },
      select: { date: true, id: true, reason: true },
    });
  }

  async deleteClosedDay(centerId: string, permissions: string[], id: string) {
    this.requirePermission(permissions);
    const prisma = await this.prisma.getClient();
    const result = await prisma.centerClosedDay.deleteMany({
      where: { centerId, id },
    });
    if (result.count !== 1)
      throw new NotFoundException('Closed day not found.');
    return { deleted: true };
  }

  async updateProviderHours(
    centerId: string,
    permissions: string[],
    providerId: string,
    rows: WeeklyHourInput[],
  ) {
    this.requirePermission(permissions);
    await this.ensureProvider(centerId, providerId);
    if (!Array.isArray(rows))
      throw validationFailed({ hours: 'Hours are required.' });

    const prisma = await this.prisma.getClient();
    const validated = rows.map((row, index) =>
      this.validateWeeklyRow(row, index, 'isAvailable'),
    );

    await prisma.$transaction(
      validated.map((row) =>
        prisma.providerWorkingHours.upsert({
          where: {
            centerId_staffUserId_dayOfWeek: {
              centerId,
              dayOfWeek: row.dayOfWeek,
              staffUserId: providerId,
            },
          },
          create: {
            centerId,
            dayOfWeek: row.dayOfWeek,
            endTime: row.endTime,
            isWorking: row.isAvailable,
            staffUserId: providerId,
            startTime: row.startTime,
          },
          update: {
            endTime: row.endTime,
            isWorking: row.isAvailable,
            startTime: row.startTime,
          },
        }),
      ),
    );

    return this.getSchedule(centerId, permissions);
  }

  async addProviderLeave(
    centerId: string,
    permissions: string[],
    providerId: string,
    dto: { date?: string; reason?: string | null },
  ) {
    this.requirePermission(permissions);
    await this.ensureProvider(centerId, providerId);
    const date = parseDate(dto.date);
    if (!date) throw validationFailed({ date: 'Enter a valid date.' });

    const prisma = await this.prisma.getClient();
    return prisma.providerLeaveDay.upsert({
      where: {
        centerId_staffUserId_date: { centerId, date, staffUserId: providerId },
      },
      create: {
        centerId,
        date,
        reason: optionalTrimmed(dto.reason) || null,
        staffUserId: providerId,
      },
      update: { reason: optionalTrimmed(dto.reason) || null },
      select: { date: true, id: true, reason: true, staffUserId: true },
    });
  }

  async deleteProviderLeave(
    centerId: string,
    permissions: string[],
    id: string,
  ) {
    this.requirePermission(permissions);
    const prisma = await this.prisma.getClient();
    const result = await prisma.providerLeaveDay.deleteMany({
      where: { centerId, id },
    });
    if (result.count !== 1) throw new NotFoundException('Leave day not found.');
    return { deleted: true };
  }

  private requirePermission(permissions: string[]) {
    if (!hasTenantPermission(permissions, 'settings:view')) {
      throw forbidden('settings:view');
    }
  }

  private async ensureDefaultCenterHours(centerId: string) {
    const prisma = await this.prisma.getClient();
    const count = await prisma.centerWorkingHours.count({
      where: { centerId },
    });
    if (count > 0) return;
    await prisma.centerWorkingHours.createMany({
      data: daysOfWeek.map((dayOfWeek) => ({
        centerId,
        closeTime: '17:30',
        dayOfWeek,
        isOpen: true,
        openTime: '09:00',
      })),
      skipDuplicates: true,
    });
  }

  private validateWeeklyRow(
    row: WeeklyHourInput,
    index: number,
    availabilityField: 'isAvailable' | 'isClosed',
  ) {
    const errors: Record<string, string> = {};
    if (!isDayOfWeek(row.dayOfWeek)) {
      errors[`hours.${index}.dayOfWeek`] = 'Select a valid day.';
    }

    const range = requireValidRange(
      row.startTime,
      row.endTime,
      `hours.${index}.`,
    );
    Object.assign(errors, range.errors);

    if (Object.keys(errors).length > 0) throw validationFailed(errors);

    const base = {
      dayOfWeek: row.dayOfWeek,
      endTime: range.endTime,
      startTime: range.startTime,
    } as {
      dayOfWeek: DayOfWeek;
      endTime: string;
      isAvailable?: boolean;
      isClosed?: boolean;
      startTime: string;
    };

    if (availabilityField === 'isClosed') {
      base.isClosed = Boolean(row.isClosed);
    } else {
      base.isAvailable = row.isAvailable !== false;
    }

    return base;
  }

  private async ensureProvider(centerId: string, providerId: string) {
    const prisma = await this.prisma.getClient();
    const provider = await prisma.userRole.findFirst({
      where: {
        centerId,
        role: { key: { in: [...providerRoleKeys] } },
        userId: providerId,
      },
      select: { userId: true },
    });
    if (!provider)
      throw validationFailed({ providerId: 'Provider not found.' });
  }
}
