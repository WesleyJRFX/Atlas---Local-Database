import { NextResponse } from "next/server";
import { importCsv, importSql, parseZip, readDatabase, safeDbPath, withDbLock } from "@/lib/localdb";
import { writeFile, rename } from "node:fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function atomicWrite(target: string, content: string) {
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, content, "utf8");
  await rename(tmp, target);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      databaseName?: string;
      sql?: string;
      jsonString?: string;
      zipBase64?: string;
      csvString?: string;
      tableName?: string;
      mode?: "replace" | "append";
    };
    const dbName = body.databaseName ?? "";
    if (!dbName) throw new Error("Nazwa bazy jest wymagana.");
    const dbFilePath = safeDbPath(dbName);

    return await withDbLock(dbName, async () => {
      if (body.zipBase64) {
        const buffer = Buffer.from(body.zipBase64, "base64");
        const files = parseZip(buffer);
        const jsonFile = files.find((f) => f.name.endsWith(".json"));
        if (!jsonFile)
          throw new Error("Nie znaleziono pliku .json z kopią bazy w archiwum .zip.");

        const parsed = JSON.parse(jsonFile.content);
        parsed.name = dbName;
        await atomicWrite(dbFilePath, JSON.stringify(parsed, null, 2));
        await readDatabase(dbName);
        return NextResponse.json({
          message: "Przywrócono bazę danych z pliku ZIP.",
          results: [],
        });
      }

      if (body.jsonString) {
        const parsed = JSON.parse(body.jsonString);
        parsed.name = dbName;
        await atomicWrite(dbFilePath, JSON.stringify(parsed, null, 2));
        await readDatabase(dbName);
        return NextResponse.json({
          message: "Przywrócono bazę danych z pliku JSON.",
          results: [],
        });
      }

      if (body.csvString) {
        const tableName = body.tableName || "imported_csv";
        const result = await importCsv(dbName, tableName, body.csvString, body.mode ?? "append");
        return NextResponse.json({
          message: `Zaimportowano ${result.importedRows} wierszy CSV do ${tableName}.`,
          database: result.database,
          results: [],
        });
      }

      const results = await importSql(dbName, body.sql ?? "");
      return NextResponse.json({ message: "Import SQL zakończony.", results });
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 },
    );
  }
}
