import { NextResponse } from "next/server";
import {
  createSchema,
  dropSchema,
  saveView,
  dropView,
  saveMaterializedView,
  refreshMaterializedView,
  dropMaterializedView,
  saveSequence,
  nextValSequence,
  resetSequence,
  dropSequence,
  saveDomain,
  dropDomain,
  saveCompositeType,
  dropCompositeType,
  saveRule,
  dropRule,
  saveTableCheck,
  dropTableCheck,
  withDbLock,
} from "@/lib/localdb";
import type { LocalDbColumnType, LocalDbRule, LocalDbValue } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ObjectType = "schema" | "view" | "mview" | "sequence" | "domain" | "type" | "rule" | "check";

type Body = {
  databaseName?: string;
  type?: ObjectType;
  action?: "save" | "drop" | "refresh" | "nextval" | "reset";
  payload?: Record<string, unknown>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const databaseName = body.databaseName ?? "";
    const payload = body.payload ?? {};
    const action = body.action ?? "save";

    return await withDbLock(databaseName, async () => {
      switch (body.type) {
      case "schema": {
        if (action === "drop") {
          const database = await dropSchema(databaseName, String(payload.name ?? ""));
          return NextResponse.json({ database });
        }
        const database = await createSchema(
          databaseName,
          String(payload.name ?? ""),
          payload.description ? String(payload.description) : undefined,
        );
        return NextResponse.json({ database });
      }
      case "view": {
        if (action === "drop") {
          const database = await dropView(
            databaseName,
            String(payload.name ?? ""),
            String(payload.schema ?? "public"),
          );
          return NextResponse.json({ database });
        }
        const database = await saveView(databaseName, {
          name: String(payload.name ?? ""),
          sql: String(payload.sql ?? ""),
          schema: payload.schema ? String(payload.schema) : undefined,
        });
        return NextResponse.json({ database });
      }
      case "mview": {
        if (action === "drop") {
          const database = await dropMaterializedView(
            databaseName,
            String(payload.name ?? ""),
            String(payload.schema ?? "public"),
          );
          return NextResponse.json({ database });
        }
        if (action === "refresh") {
          const database = await refreshMaterializedView(
            databaseName,
            String(payload.name ?? ""),
            String(payload.schema ?? "public"),
          );
          return NextResponse.json({ database });
        }
        const database = await saveMaterializedView(databaseName, {
          name: String(payload.name ?? ""),
          sql: String(payload.sql ?? ""),
          schema: payload.schema ? String(payload.schema) : undefined,
        });
        return NextResponse.json({ database });
      }
      case "sequence": {
        if (action === "drop") {
          const database = await dropSequence(
            databaseName,
            String(payload.name ?? ""),
            String(payload.schema ?? "public"),
          );
          return NextResponse.json({ database });
        }
        if (action === "nextval") {
          const result = await nextValSequence(
            databaseName,
            String(payload.name ?? ""),
            String(payload.schema ?? "public"),
          );
          return NextResponse.json({ database: result.database, value: result.value });
        }
        if (action === "reset") {
          const database = await resetSequence(
            databaseName,
            String(payload.name ?? ""),
            String(payload.schema ?? "public"),
            payload.value !== undefined ? Number(payload.value) : undefined,
          );
          return NextResponse.json({ database });
        }
        const database = await saveSequence(databaseName, {
          name: String(payload.name ?? ""),
          schema: payload.schema ? String(payload.schema) : undefined,
          start: payload.start !== undefined ? Number(payload.start) : undefined,
          increment:
            payload.increment !== undefined ? Number(payload.increment) : undefined,
          minValue:
            payload.minValue !== undefined && payload.minValue !== null
              ? Number(payload.minValue)
              : undefined,
          maxValue:
            payload.maxValue !== undefined && payload.maxValue !== null
              ? Number(payload.maxValue)
              : undefined,
          cycle: Boolean(payload.cycle),
        });
        return NextResponse.json({ database });
      }
      case "domain": {
        if (action === "drop") {
          const database = await dropDomain(
            databaseName,
            String(payload.name ?? ""),
            String(payload.schema ?? "public"),
          );
          return NextResponse.json({ database });
        }
        const database = await saveDomain(databaseName, {
          name: String(payload.name ?? ""),
          schema: payload.schema ? String(payload.schema) : undefined,
          baseType: String(payload.baseType ?? "TEXT") as LocalDbColumnType,
          nullable: Boolean(payload.nullable ?? true),
          defaultValue: (payload.defaultValue ?? null) as LocalDbValue,
          check: payload.check ? String(payload.check) : undefined,
          description: payload.description ? String(payload.description) : undefined,
        });
        return NextResponse.json({ database });
      }
      case "type": {
        if (action === "drop") {
          const database = await dropCompositeType(
            databaseName,
            String(payload.name ?? ""),
            String(payload.schema ?? "public"),
          );
          return NextResponse.json({ database });
        }
        const attributes = Array.isArray(payload.attributes)
          ? (payload.attributes as { name: string; type: LocalDbColumnType }[])
          : [];
        const database = await saveCompositeType(databaseName, {
          name: String(payload.name ?? ""),
          schema: payload.schema ? String(payload.schema) : undefined,
          attributes,
          description: payload.description ? String(payload.description) : undefined,
        });
        return NextResponse.json({ database });
      }
      case "rule": {
        if (action === "drop") {
          const database = await dropRule(
            databaseName,
            String(payload.name ?? ""),
            String(payload.schema ?? "public"),
          );
          return NextResponse.json({ database });
        }
        const database = await saveRule(databaseName, {
          name: String(payload.name ?? ""),
          schema: payload.schema ? String(payload.schema) : undefined,
          tableName: String(payload.tableName ?? ""),
          event: String(payload.event ?? "INSERT") as LocalDbRule["event"],
          condition: payload.condition ? String(payload.condition) : undefined,
          body: String(payload.body ?? ""),
          enabled: payload.enabled === undefined ? true : Boolean(payload.enabled),
        });
        return NextResponse.json({ database });
      }
      case "check": {
        const tableName = String(payload.tableName ?? "");
        if (action === "drop") {
          const database = await dropTableCheck(
            databaseName,
            tableName,
            String(payload.name ?? ""),
          );
          return NextResponse.json({ database });
        }
        const database = await saveTableCheck(
          databaseName,
          tableName,
          {
            name: String(payload.name ?? ""),
            expression: String(payload.expression ?? ""),
          },
          payload.oldName ? String(payload.oldName) : undefined,
        );
        return NextResponse.json({ database });
      }
      default:
        throw new Error("Nieznany typ obiektu.");
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 },
    );
  }
}
