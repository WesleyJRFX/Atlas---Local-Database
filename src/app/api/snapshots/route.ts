import { NextResponse } from "next/server";
import {
  createSnapshot,
  listSnapshots,
  restoreSnapshot,
  deleteSnapshot,
  compareSnapshot,
  withDbLock,
} from "@/lib/localdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const databaseName = url.searchParams.get("database") ?? "";
    const compareId = url.searchParams.get("compare");

    if (compareId) {
      const diff = await compareSnapshot(databaseName, compareId);
      return NextResponse.json(diff);
    }

    const list = await listSnapshots(databaseName);
    return NextResponse.json({ snapshots: list });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { databaseName?: string };
    const snapshot = await withDbLock(body.databaseName ?? "", () =>
      createSnapshot(body.databaseName ?? ""),
    );
    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { databaseName?: string; snapshotId?: string };
    const database = await withDbLock(body.databaseName ?? "", () =>
      restoreSnapshot(body.databaseName ?? "", body.snapshotId ?? ""),
    );
    return NextResponse.json({ database });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { databaseName?: string; snapshotId?: string };
    const result = await withDbLock(body.databaseName ?? "", () =>
      deleteSnapshot(body.databaseName ?? "", body.snapshotId ?? ""),
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd." },
      { status: 400 }
    );
  }
}
