-- Prisma.JsonNull is stored as JSONB null rather than SQL NULL.
UPDATE "Service"
SET "followUpRules" = jsonb_build_array(
  jsonb_build_object(
    'fromSessionNumber', 1,
    'toSessionNumber', "totalRecommendedSessions",
    'intervalDays', "defaultIntervalDays"
  )
)
WHERE "followUpMode" = 'SESSION_BASED_PLAN'
  AND ("followUpRules" IS NULL OR "followUpRules" = 'null'::jsonb)
  AND "totalRecommendedSessions" IS NOT NULL
  AND "totalRecommendedSessions" > 0
  AND "defaultIntervalDays" IS NOT NULL
  AND "defaultIntervalDays" > 0;
