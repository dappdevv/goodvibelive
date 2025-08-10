import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { z } from "zod";

const BodySchema = z.object({
  threadId: z.string(),
  content: z.string().optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
  image: z.string().url().optional(), // data URL или обычный URL
  t2iOptions: z
    .object({
      model: z.string(),
      input: z.object({
        prompt: z.string(),
        negative_prompt: z.string().optional(),
      }),
      parameters: z.object({
        size: z.string().optional(),
        n: z.number().optional(),
        prompt_extend: z.boolean().optional(),
        watermark: z.boolean().optional(),
        seed: z.number().optional(),
      }),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { content, model, provider, image, t2iOptions } = parsed.data;
  if (!content && !image) {
    return NextResponse.json({ error: "Empty request" }, { status: 400 });
  }

  // Выбор ключа/URL по провайдеру
  const isOpenRouter = provider === "openrouter" || (model || "").includes("/");
  // dashscope признак не используется напрямую ниже, оставим вычисление при необходимости
  const apiKey = isOpenRouter
    ? process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
    : process.env.OPENAI_API_KEY;

  // Base URLs с приоритетом по провайдерам
  const envOpenRouter = process.env.OPENROUTER_API_URL;
  const envOpenAI = process.env.OPENAI_API_URL;
  const rawBaseURL = isOpenRouter ? envOpenRouter || envOpenAI : envOpenAI;
  const baseURL = rawBaseURL?.replace(/\/chat\/completions\/?$/, "");
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY missing" },
      { status: 500 }
    );
  }
  // Optional OpenRouter headers
  const maybeDefaultHeaders: Record<string, string> = {};
  const httpReferer =
    process.env.OPENROUTER_HTTP_REFERER || process.env.SITE_URL;
  const xTitle = process.env.OPENROUTER_X_TITLE || process.env.SITE_NAME;
  if (httpReferer) maybeDefaultHeaders["HTTP-Referer"] = httpReferer;
  if (xTitle) maybeDefaultHeaders["X-Title"] = xTitle;

  const client = new OpenAI({
    apiKey,
    baseURL,
    // Передаём заголовки только если заданы
    ...(Object.keys(maybeDefaultHeaders).length
      ? { defaultHeaders: maybeDefaultHeaders }
      : {}),
  });

  try {
    const userMessage: ChatCompletionMessageParam = image
      ? {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: image } },
            { type: "text", text: content || "Опиши изображение" },
          ],
        }
      : { role: "user", content: content || "" };

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "Ты помощник по управлению задачами. Отвечай кратко и по-деловому на русском.",
      },
      userMessage,
    ];
    if (t2iOptions) {
      messages.push({
        role: "developer",
        content: `t2iOptions: ${JSON.stringify(t2iOptions)}`,
      });
    }

    const completion = await client.chat.completions.create({
      model: model || (image ? "qwen-vl-plus" : "gpt-4o-mini"),
      messages,
      temperature: 0.4,
      max_tokens: 400,
    });
    const reply = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ reply });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "OpenAI error" }, { status: 500 });
  }
}
