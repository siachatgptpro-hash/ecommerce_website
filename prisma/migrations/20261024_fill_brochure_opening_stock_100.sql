-- Owner-approved opening stock for the brochure catalogue.
--
-- The supplied 16-page PDF was checked page by page. Its price list contains
-- product, pack size, MRP and page number only; it does not contain inventory
-- quantities. On 2026-10-24 the owner approved an opening balance of exactly
-- 100 units for every brochure pack variant in Neon.
--
-- Existing-database use:
--   Run once to set each brochure variant (IDs beginning with pdfv_) to 100
--   and write a matching InventoryLedger audit row. The shared reference
--   OPENING_STOCK_100_20261024 makes this safe to re-run: variants that
--   already received this opening balance are skipped, so later sales or
--   manual corrections are not reset by a duplicate run.
--
-- Fresh databases created from the updated prisma/neon-setup.sql already
-- contain the same opening-stock marker and need no separate action.

BEGIN;

-- Never create the impossible state reservedQuantity > stockQuantity. The
-- current seeded database has no reservations, so this is a launch guard.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ProductVariant"
    WHERE starts_with("id", 'pdfv_')
      AND "reservedQuantity" > 100
  ) THEN
    RAISE EXCEPTION 'Opening stock was not changed: at least one brochure variant has more than 100 reserved units. Resolve/release those checkout reservations first.';
  END IF;
END $$;

-- Lock the brochure variants in a stable order before reading their previous
-- balances, so each ledger delta matches the row actually updated below.
SELECT "id"
FROM "ProductVariant"
WHERE starts_with("id", 'pdfv_')
ORDER BY "id"
FOR UPDATE;

WITH eligible AS MATERIALIZED (
  SELECT
    v."id" AS "id",
    v."stockQuantity" AS "previousQty"
  FROM "ProductVariant" v
  WHERE starts_with(v."id", 'pdfv_')
    AND NOT EXISTS (
      SELECT 1
      FROM "InventoryLedger" l
      WHERE l."variantId" = v."id"
        AND l."referenceId" = 'OPENING_STOCK_100_20261024'
    )
),
updated AS (
  UPDATE "ProductVariant" v
  SET
    "stockQuantity" = 100,
    "updatedAt" = CURRENT_TIMESTAMP
  FROM eligible e
  WHERE v."id" = e."id"
  RETURNING
    v."id" AS "id",
    v."stockQuantity" AS "resultingQty"
)
INSERT INTO "InventoryLedger" (
  "id",
  "variantId",
  "changeQty",
  "resultingQty",
  "reason",
  "referenceId",
  "notes",
  "createdAt"
)
SELECT
  'inv_' || u."id" || '_opening_100',
  u."id",
  100 - e."previousQty",
  u."resultingQty",
  'STOCK_AUDIT_ADJUSTMENT'::"InventoryChangeReason",
  'OPENING_STOCK_100_20261024',
  'Owner-approved opening stock target: 100 units (2026-10-24). Previous balance: '
    || e."previousQty"
    || '. Quantity supplied by owner; PDF contains pack and MRP data only.',
  CURRENT_TIMESTAMP
FROM updated u
JOIN eligible e ON e."id" = u."id"
ON CONFLICT ("id") DO NOTHING;

COMMIT;

-- Verification (expected immediately after first application on the current
-- catalogue: totalBrochureVariants=101, variantsAt100=101,
-- openingStockLedgerRows=101). On a later re-run, variantsAt100 may be lower
-- because legitimate sales/manual adjustments after opening are preserved.
SELECT
  COUNT(*)::int AS "totalBrochureVariants",
  COUNT(*) FILTER (WHERE "stockQuantity" = 100)::int AS "variantsAt100",
  COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1
      FROM "InventoryLedger" l
      WHERE l."variantId" = v."id"
        AND l."referenceId" = 'OPENING_STOCK_100_20261024'
    )
  )::int AS "openingStockLedgerRows",
  COALESCE(MIN("stockQuantity"), 0)::int AS "minimumStock",
  COALESCE(MAX("stockQuantity"), 0)::int AS "maximumStock"
FROM "ProductVariant" v
WHERE starts_with(v."id", 'pdfv_');
