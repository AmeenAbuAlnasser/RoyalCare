import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@royalcare/db';
import { PrismaService } from '../../common/database/prisma.service';
import { ScheduleService } from '../../common/schedule/schedule.service';
import { startOfDay } from '../../common/subscriptions/subscription-lifecycle';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateBookingRequestDto } from './dto/create-booking-request.dto';
import { MetaConversionsService } from './meta-conversions.service';

type PublicBookingTrackingContext = {
  eventSourceUrl?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const VISIBLE_SUBSCRIPTION_STATUSES = [
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
] as const;
const publicBranchOrderBy: Prisma.CenterBranchOrderByWithRelationInput[] = [
  { isMain: 'desc' },
  { sortOrder: 'asc' },
  { createdAt: 'asc' },
];

function visibleSubscriptionWhere(): Prisma.SubscriptionWhereInput {
  return {
    currentPeriodEnd: { gte: startOfDay() },
    status: { in: [...VISIBLE_SUBSCRIPTION_STATUSES] },
  };
}

const publicCenterSelect = {
  slug: true,
  name: true,
  nameAr: true,
  nameEn: true,
  nameHe: true,
  type: true,
  primaryLanguage: true,
  owner: {
    select: {
      phone: true,
    },
  },
  subscriptions: {
    where: visibleSubscriptionWhere(),
    select: {
      notificationPhone: true,
    },
    orderBy: { currentPeriodEnd: 'desc' },
    take: 1,
  },
  branding: {
    select: {
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      coverImageUrl: true,
      cardImageUrl: true,
      publicDescriptionAr: true,
      publicDescriptionEn: true,
      publicDescriptionHe: true,
      fullDescriptionAr: true,
      fullDescriptionEn: true,
      fullDescriptionHe: true,
      sloganAr: true,
      sloganEn: true,
      sloganHe: true,
      cityAr: true,
      cityEn: true,
      cityHe: true,
      addressAr: true,
      addressEn: true,
      addressHe: true,
      whatsappPhone: true,
      phone: true,
      email: true,
      googleMapsUrl: true,
      workingHoursAr: true,
      workingHoursEn: true,
      workingHoursHe: true,
      websiteSectionOrder: true,
      websiteSectionVisibility: true,
      publicBookingMode: true,
      facebookUrl: true,
      instagramUrl: true,
      tiktokUrl: true,
      latitude: true,
      longitude: true,
    },
  },
  branches: {
    where: { isActive: true },
    select: {
      addressAr: true,
      addressEn: true,
      addressHe: true,
      cityAr: true,
      cityEn: true,
      cityHe: true,
      id: true,
      isMain: true,
      mapsUrl: true,
      name: true,
      phone: true,
      sortOrder: true,
      whatsapp: true,
      workingHoursTextAr: true,
      workingHoursTextEn: true,
      workingHoursTextHe: true,
    },
    orderBy: publicBranchOrderBy,
  },
} as const;

function optionalTrimmed(value?: string | null) {
  return typeof value === 'string' ? value.trim() : value;
}

function firstNonBlank(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const trimmed = optionalTrimmed(value);
    if (trimmed) return trimmed;
  }
  return null;
}

function serializePublicCenter<
  T extends {
    branding: null | { whatsappPhone: string | null };
    owner?: { phone: string | null } | null;
    subscriptions?: Array<{ notificationPhone: string | null }>;
  },
>(center: T) {
  const { owner, subscriptions, ...publicCenter } = center;
  const globalWhatsapp = firstNonBlank(
    subscriptions?.[0]?.notificationPhone,
    owner?.phone,
  );

  return {
    ...publicCenter,
    branding: publicCenter.branding
      ? {
          ...publicCenter.branding,
          whatsappPhone: firstNonBlank(
            publicCenter.branding.whatsappPhone,
            globalWhatsapp,
          ),
        }
      : publicCenter.branding,
  };
}

function validationFailed(errors: Record<string, string>) {
  return new BadRequestException({ message: 'Validation failed', errors });
}

