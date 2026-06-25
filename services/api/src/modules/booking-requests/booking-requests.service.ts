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
  branchId: true,
  offerId: true,
  offerTitle: true,
  offerPrice: true,
  offerCurrency: true,
  providerId: true,
  appointmentId: true,
  fullName: true,
  phone: true,
  patientArea: true,
  notes: true,
  requestedDate: true,
  requestedTime: true,
  source: true,
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
      mapsUrl: true,
      phone: true,
      whatsapp: true,
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

  async list(
    centerId: string,
    permissions: string[],
    statusFilter?: string,
    branchId?: string,
  ) {
    if (!hasTenantPermission(permissions, 'appointments:view')) {
      throw forbidden('appointments:view');
    }

    const prisma = await this.prisma.getClient();

    const where: Prisma.BookingRequestWhereInput = { centerId };

    if (branchId) {
      where.branchId = branchId;
    }

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

    // Flag whether each request's phone already maps to a patient in this
    // center. Uses the SAME exact-phone match as prepareConversion so the card
    // badge/label always reflects what the action will actually do (and we
    // never offer "create patient" for someone who already exists).
    const phones = Array.from(
      new Set(items.map((item) => item.phone).filter(Boolean)),
    );
    const existingPatients = phones.length
      ? await prisma.patient.findMany({
          where: { centerId, phone: { in: phones } },
          orderBy: { createdAt: 'asc' },
          select: { id: true, phone: true },
        })
      : [];
    const patientByPhone = new Map<string, string>();
    for (const patient of existingPatients) {
      if (!patientByPhone.has(patient.phone)) {
        patientByPhone.set(patient.phone, patient.id);
      }
    }

    const itemsWithPatient = items.map((item) => {
      const existingPatientId = patientByPhone.get(item.phone) ?? null;
      return {
        ...item,
        existingPatientId,
        patientExists: existingPatientId !== null,
      };
    });

    return { items: itemsWithPatient, total };
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

    if (!bookingRequest.requestedDate) {
      throw validationFailed({
        requestedDate:
          'This request does not include a date. Contact the patient and create an appointment manually.',
      });
    }
    const requestedDate = bookingRequest.requestedDate;

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
        date: requestedDate.toISOString().slice(0, 10),
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
          appointmentDate: requestedDate,
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
        patientArea: bookingRequest.patientArea,
        branchId: bookingRequest.branchId,
        patientResolution: patientResolution ?? 'AUTO',
        providerId: appointmentProviderId,
        requestedProviderId: bookingRequest.providerId,
        serviceId: bookingRequest.serviceId,
        offerId: bookingRequest.offerId,
        requestedDate: requestedDate.toISOString().slice(0, 10),
        requestedTime: bookingRequest.requestedTime,
      },
    });

    const updated = await prisma.bookingRequest.findFirst({
      where: { id: requestId, centerId },
      select: bookingRequestSelect,
    });

    return updated;
  }

  /**
   * Resolves the patient for a SIMPLE_REQUEST conversion without creating an
   * appointment yet. Matches on phone within the center to avoid duplicates;
   * creates a new patient (folding the requested area into notes) only when no
   * match exists. The appointment itself is created afterwards through the
   * normal appointment form, then linked via {@link linkAppointment}.
   */
  async prepareConversion(
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
      select: {
        id: true,
        status: true,
        fullName: true,
        phone: true,
        patientArea: true,
        notes: true,
        serviceId: true,
        appointmentId: true,
      },
    });

    if (!bookingRequest) {
      throw new NotFoundException({
        message: 'Booking request not found',
        errors: { request: 'Booking request not found.' },
      });
    }

    if (bookingRequest.status !== 'PENDING' || bookingRequest.appointmentId) {
      throw validationFailed({
        status: 'This booking request has already been processed.',
      });
    }

    const existingPatient = await prisma.patient.findFirst({
      where: { centerId, phone: bookingRequest.phone },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (existingPatient) {
      return {
        patientId: existingPatient.id,
        serviceId: bookingRequest.serviceId,
        created: false,
      };
    }

    const areaLine = bookingRequest.patientArea
      ? `${bookingRequest.patientArea}`
      : '';
    const patientNotes =
      [areaLine, bookingRequest.notes?.trim()].filter(Boolean).join('\n') ||
      null;

    const createdPatient = await prisma.patient.create({
      data: {
        centerId,
        fullName: bookingRequest.fullName,
        phone: bookingRequest.phone,
        notes: patientNotes,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    await this.auditService.log({
      action: 'BOOKING_REQUEST_PATIENT_CREATED',
      actorUserId,
      centerId,
      metadata: {
        bookingRequestId: requestId,
        patientId: createdPatient.id,
        patientName: bookingRequest.fullName,
        phone: bookingRequest.phone,
        patientArea: bookingRequest.patientArea,
      },
    });

    return {
      patientId: createdPatient.id,
      serviceId: bookingRequest.serviceId,
      created: true,
    };
  }

  /**
   * Links an already-created appointment back to a SIMPLE_REQUEST booking
   * request and marks it ACCEPTED. The appointment must belong to the center.
   */
  async linkAppointment(
    centerId: string,
    permissions: string[],
    actorUserId: string,
    requestId: string,
    appointmentId: string,
  ) {
    if (!hasTenantPermission(permissions, 'appointments:create')) {
      throw forbidden('appointments:create');
    }

    if (!appointmentId) {
      throw validationFailed({
        appointmentId: 'An appointment is required to link this request.',
      });
    }

    const prisma = await this.prisma.getClient();

    const bookingRequest = await prisma.bookingRequest.findFirst({
      where: { id: requestId, centerId },
      select: { id: true, status: true, appointmentId: true },
    });

    if (!bookingRequest) {
      throw new NotFoundException({
        message: 'Booking request not found',
        errors: { request: 'Booking request not found.' },
      });
    }

    if (bookingRequest.status !== 'PENDING' || bookingRequest.appointmentId) {
      throw validationFailed({
        status: 'This booking request has already been processed.',
      });
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, centerId },
      select: { id: true, patientId: true },
    });

    if (!appointment) {
      throw new NotFoundException({
        message: 'Appointment not found',
        errors: { appointment: 'Appointment not found.' },
      });
    }

    await prisma.bookingRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED', appointmentId: appointment.id },
    });

    await this.auditService.log({
      action: 'BOOKING_REQUEST_ACCEPTED',
      actorUserId,
      centerId,
      metadata: {
        bookingRequestId: requestId,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        conversion: 'SIMPLE_REQUEST_MANUAL',
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
      select: {
        id: true,
        status: true,
        fullName: true,
        phone: true,
        patientArea: true,
        branchId: true,
      },
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
        patientArea: bookingRequest.patientArea,
        branchId: bookingRequest.branchId,
      },
    });

    const updated = await prisma.bookingRequest.findFirst({
      where: { id: requestId },
      select: bookingRequestSelect,
    });

    return updated;
  }
}
