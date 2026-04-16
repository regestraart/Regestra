-- ============================================================
-- Regestra Admin Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add is_admin column to profiles (safe – skips if it already exists)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Mark YOUR account as admin  (replace the email below)
UPDATE profiles
SET is_admin = true
WHERE email = 'YOUR_EMAIL_HERE';

-- ============================================================
-- 3. SECURITY DEFINER function: admin_metrics
--    • Checks that the calling user has is_admin = true
--    • Returns a single JSON object with all platform metrics
--    • Non-admins receive a permission-denied exception
-- ============================================================
CREATE OR REPLACE FUNCTION admin_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_result   JSON;
BEGIN
  -- Guard: must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Guard: must be admin
  SELECT is_admin INTO v_is_admin
  FROM profiles
  WHERE id = auth.uid();

  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Permission denied: admin access required';
  END IF;

  -- Build metrics object
  SELECT json_build_object(

    -- ── A. Users ──────────────────────────────────────────
    'total_users',          (SELECT COUNT(*)  FROM profiles),
    'new_users_7d',         (SELECT COUNT(*)  FROM profiles WHERE created_at >= NOW() - INTERVAL '7 days'),
    'new_users_30d',        (SELECT COUNT(*)  FROM profiles WHERE created_at >= NOW() - INTERVAL '30 days'),
    'artists_count',        (SELECT COUNT(*)  FROM profiles WHERE role = 'artist'),
    'art_lovers_count',     (SELECT COUNT(*)  FROM profiles WHERE role = 'artLover'),

    -- ── B. Activation & Content ───────────────────────────
    'total_artworks',       (SELECT COUNT(*)  FROM artworks),
    'artworks_7d',          (SELECT COUNT(*)  FROM artworks WHERE created_at >= NOW() - INTERVAL '7 days'),
    'artists_with_artwork', (SELECT COUNT(DISTINCT artist_id) FROM artworks),
    'avg_artworks_per_artist', (
      SELECT ROUND(
        CASE WHEN COUNT(DISTINCT artist_id) = 0 THEN 0
             ELSE COUNT(*)::NUMERIC / COUNT(DISTINCT artist_id)
        END, 1
      )
      FROM artworks
    ),

    -- ── C. Social & Engagement ────────────────────────────
    'total_posts',          (SELECT COUNT(*)  FROM social_posts),
    'posts_7d',             (SELECT COUNT(*)  FROM social_posts WHERE created_at >= NOW() - INTERVAL '7 days'),
    'total_likes',          (SELECT COUNT(*)  FROM likes),
    'total_comments',       (SELECT COUNT(*)  FROM social_comments),

    -- ── D. Messaging ──────────────────────────────────────
    'total_conversations',  (SELECT COUNT(*)  FROM conversations),
    'conversations_7d',     (SELECT COUNT(*)  FROM conversations WHERE created_at >= NOW() - INTERVAL '7 days'),
    'total_messages',       (SELECT COUNT(*)  FROM messages),
    'messages_7d',          (SELECT COUNT(*)  FROM messages WHERE created_at >= NOW() - INTERVAL '7 days'),

    -- ── E. Marketplace ────────────────────────────────────
    'artworks_with_price',          (SELECT COUNT(*) FROM artworks WHERE price IS NOT NULL),
    'artworks_price_visible',       (SELECT COUNT(*) FROM artworks WHERE is_price_visible = TRUE),
    'artworks_listed_for_sale',     (SELECT COUNT(*) FROM artworks WHERE listed_for_sale = TRUE),
    'artworks_status_active',       (SELECT COUNT(*) FROM artworks WHERE listing_status = 'active'),
    'artworks_status_sold',         (SELECT COUNT(*) FROM artworks WHERE listing_status = 'sold')

  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users only
-- (the function itself checks is_admin, so non-admins still get denied)
REVOKE ALL ON FUNCTION admin_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_metrics() TO authenticated;


-- ============================================================
-- 4. RLS policies for profiles – add admin self-read policy
--    (existing policies are NOT dropped)
-- ============================================================

-- Allow admins to read all profiles (needed if you expand admin later)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'admin_read_all_profiles'
  ) THEN
    CREATE POLICY admin_read_all_profiles ON profiles
      FOR SELECT
      USING (
        (SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE
      );
  END IF;
END $$;


-- ============================================================
-- 5. Verification queries (run these to confirm setup)
-- ============================================================

-- Confirm column exists:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles' AND column_name = 'is_admin';

-- Confirm your account is admin:
-- SELECT id, email, is_admin FROM profiles WHERE email = 'YOUR_EMAIL_HERE';

-- Test metrics function (run while logged in as admin via Supabase client):
-- SELECT admin_metrics();
