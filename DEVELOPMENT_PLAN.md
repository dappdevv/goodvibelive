# 📋 План развития Good Vibe Live — Создание полной БД

**Дата создания:** 17.10.2025  
**Приоритет:** High  
**Статус:** Planning

---

## 📊 Текущее состояние проекта

### Что готово:
- ✅ Next.js 15 приложение с базовой архитектурой
- ✅ Supabase Auth интеграция (email/password, Google OAuth)
- ✅ Telegram Web App поддержка
- ✅ Компоненты UI (Header, BottomBar, Feed)
- ✅ Zustand для управления состоянием
- ✅ Tailwind CSS для стилизации

### Что нужно реализовать:
- 🔴 Полная схема БД Supabase (все таблицы)
- 🔴 Реферальная система (9 уровней)
- 🔴 Система подарков (с 7-дневной экспирацией)
- 🔴 Система баланса и подписок
- 🔴 API endpoints для всех операций
- 🔴 RLS политики и индексы БД

---

## 🎯 Стратегия реализации

Реализация проходит в **4 фазы** в порядке приоритета:

### Фаза 1: Создание структуры БД (неделя 1-2)
Создание всех таблиц, enum типов, индексов, RLS политик

### Фаза 2: SQL функции и триггеры (неделя 2-3)
Реализация бизнес-логики в БД: расчет комиссий, управление подарками, размещение в дереве рефералов

### Фаза 3: API endpoints (неделя 3-4)
Next.js API routes для CRUD операций и сложных логик

### Фаза 4: Фронтенд интеграция (неделя 4-5)
Подключение фронтенда к API, реализация UI компонентов

---

## 🗃️ Структура БД (детально)

### 🔐 Раздел 1: Аутентификация и профили

#### 1.1 Таблица `private_users`
Приватные данные пользователя (видны только владельцу + service_role)

```sql
-- Поля:
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
email TEXT GENERATED ALWAYS AS (SELECT email FROM auth.users WHERE id = private_users.id) STORED
telegram_id BIGINT UNIQUE NULL
is_phone_verified BOOLEAN DEFAULT false
wallet_address TEXT UNIQUE NULL
referrer_id UUID REFERENCES private_users(id) ON DELETE SET NULL
created_at TIMESTAMPTZ DEFAULT NOW()

-- RLS: Только владелец видит свои данные
-- Индексы: telegram_id, referrer_id
```

#### 1.2 Таблица `public_profiles`
Публичные профили пользователей (видны всем)

```sql
-- Поля:
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
username TEXT UNIQUE NOT NULL
full_name TEXT NULL
avatar_url TEXT NULL
bio TEXT NULL (max 500 chars)
is_public BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()

-- RLS: Публичное чтение, редактирование только владельцем
-- Индексы: username, is_public
```

---

### 💰 Раздел 2: Монетизация и баланс

#### 2.1 Таблица `user_balances`
Отслеживание баланса токенов каждого пользователя

```sql
-- Поля:
user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
balance BIGINT NOT NULL DEFAULT 0
updated_at TIMESTAMPTZ DEFAULT NOW()

-- RLS: Только владелец видит свой баланс
-- Индексы: user_id
```

#### 2.2 Таблица `subscription_tiers`
Тарифные планы платформы (статичные, настраиваются админом)

```sql
-- Поля:
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
name TEXT NOT NULL UNIQUE -- 'Free', 'Pro', 'Premium'
max_storage_bytes BIGINT NOT NULL -- 0, 1GB, 10GB
max_monthly_generations INT NOT NULL -- 0 (unlimited), 100, 500
price_monthly NUMERIC NOT NULL -- 0, 9.99, 29.99
created_at TIMESTAMPTZ DEFAULT NOW()

-- Начальные данные:
-- (Free, 0, 0, 0)
-- (Pro, 1073741824, 100, 9.99)
-- (Premium, 10737418240, 500, 29.99)
```

