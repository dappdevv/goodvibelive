-- Миграция: Создание enum типов для платформы Good Vibe Live
-- Дата: 17.10.2025
-- Описание: Создание перечисления типов для подарков, генерации контента и напоминаний

-- GIFT_STATUS - статусы подарков
CREATE TYPE public.gift_status AS ENUM (
  'pending',    -- ожидание принятия получателем
  'accepted',   -- принят получателем
  'expired',    -- истек срок (7 дней)
  'claimed',    -- принят другим пользователем из публичного списка
  'rejected'    -- отклонен получателем
);

-- GENERATION_STATUS - статусы генерации контента
CREATE TYPE public.generation_status AS ENUM (
  'pending',     -- ожидание обработки
  'processing',  -- обработка в прогрессе
  'completed',   -- успешно завершена
  'failed',      -- ошибка при генерации
  'saved',       -- сохранено в хранилище
  'expired'      -- удалено из временного хранилища
);

-- REMINDER_TYPE - типы напоминаний
CREATE TYPE public.reminder_type AS ENUM (
  'note',  -- заметка
  'task'   -- задача
);
