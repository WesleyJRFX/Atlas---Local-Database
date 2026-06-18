import { NextResponse } from "next/server";
import { exportSql, readDatabase, createZip } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportFormat = "sql" | "json" | "zip" | "csv";
type ExportType = "schema" | "data" | "all" | "both";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function tableToCsv(table: { columns: { name: string }[]; rows: Record<string, unknown>[] }) {
  const header = table.columns.map((c) => csvEscape(c.name)).join(",");
  const lines = table.rows.map((row) =>
    table.columns.map((column) => csvEscape(row[column.name])).join(","),
  );
  return [header, ...lines].join("\n");
}

async function handleExport(options: {
  databaseName?: string;
  tableName?: string;
  format?: ExportFormat;
  exportType?: ExportType;
}) {
  const dbName = options.databaseName ?? "localdb";
  const format = options.format ?? "sql";

  if (format === "json") {
    const db = await readDatabase(dbName);
    return new NextResponse(JSON.stringify(db, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${dbName}.json"`,
      },
    });
  }

  if (format === "csv") {
    const db = await readDatabase(dbName);
    const tableName = options.tableName;
    if (!tableName) throw new Error("CSV wymaga wyboru tabeli.");
    const table = db.tables.find((item) => item.name === tableName);
    if (!table) throw new Error("Nie znaleziono tabeli.");
    return new NextResponse(tableToCsv(table), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${dbName}_${tableName}.csv"`,
      },
    });
  }

  const sql = await exportSql(dbName, options.tableName || undefined);
  let finalSql = sql;
  if (options.exportType === "schema") {
    finalSql = sql
      .split("\n")
      .filter((line) => !line.startsWith("INSERT INTO"))
      .join("\n");
  } else if (options.exportType === "data") {
    finalSql = sql
      .split("\n")
      .filter((line) => line.startsWith("INSERT INTO") || line.startsWith("--"))
      .join("\n");
  }

  if (format === "zip") {
    const db = await readDatabase(dbName);
    const zipContent = createZip([
      { name: `${dbName}.json`, content: JSON.stringify(db, null, 2) },
      { name: `${dbName}.sql`, content: finalSql },
    ]);
    return new NextResponse(new Uint8Array(zipContent), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${dbName}.zip"`,
      },
    });
  }

  return new NextResponse(finalSql, {
    headers: {
      "Content-Type": "application/sql; charset=utf-8",
      "Content-Disposition": `attachment; filename="${dbName}.sql"`,
    },
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return await handleExport({
      databaseName: url.searchParams.get("database") ?? undefined,
      tableName: url.searchParams.get("table") ?? undefined,
      format: (url.searchParams.get("format") ?? "sql") as ExportFormat,
      exportType: (url.searchParams.get("exportType") ?? "all") as ExportType,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      databaseName?: string;
      tableName?: string;
      format?: ExportFormat;
      exportType?: ExportType;
    };
    return await handleExport(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 },
    );
  }
}
