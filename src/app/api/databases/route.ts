import { NextResponse } from "next/server";
import { createDatabase, deleteDatabase, duplicateDatabase, listDatabases, renameDatabase, updateDatabaseConnection } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ databases: await listDatabases() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nieznany błąd." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; duplicateFrom?: string };
    if (body.duplicateFrom && body.name) {
      const database = await duplicateDatabase(body.duplicateFrom, body.name);
      return NextResponse.json({ database }, { status: 201 });
    }
    const database = await createDatabase(body.name ?? "");
    return NextResponse.json({ database }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nieznany błąd." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; newName?: string; connection?: { host?: string; port?: number; databaseName?: string; username?: string; password?: string } };
    const database = body.connection ? await updateDatabaseConnection(body.name ?? "", body.connection) : await renameDatabase(body.name ?? "", body.newName ?? "");
    return NextResponse.json({ database });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nieznany błąd." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { name?: string };
    const result = await deleteDatabase(body.name ?? "");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nieznany błąd." }, { status: 400 });
  }
}
