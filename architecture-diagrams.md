# Архитектурные диаграммы Good Vibe Live

## 1. Общая архитектура системы

```mermaid
graph TB
    subgraph Client Layer
        WebApp[Web App<br/>Next.js]
        TgMiniApp[Telegram Mini App]
        MobileApp[Mobile App<br/>Future]
    end
    
    subgraph API Layer
        NextAPI[Next.js API Routes]
        EdgeFn[Supabase Edge Functions]
    end
    
    subgraph Services
        SupaAuth[Supabase Auth]
        SupaDB[(PostgreSQL)]
        SupaStorage[Supabase Storage]
        SupaRT[Supabase Realtime]
    end
    
    subgraph External
        Gemini[CometAPI<br/>Gemini AI]
        Suno[CometAPI<br/>Suno AI]
        TonChain[TON Blockchain]
        TacChain[TAC Network]
        TgBot[Telegram Bot API]
    end
    
    WebApp --> NextAPI
    TgMiniApp --> NextAPI
    MobileApp -.-> NextAPI
    
    NextAPI --> SupaAuth
    NextAPI --> SupaDB
    NextAPI --> SupaStorage
    NextAPI --> SupaRT
    
    EdgeFn --> SupaDB
    EdgeFn --> SupaStorage
    
    NextAPI --> Gemini
    NextAPI --> Suno
    NextAPI --> TonChain
    NextAPI --> TacChain
    NextAPI --> TgBot
    
    SupaRT -.->|WebSocket| WebApp
    SupaRT -.->|WebSocket| TgMiniApp
```

---

## 2. Схема аутентификации и данных пользователя

```mermaid
graph TD
    Start[Пользователь] --> AuthChoice{Выбор метода входа}
    
    AuthChoice -->|Email/Phone| EmailAuth[Supabase Auth<br/>Email + Password]
    AuthChoice -->|Google| GoogleAuth[Google OAuth]
    AuthChoice -->|Telegram| TgAuth[Telegram Web Auth]
    
    EmailAuth --> CreateUser[Создание в auth.users]
    GoogleAuth --> CreateUser
    TgAuth --> CheckExist{Аккаунт существует?}
    
    CheckExist -->|Нет| CreateUser
    CheckExist -->|Да| LinkTg[Привязка telegram_id]
    
    CreateUser --> CreatePrivate[Создание private_users]
    CreatePrivate --> CreatePublic[Создание public_profiles]
    CreatePublic --> CreateBalance[Инициализация user_balances]
    CreateBalance --> SetReferrer{Есть реферер?}
    
    LinkTg --> Login[Успешный вход]
    
    SetReferrer -->|Да| FindSlot[find_placement_in_tree]
    SetReferrer -->|Нет| Login
    
    FindSlot --> UpdateTree[Обновление referral_tree]
    UpdateTree --> Login
    
    Login --> Dashboard[Dashboard]
```

---

## 3. Жизненный цикл генерации контента

```mermaid
stateDiagram-v2
    [*] --> UserInput: Пользователь вводит prompt
    
    UserInput --> ValidateCost: Проверка стоимости
    ValidateCost --> CheckBalance: Проверка баланса
    
    CheckBalance --> InsufficientFunds: Недостаточно токенов
    CheckBalance --> DeductTokens: Достаточно
    
    InsufficientFunds --> [*]
    
    DeductTokens --> CreateTask: Создание generation_task
    CreateTask --> Pending: status = pending
    
    Pending --> Processing: API запрос к AI
    Processing --> CallAPI: CometAPI Gemini/Suno
    
    CallAPI --> Completed: Успех
    CallAPI --> Failed: Ошибка
    
    Failed --> RefundTokens: Возврат токенов
    RefundTokens --> [*]
    
    Completed --> TempStorage: Сохранение в temp storage
    TempStorage --> UserPreview: Предпросмотр
    
    UserPreview --> UserDecision: Пользователь решает
    UserDecision --> SavePermanent: Сохранить
    UserDecision --> DiscardTemp: Не сохранять
    
    SavePermanent --> PermanentStorage: user-generated-content
    PermanentStorage --> PublishDecision: Опубликовать?
    
    PublishDecision --> Published: Да
    PublishDecision --> Private: Нет
    
    DiscardTemp --> Expired: Удаление через 7 дней
    
    Published --> [*]
    Private --> [*]
    Expired --> [*]
```

