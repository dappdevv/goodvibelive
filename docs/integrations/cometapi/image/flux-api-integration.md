# Интеграция с моделями изображений Flux (CometAPI x Replicate)

Этот документ описывает, как интегрироваться с моделями изображений `Flux` от Black Forest Labs через API CometAPI, который использует Replicate в качестве бэкенда.

## 1. Аутентификация

Для всех запросов требуется `Bearer` токен авторизации.

**Заголовок запроса:**

```
Authorization: Bearer YOUR_REPLICATE_API_KEY
```

## 2. Создание задачи генерации (Prediction)

- **URL**: `POST https://api.cometapi.com/replicate/v1/models/{model_owner}/{model_name}/predictions`
- **Описание**: Создает новую задачу для генерации изображения с помощью указанной модели Flux.
- **Источник**: [Black Forest Labs на Replicate](https://replicate.com/black-forest-labs)

### Параметры пути

- `model_owner` (string, required): Владелец модели, в данном случае `black-forest-labs`.
- `model_name` (string, required): Название конкретной модели Flux.

### Доступные модели Flux:

- `flux-kontext-max`
- `flux-kontext-pro`
- `flux-schnell`
- `flux-pro`
- `flux-dev`
- `flux-1.1-pro-ultra`
- `flux-1.1-pro`

**Пример URL для `flux-schnell`:**

```
https://api.cometapi.com/replicate/v1/models/black-forest-labs/flux-schnell/predictions
```

### Параметры тела запроса (`input`)

Объект `input` содержит все параметры для генерации изображения.

- `prompt` (string, required): Текстовое описание для генерации.
- `go_fast` (boolean, required): Параметр для ускорения генерации (детали зависят от модели).
- `guidance` (number, required): Насколько сильно результат должен соответствовать промпту.
- `megapixels` (string, required): Разрешение в мегапикселях.
- `num_outputs` (integer, required): Количество генерируемых изображений.
- `aspect_ratio` (string, required): Соотношение сторон (например, `"16:9"`).
- `output_format` (string, required): Формат выходного файла (например, `"jpg"`, `"png"`).
- `output_quality` (integer, required): Качество сжатия (1-100).
- `prompt_strength` (number, required): Сила влияния промпта при использовании входного изображения.
- `num_inference_steps` (integer, required): Количество шагов диффузии.
- `input_image` (string, optional): URL входного изображения. **Только модели `flux-kontext` поддерживают несколько изображений.**

### Пример запроса для `flux-schnell`

```json
{
  "input": {
    "prompt": "black forest gateau cake spelling out the words \"FLUX SCHNELL\", tasty, food photography, dynamic shot",
    "input_image": "https://replicate.delivery/xezq/XfwWjHJ7HfrmXE6ukuLVEpXWfeQ3PQeRI5mApuLXRxST7XMmC/tmpc91tlq20.png",
    "output_format": "jpg",
    "aspect_ratio": "16:9",
    "go_fast": true,
    "num_outputs": 1,
    "guidance": 7.5,
    "megapixels": "1.0",
    "prompt_strength": 0.8,
    "num_inference_steps": 25,
    "output_quality": 85
  }
}
```

## 3. Получение результата

После создания задачи, используйте эндпоинт для получения статуса и результата, который обычно предоставляет Replicate API.

- **URL**: `GET https://api.replicate.com/v1/predictions/{prediction_id}`
- **Заголовки**: Требуется тот же `Authorization` токен.

---

_Источник: Документация Replicate и CometAPI._