#### 2.3 Таблица `user_subscriptions`
Активные подписки пользователей

```sql
-- Поля:
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
tier_id UUID NOT NULL REFERENCES subscription_tiers(id)
starts_at TIMESTAMPTZ NOT NULL
ends_at TIMESTAMPTZ NOT NULL
is_active BOOLEAN GENERATED ALWAYS AS (ends_at > NOW()) STORED
created_at TIMESTAMPTZ DEFAULT NOW()

-- RLS: Пользователь видит свои подписки
-- Индексы: user_id, is_active, ends_at
```

---

### 🌐 Раздел 3: Реферальная система

#### 3.1 Таблица `referral_settings`
Настройки реферальной системы для каждого пользователя

```sql
-- Поля:
user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
allow_referrer_referrals_registration BOOLEAN DEFAULT false
-- true = разрешить регистрацию новых юзеров приглашённых от вышестоящих

-- RLS: Только владелец видит
-- Индексы: user_id
```

#### 3.2 Таблица `referral_tree`
Отслеживание реферальных связей в дереве (до 9 уровней)

```sql
-- Поля:
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE
level INT NOT NULL CHECK (level BETWEEN 1 AND 9)
created_at TIMESTAMPTZ DEFAULT NOW()

-- RLS: Публичное чтение (для показа дерева), редактирование только системой
-- Индексы: referrer_id, referred_id, level, created_at
```

#### 3.3 Таблица `referral_commission_rules`
Правила расчета комиссий по уровням (статичная, настраивается админом)

```sql
-- Поля:
level INT PRIMARY KEY CHECK (level BETWEEN 1 AND 9)
commission_percent NUMERIC NOT NULL CHECK (commission_percent BETWEEN 0 AND 100)

-- Начальные данные:
-- (1, 27), (2, 10), (3, 5), (4, 5), (5, 5), (6, 5), (7, 10), (8, 20), (9, 3)
```

#### 3.4 Таблица `referral_commissions`
Логирование выплат комиссий рефералам

```sql
-- Поля:
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
payer_user_id UUID NOT NULL REFERENCES auth.users(id)
receiver_user_id UUID NOT NULL REFERENCES auth.users(id)
level INT NOT NULL CHECK (level BETWEEN 1 AND 9)
amount NUMERIC NOT NULL CHECK (amount > 0)
subscription_id UUID REFERENCES user_subscriptions(id)
created_at TIMESTAMPTZ DEFAULT NOW()

-- RLS: Пользователь видит свои комиссии
-- Индексы: receiver_user_id, created_at, payer_user_id
```

---

### 🎁 Раздел 4: Система подарков

#### 4.1 Enum `GIFT_STATUS`
Статусы подарков

```sql
CREATE TYPE GIFT_STATUS AS ENUM (
  'pending',    -- ожидание принятия получателем
  'accepted',   -- принят получателем
  'expired',    -- истёк 7-дневный срок
  'claimed',    -- публичный подарок активирован кем-то
  'rejected'    -- отклонён получателем
);
```

#### 4.2 Таблица `gifts`
Система подарков с логикой реферала

```sql
-- Поля:
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE -- NULL = публичный подарок
amount BIGINT NOT NULL CHECK (amount > 0)
message TEXT NULL (max 200 chars)
status GIFT_STATUS NOT NULL DEFAULT 'pending'
created_at TIMESTAMPTZ DEFAULT NOW()
expires_at TIMESTAMPTZ GENERATED ALWAYS AS (created_at + INTERVAL '7 days') STORED
created_referral BOOLEAN DEFAULT false -- флаг: создал ли рефераль при активации

-- RLS: 
--   - from_user видит свои отправленные подарки
--   - to_user видит подарки адресованные ему
--   - Публичные подарки (to_user_id IS NULL) видны всем с referrer_id IS NULL
-- Индексы: to_user_id, status, expires_at, from_user_id, created_at
```

---

