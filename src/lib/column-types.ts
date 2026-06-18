import type { LocalDbColumnType } from "@/lib/types";

export type ColumnCategory =
  | "string"
  | "integer"
  | "decimal"
  | "boolean"
  | "date"
  | "time"
  | "datetime"
  | "year"
  | "binary"
  | "json"
  | "xml"
  | "uuid"
  | "network"
  | "geometry"
  | "enum";

export type ColumnTypeMeta = {
  name: LocalDbColumnType;
  category: ColumnCategory;
  /** Whether the type accepts a length parameter, e.g. VARCHAR(255). */
  hasLength?: boolean;
  /** Whether the type accepts precision/scale, e.g. DECIMAL(10,2). */
  hasPrecision?: boolean;
  /** Whether the type accepts an enum/set value list, e.g. ENUM('a','b'). */
  hasEnumValues?: boolean;
  /** Whether the type stores a numeric value (used for AUTO_INCREMENT, UNSIGNED). */
  isNumeric?: boolean;
  /** Whether the type can be marked AUTO_INCREMENT. */
  canAutoIncrement?: boolean;
  /** Whether the type can be marked UNSIGNED. */
  canBeUnsigned?: boolean;
  /** SQL aliases that map to this canonical type during import. */
  aliases?: string[];
  /** Default length applied when the type is created without an explicit length. */
  defaultLength?: number;
  /** Maximum byte length (informational). */
  maxLength?: number;
  /** Short human-readable description. */
  description: string;
};

export const COLUMN_TYPES: ColumnTypeMeta[] = [
  // String
  { name: "VARCHAR", category: "string", hasLength: true, defaultLength: 255, maxLength: 65535, aliases: ["VARCHAR", "CHARACTER VARYING"], description: "Tekst zmiennej długości." },
  { name: "CHAR", category: "string", hasLength: true, defaultLength: 1, maxLength: 255, aliases: ["CHAR", "CHARACTER"], description: "Tekst stałej długości." },
  { name: "TEXT", category: "string", maxLength: 65535, aliases: ["TEXT"], description: "Długi tekst." },
  { name: "TINYTEXT", category: "string", maxLength: 255, aliases: ["TINYTEXT"], description: "Tekst do 255 znaków." },
  { name: "MEDIUMTEXT", category: "string", maxLength: 16777215, aliases: ["MEDIUMTEXT"], description: "Tekst do 16 MB." },
  { name: "LONGTEXT", category: "string", maxLength: 4294967295, aliases: ["LONGTEXT"], description: "Tekst do 4 GB." },

  // Integers
  { name: "TINYINT", category: "integer", isNumeric: true, canBeUnsigned: true, canAutoIncrement: true, aliases: ["TINYINT", "INT1"], description: "Liczba całkowita 1 bajt (-128…127)." },
  { name: "SMALLINT", category: "integer", isNumeric: true, canBeUnsigned: true, canAutoIncrement: true, aliases: ["SMALLINT", "INT2"], description: "Liczba całkowita 2 bajty." },
  { name: "MEDIUMINT", category: "integer", isNumeric: true, canBeUnsigned: true, canAutoIncrement: true, aliases: ["MEDIUMINT", "INT3"], description: "Liczba całkowita 3 bajty." },
  { name: "INT", category: "integer", isNumeric: true, canBeUnsigned: true, canAutoIncrement: true, aliases: ["INT", "INTEGER", "INT4"], description: "Liczba całkowita 4 bajty." },
  { name: "BIGINT", category: "integer", isNumeric: true, canBeUnsigned: true, canAutoIncrement: true, aliases: ["BIGINT", "INT8"], description: "Liczba całkowita 8 bajtów." },

  // Decimals / floats
  { name: "FLOAT", category: "decimal", isNumeric: true, canBeUnsigned: true, hasPrecision: true, aliases: ["FLOAT", "REAL"], description: "Liczba zmiennoprzecinkowa pojedynczej precyzji." },
  { name: "DOUBLE", category: "decimal", isNumeric: true, canBeUnsigned: true, hasPrecision: true, aliases: ["DOUBLE", "DOUBLE PRECISION"], description: "Liczba zmiennoprzecinkowa podwójnej precyzji." },
  { name: "DECIMAL", category: "decimal", isNumeric: true, canBeUnsigned: true, hasPrecision: true, aliases: ["DECIMAL", "DEC", "FIXED"], description: "Liczba dziesiętna o stałej precyzji." },
  { name: "NUMERIC", category: "decimal", isNumeric: true, canBeUnsigned: true, hasPrecision: true, aliases: ["NUMERIC"], description: "Alias DECIMAL." },

  // Boolean
  { name: "BOOLEAN", category: "boolean", aliases: ["BOOL", "BOOLEAN"], description: "Wartość logiczna true/false." },

  // Date / time
  { name: "DATE", category: "date", aliases: ["DATE"], description: "Data RRRR-MM-DD." },
  { name: "TIME", category: "time", aliases: ["TIME"], description: "Czas HH:MM:SS." },
  { name: "DATETIME", category: "datetime", aliases: ["DATETIME"], description: "Data + czas." },
  { name: "TIMESTAMP", category: "datetime", aliases: ["TIMESTAMP", "TIMESTAMPTZ"], description: "Znacznik czasu." },
  { name: "YEAR", category: "year", aliases: ["YEAR"], description: "Rok 4-cyfrowy." },

  // Binary
  { name: "BLOB", category: "binary", maxLength: 65535, aliases: ["BLOB"], description: "Dane binarne (przechowywane jako Base64)." },
  { name: "TINYBLOB", category: "binary", maxLength: 255, aliases: ["TINYBLOB"], description: "Małe dane binarne." },
  { name: "MEDIUMBLOB", category: "binary", maxLength: 16777215, aliases: ["MEDIUMBLOB"], description: "Średnie dane binarne." },
  { name: "LONGBLOB", category: "binary", maxLength: 4294967295, aliases: ["LONGBLOB"], description: "Duże dane binarne." },
  { name: "BYTEA", category: "binary", aliases: ["BYTEA"], description: "Dane binarne (PostgreSQL)." },
  { name: "BINARY", category: "binary", hasLength: true, defaultLength: 1, aliases: ["BINARY"], description: "Stałej długości dane binarne." },
  { name: "VARBINARY", category: "binary", hasLength: true, defaultLength: 255, aliases: ["VARBINARY"], description: "Zmiennej długości dane binarne." },

  // Structural
  { name: "JSON", category: "json", aliases: ["JSON"], description: "Dokument JSON." },
  { name: "JSONB", category: "json", aliases: ["JSONB"], description: "Dokument JSON (binary, PostgreSQL)." },
  { name: "XML", category: "xml", aliases: ["XML"], description: "Dokument XML." },

  // Identifiers
  { name: "UUID", category: "uuid", aliases: ["UUID", "GUID", "UNIQUEIDENTIFIER"], description: "Identyfikator UUID v4." },

  // Network
  { name: "INET", category: "network", aliases: ["INET"], description: "Adres IP (IPv4/IPv6)." },
  { name: "CIDR", category: "network", aliases: ["CIDR"], description: "Sieć IP w notacji CIDR." },
  { name: "MACADDR", category: "network", aliases: ["MACADDR"], description: "Adres MAC." },

  // Geometry
  { name: "POINT", category: "geometry", aliases: ["POINT"], description: "Punkt 2D (x,y)." },
  { name: "GEOMETRY", category: "geometry", aliases: ["GEOMETRY", "GEOGRAPHY"], description: "Obiekt geometryczny WKT." },

  // Enum / set
  { name: "ENUM", category: "enum", hasEnumValues: true, aliases: ["ENUM"], description: "Wartość z predefiniowanej listy." },
  { name: "SET", category: "enum", hasEnumValues: true, aliases: ["SET"], description: "Zbiór wartości z listy (CSV)." },
];

