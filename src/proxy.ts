import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "localdb_session";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/_next",
  "/favicon",
  "/atlas",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// In-memory token bucket per IP
type Bucket = { tokens: number; lastRefill: number };
const limiters = new Map<string, Bucket>();
const RATE_CAPACITY = 120;
const RATE_REFILL_MS = 60_000;

function rateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : request.headers.get("x-real-ip") ?? "unknown";
  return ip;
}

function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = limiters.get(key) ?? { tokens: RATE_CAPACITY, lastRefill: now };
  const elapsed = now - bucket.lastRefill;
  const refilled = Math.floor((elapsed / RATE_REFILL_MS) * RATE_CAPACITY);
  if (refilled > 0) {
    bucket.tokens = Math.min(RATE_CAPACITY, bucket.tokens + refilled);
    bucket.lastRefill = now;
  }
  if (bucket.tokens <= 0) {
    limiters.set(key, bucket);
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((RATE_REFILL_MS - elapsed) / 1000)),
    };
  }
  bucket.tokens -= 1;
  limiters.set(key, bucket);
  return { allowed: true };
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function validateSessionCookie(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const secret = process.env.LOCALDB_PASSWORD || process.env.LOCALDB_TOKEN;
  if (!secret) return false;
  const [payload, signature] = value.split(".");
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() || !signature) return false;
  const expected = await sha256Hex(`${payload}.${secret}.localdb-panel`);
  return expected === signature;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate-limit dla /api/* (nie dla statycznych)
  if (pathname.startsWith("/api/")) {
    const result = checkRateLimit(rateLimitKey(request));
    if (!result.allowed) {
      return NextResponse.json(
        {
          error: "Zbyt wiele żądań. Spróbuj ponownie za chwilę.",
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(result.retryAfter ?? 30),
          },
        },
      );
    }
  }

  const authEnabled =
    Boolean(process.env.LOCALDB_PASSWORD) ||
    Boolean(process.env.LOCALDB_TOKEN);

  if (!authEnabled) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const provided = authHeader.slice(7).trim();
    if (provided && provided === process.env.LOCALDB_TOKEN) {
      return NextResponse.next();
    }
  }

  const cookie = request.cookies.get(COOKIE_NAME);
  if (await validateSessionCookie(cookie?.value)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Brak autoryzacji." },
      { status: 401 },
    );
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

