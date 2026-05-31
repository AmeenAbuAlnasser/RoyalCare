import { Injectable } from '@nestjs/common';
import type { DayOfWeek } from '@royalcare/db';
import { PrismaService } from '../database/prisma.service';

export type AvailabilityReason =
  | 'AVAILABLE'
  | 'BOOKED'
  | 'CENTER_CLOSED'
  | 'OUTSIDE_WORKING_HOURS'
  | 'PAST_TIME'
  | 'PENDING_REQUEST'
  | 'PROVIDER_ON_LEAVE'
  | 'PROVIDER_UNAVAILABLE';

export type ScheduleSlot = {
  available: boolean;
  reason: AvailabilityReason;
  time: string;
};

type ComputeSlotsParams = {
  centerId: string;
  date: string;
  excludeAppointmentId?: string;
  excludeBookingRequestId?: string;
  providerId?: string;
  serviceId: string;
};

const DEFAULT_OPEN_MINUTES = 9 * 60;
const DEFAULT_CLOSE_MINUTES = 17 * 60 + 30;
const SLOT_STEP_MINUTES = 30;

const dayOfWeekByIndex: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateOnlyText(value: Date) {
  return value.toISOString().slice(0, 10);
}

function minutesToTime(minutes: number) {
  return `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
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

function localTodayText(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(now.getDate()).padStart(2, '0')}`;
}

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async computeSlots(params: ComputeSlotsParams) {
    const date = parseDateOnly(params.date);

    if (!date) {
      return {
        date: params.date,
        serviceId: params.serviceId,
        slots: [] as ScheduleSlot[],
      };
    }

    const prisma = await this.prisma.getClient();
    const service = await prisma.service.findFirst({
      where: {
        archivedAt: null,
        centerId: params.centerId,
        id: params.serviceId,
        isActive: true,
      },
      select: {
        bufferMinutes: true,
        durationMinutes: true,
        id: true,
      },
    });

    if (!service) {
      return { date: params.date, serviceId: params.serviceId, slots: [] };
    }

    const durationMinutes = service.durationMinutes ?? SLOT_STEP_MINUTES;
    const requestedBufferMinutes = service.bufferMinutes ?? 0;
    const appointmentEndOffset = durationMinutes + requestedBufferMinutes;
    const dayOfWeek = dayOfWeekByIndex[date.getUTCDay()];

    const [
      centerHours,
      closedDay,
      providerHours,
      providerLeave,
      appointments,
      bookingRequests,
    ] = await Promise.all([
      prisma.centerWorkingHours.findUnique({
        where: {
          centerId_dayOfWeek: {
            centerId: params.centerId,
            dayOfWeek,
          },
        },
        select: { closeTime: true, isOpen: true, openTime: true },
      }),
      prisma.centerClosedDay.findUnique({
        where: {
          centerId_date: {
            centerId: params.centerId,
            date,
          },
        },
        select: { id: true },
      }),
      params.providerId
        ? prisma.providerWorkingHours.findUnique({
            where: {
              centerId_staffUserId_dayOfWeek: {
                centerId: params.centerId,
                dayOfWeek,
                staffUserId: params.providerId,
              },
            },
            select: { endTime: true, isWorking: true, startTime: true },
          })
        : Promise.resolve(null),
      params.providerId
        ? prisma.providerLeaveDay.findUnique({
            where: {
              centerId_staffUserId_date: {
                centerId: params.centerId,
                date,
                staffUserId: params.providerId,
              },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      prisma.appointment.findMany({
        where: {
          appointmentDate: date,
          centerId: params.centerId,
          status: { not: 'CANCELLED' },
          ...(params.excludeAppointmentId
            ? { id: { not: params.excludeAppointmentId } }
            : {}),
          ...(params.providerId ? { staffUserId: params.providerId } : {}),
        },
        select: {
          appointmentDate: true,
          endTime: true,
          id: true,
          service: { select: { bufferMinutes: true } },
          startTime: true,
        },
      }),
      prisma.bookingRequest.findMany({
        where: {
          centerId: params.centerId,
          requestedDate: date,
          status: { in: ['PENDING', 'ACCEPTED'] },
          ...(params.excludeBookingRequestId
            ? { id: { not: params.excludeBookingRequestId } }
            : {}),
          ...(params.providerId
            ? { OR: [{ providerId: params.providerId }, { providerId: null }] }
            : {}),
        },
        select: { requestedTime: true, status: true },
      }),
    ]);

    const openMinutes = centerHours
      ? timeToMinutes(centerHours.openTime)
      : DEFAULT_OPEN_MINUTES;
    const closeMinutes = centerHours
      ? timeToMinutes(centerHours.closeTime)
      : DEFAULT_CLOSE_MINUTES;
    const isCenterOpen = centerHours ? centerHours.isOpen : true;

    const providerOpenMinutes = providerHours
      ? timeToMinutes(providerHours.startTime)
      : openMinutes;
    const providerCloseMinutes = providerHours
      ? timeToMinutes(providerHours.endTime)
      : closeMinutes;
    const isProviderWorking = providerHours ? providerHours.isWorking : true;

    const now = new Date();
    const isToday = params.date === localTodayText(now);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const pendingBookingRequestTimes = new Set(
      bookingRequests
        .filter((request) => request.status === 'PENDING')
        .map((request) => request.requestedTime),
    );
    const acceptedBookingRequestTimes = new Set(
      bookingRequests
        .filter((request) => request.status === 'ACCEPTED')
        .map((request) => request.requestedTime),
    );

    const sameDateAppointments = appointments.filter(
      (appointment) =>
        dateOnlyText(appointment.appointmentDate) === params.date,
    );

    const slots: ScheduleSlot[] = [];
    const slotWindowStart = Math.min(DEFAULT_OPEN_MINUTES, openMinutes);
    const slotWindowEnd = Math.max(DEFAULT_CLOSE_MINUTES, closeMinutes);

    for (
      let slotStart = slotWindowStart;
      slotStart <= slotWindowEnd;
      slotStart += SLOT_STEP_MINUTES
    ) {
      const slotEnd = slotStart + appointmentEndOffset;
      const time = minutesToTime(slotStart);
      let reason: AvailabilityReason = 'AVAILABLE';

      if (closedDay || !isCenterOpen) {
        reason = 'CENTER_CLOSED';
      } else if (!isProviderWorking) {
        reason = 'PROVIDER_UNAVAILABLE';
      } else if (providerLeave) {
        reason = 'PROVIDER_ON_LEAVE';
      } else if (slotStart < openMinutes || slotEnd > closeMinutes) {
        reason = 'OUTSIDE_WORKING_HOURS';
      } else if (
        providerHours &&
        (slotStart < providerOpenMinutes || slotEnd > providerCloseMinutes)
      ) {
        reason = 'PROVIDER_UNAVAILABLE';
      } else if (isToday && slotStart <= currentMinutes) {
        reason = 'PAST_TIME';
      } else if (pendingBookingRequestTimes.has(time)) {
        reason = 'PENDING_REQUEST';
      } else if (acceptedBookingRequestTimes.has(time)) {
        reason = 'BOOKED';
      } else if (
        sameDateAppointments.some((appointment) => {
          const appointmentStart = timeToMinutes(appointment.startTime);
          const appointmentEnd =
            timeToMinutes(appointment.endTime) +
            (appointment.service?.bufferMinutes ?? 0);

          return intervalsOverlap(
            slotStart,
            slotEnd,
            appointmentStart,
            appointmentEnd,
          );
        })
      ) {
        reason = 'BOOKED';
      }

      slots.push({
        available: reason === 'AVAILABLE',
        reason,
        time,
      });
    }

    return {
      date: params.date,
      serviceId: service.id,
      slots,
    };
  }

  async isSlotAvailable(params: ComputeSlotsParams & { startTime: string }) {
    const availability = await this.computeSlots(params);
    return (
      availability.slots.find((slot) => slot.time === params.startTime)
        ?.available ?? false
    );
  }
}