---

## 4. Реферальная система - Структура дерева

```mermaid
graph TD
    Root[Инвайтер - Level 0] --> L1_1[Реферал 1.1<br/>27%]
    Root --> L1_2[Реферал 1.2<br/>27%]
    Root --> L1_3[Реферал 1.3<br/>27%]
    Root --> L1_4[Реферал 1.4<br/>27%]
    Root --> L1_5[Реферал 1.5<br/>27%]
    Root --> L1_6[Реферал 1.6<br/>27%]
    
    L1_1 --> L2_1[Реферал 2.1<br/>10%]
    L1_1 --> L2_2[Реферал 2.2<br/>10%]
    
    L2_1 --> L3_1[Реферал 3.1<br/>5%]
    L3_1 --> L4_1[Реферал 4.1<br/>5%]
    L4_1 --> L5_1[Реферал 5.1<br/>5%]
    L5_1 --> L6_1[Реферал 6.1<br/>5%]
    L6_1 --> L7_1[Реферал 7.1<br/>10%]
    L7_1 --> L8_1[Реферал 8.1<br/>20%]
    L8_1 --> L9_1[Реферал 9.1<br/>3%]
    
    style Root fill:#4CAF50
    style L1_1 fill:#8BC34A
    style L1_2 fill:#8BC34A
    style L2_1 fill:#CDDC39
    style L3_1 fill:#FFEB3B
    style L4_1 fill:#FFC107
    style L5_1 fill:#FF9800
    style L6_1 fill:#FF5722
    style L7_1 fill:#F44336
    style L8_1 fill:#E91E63
    style L9_1 fill:#9C27B0
```

### Алгоритм размещения рефералов

```mermaid
flowchart TD
    Start[Новый пользователь<br/>с реф. ссылкой] --> CheckInviter{Inviter существует?}
    
    CheckInviter -->|Нет| NoReferrer[referrer_id = NULL]
    CheckInviter -->|Да| CheckLevel1{Места на Level 1?}
    
    CheckLevel1 -->|Да < 6| PlaceL1[Размещение под Inviter]
    CheckLevel1 -->|Нет >= 6| FindSpillover[Поиск spillover места]
    
    FindSpillover --> BFS[BFS по дереву<br/>слева направо]
    BFS --> CheckAllow{allow_referrer_referrals?}
    
    CheckAllow -->|Нет| NextNode[Следующий узел]
    CheckAllow -->|Да| CheckSlots{Есть места?}
    
    CheckSlots -->|Нет| NextNode
    CheckSlots -->|Да < 6| PlaceSpillover[Размещение]
    
    NextNode --> MoreNodes{Есть еще узлы?}
    MoreNodes -->|Да| BFS
    MoreNodes -->|Нет| FallbackInviter[Fallback под Inviter]
    
    PlaceL1 --> UpdateTree[Обновление referral_tree]
    PlaceSpillover --> UpdateTree
    FallbackInviter --> UpdateTree
    NoReferrer --> End[Конец]
    
    UpdateTree --> End
```

---

## 5. Система подарков - Flow диаграмма

