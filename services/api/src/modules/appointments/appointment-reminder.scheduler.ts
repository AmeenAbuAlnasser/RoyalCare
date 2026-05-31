import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AppointmentReminderService } from './services/appointment-reminder.service';

const INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

@Injectable()
export class AppointmentReminderScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly reminderService: AppointmentReminderService) {}

  onModuleInit() {
    void this.reminderService.runScheduledReminders();
    this.intervalId = setInterval(() => {
      void this.reminderService.runScheduledReminders();
    }, INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
