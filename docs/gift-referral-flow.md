# Диаграмма потока данных: Система подарков и рефералов

## Последовательность операций

```mermaid
sequenceDiagram
    participant U1 as User 1 (Referrer)
    participant System as Good Vibe System
    participant DB as Database
    participant U2 as User 2 (New User)
    participant TG as Telegram API

    %% Gift Creation
    Note over U1, TG: Gift Creation Flow
    U1->>System: Create Gift
    System->>System: Validate token balance
    System->>DB: Deduct tokens from U1
    System->>DB: Create gift record
    System->>System: Generate promo code
    System->>U1: Return promo code
    U1->>U2: Share promo code (external)

    %% Gift Activation
    Note over U1, TG: Gift Activation Flow
    U2->>System: Register via Telegram
    System->>TG: Get user phone number
    TG->>System: Return phone number
    System->>DB: Create user record

    U2->>System: Enter promo code
    System->>DB: Validate promo code
    System->>DB: Check phone number match

    alt Phone number matches
        System->>DB: Add tokens to U2 balance
        System->>DB: Create referral relationship
        System->>DB: Mark gift as activated
        System->>U2: Success notification
        System->>U1: Gift activated notification
    else Phone number doesn't match
        System->>U2: Error: Invalid phone number
    end

    %% Referral Commission
    Note over U1, TG: Commission Flow
    U2->>System: Subscribe to paid plan
    System->>DB: Check U1 has active subscription

    alt U1 has active subscription
        System->>DB: Calculate commission (30% for level 1)
        System->>DB: Add commission to U1 balance
        System->>U1: Commission notification
    else U1 doesn't have active subscription
        System->>System: No commission awarded
    end
```

## Описание процессов

### 1. Создание подарка (Gift Creation)

1. **Пользователь 1** инициирует создание подарка
2. **Система** проверяет баланс токенов пользователя
3. **База данных** списывает токены с баланса User 1
4. **База данных** создает запись о подарке
5. **Система** генерирует уникальный промо-код
6. **Пользователь 1** получает промо-код и делится им с другом

### 2. Активация подарка (Gift Activation)

1. **Пользователь 2** регистрируется через Telegram
2. **Telegram API** предоставляет номер телефона
3. **База данных** создает профиль нового пользователя
4. **Пользователь 2** вводит полученный промо-код
5. **Система** валидирует промо-код и проверяет соответствие номера телефона
6. При успешной проверке:
   - Токены зачисляются на баланс User 2
   - Создается реферальная связь между пользователями
   - Подарок помечается как активированный
   - Отправляются уведомления обеим сторонам

### 3. Начисление комиссии (Commission Flow)

1. **Пользователь 2** оформляет платную подписку
2. **Система** проверяет наличие активной подписки у User 1
3. При наличии активной подписки у реферрера:
   - Рассчитывается комиссия (30% для первого уровня)
   - Комиссия зачисляется на баланс User 1
   - Отправляется уведомление о начислении

## Правила реферальной системы

### Структура уровней

- **Максимум 6 рефералов** на первом уровне
- **8 уровней** в реферальной сети
- **Автобалансировка**: 7-й реферал направляется к реферралу 2-го уровня с наименьшим количеством рефералов

### Проценты комиссий по уровням

- **1 уровень**: 30%
- **2 уровень**: 10%
- **3 уровень**: 5%
- **4 уровень**: 5%
- **5 уровень**: 5%
- **6 уровень**: 5%
- **7 уровень**: 10%
- **8 уровень**: 20%

### Условия начисления

- Комиссия начисляется только при **активной подписке** у реферрера
- Начисление происходит при каждой оплате подписки рефералом
- Комиссия рассчитывается от стоимости подписки в токенах

## Безопасность и валидация

### Верификация подарков

- Проверка соответствия номера телефона получателя
- Валидация уникальности промо-кодов
- Проверка достаточности баланса при создании подарка
- Защита от повторной активации одного промо-кода

### Защита от злоупотреблений

- Лимиты на количество создаваемых подарков
- Временные ограничения на активацию промо-кодов
- Мониторинг подозрительной активности
- Проверка подлинности Telegram аккаунтов
