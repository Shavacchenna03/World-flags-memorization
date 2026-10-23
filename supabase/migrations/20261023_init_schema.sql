-- ==============================================================================
-- World Flags: Phase 2 — Supabase Cloud Persistence Schema & RLS Policies
-- ==============================================================================
-- Run this migration in the Supabase Dashboard SQL Editor (or via supabase db push).
--
-- Tables:
-- 1. profiles: Associated 1-to-1 with auth.users for user preferences & display name.
-- 2. flag_progress: Country-by-country learning progress, keyed by ISO country code.
--
-- Security:
-- - Row Level Security (RLS) enabled on all tables.
-- - Strictly restricted to auth.uid() matching user ownership.
-- ==============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  lesson_size INTEGER NOT NULL DEFAULT 10 CHECK (lesson_size IN (5, 10, 15)),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
CREATE POLICY "Users can select own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);


-- 2. FLAG_PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.flag_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  introduced BOOLEAN NOT NULL DEFAULT false,
  mastery INTEGER NOT NULL DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 100),
  recall_attempts INTEGER NOT NULL DEFAULT 0 CHECK (recall_attempts >= 0),
  correct_attempts INTEGER NOT NULL DEFAULT 0 CHECK (correct_attempts >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, country_code)
);

-- Useful indexes for querying a user's flag progress
CREATE INDEX IF NOT EXISTS idx_flag_progress_user_id ON public.flag_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_flag_progress_introduced ON public.flag_progress(user_id, introduced);

-- Enable RLS on flag_progress
ALTER TABLE public.flag_progress ENABLE ROW LEVEL SECURITY;

-- Flag Progress Policies
DROP POLICY IF EXISTS "Users can select own flag progress" ON public.flag_progress;
CREATE POLICY "Users can select own flag progress"
  ON public.flag_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own flag progress" ON public.flag_progress;
CREATE POLICY "Users can insert own flag progress"
  ON public.flag_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own flag progress" ON public.flag_progress;
CREATE POLICY "Users can update own flag progress"
  ON public.flag_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own flag progress" ON public.flag_progress;
CREATE POLICY "Users can delete own flag progress"
  ON public.flag_progress FOR DELETE
  USING (auth.uid() = user_id);


-- 3. AUTOMATIC PROFILE CREATION TRIGGER
-- Safely creates a default profile row when a new user registers in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, lesson_size, onboarding_completed, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    10,
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