### 🎨 Раздел 5: Генерация контента

#### 5.1 Enum `GENERATION_STATUS`
Статусы генерации контента

```sql
CREATE TYPE GENERATION_STATUS AS ENUM (
  'pending',     -- ожидание обработки
  'processing',  -- в процессе генерации
  'completed',   -- успешно завершена
  'failed',      -- ошибка при генерации
  'saved',       -- сохранено в permanent storage
  'expired'      -- удалено из temp storage
);
```

#### 5.2 Таблица `generation_tasks`
Отслеживание всех операций генерации контента

```sql
-- Поля:
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
cost_in_tokens INT NOT NULL
provider TEXT NOT NULL -- 'cometapi-gemini', 'cometapi-suno'
status GENERATION_STATUS NOT NULL DEFAULT 'pending'
prompt TEXT NULL
custom_lyrics TEXT NULL
request_metadata JSONB NULL
result_metadata JSONB NULL
temp_storage_path TEXT NULL
permanent_storage_path TEXT NULL
is_published BOOLEAN DEFAULT false
published_at TIMESTAMPTZ NULL
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()

-- RLS: Пользователь видит свои генерации
-- Индексы: user_id, status, is_published, created_at
```

---

### ❤️ Раздел 6: Социальные взаимодействия

#### 6.1 Таблица `likes`
Лайки на генерированный контент

```sql
-- Поля:
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
task_id UUID NOT NULL REFERENCES generation_tasks(id) ON DELETE CASCADE
created_at TIMESTAMPTZ DEFAULT NOW()

-- PK: (user_id, task_id)
-- RLS: Пользователь может лайкать любой контент
-- Индексы: user_id, task_id
```

#### 6.2 Таблица `favorites`
Избранный контент

```sql
-- Поля:
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
task_id UUID NOT NULL REFERENCES generation_tasks(id) ON DELETE CASCADE
created_at TIMESTAMPTZ DEFAULT NOW()

-- PK: (user_id, task_id)
-- RLS: Пользователь управляет своим избранным
-- Индексы: user_id, task_id
```

#### 6.3 Таблица `follows`
Подписка на обновления пользователя

```sql
-- Поля:
follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
created_at TIMESTAMPTZ DEFAULT NOW()

-- PK: (follower_id, following_id)
-- RLS: Пользователь может подписаться на любого
-- Индексы: follower_id, following_id
```

#### 6.4 Таблица `donations`
Донаты другим пользователям

```sql
-- Поля:
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
amount BIGINT NOT NULL CHECK (amount > 0)
task_id UUID REFERENCES generation_tasks(id) ON DELETE SET NULL
message TEXT NULL
created_at TIMESTAMPTZ DEFAULT NOW()

-- RLS: Пользователь видит свои донаты
-- Индексы: from_user_id, to_user_id, created_at
```

---

### 📝 Раздел 7: Личный инструментарий

#### 7.1 Enum `REMINDER_TYPE`
Типы напоминаний

```sql
CREATE TYPE REMINDER_TYPE AS ENUM (
  'note',   -- заметка
  'task'    -- задача
);
```

#### 7.2 Таблица `reminders`
Заметки и задачи с push-уведомлениями

```sql
-- Поля:
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
title TEXT NOT NULL (max 200 chars)
description TEXT NULL (max 1000 chars)
reminder_type REMINDER_TYPE NOT NULL
is_completed BOOLEAN DEFAULT false
due_date TIMESTAMPTZ NULL
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()

-- RLS: Пользователь видит и управляет только своими
-- Индексы: user_id, due_date, is_completed
```

---

## 🔒 RLS политики (Row Level Security)

### Политика для `private_users`
- **SELECT**: Только владелец (auth.uid() = id)
- **INSERT/UPDATE/DELETE**: Только владелец

### Политика для `public_profiles`
- **SELECT**: Все (публичное чтение)
- **INSERT/UPDATE/DELETE**: Только владелец

