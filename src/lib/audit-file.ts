import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

const AUDIT_DIR = process.env.LOCALDB_AUDIT_DIR ?? "./data";
const AUDIT_FILE = path.join(AUDIT_DIR, "audit.log");

export type AuditEntryInput = {
  action: string;
  database?: string;
  detail?: string;
  user?: string;
  ip?: string;
  status?: "ok" | "error";
  message?: string;
};

export async function appendAuditEntry(entry: AuditEntryInput) {
  try {
    await mkdir(AUDIT_DIR, { recursive: true });
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      action: entry.action,
      database: entry.database ?? null,
      detail: entry.detail ?? null,
      user: entry.user ?? null,
      ip: entry.ip ?? null,
      status: entry.status ?? "ok",
      message: entry.message ?? null,
    });
    await appendFile(AUDIT_FILE, `${line}\n`, "utf8");
  } catch {
    // Audit log nie może blokować akcji
  }
}

export async function readRecentAuditEntries(limit = 200): Promise<unknown[]> {
  try {
    const { readFile } = await import("node:fs/promises");
    const content = await readFile(AUDIT_FILE, "utf8");
    const lines = content.trim().split("\n").filter(Boolean).slice(-limit).reverse();
    return lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}
