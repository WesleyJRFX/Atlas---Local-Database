import type { DatabaseConnectionConfig, DatabaseProvider, EngineObject, EngineQueryResult } from "@/lib/engines/types";
import type { LocalDbRow } from "@/lib/types";

function rowsFromMysql(result: unknown): { columns: string[]; rows: LocalDbRow[]; affectedRows: number } {
  if (Array.isArray(result)) {
    const rows = result as Record<string, unknown>[];
    const columns = rows[0] ? Object.keys(rows[0]) : [];
    return { columns, rows: rows as LocalDbRow[], affectedRows: rows.length };
  }
  const packet = result as { affectedRows?: number };
  return { columns: [], rows: [], affectedRows: packet.affectedRows ?? 0 };
}

export const mysqlProvider: DatabaseProvider = {
  engine: "mysql",
  label: "MySQL / MariaDB",
  capabilities: {
    sql: true,
    browse: true,
    schema: true,
    transactions: true,
    explain: true,
    documents: false,
    keyValue: false,
  },
  async test(config) {
    try {
      const mysql = await import("mysql2/promise");
      const connection = await mysql.createConnection({
        host: config.host ?? "127.0.0.1",
        port: config.port ?? 3306,
        user: config.username,
        password: config.secret?.password,
        database: config.database,
        ssl: config.tls ? {} : undefined,
      });
      await connection.ping();
      await connection.end();
      return { ok: true, message: "Połączono z MySQL." };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "Błąd MySQL." };
    }
  },
  async listObjects(config) {
    const mysql = await import("mysql2/promise");
    const connection = await mysql.createConnection({
      host: config.host ?? "127.0.0.1",
      port: config.port ?? 3306,
      user: config.username,
      password: config.secret?.password,
      database: config.database,
      ssl: config.tls ? {} : undefined,
    });
    try {
      const [tables] = await connection.query(
        `SELECT TABLE_NAME, TABLE_TYPE, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME`,
      );
      const objects: EngineObject[] = [];
      for (const table of tables as { TABLE_NAME: string; TABLE_TYPE: string; TABLE_ROWS?: number }[]) {
        const [columns] = await connection.query(
          `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
          [table.TABLE_NAME],
        );
        objects.push({
          kind: table.TABLE_TYPE === "VIEW" ? "view" : "table",
          name: table.TABLE_NAME,
          rowCount: table.TABLE_ROWS,
          columns: (columns as { COLUMN_NAME: string; COLUMN_TYPE: string; IS_NULLABLE: string; COLUMN_KEY: string; COLUMN_DEFAULT: unknown }[]).map((column) => ({
            name: column.COLUMN_NAME,
            type: column.COLUMN_TYPE,
            nullable: column.IS_NULLABLE === "YES",
            primaryKey: column.COLUMN_KEY === "PRI",
            defaultValue: column.COLUMN_DEFAULT,
          })),
        });
      }
      return objects;
    } finally {
      await connection.end();
    }
  },
  async query(config, sql) {
    const mysql = await import("mysql2/promise");
    const connection = await mysql.createConnection({
      host: config.host ?? "127.0.0.1",
      port: config.port ?? 3306,
      user: config.username,
      password: config.secret?.password,
      database: config.database,
      ssl: config.tls ? {} : undefined,
      multipleStatements: false,
    });
    const started = Date.now();
    try {
      const [result] = await connection.query(sql);
      const parsed = rowsFromMysql(result);
      return [{ statement: sql, message: "OK", ...parsed, durationMs: Date.now() - started, raw: result }];
    } finally {
      await connection.end();
    }
  },
  async getTableRows(config, table, _schema, limit = 100, offset = 0) {
    const safeTable = table.replace(/`/g, "``");
    const [result] = await this.query(config, `SELECT * FROM \`${safeTable}\` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`);
    return result;
  },
};
