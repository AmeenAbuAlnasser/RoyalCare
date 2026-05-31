-- AlterTable: add optional multilingual name fields to Patient
ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "fullNameAr" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "fullNameHe" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "fullNameEn" VARCHAR(160);

-- Data migration: populate fullNameAr for patients whose fullName contains Arabic characters
UPDATE "Patient"
SET "fullNameAr" = "fullName"
WHERE "fullName" ~ '[؀-ۿ]'
  AND "fullNameAr" IS NULL;

-- Data migration: populate fullNameHe for patients whose fullName contains Hebrew characters
UPDATE "Patient"
SET "fullNameHe" = "fullName"
WHERE "fullName" ~ '[֐-׿]'
  AND "fullNameHe" IS NULL;

-- Data migration: populate fullNameEn for patients whose fullName is Latin only
UPDATE "Patient"
SET "fullNameEn" = "fullName"
WHERE "fullName" !~ '[؀-ۿ֐-׿]'
  AND "fullNameEn" IS NULL;
