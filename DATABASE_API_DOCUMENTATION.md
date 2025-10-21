# Good Vibe Live - API Documentation

## Обзор

Документация API endpoints для платформы Good Vibe Live, включая управление профилями, подарками, рефералами и подписками.

---

## 1. API: Управление профилем пользователя

**Endpoint:** [`POST /api/profile`](src/app/api/profile/route.ts)

### Создание/обновление профиля

Создает или обновляет публичный профиль пользователя.

**Запрос:**
```json
{
  "username": "john_doe",
  "full_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "is_public": true
}
```

**Ответ:**
```json
{
  "id": "uuid",
  "username": "john_doe",
  "full_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "is_public": true,
  "created_at": "2025-10-17T06:00:00Z",
  "updated_at": "2025-10-17T06:00:00Z"
}
```

**Коды ошибок:**
- `400`: Некорректные данные (username уже занят, некорректный формат)
- `401`: Не авторизован
- `500`: Ошибка сервера

---

## 2. API: Система подарков

**Endpoint:** [`POST /api/gifts`](src/app/api/gifts/route.ts)

### Отправка подарка

Отправляет подарок (токены) другому пользователю.

**Запрос:**
```json
{
  "to_user_id": "uuid",
  "amount": 1000,
  "message": "Good luck!"
}
```

**Ответ:**
```json
{
  "gift_id": "uuid",
  "from_user_id": "uuid",
  "to_user_id": "uuid",
  "amount": 1000,
  "message": "Good luck!",
  "status": "pending",
  "created_at": "2025-10-17T06:00:00Z",
  "expires_at": "2025-10-24T06:00:00Z"
}
```

**Коды ошибок:**
- `400`: Недостаточно токенов, некорректные данные
- `401`: Не авторизован
- `404`: Пользователь не найден

### Принятие подарка

**Запрос:**
```json
{
  "gift_id": "uuid",
  "action": "accept"
}
```

**Ответ:**
```json
{
  "status": "accepted",
  "tokens_received": 1000,
  "became_referral": true,
  "referrer_id": "uuid"
}
```

**Логика:**
- Если получатель еще не имеет реферера (`referrer_id = NULL`), становится рефералом отправителя
- Если уже имеет реферера, подарок просто зачисляется на счет
- После принятия подарок помечается как `accepted`

---

## 3. API: Реферальная система

**Endpoint:** [`GET /api/referrals`](src/app/api/referrals/route.ts)

### Получение реферальной статистики

Возвращает полную информацию о реферальной сети пользователя.

**Ответ:**
```json
{
  "user_id": "uuid",
  "total_referrals": 15,
  "referral_tree": {
    "level_1": {
      "count": 6,
      "referrals": [
        {
          "id": "uuid",
          "username": "user1",
          "status": "active",
          "subscription_tier": "Pro"
        }
      ]
    },
    "level_2": {
      "count": 9,
      "referrals": []
    }
  },
  "commissions": {
    "total_earned": 5000,
    "pending": 0,
    "by_level": {
      "1": 2700,
      "2": 900,
      "3": 450,
      "4": 450,
      "5": 450,
      "6": 450,
      "7": 0,
      "8": 0,
      "9": 0
    }
  }
}
```

**Правила комиссий:**
- Уровень 1: 27%
- Уровень 2: 10%
- Уровни 3-6: 5% каждый
- Уровень 7: 10%
- Уровень 8: 20%
- Уровень 9: 3%

**Условие:** Комиссии выплачиваются только пользователям с активной платной подпиской.

---

## 4. API: Управление балансом

**Endpoint:** [`GET /api/balance`](src/app/api/balance/route.ts)

### Проверка баланса

Возвращает текущий баланс пользователя.

**Ответ:**
```json
{
  "user_id": "uuid",
  "balance": 5000,
  "updated_at": "2025-10-17T06:00:00Z"
}
```

### История транзакций

**Запрос:**
```
GET /api/balance?history=true&limit=20&offset=0
```

