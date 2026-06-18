import { NextResponse } from "next/server";
import { runJob, saveJobSteps, clearJobHistory, withDbLock } from "@/lib/localdb";
import type { LocalDbJobStep } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  databaseName?: string;
  eventName?: string;
  action?: "run" | "save-steps" | "clear-history";
  steps?: LocalDbJobStep[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const databaseName = body.databaseName ?? "";
    const eventName = body.eventName ?? "";
    if (!databaseName || !eventName) throw new Error("Brak parametrów.");
    return await withDbLock(databaseName, async () => {
      if (body.action === "save-steps") {
        const database = await saveJobSteps(databaseName, eventName, body.steps ?? []);
        return NextResponse.json({ database });
      }
      if (body.action === "clear-history") {
        const database = await clearJobHistory(databaseName, eventName);
        return NextResponse.json({ database });
      }
      const result = await runJob(databaseName, eventName);
      return NextResponse.json(result);
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 },
    );
  }
}
