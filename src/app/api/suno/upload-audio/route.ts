export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

const DEFAULT_TIMEOUT_MS = 25_000;
const UPLOAD_BASE =
  process.env.SUNO_UPLOAD_BASE?.trim() || "https://sunoapi.org.redpandaai.co";

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing SUNO_API_KEY env var" },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    const uploadPath = String(form.get("uploadPath") || "user-uploads");
    const fileName = String(form.get("fileName") || "audio_upload");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Expected multipart field 'file'" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mime = file.type || "application/octet-stream";
    const base64Data = `data:${mime};base64,${base64}`;

    const upstream = `${UPLOAD_BASE}/api/file-base64-upload`;
    // Легкая защита от слишком больших файлов (ограничим до ~18MB base64,
    // что на практике около 13-14MB бинарного аудио; при необходимости измените)
    if (base64Data.length > 18 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large for upload via proxy" },
        { status: 413 }
      );
    }
    const res = await fetch(upstream, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ base64Data, uploadPath, fileName }),
      cache: "no-store",
      signal: controller.signal,
    });

    const ct = res.headers.get("content-type") || "";
    const init: ResponseInit = {
      status: res.status,
      statusText: res.statusText,
    };
    if (ct.includes("application/json")) {
      const json = await res.json();
      return NextResponse.json(json, init);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return new Response(buf, { ...init, headers: { "content-type": ct } });
  } catch (e) {
    const message = (e as Error).message || String(e);
    const status = message.includes("AbortError") ? 504 : 500;
    return NextResponse.json({ error: message }, { status });
  } finally {
    clearTimeout(t);
  }
}
