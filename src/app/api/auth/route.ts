import { NextResponse } from "next/server";
import {
  authIsEnabled,
  cookieMaxAgeSeconds,
  cookieName,
  createSession,
  destroySession,
  isSessionValid,
  verifyPassword,
} from "@/lib/auth";
import { appendAuditEntry } from "@/lib/audit-file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${cookieName()}=([^;]+)`));
  const token = match?.[1];
  return NextResponse.json({
    authEnabled: authIsEnabled(),
    authenticated: isSessionValid(token),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      password?: string;
    };
    if (!authIsEnabled()) {
      return NextResponse.json(
        { authenticated: true, authEnabled: false },
        { status: 200 },
      );
    }
    const ip = getClientIp(request);
    if (!body.password || !verifyPassword(body.password)) {
      await appendAuditEntry({
        action: "LOGIN_FAILED",
        ip,
        status: "error",
        message: "Nieprawidłowe hasło.",
      });
      // proste opóźnienie aby utrudnić brute-force
      await new Promise((resolve) => setTimeout(resolve, 350));
      return NextResponse.json(
        { error: "Nieprawidłowe hasło." },
        { status: 401 },
      );
    }
    const session = createSession();
    await appendAuditEntry({
      action: "LOGIN",
      ip,
      status: "ok",
    });
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set({
      name: cookieName(),
      value: session.token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: cookieMaxAgeSeconds(),
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${cookieName()}=([^;]+)`));
  const token = match?.[1];
  if (token) destroySession(token);
  await appendAuditEntry({
    action: "LOGOUT",
    ip: getClientIp(request),
    status: "ok",
  });
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set({
    name: cookieName(),
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
