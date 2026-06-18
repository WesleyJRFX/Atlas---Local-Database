export type LocalDbValue = string | number | boolean | null;

export type LocalDbColumnType =
  // Tekst
  | "TEXT"
  | "VARCHAR"
  | "CHAR"
  | "TINYTEXT"
  | "MEDIUMTEXT"
  | "LONGTEXT"
  // Liczby całkowite
  | "TINYINT"
  | "SMALLINT"
  | "MEDIUMINT"
  | "INT"
  | "BIGINT"
  // Liczby zmiennoprzecinkowe / dziesiętne
  | "FLOAT"
  | "DOUBLE"
  | "DECIMAL"
  | "NUMERIC"
  // Boolean
  | "BOOLEAN"
  // Data / czas
  | "DATE"
  | "TIME"
  | "DATETIME"
  | "TIMESTAMP"
  | "YEAR"
  // Dane binarne
  | "BLOB"
  | "TINYBLOB"
  | "MEDIUMBLOB"
  | "LONGBLOB"
  | "BYTEA"
  | "BINARY"
  | "VARBINARY"
  // Strukturalne
  | "JSON"
  | "JSONB"
  | "XML"
  // Identyfikatory
  | "UUID"
  // Sieć
  | "INET"
  | "CIDR"
  | "MACADDR"
  // Geografia
  | "POINT"
  | "GEOMETRY"
  // Enum / Set
  | "ENUM"
  | "SET";

export type LocalDbColumn = {
  name: string;
  type: LocalDbColumnType;
  nullable: boolean;
  defaultValue?: LocalDbValue;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  indexed?: boolean;
  unsigned?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
  enumValues?: string[];
};

export type LocalDbIndex = {
  name: string;
  columns: string[];
  unique: boolean;
  createdAt: string;
};

export type LocalDbRow = Record<string, LocalDbValue>;

export type LocalDbTable = {
  name: string;
  schema?: string;
  columns: LocalDbColumn[];
  rows: LocalDbRow[];
  indexes: LocalDbIndex[];
  checks?: LocalDbCheckConstraint[];
  description?: string;
  createdAt: string;
};

export type LocalDbView = {
  name: string;
  schema?: string;
  sql: string;
  createdAt: string;
};

export type LocalDbMaterializedView = {
  name: string;
  schema?: string;
  sql: string;
  columns: string[];
  rows: LocalDbRow[];
  refreshedAt?: string;
  createdAt: string;
};

export type LocalDbSequence = {
  name: string;
  schema?: string;
  start: number;
  increment: number;
  minValue?: number;
  maxValue?: number;
  current: number;
  cycle: boolean;
  createdAt: string;
};

export type LocalDbSchema = {
  name: string;
  description?: string;
  createdAt: string;
};

export type LocalDbCheckConstraint = {
  name: string;
  expression: string;
  createdAt: string;
};

export type LocalDbDomain = {
  name: string;
  schema?: string;
  baseType: LocalDbColumnType;
  nullable: boolean;
  defaultValue?: LocalDbValue;
  check?: string;
  description?: string;
  createdAt: string;
};

export type LocalDbCompositeType = {
  name: string;
  schema?: string;
  attributes: { name: string; type: LocalDbColumnType }[];
  description?: string;
  createdAt: string;
};

export type LocalDbRule = {
  name: string;
  schema?: string;
  tableName: string;
  event: "INSERT" | "UPDATE" | "DELETE" | "SELECT";
  condition?: string;
  body: string;
  enabled: boolean;
  createdAt: string;
};

export type RoutineKind = "PROCEDURE" | "FUNCTION";

export type LocalDbRoutine = {
  name: string;
  kind: RoutineKind;
  body: string;
  returns?: string;
  createdAt: string;
};

export type LocalDbJobStep = {
  id: string;
  name: string;
  kind: "sql" | "shell";
  body: string;
  enabled: boolean;
  onError: "stop" | "continue";
};

export type LocalDbJobHistoryEntry = {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: "success" | "failure" | "running";
  message?: string;
  steps: { name: string; status: "success" | "failure" | "skipped"; durationMs: number; message?: string }[];
};

export type LocalDbEvent = {
  name: string;
  schedule: string;
  body: string;
  enabled: boolean;
  steps?: LocalDbJobStep[];
  history?: LocalDbJobHistoryEntry[];
  lastRun?: string;
  lastStatus?: "success" | "failure";
  createdAt: string;
};

export type LocalDbTrigger = {
  name: string;
  tableName: string;
  timing: "BEFORE" | "AFTER";
  event: "INSERT" | "UPDATE" | "DELETE";
  body: string;
  enabled: boolean;
  createdAt: string;
};

export type TrackingEntry = {
  id: string;
  action: string;
  objectName: string;
  sql?: string;
  createdAt: string;
};

export type RecycleBinItem = {
  id: string;
  type: "table" | "row";
  tableName: string;
  tableData?: LocalDbTable;
  rowData?: LocalDbRow;
  deletedAt: string;
};

export type SavedQuery = {
  id: string;
  name: string;
  sql: string;
  createdAt: string;
};

export type LocalDbConnection = {
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
};

export type LocalDatabase = {
  name: string;
  engineVersion: number;
  createdAt: string;
  schemas?: LocalDbSchema[];
  tables: LocalDbTable[];
  views?: LocalDbView[];
  materializedViews?: LocalDbMaterializedView[];
  sequences?: LocalDbSequence[];
  domains?: LocalDbDomain[];
  compositeTypes?: LocalDbCompositeType[];
  rules?: LocalDbRule[];
  routines: LocalDbRoutine[];
  events: LocalDbEvent[];
  triggers: LocalDbTrigger[];
  tracking: TrackingEntry[];
  connection: LocalDbConnection;
  recycleBin?: RecycleBinItem[];
  savedQueries?: SavedQuery[];
  undoStack?: string[];
};

export type SqlResult = {
  statement: string;
  message: string;
  columns: string[];
  rows: LocalDbRow[];
  affectedRows: number;
  durationMs?: number;
};
