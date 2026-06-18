import { AsyncLocalStorage } from "node:async_hooks";
import { randomInt, randomUUID } from "node:crypto";
import { access, copyFile, mkdir, readFile, readdir, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LocalDatabase, LocalDbColumn, LocalDbColumnType, LocalDbCompositeType, LocalDbConnection, LocalDbDomain, LocalDbEvent, LocalDbJobStep, LocalDbMaterializedView, LocalDbRoutine, LocalDbRow, LocalDbRule, LocalDbSchema, LocalDbSequence, LocalDbTable, LocalDbTrigger, LocalDbValue, LocalDbView, RecycleBinItem, RoutineKind, SavedQuery, SqlResult, TrackingEntry } from "@/lib/types";
import { COLUMN_TYPES, getColumnTypeMeta, resolveColumnTypeAlias } from "@/lib/column-types";
import { appendAuditEntry } from "@/lib/audit-file";

const DATA_DIR = process.env.LOCALDB_DATA_DIR ?? "./data";
const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{1,63}$/;
const TYPES = new Set<LocalDbColumnType>(COLUMN_TYPES.map((meta) => meta.name));
const MAX_IMPORT_BYTES = 2_000_000;
const MAX_UNDO_STATES = 10;
const MAX_RECYCLE_BIN_ITEMS = 500;

// ===== Per-database mutex (kolejka write-ów) =====
const dbLocks = new Map<string, Promise<unknown>>();
const lockContext = new AsyncLocalStorage<Set<string>>();

export async function withDbLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  assertName(name, "Nazwa bazy");
  const heldLocks = lockContext.getStore();
  if (heldLocks?.has(name)) {
    return fn();
  }

  const previous = dbLocks.get(name) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = previous.then(() => next);
  dbLocks.set(name, chained);
  try {
    await previous;
    const nextHeldLocks = new Set(heldLocks ?? []);
    nextHeldLocks.add(name);
    return await lockContext.run(nextHeldLocks, fn);
  } finally {
    release();
    if (dbLocks.get(name) === chained) {
      dbLocks.delete(name);
    }
  }
}

type LegacyTable = Omit<LocalDbTable, "columns" | "indexes" | "rows"> & { columns: string[] | LocalDbColumn[]; rows: Record<string, unknown>[]; indexes?: LocalDbTable["indexes"] };
type LegacyDatabase = Omit<LocalDatabase, "engineVersion" | "tables" | "routines" | "events" | "triggers" | "tracking" | "connection" | "recycleBin" | "savedQueries" | "undoStack" | "schemas" | "views" | "materializedViews" | "sequences" | "domains" | "compositeTypes" | "rules"> & {
  engineVersion?: number;
  tables: LegacyTable[];
  routines?: LocalDbRoutine[];
  events?: LocalDbEvent[];
  triggers?: LocalDbTrigger[];
  tracking?: TrackingEntry[];
  connection?: Partial<LocalDbConnection>;
  recycleBin?: RecycleBinItem[];
  savedQueries?: SavedQuery[];
  undoStack?: string[];
  schemas?: LocalDbSchema[];
  views?: LocalDbView[];
  materializedViews?: LocalDbMaterializedView[];
  sequences?: LocalDbSequence[];
  domains?: LocalDbDomain[];
  compositeTypes?: LocalDbCompositeType[];
  rules?: LocalDbRule[];
};

export function assertName(name: unknown, label: string): asserts name is string {
  if (typeof name !== "string" || !NAME_PATTERN.test(name)) throw new Error(`${label} musi zaczynać się literą i mieć 2-64 znaki: litery, cyfry lub _.`);
}

export function safeDbPath(name: string) {
  assertName(name, "Nazwa bazy");
  const target = path.resolve(DATA_DIR, `${name}.json`);
  const root = path.resolve(DATA_DIR);
  if (!target.startsWith(root + path.sep) && target !== root) {
    throw new Error("Nieprawidłowa ścieżka bazy.");
  }
  return target;
}

function dbPath(name: string) {
  return safeDbPath(name);
}

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

function snapshotsDir(databaseName: string) {
  assertName(databaseName, "Nazwa bazy");
  return path.join(DATA_DIR, ".snapshots", databaseName);
}

async function ensureSnapshotDir(databaseName: string) {
  const dir = snapshotsDir(databaseName);
  await mkdir(dir, { recursive: true });
  return dir;
}

function normalizeType(type: string): LocalDbColumnType {
  const cleaned = type.toString().trim();
  if (!cleaned) throw new Error("Brak typu kolumny.");
  // Strip parameters like VARCHAR(255), DECIMAL(10,2), ENUM('a','b').
  const baseMatch = cleaned.match(/^[A-Za-z][A-Za-z0-9_ ]*/);
  const base = (baseMatch?.[0] ?? cleaned).trim();
  const resolved = resolveColumnTypeAlias(base);
  if (!resolved) throw new Error(`Nieobsługiwany typ kolumny: ${type}.`);
  return resolved;
}

function parseTypeAttributes(type: string, target: LocalDbColumn) {
  const upper = type.toUpperCase();
  const meta = getColumnTypeMeta(target.type);
  const lengthMatch = type.match(/\(\s*(\d+)(?:\s*,\s*(\d+))?\s*\)/);
  if (lengthMatch && (meta.hasLength || meta.hasPrecision)) {
    const first = Number(lengthMatch[1]);
    if (Number.isFinite(first)) {
      if (meta.hasPrecision) {
        target.precision = first;
        if (lengthMatch[2] !== undefined) target.scale = Number(lengthMatch[2]);
      } else {
        target.length = first;
      }
    }
  }
  if (meta.hasEnumValues) {
    const enumMatch = type.match(/\(([\s\S]+)\)/);
    if (enumMatch) {
      const values = splitCsv(enumMatch[1]).map((value) =>
        value.replace(/^['"`]|['"`]$/g, "").trim(),
      );
      target.enumValues = values.filter(Boolean);
    }
  }
  if (meta.canBeUnsigned && /\bUNSIGNED\b/.test(upper)) target.unsigned = true;
}

function generatePassword(length = 24) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=?";
  return Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join("");
}

function defaultConnection(databaseName: string): LocalDbConnection {
  const portBase = 4100;
  const offset = Array.from(databaseName).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 1000;
  return { host: "127.0.0.1", port: portBase + offset, databaseName, username: `${databaseName}_user`, password: generatePassword() };
}

function normalizeConnection(databaseName: string, connection?: Partial<LocalDbConnection>): LocalDbConnection {
  const fallback = defaultConnection(databaseName);
  const port = Number(connection?.port ?? fallback.port);
  return {
    host: connection?.host?.trim() || fallback.host,
    port: Number.isInteger(port) && port > 0 && port <= 65535 ? port : fallback.port,
    databaseName: connection?.databaseName?.trim() || databaseName,
    username: connection?.username?.trim() || fallback.username,
    password: connection?.password || fallback.password,
  };
}

function normalizeDatabase(input: LegacyDatabase): LocalDatabase {
  const defaultSchemas: LocalDbSchema[] =
    input.schemas && input.schemas.length > 0
      ? input.schemas
      : [{ name: "public", description: "Schemat domyślny", createdAt: input.createdAt }];
  return {
    name: input.name,
    engineVersion: 4,
    createdAt: input.createdAt,
    schemas: defaultSchemas,
    tables: input.tables.map((table) => {
      const columns = table.columns.map((column) => typeof column === "string" ? { name: column, type: "TEXT" as const, nullable: true } : { ...column, nullable: column.nullable ?? true, type: normalizeType(column.type) });
      return {
        name: table.name,
        schema: table.schema ?? "public",
        columns,
        rows: table.rows.map((row) => coerceRow(columns, row)),
        indexes: table.indexes ?? [],
        checks: table.checks ?? [],
        description: table.description,
        createdAt: table.createdAt,
      };
    }),
    views: (input.views ?? []).map((view) => ({ ...view, schema: view.schema ?? "public" })),
    materializedViews: (input.materializedViews ?? []).map((view) => ({
      ...view,
      schema: view.schema ?? "public",
      columns: view.columns ?? [],
      rows: view.rows ?? [],
    })),
    sequences: (input.sequences ?? []).map((seq) => ({ ...seq, schema: seq.schema ?? "public" })),
    domains: (input.domains ?? []).map((domain) => ({ ...domain, schema: domain.schema ?? "public" })),
    compositeTypes: (input.compositeTypes ?? []).map((type) => ({ ...type, schema: type.schema ?? "public" })),
    rules: (input.rules ?? []).map((rule) => ({ ...rule, schema: rule.schema ?? "public" })),
    routines: input.routines ?? [],
    events: input.events ?? [],
    triggers: input.triggers ?? [],
    tracking: input.tracking ?? [],
    connection: normalizeConnection(input.name, input.connection),
    recycleBin: input.recycleBin ?? [],
    savedQueries: input.savedQueries ?? [],
    undoStack: input.undoStack ?? [],
  };
}

function createId() {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

function track(database: LocalDatabase, action: string, objectName: string, sql?: string) {
  database.tracking.unshift({ id: createId(), action, objectName, sql, createdAt: new Date().toISOString() });
  database.tracking = database.tracking.slice(0, 500);
}

function addRecycleBinItem(database: LocalDatabase, item: Omit<RecycleBinItem, "id" | "deletedAt">) {
  if (!database.recycleBin) database.recycleBin = [];
  database.recycleBin.push({ ...item, id: createId(), deletedAt: new Date().toISOString() });
  database.recycleBin = database.recycleBin.slice(-MAX_RECYCLE_BIN_ITEMS);
}

async function saveDatabase(database: LocalDatabase) {
  await ensureDataDir();
  const target = dbPath(database.name);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, `${JSON.stringify(database, null, 2)}\n`, "utf8");
  await rename(tmp, target);
}

/**
 * Atomic mutation per-database: serializuje read-modify-write w obrębie procesu Node.
 * Używaj w każdej operacji która modyfikuje stan bazy.
 */
export async function mutateDatabase<T>(
  name: string,
  fn: (database: LocalDatabase) => Promise<T> | T,
): Promise<{ result: T; database: LocalDatabase }> {
  return withDbLock(name, async () => {
    const database = await readDatabase(name);
    const result = await fn(database);
    await saveDatabase(database);
    return { result, database };
  });
}

export async function listDatabases(): Promise<LocalDatabase[]> {
  await ensureDataDir();
  const files = await readdir(DATA_DIR);
  const databases = await Promise.all(files.filter((file) => file.endsWith(".json")).map(async (file) => readDatabase(file.replace(/\.json$/, ""))));
  return databases.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStats() {
  await ensureDataDir();
  const databases = await listDatabases();
  const tables = databases.flatMap((database) => database.tables.map((table) => ({ database: database.name, table })));
  const files = await readdir(DATA_DIR);
  const sizes = await Promise.all(files.filter((file) => file.endsWith(".json")).map(async (file) => (await stat(path.join(DATA_DIR, file))).size));
  const biggest = tables.sort((a, b) => b.table.rows.length - a.table.rows.length)[0];
  const lastChange = databases.flatMap((database) => database.tracking.map((entry) => entry.createdAt)).sort().at(-1) ?? null;
  return { databases: databases.length, tables: tables.length, rows: tables.reduce((sum, item) => sum + item.table.rows.length, 0), biggestTable: biggest ? { database: biggest.database, table: biggest.table.name, rows: biggest.table.rows.length } : null, lastChange, sizeBytes: sizes.reduce((sum, size) => sum + size, 0) };
}

export async function readDatabase(name: string): Promise<LocalDatabase> {
  const raw = await readFile(dbPath(name), "utf8");
  const parsed = JSON.parse(raw) as LegacyDatabase;
  const database = normalizeDatabase(parsed);
  if (
    database.engineVersion !== parsed.engineVersion ||
    !parsed.routines ||
    !parsed.events ||
    !parsed.triggers ||
    !parsed.tracking ||
    !parsed.connection ||
    !parsed.recycleBin ||
    !parsed.savedQueries ||
    !parsed.undoStack ||
    !parsed.schemas ||
    !parsed.views ||
    !parsed.materializedViews ||
    !parsed.sequences ||
    !parsed.domains ||
    !parsed.compositeTypes ||
    !parsed.rules
  ) await saveDatabase(database);
  return database;
}

export async function createDatabase(name: string): Promise<LocalDatabase> {
  assertName(name, "Nazwa bazy");
  await ensureDataDir();
  const database: LocalDatabase = {
    name,
    engineVersion: 4,
    createdAt: new Date().toISOString(),
    schemas: [
      { name: "public", description: "Schemat domyślny", createdAt: new Date().toISOString() },
    ],
    tables: [],
    views: [],
    materializedViews: [],
    sequences: [],
    domains: [],
    compositeTypes: [],
    rules: [],
    routines: [],
    events: [],
    triggers: [],
    tracking: [],
    connection: defaultConnection(name),
    recycleBin: [],
    savedQueries: [],
    undoStack: [],
  };
  try {
    await access(dbPath(name));
    throw new Error("Baza o tej nazwie już istnieje.");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      await saveDatabase(database);
      return database;
    }
    throw error;
  }
}

export async function renameDatabase(name: string, newName: string): Promise<LocalDatabase> {
  assertName(name, "Nazwa bazy");
  assertName(newName, "Nowa nazwa bazy");
  if (name.toLowerCase() === newName.toLowerCase()) throw new Error("Nowa nazwa musi być inna.");
  await ensureDataDir();
  const database = await readDatabase(name);
  try {
    await access(dbPath(newName));
    throw new Error("Baza o nowej nazwie już istnieje.");
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
  database.name = newName;
  database.connection.databaseName = newName;
  track(database, "RENAME_DATABASE", `${name} -> ${newName}`);
  await writeFile(dbPath(newName), JSON.stringify(database, null, 2), "utf8");
  await unlink(dbPath(name));
  return database;
}

export async function deleteDatabase(name: string) {
  assertName(name, "Nazwa bazy");
  await ensureDataDir();
  await autoSnapshot(name, "before_drop_database");
  await unlink(dbPath(name));
  await appendAuditEntry({ action: "DROP_DATABASE", database: name, status: "ok" });
  return { message: `Usunięto bazę ${name}.` };
}

export async function duplicateDatabase(name: string, newName: string): Promise<LocalDatabase> {
  assertName(name, "Nazwa bazy");
  assertName(newName, "Nowa nazwa bazy");
  if (name.toLowerCase() === newName.toLowerCase()) throw new Error("Nowa nazwa musi być inna.");
  await ensureDataDir();
  const database = await readDatabase(name);
  try {
    await access(dbPath(newName));
    throw new Error("Baza o nowej nazwie już istnieje.");
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
  const copy: LocalDatabase = {
    ...database,
    name: newName,
    createdAt: new Date().toISOString(),
    connection: normalizeConnection(newName, { ...database.connection, databaseName: newName }),
    recycleBin: [],
    savedQueries: [...(database.savedQueries ?? [])],
    tracking: [],
    undoStack: [],
  };
  track(copy, "DUPLICATE_DATABASE", `${name} -> ${newName}`);
  await writeFile(dbPath(newName), JSON.stringify(copy, null, 2), "utf8");
  return copy;
}

export async function updateDatabaseConnection(name: string, connection: Partial<LocalDbConnection>) {
  const database = await readDatabase(name);
  const nextConnection = normalizeConnection(database.name, { ...database.connection, ...connection });
  database.connection = nextConnection;
  track(database, "UPDATE_CONNECTION", database.name);
  await saveDatabase(database);
  return database;
}

function getTable(database: LocalDatabase, tableName: string) {
  const table = database.tables.find((item) => item.name.toLowerCase() === tableName.toLowerCase());
  if (!table) throw new Error(`Tabela ${tableName} nie istnieje.`);
  return table;
}

function parseColumn(input: string): LocalDbColumn | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("`") && !/^\w+\s+/i.test(trimmed)) return null;
  const upper = trimmed.toUpperCase();
  if (/^(PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|FOREIGN)\b/.test(upper)) return null;
  
  const match = trimmed.match(/^(`[^`]+`|\w+)\s+(.*)$/);
  if (!match) return null;
  const name = unquoteName(match[1]);
  assertName(name, "Nazwa kolumny");
  
  let remainder = match[2];
  const upperRemainder = remainder.toUpperCase();
  
  const nullable = !upperRemainder.includes("NOT NULL");
  const primaryKey = upperRemainder.includes("PRIMARY KEY");
  const autoIncrement = upperRemainder.includes("AUTO_INCREMENT") || upperRemainder.includes("AUTOINCREMENT") || upperRemainder.includes("SERIAL");
  const indexed = upperRemainder.includes("INDEX");
  
  remainder = remainder.replace(/(?:\bNOT\s+NULL\b|\bNULL\b|\bPRIMARY\s+KEY\b|\bAUTO_?INCREMENT\b|\bSERIAL\b|\bINDEX\b|\bUNIQUE\b|\bUNSIGNED\b)/ig, "").trim();
  
  const type = normalizeType(remainder);
  const column: LocalDbColumn = {
    name,
    type,
    nullable,
    primaryKey,
    autoIncrement,
    indexed,
  };
  return column;
}

function applyTableConstraints(table: LocalDbTable, definitions: string[]) {
  for (const definition of definitions) {
    const primary = definition.match(/^\s*PRIMARY\s+KEY\s*\((.+)\)/i);
    const index = definition.match(/^\s*(UNIQUE\s+)?(?:KEY|INDEX)\s+([`\w]+)\s*\((.+)\)/i);
    const columns = primary ? splitCsv(primary[1]).map(unquoteName) : index ? splitCsv(index[3]).map(unquoteName) : [];
    if (columns.length > 0) table.indexes.push({ name: primary ? "PRIMARY" : unquoteName(index?.[2] ?? "idx"), columns, unique: Boolean(primary || index?.[1]), createdAt: new Date().toISOString() });
    for (const name of columns) {
      const column = table.columns.find((item) => item.name.toLowerCase() === name.toLowerCase());
      if (column) {
        if (primary) column.primaryKey = true;
        column.indexed = true;
      }
    }
  }
}

