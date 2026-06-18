import { NextResponse } from "next/server";
import { executeSql } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { databaseName?: string; sql?: string };
    const results = await executeSql(body.databaseName ?? "", body.sql ?? "");
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nieznany błąd." }, { status: 400 });
  }
}
