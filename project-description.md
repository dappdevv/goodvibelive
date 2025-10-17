Good Vibe Live - платформа для мечтателей и вайба. 

С помощью платформы пользователи создают с помощью ИИ изображения, видео и музыку а также могут редактировать их и публиковать их внутри приложения а также делиться ссылкой на публикации в других приложениях, и сохранять их в Supabase storage. Вход в приложение осуществляется с помощью Supabase Auth (phone + password), но также могут привязать к Telegram аккаунту и потом входить с помощью Telegram. Пополнять баланс с помощью встроенного крипто кошелька Telegram. Также в проекте есть реферальная система и система подарков, в которых пользователь может отправить другим пользователям свои токены. В своём профиле пользователь может добавлять заметки, задачи и напоминания которые отправляют пользователю push уведомления. Также у каждого пользователя есть своя публичная страница на которая доступна не зарегистрированным пользователям. В проекте есть система лайков, добавить в избранное, подписка на обновления и сделать донат. В проекте есть платные тарифы позволяющие увеличить дисковое пространство для хранения  сгенерированных изображений, видео, музыки только тех, которые отметил пользователь, а также любых своих загруженных файлов. При создании базы данных и её таблиц необходимо учитывать, что проект постоянно развивается и появляются новые функции, например будет добавлена p2p биржа токенов и маркетплейс, продажа товаров и услуг пользователей.

Реферальная система, максимальное кол-во рефералов на первом уровне 6 пользователей, следующие приглашённые пользователи будут зарегистрированы под нижестоящими рефералами слева направо, и только под теми, кто это разрешил (установил галочку в настройках "разрешить регистрацию новых пользователей, приглашённых не мной") если пользователь в настройках профиля  установил allow_referrer_referrals_registration=true, то новые пользователи приглашённые от вышестоящих пользователей, будут регистрироваться под ним (становятся его рефералами). при оплате платных тарифов реферальные коммисионные будут распределятся следующим образом: 1 уровень 27%, 2 уровень 10%, 3 уровень 5%, 4 уровень 5%, 5 уровень 5%, 6 уровень 5%, 7 уровень 10%, 8 уровень 20%, 9 уровень 3%. Коммисионные выплачиваются только тем, у кого активна платная подписка. необходимо спроектировать соответствующие функции и таблицы. Правила, условия, уровни и размеры комиссий, должны храниться в отдельной таблице.

Система подарков. Пример, пользователь А зарегистрировался без приглашения, у него нет  пригласившего (referrer_id=NULL). Ну вот ему приходит уведомление, что ему отправил подарок N токенов пользователь В, он может принять или отказаться от подарка. Если он принимает подарок, ему на баланс зачисляются токены и он становится рефералом пользователя В. Но если на момент принятия подарка, он уже стал рефералом другого пользователя (например, принял подарок от другого), то подарок просто зачисляется ему на счёт и referrer_id не меняется. Срок действия подарка 7 дней. Если за 7 дней подарок не был принят (активирован) тем, для кого, он был предназначен, то этот подарок становится публичным и доступен для активации другими пользователями, которые были зарегистрированы без приглашения (referrer_id=NULL). Публичные подарки публикуются в приложении, и кто первый его примет (активирует), тому он и достаётся.

Если у пользователя закончились токены, приобрести он их может через P2P биржу платформы Good Vibe.