export async function createTable(databaseName: string, tableName: string, columns: string[]): Promise<LocalDbTable> {
  assertName(tableName, "Nazwa tabeli");
  const database = await readDatabase(databaseName);
  recordHistory(database);
  const parsedColumns = columns.map((column) => parseColumn(column)).filter((column): column is LocalDbColumn => Boolean(column));
  if (parsedColumns.length === 0) throw new Error("Tabela musi mieć co najmniej jedną kolumnę.");
  if (new Set(parsedColumns.map((column) => column.name.toLowerCase())).size !== parsedColumns.length) throw new Error("Kolumny nie mogą się powtarzać.");
  if (database.tables.some((table) => table.name.toLowerCase() === tableName.toLowerCase())) throw new Error("Tabela o tej nazwie już istnieje w bazie.");
  const table: LocalDbTable = { name: tableName, columns: parsedColumns, rows: [], indexes: [], createdAt: new Date().toISOString() };
  applyTableConstraints(table, columns);
  database.tables.push(table);
  track(database, "CREATE_TABLE", tableName);
  await saveDatabase(database);
  return table;
}

export async function addColumn(databaseName: string, tableName: string, column: Partial<LocalDbColumn> & { name: string; type: LocalDbColumnType }) {
  assertName(column.name, "Nazwa kolumny");
  const database = await readDatabase(databaseName);
  const table = getTable(database, tableName);
  if (table.columns.some((existing) => existing.name.toLowerCase() === column.name.toLowerCase())) throw new Error("Kolumna już istnieje.");
  if (!TYPES.has(column.type)) throw new Error(`Nieobsługiwany typ kolumny: ${column.type}.`);
  recordHistory(database);
  const meta = getColumnTypeMeta(column.type);
  const newColumn: LocalDbColumn = {
    name: column.name,
    type: column.type,
    nullable: column.nullable ?? true,
    primaryKey: column.primaryKey,
    autoIncrement: column.autoIncrement && meta.canAutoIncrement,
    indexed: column.indexed,
    unsigned: column.unsigned && meta.canBeUnsigned,
    length: meta.hasLength ? column.length : undefined,
    precision: meta.hasPrecision ? column.precision : undefined,
    scale: meta.hasPrecision ? column.scale : undefined,
    enumValues: meta.hasEnumValues ? column.enumValues : undefined,
    defaultValue: column.defaultValue ?? null,
  };
  table.columns.push(newColumn);
  for (const row of table.rows) {
    row[newColumn.name] = newColumn.defaultValue ?? null;
  }
  if (newColumn.indexed) {
    table.indexes.push({ name: `idx_${newColumn.name}`, columns: [newColumn.name], unique: false, createdAt: new Date().toISOString() });
  }
  track(database, "ADD_COLUMN", `${tableName}.${newColumn.name}`, columnSql(newColumn));
  await saveDatabase(database);
  return database;
}

export async function dropColumn(databaseName: string, tableName: string, columnName: string) {
  const database = await readDatabase(databaseName);
  const table = getTable(database, tableName);
  const index = table.columns.findIndex((column) => column.name === columnName);
  if (index < 0) throw new Error("Kolumna nie istnieje.");
  if (table.columns.length === 1) throw new Error("Tabela musi mieć co najmniej jedną kolumnę.");
  recordHistory(database);
  table.columns.splice(index, 1);
  for (const row of table.rows) {
    delete row[columnName];
  }
  table.indexes = table.indexes.filter((existing) => !existing.columns.includes(columnName));
  track(database, "DROP_COLUMN", `${tableName}.${columnName}`);
  await saveDatabase(database);
  return database;
}

export async function renameColumn(databaseName: string, tableName: string, columnName: string, newName: string) {
  assertName(newName, "Nazwa kolumny");
  const database = await readDatabase(databaseName);
  const table = getTable(database, tableName);
  const column = table.columns.find((existing) => existing.name === columnName);
  if (!column) throw new Error("Kolumna nie istnieje.");
  if (table.columns.some((existing) => existing.name.toLowerCase() === newName.toLowerCase())) throw new Error("Kolumna o nowej nazwie już istnieje.");
  recordHistory(database);
  column.name = newName;
  for (const row of table.rows) {
    if (Object.prototype.hasOwnProperty.call(row, columnName)) {
      row[newName] = row[columnName];
      delete row[columnName];
    }
  }
  for (const index of table.indexes) {
    index.columns = index.columns.map((column) => (column === columnName ? newName : column));
  }
  track(database, "RENAME_COLUMN", `${tableName}.${columnName}->${newName}`);
  await saveDatabase(database);
  return database;
}

export async function alterColumn(databaseName: string, tableName: string, columnName: string, patch: Partial<LocalDbColumn>) {
  const database = await readDatabase(databaseName);
  const table = getTable(database, tableName);
  const column = table.columns.find((existing) => existing.name === columnName);
  if (!column) throw new Error("Kolumna nie istnieje.");
  recordHistory(database);
  if (patch.type) {
    if (!TYPES.has(patch.type)) throw new Error(`Nieobsługiwany typ kolumny: ${patch.type}.`);
    column.type = patch.type;
  }
  const meta = getColumnTypeMeta(column.type);
  if (patch.nullable !== undefined) column.nullable = patch.nullable;
  if (patch.primaryKey !== undefined) column.primaryKey = patch.primaryKey;
  if (patch.autoIncrement !== undefined) column.autoIncrement = patch.autoIncrement && meta.canAutoIncrement;
  if (patch.indexed !== undefined) column.indexed = patch.indexed;
  if (patch.unsigned !== undefined) column.unsigned = patch.unsigned && meta.canBeUnsigned;
  column.length = meta.hasLength ? patch.length ?? column.length : undefined;
  column.precision = meta.hasPrecision ? patch.precision ?? column.precision : undefined;
  column.scale = meta.hasPrecision ? patch.scale ?? column.scale : undefined;
  column.enumValues = meta.hasEnumValues ? patch.enumValues ?? column.enumValues : undefined;
  if (patch.defaultValue !== undefined) column.defaultValue = patch.defaultValue;
  // Coerce existing rows when type changes drastically.
  for (const row of table.rows) {
    if (row[column.name] === undefined) row[column.name] = column.defaultValue ?? null;
    try {
      row[column.name] = coerceValue(column, row[column.name]);
    } catch {
      row[column.name] = null;
    }
  }
  track(database, "ALTER_COLUMN", `${tableName}.${column.name}`);
  await saveDatabase(database);
  return database;
}

export async function addIndex(databaseName: string, tableName: string, name: string, columns: string[], unique: boolean) {
  if (!name || !/^\w+$/.test(name)) throw new Error("Niepoprawna nazwa indeksu.");
  if (columns.length === 0) throw new Error("Indeks musi mieć co najmniej jedną kolumnę.");
  const database = await readDatabase(databaseName);
  const table = getTable(database, tableName);
  for (const column of columns) {
    if (!table.columns.some((existing) => existing.name === column)) throw new Error(`Kolumna ${column} nie istnieje.`);
  }
  if (table.indexes.some((existing) => existing.name === name)) throw new Error("Indeks o tej nazwie już istnieje.");
  recordHistory(database);
  table.indexes.push({ name, columns, unique, createdAt: new Date().toISOString() });
  for (const columnName of columns) {
    const column = table.columns.find((existing) => existing.name === columnName);
    if (column) column.indexed = true;
  }
  track(database, "ADD_INDEX", `${tableName}.${name}`);
  await saveDatabase(database);
  return database;
}

