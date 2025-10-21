-- ============================================================================
-- Migration: Create User Tables (private_users, public_profiles, user_balances)
-- ============================================================================

-- 1. Create private_users table
CREATE TABLE IF NOT EXISTS public.private_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Аутентификация
  email TEXT GENERATED ALWAYS AS (
    (SELECT email FROM auth.users WHERE id = private_users.id)
  ) STORED,
  telegram_id BIGINT UNIQUE,
  is_phone_verified BOOLEAN DEFAULT false,
  
  -- Крипто и рефералы
  wallet_address TEXT UNIQUE,
  referrer_id UUID REFERENCES public.private_users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.private_users IS 'Приватные данные пользователей (только владелец может читать)';
COMMENT ON COLUMN public.private_users.telegram_id IS 'Telegram ID для привязки Telegram аккаунта';
COMMENT ON COLUMN public.private_users.referrer_id IS 'ID реферера (родителя в реферальном дереве)';

-- 2. Create public_profiles table
CREATE TABLE IF NOT EXISTS public.public_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_public BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.public_profiles IS 'Публичные профили пользователей (видны всем)';
COMMENT ON COLUMN public.public_profiles.username IS 'Уникальное имя пользователя (3-30 символов, a-z0-9_-)';
COMMENT ON COLUMN public.public_profiles.is_public IS 'Может ли профиль просматривать любой пользователь';

-- 3. Create user_balances table
CREATE TABLE IF NOT EXISTS public.user_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.user_balances IS 'Баланс токенов пользователя';
COMMENT ON COLUMN public.user_balances.balance IS 'Количество токенов (в наименьших единицах)';

-- ============================================================================
-- Create Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_private_users_telegram_id 
  ON public.private_users(telegram_id);

CREATE INDEX IF NOT EXISTS idx_private_users_referrer_id 
  ON public.private_users(referrer_id);

CREATE INDEX IF NOT EXISTS idx_private_users_wallet_address 
  ON public.private_users(wallet_address);

CREATE INDEX IF NOT EXISTS idx_public_profiles_username 
  ON public.public_profiles(username);

CREATE INDEX IF NOT EXISTS idx_public_profiles_is_public 
  ON public.public_profiles(is_public);

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================

ALTER TABLE public.private_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for private_users
-- ============================================================================

-- Пользователь может читать только свои данные
CREATE POLICY "private_users_select_own"
  ON public.private_users FOR SELECT
  USING (auth.uid() = id);

-- Пользователь может обновлять только свои данные
CREATE POLICY "private_users_update_own"
  ON public.private_users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role может читать все (для backend функций)
CREATE POLICY "private_users_service_role"
  ON public.private_users FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- RLS Policies for public_profiles
-- ============================================================================

-- Все могут читать публичные профили
CREATE POLICY "public_profiles_select_public"
  ON public.public_profiles FOR SELECT
  USING (is_public = true OR auth.uid() = id);

-- Пользователь может обновлять только свой профиль
CREATE POLICY "public_profiles_update_own"
  ON public.public_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role может работать с профилями
CREATE POLICY "public_profiles_service_role"
  ON public.public_profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- RLS Policies for user_balances
-- ============================================================================

-- Пользователь может читать только свой баланс
CREATE POLICY "user_balances_select_own"
  ON public.user_balances FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователь может обновлять только свой баланс (но обычно через функции)
CREATE POLICY "user_balances_update_own"
  ON public.user_balances FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role может работать с балансами
CREATE POLICY "user_balances_service_role"
  ON public.user_balances FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- Helper Function: Initialize user on signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.initialize_user_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create private_users entry
  INSERT INTO public.private_users (id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  
  -- Create public_profiles entry with default username
  INSERT INTO public.public_profiles (id, username)
  VALUES (NEW.id, 'user_' || substring(NEW.id::text, 1, 8))
  ON CONFLICT DO NOTHING;
  
  -- Create user_balances entry with 0 balance
  INSERT INTO public.user_balances (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.initialize_user_on_signup();
