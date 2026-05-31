import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@royalcare/db';
import { PrismaService } from '../../common/database/prisma.service';
import { hasTenantPermission } from '../../common/permissions/tenant-permissions';
import { ScheduleService } from '../../common/schedule/schedule.service';
import { AuditService } from '../audit/audit.service';

const bookingRequestSelect = {
  id: true,
  centerId: true,
  serviceId: true,
  offerId: true,
  offerTitle: true,
  offerPrice: true,
  offerCurrency: true,
  providerId: true,
  appointmentId: true,
  fullName: true,
  phone: true,
  notes: true,
  requestedDate: true,
  requestedTime: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  service: {
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      nameHe: true,
      durationMinutes: true,
    },
  },
  provider: {
    select: {
      fullName: true,
      id: true,
    },
  },
} satisfies Prisma.BookingRequestSelect;

function forbidden(permission: string) {
  return new BadRequestException({
    message: 'Permission denied',
    errors: { permission: `Missing permission: ${permission}` },
  });
}

function validationFailed(errors: Record<string, string>) {
  return new BadRequestException({ message: 'Validation failed', errors });
}

type PatientResolution = 'CREATE_NEW' | 'LINK_EXISTING';

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

@Injectable()
export class BookingRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly scheduleService: ScheduleService,
  ) {}

  async list(centerId: string, permissions: string[], statusFilter?: string) {
    if (!hasTenantPermission(permissions, 'appointments:view')) {
      throw forbidden('appointments:view');
    }

    const prisma = await this.prisma.getClient();

    const where: Prisma.BookingRequestWhereInput = { centerId };

    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter as 'PENDING' | 'ACCEPTED' | 'REJECTED';
    }

    const [items, total] = await Promise.all([
      prisma.bookingRequest.findMany({
        where,
        select: bookingRequestSelect,
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.bookingRequest.count({ where }),
    ]);

    return { items, total };
  }

  async accept(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    requestId: string,
    patientResolution?: PatientResolution,
  ) {
    if (!hasTenantPermission(permissions, 'appointments:create')) {
      throw forbidden('appointments:create');
    }

    const prisma = await this.prisma.getClient();

    const bookingRequest = await prisma.bookingRequest.findFirst({
      where: { id: requestId, centerId },
      select: bookingRequestSelect,
    });

    if (!bookingRequest) {
      throw new NotFoundException({
        message: 'Booking request not found',
        errors: { request: 'Booking request not found.' },
      });
    }

    if (bookingRequest.status !== 'PENDING') {
      throw validationFailed({
        status: 'This booking request has already been processed.',
      });
    }

    if (
      patientResolution &&
      patientResolution !== 'LINK_EXISTING' &&
      patientResolution !== 'CREATE_NEW'
    ) {
      throw validationFailed({
        patientResolution: 'Select how to resolve the patient match.',
      });
    }

    const existingPatient = await prisma.patient.findFirst({
      where: { centerId, phone: bookingRequest.phone },
      orderBy: { createdAt: 'asc' },
      select: { id: true, fullName: true, phone: true },
    });

    const hasNameConflict =
      existingPatient &&
      normalizeName(existingPatient.fullName) !==
        normalizeName(bookingRequest.fullName);

    if (hasNameConflict && !patientResolution) {
      throw new ConflictException({
        message: 'Patient resolution required',
        code: 'PATIENT_PHONE_NAME_CONFLICT',
        errors: {
          patientResolution:
            'This phone is already linked to another patient name.',
        },
        existingPatientName: existingPatient.fullName,
        existingPatientPhone: existingPatient.phone,
        bookingFullName: bookingRequest.fullName,
        bookingPhone: bookingRequest.phone,
      });
    }

    // Resolve actor's user role in the center to use as staffUser
    const staffRole = await prisma.userRole.findFirst({
      where: {
        centerId,
        userId: actorUserId,
        status: 'ACTIVE',
        user: { deletedAt: null, status: 'ACTIVE' },
      },
      select: { userId: true },
    });

    if (!staffRole) {
      throw validationFailed({
        staff:
          'Your account is not recognized as an active staff member of this center.',
      });
    }

    // Duration: from service if available, else 30-minute fallback.
    const duration = bookingRequest.service?.durationMinutes ?? 30;

    // Start time: use requested time if present, else default to 09:00 for offer bookings.
    const startTime = bookingRequest.requestedTime ?? '09:00';
    const hadRequestedTime = Boolean(bookingRequest.requestedTime);

    const [startHour, startMin] = startTime.split(':').map(Number);
    const endMinutes = startHour * 60 + startMin + duration;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    const appointmentProviderId = bookingRequest.providerId ?? actorUserId;

    // Check slot availability only when a service and a requested time are both present.
    if (bookingRequest.serviceId && hadRequestedTime) {
      const isSlotAvailable = await this.scheduleService.isSlotAvailable({
        centerId,
        date: bookingRequest.requestedDate.toISOString().slice(0, 10),
        excludeBookingRequestId: bookingRequest.id,
        providerId: appointmentProviderId,
        serviceId: bookingRequest.serviceId,
        startTime,
      });

      if (!isSlotAvailable) {
        throw new ConflictException({
          code: 'SLOT_UNAVAILABLE',
          message: 'The selected time slot is no longer available.',
          errors: {
            requestedTime:
              'This time slot is outside working hours or has already been booked.',
          },
        });
      }
    }

    // Atomically resolve the patient, create appointment, and mark request ACCEPTED.
    // Using callback form so we can reference the new appointment.id in the same
    // transaction. Also re-checks PENDING inside the transaction to prevent
    // duplicate appointments from concurrent accepts or orphan patient creation.
    const appointment = await prisma.$transaction(async (tx) => {
      const stillPending = await tx.bookingRequest.findFirst({
        where: { id: requestId, centerId, status: 'PENDING' },
        select: { id: true },
      });

      if (!stillPending) {
        throw validationFailed({
          status: 'This booking request has already been processed.',
        });
      }

      const patient =
        existingPatient && patientResolution !== 'CREATE_NEW'
          ? existingPatient
          : await tx.patient.create({
              data: {
                centerId,
                fullName: bookingRequest.fullName,
                phone: bookingRequest.phone,
                status: 'ACTIVE',
              },
              select: { id: true },
            });

      const resolvedPatient = await tx.patient.findFirst({
        where: { id: patient.id, centerId },
        select: { id: true },
      });

      if (!resolvedPatient) {
        throw validationFailed({
          patient: 'Unable to resolve patient for this booking request.',
        });
      }

      const created = await tx.appointment.create({
        data: {
          centerId,
          patientId: resolvedPatient.id,
          serviceId: bookingRequest.serviceId ?? null,
          offerTitle: bookingRequest.offerTitle ?? null,
          offerPrice: bookingRequest.offerPrice ?? null,
          offerCurrency: bookingRequest.offerCurrency ?? null,
          staffUserId: appointmentProviderId,
          createdByUserId: actorUserId,
          appointmentDate: bookingRequest.requestedDate,
          startTime,
          endTime,
          durationMinutes: duration,
          status: 'SCHEDULED',
          notes: bookingRequest.notes,
        },
        select: { id: true, patientId: true },
      });

      await tx.bookingRequest.update({
        where: { id: stillPending.id },
        data: { status: 'ACCEPTED', appointmentId: created.id },
      });

      return created;
    });

    await this.auditService.log({
      action: 'BOOKING_REQUEST_ACCEPTED',
      actorUserId,
      centerId,
      metadata: {
        bookingRequestId: requestId,
        appointmentId: appointment.id,
        patientName: bookingRequest.fullName,
        phone: bookingRequest.phone,
        patientResolution: patientResolution ?? 'AUTO',
        providerId: appointmentProviderId,
        requestedProviderId: bookingRequest.providerId,
        serviceId: bookingRequest.serviceId,
        offerId: bookingRequest.offerId,
        requestedDate: bookingRequest.requestedDate.toISOString().slice(0, 10),
        requestedTime: bookingRequest.requestedTime,
      },
    });

    const updated = await prisma.bookingRequest.findFirst({
      where: { id: requestId, centerId },
      select: bookingRequestSelect,
    });

    return updated;
  }

  async reject(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    requestId: string,
  ) {
    if (!hasTenantPermission(permissions, 'appointments:create')) {
      throw forbidden('appointments:create');
    }

    const prisma = await this.prisma.getClient();

    const bookingRequest = await prisma.bookingRequest.findFirst({
      where: { id: requestId, centerId },
      select: { id: true, status: true, fullName: true, phone: true },
    });

    if (!bookingRequest) {
      throw new NotFoundException({
        message: 'Booking request not found',
        errors: { request: 'Booking request not found.' },
      });
    }

    if (bookingRequest.status !== 'PENDING') {
      throw validationFailed({
        status: 'This booking request has already been processed.',
      });
    }

    await prisma.bookingRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    await this.auditService.log({
      action: 'BOOKING_REQUEST_REJECTED',
      actorUserId,
      centerId,
      metadata: {
        bookingRequestId: requestId,
        patientName: bookingRequest.fullName,
        phone: bookingRequest.phone,
      },
    });

    const updated = await prisma.bookingRequest.findFirst({
      where: { id: requestId },
      select: bookingRequestSelect,
    });

    return updated;
  }
}
