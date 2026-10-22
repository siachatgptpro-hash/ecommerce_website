-- Adds the carrier tracking URL that the admin order screen collects.
-- Previously the value was accepted by the UI but silently discarded
-- because no column existed to store it.
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "trackingUrl" TEXT;
