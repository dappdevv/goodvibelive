import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MidjourneySchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  botType: z.string().default("MID_JOURNEY"),
  accountFilter: z.object({
    modes: z.array(z.enum(["FAST", "RELAX"])).default(["FAST"])
  }).optional(),
  notifyHook: z.string().optional(),
  state: z.string().optional(),
  base64: z.string().optional(),
  videoType: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = MidjourneySchema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { prompt, botType, accountFilter, notifyHook, state, base64, videoType } = parsed.data;
    const apiKey = process.env.COMET_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "COMET_API_KEY not configured" },
        { status: 500 }
      );
    }

    const payload = {
      botType,
      prompt,
      ...(accountFilter && { accountFilter }),
      ...(notifyHook && { notifyHook }),
      ...(state && { state }),
      ...(base64 && { base64 }),
      ...(videoType && { videoType }),
    };

    const response = await fetch("https://api.cometapi.com/mj/submit/imagine", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CometAPI imagine error:", response.status, errorText);
      return NextResponse.json(
        { error: `CometAPI error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("CometAPI imagine response:", data);
    
    // Проверяем структуру ответа согласно документации
    if (data.code === 1 && data.result) {
      console.log("Successfully created task with ID:", data.result);
      return NextResponse.json({
        code: 1,
        description: data.description || "Submit successfully",
        result: String(data.result), // Преобразуем в строку для консистентности
        properties: data.properties || {}
      });
    }
    
    return NextResponse.json(data);

  } catch (error) {
    console.error("Midjourney API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
