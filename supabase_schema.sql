-- 
-- Master Schema & Migration for Regestra (V7 - Robust Migration)
-- Run this in the Supabase SQL Editor to provision OR repair your database.
--

-- 1. Setup Custom Types (Defensive)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('artist', 'artLover');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commission_status_enum') THEN
        CREATE TYPE public.commission_status_enum AS ENUM ('Open', 'Closed', 'Not Available');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'follow_status') THEN
        CREATE TYPE public.follow_status AS ENUM ('pending', 'accepted');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE public.notification_type AS ENUM ('like', 'comment', 'follow', 'connect_request', 'message');
    END IF;
END $$;

-- 2. Tables & Column Migrations
-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'artLover';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commission_status public.commission_status_enum DEFAULT 'Not Available';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS collections jsonb DEFAULT '[]'::jsonb;
DO $$ BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Artworks
CREATE TABLE IF NOT EXISTS public.artworks (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Untitled';
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT '';
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS price numeric(10,2);
-- Changed default to true
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS is_price_visible boolean NOT NULL DEFAULT true;

-- Social Posts
CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS article_url text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS article_title text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS article_description text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS article_image text;

-- Social Comments
CREATE TABLE IF NOT EXISTS public.social_comments (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.social_posts ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Likes
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  post_id uuid REFERENCES public.social_posts ON DELETE CASCADE,
  artwork_id uuid REFERENCES public.artworks ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  type public.notification_type NOT NULL DEFAULT 'follow',
  content text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Follows
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status public.follow_status NOT NULL DEFAULT 'pending',
  PRIMARY KEY (follower_id, following_id)
);

-- Chat System
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_hidden boolean NOT NULL DEFAULT false,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Functions & Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    COALESCE(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    COALESCE((new.raw_user_meta_data ->> 'role'), 'artLover')::public.user_role
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    username = COALESCE(public.profiles.username, EXCLUDED.username);
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Sync Profiles (Backfill)
INSERT INTO public.profiles (id, email, full_name, username, role)
SELECT 
    id, 
    email, 
    raw_user_meta_data ->> 'full_name', 
    COALESCE(raw_user_meta_data ->> 'username', 'user_' || substr(id::text, 1, 8)),
    COALESCE((raw_user_meta_data ->> 'role'), 'artLover')::public.user_role
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 5. Enable Realtime
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE public.social_posts REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 6. Permissions & RLS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Basic Policies (Ensure common policies exist)
DO $$ BEGIN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
    CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);
    DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
    CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 7. FORCE CACHE RELOAD
NOTIFY pgrst, 'reload schema';

SELECT 'Database V7 (Robust Migration) successfully applied!' as result;