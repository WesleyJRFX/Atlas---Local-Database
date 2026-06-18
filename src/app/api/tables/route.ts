import { NextResponse } from "next/server";
import { createTable } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      databaseName?: string;
      tableName?: string;
      columns?: string[];
    };

    const table = await createTable(body.databaseName ?? "", body.tableName ?? "", body.columns ?? []);
    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nieznany błąd." }, { status: 400 });
  }
}
