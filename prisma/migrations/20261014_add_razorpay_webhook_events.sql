-- Apply this migration to staging before deploying webhook idempotency changes.
CREATE TABLE IF NOT EXISTS "RazorpayWebhookEvent" (
  "id" TEXT PRIMARY KEY,
  "event" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PROCESSING',
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "error" TEXT
);
CREATE INDEX IF NOT EXISTS "RazorpayWebhookEvent_event_idx" ON "RazorpayWebhookEvent" ("event");
CREATE INDEX IF NOT EXISTS "RazorpayWebhookEvent_status_idx" ON "RazorpayWebhookEvent" ("status");
