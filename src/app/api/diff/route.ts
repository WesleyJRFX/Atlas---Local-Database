import { NextResponse } from "next/server";
import { diffSchemas, readDatabase } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { a?: string; b?: string };
    if (!body.a || !body.b) throw new Error("Wybierz dwie bazy.");
    const a = await readDatabase(body.a);
    const b = await readDatabase(body.b);
    const diff = diffSchemas(a, b);
    return NextResponse.json({ diff, a: a.name, b: b.name });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 },
    );
  }
}
