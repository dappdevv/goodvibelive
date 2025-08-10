"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Toast from "@radix-ui/react-toast";
import {
  Button,
  Card,
  Flex,
  Heading,
  Text,
  TextArea,
  TextField,
  Separator,
  ScrollArea,
} from "@radix-ui/themes";
import Image from "next/image";

type ApiEnvelope<T> = {
  code?: number;
  msg?: string;
  data?: T;
  taskId?: string;
  [k: string]: unknown;
};

type GenerateData = {
  taskId?: string;
  parentMusicId?: string;
  param?: string;
  id?: string;
  audioUrl?: string;
  streamAudioUrl?: string;
  imageUrl?: string;
  prompt?: string;
  modelName?: string;
  title?: string;
  tags?: string;
  createTime?: string;
  duration?: number;
  status?: string;
  type?: string;
  errorCode?: number | null;
  errorMessage?: string | null;
};

type GenerateRecordInfo = ApiEnvelope<GenerateData>;

type LyricsDataItem = {
  text?: string;
  status?: string;
  errorMessage?: string | null;
};
type LyricsData = {
  taskId?: string;
  param?: string;
  lyricsData?: LyricsDataItem[];
  status?: string;
  type?: string;
};
type LyricsRecordInfo = ApiEnvelope<LyricsData>;

type CoverResponse = { images?: string[] };
type CoverData = {
  taskId?: string;
  parentTaskId?: string;
  callbackUrl?: string;
  completeTime?: string;
  response?: CoverResponse;
  successFlag?: number | string;
  errorCode?: number | null;
  errorMessage?: string | null;
};
type CoverRecordInfo = ApiEnvelope<CoverData>;

type WavData = {
  taskId?: string;
  musicId?: string;
  callbackUrl?: string;
  audio_wav_url?: string;
  status?: string;
  createTime?: string;
  errorCode?: number | null;
  errorMessage?: string | null;
};
type WavRecordInfo = ApiEnvelope<WavData>;

type VocalResponse = {
  originUrl?: string | null;
  instrumentalUrl?: string | null;
  vocalUrl?: string | null;
  [k: string]: string | null | undefined;
};
type VocalData = {
  taskId?: string;
  response?: VocalResponse;
  [k: string]: unknown;
};
type VocalRecordInfo = ApiEnvelope<VocalData>;

type Mp4Response = { videoUrl?: string };
type Mp4Data = {
  taskId?: string;
  musicId?: string;
  response?: Mp4Response;
  [k: string]: unknown;
};
type Mp4RecordInfo = ApiEnvelope<Mp4Data>;

type TaskIdResponse = { taskId?: string; data?: { taskId?: string } };

type UploadResponseData = { downloadUrl?: string };
type UploadResponse = ApiEnvelope<UploadResponseData> & {
  downloadUrl?: string;
};

