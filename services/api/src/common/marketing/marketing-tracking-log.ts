import type { Logger } from '@nestjs/common';
import type {
  Prisma,
  PrismaClient,
} from '@royalcare/db';

export async function safeCreateMarketingTrackingLog(
  prisma: PrismaClient,
  data: Prisma.MarketingTrackingLogUncheckedCreateInput,
  logger: Pick<Logger, 'warn'>,
) {
  try {
    await prisma.marketingTrackingLog.create({ data });
  } catch {
    logger.warn(
      'Marketing tracking log write skipped. The migration may be missing or the log table is temporarily unavailable.',
    );
  }
}