```mermaid
sequenceDiagram
    participant Sender
    participant System
    participant DB
    participant Receiver
    participant Others
    
    Sender->>System: Отправить подарок
    System->>DB: Проверка баланса
    
    alt Недостаточно токенов
        DB-->>Sender: Ошибка: Insufficient funds
    else Достаточно
        DB->>DB: Списание токенов
        DB->>DB: CREATE gift record
        DB-->>System: gift_id
        System->>Receiver: Уведомление
        
        par Сценарий 1: Принятие в срок
            Receiver->>System: Принять подарок
            System->>DB: accept_gift
            
            alt referrer_id IS NULL
                DB->>DB: Зачисление + Set referrer
                DB->>DB: created_referral = true
            else referrer_id EXISTS
                DB->>DB: Только зачисление
            end
            
            DB-->>Receiver: Успех
            System->>Sender: Уведомление о принятии
        and Сценарий 2: Отклонение
            Receiver->>System: Отклонить подарок
            System->>DB: UPDATE status = rejected
            DB->>DB: Возврат токенов Sender
            DB-->>Receiver: Отклонено
            System->>Sender: Уведомление о возврате
        and Сценарий 3: Истечение срока
            Note over DB: 7 дней прошло
            DB->>DB: UPDATE status = expired
            DB->>DB: to_user_id = NULL
            DB-->>System: Публичный подарок
            System->>Others: Уведомление в ленте
            
            Others->>System: Активировать публичный
            System->>DB: CHECK referrer_id IS NULL
            
            alt Условие выполнено
                DB->>DB: Зачисление + Set referrer
                DB-->>Others: Успех
            else Условие не выполнено
                DB-->>Others: Ошибка: Уже есть реферер
            end
        end
    end
```

---

## 6. Распределение реферальных комиссий

```mermaid
flowchart TD
    Start[Пользователь оплачивает подписку] --> GetAmount[amount = subscription_price]
    GetAmount --> GetTree[Получение referral_tree]
    
    GetTree --> Loop{Для каждого уровня 1-9}
    
    Loop --> GetReferrer[Получить реферера на уровне N]
    GetReferrer --> CheckExists{Реферер существует?}
    
    CheckExists -->|Нет| NextLevel
    CheckExists -->|Да| CheckSub{Активная подписка?}
    
    CheckSub -->|Нет| NextLevel
    CheckSub -->|Да| GetRate[Получить % для уровня N]
    
    GetRate --> CalcCommission[commission = amount * rate]
    CalcCommission --> Credit[Зачисление на баланс]
    Credit --> LogCommission[Запись в referral_commissions]
    LogCommission --> Notify[Уведомление реферера]
    
    Notify --> NextLevel[N = N + 1]
    NextLevel --> MoreLevels{N <= 9?}
    
    MoreLevels -->|Да| Loop
    MoreLevels -->|Нет| End[Конец]
```

### Пример расчета комиссий

```mermaid
graph LR
    subgraph Payment Flow
        User[User платит $100] --> L1[Level 1: $27]
        User --> L2[Level 2: $10]
        User --> L3[Level 3: $5]
        User --> L4[Level 4: $5]
        User --> L5[Level 5: $5]
        User --> L6[Level 6: $5]
        User --> L7[Level 7: $10]
        User --> L8[Level 8: $20]
        User --> L9[Level 9: $3]
        User --> Platform[Platform: $10]
    end
    
    style User fill:#4CAF50
    style Platform fill:#2196F3
```

---

## 7. Database Entity-Relationship Diagram

