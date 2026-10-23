-- Homepage hero redesign: optional secondary call-to-action on banners.
-- Required for databases created before 2026-10-22 (fresh setups get these
-- columns from prisma/neon-setup.sql). Safe to run more than once.
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "secondaryCtaText" TEXT;
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "secondaryCtaLink" TEXT;
