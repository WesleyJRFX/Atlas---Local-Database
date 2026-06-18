import { NextResponse } from "next/server";
import {
  addColumn,
  addIndex,
  alterColumn,
  dropColumn,
  dropIndex,
  readDatabase,
  renameColumn,
  withDbLock,
} from "@/lib/localdb";
import type { LocalDbColumn, LocalDbColumnType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const database = await readDatabase(url.searchParams.get("database") ?? "");
    const tableName = url.searchParams.get("table");
    const table = tableName ? database.tables.find((item) => item.name === tableName) : undefined;
    if (tableName && !table) throw new Error("Tabela nie istnieje.");
    return NextResponse.json(table ?? { database: database.name, tables: database.tables.map((item) => ({ name: item.name, columns: item.columns, indexes: item.indexes })) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nieznany błąd." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      databaseName?: string;
      tableName?: string;
      operation?: "addColumn" | "dropColumn" | "renameColumn" | "alterColumn" | "addIndex" | "dropIndex";
      column?: Partial<LocalDbColumn> & { name: string; type: LocalDbColumnType };
      columnName?: string;
      newName?: string;
      patch?: Partial<LocalDbColumn>;
      indexName?: string;
      indexColumns?: string[];
      unique?: boolean;
    };
    const dbName = body.databaseName ?? "";
    const tableName = body.tableName ?? "";
    return await withDbLock(dbName, async () => {
      switch (body.operation) {
        case "addColumn":
          if (!body.column) throw new Error("Brak danych kolumny.");
          return NextResponse.json({ database: await addColumn(dbName, tableName, body.column) });
        case "dropColumn":
          return NextResponse.json({ database: await dropColumn(dbName, tableName, body.columnName ?? "") });
        case "renameColumn":
          return NextResponse.json({ database: await renameColumn(dbName, tableName, body.columnName ?? "", body.newName ?? "") });
        case "alterColumn":
          return NextResponse.json({ database: await alterColumn(dbName, tableName, body.columnName ?? "", body.patch ?? {}) });
        case "addIndex":
          return NextResponse.json({ database: await addIndex(dbName, tableName, body.indexName ?? "", body.indexColumns ?? [], Boolean(body.unique)) });
        case "dropIndex":
          return NextResponse.json({ database: await dropIndex(dbName, tableName, body.indexName ?? "") });
        default:
          throw new Error("Nieobsługiwana operacja.");
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nieznany błąd." }, { status: 400 });
  }
}
