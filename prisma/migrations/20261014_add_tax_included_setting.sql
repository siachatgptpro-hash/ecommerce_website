-- Store-level tax display policy. Existing orders and catalog records are untouched.
-- This setting keeps listed product prices and checkout tax presentation explicit.
INSERT INTO "BusinessSetting" ("id", "key", "value", "description", "isPublic", "updatedAt")
VALUES (
  'set_tax_included',
  'TAX_INCLUDED',
  'true',
  'Whether listed prices include applicable taxes/GST; confirm with the business tax owner before changing.',
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
