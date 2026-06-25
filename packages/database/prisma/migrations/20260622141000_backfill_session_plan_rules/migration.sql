-- Preserve former fixed-interval finite plans as one session-based phase.
-- Example: totalRecommendedSessions=8 + defaultIntervalDays=30 becomes
-- sessions 1..8 with a 30-day next-session interval.
UPDATE "Service"
SET "followUpRules" = jsonb_build_array(
  jsonb_build_object(
    'fromSessionNumber', 1,
    'toSessionNumber', "totalRecommendedSessions",
    'intervalDays', "defaultIntervalDays"
  )
)
WHERE "followUpMode" = 'SESSION_BASED_PLAN'
  AND "followUpRules" IS NULL
  AND "totalRecommendedSessions" IS NOT NULL
  AND "totalRecommendedSessions" > 0
  AND "defaultIntervalDays" IS NOT NULL
  AND "defaultIntervalDays" > 0;
