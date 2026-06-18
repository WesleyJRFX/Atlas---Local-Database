import { NextResponse } from "next/server";
import {
  clearRecycleBin,
  deleteRecycleBinItem,
  readDatabase,
  restoreRecycleBinItem,
} from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const database = await readDatabase(url.searchParams.get("database") ?? "");
    return NextResponse.json({ recycleBin: database.recycleBin ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { databaseName?: string; itemId?: string };
    const database = await restoreRecycleBinItem(
      body.databaseName ?? "",
      body.itemId ?? ""
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
    const body = (await request.json()) as { databaseName?: string; itemId?: string };
    let database;
    if (body.itemId) {
      database = await deleteRecycleBinItem(body.databaseName ?? "", body.itemId);
    } else {
      database = await clearRecycleBin(body.databaseName ?? "");
    }
    return NextResponse.json({ database });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 }
    );
  }
}