function parseBookingDate(value: string | undefined) {
  const dateText = optionalTrimmed(value);
  if (!dateText) return 'missing';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return 'invalid';
  const parsed = new Date(`${dateText}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return 'invalid';
  return parsed;
}

function parseBookingTime(value: string | undefined) {
  const time = optionalTrimmed(value);
  if (!time) return 'missing';
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return 'invalid';
  return time;
}

function isUuid(value?: string | null) {
  return Boolean(
    value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    ),
  );
}

@Injectable()
export class PublicCentersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metaConversionsService: MetaConversionsService,
    private readonly notificationsService: NotificationsService,
    private readonly scheduleService: ScheduleService,
  ) {}

  async listPublicCenters() {
    const prisma = await this.prisma.getClient();

    const centers = await prisma.center.findMany({
      where: {
        status: 'ACTIVE',
        publicVisible: true,
        subscriptions: {
          some: visibleSubscriptionWhere(),
        },
      },
      select: {
        ...publicCenterSelect,
        services: {
          where: { isActive: true, archivedAt: null },
          select: {
            nameEn: true,
            nameAr: true,
            nameHe: true,
          },
          take: 4,
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return { data: centers.map((center) => serializePublicCenter(center)) };
  }

  async getPublicCenter(slug: string) {
    const prisma = await this.prisma.getClient();

    const center = await prisma.center.findFirst({
      where: {
        slug,
        status: 'ACTIVE',
        publicVisible: true,
        subscriptions: {
          some: visibleSubscriptionWhere(),
        },
      },
      select: {
        ...publicCenterSelect,
        services: {
          where: { isActive: true, archivedAt: null },
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            nameHe: true,
            descriptionEn: true,
            descriptionAr: true,
            descriptionHe: true,
            durationMinutes: true,
            price: true,
            currency: true,
            coverImageUrl: true,
            coverImageAlt: true,
          },
          orderBy: { nameEn: 'asc' },
        },
        userRoles: {
          where: {
            providerEnabled: true,
            status: 'ACTIVE',
            role: { status: 'ACTIVE' },
            user: { deletedAt: null, status: 'ACTIVE' },
          },
          select: {
            role: { select: { key: true, name: true } },
            user: { select: { fullName: true, id: true } },
          },
          orderBy: { user: { fullName: 'asc' } },
        },
      },
    });

    if (!center) {
      throw new NotFoundException(
        'Center not found or is not publicly available',
      );
    }

    const { userRoles, ...publicCenter } = center;
    const uniqueProviders = new Map<string, (typeof userRoles)[number]>();
    for (const provider of userRoles) {
      if (!uniqueProviders.has(provider.user.id)) {
        uniqueProviders.set(provider.user.id, provider);
      }
    }

    return {
      ...serializePublicCenter(publicCenter),
      providers: Array.from(uniqueProviders.values()).map((provider) => ({
        id: provider.user.id,
        name: provider.user.fullName,
        roleKey: provider.role.key,
        roleName: provider.role.name,
      })),
    };
  }

  async getMarketingSettings(slug: string) {
    const prisma = await this.prisma.getClient();
    const center = await prisma.center.findFirst({
      where: {
        publicVisible: true,
        slug,
        status: 'ACTIVE',
        subscriptions: {
          some: visibleSubscriptionWhere(),
        },
      },
      select: {
        // Public-safe marketing payload only. Never include metaConversionApiToken here.
        marketingSettings: {
          select: {
            customBodyScript: true,
            customHeadScript: true,
            ga4Id: true,
            gtmId: true,
            metaPixelId: true,
            snapPixelId: true,
            tiktokPixelId: true,
          },
        },
      },
    });

    if (!center) {
      throw new NotFoundException(
        'Center not found or is not publicly available',
      );
    }

    return (
      center.marketingSettings ?? {
        customBodyScript: null,
        customHeadScript: null,
        ga4Id: null,
        gtmId: null,
        metaPixelId: null,
        snapPixelId: null,
        tiktokPixelId: null,
      }
    );
  }

  async getAvailability(
    slug: string,
    serviceId?: string,
    date?: string,
    providerId?: string,
  ) {
    const prisma = await this.prisma.getClient();
    const center = await prisma.center.findFirst({
      where: {
        publicVisible: true,
        slug,
        status: 'ACTIVE',
        subscriptions: {
          some: visibleSubscriptionWhere(),
        },
      },
      select: { id: true },
    });

    if (!center) {
      throw new NotFoundException(
        'Center not found or is not publicly available',
      );
    }

    const errors: Record<string, string> = {};
    if (!serviceId?.trim()) errors.serviceId = 'serviceId is required.';

    const parsedDate = parseBookingDate(date);
    if (parsedDate === 'missing' || parsedDate === 'invalid') {
      errors.date = 'date must be a valid YYYY-MM-DD date.';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayUtc = new Date(
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
      );
      if (parsedDate < todayUtc) {
        errors.date = 'date must be today or in the future.';
      }
    }

    if (Object.keys(errors).length > 0) throw validationFailed(errors);

    const service = await prisma.service.findFirst({
      where: {
        archivedAt: null,
        centerId: center.id,
        id: serviceId!.trim(),
        isActive: true,
      },
      select: { id: true },
    });

    if (!service) {
      throw validationFailed({ serviceId: 'Service not found or not active.' });
    }

    const provider = await this.validatePublicProvider(
      center.id,
      optionalTrimmed(providerId),
    );

    return this.scheduleService.computeSlots({
      centerId: center.id,
      date: date!.trim(),
      providerId: provider?.id,
      serviceId: service.id,
    });
  }
  async createBookingRequest(
    slug: string,
    dto: CreateBookingRequestDto,
    trackingContext: PublicBookingTrackingContext = {},
  ) {
    const prisma = await this.prisma.getClient();

    // Validate center
    const center = await prisma.center.findFirst({
      where: {
        slug,
        status: 'ACTIVE',
        publicVisible: true,
        subscriptions: {
          some: visibleSubscriptionWhere(),
        },
      },
      select: {
        id: true,
        nameEn: true,
        name: true,
        branding: { select: { publicBookingMode: true } },
        branches: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            cityAr: true,
            cityEn: true,
            cityHe: true,
            phone: true,
            whatsapp: true,
          },
          orderBy: publicBranchOrderBy,
        },
      },
    });

    if (!center) {
      throw new NotFoundException({
        message: 'Center not found',
        errors: {
          center: 'This center is not available or is not accepting requests.',
        },
      });
    }

    // Validate input
    const errors: Record<string, string> = {};
    const fullName = optionalTrimmed(dto.fullName);
    const phone = optionalTrimmed(dto.phone);
    const serviceId = optionalTrimmed(dto.serviceId);
    const offerId = optionalTrimmed(dto.offerId);
    const requestedBranchId = optionalTrimmed(dto.branchId);
    const providerId = optionalTrimmed(dto.providerId);
    const patientArea = optionalTrimmed(dto.patientArea);
    const notes = optionalTrimmed(dto.notes);
    const bookingMode = center.branding?.publicBookingMode ?? 'SIMPLE_REQUEST';
    const isSimpleRequest = bookingMode === 'SIMPLE_REQUEST';
    const requestedDate = isSimpleRequest
      ? null
      : parseBookingDate(dto.requestedDate);
    const requestedTime = isSimpleRequest
      ? null
      : parseBookingTime(dto.requestedTime);

    if (!fullName || fullName.length < 2) {
      errors.fullName = 'Full name is required (at least 2 characters).';
    }

    if (!phone || !/^\d{7,15}$/.test(phone.replace(/[\s\-().+]/g, ''))) {
      errors.phone = 'Enter a valid phone number.';
    }

    if (patientArea && patientArea.length > 120) {
      errors.patientArea = 'City / area must be 120 characters or fewer.';
    }

    const activeBranches = center.branches;
    const hasMultipleBranches = activeBranches.length > 1;
    let branchId: string | null = null;

    if (isSimpleRequest) {
      if (hasMultipleBranches && !requestedBranchId) {
        errors.branchId = 'Choose a branch.';
      } else if (requestedBranchId && !isUuid(requestedBranchId)) {
        errors.branchId = 'Choose a valid branch.';
      } else if (requestedBranchId) {
        const branch = activeBranches.find(
          (item) => item.id === requestedBranchId,
        );
        if (!branch) {
          errors.branchId = 'Choose a valid branch.';
        } else {
          branchId = branch.id;
        }
      } else if (activeBranches.length === 1) {
        branchId = activeBranches[0].id;
      }
    } else if (requestedBranchId) {
      if (!isUuid(requestedBranchId)) {
        errors.branchId = 'Choose a valid branch.';
      } else {
        const branch = activeBranches.find(
          (item) => item.id === requestedBranchId,
        );
        if (!branch) errors.branchId = 'Choose a valid branch.';
        else branchId = branch.id;
      }
    } else if (activeBranches.length === 1) {
      branchId = activeBranches[0].id;
    }

    if (!isSimpleRequest && !serviceId && !offerId) {
      errors.serviceId = 'Select a service.';
    }

    if (
      !isSimpleRequest &&
      (requestedDate === 'missing' || requestedDate === 'invalid')
    ) {
      errors.requestedDate = 'Select a valid date.';
    } else if (!isSimpleRequest && requestedDate instanceof Date) {
      const bookingDate = requestedDate;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayUtc = new Date(
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
      );
      if (bookingDate < todayUtc) {
        errors.requestedDate = 'Requested date must be today or in the future.';
      }
    }

    if (
      !isSimpleRequest &&
      !offerId &&
      (requestedTime === 'missing' || requestedTime === 'invalid')
    ) {
      errors.requestedTime = 'Select a valid time slot.';
    }

    if (Object.keys(errors).length > 0) {
      throw validationFailed(errors);
    }

    // Validate offer (if provided): must belong to this center, be published, and within active date range
    const offerQuery = offerId
      ? await (async () => {
          const now = new Date();
          return prisma.centerOffer.findFirst({
            where: {
              id: offerId,
              centerId: center.id,
              isPublished: true,
              OR: [{ startsAt: null }, { startsAt: { lte: now } }],
              AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
            },
            select: {
              id: true,
              titleEn: true,
              titleAr: true,
              titleHe: true,
              newPrice: true,
              oldPrice: true,
              currency: true,
            },
          });
        })()
      : null;

    if (offerId && !offerQuery) {
      throw validationFailed({
        offerId: 'This offer is not available or has expired.',
      });
    }

    const resolvedOffer = offerQuery;

    // Validate service belongs to center and is active (only when serviceId is provided)
    const serviceQuery = serviceId
      ? await prisma.service.findFirst({
          where: {
            id: serviceId,
            centerId: center.id,
            isActive: true,
            archivedAt: null,
          },
          select: {
            currency: true,
            id: true,
            nameAr: true,
            nameEn: true,
            nameHe: true,
            price: true,
          },
        })
      : null;

    if (serviceId && !serviceQuery) {
      throw validationFailed({
        serviceId: 'The selected service is not available at this center.',
      });
    }

    const service = serviceQuery;

    const provider = isSimpleRequest
      ? null
      : await this.validatePublicProvider(center.id, providerId);

    // Check slot availability only when a service and time are selected
    const resolvedTime =
      requestedTime !== null &&
      requestedTime !== 'missing' &&
      requestedTime !== 'invalid'
        ? requestedTime
        : null;

    if (!isSimpleRequest && service && resolvedTime) {
      const isSlotAvailable = await this.scheduleService.isSlotAvailable({
        centerId: center.id,
        date: (dto.requestedDate as string).trim(),
        providerId: provider?.id,
        serviceId: service.id,
        startTime: resolvedTime,
      });

      if (!isSlotAvailable) {
        throw new ConflictException({
          message: 'The selected time slot is no longer available.',
          code: 'SLOT_UNAVAILABLE',
          errors: {
            requestedTime:
              'This time slot has just been booked. Please choose another time.',
          },
        });
      }
    }

    // Snapshot offer title/price from the validated offer object
    const snapshotOfferTitle =
      resolvedOffer?.titleAr ||
      resolvedOffer?.titleEn ||
      resolvedOffer?.titleHe ||
      optionalTrimmed(dto.offerTitle) ||
      null;
    const snapshotOfferPrice =
      resolvedOffer?.newPrice ?? resolvedOffer?.oldPrice ?? null;
    const snapshotOfferCurrency = resolvedOffer?.currency || null;

    // Create booking request
    const bookingRequest = await prisma.bookingRequest.create({
      data: {
        centerId: center.id,
        branchId,
        providerId: provider?.id ?? null,
        serviceId: service?.id ?? null,
        offerId: resolvedOffer?.id ?? null,
        offerTitle: snapshotOfferTitle,
        offerPrice: snapshotOfferPrice,
        offerCurrency: snapshotOfferCurrency,
        fullName: fullName!,
        phone: phone!.replace(/[\s\-().+]/g, ''),
        patientArea: patientArea || null,
        notes: notes || null,
        requestedDate: isSimpleRequest ? null : (requestedDate as Date),
        requestedTime: isSimpleRequest ? null : resolvedTime,
        source: 'PUBLIC_WEBSITE',
        status: 'PENDING',
      },
      select: {
        id: true,
        branchId: true,
        fullName: true,
        phone: true,
        patientArea: true,
        requestedDate: true,
        requestedTime: true,
      },
    });

    const areaSuffix = bookingRequest.patientArea
      ? ` - ${bookingRequest.patientArea}`
      : '';

    await this.notificationsService.createNotification({
      centerId: center.id,
      type: 'BOOKING_REQUEST_CREATED',
      targetAudience: 'CENTER_ADMIN',
      titleAr: 'طلب حجز جديد',
      titleEn: 'New Booking Request',
      titleHe: 'בקשת תור חדשה',
      messageAr: `${bookingRequest.fullName} طلب موعد جديد${areaSuffix}`,
      messageEn: `${bookingRequest.fullName} submitted a booking request${areaSuffix}`,
      messageHe: `${bookingRequest.fullName} שלח/ה בקשת תור${areaSuffix}`,
      actionUrl: '/tenant/booking-requests',
      dedupKey: `booking-request:${bookingRequest.id}`,
      metadata: {
        bookingRequestId: bookingRequest.id,
        fullName: bookingRequest.fullName,
        phone: bookingRequest.phone,
        patientArea: bookingRequest.patientArea,
        branchId: bookingRequest.branchId,
        requestedDate:
          bookingRequest.requestedDate?.toISOString().slice(0, 10) ?? null,
        requestedTime: bookingRequest.requestedTime,
        serviceId: service?.id ?? null,
        offerId: resolvedOffer?.id ?? null,
        providerId: provider?.id ?? null,
      },
    });

    const trackingEventId = `booking_${bookingRequest.id}`;

    void this.metaConversionsService.trackCompleteBooking({
      bookingRequestId: bookingRequest.id,
      centerId: center.id,
      centerSlug: slug,
      currency: service?.currency ?? resolvedOffer?.currency ?? 'ILS',
      eventSourceUrl: trackingContext.eventSourceUrl,
      fullName: bookingRequest.fullName,
      ipAddress: trackingContext.ipAddress,
      phone: bookingRequest.phone,
      serviceId: service?.id ?? '',
      trackingEventId,
      userAgent: trackingContext.userAgent,
      value:
        service?.price?.toString() ??
        snapshotOfferPrice?.toString() ??
        undefined,
    });

    const serviceName = service
      ? service.nameEn || service.nameAr || service.nameHe
      : resolvedOffer?.titleEn ||
        resolvedOffer?.titleAr ||
        resolvedOffer?.titleHe ||
        '';

    return {
      message: 'Booking request submitted successfully.',
      bookingRequestId: bookingRequest.id,
      trackingEventId,
      centerName: center.nameEn || center.name,
      serviceName,
      requestedDate:
        bookingRequest.requestedDate?.toISOString().slice(0, 10) ?? '',
      requestedTime: bookingRequest.requestedTime ?? '',
    };
  }

  private async validatePublicProvider(
    centerId: string,
    providerId?: string | null,
  ) {
    if (!providerId) return null;
    const prisma = await this.prisma.getClient();
    const provider = await prisma.userRole.findFirst({
      where: {
        centerId,
        providerEnabled: true,
        role: { status: 'ACTIVE' },
        status: 'ACTIVE',
        user: { deletedAt: null, id: providerId, status: 'ACTIVE' },
      },
      select: { user: { select: { id: true } } },
    });

    if (!provider) {
      throw validationFailed({
        providerId: 'Provider not found or not active.',
      });
    }

    return { id: provider.user.id };
  }
}