### Политика для `user_balances`
- **SELECT**: Только владелец
- **INSERT/UPDATE/DELETE**: Только service_role (система)

### Политика для `user_subscriptions`
- **SELECT**: Только владелец
- **INSERT/UPDATE/DELETE**: Только service_role

### Политика для `gifts`
- **SELECT**: 
  - Отправитель видит свои отправленные
  - Получатель видит адресованные ему
  - Публичные (to_user_id IS NULL) видны всем с referrer_id IS NULL
- **INSERT**: Все авторизованные пользователи
- **UPDATE/DELETE**: Только отправитель для pending статуса

### Политика для `generation_tasks`
- **SELECT**: Только владелец
- **INSERT**: Авторизованные пользователи
- **UPDATE**: Только владелец
- **DELETE**: Только владелец

### Политика для социальных таблиц
- **SELECT**: Публичное чтение
- **INSERT/DELETE**: Только авторизованные пользователи

### Политика для `reminders`
- **SELECT**: Только владелец
- **INSERT/UPDATE/DELETE**: Только владелец

---

## ⚙️ SQL функции

### Функция 1: `find_placement_in_tree()`
Поиск места для нового рефера в дереве (макс 6 на уровне, слева направо)

**Вход**: 
- `p_inviter_id UUID` — ID пригласившего
- `p_new_user_id UUID` — ID нового пользователя

**Выход**: 
- Возвращает уровень (1-9) или ошибку если дерево переполнено

**Логика**:
1. Проверить, есть ли `p_new_user_id` уже в дереве
2. Считать прямых рефералов `p_inviter_id` на уровне 1
3. Если < 6, добавить на уровень 1
4. Иначе рекурсивно найти место на уровне 2-9
5. Проверить флаг `allow_referrer_referrals_registration` у каждого кандидата

---

### Функция 2: `get_referral_commission_for_level()`
Расчет комиссии для конкретного уровня

**Вход**: 
- `p_level INT` — уровень (1-9)
- `p_amount NUMERIC` — сумма платежа

**Выход**: 
- NUMERIC — размер комиссии

**Логика**:
1. Получить процент из `referral_commission_rules` для уровня
2. Вернуть `p_amount * percent / 100`

---

### Функция 3: `auto_claim_expired_gifts()`
Публикация истекших подарков (превращение в публичные)

**Запускается**: Cron job каждый час

**Логика**:
1. Найти все подарки со статусом 'pending' и `expires_at < NOW()`
2. Изменить их статус на 'expired'
3. Установить `to_user_id = NULL` (сделать публичными)

---

### Функция 4: `distribute_referral_commission()`
Распределение комиссий по цепи рефералов при платеже

**Вход**: 
- `p_payer_id UUID` — кто платит
- `p_subscription_id UUID` — ID подписки
- `p_amount NUMERIC` — сумма платежа

**Логика**:
1. Найти всех рефералов `p_payer_id` со статусом 'pending' до уровня 9
2. Для каждого реферала:
   - Проверить, активна ли его подписка
   - Если да, рассчитать комиссию по функции `get_referral_commission_for_level()`
   - Создать запись в `referral_commissions`
   - Зачислить комиссию на баланс (user_balances.balance += commission)

---

### Функция 5: `accept_gift()`
Принятие подарка с логикой реферала

**Вход**: 
- `p_gift_id UUID` — ID подарка
- `p_user_id UUID` — кто принимает

**Логика**:
1. Проверить статус подарка = 'pending'
2. Проверить, что `to_user_id = NULL` ИЛИ `to_user_id = p_user_id`
3. Если `to_user_id = NULL`, проверить что `referrer_id IS NULL` у `p_user_id`
4. Если статус claimed, отклонить
5. Зачислить токены на баланс: `user_balances.balance += amount`
6. Если `referrer_id IS NULL` у `p_user_id`, создать рефераль:
   - Добавить `p_user_id` в `referral_tree`
   - Установить `referrer_id = from_user_id`
   - Установить `created_referral = true`
