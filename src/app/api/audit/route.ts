import { NextResponse } from "next/server";
import { clearTracking, readDatabase } from "@/lib/localdb";
import { readRecentAuditEntries } from "@/lib/audit-file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const databaseName = url.searchParams.get("database");
    if (url.searchParams.get("source") === "file") {
      const entries = await readRecentAuditEntries(
        Number(url.searchParams.get("limit") ?? 200),
      );
      return NextResponse.json({ entries });
    }
    if (!databaseName) {
      return NextResponse.json({ auditLog: [] });
    }
    const database = await readDatabase(databaseName);
    return NextResponse.json({ auditLog: database.tracking ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { databaseName?: string };
    const database = await clearTracking(body.databaseName ?? "");
    return NextResponse.json({ database });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 }
    );
  }
}
