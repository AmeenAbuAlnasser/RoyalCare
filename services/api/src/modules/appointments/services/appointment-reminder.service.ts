import { Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { hasTenantPermission } from '../../../common/permissions/tenant-permissions';
import type { Prisma } from '@royalcare/db';

const SKIP_STATUSES = ['CANCELLED', 'COMPLETED', 'NO_SHOW'] as const;

type ReminderType = '24H' | '2H' | 'MANUAL';

type ReminderLocale = 'ar' | 'en' | 'he';

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0')) return `972${digits.slice(1)}`;
  return digits;
}

function buildMessage(
  patientName: string,
  startTime: string,
  centerName: string,
  timeContext: 'tomorrow' | 'today',
  locale: ReminderLocale,
): string {
  if (locale === 'ar') {
    const when = timeContext === 'tomorrow' ? 'غداً' : 'اليوم';
    return `مرحباً ${patientName}،\nتذكير: لديك موعد ${when} الساعة ${startTime}\nالمركز: ${centerName}`;
  }
  if (locale === 'he') {
    const when = timeContext === 'tomorrow' ? 'מחר' : 'היום';
    return `שלום ${patientName},\nתזכורת: יש לך תור ${when} בשעה ${startTime}\nמרכז: ${centerName}`;
  }
  const when = timeContext === 'tomorrow' ? 'tomorrow' : 'today';
  return `Hello ${patientName},\nReminder: you have an appointment ${when} at ${startTime}\nCenter: ${centerName}`;
}

function buildWaLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

