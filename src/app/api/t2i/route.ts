import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestOptionsSchema = z.object({
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
});

const BodySchema = z.object({
  url: z.string().url(),
  result_url: z.string().url(),
  request_options: RequestOptionsSchema,
});

// Create a T2I task (fast response), return task id and poll URL
export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { url, result_url, request_options } = parsed.data;

  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: "API key missing" }, { status: 500 });

  try {
    const createRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // DashScope async task creation
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify(request_options),
    });
    if (!createRes.ok) {
      const errText = await createRes.text();
      return NextResponse.json(
        { error: "Create task failed", detail: errText },
        { status: createRes.status }
      );
    }
    const createJson = await createRes.json();

    // Sometimes API returns results immediately
    if (createJson?.output?.results) {
      const images = extractImages(createJson);
      return NextResponse.json({ images, raw: createJson });
    }

    const taskId =
      createJson?.output?.task_id || createJson?.task_id || createJson?.id;
    if (!taskId) {
      return NextResponse.json(
        { error: "No task id in response", raw: createJson },
        { status: 500 }
      );
    }
    const pollUrl = result_url.replace("{task_id}", String(taskId));
    return NextResponse.json({ taskId, pollUrl, raw: createJson });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "t2i error" }, { status: 500 });
  }
}

// Poll task status (short-lived)
export async function GET(req: NextRequest) {
  const pollParam = req.nextUrl.searchParams.get("poll");
  if (!pollParam) {
    return NextResponse.json({ error: "Missing poll url" }, { status: 400 });
  }
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  try {
    const res = await fetch(pollParam, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    const js = await res.json();
    const status = js?.output?.task_status || js?.task_status || js?.status;
    const statusStr = String(status || "");
    if (
      [
        "SUCCEEDED",
        "SUCCEED",
        "SUCCESS",
        "succeeded",
        "finished",
        "completed",
      ].includes(statusStr)
    ) {
      const images = extractImages(js);
      return NextResponse.json({ status: statusStr, images, raw: js });
    }
    if (["FAILED", "ERROR"].includes(statusStr)) {
      return NextResponse.json(
        { status: statusStr, error: "Generation failed", raw: js },
        { status: 500 }
      );
    }
    // Not ready yet
    return NextResponse.json(
      { status: statusStr || "PENDING" },
      { status: 202 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "poll error" }, { status: 500 });
  }
}

type T2IPayload = {
  output?: {
    results?: Array<{ url?: string; image_url?: string; image?: string }>;
    task_status?: string;
  };
  results?: Array<
    { url?: string; image_url?: string; image?: string } | string
  >;
  task_status?: string;
  status?: string;
};

function extractImages(payload: T2IPayload): string[] {
  // Try common shapes
  const results = payload?.output?.results || payload?.results || [];
  const images: string[] = [];
  for (const item of results) {
    if (typeof item === "string") images.push(item);
    else if (item?.url) images.push(item.url);
    else if (item?.image_url) images.push(item.image_url);
    else if (item?.image) images.push(item.image);
  }
  return images;
}
