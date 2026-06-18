import { NextResponse } from "next/server";
import { readDatabase } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      databaseName?: string;
      tableName?: string;
      filters?: { column: string; operator: string; value?: unknown }[];
      sort?: { column: string; direction: "ASC" | "DESC" };
      limit?: number;
    };

    const database = await readDatabase(body.databaseName ?? "");
    const table = database.tables.find(
      (t) => t.name.toLowerCase() === (body.tableName ?? "").toLowerCase()
    );
    if (!table) throw new Error("Tabela nie istnieje.");

    let rows = [...table.rows];

    // Filter
    if (body.filters && Array.isArray(body.filters)) {
      for (const filter of body.filters) {
        const { column, operator, value } = filter;
        rows = rows.filter((row) => {
          const val = row[column];
          if (operator === "IS_NULL") return val === null || val === undefined;
          if (operator === "IS_NOT_NULL") return val !== null && val !== undefined;

          if (val === null || val === undefined) return false;

          const rightVal = value;
          if (operator === "=") return String(val).toLowerCase() === String(rightVal).toLowerCase();
          if (operator === "!=") return String(val).toLowerCase() !== String(rightVal).toLowerCase();
          if (operator === "contains") return String(val).toLowerCase().includes(String(rightVal).toLowerCase());

          const numLeft = Number(val);
          const numRight = Number(rightVal);
          if (Number.isNaN(numLeft) || Number.isNaN(numRight)) return false;
          if (operator === ">") return numLeft > numRight;
          if (operator === "<") return numLeft < numRight;
          if (operator === ">=") return numLeft >= numRight;
          if (operator === "<=") return numLeft <= numRight;
          return false;
        });
      }
    }

    // Sort
    if (body.sort && body.sort.column) {
      const col = body.sort.column;
      const dir = body.sort.direction === "DESC" ? -1 : 1;
      rows.sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === "number" && typeof valB === "number") {
          return (valA - valB) * dir;
        }
        return String(valA).localeCompare(String(valB)) * dir;
      });
    }

    // Limit
    if (body.limit) {
      const limit = Number(body.limit);
      if (!Number.isNaN(limit) && limit > 0) {
        rows = rows.slice(0, limit);
      }
    }

    return NextResponse.json({ rows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 }
    );
  }
}
