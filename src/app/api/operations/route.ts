import { NextResponse } from "next/server";
import { analyzeTable, checkIntegrity, rebuildIndexes, tableOperation, undoLastOperation } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      databaseName?: string;
      tableName?: string;
      operation?: "truncate" | "drop" | "rename" | "undo" | "analyze" | "check" | "rebuildIndexes";
      newName?: string;
    };
    if (body.operation === "undo") {
      const database = await undoLastOperation(body.databaseName ?? "");
      return NextResponse.json({ message: "Cofnięto ostatnią operację.", database });
    }
    if (body.operation === "analyze") {
      const result = await analyzeTable(body.databaseName ?? "", body.tableName ?? "");
      return NextResponse.json(result);
    }
    if (body.operation === "check") {
      const result = await checkIntegrity(body.databaseName ?? "", body.tableName || undefined);
      return NextResponse.json(result);
    }
    if (body.operation === "rebuildIndexes") {
      const result = await rebuildIndexes(body.databaseName ?? "", body.tableName || undefined);
      return NextResponse.json(result);
    }
    const result = await tableOperation(body.databaseName ?? "", body.tableName ?? "", body.operation ?? "truncate", body.newName);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nieznany błąd." }, { status: 400 });
  }
}
