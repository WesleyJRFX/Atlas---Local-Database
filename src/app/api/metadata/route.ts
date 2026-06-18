import { NextResponse } from "next/server";
import { deleteMetadata, upsertMetadata } from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MetadataType = "routine" | "event" | "trigger";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { databaseName?: string; type?: MetadataType; payload?: Record<string, unknown> };
    const database = await upsertMetadata(body.databaseName ?? "", body.type ?? "routine", body.payload ?? {});
    return NextResponse.json({ database });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nieznany błąd." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { databaseName?: string; type?: MetadataType; name?: string };
    const database = await deleteMetadata(body.databaseName ?? "", body.type ?? "routine", body.name ?? "");
    return NextResponse.json({ database });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nieznany błąd." }, { status: 400 });
  }
}
