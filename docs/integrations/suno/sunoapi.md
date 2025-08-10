# Suno API (from screenshots)

This document is a cleaned, consolidated Markdown based on the screenshots in `integrations-api/suno/`. It normalizes obvious OCR typos. Treat as unofficial notes extracted from the current Suno API docs.

- Base URL: `https://api.sunoapi.org`
- Auth: Bearer token required for all endpoints
  - Header: `Authorization: Bearer <YOUR_API_KEY>`

## Authentication
- All endpoints require Bearer Token in the `Authorization` header.
- Keep your API key secret; rotate if compromised.

## Credits
### GET /api/v1/generate/credit — Get Remaining Credits
Retrieve the current credit balance for your account.

```bash
curl --request GET \
  --url "https://api.sunoapi.org/api/v1/generate/credit" \
  --header "Authorization: Bearer <token>"
```

Response (200):
```json
{
  "code": 200,
  "msg": "success",
  "data": 100
}
```

---

## Music Generation
### POST /api/v1/generate — Generate Music
Create a new music track.

Body (JSON):
- `prompt` string: Text prompt/lyrics (optional if using purely style-driven generation)
- `style` string: e.g. "Classical"
- `title` string (optional)
- `customMode` boolean (OCR: "custontode"): enable custom parameters
- `instrumental` boolean
- `model` string: e.g. "V3.5"
- `negativeTags` string: comma-separated tags to avoid
- `callBackUrl` string<url> (optional): webhook to receive task status

```bash
curl --request POST \
  --url "https://api.sunoapi.org/api/v1/generate" \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: application/json" \
  --data '{
    "prompt": "A calm and relaxing piano track",
    "style": "Classical",
    "title": "Peaceful Piano",
    "customMode": true,
    "instrumental": true,
    "model": "V3.5",
    "negativeTags": "Heavy Metal, Upbeat Drums",
    "callBackUrl": "https://api.example.com/callback"
  }'
```

Response (200):
```json
{
  "code": 200,
  "msg": "success",
  "taskId": "5c79xxxxbe8e"
}
```

### POST /api/v1/generate/extend — Extend Music
Extend/continue an existing music track.

Body (JSON):
- `prompt` string
- `style` string
- `title` string (optional)
- `continueAt` number: seconds offset from which to extend
- `model` string: e.g. "V3.5"
- `negativeTags` string
- `defaultParamFlag` boolean (use default params)
- `callBackUrl` string<url> (optional)

```bash
curl --request POST \
  --url "https://api.sunoapi.org/api/v1/generate/extend" \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: application/json" \
  --data '{
    "prompt": "Extend the music with more relaxing notes",
    "style": "Classical",
    "title": "Peaceful Piano Extended",
    "continueAt": 60,
    "model": "V3.5",
    "negativeTags": "Relaxing Piano",
    "defaultParamFlag": true,
    "callBackUrl": "https://api.example.com/callback"
  }'
```

Response (200):
```json
{"code":200,"msg":"success","data":{"taskId":"5c79wrkrbese"}}
```

### GET /api/v1/generate/record-info — Get Music Generation Details
Retrieve details for a generation task.

Query params:
- `taskId` string (required)

```bash
curl --request GET \
  --url "https://api.sunoapi.org/api/v1/generate/record-info?taskId=<taskId>" \
  --header "Authorization: Bearer <token>"
```

Response (200) example (fields vary):
```json
{
  "code": 200,
  "data": {
    "taskId": "5c79xxxxbe8e",
    "parentMusicId": "",
    "param": "{\"prompt\":\"A calm piano track\",\"style\":\"Classical\"}",
    "id": "8551kkxx662c",
    "audioUrl": "https://example.com/audio.mp3",
    "streamAudioUrl": "https://example.com/stream",
    "imageUrl": "https://example.com/cover.jpeg",
    "prompt": "[Verse] ...",
    "modelName": "chirp-v3-5",
    "title": "...",
    "tags": "electrifying, rock",
    "createTime": "2025-01-01 00:00:00",
    "duration": 198.44,
    "status": "SUCCESS",
    "type": "GENERATE",
    "errorCode": null,
    "errorMessage": null
  }
}
```

