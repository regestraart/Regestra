-- ============================================================
-- Regestra Recommendation Engine Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add preferences to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- 2. Artwork interactions table (tracks engagement for learning)
CREATE TABLE IF NOT EXISTS public.artwork_interactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artwork_id    text NOT NULL,
  artwork_tags  text[] DEFAULT '{}',
  action        text NOT NULL, -- 'like' | 'view' | 'skip' | 'connect' | 'save'
  duration_ms   integer,       -- how long they viewed it
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_user_id_idx     ON public.artwork_interactions(user_id);
CREATE INDEX IF NOT EXISTS ai_artwork_id_idx  ON public.artwork_interactions(artwork_id);
CREATE INDEX IF NOT EXISTS ai_action_idx      ON public.artwork_interactions(action);
CREATE INDEX IF NOT EXISTS ai_created_at_idx  ON public.artwork_interactions(created_at DESC);

-- 3. Recommendation cache table
CREATE TABLE IF NOT EXISTS public.recommendation_cache (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recommended_artist_ids  text[] DEFAULT '{}',
  recommended_artwork_ids text[] DEFAULT '{}',
  reasoning     jsonb DEFAULT '[]', -- AI explanations
  generated_at  timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '6 hours'),
  UNIQUE(user_id)
);

-- 4. RLS
ALTER TABLE public.artwork_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_interactions" ON public.artwork_interactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_own_recommendations" ON public.recommendation_cache
  FOR ALL USING (auth.uid() = user_id);

-- 5. Function to get tag-matched artists for a user
CREATE OR REPLACE FUNCTION public.get_tag_matched_artists(
  p_user_id uuid,
  p_limit int DEFAULT 20
) RETURNS TABLE (
  artist_id text,
  match_score int
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tags text[];
BEGIN
  -- Get user's preferred tags from preferences
  SELECT ARRAY(
    SELECT jsonb_array_elements_text(preferences->'styles') 
    FROM profiles WHERE id = p_user_id
    UNION
    SELECT jsonb_array_elements_text(preferences->'themes')
    FROM profiles WHERE id = p_user_id
  ) INTO v_tags;

  IF v_tags IS NULL OR array_length(v_tags, 1) = 0 THEN
    -- No preferences yet — return recent artists
    RETURN QUERY
      SELECT a.artist_id::text, 0 as match_score
      FROM artworks a
      WHERE a.artist_id::text != p_user_id::text
        AND a.profile_visible = true
      GROUP BY a.artist_id
      ORDER BY MAX(a.created_at) DESC
      LIMIT p_limit;
    RETURN;
  END IF;

  -- Return artists scored by tag overlap
  RETURN QUERY
    SELECT 
      a.artist_id::text,
      COUNT(*)::int as match_score
    FROM artworks a, unnest(a.tags) tag
    WHERE tag = ANY(v_tags)
      AND a.artist_id::text != p_user_id::text
      AND a.profile_visible = true
    GROUP BY a.artist_id
    ORDER BY match_score DESC
    LIMIT p_limit;
END;
$$;

SELECT 'Recommendation engine migration complete' as result;