export async function dropIndex(databaseName: string, tableName: string, name: string) {
  const database = await readDatabase(databaseName);
  const table = getTable(database, tableName);
  const index = table.indexes.findIndex((existing) => existing.name === name);
  if (index < 0) throw new Error("Indeks nie istnieje.");
  if (table.indexes[index].name === "PRIMARY") throw new Error("Nie można usunąć indeksu PRIMARY.");
  recordHistory(database);
  table.indexes.splice(index, 1);
  track(database, "DROP_INDEX", `${tableName}.${name}`);
  await saveDatabase(database);
  return database;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IPV4_REGEX = /^(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?$/;
const IPV6_REGEX = /^[0-9a-f:]+(?:\/\d{1,3})?$/i;
const MAC_REGEX = /^[0-9a-f]{2}([:-])(?:[0-9a-f]{2}\1){4}[0-9a-f]{2}$/i;
const POINT_REGEX = /^\(?\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*\)?$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;

function coerceValue(column: LocalDbColumn, value: unknown): LocalDbValue {
  if (value === undefined || value === null || value === "NULL") {
    if (!column.nullable && column.defaultValue === undefined && !column.autoIncrement) throw new Error(`Kolumna ${column.name} nie może być NULL.`);
    return column.defaultValue ?? null;
  }
  const meta = getColumnTypeMeta(column.type);
  const text = String(value);
  switch (meta.category) {
    case "string":
    case "xml": {
      const result = text;
      if (column.length && result.length > column.length) {
        throw new Error(`Kolumna ${column.name} przekracza limit ${column.length} znaków.`);
      }
      return result;
    }
    case "integer": {
      const parsed = Number.parseInt(text, 10);
      if (Number.isNaN(parsed)) throw new Error(`Kolumna ${column.name} wymaga liczby całkowitej (${column.type}).`);
      if (column.unsigned && parsed < 0) throw new Error(`Kolumna ${column.name} jest UNSIGNED i nie przyjmuje wartości ujemnych.`);
      return parsed;
    }
    case "decimal": {
      const parsed = Number(value);
      if (Number.isNaN(parsed)) throw new Error(`Kolumna ${column.name} wymaga liczby (${column.type}).`);
      if (column.unsigned && parsed < 0) throw new Error(`Kolumna ${column.name} jest UNSIGNED i nie przyjmuje wartości ujemnych.`);
      if (column.scale !== undefined) return Number(parsed.toFixed(column.scale));
      return parsed;
    }
    case "boolean":
      return ["1", "true", "yes", "tak", "t", "on"].includes(text.toLowerCase());
    case "date": {
      const trimmed = text.trim();
      if (!DATE_REGEX.test(trimmed)) {
        const parsedDate = new Date(trimmed);
        if (Number.isNaN(parsedDate.getTime())) throw new Error(`Kolumna ${column.name} wymaga daty w formacie RRRR-MM-DD.`);
        return parsedDate.toISOString().slice(0, 10);
      }
      return trimmed;
    }
    case "time": {
      const trimmed = text.trim();
      if (!TIME_REGEX.test(trimmed)) throw new Error(`Kolumna ${column.name} wymaga czasu HH:MM[:SS].`);
      return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
    }
    case "datetime": {
      const trimmed = text.trim().replace("T", " ");
      const parsedDate = new Date(trimmed.replace(" ", "T"));
      if (Number.isNaN(parsedDate.getTime())) throw new Error(`Kolumna ${column.name} wymaga daty i czasu (np. 2024-05-01 12:30:00).`);
      return parsedDate.toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
    }
    case "year": {
      const parsed = Number.parseInt(text, 10);
      if (Number.isNaN(parsed) || parsed < 1000 || parsed > 9999) throw new Error(`Kolumna ${column.name} wymaga roku 4-cyfrowego.`);
      return parsed;
    }
    case "binary": {
      // Store binary as Base64 string. Accept either Base64 or hex prefixed with 0x.
      if (typeof value === "string" && /^0x[0-9a-f]*$/i.test(value)) {
        const buf = Buffer.from(value.slice(2), "hex");
        return buf.toString("base64");
      }
      return text;
    }
    case "json": {
      if (typeof value === "string") {
        try {
          JSON.parse(value);
          return value;
        } catch {
          throw new Error(`Kolumna ${column.name} wymaga poprawnego JSON.`);
        }
      }
      return JSON.stringify(value);
    }
    case "uuid": {
      const trimmed = text.trim().toLowerCase();
      const candidate = trimmed === "" || trimmed === "auto" ? randomUUID() : trimmed;
      if (!UUID_REGEX.test(candidate)) throw new Error(`Kolumna ${column.name} wymaga UUID.`);
      return candidate;
    }
    case "network": {
      const trimmed = text.trim();
      if (column.type === "MACADDR") {
        if (!MAC_REGEX.test(trimmed)) throw new Error(`Kolumna ${column.name} wymaga adresu MAC.`);
        return trimmed.toLowerCase();
      }
      if (!IPV4_REGEX.test(trimmed) && !IPV6_REGEX.test(trimmed)) {
        throw new Error(`Kolumna ${column.name} wymaga adresu IP.`);
      }
      return trimmed;
    }
    case "geometry": {
      const trimmed = text.trim();
      if (column.type === "POINT" && !POINT_REGEX.test(trimmed)) {
        throw new Error(`Kolumna ${column.name} wymaga punktu w formacie (x, y).`);
      }
      return trimmed;
    }
    case "enum": {
      const allowed = column.enumValues ?? [];
      const incoming = text;
      if (column.type === "SET") {
        const parts = incoming.split(",").map((part) => part.trim()).filter(Boolean);
        if (allowed.length > 0) {
          const invalid = parts.find((part) => !allowed.includes(part));
          if (invalid) throw new Error(`Wartość ${invalid} nie jest dozwolona w SET ${column.name}.`);
        }
        return parts.join(",");
      }
      if (allowed.length > 0 && !allowed.includes(incoming)) {
        throw new Error(`Wartość ${incoming} nie jest dozwolona w ENUM ${column.name}.`);
      }
      return incoming;
    }
    default:
      return text;
  }
}

function coerceRow(columns: LocalDbColumn[], values: Record<string, unknown>, existingRows: LocalDbRow[] = []) {
  return Object.fromEntries(columns.map((column) => {
    const raw = values[column.name];
    const value = column.autoIncrement && (raw === undefined || raw === null || raw === "") ? existingRows.length + 1 : raw;
    return [column.name, coerceValue(column, value)];
  })) as LocalDbRow;
}

export async function insertRow(databaseName: string, tableName: string, values: Record<string, unknown>) {
  const database = await readDatabase(databaseName);
  const table = getTable(database, tableName);
  recordHistory(database);
  const row = coerceRow(table.columns, values, table.rows);
  table.rows.push(row);
  track(database, "INSERT_ROW", tableName);
  await saveDatabase(database);
  return row;
}

export async function updateRow(databaseName: string, tableName: string, rowIndex: number, values: Record<string, unknown>) {
  const database = await readDatabase(databaseName);
  const table = getTable(database, tableName);
  if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= table.rows.length) throw new Error("Nieprawidłowy indeks wiersza.");
  recordHistory(database);
  const row = coerceRow(table.columns, { ...table.rows[rowIndex], ...values }, table.rows);
  table.rows[rowIndex] = row;
  track(database, "UPDATE_ROW", `${tableName}#${rowIndex}`);
  await saveDatabase(database);
  return row;
}

export async function deleteRow(databaseName: string, tableName: string, rowIndex: number) {
  const database = await readDatabase(databaseName);
  const table = getTable(database, tableName);
  if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= table.rows.length) throw new Error("Nieprawidłowy indeks wiersza.");
  recordHistory(database);
  const [row] = table.rows.splice(rowIndex, 1);
  addRecycleBinItem(database, { type: "row", tableName, rowData: row });
  track(database, "DELETE_ROW", `${tableName}#${rowIndex}`);
  await saveDatabase(database);
  return row;
}

export async function duplicateRow(databaseName: string, tableName: string, rowIndex: number) {
  const database = await readDatabase(databaseName);
  const table = getTable(database, tableName);
  if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= table.rows.length) throw new Error("Nieprawidłowy indeks wiersza.");
  recordHistory(database);
  const source = table.rows[rowIndex];
  const values = Object.fromEntries(table.columns.map((column) => [column.name, column.autoIncrement ? undefined : source[column.name]]));
  const row = coerceRow(table.columns, values, table.rows);
  table.rows.push(row);
  track(database, "DUPLICATE_ROW", `${tableName}#${rowIndex}`);
  await saveDatabase(database);
  return row;
}

export async function bulkDeleteRows(databaseName: string, tableName: string, rowIndexes: number[]) {
  const database = await readDatabase(databaseName);
  const table = getTable(database, tableName);
  const unique = [...new Set(rowIndexes)].sort((a, b) => b - a);
  recordHistory(database);
  for (const index of unique) {
    if (!Number.isInteger(index) || index < 0 || index >= table.rows.length) throw new Error("Nieprawidłowy indeks wiersza.");
    const [row] = table.rows.splice(index, 1);
    addRecycleBinItem(database, { type: "row", tableName, rowData: row });
  }
  track(database, "BULK_DELETE_ROWS", `${tableName}:${unique.length}`);
  await saveDatabase(database);
  return { deleted: unique.length };
}

export async function bulkSetColumn(databaseName: string, tableName: string, rowIndexes: number[], columnName: string, value: unknown) {
  const database = await readDatabase(databaseName);
  const table = getTable(database, tableName);
  const column = table.columns.find((item) => item.name === columnName);
  if (!column) throw new Error("Kolumna nie istnieje.");
  recordHistory(database);
  for (const index of [...new Set(rowIndexes)]) {
    if (!Number.isInteger(index) || index < 0 || index >= table.rows.length) throw new Error("Nieprawidłowy indeks wiersza.");
    table.rows[index] = coerceRow(table.columns, { ...table.rows[index], [columnName]: value }, table.rows);
  }
  track(database, "BULK_UPDATE_COLUMN", `${tableName}.${columnName}`);
  await saveDatabase(database);
  return { updated: rowIndexes.length };
}

export async function duplicateTable(databaseName: string, tableName: string, newName: string, withData: boolean) {
  assertName(newName, "Nazwa tabeli");
  const database = await readDatabase(databaseName);
  const table = getTable(database, tableName);
  if (database.tables.some((item) => item.name.toLowerCase() === newName.toLowerCase())) throw new Error("Tabela o tej nazwie już istnieje.");
  recordHistory(database);
  const copy: LocalDbTable = { ...structuredClone(table), name: newName, rows: withData ? structuredClone(table.rows) : [], createdAt: new Date().toISOString() };
  database.tables.push(copy);
  track(database, withData ? "DUPLICATE_TABLE_WITH_DATA" : "DUPLICATE_TABLE_STRUCTURE", `${tableName}->${newName}`);
  await saveDatabase(database);
  return copy;
}

