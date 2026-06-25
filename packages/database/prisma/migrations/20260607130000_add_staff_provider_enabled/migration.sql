ALTER TABLE "UserRole"
ADD COLUMN "providerEnabled" BOOLEAN NOT NULL DEFAULT false;

UPDATE "UserRole" AS ur
SET "providerEnabled" = true
FROM "Role" AS r
WHERE ur."roleId" = r."id"
  AND r."scope" = 'CENTER'
  AND r."key" IN ('CENTER_OWNER', 'CENTER_MANAGER', 'DOCTOR', 'STAFF')
  AND ur."status" = 'ACTIVE';

UPDATE "UserRole" AS ur
SET "providerEnabled" = true
FROM "Center" AS c
WHERE ur."centerId" = c."id"
  AND ur."userId" = c."ownerUserId"
  AND ur."status" = 'ACTIVE';

CREATE INDEX "UserRole_centerId_providerEnabled_status_idx"
ON "UserRole"("centerId", "providerEnabled", "status");
