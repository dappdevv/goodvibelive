# План разработки Good Vibe Live - Новый дизайн

## 📋 Анализ дизайна из изображения

### UI/UX Элементы

#### 1. Header (Шапка)
- **Слева:** Иконка меню (hamburger) для навигации
- **Центр:** Логотип "Good Vibe"
- **Стиль:** Минималистичный, чистый белый фон

#### 2. Контентные секции (скроллируемые)

**a) Сгенерированные изображения (верхняя секция)**
- Grid 3 колонки
- Карточки с закругленными углами (rounded-2xl)
- Изображения: горы, портрет, абстракция
- Без текстовых overlay

**b) User's generated Video**
- Заголовок секции
- Grid 3 колонки
- Video preview с play button overlay
- Третья карточка имеет текст "Creative Writing"

**c) Users Posts**
- Заголовок секции
- Grid 3 колонки
- Карточки с текстовым overlay внизу:
  - "Adventure Travels"
  - "Creative Writing"
  - "Tech Innovations"
- Полупрозрачный темный gradient для читаемости текста

**d) Adser's generated music**
- Заголовок с play иконкой
- Список треков (вертикальный layout)
- Каждый трек:
  - Play button слева
  - Название трека
  - Жанр/описание (lighter text)
  - Like и Favorite иконки справа

#### 3. Bottom Bar (AI Search)
- Фиксированная позиция внизу
- Поле ввода "Ask AI" с иконкой поиска
- Иконка микрофона (voice input)
- Иконка отправки (paper plane)
- Светлый фон, subtle shadow

