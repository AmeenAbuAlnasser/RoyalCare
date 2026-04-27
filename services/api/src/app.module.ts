import { Module } from '@nestjs/common';
import { DatabaseModule } from './common/database/database.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuthModule } from './modules/auth/auth.module';
import { CentersModule } from './modules/centers/centers.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DomainsModule } from './modules/domains/domains.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ServicesModule } from './modules/services/services.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    TenancyModule,
    CentersModule,
    SubscriptionsModule,
    DomainsModule,
    AppointmentsModule,
    CustomersModule,
    ServicesModule,
    SessionsModule,
    NotificationsModule,
    PermissionsModule,
  ],
})
export class AppModule {}