```mermaid
erDiagram
    auth_users ||--o{ private_users : "1:1"
    auth_users ||--o{ public_profiles : "1:1"
    auth_users ||--o{ user_balances : "1:1"
    auth_users ||--o{ user_subscriptions : "1:N"
    
    subscription_tiers ||--o{ user_subscriptions : "1:N"
    
    auth_users ||--o{ referral_settings : "1:1"
    auth_users ||--o{ referral_tree : "1:N referrer"
    auth_users ||--o{ referral_tree : "1:1 referred"
    auth_users ||--o{ referral_commissions : "1:N payer"
    auth_users ||--o{ referral_commissions : "1:N receiver"
    
    auth_users ||--o{ gifts : "1:N from"
    auth_users ||--o{ gifts : "0:N to"
    
    auth_users ||--o{ generation_tasks : "1:N"
    
    auth_users ||--o{ likes : "1:N"
    generation_tasks ||--o{ likes : "1:N"
    
    auth_users ||--o{ favorites : "1:N"
    generation_tasks ||--o{ favorites : "1:N"
    
    auth_users ||--o{ follows : "1:N follower"
    auth_users ||--o{ follows : "1:N following"
    
    auth_users ||--o{ donations : "1:N from"
    auth_users ||--o{ donations : "1:N to"
    generation_tasks ||--o{ donations : "0:N"
    
    auth_users ||--o{ reminders : "1:N"
    
    auth_users {
        uuid id PK
        string email
        timestamp created_at
    }
    
    private_users {
        uuid id PK,FK
        bigint telegram_id
        string wallet_address
        uuid referrer_id FK
    }
    
    public_profiles {
        uuid id PK,FK
        string username UK
        string full_name
        string avatar_url
        boolean is_public
    }
    
    user_balances {
        uuid user_id PK,FK
        bigint balance
        timestamp updated_at
    }
    
    subscription_tiers {
        uuid id PK
        string name UK
        bigint max_storage_bytes
        int max_monthly_generations
        numeric price_monthly
    }
    
    user_subscriptions {
        uuid id PK
        uuid user_id FK
        uuid tier_id FK
        timestamp starts_at
        timestamp ends_at
        boolean is_active
    }
    
    referral_tree {
        uuid id PK
        uuid referrer_id FK
        uuid referred_id FK,UK
        int level
        timestamp created_at
    }
    
    referral_commission_rules {
        int level PK
        numeric commission_percent
    }
    
    referral_commissions {
        uuid id PK
        uuid payer_user_id FK
        uuid receiver_user_id FK
        int level
        numeric amount
        uuid subscription_id FK
        timestamp created_at
    }
    
    gifts {
        uuid id PK
        uuid from_user_id FK
        uuid to_user_id FK
        bigint amount
        string message
        string status
        timestamp created_at
        timestamp expires_at
        boolean created_referral
    }
    
    generation_tasks {
        uuid id PK
        uuid user_id FK
        int cost_in_tokens
        string provider
        string status
        string prompt
        jsonb request_metadata
        jsonb result_metadata
        string temp_storage_path
        string permanent_storage_path
        boolean is_published
        timestamp published_at
        timestamp created_at
    }
    
    likes {
        uuid user_id PK,FK
        uuid task_id PK,FK
        timestamp created_at
    }
    
    favorites {
        uuid user_id PK,FK
        uuid task_id PK,FK
        timestamp created_at
    }
    
    follows {
        uuid follower_id PK,FK
        uuid following_id PK,FK
        timestamp created_at
    }
    
    donations {
        uuid id PK
        uuid from_user_id FK
        uuid to_user_id FK
        bigint amount
        uuid task_id FK
        string message
        timestamp created_at
    }
    
    reminders {
        uuid id PK
        uuid user_id FK
        string title
        string description
        string reminder_type
        boolean is_completed
        timestamp due_date
        timestamp created_at
    }
```

---

## 8. Хранилище файлов - Структура

```mermaid
graph TB
    subgraph Supabase Storage
        subgraph temp-generated-content
            T1[task_id_1/]
            T2[task_id_2/]
            T3[task_id_3/]
            
            T1 --> TF1[image.png]
            T2 --> TF2[music.mp3]
            T3 --> TF3[video.mp4]
        end
        
        subgraph user-generated-content
            U1[user_id_1/]
            U2[user_id_2/]
            
            U1 --> UI1[images/]
            U1 --> UM1[music/]
            U1 --> UV1[videos/]
            U1 --> UU1[uploads/]
            U1 --> UA1[avatar/]
            
            UI1 --> UIF1[saved_image_1.png]
            UM1 --> UMF1[saved_music_1.mp3]
        end
    end
    
    subgraph Lifecycle
        LC1[Temp: TTL 7 days] -.->|Auto cleanup| T1
        LC1 -.->|Auto cleanup| T2
        LC2[Permanent: User managed] -.->|Quota based| U1
    end
    
    style temp-generated-content fill:#FFE082
    style user-generated-content fill:#A5D6A7
```