**Ответ:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "gift_received",
      "amount": 500,
      "from_user_id": "uuid",
      "created_at": "2025-10-17T06:00:00Z"
    },
    {
      "id": "uuid",
      "type": "subscription_paid",
      "amount": -1000,
      "subscription_id": "uuid",
      "created_at": "2025-10-16T06:00:00Z"
    }
  ],
  "total": 50
}
```

---

## 5. API: Управление подписками

**Endpoint:** [`POST /api/subscriptions`](src/app/api/subscriptions/route.ts)

### Получение доступных тарифов

**Запрос:**
```
GET /api/subscriptions/tiers
```

**Ответ:**
```json
{
  "tiers": [
    {
      "id": "uuid",
      "name": "Free",
      "max_storage_bytes": 104857600,
      "max_monthly_generations": 10,
      "price_monthly": 0
    },
    {
      "id": "uuid",
      "name": "Pro",
      "max_storage_bytes": 1073741824,
      "max_monthly_generations": 100,
      "price_monthly": 9.99
    },
    {
      "id": "uuid",
      "name": "Premium",
      "max_storage_bytes": 5368709120,
      "max_monthly_generations": 1000,
      "price_monthly": 29.99
    }
  ]
}
```

### Оформление подписки

**Запрос:**
```json
{
  "tier_id": "uuid",
  "duration_months": 1
}
```

**Ответ:**
```json
{
  "subscription_id": "uuid",
  "user_id": "uuid",
  "tier_id": "uuid",
  "starts_at": "2025-10-17T06:00:00Z",
  "ends_at": "2025-11-17T06:00:00Z",
  "is_active": true,
  "total_cost": 9.99
}
```

**Логика:**
- Сумма вычитается из баланса пользователя
- Реферальные комиссии автоматически рассчитываются и выплачиваются вышестоящим реферерам
- Активируется после оплаты

---

## Структура БД (Краткая справка)

### Основные таблицы

| Таблица | Описание |
|---------|---------|
| `private_users` | Приватные данные пользователя (telegram_id, wallet_address, referrer_id) |
| `public_profiles` | Публичные профили (username, avatar_url, bio, is_public) |
| `user_balances` | Баланс токенов пользователя |
| `subscription_tiers` | Тарифные планы (Free, Pro, Premium) |
| `user_subscriptions` | Активные подписки пользователей |
| `referral_tree` | Реферальная иерархия (до 9 уровней) |
| `referral_commission_rules` | Процентные ставки комиссий по уровням |
| `referral_commissions` | Логирование выплаченных комиссий |
| `gifts` | Система подарков (с 7-дневным сроком экспирации) |
| `generation_tasks` | Задачи генерации контента (изображения, музыка, видео) |
| `reminders` | Заметки и напоминания пользователей |
| `likes`, `favorites`, `follows`, `donations` | Социальные взаимодействия |

### Enum типы

```sql
-- Статусы подарков
GIFT_STATUS: 'pending', 'accepted', 'expired', 'claimed', 'rejected'

-- Статусы генерации
GENERATION_STATUS: 'pending', 'processing', 'completed', 'failed', 'saved', 'expired'

-- Типы напоминаний
REMINDER_TYPE: 'note', 'task'
```

---

## SQL Функции

### `find_placement_in_tree(p_referrer_id UUID)`

Находит позицию нового реферала в дереве (максимум 6 на уровне).

```sql
SELECT * FROM find_placement_in_tree('referrer-uuid');
```

### `accept_gift(p_gift_id UUID, p_user_id UUID)`

Принимает подарок, обновляет баланс и потенциально создает реферальную связь.

```sql
SELECT * FROM accept_gift('gift-uuid', 'user-uuid');
```

### `distribute_referral_commission(p_payer_id UUID, p_subscription_id UUID, p_amount NUMERIC)`

Распределяет комиссии по цепочке рефералов согласно процентным ставкам.

```sql
SELECT * FROM distribute_referral_commission('user-uuid', 'subscription-uuid', 9.99);
```

### `auto_claim_expired_gifts()`

Автоматически переводит истекшие подарки в статус 'expired' и делает их доступными для всех пользователей без реферера.

```sql
SELECT * FROM auto_claim_expired_gifts();
```

---

## RLS Политики (Безопасность)

- **private_users**: Доступ только владельцу + service_role
- **public_profiles**: Публичное чтение, редактирование только владельцем
- **user_balances**: Доступ только владельцу
- **gifts**: Получатель и отправитель видят свои подарки
- **referral_commissions**: Получатель видит свои комиссии
- **user_subscriptions**: Доступ только владельцу

---

## Примеры использования

### Пример 1: Регистрация с рефером

```bash
# 1. Создать приватный профиль
POST /api/profile
{
  "telegram_id": 123456789,
  "wallet_address": "0x..."
}

# 2. Отправить подарок для привлечения
POST /api/gifts
{
  "to_user_id": "new-user-uuid",
  "amount": 1000,
  "message": "Welcome to Good Vibe Live!"
}

# 3. Новый пользователь принимает подарок
POST /api/gifts
{
  "gift_id": "gift-uuid",
  "action": "accept"
}
```

### Пример 2: Проверка реферального дохода

```bash
# Получить реферальную статистику
GET /api/referrals

# Ответ содержит:
# - Количество рефералов по уровням
# - Сумму комиссий по уровням
# - Статус активности каждого реферала
```

### Пример 3: Оплата подписки и распределение комиссий

```bash
# 1. Пользователь покупает Pro подписку
POST /api/subscriptions
{
  "tier_id": "pro-tier-uuid",
  "duration_months": 1
}

# 2. Система автоматически:
# - Вычитает 9.99 из баланса
# - Вычисляет комиссии для всех 9 уровней рефералов
# - Выплачивает комиссии только активным подписчикам
```

---

## Обработка ошибок

Все endpoints возвращают стандартизированный формат ошибок:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Коды ошибок

| Код | Описание |
|-----|---------|
| `UNAUTHORIZED` | Требуется аутентификация |
| `FORBIDDEN` | Недостаточно прав |
| `NOT_FOUND` | Ресурс не найден |
| `BAD_REQUEST` | Некорректные данные |
| `CONFLICT` | Конфликт (например, username уже занят) |
| `INSUFFICIENT_BALANCE` | Недостаточно токенов |
| `INTERNAL_ERROR` | Ошибка сервера |

---

## Заметки по разработке

1. **Миграции Supabase**: Все миграции находятся в `/supabase/migrations/`
2. **RLS политики**: Обязательно включены для всех таблиц
3. **Индексы**: Оптимизированы для быстрого поиска по часто используемым полям
4. **Функции**: Используют транзакции для атомарности операций
5. **Безопасность**: Все операции с балансом атомарны и логируются

