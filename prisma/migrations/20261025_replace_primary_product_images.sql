-- Replace the primary product photo for 20 catalogue products with the
-- owner-supplied pack photos (added to the repo as /products/<slug>-pack.webp).
--
-- Run AFTER deploying the code that contains the new image files,
-- otherwise the database would point at files that are not live yet.
-- Each update targets the seeded primary ProductImage row by id and
-- keeps it primary. Products not listed keep their existing photo
-- (including PR Drops and Detox Capsule, which share files with two
-- of the replaced products and were intentionally left unchanged).

BEGIN;

UPDATE "ProductImage" SET "imageUrl" = '/products/neuro-care-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_neuro_care'; -- Neuro Care
UPDATE "ProductImage" SET "imageUrl" = '/products/19-berries-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_19_berries'; -- 19 Berries
UPDATE "ProductImage" SET "imageUrl" = '/products/noni-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_noni'; -- Noni
UPDATE "ProductImage" SET "imageUrl" = '/products/h-b-booster-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_h_b_booster'; -- H.B. Booster
UPDATE "ProductImage" SET "imageUrl" = '/products/kidney-reactivator-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_kidney_reactivator'; -- Kidney Reactivator
UPDATE "ProductImage" SET "imageUrl" = '/products/gau-amrit-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_gau_amrit'; -- Gau Amrit
UPDATE "ProductImage" SET "imageUrl" = '/products/purush-rasayan-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_purush_rasayan'; -- Purush Rasayan
UPDATE "ProductImage" SET "imageUrl" = '/products/migraine-care-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_migraine_care'; -- Migraine Care
UPDATE "ProductImage" SET "imageUrl" = '/products/eye-care-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_eye_care'; -- Eye Care
UPDATE "ProductImage" SET "imageUrl" = '/products/wheat-grass-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_wheat_grass'; -- Wheat Grass
UPDATE "ProductImage" SET "imageUrl" = '/products/wheat-grass-with-moringa-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_wheat_grass_with_moringa'; -- Wheat Grass with Moringa
UPDATE "ProductImage" SET "imageUrl" = '/products/castor-oil-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_castor_oil'; -- Castor Oil
UPDATE "ProductImage" SET "imageUrl" = '/products/kalonji-oil-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_kalonji_oil'; -- Kalonji Oil
UPDATE "ProductImage" SET "imageUrl" = '/products/wonder-berries-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_wonder_berries'; -- Wonder Berries
UPDATE "ProductImage" SET "imageUrl" = '/products/lungs-cleaner-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_lungs_cleaner'; -- Lungs Cleaner
UPDATE "ProductImage" SET "imageUrl" = '/products/fat-melter-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_fat_melter'; -- Fat Melter
UPDATE "ProductImage" SET "imageUrl" = '/products/detox-syrup-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_detox_syrup'; -- Detox Syrup
UPDATE "ProductImage" SET "imageUrl" = '/products/pc-9-piles-care-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_pc_9_piles_care'; -- PC-9 (Piles Care)
UPDATE "ProductImage" SET "imageUrl" = '/products/flax-oil-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_flax_oil'; -- Flax Oil
UPDATE "ProductImage" SET "imageUrl" = '/products/neem-oil-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_neem_oil'; -- Neem Oil

-- The Herbal Oils category card used Castor Oil's previous photo.
UPDATE "Category" SET "imageUrl" = '/products/castor-oil-pack.webp', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'cat_herbal_oils' AND "imageUrl" = '/products/pdf-p10-i1.webp';

COMMIT;

-- Verification: expected 20 of 20 seeded primary images on new pack files.
SELECT
  COUNT(*)::int AS "checkedImages",
  COUNT(*) FILTER (WHERE "imageUrl" LIKE '%/products/%-pack.webp')::int AS "onNewPackPhoto"
FROM "ProductImage"
WHERE "id" IN ('pdfimg_neuro_care', 'pdfimg_19_berries', 'pdfimg_noni', 'pdfimg_h_b_booster', 'pdfimg_kidney_reactivator', 'pdfimg_gau_amrit', 'pdfimg_purush_rasayan', 'pdfimg_migraine_care', 'pdfimg_eye_care', 'pdfimg_wheat_grass', 'pdfimg_wheat_grass_with_moringa', 'pdfimg_castor_oil', 'pdfimg_kalonji_oil', 'pdfimg_wonder_berries', 'pdfimg_lungs_cleaner', 'pdfimg_fat_melter', 'pdfimg_detox_syrup', 'pdfimg_pc_9_piles_care', 'pdfimg_flax_oil', 'pdfimg_neem_oil');
