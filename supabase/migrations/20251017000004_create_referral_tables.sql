-- Referral system tables
-- Таблица настроек реферальной системы для каждого пользователя
CREATE TABLE public.referral_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_referrer_referrals_registration BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица для отслеживания реферальных связей (многоуровневая иерархия до 9 уровней)
CREATE TABLE public.referral_tree (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INT NOT NULL CHECK (level BETWEEN 1 AND 9),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id) -- Каждый пользователь может иметь только одного реферера
);

-- Таблица правил комиссий для каждого уровня
CREATE TABLE public.referral_commission_rules (
  level INT PRIMARY KEY CHECK (level BETWEEN 1 AND 9),
  commission_percent NUMERIC NOT NULL CHECK (commission_percent BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица логирования выплат комиссий
CREATE TABLE public.referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INT NOT NULL CHECK (level BETWEEN 1 AND 9),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для оптимизации запросов
CREATE INDEX idx_referral_tree_referrer_id ON public.referral_tree(referrer_id);
CREATE INDEX idx_referral_tree_referred_id ON public.referral_tree(referred_id);
CREATE INDEX idx_referral_tree_level ON public.referral_tree(level);
CREATE INDEX idx_referral_commissions_receiver_id ON public.referral_commissions(receiver_user_id);
CREATE INDEX idx_referral_commissions_created_at ON public.referral_commissions(created_at);

-- Вставка значений по умолчанию для комиссий
INSERT INTO public.referral_commission_rules (level, commission_percent) VALUES
  (1, 27),
  (2, 10),
  (3, 5),
  (4, 5),
  (5, 5),
  (6, 5),
  (7, 10),
  (8, 20),
  (9, 3)
ON CONFLICT DO NOTHING;
