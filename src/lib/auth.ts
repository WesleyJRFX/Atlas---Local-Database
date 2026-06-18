import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "localdb_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

type Session = { token: string; expiresAt: number };

const sessions = new Map<string, Session>();

function getConfiguredPassword(): string | null {
  const value = process.env.LOCALDB_PASSWORD;
  if (!value || value.length < 1) return null;
  return value;
}

function getConfiguredToken(): string | null {
  const value = process.env.LOCALDB_TOKEN;
  if (!value || value.length < 8) return null;
  return value;
}

export function authIsEnabled() {
  return Boolean(getConfiguredPassword() || getConfiguredToken());
}

function hashSecret(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

function safeCompare(a: string, b: string): boolean {
  const aBuf = hashSecret(a);
  const bBuf = hashSecret(b);
  return timingSafeEqual(aBuf, bBuf);
}

export function verifyPassword(password: string): boolean {
  const expected = getConfiguredPassword();
  if (!expected) return false;
  return safeCompare(password, expected);
}

export function verifyToken(token: string): boolean {
  const expected = getConfiguredToken();
  if (!expected) return false;
  return safeCompare(token, expected);
}

function sessionSecret(): string | null {
  return getConfiguredPassword() ?? getConfiguredToken();
}

function createSignedSessionToken(expiresAt: number): string {
  const secret = sessionSecret();
  if (!secret) return randomBytes(32).toString("hex");
  const payload = String(expiresAt);
  const signature = createHash("sha256")
    .update(`${payload}.${secret}.localdb-panel`)
    .digest("hex");
  return `${payload}.${signature}`;
}

export function createSession(): Session {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const token = createSignedSessionToken(expiresAt);
  sessions.set(token, { token, expiresAt });
  for (const [key, value] of sessions) {
    if (value.expiresAt < Date.now()) sessions.delete(key);
  }
  return { token, expiresAt };
}

export function destroySession(token: string) {
  sessions.delete(token);
}

export function isSessionValid(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() || !signature) return false;
  return token === createSignedSessionToken(expiresAt);
}

export function cookieName() {
  return COOKIE_NAME;
}

export function cookieMaxAgeSeconds() {
  return SESSION_TTL_MS / 1000;
}

// ===== Rate limiting (per-IP per-bucket) =====
type Bucket = { tokens: number; lastRefill: number };
const limiters = new Map<string, Bucket>();
const RATE_CAPACITY = 60; // max requests w oknie
const RATE_REFILL_MS = 60_000; // 60s

export function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
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
    return { allowed: false, retryAfter: Math.ceil((RATE_REFILL_MS - elapsed) / 1000) };
  }
  bucket.tokens -= 1;
  limiters.set(key, bucket);
  return { allowed: true };
}
