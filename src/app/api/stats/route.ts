import { NextResponse } from "next/server";
import { getStats } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getStats());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nieznany błąd." }, { status: 400 });
  }
}
