-- ============================================================
-- STEP 1: Run this entire block in Supabase → SQL Editor
-- ============================================================

-- 1a. Add missing pricing/listing columns (safe – skips if already present)
ALTER TABLE artworks
  ADD COLUMN IF NOT EXISTS price         NUMERIC        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_price_visible BOOLEAN    DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS listed_for_sale  BOOLEAN    DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS list_price    NUMERIC        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS listing_status  TEXT        DEFAULT NULL
    CHECK (listing_status IN ('active', 'sold')),
  ADD COLUMN IF NOT EXISTS sold_at       TIMESTAMPTZ   DEFAULT NULL;

-- 1b. Backfill: mark existing listed rows as 'active' if status is still null
UPDATE artworks
SET listing_status = 'active'
WHERE listed_for_sale = TRUE
  AND listing_status IS NULL;

-- 1c. Efficient index for marketplace queries
CREATE INDEX IF NOT EXISTS idx_artworks_marketplace
  ON artworks (listed_for_sale, listing_status)
  WHERE listed_for_sale = TRUE;

-- ============================================================
-- STEP 2: Refresh PostgREST schema cache
-- (PostgREST / Supabase API won't see new columns until this runs)
-- ============================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Done. After running:
--   • Go to Supabase Dashboard → Settings → API
--   • Click "Reload schema cache" button (belt-and-suspenders)
--   • Then hard-refresh your app (Ctrl+Shift+R)
-- ============================================================
