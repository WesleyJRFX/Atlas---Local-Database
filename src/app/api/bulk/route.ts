import { NextResponse } from "next/server";
import { bulkDeleteRows, bulkSetColumn } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      databaseName?: string;
      tableName?: string;
      type?: "delete" | "update" | "setNull";
      rowIndexes?: number[];
      columnName?: string;
      value?: unknown;
    };

    if (body.type === "delete") {
      const result = await bulkDeleteRows(
        body.databaseName ?? "",
        body.tableName ?? "",
        body.rowIndexes ?? []
      );
      return NextResponse.json(result);
    } else if (body.type === "update" || body.type === "setNull") {
      const val = body.type === "setNull" ? null : body.value;
      const result = await bulkSetColumn(
        body.databaseName ?? "",
        body.tableName ?? "",
        body.rowIndexes ?? [],
        body.columnName ?? "",
        val
      );
      return NextResponse.json(result);
    }

    throw new Error("Nieobsługiwany typ operacji masowej.");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 }
    );
  }
}
