import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DatabaseModule } from './common/database/database.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantSubscriptionAccessMiddleware } from './modules/auth/middleware/tenant-subscription-access.middleware';
import { TenantAppointmentsController } from './modules/appointments/controllers/tenant-appointments.controller';
import { TenantBillingController } from './modules/billing/controllers/tenant-billing.controller';
import { PatientsController } from './modules/customers/controllers/patients.controller';
import { TenantServicesController } from './modules/services/controllers/tenant-services.controller';
import { TenantStaffController } from './modules/staff/controllers/tenant-staff.controller';
import { TenantRolesController } from './modules/staff/controllers/tenant-roles.controller';
import { BillingModule } from './modules/billing/billing.module';
import { CentersModule } from './modules/centers/centers.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DomainsModule } from './modules/domains/domains.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ServicesModule } from './modules/services/services.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { StaffModule } from './modules/staff/staff.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { SuperAdminAnalyticsModule } from './modules/analytics/super-admin-analytics.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { UsersModule } from './modules/users/users.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { PublicCentersModule } from './modules/public-centers/public-centers.module';
import { BookingRequestsModule } from './modules/booking-requests/booking-requests.module';
import { PatientPortalModule } from './modules/patient-portal/patient-portal.module';
import { TenantBookingRequestsController } from './modules/booking-requests/controllers/tenant-booking-requests.controller';
import { TenantScheduleController } from './modules/schedule/tenant-schedule.controller';
import { TenantCenterPublicProfileController } from './modules/center-public-profile/center-public-profile.controller';
import { TenantScheduleModule } from './modules/schedule/schedule.module';
import { FeaturedServicesModule } from './modules/featured-services/featured-services.module';
import { CenterPublicProfileModule } from './modules/center-public-profile/center-public-profile.module';
import { CenterGalleryModule } from './modules/center-gallery/center-gallery.module';
import { TenantCenterGalleryController } from './modules/center-gallery/center-gallery.controller';
import { CenterReviewsModule } from './modules/center-reviews/center-reviews.module';
import { TenantCenterReviewsController } from './modules/center-reviews/center-reviews.controller';
import { CenterBeforeAfterModule } from './modules/center-before-after/center-before-after.module';
import { TenantCenterBeforeAfterController } from './modules/center-before-after/center-before-after.controller';
import { MarketingSettingsModule } from './modules/marketing-settings/marketing-settings.module';
import { TenantMarketingSettingsController } from './modules/marketing-settings/tenant-marketing-settings.controller';
import { PlatformTrackingModule } from './modules/platform-tracking/platform-tracking.module';
import { CenterLeadsModule } from './modules/center-leads/center-leads.module';
import { CenterTeamModule } from './modules/center-team/center-team.module';
import { TenantCenterTeamController } from './modules/center-team/center-team.controller';
import { CenterOffersModule } from './modules/center-offers/center-offers.module';
import { TenantCenterOffersController } from './modules/center-offers/center-offers.controller';
import { CenterSeoModule } from './modules/center-seo/center-seo.module';
import { TenantCenterSeoController } from './modules/center-seo/center-seo.controller';
import { TenantDomainsModule } from './modules/tenant-domains/tenant-domains.module';
import { TenantDomainsController } from './modules/tenant-domains/tenant-domains.controller';
import { CenterAnalyticsModule } from './modules/center-analytics/center-analytics.module';
import { TenantCenterAnalyticsController } from './modules/center-analytics/center-analytics.controller';
import { PatientFollowUpsModule } from './modules/patient-follow-ups/patient-follow-ups.module';
import { PatientFollowUpsController } from './modules/patient-follow-ups/controllers/patient-follow-ups.controller';

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
    StaffModule,
    BillingModule,
    SessionsModule,
    NotificationsModule,
    PermissionsModule,
    AuditModule,
    SuperAdminAnalyticsModule,
    SystemSettingsModule,
    WhatsAppModule,
    PublicCentersModule,
    BookingRequestsModule,
    PatientPortalModule,
    TenantScheduleModule,
    FeaturedServicesModule,
    CenterPublicProfileModule,
    CenterGalleryModule,
    CenterReviewsModule,
    CenterBeforeAfterModule,
    MarketingSettingsModule,
    PlatformTrackingModule,
    CenterLeadsModule,
    CenterTeamModule,
    CenterOffersModule,
    CenterSeoModule,
    TenantDomainsModule,
    CenterAnalyticsModule,
    PatientFollowUpsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantSubscriptionAccessMiddleware)
      .forRoutes(
        PatientsController,
        TenantAppointmentsController,
        TenantBillingController,
        TenantServicesController,
        TenantStaffController,
        TenantRolesController,
        TenantBookingRequestsController,
        TenantScheduleController,
        TenantCenterPublicProfileController,
        TenantCenterGalleryController,
        TenantCenterReviewsController,
        TenantCenterBeforeAfterController,
        TenantMarketingSettingsController,
        TenantCenterTeamController,
        TenantCenterOffersController,
        TenantCenterSeoController,
        TenantDomainsController,
        TenantCenterAnalyticsController,
        PatientFollowUpsController,
      );
  }
}