function getTodayUtcDate(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function getTomorrowUtcDate(): Date {
  const today = getTodayUtcDate();
  return new Date(today.getTime() + 24 * 60 * 60 * 1000);
}

function getCurrentHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function addMinutesToHHMM(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const clampedH = Math.min(Math.floor(total / 60), 23);
  const clampedM = total % 60;
  return `${String(clampedH).padStart(2, '0')}:${String(clampedM).padStart(2, '0')}`;
}

@Injectable()
export class AppointmentReminderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async runScheduledReminders(): Promise<void> {
    try {
      await Promise.all([this.run24hReminders(), this.run2hReminders()]);
    } catch (err) {
      console.error(
        '[AppointmentReminderService] Scheduled reminder error:',
        err,
      );
    }
  }

  private async run24hReminders(): Promise<void> {
    const prisma = await this.prisma.getClient();
    const tomorrow = getTomorrowUtcDate();

    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: tomorrow,
        reminder24hSent: false,
        status: {
          notIn:
            SKIP_STATUSES as unknown as Prisma.EnumAppointmentStatusFilter['notIn'],
        },
      },
      select: {
        id: true,
        startTime: true,
        centerId: true,
        patient: { select: { fullName: true, phone: true } },
        center: { select: { name: true, primaryLanguage: true } },
      },
    });

    for (const appt of appointments) {
      await this.markAndLog(prisma, appt, '24H', 'tomorrow');
    }
  }

  private async run2hReminders(): Promise<void> {
    const prisma = await this.prisma.getClient();
    const today = getTodayUtcDate();
    const nowHHMM = getCurrentHHMM();
    const windowStart = addMinutesToHHMM(nowHHMM, 60); // 1h from now
    const windowEnd = addMinutesToHHMM(nowHHMM, 180); // 3h from now

    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: today,
        reminder2hSent: false,
        startTime: { gte: windowStart, lte: windowEnd },
        status: {
          notIn:
            SKIP_STATUSES as unknown as Prisma.EnumAppointmentStatusFilter['notIn'],
        },
      },
      select: {
        id: true,
        startTime: true,
        centerId: true,
        patient: { select: { fullName: true, phone: true } },
        center: { select: { name: true, primaryLanguage: true } },
      },
    });

    for (const appt of appointments) {
      await this.markAndLog(prisma, appt, '2H', 'today');
    }
  }

  private async markAndLog(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    appt: {
      id: string;
      startTime: string;
      centerId: string;
      patient: { fullName: string; phone: string };
      center: { name: string; primaryLanguage: string };
    },
    type: '24H' | '2H',
    timeContext: 'tomorrow' | 'today',
  ): Promise<void> {
    try {
      const locale = this.centerLocale(appt.center.primaryLanguage);
      const message = buildMessage(
        appt.patient.fullName,
        appt.startTime,
        appt.center.name,
        timeContext,
        locale,
      );

      await prisma.appointment.update({
        where: { id: appt.id },
        data: {
          reminderSent: true,
          lastReminderSentAt: new Date(),
          reminderCount: { increment: 1 },
          reminder24hSent: type === '24H' ? true : undefined,
          reminder2hSent: type === '2H' ? true : undefined,
        },
        select: { id: true },
      });

      await this.audit.log({
        action: 'APPOINTMENT_REMINDER_SENT',
        centerId: appt.centerId,
        metadata: {
          appointmentId: appt.id,
          reminderType: type,
          patientName: appt.patient.fullName,
          phone: appt.patient.phone,
          messagePreview: message.slice(0, 200),
          channel: 'WHATSAPP_MANUAL',
        },
      });
    } catch (err) {
      console.error(
        `[AppointmentReminderService] Failed to mark reminder for appointment ${appt.id}:`,
        err,
      );
    }
  }

  async sendManualReminder(
    centerId: string,
    appointmentId: string,
    permissions: string[],
    locale: ReminderLocale = 'ar',
  ): Promise<{
    appointment: Awaited<ReturnType<typeof this.loadAppointment>>;
    whatsApp: { phone: string; message: string; waLink: string };
  }> {
    if (!hasTenantPermission(permissions, 'appointments:update')) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const prisma = await this.prisma.getClient();
    const appt = await prisma.appointment.findFirst({
      where: { id: appointmentId, centerId },
      select: {
        id: true,
        startTime: true,
        centerId: true,
        appointmentDate: true,
        status: true,
        patient: { select: { fullName: true, phone: true } },
        center: { select: { name: true } },
      },
    });

    if (!appt) {
      throw Object.assign(new Error('Not Found'), { status: 404 });
    }

    const today = getTodayUtcDate();
    const apptDate = new Date(appt.appointmentDate);
    const isToday =
      apptDate.getUTCFullYear() === today.getUTCFullYear() &&
      apptDate.getUTCMonth() === today.getUTCMonth() &&
      apptDate.getUTCDate() === today.getUTCDate();

    const message = buildMessage(
      appt.patient.fullName,
      appt.startTime,
      appt.center.name,
      isToday ? 'today' : 'tomorrow',
      locale,
    );

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        reminderSent: true,
        lastReminderSentAt: new Date(),
        reminderCount: { increment: 1 },
      },
      select: { id: true },
    });

    await this.audit.log({
      action: 'APPOINTMENT_REMINDER_SENT',
      centerId,
      metadata: {
        appointmentId,
        reminderType: 'MANUAL' as ReminderType,
        patientName: appt.patient.fullName,
        phone: appt.patient.phone,
        locale,
        channel: 'WHATSAPP_MANUAL',
      },
    });

    const updatedAppointment = await this.loadAppointment(
      prisma,
      appointmentId,
      centerId,
    );

    return {
      appointment: updatedAppointment,
      whatsApp: {
        phone: appt.patient.phone,
        message,
        waLink: buildWaLink(appt.patient.phone, message),
      },
    };
  }

  private async loadAppointment(
    prisma: Awaited<ReturnType<PrismaService['getClient']>>,
    appointmentId: string,
    centerId: string,
  ) {
    return prisma.appointment.findFirst({
      where: { id: appointmentId, centerId },
      select: {
        id: true,
        reminderSent: true,
        lastReminderSentAt: true,
        reminderCount: true,
        reminder24hSent: true,
        reminder2hSent: true,
      },
    });
  }

  private centerLocale(primaryLanguage: string): ReminderLocale {
    if (primaryLanguage === 'AR') return 'ar';
    if (primaryLanguage === 'HE') return 'he';
    return 'en';
  }
}
