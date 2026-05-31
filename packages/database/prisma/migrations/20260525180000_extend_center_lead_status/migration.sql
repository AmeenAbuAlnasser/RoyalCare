-- Extend CenterLeadStatus enum with new follow-up values.
-- ADD VALUE IF NOT EXISTS is safe to re-run on already-migrated databases.
ALTER TYPE "CenterLeadStatus" ADD VALUE IF NOT EXISTS 'NO_ANSWER';
ALTER TYPE "CenterLeadStatus" ADD VALUE IF NOT EXISTS 'WRONG_NUMBER';
ALTER TYPE "CenterLeadStatus" ADD VALUE IF NOT EXISTS 'NOT_INTERESTED';
ALTER TYPE "CenterLeadStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
