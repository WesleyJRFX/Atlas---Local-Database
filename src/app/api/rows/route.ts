import { NextResponse } from "next/server";
import { deleteRow, insertRow, updateRow, withDbLock } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      databaseName?: string;
      tableName?: string;
      values?: Record<string, unknown>;
    };
    const row = await withDbLock(body.databaseName ?? "", () =>
      insertRow(body.databaseName ?? "", body.tableName ?? "", body.values ?? {}),
    );
    return NextResponse.json({ row }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      databaseName?: string;
      tableName?: string;
      rowIndex?: number;
      values?: Record<string, unknown>;
    };
    const row = await withDbLock(body.databaseName ?? "", () =>
      updateRow(
        body.databaseName ?? "",
        body.tableName ?? "",
        Number(body.rowIndex),
        body.values ?? {},
      ),
    );
    return NextResponse.json({ row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as {
      databaseName?: string;
      tableName?: string;
      rowIndex?: number;
    };
    const row = await withDbLock(body.databaseName ?? "", () =>
      deleteRow(
        body.databaseName ?? "",
        body.tableName ?? "",
        Number(body.rowIndex),
      ),
    );
    return NextResponse.json({ row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 },
    );
  }
}