7. Установить статус = 'accepted' или 'claimed'

---

## 📑 Суммирующая диаграмма

```mermaid
graph LR
    subgraph Auth
        AuthUsers[auth.users]
    end
    
    subgraph Users
        PrivateUsers[private_users]
        PublicProfiles[public_profiles]
        UserBalances[user_balances]
    end
    
    subgraph Referral
        ReferralSettings[referral_settings]
        ReferralTree[referral_tree]
        ReferralCommissionRules[referral_commission_rules]
        ReferralCommissions[referral_commissions]
    end
    
    subgraph Monetization
        SubscriptionTiers[subscription_tiers]
        UserSubscriptions[user_subscriptions]
    end
    
    subgraph Gifts
        Gifts[gifts]
    end
    
    subgraph Content
        GenerationTasks[generation_tasks]
    end
    
    subgraph Social
        Likes[likes]
        Favorites[favorites]
        Follows[follows]
        Donations[donations]
    end
    
    subgraph Tools
        Reminders[reminders]
    end
    
    AuthUsers --> PrivateUsers
    AuthUsers --> PublicProfiles
    AuthUsers --> UserBalances
    AuthUsers --> ReferralSettings
    AuthUsers --> ReferralTree
    AuthUsers --> UserSubscriptions
    AuthUsers --> Gifts
    AuthUsers --> GenerationTasks
    AuthUsers --> Social
    AuthUsers --> Reminders
    
    SubscriptionTiers --> UserSubscriptions
    UserSubscriptions --> ReferralCommissions
    Gifts --> PrivateUsers
    GenerationTasks --> Social
```

---

## ✅ Контрольный список реализации

### Фаза 1: Таблицы
- [ ] Создать enum GIFT_STATUS, GENERATION_STATUS, REMINDER_TYPE
- [ ] Создать таблицу private_users
- [ ] Создать таблицу public_profiles
- [ ] Создать таблицу user_balances
- [ ] Создать таблицу subscription_tiers (с начальными данными)
- [ ] Создать таблицу user_subscriptions
- [ ] Создать таблицу referral_settings
- [ ] Создать таблицу referral_tree
- [ ] Создать таблицу referral_commission_rules (с начальными данными)
- [ ] Создать таблицу referral_commissions
- [ ] Создать таблицу gifts
- [ ] Создать таблицу generation_tasks
- [ ] Создать таблицы likes, favorites, follows, donations
- [ ] Создать таблицу reminders

### Фаза 1.5: Индексы и RLS
- [ ] Создать индексы для всех таблиц
- [ ] Настроить RLS политики для всех таблиц

### Фаза 2: SQL функции
- [ ] Создать функцию find_placement_in_tree
- [ ] Создать функцию get_referral_commission_for_level
- [ ] Создать функцию auto_claim_expired_gifts (с Cron триггером)
- [ ] Создать функцию distribute_referral_commission
- [ ] Создать функцию accept_gift

### Фаза 3: API endpoints
- [ ] POST /api/users/profile — создать/обновить профиль
- [ ] GET /api/users/profile/[username] — получить публичный профиль
- [ ] POST /api/gifts/send — отправить подарок
- [ ] POST /api/gifts/accept — принять подарок
- [ ] GET /api/gifts/public — получить публичные подарки
- [ ] GET /api/referral/stats — статистика реферальной системы
- [ ] GET /api/balance — получить баланс пользователя
- [ ] POST /api/subscription/upgrade — апгрейд подписки

### Фаза 4: Фронтенд
- [ ] Компонент для отправки подарка
- [ ] Компонент для управления подарками
- [ ] Компонент для просмотра реферальной статистики
- [ ] Компонент для управления подпиской

---

## 📞 Контакты и вопросы

Если возникают вопросы по реализации, см. раздел "Вспомогательные материалы" в [`project-description.md`](project-description.md).
