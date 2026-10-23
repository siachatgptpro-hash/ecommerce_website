-- Admin-uploaded images stored in PostgreSQL/Neon instead of Vercel Blob.
-- POST /api/admin/uploads writes JPG/PNG/WEBP bytes here; the storefront
-- reads them back through GET /api/uploads/<id>. Fresh installs also get
-- this table from prisma/neon-setup.sql. Safe to re-run.
CREATE TABLE IF NOT EXISTS "UploadedFile" (
  "id" TEXT PRIMARY KEY,
  "filename" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "uploadedById" TEXT REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "UploadedFile_createdAt_idx" ON "UploadedFile" ("createdAt");
