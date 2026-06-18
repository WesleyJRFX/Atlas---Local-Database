import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { DatabaseConnectionConfig } from "@/lib/engines/types";

const DATA_DIR = process.env.LOCALDB_DATA_DIR ?? "./data";
const CONNECTIONS_FILE = path.join(DATA_DIR, "connections.json");

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

function sanitizeConnection(input: Partial<DatabaseConnectionConfig>): DatabaseConnectionConfig {
  const now = new Date().toISOString();
  if (!input.name?.trim()) throw new Error("Nazwa połączenia jest wymagana.");
  if (!input.engine) throw new Error("Silnik połączenia jest wymagany.");
  return {
    id: input.id || randomUUID(),
    name: input.name.trim(),
    engine: input.engine,
    host: input.host?.trim() || undefined,
    port: input.port ? Number(input.port) : undefined,
    database: input.database?.trim() || undefined,
    username: input.username?.trim() || undefined,
    filePath: input.filePath?.trim() || undefined,
    tls: Boolean(input.tls),
    url: input.url?.trim() || undefined,
    secret: input.secret,
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}

export async function listConnections(): Promise<DatabaseConnectionConfig[]> {
  await ensureDataDir();
  try {
    const content = await readFile(CONNECTIONS_FILE, "utf8");
    const parsed = JSON.parse(content) as DatabaseConnectionConfig[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveConnection(input: Partial<DatabaseConnectionConfig>) {
  await ensureDataDir();
  const connections = await listConnections();
  const next = sanitizeConnection(input);
  const index = connections.findIndex((item) => item.id === next.id);
  if (index >= 0) connections[index] = { ...connections[index], ...next, createdAt: connections[index].createdAt, updatedAt: new Date().toISOString() };
  else connections.push(next);
  await writeFile(CONNECTIONS_FILE, `${JSON.stringify(connections, null, 2)}\n`, "utf8");
  return next;
}

export async function deleteConnection(id: string) {
  const connections = await listConnections();
  const next = connections.filter((item) => item.id !== id);
  await ensureDataDir();
  await writeFile(CONNECTIONS_FILE, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return { deleted: connections.length !== next.length };
}

export async function getConnection(id: string) {
  const connections = await listConnections();
  const connection = connections.find((item) => item.id === id);
  if (!connection) throw new Error("Nie znaleziono połączenia.");
  return connection;
}