const TYPE_BY_NAME = new Map<string, ColumnTypeMeta>(
  COLUMN_TYPES.map((meta) => [meta.name, meta]),
);

const ALIAS_LOOKUP = new Map<string, LocalDbColumnType>();
for (const meta of COLUMN_TYPES) {
  for (const alias of meta.aliases ?? []) {
    ALIAS_LOOKUP.set(alias.toUpperCase(), meta.name);
  }
  ALIAS_LOOKUP.set(meta.name.toUpperCase(), meta.name);
}

export function getColumnTypeMeta(type: LocalDbColumnType): ColumnTypeMeta {
  const meta = TYPE_BY_NAME.get(type);
  if (!meta) throw new Error(`Nieobsługiwany typ kolumny: ${type}.`);
  return meta;
}

export function isKnownColumnType(type: string): type is LocalDbColumnType {
  return TYPE_BY_NAME.has(type as LocalDbColumnType);
}

export function resolveColumnTypeAlias(type: string): LocalDbColumnType | null {
  if (!type) return null;
  const upper = type.toUpperCase().trim();
  return ALIAS_LOOKUP.get(upper) ?? null;
}

export const COLUMN_CATEGORY_LABELS: Record<ColumnCategory, string> = {
  string: "Tekst",
  integer: "Liczba całkowita",
  decimal: "Liczba dziesiętna",
  boolean: "Boolean",
  date: "Data",
  time: "Czas",
  datetime: "Data i czas",
  year: "Rok",
  binary: "Binarne",
  json: "JSON",
  xml: "XML",
  uuid: "UUID",
  network: "Sieć",
  geometry: "Geometria",
  enum: "Lista (ENUM/SET)",
};
