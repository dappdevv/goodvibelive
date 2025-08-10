import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Qwen-TTS REST endpoint (DashScope)
const DEFAULT_QWEN_TTS_URL =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

const BodySchema = z.object({
  model: z.string().default("qwen-tts-latest"),
  text: z.string().min(1),
  voice: z.string().min(1),
  stream: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { model, text, voice, stream } = parsed.data;

    const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "DASHSCOPE_API_KEY missing" },
        { status: 500 }
      );
    }

    // Non-streaming mode by default: returns audio URL when ready
    const headers: HeadersInit = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    // For streaming over HTTP, DashScope expects SSE header
    if (stream) {
      (headers as Record<string, string>)["X-DashScope-SSE"] = "enable";
    }

    // Prefer the common DashScope input payload shape
    const payload = {
      model,
      input: {
        text,
        voice,
      },
    } as const;

    const ttsBaseURL =
      process.env.DASHSCOPE_API_URL?.trim() || DEFAULT_QWEN_TTS_URL;
    const res = await fetch(ttsBaseURL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      // TTS result should not be cached
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: "Qwen-TTS error", detail: errText },
        { status: res.status }
      );
    }

    const data = await res.json();
    const audioUrl: string | undefined = data?.output?.audio?.url;
    const requestId: string | undefined = data?.request_id;
    const usage = data?.usage;

    if (!audioUrl && !stream) {
      return NextResponse.json(
        { error: "No audio url in response", raw: data },
        { status: 500 }
      );
    }

    return NextResponse.json({ audioUrl, requestId, usage, raw: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "tts error" }, { status: 500 });
  }
}
