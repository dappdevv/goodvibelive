import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

// Optional server-side verification endpoint for Telegram Login Widget
const QuerySchema = z.object({
  id: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.string(),
  hash: z.string(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const parsed = QuerySchema.safeParse(query);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query" },
      { status: 400 }
    );
  }

  const { hash, ...data } = parsed.data;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken)
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN missing" },
      { status: 500 }
    );

  // Verify using HMAC-SHA256
  const secret = crypto.createHash("sha256").update(botToken).digest();
  const checkString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${(data as Record<string, string | undefined>)[k]}`)
    .join("\n");
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(checkString)
    .digest("hex");
  const valid = hmac === hash;

  return NextResponse.json({ ok: valid, user: valid ? data : null });
}
