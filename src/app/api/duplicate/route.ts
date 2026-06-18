import { NextResponse } from "next/server";
import { duplicateRow, duplicateTable } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      databaseName?: string;
      tableName?: string;
      type?: "table" | "row";
      rowIndex?: number;
      newName?: string;
      withData?: boolean;
    };

    if (body.type === "row") {
      const row = await duplicateRow(
        body.databaseName ?? "",
        body.tableName ?? "",
        Number(body.rowIndex)
      );
      return NextResponse.json({ row });
    } else if (body.type === "table") {
      const copy = await duplicateTable(
        body.databaseName ?? "",
        body.tableName ?? "",
        body.newName ?? "",
        Boolean(body.withData)
      );
      return NextResponse.json({ table: copy });
    }

    throw new Error("Nieznany typ duplikacji.");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 }
    );
  }
}
