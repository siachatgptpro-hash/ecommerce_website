-- Newsletter subscribers captured by the footer "Stay Updated" form (POST /api/newsletter).
-- Apply to existing databases before deploying the footer redesign; fresh installs
-- get this table from prisma/neon-setup.sql.
CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key" ON "NewsletterSubscriber" ("email");
