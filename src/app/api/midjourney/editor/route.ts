import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const EditorSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  image: z.string().optional(), // Base64 или URL изображения
  maskBase64: z.string().optional(), // Base64 маски для редактирования области
  botType: z.string().default("MID_JOURNEY"),
  accountFilter: z.object({
    modes: z.array(z.enum(["FAST", "RELAX"])).default(["FAST"])
  }).optional(),
  notifyHook: z.string().optional(),
  state: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = EditorSchema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { prompt, image, maskBase64, botType, accountFilter, notifyHook, state } = parsed.data;
    const apiKey = process.env.COMET_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "COMET_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Подготовка payload согласно документации
    const payload: any = {
      prompt,
      botType,
      ...(accountFilter && { accountFilter }),
      ...(notifyHook && { notifyHook }),
      ...(state && { state }),
    };

    // Добавляем изображение если есть
    if (image) {
      payload.image = image;
    }

    // Добавляем маску если есть (обязательна для редактирования области)
    if (maskBase64) {
      payload.maskBase64 = maskBase64;
    }

    console.log("Submitting editor request with payload:", JSON.stringify(payload, null, 2));

    const response = await fetch("https://api.cometapi.com/mj/submit/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CometAPI editor error:", response.status, errorText);
      return NextResponse.json(
        { error: `CometAPI error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("CometAPI editor response:", data);
    return NextResponse.json(data);

  } catch (error) {
    console.error("Midjourney editor API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}