---

## 9. API Flow - Генерация изображения

```mermaid
sequenceDiagram
    participant Client
    participant API as Next.js API
    participant DB as PostgreSQL
    participant Queue as Job Queue
    participant AI as CometAPI Gemini
    participant Storage as Supabase Storage
    
    Client->>API: POST /api/generate/image
    Note over Client,API: { prompt, style, size }
    
    API->>DB: CHECK user_balances
    
    alt Недостаточно токенов
        DB-->>API: balance < cost
        API-->>Client: 402 Payment Required
    else Достаточно
        DB->>DB: BEGIN TRANSACTION
        DB->>DB: UPDATE user_balances<br/>SET balance = balance - cost
        DB->>DB: INSERT generation_tasks<br/>status = pending
        DB->>DB: COMMIT
        DB-->>API: task_id
        
        API->>Queue: Enqueue job
        API-->>Client: 202 Accepted<br/>{ task_id, status: pending }
        
        Queue->>AI: Generate image
        AI-->>Queue: Image data
        
        Queue->>Storage: Upload to temp bucket
        Storage-->>Queue: temp_url
        
        Queue->>DB: UPDATE generation_tasks<br/>status = completed<br/>temp_storage_path = url
        
        Queue->>Client: WebSocket event<br/>{ task_id, status: completed }
        
        Client->>API: GET /api/generate/tasks/:id
        API->>DB: SELECT generation_tasks
        DB-->>API: task data
        API-->>Client: { task, preview_url }
        
        alt Пользователь сохраняет
            Client->>API: POST /api/generate/tasks/:id/save
            API->>Storage: Copy temp → permanent
            Storage-->>API: permanent_url
            API->>DB: UPDATE generation_tasks<br/>permanent_storage_path = url<br/>status = saved
            API-->>Client: 200 OK
        else Пользователь не сохраняет
            Note over Storage: Auto-delete after 7 days
        end
    end
```

---

## 10. Deployment Architecture

```mermaid
graph TB
    subgraph Internet
        Users[Users]
        Bots[Telegram Bots]
    end
    
    subgraph Vercel Edge Network
        CDN[CDN / Edge Functions]
        
        subgraph Region: Auto
            NextApp[Next.js Application]
            SSR[Server-Side Rendering]
            API[API Routes]
        end
    end
    
    subgraph Supabase Cloud
        subgraph Region: US East
            PG[(PostgreSQL<br/>Primary)]
            PGR[(PostgreSQL<br/>Read Replicas)]
            SB[Supabase Storage]
            RT[Realtime Server]
            Auth[Auth Service]
        end
    end
    
    subgraph External Services
        GeminiAPI[CometAPI Gemini]
        SunoAPI[CometAPI Suno]
        TonBC[TON Blockchain]
        TacBC[TAC Network]
        TgAPI[Telegram API]
    end
    
    Users --> CDN
    Bots --> CDN
    CDN --> NextApp
    NextApp --> SSR
    NextApp --> API
    
    API --> Auth
    API --> PG
    API --> PGR
    API --> SB
    API --> RT
    
    API --> GeminiAPI
    API --> SunoAPI
    API --> TonBC
    API --> TacBC
    API --> TgAPI
    
    RT -.->|WebSocket| Users
    
    style Vercel Edge Network fill:#000000,color:#fff
    style Supabase Cloud fill:#3ECF8E
    style External Services fill:#FF6B6B
```

---

## 11. Security & Data Flow

