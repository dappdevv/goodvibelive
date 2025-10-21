-- Таблица тарифных планов (Subscription Tiers)
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'Free', 'Pro', 'Premium'
  max_storage_bytes BIGINT NOT NULL, -- например 104857600 = 100 МБ
  max_monthly_generations INT NOT NULL DEFAULT 0,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица активных подписок пользователей
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN GENERATED ALWAYS AS (ends_at > NOW()) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица балансов пользователей
CREATE TABLE IF NOT EXISTS public.user_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для монетизации
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier_id ON public.user_subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON public.user_subscriptions(is_active);

-- Вставка стандартных тарифов
INSERT INTO public.subscription_tiers (name, max_storage_bytes, max_monthly_generations, price_monthly, description)
VALUES
  ('Free', 1073741824, 100, 0, 'Бесплатный план с базовыми функциями'),
  ('Pro', 10737418240, 500, 29.99, 'Профессиональный план с расширенными возможностями'),
  ('Premium', 107374182400, 2000, 99.99, 'Премиум план с полным доступом')
ON CONFLICT (name) DO NOTHING;
