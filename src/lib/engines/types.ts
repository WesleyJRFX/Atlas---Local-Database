import type { LocalDbRow } from "@/lib/types";

export type DatabaseEngine =
  | "localdb"
  | "sqlite"
  | "mysql"
  | "mssql"
  | "oracle"
  | "redis"
  | "elasticsearch";

export type ConnectionSecret = {
  password?: string;
  token?: string;
  apiKey?: string;
};

export type DatabaseConnectionConfig = {
  id: string;
  name: string;
  engine: DatabaseEngine;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  filePath?: string;
  tls?: boolean;
  url?: string;
  secret?: ConnectionSecret;
  createdAt: string;
  updatedAt: string;
};

export type EngineObjectKind =
  | "database"
  | "schema"
  | "table"
  | "view"
  | "materialized_view"
  | "index"
  | "sequence"
  | "procedure"
  | "function"
  | "key"
  | "index_alias"
  | "document";

export type EngineObject = {
  kind: EngineObjectKind;
  name: string;
  schema?: string;
  database?: string;
  rowCount?: number;
  columns?: EngineColumn[];
  children?: EngineObject[];
  meta?: Record<string, unknown>;
};

export type EngineColumn = {
  name: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
  defaultValue?: unknown;
};

export type EngineQueryResult = {
  statement: string;
  message: string;
  columns: string[];
  rows: LocalDbRow[];
  affectedRows: number;
  durationMs: number;
  raw?: unknown;
};

export type EngineCapabilities = {
  sql: boolean;
  browse: boolean;
  schema: boolean;
  transactions: boolean;
  explain: boolean;
  documents: boolean;
  keyValue: boolean;
};

export interface DatabaseProvider {
  engine: DatabaseEngine;
  label: string;
  capabilities: EngineCapabilities;
  test(config: DatabaseConnectionConfig): Promise<{ ok: true; message: string } | { ok: false; message: string }>;
  listObjects(config: DatabaseConnectionConfig): Promise<EngineObject[]>;
  query(config: DatabaseConnectionConfig, query: string): Promise<EngineQueryResult[]>;
  getTableRows?(config: DatabaseConnectionConfig, table: string, schema?: string, limit?: number, offset?: number): Promise<EngineQueryResult>;
}
