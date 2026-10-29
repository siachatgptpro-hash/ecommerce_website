-- Replace the primary product photo for 40 catalogue products with the
-- owner-supplied pack photos (added to the repo as /products/<slug>-pack.webp).
--
-- Run AFTER deploying the code that contains the new image files,
-- otherwise the database would point at files that are not live yet.
-- Each update targets the seeded primary ProductImage row by id and
-- keeps it primary, so running this file twice is harmless. Products
-- not listed keep their existing photo (including PR Drops, which
-- shares its old file with Purush Rasayan and has no new photo yet).

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
UPDATE "ProductImage" SET "imageUrl" = '/products/heart-fit-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_heart_fit'; -- Heart Fit
UPDATE "ProductImage" SET "imageUrl" = '/products/grape-seed-extract-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_grape_seed_extract'; -- Grape Seed Extract
UPDATE "ProductImage" SET "imageUrl" = '/products/kwach-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_kwach_capsule'; -- Kwach Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/ashwagandha-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_ashwagandha_capsule'; -- Ashwagandha Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/gokhru-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_gokhru_capsule'; -- Gokhru Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/neem-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_neem_capsule'; -- Neem Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/shatawari-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_shatawari_capsule'; -- Shatawari Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/bhumi-amla-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_bhumi_amla_capsule'; -- Bhumi Amla Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/punarnava-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_punarnava_capsule'; -- Punarnava Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/arjun-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_arjun_capsule'; -- Arjun Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/gymnema-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_gymnema_capsule'; -- Gymnema Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/dhamasa-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_dhamasa_capsule'; -- Dhamasa Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/spirulina-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_spirulina_capsule'; -- Spirulina Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/curcumin-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_curcumin_capsule'; -- Curcumin Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/sea-buckthorn-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_sea_buckthorn_capsule'; -- Sea Buckthorn Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/liv-ca-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_liv_ca_capsule'; -- Liv CA Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/allicin-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_allicin_capsule'; -- Allicin Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/silymarine-milk-thistle-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_silymarine_milk_thistle_capsule'; -- Silymarine Milk Thistle Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/resurrection-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_resurrection_capsule'; -- Resurrection Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/detox-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_detox_capsule'; -- Detox Capsule

-- Category cards that used a replaced product's previous photo.
UPDATE "Category" SET "imageUrl" = '/products/castor-oil-pack.webp', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'cat_herbal_oils' AND "imageUrl" = '/products/pdf-p10-i1.webp';
UPDATE "Category" SET "imageUrl" = '/products/arjun-capsule-pack.webp', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'cat_capsules' AND "imageUrl" = '/products/pdf-p13-i2.webp'; -- card used Arjun Capsule's photo

COMMIT;

-- Verification: expected 40 of 40 seeded primary images on new pack files.
SELECT
  COUNT(*)::int AS "checkedImages",
  COUNT(*) FILTER (WHERE "imageUrl" LIKE '%/products/%-pack.webp')::int AS "onNewPackPhoto"
FROM "ProductImage"
WHERE "id" IN ('pdfimg_neuro_care', 'pdfimg_19_berries', 'pdfimg_noni', 'pdfimg_h_b_booster', 'pdfimg_kidney_reactivator', 'pdfimg_gau_amrit', 'pdfimg_purush_rasayan', 'pdfimg_migraine_care', 'pdfimg_eye_care', 'pdfimg_wheat_grass', 'pdfimg_wheat_grass_with_moringa', 'pdfimg_castor_oil', 'pdfimg_kalonji_oil', 'pdfimg_wonder_berries', 'pdfimg_lungs_cleaner', 'pdfimg_fat_melter', 'pdfimg_detox_syrup', 'pdfimg_pc_9_piles_care', 'pdfimg_flax_oil', 'pdfimg_neem_oil', 'pdfimg_heart_fit', 'pdfimg_grape_seed_extract', 'pdfimg_kwach_capsule', 'pdfimg_ashwagandha_capsule', 'pdfimg_gokhru_capsule', 'pdfimg_neem_capsule', 'pdfimg_shatawari_capsule', 'pdfimg_bhumi_amla_capsule', 'pdfimg_punarnava_capsule', 'pdfimg_arjun_capsule', 'pdfimg_gymnema_capsule', 'pdfimg_dhamasa_capsule', 'pdfimg_spirulina_capsule', 'pdfimg_curcumin_capsule', 'pdfimg_sea_buckthorn_capsule', 'pdfimg_liv_ca_capsule', 'pdfimg_allicin_capsule', 'pdfimg_silymarine_milk_thistle_capsule', 'pdfimg_resurrection_capsule', 'pdfimg_detox_capsule');
