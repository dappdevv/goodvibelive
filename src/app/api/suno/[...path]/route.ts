export const runtime = "nodejs";

const DEFAULT_TIMEOUT_MS = 25_000;
const SUNO_BASE =
  process.env.SUNO_API_BASE?.trim() || "https://api.sunoapi.org";
const UPLOAD_BASE =
  process.env.SUNO_UPLOAD_BASE?.trim() || "https://sunoapi.org.redpandaai.co";

function isUploadPath(segments: string[] | undefined): boolean {
  if (!Array.isArray(segments) || segments.length === 0) return false;
  const joined = segments.join("/").toLowerCase();
  return (
    joined.startsWith("api/file-") ||
    joined.startsWith("api/file/") ||
    joined.includes("/file-")
  );
}

function selectBaseURL(req: Request, segments: string[] | undefined): string {
  const url = new URL(req.url);
  const hostParam = url.searchParams.get("host");
  if (hostParam === "upload") return UPLOAD_BASE;
  if (hostParam === "main") return SUNO_BASE;
  return isUploadPath(segments) ? UPLOAD_BASE : SUNO_BASE;
}

function buildTargetUrl(req: Request, pathSegments: string[] | undefined) {
  // Basic path allow-list: only proxy paths starting with "api/"
  if (!Array.isArray(pathSegments) || pathSegments[0] !== "api") {
    const pathStr = Array.isArray(pathSegments) ? pathSegments.join("/") : "";
    throw new Error(`Forbidden path: ${pathStr || "<empty>"}`);
  }

  const base = selectBaseURL(req, pathSegments);
  const joined = pathSegments.join("/");
  const target = new URL(`${base}/${joined}`);

  const url = new URL(req.url);
  // Copy search params except our control param
  url.searchParams.forEach((value, key) => {
    if (key !== "host") target.searchParams.set(key, value);
  });
  return target;
}

function maskBearer(token: string | null): string | undefined {
  if (!token) return undefined;
  const trimmed = token.replace(/^Bearer\s+/i, "").trim();
  if (!trimmed) return "Bearer <empty>";
  const suffix = trimmed.slice(-4);
  return `Bearer ****${suffix}`;
}

function buildHeaders(req: Request) {
  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) {
    console.error(
      "[SunoProxy] Missing SUNO_API_KEY env var. Incoming URL:",
      req.url
    );
    throw new Error("Missing SUNO_API_KEY env var");
  }
  const headers: HeadersInit = {
    Authorization: `Bearer ${apiKey}`,
  };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

async function forward(
  method: string,
  req: Request,
  pathSegments: string[] | undefined
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const startedAt = Date.now();
    const target = buildTargetUrl(req, pathSegments);
    const headers = buildHeaders(req);

    let body: BodyInit | undefined = undefined;
    let bodyPreview: unknown = undefined;
    if (method !== "GET" && method !== "HEAD") {
      // Pass through raw body as text/bytes to preserve JSON/multipart
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const text = await req.text();
        body = text;
        try {
          const parsed = JSON.parse(text);
          bodyPreview = parsed;
        } catch {
          bodyPreview = text.slice(0, 2000);
        }
      } else if (contentType.includes("multipart/form-data")) {
        const arrayBuffer = await req.arrayBuffer();
        body = Buffer.from(arrayBuffer);
        bodyPreview = `<multipart ${Math.round(
          (body as Buffer).byteLength / 1024
        )}KB>`;
      } else {
        const text = await req.text();
        body = text;
        bodyPreview = text.slice(0, 2000);
      }
    }

    // Log request details (with masked Authorization)
    try {
      const inAuth = req.headers.get("authorization");
      const outAuth = (headers as Record<string, string>)["Authorization"];
      console.info("[SunoProxy][Request]", {
        method,
        path: Array.isArray(pathSegments) ? pathSegments.join("/") : "<none>",
        selectedBase: selectBaseURL(req, pathSegments),
        target: target.toString(),
        query: Object.fromEntries(new URL(req.url).searchParams.entries()),
        headers: {
          "content-type": req.headers.get("content-type") || undefined,
          authorization_in: maskBearer(inAuth || null),
          authorization_out: maskBearer(outAuth || null),
        },
        bodyPreview,
      });
    } catch (logErr) {
      console.warn("[SunoProxy] Failed to log request details:", logErr);
    }

    const res = await fetch(target.toString(), {
      method,
      headers,
      body,
      cache: "no-store",
      signal: controller.signal,
    });

    const resContentType = res.headers.get("content-type") || "";
    const init: ResponseInit = {
      status: res.status,
      statusText: res.statusText,
    };

    if (resContentType.includes("application/json")) {
      const json = await res.json();
      // Log response JSON (truncated)
      try {
        const elapsedMs = Date.now() - startedAt;
        const preview = JSON.stringify(json);
        console.info("[SunoProxy][Response]", {
          status: res.status,
          contentType: resContentType,
          elapsedMs,
          bodyPreview:
            preview.length > 3000 ? preview.slice(0, 3000) + "…" : preview,
        });
      } catch (logErr) {
        console.warn("[SunoProxy] Failed to log JSON response:", logErr);
      }
      return Response.json(json, init);
    } else {
      const buf = Buffer.from(await res.arrayBuffer());
      try {
        const elapsedMs = Date.now() - startedAt;
        let preview: string | undefined = undefined;
        // Only try to preview text-like payloads
        if (resContentType.startsWith("text/")) {
          preview = buf.toString("utf8", 0, Math.min(buf.length, 3000));
        }
        console.info("[SunoProxy][Response]", {
          status: res.status,
          contentType: resContentType,
          elapsedMs,
          bodyPreview: preview,
          sizeBytes: buf.length,
        });
      } catch (logErr) {
        console.warn("[SunoProxy] Failed to log non-JSON response:", logErr);
      }
      return new Response(buf, {
        ...init,
        headers: {
          "content-type": resContentType || "application/octet-stream",
        },
      });
    }
  } catch (e) {
    const message = (e as Error).message || String(e);
    const isAbort =
      message.includes("AbortError") || message.includes("aborted");
    const status = isAbort ? 504 : 500;
    console.error("[SunoProxy][Error]", { message, status });
    return Response.json({ error: message }, { status });
  } finally {
    clearTimeout(t);
  }
}

export async function GET(req: Request, context: unknown) {
  const params = (context as { params?: { path?: string[] } }).params;
  return forward("GET", req, params?.path);
}

export async function POST(req: Request, context: unknown) {
  const params = (context as { params?: { path?: string[] } }).params;
  return forward("POST", req, params?.path);
}

export async function PUT(req: Request, context: unknown) {
  const params = (context as { params?: { path?: string[] } }).params;
  return forward("PUT", req, params?.path);
}

export async function DELETE(req: Request, context: unknown) {
  const params = (context as { params?: { path?: string[] } }).params;
  return forward("DELETE", req, params?.path);
}