---

## Upload-driven Generation
### POST /api/v1/generate/upload-cover — Upload And Cover Audio
Transform an uploaded audio while keeping the core melody, producing a new style.

Body (JSON):
- `uploadUrl` string<url>: URL to a previously uploaded file
- `prompt` string
- `style` string
- `customMode` boolean
- `instrumental` boolean
- `model` string
- `negativeTags` string
- `callBackUrl` string<url> (optional)

```bash
curl --request POST \
  --url "https://api.sunoapi.org/api/v1/generate/upload-cover" \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: application/json" \
  --data '{
    "uploadUrl": "https://storage.example.com/upload",
    "prompt": "A calm and relaxing piano track with soft melodies",
    "style": "Classical",
    "customMode": true,
    "instrumental": true,
    "model": "V3.5",
    "negativeTags": "Heavy Metal, Upbeat Drums",
    "callBackUrl": "https://api.example.com/callback"
  }'
```

### POST /api/v1/generate/upload-extend — Upload And Extend Audio
Extend an uploaded audio track while preserving the input style.

Body (JSON):
- `uploadUrl` string<url>
- `defaultParamFlag` boolean
- `instrumental` boolean
- `style` string
- `title` string
- `continueAt` number
- `model` string
- `negativeTags` string
- `callBackUrl` string<url> (optional)

```bash
curl --request POST \
  --url "https://api.sunoapi.org/api/v1/generate/upload-extend" \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: application/json" \
  --data '{
    "uploadUrl": "https://storage.example.com/upload",
    "defaultParamFlag": true,
    "instrumental": true,
    "style": "Classical",
    "title": "Peaceful Piano Extended",
    "continueAt": 68,
    "model": "V3.5",
    "negativeTags": "Relaxing Piano",
    "callBackUrl": "https://api.example.com/callback"
  }'
```

---

## Lyrics
### POST /api/v1/lyrics — Generate Lyrics
Create lyrics without generating audio.

```bash
curl --request POST \
  --url "https://api.sunoapi.org/api/v1/lyrics" \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: application/json" \
  --data '{
    "prompt": "A song about peaceful night in the city",
    "callBackUrl": "https://api.example.com/callback"
  }'
```

Response (200):
```json
{"code":200,"msg":"success","taskId":"5c79xxxxbe8e"}
```

### GET /api/v1/lyrics/record-info — Get Lyrics Generation Details
```bash
curl --request GET \
  --url "https://api.sunoapi.org/api/v1/lyrics/record-info?taskId=<taskId>" \
  --header "Authorization: Bearer <token>"
```

Response example:
```json
{
  "code": 200,
  "data": {
    "taskId": "11dcxxxx0bf",
    "param": "{\"prompt\":\"A song about peaceful night...\"}",
    "lyricsData": [
      {"text": "[Verse] ...", "status": "complete", "errorMessage": null}
    ],
    "status": "SUCCESS",
    "type": "LYRICS"
  }
}
```

### POST /api/v1/generate/get-timestamped-lyrics — Get Timestamped Lyrics
Retrieve timestamped lyrics for synchronized display.

Body (JSON):
- `taskId` string (required)
- `musicIndex` number (optional)

```bash
curl --request POST \
  --url "https://api.sunoapi.org/api/v1/generate/get-timestamped-lyrics" \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: application/json" \
  --data '{"taskId":"5c79xxxxbe8e","musicIndex":0}'
```

---

## Style Boost
### POST /api/v1/style/generate — Boost Music Style
Apply style transformation parameters.

Body (JSON) example:
- `content` string: e.g. "Fog, Mysterious"

```bash
curl --request POST \
  --url "https://api.sunoapi.org/api/v1/style/generate" \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: application/json" \
  --data '{"content":"Fog, Mysterious"}'
```

