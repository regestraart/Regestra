-- Artwork comments table
-- Supports comments on both platform artworks and collection items

CREATE TABLE IF NOT EXISTS public.artwork_comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id   text NOT NULL,           -- artwork ID (platform or collection)
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS artwork_comments_artwork_id_idx ON public.artwork_comments(artwork_id);
CREATE INDEX IF NOT EXISTS artwork_comments_user_id_idx ON public.artwork_comments(user_id);
CREATE INDEX IF NOT EXISTS artwork_comments_created_at_idx ON public.artwork_comments(created_at DESC);

-- RLS
ALTER TABLE public.artwork_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
DROP POLICY IF EXISTS "public_read_artwork_comments" ON public.artwork_comments;
CREATE POLICY "public_read_artwork_comments"
  ON public.artwork_comments FOR SELECT USING (true);

-- Authenticated users can insert their own comments
DROP POLICY IF EXISTS "auth_insert_artwork_comments" ON public.artwork_comments;
CREATE POLICY "auth_insert_artwork_comments"
  ON public.artwork_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
DROP POLICY IF EXISTS "auth_delete_artwork_comments" ON public.artwork_comments;
CREATE POLICY "auth_delete_artwork_comments"
  ON public.artwork_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.artwork_comments;

SELECT 'artwork_comments table created successfully' as result;
