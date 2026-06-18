import { NextResponse } from "next/server";
import { explainQuery, readDatabase } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { databaseName?: string; sql?: string };
    if (!body.databaseName) throw new Error("Brak nazwy bazy.");
    if (!body.sql) throw new Error("Brak zapytania.");
    const database = await readDatabase(body.databaseName);
    const plan = explainQuery(database, body.sql);
    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 },
    );
  }
}
