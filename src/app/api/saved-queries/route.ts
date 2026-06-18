import { NextResponse } from "next/server";
import { deleteQuery, readDatabase, saveQuery } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const database = await readDatabase(url.searchParams.get("database") ?? "");
    return NextResponse.json({ savedQueries: database.savedQueries ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      databaseName?: string;
      name?: string;
      sql?: string;
    };
    const database = await saveQuery(
      body.databaseName ?? "",
      body.name ?? "Zapytanie",
      body.sql ?? ""
    );
    return NextResponse.json({ database });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { databaseName?: string; id?: string };
    const database = await deleteQuery(body.databaseName ?? "", body.id ?? "");
    return NextResponse.json({ database });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 }
    );
  }
}