Другой способ пополнить баланс платформы Good Vibe: Зайти в раздел "Крипто-кошелёк", создать кошелёк в сети TAC (https://docs.tac.build), связать его с Telegram кошельком, и пополнить баланс токенами, которые принимает платформа Good Vibe (список принимаемых токенов и курс указываются в панели администратора).


Технический стэк: TypeScript, React and Next.js, Supabase, React Hook Form + Zod, Turbo (Monorepo Management), i18next (react-i18next, i18next, expo-localization), Zustand, TanStack React Query, Telegram web auth, Telegram Mini Apps, TON Connect UI, Wagmi (for TAC).

Authentication: Telegram, Supabase Auth.

Deployment: Vercel.

Domain: goodvibe.live, goodvibelive.vercel.app

Не включать в приложение: системы оплаты с помощью дебетовых карт и банковских переводов.

Вот обновлённая и полная схема базы данных, учитывающая:

- Аутентификацию по email + пароль и Google OAuth  
- Привязку Telegram ID к приватным данным  
- Многоуровневую реферальную систему (до 9 уровней)  
- Гибкую систему подарков с публичной активацией  
- Генерацию изображений (Gemini) и музыки (Suno)  
- Публикацию контента, социальные взаимодействия, тарифы и баланс

---

# 🗃️ Обновлённая схема БД (PostgreSQL / Supabase)

## 🔐 1. Пользователи и аутентификация

### auth.users  
*(Управляется Supabase Auth — не редактируется вручную)*  
- Поддержка: email/password, Google OAuth, (опционально: phone/SMS)

---

### public.private_users
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
-- Аутентификация
email TEXT GENERATED ALWAYS AS ((SELECT email FROM auth.users WHERE id = private_users.id)) STORED,
telegram_id BIGINT UNIQUE,          -- ✅ Перенесено сюда
is_phone_verified BOOLEAN DEFAULT false,
-- Крипто и рефералы
wallet_address TEXT UNIQUE,
referrer_id UUID REFERENCES public.private_users(id) ON DELETE SET NULL,
created_at TIMESTAMPTZ DEFAULT NOW()
> RLS: Только владелец + service_role.

---

### public.public_profiles
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
username TEXT UNIQUE,
full_name TEXT,
avatar_url TEXT,
is_public BOOLEAN DEFAULT true,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
> RLS: Публичные профили видны всем; редактирование — только владельцем.

---

## 💰 2. Монетизация и баланс

### public.user_balances
user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
balance BIGINT NOT NULL DEFAULT 0,
updated_at TIMESTAMPTZ DEFAULT NOW()
---

### public.subscription_tiers
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL UNIQUE,          -- 'Free', 'Pro'
max_storage_bytes BIGINT NOT NULL,  -- напр. 104857600 = 100 МБ
max_monthly_generations INT NOT NULL DEFAULT 0,
price_monthly NUMERIC
---

### public.user_subscriptions
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
starts_at TIMESTAMPTZ NOT NULL,
ends_at TIMESTAMPTZ NOT NULL,
is_active BOOLEAN GENERATED ALWAYS AS (ends_at > NOW()) STORED
---

## 🌐 3. Реферальная система

### public.referral_settings
user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
allow_referrer_referrals_registration BOOLEAN DEFAULT false
---

### public.referral_tree
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
level INT NOT NULL CHECK (level BETWEEN 1 AND 9),
created_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(referred_id)
---

### public.referral_commission_rules
level INT PRIMARY KEY CHECK (level BETWEEN 1 AND 9),
commission_percent NUMERIC NOT NULL CHECK (commission_percent BETWEEN 0 AND 100)

-- Значения по умолчанию:
-- (1,27), (2,10), (3,5), (4,5), (5,5), (6,5), (7,10), (8,20), (9,3)
---

### public.referral_commissions
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
payer_user_id UUID NOT NULL REFERENCES auth.users(id),
receiver_user_id UUID NOT NULL REFERENCES auth.users(id),
level INT NOT NULL,
amount NUMERIC NOT NULL,
subscription_id UUID REFERENCES public.user_subscriptions(id),
created_at TIMESTAMPTZ DEFAULT NOW()
---

## 🎁 4. Система подарков

### public.gifts
`sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = публичный

Dapp Devv, [17.10.2025 05:09]
amount BIGINT NOT NULL CHECK (amount > 0),
message TEXT,
status GIFT_STATUS NOT NULL DEFAULT 'pending',
created_at TIMESTAMPTZ DEFAULT NOW(),
expires_at TIMESTAMPTZ GENERATED ALWAYS AS (created_at + INTERVAL '7 days') STORED,
created_referral BOOLEAN DEFAULT false

> **Тип перечисления:**
sql
CREATE TYPE GIFT_STATUS AS ENUM (
  'pending', 'accepted', 'expired', 'claimed', 'rejected'
);

---

## 🎨 5. Генерация и управление контентом

### `public.generation_tasks`
sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
cost_in_tokens INT NOT NULL,
provider TEXT NOT NULL, -- 'cometapi-gemini', 'cometapi-suno'
status GENERATION_STATUS NOT NULL DEFAULT 'pending',
-- Вход
prompt TEXT,
custom_lyrics TEXT,
request_metadata JSONB,
-- Выход
result_metadata JSONB,
temp_storage_path TEXT,
permanent_storage_path TEXT,
-- Публикация
is_published BOOLEAN DEFAULT false,
published_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()

> **Тип перечисления:**
sql
CREATE TYPE GENERATION_STATUS AS ENUM (
  'pending', 'processing', 'completed', 'failed', 'saved', 'expired'
);

---

## ❤️ 6. Социальные взаимодействия

sql
-- Все таблицы с составным PK и ON DELETE CASCADE
public.likes (user_id, task_id)
public.favorites (user_id, task_id)
public.follows (follower_id, following_id)
public.donations (id, from_user_id, to_user_id, amount, task_id, created_at)

---

## 📝 7. Личный инструментарий

### `public.reminders`
sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
title TEXT NOT NULL,
description TEXT,
reminder_type REMINDER_TYPE NOT NULL, -- 'note', 'task'
is_completed BOOLEAN DEFAULT false,
due_date TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()

> **Тип перечисления:**
sql
CREATE TYPE REMINDER_TYPE AS ENUM ('note', 'task');
`

---

## ⚙️ 8. Вспомогательные SQL-функции

- `deduct_tokens(p_user_id, p_amount)` — атомарное списание токенов  
- `find_placement_in_tree(p_inviter_id)` — поиск места в реферальном дереве  
- `distribute_referral_commission(p_payer_id, p_subscription_id, p_amount)` — расчёт комиссий  
- `accept_gift(p_gift_id, p_user_id)` — принятие подарка с логикой реферала

---

## 🗂️ 9. Supabase Storage

| Бакет | Тип | Назначение |
|------|------|-----------|
| `temp-generated-content` | private | Временные файлы (7 дней) |
| `user-generated-content` | private | Постоянные файлы (`/user_id/...`) |

---

## 🔗 Связи (кратко)

- Все таблицы привязаны к `auth.users.id`
- Реферальная иерархия — в `referral_tree`
- Подарки могут создавать рефералов (если их ещё нет)
- Контент публикуется через `is_published`, без дублирования
- Социальные действия — через junction-таблицы

---