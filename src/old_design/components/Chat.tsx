"use client";

import useAppStore from "@/store/useAppStore";
import {
  Card,
  Flex,
  TextArea,
  Button,
  IconButton,
  TextField,
  Separator,
  Heading,
  ScrollArea,
  Avatar,
  Text,
} from "@radix-ui/themes";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import * as Select from "@radix-ui/react-select";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  ImageIcon,
  PlusCircledIcon,
  HamburgerMenuIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
// removed unused alias import

// Минимальные типы Web Speech API для сборки без dom-типов
type WebSpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }>;
};
type WebSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives?: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onspeechend?: (() => void) | null;
  onaudioend?: (() => void) | null;
  onerror?: ((e: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export default function Chat() {
  const {
    threads,
    activeThreadId,
    createThread,
    addMessage,
    setActiveThread,
    renameThread,
    deleteThread,
  } = useAppStore();
  const [input, setInput] = useState("");
  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );
  const endRef = useRef<HTMLDivElement | null>(null);
  type T2IOptions = {
    model: string;
    input: { prompt: string; negative_prompt?: string };
    parameters: {
      size?: string;
      n?: number;
      prompt_extend?: boolean;
      watermark?: boolean;
      seed?: number;
    };
  };
  type ModelEntry = {
    name: string;
    provider?: string;
    tags?: string[];
    description?: string;
    request_options?: T2IOptions;
    url?: string;
    result_url?: string;
  };
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [model, setModel] = useState<string>("gpt-4o-mini");
  const [listening, setListening] = useState<boolean>(false);
  const recognitionRef = useRef<WebSpeechRecognition | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const selectedModel = useMemo(
    () => models.find((m) => m.name === model) || null,
    [models, model]
  );
  const isTextToImage = useMemo(
    () => Boolean(selectedModel?.tags?.includes("text-to-image")),
    [selectedModel]
  );
  const [t2iOptions, setT2iOptions] = useState<T2IOptions | null>(null);
  const [t2iImages, setT2iImages] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const isTTS = useMemo(
    () => Boolean(selectedModel?.tags?.includes("tts")),
    [selectedModel]
  );
  const [ttsVoice, setTtsVoice] = useState<string>("Cherry");
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages.length]);

  useEffect(() => {
    // Load models list from server
    fetch("/api/models")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data?.models) ? data.models : [];
        setModels(list);
        if (list.length > 0 && list[0].name) {
          setModel(list[0].name);
        }
      })
      .catch(() => {});
  }, [listening]);

  useEffect(() => {
    if (isTextToImage && selectedModel?.request_options) {
      const opts = JSON.parse(
        JSON.stringify(selectedModel.request_options)
      ) as T2IOptions;
      // Force sane defaults
      opts.parameters = {
        ...opts.parameters,
        n: 1,
      };
      setT2iOptions(opts);
    } else {
      setT2iOptions(null);
    }
    // TTS: сбрасывать предыдущее аудио при смене модели
    if (!isTTS) setTtsAudioUrl(null);
    // При наличии дефолта в models.json можно выставить голосом значение по умолчанию
  }, [isTextToImage, isTTS, selectedModel]);

  // Setup Web Speech API (SpeechRecognition)
  useEffect(() => {
    if (typeof window === "undefined") return;
    type WebSpeechRecognitionConstructor = new () => WebSpeechRecognition;
    type SpeechWindow = Window & {
      SpeechRecognition?: WebSpeechRecognitionConstructor;
      webkitSpeechRecognition?: WebSpeechRecognitionConstructor;
    };
    const w = window as SpeechWindow;
    const SR: WebSpeechRecognitionConstructor | undefined =
      w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const recog: WebSpeechRecognition = new SR();
    recog.lang = "ru-RU";
    recog.interimResults = true;
    recog.continuous = true;
    recog.maxAlternatives = 1;
    recog.onstart = () => setListening(true);
    recog.onend = () => {
      // Авто-реcтарт, если пользователь не выключил запись
      setListening(false);
      if (recognitionRef.current && listening) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    };
    recog.onresult = (event: WebSpeechRecognitionEvent) => {
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        finalChunk += res[0].transcript;
      }
      if (finalChunk) {
        setInput((prev) => (prev ? prev + " " : "") + finalChunk.trim());
      }
    };
    recog.onspeechend = () => {
      // Завершить текущую фразу, чтобы получить финальный результат
      try {
        recog.stop();
      } catch {}
    };
    recog.onaudioend = () => {
      // Пусто — иногда полезно для дебага
    };
    recog.onerror = () => {
      // Ошибки игнорируем тихо, UI остаётся интерактивным
      setListening(false);
    };
    recognitionRef.current = recog;
    return () => {
      try {
        recog.abort();
      } catch {}
    };
  }, [listening]);

  function toggleVoice() {
    const recog = recognitionRef.current;
    if (!recog) return;
    if (listening) {
      try {
        recog.stop();
      } catch {}
      setListening(false);
    } else {
      // Пробуем заранее запросить доступ к микрофону, чтобы исключить задержки
      const startRec = () => {
        try {
          recog.start();
        } catch {}
      };
      try {
        navigator.mediaDevices
          ?.getUserMedia?.({ audio: true })
          .then(() => startRec())
          .catch(() => startRec());
      } catch {
        startRec();
      }
    }
  }

  // Attachments helpers
  function extractUrls(text: string): string[] {
    try {
      const regex = /(https?:\/\/[^\s)"']+)/g;
      return Array.from(text.match(regex) || []);
    } catch {
      return [];
    }
  }
  function isImageUrl(u: string): boolean {
    return (
      /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(u) ||
      u.includes("aliyuncs.com")
    );
  }
  function isAudioUrl(u: string): boolean {
    return /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(u);
  }

  async function copyMessage(id: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  }

  async function sendMessage() {
    const content = input.trim();
    const t2iPrompt = (t2iOptions?.input.prompt || "").trim();
    if (!isTextToImage && !content && !imageDataUrl) return;
    if (isTextToImage && !t2iPrompt) return;
    setLastError(null);
    console.log("[sendMessage] start", {
      model,
      isTextToImage,
      hasImage: Boolean(imageDataUrl),
    });
    setIsLoading(true);
    let threadId = activeThreadId;
    if (!threadId) threadId = createThread("Задачи и помощник");
    // Отобразим, что пользователь отправил (если есть картинка, добавим пометку)
    addMessage(
      threadId!,
      "user",
      isTextToImage ? t2iPrompt : content || "(изображение)"
    );
    setInput("");

    // Ветки по типам задач
    // 1) Text-to-speech (Qwen-TTS)
    if (isTTS) {
      try {
        type TTSRequestOptions = {
          model?: string;
          text?: string;
          voice?: string;
          stream?: boolean;
        };
        const reqOpts = (selectedModel?.request_options ||
          {}) as TTSRequestOptions;
        const ttsModelName = reqOpts.model || "qwen-tts-latest";
        const payload = {
          model: ttsModelName,
          text: content,
          voice: ttsVoice || "Cherry",
          stream: false,
        } as const;
        console.log("[tts] POST /api/tts payload", payload);
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        console.log("[tts] response status", res.status);
        const data = await res.json();
        console.log("[tts] response body", data);
        const audioUrl: string | undefined = data?.audioUrl;
        if (!audioUrl) {
          setLastError("TTS: не удалось получить ссылку на аудио");
          addMessage(
            threadId!,
            "assistant",
            "Не удалось получить аудио. Попробуйте другой голос или текст."
          );
        } else {
          setTtsAudioUrl(audioUrl);
          addMessage(
            threadId!,
            "assistant",
            `Сгенерировано аудио (голос ${ttsVoice}).`
          );
          // Сохраняем ссылку на аудио как отдельное сообщение
          addMessage(threadId!, "assistant", audioUrl);
          try {
            const audio = new Audio(audioUrl);
            // Автовоспроизведение — может быть заблокировано политиками браузера
            audio.play().catch(() => {});
          } catch {}
        }
      } catch (e) {
        console.error("[tts] error", e);
        setLastError("TTS exception: " + (e as Error).message);
        addMessage(
          threadId!,
          "assistant",
          "Ошибка при обращении к сервису синтеза."
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 2) Text-to-image (WAN)
    // Call local API which proxies to DashScope T2I
    // Text-to-image uses a separate endpoint
    if (
      isTextToImage &&
      selectedModel?.url &&
      selectedModel?.result_url &&
      t2iOptions
    ) {
      try {
        const payload = {
          url: selectedModel.url,
          result_url: selectedModel.result_url,
          request_options: {
            ...t2iOptions,
            input: {
              ...t2iOptions.input,
              prompt: t2iPrompt,
            },
          },
        } as const;
        console.log("[t2i] POST /api/t2i payload", payload);
        const res = await fetch("/api/t2i", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        console.log("[t2i] create status", res.status);
        const data = await res.json();
        console.log("[t2i] create body", data);
        // If immediate images returned
        const immediateImages: string[] = Array.isArray(data?.images)
          ? data.images
          : [];
        if (immediateImages.length) {
          setT2iImages(immediateImages);
          addMessage(
            threadId!,
            "assistant",
            `Сгенерировано изображений: ${immediateImages.length}`
          );
          // Сохраняем каждую ссылку на картинку как отдельное сообщение
          for (const url of immediateImages) {
            addMessage(threadId!, "assistant", url);
          }
          setImageDataUrl(null);
          return;
        }
        // Otherwise poll using GET /api/t2i?poll=...
        const pollUrl: string | undefined = data?.pollUrl;
        if (!pollUrl) {
          setLastError("T2I: не удалось получить pollUrl");
          addMessage(
            threadId!,
            "assistant",
            "Не удалось получить статус задачи."
          );
          return;
        }
        console.log("[t2i] start polling", pollUrl);
        const maxAttempts = 60; // ~60s
        for (let i = 0; i < maxAttempts; i++) {
          const p = await fetch(`/api/t2i?poll=${encodeURIComponent(pollUrl)}`);
          const js = await p.json();
          console.log("[t2i] poll", p.status, js);
          if (
            p.status === 200 &&
            Array.isArray(js?.images) &&
            js.images.length
          ) {
            setT2iImages(js.images as string[]);
            addMessage(
              threadId!,
              "assistant",
              `Сгенерировано изображений: ${js.images.length}`
            );
            for (const url of js.images as string[]) {
              addMessage(threadId!, "assistant", String(url));
            }
            setImageDataUrl(null);
            break;
          }
          if (p.status >= 400) {
            setLastError(`T2I poll error ${p.status}`);
            addMessage(threadId!, "assistant", "Ошибка при опросе статуса.");
            break;
          }
          // Not ready yet
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (e) {
        console.error("[t2i] error", e);
        setLastError("T2I exception: " + (e as Error).message);
        addMessage(
          threadId!,
          "assistant",
          "Ошибка при обращении к сервису генерации."
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const payload = {
        threadId,
        content: content || "Опиши изображение",
        model,
        provider: selectedModel?.provider,
        image: imageDataUrl ?? undefined,
      } as const;
      console.log("[chat] POST /api/chat payload", payload);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("[chat] response status", res.status);
      if (!res.ok) {
        const errText = await res.text();
        console.error("[chat] error body", errText);
        setLastError(`Chat error ${res.status}: ${errText || "unknown"}`);
        addMessage(
          threadId!,
          "assistant",
          "Упс, возникла ошибка. Попробуйте ещё раз."
        );
        return;
      }
      const data = await res.json();
      console.log("[chat] response body", data);
      addMessage(threadId!, "assistant", data.reply ?? "");
      setImageDataUrl(null);
    } catch (e) {
      console.error("[chat] error", e);
      setLastError("Chat exception: " + (e as Error).message);
      addMessage(threadId!, "assistant", "Ошибка при обращении к сервису.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="glass-card w-full">
      <div className="flex items-center justify-between mb-3">
        <Heading className="neon-text" size="4">
          AI Чат
        </Heading>
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ReloadIcon className="animate-spin" />
            <span>Выполняется запрос...</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <IconButton
            size="1"
            variant="soft"
            title="История чатов"
            onClick={() => setShowHistory((v) => !v)}
          >
            <HamburgerMenuIcon />
          </IconButton>
          <IconButton
            size="1"
            variant="soft"
            title="Новый чат"
            onClick={() => setActiveThread(createThread("Новый чат"))}
          >
            <PlusCircledIcon />
          </IconButton>
        </div>
      </div>
      <ScrollArea style={{ height: 320 }} type="always">
        <div className="space-y-3 pr-2">
          {activeThread?.messages.map((m) => (
            <Flex
              key={m.id}
              align="start"
              gap="3"
              className="rounded-md border border-[color:var(--border)] p-3"
            >
              <Avatar fallback={m.role === "user" ? "U" : "A"} size="2" />
              <div className="flex-1">
                <Flex align="center" justify="between">
                  <Text weight="bold" size="2">
                    {m.role === "user" ? "Вы" : "Ассистент"}
                  </Text>
                  {m.role === "assistant" && (
                    <IconButton
                      size="1"
                      variant="soft"
                      onClick={() => copyMessage(m.id, m.content)}
                      title="Скопировать ответ"
                    >
                      {copiedId === m.id ? <CheckIcon /> : <CopyIcon />}
                    </IconButton>
                  )}
                </Flex>
                <div className="text-sm whitespace-pre-wrap mt-1">
                  {m.content}
                </div>
                {(() => {
                  const urls = extractUrls(m.content);
                  if (!urls.length) return null;
                  return (
                    <div className="mt-2 space-y-2">
                      {urls.map((u) => (
                        <div key={u} className="relative">
                          {isImageUrl(u) ? (
                            <div className="relative w-full max-w-sm aspect-square">
                              <Image
                                src={u}
                                alt="gen"
                                fill
                                sizes="(max-width: 768px) 90vw, 360px"
                                className="object-cover rounded border border-[color:var(--border)]"
                                unoptimized
                              />
                            </div>
                          ) : isAudioUrl(u) ? (
                            <audio controls src={u} className="w-full" />
                          ) : (
                            <a
                              className="underline text-xs break-all"
                              href={u}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {u}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </Flex>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      <div className="mt-3">
        <Flex gap="2" direction="column">
          {/* Select модели */}
          <div>
            <Text size="2" className="mb-1 block text-gray-300">
              Модель
            </Text>
            <Select.Root value={model} onValueChange={setModel}>
              <Select.Trigger className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 flex items-center justify-between">
                <Select.Value />
                <Select.Icon>
                  <ChevronDownIcon />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="rounded-md border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg">
                  <Select.ScrollUpButton className="flex items-center justify-center py-1">
                    <ChevronUpIcon />
                  </Select.ScrollUpButton>
                  <Select.Viewport className="p-1">
                    {models.map((m) => (
                      <Select.Item
                        key={m.name}
                        value={m.name}
                        className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer data-[highlighted]:bg-white/10"
                      >
                        <Select.ItemText>
                          <span className="font-medium">{m.name}</span>
                          {m.tags?.length ? (
                            <span className="ml-2 text-xs text-gray-400">
                              [{m.tags.join(", ")}]
                            </span>
                          ) : null}
                        </Select.ItemText>
                        <Select.ItemIndicator className="ml-auto">
                          <CheckIcon />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                  <Select.ScrollDownButton className="flex items-center justify-center py-1">
                    <ChevronDownIcon />
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
          {isTextToImage && t2iOptions && (
            <Card className="glass-card p-3">
              <Heading size="3" className="mb-2">
                Параметры генерации (Text-to-Image)
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="col-span-1 md:col-span-2">
                  <Text size="2" className="block mb-1">
                    Prompt
                  </Text>
                  <TextArea
                    rows={2}
                    placeholder="Опишите, что вы хотите получить"
                    value={t2iOptions.input.prompt}
                    onChange={(e) =>
                      setT2iOptions((prev) =>
                        prev
                          ? {
                              ...prev,
                              input: { ...prev.input, prompt: e.target.value },
                            }
                          : prev
                      )
                    }
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Text size="2" className="block mb-1">
                    Negative prompt
                  </Text>
                  <TextArea
                    rows={2}
                    placeholder="Что исключить"
                    value={t2iOptions.input.negative_prompt ?? ""}
                    onChange={(e) =>
                      setT2iOptions((prev) =>
                        prev
                          ? {
                              ...prev,
                              input: {
                                ...prev.input,
                                negative_prompt: e.target.value,
                              },
                            }
                          : prev
                      )
                    }
                  />
                </div>
                <div>
                  <Text size="2" className="block mb-1">
                    Размер
                  </Text>
                  <div className="flex gap-2">
                    <div className="min-w-[170px]">
                      <Select.Root
                        value={t2iOptions.parameters.size ?? ""}
                        onValueChange={(val) =>
                          setT2iOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  parameters: { ...prev.parameters, size: val },
                                }
                              : prev
                          )
                        }
                      >
                        <Select.Trigger className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 flex items-center justify-between">
                          <Select.Value placeholder="Быстрый выбор" />
                          <Select.Icon>
                            <ChevronDownIcon />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="rounded-md border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg">
                            <Select.ScrollUpButton className="flex items-center justify-center py-1">
                              <ChevronUpIcon />
                            </Select.ScrollUpButton>
                            <Select.Viewport className="p-1">
                              {[
                                "1024*1024",
                                "1024*576",
                                "576*1024",
                                "768*768",
                                "1344*768",
                                "768*1344",
                              ].map((sz) => (
                                <Select.Item
                                  key={sz}
                                  value={sz}
                                  className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer data-[highlighted]:bg-white/10"
                                >
                                  <Select.ItemText>{sz}</Select.ItemText>
                                  <Select.ItemIndicator className="ml-auto">
                                    <CheckIcon />
                                  </Select.ItemIndicator>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                            <Select.ScrollDownButton className="flex items-center justify-center py-1">
                              <ChevronDownIcon />
                            </Select.ScrollDownButton>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>
                    <TextField.Root
                      placeholder="например 1024*1024"
                      value={t2iOptions.parameters.size ?? ""}
                      onChange={(e) =>
                        setT2iOptions((prev) =>
                          prev
                            ? {
                                ...prev,
                                parameters: {
                                  ...prev.parameters,
                                  size: e.target.value,
                                },
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                </div>
                <div>
                  <Text size="2" className="block mb-1">
                    Количество (n)
                  </Text>
                  <TextField.Root
                    type="number"
                    min="1"
                    max="8"
                    value={String(t2iOptions.parameters.n ?? 1)}
                    onChange={(e) =>
                      setT2iOptions((prev) =>
                        prev
                          ? {
                              ...prev,
                              parameters: {
                                ...prev.parameters,
                                n: Number(e.target.value) || 1,
                              },
                            }
                          : prev
                      )
                    }
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(t2iOptions.parameters.prompt_extend)}
                      onChange={(e) =>
                        setT2iOptions((prev) =>
                          prev
                            ? {
                                ...prev,
                                parameters: {
                                  ...prev.parameters,
                                  prompt_extend: e.target.checked,
                                },
                              }
                            : prev
                        )
                      }
                    />
                    <span>Prompt extend</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(t2iOptions.parameters.watermark)}
                      onChange={(e) =>
                        setT2iOptions((prev) =>
                          prev
                            ? {
                                ...prev,
                                parameters: {
                                  ...prev.parameters,
                                  watermark: e.target.checked,
                                },
                              }
                            : prev
                        )
                      }
                    />
                    <span>Watermark</span>
                  </label>
                </div>
                <div>
                  <Text size="2" className="block mb-1">
                    Seed
                  </Text>
                  <TextField.Root
                    type="number"
                    value={String(t2iOptions.parameters.seed ?? 42)}
                    onChange={(e) =>
                      setT2iOptions((prev) =>
                        prev
                          ? {
                              ...prev,
                              parameters: {
                                ...prev.parameters,
                                seed: Number(e.target.value) || 0,
                              },
                            }
                          : prev
                      )
                    }
                  />
                </div>
              </div>
              <Separator my="3" size="4" />
            </Card>
          )}
          {isTTS && (
            <Card className="glass-card p-3">
              <Heading size="3" className="mb-2">
                Параметры синтеза речи (TTS)
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Text size="2" className="block mb-1">
                    Голос
                  </Text>
                  <Select.Root value={ttsVoice} onValueChange={setTtsVoice}>
                    <Select.Trigger className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 flex items-center justify-between">
                      <Select.Value />
                      <Select.Icon>
                        <ChevronDownIcon />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="rounded-md border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg">
                        <Select.ScrollUpButton className="flex items-center justify-center py-1">
                          <ChevronUpIcon />
                        </Select.ScrollUpButton>
                        <Select.Viewport className="p-1">
                          {[
                            "Cherry",
                            "Serena",
                            "Ethan",
                            "Chelsie",
                            "Dylan",
                            "Jada",
                            "Sunny",
                          ].map((v) => (
                            <Select.Item
                              key={v}
                              value={v}
                              className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer data-[highlighted]:bg-white/10"
                            >
                              <Select.ItemText>{v}</Select.ItemText>
                              <Select.ItemIndicator className="ml-auto">
                                <CheckIcon />
                              </Select.ItemIndicator>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                        <Select.ScrollDownButton className="flex items-center justify-center py-1">
                          <ChevronDownIcon />
                        </Select.ScrollDownButton>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
                {ttsAudioUrl && (
                  <div className="flex flex-col gap-1">
                    <Text size="2" className="block mb-1">
                      Прослушивание
                    </Text>
                    <audio controls src={ttsAudioUrl} />
                  </div>
                )}
              </div>
              <Separator my="3" size="4" />
            </Card>
          )}
          {isTextToImage && t2iImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {t2iImages.map((src, idx) => (
                <div key={idx} className="relative w-full aspect-square">
                  <Image
                    src={src}
                    alt={`gen-${idx}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover rounded border border-[color:var(--border)]"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
          {isTextToImage && isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <ReloadIcon className="animate-spin" />
              <span>Генерация изображений...</span>
            </div>
          )}
          {lastError && <div className="text-xs text-red-400">{lastError}</div>}
          {!isTextToImage && (
            <div className="relative">
              <TextArea
                rows={3}
                placeholder="Спросите ассистента помочь с задачами..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="absolute right-2 bottom-2">
                <IconButton
                  variant={listening ? "solid" : "soft"}
                  color={listening ? "crimson" : "gray"}
                  onClick={toggleVoice}
                  title={listening ? "Остановить запись" : "Голосовой ввод"}
                >
                  <span className="text-xs">{listening ? "●" : "🎤"}</span>
                </IconButton>
              </div>
              <div className="absolute right-12 bottom-2">
                <IconButton
                  variant="soft"
                  color="gray"
                  onClick={() => fileInputRef.current?.click()}
                  title="Загрузить изображение"
                >
                  <ImageIcon />
                </IconButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const url = String(reader.result || "");
                      if (url) {
                        setImageDataUrl(url);
                        setModel("qwen-vl-plus");
                      }
                    };
                    reader.readAsDataURL(file);
                    e.currentTarget.value = "";
                  }}
                />
              </div>
            </div>
          )}
          {imageDataUrl && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="relative h-10 w-10">
                <Image
                  src={imageDataUrl}
                  alt="preview"
                  fill
                  sizes="40px"
                  className="object-contain rounded border border-[color:var(--border)]"
                  unoptimized
                />
              </div>
              <button
                className="underline"
                onClick={() => setImageDataUrl(null)}
              >
                Убрать изображение
              </button>
            </div>
          )}
          <Button
            className="btn-primary"
            onClick={sendMessage}
            disabled={
              isLoading ||
              (isTextToImage && !(t2iOptions?.input.prompt || "").trim()) ||
              (isTTS && !input.trim())
            }
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <ReloadIcon className="animate-spin" /> Генерация...
              </span>
            ) : (
              "Отправить"
            )}
          </Button>
        </Flex>
      </div>
      {showHistory && (
        <aside className="fixed top-0 right-0 h-full w-80 glass-card p-4 overflow-auto border-l border-[color:var(--border)] z-50">
          <div className="flex items-center justify-between mb-3">
            <Heading size="3">История</Heading>
            <IconButton
              size="1"
              variant="soft"
              onClick={() => setShowHistory(false)}
            >
              ✕
            </IconButton>
          </div>
          <div className="space-y-2">
            {threads.map((th) => (
              <div
                key={th.id}
                className="rounded-md border border-[color:var(--border)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    className="text-left flex-1 hover:underline"
                    onClick={() => {
                      setActiveThread(th.id);
                      setShowHistory(false);
                    }}
                  >
                    <div className="font-medium truncate">
                      {th.title || "Без названия"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Создан: {new Date(th.createdAt).toLocaleString()} •
                      Обновлён: {new Date(th.updatedAt).toLocaleString()}
                    </div>
                  </button>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <IconButton size="1" variant="soft">
                        ⋮
                      </IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content className="rounded-md border border-[color:var(--border)] bg-[color:var(--card)] p-1">
                      <DropdownMenu.Item
                        onClick={() => {
                          setActiveThread(th.id);
                          setShowHistory(false);
                        }}
                      >
                        Открыть
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onClick={() => {
                          const title =
                            prompt("Новое название чата", th.title || "") ||
                            th.title ||
                            "";
                          if (title) renameThread(th.id, title);
                        }}
                      >
                        Переименовать
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item onClick={() => deleteThread(th.id)}>
                        Удалить
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
              </div>
            ))}
            {threads.length === 0 && (
              <div className="text-sm text-gray-400">Чатов пока нет</div>
            )}
          </div>
        </aside>
      )}
    </Card>
  );
}