Response example:
```json
{
  "code": 200,
  "taskId": "<string>",
  "param": "<string>",
  "result": "<string>",
  "creditsRemaining": 123,
  "successFlag": "SUCCESS",
  "errorCode": null,
  "errorMessage": null,
  "createTime": "2025-01-01 00:00:00"
}
```

---

## Cover Images
### POST /api/v1/suno/cover/generate — Create Suno Cover Task
```bash
curl --request POST \
  --url "https://api.sunoapi.org/api/v1/suno/cover/generate" \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: application/json" \
  --data '{"taskId":"736128b3...","callBackUrl":"https://api.example.com/callback"}'
```

Response (200):
```json
{"data":{"taskId":"2lae3c3c2a01fa5e030b3799faddd56"}}
```

### GET /api/v1/suno/cover/record-info — Get Cover Generation Details
```bash
curl --request GET \
  --url "https://api.sunoapi.org/api/v1/suno/cover/record-info?taskId=<taskId>" \
  --header "Authorization: Bearer <token>"
```

Response example (truncated):
```json
{
  "code": 200,
  "data": {
    "taskId": "2lae3c3c2a01fa5e030b3799faddd56",
    "parentTaskId": "736128b3...",
    "callbackUrl": "https://api.example.com/callback",
    "completeTime": "2025-01-15T10:35:27.000Z",
    "response": {
      "images": [
        "https://tempfile.aiquickdraw.com/s/....jpg",
        "https://tempfile.aiquickdraw.com/s/....jpg"
      ]
    },
    "successFlag": 1,
    "errorCode": 0,
    "errorMessage": null
  }
}
```

---

## WAV Conversion
### POST /api/v1/wav/generate — Convert to WAV
```bash
curl --request POST \
  --url "https://api.sunoapi.org/api/v1/wav/generate" \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: application/json" \
  --data '{"taskId":"5c79xxxxbe8e","audioId":"song_6295980e","callBackUrl":"https://api.example.com/callback"}'
```

### GET /api/v1/wav/record-info — Get WAV Conversion Details
```bash
curl --request GET \
  --url "https://api.sunoapi.org/api/v1/wav/record-info?taskId=<taskId>" \
  --header "Authorization: Bearer <token>"
```

Response example:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "988exxxc8d3",
    "musicId": "8551kkkx662c",
    "callbackUrl": "https://api.example.com/callback",
    "audio_wav_url": "https://example.com/s/04eb...wav",
    "status": "SUCCESS",
    "createTime": "2025-01-01 06:00:00",
    "errorCode": null,
    "errorMessage": null
  }
}
```

---

## Vocal Removal / Stems
### POST /api/v1/vocal-removal/generate — Separate Vocals from Music
Use official stem separation to split a track.

Body (JSON):
- `type` string: e.g. `"separate_vocal"`

```bash
curl --request POST \
  --url "https://api.sunoapi.org/api/v1/vocal-removal/generate" \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: application/json" \
  --data '{"type":"separate_vocal"}'
```

Response (200): `{"code":200,"msg":"success","taskId":"5c79wrksbese"}`

### GET /api/v1/vocal-removal/record-info — Get Vocal Separation Details
```bash
curl --request GET \
  --url "https://api.sunoapi.org/api/v1/vocal-removal/record-info?taskId=<taskId>" \
  --header "Authorization: Bearer <token>"
```

Response example (truncated):
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "3e63b4cc...",
    "musicId": "376c...",
    "callbackUrl": "https://<host>/api/v1/...",
    "musicIndex": 0,
    "completeTime": 1753782937000,
    "response": {
      "originUrl": null,
      "instrumentalUrl": "https://file.aiquickdraw.com/s/...",
      "vocalUrl": "https://file.aiquickdraw.com/s/...",
      "backingVocalsUrl": null,
      "bassUrl": null,
      "guitarUrl": null,
      "keyboardUrl": null,
      "percussionUrl": null,
      "stringsUrl": null,
      "synthUrl": null,
      "brassUrl": null
    },
    "successFlag": "SUCCESS",
    "createTime": 1753782854000,
    "errorCode": null
  }
}
```

