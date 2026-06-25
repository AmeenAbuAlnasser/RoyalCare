-- Replace the overlapping follow-up type/mode model with one authoritative mode.
-- Existing finite records (including old fixed-interval/session-plan variants)
-- remain finite session-count plans. Existing recurring records remain continuous.

CREATE TYPE "ServiceFollowUpMode_new" AS ENUM (
  'NONE',
  'SESSION_BASED_PLAN',
  'RECURRING_CONTINUOUS'
);

ALTER TABLE "Service"
ALTER COLUMN "followUpMode" DROP DEFAULT;

ALTER TABLE "Service"
ALTER COLUMN "followUpMode" TYPE "ServiceFollowUpMode_new"
USING (
  CASE "followUpMode"::text
    WHEN 'NONE' THEN 'NONE'
    WHEN 'RECURRING' THEN 'RECURRING_CONTINUOUS'
    WHEN 'RECURRING_CONTINUOUS' THEN 'RECURRING_CONTINUOUS'
    -- FINITE_PLAN and any legacy FIXED_PERIOD value both become the finite,
    -- session-count-based plan. followUpRules/defaultIntervalDays are preserved.
    ELSE 'SESSION_BASED_PLAN'
  END
)::"ServiceFollowUpMode_new";

DROP TYPE "ServiceFollowUpMode";
ALTER TYPE "ServiceFollowUpMode_new" RENAME TO "ServiceFollowUpMode";

ALTER TABLE "Service"
ALTER COLUMN "followUpMode" SET DEFAULT 'NONE';

-- followUpType used to choose fixed vs phased intervals inside a finite plan.
-- The scheduling rules already live in followUpRules/defaultIntervalDays, so the
-- discriminator is redundant and can be removed without losing configuration.
ALTER TABLE "Service" DROP COLUMN "followUpType";
DROP TYPE "ServiceFollowUpType";
