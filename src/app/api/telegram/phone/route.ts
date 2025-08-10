import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Верификация данных из Telegram WebApp (включая phone_number)
function verifyTelegramWebApp(
  initData: URLSearchParams,
  botToken: string
): boolean {
  const hash = initData.get("hash");
  if (!hash) return false;
  initData.delete("hash");
  // Формируем data_check_string: ключи сортируются, каждый "key=value", строки склеиваются через \n
  const keys = Array.from(initData.keys()).sort();
  const dataCheckString = keys
    .map((k) => `${k}=${initData.get(k) ?? ""}`)
    .join("\n");

  const secret = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");
  return hmac === hash;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/x-www-form-urlencoded")) {
      return NextResponse.json(
        { ok: false, error: "Expected application/x-www-form-urlencoded" },
        { status: 400 }
      );
    }
    const body = await req.text();
    const params = new URLSearchParams(body);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { ok: false, error: "TELEGRAM_BOT_TOKEN missing" },
        { status: 500 }
      );
    }

    const valid = verifyTelegramWebApp(params, botToken);
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    const phone = params.get("phone_number") || params.get("phone") || "";
    const userId = params.get("id") || params.get("user_id") || "";
    return NextResponse.json({
      ok: true,
      phone_number: phone,
      user_id: userId,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message || "Unknown error" },
      { status: 500 }
    );
  }
}