---

## MP4 Video
### POST /api/v1/mp4/generate — Create Music Video
Generate an MP4 with visualizations.

Body (JSON):
- `taskId` string
- `audioId` string (field name in screenshots may appear OCR-garbled)
- `callBackUrl` string<url>
- `author` string (optional)
- `domainName` string (optional)

```bash
curl --request POST \
  --url "https://api.sunoapi.org/api/v1/mp4/generate" \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: application/json" \
  --data '{
    "taskId": "taskId_774b93a0422f",
    "audioId": "6295980ec02e",
    "callBackUrl": "https://api.example.com/callback",
    "author": "Suno Artist",
    "domainName": "music.example.com"
  }'
```

### GET /api/v1/mp4/record-info — Get Music Video Details
```bash
curl --request GET \
  --url "https://api.sunoapi.org/api/v1/mp4/record-info?taskId=<taskId>" \
  --header "Authorization: Bearer <token>"
```

Response example (truncated):
```json
{
  "code": 200,
  "data": {
    "taskId": "taskId_774b93a0422f",
    "musicId": "audioId_6295980ec02e",
    "callbackUrl": "https://api.example.com/callback",
    "completeTime": "2025-01-01 00:10:00",
    "response": {
      "videoUrl": "https://example.com/videos/video_84771566625.mp4"
    },
    "successFlag": "SUCCESS",
    "createTime": "2025-01-01 00:00:00",
    "errorCode": null,
    "errorMessage": null
  }
}
```

---

## File Upload Utilities
These appear to be helper endpoints hosted at a different host in screenshots (e.g. `sunoapi.org.redpandaai.co`). Paths retained as-is.

### POST /api/file-base64-upload — Base64 File Upload
Upload temporary files via Base64 data. Files auto-deleted after 3 days.

Body (JSON):
- `base64Data` string (supports data URI)
- `uploadPath` string: path without leading/trailing slashes
- `fileName` string

```bash
curl --request POST \
  --url "https://sunoapi.org.redpandaai.co/api/file-base64-upload" \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: application/json" \
  --data '{
    "base64Data": "data:image/png;base64,iVBORw0...",
    "uploadPath": "images/base64",
    "fileName": "test-image.png"
  }'
```

Response example:
```json
{
  "code": 200,
  "msg": "File uploaded successfully",
  "data": {
    "fileName": "uploaded-image.png",
    "filePath": "images/user-uploads/uploaded-image.png",
    "downloadUrl": "https://tempfile.redpandaai.co/.../images/...",
    "fileSize": 154832,
    "mimeType": "image/png",
    "uploadedAt": "2025-01-01T12:00:00.000Z"
  }
}
```

### POST /api/file-stream-upload — File Stream Upload (multipart/form-data)
Form fields:
- `uploadPath` string
- `fileName` string
- `file` file (binary)

```bash
curl --request POST \
  --url "https://sunoapi.org.redpandaai.co/api/file-stream-upload" \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: multipart/form-data" \
  --form uploadPath=images/user-uploads \
  --form fileName=my-image.jpg \
  --form file=@example-file
```

### POST /api/file-url-upload — URL File Upload
Download a file from a URL and store it.

Body (JSON):
- `fileUrl` string<uri>
- `uploadPath` string
- `fileName` string

```bash
curl --request POST \
  --url "https://sunoapi.org.redpandaai.co/api/file-url-upload" \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: application/json" \
  --data '{
    "fileUrl": "https://example.com/images/sample.jpg",
    "uploadPath": "images/downloaded",
    "fileName": "my-downloaded-image.jpg"
  }'
```

Response example mirrors Base64 upload (fields: fileName, filePath, downloadUrl, fileSize, mimeType, uploadedAt).

---

## Notes
- Field names and values are normalized where OCR was clearly incorrect (e.g. `customMode`, `audioId`, `createTime`).
- Some response examples are truncated for brevity.
- Treat this as working notes; refer to the official Suno API docs for authoritative definitions and any missing parameters.
