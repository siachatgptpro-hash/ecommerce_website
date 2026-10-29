-- Replace the primary product photo for 72 catalogue products with the
-- owner-supplied pack photos (added to the repo as /products/<slug>-pack.webp).
--
-- Run AFTER deploying the code that contains the new image files,
-- otherwise the database would point at files that are not live yet.
-- Each update targets the seeded primary ProductImage row by id and
-- keeps it primary, so running this file twice is harmless. Products
-- not listed keep their existing photo.

BEGIN;

UPDATE "ProductImage" SET "imageUrl" = '/products/aloe-vera-with-honey-amla-tulsi-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_aloe_vera_with_honey_amla_tulsi'; -- Aloe Vera with Honey, Amla & Tulsi
UPDATE "ProductImage" SET "imageUrl" = '/products/aloe-vera-juice-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_aloe_vera_juice'; -- Aloe Vera Juice
UPDATE "ProductImage" SET "imageUrl" = '/products/amrit-ras-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_amrit_ras'; -- Amrit Ras
UPDATE "ProductImage" SET "imageUrl" = '/products/anti-diabetes-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_anti_diabetes'; -- Anti Diabetes
UPDATE "ProductImage" SET "imageUrl" = '/products/arjun-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_arjun_capsule'; -- Arjun Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/allicin-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_allicin_capsule'; -- Allicin Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/amla-ras-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_amla_ras'; -- Amla Ras
UPDATE "ProductImage" SET "imageUrl" = '/products/ashwagandha-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_ashwagandha_capsule'; -- Ashwagandha Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/ajwain-ark-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_ajwain_ark'; -- Ajwain Ark
UPDATE "ProductImage" SET "imageUrl" = '/products/bhumi-punarnava-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_bhumi_punarnava'; -- Bhumi Punarnava
UPDATE "ProductImage" SET "imageUrl" = '/products/bhumi-amla-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_bhumi_amla_capsule'; -- Bhumi Amla Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/cough-care-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_cough_care'; -- Cough Care
UPDATE "ProductImage" SET "imageUrl" = '/products/castor-oil-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_castor_oil'; -- Castor Oil
UPDATE "ProductImage" SET "imageUrl" = '/products/chyawanprash-kesar-yukta-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_chyawanprash_kesar_yukta'; -- Chyawanprash Kesar Yukta
UPDATE "ProductImage" SET "imageUrl" = '/products/curcumin-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_curcumin_capsule'; -- Curcumin Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/cumin-ark-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_cumin_ark'; -- Cumin Ark
UPDATE "ProductImage" SET "imageUrl" = '/products/dento-strong-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_dento_strong'; -- Dento Strong
UPDATE "ProductImage" SET "imageUrl" = '/products/detox-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_detox_capsule'; -- Detox Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/detox-syrup-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_detox_syrup'; -- Detox Syrup
UPDATE "ProductImage" SET "imageUrl" = '/products/dhamasa-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_dhamasa_capsule'; -- Dhamasa Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/eye-care-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_eye_care'; -- Eye Care
UPDATE "ProductImage" SET "imageUrl" = '/products/flax-seeds-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_flax_seeds'; -- Flax Seeds
UPDATE "ProductImage" SET "imageUrl" = '/products/flax-oil-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_flax_oil'; -- Flax Oil
UPDATE "ProductImage" SET "imageUrl" = '/products/fat-melter-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_fat_melter'; -- Fat Melter
UPDATE "ProductImage" SET "imageUrl" = '/products/gastro-sanjivani-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_gastro_sanjivani'; -- Gastro Sanjivani
UPDATE "ProductImage" SET "imageUrl" = '/products/grape-seed-extract-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_grape_seed_extract'; -- Grape Seed Extract
UPDATE "ProductImage" SET "imageUrl" = '/products/green-tea-tablet-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_green_tea_tablet'; -- Green Tea Tablet
UPDATE "ProductImage" SET "imageUrl" = '/products/gokhru-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_gokhru_capsule'; -- Gokhru Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/gymnema-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_gymnema_capsule'; -- Gymnema Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/gau-amrit-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_gau_amrit'; -- Gau Amrit
UPDATE "ProductImage" SET "imageUrl" = '/products/h-b-booster-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_h_b_booster'; -- H.B. Booster
UPDATE "ProductImage" SET "imageUrl" = '/products/heart-fit-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_heart_fit'; -- Heart Fit
UPDATE "ProductImage" SET "imageUrl" = '/products/ib-9-drop-immunity-drops-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_ib_9_drop_immunity_drops'; -- IB-9 Drop (Immunity Drops)
UPDATE "ProductImage" SET "imageUrl" = '/products/joint-tablet-premium-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_joint_tablet_premium'; -- Joint Tablet Premium
UPDATE "ProductImage" SET "imageUrl" = '/products/kalonji-oil-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_kalonji_oil'; -- Kalonji Oil
UPDATE "ProductImage" SET "imageUrl" = '/products/kidney-reactivator-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_kidney_reactivator'; -- Kidney Reactivator
UPDATE "ProductImage" SET "imageUrl" = '/products/kwach-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_kwach_capsule'; -- Kwach Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/lungs-cleaner-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_lungs_cleaner'; -- Lungs Cleaner
UPDATE "ProductImage" SET "imageUrl" = '/products/liv-ca-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_liv_ca_capsule'; -- Liv CA Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/memory-booster-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_memory_booster'; -- Memory Booster
UPDATE "ProductImage" SET "imageUrl" = '/products/miracle-roots-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_miracle_roots'; -- Miracle Roots
UPDATE "ProductImage" SET "imageUrl" = '/products/musheal-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_musheal_capsule'; -- Musheal Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/migraine-care-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_migraine_care'; -- Migraine Care
UPDATE "ProductImage" SET "imageUrl" = '/products/neem-oil-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_neem_oil'; -- Neem Oil
UPDATE "ProductImage" SET "imageUrl" = '/products/neuro-care-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_neuro_care'; -- Neuro Care
UPDATE "ProductImage" SET "imageUrl" = '/products/noni-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_noni'; -- Noni
UPDATE "ProductImage" SET "imageUrl" = '/products/neem-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_neem_capsule'; -- Neem Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/pc-9-piles-care-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_pc_9_piles_care'; -- PC-9 (Piles Care)
UPDATE "ProductImage" SET "imageUrl" = '/products/punarnava-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_punarnava_capsule'; -- Punarnava Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/purush-rasayan-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_purush_rasayan'; -- Purush Rasayan
UPDATE "ProductImage" SET "imageUrl" = '/products/panch-tulsi-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_panch_tulsi'; -- Panch Tulsi
UPDATE "ProductImage" SET "imageUrl" = '/products/power-tulsi-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_power_tulsi'; -- Power Tulsi
UPDATE "ProductImage" SET "imageUrl" = '/products/pr-drops-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_pr_drops'; -- PR Drops
UPDATE "ProductImage" SET "imageUrl" = '/products/renal-fit-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_renal_fit_capsule'; -- Renal Fit Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/resurrection-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_resurrection_capsule'; -- Resurrection Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/saunf-ark-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_saunf_ark'; -- Saunf Ark
UPDATE "ProductImage" SET "imageUrl" = '/products/skin-ark-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_skin_ark'; -- Skin Ark
UPDATE "ProductImage" SET "imageUrl" = '/products/skin-oil-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_skin_oil'; -- Skin Oil
UPDATE "ProductImage" SET "imageUrl" = '/products/stone-away-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_stone_away'; -- Stone Away
UPDATE "ProductImage" SET "imageUrl" = '/products/sarva-dhatu-pushti-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_sarva_dhatu_pushti'; -- Sarva Dhatu Pushti
UPDATE "ProductImage" SET "imageUrl" = '/products/sea-buckthorn-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_sea_buckthorn_capsule'; -- Sea Buckthorn Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/shatawari-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_shatawari_capsule'; -- Shatawari Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/silymarine-milk-thistle-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_silymarine_milk_thistle_capsule'; -- Silymarine Milk Thistle Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/spirulina-capsule-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_spirulina_capsule'; -- Spirulina Capsule
UPDATE "ProductImage" SET "imageUrl" = '/products/stevia-drop-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_stevia_drop'; -- Stevia Drop
UPDATE "ProductImage" SET "imageUrl" = '/products/sugar-normal-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_sugar_normal'; -- Sugar Normal
UPDATE "ProductImage" SET "imageUrl" = '/products/thyro-booster-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_thyro_booster'; -- Thyro Booster
UPDATE "ProductImage" SET "imageUrl" = '/products/triphala-ras-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_triphala_ras'; -- Triphala Ras
UPDATE "ProductImage" SET "imageUrl" = '/products/19-berries-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_19_berries'; -- 19 Berries
UPDATE "ProductImage" SET "imageUrl" = '/products/wheat-grass-with-moringa-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_wheat_grass_with_moringa'; -- Wheat Grass with Moringa
UPDATE "ProductImage" SET "imageUrl" = '/products/wheat-grass-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_wheat_grass'; -- Wheat Grass
UPDATE "ProductImage" SET "imageUrl" = '/products/wonder-berries-pack.webp', "isPrimary" = TRUE WHERE "id" = 'pdfimg_wonder_berries'; -- Wonder Berries

