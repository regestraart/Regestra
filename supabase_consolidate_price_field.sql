-- ════════════════════════════════════════════════════════════════════════════
-- REGESTRA — Consolidate to single price field (v24)
-- Run this in Supabase SQL Editor once.
--
-- What this does:
--   1. Ensures `price` column exists (it should already).
--   2. Ensures `is_price_visible` column exists.
--   3. Back-fills `price` from `list_price` where list_price is set and
--      price is null (covers artworks uploaded before this migration).
--   4. Does NOT drop `list_price` yet — safe non-destructive migration.
--   5. Forces PostgREST schema cache reload.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Ensure canonical price columns exist
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS price            numeric(10,2);
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS is_price_visible boolean NOT NULL DEFAULT true;

-- 2. Back-fill: copy list_price → price for any rows where price is null
--    but list_price was set (legacy uploads before this migration).
UPDATE public.artworks
SET    price = list_price
WHERE  list_price IS NOT NULL
  AND  price IS NULL;

-- 3. Ensure for-sale listings have is_price_visible = true
--    (business rule: listed items always show their price)
UPDATE public.artworks
SET    is_price_visible = true
WHERE  listed_for_sale = true
  AND  is_price_visible = false;

-- 4. list_price column is now deprecated.
--    The app no longer reads or writes it. You can DROP it in a future
--    cleanup migration once you've confirmed everything is stable:
--
--    ALTER TABLE public.artworks DROP COLUMN IF EXISTS list_price;
--
--    Do NOT run that line yet — keeping it is safe and reversible.

-- 5. Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Price field consolidation migration complete.' AS result;