```mermaid
flowchart TD
    subgraph Client
        Browser[Browser/App]
    end
    
    subgraph Edge
        WAF[WAF / DDoS Protection]
        RateLimit[Rate Limiter]
    end
    
    subgraph Application
        Auth[Authentication<br/>JWT Validation]
        RLS[Row Level Security]
        Validation[Input Validation<br/>Zod Schemas]
    end
    
    subgraph Database
        Encrypted[(Encrypted Data<br/>AES-256)]
    end
    
    Browser -->|HTTPS/TLS 1.3| WAF
    WAF --> RateLimit
    RateLimit --> Auth
    
    Auth -->|Valid Token| Validation
    Auth -->|Invalid| Reject[403 Forbidden]
    
    Validation -->|Valid Input| RLS
    Validation -->|Invalid| Reject2[400 Bad Request]
    
    RLS -->|Authorized| Encrypted
    RLS -->|Unauthorized| Reject3[403 Forbidden]
    
    Encrypted -->|Decrypted| Response[Response]
    Response -->|HTTPS| Browser
    
    style WAF fill:#FF6B6B
    style Auth fill:#4CAF50
    style RLS fill:#2196F3
    style Encrypted fill:#9C27B0
```

---

## 12. Monitoring & Observability Stack

```mermaid
graph TB
    subgraph Application Layer
        App[Next.js App]
        API[API Routes]
        Functions[Edge Functions]
    end
    
    subgraph Metrics Collection
        AppMetrics[Application Metrics]
        DBMetrics[Database Metrics]
        StorageMetrics[Storage Metrics]
    end
    
    subgraph Logging
        AppLogs[Application Logs]
        AccessLogs[Access Logs]
        ErrorLogs[Error Logs]
    end
    
    subgraph Monitoring Tools
        Vercel[Vercel Analytics]
        Supa[Supabase Dashboard]
        Sentry[Sentry<br/>Error Tracking]
    end
    
    subgraph Alerts
        Slack[Slack Notifications]
        Email[Email Alerts]
        PagerDuty[PagerDuty<br/>On-call]
    end
    
    App --> AppMetrics
    App --> AppLogs
    API --> AppMetrics
    API --> AppLogs
    Functions --> AppMetrics
    
    AppMetrics --> Vercel
    AppMetrics --> Sentry
    DBMetrics --> Supa
    StorageMetrics --> Supa
    
    AppLogs --> Sentry
    ErrorLogs --> Sentry
    AccessLogs --> Vercel
    
    Vercel --> Alerts
    Supa --> Alerts
    Sentry --> Alerts
    
    Alerts --> Slack
    Alerts --> Email
    Alerts -.->|Critical| PagerDuty
    
    style Monitoring Tools fill:#4CAF50
    style Alerts fill:#FF9800
```

---

## Легенда

### Цветовая схема диаграмм

- 🟢 **Зелёный** - Успешные операции, активные компоненты
- 🔵 **Синий** - Сервисы, базы данных
- 🟡 **Жёлтый** - Промежуточные состояния
- 🔴 **Красный** - Ошибки, критичные компоненты
- 🟣 **Фиолетовый** - Внешние сервисы

### Типы связей

- `→` Сплошная линия - Синхронный вызов
- `-.->` Пунктир - Асинхронный вызов / WebSocket
- `==>` Жирная линия - Основной поток данных

---

## Использование диаграмм

Эти диаграммы предназначены для:

1. **Онбординг новых разработчиков** - понимание архитектуры
2. **Планирование функций** - визуализация интеграций
3. **Отладка проблем** - трассировка потоков данных
4. **Документация** - техническая спецификация
5. **Презентации** - демонстрация стейкхолдерам

Все диаграммы созданы в формате Mermaid и могут быть:
- Встроены в Markdown
- Отрендерены в GitHub/GitLab
- Экспортированы в PNG/SVG через mermaid.live
- Интегрированы в документацию (Docusaurus, VitePress и т.д.)