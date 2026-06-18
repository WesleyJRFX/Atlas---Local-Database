import { NextResponse } from "next/server";
import {
  readDatabase,
  generateTableDdl,
  generateViewDdl,
  generateMaterializedViewDdl,
  generateSequenceDdl,
  generateDomainDdl,
  generateCompositeTypeDdl,
  generateRuleDdl,
  generateRoutineDdl,
  generateTriggerDdl,
  generateEventDdl,
  findDependencies,
  tableStatistics,
} from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  databaseName?: string;
  type?: string;
  name?: string;
  schema?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const databaseName = body.databaseName ?? "";
    const type = body.type ?? "";
    const name = body.name ?? "";
    const schema = body.schema ?? "public";
    const database = await readDatabase(databaseName);

    let ddl = "";
    let properties: Record<string, unknown> = {};
    let stats: Record<string, unknown> | null = null;

    switch (type) {
      case "table": {
        const table = database.tables.find(
          (t) => t.name === name && (t.schema ?? "public") === schema,
        );
        if (!table) throw new Error("Nie znaleziono tabeli.");
        ddl = generateTableDdl(table);
        properties = {
          name: table.name,
          schema: table.schema ?? "public",
          createdAt: table.createdAt,
          description: table.description,
          columnCount: table.columns.length,
          rowCount: table.rows.length,
          indexCount: table.indexes.length,
          checkCount: (table.checks ?? []).length,
        };
        stats = tableStatistics(table);
        break;
      }
      case "view": {
        const view = (database.views ?? []).find(
          (v) => v.name === name && (v.schema ?? "public") === schema,
        );
        if (!view) throw new Error("Nie znaleziono widoku.");
        ddl = generateViewDdl(view);
        properties = {
          name: view.name,
          schema: view.schema ?? "public",
          createdAt: view.createdAt,
        };
        break;
      }
      case "mview": {
        const view = (database.materializedViews ?? []).find(
          (v) => v.name === name && (v.schema ?? "public") === schema,
        );
        if (!view) throw new Error("Nie znaleziono widoku.");
        ddl = generateMaterializedViewDdl(view);
        properties = {
          name: view.name,
          schema: view.schema ?? "public",
          createdAt: view.createdAt,
          refreshedAt: view.refreshedAt,
          rowCount: view.rows.length,
          columnCount: view.columns.length,
        };
        break;
      }
      case "sequence": {
        const seq = (database.sequences ?? []).find(
          (s) => s.name === name && (s.schema ?? "public") === schema,
        );
        if (!seq) throw new Error("Nie znaleziono sekwencji.");
        ddl = generateSequenceDdl(seq);
        properties = {
          name: seq.name,
          schema: seq.schema ?? "public",
          start: seq.start,
          increment: seq.increment,
          minValue: seq.minValue,
          maxValue: seq.maxValue,
          current: seq.current,
          cycle: seq.cycle,
          createdAt: seq.createdAt,
        };
        break;
      }
      case "domain": {
        const domain = (database.domains ?? []).find(
          (d) => d.name === name && (d.schema ?? "public") === schema,
        );
        if (!domain) throw new Error("Nie znaleziono domeny.");
        ddl = generateDomainDdl(domain);
        properties = {
          name: domain.name,
          schema: domain.schema ?? "public",
          baseType: domain.baseType,
          nullable: domain.nullable,
          defaultValue: domain.defaultValue,
          check: domain.check,
          description: domain.description,
          createdAt: domain.createdAt,
        };
        break;
      }
      case "type": {
        const compType = (database.compositeTypes ?? []).find(
          (t) => t.name === name && (t.schema ?? "public") === schema,
        );
        if (!compType) throw new Error("Nie znaleziono typu.");
        ddl = generateCompositeTypeDdl(compType);
        properties = {
          name: compType.name,
          schema: compType.schema ?? "public",
          attributes: compType.attributes,
          description: compType.description,
          createdAt: compType.createdAt,
        };
        break;
      }
      case "rule": {
        const rule = (database.rules ?? []).find(
          (r) => r.name === name && (r.schema ?? "public") === schema,
        );
        if (!rule) throw new Error("Nie znaleziono reguły.");
        ddl = generateRuleDdl(rule);
        properties = {
          name: rule.name,
          schema: rule.schema ?? "public",
          tableName: rule.tableName,
          event: rule.event,
          condition: rule.condition,
          enabled: rule.enabled,
          createdAt: rule.createdAt,
        };
        break;
      }
      case "routine": {
        const routine = (database.routines ?? []).find((r) => r.name === name);
        if (!routine) throw new Error("Nie znaleziono procedury.");
        ddl = generateRoutineDdl(routine);
        properties = {
          name: routine.name,
          kind: routine.kind,
          returns: routine.returns,
          createdAt: routine.createdAt,
        };
        break;
      }
      case "trigger": {
        const trigger = (database.triggers ?? []).find((t) => t.name === name);
        if (!trigger) throw new Error("Nie znaleziono wyzwalacza.");
        ddl = generateTriggerDdl(trigger);
        properties = {
          name: trigger.name,
          tableName: trigger.tableName,
          timing: trigger.timing,
          event: trigger.event,
          enabled: trigger.enabled,
          createdAt: trigger.createdAt,
        };
        break;
      }
      case "event": {
        const event = (database.events ?? []).find((e) => e.name === name);
        if (!event) throw new Error("Nie znaleziono zdarzenia.");
        ddl = generateEventDdl(event);
        properties = {
          name: event.name,
          schedule: event.schedule,
          enabled: event.enabled,
          createdAt: event.createdAt,
        };
        break;
      }
      default:
        throw new Error("Nieznany typ obiektu.");
    }

    const dependencies = findDependencies(database, { type, name, schema });
    return NextResponse.json({ ddl, properties, dependencies, stats });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 },
    );
  }
}
