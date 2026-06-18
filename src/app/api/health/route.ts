import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";
import { getStats } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await getStats();
  return NextResponse.json({ ok: true, version: packageJson.version, ...stats });
}