-- Category cards that used a replaced product's previous photo.
UPDATE "Category" SET "imageUrl" = '/products/castor-oil-pack.webp', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'cat_herbal_oils' AND "imageUrl" = '/products/pdf-p10-i1.webp'; -- card used Castor Oil's photo
UPDATE "Category" SET "imageUrl" = '/products/arjun-capsule-pack.webp', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'cat_capsules' AND "imageUrl" = '/products/pdf-p13-i2.webp'; -- card used Arjun Capsule's photo
UPDATE "Category" SET "imageUrl" = '/products/aloe-vera-with-honey-amla-tulsi-pack.webp', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'cat_syrups_juices' AND "imageUrl" = '/products/pdf-p4-i9.webp'; -- card used Aloe Vera with Honey, Amla & Tulsi's photo
UPDATE "Category" SET "imageUrl" = '/products/dento-strong-pack.webp', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'cat_personal_care' AND "imageUrl" = '/products/pdf-p15-i4.webp'; -- card used Dento Strong's photo
UPDATE "Category" SET "imageUrl" = '/products/ajwain-ark-pack.webp', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'cat_arks_drops' AND "imageUrl" = '/products/pdf-p3-i8.webp'; -- card used Ajwain Ark's photo
UPDATE "Category" SET "imageUrl" = '/products/chyawanprash-kesar-yukta-pack.webp', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'cat_immunity_rasayana' AND "imageUrl" = '/products/pdf-p15-i3.webp'; -- card used Chyawanprash Kesar Yukta's photo

