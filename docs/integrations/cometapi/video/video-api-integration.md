# Интеграция с видеомоделями CometAPI

Этот документ описывает, как интегрироваться с API видеомоделей CometAPI для использования в проектах с Claude Code Agents.

## 1. Аутентификация

Для доступа к CometAPI требуется аутентификация.

**Заголовки запроса:**

```
Authorization: Bearer YOUR_COMETAPI_KEY
X-Runway-Version: 2024-11-06
```

## 2. Базовый URL API

Эндпоинты для работы с RunwayML:

```
https://api.cometapi.com/runwayml/v1
```

## 3. Ключевые эндпоинты

### Генерация видео из изображения (Image to Video)

- **URL**: `POST /runwayml/v1/image_to_video`
- **Описание**: Конвертирует статичное изображение в видео с помощью AI модели.
- **Источник**: [RunwayML API Docs](https://docs.dev.runwayml.com/api/)

#### Параметры тела запроса (application/json)

- `promptImage` (string, required): URL исходного изображения.
- `seed` (integer, optional, 0-999999999): Число для инициализации генерации.
- `model` (enum<string>, required): Модель для использования. Доступное значение: `gen3a_turbo`.
- `promptText` (string, optional, <=512 символов): Текстовый промпт для влияния на генерацию.
- `watermark` (boolean, optional, default: false): Добавлять ли водяной знак.
- `duration` (integer, optional, 5-10, default: 5): Длительность видео в секундах.
- `ratio` (enum<string>, optional, default: "1280:720"): Соотношение сторон видео.

#### Пример запроса

```json
{
  "promptImage": "https://cdn.britannica.com/70/234870-050-D4D024BB/Orange-colored-cat-yawns-displaying-teeth.jpg",
  "seed": 4294967295,
  "model": "gen3a_turbo",
  "promptText": "A yawning cat",
  "watermark": false,
  "duration": 5,
  "ratio": "1280:768"
}
```

### Получение статуса задачи

- **URL**: `GET /runwayml/v1/tasks/{id}`
- **Описание**: Получает детали и прогресс задачи по генерации видео по ее ID.
- **Источник**: [RunwayML API Docs](https://docs.dev.runwayml.com/api/)

#### Параметры пути

- `id` (string, required): ID задачи.
  - Пример: `17f20503-6c24-4c16-946b-35dbbce2af2f`

## 4. Механизм колбэков

Опишите, как CometAPI использует колбэки для уведомления о завершении задач.

**Пример тела запроса колбэка:**

```json
{
  "taskId": "comet_task_xyz789",
  "status": "completed",
  "videoUrl": "https://storage.cometapi.com/videos/xyz789.mp4",
  "thumbnailUrl": "https://storage.cometapi.com/videos/xyz789_thumb.jpg"
}
```

## 5. Ограничения и рекомендации

- Укажите лимиты на количество запросов.
- Рекомендации по составлению эффективных промптов.
- Сроки хранения сгенерированных файлов.

---

_Источник: [Документация CometAPI](https://api.cometapi.com/doc) (предполагаемая ссылка)_
