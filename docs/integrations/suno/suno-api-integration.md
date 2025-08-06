# Интеграция с Suno API для Claude Code Agents

Этот документ описывает, как использовать Suno API для генерации музыки, текстов и обработки аудио в проектах с использованием Claude Code Agents.

## 1. Аутентификация

Все запросы к Suno API требуют аутентификации. Используйте `Bearer` токен для авторизации.

**Заголовок авторизации:**

```
Authorization: Bearer YOUR_API_KEY
```

Получите ваш `API_KEY` на странице управления ключами API Suno.

## 2. Базовый URL API

Все эндпоинты API доступны по следующему базовому URL:

```
https://api.sunoapi.org
```

## 3. Основные возможности

- **Генерация музыки и текстов**: Создание треков, текстов песен.
- **Обработка аудио**: Расширение, разделение вокала, конвертация в WAV.
- **Генерация медиа**: Создание музыкальных видео и обложек.
- **Управление**: Проверка кредитов, загрузка файлов.

## 4. Ключевые эндпоинты

### Музыка и Текст

- **Генерация музыки**: `POST /api/v1/generate`
- **Получение информации о генерации**: `GET /api/v1/generate/record-info?taskId={taskId}`
- **Генерация текста песни**: `POST /api/v1/lyrics`
- **Получение текста с таймкодами**: `POST /api/v1/generate/get-timestamped-lyrics`
- **Улучшение стиля музыки (Boost)**: `POST /api/v1/style/generate` (только для модели V4_5)

### Обработка Аудио

- **Расширение аудио**: `POST /api/v1/generate/extend`
- **Загрузка и обработка (Cover) аудио**: `POST /api/v1/generate/upload-cover`
- **Разделение вокала**: `POST /vocal-removal/generate`
- **Получение деталей разделения вокала**: `GET /api/v1/vocal-removal/record-info?taskId={taskId}`
- **Конвертация в WAV**: `POST /api/v1/wav/generate`
- **Получение деталей конвертации в WAV**: `GET /api/v1/wav/record-info?taskId={taskId}`

### Видео и Обложки

- **Генерация обложки**: `POST /api/v1/suno/cover/generate`
- **Получение деталей обложки**: `GET /api/v1/suno/cover/task-result?taskId={taskId}`
- **Создание музыкального видео**: `POST /api/v1/mp4/generate`
  - **Параметры**: `taskId`, `audioId`, `callBackUrl`, `author`, `domainName`.
- **Получение деталей музыкального видео**: `GET /api/v1/mp4/record-info?taskId={taskId}`

### Управление

- **Проверка оставшихся кредитов**: `GET /api/v1/get-credits`
- **Загрузка файла (Base64)**: `POST /api/v1/file/upload/base64`
- **Загрузка файла (Stream)**: `POST /api/v1/file/upload/stream`
- **Загрузка файла (URL)**: `POST /api/v1/file/upload/url`

## 5. Механизм колбэков (Callbacks)

Используйте `callBackUrl` для получения `POST` уведомлений о завершении задач, чтобы избежать постоянных опросов.

## 6. Хранение файлов

- **Аудио (MP3, WAV), Видео (MP4)**: Хранятся **15 дней**.
- **Обложки**: Хранятся **14 дней**.

---

_Источники:_

- _[Suno API Quick Start](https://docs.sunoapi.org/suno-api/quickstart)_
- _[Generate Music](https://docs.sunoapi.org/suno-api/generate-music)_
- _[Create Music Video](https://docs.sunoapi.org/suno-api/create-music-video)_
- _[Get Remaining Credits](https://docs.sunoapi.org/suno-api/get-remaining-credits)_
- _[File Upload API](https://docs.sunoapi.org/file-upload-api/upload-file-base-64)_
- _... и другие страницы документации Suno API._