COMMIT;

-- Verification: expected 72 of 72 seeded primary images on new pack files.
SELECT
  COUNT(*)::int AS "checkedImages",
  COUNT(*) FILTER (WHERE "imageUrl" LIKE '%/products/%-pack.webp')::int AS "onNewPackPhoto"
FROM "ProductImage"
WHERE "id" IN ('pdfimg_aloe_vera_with_honey_amla_tulsi', 'pdfimg_aloe_vera_juice', 'pdfimg_amrit_ras', 'pdfimg_anti_diabetes', 'pdfimg_arjun_capsule', 'pdfimg_allicin_capsule', 'pdfimg_amla_ras', 'pdfimg_ashwagandha_capsule', 'pdfimg_ajwain_ark', 'pdfimg_bhumi_punarnava', 'pdfimg_bhumi_amla_capsule', 'pdfimg_cough_care', 'pdfimg_castor_oil', 'pdfimg_chyawanprash_kesar_yukta', 'pdfimg_curcumin_capsule', 'pdfimg_cumin_ark', 'pdfimg_dento_strong', 'pdfimg_detox_capsule', 'pdfimg_detox_syrup', 'pdfimg_dhamasa_capsule', 'pdfimg_eye_care', 'pdfimg_flax_seeds', 'pdfimg_flax_oil', 'pdfimg_fat_melter', 'pdfimg_gastro_sanjivani', 'pdfimg_grape_seed_extract', 'pdfimg_green_tea_tablet', 'pdfimg_gokhru_capsule', 'pdfimg_gymnema_capsule', 'pdfimg_gau_amrit', 'pdfimg_h_b_booster', 'pdfimg_heart_fit', 'pdfimg_ib_9_drop_immunity_drops', 'pdfimg_joint_tablet_premium', 'pdfimg_kalonji_oil', 'pdfimg_kidney_reactivator', 'pdfimg_kwach_capsule', 'pdfimg_lungs_cleaner', 'pdfimg_liv_ca_capsule', 'pdfimg_memory_booster', 'pdfimg_miracle_roots', 'pdfimg_musheal_capsule', 'pdfimg_migraine_care', 'pdfimg_neem_oil', 'pdfimg_neuro_care', 'pdfimg_noni', 'pdfimg_neem_capsule', 'pdfimg_pc_9_piles_care', 'pdfimg_punarnava_capsule', 'pdfimg_purush_rasayan', 'pdfimg_panch_tulsi', 'pdfimg_power_tulsi', 'pdfimg_pr_drops', 'pdfimg_renal_fit_capsule', 'pdfimg_resurrection_capsule', 'pdfimg_saunf_ark', 'pdfimg_skin_ark', 'pdfimg_skin_oil', 'pdfimg_stone_away', 'pdfimg_sarva_dhatu_pushti', 'pdfimg_sea_buckthorn_capsule', 'pdfimg_shatawari_capsule', 'pdfimg_silymarine_milk_thistle_capsule', 'pdfimg_spirulina_capsule', 'pdfimg_stevia_drop', 'pdfimg_sugar_normal', 'pdfimg_thyro_booster', 'pdfimg_triphala_ras', 'pdfimg_19_berries', 'pdfimg_wheat_grass_with_moringa', 'pdfimg_wheat_grass', 'pdfimg_wonder_berries');