async function jsonFetch<T = unknown>(path: string, options?: RequestInit) {
  const startedAt = Date.now();
  const method = options?.method || "GET";
  const isSuno = path.startsWith("/api/suno/");
  if (isSuno) {
    let bodyPreview: unknown = undefined;
    const raw = options?.body;
    if (typeof raw === "string") {
      try {
        bodyPreview = JSON.parse(raw);
      } catch {
        bodyPreview = raw.slice(0, 2000);
      }
    }
    console.log("[SunoUI][Request]", { method, path, bodyPreview });
  }
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  const ct = res.headers.get("content-type") || "";
  const elapsedMs = Date.now() - startedAt;
  if (isSuno) {
    console.log("[SunoUI][Response]", {
      method,
      path,
      status: res.status,
      contentType: ct,
      elapsedMs,
    });
  }
  if (!res.ok) {
    const text = ct.includes("application/json")
      ? JSON.stringify(await res.json())
      : await res.text();
    if (isSuno) {
      console.warn("[SunoUI][Error]", {
        method,
        path,
        status: res.status,
        text,
      });
    }
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  if (ct.includes("application/json")) {
    const json = (await res.json()) as unknown;
    // Suno API convention: { code: 200, msg: "success", ... }
    if (
      json &&
      typeof json === "object" &&
      (json as { code?: number }).code !== undefined &&
      (json as { code?: number }).code !== 200
    ) {
      const j = json as { code?: number; msg?: string };
      const message = `Suno API code ${j.code}: ${j.msg || "error"}`;
      if (isSuno)
        console.warn("[SunoUI][API][Non200]", { path, message, json });
      throw new Error(message);
    }
    return json as T;
  }
  return res.text() as unknown as Promise<T>;
}

export default function Suno() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Shared fields
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Classical");
  const [title, setTitle] = useState("");
  const [model, setModel] = useState("V4_5");
  const [negativeTags, setNegativeTags] = useState("");
  const [instrumental, setInstrumental] = useState(true);
  const [customMode, setCustomMode] = useState(true);

  // IDs
  const [musicTaskId, setMusicTaskId] = useState<string | null>(null);
  const [lyricsTaskId, setLyricsTaskId] = useState<string | null>(null);
  const [coverTaskId, setCoverTaskId] = useState<string | null>(null);
  const [wavTaskId, setWavTaskId] = useState<string | null>(null);
  const [vocalTaskId, setVocalTaskId] = useState<string | null>(null);
  const [mp4TaskId, setMp4TaskId] = useState<string | null>(null);

  // Extra fields
  const [continueAt, setContinueAt] = useState<number>(60);
  const [defaultParamFlag, setDefaultParamFlag] = useState<boolean>(true);
  const [musicIndex, setMusicIndex] = useState<number>(0);
  const [audioId, setAudioId] = useState<string>("");
  const [styleBoostContent, setStyleBoostContent] = useState("Fog, Mysterious");
  const [timestampedLyrics, setTimestampedLyrics] = useState<unknown | null>(
    null
  );

  // Results
  const [recordInfo, setRecordInfo] = useState<GenerateRecordInfo | null>(null);
  const [lyricsInfo, setLyricsInfo] = useState<LyricsRecordInfo | null>(null);
  const [coverInfo, setCoverInfo] = useState<CoverRecordInfo | null>(null);
  const [wavInfo, setWavInfo] = useState<WavRecordInfo | null>(null);
  const [vocalInfo, setVocalInfo] = useState<VocalRecordInfo | null>(null);
  const [mp4Info, setMp4Info] = useState<Mp4RecordInfo | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  // Upload (base64)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState<string>("");
  const [toastDescription, setToastDescription] = useState<string>("");
  const showError = (message: string, title = "Ошибка") => {
    setToastTitle(title);
    setToastDescription(message);
    setToastOpen(true);
  };

  // UI helpers
  const MODEL_OPTIONS = ["V3_5", "V4", "V4_5", "V4_5PLUS"];
  const STYLE_OPTIONS = [
    "Classical",
    "Pop",
    "Rock",
    "Jazz doo-woop",
    "Electronic",
    "Hip-Hop",
    "Lo-fi",
  ];
  const MUSIC_PROMPTS = [
    "energy drum and bass",
    "calm piano with strings, cinematic",
    "mellow lo-fi beat, warm vinyl",
  ];
  const LYRICS_PROMPTS = [
    "Песня о летнем вечере на крыше города",
    "Романтическая баллада о встрече у моря",
    "Быстрый рэп о кодинге и стартапах",
  ];

  const MODEL_DESCRIPTIONS: Record<string, string> = {
    V3_5: "V3.5 — better song structure, max 4 min.",
    V4: "V4 — improved vocal quality, max 4 min.",
    V4_5: "V4.5 — smarter prompts, faster generations, max 8 min.",
    V4_5PLUS: "V4.5+ — richer sound, new ways to create, max 8 min.",
  };

  const clearAll = () => {
    setPrompt("");
    setTitle("");
    setNegativeTags("");
    setInstrumental(true);
    setCustomMode(true);
    setModel("V4_5");
    setStyle("Classical");
  };

  // Limits per docs
  const isV45Family = model === "V4_5" || model === "V4_5PLUS";
  const promptMax = customMode ? (isV45Family ? 5000 : 3000) : 400;
  const styleMax = customMode ? (isV45Family ? 1000 : 200) : 0;
  const titleMax = 80;

  // Auto-clear non-required fields when non-custom mode
  useEffect(() => {
    if (!customMode) {
      if (style) setStyle("");
      if (title) setTitle("");
      if (negativeTags) setNegativeTags("");
    }
  }, [customMode]);

  // Validation for music generation (generate/extend)
  function validateMusicParams() {
    const errors: string[] = [];
    if (customMode) {
      if (instrumental) {
        if (!style.trim())
          errors.push("Требуется style при Instrumental в Custom mode");
        if (!title.trim())
          errors.push("Требуется title при Instrumental в Custom mode");
      } else {
        if (!style.trim()) errors.push("Требуется style в Custom mode");
        if (!prompt.trim())
          errors.push("Требуется prompt в Custom mode (vocals)");
        if (!title.trim()) errors.push("Требуется title в Custom mode");
      }
      if (prompt && prompt.length > promptMax)
        errors.push(`prompt превышает ${promptMax} символов`);
      if (style && style.length > styleMax)
        errors.push(`style превышает ${styleMax} символов`);
      if (title && title.length > titleMax)
        errors.push(`title превышает ${titleMax} символов`);
    } else {
      if (!prompt.trim()) errors.push("Требуется prompt в Non-custom mode");
      if (prompt.length > 400)
        errors.push("prompt превышает 400 символов (Non-custom)");
    }
    if (errors.length) throw new Error(errors.join("\n"));
  }

  // Polling timers per endpoint label
  const pollTimersRef = useRef<Record<string, number>>({});
  const [pollStates, setPollStates] = useState<
    Record<string, { attempt: number; taskId: string; startedAt: number }>
  >({});

  const clearPoll = useCallback((label: string) => {
    const timers = pollTimersRef.current;
    if (timers[label]) {
      clearTimeout(timers[label]);
      delete timers[label];
    }
  }, []);

  const clearAllPolls = useCallback(() => {
    const timers = pollTimersRef.current;
    Object.keys(timers).forEach((label) => {
      clearTimeout(timers[label]);
      delete timers[label];
    });
  }, []);

  useEffect(() => {
    return () => {
      clearAllPolls();
    };
  }, [clearAllPolls]);

  type PollFn<T> = (taskId: string) => Promise<T>;

  function startPolling<T>(
    label: string,
    taskId: string | null,
    pollFn: PollFn<T>,
    isDone: (resp: T) => boolean,
    options?: { intervalMs?: number; maxAttempts?: number }
  ) {
    if (!taskId) return;
    const intervalMs = options?.intervalMs ?? 5000;
    const maxAttempts = options?.maxAttempts ?? 60; // ~5 минут
    let attempt = 0;

    clearPoll(label);
    setPollStates((prev) => ({
      ...prev,
      [label]: { attempt: 0, taskId, startedAt: Date.now() },
    }));

    const tick = async () => {
      attempt += 1;
      setPollStates((prev) => ({
        ...prev,
        [label]: {
          ...(prev[label] || { taskId, startedAt: Date.now() }),
          attempt,
        },
      }));
      try {
        const resp = await pollFn(taskId);
        const done = isDone(resp);
        if (done || attempt >= maxAttempts) {
          clearPoll(label);
          setPollStates((prev) => {
            const { [label]: _omit, ...rest } = prev;
            return rest;
          });
          return;
        }
      } catch (e) {
        showError((e as Error).message, `Ошибка поллинга: ${label}`);
      }
      pollTimersRef.current[label] = window.setTimeout(tick, intervalMs);
    };

    // первый запуск через intervalMs — чтобы не дублировать моментальный запрос,
    // т.к. мы уже делали начальный POST и часто сразу вызываем первый GET вручную
    pollTimersRef.current[label] = window.setTimeout(tick, intervalMs);
  }

  const getCallbackUrl = () => {
    if (typeof window === "undefined") return undefined;
    try {
      return `${window.location.origin}/api/suno/callback`;
    } catch {
      return undefined;
    }
  };

  const resetErrors = () => setLastError(null);

  const submit = useCallback(async (fn: () => Promise<void>) => {
    resetErrors();
    setIsLoading(true);
    try {
      await fn();
    } catch (e) {
      setLastError((e as Error).message);
      showError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const PollIndicator = ({ label }: { label: string }) => {
    const state = pollStates[label];
    if (!state) return null;
    const seconds = Math.floor((Date.now() - state.startedAt) / 1000);
    return (
      <Text size="1" className="text-gray-400 mt-1">
        ⏳ Ожидание ({label}): попытка {state.attempt}, {seconds}s
      </Text>
    );
  };

  const pollRecordInfo = useCallback(async (taskId: string) => {
    const data = await jsonFetch<GenerateRecordInfo>(
      `/api/suno/api/v1/generate/record-info?taskId=${encodeURIComponent(
        taskId
      )}`
    );
    setRecordInfo(data);
    return data;
  }, []);

  const pollLyricsInfo = useCallback(async (taskId: string) => {
    const data = await jsonFetch<LyricsRecordInfo>(
      `/api/suno/api/v1/lyrics/record-info?taskId=${encodeURIComponent(taskId)}`
    );
    setLyricsInfo(data);
    return data;
  }, []);

  const pollCoverInfo = useCallback(async (taskId: string) => {
    const data = await jsonFetch<CoverRecordInfo>(
      `/api/suno/api/v1/suno/cover/record-info?taskId=${encodeURIComponent(
        taskId
      )}`
    );
    setCoverInfo(data);
    return data;
  }, []);

  const pollWavInfo = useCallback(async (taskId: string) => {
    const data = await jsonFetch<WavRecordInfo>(
      `/api/suno/api/v1/wav/record-info?taskId=${encodeURIComponent(taskId)}`
    );
    setWavInfo(data);
    return data;
  }, []);

  const pollVocalInfo = useCallback(async (taskId: string) => {
    const data = await jsonFetch<VocalRecordInfo>(
      `/api/suno/api/v1/vocal-removal/record-info?taskId=${encodeURIComponent(
        taskId
      )}`
    );
    setVocalInfo(data);
    return data;
  }, []);

  const pollMp4Info = useCallback(async (taskId: string) => {
    const data = await jsonFetch<Mp4RecordInfo>(
      `/api/suno/api/v1/mp4/record-info?taskId=${encodeURIComponent(taskId)}`
    );
    setMp4Info(data);
    return data;
  }, []);

  // Predicates to stop polling
  const isDoneGenerate = (r: GenerateRecordInfo) => {
    const s = String(r?.data?.status || "").toUpperCase();
    const hasError = typeof r?.data?.errorCode === "number";
    return (
      Boolean(r?.data?.audioUrl || r?.data?.streamAudioUrl) ||
      s === "SUCCESS" ||
      s.includes("FAIL") ||
      hasError
    );
  };
  const isDoneLyrics = (r: LyricsRecordInfo) => {
    const s = r?.data?.status?.toUpperCase?.() || "";
    return s === "SUCCESS" || Boolean(r?.data?.lyricsData?.length);
  };
  const isDoneCover = (r: CoverRecordInfo) => {
    const flag = r?.data?.successFlag;
    const ok = flag === 1 || flag === "SUCCESS";
    const hasImages = Boolean(r?.data?.response?.images?.length);
    return ok || hasImages || r?.data?.errorCode !== null;
  };
  const isDoneWav = (r: WavRecordInfo) => {
    const s = String(r?.data?.status || "").toUpperCase();
    const hasError = typeof r?.data?.errorCode === "number";
    return Boolean(r?.data?.audio_wav_url) || s === "SUCCESS" || hasError;
  };
  const isDoneVocal = (r: VocalRecordInfo) => {
    const s = String((r as VocalRecordInfo)?.data?.status || "").toUpperCase();
    const resp: VocalResponse | undefined = r?.data?.response;
    const hasAny = Boolean(resp && Object.values(resp).some(Boolean));
    return hasAny || s === "SUCCESS";
  };
  const isDoneMp4 = (r: Mp4RecordInfo) => {
    const s = String(r?.data?.status || "").toUpperCase();
    return Boolean(r?.data?.response?.videoUrl) || s === "SUCCESS";
  };

  return (
    <Card className="glass-card p-6 w-full">
      <Flex align="center" justify="between" className="mb-4">
        <Heading className="neon-text" size="6">
          Suno: Музыка, текст и медиа
        </Heading>
        {isLoading && (
          <Text className="text-gray-400 text-sm">Выполняется запрос...</Text>
        )}
      </Flex>

      {lastError && (
        <div className="text-xs text-red-400 mb-3">{lastError}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="glass-card p-3">
          <Flex justify="between" align="center" className="gap-3 flex-wrap">
            <Flex align="center" gap="3" wrap="wrap">
              <Text size="2" className="text-gray-400">
                Быстрые промпты:
              </Text>
              {MUSIC_PROMPTS.map((p) => (
                <Button
                  key={p}
                  size="1"
                  variant="soft"
                  onClick={() => setPrompt(p)}
                >
                  {p}
                </Button>
              ))}
            </Flex>
            <Flex align="center" gap="3" wrap="wrap">
              <Text size="2" className="text-gray-400">
                Стили:
              </Text>
              {STYLE_OPTIONS.map((s) => (
                <Button
                  key={s}
                  size="1"
                  variant={style === s ? "solid" : "soft"}
                  onClick={() => setStyle(s)}
                >
                  {s}
                </Button>
              ))}
            </Flex>
            <Flex align="center" gap="2">
              <Text size="2" className="text-gray-400">
                Модель:
              </Text>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-transparent border rounded px-2 py-1 text-sm"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m} value={m} className="bg-black">
                    {m}
                  </option>
                ))}
              </select>
              <Text size="1" className="text-gray-500">
                {MODEL_DESCRIPTIONS[model]}
              </Text>
              <Button size="1" variant="ghost" onClick={clearAll}>
                Сброс
              </Button>
            </Flex>
          </Flex>
        </Card>
        <Card className="glass-card p-4">
          <Heading size="4" className="mb-3">
            Сгенерировать музыку
          </Heading>
          <TextArea
            rows={3}
            placeholder="Prompt..."
            value={prompt}
            maxLength={promptMax}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <TextField.Root
              placeholder="Style"
              value={style}
              maxLength={styleMax || undefined}
              onChange={(e) => setStyle(e.target.value)}
            />
            <TextField.Root readOnly value={model} />
            <TextField.Root
              placeholder="Title (optional)"
              value={title}
              maxLength={titleMax}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField.Root
              placeholder="Negative tags"
              value={negativeTags}
              onChange={(e) => setNegativeTags(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-sm mt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={customMode}
                onChange={(e) => setCustomMode(e.target.checked)}
              />{" "}
              Custom mode
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={instrumental}
                onChange={(e) => setInstrumental(e.target.checked)}
              />{" "}
              Instrumental
            </label>
          </div>
          <Flex gap="3" mt="3">
            <Button
              className="btn-primary"
              onClick={() =>
                submit(async () => {
                  validateMusicParams();
                  const body = {
                    prompt,
                    style,
                    title: title || undefined,
                    customMode,
                    instrumental,
                    model,
                    negativeTags,
                    callBackUrl: getCallbackUrl(),
                  };
                  const res = await jsonFetch<TaskIdResponse>(
                    `/api/suno/api/v1/generate`,
                    { method: "POST", body: JSON.stringify(body) }
                  );
                  const t = res.taskId || res.data?.taskId || null;
                  setMusicTaskId(t);
                  if (t)
                    startPolling("generate", t, pollRecordInfo, isDoneGenerate);
                })
              }
            >
              Сгенерировать
            </Button>
            {musicTaskId && (
              <Button
                variant="soft"
                onClick={() =>
                  submit(async () => {
                    await pollRecordInfo(musicTaskId);
                  })
                }
              >
                Статус
              </Button>
            )}
          </Flex>
          <PollIndicator label="generate" />
          {recordInfo && (
            <ScrollArea type="always" style={{ height: 180 }} className="mt-2">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(recordInfo, null, 2)}
              </pre>
              {recordInfo?.data?.audioUrl && (
                <audio
                  controls
                  src={recordInfo.data.audioUrl}
                  className="mt-2"
                />
              )}
              {recordInfo?.data?.imageUrl && (
                <div className="relative w-40 h-40 mt-2">
                  <Image
                    src={recordInfo.data.imageUrl}
                    alt="cover"
                    fill
                    className="object-cover rounded border border-[color:var(--border)]"
                  />
                </div>
              )}
            </ScrollArea>
          )}
        </Card>

        <Card className="glass-card p-4">
          <Heading size="4" className="mb-3">
            Продлить музыку (Extend)
          </Heading>
          <div className="grid grid-cols-2 gap-2">
            <TextArea
              rows={3}
              placeholder="Prompt..."
              value={prompt}
              maxLength={promptMax}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="grid grid-cols-1 gap-2">
              <TextField.Root
                placeholder="Style"
                value={style}
                maxLength={styleMax || undefined}
                onChange={(e) => setStyle(e.target.value)}
              />
              <TextField.Root
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <TextField.Root readOnly value={model} />
              <TextField.Root
                placeholder="Negative tags"
                value={negativeTags}
                onChange={(e) => setNegativeTags(e.target.value)}
              />
              <TextField.Root
                type="number"
                placeholder="continueAt (sec)"
                value={String(continueAt)}
                onChange={(e) => setContinueAt(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm mt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={defaultParamFlag}
                onChange={(e) => setDefaultParamFlag(e.target.checked)}
              />{" "}
              Default params
            </label>
          </div>
          <Flex gap="3" mt="3">
            <Button
              className="btn-primary"
              onClick={() =>
                submit(async () => {
                  validateMusicParams();
                  const body = {
                    prompt,
                    style,
                    title: title || undefined,
                    continueAt,
                    model,
                    negativeTags,
                    defaultParamFlag,
                    callBackUrl: getCallbackUrl(),
                  };
                  const res = await jsonFetch<TaskIdResponse>(
                    `/api/suno/api/v1/generate/extend`,
                    { method: "POST", body: JSON.stringify(body) }
                  );
                  const t = res.taskId || res.data?.taskId || null;
                  setMusicTaskId(t);
                  if (t)
                    startPolling(
                      "generate-extend",
                      t,
                      pollRecordInfo,
                      isDoneGenerate
                    );
                })
              }
            >
              Продлить
            </Button>
            {musicTaskId && (
              <Button
                variant="soft"
                onClick={() =>
                  submit(async () => {
                    await pollRecordInfo(musicTaskId);
                  })
                }
              >
                Статус
              </Button>
            )}
          </Flex>
          <PollIndicator label="generate-extend" />
        </Card>

        <Card className="glass-card p-4">
          <Heading size="4" className="mb-3">
            Тексты (Lyrics)
          </Heading>
          <TextArea
            rows={3}
            placeholder="Prompt for lyrics... (подсказки: выберите ниже)"
            value={prompt}
            maxLength={promptMax}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Flex gap="2" wrap="wrap" className="mt-2">
            {LYRICS_PROMPTS.map((lp) => (
              <Button
                key={lp}
                size="1"
                variant="soft"
                onClick={() => setPrompt(lp)}
              >
                {lp}
              </Button>
            ))}
          </Flex>
          <Flex gap="3" mt="3">
            <Button
              className="btn-primary"
              onClick={() =>
                submit(async () => {
                  const res = await jsonFetch<TaskIdResponse>(
                    `/api/suno/api/v1/lyrics`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        prompt,
                        callBackUrl: getCallbackUrl(),
                      }),
                    }
                  );
                  const t = res.taskId || res.data?.taskId || null;
                  setLyricsTaskId(t);
                  if (t)
                    startPolling("lyrics", t, pollLyricsInfo, isDoneLyrics);
                })
              }
            >
              Сгенерировать текст
            </Button>
            {lyricsTaskId && (
              <Button
                variant="soft"
                onClick={() =>
                  submit(async () => {
                    await pollLyricsInfo(lyricsTaskId);
                  })
                }
              >
                Статус
              </Button>
            )}
          </Flex>
          <PollIndicator label="lyrics" />
          {lyricsInfo && (
            <ScrollArea type="always" style={{ height: 160 }} className="mt-2">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(lyricsInfo, null, 2)}
              </pre>
            </ScrollArea>
          )}
          <Separator my="3" size="4" />
          <Heading size="3" className="mb-2">
            Таймкоды
          </Heading>
          <div className="flex items-center gap-2">
            <TextField.Root
              placeholder="taskId"
              value={lyricsTaskId ?? ""}
              onChange={(e) => setLyricsTaskId(e.target.value)}
            />
            <TextField.Root
              type="number"
              placeholder="musicIndex"
              value={String(musicIndex)}
              onChange={(e) => setMusicIndex(Number(e.target.value) || 0)}
            />
            <Button
              variant="soft"
              onClick={() =>
                submit(async () => {
                  const data = await jsonFetch<unknown>(
                    `/api/suno/api/v1/generate/get-timestamped-lyrics`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        taskId: lyricsTaskId,
                        musicIndex,
                      }),
                    }
                  );
                  setTimestampedLyrics(data);
                })
              }
            >
              Получить
            </Button>
          </div>
          {timestampedLyrics ? (
            <ScrollArea type="always" style={{ height: 120 }} className="mt-2">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(timestampedLyrics, null, 2)}
              </pre>
            </ScrollArea>
          ) : null}
        </Card>

        <Card className="glass-card p-4">
          <Heading size="4" className="mb-3">
            Style Boost
          </Heading>
          <TextField.Root
            placeholder="content (e.g. Fog, Mysterious)"
            value={styleBoostContent}
            onChange={(e) => setStyleBoostContent(e.target.value)}
          />
          <Flex gap="3" mt="3">
            <Button
              className="btn-primary"
              onClick={() =>
                submit(async () => {
                  await jsonFetch<unknown>(`/api/suno/api/v1/style/generate`, {
                    method: "POST",
                    body: JSON.stringify({ content: styleBoostContent }),
                  });
                })
              }
            >
              Применить стиль
            </Button>
          </Flex>
        </Card>

        <Card className="glass-card p-4">
          <Heading size="4" className="mb-3">
            Cover изображения
          </Heading>
          <div className="flex items-center gap-2">
            <TextField.Root
              placeholder="parent taskId"
              value={musicTaskId ?? ""}
              onChange={(e) => setMusicTaskId(e.target.value)}
            />
            <Button
              className="btn-primary"
              onClick={() =>
                submit(async () => {
                  const res = await jsonFetch<TaskIdResponse>(
                    `/api/suno/api/v1/suno/cover/generate`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        taskId: musicTaskId,
                        callBackUrl: getCallbackUrl(),
                      }),
                    }
                  );
                  const t = res.taskId || res.data?.taskId || null;
                  setCoverTaskId(t);
                  if (t) startPolling("cover", t, pollCoverInfo, isDoneCover);
                })
              }
            >
              Сгенерировать cover
            </Button>
            {coverTaskId && (
              <Button
                variant="soft"
                onClick={() =>
                  submit(async () => {
                    await pollCoverInfo(coverTaskId);
                  })
                }
              >
                Статус
              </Button>
            )}
          </div>
          <PollIndicator label="cover" />
          {coverInfo?.data?.response?.images?.length ? (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {coverInfo.data.response.images.map((src: string, i: number) => (
                <div key={i} className="relative w-full aspect-square">
                  <Image
                    src={src}
                    alt={`cover-${i}`}
                    fill
                    className="object-cover rounded border border-[color:var(--border)]"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="glass-card p-4">
          <Heading size="4" className="mb-3">
            WAV конвертация
          </Heading>
          <div className="grid grid-cols-2 gap-2">
            <TextField.Root
              placeholder="taskId"
              value={wavTaskId ?? ""}
              onChange={(e) => setWavTaskId(e.target.value)}
            />
            <TextField.Root
              placeholder="audioId"
              value={audioId}
              onChange={(e) => setAudioId(e.target.value)}
            />
          </div>
          <Flex gap="3" mt="3">
            <Button
              className="btn-primary"
              onClick={() =>
                submit(async () => {
                  const res = await jsonFetch<TaskIdResponse>(
                    `/api/suno/api/v1/wav/generate`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        taskId: wavTaskId,
                        audioId,
                        callBackUrl: getCallbackUrl(),
                      }),
                    }
                  );
                  const t = res.taskId || res.data?.taskId || wavTaskId;
                  setWavTaskId(t);
                  if (t) startPolling("wav", t, pollWavInfo, isDoneWav);
                })
              }
            >
              Создать WAV
            </Button>
            {wavTaskId && (
              <Button
                variant="soft"
                onClick={() =>
                  submit(async () => {
                    await pollWavInfo(wavTaskId);
                  })
                }
              >
                Статус
              </Button>
            )}
          </Flex>
          <PollIndicator label="wav" />
          {wavInfo?.data?.audio_wav_url && (
            <audio controls src={wavInfo.data.audio_wav_url} className="mt-2" />
          )}
        </Card>

        <Card className="glass-card p-4">
          <Heading size="4" className="mb-3">
            Vocal removal / stems
          </Heading>
          <div className="flex items-center gap-2">
            <TextField.Root
              placeholder='type (e.g. "separate_vocal")'
              value={"separate_vocal"}
              readOnly
            />
            <Button
              className="btn-primary"
              onClick={() =>
                submit(async () => {
                  const res = await jsonFetch<TaskIdResponse>(
                    `/api/suno/api/v1/vocal-removal/generate`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        type: "separate_vocal",
                        callBackUrl: getCallbackUrl(),
                      }),
                    }
                  );
                  const t = res.taskId || res.data?.taskId || null;
                  setVocalTaskId(t);
                  if (t) startPolling("vocal", t, pollVocalInfo, isDoneVocal);
                })
              }
            >
              Разделить вокал
            </Button>
            {vocalTaskId && (
              <Button
                variant="soft"
                onClick={() =>
                  submit(async () => {
                    await pollVocalInfo(vocalTaskId);
                  })
                }
              >
                Статус
              </Button>
            )}
          </div>
          <PollIndicator label="vocal" />
          {vocalInfo?.data?.response && (
            <ScrollArea type="always" style={{ height: 140 }} className="mt-2">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(vocalInfo.data.response, null, 2)}
              </pre>
            </ScrollArea>
          )}
        </Card>

        <Card className="glass-card p-4">
          <Heading size="4" className="mb-3">
            MP4 видео
          </Heading>
          <div className="grid grid-cols-2 gap-2">
            <TextField.Root
              placeholder="taskId"
              value={mp4TaskId ?? ""}
              onChange={(e) => setMp4TaskId(e.target.value)}
            />
            <TextField.Root
              placeholder="audioId"
              value={audioId}
              onChange={(e) => setAudioId(e.target.value)}
            />
          </div>
          <Flex gap="3" mt="3">
            <Button
              className="btn-primary"
              onClick={() =>
                submit(async () => {
                  const res = await jsonFetch<TaskIdResponse>(
                    `/api/suno/api/v1/mp4/generate`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        taskId: mp4TaskId,
                        audioId,
                        callBackUrl: getCallbackUrl(),
                      }),
                    }
                  );
                  const t = res.taskId || res.data?.taskId || mp4TaskId;
                  setMp4TaskId(t);
                  if (t) startPolling("mp4", t, pollMp4Info, isDoneMp4);
                })
              }
            >
              Создать MP4
            </Button>
            {mp4TaskId && (
              <Button
                variant="soft"
                onClick={() =>
                  submit(async () => {
                    await pollMp4Info(mp4TaskId);
                  })
                }
              >
                Статус
              </Button>
            )}
          </Flex>
          <PollIndicator label="mp4" />
          {mp4Info?.data?.response?.videoUrl && (
            <video
              controls
              src={mp4Info.data.response.videoUrl}
              className="mt-2 w-full"
            />
          )}
        </Card>

        <Card className="glass-card p-4">
          <Heading size="4" className="mb-3">
            Кредиты
          </Heading>
          <Flex gap="3">
            <Button
              className="btn-primary"
              onClick={() =>
                submit(async () => {
                  const res = await jsonFetch<
                    ApiEnvelope<number> & { creditsRemaining?: number }
                  >(`/api/suno/api/v1/generate/credit`);
                  setCredits(
                    (res.data as number | undefined) ??
                      res.creditsRemaining ??
                      null
                  );
                })
              }
            >
              Проверить баланс
            </Button>
            {credits !== null && <Text>Доступно: {credits}</Text>}
          </Flex>
        </Card>

        <Card className="glass-card p-4">
          <Heading size="4" className="mb-3">
            Загрузка аудио
          </Heading>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={async (e) => {
                const f = e.target.files?.[0] || null;
                setSelectedFile(f);
                if (!f) return;
                // Попытка клиентской конвертации только для маленьких файлов (<= 8MB)
                if (f.size <= 8 * 1024 * 1024) {
                  const reader = new FileReader();
                  reader.onload = async () => {
                    const base64Data = String(reader.result);
                    submit(async () => {
                      const resp = await jsonFetch<UploadResponse>(
                        `/api/suno/api/file-base64-upload?host=upload`,
                        {
                          method: "POST",
                          body: JSON.stringify({
                            base64Data,
                            uploadPath: "user-uploads",
                            fileName: f.name,
                          }),
                        }
                      );
                      const url =
                        resp?.data?.downloadUrl || resp?.downloadUrl || null;
                      setUploadedUrl(url);
                    });
                  };
                  reader.readAsDataURL(f);
                } else {
                  showError(
                    "Файл большой — используйте кнопку 'Загрузить (сервер)' для серверной конвертации"
                  );
                }
              }}
            />
            {uploadedUrl && (
              <Text size="2" className="text-gray-300">
                Загружено: {uploadedUrl}
              </Text>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="soft"
              onClick={async () => {
                if (!selectedFile) {
                  setLastError("Выберите аудио файл");
                  showError("Выберите аудио файл");
                  return;
                }
                await submit(async () => {
                  const fd = new FormData();
                  fd.set("file", selectedFile);
                  fd.set("uploadPath", "user-uploads");
                  fd.set("fileName", selectedFile.name);

                  const res = await fetch(`/api/suno/upload-audio`, {
                    method: "POST",
                    body: fd,
                  });
                  const ct = res.headers.get("content-type") || "";
                  if (!res.ok) {
                    const text = ct.includes("application/json")
                      ? JSON.stringify(await res.json())
                      : await res.text();
                    throw new Error(`Upload failed: ${text}`);
                  }
                  const json = await res.json();
                  const url =
                    json?.data?.downloadUrl || json?.downloadUrl || null;
                  setUploadedUrl(url);
                });
              }}
            >
              Загрузить (сервер)
            </Button>
            <Text size="1" className="text-gray-500">
              - Инпут: конвертация в браузере
            </Text>
            <Text size="1" className="text-gray-500">
              - Кнопка: загрузка и конвертация на сервере
            </Text>
          </div>
          <Separator my="3" size="4" />
          <Heading size="3" className="mb-2">
            Upload Cover/Extend
          </Heading>
          <div className="flex flex-col gap-2">
            <Button
              variant="soft"
              onClick={() =>
                submit(async () => {
                  if (!uploadedUrl) throw new Error("Сначала загрузите файл");
                  const body = {
                    uploadUrl: uploadedUrl,
                    prompt,
                    style,
                    customMode,
                    instrumental,
                    model,
                    negativeTags,
                  };
                  const res = await jsonFetch<TaskIdResponse>(
                    `/api/suno/api/v1/generate/upload-cover`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        ...body,
                        callBackUrl: getCallbackUrl(),
                      }),
                    }
                  );
                  const t = res.taskId || res.data?.taskId || null;
                  setMusicTaskId(t);
                  if (t)
                    startPolling(
                      "upload-cover",
                      t,
                      pollRecordInfo,
                      isDoneGenerate
                    );
                })
              }
            >
              Upload Cover
            </Button>
            <Button
              variant="soft"
              onClick={() =>
                submit(async () => {
                  if (!uploadedUrl) throw new Error("Сначала загрузите файл");
                  const body = {
                    uploadUrl: uploadedUrl,
                    defaultParamFlag,
                    instrumental,
                    style,
                    title,
                    continueAt,
                    model,
                    negativeTags,
                  };
                  const res = await jsonFetch<TaskIdResponse>(
                    `/api/suno/api/v1/generate/upload-extend`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        ...body,
                        callBackUrl: getCallbackUrl(),
                      }),
                    }
                  );
                  const t = res.taskId || res.data?.taskId || null;
                  setMusicTaskId(t);
                  if (t)
                    startPolling(
                      "upload-extend",
                      t,
                      pollRecordInfo,
                      isDoneGenerate
                    );
                })
              }
            >
              Upload Extend
            </Button>
            <PollIndicator label="upload-cover" />
            <PollIndicator label="upload-extend" />
          </div>
        </Card>
      </div>
    </Card>
  );
}

// Toast viewport at page bottom
export function SunoToastViewport() {
  return (
    <Toast.Provider swipeDirection="right">
      <Toast.Viewport
        style={{ position: "fixed", bottom: 20, right: 20, width: 380 }}
      />
    </Toast.Provider>
  );
}
