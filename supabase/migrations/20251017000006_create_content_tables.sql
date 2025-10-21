-- Таблица для отслеживания задач генерации контента
CREATE TABLE IF NOT EXISTS public.generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cost_in_tokens INT NOT NULL CHECK (cost_in_tokens > 0),
  provider TEXT NOT NULL CHECK (provider IN ('cometapi-gemini', 'cometapi-suno', 'midjourney')),
  status public.GENERATION_STATUS NOT NULL DEFAULT 'pending',
  
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
);

-- Таблица лайков (составной первичный ключ)
CREATE TABLE IF NOT EXISTS public.likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.generation_tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, task_id)
);

-- Таблица избранного (составной первичный ключ)
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.generation_tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, task_id)
);

-- Таблица подписок на пользователей (составной первичный ключ)
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Таблица донатов
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  task_id UUID REFERENCES public.generation_tasks(id) ON DELETE SET NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_donate CHECK (from_user_id != to_user_id)
);

-- Таблица заметок и напоминаний
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_type public.REMINDER_TYPE NOT NULL DEFAULT 'note',
  is_completed BOOLEAN DEFAULT false,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для улучшения производительности
CREATE INDEX idx_generation_tasks_user_id ON public.generation_tasks(user_id);
CREATE INDEX idx_generation_tasks_status ON public.generation_tasks(status);
CREATE INDEX idx_generation_tasks_provider ON public.generation_tasks(provider);
CREATE INDEX idx_generation_tasks_is_published ON public.generation_tasks(is_published);
CREATE INDEX idx_generation_tasks_created_at ON public.generation_tasks(created_at DESC);

CREATE INDEX idx_likes_task_id ON public.likes(task_id);
CREATE INDEX idx_likes_created_at ON public.likes(created_at DESC);

CREATE INDEX idx_favorites_task_id ON public.favorites(task_id);
CREATE INDEX idx_favorites_created_at ON public.favorites(created_at DESC);

CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_follows_created_at ON public.follows(created_at DESC);

CREATE INDEX idx_donations_to_user_id ON public.donations(to_user_id);
CREATE INDEX idx_donations_from_user_id ON public.donations(from_user_id);
CREATE INDEX idx_donations_task_id ON public.donations(task_id);
CREATE INDEX idx_donations_created_at ON public.donations(created_at DESC);

CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX idx_reminders_is_completed ON public.reminders(is_completed);
CREATE INDEX idx_reminders_due_date ON public.reminders(due_date);
CREATE INDEX idx_reminders_reminder_type ON public.reminders(reminder_type);