function unquoteName(value: string) {
  return value.trim().replace(/^[`'"]|[`'"]$/g, "");
}

function splitCsv(input: string) {
  const result: string[] = [];
  let current = "";
  let quote = "";
  let depth = 0;
  let escaped = false;
  for (const char of input) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === "\\" && quote) {
      current += char;
      escaped = true;
      continue;
    }
    if (["'", '"', "`"].includes(char)) quote = quote === char ? "" : quote || char;
    if (!quote && char === "(") depth += 1;
    if (!quote && char === ")") depth = Math.max(0, depth - 1);
    if (char === "," && !quote && depth === 0) { result.push(current.trim()); current = ""; } else current += char;
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function splitSqlStatements(sql: string) {
  const cleaned = sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const statements: string[] = [];
  let current = "";
  let quote = "";
  let escaped = false;
  for (const char of cleaned) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === "\\" && quote) {
      current += char;
      escaped = true;
      continue;
    }
    if (["'", '"', "`"].includes(char)) quote = quote === char ? "" : quote || char;
    if (char === ";" && !quote) {
      if (current.trim()) statements.push(current.trim());
      current = "";
    } else current += char;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

function parseLiteral(value: string): LocalDbValue {
  const trimmed = value.trim();
  if (/^null$/i.test(trimmed)) return null;
  if (/^true$/i.test(trimmed)) return true;
  if (/^false$/i.test(trimmed)) return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function sqlLiteral(value: LocalDbValue) {
  if (value === null) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function findUniqueRowIndex(table: LocalDbTable, row: LocalDbRow) {
  const uniqueIndexes = table.indexes.filter((index) => index.unique || index.name === "PRIMARY");
  for (const index of uniqueIndexes) {
    const hasAllValues = index.columns.every((column) => row[column] !== null && row[column] !== undefined);
    if (!hasAllValues) continue;
    const found = table.rows.findIndex((existing) => index.columns.every((column) => existing[column] === row[column]));
    if (found >= 0) return found;
  }
  return -1;
}

function parseInsertTuples(input: string) {
  const tuples: string[] = [];
  let current = "";
  let quote = "";
  let depth = 0;
  let escaped = false;
  for (const char of input) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === "\\" && quote) {
      current += char;
      escaped = true;
      continue;
    }
    if (["'", '"', "`"].includes(char)) quote = quote === char ? "" : quote || char;
    if (!quote && char === "(") {
      if (depth > 0) current += char;
      depth += 1;
      continue;
    }
    if (!quote && char === ")") {
      depth -= 1;
      if (depth === 0) {
        tuples.push(current.trim());
        current = "";
        continue;
      }
    }
    if (depth > 0) current += char;
  }
  return tuples;
}

function matchesWhere(row: LocalDbRow, where?: string) {
  if (!where) return true;
  const match = where.match(/^([`\w]+)\s*(>=|<=|!=|<>|=|>|<|LIKE)\s*(.+)$/i);
  if (!match) throw new Error("Obsługiwany WHERE: kolumna = wartość, !=, <>, >, <, >=, <=, LIKE.");
  const left = row[unquoteName(match[1])];
  const operator = match[2].toUpperCase();
  const right = parseLiteral(match[3]);
  if (operator === "=") return left === right;
  if (operator === "!=" || operator === "<>") return left !== right;
  if (operator === "LIKE") return String(left).toLowerCase().includes(String(right).replace(/%/g, "").toLowerCase());
  if (typeof left !== "number" || typeof right !== "number") return false;
  if (operator === ">") return left > right;
  if (operator === "<") return left < right;
  if (operator === ">=") return left >= right;
  if (operator === "<=") return left <= right;
  return false;
}

function columnSql(column: LocalDbColumn) {
  const meta = getColumnTypeMeta(column.type);
  let typePart: string = column.type;
  if (meta.hasPrecision && column.precision !== undefined) {
    typePart += column.scale !== undefined ? `(${column.precision},${column.scale})` : `(${column.precision})`;
  } else if (meta.hasLength && column.length !== undefined) {
    typePart += `(${column.length})`;
  } else if (meta.hasEnumValues && column.enumValues && column.enumValues.length > 0) {
    typePart += `(${column.enumValues.map((value) => `'${value.replaceAll("'", "''")}'`).join(",")})`;
  }
  const unsignedPart = column.unsigned && meta.canBeUnsigned ? " UNSIGNED" : "";
  return `\`${column.name}\` ${typePart}${unsignedPart}${column.nullable ? "" : " NOT NULL"}${column.primaryKey ? " PRIMARY KEY" : ""}${column.autoIncrement ? " AUTO_INCREMENT" : ""}`;
}

export async function createSnapshot(databaseName: string) {
  const database = await readDatabase(databaseName);
  const dir = await ensureSnapshotDir(databaseName);
  const id = `snapshot_${new Date().toISOString().replace(/[:.]/g, "-")}`;
  await copyFile(dbPath(databaseName), path.join(dir, `${id}.json`));
  track(database, "CREATE_SNAPSHOT", id);
  await saveDatabase(database);
  return { id, createdAt: new Date().toISOString() };
}

/**
 * Best-effort auto-snapshot przed destrukcyjną operacją (DROP TABLE/DATABASE etc.).
 * Nie rzuca błędów żeby nie blokować akcji jeśli snapshot się nie powiedzie.
 */
export async function autoSnapshot(databaseName: string, reason: string): Promise<string | null> {
  try {
    const dir = await ensureSnapshotDir(databaseName);
    const id = `auto_${reason}_${new Date().toISOString().replace(/[:.]/g, "-")}`;
    await copyFile(dbPath(databaseName), path.join(dir, `${id}.json`));
    return id;
  } catch {
    return null;
  }
}

export async function listSnapshots(databaseName: string) {
  await readDatabase(databaseName);
  const dir = await ensureSnapshotDir(databaseName);
  const files = await readdir(dir);
  return Promise.all(files.filter((file) => file.endsWith(".json")).sort().reverse().map(async (file) => {
    const info = await stat(path.join(dir, file));
    return { id: file.replace(/\.json$/, ""), createdAt: info.mtime.toISOString(), size: info.size };
  }));
}

export async function clearTracking(databaseName: string): Promise<LocalDatabase> {
  const database = await readDatabase(databaseName);
  database.tracking = [];
  await saveDatabase(database);
  return database;
}

// ===== Schemas =====
export async function createSchema(databaseName: string, name: string, description?: string) {
  assertName(name, "Nazwa schematu");
  const database = await readDatabase(databaseName);
  database.schemas = database.schemas ?? [];
  if (database.schemas.some((schema) => schema.name === name))
    throw new Error("Schemat o tej nazwie już istnieje.");
  database.schemas.push({ name, description, createdAt: new Date().toISOString() });
  track(database, "CREATE SCHEMA", name);
  await saveDatabase(database);
  return database;
}

export async function dropSchema(databaseName: string, name: string) {
  if (name === "public") throw new Error("Nie można usunąć schematu 'public'.");
  const database = await readDatabase(databaseName);
  database.schemas = (database.schemas ?? []).filter((schema) => schema.name !== name);
  // przenieś obiekty ze schematu do public
  for (const table of database.tables)
    if (table.schema === name) table.schema = "public";
  for (const view of database.views ?? [])
    if (view.schema === name) view.schema = "public";
  for (const mv of database.materializedViews ?? [])
    if (mv.schema === name) mv.schema = "public";
  for (const seq of database.sequences ?? [])
    if (seq.schema === name) seq.schema = "public";
  track(database, "DROP SCHEMA", name);
  await saveDatabase(database);
  return database;
}

// ===== Views =====
export async function saveView(databaseName: string, view: { name: string; sql: string; schema?: string }) {
  assertName(view.name, "Nazwa widoku");
  if (!view.sql || !view.sql.trim()) throw new Error("SQL widoku nie może być pusty.");
  const database = await readDatabase(databaseName);
  database.views = database.views ?? [];
  const schema = view.schema || "public";
  const index = database.views.findIndex((v) => v.name === view.name && (v.schema ?? "public") === schema);
  const entry: LocalDbView = {
    name: view.name,
    schema,
    sql: view.sql,
    createdAt: index >= 0 ? database.views[index].createdAt : new Date().toISOString(),
  };
  if (index >= 0) database.views[index] = entry;
  else database.views.push(entry);
  track(database, index >= 0 ? "ALTER VIEW" : "CREATE VIEW", `${schema}.${view.name}`);
  await saveDatabase(database);
  return database;
}

export async function dropView(databaseName: string, name: string, schema = "public") {
  const database = await readDatabase(databaseName);
  database.views = (database.views ?? []).filter(
    (v) => !(v.name === name && (v.schema ?? "public") === schema),
  );
  track(database, "DROP VIEW", `${schema}.${name}`);
  await saveDatabase(database);
  return database;
}

// ===== Materialized Views =====
export async function saveMaterializedView(databaseName: string, view: { name: string; sql: string; schema?: string }) {
  assertName(view.name, "Nazwa zmaterializowanego widoku");
  if (!view.sql || !view.sql.trim()) throw new Error("SQL widoku nie może być pusty.");
  const database = await readDatabase(databaseName);
  database.materializedViews = database.materializedViews ?? [];
  const schema = view.schema || "public";
  const index = database.materializedViews.findIndex((v) => v.name === view.name && (v.schema ?? "public") === schema);
  const previous = index >= 0 ? database.materializedViews[index] : null;
  const entry: LocalDbMaterializedView = {
    name: view.name,
    schema,
    sql: view.sql,
    columns: previous?.columns ?? [],
    rows: previous?.rows ?? [],
    refreshedAt: previous?.refreshedAt,
    createdAt: previous?.createdAt ?? new Date().toISOString(),
  };
  if (index >= 0) database.materializedViews[index] = entry;
  else database.materializedViews.push(entry);
  track(database, index >= 0 ? "ALTER MATERIALIZED VIEW" : "CREATE MATERIALIZED VIEW", `${schema}.${view.name}`);
  await saveDatabase(database);
  return database;
}

export async function refreshMaterializedView(databaseName: string, name: string, schema = "public") {
  const database = await readDatabase(databaseName);
  const mv = (database.materializedViews ?? []).find(
    (v) => v.name === name && (v.schema ?? "public") === schema,
  );
  if (!mv) throw new Error("Nie znaleziono zmaterializowanego widoku.");
  const results = await executeSql(databaseName, mv.sql);
  const first = results.find((result) => result.columns.length > 0) ?? results[0];
  mv.columns = first?.columns ?? [];
  mv.rows = first?.rows ?? [];
  mv.refreshedAt = new Date().toISOString();
  track(database, "REFRESH MATERIALIZED VIEW", `${schema}.${name}`);
  await saveDatabase(database);
  return database;
}

export async function dropMaterializedView(databaseName: string, name: string, schema = "public") {
  const database = await readDatabase(databaseName);
  database.materializedViews = (database.materializedViews ?? []).filter(
    (v) => !(v.name === name && (v.schema ?? "public") === schema),
  );
  track(database, "DROP MATERIALIZED VIEW", `${schema}.${name}`);
  await saveDatabase(database);
  return database;
}

// ===== Sequences =====
export async function saveSequence(databaseName: string, sequence: { name: string; schema?: string; start?: number; increment?: number; minValue?: number; maxValue?: number; cycle?: boolean }) {
  assertName(sequence.name, "Nazwa sekwencji");
  const database = await readDatabase(databaseName);
  database.sequences = database.sequences ?? [];
  const schema = sequence.schema || "public";
  const index = database.sequences.findIndex((s) => s.name === sequence.name && (s.schema ?? "public") === schema);
  const previous = index >= 0 ? database.sequences[index] : null;
  const start = Number(sequence.start ?? previous?.start ?? 1);
  const increment = Number(sequence.increment ?? previous?.increment ?? 1);
  if (!Number.isFinite(start) || !Number.isFinite(increment) || increment === 0)
    throw new Error("Niepoprawne start/increment.");
  const entry: LocalDbSequence = {
    name: sequence.name,
    schema,
    start,
    increment,
    minValue: sequence.minValue ?? previous?.minValue,
    maxValue: sequence.maxValue ?? previous?.maxValue,
    current: previous?.current ?? start - increment,
    cycle: sequence.cycle ?? previous?.cycle ?? false,
    createdAt: previous?.createdAt ?? new Date().toISOString(),
  };
  if (index >= 0) database.sequences[index] = entry;
  else database.sequences.push(entry);
  track(database, index >= 0 ? "ALTER SEQUENCE" : "CREATE SEQUENCE", `${schema}.${sequence.name}`);
  await saveDatabase(database);
  return database;
}

export async function nextValSequence(databaseName: string, name: string, schema = "public") {
  const database = await readDatabase(databaseName);
  const seq = (database.sequences ?? []).find(
    (s) => s.name === name && (s.schema ?? "public") === schema,
  );
  if (!seq) throw new Error("Nie znaleziono sekwencji.");
  let next = seq.current + seq.increment;
  if (seq.maxValue !== undefined && next > seq.maxValue) {
    if (seq.cycle) next = seq.minValue ?? seq.start;
    else throw new Error("Sekwencja przekroczyła maksimum.");
  }
  if (seq.minValue !== undefined && next < seq.minValue) {
    if (seq.cycle) next = seq.maxValue ?? seq.start;
    else throw new Error("Sekwencja przekroczyła minimum.");
  }
  seq.current = next;
  track(database, "nextval", `${schema}.${name}=${next}`);
  await saveDatabase(database);
  return { database, value: next };
}

export async function resetSequence(databaseName: string, name: string, schema = "public", value?: number) {
  const database = await readDatabase(databaseName);
  const seq = (database.sequences ?? []).find(
    (s) => s.name === name && (s.schema ?? "public") === schema,
  );
  if (!seq) throw new Error("Nie znaleziono sekwencji.");
  seq.current = value ?? seq.start - seq.increment;
  track(database, "RESET SEQUENCE", `${schema}.${name}`);
  await saveDatabase(database);
  return database;
}

export async function dropSequence(databaseName: string, name: string, schema = "public") {
  const database = await readDatabase(databaseName);
  database.sequences = (database.sequences ?? []).filter(
    (s) => !(s.name === name && (s.schema ?? "public") === schema),
  );
  track(database, "DROP SEQUENCE", `${schema}.${name}`);
  await saveDatabase(database);
  return database;
}

// ===== Domains =====
export async function saveDomain(databaseName: string, domain: { name: string; schema?: string; baseType: LocalDbColumnType; nullable?: boolean; defaultValue?: LocalDbValue; check?: string; description?: string }) {
  assertName(domain.name, "Nazwa domeny");
  if (!TYPES.has(normalizeType(domain.baseType))) throw new Error("Niepoprawny typ bazowy.");
  const database = await readDatabase(databaseName);
  database.domains = database.domains ?? [];
  const schema = domain.schema || "public";
  const index = database.domains.findIndex((d) => d.name === domain.name && (d.schema ?? "public") === schema);
  const previous = index >= 0 ? database.domains[index] : null;
  const entry: LocalDbDomain = {
    name: domain.name,
    schema,
    baseType: normalizeType(domain.baseType),
    nullable: domain.nullable ?? true,
    defaultValue: domain.defaultValue ?? null,
    check: domain.check?.trim() || undefined,
    description: domain.description?.trim() || undefined,
    createdAt: previous?.createdAt ?? new Date().toISOString(),
  };
  if (index >= 0) database.domains[index] = entry;
  else database.domains.push(entry);
  track(database, index >= 0 ? "ALTER DOMAIN" : "CREATE DOMAIN", `${schema}.${domain.name}`);
  await saveDatabase(database);
  return database;
}

export async function dropDomain(databaseName: string, name: string, schema = "public") {
  const database = await readDatabase(databaseName);
  database.domains = (database.domains ?? []).filter(
    (d) => !(d.name === name && (d.schema ?? "public") === schema),
  );
  track(database, "DROP DOMAIN", `${schema}.${name}`);
  await saveDatabase(database);
  return database;
}

// ===== Composite types =====
export async function saveCompositeType(databaseName: string, type: { name: string; schema?: string; attributes: { name: string; type: LocalDbColumnType }[]; description?: string }) {
  assertName(type.name, "Nazwa typu");
  if (!Array.isArray(type.attributes) || type.attributes.length === 0)
    throw new Error("Typ musi mieć co najmniej 1 atrybut.");
  for (const attr of type.attributes) {
    if (!attr.name || typeof attr.name !== "string")
      throw new Error("Każdy atrybut wymaga nazwy.");
    if (!TYPES.has(normalizeType(attr.type)))
      throw new Error(`Niepoprawny typ atrybutu: ${attr.type}.`);
  }
  const database = await readDatabase(databaseName);
  database.compositeTypes = database.compositeTypes ?? [];
  const schema = type.schema || "public";
  const index = database.compositeTypes.findIndex(
    (t) => t.name === type.name && (t.schema ?? "public") === schema,
  );
  const previous = index >= 0 ? database.compositeTypes[index] : null;
  const entry: LocalDbCompositeType = {
    name: type.name,
    schema,
    attributes: type.attributes.map((attr) => ({
      name: attr.name,
      type: normalizeType(attr.type),
    })),
    description: type.description?.trim() || undefined,
    createdAt: previous?.createdAt ?? new Date().toISOString(),
  };
  if (index >= 0) database.compositeTypes[index] = entry;
  else database.compositeTypes.push(entry);
  track(database, index >= 0 ? "ALTER TYPE" : "CREATE TYPE", `${schema}.${type.name}`);
  await saveDatabase(database);
  return database;
}

export async function dropCompositeType(databaseName: string, name: string, schema = "public") {
  const database = await readDatabase(databaseName);
  database.compositeTypes = (database.compositeTypes ?? []).filter(
    (t) => !(t.name === name && (t.schema ?? "public") === schema),
  );
  track(database, "DROP TYPE", `${schema}.${name}`);
  await saveDatabase(database);
  return database;
}

// ===== Rules =====
export async function saveRule(databaseName: string, rule: { name: string; schema?: string; tableName: string; event: LocalDbRule["event"]; condition?: string; body: string; enabled?: boolean }) {
  assertName(rule.name, "Nazwa reguły");
  if (!rule.tableName) throw new Error("Reguła musi być powiązana z tabelą.");
  if (!rule.body?.trim()) throw new Error("Treść reguły nie może być pusta.");
  const database = await readDatabase(databaseName);
  database.rules = database.rules ?? [];
  const schema = rule.schema || "public";
  const index = database.rules.findIndex(
    (r) => r.name === rule.name && (r.schema ?? "public") === schema,
  );
  const previous = index >= 0 ? database.rules[index] : null;
  const entry: LocalDbRule = {
    name: rule.name,
    schema,
    tableName: rule.tableName,
    event: rule.event,
    condition: rule.condition?.trim() || undefined,
    body: rule.body,
    enabled: rule.enabled ?? true,
    createdAt: previous?.createdAt ?? new Date().toISOString(),
  };
  if (index >= 0) database.rules[index] = entry;
  else database.rules.push(entry);
  track(database, index >= 0 ? "ALTER RULE" : "CREATE RULE", `${schema}.${rule.name}`);
  await saveDatabase(database);
  return database;
}

export async function dropRule(databaseName: string, name: string, schema = "public") {
  const database = await readDatabase(databaseName);
  database.rules = (database.rules ?? []).filter(
    (r) => !(r.name === name && (r.schema ?? "public") === schema),
  );
  track(database, "DROP RULE", `${schema}.${name}`);
  await saveDatabase(database);
  return database;
}

// ===== Check constraints (table-level) =====
export async function saveTableCheck(databaseName: string, tableName: string, check: { name: string; expression: string }, oldName?: string) {
  assertName(check.name, "Nazwa CHECK");
  if (!check.expression?.trim()) throw new Error("Wyrażenie CHECK nie może być puste.");
  const database = await readDatabase(databaseName);
  const table = database.tables.find((t) => t.name === tableName);
  if (!table) throw new Error("Nie znaleziono tabeli.");
  table.checks = table.checks ?? [];
  const removeName = oldName ?? check.name;
  table.checks = table.checks.filter((c) => c.name !== removeName);
  table.checks.push({
    name: check.name,
    expression: check.expression,
    createdAt: new Date().toISOString(),
  });
  track(database, "ADD CHECK", `${tableName}.${check.name}`);
  await saveDatabase(database);
  return database;
}

export async function dropTableCheck(databaseName: string, tableName: string, name: string) {
  const database = await readDatabase(databaseName);
  const table = database.tables.find((t) => t.name === tableName);
  if (!table) throw new Error("Nie znaleziono tabeli.");
  table.checks = (table.checks ?? []).filter((c) => c.name !== name);
  track(database, "DROP CHECK", `${tableName}.${name}`);
  await saveDatabase(database);
  return database;
}

// ===== Properties / DDL preview =====
function quoteValue(value: LocalDbValue): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function columnDdl(column: LocalDbColumn): string {
  const parts: string[] = [`\`${column.name}\``];
  let typeStr = column.type as string;
  if (column.length !== undefined) typeStr += `(${column.length})`;
  else if (column.precision !== undefined)
    typeStr += `(${column.precision}${column.scale !== undefined ? `,${column.scale}` : ""})`;
  if ((column.type === "ENUM" || column.type === "SET") && column.enumValues?.length)
    typeStr += `(${column.enumValues.map((v) => `'${v.replace(/'/g, "''")}'`).join(", ")})`;
  parts.push(typeStr);
  if (column.unsigned) parts.push("UNSIGNED");
  if (!column.nullable) parts.push("NOT NULL");
  else parts.push("NULL");
  if (column.defaultValue !== undefined && column.defaultValue !== null)
    parts.push(`DEFAULT ${quoteValue(column.defaultValue)}`);
  if (column.autoIncrement) parts.push("AUTO_INCREMENT");
  return parts.join(" ");
}

export function generateTableDdl(table: LocalDbTable): string {
  const lines: string[] = [];
  lines.push(`CREATE TABLE \`${table.schema ?? "public"}\`.\`${table.name}\` (`);
  const columnLines = table.columns.map((column) => `  ${columnDdl(column)}`);
  const pks = table.columns.filter((column) => column.primaryKey).map((column) => `\`${column.name}\``);
  if (pks.length > 0) columnLines.push(`  PRIMARY KEY (${pks.join(", ")})`);
  for (const check of table.checks ?? [])
    columnLines.push(`  CONSTRAINT \`${check.name}\` CHECK (${check.expression})`);
  lines.push(columnLines.join(",\n"));
  lines.push(");");
  for (const index of table.indexes) {
    lines.push(
      `CREATE ${index.unique ? "UNIQUE " : ""}INDEX \`${index.name}\` ON \`${table.name}\` (${index.columns.map((c) => `\`${c}\``).join(", ")});`,
    );
  }
  return lines.join("\n");
}

export function generateViewDdl(view: LocalDbView): string {
  return `CREATE OR REPLACE VIEW \`${view.schema ?? "public"}\`.\`${view.name}\` AS\n${view.sql.trim()};`;
}

export function generateMaterializedViewDdl(view: LocalDbMaterializedView): string {
  return `CREATE MATERIALIZED VIEW \`${view.schema ?? "public"}\`.\`${view.name}\` AS\n${view.sql.trim()};`;
}

export function generateSequenceDdl(seq: LocalDbSequence): string {
  const lines = [
    `CREATE SEQUENCE \`${seq.schema ?? "public"}\`.\`${seq.name}\``,
    `  START WITH ${seq.start}`,
    `  INCREMENT BY ${seq.increment}`,
  ];
  if (seq.minValue !== undefined) lines.push(`  MINVALUE ${seq.minValue}`);
  if (seq.maxValue !== undefined) lines.push(`  MAXVALUE ${seq.maxValue}`);
  if (seq.cycle) lines.push("  CYCLE");
  return lines.join("\n") + ";";
}

export function generateDomainDdl(domain: LocalDbDomain): string {
  const parts: string[] = [
    `CREATE DOMAIN \`${domain.schema ?? "public"}\`.\`${domain.name}\` AS ${domain.baseType}`,
  ];
  if (!domain.nullable) parts.push("NOT NULL");
  if (domain.defaultValue !== undefined && domain.defaultValue !== null)
    parts.push(`DEFAULT ${quoteValue(domain.defaultValue)}`);
  if (domain.check) parts.push(`CHECK (${domain.check})`);
  return parts.join(" ") + ";";
}

export function generateCompositeTypeDdl(type: LocalDbCompositeType): string {
  const lines: string[] = [
    `CREATE TYPE \`${type.schema ?? "public"}\`.\`${type.name}\` AS (`,
  ];
  lines.push(
    type.attributes
      .map((attr) => `  \`${attr.name}\` ${attr.type}`)
      .join(",\n"),
  );
  lines.push(");");
  return lines.join("\n");
}

export function generateRuleDdl(rule: LocalDbRule): string {
  return `CREATE RULE \`${rule.name}\` AS ON ${rule.event} TO \`${rule.tableName}\`${rule.condition ? `\n  WHERE ${rule.condition}` : ""}\n  DO ${rule.body};`;
}

export function generateRoutineDdl(routine: LocalDbRoutine): string {
  return `CREATE ${routine.kind} \`${routine.name}\`()${routine.returns ? ` RETURNS ${routine.returns}` : ""}\nBEGIN\n${routine.body}\nEND;`;
}

export function generateTriggerDdl(trigger: LocalDbTrigger): string {
  return `CREATE TRIGGER \`${trigger.name}\` ${trigger.timing} ${trigger.event} ON \`${trigger.tableName}\`\nFOR EACH ROW\nBEGIN\n${trigger.body}\nEND;`;
}

export function generateEventDdl(event: LocalDbEvent): string {
  return `CREATE EVENT \`${event.name}\`\n  ON SCHEDULE ${event.schedule}\n  ${event.enabled ? "ENABLE" : "DISABLE"}\n  DO BEGIN\n    ${event.body}\n  END;`;
}

// ===== Dependencies =====
type DependencyEntry = { type: string; name: string; schema?: string; reason: string };

export function findDependencies(database: LocalDatabase, target: { type: string; name: string; schema?: string }): { dependents: DependencyEntry[]; dependencies: DependencyEntry[] } {
  const schema = target.schema ?? "public";
  const ref = target.name.toLowerCase();
  const dependents: DependencyEntry[] = [];
  const dependencies: DependencyEntry[] = [];

  function sqlReferences(sql: string, name: string): boolean {
    return new RegExp(`\\b${name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i").test(sql);
  }

  if (target.type === "table") {
    for (const view of database.views ?? [])
      if (sqlReferences(view.sql, target.name))
        dependents.push({ type: "view", name: view.name, schema: view.schema, reason: `referencja w SELECT widoku` });
    for (const view of database.materializedViews ?? [])
      if (sqlReferences(view.sql, target.name))
        dependents.push({ type: "mview", name: view.name, schema: view.schema, reason: `referencja w SELECT mat. widoku` });
    for (const trigger of database.triggers ?? [])
      if (trigger.tableName === target.name)
        dependents.push({ type: "trigger", name: trigger.name, reason: `trigger ${trigger.timing} ${trigger.event}` });
    for (const rule of database.rules ?? [])
      if (rule.tableName === target.name)
        dependents.push({ type: "rule", name: rule.name, schema: rule.schema, reason: `reguła ${rule.event}` });
    for (const routine of database.routines ?? [])
      if (sqlReferences(routine.body, target.name))
        dependents.push({ type: "routine", name: routine.name, reason: `referencja w ciele` });
    for (const event of database.events ?? [])
      if (sqlReferences(event.body, target.name))
        dependents.push({ type: "event", name: event.name, reason: `referencja w ciele zdarzenia` });
    const table = database.tables.find((t) => t.name === target.name && (t.schema ?? "public") === schema);
    if (table) {
      for (const column of table.columns) {
        const domains = (database.domains ?? []).filter(
          (d) => d.name.toLowerCase() === (column.type as string).toLowerCase(),
        );
        for (const domain of domains)
          dependencies.push({ type: "domain", name: domain.name, schema: domain.schema, reason: `kolumna ${column.name} używa typu` });
        const types = (database.compositeTypes ?? []).filter(
          (t) => t.name.toLowerCase() === (column.type as string).toLowerCase(),
        );
        for (const t of types)
          dependencies.push({ type: "type", name: t.name, schema: t.schema, reason: `kolumna ${column.name} używa typu` });
      }
    }
  }

  if (target.type === "view" || target.type === "mview") {
    const view =
      target.type === "view"
        ? (database.views ?? []).find((v) => v.name === target.name && (v.schema ?? "public") === schema)
        : (database.materializedViews ?? []).find((v) => v.name === target.name && (v.schema ?? "public") === schema);
    if (view) {
      for (const table of database.tables)
        if (sqlReferences(view.sql, table.name))
          dependencies.push({ type: "table", name: table.name, schema: table.schema, reason: `użyte w SELECT` });
      for (const v of database.views ?? [])
        if (v.name !== target.name && sqlReferences(view.sql, v.name))
          dependencies.push({ type: "view", name: v.name, schema: v.schema, reason: `użyty widok` });
    }
  }

  if (target.type === "domain") {
    for (const table of database.tables)
      for (const column of table.columns)
        if ((column.type as string).toLowerCase() === ref)
          dependents.push({ type: "table", name: table.name, schema: table.schema, reason: `kolumna ${column.name}` });
  }

  if (target.type === "type") {
    for (const table of database.tables)
      for (const column of table.columns)
        if ((column.type as string).toLowerCase() === ref)
          dependents.push({ type: "table", name: table.name, schema: table.schema, reason: `kolumna ${column.name}` });
  }

  if (target.type === "sequence") {
    for (const table of database.tables)
      for (const column of table.columns)
        if (column.defaultValue && String(column.defaultValue).toLowerCase().includes(`nextval('${ref}'`))
          dependents.push({ type: "table", name: table.name, schema: table.schema, reason: `default ${column.name} = nextval(...)` });
  }

  return { dependents, dependencies };
}

export function tableStatistics(table: LocalDbTable) {
  const stats = table.columns.map((column) => {
    let nulls = 0;
    const distinct = new Set<string>();
    let min: number | string | null = null;
    let max: number | string | null = null;
    let totalLength = 0;
    let count = 0;
    for (const row of table.rows) {
      const value = row[column.name];
      if (value === null || value === undefined) {
        nulls += 1;
        continue;
      }
      count += 1;
      const key = typeof value === "string" ? value : JSON.stringify(value);
      distinct.add(key);
      if (typeof value === "string") totalLength += value.length;
      if (typeof value === "number") {
        if (min === null || value < (min as number)) min = value;
        if (max === null || value > (max as number)) max = value;
      } else if (typeof value === "string") {
        if (min === null || value < (min as string)) min = value;
        if (max === null || value > (max as string)) max = value;
      }
    }
    return {
      name: column.name,
      type: column.type,
      nullable: column.nullable,
      nulls,
      nullsPct: table.rows.length > 0 ? (nulls / table.rows.length) * 100 : 0,
      distinct: distinct.size,
      cardinalityPct: table.rows.length > 0 ? (distinct.size / table.rows.length) * 100 : 0,
      avgLength: count > 0 && totalLength > 0 ? totalLength / count : null,
      min,
      max,
    };
  });
  const sizeBytes = JSON.stringify(table.rows).length + JSON.stringify(table.columns).length;
  return {
    rows: table.rows.length,
    columns: table.columns.length,
    indexes: table.indexes.length,
    checks: (table.checks ?? []).length,
    sizeBytes,
    columns_stats: stats,
  };
}

export async function restoreSnapshot(databaseName: string, snapshotId: string) {
  assertName(databaseName, "Nazwa bazy");
  if (!/^snapshot_[\w.-]+$/.test(snapshotId)) throw new Error("Nieprawidłowy snapshot.");
  await copyFile(path.join(snapshotsDir(databaseName), `${snapshotId}.json`), dbPath(databaseName));
  const database = await readDatabase(databaseName);
  track(database, "RESTORE_SNAPSHOT", snapshotId);
  await saveDatabase(database);
  return database;
}

export async function deleteSnapshot(databaseName: string, snapshotId: string) {
  if (!/^snapshot_[\w.-]+$/.test(snapshotId)) throw new Error("Nieprawidłowy snapshot.");
  await rm(path.join(snapshotsDir(databaseName), `${snapshotId}.json`), { force: true });
  return { deleted: true };
}

export async function compareSnapshot(databaseName: string, snapshotId: string) {
  const current = await readDatabase(databaseName);
  const raw = await readFile(path.join(snapshotsDir(databaseName), `${snapshotId}.json`), "utf8");
  const snapshot = normalizeDatabase(JSON.parse(raw) as LegacyDatabase);
  const currentTables = new Map(current.tables.map((table) => [table.name, table]));
  const snapshotTables = new Map(snapshot.tables.map((table) => [table.name, table]));
  return {
    addedTables: current.tables.filter((table) => !snapshotTables.has(table.name)).map((table) => table.name),
    removedTables: snapshot.tables.filter((table) => !currentTables.has(table.name)).map((table) => table.name),
    changedTables: current.tables.filter((table) => {
      const old = snapshotTables.get(table.name);
      return old && JSON.stringify(old) !== JSON.stringify(table);
    }).map((table) => table.name),
  };
}

export async function exportJson(databaseName: string) {
  return readDatabase(databaseName);
}

export async function exportSql(databaseName: string, tableName?: string) {
  const database = await readDatabase(databaseName);
  const tables = tableName ? [getTable(database, tableName)] : database.tables;
  const lines = [`-- LocalDB SQL dump`, `CREATE DATABASE \`${database.name}\`;`, `USE \`${database.name}\`;`, ""];
  for (const table of tables) {
    lines.push(`DROP TABLE \`${table.name}\`;`);
    lines.push(`CREATE TABLE \`${table.name}\` (${table.columns.map(columnSql).join(", ")});`);
    for (const row of table.rows) {
      const columns = table.columns.map((column) => `\`${column.name}\``).join(", ");
      const values = table.columns.map((column) => sqlLiteral(row[column.name])).join(", ");
      lines.push(`INSERT INTO \`${table.name}\` (${columns}) VALUES (${values});`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export async function importSql(databaseName: string, sql: string) {
  if (sql.length > MAX_IMPORT_BYTES) throw new Error("Plik SQL jest za duży dla obecnego importera (limit 2MB).");
  return executeSql(databaseName, sql);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
}

export async function importCsv(databaseName: string, tableName: string, csvString: string, mode: "replace" | "append" = "append") {
  if (csvString.length > MAX_IMPORT_BYTES) throw new Error("CSV jest za duży (limit 2MB).");
  assertName(tableName, "Nazwa tabeli");
  return withDbLock(databaseName, async () => {
    const database = await readDatabase(databaseName);
    const lines = csvString.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) throw new Error("CSV musi zawierać nagłówek i co najmniej jeden wiersz.");
    const headers = parseCsvLine(lines[0]).map((h) => h.trim()).filter(Boolean);
    if (headers.length === 0) throw new Error("CSV nie ma nagłówków.");
    let table = database.tables.find((item) => item.name === tableName);
    if (!table) {
      table = {
        name: tableName,
        schema: "public",
        columns: headers.map((name) => ({ name, type: "TEXT" as const, nullable: true })),
        rows: [],
        indexes: [],
        checks: [],
        createdAt: new Date().toISOString(),
      };
      database.tables.push(table);
    }
    if (mode === "replace") table.rows = [];
    const importedRows: LocalDbRow[] = [];
    for (const line of lines.slice(1)) {
      const values = parseCsvLine(line);
      const row: LocalDbRow = {};
      headers.forEach((header, index) => {
        const value = values[index] ?? "";
        row[header] = value === "" ? null : value;
      });
      table.rows.push(coerceRow(table.columns, row));
      importedRows.push(row);
    }
    track(database, "IMPORT_CSV", `${tableName}: ${importedRows.length} rows`);
    await saveDatabase(database);
    await appendAuditEntry({ action: "IMPORT_CSV", database: databaseName, detail: `${tableName}: ${importedRows.length} rows` });
    return { database, importedRows: importedRows.length };
  });
}

export async function tableOperation(databaseName: string, tableName: string, operation: "truncate" | "drop" | "rename", newName?: string) {
  return withDbLock(databaseName, async () => {
    if (operation === "drop" || operation === "truncate") {
      await autoSnapshot(databaseName, `before_${operation}_${tableName}`);
    }
    const database = await readDatabase(databaseName);
    const table = getTable(database, tableName);
    recordHistory(database);
    if (operation === "truncate") {
      const count = table.rows.length;
      for (const row of table.rows) addRecycleBinItem(database, { type: "row", tableName, rowData: row });
      table.rows = [];
      track(database, "TRUNCATE_TABLE", tableName);
      await saveDatabase(database);
      await appendAuditEntry({ action: "TRUNCATE_TABLE", database: databaseName, detail: tableName });
      return { message: `Wyczyszczono i zarchiwizowano ${count} wierszy.` };
    }
    if (operation === "rename") {
      assertName(newName, "Nowa nazwa tabeli");
      if (table.name.toLowerCase() === newName.toLowerCase()) throw new Error("Nowa nazwa musi być inna.");
      if (database.tables.some((item) => item !== table && item.name.toLowerCase() === newName.toLowerCase())) throw new Error("Tabela o tej nazwie już istnieje.");
      table.name = newName;
      track(database, "RENAME_TABLE", `${tableName} -> ${newName}`);
      await saveDatabase(database);
      await appendAuditEntry({ action: "RENAME_TABLE", database: databaseName, detail: `${tableName} -> ${newName}` });
      return { message: `Zmieniono nazwę na ${newName}.` };
    }
    database.tables = database.tables.filter((item) => item.name !== table.name);
    addRecycleBinItem(database, { type: "table", tableName: table.name, tableData: table });
    track(database, "DROP_TABLE", tableName);
    await saveDatabase(database);
    await appendAuditEntry({ action: "DROP_TABLE", database: databaseName, detail: tableName });
    return { message: `Usunięto tabelę ${tableName}.` };
  });
}

export type ColumnAnalysis = {
  column: string;
  type: string;
  totalRows: number;
  nullCount: number;
  nullPercent: number;
  distinctCount: number;
  topValues: { value: string; count: number }[];
  numericStats?: { min: number; max: number; avg: number; sum: number };
  stringStats?: { minLength: number; maxLength: number; avgLength: number };
};

export async function analyzeTable(databaseName: string, tableName: string): Promise<{ table: string; rows: number; columns: ColumnAnalysis[] }> {
  const database = await readDatabase(databaseName);
  const table = getTable(database, tableName);
  const totalRows = table.rows.length;
  const columnsAnalysis: ColumnAnalysis[] = table.columns.map((column) => {
    const values = table.rows.map((row) => row[column.name]);
    const nullCount = values.filter((value) => value === null || value === undefined).length;
    const nonNull = values.filter((value): value is NonNullable<typeof value> => value !== null && value !== undefined);
    const counts = new Map<string, number>();
    for (const value of nonNull) {
      const key = String(value);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const topValues = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));
    const meta = getColumnTypeMeta(column.type);
    let numericStats: ColumnAnalysis["numericStats"];
    let stringStats: ColumnAnalysis["stringStats"];
    if (meta.isNumeric) {
      const numbers = nonNull
        .map((value) => Number(value))
        .filter((value) => !Number.isNaN(value));
      if (numbers.length > 0) {
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        const sum = numbers.reduce((acc, value) => acc + value, 0);
        numericStats = {
          min,
          max,
          sum,
          avg: sum / numbers.length,
        };
      }
    }
    if (meta.category === "string" || meta.category === "json" || meta.category === "xml") {
      const lengths = nonNull.map((value) => String(value).length);
      if (lengths.length > 0) {
        stringStats = {
          minLength: Math.min(...lengths),
          maxLength: Math.max(...lengths),
          avgLength: lengths.reduce((acc, value) => acc + value, 0) / lengths.length,
        };
      }
    }
    return {
      column: column.name,
      type: column.type,
      totalRows,
      nullCount,
      nullPercent: totalRows === 0 ? 0 : (nullCount / totalRows) * 100,
      distinctCount: counts.size,
      topValues,
      numericStats,
      stringStats,
    };
  });
  return { table: table.name, rows: totalRows, columns: columnsAnalysis };
}

export type IntegrityIssue = {
  type: "NOT_NULL" | "TYPE_MISMATCH" | "UNIQUE" | "ENUM" | "LENGTH" | "ORPHAN_COLUMN";
  table: string;
  column?: string;
  rowIndex?: number;
  detail: string;
};

export async function checkIntegrity(databaseName: string, tableName?: string): Promise<{ issues: IntegrityIssue[]; checked: number }> {
  const database = await readDatabase(databaseName);
  const issues: IntegrityIssue[] = [];
  const tablesToCheck = tableName ? [getTable(database, tableName)] : database.tables;
  let checked = 0;
  for (const table of tablesToCheck) {
    const columnNames = new Set(table.columns.map((column) => column.name));
    table.rows.forEach((row, rowIndex) => {
      checked += 1;
      for (const key of Object.keys(row)) {
        if (!columnNames.has(key)) {
          issues.push({ type: "ORPHAN_COLUMN", table: table.name, column: key, rowIndex, detail: `Wiersz ma kolumnę ${key} której nie ma w schemacie.` });
        }
      }
      for (const column of table.columns) {
        const value = row[column.name];
        if (!column.nullable && (value === null || value === undefined)) {
          issues.push({ type: "NOT_NULL", table: table.name, column: column.name, rowIndex, detail: "Kolumna NOT NULL ma wartość NULL." });
          continue;
        }
        if (value === null || value === undefined) continue;
        try {
          coerceValue(column, value);
        } catch (error) {
          issues.push({ type: "TYPE_MISMATCH", table: table.name, column: column.name, rowIndex, detail: error instanceof Error ? error.message : "Niepoprawny typ." });
        }
        if (column.length && typeof value === "string" && value.length > column.length) {
          issues.push({ type: "LENGTH", table: table.name, column: column.name, rowIndex, detail: `Wartość ma ${value.length} znaków, limit ${column.length}.` });
        }
        if ((column.type === "ENUM" || column.type === "SET") && column.enumValues && column.enumValues.length > 0) {
          const items = column.type === "SET" ? String(value).split(",").map((part) => part.trim()) : [String(value)];
          for (const item of items) {
            if (!column.enumValues.includes(item)) {
              issues.push({ type: "ENUM", table: table.name, column: column.name, rowIndex, detail: `Wartość "${item}" nie jest dozwolona w ${column.type}.` });
            }
          }
        }
      }
    });
    for (const index of table.indexes) {
      if (!index.unique && index.name !== "PRIMARY") continue;
      const seen = new Map<string, number>();
      table.rows.forEach((row, rowIndex) => {
        const key = index.columns.map((column) => String(row[column] ?? "\u0000")).join("\u0001");
        if (seen.has(key)) {
          issues.push({ type: "UNIQUE", table: table.name, column: index.columns.join(","), rowIndex, detail: `Indeks ${index.name} narusza unikalność. Duplikat w wierszu ${seen.get(key)! + 1}.` });
        } else {
          seen.set(key, rowIndex);
        }
      });
    }
  }
  return { issues, checked };
}

export async function rebuildIndexes(databaseName: string, tableName?: string) {
  const database = await readDatabase(databaseName);
  const tables = tableName ? [getTable(database, tableName)] : database.tables;
  recordHistory(database);
  let rebuilt = 0;
  for (const table of tables) {
    const seenNames = new Set<string>();
    table.indexes = table.indexes.filter((index) => {
      const valid = index.columns.every((column) => table.columns.some((existing) => existing.name === column));
      if (!valid) return false;
      if (seenNames.has(index.name)) return false;
      seenNames.add(index.name);
      return true;
    });
    rebuilt += table.indexes.length;
    for (const column of table.columns) {
      column.indexed = table.indexes.some((index) => index.columns.includes(column.name));
    }
  }
  track(database, "REBUILD_INDEXES", tableName ?? "*");
  await saveDatabase(database);
  return { message: `Przebudowano indeksy (${rebuilt}).`, rebuilt };
}

export async function upsertMetadata(databaseName: string, type: "routine" | "event" | "trigger", payload: Record<string, unknown>) {
  const database = await readDatabase(databaseName);
  const name = String(payload.name ?? "");
  assertName(name, "Nazwa obiektu");
  const createdAt = new Date().toISOString();
  recordHistory(database);
  if (type === "routine") {
    const item: LocalDbRoutine = { name, kind: (payload.kind === "FUNCTION" ? "FUNCTION" : "PROCEDURE") as RoutineKind, body: String(payload.body ?? ""), returns: String(payload.returns ?? ""), createdAt };
    database.routines = database.routines.filter((entry) => entry.name !== name || entry.kind !== item.kind).concat(item);
    track(database, `UPSERT_${item.kind}`, name);
  } else if (type === "event") {
    const item: LocalDbEvent = { name, schedule: String(payload.schedule ?? "EVERY 1 DAY"), body: String(payload.body ?? ""), enabled: Boolean(payload.enabled ?? true), createdAt };
    database.events = database.events.filter((entry) => entry.name !== name).concat(item);
    track(database, "UPSERT_EVENT", name);
  } else {
    const item: LocalDbTrigger = { name, tableName: String(payload.tableName ?? ""), timing: payload.timing === "AFTER" ? "AFTER" : "BEFORE", event: payload.event === "UPDATE" ? "UPDATE" : payload.event === "DELETE" ? "DELETE" : "INSERT", body: String(payload.body ?? ""), enabled: Boolean(payload.enabled ?? true), createdAt };
    getTable(database, item.tableName);
    database.triggers = database.triggers.filter((entry) => entry.name !== name).concat(item);
    track(database, "UPSERT_TRIGGER", name);
  }
  await saveDatabase(database);
  return database;
}

export async function deleteMetadata(databaseName: string, type: "routine" | "event" | "trigger", name: string) {
  const database = await readDatabase(databaseName);
  recordHistory(database);
  if (type === "routine") database.routines = database.routines.filter((item) => item.name !== name);
  if (type === "event") database.events = database.events.filter((item) => item.name !== name);
  if (type === "trigger") database.triggers = database.triggers.filter((item) => item.name !== name);
  track(database, `DELETE_${type.toUpperCase()}`, name);
  await saveDatabase(database);
  return database;
}

// ===== EXPLAIN plan (uproszczony) =====
export type ExplainNode = {
  op: string;
  detail?: string;
  estimatedRows?: number;
  estimatedCost?: number;
  children: ExplainNode[];
};

export function explainQuery(database: LocalDatabase, sql: string): ExplainNode {
  const trimmed = sql.trim().replace(/;\s*$/, "");
  const upper = trimmed.toUpperCase();
  if (!upper.startsWith("SELECT"))
    return { op: "Statement", detail: "EXPLAIN obsługuje tylko SELECT.", children: [] };
  const fromMatch = trimmed.match(/\bFROM\s+([`"\w.]+)(?:\s+(?:AS\s+)?(\w+))?/i);
  const whereMatch = trimmed.match(/\bWHERE\s+([\s\S]+?)(?=\b(?:GROUP\s+BY|ORDER\s+BY|LIMIT|HAVING|$))/i);
  const orderMatch = trimmed.match(/\bORDER\s+BY\s+([^]+?)(?=\bLIMIT|$)/i);
  const groupMatch = trimmed.match(/\bGROUP\s+BY\s+([^]+?)(?=\b(?:ORDER\s+BY|HAVING|LIMIT|$))/i);
  const limitMatch = trimmed.match(/\bLIMIT\s+(\d+)/i);
  const joinMatches = Array.from(
    trimmed.matchAll(/\b(INNER|LEFT|RIGHT|FULL|CROSS)?\s*JOIN\s+([`"\w.]+)(?:\s+(?:AS\s+)?(\w+))?(?:\s+ON\s+([^]+?))?(?=\b(?:WHERE|JOIN|GROUP\s+BY|ORDER\s+BY|LIMIT|$))/gi),
  );

  const tableName = fromMatch ? fromMatch[1].replace(/[`"]/g, "").split(".").at(-1) ?? "?" : "?";
  const table = database.tables.find((t) => t.name === tableName);
  const indexCols = new Set((table?.indexes ?? []).flatMap((idx) => idx.columns));
  const baseRows = table ? table.rows.length : 1000;

  let scan: ExplainNode = {
    op: "Seq Scan",
    detail: `na ${tableName}`,
    estimatedRows: baseRows,
    estimatedCost: baseRows,
    children: [],
  };

  if (whereMatch) {
    const condition = whereMatch[1].trim();
    const equalityMatch = condition.match(/\b(\w+)\s*=\s*[^\s]+/);
    if (equalityMatch && indexCols.has(equalityMatch[1])) {
      scan = {
        op: "Index Scan",
        detail: `${tableName} przez kolumnę ${equalityMatch[1]}`,
        estimatedRows: Math.max(1, Math.round(baseRows * 0.05)),
        estimatedCost: Math.max(1, Math.round(Math.log2(baseRows + 1) * 4)),
        children: [],
      };
    } else {
      scan = {
        op: "Seq Scan + Filter",
        detail: `${tableName} WHERE ${condition.slice(0, 60)}${condition.length > 60 ? "…" : ""}`,
        estimatedRows: Math.round(baseRows * 0.3),
        estimatedCost: baseRows,
        children: [scan],
      };
    }
  }

  let current = scan;
  for (const join of joinMatches) {
    const joinedTable = join[2].replace(/[`"]/g, "").split(".").at(-1) ?? "?";
    const joinedRows = database.tables.find((t) => t.name === joinedTable)?.rows.length ?? 100;
    current = {
      op: `${(join[1] ?? "INNER").toUpperCase()} Hash Join`,
      detail: `${tableName} ⋈ ${joinedTable}${join[4] ? ` ON ${join[4].trim()}` : ""}`,
      estimatedRows: Math.round((current.estimatedRows ?? 100) * Math.min(joinedRows, 10) / 5),
      estimatedCost: (current.estimatedCost ?? 0) + joinedRows,
      children: [current, { op: "Seq Scan", detail: `na ${joinedTable}`, estimatedRows: joinedRows, estimatedCost: joinedRows, children: [] }],
    };
  }

  if (groupMatch) {
    current = {
      op: "HashAggregate",
      detail: `GROUP BY ${groupMatch[1].trim()}`,
      estimatedRows: Math.max(1, Math.round((current.estimatedRows ?? 100) / 10)),
      estimatedCost: (current.estimatedCost ?? 0) + (current.estimatedRows ?? 100),
      children: [current],
    };
  }

  if (orderMatch) {
    current = {
      op: "Sort",
      detail: `ORDER BY ${orderMatch[1].trim()}`,
      estimatedRows: current.estimatedRows,
      estimatedCost: (current.estimatedCost ?? 0) + Math.round((current.estimatedRows ?? 100) * Math.log2((current.estimatedRows ?? 100) + 1)),
      children: [current],
    };
  }

  if (limitMatch) {
    current = {
      op: "Limit",
      detail: `LIMIT ${limitMatch[1]}`,
      estimatedRows: Math.min(current.estimatedRows ?? 0, Number(limitMatch[1])),
      estimatedCost: current.estimatedCost,
      children: [current],
    };
  }

  return current;
}

// ===== Schema diff =====
export type SchemaDiff = {
  tablesOnlyA: string[];
  tablesOnlyB: string[];
  tableDiffs: {
    name: string;
    columnsOnlyA: string[];
    columnsOnlyB: string[];
    columnTypeDiffs: { column: string; a: string; b: string }[];
    indexesOnlyA: string[];
    indexesOnlyB: string[];
  }[];
  viewsOnlyA: string[];
  viewsOnlyB: string[];
  viewSqlDiffs: { name: string; a: string; b: string }[];
  routinesOnlyA: string[];
  routinesOnlyB: string[];
  triggersOnlyA: string[];
  triggersOnlyB: string[];
};

export function diffSchemas(a: LocalDatabase, b: LocalDatabase): SchemaDiff {
  const tablesA = new Map(a.tables.map((table) => [table.name, table]));
  const tablesB = new Map(b.tables.map((table) => [table.name, table]));
  const viewsA = new Map((a.views ?? []).map((view) => [view.name, view]));
  const viewsB = new Map((b.views ?? []).map((view) => [view.name, view]));
  const routinesA = new Set((a.routines ?? []).map((r) => r.name));
  const routinesB = new Set((b.routines ?? []).map((r) => r.name));
  const triggersA = new Set((a.triggers ?? []).map((t) => t.name));
  const triggersB = new Set((b.triggers ?? []).map((t) => t.name));

  const tableDiffs: SchemaDiff["tableDiffs"] = [];
  for (const [name, tableA] of tablesA) {
    const tableB = tablesB.get(name);
    if (!tableB) continue;
    const colsA = new Map(tableA.columns.map((c) => [c.name, c]));
    const colsB = new Map(tableB.columns.map((c) => [c.name, c]));
    const indexesA = new Set(tableA.indexes.map((i) => i.name));
    const indexesB = new Set(tableB.indexes.map((i) => i.name));
    const columnTypeDiffs: { column: string; a: string; b: string }[] = [];
    for (const [colName, colA] of colsA) {
      const colB = colsB.get(colName);
      if (colB && colA.type !== colB.type)
        columnTypeDiffs.push({ column: colName, a: colA.type, b: colB.type });
    }
    const onlyA = [...colsA.keys()].filter((c) => !colsB.has(c));
    const onlyB = [...colsB.keys()].filter((c) => !colsA.has(c));
    if (
      onlyA.length === 0 &&
      onlyB.length === 0 &&
      columnTypeDiffs.length === 0 &&
      [...indexesA].every((i) => indexesB.has(i)) &&
      [...indexesB].every((i) => indexesA.has(i))
    )
      continue;
    tableDiffs.push({
      name,
      columnsOnlyA: onlyA,
      columnsOnlyB: onlyB,
      columnTypeDiffs,
      indexesOnlyA: [...indexesA].filter((i) => !indexesB.has(i)),
      indexesOnlyB: [...indexesB].filter((i) => !indexesA.has(i)),
    });
  }
  const viewSqlDiffs: SchemaDiff["viewSqlDiffs"] = [];
  for (const [name, viewA] of viewsA) {
    const viewB = viewsB.get(name);
    if (viewB && viewA.sql.trim() !== viewB.sql.trim())
      viewSqlDiffs.push({ name, a: viewA.sql, b: viewB.sql });
  }
  return {
    tablesOnlyA: [...tablesA.keys()].filter((name) => !tablesB.has(name)),
    tablesOnlyB: [...tablesB.keys()].filter((name) => !tablesA.has(name)),
    tableDiffs,
    viewsOnlyA: [...viewsA.keys()].filter((name) => !viewsB.has(name)),
    viewsOnlyB: [...viewsB.keys()].filter((name) => !viewsA.has(name)),
    viewSqlDiffs,
    routinesOnlyA: [...routinesA].filter((name) => !routinesB.has(name)),
    routinesOnlyB: [...routinesB].filter((name) => !routinesA.has(name)),
    triggersOnlyA: [...triggersA].filter((name) => !triggersB.has(name)),
    triggersOnlyB: [...triggersB].filter((name) => !triggersA.has(name)),
  };
}

// ===== Job runner (rozszerzenie events) =====
export async function runJob(databaseName: string, eventName: string) {
  const database = await readDatabase(databaseName);
  const event = database.events.find((e) => e.name === eventName);
  if (!event) throw new Error("Nie znaleziono zadania.");
  const startedAt = new Date().toISOString();
  const stepsResult: NonNullable<LocalDbEvent["history"]>[number]["steps"] = [];
  let overall: "success" | "failure" = "success";
  let messageSummary = "";
  const steps = event.steps && event.steps.length > 0
    ? event.steps
    : [{ id: "default", name: "body", kind: "sql" as const, body: event.body, enabled: true, onError: "stop" as const }];

  for (const step of steps) {
    if (!step.enabled) {
      stepsResult.push({ name: step.name, status: "skipped", durationMs: 0 });
      continue;
    }
    const stepStart = Date.now();
    try {
      if (step.kind === "sql") {
        await executeSql(databaseName, step.body);
      } else {
        // shell zablokowane w sandbox lokalnym; logujemy bez wykonywania
        throw new Error("Kroki shell są wyłączone w trybie lokalnym.");
      }
      stepsResult.push({ name: step.name, status: "success", durationMs: Date.now() - stepStart });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Błąd nieznany.";
      stepsResult.push({ name: step.name, status: "failure", durationMs: Date.now() - stepStart, message });
      overall = "failure";
      messageSummary = message;
      if (step.onError === "stop") break;
    }
  }

  const fresh = await readDatabase(databaseName);
  const target = fresh.events.find((e) => e.name === eventName);
  if (!target) throw new Error("Zadanie zniknęło.");
  target.history = target.history ?? [];
  target.history.unshift({
    id: createId(),
    startedAt,
    finishedAt: new Date().toISOString(),
    status: overall,
    message: messageSummary || (overall === "success" ? "OK" : undefined),
    steps: stepsResult,
  });
  if (target.history.length > 50) target.history.length = 50;
  target.lastRun = startedAt;
  target.lastStatus = overall;
  track(fresh, `RUN JOB ${overall}`, eventName);
  await saveDatabase(fresh);
  return { database: fresh, status: overall, steps: stepsResult };
}

export async function saveJobSteps(databaseName: string, eventName: string, steps: LocalDbJobStep[]) {
  const database = await readDatabase(databaseName);
  const event = database.events.find((e) => e.name === eventName);
  if (!event) throw new Error("Nie znaleziono zadania.");
  event.steps = steps.map((step) => ({
    id: step.id || createId(),
    name: step.name,
    kind: step.kind === "shell" ? "shell" : "sql",
    body: step.body,
    enabled: Boolean(step.enabled),
    onError: step.onError === "continue" ? "continue" : "stop",
  }));
  track(database, "ALTER JOB STEPS", eventName);
  await saveDatabase(database);
  return database;
}

export async function clearJobHistory(databaseName: string, eventName: string) {
  const database = await readDatabase(databaseName);
  const event = database.events.find((e) => e.name === eventName);
  if (!event) throw new Error("Nie znaleziono zadania.");
  event.history = [];
  track(database, "CLEAR HISTORY", eventName);
  await saveDatabase(database);
  return database;
}

export async function executeSql(databaseName: string, sql: string): Promise<SqlResult[]> {
  const statements = splitSqlStatements(sql);
  if (statements.length === 0) throw new Error("Puste zapytanie SQL.");
  return withDbLock(databaseName, async () => {
    // snapshot przed wykonaniem na wypadek partial-failure → rollback
    let snapshotJson: string | null = null;
    try {
      const target = safeDbPath(databaseName);
      snapshotJson = await readFile(target, "utf8");
    } catch {
      snapshotJson = null;
    }
    try {
      return await executeSqlInner(databaseName, statements);
    } catch (error) {
      if (snapshotJson) {
        try {
          const target = safeDbPath(databaseName);
          const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
          await writeFile(tmp, snapshotJson, "utf8");
          await rename(tmp, target);
        } catch {
          // best-effort rollback
        }
      }
      throw error;
    }
  });
}

async function executeSqlInner(databaseName: string, statements: string[]): Promise<SqlResult[]> {
  const results: SqlResult[] = [];
  let activeDatabase = databaseName;
  const previousResultsLength = () => results.length;

  for (const statement of statements) {
    const startedAt = Date.now();
    const startResults = previousResultsLength();
    const upper = statement.toUpperCase();
    if (/^(SET|LOCK TABLES|UNLOCK TABLES|START TRANSACTION|COMMIT|BEGIN)\b/i.test(statement)) {
      results.push({ statement, message: "Pominięto polecenie administracyjne.", columns: [], rows: [], affectedRows: 0 });
      continue;
    }
    if (upper.startsWith("CREATE DATABASE")) {
      const name = unquoteName(statement.replace(/^CREATE\s+DATABASE\s+/i, ""));
      await createDatabase(name);
      results.push({ statement, message: `Utworzono bazę ${name}.`, columns: [], rows: [], affectedRows: 1 });
      continue;
    }
    if (upper.startsWith("DROP DATABASE")) {
      const name = unquoteName(statement.replace(/^DROP\s+DATABASE\s+/i, ""));
      await unlink(dbPath(name));
      results.push({ statement, message: `Usunięto bazę ${name}.`, columns: [], rows: [], affectedRows: 1 });
      continue;
    }
    if (upper.startsWith("USE ")) {
      activeDatabase = unquoteName(statement.replace(/^USE\s+/i, ""));
      await readDatabase(activeDatabase);
      results.push({ statement, message: `Wybrano bazę ${activeDatabase}.`, columns: [], rows: [], affectedRows: 0 });
      continue;
    }
    if (upper === "SHOW DATABASES") {
      const rows = (await listDatabases()).map((databaseItem) => ({ Database: databaseItem.name }));
      results.push({ statement, message: `${rows.length} baz.`, columns: ["Database"], rows, affectedRows: rows.length });
      continue;
    }
    if (!activeDatabase) throw new Error("Wybierz bazę albo użyj USE nazwa_bazy.");
    const database = await readDatabase(activeDatabase);

    if (upper === "SHOW TABLES") {
      const rows = database.tables.map((table) => ({ Tables_in_database: table.name }));
      results.push({ statement, message: `${rows.length} tabel.`, columns: ["Tables_in_database"], rows, affectedRows: rows.length });
    } else if (upper.startsWith("DESCRIBE ") || upper.startsWith("DESC ")) {
      const table = getTable(database, unquoteName(statement.replace(/^(DESCRIBE|DESC)\s+/i, "")));
      const rows = table.columns.map((column) => ({ Field: column.name, Type: column.type, Null: column.nullable ? "YES" : "NO", Key: column.primaryKey ? "PRI" : column.indexed ? "MUL" : "", Extra: column.autoIncrement ? "auto_increment" : "" }));
      results.push({ statement, message: `${rows.length} kolumn.`, columns: ["Field", "Type", "Null", "Key", "Extra"], rows, affectedRows: rows.length });
    } else if (upper.startsWith("CREATE TABLE")) {
      const match = statement.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`\w]+)\s*\(([\s\S]+)\)\s*(?:ENGINE|DEFAULT|CHARSET|COLLATE|AUTO_INCREMENT|ROW_FORMAT|COMMENT|\s|=|\w|-|\d)*$/i);
      if (!match) throw new Error("Składnia: CREATE TABLE tabela (kolumna TYP, ...).");
      const table = database.tables.find((item) => item.name.toLowerCase() === unquoteName(match[1]).toLowerCase());
      if (table) {
        results.push({ statement, message: `Tabela ${table.name} już istnieje, pominięto.`, columns: [], rows: [], affectedRows: 0 });
      } else {
        await createTable(activeDatabase, unquoteName(match[1]), splitCsv(match[2]));
        results.push({ statement, message: `Utworzono tabelę ${unquoteName(match[1])}.`, columns: [], rows: [], affectedRows: 1 });
      }
    } else if (upper.startsWith("DROP TABLE")) {
      const tableName = unquoteName(statement.replace(/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?/i, ""));
      const before = database.tables.length;
      recordHistory(database);
      const tableToDrop = database.tables.find((table) => table.name.toLowerCase() === tableName.toLowerCase());
      if (tableToDrop) addRecycleBinItem(database, { type: "table", tableName: tableToDrop.name, tableData: tableToDrop });
      database.tables = database.tables.filter((table) => table.name.toLowerCase() !== tableName.toLowerCase());
      track(database, "DROP_TABLE", tableName, statement);
      await saveDatabase(database);
      results.push({ statement, message: `Usunięto tabelę ${tableName}.`, columns: [], rows: [], affectedRows: before - database.tables.length });
    } else if (upper.startsWith("ALTER TABLE")) {
      const match = statement.match(/^ALTER\s+TABLE\s+([`\w]+)\s+ADD\s+COLUMN\s+(.+)$/i);
      if (!match) throw new Error("Obsługiwane ALTER: ALTER TABLE tabela ADD COLUMN kolumna TYP.");
      const table = getTable(database, unquoteName(match[1]));
      const column = parseColumn(match[2]);
      if (!column) throw new Error("Nieprawidłowa definicja kolumny.");
      if (table.columns.some((item) => item.name.toLowerCase() === column.name.toLowerCase())) throw new Error("Kolumna już istnieje.");
      recordHistory(database);
      table.columns.push(column);
      table.rows = table.rows.map((row) => ({ ...row, [column.name]: coerceValue(column, undefined) }));
      track(database, "ALTER_TABLE", table.name, statement);
      await saveDatabase(database);
      results.push({ statement, message: `Dodano kolumnę ${column.name}.`, columns: [], rows: [], affectedRows: table.rows.length });
    } else if (upper.startsWith("INSERT INTO")) {
      const hasDuplicateUpdate = /\s+ON\s+DUPLICATE\s+KEY\s+UPDATE\b/i.test(statement);
      const withoutDuplicate = statement.replace(/\s+ON\s+DUPLICATE\s+KEY\s+UPDATE[\s\S]*$/i, "");
      const match = withoutDuplicate.match(/^INSERT\s+INTO\s+([`\w]+)\s*\(([\s\S]+?)\)\s*VALUES\s*([\s\S]+)$/i);
      if (!match) throw new Error("Składnia: INSERT INTO tabela (a,b) VALUES (1,'x').");
      const tableName = unquoteName(match[1]);
      const table = getTable(database, tableName);
      const keys = splitCsv(match[2]).map(unquoteName);
      const tuples = parseInsertTuples(match[3]);
      recordHistory(database);
      let affectedRows = 0;
      let lastRow: LocalDbRow | null = null;
      for (const tuple of tuples) {
        const values = splitCsv(tuple).map(parseLiteral);
        const row = coerceRow(table.columns, Object.fromEntries(keys.map((key, index) => [key, values[index]])), table.rows);
        const existingIndex = hasDuplicateUpdate ? findUniqueRowIndex(table, row) : -1;
        if (existingIndex >= 0) table.rows[existingIndex] = { ...table.rows[existingIndex], ...row };
        else table.rows.push(row);
        lastRow = row;
        affectedRows += 1;
      }
      track(database, "INSERT", tableName, statement);
      await saveDatabase(database);
      results.push({ statement, message: `Zaimportowano ${affectedRows} wierszy.`, columns: lastRow ? Object.keys(lastRow) : [], rows: lastRow ? [lastRow] : [], affectedRows });
    } else if (upper.startsWith("SELECT")) {
      const match = statement.match(/^SELECT\s+(.+)\s+FROM\s+([`\w]+)(?:\s+WHERE\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);
      if (!match) throw new Error("Składnia: SELECT kolumny FROM tabela [WHERE ...] [LIMIT n].");
      const table = getTable(database, unquoteName(match[2]));
      const columns = match[1].trim() === "*" ? table.columns.map((column) => column.name) : splitCsv(match[1]).map(unquoteName);
      const rows = table.rows.filter((row) => matchesWhere(row, match[3])).slice(0, match[4] ? Number(match[4]) : undefined).map((row) => Object.fromEntries(columns.map((column) => [column, row[column]])) as LocalDbRow);
      results.push({ statement, message: `${rows.length} wierszy.`, columns, rows, affectedRows: rows.length });
    } else if (upper.startsWith("UPDATE")) {
      const match = statement.match(/^UPDATE\s+([`\w]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
      if (!match) throw new Error("Składnia: UPDATE tabela SET a=1,b='x' [WHERE ...].");
      const table = getTable(database, unquoteName(match[1]));
      const updates = Object.fromEntries(splitCsv(match[2]).map((part) => { const [key, value] = part.split(/=(.+)/); return [unquoteName(key), parseLiteral(value)]; }));
      recordHistory(database);
      let affectedRows = 0;
      table.rows = table.rows.map((row) => (matchesWhere(row, match[3]) ? (affectedRows += 1, coerceRow(table.columns, { ...row, ...updates }, table.rows)) : row));
      track(database, "UPDATE", table.name, statement);
      await saveDatabase(database);
      results.push({ statement, message: `Zmieniono ${affectedRows} wierszy.`, columns: [], rows: [], affectedRows });
    } else if (upper.startsWith("DELETE FROM")) {
      const match = statement.match(/^DELETE\s+FROM\s+([`\w]+)(?:\s+WHERE\s+(.+))?$/i);
      if (!match) throw new Error("Składnia: DELETE FROM tabela [WHERE ...].");
      const table = getTable(database, unquoteName(match[1]));
      const before = table.rows.length;
      recordHistory(database);
      const rowsToDelete = table.rows.filter((row) => matchesWhere(row, match[2]));
      for (const row of rowsToDelete) addRecycleBinItem(database, { type: "row", tableName: table.name, rowData: row });
      table.rows = table.rows.filter((row) => !matchesWhere(row, match[2]));
      track(database, "DELETE", table.name, statement);
      await saveDatabase(database);
      results.push({ statement, message: `Usunięto ${before - table.rows.length} wierszy.`, columns: [], rows: [], affectedRows: before - table.rows.length });
    } else {
      throw new Error(`Nieobsługiwane polecenie SQL: ${statement}`);
    }
    const duration = Date.now() - startedAt;
    for (let index = startResults; index < results.length; index++) {
      results[index].durationMs = duration;
    }
  }
  return results;
}

export function recordHistory(database: LocalDatabase) {
  if (!database.undoStack) database.undoStack = [];
  const clone: LocalDatabase = {
    name: database.name,
    engineVersion: database.engineVersion,
    createdAt: database.createdAt,
    tables: structuredClone(database.tables),
    routines: structuredClone(database.routines),
    events: structuredClone(database.events),
    triggers: structuredClone(database.triggers),
    tracking: structuredClone(database.tracking),
    connection: structuredClone(database.connection),
    recycleBin: database.recycleBin ? structuredClone(database.recycleBin) : [],
    savedQueries: database.savedQueries ? structuredClone(database.savedQueries) : [],
    undoStack: []
  };
  database.undoStack.push(JSON.stringify(clone));
  if (database.undoStack.length > MAX_UNDO_STATES) {
    database.undoStack.shift();
  }
}

export async function undoLastOperation(databaseName: string): Promise<LocalDatabase> {
  const database = await readDatabase(databaseName);
  if (!database.undoStack || database.undoStack.length === 0) {
    throw new Error("Brak operacji do cofnięcia.");
  }
  const prevStateStr = database.undoStack.pop()!;
  const prevState = JSON.parse(prevStateStr) as LocalDatabase;
  prevState.undoStack = database.undoStack;
  await saveDatabase(prevState);
  return prevState;
}

export function createZip(files: { name: string; content: string }[]): Buffer {
  const buffers: Buffer[] = [];
  const localHeaders: { offset: number; size: number; name: string }[] = [];
  let offset = 0;

  for (const file of files) {
    const fileData = Buffer.from(file.content, "utf8");
    const fileNameBuf = Buffer.from(file.name, "utf8");
    const lfHeader = Buffer.alloc(30 + fileNameBuf.length);

    lfHeader.writeUInt32LE(0x04034b50, 0); // Signature
    lfHeader.writeUInt16LE(10, 4);          // Version needed
    lfHeader.writeUInt16LE(0, 6);           // Flags
    lfHeader.writeUInt16LE(0, 8);           // Compression (0 = Store)
    lfHeader.writeUInt16LE(0, 10);
    lfHeader.writeUInt16LE(0, 12);
    
    const crc = crc32(fileData);
    lfHeader.writeUInt32LE(crc, 14);
    lfHeader.writeUInt32LE(fileData.length, 18);
    lfHeader.writeUInt32LE(fileData.length, 22);
    lfHeader.writeUInt16LE(fileNameBuf.length, 26);
    lfHeader.writeUInt16LE(0, 28);
    fileNameBuf.copy(lfHeader, 30);

    buffers.push(lfHeader);
    buffers.push(fileData);
    localHeaders.push({ offset, size: fileData.length, name: file.name });
    offset += lfHeader.length + fileData.length;
  }

  const cdOffset = offset;
  let cdSize = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const headerInfo = localHeaders[i];
    const fileNameBuf = Buffer.from(file.name, "utf8");
    const cdHeader = Buffer.alloc(46 + fileNameBuf.length);

    cdHeader.writeUInt32LE(0x02014b50, 0);
    cdHeader.writeUInt16LE(20, 4);
    cdHeader.writeUInt16LE(10, 6);
    cdHeader.writeUInt16LE(0, 8);
    cdHeader.writeUInt16LE(0, 10);
    cdHeader.writeUInt16LE(0, 12);
    cdHeader.writeUInt16LE(0, 14);
    
    const crc = crc32(Buffer.from(file.content, "utf8"));
    cdHeader.writeUInt32LE(crc, 16);
    cdHeader.writeUInt32LE(headerInfo.size, 20);
    cdHeader.writeUInt32LE(headerInfo.size, 24);
    cdHeader.writeUInt16LE(fileNameBuf.length, 28);
    cdHeader.writeUInt16LE(0, 30);
    cdHeader.writeUInt16LE(0, 32);
    cdHeader.writeUInt16LE(0, 34);
    cdHeader.writeUInt16LE(0, 36);
    cdHeader.writeUInt32LE(0, 38);
    cdHeader.writeUInt32LE(headerInfo.offset, 42);
    fileNameBuf.copy(cdHeader, 46);

    buffers.push(cdHeader);
    cdSize += cdHeader.length;
  }

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);

  buffers.push(eocd);
  return Buffer.concat(buffers);
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function parseZip(buffer: Buffer): { name: string; content: string }[] {
  const files: { name: string; content: string }[] = [];
  let offset = 0;
  while (offset < buffer.length) {
    if (offset + 30 > buffer.length) break;
    const sig = buffer.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const compSize = buffer.readUInt32LE(offset + 18);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    if (offset + 30 + nameLen + extraLen + compSize > buffer.length) break;
    const name = buffer.toString("utf8", offset + 30, offset + 30 + nameLen);
    const fileDataOffset = offset + 30 + nameLen + extraLen;
    const fileData = buffer.subarray(fileDataOffset, fileDataOffset + compSize);
    files.push({ name, content: fileData.toString("utf8") });
    offset = fileDataOffset + compSize;
  }
  return files;
}

export async function restoreRecycleBinItem(databaseName: string, itemId: string) {
  const database = await readDatabase(databaseName);
  if (!database.recycleBin) return database;
  const itemIndex = database.recycleBin.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) throw new Error("Nie znaleziono elementu w koszu.");
  
  recordHistory(database);
  
  const item = database.recycleBin[itemIndex];
  if (item.type === "table" && item.tableData) {
    if (database.tables.some((t) => t.name.toLowerCase() === item.tableName.toLowerCase())) {
      throw new Error(`Tabela o nazwie '${item.tableName}' już istnieje. Zmień jej nazwę lub usuń, zanim przywrócisz tę z kosza.`);
    }
    database.tables.push(item.tableData);
  } else if (item.type === "row" && item.rowData) {
    const table = database.tables.find((t) => t.name.toLowerCase() === item.tableName.toLowerCase());
    if (!table) throw new Error(`Tabela docelowa '${item.tableName}' już nie istnieje. Nie można przywrócić wiersza.`);
    table.rows.push(item.rowData);
  }
  database.recycleBin.splice(itemIndex, 1);
  track(database, "RESTORE_RECYCLE_BIN", item.tableName);
  await saveDatabase(database);
  return database;
}

export async function deleteRecycleBinItem(databaseName: string, itemId: string) {
  const database = await readDatabase(databaseName);
  if (!database.recycleBin) return database;
  const itemIndex = database.recycleBin.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) throw new Error("Nie znaleziono elementu w koszu.");
  
  database.recycleBin.splice(itemIndex, 1);
  await saveDatabase(database);
  return database;
}

export async function clearRecycleBin(databaseName: string) {
  const database = await readDatabase(databaseName);
  database.recycleBin = [];
  await saveDatabase(database);
  return database;
}

export async function saveQuery(databaseName: string, queryName: string, sql: string) {
  const database = await readDatabase(databaseName);
  const name = queryName.trim();
  if (!name) throw new Error("Nazwa zapytania jest wymagana.");
  if (!sql.trim()) throw new Error("Treść SQL jest wymagana.");
  if (sql.length > MAX_IMPORT_BYTES) throw new Error("Zapytanie SQL jest za duże (limit 2MB).");
  if (!database.savedQueries) database.savedQueries = [];
  
  const existing = database.savedQueries.find((q) => q.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.sql = sql;
  } else {
    database.savedQueries.push({
      id: createId(),
      name,
      sql,
      createdAt: new Date().toISOString()
    });
  }
  await saveDatabase(database);
  return database;
}

export async function deleteQuery(databaseName: string, queryId: string) {
  const database = await readDatabase(databaseName);
  if (!database.savedQueries) return database;
  database.savedQueries = database.savedQueries.filter((q) => q.id !== queryId);
  await saveDatabase(database);
  return database;
}