### Цветовая схема
- **Background:** Светло-серый (#F5F5F7)
- **Cards:** Белый (#FFFFFF)
- **Text Primary:** Темно-серый (#1F2937)
- **Text Secondary:** Серый (#6B7280)
- **Accents:** Различные overlay цвета для категорий

### Типографика
- **Заголовки:** Sans-serif, medium weight
- **Основной текст:** Sans-serif, regular
- **Размеры:** Responsive, mobile-first

---

## 🗂️ Текущая структура проекта (для удаления/переноса)

### Файлы для переноса в `src/old_design/`:

```
src/app/
├── page.tsx              → old_design/pages/home.tsx
├── dashboard/
│   └── page.tsx          → old_design/pages/dashboard.tsx
├── profile/
│   ├── page.tsx          → old_design/pages/profile.tsx
│   └── ProfileClient.tsx → old_design/components/ProfileClient.tsx
├── suno/
│   └── page.tsx          → old_design/pages/suno.tsx
├── images/
│   └── page.tsx          → old_design/pages/images.tsx
└── docs/
    └── page.tsx          → old_design/pages/docs.tsx

src/components/
├── Chat.tsx              → old_design/components/Chat.tsx
├── Suno.tsx              → old_design/components/Suno.tsx
├── TodoList.tsx          → old_design/components/TodoList.tsx
├── TopDropdown.tsx       → old_design/components/TopDropdown.tsx
├── SettingsIcon.tsx      → old_design/components/SettingsIcon.tsx
```

### Файлы для сохранения (используются в новом дизайне):

```
src/components/
├── AuthPanel.tsx         ✅ Переиспользуем
├── TelegramLogin.tsx     ✅ Переиспользуем
├── TelegramLink.tsx      ✅ Переиспользуем
├── Providers.tsx         ✅ Сохраняем

src/lib/
├── supabaseClient.ts     ✅ Сохраняем
├── storage.ts            ✅ Сохраняем

src/store/
├── useAppStore.ts        ✅ Сохраняем
```

---

## 🎨 Новая компонентная структура

### Макет приложения

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (существующий)
│   ├── page.tsx                      # 🆕 Новая главная страница
│   ├── (auth)/                       # 🆕 Auth группа
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── feed/                         # 🆕 Главная лента
│   │   └── page.tsx
│   ├── create/                       # 🆕 Создание контента
│   │   ├── image/
│   │   │   └── page.tsx
│   │   ├── video/
│   │   │   └── page.tsx
│   │   └── music/
│   │       └── page.tsx
│   ├── profile/
│   │   └── [username]/               # 🆕 Публичные профили
│   │       └── page.tsx
│   └── settings/                     # 🆕 Настройки
│       └── page.tsx
│
├── components/
│   ├── layout/                       # 🆕 Layout компоненты
│   │   ├── Header.tsx                    # Верхняя панель с меню
│   │   ├── BottomBar.tsx                 # AI поиск внизу
│   │   ├── Sidebar.tsx                   # Desktop sidebar
│   │   └── MobileNav.tsx                 # Mobile navigation drawer
│   │
│   ├── feed/                         # 🆕 Компоненты ленты
│   │   ├── FeedSection.tsx               # Обертка секции
│   │   ├── ImageGrid.tsx                 # Grid изображений
│   │   ├── VideoGrid.tsx                 # Grid видео
│   │   ├── PostsGrid.tsx                 # Grid постов
│   │   ├── MusicList.tsx                 # Список музыки
│   │   └── MediaCard.tsx                 # Универсальная карточка медиа
│   │
│   ├── generation/                   # 🆕 AI генерация
│   │   ├── ImageGenerator.tsx
│   │   ├── VideoGenerator.tsx
│   │   ├── MusicGenerator.tsx
│   │   └── GenerationPreview.tsx
│   │
│   ├── ui/                          # 🆕 UI primitives
│   │   ├── Card.tsx                     # Базовая карточка
│   │   ├── Button.tsx                   # Кнопки
│   │   ├── Input.tsx                    # Поля ввода
│   │   ├── Avatar.tsx                   # Аватары
│   │   ├── Badge.tsx                    # Badges
│   │   └── PlayButton.tsx               # Play overlay
│   │
│   ├── shared/                      # Переиспользуемые
│   │   ├── AuthPanel.tsx            ✅ Существующий
│   │   ├── TelegramLogin.tsx        ✅ Существующий
│   │   └── LoadingSpinner.tsx       🆕
│   │
│   └── Providers.tsx                ✅ Существующий
│
├── hooks/                           # 🆕 Custom hooks
│   ├── useAuth.ts
│   ├── useGeneration.ts
│   ├── useFeed.ts
│   └── useAudioPlayer.ts
│
├── lib/
│   ├── supabaseClient.ts            ✅ Существующий
│   ├── storage.ts                   ✅ Существующий
│   ├── api/                         🆕 API helpers
│   │   ├── generation.ts
│   │   ├── posts.ts
│   │   └── music.ts
│   └── utils/                       🆕 Utilities
│       ├── cn.ts                        # classnames helper
│       └── format.ts                    # Форматирование
│
├── store/
│   └── useAppStore.ts               ✅ Существующий (расширить)
│
└── old_design/                      🆕 Старый код
    ├── pages/
    └── components/
```

---

## 🔨 Детальный план реализации

### Phase 1: Подготовка (День 1)

#### Задача 1.1: Реорганизация файловой структуры
```bash
# Создать папку для старого дизайна
mkdir -p src/old_design/pages
mkdir -p src/old_design/components

# Переместить существующие страницы
mv src/app/dashboard src/old_design/pages/
mv src/app/profile src/old_design/pages/
mv src/app/suno src/old_design/pages/
mv src/app/images src/old_design/pages/
mv src/app/docs src/old_design/pages/

# Переместить старые компоненты
mv src/components/Chat.tsx src/old_design/components/
mv src/components/Suno.tsx src/old_design/components/
mv src/components/TodoList.tsx src/old_design/components/
mv src/components/TopDropdown.tsx src/old_design/components/
mv src/components/SettingsIcon.tsx src/old_design/components/
```

#### Задача 1.2: Создание новой структуры папок
```bash
# Layout компоненты
mkdir -p src/components/layout
mkdir -p src/components/feed
mkdir -p src/components/generation
mkdir -p src/components/ui
mkdir -p src/components/shared

# Hooks
mkdir -p src/hooks

# API helpers
mkdir -p src/lib/api
mkdir -p src/lib/utils

# Новые страницы
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/signup
mkdir -p src/app/feed
mkdir -p src/app/create/image
mkdir -p src/app/create/video
mkdir -p src/app/create/music
mkdir -p src/app/settings
```

---

### Phase 2: UI Foundation (День 2-3)

#### Задача 2.1: Создать UI primitives

**src/components/ui/Card.tsx**
- Базовая карточка с вариантами
- Props: rounded, shadow, padding, hover effects

**src/components/ui/Button.tsx**
- Варианты: primary, secondary, ghost, icon
- Sizes: sm, md, lg
- States: loading, disabled

**src/components/ui/Input.tsx**
- Текстовые поля с иконками
- Validation states
- Search variant для AI поиска

**src/components/ui/PlayButton.tsx**
- Overlay play button для видео
- Анимация при hover

#### Задача 2.2: Layout компоненты

**src/components/layout/Header.tsx**
```tsx
// Компоненты:
// - Hamburger menu (mobile)
// - Logo "Good Vibe" (центр)
// - User avatar / Login (desktop, справа)
```

**src/components/layout/BottomBar.tsx**
```tsx
// Bottom search bar:
// - Search icon + input "Ask AI"
// - Microphone icon (voice)
// - Send icon (submit)
// - Fixed position
```

**src/components/layout/Sidebar.tsx**
```tsx
// Desktop sidebar navigation:
// - Feed
// - Create (Image, Video, Music)
// - My Content
// - Profile
// - Settings
```

---

### Phase 3: Feed Components (День 4-5)

#### Задача 3.1: Grid компоненты

**src/components/feed/ImageGrid.tsx**
```tsx
// Grid layout для изображений
// - 3 колонки на desktop
// - 2 колонки на tablet
// - 1-2 колонки на mobile
// - Lazy loading
// - Click для preview
```

**src/components/feed/VideoGrid.tsx**
```tsx
// Grid для видео
// - Play button overlay
// - Thumbnail preview
// - Duration badge
// - Similar responsive behavior
```

**src/components/feed/PostsGrid.tsx**
```tsx
// Grid для постов пользователей
// - Text overlay внизу карточки
// - Gradient background для текста
// - Category badges
// - User avatar в углу
```

**src/components/feed/MusicList.tsx**
```tsx
// Список треков
// - Play button
// - Track info (название, жанр)
// - Like/Favorite actions
// - Now playing indicator
// - Audio player integration
```

#### Задача 3.2: MediaCard компонент

**src/components/feed/MediaCard.tsx**
```tsx
// Универсальная карточка медиа:
type MediaType = 'image' | 'video' | 'post';

interface MediaCardProps {
  type: MediaType;
  src: string;
  title?: string;
  overlay?: React.ReactNode;
  onPlay?: () => void;
  onClick?: () => void;
}
```

---

### Phase 4: Главная страница (День 6-7)

#### Задача 4.1: Новая главная страница

**src/app/page.tsx**
```tsx
// Структура:
// 1. Header
// 2. Scrollable content:
//    - Generated Images section
//    - User's generated Video section
//    - Users Posts section
//    - Generated Music section
// 3. Bottom AI Search Bar

// Features:
// - Infinite scroll
// - Pull to refresh
// - Section headers
// - Loading states
```

#### Задача 4.2: Feed Section Wrapper

**src/components/feed/FeedSection.tsx**
```tsx
// Wrapper для секций:
interface FeedSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onViewAll?: () => void;
}

// Включает:
// - Title с иконкой
// - "View All" link (optional)
// - Spacing между секциями
```

---

### Phase 5: AI Search & Voice (День 8)

#### Задача 5.1: AI Search интеграция

**src/components/layout/BottomBar.tsx**
```tsx
// Features:
// - Text search с autocomplete
// - Voice input (Web Speech API)
// - Search suggestions
// - Recent searches
// - Quick actions

// Integration:
// - OpenAI API для chat
// - Voice-to-text
// - Text-to-voice (optional)
```

---

### Phase 6: Генерация контента (День 9-10)

#### Задача 6.1: Image Generator

**src/app/create/image/page.tsx**
**src/components/generation/ImageGenerator.tsx**
```tsx
// UI:
// - Prompt input (textarea)
// - Style selector
// - Size/aspect ratio
// - Advanced options (collapsed)
// - Cost preview
// - Generate button

// Flow:
// 1. Input prompt
// 2. Select options
// 3. Check balance
// 4. Generate (loading state)
// 5. Preview result
// 6. Save or regenerate
```

#### Задача 6.2: Music Generator

**src/app/create/music/page.tsx**
**src/components/generation/MusicGenerator.tsx**
```tsx
// Similar to image but for music:
// - Prompt/description
// - Genre selector
// - Mood selector
// - Duration
// - Vocals option
// - Lyrics input (optional)
```

---

### Phase 7: Профили и социальные функции (День 11-12)

#### Задача 7.1: Публичный профиль

**src/app/profile/[username]/page.tsx**
```tsx
// Profile page:
// - Avatar & cover
// - Bio
// - Stats (followers, posts, likes)
// - Tabs:
//   - Posts
//   - Generated content
//   - Liked
// - Follow button
// - Send gift button
```

#### Задача 7.2: Социальные действия

**src/components/social/** (новая папка)
```
- LikeButton.tsx
- FavoriteButton.tsx
- FollowButton.tsx
- ShareButton.tsx
- DonateButton.tsx
```

---

### Phase 8: Адаптивность и оптимизация (День 13-14)

#### Задача 8.1: Responsive Design
- Mobile-first breakpoints
- Touch gestures
- Swipe actions
- Pull to refresh

#### Задача 8.2: Performance
- Image optimization (next/image)
- Lazy loading
- Code splitting
- Prefetching

#### Задача 8.3: Accessibility
- Keyboard navigation
- ARIA labels
- Focus management
- Screen reader support

---

## 📝 Детальный TODO List для implementation

### Week 1: Foundation

**День 1: Подготовка**
- [ ] Создать папку `src/old_design/`
- [ ] Переместить старые страницы и компоненты
- [ ] Создать новую структуру папок
- [ ] Обновить imports в `layout.tsx`
- [ ] Настроить Tailwind для новых компонентов

**День 2-3: UI Primitives**
- [ ] `ui/Card.tsx` - базовая карточка
- [ ] `ui/Button.tsx` - кнопки всех вариантов
- [ ] `ui/Input.tsx` - поля ввода
- [ ] `ui/Avatar.tsx` - аватары
- [ ] `ui/Badge.tsx` - значки
- [ ] `ui/PlayButton.tsx` - play overlay
- [ ] Создать Storybook для UI компонентов (optional)

**День 4-5: Layout**
- [ ] `layout/Header.tsx` - шапка с меню
- [ ] `layout/BottomBar.tsx` - AI search bar
- [ ] `layout/Sidebar.tsx` - desktop navigation
- [ ] `layout/MobileNav.tsx` - mobile drawer
- [ ] Интеграция с `app/layout.tsx`

### Week 2: Feed & Content

**День 6-7: Feed Components**
- [ ] `feed/FeedSection.tsx` - wrapper секций
- [ ] `feed/ImageGrid.tsx` - grid изображений
- [ ] `feed/VideoGrid.tsx` - grid видео
- [ ] `feed/PostsGrid.tsx` - grid постов
- [ ] `feed/MusicList.tsx` - список музыки
- [ ] `feed/MediaCard.tsx` - универсальная карточка

**День 8-9: Main Page**
- [ ] Новая `app/page.tsx` с feed структурой
- [ ] Интеграция всех feed компонентов
- [ ] Mock данные для тестирования
- [ ] Scroll behavior и loading states
- [ ] Pull to refresh

**День 10: AI Search**
- [ ] AI search input в BottomBar
- [ ] Voice input интеграция
- [ ] Search suggestions
- [ ] API integration с OpenAI

### Week 3: Generation & Social

**День 11-12: Content Generation**
- [ ] `create/image/page.tsx` - страница генерации
- [ ] `generation/ImageGenerator.tsx` - компонент
- [ ] `generation/MusicGenerator.tsx` - компонент
- [ ] `generation/GenerationPreview.tsx` - preview
- [ ] Интеграция с CometAPI

**День 13-14: Profiles & Social**
- [ ] `profile/[username]/page.tsx` - публичный профиль
- [ ] Social actions компоненты (Like, Follow и т.д.)
- [ ] Stats dashboard
- [ ] Gift modal

### Week 4: Polish & Launch

**День 15-16: Optimization**
- [ ] Image optimization
- [ ] Code splitting
- [ ] Performance audit
- [ ] Accessibility improvements

**День 17-18: Testing & Bug Fixes**
- [ ] E2E тесты для основных флоу
- [ ] Mobile testing на реальных устройствах
- [ ] Bug fixes
- [ ] Final polish

**День 19-20: Deployment**
- [ ] Production build
- [ ] Deploy to Vercel
- [ ] Monitoring setup
- [ ] Documentation

---

## 🎨 Design Tokens

### Colors
```css
--bg-primary: #F5F5F7;
--bg-card: #FFFFFF;
--bg-overlay: rgba(0, 0, 0, 0.5);

--text-primary: #1F2937;
--text-secondary: #6B7280;
--text-tertiary: #9CA3AF;

--accent-blue: #3B82F6;
--accent-green: #10B981;
--accent-purple: #8B5CF6;
--accent-pink: #EC4899;
```

### Spacing
```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
```

### Border Radius
```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

---

## 🔄 Migration Strategy

### Поэтапная миграция функционала

#### Step 1: UI Layer (Week 1)
- Новые компоненты без бизнес-логики
- Storybook для изолированной разработки
- Design system documentation

#### Step 2: Pages (Week 2)
- Новая главная страница с mock данными
- Layout integration
- Navigation flow

#### Step 3: Integration (Week 3)
- API integration
- State management
- Real data

#### Step 4: Feature Parity (Week 4)
- Все функции из старого дизайна
- Новые функции из дизайна
- Testing & optimization

---

## 📦 Dependencies to Add

```json
{
  "dependencies": {
    "@headlessui/react": "^2.0.0",      // Unstyled UI components
    "framer-motion": "^11.0.0",          // Animations
    "react-intersection-observer": "^9.0.0", // Lazy loading
    "react-hot-toast": "^2.4.0",         // Notifications
    "use-sound": "^4.0.0",               // Audio player
    "wavesurfer.js": "^7.0.0"            // Waveform visualization
  },
  "devDependencies": {
    "@storybook/react": "^8.0.0",        // Component development
    "@testing-library/react": "^14.0.0", // Testing
    "playwright": "^1.40.0"              // E2E testing
  }
}
```

---

## ✅ Acceptance Criteria

### Главная страница должна:
- [ ] Полностью соответствовать дизайну из изображения
- [ ] Быть responsive (mobile, tablet, desktop)
- [ ] Загружаться < 3 секунд на 3G
- [ ] Поддерживать все жесты (swipe, pull-to-refresh)
- [ ] Иметь smooth scroll и animations
- [ ] Работать без JavaScript (progressive enhancement)

### Компоненты должны:
- [ ] Быть reusable и composable
- [ ] Иметь TypeScript types
- [ ] Поддерживать dark mode (future)
- [ ] Быть accessible (WCAG 2.1 AA)
- [ ] Иметь unit tests (coverage > 80%)

### Performance:
- [ ] Lighthouse Score > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.9s
- [ ] Cumulative Layout Shift < 0.1

---

## 🚀 Quick Start Commands

```bash
# 1. Backup старого кода
git checkout -b backup/old-design
git add .
git commit -m "Backup old design before migration"

# 2. Создать ветку для нового дизайна
git checkout -b feature/new-design

# 3. Запустить реорганизацию
npm run migrate:structure

# 4. Установить новые зависимости
npm install @headlessui/react framer-motion react-intersection-observer

# 5. Запустить dev сервер
npm run dev

# 6. Запустить Storybook (optional)
npm run storybook
```

---

## 📚 Additional Resources

- [Design Mockup](#) - Figma файл (если есть)
- [Component Library](#) - Storybook deployed
- [API Documentation](./api-docs.md)
- [Style Guide](./style-guide.md)
- [Testing Guide](./testing-guide.md)

---

**Следующий шаг:** Получить одобрение этого плана и начать implementation в Code Mode.