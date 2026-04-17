-- ── Hidden Posts Table ──────────────────────────────────────────────
-- Run this in your Supabase SQL Editor once to enable persistent post hiding.

CREATE TABLE IF NOT EXISTS public.hidden_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, post_id)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS hidden_posts_user_id_idx ON public.hidden_posts(user_id);

-- RLS policies — users can only see and manage their own hidden posts
ALTER TABLE public.hidden_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hidden posts"
    ON public.hidden_posts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can hide posts"
    ON public.hidden_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unhide posts"
    ON public.hidden_posts FOR DELETE
    USING (auth.uid() = user_id);

-- Force API schema reload
NOTIFY pgrst, 'reload schema';

SELECT 'hidden_posts table created successfully.' AS result;
