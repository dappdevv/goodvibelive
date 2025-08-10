export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  console.info("[SunoCallback][GET]");
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await req.json();
      console.info("[SunoCallback][POST][json]", json);
      return NextResponse.json({ ok: true });
    }
    const text = await req.text();
    console.info("[SunoCallback][POST][text]", text.slice(0, 4000));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[SunoCallback][POST][error]", (e as Error).message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
