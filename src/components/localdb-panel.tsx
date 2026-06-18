"use client";
import { THEMES } from "@/lib/themes";

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import * as React from "react";
import Image from "next/image";
void Image;
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Database,
  Download,
  Edit3,
  Eraser,
  Eye,
  EyeOff,
  Filter,
  HelpCircle,
  Home,
  Info,
  Keyboard,
  Layers,
  Plus,
  Power,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Table2,
  Tag,
  Terminal,
  Trash2,
  Upload,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  LocalDatabase,
  LocalDbColumn,
  LocalDbColumnType,
  LocalDbEvent,
  LocalDbJobStep,
  LocalDbRow,
  LocalDbTable,
  LocalDbValue,
  RecycleBinItem,
  SavedQuery,
  SqlResult,
} from "@/lib/types";
import {
  COLUMN_TYPES,
  COLUMN_CATEGORY_LABELS,
  type ColumnCategory,
} from "@/lib/column-types";

type ApiState = { databases: LocalDatabase[] };
type LocalDbPanelProps = {
  initialDatabases: LocalDatabase[];
  initialView?: SavedView;
};
type Tab =
  | "home"
  | "database"
  | "browse"
  | "structure"
  | "search"
  | "insert"
  | "sql"
  | "query"
  | "export"
  | "import"
  | "operations"
  | "routines"
  | "events"
  | "triggers"
  | "views"
  | "mviews"
  | "sequences"
  | "schemas"
  | "domains"
  | "types"
  | "rules"
  | "dashboard"
  | "erd"
  | "diff"
  | "jobs"
  | "backup"
  | "tracking"
  | "console"
  | "settings";
const VALID_TABS: Tab[] = [
  "home",
  "database",
  "browse",
  "structure",
  "search",
  "insert",
  "sql",
  "query",
  "export",
  "import",
  "operations",
  "routines",
  "events",
  "triggers",
  "views",
  "mviews",
  "sequences",
  "schemas",
  "domains",
  "types",
  "rules",
  "dashboard",
  "erd",
  "diff",
  "jobs",
  "backup",
  "tracking",
  "console",
  "settings",
];

const APP_VERSION = "1.0";

function hexToRgbTuple(hex: string): string {
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned.split("").map((c) => c + c).join("")
      : cleaned;
  const value = parseInt(full, 16);
  if (Number.isNaN(value)) return "59, 130, 246";
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  return `${r}, ${g}, ${b}`;
}

function isLightColor(hex: string): boolean {
  const tuple = hexToRgbTuple(hex).split(", ").map(Number);
  if (tuple.length < 3) return false;
  const [r, g, b] = tuple;
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma > 0.55;
}

function relativeLuminance(hex: string): number {
  const tuple = hexToRgbTuple(hex).split(", ").map(Number);
  if (tuple.length < 3) return 0;
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(tuple[0]) +
    0.7152 * channel(tuple[1]) +
    0.0722 * channel(tuple[2])
  );
}

function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

function adjustColorForContrast(
  color: string,
  background: string,
  target = 4.5,
): string {
  if (contrastRatio(color, background) >= target) return color;
  const tuple = hexToRgbTuple(color).split(", ").map(Number);
  const bgTuple = hexToRgbTuple(background).split(", ").map(Number);
  const bgLight = isLightColor(background);
  const towards = bgLight ? [0, 0, 0] : [255, 255, 255];
  let mix = 0.1;
  let result = tuple;
  while (mix <= 1) {
    result = tuple.map((value, index) =>
      Math.round(value * (1 - mix) + towards[index] * mix),
    );
    const hex = `#${result.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    if (contrastRatio(hex, background) >= target) return hex;
    mix += 0.1;
  }
  void bgTuple;
  return `#${result.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

let atlasLogoCache: string | null = null;

function AtlasLogo({ className }: { className?: string }) {
  const [svg, setSvg] = useState<string | null>(atlasLogoCache);  useEffect(() => {
    if (atlasLogoCache) {
      setSvg(atlasLogoCache);
      return;
    }
    let cancelled = false;
    fetch("/logo.svg")
      .then((response) => response.text())
      .then((text) => {
        const cleaned = text
          .replace(/\sfill="[^"]*"/g, "")
          .replace(/<svg([^>]*)>/, (match, attrs: string) => {
            const stripped = attrs
              .replace(/\swidth="[^"]*"/, "")
              .replace(/\sheight="[^"]*"/, "");
            return `<svg${stripped} width="100%" height="100%" fill="currentColor">`;
          });
        atlasLogoCache = cleaned;
        if (!cancelled) setSvg(cleaned);
      })
      .catch(() => {
        if (!cancelled) setSvg(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <span
      aria-label="Atlas"
      role="img"
      className={`inline-flex items-center justify-center text-[color:var(--accent)] ${className ?? ""}`}
      style={{ color: "var(--accent)" }}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
type MetadataType = "routine" | "event" | "trigger";
export type SavedView = {
  activeTab?: Tab;
  selectedDatabase?: string;
  selectedTable?: string;
};
const EMPTY_SAVED_VIEW: SavedView = {};
type Toast = {
  id: string;
  title: string;
  message?: string;
  type: "success" | "error" | "info";
  exiting?: boolean;
};
type ConsoleLevel = "info" | "success" | "warn" | "error" | "debug";
type ConsoleEntry = {
  id: string;
  timestamp: string;
  level: ConsoleLevel;
  source: string;
  message: string;
  detail?: string;
};
type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  requireName?: string;
  resolve: (value: boolean) => void;
};


export function normalizeSavedView(value: unknown): SavedView {
  if (!value || typeof value !== "object") return EMPTY_SAVED_VIEW;
  const parsed = value as SavedView;
  return {
    activeTab:
      parsed.activeTab && VALID_TABS.includes(parsed.activeTab)
        ? parsed.activeTab
        : undefined,
    selectedDatabase:
      typeof parsed.selectedDatabase === "string"
        ? parsed.selectedDatabase
        : undefined,
    selectedTable:
      typeof parsed.selectedTable === "string"
        ? parsed.selectedTable
        : undefined,
  };
}

function writeSavedView(view: SavedView) {
  const value = JSON.stringify(view);
  window.localStorage.setItem("localdb-panel-view", value);
  document.cookie = `localdb-panel-view=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
}

type DataTableProps = {
  columns: string[];
  rows: LocalDbRow[];
  rowIndices?: number[];
  actions?: boolean;
  editable?: boolean;
  onEdit?: (row: LocalDbRow, index: number) => void;
  onDelete?: (index: number) => void;
  onDuplicate?: (row: LocalDbRow, index: number) => void;
  onCellSave?: (rowIndex: number, column: string, value: string) => void;
  selectable?: boolean;
  selectedIndices?: number[];
  onToggleSelect?: (index: number) => void;
  onToggleSelectAll?: (visibleIndices: number[]) => void;
  sortable?: boolean;
  paginated?: boolean;
  pageSize?: number;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Operacja nie powiodła się.");
  return data;
}

function downloadText(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsv(columns: string[], rows: LocalDbRow[]) {
  const escape = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [
    columns.map(escape).join(","),
    ...rows.map((row) =>
      columns.map((column) => escape(row[column])).join(","),
    ),
  ].join("\n");
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === ",") {
      result.push(current);
      current = "";
    } else if (char === '"' && current === "") {
      inQuotes = true;
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function DataTable({
  columns,
  rows,
  rowIndices,
  actions,
  editable,
  onEdit,
  onDelete,
  onDuplicate,
  onCellSave,
  selectable,
  selectedIndices,
  onToggleSelect,
  onToggleSelectAll,
  sortable,
  paginated,
  pageSize: pageSizeProp,
}: DataTableProps) {
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    column: string;
  } | null>(null);
  const [cellValue, setCellValue] = useState("");
  const [sortBy, setSortBy] = useState<{
    column: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(pageSizeProp ?? 100);

  const sortedEntries = useMemo(() => {
    const entries = rows.map((row, index) => ({
      row,
      originalIndex: rowIndices?.[index] ?? index,
    }));
    if (!sortable || !sortBy) return entries;
    const direction = sortBy.direction === "asc" ? 1 : -1;
    return [...entries].sort((a, b) => {
      const av = a.row[sortBy.column];
      const bv = b.row[sortBy.column];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * direction;
      }
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * direction;
    });
  }, [rows, rowIndices, sortable, sortBy]);

  const totalPages = paginated
    ? Math.max(1, Math.ceil(sortedEntries.length / pageSize))
    : 1;
  const safePage = Math.min(page, totalPages - 1);
  const virtualLimit = !paginated && sortedEntries.length > 1000 ? 1000 : null;
  const paginatedEntries = paginated
    ? sortedEntries.slice(safePage * pageSize, safePage * pageSize + pageSize)
    : virtualLimit
      ? sortedEntries.slice(0, virtualLimit)
      : sortedEntries;

  function startCellEdit(
    rowIndex: number,
    column: string,
    value: LocalDbRow[string],
  ) {
    if (!editable) return;
    setEditingCell({ rowIndex, column });
    setCellValue(value === null || value === undefined ? "" : String(value));
  }

  function finishCellEdit() {
    if (!editingCell) return;
    onCellSave?.(editingCell.rowIndex, editingCell.column, cellValue);
    setEditingCell(null);
    setCellValue("");
  }

  function toggleSort(column: string) {
    if (!sortable) return;
    setSortBy((current) => {
      if (current?.column !== column) return { column, direction: "asc" };
      if (current.direction === "asc") return { column, direction: "desc" };
      return null;
    });
  }

  const visibleOriginalIndices = paginatedEntries.map((entry) => entry.originalIndex);
  const allVisibleSelected =
    selectable &&
    visibleOriginalIndices.length > 0 &&
    visibleOriginalIndices.every((index) => selectedIndices?.includes(index));

  return (
    <div className="flex flex-col gap-3">
      <div className="atlas-table-wrap h-full max-w-full overflow-auto rounded-lg">
        <table className="atlas-table w-full min-w-[820px] border-collapse text-left text-sm">
          <thead>
            <tr>{selectable ? (
                <th className="atlas-th atlas-th-check w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer"
                    checked={Boolean(allVisibleSelected)}
                    onChange={() => onToggleSelectAll?.(visibleOriginalIndices)}
                  />
                </th>
              ) : null}
              <th className="atlas-th atlas-row-number atlas-th-num w-14">#</th>{columns.map((column) => {
                const isSorted = sortBy?.column === column;
                const arrow = isSorted ? (sortBy.direction === "asc" ? " ▲" : " ▼") : "";
                return (
                  <th
                    key={column}
                    className={`atlas-th ${sortable ? "atlas-th-sort" : ""} ${isSorted ? "atlas-th-sorted" : ""}`}
                    onClick={() => toggleSort(column)}
                    aria-sort={isSorted ? (sortBy.direction === "asc" ? "ascending" : "descending") : "none"}
                    tabIndex={sortable ? 0 : undefined}
                    onKeyDown={(event) => {
                      if (!sortable) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleSort(column);
                      }
                    }}
                  >
                    {column}
                    {arrow}
                  </th>
                );
              })}{actions ? (
                <th className="atlas-th atlas-th-actions w-44">Akcje</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {paginatedEntries.length === 0 ? (
              <tr>
                <td
                  className="atlas-td atlas-td-empty"
                  colSpan={Math.max(columns.length + (selectable ? 3 : 2), 1)}
                >
                  Brak danych.
                </td>
              </tr>
            ) : (
              paginatedEntries.map((entry, index) => {
                const { row, originalIndex } = entry;
                const isSelected = selectedIndices?.includes(originalIndex);
                return (
                  <tr
                    key={`${originalIndex}-${index}`}
                    className={`atlas-row ${isSelected ? "atlas-row-selected" : ""}`}
                  >
                    {selectable ? (
                      <td className="atlas-td atlas-td-check">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer"
                          checked={Boolean(isSelected)}
                          onChange={() => onToggleSelect?.(originalIndex)}
                        />
                      </td>
                    ) : null}
                    <td className="atlas-td atlas-td-num atlas-row-number">
                      {originalIndex + 1}
                    </td>
                    {columns.map((column) => {
                      const isEditing =
                        editingCell?.rowIndex === originalIndex &&
                        editingCell.column === column;
                      const value = row[column];
                      const isNumeric =
                        typeof value === "number" ||
                        (typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value));
                      const isBool = typeof value === "boolean";
                      return (
                        <td
                          key={column}
                          className={`atlas-td atlas-td-cell ${isNumeric ? "atlas-td-numeric" : ""} ${isBool ? "atlas-td-bool" : ""}`}
                          onDoubleClick={() =>
                            startCellEdit(originalIndex, column, value)
                          }
                        >
                          {isEditing ? (
                            <Input
                              autoFocus
                              className="h-8 min-w-40 font-mono text-xs"
                              value={cellValue}
                              onChange={(event) =>
                                setCellValue(event.target.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") finishCellEdit();
                                if (event.key === "Escape") setEditingCell(null);
                              }}
                              onBlur={() => setEditingCell(null)}
                            />
                          ) : (
                            <span
                              className={
                                editable
                                  ? "atlas-cell atlas-cell-editable"
                                  : "atlas-cell"
                              }
                            >
                              {value === null || value === undefined ? (
                                <span className="atlas-cell-null">NULL</span>
                              ) : isBool ? (
                                <span
                                  className={`atlas-pill ${value ? "atlas-pill-true" : "atlas-pill-false"}`}
                                >
                                  {value ? "true" : "false"}
                                </span>
                              ) : (
                                String(value)
                              )}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {actions ? (
                      <td className="atlas-td atlas-td-actions">
                        <div className="flex gap-2">
                          <Button
                            className="atlas-action-button h-8 px-2"
                            variant="edit"
                            title="Edytuj"
                            onClick={() => onEdit?.(row, originalIndex)}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            className="atlas-action-button h-8 px-2"
                            variant="success"
                            title="Duplikuj"
                            onClick={() => onDuplicate?.(row, originalIndex)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            className="atlas-action-button h-8 px-2"
                            variant="danger"
                            title="Usuń"
                            onClick={() => onDelete?.(originalIndex)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {virtualLimit ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Widok zoptymalizowany: pokazuję pierwsze {virtualLimit.toLocaleString("pl-PL")} z {sortedEntries.length.toLocaleString("pl-PL")} wierszy. Włącz paginację albo filtruj dane dla pełnego widoku.
        </div>
      ) : null}
      {paginated ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
          <div>
            Strona {safePage + 1} z {totalPages} · {sortedEntries.length} wierszy
          </div>
          <div className="flex items-center gap-2">
            <span>Wierszy na stronę:</span>
            <select
              className="h-8 rounded border border-zinc-700 bg-zinc-900 px-2 text-zinc-200"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
            <Button
              variant="secondary"
              className="h-8 px-3"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ‹
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-3"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              ›
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function LocalDbPanel({
  initialDatabases,
  initialView = EMPTY_SAVED_VIEW,
}: LocalDbPanelProps) {
  const savedView = initialView;
  const savedDatabase = initialDatabases.find(
    (database) => database.name === savedView.selectedDatabase,
  );
  const initialDatabase = savedDatabase ?? initialDatabases[0];
  const savedTable = initialDatabase?.tables.find(
    (table) => table.name === savedView.selectedTable,
  );
  const initialDatabaseName = initialDatabase?.name ?? "";
  const initialTableName =
    savedTable?.name ?? initialDatabase?.tables[0]?.name ?? "";
  const initialTab: Tab = "home";
  const [state, setState] = useState<ApiState>({ databases: initialDatabases });
  const [readOnly, setReadOnly] = useState(() =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("localdb-panel-readonly") === "true"
      : false,
  );
  const [dangerVerifyByName, setDangerVerifyByName] = useState(() =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("localdb-panel-verify-by-name") !== "false"
      : true,
  );
  const [themeId, setThemeId] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("localdb-panel-theme");
    if (stored) return stored;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  });
  const [compactMode, setCompactMode] = useState(() =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("localdb-panel-compact") === "true"
      : false,
  );
  const [showRowNumbers, setShowRowNumbers] = useState(() =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("localdb-panel-row-numbers") !== "false"
      : true,
  );
  const [autoRefresh, setAutoRefresh] = useState(() =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("localdb-panel-auto-refresh") === "true"
      : false,
  );
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(() => {
    if (typeof window === "undefined") return 30;
    const stored = Number(
      window.localStorage.getItem("localdb-panel-auto-refresh-interval"),
    );
    return Number.isFinite(stored) && stored >= 5 ? stored : 30;
  });
  const [confirmOnDelete, setConfirmOnDelete] = useState(() =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("localdb-panel-confirm-delete") !== "false"
      : true,
  );

  const toggleReadOnly = () => {
    const next = !readOnly;
    setReadOnly(next);
    window.localStorage.setItem("localdb-panel-readonly", String(next));
  };
  const toggleDangerVerify = () => {
    const next = !dangerVerifyByName;
    setDangerVerifyByName(next);
    window.localStorage.setItem("localdb-panel-verify-by-name", String(next));
  };
  const toggleCompactMode = () => {
    const next = !compactMode;
    setCompactMode(next);
    window.localStorage.setItem("localdb-panel-compact", String(next));
  };
  const toggleShowRowNumbers = () => {
    const next = !showRowNumbers;
    setShowRowNumbers(next);
    window.localStorage.setItem("localdb-panel-row-numbers", String(next));
  };
  const toggleAutoRefresh = () => {
    const next = !autoRefresh;
    setAutoRefresh(next);
    window.localStorage.setItem("localdb-panel-auto-refresh", String(next));
  };
  const toggleConfirmOnDelete = () => {
    const next = !confirmOnDelete;
    setConfirmOnDelete(next);
    window.localStorage.setItem("localdb-panel-confirm-delete", String(next));
  };
  const changeAutoRefreshInterval = (value: number) => {
    const safe = Math.max(5, Math.min(3600, Math.round(value)));
    setAutoRefreshInterval(safe);
    window.localStorage.setItem(
      "localdb-panel-auto-refresh-interval",
      String(safe),
    );
  };
  const changeTheme = (newId: string) => {
    setThemeId(newId);
    window.localStorage.setItem("localdb-panel-theme", newId);
  };
  const resetPreferences = () => {
    [
      "localdb-panel-readonly",
      "localdb-panel-verify-by-name",
      "localdb-panel-theme",
      "localdb-panel-compact",
      "localdb-panel-row-numbers",
      "localdb-panel-auto-refresh",
      "localdb-panel-auto-refresh-interval",
      "localdb-panel-confirm-delete",
    ].forEach((key) => window.localStorage.removeItem(key));
    setReadOnly(false);
    setDangerVerifyByName(true);
    setThemeId("zinc");
    setCompactMode(false);
    setShowRowNumbers(true);
    setAutoRefresh(false);
    setAutoRefreshInterval(30);
    setConfirmOnDelete(true);
  };
  const currentTheme = useMemo(
    () => THEMES.find((t) => t.id === themeId) || THEMES[0],
    [themeId],
  );
  const accentRgb = useMemo(
    () => hexToRgbTuple(currentTheme.accent),
    [currentTheme.accent],
  );
  const bgMainRgb = useMemo(
    () => hexToRgbTuple(currentTheme.bgMain),
    [currentTheme.bgMain],
  );
  const bgSideRgb = useMemo(
    () => hexToRgbTuple(currentTheme.bgSide),
    [currentTheme.bgSide],
  );
  const bgCardRgb = useMemo(
    () => hexToRgbTuple(currentTheme.bgCard),
    [currentTheme.bgCard],
  );
  const borderRgb = useMemo(
    () => hexToRgbTuple(currentTheme.border),
    [currentTheme.border],
  );
  const textMutedAdjusted = useMemo(
    () => adjustColorForContrast(currentTheme.textMuted, currentTheme.bgMain, 4.0),
    [currentTheme.textMuted, currentTheme.bgMain],
  );
  const successAdjusted = useMemo(
    () =>
      adjustColorForContrast(
        currentTheme.success ?? "#10b981",
        currentTheme.bgMain,
        4.0,
      ),
    [currentTheme.success, currentTheme.bgMain],
  );
  const warningAdjusted = useMemo(
    () =>
      adjustColorForContrast(
        currentTheme.warning ?? "#f59e0b",
        currentTheme.bgMain,
        4.0,
      ),
    [currentTheme.warning, currentTheme.bgMain],
  );
  const dangerAdjusted = useMemo(
    () =>
      adjustColorForContrast(
        currentTheme.danger ?? "#f43f5e",
        currentTheme.bgMain,
        4.0,
      ),
    [currentTheme.danger, currentTheme.bgMain],
  );
  const infoAdjusted = useMemo(
    () =>
      adjustColorForContrast(
        currentTheme.info ?? "#0ea5e9",
        currentTheme.bgMain,
        4.0,
      ),
    [currentTheme.info, currentTheme.bgMain],
  );
  const accentAdjusted = useMemo(
    () => adjustColorForContrast(currentTheme.accent, currentTheme.bgMain, 4.0),
    [currentTheme.accent, currentTheme.bgMain],
  );
  const successRgb = useMemo(
    () => hexToRgbTuple(successAdjusted),
    [successAdjusted],
  );
  const warningRgb = useMemo(
    () => hexToRgbTuple(warningAdjusted),
    [warningAdjusted],
  );
  const dangerRgb = useMemo(
    () => hexToRgbTuple(dangerAdjusted),
    [dangerAdjusted],
  );
  const infoRgb = useMemo(
    () => hexToRgbTuple(infoAdjusted),
    [infoAdjusted],
  );
  const isLightTheme = useMemo(
    () => isLightColor(currentTheme.bgMain),
    [currentTheme.bgMain],
  );
  const [selectedDatabase, setSelectedDatabase] = useState(initialDatabaseName);
  const [selectedTable, setSelectedTable] = useState(initialTableName);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [databaseName, setDatabaseName] = useState("");
  const [databaseNewName, setDatabaseNewName] = useState(initialDatabaseName);
  const [connectionForm, setConnectionForm] = useState(() => {
    const connection = initialDatabases[0]?.connection;
    return {
      host: connection?.host ?? "",
      port: connection ? String(connection.port) : "",
      databaseName: connection?.databaseName ?? "",
      username: connection?.username ?? "",
      password: connection?.password ?? "",
    };
  });
  const [showConnectionPassword, setShowConnectionPassword] = useState(false);
  const [exportDatabase, setExportDatabase] = useState(initialDatabaseName);
  const [tableName, setTableName] = useState("");
  const [renameTable, setRenameTable] = useState("");
  const [columns, setColumns] = useState(
    "id INT PRIMARY KEY AUTO_INCREMENT, name TEXT NOT NULL",
  );
  const [rowJson, setRowJson] = useState('{"name":"demo"}');
  const [insertValues, setInsertValues] = useState<Record<string, string>>({});
  const [insertNulls, setInsertNulls] = useState<Record<string, boolean>>({});
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, string>>(
    {},
  );
  const [editingNulls, setEditingNulls] = useState<Record<string, boolean>>({});
  const [sql, setSql] = useState("SHOW TABLES;\nSELECT * FROM users LIMIT 50;");
  const [importSqlText, setImportSqlText] = useState("");
  const [queryWhere, setQueryWhere] = useState("");
  const [queryLimit, setQueryLimit] = useState("100");
  const [metaName, setMetaName] = useState("");
  const [metaBody, setMetaBody] = useState("-- ciało obiektu SQL-like");
  const [metaSchedule, setMetaSchedule] = useState("EVERY 1 DAY");
  const [sqlResults, setSqlResults] = useState<SqlResult[]>([]);
  const [status, setStatus] = useState("Gotowy.");
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [consoleLog, setConsoleLog] = useState<ConsoleEntry[]>([]);
  const [healthStatus, setHealthStatus] = useState<{
    online: boolean;
    latencyMs: number | null;
    lastChecked: string | null;
  }>({ online: false, latencyMs: null, lastChecked: null });
  const [sidebarFilter, setSidebarFilter] = useState("");
  const [collapsedDatabases, setCollapsedDatabases] = useState<Set<string>>(
    () => new Set(),
  );
  const [propertiesTarget, setPropertiesTarget] = useState<{
    type: string;
    name: string;
    schema?: string;
  } | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const pushLogRef = React.useRef<
    ((level: ConsoleLevel, source: string, message: string, detail?: string) => void) | null
  >(null);

  const openProperties = (type: string, name: string, schema?: string) =>
    setPropertiesTarget({ type, name, schema });

  useEffect(() => {
    const root = document.documentElement.style;
    const isLight = isLightColor(currentTheme.bgMain);
    if (isLight) {
      document.documentElement.classList.add("atlas-light");
      document.documentElement.classList.remove("atlas-dark");
    } else {
      document.documentElement.classList.add("atlas-dark");
      document.documentElement.classList.remove("atlas-light");
    }
    root.setProperty("--bg-main", currentTheme.bgMain);
    root.setProperty("--bg-side", currentTheme.bgSide);
    root.setProperty("--bg-card", currentTheme.bgCard);
    root.setProperty("--border", currentTheme.border);
    root.setProperty("--text-main", currentTheme.textMain);
    root.setProperty("--text-muted", textMutedAdjusted);
    root.setProperty("--accent", accentAdjusted);
    root.setProperty("--accent-rgb", accentRgb);
    root.setProperty("--accent-text", currentTheme.accentText);
    root.setProperty("--bg-main-rgb", bgMainRgb);
    root.setProperty("--bg-side-rgb", bgSideRgb);
    root.setProperty("--bg-card-rgb", bgCardRgb);
    root.setProperty("--border-rgb", borderRgb);
    root.setProperty("--success", successAdjusted);
    root.setProperty("--success-rgb", successRgb);
    root.setProperty("--warning", warningAdjusted);
    root.setProperty("--warning-rgb", warningRgb);
    root.setProperty("--danger", dangerAdjusted);
    root.setProperty("--danger-rgb", dangerRgb);
    root.setProperty("--info", infoAdjusted);
    root.setProperty("--info-rgb", infoRgb);
  }, [
    currentTheme,
    textMutedAdjusted,
    accentAdjusted,
    accentRgb,
    bgMainRgb,
    bgSideRgb,
    bgCardRgb,
    borderRgb,
    successAdjusted,
    successRgb,
    warningAdjusted,
    warningRgb,
    dangerAdjusted,
    dangerRgb,
    infoAdjusted,
    infoRgb,
  ]);  useEffect(() => {
    function handleGlobalShortcuts(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setGlobalSearchOpen(true);
        return;
      }
      if (event.key === "Escape") {
        if (globalSearchOpen) {
          event.preventDefault();
          setGlobalSearchOpen(false);
          return;
        }
        if (propertiesTarget) {
          event.preventDefault();
          setPropertiesTarget(null);
          return;
        }
      }
      if (!isTyping && event.key === "?") {
        event.preventDefault();
        setActiveTab("settings");
      }
    }
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [globalSearchOpen, propertiesTarget]);

  function toggleDatabaseCollapsed(name: string) {
    setCollapsedDatabases((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(
    null,
  );

  const currentDatabase = useMemo(
    () =>
      state.databases.find((database) => database.name === selectedDatabase),
    [selectedDatabase, state.databases],
  );
  const currentTable = useMemo(
    () => currentDatabase?.tables.find((table) => table.name === selectedTable),
    [currentDatabase, selectedTable],
  );
  const exportDb = exportDatabase || selectedDatabase;
  const stats = useMemo(() => {
    const tables = state.databases.flatMap((database) => database.tables);
    const rows = tables.reduce((sum, table) => sum + table.rows.length, 0);
    const columnsCount = tables.reduce(
      (sum, table) => sum + table.columns.length,
      0,
    );
    const routines = state.databases.reduce(
      (sum, database) => sum + database.routines.length,
      0,
    );
    const events = state.databases.reduce(
      (sum, database) => sum + database.events.length,
      0,
    );
    const triggers = state.databases.reduce(
      (sum, database) => sum + database.triggers.length,
      0,
    );
    const tracking = state.databases.reduce(
      (sum, database) => sum + database.tracking.length,
      0,
    );
    const indexes = tables.reduce(
      (sum, table) =>
        sum +
        table.indexes.length +
        table.columns.filter((column) => column.indexed || column.primaryKey)
          .length,
      0,
    );
    return {
      databases: state.databases.length,
      tables: tables.length,
      rows,
      columns: columnsCount,
      routines,
      events,
      triggers,
      tracking,
      indexes,
    };
  }, [state.databases]);
  const filteredSidebarDatabases = useMemo(() => {
    const needle = sidebarFilter.trim().toLowerCase();
    if (!needle)
      return state.databases.map((database) => ({
        database,
        matchedTables: [] as LocalDbTable[],
      }));
    return state.databases
      .map((database) => {
        const dbMatch = database.name.toLowerCase().includes(needle);
        const matchedTables = database.tables.filter((table) =>
          table.name.toLowerCase().includes(needle),
        );
        if (!dbMatch && matchedTables.length === 0) return null;
        return { database, matchedTables };
      })
      .filter((entry): entry is { database: LocalDatabase; matchedTables: LocalDbTable[] } => entry !== null);
  }, [state.databases, sidebarFilter]);
  const filteredRowEntries = useMemo(() => {
    if (!currentTable) return [];
    const normalizedFilter = filter.toLowerCase();
    return currentTable.rows
      .map((row, index) => ({ row, index }))
      .filter(
        ({ row }) =>
          !filter.trim() ||
          Object.values(row).some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(normalizedFilter),
          ),
      );
  }, [currentTable, filter]);
  const filteredRows = filteredRowEntries.map((entry) => entry.row);
  const filteredRowIndices = filteredRowEntries.map((entry) => entry.index);
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);  useEffect(() => {
    setSelectedRowIndices([]);
  }, [selectedDatabase, selectedTable]);

  function toggleSelectRow(index: number) {
    setSelectedRowIndices((current) =>
      current.includes(index)
        ? current.filter((value) => value !== index)
        : [...current, index],
    );
  }

  function toggleSelectAllRows(visibleIndices: number[]) {
    setSelectedRowIndices((current) => {
      const allSelected = visibleIndices.every((index) =>
        current.includes(index),
      );
      if (allSelected) {
        return current.filter((index) => !visibleIndices.includes(index));
      }
      const merged = new Set(current);
      visibleIndices.forEach((index) => merged.add(index));
      return Array.from(merged);
    });
  }  useEffect(() => {
    if (!activeTab || (activeTab !== "home" && !selectedDatabase)) return;
    writeSavedView({ activeTab, selectedDatabase, selectedTable });
  }, [activeTab, selectedDatabase, selectedTable]);  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      void refresh(selectedDatabase, selectedTable);
    }, autoRefreshInterval * 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, autoRefreshInterval, selectedDatabase, selectedTable]);  useEffect(() => {
    let cancelled = false;
    async function checkHealth() {
      const startedAt = Date.now();
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        const latencyMs = Date.now() - startedAt;
        if (cancelled) return;
        const online = response.ok;
        setHealthStatus((current) => {
          if (current.online !== online) {
            pushLogRef.current?.(
              online ? "success" : "error",
              "health",
              online ? "Połączenie z API przywrócone." : "Brak połączenia z API.",
              `HTTP ${response.status} · ${latencyMs} ms`,
            );
          }
          return {
            online,
            latencyMs,
            lastChecked: new Date().toISOString(),
          };
        });
      } catch (error) {
        if (cancelled) return;
        setHealthStatus((current) => {
          if (current.online) {
            pushLogRef.current?.(
              "error",
              "health",
              "Błąd połączenia z API.",
              error instanceof Error ? error.message : undefined,
            );
          }
          return {
            online: false,
            latencyMs: null,
            lastChecked: new Date().toISOString(),
          };
        });
      }
    }
    void checkHealth();
    const id = window.setInterval(checkHealth, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  function closeToast(id: string) {
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id ? { ...toast, exiting: true } : toast,
      ),
    );
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      180,
    );
  }

  function pushToast(
    title: string,
    message = "",
    type: Toast["type"] = "info",
  ) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((current) =>
      [{ id, title, message, type }, ...current].slice(0, 5),
    );
    window.setTimeout(() => closeToast(id), 4500);
  }

  const pushLog = React.useCallback(
    (
      level: ConsoleLevel,
      source: string,
      message: string,
      detail?: string,
    ) => {
      setConsoleLog((current) => {
        const entry: ConsoleEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: new Date().toISOString(),
          level,
          source,
          message,
          detail,
        };
        return [entry, ...current].slice(0, 500);
      });
    },
    [],
  );  useEffect(() => {
    pushLogRef.current = pushLog;
  }, [pushLog]);

  function askConfirm(options: Omit<ConfirmDialogState, "resolve">) {
    const requireName =
      options.requireName ??
      (dangerVerifyByName && options.danger
        ? selectedTable || selectedDatabase || undefined
        : undefined);
    return new Promise<boolean>((resolve) =>
      setConfirmDialog({ ...options, requireName, resolve }),
    );
  }

  function closeConfirm(value: boolean) {
    confirmDialog?.resolve(value);
    setConfirmDialog(null);
  }

  async function refresh(
    nextDatabase = selectedDatabase,
    nextTable = selectedTable,
  ) {
    const data = await api<ApiState>("/api/databases");
    setState(data);
    const databaseExists = data.databases.some(
      (database) => database.name === nextDatabase,
    );
    const chosenDatabase = databaseExists
      ? nextDatabase
      : (data.databases[0]?.name ?? "");
    const database = data.databases.find(
      (item) => item.name === chosenDatabase,
    );
    const tableExists = database?.tables.some(
      (table) => table.name === nextTable,
    );
    setSelectedDatabase(chosenDatabase);
    setExportDatabase(chosenDatabase);
    setSelectedTable(
      tableExists ? nextTable : (database?.tables[0]?.name ?? ""),
    );
  }

  async function runAction(
    action: () => Promise<void>,
    success: string,
    options: { mutates?: boolean } = {},
  ) {
    if (readOnly && options.mutates !== false) {
      const message = "Tryb tylko do odczytu jest aktywny.";
      setStatus(message);
      pushToast("Blokada", message, "info");
      pushLog("warn", "guard", message);
      return;
    }
    setIsLoading(true);
    setStatus("Pracuję...");
    const startedAt = Date.now();
    try {
      await action();
      const duration = Date.now() - startedAt;
      setStatus(success);
      pushToast("Gotowe", success, "success");
      pushLog("success", "action", success, `czas: ${duration} ms`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nieznany błąd.";
      setStatus(message);
      pushToast("Błąd", message, "error");
      pushLog("error", "action", message, error instanceof Error ? error.stack : undefined);
    } finally {
      setIsLoading(false);
    }
  }

  function isReadOnlySql(sqlText: string) {
    return sqlText
      .split(";")
      .map((statement) => statement.trim())
      .filter(Boolean)
      .every((statement) =>
        /^(SELECT|SHOW|DESC|DESCRIBE|USE)\b/i.test(statement),
      );
  }

  async function runSql(sqlText = sql) {
    const data = await api<{ results: SqlResult[] }>("/api/sql", {
      method: "POST",
      body: JSON.stringify({ databaseName: selectedDatabase, sql: sqlText }),
    });
    setSqlResults(data.results);
    await refresh(selectedDatabase, selectedTable);
  }

  async function downloadExport(
    scope: "database" | "table",
    options: { format?: "sql" | "json" | "zip" | "csv"; exportType?: "schema" | "data" | "all" } = {},
  ) {
    const format = options.format ?? "sql";
    const exportType = options.exportType ?? "all";
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        databaseName: exportDb,
        tableName: scope === "table" ? selectedTable : undefined,
        format,
        exportType,
      }),
    });
    if (!response.ok) throw new Error("Eksport nie powiódł się.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const tableSuffix = scope === "table" && selectedTable ? `_${selectedTable}` : "";
    link.download = `${exportDb}${tableSuffix}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file?: File) {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".sql")) {
      setImportSqlText(await file.text());
      return;
    }
    if (lower.endsWith(".json")) {
      setImportSqlText(await file.text());
      return;
    }
    if (lower.endsWith(".csv")) {
      setImportSqlText(await file.text());
      return;
    }
    throw new Error("Wybierz plik .sql, .json lub .csv.");
  }

  async function importCsvIntoTable(file: File) {
    if (!selectedDatabase || !selectedTable || !currentTable) {
      throw new Error("Wybierz bazę i tabelę przed importem CSV.");
    }
    const text = await file.text();
    const result = await api<{ importedRows?: number; message?: string }>("/api/import", {
      method: "POST",
      body: JSON.stringify({
        databaseName: selectedDatabase,
        tableName: selectedTable,
        csvString: text,
        mode: "append",
      }),
    });
    await refresh(selectedDatabase, selectedTable);
    return result.importedRows ?? 0;
  }

  async function saveMetadata(
    type: MetadataType,
    extra: Record<string, unknown> = {},
  ) {
    await api("/api/metadata", {
      method: "POST",
      body: JSON.stringify({
        databaseName: selectedDatabase,
        type,
        payload: {
          name: metaName,
          body: metaBody,
          schedule: metaSchedule,
          tableName: selectedTable,
          ...extra,
        },
      }),
    });
    await refresh(selectedDatabase, selectedTable);
  }

  function selectDatabase(database: LocalDatabase) {
    setSelectedDatabase(database.name);
    setExportDatabase(database.name);
    setSelectedTable(database.tables[0]?.name ?? "");
    setDatabaseNewName(database.name);
    setConnectionForm({
      host: database.connection.host,
      port: String(database.connection.port),
      databaseName: database.connection.databaseName,
      username: database.connection.username,
      password: database.connection.password,
    });
    setShowConnectionPassword(false);
    setActiveTab("database");
  }

  function selectTable(databaseName: string, nextTable: string) {
    setSelectedDatabase(databaseName);
    setExportDatabase(databaseName);
    setSelectedTable(nextTable);
    setActiveTab("browse");
  }

  async function renameSelectedDatabase() {
    await api("/api/databases", {
      method: "PATCH",
      body: JSON.stringify({
        name: selectedDatabase,
        newName: databaseNewName,
      }),
    });
    await refresh(databaseNewName, "");
    setActiveTab("database");
  }

  function randomPassword(length = 24) {
    const alphabet =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=?";
    const cryptoApi = window.crypto;
    const values = new Uint32Array(length);
    cryptoApi.getRandomValues(values);
    return Array.from(
      values,
      (value) => alphabet[value % alphabet.length],
    ).join("");
  }

  async function saveConnection() {
    await api("/api/databases", {
      method: "PATCH",
      body: JSON.stringify({
        name: selectedDatabase,
        connection: { ...connectionForm, port: Number(connectionForm.port) },
      }),
    });
    await refresh(selectedDatabase, selectedTable);
  }

  function connectionCallback() {
    if (!currentDatabase) return "";
    const connection = currentDatabase.connection;
    return `localdb://${encodeURIComponent(connection.username)}:${encodeURIComponent(connection.password)}@${connection.host}:${connection.port}/${encodeURIComponent(connection.databaseName)}`;
  }

  async function copyConnectionCallback() {
    const callback = connectionCallback();
    if (!callback) throw new Error("Brak danych połączenia.");
    await navigator.clipboard.writeText(callback);
  }

  async function deleteSelectedDatabase() {
    if (
      !(await askConfirm({
        title: "Usunąć bazę?",
        message: `Baza ${selectedDatabase} zostanie usunięta bezpowrotnie razem z tabelami i danymi.`,
        confirmLabel: "Usuń bazę",
        danger: true,
      }))
    )
      throw new Error("Anulowano usuwanie bazy.");
    await api("/api/databases", {
      method: "DELETE",
      body: JSON.stringify({ name: selectedDatabase }),
    });
    await refresh("", "");
    setActiveTab("home");
  }

  async function truncateAllTables() {
    if (!currentDatabase) return;
    if (
      !(await askConfirm({
        title: "Wyczyścić wszystkie tabele?",
        message: `Wszystkie rekordy w bazie ${currentDatabase.name} zostaną usunięte, ale struktura tabel zostanie.`,
        confirmLabel: "Wyczyść",
        danger: true,
      }))
    )
      throw new Error("Anulowano czyszczenie bazy.");
    for (const table of currentDatabase.tables)
      await api("/api/operations", {
        method: "POST",
        body: JSON.stringify({
          databaseName: currentDatabase.name,
          tableName: table.name,
          operation: "truncate",
        }),
      });
    await refresh(currentDatabase.name, selectedTable);
  }

  async function dropAllTables() {
    if (!currentDatabase) return;
    if (
      !(await askConfirm({
        title: "Usunąć wszystkie tabele?",
        message: `Wszystkie tabele w bazie ${currentDatabase.name} zostaną usunięte bezpowrotnie.`,
        confirmLabel: "Usuń tabele",
        danger: true,
      }))
    )
      throw new Error("Anulowano usuwanie tabel.");
    for (const table of currentDatabase.tables)
      await api("/api/operations", {
        method: "POST",
        body: JSON.stringify({
          databaseName: currentDatabase.name,
          tableName: table.name,
          operation: "drop",
        }),
      });
    await refresh(currentDatabase.name, "");
    setActiveTab("database");
  }

  function parseInsertValue(type: string, value: string, isNull: boolean) {
    if (isNull) return null;
    if (value.trim() === "") return undefined;
    const meta = COLUMN_TYPES.find((item) => item.name === type);
    if (!meta) return value;
    switch (meta.category) {
      case "integer":
      case "year":
        return Number.parseInt(value, 10);
      case "decimal":
        return Number.parseFloat(value);
      case "boolean":
        return ["true", "1", "tak", "yes", "on", "t"].includes(
          value.toLowerCase(),
        );
      default:
        return value;
    }
  }

  async function insertFormRow() {
    if (!currentTable) return;
    const values = Object.fromEntries(
      currentTable.columns.flatMap((column) => {
        const value = parseInsertValue(
          column.type,
          insertValues[column.name] ?? "",
          Boolean(insertNulls[column.name]),
        );
        if (value === undefined) return [];
        return [[column.name, value]];
      }),
    );
    await api("/api/rows", {
      method: "POST",
      body: JSON.stringify({
        databaseName: selectedDatabase,
        tableName: selectedTable,
        values,
      }),
    });
    setInsertValues({});
    setInsertNulls({});
    await refresh(selectedDatabase, selectedTable);
    setActiveTab("browse");
  }

  function editRow(row: LocalDbRow, index: number) {
    setEditingRowIndex(index);
    setEditingValues(
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          value === null ? "" : String(value),
        ]),
      ),
    );
    setEditingNulls(
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, value === null]),
      ),
    );
    setActiveTab("browse");
  }

  async function saveEditedRow() {
    if (!currentTable || editingRowIndex === null) return;
    const values = Object.fromEntries(
      currentTable.columns.flatMap((column) => {
        const value = parseInsertValue(
          column.type,
          editingValues[column.name] ?? "",
          Boolean(editingNulls[column.name]),
        );
        if (value === undefined) return [];
        return [[column.name, value]];
      }),
    );
    await api("/api/rows", {
      method: "PATCH",
      body: JSON.stringify({
        databaseName: selectedDatabase,
        tableName: selectedTable,
        rowIndex: editingRowIndex,
        values,
      }),
    });
    setEditingRowIndex(null);
    setEditingValues({});
    setEditingNulls({});
    await refresh(selectedDatabase, selectedTable);
  }

  async function deleteSelectedRow(index: number) {
    if (
      confirmOnDelete &&
      !(await askConfirm({
        title: "Usunąć rekord?",
        message: "Ten rekord zostanie usunięty z tabeli.",
        confirmLabel: "Usuń rekord",
        danger: true,
      }))
    )
      return;
    await runAction(async () => {
      await api("/api/rows", {
        method: "DELETE",
        body: JSON.stringify({
          databaseName: selectedDatabase,
          tableName: selectedTable,
          rowIndex: index,
        }),
      });
      await refresh(selectedDatabase, selectedTable);
    }, "Wiersz usunięty.");
  }

  async function duplicateSelectedRow(row: LocalDbRow) {
    const values = { ...row };
    currentTable?.columns.forEach((column) => {
      if (column.autoIncrement) delete values[column.name];
    });
    await runAction(async () => {
      await api("/api/rows", {
        method: "POST",
        body: JSON.stringify({
          databaseName: selectedDatabase,
          tableName: selectedTable,
          values,
        }),
      });
      await refresh(selectedDatabase, selectedTable);
    }, "Wiersz zduplikowany.");
  }

  async function saveInlineCell(
    rowIndex: number,
    columnName: string,
    value: string,
  ) {
    const column = currentTable?.columns.find(
      (item) => item.name === columnName,
    );
    if (!column) return;
    await runAction(async () => {
      const parsed =
        value.toUpperCase() === "NULL"
          ? null
          : parseInsertValue(column.type, value, false);
      await api("/api/rows", {
        method: "PATCH",
        body: JSON.stringify({
          databaseName: selectedDatabase,
          tableName: selectedTable,
          rowIndex,
          values: { [columnName]: parsed },
        }),
      });
      await refresh(selectedDatabase, selectedTable);
    }, "Komórka zaktualizowana.");
  }

  async function copyVisibleRows() {
    if (!currentTable) return;
    await navigator.clipboard.writeText(JSON.stringify(filteredRows, null, 2));
  }

  function exportVisibleRows(format: "json" | "csv") {
    if (!currentTable) return;
    const columns = currentTable.columns.map((column) => column.name);
    if (format === "json")
      downloadText(
        `${selectedDatabase}-${selectedTable}.json`,
        JSON.stringify(filteredRows, null, 2),
        "application/json",
      );
    else
      downloadText(
        `${selectedDatabase}-${selectedTable}.csv`,
        toCsv(columns, filteredRows),
        "text/csv",
      );
  }

  function exportSelectedRows(format: "json" | "csv") {
    if (!currentTable || selectedRowIndices.length === 0) return;
    const columns = currentTable.columns.map((column) => column.name);
    const rows = selectedRowIndices
      .map((index) => currentTable.rows[index])
      .filter((row): row is LocalDbRow => Boolean(row));
    if (format === "json")
      downloadText(
        `${selectedDatabase}-${selectedTable}-selected.json`,
        JSON.stringify(rows, null, 2),
        "application/json",
      );
    else
      downloadText(
        `${selectedDatabase}-${selectedTable}-selected.csv`,
        toCsv(columns, rows),
        "text/csv",
      );
  }

  async function bulkDeleteSelected() {
    if (!selectedDatabase || !selectedTable || selectedRowIndices.length === 0)
      return;
    if (
      !(await askConfirm({
        title: "Usunąć zaznaczone wiersze?",
        message: `Zostanie usuniętych ${selectedRowIndices.length} wierszy z tabeli ${selectedTable}.`,
        confirmLabel: "Usuń",
        danger: true,
      }))
    )
      return;
    await runAction(async () => {
      await api("/api/bulk", {
        method: "POST",
        body: JSON.stringify({
          databaseName: selectedDatabase,
          tableName: selectedTable,
          type: "delete",
          rowIndexes: [...selectedRowIndices].sort((a, b) => b - a),
        }),
      });
      setSelectedRowIndices([]);
      await refresh(selectedDatabase, selectedTable);
    }, `Usunięto ${selectedRowIndices.length} wierszy.`);
  }

  const tableTabs = [
    { id: "browse" as Tab, label: "Przeglądaj", icon: Table2 },
    { id: "structure" as Tab, label: "Struktura", icon: Database },
    { id: "search" as Tab, label: "Szukaj", icon: Search },
    { id: "insert" as Tab, label: "Wstaw", icon: Plus },
  ];

  const adminTabs: { id: Tab; label: string }[] = [
    { id: "database", label: "Baza danych" },
    { id: "dashboard", label: "Dashboard" },
    { id: "erd", label: "ERD" },
    { id: "diff", label: "Diff" },
    { id: "schemas", label: "Schematy" },
    { id: "views", label: "Widoki" },
    { id: "mviews", label: "Mat. widoki" },
    { id: "sequences", label: "Sekwencje" },
    { id: "domains", label: "Domeny" },
    { id: "types", label: "Typy" },
    { id: "rules", label: "Reguły" },
    { id: "sql", label: "SQL" },
    { id: "query", label: "Zapytanie" },
    { id: "export", label: "Eksport" },
    { id: "import", label: "Import" },
    { id: "backup", label: "Backup" },
    { id: "operations", label: "Operacje" },
    { id: "routines", label: "Procedury i funkcje" },
    { id: "events", label: "Zdarzenia" },
    { id: "jobs", label: "Joby" },
    { id: "triggers", label: "Wyzwalacze" },
    { id: "tracking", label: "Śledzenie" },
    { id: "console", label: "Konsola" },
  ];

  return (
    <main className={`atlas-root flex h-screen bg-zinc-900 text-zinc-200${compactMode ? " atlas-compact" : ""}${showRowNumbers ? "" : " atlas-no-row-numbers"}${isLightTheme ? " atlas-light" : " atlas-dark"}`}>
      <style>{`
;
          --bg-side: ${currentTheme.bgSide};
          --bg-card: ${currentTheme.bgCard};
          --border: ${currentTheme.border};
          --text-main: ${currentTheme.textMain};
          --text-muted: ${textMutedAdjusted};
          --accent: ${accentAdjusted};
          --accent-rgb: ${accentRgb};
          --accent-text: ${currentTheme.accentText};
          --bg-main-rgb: ${bgMainRgb};
          --bg-side-rgb: ${bgSideRgb};
          --bg-card-rgb: ${bgCardRgb};
          --border-rgb: ${borderRgb};
          --success: ${successAdjusted};
          --success-rgb: ${successRgb};
          --warning: ${warningAdjusted};
          --warning-rgb: ${warningRgb};
          --danger: ${dangerAdjusted};
          --danger-rgb: ${dangerRgb};
          --info: ${infoAdjusted};
          --info-rgb: ${infoRgb};
        }
        .bg-zinc-900 { background-color: var(--bg-main) !important; }
        .bg-zinc-950 { background-color: var(--bg-side) !important; }
        .bg-zinc-850 { background-color: var(--bg-card) !important; }
        .bg-zinc-800 { background-color: var(--bg-card) !important; }
        .bg-zinc-700 { background-color: var(--border) !important; }
        .bg-zinc-600 { background-color: var(--border) !important; }
        [class*="bg-zinc-900\\/"] { background-color: rgba(var(--bg-main-rgb), 0.85) !important; }
        [class*="bg-zinc-950\\/"] { background-color: rgba(var(--bg-side-rgb), 0.85) !important; }
        [class*="bg-zinc-800\\/"] { background-color: rgba(var(--bg-card-rgb), 0.85) !important; }
        [class*="bg-zinc-700\\/"] { background-color: rgba(var(--border-rgb), 0.85) !important; }
        .hover\\:bg-zinc-700:hover { background-color: rgba(var(--accent-rgb), 0.12) !important; color: var(--text-main) !important; }
        .hover\\:bg-zinc-600:hover { background-color: rgba(var(--accent-rgb), 0.18) !important; color: var(--text-main) !important; }
        [class*="hover\\:bg-zinc-800\\/"]:hover { background-color: rgba(var(--accent-rgb), 0.12) !important; color: var(--text-main) !important; }
        [class*="group-hover\\:bg-zinc-700"], .group:hover .group-hover\\:bg-zinc-700 { background-color: rgba(var(--accent-rgb), 0.18) !important; color: var(--text-main) !important; }
        .border-zinc-700 { border-color: var(--border) !important; }
        .border-zinc-800 { border-color: var(--border) !important; }
        .border-zinc-600 { border-color: var(--border) !important; 
        } 
        .hover\\:border-zinc-500:hover { border-color: var(--accent) !important; box-shadow: 0 0 0 1px var(--accent) !important; }
        .hover\\:border-zinc-500:hover svg { color: var(--accent) !important; }
        .divide-zinc-700 > * + * { border-color: var(--border) !important; }
        .divide-zinc-800 > * + * { border-color: var(--border) !important; }
        .text-zinc-200 { color: var(--text-main) !important; }
        .text-zinc-100 { color: var(--text-main) !important; }
        .text-zinc-50 { color: var(--text-main) !important; }
        .text-zinc-300 { color: var(--text-main) !important; }
        .bg-zinc-300 { background-color: rgba(var(--accent-rgb), 0.18) !important; color: var(--accent) !important; }
        .bg-zinc-100 { background-color: rgba(var(--accent-rgb), 0.18) !important; color: var(--accent) !important; }
        .hover\\:bg-zinc-300:hover { background-color: rgba(var(--accent-rgb), 0.28) !important; }
        .hover\\:text-zinc-950:hover { color: var(--accent) !important; }
        .text-zinc-950 { color: var(--accent) !important; }
        .hover\\:bg-zinc-800:hover { background-color: rgba(var(--accent-rgb), 0.10) !important; color: var(--text-main) !important; }
        .border-zinc-300 { border-color: rgba(var(--accent-rgb), 0.45) !important; }
        .atlas-sidebar .bg-zinc-300 { background-color: rgba(var(--accent-rgb), 0.14) !important; color: var(--accent) !important; }
        .atlas-sidebar .border-zinc-300 { border-color: rgba(var(--accent-rgb), 0.25) !important; }
        .text-zinc-400 { color: var(--text-muted) !important; }
        .text-zinc-500 { color: var(--text-muted) !important; }
        .text-zinc-600 { color: var(--text-muted) !important; }
        .text-zinc-700 { color: var(--text-muted) !important; }

        /* Light themes — wymuś mocniejsze kontrasty drobnych tekstów */
        .atlas-light .text-zinc-400 { color: color-mix(in srgb, var(--text-main) 70%, var(--text-muted)) !important; }
        .atlas-light .text-zinc-500 { color: color-mix(in srgb, var(--text-main) 60%, var(--text-muted)) !important; }
        .atlas-light .text-zinc-600 { color: color-mix(in srgb, var(--text-main) 75%, var(--text-muted)) !important; }
        .atlas-light .text-zinc-700 { color: var(--text-main) !important; }
        .atlas-light .atlas-cell-null { color: color-mix(in srgb, var(--text-main) 55%, var(--text-muted)) !important; }
        .atlas-light .atlas-table .atlas-td-num { color: color-mix(in srgb, var(--text-main) 55%, var(--text-muted)) !important; }
        .atlas-light .atlas-table .atlas-th { color: color-mix(in srgb, var(--text-main) 90%, transparent) !important; }
        .atlas-light input, .atlas-light textarea, .atlas-light select { color: var(--text-main) !important; }
        .atlas-light input::placeholder, .atlas-light textarea::placeholder { color: color-mix(in srgb, var(--text-main) 50%, var(--text-muted)) !important; opacity: 1 !important; }

        /* === Status: success (emerald) === */
        .text-emerald-100, .text-emerald-200, .text-emerald-300, .text-emerald-400, .text-green-100, .text-green-200, .text-green-300, .text-green-400 { color: var(--success) !important; }
        .bg-emerald-400, .bg-emerald-500, .bg-emerald-600, .bg-green-500 { background-color: var(--success) !important; color: var(--accent-text) !important; 
        } 
        .hover\\:bg-emerald-500:hover { background-color: var(--success) !important; color: var(--accent-text) !important; filter: brightness(1.15); box-shadow: 0 0 0 2px rgba(var(--success-rgb), 0.5) !important; }
        .bg-emerald-950, .bg-green-950 { background-color: rgba(var(--success-rgb), 0.12) !important; }
        .border-emerald-500, .border-emerald-700, .border-green-500, .border-green-700 { border-color: rgba(var(--success-rgb), 0.55) !important; }
        .hover\\:border-emerald-500:hover { border-color: rgba(var(--success-rgb), 0.75) !important; }
        [class*="bg-emerald-500\\/"], [class*="bg-emerald-400\\/"], [class*="bg-green-500\\/"] { background-color: rgba(var(--success-rgb), 0.18) !important; }
        [class*="bg-emerald-500\\/15"], [class*="bg-emerald-500\\/20"] { background-color: rgba(var(--success-rgb), 0.18) !important; }
        [class*="border-emerald-500\\/"], [class*="border-green-500\\/"] { border-color: rgba(var(--success-rgb), 0.4) !important; }

        /* === Status: warning (amber) === */
        .text-amber-300, .text-amber-400, .text-yellow-300, .text-yellow-400, .text-orange-400 { color: var(--warning) !important; }
        .bg-amber-500, .bg-yellow-500 { background-color: var(--warning) !important; color: var(--accent-text) !important; }
        .bg-amber-950, .bg-yellow-950 { background-color: rgba(var(--warning-rgb), 0.12) !important; }
        .border-amber-500, .border-amber-700, .border-yellow-500, .border-yellow-700 { border-color: rgba(var(--warning-rgb), 0.55) !important; }
        [class*="bg-amber-500\\/"], [class*="bg-yellow-500\\/"] { background-color: rgba(var(--warning-rgb), 0.18) !important; }
        [class*="border-amber-500\\/"], [class*="border-yellow-500\\/"] { border-color: rgba(var(--warning-rgb), 0.4) !important; }

        /* === Status: danger (rose / red) === */
        .text-rose-200, .text-rose-300, .text-rose-400, .text-red-100, .text-red-200, .text-red-300, .text-red-400 { color: var(--danger) !important; }
        .bg-rose-400, .bg-rose-500, .bg-red-500, .bg-red-600 { background-color: var(--danger) !important; color: var(--accent-text) !important; 
        } 
        .hover\\:bg-red-500:hover, .hover\\:bg-rose-500:hover { background-color: var(--danger) !important; color: var(--accent-text) !important; filter: brightness(1.15); box-shadow: 0 0 0 2px rgba(var(--danger-rgb), 0.5) !important; }
        .bg-rose-950, .bg-red-950 { background-color: rgba(var(--danger-rgb), 0.12) !important; }
        .border-rose-500, .border-red-500, .border-red-700, .border-rose-700 { border-color: rgba(var(--danger-rgb), 0.55) !important; }
        [class*="bg-rose-500\\/"], [class*="bg-red-500\\/"] { background-color: rgba(var(--danger-rgb), 0.18) !important; }
        [class*="border-rose-500\\/"], [class*="border-red-500\\/"] { border-color: rgba(var(--danger-rgb), 0.4) !important; }

        /* === Status: info (sky / cyan) === */
        .text-sky-300, .text-sky-400, .text-cyan-300, .text-cyan-400, .text-blue-300, .text-blue-400 { color: var(--info) !important; }
        .bg-sky-500, .bg-cyan-500, .bg-blue-500, .bg-blue-600 { background-color: var(--info) !important; color: var(--accent-text) !important; 
        } 
        .hover\\:bg-blue-500:hover, .hover\\:bg-sky-500:hover { background-color: var(--info) !important; color: var(--accent-text) !important; filter: brightness(1.15); box-shadow: 0 0 0 2px rgba(var(--info-rgb), 0.5) !important; }
        .border-sky-500, .border-cyan-500, .border-blue-500 { border-color: rgba(var(--info-rgb), 0.55) !important; }
        [class*="bg-sky-500\\/"], [class*="bg-cyan-500\\/"], [class*="bg-blue-500\\/"] { background-color: rgba(var(--info-rgb), 0.18) !important; }

        /* === Decorative accents (violet/fuchsia/orange/lime) → accent === */
        .text-violet-400, .text-fuchsia-400, .text-purple-400, .text-pink-400, .text-indigo-400 { color: var(--accent) !important; }

        /* Light themes — przyciemnij paletę statusów aby była czytelna na białym tle */
        .atlas-light .text-emerald-100,
        .atlas-light .text-emerald-200,
        .atlas-light .text-emerald-300,
        .atlas-light .text-emerald-400,
        .atlas-light .text-green-100,
        .atlas-light .text-green-200,
        .atlas-light .text-green-300,
        .atlas-light .text-green-400 { color: color-mix(in srgb, var(--success) 78%, black) !important; }
        .atlas-light .text-amber-300,
        .atlas-light .text-amber-400,
        .atlas-light .text-yellow-300,
        .atlas-light .text-yellow-400,
        .atlas-light .text-orange-400 { color: color-mix(in srgb, var(--warning) 70%, black) !important; }
        .atlas-light .text-rose-200,
        .atlas-light .text-rose-300,
        .atlas-light .text-rose-400,
        .atlas-light .text-red-100,
        .atlas-light .text-red-200,
        .atlas-light .text-red-300,
        .atlas-light .text-red-400 { color: color-mix(in srgb, var(--danger) 78%, black) !important; }
        .atlas-light .text-sky-300,
        .atlas-light .text-sky-400,
        .atlas-light .text-cyan-300,
        .atlas-light .text-cyan-400,
        .atlas-light .text-blue-300,
        .atlas-light .text-blue-400 { color: color-mix(in srgb, var(--info) 78%, black) !important; }
        .atlas-light .text-violet-400,
        .atlas-light .text-fuchsia-400,
        .atlas-light .text-purple-400,
        .atlas-light .text-pink-400,
        .atlas-light .text-indigo-400 { color: color-mix(in srgb, var(--accent) 80%, black) !important; }

        body { background: var(--bg-main); color: var(--text-main); }

        /* === Tables — atlas-table look === */
        .atlas-table-wrap {
          background: var(--bg-card);
          border: 1px solid var(--border);
          box-shadow: 0 1px 0 rgba(var(--border-rgb), 0.4);
        }
        .atlas-table {
          background: var(--bg-card);
          color: var(--text-main);
        }
        .atlas-table .atlas-th {
          position: sticky;
          top: 0;
          z-index: 5;
          background: var(--bg-side);
          color: var(--text-main);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border);
          border-right: 1px solid rgba(var(--border-rgb), 0.5);
          text-align: left;
          white-space: nowrap;
        }
        .atlas-table .atlas-th:last-child { border-right: 0; }
        .atlas-table .atlas-th-num,
        .atlas-table .atlas-th-check { text-align: center; }
        .atlas-table .atlas-th-actions { text-align: right; }
        .atlas-table .atlas-th-sort {
          cursor: pointer;
          user-select: none;
        }
        .atlas-table .atlas-th-sort:hover {
          background: rgba(113, 113, 122, 0.18);
        }
        .atlas-table .atlas-th-sorted {
          color: var(--text-main);
          background: rgba(113, 113, 122, 0.18);
        }
        .atlas-table tbody .atlas-row {
          transition: background 0.12s ease;
        }
        .atlas-table tbody .atlas-row:nth-child(even) {
          background: rgba(var(--bg-side-rgb), 0.45);
        }
        .atlas-table tbody .atlas-row:hover {
          background: rgba(113, 113, 122, 0.18) !important;
        }
        .atlas-table tbody .atlas-row-selected {
          background: rgba(113, 113, 122, 0.24) !important;
          box-shadow: inset 3px 0 0 rgb(113, 113, 122);
        }
        .atlas-table .atlas-td {
          padding: 8px 12px;
          border-bottom: 1px solid rgba(var(--border-rgb), 0.55);
          vertical-align: middle;
        }
        .atlas-table .atlas-td-cell {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
          max-width: 22rem;
        }
        .atlas-table .atlas-td-numeric {
          font-variant-numeric: tabular-nums;
          text-align: right;
          color: var(--text-main);
        }
        .atlas-table .atlas-td-bool { text-align: center; }
        .atlas-table .atlas-td-num {
          color: var(--text-muted);
          text-align: center;
          font-variant-numeric: tabular-nums;
          font-size: 11px;
          width: 56px;
        }
        .atlas-table .atlas-td-check { text-align: center; width: 40px; }
        .atlas-table .atlas-td-actions { text-align: right; }
        .atlas-table .atlas-td-empty {
          padding: 40px 12px;
          text-align: center;
          color: var(--text-muted);
          font-style: italic;
        }
        .atlas-table .atlas-cell {
          display: block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .atlas-table .atlas-cell-editable {
          cursor: text;
          padding: 2px 4px;
          border-radius: 4px;
        }
        .atlas-table .atlas-cell-editable:hover {
          background: rgba(113, 113, 122, 0.18);
          outline: 1px dashed rgba(113, 113, 122, 0.35);
        }
        .atlas-table .atlas-cell-null {
          color: var(--text-muted);
          font-style: italic;
          letter-spacing: 0.04em;
          font-size: 11px;
        }
        .atlas-pill {
          display: inline-flex;
          align-items: center;
          padding: 1px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .atlas-pill-true {
          background: rgba(var(--success-rgb), 0.18);
          color: var(--success);
          border: 1px solid rgba(var(--success-rgb), 0.4);
        }
        .atlas-pill-false {
          background: rgba(var(--danger-rgb), 0.15);
          color: var(--danger);
          border: 1px solid rgba(var(--danger-rgb), 0.35);
        }
        .atlas-light .atlas-pill-true {
          background: rgba(var(--success-rgb), 0.18);
          color: color-mix(in srgb, var(--success) 80%, black);
          border-color: rgba(var(--success-rgb), 0.55);
        }
        .atlas-light .atlas-pill-false {
          background: rgba(var(--danger-rgb), 0.15);
          color: color-mix(in srgb, var(--danger) 75%, black);
          border-color: rgba(var(--danger-rgb), 0.55);
        }
        .atlas-compact .atlas-table .atlas-td { padding: 4px 10px; }
        .atlas-compact .atlas-table .atlas-th { padding: 6px 10px; }
        .atlas-no-row-numbers .atlas-row-number { display: none; }
      `}</style>

      {confirmDialog ? (
        <ConfirmDialog dialog={confirmDialog} onClose={closeConfirm} />
      ) : null}
      {propertiesTarget ? (
        <PropertiesDialog
          databaseName={selectedDatabase}
          target={propertiesTarget}
          onClose={() => setPropertiesTarget(null)}
        />
      ) : null}
      {globalSearchOpen ? (
        <GlobalSearchDialog
          databases={state.databases}
          onClose={() => setGlobalSearchOpen(false)}
          onOpenDatabase={(database) => {
            selectDatabase(database);
            setGlobalSearchOpen(false);
          }}
          onOpenTable={(databaseName, tableName) => {
            selectTable(databaseName, tableName);
            setGlobalSearchOpen(false);
          }}
          onOpenTab={(tab) => {
            setActiveTab(tab);
            setGlobalSearchOpen(false);
          }}
        />
      ) : null}
      <aside className="atlas-sidebar sticky top-0 flex h-screen w-80 shrink-0 flex-col overflow-hidden border-r border-zinc-700 bg-zinc-900">
        <div className="border-b border-zinc-700 p-4">
          <button
            className="flex items-center gap-2 text-lg font-bold"
            onClick={() => setActiveTab("home")}
          >
            <AtlasLogo className="h-7 w-7" />
            <span>Atlas</span>
            <span className="ml-auto text-[10px] font-normal uppercase tracking-wider text-zinc-500">
              v{APP_VERSION}
            </span>
          </button>
        </div>

        <div className="space-y-3 border-b border-zinc-700 p-4">
          <Label htmlFor="databaseName">Nowa baza</Label>
          <div className="flex gap-2">
            <Input
              id="databaseName"
              value={databaseName}
              onChange={(event) => setDatabaseName(event.target.value)}
              placeholder="firma_db"
              onKeyDown={(event) => {
                if (event.key === "Enter" && databaseName.trim()) {
                  event.preventDefault();
                  document
                    .getElementById("createDatabaseBtn")
                    ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                }
              }}
            />
            <Button
              id="createDatabaseBtn"
              variant="success"
              disabled={isLoading}
              onClick={() =>
                runAction(async () => {
                  const createdName = databaseName;
                  await api("/api/databases", {
                    method: "POST",
                    body: JSON.stringify({ name: createdName }),
                  });
                  await refresh(createdName, "");
                  setSelectedDatabase(createdName);
                  setExportDatabase(createdName);
                  setSelectedTable("");
                  setDatabaseNewName(createdName);
                  setDatabaseName("");
                  setActiveTab("database");
                }, "Baza utworzona.")
              }
              title="Utwórz nową bazę (Enter)"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border-b border-zinc-700 px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              className="pl-9"
              value={sidebarFilter}
              onChange={(event) => setSidebarFilter(event.target.value)}
              placeholder="Szukaj bazy lub tabeli..."
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-wider text-zinc-500">
            <span>{state.databases.length} baz · {stats.tables} tabel</span>
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded px-2 py-0.5 hover:bg-zinc-800"
                onClick={() =>
                  setCollapsedDatabases(
                    new Set(state.databases.map((database) => database.name)),
                  )
                }
                title="Zwiń wszystkie"
              >
                Zwiń
              </button>
              <button
                type="button"
                className="rounded px-2 py-0.5 hover:bg-zinc-800"
                onClick={() => setCollapsedDatabases(new Set())}
                title="Rozwiń wszystkie"
              >
                Rozwiń
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3">
          <button
            className={`mb-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${activeTab === "home" ? "bg-zinc-300 text-zinc-950" : "hover:bg-zinc-800"}`}
            onClick={() => setActiveTab("home")}
          >
            <Home className="h-4 w-4" /> Home
          </button>

          {filteredSidebarDatabases.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-700 bg-zinc-900 p-4 text-center text-xs text-zinc-500">{sidebarFilter
                ? "Brak dopasowań."
                : "Brak baz danych. Utwórz pierwszą bazę."}
            </div>
          ) : (
            filteredSidebarDatabases.map(({ database, matchedTables }) => {
              const isCollapsed = collapsedDatabases.has(database.name);
              const isActiveDb = selectedDatabase === database.name;
              const totalRows = database.tables.reduce(
                (sum, table) => sum + table.rows.length,
                0,
              );
              return (
                <div key={database.name} className="mb-2">
                  <div
                    className={`group flex items-center gap-1 rounded-md text-sm font-semibold ${isActiveDb && activeTab === "database" ? "bg-zinc-300 text-zinc-950" : "hover:bg-zinc-800"}`}
                  >
                    <button
                      type="button"
                      className="flex h-9 w-7 shrink-0 items-center justify-center rounded-md hover:bg-zinc-700/40"
                      onClick={() => toggleDatabaseCollapsed(database.name)}
                      title={isCollapsed ? "Rozwiń" : "Zwiń"}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-between gap-2 px-2 py-2 text-left"
                      onClick={() => selectDatabase(database)}
                      title={`${database.tables.length} tabel · ${totalRows} wierszy`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Database className="h-4 w-4 shrink-0" />
                        <span className="truncate">{database.name}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300 group-hover:bg-zinc-700">
                        {database.tables.length}
                      </span>
                    </button>
                  </div>

                  {!isCollapsed ? (
                    <div className="mt-1 space-y-1 pl-7">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700"
                          onClick={() => {
                            selectDatabase(database);
                            setActiveTab("insert");
                          }}
                          title="Utwórz tabelę"
                        >
                          <Plus className="h-3 w-3" /> Tabela
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700"
                          onClick={() => {
                            selectDatabase(database);
                            setActiveTab("sql");
                          }}
                          title="Konsola SQL"
                        >
                          <Code2 className="h-3 w-3" /> SQL
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700"
                          onClick={() => {
                            selectDatabase(database);
                            setActiveTab("export");
                          }}
                          title="Eksport bazy"
                        >
                          <Download className="h-3 w-3" /> Eksport
                        </button>
                      </div>
                      <ObjectBrowserTree
                        database={database}
                        selectedTable={isActiveDb ? selectedTable : ""}
                        activeTab={activeTab}
                        matchedTables={matchedTables}
                        onSelectDatabase={() => selectDatabase(database)}
                        onSelectTable={(tableName) =>
                          selectTable(database.name, tableName)
                        }
                        onSelectTab={(tab) => {
                          if (selectedDatabase !== database.name) {
                            selectDatabase(database);
                          }
                          setActiveTab(tab);
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-zinc-700 bg-zinc-900/80 px-4 py-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${healthStatus.online ? "bg-emerald-400" : "bg-rose-400"}`}
              />{healthStatus.online ? "Online" : "Offline"}
            </span>
            <span className="text-zinc-500 pr-2">{healthStatus.latencyMs !== null
                ? `${healthStatus.latencyMs} ms`
                : "—"}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-zinc-500">
            <span className="pl-4">{readOnly ? "Tylko do odczytu" : "Zapis aktywny"}</span>
            <button
              type="button"
              className="rounded px-2 py-0.5 hover:bg-zinc-800 hover:text-zinc-300"
              onClick={() => setActiveTab("console")}
              title="Otwórz konsolę"
            >
              Konsola ({consoleLog.length})
            </button>
          </div>
        </div>
      </aside>

      <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 border-b border-zinc-700 bg-zinc-900 px-5 py-4 relative ">
          {isLoading ? <div className="atlas-top-loader" /> : null}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                {activeTab === "home"
                  ? "Panel"
                  : activeTab === "settings"
                    ? "Konfiguracja"
                    : selectedDatabase || "Brak bazy"}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {activeTab === "home"
                  ? "Home"
                  : activeTab === "settings"
                    ? "Ustawienia"
                    : activeTab === "database"
                      ? selectedDatabase || "Wybierz bazę"
                      : selectedTable || "Wybierz tabelę"}
              </h1>
              
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  className="w-full pl-9"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Szukaj w tabeli..."
                />
              </div>
              <Button
                variant="outline"
                disabled={isLoading}
                onClick={() =>
                  runAction(() => refresh(), "Odświeżono.", { mutates: false })
                }
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Odśwież
              </Button>
              <Button
                variant={activeTab === "settings" ? "default" : "outline"}
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="mr-2 h-4 w-4" /> Ustawienia
              </Button>
            </div>
          </div>
          <ToastViewport toasts={toasts} onClose={closeToast} />
          {activeTab !== "home" && activeTab !== "settings" ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {tableTabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${activeTab === id ? "bg-zinc-300 text-zinc-950 " : "bg-zinc-900 text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800"}`}
                    onClick={() => setActiveTab(id)}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800"
                  disabled={!selectedTable}
                  onClick={async () =>
                    selectedTable &&
                    (await askConfirm({
                      title: "Wyczyścić tabelę?",
                      message: `Wszystkie rekordy z tabeli ${selectedTable} zostaną usunięte.`,
                      confirmLabel: "Wyczyść",
                      danger: true,
                    })) &&
                    runAction(async () => {
                      await api("/api/operations", {
                        method: "POST",
                        body: JSON.stringify({
                          databaseName: selectedDatabase,
                          tableName: selectedTable,
                          operation: "truncate",
                        }),
                      });
                      await refresh(selectedDatabase, selectedTable);
                    }, "Tabela wyczyszczona.")
                  }
                >
                  <Eraser className="h-4 w-4" /> Wyczyść
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-600"
                  disabled={!selectedTable}
                  onClick={async () =>
                    selectedTable &&
                    (await askConfirm({
                      title: "Usunąć tabelę?",
                      message: `Tabela ${selectedTable} zostanie usunięta bezpowrotnie.`,
                      confirmLabel: "Usuń tabelę",
                      danger: true,
                    })) &&
                    runAction(async () => {
                      await api("/api/operations", {
                        method: "POST",
                        body: JSON.stringify({
                          databaseName: selectedDatabase,
                          tableName: selectedTable,
                          operation: "drop",
                        }),
                      });
                      await refresh(selectedDatabase, "");
                    }, "Tabela usunięta.")
                  }
                >
                  <Trash2 className="h-4 w-4" /> Usuń
                </button>
              </div>
              <nav className="mt-4 flex flex-wrap gap-1 border-b border-zinc-700 ">
                {adminTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`-mb-px whitespace-nowrap border px-4 py-2 text-sm font-medium ${activeTab === tab.id ? "border-zinc-300 bg-zinc-300 text-zinc-950 " : "border-transparent text-zinc-500 hover:bg-zinc-800"}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </>
          ) : null}
        </header>

        <div
          key={`${activeTab}-${selectedDatabase}-${selectedTable}`}
          className="atlas-view flex-1 overflow-auto p-5"
        >
          {activeTab === "home" && (
            <HomeScreen
              stats={stats}
              databases={state.databases}
              healthStatus={healthStatus}
              consoleLog={consoleLog}
              readOnly={readOnly}
              autoRefresh={autoRefresh}
              autoRefreshInterval={autoRefreshInterval}
              themeName={currentTheme.name}
              onSelectTab={setActiveTab}
              onOpenDatabase={selectDatabase}
              onOpenTable={selectTable}
              onOpenSettings={() => setActiveTab("settings")}
              onCreateDatabase={() => {
                document.getElementById("databaseName")?.focus();
              }}
              onRefresh={() =>
                runAction(() => refresh(), "Odświeżono.", { mutates: false })
              }
            />
          )}
          {activeTab === "database" && (
            <Panel
              title="Baza danych"
              description="Zarządzanie wybraną bazą danych."
            >{currentDatabase ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  <CardBlock title="Informacje">
                    <DataTable
                      columns={["parametr", "wartość"]}
                      rows={[
                        { parametr: "Nazwa", wartość: currentDatabase.name },
                        {
                          parametr: "Utworzono",
                          wartość: currentDatabase.createdAt,
                        },
                        {
                          parametr: "Tabele",
                          wartość: currentDatabase.tables.length,
                        },
                        {
                          parametr: "Wiersze",
                          wartość: currentDatabase.tables.reduce(
                            (sum, table) => sum + table.rows.length,
                            0,
                          ),
                        },
                        {
                          parametr: "Kolumny",
                          wartość: currentDatabase.tables.reduce(
                            (sum, table) => sum + table.columns.length,
                            0,
                          ),
                        },
                        {
                          parametr: "Indeksy",
                          wartość: currentDatabase.tables.reduce(
                            (sum, table) => sum + table.indexes.length,
                            0,
                          ),
                        },
                        {
                          parametr: "Procedury/funkcje",
                          wartość: currentDatabase.routines.length,
                        },
                        {
                          parametr: "Zdarzenia",
                          wartość: currentDatabase.events.length,
                        },
                        {
                          parametr: "Wyzwalacze",
                          wartość: currentDatabase.triggers.length,
                        },
                        {
                          parametr: "Śledzenie",
                          wartość: currentDatabase.tracking.length,
                        },
                      ]}
                    />
                  </CardBlock>
                  <CardBlock title="Operacje bazy">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="databaseNewName">
                          Zmień nazwę bazy
                        </Label>
                        <Input
                          id="databaseNewName"
                          value={databaseNewName || selectedDatabase}
                          onChange={(event) =>
                            setDatabaseNewName(event.target.value)
                          }
                          placeholder="nowa_nazwa"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="success"
                          disabled={!selectedDatabase || !databaseNewName}
                          onClick={() =>
                            runAction(
                              renameSelectedDatabase,
                              "Zmieniono nazwę bazy.",
                            )
                          }
                        >
                          Zmień nazwę
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setActiveTab("insert")}
                        >
                          Utwórz tabelę
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setActiveTab("import")}
                        >
                          Import SQL
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setActiveTab("export")}
                        >
                          Eksport SQL
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={!currentDatabase.tables.length}
                          onClick={() =>
                            runAction(
                              truncateAllTables,
                              "Wyczyszczono wszystkie tabele.",
                            )
                          }
                        >
                          Wyczyść wszystkie tabele
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={!currentDatabase.tables.length}
                          onClick={() =>
                            runAction(
                              dropAllTables,
                              "Usunięto wszystkie tabele.",
                            )
                          }
                        >
                          Usuń wszystkie tabele
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={!selectedDatabase}
                          onClick={() =>
                            runAction(deleteSelectedDatabase, "Baza usunięta.")
                          }
                        >
                          Usuń bazę
                        </Button>
                      </div>
                      <div className="text-sm text-zinc-500">
                        Pusta baza też ma własny widok. Możesz od razu utworzyć
                        tabelę albo zaimportować plik SQL.
                      </div>
                    </div>
                  </CardBlock>
                  <CardBlock title="Tabele w bazie">
                    {currentDatabase.tables.length === 0 ? (
                      <div className="space-y-3 text-sm text-zinc-500">
                        <div>Ta baza nie ma jeszcze tabel.</div>
                        <Button
                          variant="success"
                          onClick={() => setActiveTab("insert")}
                        >
                          Utwórz pierwszą tabelę
                        </Button>
                      </div>
                    ) : (
                      <DataTable
                        columns={["nazwa", "wiersze", "kolumny", "indeksy"]}
                        rows={currentDatabase.tables.map((table) => ({
                          nazwa: table.name,
                          wiersze: table.rows.length,
                          kolumny: table.columns.length,
                          indeksy: table.indexes.length,
                        }))}
                      />
                    )}
                  </CardBlock>
                  <CardBlock title="Szybkie akcje">
                    <div className="space-y-4">
                      <ConnectionFields
                        form={connectionForm}
                        setForm={setConnectionForm}
                        showPassword={showConnectionPassword}
                        setShowPassword={setShowConnectionPassword}
                        callback={connectionCallback()}
                        onRandomPassword={() =>
                          setConnectionForm((current) => ({
                            ...current,
                            password: randomPassword(),
                          }))
                        }
                        onCopyCallback={() =>
                          runAction(
                            copyConnectionCallback,
                            "Callback połączenia skopiowany.",
                          )
                        }
                        onSave={() =>
                          runAction(saveConnection, "Dane połączenia zapisane.")
                        }
                      />
                      <div className="border-t border-zinc-700 pt-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => setActiveTab("sql")}
                          >
                            Konsola SQL
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setActiveTab("tracking")}
                          >
                            Historia zmian
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setActiveTab("routines")}
                          >
                            Procedury/funkcje
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setActiveTab("events")}
                          >
                            Zdarzenia
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setActiveTab("triggers")}
                          >
                            Wyzwalacze
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardBlock>
                  <div className="xl:col-span-2">
                    <DatabaseManagementCard
                      databaseName={selectedDatabase}
                      recycleBin={currentDatabase.recycleBin ?? []}
                      onSnapshotCreate={() =>
                        runAction(async () => {
                          await api("/api/snapshots", {
                            method: "POST",
                            body: JSON.stringify({
                              databaseName: selectedDatabase,
                            }),
                          });
                        }, "Snapshot utworzony.", { mutates: false })
                      }
                      onSnapshotRestore={async (snapshotId) => {
                        if (
                          !(await askConfirm({
                            title: "Przywrócić snapshot?",
                            message: `Aktualny stan bazy zostanie zastąpiony danymi ze snapshota ${snapshotId}.`,
                            confirmLabel: "Przywróć",
                            danger: true,
                          }))
                        )
                          return;
                        await runAction(async () => {
                          await api("/api/snapshots", {
                            method: "PATCH",
                            body: JSON.stringify({
                              databaseName: selectedDatabase,
                              snapshotId,
                            }),
                          });
                          await refresh(selectedDatabase, selectedTable);
                        }, "Snapshot przywrócony.");
                      }}
                      onSnapshotDelete={async (snapshotId) => {
                        if (
                          !(await askConfirm({
                            title: "Usunąć snapshot?",
                            message: `Snapshot ${snapshotId} zostanie trwale usunięty.`,
                            confirmLabel: "Usuń",
                            danger: true,
                          }))
                        )
                          return;
                        await runAction(async () => {
                          await api("/api/snapshots", {
                            method: "DELETE",
                            body: JSON.stringify({
                              databaseName: selectedDatabase,
                              snapshotId,
                            }),
                          });
                        }, "Snapshot usunięty.", { mutates: false });
                      }}
                      onRecycleRestore={(itemId) =>
                        runAction(async () => {
                          await api("/api/recycle-bin", {
                            method: "POST",
                            body: JSON.stringify({
                              databaseName: selectedDatabase,
                              itemId,
                            }),
                          });
                          await refresh(selectedDatabase, selectedTable);
                        }, "Element przywrócony.")
                      }
                      onRecycleDelete={async (itemId) => {
                        if (
                          !(await askConfirm({
                            title: "Usunąć element trwale?",
                            message: "Tej operacji nie można cofnąć.",
                            confirmLabel: "Usuń",
                            danger: true,
                          }))
                        )
                          return;
                        await runAction(async () => {
                          await api("/api/recycle-bin", {
                            method: "DELETE",
                            body: JSON.stringify({
                              databaseName: selectedDatabase,
                              itemId,
                            }),
                          });
                          await refresh(selectedDatabase, selectedTable);
                        }, "Element usunięty.");
                      }}
                      onRecycleClear={async () => {
                        if (
                          !(await askConfirm({
                            title: "Wyczyścić cały kosz?",
                            message: "Wszystkie elementy zostaną trwale usunięte.",
                            confirmLabel: "Wyczyść",
                            danger: true,
                          }))
                        )
                          return;
                        await runAction(async () => {
                          await api("/api/recycle-bin", {
                            method: "DELETE",
                            body: JSON.stringify({
                              databaseName: selectedDatabase,
                            }),
                          });
                          await refresh(selectedDatabase, selectedTable);
                        }, "Kosz wyczyszczony.");
                      }}
                      onDuplicate={(newName) =>
                        runAction(async () => {
                          await api("/api/databases", {
                            method: "POST",
                            body: JSON.stringify({
                              name: newName,
                              duplicateFrom: selectedDatabase,
                            }),
                          });
                          await refresh(newName, "");
                        }, `Bazę zduplikowano jako ${newName}.`)
                      }
                    />
                  </div>
                </div>
              ) : (
                <EmptyState />
              )}
            </Panel>
          )}
          {activeTab === "browse" && (
            <Panel
              title="Przeglądaj dane"
              description={`${filteredRows.length} widocznych wierszy. Możesz edytować i usuwać rekordy.`}
            >{currentTable ? (
                <div className="mb-4 flex flex-col gap-3 rounded-md border border-zinc-700 bg-zinc-800 p-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <div>
                      <span className="text-zinc-500">Wiersze:</span>{" "}
                      {currentTable.rows.length}
                    </div>
                    <div>
                      <span className="text-zinc-500">Widoczne:</span>{" "}
                      {filteredRows.length}
                    </div>
                    <div>
                      <span className="text-zinc-500">Kolumny:</span>{" "}
                      {currentTable.columns.length}
                    </div>
                    <div>
                      <span className="text-zinc-500">Indeksy:</span>{" "}
                      {currentTable.indexes.length}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="h-9"
                      variant="secondary"
                      onClick={() => exportVisibleRows("json")}
                    >
                      JSON
                    </Button>
                    <Button
                      className="h-9"
                      variant="secondary"
                      onClick={() => exportVisibleRows("csv")}
                    >
                      CSV
                    </Button>
                    <Button
                      className="h-9"
                      variant="secondary"
                      onClick={() =>
                        runAction(
                          copyVisibleRows,
                          "Skopiowano widoczne rekordy.",
                          { mutates: false },
                        )
                      }
                    >
                      Kopiuj
                    </Button>
                    <Button
                      className="h-9"
                      variant="secondary"
                      onClick={() => setFilter("")}
                    >
                      Reset filtra
                    </Button>
                  </div>
                </div>
              ) : null}{selectedRowIndices.length > 0 ? (
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 p-3">
                  <span className="text-sm">
                    Zaznaczono <strong>{selectedRowIndices.length}</strong> wierszy
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="h-9"
                      variant="secondary"
                      onClick={() => exportSelectedRows("json")}
                    >
                      JSON zaznaczone
                    </Button>
                    <Button
                      className="h-9"
                      variant="secondary"
                      onClick={() => exportSelectedRows("csv")}
                    >
                      CSV zaznaczone
                    </Button>
                    <Button
                      className="h-9"
                      variant="danger"
                      onClick={bulkDeleteSelected}
                    >
                      Usuń zaznaczone
                    </Button>
                    <Button
                      className="h-9"
                      variant="secondary"
                      onClick={() => setSelectedRowIndices([])}
                    >
                      Wyczyść zaznaczenie
                    </Button>
                  </div>
                </div>
              ) : null}{editingRowIndex !== null && currentTable ? (
                <EditRecordForm
                  table={currentTable}
                  rowIndex={editingRowIndex}
                  values={editingValues}
                  nulls={editingNulls}
                  setValues={setEditingValues}
                  setNulls={setEditingNulls}
                  parseValue={parseInsertValue}
                  onSave={() =>
                    runAction(saveEditedRow, "Dane zaktualizowane.")
                  }
                  onCancel={() => {
                    setEditingRowIndex(null);
                    setEditingValues({});
                    setEditingNulls({});
                  }}
                />
              ) : null}{currentTable ? (
                <DataTable
                  columns={currentTable.columns.map((column) => column.name)}
                  rows={filteredRows}
                  rowIndices={filteredRowIndices}
                  actions
                  editable
                  sortable
                  paginated
                  selectable
                  selectedIndices={selectedRowIndices}
                  onToggleSelect={toggleSelectRow}
                  onToggleSelectAll={toggleSelectAllRows}
                  onEdit={editRow}
                  onDelete={deleteSelectedRow}
                  onDuplicate={duplicateSelectedRow}
                  onCellSave={saveInlineCell}
                />
              ) : (
                <EmptyState />
              )}
            </Panel>
          )}
          {activeTab === "structure" && (
            <Panel
              title="Struktura tabeli"
              description="Edytuj kolumny i indeksy aktywnej tabeli."
              actions={
                currentTable ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      openProperties(
                        "table",
                        currentTable.name,
                        currentTable.schema ?? "public",
                      )
                    }
                    title="Właściwości / SQL"
                  >
                    <Info className="mr-2 h-4 w-4" /> Właściwości
                  </Button>
                ) : null
              }
            >{currentTable && selectedDatabase ? (
                <StructurePanel
                  databaseName={selectedDatabase}
                  table={currentTable}
                  onSchemaAction={async (operation, payload, message) => {
                    await runAction(async () => {
                      await api("/api/schema", {
                        method: "POST",
                        body: JSON.stringify({
                          databaseName: selectedDatabase,
                          tableName: currentTable.name,
                          operation,
                          ...payload,
                        }),
                      });
                      await refresh(selectedDatabase, currentTable.name);
                    }, message);
                  }}
                  onCheckSave={async (check, oldName) => {
                    await runAction(async () => {
                      await api("/api/objects", {
                        method: "POST",
                        body: JSON.stringify({
                          databaseName: selectedDatabase,
                          type: "check",
                          action: "save",
                          payload: {
                            tableName: currentTable.name,
                            name: check.name,
                            expression: check.expression,
                            oldName,
                          },
                        }),
                      });
                      await refresh(selectedDatabase, currentTable.name);
                    }, "CHECK zapisany.");
                  }}
                  onCheckDrop={async (name) => {
                    if (
                      !(await askConfirm({
                        title: "Usunąć CHECK?",
                        message: `${name} zostanie usunięty.`,
                        confirmLabel: "Usuń",
                        danger: true,
                      }))
                    )
                      return;
                    await runAction(async () => {
                      await api("/api/objects", {
                        method: "POST",
                        body: JSON.stringify({
                          databaseName: selectedDatabase,
                          type: "check",
                          action: "drop",
                          payload: {
                            tableName: currentTable.name,
                            name,
                          },
                        }),
                      });
                      await refresh(selectedDatabase, currentTable.name);
                    }, "CHECK usunięty.");
                  }}
                  askConfirm={askConfirm}
                />
              ) : (
                <EmptyState />
              )}
            </Panel>
          )}
          {activeTab === "search" && (
            <Panel
              title="Szukaj w tabeli"
              description="Filtruje wszystkie kolumny aktywnej tabeli."
            >
              <Input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Fraza..."
              />
              <div className="mt-4 h-[520px]">
                {currentTable ? (
                  <DataTable
                    columns={currentTable.columns.map((column) => column.name)}
                    rows={filteredRows}
                    rowIndices={filteredRowIndices}
                    actions
                    editable
                    onEdit={editRow}
                    onDelete={deleteSelectedRow}
                    onCellSave={saveInlineCell}
                  />
                ) : (
                  <EmptyState />
                )}
              </div>
            </Panel>
          )}
          {activeTab === "insert" && (
            <Panel
              title="Wstaw"
              description="Dodaj nową tabelę albo nowy wiersz do aktywnej tabeli."
            >
              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <CardBlock
                  title={
                    currentTable
                      ? `Nowy wiersz: ${currentTable.name}`
                      : "Nowy wiersz"
                  }
                >
                  {currentTable ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-[1fr_1.2fr_90px] gap-2 px-1 text-xs uppercase tracking-wide text-zinc-500">
                        <div>Kolumna</div>
                        <div>Wartość</div>
                        <div>NULL</div>
                      </div>
                      {currentTable.columns.map((column) => {
                        const value = insertValues[column.name] ?? "";
                        const isNull = Boolean(insertNulls[column.name]);
                        const placeholder = column.autoIncrement
                          ? "AUTO"
                          : column.nullable
                            ? "NULL lub wartość"
                            : column.type;
                        return (
                          <div
                            key={column.name}
                            className="grid grid-cols-[1fr_1.2fr_90px] items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 p-2"
                          >
                            <div>
                              <div className="font-mono text-sm font-semibold">
                                {column.name}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {column.type}
                                {column.primaryKey ? " · PRIMARY" : ""}
                                {column.autoIncrement
                                  ? " · AUTO_INCREMENT"
                                  : ""}
                                {column.nullable ? " · NULL" : " · NOT NULL"}
                              </div>
                            </div>
                            {column.type === "BOOLEAN" ? (
                              <select
                                className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                                value={value}
                                disabled={isNull || column.autoIncrement}
                                onChange={(event) =>
                                  setInsertValues((current) => ({
                                    ...current,
                                    [column.name]: event.target.value,
                                  }))
                                }
                              >
                                <option value="">domyślnie</option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                              </select>
                            ) : (
                              <ColumnValueInput
                                column={column}
                                value={value}
                                isNull={isNull}
                                disabled={column.autoIncrement}
                                placeholder={placeholder}
                                onChange={(next) =>
                                  setInsertValues((current) => ({
                                    ...current,
                                    [column.name]: next,
                                  }))
                                }
                              />
                            )}
                            {column.nullable ? (
                              <label className="flex items-center gap-2 text-sm text-zinc-400">
                                <input
                                  type="checkbox"
                                  checked={isNull}
                                  onChange={(event) =>
                                    setInsertNulls((current) => ({
                                      ...current,
                                      [column.name]: event.target.checked,
                                    }))
                                  }
                                />{" "}
                                NULL
                              </label>
                            ) : (
                              <div className="text-xs text-zinc-500">
                                wymagane
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                          disabled={!selectedDatabase || !selectedTable}
                          onClick={() =>
                            runAction(insertFormRow, "Wiersz dodany.")
                          }
                        >
                          Wstaw wiersz
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setInsertValues({});
                            setInsertNulls({});
                          }}
                        >
                          Wyczyść formularz
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm text-zinc-500">
                      <div>
                        Wybierz tabelę z lewego panelu albo utwórz nową tabelę.
                      </div>
                    </div>
                  )}
                </CardBlock>
                <div className="space-y-4">
                  <CardBlock title="Nowa tabela">
                    <Input
                      value={tableName}
                      onChange={(event) => setTableName(event.target.value)}
                      placeholder="users"
                    />
                    <Input
                      value={columns}
                      onChange={(event) => setColumns(event.target.value)}
                      placeholder="id INT PRIMARY KEY AUTO_INCREMENT, name TEXT"
                    />
                    <Button
                      disabled={!selectedDatabase}
                      onClick={() =>
                        runAction(async () => {
                          await api("/api/tables", {
                            method: "POST",
                            body: JSON.stringify({
                              databaseName: selectedDatabase,
                              tableName,
                              columns: columns.split(","),
                            }),
                          });
                          await refresh(selectedDatabase, tableName);
                          setTableName("");
                          setActiveTab("browse");
                        }, "Tabela utworzona.")
                      }
                    >
                      Utwórz tabelę
                    </Button>
                  </CardBlock>
                  <CardBlock title="Zaawansowane: JSON">
                    <Textarea
                      className="min-h-40 font-mono"
                      value={rowJson}
                      onChange={(event) => setRowJson(event.target.value)}
                    />
                    <Button
                      disabled={!selectedDatabase || !selectedTable}
                      onClick={() =>
                        runAction(async () => {
                          const values = JSON.parse(rowJson) as Record<
                            string,
                            unknown
                          >;
                          await api("/api/rows", {
                            method: "POST",
                            body: JSON.stringify({
                              databaseName: selectedDatabase,
                              tableName: selectedTable,
                              values,
                            }),
                          });
                          await refresh(selectedDatabase, selectedTable);
                          setActiveTab("browse");
                        }, "Wiersz dodany.")
                      }
                    >
                      Dodaj JSON
                    </Button>
                  </CardBlock>
                </div>
              </div>
            </Panel>
          )}
          {activeTab === "sql" && (
            <SqlPanel
              sql={sql}
              setSql={setSql}
              sqlResults={sqlResults}
              isLoading={isLoading}
              tables={currentDatabase?.tables ?? []}
              savedQueries={currentDatabase?.savedQueries ?? []}
              databaseName={selectedDatabase}
              onRun={() =>
                runAction(() => runSql(), "SQL wykonany.", {
                  mutates: !isReadOnlySql(sql),
                })
              }
              onSaveQuery={(name, sqlText) =>
                runAction(async () => {
                  await api("/api/saved-queries", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      name,
                      sql: sqlText,
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Zapytanie zapisane.")
              }
              onDeleteQuery={(id) =>
                runAction(async () => {
                  await api("/api/saved-queries", {
                    method: "DELETE",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      id,
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Zapytanie usunięte.")
              }
              onEditTable={(tableName) => {
                if (!selectedDatabase) return;
                selectTable(selectedDatabase, tableName);
                setActiveTab("browse");
              }}
            />
          )}
          {activeTab === "query" && (
            <QueryBuilderPanel
              tables={currentDatabase?.tables ?? []}
              defaultTable={selectedTable}
              isLoading={isLoading}
              sqlResults={sqlResults}
              onRun={(sqlText) =>
                runAction(() => runSql(sqlText), "Zapytanie wykonane.", {
                  mutates: false,
                })
              }
              onCopySql={(sqlText) => setSql(sqlText)}
            />
          )}
          {activeTab === "export" && (
            <ExportPanel
              databases={state.databases}
              exportDb={exportDb}
              onSelectDatabase={(name) => setExportDatabase(name)}
              selectedTable={selectedTable}
              onExport={(scope, options) =>
                runAction(
                  () => downloadExport(scope, options),
                  scope === "database"
                    ? "Wyeksportowano bazę."
                    : "Wyeksportowano tabelę.",
                  { mutates: false },
                )
              }
            />
          )}
          {activeTab === "import" && (
            <ImportPanel
              importSqlText={importSqlText}
              setImportSqlText={setImportSqlText}
              selectedDatabase={selectedDatabase}
              selectedTable={selectedTable}
              currentTable={currentTable}
              sqlResults={sqlResults}
              onLoadFile={(file) =>
                runAction(() => importFile(file), "Plik wczytany.", {
                  mutates: false,
                })
              }
              onImportSql={() =>
                runAction(async () => {
                  const data = await api<{ results: SqlResult[] }>(
                    "/api/import",
                    {
                      method: "POST",
                      body: JSON.stringify({
                        databaseName: selectedDatabase,
                        sql: importSqlText,
                      }),
                    },
                  );
                  setSqlResults(data.results);
                  await refresh(selectedDatabase, selectedTable);
                }, "Import wykonany.")
              }
              onImportCsv={(file) =>
                runAction(async () => {
                  await importCsvIntoTable(file);
                }, "Import CSV zakończony.")
              }
            />
          )}
          {activeTab === "operations" && (
            <Panel
              title="Operacje"
              description="Operacje administracyjne tabeli."
            >
              <div className="grid gap-3 md:grid-cols-4">
                <Input
                  value={renameTable}
                  onChange={(event) => setRenameTable(event.target.value)}
                  placeholder="Nowa nazwa tabeli"
                />
                <Button
                  disabled={!selectedTable}
                  onClick={() =>
                    runAction(async () => {
                      await api("/api/operations", {
                        method: "POST",
                        body: JSON.stringify({
                          databaseName: selectedDatabase,
                          tableName: selectedTable,
                          operation: "rename",
                          newName: renameTable,
                        }),
                      });
                      await refresh(selectedDatabase, renameTable);
                      setActiveTab("browse");
                    }, "Zmieniono nazwę.")
                  }
                >
                  Zmień nazwę
                </Button>
                <Button
                  variant="destructive"
                  disabled={!selectedTable}
                  onClick={async () =>
                    (await askConfirm({
                      title: "Wyczyścić tabelę?",
                      message: `Wszystkie rekordy z tabeli ${selectedTable} zostaną usunięte.`,
                      confirmLabel: "Wyczyść",
                      danger: true,
                    })) &&
                    runAction(async () => {
                      await api("/api/operations", {
                        method: "POST",
                        body: JSON.stringify({
                          databaseName: selectedDatabase,
                          tableName: selectedTable,
                          operation: "truncate",
                        }),
                      });
                      await refresh(selectedDatabase, selectedTable);
                      setActiveTab("browse");
                    }, "Tabela wyczyszczona.")
                  }
                >
                  Wyczyść
                </Button>
                <Button
                  variant="destructive"
                  disabled={!selectedTable}
                  onClick={async () =>
                    (await askConfirm({
                      title: "Usunąć tabelę?",
                      message: `Tabela ${selectedTable} zostanie usunięta bezpowrotnie.`,
                      confirmLabel: "Usuń tabelę",
                      danger: true,
                    })) &&
                    runAction(async () => {
                      await api("/api/operations", {
                        method: "POST",
                        body: JSON.stringify({
                          databaseName: selectedDatabase,
                          tableName: selectedTable,
                          operation: "drop",
                        }),
                      });
                      await refresh(selectedDatabase, "");
                    }, "Tabela usunięta.")
                  }
                >
                  Usuń
                </Button>
              </div>
              <OperationsAdvanced
                databaseName={selectedDatabase}
                tableName={selectedTable}
              />
            </Panel>
          )}
          {activeTab === "routines" && (
            <MetadataPanel
              title="Procedury i funkcje"
              description="Definicje PROCEDURE/FUNCTION jako metadata."
              items={[...(currentDatabase?.routines ?? [])].map((item) => ({
                name: `${item.kind} ${item.name}`,
                body: item.body,
                rawName: item.name,
              }))}
              metaName={metaName}
              setMetaName={setMetaName}
              metaBody={metaBody}
              setMetaBody={setMetaBody}
              onSaveProcedure={() =>
                runAction(
                  () => saveMetadata("routine", { kind: "PROCEDURE" }),
                  "Procedura zapisana.",
                )
              }
              onSaveFunction={() =>
                runAction(
                  () =>
                    saveMetadata("routine", {
                      kind: "FUNCTION",
                      returns: "TEXT",
                    }),
                  "Funkcja zapisana.",
                )
              }
              onEdit={(name, body) => {
                setMetaName(name);
                setMetaBody(body);
              }}
              onDelete={(name) =>
                runAction(async () => {
                  await api("/api/metadata", {
                    method: "DELETE",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "routine",
                      name,
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Usunięto rutynę.")
              }
            />
          )}
          {activeTab === "events" && (
            <MetadataPanel
              title="Zdarzenia"
              description="Zdarzenia harmonogramu jako metadata."
              items={(currentDatabase?.events ?? []).map((item) => ({
                name: `${item.enabled ? "ON" : "OFF"} ${item.name} ${item.schedule}`,
                body: item.body,
                rawName: item.name,
                enabled: item.enabled,
              }))}
              metaName={metaName}
              setMetaName={setMetaName}
              metaBody={metaBody}
              setMetaBody={setMetaBody}
              extra={
                <Input
                  value={metaSchedule}
                  onChange={(event) => setMetaSchedule(event.target.value)}
                  placeholder="EVERY 1 DAY"
                />
              }
              onSaveProcedure={() =>
                runAction(() => saveMetadata("event"), "Zdarzenie zapisane.")
              }
              onEdit={(name, body) => {
                const event = currentDatabase?.events.find((item) => item.name === name);
                setMetaName(name);
                setMetaBody(body);
                if (event) setMetaSchedule(event.schedule);
              }}
              onToggle={(name, enabled) =>
                runAction(async () => {
                  const event = currentDatabase?.events.find((item) => item.name === name);
                  if (!event) return;
                  await api("/api/metadata", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "event",
                      payload: {
                        name: event.name,
                        schedule: event.schedule,
                        body: event.body,
                        enabled,
                      },
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, enabled ? "Zdarzenie włączone." : "Zdarzenie wyłączone.")
              }
              onDelete={(name) =>
                runAction(async () => {
                  await api("/api/metadata", {
                    method: "DELETE",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "event",
                      name,
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Usunięto zdarzenie.")
              }
            />
          )}
          {activeTab === "triggers" && (
            <MetadataPanel
              title="Wyzwalacze"
              description="Wyzwalacze BEFORE/AFTER INSERT/UPDATE/DELETE jako metadata."
              items={(currentDatabase?.triggers ?? []).map((item) => ({
                name: `${item.timing} ${item.event} ${item.name} ON ${item.tableName}`,
                body: item.body,
                rawName: item.name,
                enabled: item.enabled,
              }))}
              metaName={metaName}
              setMetaName={setMetaName}
              metaBody={metaBody}
              setMetaBody={setMetaBody}
              onSaveProcedure={() =>
                runAction(
                  () =>
                    saveMetadata("trigger", {
                      timing: "BEFORE",
                      event: "INSERT",
                    }),
                  "Wyzwalacz zapisany.",
                )
              }
              onEdit={(name, body) => {
                setMetaName(name);
                setMetaBody(body);
              }}
              onToggle={(name, enabled) =>
                runAction(async () => {
                  const trigger = currentDatabase?.triggers.find((item) => item.name === name);
                  if (!trigger) return;
                  await api("/api/metadata", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "trigger",
                      payload: {
                        name: trigger.name,
                        tableName: trigger.tableName,
                        timing: trigger.timing,
                        event: trigger.event,
                        body: trigger.body,
                        enabled,
                      },
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, enabled ? "Wyzwalacz włączony." : "Wyzwalacz wyłączony.")
              }
              onDelete={(name) =>
                runAction(async () => {
                  await api("/api/metadata", {
                    method: "DELETE",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "trigger",
                      name,
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Usunięto wyzwalacz.")
              }
            />
          )}
          {activeTab === "schemas" && (
            <SchemasPanel
              schemas={currentDatabase?.schemas ?? []}
              tables={currentDatabase?.tables ?? []}
              views={currentDatabase?.views ?? []}
              mviews={currentDatabase?.materializedViews ?? []}
              sequences={currentDatabase?.sequences ?? []}
              disabled={!selectedDatabase || isLoading}
              onCreate={(name, description) =>
                runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "schema",
                      action: "save",
                      payload: { name, description },
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Schemat utworzony.")
              }
              onDrop={async (name) => {
                if (
                  !(await askConfirm({
                    title: "Usunąć schemat?",
                    message: `Schemat ${name} zostanie usunięty. Obiekty w nim przeniesiemy do public.`,
                    confirmLabel: "Usuń",
                    danger: true,
                  }))
                )
                  return;
                await runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "schema",
                      action: "drop",
                      payload: { name },
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Schemat usunięty.");
              }}
            />
          )}
          {activeTab === "views" && (
            <ViewsPanel
              views={currentDatabase?.views ?? []}
              schemas={currentDatabase?.schemas ?? []}
              disabled={!selectedDatabase || isLoading}
              onSave={(payload) =>
                runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "view",
                      action: "save",
                      payload,
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Widok zapisany.")
              }
              onDrop={async (view) => {
                if (
                  !(await askConfirm({
                    title: "Usunąć widok?",
                    message: `Widok ${view.schema ?? "public"}.${view.name} zostanie usunięty.`,
                    confirmLabel: "Usuń",
                    danger: true,
                  }))
                )
                  return;
                await runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "view",
                      action: "drop",
                      payload: { name: view.name, schema: view.schema ?? "public" },
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Widok usunięty.");
              }}
              onRunSql={(sql) => {
                setSql(sql);
                setActiveTab("sql");
              }}
              onShowProperties={(view) =>
                openProperties("view", view.name, view.schema)
              }
            />
          )}
          {activeTab === "mviews" && (
            <MaterializedViewsPanel
              mviews={currentDatabase?.materializedViews ?? []}
              schemas={currentDatabase?.schemas ?? []}
              disabled={!selectedDatabase || isLoading}
              onSave={(payload) =>
                runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "mview",
                      action: "save",
                      payload,
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Widok zapisany.")
              }
              onRefresh={(view) =>
                runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "mview",
                      action: "refresh",
                      payload: { name: view.name, schema: view.schema ?? "public" },
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Widok odświeżony.")
              }
              onDrop={async (view) => {
                if (
                  !(await askConfirm({
                    title: "Usunąć zmaterializowany widok?",
                    message: `${view.schema ?? "public"}.${view.name} zostanie usunięty.`,
                    confirmLabel: "Usuń",
                    danger: true,
                  }))
                )
                  return;
                await runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "mview",
                      action: "drop",
                      payload: { name: view.name, schema: view.schema ?? "public" },
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Widok usunięty.");
              }}
              onShowProperties={(view) =>
                openProperties("mview", view.name, view.schema)
              }
            />
          )}
          {activeTab === "sequences" && (
            <SequencesPanel
              sequences={currentDatabase?.sequences ?? []}
              schemas={currentDatabase?.schemas ?? []}
              disabled={!selectedDatabase || isLoading}
              onSave={(payload) =>
                runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "sequence",
                      action: "save",
                      payload,
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Sekwencja zapisana.")
              }
              onNextVal={(seq) =>
                runAction(async () => {
                  const result = await api<{ value: number }>("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "sequence",
                      action: "nextval",
                      payload: { name: seq.name, schema: seq.schema ?? "public" },
                    }),
                  });
                  pushToast("nextval", `${seq.name} → ${result.value}`, "info");
                  await refresh(selectedDatabase, selectedTable);
                }, "Pobrano wartość.")
              }
              onReset={(seq, value) =>
                runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "sequence",
                      action: "reset",
                      payload: {
                        name: seq.name,
                        schema: seq.schema ?? "public",
                        value,
                      },
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Sekwencja zresetowana.")
              }
              onDrop={async (seq) => {
                if (
                  !(await askConfirm({
                    title: "Usunąć sekwencję?",
                    message: `${seq.schema ?? "public"}.${seq.name} zostanie usunięta.`,
                    confirmLabel: "Usuń",
                    danger: true,
                  }))
                )
                  return;
                await runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "sequence",
                      action: "drop",
                      payload: { name: seq.name, schema: seq.schema ?? "public" },
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Sekwencja usunięta.");
              }}
              onShowProperties={(seq) =>
                openProperties("sequence", seq.name, seq.schema)
              }
            />
          )}
          {activeTab === "domains" && (
            <DomainsPanel
              domains={currentDatabase?.domains ?? []}
              schemas={currentDatabase?.schemas ?? []}
              disabled={!selectedDatabase || isLoading}
              onSave={(payload) =>
                runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "domain",
                      action: "save",
                      payload,
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Domena zapisana.")
              }
              onDrop={async (domain) => {
                if (
                  !(await askConfirm({
                    title: "Usunąć domenę?",
                    message: `Domena ${domain.schema ?? "public"}.${domain.name} zostanie usunięta.`,
                    confirmLabel: "Usuń",
                    danger: true,
                  }))
                )
                  return;
                await runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "domain",
                      action: "drop",
                      payload: {
                        name: domain.name,
                        schema: domain.schema ?? "public",
                      },
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Domena usunięta.");
              }}
              onShowProperties={(domain) =>
                openProperties("domain", domain.name, domain.schema)
              }
            />
          )}
          {activeTab === "types" && (
            <TypesPanel
              types={currentDatabase?.compositeTypes ?? []}
              schemas={currentDatabase?.schemas ?? []}
              disabled={!selectedDatabase || isLoading}
              onSave={(payload) =>
                runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "type",
                      action: "save",
                      payload,
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Typ zapisany.")
              }
              onDrop={async (type) => {
                if (
                  !(await askConfirm({
                    title: "Usunąć typ?",
                    message: `Typ ${type.schema ?? "public"}.${type.name} zostanie usunięty.`,
                    confirmLabel: "Usuń",
                    danger: true,
                  }))
                )
                  return;
                await runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "type",
                      action: "drop",
                      payload: {
                        name: type.name,
                        schema: type.schema ?? "public",
                      },
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Typ usunięty.");
              }}
              onShowProperties={(type) =>
                openProperties("type", type.name, type.schema)
              }
            />
          )}
          {activeTab === "rules" && (
            <RulesPanel
              rules={currentDatabase?.rules ?? []}
              tables={currentDatabase?.tables ?? []}
              schemas={currentDatabase?.schemas ?? []}
              disabled={!selectedDatabase || isLoading}
              onSave={(payload) =>
                runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "rule",
                      action: "save",
                      payload,
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Reguła zapisana.")
              }
              onDrop={async (rule) => {
                if (
                  !(await askConfirm({
                    title: "Usunąć regułę?",
                    message: `Reguła ${rule.schema ?? "public"}.${rule.name} zostanie usunięta.`,
                    confirmLabel: "Usuń",
                    danger: true,
                  }))
                )
                  return;
                await runAction(async () => {
                  await api("/api/objects", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      type: "rule",
                      action: "drop",
                      payload: {
                        name: rule.name,
                        schema: rule.schema ?? "public",
                      },
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Reguła usunięta.");
              }}
              onShowProperties={(rule) =>
                openProperties("rule", rule.name, rule.schema)
              }
            />
          )}
          {activeTab === "dashboard" && (
            <DashboardPanel
              database={currentDatabase ?? null}
              healthStatus={healthStatus}
              consoleLog={consoleLog}
              onSelectTable={(tableName) => {
                if (!selectedDatabase) return;
                selectTable(selectedDatabase, tableName);
                setActiveTab("browse");
              }}
            />
          )}
          {activeTab === "erd" && (
            <ErdPanel
              database={currentDatabase ?? null}
              onSelectTable={(tableName) => {
                if (!selectedDatabase) return;
                selectTable(selectedDatabase, tableName);
                setActiveTab("structure");
              }}
            />
          )}
          {activeTab === "diff" && (
            <SchemaDiffPanel
              databases={state.databases}
              selectedDatabase={selectedDatabase}
            />
          )}
          {activeTab === "backup" && (
            <BackupPanel
              database={currentDatabase ?? null}
              disabled={!selectedDatabase || isLoading}
              askConfirm={askConfirm}
              onCreateSnapshot={async () => {
                if (!selectedDatabase) return;
                await runAction(async () => {
                  await api("/api/snapshots", {
                    method: "POST",
                    body: JSON.stringify({ databaseName: selectedDatabase }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Snapshot utworzony.");
              }}
              onRestore={async (snapshotId) => {
                if (!selectedDatabase) return;
                await runAction(async () => {
                  await api("/api/snapshots", {
                    method: "PATCH",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      snapshotId,
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Snapshot przywrócony.");
              }}
              onDelete={async (snapshotId) => {
                if (!selectedDatabase) return;
                await runAction(async () => {
                  await api("/api/snapshots", {
                    method: "DELETE",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      snapshotId,
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Snapshot usunięty.");
              }}
              onExportFull={() => {
                if (!selectedDatabase) return;
                window.open(
                  `/api/export?database=${encodeURIComponent(selectedDatabase)}&format=zip&exportType=both`,
                  "_blank",
                );
              }}
            />
          )}
          {activeTab === "jobs" && (
            <JobsPanel
              events={currentDatabase?.events ?? []}
              disabled={!selectedDatabase || isLoading}
              onSaveSteps={(eventName, steps) =>
                runAction(async () => {
                  await api("/api/jobs", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      eventName,
                      action: "save-steps",
                      steps,
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Kroki zapisane.")
              }
              onRun={(eventName) =>
                runAction(async () => {
                  const result = await api<{
                    status: string;
                    steps: { name: string; status: string; durationMs: number; message?: string }[];
                  }>("/api/jobs", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      eventName,
                      action: "run",
                    }),
                  });
                  pushToast(
                    `Job ${result.status === "success" ? "OK" : "FAIL"}`,
                    `${eventName}: ${result.steps.length} kroków.`,
                    result.status === "success" ? "success" : "error",
                  );
                  await refresh(selectedDatabase, selectedTable);
                }, "Job uruchomiony.")
              }
              onClearHistory={(eventName) =>
                runAction(async () => {
                  await api("/api/jobs", {
                    method: "POST",
                    body: JSON.stringify({
                      databaseName: selectedDatabase,
                      eventName,
                      action: "clear-history",
                    }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Historia wyczyszczona.")
              }
            />
          )}
          {activeTab === "tracking" && (
            <TrackingPanel
              entries={currentDatabase?.tracking ?? []}
              onClear={async () => {
                if (!selectedDatabase) return;
                if (
                  !(await askConfirm({
                    title: "Wyczyścić historię?",
                    message: "Wszystkie wpisy z historii zostaną usunięte.",
                    confirmLabel: "Wyczyść",
                    danger: true,
                  }))
                )
                  return;
                await runAction(async () => {
                  await api("/api/audit", {
                    method: "DELETE",
                    body: JSON.stringify({ databaseName: selectedDatabase }),
                  });
                  await refresh(selectedDatabase, selectedTable);
                }, "Historia wyczyszczona.");
              }}
              onExport={() => {
                if (!currentDatabase) return;
                const columns = ["createdAt", "action", "objectName", "sql"];
                downloadText(
                  `${selectedDatabase}-tracking.csv`,
                  toCsv(
                    columns,
                    (currentDatabase.tracking ?? []).map((entry) => ({
                      createdAt: entry.createdAt,
                      action: entry.action,
                      objectName: entry.objectName,
                      sql: entry.sql ?? "",
                    })),
                  ),
                  "text/csv",
                );
              }}
            />
          )}
          {activeTab === "settings" && (
            <SettingsPanel
              readOnly={readOnly}
              onToggleReadOnly={toggleReadOnly}
              dangerVerifyByName={dangerVerifyByName}
              onToggleDangerVerify={toggleDangerVerify}
              confirmOnDelete={confirmOnDelete}
              onToggleConfirmOnDelete={toggleConfirmOnDelete}
              compactMode={compactMode}
              onToggleCompactMode={toggleCompactMode}
              showRowNumbers={showRowNumbers}
              onToggleShowRowNumbers={toggleShowRowNumbers}
              autoRefresh={autoRefresh}
              onToggleAutoRefresh={toggleAutoRefresh}
              autoRefreshInterval={autoRefreshInterval}
              onChangeAutoRefreshInterval={changeAutoRefreshInterval}
              themeId={themeId}
              onChangeTheme={changeTheme}
              currentThemeName={currentTheme.name}
              stats={stats}
              healthStatus={healthStatus}
              consoleLog={consoleLog}
              onResetPreferences={() =>
                runAction(async () => {
                  if (
                    !(await askConfirm({
                      title: "Zresetować ustawienia?",
                      message:
                        "Wszystkie preferencje panelu (motyw, tryb kompaktowy, blokady itp.) zostaną zresetowane do wartości domyślnych. Dane w bazie pozostają nietknięte.",
                      confirmLabel: "Zresetuj",
                      danger: true,
                    }))
                  )
                    throw new Error("Anulowano resetowanie.");
                  resetPreferences();
                }, "Ustawienia zresetowane.", { mutates: false })
              }
              onExportPreferences={() => {
                const preferences = {
                  themeId,
                  compactMode,
                  showRowNumbers,
                  autoRefresh,
                  autoRefreshInterval,
                  readOnly,
                  dangerVerifyByName,
                  confirmOnDelete,
                  exportedAt: new Date().toISOString(),
                  version: APP_VERSION,
                };
                downloadText(
                  "atlas-preferences.json",
                  JSON.stringify(preferences, null, 2),
                  "application/json",
                );
                pushLog("info", "settings", "Wyeksportowano ustawienia panelu.");
              }}
              onImportPreferences={(file) =>
                runAction(async () => {
                  const text = await file.text();
                  let parsed: Record<string, unknown>;
                  try {
                    parsed = JSON.parse(text) as Record<string, unknown>;
                  } catch {
                    throw new Error("Niepoprawny plik JSON.");
                  }
                  if (typeof parsed.themeId === "string") changeTheme(parsed.themeId);
                  if (typeof parsed.compactMode === "boolean" && parsed.compactMode !== compactMode)
                    toggleCompactMode();
                  if (
                    typeof parsed.showRowNumbers === "boolean" &&
                    parsed.showRowNumbers !== showRowNumbers
                  )
                    toggleShowRowNumbers();
                  if (
                    typeof parsed.autoRefresh === "boolean" &&
                    parsed.autoRefresh !== autoRefresh
                  )
                    toggleAutoRefresh();
                  if (typeof parsed.autoRefreshInterval === "number")
                    changeAutoRefreshInterval(parsed.autoRefreshInterval);
                  if (typeof parsed.readOnly === "boolean" && parsed.readOnly !== readOnly)
                    toggleReadOnly();
                  if (
                    typeof parsed.dangerVerifyByName === "boolean" &&
                    parsed.dangerVerifyByName !== dangerVerifyByName
                  )
                    toggleDangerVerify();
                  if (
                    typeof parsed.confirmOnDelete === "boolean" &&
                    parsed.confirmOnDelete !== confirmOnDelete
                  )
                    toggleConfirmOnDelete();
                  pushLog("success", "settings", "Wczytano ustawienia panelu.");
                }, "Ustawienia zaimportowane.", { mutates: false })
              }
            />
          )}
          {activeTab === "console" && (
            <ConsolePanel
              entries={consoleLog}
              healthStatus={healthStatus}
              selectedDatabase={selectedDatabase}
              selectedTable={selectedTable}
              readOnly={readOnly}
              onClear={() => {
                setConsoleLog([]);
                pushLog("info", "console", "Konsola wyczyszczona.");
              }}
              onPing={() =>
                runAction(async () => {
                  const startedAt = Date.now();
                  const response = await fetch("/api/health", {
                    cache: "no-store",
                  });
                  const latency = Date.now() - startedAt;
                  if (!response.ok) throw new Error(`HTTP ${response.status}`);
                  const data = (await response.json()) as { version?: string };
                  pushLog(
                    "success",
                    "ping",
                    `API odpowiada (${latency} ms).`,
                    `wersja: ${data.version ?? "?"}`,
                  );
                  setHealthStatus({
                    online: true,
                    latencyMs: latency,
                    lastChecked: new Date().toISOString(),
                  });
                }, "API odpowiada.", { mutates: false })
              }
            />
          )}
        </div>
      </section>
    </main>
  );
}

const COLUMN_TYPE_META_LOOKUP = new Map(
  COLUMN_TYPES.map((meta) => [meta.name, meta]),
);

function getCategory(type: string): ColumnCategory {
  return COLUMN_TYPE_META_LOOKUP.get(type as never)?.category ?? "string";
}

function ColumnValueInput({
  column,
  value,
  isNull,
  disabled,
  placeholder,
  onChange,
}: {
  column: LocalDbColumn;
  value: string;
  isNull: boolean;
  disabled?: boolean;
  placeholder?: string;
  onChange: (next: string) => void;
}) {
  const category = getCategory(column.type);
  const fieldDisabled = Boolean(disabled || isNull);
  const baseProps = {
    value,
    disabled: fieldDisabled,
    placeholder,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(event.target.value),
  };

  if (column.type === "ENUM" || column.type === "SET") {
    if (column.type === "ENUM" && column.enumValues && column.enumValues.length > 0) {
      return (
        <select
          {...(baseProps as React.SelectHTMLAttributes<HTMLSelectElement>)}
          className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
        >
          <option value="">— wybierz —</option>
          {column.enumValues.map((option) => (
            <option key={option} value={option}>{option}
            </option>
          ))}
        </select>
      );
    }
    return (
      <Input
        {...(baseProps as React.InputHTMLAttributes<HTMLInputElement>)}
        placeholder={
          column.enumValues && column.enumValues.length > 0
            ? `np. ${column.enumValues.slice(0, 3).join(", ")}`
            : placeholder ?? "wartość lub wartości oddzielone przecinkiem"
        }
      />
    );
  }

  switch (category) {
    case "boolean":
      return (
        <select
          {...(baseProps as React.SelectHTMLAttributes<HTMLSelectElement>)}
          className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
        >
          <option value="">domyślnie</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    case "json":
    case "xml":
      return (
        <Textarea
          {...(baseProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          className="min-h-10 resize-y font-mono"
        />
      );
    case "binary":
      return (
        <Textarea
          {...(baseProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          className="min-h-10 resize-y font-mono"
          placeholder={placeholder ?? "Base64 lub 0x… (hex)"}
        />
      );
    case "integer":
    case "year":
      return (
        <Input
          {...(baseProps as React.InputHTMLAttributes<HTMLInputElement>)}
          type="number"
          step={1}
          min={column.unsigned ? 0 : undefined}
        />
      );
    case "decimal":
      return (
        <Input
          {...(baseProps as React.InputHTMLAttributes<HTMLInputElement>)}
          type="number"
          step="any"
          min={column.unsigned ? 0 : undefined}
        />
      );
    case "date":
      return (
        <Input
          {...(baseProps as React.InputHTMLAttributes<HTMLInputElement>)}
          type="date"
        />
      );
    case "time":
      return (
        <Input
          {...(baseProps as React.InputHTMLAttributes<HTMLInputElement>)}
          type="time"
          step={1}
        />
      );
    case "datetime":
      return (
        <Input
          {...(baseProps as React.InputHTMLAttributes<HTMLInputElement>)}
          type="datetime-local"
          step={1}
        />
      );
    case "uuid":
      return (
        <Input
          {...(baseProps as React.InputHTMLAttributes<HTMLInputElement>)}
          placeholder={placeholder ?? "auto lub UUID"}
        />
      );
    case "network":
      return (
        <Input
          {...(baseProps as React.InputHTMLAttributes<HTMLInputElement>)}
          placeholder={placeholder ?? (column.type === "MACADDR" ? "aa:bb:cc:dd:ee:ff" : "192.168.0.1")}
        />
      );
    case "geometry":
      return (
        <Input
          {...(baseProps as React.InputHTMLAttributes<HTMLInputElement>)}
          placeholder={placeholder ?? "(x, y) lub WKT"}
        />
      );
    case "string":
    default:
      if (column.type === "TEXT" || column.type === "MEDIUMTEXT" || column.type === "LONGTEXT") {
        return (
          <Textarea
            {...(baseProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            className="min-h-10 resize-y font-mono"
          />
        );
      }
      return (
        <Input
          {...(baseProps as React.InputHTMLAttributes<HTMLInputElement>)}
          maxLength={column.length}
        />
      );
  }
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-semibold text-zinc-200">{label}</div>
        <div className="text-xs text-zinc-500">{description}</div>
      </div>
      <input
        type="checkbox"
        className="h-5 w-5 cursor-pointer rounded border-zinc-700 bg-zinc-900 text-zinc-300 focus:ring-0"
        checked={checked}
        onChange={onChange}
      />
    </div>
  );
}

function ToastViewport({
  toasts,
  onClose,
}: {
  toasts: Toast[];
  onClose: (id: string) => void;
}) {
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col-reverse gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`atlas-toast pointer-events-auto ${toast.exiting ? "atlas-toast-exit" : ""} rounded-md border p-4 shadow-2xl backdrop-blur ${toast.type === "success" ? "border-emerald-700 bg-emerald-950/90 text-emerald-100" : toast.type === "error" ? "border-red-700 bg-red-950/90 text-red-100" : "border-zinc-700 bg-zinc-800/95 text-zinc-100"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">{toast.title}</div>{toast.message ? (
                <div className="mt-1 text-sm opacity-80">{toast.message}</div>
              ) : null}
            </div>
            <button
              className="rounded px-2 text-sm opacity-70 hover:bg-white/10 hover:opacity-100"
              onClick={() => onClose(toast.id)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({
  dialog,
  onClose,
}: {
  dialog: ConfirmDialogState;
  onClose: (value: boolean) => void;
}) {
  const [typedName, setTypedName] = useState("");
  const requireName = dialog.requireName;
  const canConfirm = !requireName || typedName === requireName;

  function handleConfirm() {
    if (!canConfirm) return;
    onClose(true);
  }

  return (
    <div
      className="atlas-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={() => onClose(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose(false);
      }}
      role="presentation"
    >
      <div
        className="atlas-dialog w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div id="confirm-title" className="text-lg font-semibold text-zinc-100">
          {dialog.title}
        </div>
        <div className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-400">
          {dialog.message}
        </div>
        {requireName ? (
          <div className="mt-4 space-y-2">
            <Label htmlFor="confirm-name">
              Wpisz <span className="font-mono text-zinc-200">{requireName}</span>, aby potwierdzić
            </Label>
            <Input
              id="confirm-name"
              autoFocus
              value={typedName}
              onChange={(event) => setTypedName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleConfirm();
                if (event.key === "Escape") onClose(false);
              }}
              placeholder={requireName}
            />
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => onClose(false)}>
            Anuluj
          </Button>
          <Button
            variant={dialog.danger ? "danger" : "success"}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {dialog.confirmLabel ?? "Potwierdź"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditRecordForm({
  table,
  rowIndex,
  values,
  nulls,
  setValues,
  setNulls,
  onSave,
  onCancel,
}: {
  table: LocalDbTable;
  rowIndex: number;
  values: Record<string, string>;
  nulls: Record<string, boolean>;
  setValues: Dispatch<SetStateAction<Record<string, string>>>;
  setNulls: Dispatch<SetStateAction<Record<string, boolean>>>;
  parseValue: (type: string, value: string, isNull: boolean) => unknown;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mb-4 max-w-full overflow-hidden rounded-md border border-zinc-700 bg-zinc-800 p-4">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-semibold">
            Edycja danych rekordu #{rowIndex + 1}
          </div>
          <div className="text-sm text-zinc-500">
            Zmieniaj wartości w polach przypisanych do kolumn tabeli{" "}
            {table.name}.
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button onClick={onSave}>Zapisz</Button>
          <Button variant="secondary" onClick={onCancel}>
            Anuluj
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="border border-zinc-700 px-3 py-2">Kolumna</th>
              <th className="border border-zinc-700 px-3 py-2">Typ</th>
              <th className="border border-zinc-700 px-3 py-2">Wartość</th>
              <th className="w-24 border border-zinc-700 px-3 py-2">NULL</th>
            </tr>
          </thead>
          <tbody>
            {table.columns.map((column) => {
              const value = values[column.name] ?? "";
              const isNull = Boolean(nulls[column.name]);
              return (
                <tr key={column.name} className="align-top">
                  <td className="border border-zinc-700 px-3 py-2 font-mono">
                    <div className="font-semibold">{column.name}</div>
                    <div className="text-xs text-zinc-500">
                      {column.primaryKey ? "PRIMARY " : ""}
                      {column.autoIncrement ? "AUTO_INCREMENT" : ""}
                    </div>
                  </td>
                  <td className="border border-zinc-700 px-3 py-2 text-zinc-400">
                    {column.type}
                    <br />
                    {column.nullable ? "NULL" : "NOT NULL"}
                  </td>
                  <td className="border border-zinc-700 px-3 py-2">
                    <ColumnValueInput
                      column={column}
                      value={value}
                      isNull={isNull}
                      onChange={(next) =>
                        setValues((current) => ({
                          ...current,
                          [column.name]: next,
                        }))
                      }
                    />
                  </td>
                  <td className="border border-zinc-700 px-3 py-2">
                    {column.nullable ? (
                      <label className="flex items-center gap-2 text-zinc-400">
                        <input
                          type="checkbox"
                          checked={isNull}
                          onChange={(event) =>
                            setNulls((current) => ({
                              ...current,
                              [column.name]: event.target.checked,
                            }))
                          }
                        />{" "}
                        NULL
                      </label>
                    ) : (
                      <span className="text-xs text-zinc-500">nie</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GlobalSearchDialog({
  databases,
  onClose,
  onOpenDatabase,
  onOpenTable,
  onOpenTab,
}: {
  databases: LocalDatabase[];
  onClose: () => void;
  onOpenDatabase: (database: LocalDatabase) => void;
  onOpenTable: (databaseName: string, tableName: string) => void;
  onOpenTab: (tab: Tab) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: {
      key: string;
      type: string;
      label: string;
      hint: string;
      action: () => void;
    }[] = [];
    for (const db of databases) {
      items.push({
        key: `db:${db.name}`,
        type: "Baza",
        label: db.name,
        hint: `${db.tables.length} tabel`,
        action: () => onOpenDatabase(db),
      });
      for (const table of db.tables) {
        items.push({
          key: `table:${db.name}.${table.name}`,
          type: "Tabela",
          label: `${db.name}.${table.name}`,
          hint: `${table.columns.length} kolumn · ${table.rows.length} wierszy`,
          action: () => onOpenTable(db.name, table.name),
        });
        for (const column of table.columns) {
          items.push({
            key: `column:${db.name}.${table.name}.${column.name}`,
            type: "Kolumna",
            label: `${db.name}.${table.name}.${column.name}`,
            hint: column.type,
            action: () => onOpenTable(db.name, table.name),
          });
        }
      }
      for (const view of db.views ?? []) {
        items.push({
          key: `view:${db.name}.${view.schema ?? "public"}.${view.name}`,
          type: "Widok",
          label: `${db.name}.${view.schema ?? "public"}.${view.name}`,
          hint: "VIEW",
          action: () => onOpenTab("views"),
        });
      }
      for (const routine of db.routines ?? []) {
        items.push({
          key: `routine:${db.name}.${routine.name}`,
          type: routine.kind,
          label: `${db.name}.${routine.name}`,
          hint: routine.returns ?? "",
          action: () => onOpenTab("routines"),
        });
      }
    }
    if (!q) return items.slice(0, 40);
    return items
      .map((item) => ({
        item,
        score:
          item.label.toLowerCase().includes(q) ? 2 : item.hint.toLowerCase().includes(q) ? 1 : 0,
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item)
      .slice(0, 60);
  }, [databases, query, onOpenDatabase, onOpenTable, onOpenTab]);

  return (
    <div className="atlas-dialog-backdrop fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[10vh]">
      <div className="atlas-dialog w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="border-b border-zinc-700 p-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Szukaj bazy, tabeli, kolumny, widoku, procedury… (Ctrl+K)"
            className="flex h-10 w-full min-w-0 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
              if (event.key === "Enter" && results[0]) results[0].action();
            }}
          />
        </div>
        <ul className="max-h-[60vh] overflow-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-zinc-500">
              Brak wyników.
            </li>
          ) : (
            results.map((result) => (
              <li key={result.key}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-zinc-800"
                  onClick={result.action}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-sm text-zinc-200">
                      {result.label}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">
                      {result.hint}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                    {result.type}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function ObjectBrowserTree({
  database,
  selectedTable,
  activeTab,
  matchedTables,
  onSelectTable,
  onSelectTab,
}: {
  database: LocalDatabase;
  selectedTable: string;
  activeTab: Tab;
  matchedTables: LocalDbTable[];
  onSelectDatabase: () => void;
  onSelectTable: (tableName: string) => void;
  onSelectTab: (tab: Tab) => void;
}) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(["tables"]),
  );

  function toggle(key: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const tables = matchedTables.length ? matchedTables : database.tables;
  const views = database.views ?? [];
  const mviews = database.materializedViews ?? [];
  const sequences = database.sequences ?? [];
  const domains = database.domains ?? [];
  const compositeTypes = database.compositeTypes ?? [];
  const rules = database.rules ?? [];
  const routines = database.routines ?? [];
  const triggers = database.triggers ?? [];
  const events = database.events ?? [];

  const groups: {
    key: string;
    label: string;
    icon: typeof Table2;
    count: number;
    tab?: Tab;
    children: React.ReactNode;
  }[] = [
    {
      key: "tables",
      label: "Tabele",
      icon: Table2,
      count: database.tables.length,
      tab: "browse",
      children:
        tables.length === 0 ? (
          <TreeEmpty>Brak tabel.</TreeEmpty>
        ) : (
          tables.map((table) => {
            const isActive =
              selectedTable === table.name &&
              activeTab !== "home" &&
              activeTab !== "database";
            return (
              <TreeRow
                key={table.name}
                icon={Table2}
                label={table.name}
                badge={String(table.rows.length)}
                active={isActive}
                onClick={() => onSelectTable(table.name)}
                title={`${table.rows.length} wierszy · ${table.columns.length} kolumn · ${table.indexes.length} indeksów`}
              />
            );
          })
        ),
    },
    {
      key: "views",
      label: "Widoki",
      icon: Eye,
      count: views.length,
      tab: "views",
      children:
        views.length === 0 ? (
          <TreeEmpty>Brak widoków.</TreeEmpty>
        ) : (
          views.map((view) => (
            <TreeRow
              key={`${view.schema ?? "public"}.${view.name}`}
              icon={Eye}
              label={view.name}
              onClick={() => onSelectTab("views")}
              active={activeTab === "views"}
            />
          ))
        ),
    },
    {
      key: "mviews",
      label: "Mat. widoki",
      icon: EyeOff,
      count: mviews.length,
      tab: "mviews",
      children:
        mviews.length === 0 ? (
          <TreeEmpty>Brak.</TreeEmpty>
        ) : (
          mviews.map((view) => (
            <TreeRow
              key={`${view.schema ?? "public"}.${view.name}`}
              icon={EyeOff}
              label={view.name}
              badge={String(view.rows.length)}
              onClick={() => onSelectTab("mviews")}
              active={activeTab === "mviews"}
            />
          ))
        ),
    },
    {
      key: "sequences",
      label: "Sekwencje",
      icon: Sparkles,
      count: sequences.length,
      tab: "sequences",
      children:
        sequences.length === 0 ? (
          <TreeEmpty>Brak.</TreeEmpty>
        ) : (
          sequences.map((seq) => (
            <TreeRow
              key={`${seq.schema ?? "public"}.${seq.name}`}
              icon={Sparkles}
              label={seq.name}
              badge={String(seq.current)}
              onClick={() => onSelectTab("sequences")}
              active={activeTab === "sequences"}
            />
          ))
        ),
    },
    {
      key: "domains",
      label: "Domeny",
      icon: Tag,
      count: domains.length,
      tab: "domains",
      children:
        domains.length === 0 ? (
          <TreeEmpty>Brak.</TreeEmpty>
        ) : (
          domains.map((domain) => (
            <TreeRow
              key={`${domain.schema ?? "public"}.${domain.name}`}
              icon={Tag}
              label={domain.name}
              badge={domain.baseType}
              onClick={() => onSelectTab("domains")}
              active={activeTab === "domains"}
            />
          ))
        ),
    },
    {
      key: "types",
      label: "Typy",
      icon: Layers,
      count: compositeTypes.length,
      tab: "types",
      children:
        compositeTypes.length === 0 ? (
          <TreeEmpty>Brak.</TreeEmpty>
        ) : (
          compositeTypes.map((type) => (
            <TreeRow
              key={`${type.schema ?? "public"}.${type.name}`}
              icon={Layers}
              label={type.name}
              badge={String(type.attributes.length)}
              onClick={() => onSelectTab("types")}
              active={activeTab === "types"}
            />
          ))
        ),
    },
    {
      key: "rules",
      label: "Reguły",
      icon: Shield,
      count: rules.length,
      tab: "rules",
      children:
        rules.length === 0 ? (
          <TreeEmpty>Brak.</TreeEmpty>
        ) : (
          rules.map((rule) => (
            <TreeRow
              key={`${rule.schema ?? "public"}.${rule.name}`}
              icon={Shield}
              label={rule.name}
              badge={rule.event}
              onClick={() => onSelectTab("rules")}
              active={activeTab === "rules"}
            />
          ))
        ),
    },
    {
      key: "routines",
      label: "Procedury",
      icon: Code2,
      count: routines.length,
      tab: "routines",
      children:
        routines.length === 0 ? (
          <TreeEmpty>Brak.</TreeEmpty>
        ) : (
          routines.map((routine) => (
            <TreeRow
              key={routine.name}
              icon={Code2}
              label={routine.name}
              badge={routine.kind === "FUNCTION" ? "F" : "P"}
              onClick={() => onSelectTab("routines")}
              active={activeTab === "routines"}
            />
          ))
        ),
    },
    {
      key: "triggers",
      label: "Wyzwalacze",
      icon: Power,
      count: triggers.length,
      tab: "triggers",
      children:
        triggers.length === 0 ? (
          <TreeEmpty>Brak.</TreeEmpty>
        ) : (
          triggers.map((trigger) => (
            <TreeRow
              key={trigger.name}
              icon={Power}
              label={trigger.name}
              badge={trigger.event}
              onClick={() => onSelectTab("triggers")}
              active={activeTab === "triggers"}
            />
          ))
        ),
    },
    {
      key: "events",
      label: "Zdarzenia",
      icon: RefreshCw,
      count: events.length,
      tab: "events",
      children:
        events.length === 0 ? (
          <TreeEmpty>Brak.</TreeEmpty>
        ) : (
          events.map((event) => (
            <TreeRow
              key={event.name}
              icon={RefreshCw}
              label={event.name}
              badge={event.enabled ? "ON" : "OFF"}
              onClick={() => onSelectTab("events")}
              active={activeTab === "events"}
            />
          ))
        ),
    },
  ];

  return (
    <div className="space-y-1">
      {groups.map((group) => {
        const Icon = group.icon;
        const isOpen = openGroups.has(group.key);
        return (
          <div key={group.key}>
            <div className="group flex items-center gap-1 rounded-md hover:bg-zinc-800/60">
              <button
                type="button"
                className="flex h-7 w-6 shrink-0 items-center justify-center rounded-md hover:bg-zinc-700/40"
                onClick={() => toggle(group.key)}
                title={isOpen ? "Zwiń" : "Rozwiń"}
              >
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-between gap-2 rounded-md px-1 py-1 text-left"
                onClick={() => {
                  if (group.tab) onSelectTab(group.tab);
                }}
              >
                <span className="flex min-w-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  <Icon className="h-3 w-3" />
                  {group.label}
                </span>
                <span className="shrink-0 rounded-full bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-500">
                  {group.count}
                </span>
              </button>
            </div>
            {isOpen ? <div className="pl-3">{group.children}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

function TreeRow({
  icon: Icon,
  label,
  badge,
  active,
  onClick,
  title,
}: {
  icon: typeof Table2;
  label: string;
  badge?: string;
  active?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[13px] ${active ? "bg-zinc-300 text-zinc-950" : "text-zinc-400 hover:bg-zinc-800"}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined ? (
        <span className="shrink-0 text-[10px] text-zinc-500">{badge}</span>
      ) : null}
    </button>
  );
}

function TreeEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-1 text-[11px] text-zinc-500">{children}</div>
  );
}

function HomeScreen({
  stats,
  databases,
  healthStatus,
  consoleLog,
  readOnly,
  autoRefresh,
  autoRefreshInterval,
  themeName,
  onSelectTab,
  onOpenDatabase,
  onOpenTable,
  onOpenSettings,
  onCreateDatabase,
  onRefresh,
}: {
  stats: {
    databases: number;
    tables: number;
    rows: number;
    columns: number;
    indexes: number;
    routines: number;
    events: number;
    triggers: number;
    tracking: number;
  };
  databases: LocalDatabase[];
  healthStatus: { online: boolean; latencyMs: number | null; lastChecked: string | null };
  consoleLog: ConsoleEntry[];
  readOnly: boolean;
  autoRefresh: boolean;
  autoRefreshInterval: number;
  themeName: string;
  onSelectTab: (tab: Tab) => void;
  onOpenDatabase: (database: LocalDatabase) => void;
  onOpenTable: (databaseName: string, tableName: string) => void;
  onOpenSettings: () => void;
  onCreateDatabase: () => void;
  onRefresh: () => void;
}) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return "Dobrej nocy";
    if (hour < 12) return "Dzień dobry";
    if (hour < 18) return "Witaj ponownie";
    return "Dobry wieczór";
  }, []);
  const today = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const cards: {
    label: string;
    value: number;
    icon: typeof Database;
    accent: string;
    onClick?: () => void;
    hint?: string;
  }[] = [
    {
      label: "Bazy danych",
      value: stats.databases,
      icon: Database,
      accent: "text-sky-400",
      hint: "Kliknij, aby zarządzać",
      onClick: () => {
        if (databases[0]) onOpenDatabase(databases[0]);
      },
    },
    {
      label: "Tabele",
      value: stats.tables,
      icon: Table2,
      accent: "text-emerald-400",
      hint: "Otwórz przegląd",
      onClick: () => onSelectTab("browse"),
    },
    {
      label: "Wiersze",
      value: stats.rows,
      icon: Filter,
      accent: "text-amber-400",
    },
    {
      label: "Kolumny",
      value: stats.columns,
      icon: Edit3,
      accent: "text-fuchsia-400",
    },
    {
      label: "Indeksy",
      value: stats.indexes,
      icon: Zap,
      accent: "text-cyan-400",
    },
    {
      label: "Procedury",
      value: stats.routines,
      icon: Code2,
      accent: "text-violet-400",
      hint: "Otwórz",
      onClick: () => onSelectTab("routines"),
    },
    {
      label: "Zdarzenia",
      value: stats.events,
      icon: RefreshCw,
      accent: "text-orange-400",
      hint: "Otwórz",
      onClick: () => onSelectTab("events"),
    },
    {
      label: "Wyzwalacze",
      value: stats.triggers,
      icon: Power,
      accent: "text-rose-400",
      hint: "Otwórz",
      onClick: () => onSelectTab("triggers"),
    },
    {
      label: "Wpisy śledzenia",
      value: stats.tracking,
      icon: Save,
      accent: "text-zinc-300",
      hint: "Historia zmian",
      onClick: () => onSelectTab("tracking"),
    },
  ];

  const topTables = useMemo(() => {
    return databases
      .flatMap((database) =>
        database.tables.map((table) => ({
          databaseName: database.name,
          tableName: table.name,
          rows: table.rows.length,
          columns: table.columns.length,
          indexes: table.indexes.length,
        })),
      )
      .sort((a, b) => b.rows - a.rows)
      .slice(0, 5);
  }, [databases]);

  const recentTracking = useMemo(() => {
    const entries = databases.flatMap((database) =>
      (database.tracking ?? []).map((entry) => ({
        databaseName: database.name,
        ...entry,
      })),
    );
    return entries
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 8);
  }, [databases]);

  const recentLogs = consoleLog.slice(0, 5);

  const tips = [
    {
      icon: Zap,
      title: "Skrót Ctrl + Enter",
      description: "Wykonuje aktualne zapytanie w konsoli SQL.",
      action: () => onSelectTab("sql"),
      actionLabel: "Otwórz konsolę SQL",
    },
    {
      icon: ShieldCheck,
      title: "Bezpieczeństwo",
      description: "Włącz tryb tylko-do-odczytu, gdy pracujesz z danymi produkcyjnymi.",
      action: onOpenSettings,
      actionLabel: "Ustawienia bezpieczeństwa",
    },
    {
      icon: Sparkles,
      title: "Snapshoty",
      description: "Twórz migawki bazy przed dużymi zmianami i przywracaj jednym klikiem.",
      action: () => onSelectTab("database"),
      actionLabel: "Otwórz bazę",
    },
    {
      icon: Terminal,
      title: "Konsola",
      description: "Sprawdzaj na żywo logi operacji, błędy API i latencję.",
      action: () => onSelectTab("console"),
      actionLabel: "Otwórz konsolę",
    },
  ];

  const quickActions: {
    label: string;
    description: string;
    icon: typeof Plus;
    onClick: () => void;
    accent?: string;
  }[] = [
    {
      label: "Nowa baza",
      description: "Utwórz pustą bazę danych.",
      icon: Plus,
      onClick: onCreateDatabase,
    },
    {
      label: "Konsola SQL",
      description: "Wykonaj zapytania SQL ad hoc.",
      icon: Code2,
      onClick: () => onSelectTab("sql"),
    },
    {
      label: "Kreator zapytania",
      description: "Zbuduj SELECT bez pisania SQL.",
      icon: Search,
      onClick: () => onSelectTab("query"),
    },
    {
      label: "Eksport",
      description: "Pobierz bazę jako SQL/JSON/ZIP.",
      icon: Download,
      onClick: () => onSelectTab("export"),
    },
    {
      label: "Import",
      description: "Wczytaj plik SQL/JSON/CSV.",
      icon: Upload,
      onClick: () => onSelectTab("import"),
    },
    {
      label: "Operacje",
      description: "ANALYZE, CHECK, rebuild indeksów.",
      icon: ShieldCheck,
      onClick: () => onSelectTab("operations"),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="atlas-panel relative overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 p-6">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{today}
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{greeting}.
            </h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">
              Atlas zarządza {stats.databases} {pluralizeBase(stats.databases)} i{" "}{stats.tables} {pluralize(stats.tables, "tabelą", "tabelami", "tabelami")} z{" "}{stats.rows.toLocaleString("pl-PL")} {pluralize(stats.rows, "wierszem", "wierszami", "wierszami")}.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Badge
                color={healthStatus.online ? "emerald" : "rose"}
                icon={healthStatus.online ? CheckCircle2 : XCircle}
              >
                API {healthStatus.online ? "online" : "offline"}
                {healthStatus.latencyMs !== null
                  ? ` · ${healthStatus.latencyMs} ms`
                  : ""}
              </Badge>
              <Badge color={readOnly ? "amber" : "sky"} icon={readOnly ? ShieldCheck : Edit3}>
                {readOnly ? "Tylko do odczytu" : "Zapis aktywny"}
              </Badge>
              <Badge color="zinc" icon={RefreshCw}>
                Auto-refresh {autoRefresh ? `co ${autoRefreshInterval} s` : "wyłączony"}
              </Badge>
              
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onRefresh} variant="secondary">
              <RefreshCw className="mr-2 h-4 w-4" /> Odśwież dane
            </Button>
            <Button onClick={onCreateDatabase} variant="success">
              <Plus className="mr-2 h-4 w-4" /> Nowa baza
            </Button>
            <Button onClick={onOpenSettings} variant="secondary">
              <Settings className="mr-2 h-4 w-4" /> Ustawienia
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          const Wrapper = card.onClick ? "button" : "div";
          return (
            <Wrapper
              key={card.label}
              onClick={card.onClick}
              className={`group flex h-full flex-col items-start gap-2 rounded-md border border-zinc-700 bg-zinc-800 p-4 text-left transition-colors ${card.onClick ? "cursor-pointer hover:border-zinc-500 hover:bg-zinc-800/80" : ""}`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {card.label}
                </span>
                <Icon className={`h-4 w-4 ${card.accent}`} />
              </div>
              <div className="text-3xl font-semibold tracking-tight">
                {Number(card.value).toLocaleString("pl-PL")}
              </div>{card.hint ? (
                <div className="text-[11px] text-zinc-500 group-hover:text-zinc-300">
                  {card.hint}
                </div>
              ) : null}
            </Wrapper>
          );
        })}
      </div>

      <Panel
        title="Szybkie akcje"
        description="Najczęściej używane operacje. Jeden klik i jesteś w odpowiedniej zakładce."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`flex items-start gap-3 rounded-md border bg-zinc-900 p-4 text-left transition-colors hover:bg-zinc-800 ${action.accent ?? "border-zinc-700 hover:border-zinc-500"}`}
              >
                <span className="rounded-md bg-zinc-800 p-2">
                  <Icon className="h-4 w-4 text-zinc-200" />
                </span>
                <span>
                  <span className="block font-semibold">{action.label}</span>
                  <span className="block text-xs text-zinc-400">
                    {action.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Bazy i tabele"
          description="Szybki przegląd. Kliknięcie tabeli otwiera ją w widoku Przeglądaj."
        >
          {databases.length === 0 ? (
            <EmptyHomeState onCreate={onCreateDatabase} />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">{databases.map((database) => {
                const totalRows = database.tables.reduce(
                  (sum, table) => sum + table.rows.length,
                  0,
                );
                return (
                  <div
                    key={database.name}
                    className="rounded-md border border-zinc-700 bg-zinc-900 p-4"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left hover:bg-zinc-800"
                      onClick={() => onOpenDatabase(database)}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <Database className="h-4 w-4 text-sky-400" />
                        {database.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {database.tables.length}{" "}
                        {pluralize(database.tables.length, "tabela", "tabele", "tabel")}
                        {" · "}
                        {totalRows.toLocaleString("pl-PL")}{" "}
                        {pluralize(totalRows, "wiersz", "wiersze", "wierszy")}
                      </span>
                    </button>
                    <div className="mt-2 space-y-1">
                      {database.tables.length === 0 ? (
                        <button
                          type="button"
                          className="w-full rounded-md border border-dashed border-zinc-700 px-3 py-2 text-left text-sm text-zinc-500 hover:border-zinc-500 hover:bg-zinc-800"
                          onClick={() => onOpenDatabase(database)}
                        >
                          Brak tabel — kliknij, aby utworzyć pierwszą.
                        </button>
                      ) : (
                        database.tables.slice(0, 6).map((table) => (
                          <button
                            type="button"
                            key={table.name}
                            className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm hover:bg-zinc-800"
                            onClick={() => onOpenTable(database.name, table.name)}
                          >
                            <span className="flex items-center gap-2">
                              <Table2 className="h-3.5 w-3.5 text-emerald-400" />
                              {table.name}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {table.rows.length} / {table.columns.length}
                            </span>
                          </button>
                        ))
                      )}
                      {database.tables.length > 6 ? (
                        <button
                          type="button"
                          className="w-full rounded-md px-3 py-1.5 text-left text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                          onClick={() => onOpenDatabase(database)}
                        >
                          + {database.tables.length - 6} więcej…
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <CardBlock
            title="Top 5 tabel po liczbie wierszy"
            right={
              topTables.length > 0 ? (
                <button
                  className="text-xs text-zinc-500 hover:text-zinc-200"
                  onClick={() => onSelectTab("browse")}
                >
                  Przeglądaj
                </button>
              ) : null
            }
          >
            {topTables.length === 0 ? (
              <div className="text-sm text-zinc-500">Brak danych.</div>
            ) : (
              <ul className="space-y-2">
                {topTables.map((table) => {
                  const max = topTables[0]?.rows ?? 1;
                  const ratio = max === 0 ? 0 : (table.rows / max) * 100;
                  return (
                    <li key={`${table.databaseName}.${table.tableName}`}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-zinc-800"
                        onClick={() => onOpenTable(table.databaseName, table.tableName)}
                      >
                        <span className="truncate font-mono text-xs text-zinc-300">
                          {table.databaseName}.{table.tableName}
                        </span>
                        <span className="shrink-0 text-xs text-zinc-500">
                          {table.rows.toLocaleString("pl-PL")}
                        </span>
                      </button>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-emerald-500/70"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBlock>

          <CardBlock
            title="Ostatnie zmiany"
            right={
              recentTracking.length > 0 ? (
                <button
                  className="text-xs text-zinc-500 hover:text-zinc-200"
                  onClick={() => onSelectTab("tracking")}
                >
                  Wszystkie
                </button>
              ) : null
            }
          >
            {recentTracking.length === 0 ? (
              <div className="text-sm text-zinc-500">Brak wpisów.</div>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {recentTracking.map((entry, index) => (
                  <li
                    key={`${entry.createdAt}-${index}`}
                    className="rounded-md border border-zinc-700 bg-zinc-900 p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-zinc-300">
                        {entry.action}
                      </span>
                      <span className="text-zinc-500">
                        {entry.createdAt.replace("T", " ").replace(/\..*/, "")}
                      </span>
                    </div>
                    <div className="text-zinc-500">
                      {entry.databaseName}
                      {entry.objectName ? ` · ${entry.objectName}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBlock>

          <CardBlock
            title="Ostatnie logi"
            right={
              <button
                className="text-xs text-zinc-500 hover:text-zinc-200"
                onClick={() => onSelectTab("console")}
              >
                Konsola
              </button>
            }
          >
            {recentLogs.length === 0 ? (
              <div className="text-sm text-zinc-500">Brak logów.</div>
            ) : (
              <ul className="space-y-1 font-mono text-[11px]">
                {recentLogs.map((entry) => (
                  <li key={entry.id} className="leading-relaxed">
                    <span className="text-zinc-600">
                      {entry.timestamp.replace("T", " ").replace(/\..*/, "")}
                    </span>{" "}
                    <span className={getLevelClass(entry.level)}>
                      {entry.level.toUpperCase()}
                    </span>{" "}
                    <span className="text-zinc-200">{entry.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBlock>
        </div>
      </div>

      <Panel
        title="Wskazówki"
        description="Przewodnik po najważniejszych funkcjach panelu."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tips.map((tip) => {
            const Icon = tip.icon;
            return (
              <div
                key={tip.title}
                className="flex h-full flex-col rounded-md border border-zinc-700 bg-zinc-900 p-4"
              >
                <Icon className="h-5 w-5 text-zinc-200" />
                <div className="mt-2 font-semibold">{tip.title}</div>
                <p className="mt-1 flex-1 text-xs text-zinc-400">
                  {tip.description}
                </p>
                <button
                  type="button"
                  className="mt-3 self-start text-xs text-zinc-300 underline-offset-2 hover:underline"
                  onClick={tip.action}
                >
                  {tip.actionLabel} →
                </button>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function EmptyHomeState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-md border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center">
      <Database className="mx-auto h-8 w-8 text-zinc-500" />
      <div className="mt-3 text-base font-semibold">Brak baz danych</div>
      <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
        Utwórz pierwszą bazę z paska bocznego lub kliknij przycisk poniżej.
      </p>
      <Button className="mt-4" variant="success" onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" /> Utwórz nową bazę
      </Button>
    </div>
  );
}

function Badge({
  children,
  color,
  icon: Icon,
}: {
  children: React.ReactNode;
  color: "emerald" | "rose" | "amber" | "sky" | "zinc";
  icon?: typeof CheckCircle2;
}) {
  const palette = {
    emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    rose: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    amber: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    sky: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    zinc: "border-zinc-700 bg-zinc-800 text-zinc-300",
  }[color];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${palette}`}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {children}
    </span>
  );
}

function pluralize(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function pluralizeBase(count: number) {
  return pluralize(count, "bazą", "bazami", "bazami");
}

function Panel({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="atlas-panel max-w-full space-y-5 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm leading-6 text-zinc-500">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

function CardBlock({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="atlas-card max-w-full space-y-4 overflow-hidden rounded-md border border-zinc-700 bg-zinc-800 p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold leading-6">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function ConnectionFields({
  form,
  setForm,
  showPassword,
  setShowPassword,
  callback,
  onRandomPassword,
  onCopyCallback,
  onSave,
}: {
  form: {
    host: string;
    port: string;
    databaseName: string;
    username: string;
    password: string;
  };
  setForm: Dispatch<
    SetStateAction<{
      host: string;
      port: string;
      databaseName: string;
      username: string;
      password: string;
    }>
  >;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  callback: string;
  onRandomPassword: () => void;
  onCopyCallback: () => void;
  onSave: () => void;
}) {
  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  return (
    <div className="space-y-4">
      <div>
        <div className="font-semibold text-zinc-200">Dane połączenia</div>
        <div className="mt-1 text-xs leading-5 text-zinc-500">
          Host, port, login, hasło i callback wybranej bazy.
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="connectionHost">Host/IP</Label>
          <Input
            id="connectionHost"
            value={form.host}
            onChange={(event) => update("host", event.target.value)}
            placeholder="127.0.0.1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="connectionPort">Port</Label>
          <Input
            id="connectionPort"
            type="number"
            min={1}
            max={65535}
            value={form.port}
            onChange={(event) => update("port", event.target.value)}
            placeholder="4100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="connectionDatabase">Nazwa bazy danych</Label>
          <Input
            id="connectionDatabase"
            value={form.databaseName}
            onChange={(event) => update("databaseName", event.target.value)}
            placeholder="firma_db"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="connectionUsername">Login/username</Label>
          <Input
            id="connectionUsername"
            value={form.username}
            onChange={(event) => update("username", event.target.value)}
            placeholder="firma_db_user"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="connectionPassword">Hasło</Label>
        <div className="grid grid-cols-[minmax(0,1fr)_40px_40px] gap-2">
          <Input
            id="connectionPassword"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            className="w-10 px-0"
            title="Random password"
            onClick={onRandomPassword}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-10 px-0"
            title={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="connectionCallback">Callback/URL połączenia</Label>
        <Input
          id="connectionCallback"
          readOnly
          value={callback}
          className="font-mono text-xs"
        />
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button variant="success" onClick={onSave}>
          Zapisz dane połączenia
        </Button>
        <Button variant="secondary" onClick={onCopyCallback}>
          Kopiuj callback
        </Button>
      </div>
    </div>
  );
}

function OperationsAdvanced({
  databaseName,
  tableName,
}: {
  databaseName: string;
  tableName: string;
}) {
  type AnalyzeResult = {
    table: string;
    rows: number;
    columns: {
      column: string;
      type: string;
      totalRows: number;
      nullCount: number;
      nullPercent: number;
      distinctCount: number;
      topValues: { value: string; count: number }[];
      numericStats?: { min: number; max: number; avg: number; sum: number };
      stringStats?: { minLength: number; maxLength: number; avgLength: number };
    }[];
  };
  type IntegrityResult = {
    issues: {
      type: string;
      table: string;
      column?: string;
      rowIndex?: number;
      detail: string;
    }[];
    checked: number;
  };
  const [analyze, setAnalyze] = useState<AnalyzeResult | null>(null);
  const [integrity, setIntegrity] = useState<IntegrityResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(operation: "analyze" | "check" | "rebuildIndexes") {
    if (!databaseName) return;
    if (operation === "analyze" && !tableName) {
      setError("Wybierz tabelę aby uruchomić ANALYZE.");
      return;
    }
    setBusy(operation);
    setError(null);
    try {
      const response = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseName,
          tableName: operation === "rebuildIndexes" || operation === "check" ? tableName || undefined : tableName,
          operation,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Błąd operacji.");
      if (operation === "analyze") {
        setAnalyze(data as AnalyzeResult);
      } else if (operation === "check") {
        setIntegrity(data as IntegrityResult);
      } else if (operation === "rebuildIndexes") {
        setError(null);
        setIntegrity(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      <CardBlock title="ANALYZE">
        <p className="text-sm text-zinc-400">
          Statystyki kolumn aktywnej tabeli: NULL %, kardynalność, top 5
          wartości, statystyki liczbowe i długości tekstu.
        </p>
        <Button
          className="mt-3"
          disabled={busy !== null || !tableName}
          onClick={() => call("analyze")}
        >
          {busy === "analyze" ? "Analizuję…" : "Uruchom ANALYZE"}
        </Button>
        {analyze ? (
          <div className="mt-3 space-y-3 text-xs">
            <div className="text-zinc-400">{analyze.table} · {analyze.rows} wierszy
            </div>
            {analyze.columns.map((column) => (
              <div
                key={column.column}
                className="rounded border border-zinc-700 bg-zinc-900 p-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-zinc-200">
                    {column.column}
                  </span>
                  <span className="text-zinc-500">{column.type}</span>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-1 text-zinc-400">
                  <div>
                    NULL: {column.nullCount} ({column.nullPercent.toFixed(1)}%)
                  </div>
                  <div>Distinct: {column.distinctCount}</div>
                  {column.numericStats ? (
                    <>
                      <div>Min: {column.numericStats.min}</div>
                      <div>Max: {column.numericStats.max}</div>
                      <div>Avg: {column.numericStats.avg.toFixed(2)}</div>
                      <div>Sum: {column.numericStats.sum}</div>
                    </>
                  ) : null}
                  {column.stringStats ? (
                    <>
                      <div>Min len: {column.stringStats.minLength}</div>
                      <div>Max len: {column.stringStats.maxLength}</div>
                      <div>Avg len: {column.stringStats.avgLength.toFixed(1)}</div>
                    </>
                  ) : null}
                </div>
                {column.topValues.length > 0 ? (
                  <div className="mt-1 text-zinc-500">
                    Top: {column.topValues
                      .map((entry) => `${entry.value} (${entry.count})`)
                      .join(", ")}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </CardBlock>

      <CardBlock title="CHECK">
        <p className="text-sm text-zinc-400">
          Walidator integralności: NOT NULL, dopasowanie typów, UNIQUE, ENUM,
          długości i osierocone kolumny.
        </p>
        <Button
          className="mt-3"
          disabled={busy !== null || !databaseName}
          onClick={() => call("check")}
        >
          {busy === "check" ? "Sprawdzam…" : tableName ? `Sprawdź ${tableName}` : "Sprawdź całą bazę"}
        </Button>
        {integrity ? (
          <div className="mt-3 text-xs">
            <div className="text-zinc-400">
              Sprawdzono {integrity.checked} wierszy ·{" "}
              <span
                className={
                  integrity.issues.length === 0
                    ? "text-emerald-400"
                    : "text-amber-400"
                }
              >
                {integrity.issues.length} problemów
              </span>
            </div>
            {integrity.issues.length > 0 ? (
              <ul className="mt-2 max-h-48 space-y-1 overflow-auto pr-1">
                {integrity.issues.map((issue, index) => (
                  <li
                    key={index}
                    className="rounded border border-amber-700/40 bg-amber-950/20 p-2 text-zinc-300"
                  >
                    <span className="font-mono text-amber-400">{issue.type}</span>{" "}
                    <span className="text-zinc-500">
                      {issue.table}
                      {issue.column ? `.${issue.column}` : ""}
                      {issue.rowIndex !== undefined ? ` (#${issue.rowIndex + 1})` : ""}
                    </span>
                    <div>{issue.detail}</div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CardBlock>

      <CardBlock title="Indeksy">
        <p className="text-sm text-zinc-400">
          Przebudowuje (sanityzuje) wszystkie indeksy: usuwa odniesienia do
          nieistniejących kolumn i duplikaty nazw.
        </p>
        <Button
          className="mt-3"
          disabled={busy !== null || !databaseName}
          onClick={() => call("rebuildIndexes")}
        >
          {busy === "rebuildIndexes"
            ? "Przebudowuję…"
            : tableName
              ? `Przebuduj indeksy ${tableName}`
              : "Przebuduj indeksy całej bazy"}
        </Button>
        {error ? (
          <div className="mt-2 text-xs text-rose-400">{error}</div>
        ) : null}
      </CardBlock>
    </div>
  );
}

function DatabaseManagementCard({
  databaseName,
  recycleBin,
  onSnapshotCreate,
  onSnapshotRestore,
  onSnapshotDelete,
  onRecycleRestore,
  onRecycleDelete,
  onRecycleClear,
  onDuplicate,
}: {
  databaseName: string;
  recycleBin: RecycleBinItem[];
  onSnapshotCreate: () => void;
  onSnapshotRestore: (id: string) => void;
  onSnapshotDelete: (id: string) => void;
  onRecycleRestore: (id: string) => void;
  onRecycleDelete: (id: string) => void;
  onRecycleClear: () => void;
  onDuplicate: (newName: string) => void;
}) {
  const [snapshots, setSnapshots] = useState<{ id: string; createdAt: string }[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");

  const loadSnapshots = React.useCallback(async () => {
    if (!databaseName) {
      setSnapshots([]);
      return;
    }
    setSnapshotsLoading(true);
    try {
      const response = await fetch(
        `/api/snapshots?database=${encodeURIComponent(databaseName)}`,
      );
      const data = (await response.json()) as { snapshots?: { id: string; createdAt: string }[] };
      setSnapshots(data.snapshots ?? []);
    } catch {
      setSnapshots([]);
    } finally {
      setSnapshotsLoading(false);
    }
  }, [databaseName]);  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <CardBlock
        title={`Snapshoty (${snapshots.length})`}
        right={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="h-7 px-2 text-xs"
              onClick={loadSnapshots}
              disabled={snapshotsLoading}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="success"
              className="h-7 px-2 text-xs"
              onClick={async () => {
                await onSnapshotCreate();
                await loadSnapshots();
              }}
              disabled={!databaseName}
            >
              <Plus className="mr-1 h-3 w-3" /> Nowy
            </Button>
          </div>
        }
      >
        {snapshots.length === 0 ? (
          <div className="text-sm text-zinc-500">Brak snapshotów.</div>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-auto pr-1">
            {snapshots.map((snapshot) => (
              <li
                key={snapshot.id}
                className="flex items-center justify-between gap-2 rounded border border-zinc-700 bg-zinc-900 p-2 text-xs"
              >
                <div className="flex flex-col">
                  <span className="font-mono text-zinc-200">{snapshot.id}</span>
                  <span className="text-zinc-500">{snapshot.createdAt}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="secondary"
                    className="h-7 px-2"
                    onClick={async () => {
                      await onSnapshotRestore(snapshot.id);
                      await loadSnapshots();
                    }}
                  >
                    Przywróć
                  </Button>
                  <Button
                    variant="danger"
                    className="h-7 px-2"
                    onClick={async () => {
                      await onSnapshotDelete(snapshot.id);
                      await loadSnapshots();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBlock>

      <CardBlock
        title={`Kosz (${recycleBin.length})`}
        right={
          recycleBin.length > 0 ? (
            <Button
              variant="danger"
              className="h-7 px-2 text-xs"
              onClick={onRecycleClear}
            >
              Wyczyść
            </Button>
          ) : null
        }
      >
        {recycleBin.length === 0 ? (
          <div className="text-sm text-zinc-500">Kosz jest pusty.</div>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-auto pr-1">
            {recycleBin.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded border border-zinc-700 bg-zinc-900 p-2 text-xs"
              >
                <div className="flex flex-col">
                  <span className="font-mono text-zinc-200">
                    {item.type === "table" ? "Tabela" : "Wiersz"} · {item.tableName}
                  </span>
                  <span className="text-zinc-500">{item.deletedAt}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="secondary"
                    className="h-7 px-2"
                    onClick={() => onRecycleRestore(item.id)}
                  >
                    Przywróć
                  </Button>
                  <Button
                    variant="danger"
                    className="h-7 px-2"
                    onClick={() => onRecycleDelete(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBlock>

      <CardBlock title="Duplikuj bazę">
        <div className="space-y-2">
          <Label>Nowa nazwa</Label>
          <Input
            value={duplicateName}
            onChange={(event) => setDuplicateName(event.target.value)}
            placeholder={`${databaseName}_copy`}
          />
          <Button
            variant="success"
            disabled={!databaseName || !duplicateName.trim()}
            onClick={() => {
              onDuplicate(duplicateName.trim());
              setDuplicateName("");
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> Duplikuj
          </Button>
          <div className="text-xs text-zinc-500">
            Tworzy kopię z tabelami, indeksami i danymi. Snapshoty i historia nie
            są kopiowane.
          </div>
        </div>
      </CardBlock>
    </div>
  );
}

function ConsolePanel({
  entries,
  healthStatus,
  selectedDatabase,
  selectedTable,
  readOnly,
  onClear,
  onPing,
}: {
  entries: ConsoleEntry[];
  healthStatus: { online: boolean; latencyMs: number | null; lastChecked: string | null };
  selectedDatabase: string;
  selectedTable: string;
  readOnly: boolean;
  onClear: () => void;
  onPing: () => void;
}) {
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | ConsoleLevel>("all");
  const [autoScroll, setAutoScroll] = useState(true);

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return entries.filter((entry) => {
      if (levelFilter !== "all" && entry.level !== levelFilter) return false;
      if (!needle) return true;
      return [entry.source, entry.message, entry.detail ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [entries, filter, levelFilter]);

  const counts = useMemo(() => {
    const result: Record<ConsoleLevel, number> = {
      info: 0,
      success: 0,
      warn: 0,
      error: 0,
      debug: 0,
    };
    for (const entry of entries) result[entry.level] += 1;
    return result;
  }, [entries]);

  function exportLogs() {
    const text = entries
      .map(
        (entry) =>
          `${entry.timestamp} [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}${entry.detail ? `\n    ${entry.detail}` : ""}`,
      )
      .join("\n");
    downloadText("atlas-console.log", text, "text/plain");
  }

  return (
    <Panel
      title="Konsola"
      description="Logi operacji, połączenia z API i akcji panelu."
    >
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                className="pl-9"
                placeholder="Filtruj logi..."
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
              value={levelFilter}
              onChange={(event) =>
                setLevelFilter(event.target.value as typeof levelFilter)
              }
            >
              <option value="all">wszystkie poziomy</option>
              <option value="info">info</option>
              <option value="success">success</option>
              <option value="warn">warn</option>
              <option value="error">error</option>
              <option value="debug">debug</option>
            </select>
            <Button variant="secondary" onClick={onPing}>
              <Zap className="mr-1 h-4 w-4" /> Ping API
            </Button>
            <Button variant="secondary" onClick={exportLogs} disabled={entries.length === 0}>
              <Download className="mr-1 h-4 w-4" /> Eksport
            </Button>
            <Button variant="danger" onClick={onClear} disabled={entries.length === 0}>
              <Trash2 className="mr-1 h-4 w-4" /> Wyczyść
            </Button>
          </div>

          <div className="rounded-md border border-zinc-700 bg-zinc-950 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-700 px-3 py-2 text-[11px] text-zinc-500">
              <span>
                {filtered.length} z {entries.length} wpisów
              </span>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(event) => setAutoScroll(event.target.checked)}
                />
                auto-scroll do nowych
              </label>
            </div>
            <div className={`max-h-[480px] overflow-auto p-3 ${autoScroll ? "" : ""}`}>{filtered.length === 0 ? (
                <div className="py-6 text-center text-zinc-500">
                  Brak wpisów do wyświetlenia.
                </div>
              ) : (
                <ul className="space-y-1">
                  {filtered.map((entry) => (
                    <li key={entry.id} className="leading-relaxed">
                      <span className="text-zinc-600">
                        {entry.timestamp.replace("T", " ").replace(/\..*/, "")}
                      </span>{" "}
                      <span className={getLevelClass(entry.level)}>
                        {entry.level.toUpperCase().padEnd(7, " ")}
                      </span>{" "}
                      <span className="text-zinc-400">[{entry.source}]</span>{" "}
                      <span className="text-zinc-200">{entry.message}</span>
                      {entry.detail ? (
                        <div className="ml-6 whitespace-pre-wrap text-[11px] text-zinc-500">
                          {entry.detail}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <CardBlock title="Status">
            <div className="space-y-2 text-sm">
              <StatusRow
                label="Połączenie API"
                value={
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${healthStatus.online ? "bg-emerald-400" : "bg-rose-400"}`}
                    />
                    {healthStatus.online ? "Online" : "Offline"}
                  </span>
                }
              />
              <StatusRow
                label="Latencja"
                value={
                  healthStatus.latencyMs !== null
                    ? `${healthStatus.latencyMs} ms`
                    : "—"
                }
              />
              <StatusRow
                label="Ostatnie sprawdzenie"
                value={
                  healthStatus.lastChecked
                    ? healthStatus.lastChecked.replace("T", " ").replace(/\..*/, "")
                    : "—"
                }
              />
              <StatusRow
                label="Tryb"
                value={readOnly ? "Tylko do odczytu" : "Zapis aktywny"}
              />
              <StatusRow label="Aktywna baza" value={selectedDatabase || "—"} />
              <StatusRow label="Aktywna tabela" value={selectedTable || "—"} />
            </div>
          </CardBlock>

          <CardBlock title="Statystyki logów">
            <div className="space-y-1 text-sm">
              <StatusRow label="info" value={counts.info} />
              <StatusRow label="success" value={counts.success} />
              <StatusRow label="warn" value={counts.warn} />
              <StatusRow label="error" value={counts.error} />
              <StatusRow label="debug" value={counts.debug} />
              <StatusRow label="razem" value={entries.length} />
            </div>
          </CardBlock>

          <CardBlock title="Wskazówki">
            <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-400">
              <li>Logi są przechowywane w pamięci, max 500 wpisów.</li>
              <li>Eksport zapisuje plik tekstowy z pełną historią sesji.</li>
              <li>Health-check biegnie co 15 s w tle.</li>
              <li>Ping API mierzy aktualną latencję serwera.</li>
            </ul>
          </CardBlock>
        </div>
      </div>
    </Panel>
  );
}

function getLevelClass(level: ConsoleLevel) {
  switch (level) {
    case "success":
      return "text-emerald-400";
    case "warn":
      return "text-amber-400";
    case "error":
      return "text-rose-400";
    case "debug":
      return "text-sky-400";
    default:
      return "text-zinc-400";
  }
}

function StatusRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-zinc-500">{label}</span>
      <span className="font-mono text-zinc-200">{value}</span>
    </div>
  );
}

function SettingsPanel({
  readOnly,
  onToggleReadOnly,
  dangerVerifyByName,
  onToggleDangerVerify,
  confirmOnDelete,
  onToggleConfirmOnDelete,
  compactMode,
  onToggleCompactMode,
  showRowNumbers,
  onToggleShowRowNumbers,
  autoRefresh,
  onToggleAutoRefresh,
  autoRefreshInterval,
  onChangeAutoRefreshInterval,
  themeId,
  onChangeTheme,
  currentThemeName,
  stats,
  healthStatus,
  consoleLog,
  onResetPreferences,
  onExportPreferences,
  onImportPreferences,
}: {
  readOnly: boolean;
  onToggleReadOnly: () => void;
  dangerVerifyByName: boolean;
  onToggleDangerVerify: () => void;
  confirmOnDelete: boolean;
  onToggleConfirmOnDelete: () => void;
  compactMode: boolean;
  onToggleCompactMode: () => void;
  showRowNumbers: boolean;
  onToggleShowRowNumbers: () => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  autoRefreshInterval: number;
  onChangeAutoRefreshInterval: (value: number) => void;
  themeId: string;
  onChangeTheme: (id: string) => void;
  currentThemeName: string;
  stats: {
    databases: number;
    tables: number;
    rows: number;
    columns: number;
    indexes: number;
    routines: number;
    events: number;
    triggers: number;
    tracking: number;
  };
  healthStatus: {
    online: boolean;
    latencyMs: number | null;
    lastChecked: string | null;
  };
  consoleLog: ConsoleEntry[];
  onResetPreferences: () => void;
  onExportPreferences: () => void;
  onImportPreferences: (file: File) => void;
}) {
  type Section =
    | "general"
    | "appearance"
    | "security"
    | "data"
    | "shortcuts"
    | "info";
  const [section, setSection] = useState<Section>("general");
  const sections: { id: Section; label: string; icon: typeof Settings }[] = [
    { id: "general", label: "Ogólne", icon: Settings },
    { id: "appearance", label: "Wygląd", icon: Sparkles },
    { id: "security", label: "Bezpieczeństwo", icon: ShieldCheck },
    { id: "data", label: "Dane i kopie", icon: Save },
    { id: "shortcuts", label: "Skróty", icon: Keyboard },
    { id: "info", label: "O panelu", icon: Info },
  ];

  return (
    <Panel
      title="Ustawienia"
      description="Konfiguracja panelu, zachowania i wyglądu."
    >
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row gap-1 overflow-x-auto rounded-md border border-zinc-700 bg-zinc-900 p-1 lg:flex-col lg:overflow-visible">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${section === id ? "bg-zinc-300 text-zinc-950" : "text-zinc-300 hover:bg-zinc-800"}`}
              onClick={() => setSection(id)}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>

        <div className="space-y-4">
          {section === "general" && (
            <>
              <CardBlock title="Auto-odświeżanie">
                <div className="space-y-4">
                  <SettingToggle
                    label="Odświeżaj automatycznie"
                    description="Co zadany czas pobiera świeży stan bazy z serwera."
                    checked={autoRefresh}
                    onChange={onToggleAutoRefresh}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="autoRefreshInterval">
                      Interwał odświeżania (sekundy)
                    </Label>
                    <Input
                      id="autoRefreshInterval"
                      type="number"
                      min={5}
                      max={3600}
                      step={5}
                      value={autoRefreshInterval}
                      disabled={!autoRefresh}
                      onChange={(event) =>
                        onChangeAutoRefreshInterval(
                          Number(event.target.value) || 30,
                        )
                      }
                    />
                    <div className="text-xs text-zinc-500">
                      Min. 5 s, maks. 3600 s.
                    </div>
                  </div>
                </div>
              </CardBlock>
              <CardBlock title="Widok i tabele">
                <div className="space-y-4">
                  <SettingToggle
                    label="Tryb kompaktowy"
                    description="Mniejsze odstępy w panelach i tabelach – więcej danych na ekranie."
                    checked={compactMode}
                    onChange={onToggleCompactMode}
                  />
                  <SettingToggle
                    label="Numery wierszy"
                    description="Pokazuje kolumnę z numerem rekordu w tabelach (#)."
                    checked={showRowNumbers}
                    onChange={onToggleShowRowNumbers}
                  />
                </div>
              </CardBlock>
            </>
          )}

          {section === "appearance" && (
            <CardBlock title="Motyw panelu">
              <div className="text-sm text-zinc-400">
                Aktywny motyw: <span className="font-mono text-zinc-200">{currentThemeName}</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors cursor-pointer ${themeId === t.id ? "border-zinc-300 bg-zinc-850" : "border-zinc-700 bg-zinc-850 hover:border-zinc-500"}`}
                    onClick={() => onChangeTheme(t.id)}
                  >
                    <div
                      className="text-sm font-semibold"
                      style={{ color: t.textMain }}
                    >
                      {t.name}
                    </div>
                    <div className="flex gap-1.5">
                      <span
                        className="h-3 w-3 rounded-full border border-black/20"
                        style={{ backgroundColor: t.bgMain }}
                      />
                      <span
                        className="h-3 w-3 rounded-full border border-black/20"
                        style={{ backgroundColor: t.bgSide }}
                      />
                      <span
                        className="h-3 w-3 rounded-full border border-black/20"
                        style={{ backgroundColor: t.bgCard }}
                      />
                      <span
                        className="h-3 w-3 rounded-full border border-black/20"
                        style={{ backgroundColor: t.accent }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </CardBlock>
          )}

          {section === "security" && (
            <CardBlock title="Zabezpieczenia">
              <div className="space-y-4">
                <SettingToggle
                  label="Tryb tylko do odczytu"
                  description="Blokuje operacje modyfikujące bazę (INSERT, UPDATE, DELETE, IMPORT itp.)."
                  checked={readOnly}
                  onChange={onToggleReadOnly}
                />
                <SettingToggle
                  label="Weryfikacja nazwy przy usuwaniu"
                  description="Wymaga wpisania nazwy tabeli lub bazy przed niebezpiecznymi akcjami."
                  checked={dangerVerifyByName}
                  onChange={onToggleDangerVerify}
                />
                <SettingToggle
                  label="Potwierdzenie usuwania rekordu"
                  description="Pokazuje okno potwierdzenia przy każdym usunięciu pojedynczego wiersza."
                  checked={confirmOnDelete}
                  onChange={onToggleConfirmOnDelete}
                />
              </div>
            </CardBlock>
          )}

          {section === "data" && (
            <>
              <CardBlock title="Eksport / import preferencji">
                <div className="space-y-3 text-sm text-zinc-400">
                  <p>
                    Zapisz konfigurację panelu (motyw, tryby, blokady) do pliku JSON
                    i wczytaj na innym urządzeniu.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" onClick={onExportPreferences}>
                      <Download className="mr-2 h-4 w-4" /> Eksport ustawień
                    </Button>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                      <Upload className="h-4 w-4" /> Import ustawień
                      <input
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) onImportPreferences(file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              </CardBlock>
              <CardBlock title="Reset">
                <div className="space-y-3 text-sm text-zinc-400">
                  <p>
                    Resetuje wszystkie preferencje panelu do wartości domyślnych.
                    Dane w bazie pozostają nietknięte.
                  </p>
                  <Button variant="destructive" onClick={onResetPreferences}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Zresetuj ustawienia
                  </Button>
                </div>
              </CardBlock>
            </>
          )}

          {section === "shortcuts" && (
            <CardBlock title="Skróty klawiszowe">
              <div className="overflow-hidden rounded-md border border-zinc-700">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-800 text-xs uppercase tracking-wide text-zinc-400">
                    <tr>
                      <th className="px-3 py-2 text-left">Skrót</th>
                      <th className="px-3 py-2 text-left">Działanie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700 bg-zinc-900">
                    {[
                      ["Enter (w polu nowej bazy)", "Utwórz nową bazę"],
                      ["Ctrl + Enter", "Wykonaj zapytanie SQL w konsoli"],
                      ["Esc", "Zamknij okno potwierdzenia"],
                      ["Klik na bazę", "Otwórz zakładkę Baza"],
                      ["Klik na tabelę", "Otwórz zakładkę Przeglądaj"],
                    ].map(([combo, desc]) => (
                      <tr key={combo}>
                        <td className="px-3 py-2 font-mono text-xs text-zinc-200">
                          {combo}
                        </td>
                        <td className="px-3 py-2 text-zinc-400">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBlock>
          )}

          {section === "info" && (
            <div className="grid gap-3 lg:grid-cols-2">
              <CardBlock title="Stan bazy">
                <div className="space-y-1 text-sm">
                  <StatusRow label="Bazy danych" value={stats.databases} />
                  <StatusRow label="Tabele" value={stats.tables} />
                  <StatusRow label="Wiersze" value={stats.rows} />
                  <StatusRow label="Kolumny" value={stats.columns} />
                  <StatusRow label="Indeksy" value={stats.indexes} />
                  <StatusRow label="Procedury" value={stats.routines} />
                  <StatusRow label="Zdarzenia" value={stats.events} />
                  <StatusRow label="Wyzwalacze" value={stats.triggers} />
                  <StatusRow label="Wpisy śledzenia" value={stats.tracking} />
                </div>
              </CardBlock>
              <CardBlock title="Środowisko">
                <div className="space-y-1 text-sm">
                  <StatusRow label="Wersja panelu" value={`v${APP_VERSION}`} />
                  <StatusRow
                    label="API"
                    value={healthStatus.online ? "Online" : "Offline"}
                  />
                  <StatusRow
                    label="Latencja"
                    value={
                      healthStatus.latencyMs !== null
                        ? `${healthStatus.latencyMs} ms`
                        : "—"
                    }
                  />
                  <StatusRow label="Wpisy w konsoli" value={consoleLog.length} />
                  <StatusRow label="Aktualny motyw" value={currentThemeName} />
                </div>
              </CardBlock>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

function SchemasPanel({
  schemas,
  tables,
  views,
  mviews,
  sequences,
  disabled,
  onCreate,
  onDrop,
}: {
  schemas: { name: string; description?: string; createdAt: string }[];
  tables: LocalDbTable[];
  views: { name: string; schema?: string }[];
  mviews: { name: string; schema?: string }[];
  sequences: { name: string; schema?: string }[];
  disabled?: boolean;
  onCreate: (name: string, description: string) => void;
  onDrop: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function countObjects(schemaName: string) {
    const t = tables.filter((x) => (x.schema ?? "public") === schemaName).length;
    const v = views.filter((x) => (x.schema ?? "public") === schemaName).length;
    const mv = mviews.filter((x) => (x.schema ?? "public") === schemaName).length;
    const s = sequences.filter((x) => (x.schema ?? "public") === schemaName).length;
    return { tables: t, views: v, mviews: mv, sequences: s, total: t + v + mv + s };
  }

  return (
    <Panel
      title="Schematy"
      description="Namespace'y dla obiektów bazy. Każdy obiekt należy do dokładnie jednego schematu."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <CardBlock title="Nowy schemat">
          <div className="space-y-3">
            <div>
              <Label htmlFor="schemaName">Nazwa</Label>
              <Input
                id="schemaName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="np. analytics"
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="schemaDescription">Opis (opcjonalnie)</Label>
              <Input
                id="schemaDescription"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Schemat do raportów..."
                disabled={disabled}
              />
            </div>
            <Button
              variant="success"
              disabled={disabled || !name.trim()}
              onClick={() => {
                onCreate(name.trim(), description.trim());
                setName("");
                setDescription("");
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Utwórz schemat
            </Button>
          </div>
        </CardBlock>

        <CardBlock title={`Lista (${schemas.length})`}>
          {schemas.length === 0 ? (
            <div className="text-sm text-zinc-500">Brak schematów.</div>
          ) : (
            <ul className="space-y-2">{schemas.map((schema) => {
                const counts = countObjects(schema.name);
                return (
                  <li
                    key={schema.name}
                    className="rounded-md border border-zinc-700 bg-zinc-900 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono font-semibold">{schema.name}</div>
                        {schema.description ? (
                          <div className="text-xs text-zinc-500">
                            {schema.description}
                          </div>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-zinc-400">
                          <span className="rounded-full bg-zinc-800 px-2 py-0.5">
                            tabele: {counts.tables}
                          </span>
                          <span className="rounded-full bg-zinc-800 px-2 py-0.5">
                            widoki: {counts.views}
                          </span>
                          <span className="rounded-full bg-zinc-800 px-2 py-0.5">
                            mat. widoki: {counts.mviews}
                          </span>
                          <span className="rounded-full bg-zinc-800 px-2 py-0.5">
                            sekwencje: {counts.sequences}
                          </span>
                        </div>
                      </div>
                      {schema.name !== "public" ? (
                        <Button
                          variant="danger"
                          disabled={disabled}
                          onClick={() => onDrop(schema.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="rounded-full bg-zinc-800 px-2 py-1 text-[11px] text-zinc-500">
                          chroniony
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBlock>
      </div>
    </Panel>
  );
}

function ViewsPanel({
  views,
  schemas,
  disabled,
  onSave,
  onDrop,
  onRunSql,
  onShowProperties,
}: {
  views: { name: string; schema?: string; sql: string; createdAt: string }[];
  schemas: { name: string }[];
  disabled?: boolean;
  onSave: (payload: { name: string; schema: string; sql: string }) => void;
  onDrop: (view: { name: string; schema?: string }) => void;
  onRunSql: (sql: string) => void;
  onShowProperties?: (view: { name: string; schema?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [schema, setSchema] = useState("public");
  const [sql, setSql] = useState("SELECT * FROM ");
  const [editingKey, setEditingKey] = useState<string | null>(null);

  function loadView(view: { name: string; schema?: string; sql: string }) {
    setName(view.name);
    setSchema(view.schema ?? "public");
    setSql(view.sql);
    setEditingKey(`${view.schema ?? "public"}.${view.name}`);
  }

  function reset() {
    setName("");
    setSchema("public");
    setSql("SELECT * FROM ");
    setEditingKey(null);
  }

  return (
    <Panel
      title="Widoki"
      description="Zapisane zapytania uruchamiane na żądanie. Edycja widoku nadpisuje SQL."
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <CardBlock
          title={editingKey ? `Edytuj: ${editingKey}` : "Nowy widok"}
          right={
            editingKey ? (
              <button
                className="text-xs text-zinc-500 hover:text-zinc-200"
                onClick={reset}
              >
                Wyczyść formularz
              </button>
            ) : null
          }
        >
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <div>
                <Label htmlFor="viewName">Nazwa</Label>
                <Input
                  id="viewName"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="np. v_users_active"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="viewSchema">Schemat</Label>
                <select
                  id="viewSchema"
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                  value={schema}
                  onChange={(event) => setSchema(event.target.value)}
                  disabled={disabled}
                >
                  {(schemas.length === 0 ? [{ name: "public" }] : schemas).map(
                    (s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="viewSql">Zapytanie SELECT</Label>
              <Textarea
                id="viewSql"
                rows={8}
                value={sql}
                onChange={(event) => setSql(event.target.value)}
                placeholder="SELECT id, name FROM users WHERE active = TRUE"
                disabled={disabled}
                className="font-mono"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="success"
                disabled={disabled || !name.trim() || !sql.trim()}
                onClick={() => {
                  onSave({ name: name.trim(), schema, sql });
                  reset();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {editingKey ? "Zapisz zmiany" : "Utwórz widok"}
              </Button>
              <Button
                variant="secondary"
                disabled={!sql.trim()}
                onClick={() => onRunSql(sql)}
              >
                <Code2 className="mr-2 h-4 w-4" /> Uruchom w konsoli
              </Button>
            </div>
          </div>
        </CardBlock>

        <CardBlock title={`Lista (${views.length})`}>
          {views.length === 0 ? (
            <div className="text-sm text-zinc-500">Brak widoków.</div>
          ) : (
            <ul className="space-y-2">{views.map((view) => (
                <li
                  key={`${view.schema ?? "public"}.${view.name}`}
                  className="rounded-md border border-zinc-700 bg-zinc-900 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono font-semibold">
                        {view.schema ?? "public"}.{view.name}
                      </div>
                      <pre className="mt-2 max-h-24 overflow-auto rounded-md border border-zinc-700 bg-zinc-950 p-2 font-mono text-[11px] text-zinc-400">
                        {view.sql}
                      </pre>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        variant="secondary"
                        disabled={disabled}
                        onClick={() => loadView(view)}
                        title="Edytuj"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={disabled}
                        onClick={() => onRunSql(view.sql)}
                        title="Uruchom"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                      </Button>
                      {onShowProperties ? (
                        <Button
                          variant="secondary"
                          disabled={disabled}
                          onClick={() => onShowProperties(view)}
                          title="Właściwości"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                      <Button
                        variant="danger"
                        disabled={disabled}
                        onClick={() => onDrop(view)}
                        title="Usuń"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBlock>
      </div>
    </Panel>
  );
}

function MaterializedViewsPanel({
  mviews,
  schemas,
  disabled,
  onSave,
  onRefresh,
  onDrop,
  onShowProperties,
}: {
  mviews: {
    name: string;
    schema?: string;
    sql: string;
    columns: string[];
    rows: LocalDbRow[];
    refreshedAt?: string;
    createdAt: string;
  }[];
  schemas: { name: string }[];
  disabled?: boolean;
  onSave: (payload: { name: string; schema: string; sql: string }) => void;
  onRefresh: (view: { name: string; schema?: string }) => void;
  onDrop: (view: { name: string; schema?: string }) => void;
  onShowProperties?: (view: { name: string; schema?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [schema, setSchema] = useState("public");
  const [sql, setSql] = useState("SELECT * FROM ");
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  return (
    <Panel
      title="Zmaterializowane widoki"
      description="Widoki z cache rezultatu. Odśwież ręcznie aby ponownie wykonać zapytanie."
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <CardBlock title="Nowy / aktualizuj widok">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <div>
                <Label htmlFor="mviewName">Nazwa</Label>
                <Input
                  id="mviewName"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="np. mv_user_summary"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="mviewSchema">Schemat</Label>
                <select
                  id="mviewSchema"
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                  value={schema}
                  onChange={(event) => setSchema(event.target.value)}
                  disabled={disabled}
                >
                  {(schemas.length === 0 ? [{ name: "public" }] : schemas).map(
                    (s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="mviewSql">Zapytanie SELECT</Label>
              <Textarea
                id="mviewSql"
                rows={8}
                value={sql}
                onChange={(event) => setSql(event.target.value)}
                disabled={disabled}
                className="font-mono"
              />
            </div>
            <Button
              variant="success"
              disabled={disabled || !name.trim() || !sql.trim()}
              onClick={() => {
                onSave({ name: name.trim(), schema, sql });
                setName("");
                setSql("SELECT * FROM ");
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Zapisz widok
            </Button>
            <div className="text-xs text-zinc-500">
              Po zapisaniu kliknij <span className="font-mono">REFRESH</span> aby wykonać zapytanie i zachować wynik.
            </div>
          </div>
        </CardBlock>

        <CardBlock title={`Lista (${mviews.length})`}>
          {mviews.length === 0 ? (
            <div className="text-sm text-zinc-500">Brak widoków.</div>
          ) : (
            <ul className="space-y-2">{mviews.map((view) => {
                const key = `${view.schema ?? "public"}.${view.name}`;
                return (
                  <li
                    key={key}
                    className="rounded-md border border-zinc-700 bg-zinc-900 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-mono font-semibold">{key}</div>
                        <div className="text-[11px] text-zinc-500">
                          {view.refreshedAt
                            ? `odświeżono: ${view.refreshedAt.replace("T", " ").replace(/\..*/, "")}`
                            : "nigdy nie odświeżony"}
                          {" · "}
                          {view.rows.length} wierszy
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button
                          variant="secondary"
                          disabled={disabled}
                          onClick={() => onRefresh(view)}
                          title="Odśwież"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={disabled}
                          onClick={() =>
                            setPreviewKey(previewKey === key ? null : key)
                          }
                          title="Podgląd"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {onShowProperties ? (
                          <Button
                            variant="secondary"
                            disabled={disabled}
                            onClick={() => onShowProperties(view)}
                            title="Właściwości"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                        <Button
                          variant="danger"
                          disabled={disabled}
                          onClick={() => onDrop(view)}
                          title="Usuń"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {previewKey === key ? (
                      <div className="mt-3 space-y-2">
                        <pre className="max-h-32 overflow-auto rounded-md border border-zinc-700 bg-zinc-950 p-2 font-mono text-[11px] text-zinc-400">
                          {view.sql}
                        </pre>
                        {view.columns.length > 0 ? (
                          <DataTable
                            columns={view.columns}
                            rows={view.rows.slice(0, 25)}
                            sortable
                          />
                        ) : (
                          <div className="text-xs text-zinc-500">
                            Brak danych. Kliknij REFRESH aby wykonać.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBlock>
      </div>
    </Panel>
  );
}

function SequencesPanel({
  sequences,
  schemas,
  disabled,
  onSave,
  onNextVal,
  onReset,
  onDrop,
  onShowProperties,
}: {
  sequences: {
    name: string;
    schema?: string;
    start: number;
    increment: number;
    minValue?: number;
    maxValue?: number;
    current: number;
    cycle: boolean;
    createdAt: string;
  }[];
  schemas: { name: string }[];
  disabled?: boolean;
  onSave: (payload: {
    name: string;
    schema: string;
    start: number;
    increment: number;
    minValue: number | null;
    maxValue: number | null;
    cycle: boolean;
  }) => void;
  onNextVal: (seq: { name: string; schema?: string }) => void;
  onReset: (seq: { name: string; schema?: string }, value?: number) => void;
  onDrop: (seq: { name: string; schema?: string }) => void;
  onShowProperties?: (seq: { name: string; schema?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [schema, setSchema] = useState("public");
  const [start, setStart] = useState(1);
  const [increment, setIncrement] = useState(1);
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");
  const [cycle, setCycle] = useState(false);

  return (
    <Panel
      title="Sekwencje"
      description="Nazwane liczniki – używaj nextval(seq) aby pobrać kolejną wartość."
    >
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <CardBlock title="Nowa sekwencja">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="seqName">Nazwa</Label>
              <Input
                id="seqName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="np. user_id_seq"
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="seqSchema">Schemat</Label>
              <select
                id="seqSchema"
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                value={schema}
                onChange={(event) => setSchema(event.target.value)}
                disabled={disabled}
              >
                {(schemas.length === 0 ? [{ name: "public" }] : schemas).map(
                  (s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <Label htmlFor="seqStart">Start</Label>
              <Input
                id="seqStart"
                type="number"
                value={start}
                onChange={(event) => setStart(Number(event.target.value) || 1)}
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="seqIncrement">Increment</Label>
              <Input
                id="seqIncrement"
                type="number"
                value={increment}
                onChange={(event) =>
                  setIncrement(Number(event.target.value) || 1)
                }
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="seqMin">Min (opcjonalnie)</Label>
              <Input
                id="seqMin"
                type="number"
                value={minValue}
                onChange={(event) => setMinValue(event.target.value)}
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="seqMax">Max (opcjonalnie)</Label>
              <Input
                id="seqMax"
                type="number"
                value={maxValue}
                onChange={(event) => setMaxValue(event.target.value)}
                disabled={disabled}
              />
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={cycle}
                onChange={(event) => setCycle(event.target.checked)}
              />
              CYCLE — wracaj do minimum/maksimum po przekroczeniu
            </label>
          </div>
          <div className="mt-3">
            <Button
              variant="success"
              disabled={disabled || !name.trim()}
              onClick={() => {
                onSave({
                  name: name.trim(),
                  schema,
                  start,
                  increment,
                  minValue: minValue === "" ? null : Number(minValue),
                  maxValue: maxValue === "" ? null : Number(maxValue),
                  cycle,
                });
                setName("");
                setMinValue("");
                setMaxValue("");
                setCycle(false);
                setStart(1);
                setIncrement(1);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Utwórz sekwencję
            </Button>
          </div>
        </CardBlock>

        <CardBlock title={`Lista (${sequences.length})`}>
          {sequences.length === 0 ? (
            <div className="text-sm text-zinc-500">Brak sekwencji.</div>
          ) : (
            <ul className="space-y-2">{sequences.map((seq) => {
                const key = `${seq.schema ?? "public"}.${seq.name}`;
                return (
                  <li
                    key={key}
                    className="rounded-md border border-zinc-700 bg-zinc-900 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-mono font-semibold">{key}</div>
                        <div className="mt-1 grid grid-cols-3 gap-1 text-[11px] text-zinc-500">
                          <span>start: {seq.start}</span>
                          <span>step: {seq.increment}</span>
                          <span>cycle: {seq.cycle ? "tak" : "nie"}</span>
                          <span className="col-span-3">
                            current:{" "}
                            <span className="font-mono text-zinc-200">
                              {seq.current}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button
                          variant="secondary"
                          disabled={disabled}
                          onClick={() => onNextVal(seq)}
                          title="nextval"
                        >
                          <Zap className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={disabled}
                          onClick={() => onReset(seq)}
                          title="Reset do start - increment"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        {onShowProperties ? (
                          <Button
                            variant="secondary"
                            disabled={disabled}
                            onClick={() => onShowProperties(seq)}
                            title="Właściwości"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                        <Button
                          variant="danger"
                          disabled={disabled}
                          onClick={() => onDrop(seq)}
                          title="Usuń"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBlock>
      </div>
    </Panel>
  );
}

function DomainsPanel({
  domains,
  schemas,
  disabled,
  onSave,
  onDrop,
  onShowProperties,
}: {
  domains: {
    name: string;
    schema?: string;
    baseType: LocalDbColumnType;
    nullable: boolean;
    defaultValue?: LocalDbValue;
    check?: string;
    description?: string;
    createdAt: string;
  }[];
  schemas: { name: string }[];
  disabled?: boolean;
  onSave: (payload: {
    name: string;
    schema: string;
    baseType: LocalDbColumnType;
    nullable: boolean;
    defaultValue: LocalDbValue;
    check: string;
    description: string;
  }) => void;
  onDrop: (domain: { name: string; schema?: string }) => void;
  onShowProperties: (domain: { name: string; schema?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [schema, setSchema] = useState("public");
  const [baseType, setBaseType] = useState<LocalDbColumnType>("VARCHAR");
  const [nullable, setNullable] = useState(true);
  const [defaultValue, setDefaultValue] = useState("");
  const [check, setCheck] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Panel
      title="Domeny"
      description="Nazwane typy z constraintami. Używaj zamiast np. VARCHAR(50) NOT NULL."
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <CardBlock title="Nowa / aktualizuj domenę">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <div>
                <Label htmlFor="domainName">Nazwa</Label>
                <Input
                  id="domainName"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="np. email_t"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="domainSchema">Schemat</Label>
                <select
                  id="domainSchema"
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                  value={schema}
                  onChange={(event) => setSchema(event.target.value)}
                  disabled={disabled}
                >
                  {(schemas.length === 0 ? [{ name: "public" }] : schemas).map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="domainType">Typ bazowy</Label>
                <select
                  id="domainType"
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                  value={baseType}
                  onChange={(event) =>
                    setBaseType(event.target.value as LocalDbColumnType)
                  }
                  disabled={disabled}
                >
                  {COLUMN_TYPES.map((meta) => (
                    <option key={meta.name} value={meta.name}>
                      {meta.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!nullable}
                    onChange={(event) => setNullable(!event.target.checked)}
                  />
                  NOT NULL
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="domainDefault">Default (opcjonalnie)</Label>
              <Input
                id="domainDefault"
                value={defaultValue}
                onChange={(event) => setDefaultValue(event.target.value)}
                placeholder="np. user@example.com"
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="domainCheck">CHECK (opcjonalnie)</Label>
              <Input
                id="domainCheck"
                value={check}
                onChange={(event) => setCheck(event.target.value)}
                placeholder="VALUE LIKE '%@%'"
                disabled={disabled}
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="domainDescription">Opis</Label>
              <Input
                id="domainDescription"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Adres e-mail"
                disabled={disabled}
              />
            </div>
            <Button
              variant="success"
              disabled={disabled || !name.trim()}
              onClick={() => {
                onSave({
                  name: name.trim(),
                  schema,
                  baseType,
                  nullable,
                  defaultValue: defaultValue.trim() === "" ? null : defaultValue,
                  check,
                  description,
                });
                setName("");
                setDefaultValue("");
                setCheck("");
                setDescription("");
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Zapisz domenę
            </Button>
          </div>
        </CardBlock>

        <CardBlock title={`Lista (${domains.length})`}>
          {domains.length === 0 ? (
            <div className="text-sm text-zinc-500">Brak domen.</div>
          ) : (
            <ul className="space-y-2">{domains.map((domain) => (
                <li
                  key={`${domain.schema ?? "public"}.${domain.name}`}
                  className="rounded-md border border-zinc-700 bg-zinc-900 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono font-semibold">
                        {domain.schema ?? "public"}.{domain.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {domain.baseType}
                        {!domain.nullable ? " · NOT NULL" : ""}
                        {domain.check ? ` · CHECK ${domain.check}` : ""}
                      </div>
                      {domain.description ? (
                        <div className="text-[11px] text-zinc-500">
                          {domain.description}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        variant="secondary"
                        disabled={disabled}
                        onClick={() => onShowProperties(domain)}
                        title="Właściwości"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="danger"
                        disabled={disabled}
                        onClick={() => onDrop(domain)}
                        title="Usuń"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBlock>
      </div>
    </Panel>
  );
}

function TypesPanel({
  types,
  schemas,
  disabled,
  onSave,
  onDrop,
  onShowProperties,
}: {
  types: {
    name: string;
    schema?: string;
    attributes: { name: string; type: LocalDbColumnType }[];
    description?: string;
    createdAt: string;
  }[];
  schemas: { name: string }[];
  disabled?: boolean;
  onSave: (payload: {
    name: string;
    schema: string;
    attributes: { name: string; type: LocalDbColumnType }[];
    description: string;
  }) => void;
  onDrop: (type: { name: string; schema?: string }) => void;
  onShowProperties: (type: { name: string; schema?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [schema, setSchema] = useState("public");
  const [description, setDescription] = useState("");
  const [attributes, setAttributes] = useState<
    { name: string; type: LocalDbColumnType }[]
  >([{ name: "field1", type: "TEXT" }]);

  function updateAttribute(
    index: number,
    patch: Partial<{ name: string; type: LocalDbColumnType }>,
  ) {
    setAttributes((current) =>
      current.map((attr, i) => (i === index ? { ...attr, ...patch } : attr)),
    );
  }

  return (
    <Panel
      title="Typy złożone"
      description="Composite types — definiują strukturę rekordu używaną w kolumnach lub procedurach."
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <CardBlock title="Nowy / aktualizuj typ">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <div>
                <Label htmlFor="typeName">Nazwa</Label>
                <Input
                  id="typeName"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="np. address_t"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="typeSchema">Schemat</Label>
                <select
                  id="typeSchema"
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                  value={schema}
                  onChange={(event) => setSchema(event.target.value)}
                  disabled={disabled}
                >
                  {(schemas.length === 0 ? [{ name: "public" }] : schemas).map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="typeDescription">Opis</Label>
              <Input
                id="typeDescription"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Struktura adresu pocztowego"
                disabled={disabled}
              />
            </div>
            <div>
              <Label>Atrybuty</Label>
              <div className="space-y-2">
                {attributes.map((attr, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={attr.name}
                      onChange={(event) =>
                        updateAttribute(index, { name: event.target.value })
                      }
                      placeholder="nazwa"
                      disabled={disabled}
                    />
                    <select
                      className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                      value={attr.type}
                      onChange={(event) =>
                        updateAttribute(index, {
                          type: event.target.value as LocalDbColumnType,
                        })
                      }
                      disabled={disabled}
                    >
                      {COLUMN_TYPES.map((meta) => (
                        <option key={meta.name} value={meta.name}>
                          {meta.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="secondary"
                      disabled={disabled || attributes.length === 1}
                      onClick={() =>
                        setAttributes((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                disabled={disabled}
                onClick={() =>
                  setAttributes((current) => [
                    ...current,
                    { name: `field${current.length + 1}`, type: "TEXT" },
                  ])
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Dodaj atrybut
              </Button>
            </div>
            <Button
              variant="success"
              disabled={disabled || !name.trim() || attributes.length === 0}
              onClick={() => {
                onSave({ name: name.trim(), schema, attributes, description });
                setName("");
                setDescription("");
                setAttributes([{ name: "field1", type: "TEXT" }]);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Zapisz typ
            </Button>
          </div>
        </CardBlock>

        <CardBlock title={`Lista (${types.length})`}>
          {types.length === 0 ? (
            <div className="text-sm text-zinc-500">Brak typów.</div>
          ) : (
            <ul className="space-y-2">{types.map((type) => (
                <li
                  key={`${type.schema ?? "public"}.${type.name}`}
                  className="rounded-md border border-zinc-700 bg-zinc-900 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono font-semibold">
                        {type.schema ?? "public"}.{type.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {type.attributes.length} atrybutów:{" "}
                        {type.attributes
                          .map((attr) => `${attr.name}:${attr.type}`)
                          .join(", ")}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        variant="secondary"
                        disabled={disabled}
                        onClick={() => onShowProperties(type)}
                        title="Właściwości"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="danger"
                        disabled={disabled}
                        onClick={() => onDrop(type)}
                        title="Usuń"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBlock>
      </div>
    </Panel>
  );
}

function RulesPanel({
  rules,
  tables,
  schemas,
  disabled,
  onSave,
  onDrop,
  onShowProperties,
}: {
  rules: {
    name: string;
    schema?: string;
    tableName: string;
    event: "INSERT" | "UPDATE" | "DELETE" | "SELECT";
    condition?: string;
    body: string;
    enabled: boolean;
    createdAt: string;
  }[];
  tables: { name: string }[];
  schemas: { name: string }[];
  disabled?: boolean;
  onSave: (payload: {
    name: string;
    schema: string;
    tableName: string;
    event: "INSERT" | "UPDATE" | "DELETE" | "SELECT";
    condition: string;
    body: string;
    enabled: boolean;
  }) => void;
  onDrop: (rule: { name: string; schema?: string }) => void;
  onShowProperties: (rule: { name: string; schema?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [schema, setSchema] = useState("public");
  const [tableName, setTableName] = useState("");
  const [event, setEvent] = useState<"INSERT" | "UPDATE" | "DELETE" | "SELECT">(
    "INSERT",
  );
  const [condition, setCondition] = useState("");
  const [body, setBody] = useState("INSTEAD NOTHING");
  const [enabled, setEnabled] = useState(true);

  return (
    <Panel
      title="Reguły"
      description="Reguły rewrite na operacjach DML. Mogą blokować, zastępować lub uzupełniać akcje."
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <CardBlock title="Nowa / aktualizuj regułę">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <div>
                <Label htmlFor="ruleName">Nazwa</Label>
                <Input
                  id="ruleName"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="np. rule_protect_admin"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="ruleSchema">Schemat</Label>
                <select
                  id="ruleSchema"
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                  value={schema}
                  onChange={(event) => setSchema(event.target.value)}
                  disabled={disabled}
                >
                  {(schemas.length === 0 ? [{ name: "public" }] : schemas).map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="ruleTable">Tabela</Label>
                <select
                  id="ruleTable"
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                  value={tableName}
                  onChange={(event) => setTableName(event.target.value)}
                  disabled={disabled}
                >
                  <option value="">— wybierz —</option>
                  {tables.map((table) => (
                    <option key={table.name} value={table.name}>
                      {table.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="ruleEvent">Zdarzenie</Label>
                <select
                  id="ruleEvent"
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                  value={event}
                  onChange={(e) =>
                    setEvent(e.target.value as typeof event)
                  }
                  disabled={disabled}
                >
                  <option value="INSERT">INSERT</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="SELECT">SELECT</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="ruleCondition">WHERE (opcjonalnie)</Label>
              <Input
                id="ruleCondition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="OLD.role = 'admin'"
                disabled={disabled}
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="ruleBody">DO</Label>
              <Textarea
                id="ruleBody"
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="INSTEAD NOTHING"
                disabled={disabled}
                className="font-mono"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Włączona
            </label>
            <Button
              variant="success"
              disabled={disabled || !name.trim() || !tableName || !body.trim()}
              onClick={() => {
                onSave({
                  name: name.trim(),
                  schema,
                  tableName,
                  event,
                  condition,
                  body,
                  enabled,
                });
                setName("");
                setCondition("");
                setBody("INSTEAD NOTHING");
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Zapisz regułę
            </Button>
          </div>
        </CardBlock>

        <CardBlock title={`Lista (${rules.length})`}>
          {rules.length === 0 ? (
            <div className="text-sm text-zinc-500">Brak reguł.</div>
          ) : (
            <ul className="space-y-2">{rules.map((rule) => (
                <li
                  key={`${rule.schema ?? "public"}.${rule.name}`}
                  className="rounded-md border border-zinc-700 bg-zinc-900 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono font-semibold">
                        {rule.schema ?? "public"}.{rule.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        ON {rule.event} TO {rule.tableName}
                        {rule.condition ? ` WHERE ${rule.condition}` : ""} ·{" "}
                        {rule.enabled ? "ON" : "OFF"}
                      </div>
                      <pre className="mt-1 max-h-20 overflow-auto rounded-md border border-zinc-700 bg-zinc-950 p-2 font-mono text-[11px] text-zinc-400">
                        {rule.body}
                      </pre>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        variant="secondary"
                        disabled={disabled}
                        onClick={() => onShowProperties(rule)}
                        title="Właściwości"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="danger"
                        disabled={disabled}
                        onClick={() => onDrop(rule)}
                        title="Usuń"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBlock>
      </div>
    </Panel>
  );
}

function PropertiesDialog({
  databaseName,
  target,
  onClose,
}: {
  databaseName: string;
  target: { type: string; name: string; schema?: string };
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"properties" | "sql" | "stats" | "deps">(
    "properties",
  );
  const [data, setData] = useState<{
    ddl: string;
    properties: Record<string, unknown>;
    dependencies: {
      dependents: { type: string; name: string; schema?: string; reason: string }[];
      dependencies: { type: string; name: string; schema?: string; reason: string }[];
    };
    stats: { rows?: number; columns?: number; indexes?: number; checks?: number; sizeBytes?: number; columns_stats?: { name: string; type: string; nullable: boolean; nulls: number; nullsPct: number; distinct: number; cardinalityPct: number; avgLength: number | null; min: number | string | null; max: number | string | null }[] } | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        databaseName,
        type: target.type,
        name: target.name,
        schema: target.schema,
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        if (cancelled) return;
        if (result.error) setError(String(result.error));
        else setData(result);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Błąd."));
    return () => {
      cancelled = true;
    };
  }, [databaseName, target.type, target.name, target.schema]);

  const tabs: { id: typeof tab; label: string }[] = [
    { id: "properties", label: "Właściwości" },
    { id: "sql", label: "SQL" },
    { id: "stats", label: "Statystyki" },
    { id: "deps", label: "Zależności" },
  ];

  return (
    <div className="atlas-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="atlas-dialog w-full max-w-3xl overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-700 px-5 py-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500">{target.type}
            </div>
            <div className="font-mono text-base font-semibold">{target.schema ? `${target.schema}.` : ""}{target.name}
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            onClick={onClose}
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-1 border-b border-zinc-700 bg-zinc-900 px-3 pt-3">
          {tabs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`rounded-t-md px-3 py-2 text-sm transition-colors ${tab === entry.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/60"}`}
              onClick={() => setTab(entry.id)}
            >{entry.label}
            </button>
          ))}
        </div>
        <div className="max-h-[65vh] overflow-auto p-5">
          {error ? (
            <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">{error}
            </div>
          ) : !data ? (
            <div className="text-sm text-zinc-500">Ładowanie…</div>
          ) : (
            <>{tab === "properties" ? (
                <ul className="space-y-1 text-sm">
                  {Object.entries(data.properties).map(([key, value]) => (
                    <li
                      key={key}
                      className="flex items-start justify-between gap-3 border-b border-zinc-800 py-1"
                    >
                      <span className="text-zinc-500">{key}</span>
                      <span className="font-mono text-right text-zinc-200">
                        {value === null || value === undefined
                          ? "—"
                          : typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}{tab === "sql" ? (
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(data.ddl).catch(() => undefined);
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Kopiuj
                  </Button>
                  <pre className="overflow-auto rounded-md border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-zinc-200">
                    {data.ddl}
                  </pre>
                </div>
              ) : null}{tab === "stats" ? (
                data.stats ? (
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-4 text-sm">
                      <Stat label="Wiersze" value={String(data.stats.rows ?? 0)} />
                      <Stat label="Kolumny" value={String(data.stats.columns ?? 0)} />
                      <Stat label="Indeksy" value={String(data.stats.indexes ?? 0)} />
                      <Stat label="Rozmiar" value={`${data.stats.sizeBytes ?? 0} B`} />
                    </div>
                    {data.stats.columns_stats?.length ? (
                      <div className="overflow-x-auto rounded-md border border-zinc-700">
                        <table className="w-full text-xs">
                          <thead className="bg-zinc-800 text-[10px] uppercase tracking-wide text-zinc-400">
                            <tr>
                              <th className="px-2 py-1 text-left">Kolumna</th>
                              <th className="px-2 py-1">Typ</th>
                              <th className="px-2 py-1">Nulls</th>
                              <th className="px-2 py-1">Distinct</th>
                              <th className="px-2 py-1">Avg len.</th>
                              <th className="px-2 py-1">Min</th>
                              <th className="px-2 py-1">Max</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800">
                            {data.stats.columns_stats.map((stat) => (
                              <tr key={stat.name}>
                                <td className="px-2 py-1 font-mono">{stat.name}</td>
                                <td className="px-2 py-1 font-mono text-zinc-400">
                                  {stat.type}
                                </td>
                                <td className="px-2 py-1 text-right text-zinc-300">
                                  {stat.nulls} ({stat.nullsPct.toFixed(0)}%)
                                </td>
                                <td className="px-2 py-1 text-right text-zinc-300">
                                  {stat.distinct} ({stat.cardinalityPct.toFixed(0)}%)
                                </td>
                                <td className="px-2 py-1 text-right text-zinc-300">
                                  {stat.avgLength !== null
                                    ? stat.avgLength.toFixed(1)
                                    : "—"}
                                </td>
                                <td className="px-2 py-1 text-zinc-300">
                                  {stat.min === null ? "—" : String(stat.min)}
                                </td>
                                <td className="px-2 py-1 text-zinc-300">
                                  {stat.max === null ? "—" : String(stat.max)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-zinc-500">
                    Statystyki dostępne tylko dla tabel.
                  </div>
                )
              ) : null}{tab === "deps" ? (
                <div className="space-y-4">
                  <DependencySection
                    title="Zależy od (dependencies)"
                    entries={data.dependencies.dependencies}
                  />
                  <DependencySection
                    title="Używane przez (dependents)"
                    entries={data.dependencies.dependents}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-700 px-5 py-3">
          <Button variant="secondary" onClick={onClose}>
            Zamknij
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-800 p-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-base">{value}</div>
    </div>
  );
}

function DependencySection({
  title,
  entries,
}: {
  title: string;
  entries: { type: string; name: string; schema?: string; reason: string }[];
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </div>
      {entries.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-500">
          Brak.
        </div>
      ) : (
        <ul className="space-y-1">
          {entries.map((entry, index) => (
            <li
              key={`${entry.type}-${entry.name}-${index}`}
              className="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs"
            >
              <span className="font-mono text-zinc-200">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {entry.type}
                </span>{" "}
                {entry.schema ? `${entry.schema}.` : ""}
                {entry.name}
              </span>
              <span className="text-zinc-500">{entry.reason}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DashboardPanel({
  database,
  healthStatus,
  consoleLog,
  onSelectTable,
}: {
  database: LocalDatabase | null;
  healthStatus: { online: boolean; latencyMs: number | null };
  consoleLog: ConsoleEntry[];
  onSelectTable: (tableName: string) => void;
}) {
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);  useEffect(() => {
    if (healthStatus.latencyMs === null) return;
    setLatencyHistory((current) => {
      const next = [...current, healthStatus.latencyMs!].slice(-30);
      return next;
    });
  }, [healthStatus.latencyMs, healthStatus.online]);

  const tables = database?.tables ?? [];
  const totalRows = tables.reduce((sum, table) => sum + table.rows.length, 0);
  const tablesByRows = [...tables]
    .sort((a, b) => b.rows.length - a.rows.length)
    .slice(0, 6);
  const recentTracking = (database?.tracking ?? []).slice(0, 8);
  const opsBySource = consoleLog.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.source] = (acc[entry.source] ?? 0) + 1;
    return acc;
  }, {});

  if (!database) {
    return (
      <Panel title="Dashboard" description="Wybierz bazę aby zobaczyć metryki.">
        <EmptyState />
      </Panel>
    );
  }

  return (
    <Panel
      title="Dashboard"
      description={`Real-time metryki bazy ${database.name}.`}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <DashStat label="Tabele" value={String(tables.length)} icon={Table2} />
        <DashStat label="Wiersze" value={totalRows.toLocaleString("pl-PL")} icon={Database} />
        <DashStat
          label="Indeksy"
          value={String(tables.reduce((sum, t) => sum + t.indexes.length, 0))}
          icon={Sparkles}
        />
        <DashStat
          label="Latencja"
          value={
            healthStatus.online
              ? `${healthStatus.latencyMs ?? "—"} ms`
              : "offline"
          }
          icon={Power}
          accent={healthStatus.online ? "ok" : "error"}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <CardBlock title="Latencja API (ostatnie 30 prób)">
          <Sparkline data={latencyHistory} height={60} />
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
            <span>min: {latencyHistory.length ? Math.min(...latencyHistory) : 0} ms</span>
            <span>max: {latencyHistory.length ? Math.max(...latencyHistory) : 0} ms</span>
            <span>
              avg:{" "}{latencyHistory.length
                ? Math.round(
                    latencyHistory.reduce((sum, value) => sum + value, 0) /
                      latencyHistory.length,
                  )
                : 0}{" "}
              ms
            </span>
          </div>
        </CardBlock>
        <CardBlock title="Top tabele">
          {tablesByRows.length === 0 ? (
            <div className="text-sm text-zinc-500">Brak tabel.</div>
          ) : (
            <ul className="space-y-1 text-sm">{tablesByRows.map((table) => {
                const max = tablesByRows[0].rows.length || 1;
                const pct = (table.rows.length / max) * 100;
                return (
                  <li key={table.name} className="space-y-0.5">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-left hover:text-zinc-100"
                      onClick={() => onSelectTable(table.name)}
                    >
                      <span className="font-mono">{table.name}</span>
                      <span className="text-xs text-zinc-500">
                        {table.rows.length}
                      </span>
                    </button>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBlock>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CardBlock title="Ostatnie operacje (tracking)">
          {recentTracking.length === 0 ? (
            <div className="text-sm text-zinc-500">Brak.</div>
          ) : (
            <ul className="space-y-1 text-xs">{recentTracking.map((entry, index) => (
                <li
                  key={index}
                  className="flex items-baseline justify-between border-b border-zinc-800 py-1"
                >
                  <span className="font-mono text-zinc-200">{entry.action}</span>
                  <span className="truncate text-zinc-500">{entry.objectName}</span>
                  <span className="ml-2 shrink-0 text-zinc-600">
                    {entry.createdAt.replace("T", " ").replace(/\..*/, "")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBlock>
        <CardBlock title="Operacje per moduł (ostatnie)">
          {Object.keys(opsBySource).length === 0 ? (
            <div className="text-sm text-zinc-500">Brak danych.</div>
          ) : (
            <ul className="space-y-1 text-sm">{Object.entries(opsBySource)
                .sort((a, b) => b[1] - a[1])
                .map(([source, count]) => {
                  const max = Math.max(...Object.values(opsBySource));
                  const pct = (count / max) * 100;
                  return (
                    <li key={source} className="space-y-0.5">
                      <div className="flex justify-between">
                        <span className="font-mono text-zinc-200">{source}</span>
                        <span className="text-xs text-zinc-500">{count}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </CardBlock>
      </div>
    </Panel>
  );
}

function DashStat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Table2;
  accent?: "ok" | "error";
}) {
  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-900 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        <Icon
          className={`h-4 w-4 ${accent === "error" ? "text-rose-400" : accent === "ok" ? "text-emerald-400" : "text-zinc-400"}`}
        />
      </div>
      <div className="mt-1 font-mono text-xl">{value}</div>
    </div>
  );
}

function Sparkline({ data, height = 40 }: { data: number[]; height?: number }) {
  if (data.length === 0)
    return (
      <div
        className="flex w-full items-center justify-center text-xs text-zinc-500"
        style={{ height }}
      >
        Brak danych — działanie aplikacji wygeneruje próbki.
      </div>
    );
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
    >
      <polyline
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ErdPanel({
  database,
  onSelectTable,
}: {
  database: LocalDatabase | null;
  onSelectTable: (tableName: string) => void;
}) {
  type ErdPosition = { x: number; y: number };
  type ErdEndpoint = { table: string; column: string };
  type ErdEdge = ErdEndpoint & {
    id: string;
    toTable: string;
    toColumn: string;
    manual?: boolean;
  };
  type DragState = { table: string; offsetX: number; offsetY: number };

  const cardWidth = 260;
  const headerHeight = 42;
  const rowHeight = 28;
  const visibleColumnCount = 9;
  const tables = useMemo(() => database?.tables ?? [], [database]);
  const tableByName = useMemo(
    () => new Map(tables.map((table) => [table.name, table])),
    [tables],
  );
  const [positions, setPositions] = useState<Record<string, ErdPosition>>({});
  const [manualEdges, setManualEdges] = useState<ErdEdge[]>([]);
  const [removedEdgeIds, setRemovedEdgeIds] = useState<string[]>([]);
  const [pendingEndpoint, setPendingEndpoint] = useState<ErdEndpoint | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const canvasRef = React.useRef<HTMLDivElement | null>(null);
  const storageKey = database ? `localdb-erd:${database.name}` : "localdb-erd";

  const defaultPositions = useMemo(() => {
    const cols = Math.max(2, Math.ceil(Math.sqrt(tables.length || 1)));
    const next: Record<string, ErdPosition> = {};
    tables.forEach((table, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      next[table.name] = { x: col * 340 + 32, y: row * 390 + 32 };
    });
    return next;
  }, [tables]);  useEffect(() => {
    if (!database) return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          positions?: Record<string, ErdPosition>;
          manualEdges?: ErdEdge[];
          removedEdgeIds?: string[];
        };
        setPositions({ ...defaultPositions, ...(parsed.positions ?? {}) });
        setManualEdges(parsed.manualEdges ?? []);
        setRemovedEdgeIds(parsed.removedEdgeIds ?? []);
        return;
      } catch {
        // corrupted layout should not block ERD
      }
    }
    setPositions(defaultPositions);
    setManualEdges([]);
    setRemovedEdgeIds([]);
  }, [database, defaultPositions, storageKey]);  useEffect(() => {
    if (!database || tables.length === 0) return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ positions, manualEdges, removedEdgeIds }),
    );
  }, [database, manualEdges, positions, removedEdgeIds, storageKey, tables.length]);

  const autoEdges: ErdEdge[] = useMemo(() => {
    const result: ErdEdge[] = [];
    for (const table of tables) {
      for (const column of table.columns) {
        const match = column.name.match(/^(.+?)_id$/i);
        if (!match) continue;
        const candidates = [match[1], `${match[1]}s`, `${match[1]}es`];
        for (const candidate of candidates) {
          const target = tableByName.get(candidate);
          if (!target || target.name === table.name) continue;
          const targetPk = target.columns.find((item) => item.primaryKey);
          const toColumn = targetPk?.name ?? target.columns[0]?.name ?? "id";
          result.push({
            id: `auto:${table.name}:${column.name}:${target.name}:${toColumn}`,
            table: table.name,
            column: column.name,
            toTable: target.name,
            toColumn,
          });
          break;
        }
      }
    }
    return result;
  }, [tableByName, tables]);

  const edges = useMemo(() => {
    const removed = new Set(removedEdgeIds);
    const map = new Map<string, ErdEdge>();
    [...autoEdges, ...manualEdges]
      .filter((edge) => !removed.has(edge.id))
      .forEach((edge) => map.set(edge.id, edge));
    return [...map.values()].filter(
      (edge) => tableByName.has(edge.table) && tableByName.has(edge.toTable),
    );
  }, [autoEdges, manualEdges, removedEdgeIds, tableByName]);

  const mergedPositions = useMemo(
    () => ({ ...defaultPositions, ...positions }),
    [defaultPositions, positions],
  );

  const getCardHeight = (table: LocalDbTable) =>
    headerHeight + Math.min(table.columns.length, visibleColumnCount) * rowHeight + 44;

  const getColumnY = (table: LocalDbTable | undefined, columnName: string) => {
    if (!table) return headerHeight + 18;
    const index = table.columns.findIndex((column) => column.name === columnName);
    if (index === -1 || index >= visibleColumnCount) return headerHeight + 14;
    return headerHeight + index * rowHeight + rowHeight / 2;
  };

  const getWindowAnchor = (fromTableName: string, toTableName: string) => {
    const fromTable = tableByName.get(fromTableName);
    const toTable = tableByName.get(toTableName);
    const fromPos = mergedPositions[fromTableName] ?? { x: 0, y: 0 };
    const toPos = mergedPositions[toTableName] ?? { x: 0, y: 0 };
    const fromHeight = fromTable ? getCardHeight(fromTable) : 180;
    const toHeight = toTable ? getCardHeight(toTable) : 180;
    const fromCenter = {
      x: fromPos.x + cardWidth / 2,
      y: fromPos.y + fromHeight / 2,
    };
    const toCenter = {
      x: toPos.x + cardWidth / 2,
      y: toPos.y + toHeight / 2,
    };
    const horizontal = Math.abs(toCenter.x - fromCenter.x) >= Math.abs(toCenter.y - fromCenter.y);

    if (horizontal) {
      return {
        from: {
          x: fromCenter.x <= toCenter.x ? fromPos.x + cardWidth : fromPos.x,
          y: fromCenter.y,
        },
        to: {
          x: fromCenter.x <= toCenter.x ? toPos.x : toPos.x + cardWidth,
          y: toCenter.y,
        },
      };
    }

    return {
      from: {
        x: fromCenter.x,
        y: fromCenter.y <= toCenter.y ? fromPos.y + fromHeight : fromPos.y,
      },
      to: {
        x: toCenter.x,
        y: fromCenter.y <= toCenter.y ? toPos.y : toPos.y + toHeight,
      },
    };
  };

  const canvasSize = useMemo(() => {
    let width = 900;
    let height = 560;
    for (const table of tables) {
      const pos = mergedPositions[table.name];
      if (!pos) continue;
      width = Math.max(width, pos.x + cardWidth + 96);
      height = Math.max(height, pos.y + getCardHeight(table) + 96);
    }
    return { width, height };
  }, [mergedPositions, tables]);

  const handleDragStart = (
    tableName: string,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const pos = mergedPositions[tableName] ?? { x: 0, y: 0 };
    setDragState({
      table: tableName,
      offsetX: event.clientX - (rect?.left ?? 0) + (canvasRef.current?.scrollLeft ?? 0) - pos.x,
      offsetY: event.clientY - (rect?.top ?? 0) + (canvasRef.current?.scrollTop ?? 0) - pos.y,
    });
  };

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left + canvasRef.current.scrollLeft - dragState.offsetX;
    const y = event.clientY - rect.top + canvasRef.current.scrollTop - dragState.offsetY;
    setPositions((current) => ({
      ...current,
      [dragState.table]: { x: Math.max(8, x), y: Math.max(8, y) },
    }));
  };

  const handleEndpointClick = (endpoint: ErdEndpoint) => {
    if (!pendingEndpoint) {
      setPendingEndpoint(endpoint);
      return;
    }
    if (
      pendingEndpoint.table === endpoint.table &&
      pendingEndpoint.column === endpoint.column
    ) {
      setPendingEndpoint(null);
      return;
    }
    const edge: ErdEdge = {
      id: `manual:${pendingEndpoint.table}:${pendingEndpoint.column}:${endpoint.table}:${endpoint.column}`,
      table: pendingEndpoint.table,
      column: pendingEndpoint.column,
      toTable: endpoint.table,
      toColumn: endpoint.column,
      manual: true,
    };
    setManualEdges((current) =>
      current.some((item) => item.id === edge.id) ? current : [...current, edge],
    );
    setPendingEndpoint(null);
  };

  const removeEdge = (edge: ErdEdge) => {
    if (edge.manual) {
      setManualEdges((current) => current.filter((item) => item.id !== edge.id));
    } else {
      setRemovedEdgeIds((current) =>
        current.includes(edge.id) ? current : [...current, edge.id],
      );
    }
  };

  const resetLayout = () => {
    setPositions(defaultPositions);
    setManualEdges([]);
    setRemovedEdgeIds([]);
    setPendingEndpoint(null);
  };

  if (!database || tables.length === 0) {
    return (
      <Panel title="ERD" description="Diagram tabel i relacji.">
        <EmptyState />
      </Panel>
    );
  }

  return (
    <Panel
      title="ERD"
      description={`${tables.length} tabel · ${edges.length} relacji. Przeciągaj karty, klikaj punkty aby połączyć, kliknij linię relacji aby ją usunąć.`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {pendingEndpoint ? (
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
              Łączenie: {pendingEndpoint.table}.{pendingEndpoint.column}
            </span>
          ) : null}
          <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => setPendingEndpoint(null)}>
            Anuluj łączenie
          </Button>
          <Button variant="outline" className="h-8 px-3 text-xs" onClick={resetLayout}>
            Reset ERD
          </Button>
        </div>
      }
    >
      <div
        ref={canvasRef}
        className="relative h-[680px] overflow-auto rounded-xl border border-zinc-700 bg-zinc-950"
        onMouseMove={handlePointerMove}
        onMouseUp={() => setDragState(null)}
        onMouseLeave={() => setDragState(null)}
      >
        <div
          className="relative"
          style={{ width: canvasSize.width, height: canvasSize.height }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(113,113,122,0.28)_1px,transparent_0)] bg-[length:24px_24px]" />
          <svg
            className="absolute inset-0"
            width={canvasSize.width}
            height={canvasSize.height}
          >
            <defs>
              <marker
                id="erd-arrowhead"
                markerWidth="10"
                markerHeight="8"
                refX="9"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L10,4 L0,8 Z" fill="rgb(161, 161, 170)" />
              </marker>
            </defs>
            {edges.map((edge) => {
              const { from, to } = getWindowAnchor(edge.table, edge.toTable);
              const horizontal = Math.abs(to.x - from.x) >= Math.abs(to.y - from.y);
              const delta = horizontal
                ? Math.max(72, Math.abs(to.x - from.x) * 0.45)
                : Math.max(72, Math.abs(to.y - from.y) * 0.45);
              const path = horizontal
                ? `M ${from.x} ${from.y} C ${from.x + (to.x >= from.x ? delta : -delta)} ${from.y}, ${to.x + (to.x >= from.x ? -delta : delta)} ${to.y}, ${to.x} ${to.y}`
                : `M ${from.x} ${from.y} C ${from.x} ${from.y + (to.y >= from.y ? delta : -delta)}, ${to.x} ${to.y + (to.y >= from.y ? -delta : delta)}, ${to.x} ${to.y}`;
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              return (
                <g key={edge.id} className="group cursor-pointer" onClick={() => removeEdge(edge)}>
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="14"
                    className="pointer-events-stroke"
                  />
                  <path
                    d={path}
                    fill="none"
                    stroke={edge.manual ? "rgb(212, 212, 216)" : "rgb(113, 113, 122)"}
                    strokeWidth={edge.manual ? 2 : 1.5}
                    strokeOpacity={edge.manual ? 0.9 : 0.62}
                    markerEnd="url(#erd-arrowhead)"
                    className="pointer-events-none group-hover:stroke-red-400"
                  />
                  <text
                    x={midX}
                    y={midY - 8}
                    fontSize="10"
                    fill="rgb(161, 161, 170)"
                    textAnchor="middle"
                    className="pointer-events-none font-mono group-hover:fill-red-300"
                  >
                    {edge.column} → {edge.toColumn}
                  </text>
                </g>
              );
            })}
          </svg>
          {tables.map((table) => {
            const pos = mergedPositions[table.name] ?? { x: 0, y: 0 };
            const visibleCols = table.columns.slice(0, visibleColumnCount);
            const hiddenCount = table.columns.length - visibleCols.length;
            const height = getCardHeight(table);
            return (
              <div
                key={table.name}
                className="absolute overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/20"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: cardWidth,
                  height,
                }}
                onDoubleClick={() => onSelectTable(table.name)}
              >
                <div
                  className="flex cursor-move items-center justify-between gap-3 border-b border-zinc-700 bg-zinc-800 px-3 py-2"
                  onMouseDown={(event) => handleDragStart(table.name, event)}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-100">
                      {table.name}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                      {table.columns.length} kolumn · {table.rows.length} wierszy
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={() => onSelectTable(table.name)}
                  >
                    Otwórz
                  </button>
                </div>
                <div className="divide-y divide-zinc-800">
                  {visibleCols.map((column) => {
                    const isPending =
                      pendingEndpoint?.table === table.name &&
                      pendingEndpoint.column === column.name;
                    const isFk = /_id$/i.test(column.name);
                    return (
                      <div
                        key={column.name}
                        className={`group flex h-7 items-center gap-2 px-2 text-xs ${isPending ? "bg-zinc-700/70" : "hover:bg-zinc-800"}`}
                      >
                        <button
                          type="button"
                          aria-label={`Połącz ${table.name}.${column.name}`}
                          className={`h-3 w-3 rounded-full border ${isPending ? "border-zinc-100 bg-zinc-100" : "border-zinc-500 bg-zinc-900 group-hover:bg-zinc-500"}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEndpointClick({ table: table.name, column: column.name });
                          }}
                        />
                        <span className="w-7 shrink-0 text-[10px] font-semibold text-zinc-500">
                          {column.primaryKey ? "PK" : isFk ? "FK" : ""}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-mono text-zinc-200">
                          {column.name}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-zinc-500">
                          {column.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {hiddenCount > 0 ? (
                  <div className="border-t border-zinc-800 px-3 py-2 text-xs text-zinc-500">
                    + {hiddenCount} więcej kolumn
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function SchemaDiffPanel({
  databases,
  selectedDatabase,
}: {
  databases: LocalDatabase[];
  selectedDatabase: string;
}) {
  const [a, setA] = useState<string>(selectedDatabase || databases[0]?.name || "");
  const [b, setB] = useState<string>(databases[1]?.name || databases[0]?.name || "");
  const [diff, setDiff] = useState<{
    diff: {
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
    a: string;
    b: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function runDiff() {
    setError(null);
    setRunning(true);
    try {
      const response = await fetch("/api/diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a, b }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setDiff(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd diff.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Panel
      title="Schema Diff"
      description="Porównaj schemat dwóch baz danych. Pokazuje różnice w tabelach, kolumnach, widokach i procedurach."
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px]">
          <Label>Baza A</Label>
          <select
            className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
            value={a}
            onChange={(event) => setA(event.target.value)}
          >
            {databases.map((database) => (
              <option key={database.name} value={database.name}>
                {database.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px]">
          <Label>Baza B</Label>
          <select
            className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
            value={b}
            onChange={(event) => setB(event.target.value)}
          >
            {databases.map((database) => (
              <option key={database.name} value={database.name}>
                {database.name}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={runDiff} disabled={running || !a || !b || a === b}>
          <RefreshCw className="mr-2 h-4 w-4" /> Porównaj
        </Button>
      </div>
      {error ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}
      {diff ? (
        <div className="space-y-3">
          <DiffSection
            title="Tabele tylko w A"
            items={diff.diff.tablesOnlyA}
            tone="add"
          />
          <DiffSection
            title="Tabele tylko w B"
            items={diff.diff.tablesOnlyB}
            tone="remove"
          />
          {diff.diff.tableDiffs.map((entry) => (
            <CardBlock key={entry.name} title={`Tabela: ${entry.name}`}>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <DiffSubsection
                  title="Kolumny tylko w A"
                  items={entry.columnsOnlyA}
                  tone="add"
                />
                <DiffSubsection
                  title="Kolumny tylko w B"
                  items={entry.columnsOnlyB}
                  tone="remove"
                />
                <DiffSubsection
                  title="Indeksy tylko w A"
                  items={entry.indexesOnlyA}
                  tone="add"
                />
                <DiffSubsection
                  title="Indeksy tylko w B"
                  items={entry.indexesOnlyB}
                  tone="remove"
                />
              </div>{entry.columnTypeDiffs.length > 0 ? (
                <div className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-amber-400">
                    Różnice typów
                  </div>
                  <ul className="mt-1 space-y-1 text-xs">
                    {entry.columnTypeDiffs.map((d) => (
                      <li key={d.column}>
                        <span className="font-mono">{d.column}</span>:{" "}
                        <span className="text-rose-300">{d.a}</span> →{" "}
                        <span className="text-emerald-300">{d.b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardBlock>
          ))}
          <DiffSection
            title="Widoki tylko w A"
            items={diff.diff.viewsOnlyA}
            tone="add"
          />
          <DiffSection
            title="Widoki tylko w B"
            items={diff.diff.viewsOnlyB}
            tone="remove"
          />
          {diff.diff.viewSqlDiffs.length > 0 ? (
            <CardBlock title="Widoki o różnym SQL">
              <ul className="space-y-2">
                {diff.diff.viewSqlDiffs.map((entry) => (
                  <li key={entry.name} className="text-xs">
                    <div className="font-mono font-semibold">{entry.name}</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <pre className="overflow-auto rounded-md border border-rose-500/30 bg-rose-500/5 p-2 text-rose-200">
                        {entry.a}
                      </pre>
                      <pre className="overflow-auto rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2 text-emerald-200">
                        {entry.b}
                      </pre>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBlock>
          ) : null}
          <DiffSection
            title="Procedury tylko w A"
            items={diff.diff.routinesOnlyA}
            tone="add"
          />
          <DiffSection
            title="Procedury tylko w B"
            items={diff.diff.routinesOnlyB}
            tone="remove"
          />
          <DiffSection
            title="Wyzwalacze tylko w A"
            items={diff.diff.triggersOnlyA}
            tone="add"
          />
          <DiffSection
            title="Wyzwalacze tylko w B"
            items={diff.diff.triggersOnlyB}
            tone="remove"
          />
        </div>
      ) : null}
    </Panel>
  );
}

function DiffSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "add" | "remove";
}) {
  if (items.length === 0) return null;
  return (
    <CardBlock title={title}>
      <ul className="flex flex-wrap gap-1 text-xs">
        {items.map((item) => (
          <li
            key={item}
            className={`rounded-full px-2 py-0.5 font-mono ${tone === "add" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </CardBlock>
  );
}

function DiffSubsection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "add" | "remove";
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {title}
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-zinc-500">—</div>
      ) : (
        <ul className="mt-1 flex flex-wrap gap-1">
          {items.map((item) => (
            <li
              key={item}
              className={`rounded-full px-2 py-0.5 text-xs font-mono ${tone === "add" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}
            >{item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type SnapshotEntry = { id: string; createdAt: string; sizeBytes?: number };

function BackupPanel({
  database,
  disabled,
  askConfirm,
  onCreateSnapshot,
  onRestore,
  onDelete,
  onExportFull,
}: {
  database: LocalDatabase | null;
  disabled?: boolean;
  askConfirm: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
  }) => Promise<boolean>;
  onCreateSnapshot: () => Promise<void> | void;
  onRestore: (snapshotId: string) => Promise<void> | void;
  onDelete: (snapshotId: string) => Promise<void> | void;
  onExportFull: () => void;
}) {
  const [snapshots, setSnapshots] = useState<SnapshotEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);  useEffect(() => {
    if (!database) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/snapshots?database=${encodeURIComponent(database.name)}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(String(data.error));
        else setSnapshots(data.snapshots ?? []);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Błąd."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [database, database?.tracking?.length]);

  if (!database) {
    return (
      <Panel title="Backup" description="Wybierz bazę aby zarządzać snapshotami.">
        <EmptyState />
      </Panel>
    );
  }

  return (
    <Panel
      title="Backup & Restore"
      description="Snapshoty bazy oraz pełny eksport ZIP. Snapshoty są idempotentne — przywrócenie nadpisuje aktualny stan."
      actions={
        <div className="flex gap-2">
          <Button onClick={onExportFull} variant="secondary">
            <Download className="mr-2 h-4 w-4" /> Pełny ZIP
          </Button>
          <Button onClick={onCreateSnapshot} variant="success" disabled={disabled}>
            <Save className="mr-2 h-4 w-4" /> Nowy snapshot
          </Button>
        </div>
      }
    >
      {error ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="text-sm text-zinc-500">Ładowanie…</div>
      ) : snapshots.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-700 bg-zinc-900 p-4 text-sm text-zinc-500">
          Brak snapshotów. Utwórz pierwszy snapshot aby zachować bieżący stan.
        </div>
      ) : (
        <ul className="space-y-2">
          {snapshots.map((snapshot) => (
            <li
              key={snapshot.id}
              className="flex items-center justify-between gap-3 rounded-md border border-zinc-700 bg-zinc-900 p-3"
            >
              <div className="min-w-0">
                <div className="font-mono text-sm">{snapshot.id}</div>
                <div className="text-xs text-zinc-500">
                  {snapshot.createdAt.replace("T", " ").replace(/\..*/, "")}
                  {snapshot.sizeBytes
                    ? ` · ${Math.round(snapshot.sizeBytes / 1024)} KB`
                    : ""}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  disabled={disabled}
                  onClick={async () => {
                    if (
                      !(await askConfirm({
                        title: "Przywrócić snapshot?",
                        message: `Stan bazy zostanie zastąpiony danymi z ${snapshot.id}. Operacja nieodwracalna.`,
                        confirmLabel: "Przywróć",
                        danger: true,
                      }))
                    )
                      return;
                    await onRestore(snapshot.id);
                  }}
                  title="Przywróć"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="danger"
                  disabled={disabled}
                  onClick={async () => {
                    if (
                      !(await askConfirm({
                        title: "Usunąć snapshot?",
                        message: `${snapshot.id} zostanie skasowany.`,
                        confirmLabel: "Usuń",
                        danger: true,
                      }))
                    )
                      return;
                    await onDelete(snapshot.id);
                  }}
                  title="Usuń"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function JobsPanel({
  events,
  disabled,
  onSaveSteps,
  onRun,
  onClearHistory,
}: {
  events: LocalDbEvent[];
  disabled?: boolean;
  onSaveSteps: (eventName: string, steps: LocalDbJobStep[]) => Promise<void> | void;
  onRun: (eventName: string) => Promise<void> | void;
  onClearHistory: (eventName: string) => Promise<void> | void;
}) {
  const [selected, setSelected] = useState<string | null>(events[0]?.name ?? null);
  const event = events.find((entry) => entry.name === selected) ?? null;

  if (events.length === 0)
    return (
      <Panel
        title="Job Scheduler"
        description='Brak zdarzeń. Utwórz event w zakładce „Zdarzenia" — joby budują kroki na bazie events.'
      >
        <EmptyState />
      </Panel>
    );

  return (
    <Panel
      title="Job Scheduler"
      description="Wieloetapowe joby z historią uruchomień. Definiuj kroki SQL i uruchamiaj je ręcznie."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <CardBlock title={`Eventy (${events.length})`}>
          <ul className="space-y-1">
            {events.map((entry) => (
              <li key={entry.name}>
                <button
                  type="button"
                  className={`flex w-full items-start justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm ${selected === entry.name ? "border-[var(--accent)] bg-zinc-800" : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"}`}
                  onClick={() => setSelected(entry.name)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="font-mono font-semibold">{entry.name}</span>
                    <span className="block text-[11px] text-zinc-500">
                      {entry.schedule} · {entry.enabled ? "ON" : "OFF"}
                    </span>
                  </span>
                  {entry.lastStatus ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${entry.lastStatus === "success" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}
                    >
                      {entry.lastStatus}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </CardBlock>
        {event ? (
          <JobEditor
            key={event.name}
            event={event}
            disabled={disabled}
            onSaveSteps={(steps) => onSaveSteps(event.name, steps)}
            onRun={() => onRun(event.name)}
            onClearHistory={() => onClearHistory(event.name)}
          />
        ) : (
          <CardBlock title="Wybierz event">
            <div className="text-sm text-zinc-500">
              Zaznacz event z listy aby konfigurować jego kroki.
            </div>
          </CardBlock>
        )}
      </div>
    </Panel>
  );
}

function JobEditor({
  event,
  disabled,
  onSaveSteps,
  onRun,
  onClearHistory,
}: {
  event: LocalDbEvent;
  disabled?: boolean;
  onSaveSteps: (steps: LocalDbJobStep[]) => Promise<void> | void;
  onRun: () => Promise<void> | void;
  onClearHistory: () => Promise<void> | void;
}) {
  const [steps, setSteps] = useState<LocalDbJobStep[]>(() =>
    event.steps && event.steps.length > 0
      ? event.steps
      : [
          {
            id: "default",
            name: "krok 1",
            kind: "sql",
            body: event.body || "SELECT 1;",
            enabled: true,
            onError: "stop",
          },
        ],
  );

  function update(index: number, patch: Partial<LocalDbJobStep>) {
    setSteps((current) =>
      current.map((step, i) => (i === index ? { ...step, ...patch } : step)),
    );
  }

  function remove(index: number) {
    setSteps((current) => current.filter((_, i) => i !== index));
  }

  function move(index: number, delta: -1 | 1) {
    setSteps((current) => {
      const next = current.slice();
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addStep() {
    setSteps((current) => [
      ...current,
      {
        id: `step-${Date.now()}`,
        name: `krok ${current.length + 1}`,
        kind: "sql",
        body: "",
        enabled: true,
        onError: "stop",
      },
    ]);
  }

  return (
    <div className="space-y-4">
      <CardBlock
        title={`Kroki ${event.name}`}
        right={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={addStep}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Dodaj krok
            </Button>
            <Button
              variant="success"
              disabled={disabled}
              onClick={() => onSaveSteps(steps)}
            >
              <Save className="mr-1 h-3.5 w-3.5" /> Zapisz
            </Button>
            <Button
              disabled={disabled}
              onClick={() => onRun()}
            >
              <Code2 className="mr-1 h-3.5 w-3.5" /> Uruchom
            </Button>
          </div>
        }
      >
        <ul className="space-y-2">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className="rounded-md border border-zinc-700 bg-zinc-900 p-3"
            >
              <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
                <Input
                  value={step.name}
                  onChange={(event) => update(index, { name: event.target.value })}
                  placeholder="nazwa"
                  disabled={disabled}
                />
                <select
                  className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                  value={step.kind}
                  onChange={(event) =>
                    update(index, {
                      kind: event.target.value as LocalDbJobStep["kind"],
                    })
                  }
                  disabled={disabled}
                >
                  <option value="sql">SQL</option>
                  <option value="shell">Shell (off)</option>
                </select>
                <select
                  className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                  value={step.onError}
                  onChange={(event) =>
                    update(index, {
                      onError: event.target.value as LocalDbJobStep["onError"],
                    })
                  }
                  disabled={disabled}
                >
                  <option value="stop">stop on error</option>
                  <option value="continue">continue on error</option>
                </select>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="secondary"
                    onClick={() => move(index, -1)}
                    disabled={disabled || index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => move(index, 1)}
                    disabled={disabled || index === steps.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => remove(index)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <Textarea
                rows={4}
                value={step.body}
                onChange={(event) => update(index, { body: event.target.value })}
                placeholder="SQL polecenie…"
                disabled={disabled}
                className="mt-2 font-mono text-xs"
              />
              <label className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={step.enabled}
                  onChange={(event) =>
                    update(index, { enabled: event.target.checked })
                  }
                />
                Aktywny
              </label>
            </li>
          ))}
        </ul>
      </CardBlock>

      <CardBlock
        title={`Historia (${event.history?.length ?? 0})`}
        right={
          (event.history?.length ?? 0) > 0 ? (
            <Button
              variant="secondary"
              className="h-7 px-2 text-xs"
              onClick={() => onClearHistory()}
              disabled={disabled}
            >
              Wyczyść
            </Button>
          ) : null
        }
      >
        {(event.history ?? []).length === 0 ? (
          <div className="text-sm text-zinc-500">Brak uruchomień.</div>
        ) : (
          <ul className="space-y-2">
            {(event.history ?? []).map((entry) => (
              <li
                key={entry.id}
                className="rounded-md border border-zinc-700 bg-zinc-900 p-3 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-zinc-400">
                    {entry.startedAt.replace("T", " ").replace(/\..*/, "")}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${entry.status === "success" ? "bg-emerald-500/20 text-emerald-300" : entry.status === "running" ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300"}`}
                  >
                    {entry.status}
                  </span>
                </div>
                {entry.message ? (
                  <div className="mt-1 text-zinc-500">{entry.message}</div>
                ) : null}
                <ul className="mt-2 space-y-1">
                  {entry.steps.map((step) => (
                    <li
                      key={step.name}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="font-mono text-zinc-300">{step.name}</span>
                      <span className="text-[10px] text-zinc-500">
                        {step.durationMs} ms
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${step.status === "success" ? "bg-emerald-500/15 text-emerald-300" : step.status === "skipped" ? "bg-zinc-500/15 text-zinc-400" : "bg-rose-500/15 text-rose-300"}`}
                      >
                        {step.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </CardBlock>
    </div>
  );
}

function TrackingPanel({
  entries,
  onClear,
  onExport,
}: {
  entries: { createdAt: string; action: string; objectName: string; sql?: string }[];
  onClear: () => void;
  onExport: () => void;
}) {
  const [filter, setFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const actions = useMemo(() => {
    const set = new Set<string>();
    for (const entry of entries) set.add(entry.action);
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return entries.filter((entry) => {
      if (actionFilter && entry.action !== actionFilter) return false;
      if (!needle) return true;
      return [entry.action, entry.objectName, entry.sql ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [entries, filter, actionFilter]);

  return (
    <Panel
      title="Śledzenie"
      description={`Historia zmian (${entries.length} wpisów, ${filtered.length} po filtrze).`}
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          placeholder="szukaj w nazwie / SQL"
          className="max-w-sm"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
        <select
          className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
        >
          <option value="">wszystkie akcje</option>
          {actions.map((action) => (
            <option key={action} value={action}>{action}
            </option>
          ))}
        </select>
        <Button
          variant="secondary"
          onClick={() => {
            setFilter("");
            setActionFilter("");
          }}
        >
          Reset
        </Button>
        <Button
          variant="secondary"
          disabled={entries.length === 0}
          onClick={onExport}
        >
          <Download className="mr-2 h-4 w-4" /> CSV
        </Button>
        <Button
          variant="danger"
          disabled={entries.length === 0}
          onClick={onClear}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Wyczyść historię
        </Button>
      </div>
      <DataTable
        columns={["createdAt", "action", "objectName", "sql"]}
        rows={filtered.map((entry) => ({
          createdAt: entry.createdAt,
          action: entry.action,
          objectName: entry.objectName,
          sql: entry.sql ?? "",
        }))}
        sortable
        paginated
      />
    </Panel>
  );
}

function StructurePanel({
  databaseName,
  table,
  onSchemaAction,
  onCheckSave,
  onCheckDrop,
  askConfirm,
}: {
  databaseName: string;
  table: LocalDbTable;
  onSchemaAction: (
    operation: string,
    payload: Record<string, unknown>,
    message: string,
  ) => Promise<void>;
  onCheckSave?: (
    check: { name: string; expression: string },
    oldName?: string,
  ) => Promise<void> | void;
  onCheckDrop?: (name: string) => Promise<void> | void;
  askConfirm: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
    requireName?: string;
  }) => Promise<boolean>;
}) {
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [draftColumn, setDraftColumn] = useState<Partial<LocalDbColumn>>({});
  const [newColumn, setNewColumn] = useState<Partial<LocalDbColumn>>({
    name: "",
    type: "VARCHAR",
    nullable: true,
    length: 255,
  });
  const [newIndexName, setNewIndexName] = useState("");
  const [newIndexColumns, setNewIndexColumns] = useState<string[]>([]);
  const [newIndexUnique, setNewIndexUnique] = useState(false);

  const groupedTypes = useMemo(() => {
    const groups = new Map<string, typeof COLUMN_TYPES>();
    for (const meta of COLUMN_TYPES) {
      const list = groups.get(meta.category) ?? [];
      list.push(meta);
      groups.set(meta.category, list);
    }
    return groups;
  }, []);

  function startEdit(column: LocalDbColumn) {
    setEditingColumn(column.name);
    setDraftColumn({ ...column });
  }

  async function handleAddColumn() {
    if (!newColumn.name || !newColumn.type) return;
    await onSchemaAction(
      "addColumn",
      { column: newColumn },
      `Kolumna ${newColumn.name} dodana.`,
    );
    setNewColumn({ name: "", type: "VARCHAR", nullable: true, length: 255 });
  }

  async function handleSaveEdit() {
    if (!editingColumn) return;
    const original = table.columns.find((c) => c.name === editingColumn);
    if (!original) return;
    if (draftColumn.name && draftColumn.name !== original.name) {
      await onSchemaAction(
        "renameColumn",
        { columnName: original.name, newName: draftColumn.name },
        "Nazwa kolumny zmieniona.",
      );
    }
    const patch: Partial<LocalDbColumn> = { ...draftColumn };
    delete patch.name;
    await onSchemaAction(
      "alterColumn",
      { columnName: draftColumn.name ?? original.name, patch },
      "Kolumna zaktualizowana.",
    );
    setEditingColumn(null);
    setDraftColumn({});
  }

  async function handleDropColumn(column: LocalDbColumn) {
    if (
      !(await askConfirm({
        title: "Usunąć kolumnę?",
        message: `Kolumna ${column.name} oraz jej wartości zostaną usunięte. Operacja jest nieodwracalna.`,
        confirmLabel: "Usuń kolumnę",
        danger: true,
        requireName: column.name,
      }))
    )
      return;
    await onSchemaAction(
      "dropColumn",
      { columnName: column.name },
      "Kolumna usunięta.",
    );
  }

  async function handleAddIndex() {
    if (!newIndexName || newIndexColumns.length === 0) return;
    await onSchemaAction(
      "addIndex",
      {
        indexName: newIndexName,
        indexColumns: newIndexColumns,
        unique: newIndexUnique,
      },
      `Indeks ${newIndexName} dodany.`,
    );
    setNewIndexName("");
    setNewIndexColumns([]);
    setNewIndexUnique(false);
  }

  async function handleDropIndex(name: string) {
    if (
      !(await askConfirm({
        title: "Usunąć indeks?",
        message: `Indeks ${name} zostanie usunięty.`,
        confirmLabel: "Usuń indeks",
        danger: true,
      }))
    )
      return;
    await onSchemaAction("dropIndex", { indexName: name }, "Indeks usunięty.");
  }

  return (
    <div className="space-y-4">
      <CardBlock title="Kolumny">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-zinc-700 text-xs uppercase tracking-wide text-zinc-200">
              <tr>
                <th className="border border-zinc-700 px-3 py-2 text-left">Nazwa</th>
                <th className="border border-zinc-700 px-3 py-2 text-left">Typ</th>
                <th className="border border-zinc-700 px-3 py-2 text-left">Atrybuty</th>
                <th className="border border-zinc-700 px-3 py-2 text-left">Default</th>
                <th className="border border-zinc-700 px-3 py-2 text-right w-44">Akcje</th>
              </tr>
            </thead>
            <tbody>{table.columns.map((column) => {
                const isEditing = editingColumn === column.name;
                const draft = isEditing ? draftColumn : column;
                const meta = COLUMN_TYPES.find((m) => m.name === draft.type);
                return (
                  <tr key={column.name} className="align-top">
                    <td className="border border-zinc-700 px-3 py-2 font-mono">
                      {isEditing ? (
                        <Input
                          className="h-9"
                          value={draftColumn.name ?? ""}
                          onChange={(e) =>
                            setDraftColumn({ ...draftColumn, name: e.target.value })
                          }
                        />
                      ) : (
                        column.name
                      )}
                    </td>
                    <td className="border border-zinc-700 px-3 py-2">
                      {isEditing ? (
                        <div className="space-y-1">
                          <select
                            className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 text-sm text-zinc-200"
                            value={draftColumn.type ?? column.type}
                            onChange={(e) =>
                              setDraftColumn({
                                ...draftColumn,
                                type: e.target.value as LocalDbColumn["type"],
                              })
                            }
                          >
                            {Array.from(groupedTypes.entries()).map(([category, types]) => (
                              <optgroup
                                key={category}
                                label={COLUMN_CATEGORY_LABELS[category as ColumnCategory]}
                              >
                                {types.map((t) => (
                                  <option key={t.name} value={t.name}>
                                    {t.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          {meta?.hasLength ? (
                            <Input
                              className="h-9"
                              type="number"
                              placeholder="długość"
                              value={draftColumn.length ?? ""}
                              onChange={(e) =>
                                setDraftColumn({
                                  ...draftColumn,
                                  length: Number(e.target.value) || undefined,
                                })
                              }
                            />
                          ) : null}
                          {meta?.hasPrecision ? (
                            <div className="flex gap-1">
                              <Input
                                className="h-9"
                                type="number"
                                placeholder="precision"
                                value={draftColumn.precision ?? ""}
                                onChange={(e) =>
                                  setDraftColumn({
                                    ...draftColumn,
                                    precision: Number(e.target.value) || undefined,
                                  })
                                }
                              />
                              <Input
                                className="h-9"
                                type="number"
                                placeholder="scale"
                                value={draftColumn.scale ?? ""}
                                onChange={(e) =>
                                  setDraftColumn({
                                    ...draftColumn,
                                    scale: Number(e.target.value) || undefined,
                                  })
                                }
                              />
                            </div>
                          ) : null}
                          {meta?.hasEnumValues ? (
                            <Input
                              className="h-9"
                              placeholder="wartości oddzielone przecinkiem"
                              value={(draftColumn.enumValues ?? []).join(",")}
                              onChange={(e) =>
                                setDraftColumn({
                                  ...draftColumn,
                                  enumValues: e.target.value
                                    .split(",")
                                    .map((v) => v.trim())
                                    .filter(Boolean),
                                })
                              }
                            />
                          ) : null}
                        </div>
                      ) : (
                        <span className="font-mono text-xs">
                          {column.type}
                          {column.length ? `(${column.length})` : ""}
                          {column.precision !== undefined
                            ? `(${column.precision}${column.scale !== undefined ? `,${column.scale}` : ""})`
                            : ""}
                          {column.enumValues && column.enumValues.length > 0
                            ? `(${column.enumValues.join(",")})`
                            : ""}
                          {column.unsigned ? " UNSIGNED" : ""}
                        </span>
                      )}
                    </td>
                    <td className="border border-zinc-700 px-3 py-2 text-xs">
                      {isEditing ? (
                        <div className="space-y-1">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={draftColumn.nullable ?? true}
                              onChange={(e) =>
                                setDraftColumn({
                                  ...draftColumn,
                                  nullable: e.target.checked,
                                })
                              }
                            />
                            NULL
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(draftColumn.primaryKey)}
                              onChange={(e) =>
                                setDraftColumn({
                                  ...draftColumn,
                                  primaryKey: e.target.checked,
                                })
                              }
                            />
                            PRIMARY KEY
                          </label>
                          {meta?.canAutoIncrement ? (
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={Boolean(draftColumn.autoIncrement)}
                                onChange={(e) =>
                                  setDraftColumn({
                                    ...draftColumn,
                                    autoIncrement: e.target.checked,
                                  })
                                }
                              />
                              AUTO_INCREMENT
                            </label>
                          ) : null}
                          {meta?.canBeUnsigned ? (
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={Boolean(draftColumn.unsigned)}
                                onChange={(e) =>
                                  setDraftColumn({
                                    ...draftColumn,
                                    unsigned: e.target.checked,
                                  })
                                }
                              />
                              UNSIGNED
                            </label>
                          ) : null}
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(draftColumn.indexed)}
                              onChange={(e) =>
                                setDraftColumn({
                                  ...draftColumn,
                                  indexed: e.target.checked,
                                })
                              }
                            />
                            INDEX
                          </label>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 text-zinc-400">
                          <span>{column.nullable ? "NULL" : "NOT NULL"}</span>
                          {column.primaryKey ? <span>PRIMARY</span> : null}
                          {column.autoIncrement ? <span>AUTO_INCREMENT</span> : null}
                          {column.indexed ? <span>INDEX</span> : null}
                          {column.unsigned ? <span>UNSIGNED</span> : null}
                        </div>
                      )}
                    </td>
                    <td className="border border-zinc-700 px-3 py-2 font-mono text-xs">
                      {isEditing ? (
                        <Input
                          className="h-9"
                          value={String(draftColumn.defaultValue ?? "")}
                          onChange={(e) =>
                            setDraftColumn({
                              ...draftColumn,
                              defaultValue:
                                e.target.value === "" ? null : e.target.value,
                            })
                          }
                        />
                      ) : column.defaultValue !== undefined && column.defaultValue !== null ? (
                        String(column.defaultValue)
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="border border-zinc-700 px-3 py-2">
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              className="h-8 px-2"
                              variant="success"
                              onClick={handleSaveEdit}
                            >
                              Zapisz
                            </Button>
                            <Button
                              className="h-8 px-2"
                              variant="secondary"
                              onClick={() => {
                                setEditingColumn(null);
                                setDraftColumn({});
                              }}
                            >
                              Anuluj
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              className="h-8 px-2"
                              variant="edit"
                              onClick={() => startEdit(column)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              className="h-8 px-2"
                              variant="danger"
                              onClick={() => handleDropColumn(column)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardBlock>

      <CardBlock title="Dodaj kolumnę">
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <Input
            placeholder="nazwa kolumny"
            value={newColumn.name ?? ""}
            onChange={(e) =>
              setNewColumn({ ...newColumn, name: e.target.value })
            }
          />
          <select
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
            value={newColumn.type ?? "VARCHAR"}
            onChange={(e) =>
              setNewColumn({
                ...newColumn,
                type: e.target.value as LocalDbColumn["type"],
              })
            }
          >
            {Array.from(groupedTypes.entries()).map(([category, types]) => (
              <optgroup
                key={category}
                label={COLUMN_CATEGORY_LABELS[category as ColumnCategory]}
              >
                {types.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <Button
            variant="success"
            disabled={!newColumn.name}
            onClick={handleAddColumn}
          >
            <Plus className="mr-1 h-4 w-4" /> Dodaj
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newColumn.nullable ?? true}
              onChange={(e) =>
                setNewColumn({ ...newColumn, nullable: e.target.checked })
              }
            />
            NULL
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(newColumn.primaryKey)}
              onChange={(e) =>
                setNewColumn({ ...newColumn, primaryKey: e.target.checked })
              }
            />
            PRIMARY KEY
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(newColumn.autoIncrement)}
              onChange={(e) =>
                setNewColumn({ ...newColumn, autoIncrement: e.target.checked })
              }
            />
            AUTO_INCREMENT
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(newColumn.indexed)}
              onChange={(e) =>
                setNewColumn({ ...newColumn, indexed: e.target.checked })
              }
            />
            INDEX
          </label>
        </div>
      </CardBlock>

      <CardBlock title="Indeksy">
        {table.indexes.length === 0 ? (
          <div className="text-sm text-zinc-500">Brak indeksów.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead className="bg-zinc-700 text-xs uppercase tracking-wide text-zinc-200">
                <tr>
                  <th className="border border-zinc-700 px-3 py-2 text-left">Nazwa</th>
                  <th className="border border-zinc-700 px-3 py-2 text-left">Kolumny</th>
                  <th className="border border-zinc-700 px-3 py-2 text-left">Typ</th>
                  <th className="border border-zinc-700 px-3 py-2 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {table.indexes.map((index) => (
                  <tr key={index.name} className="align-top">
                    <td className="border border-zinc-700 px-3 py-2 font-mono">{index.name}</td>
                    <td className="border border-zinc-700 px-3 py-2 font-mono text-xs">
                      {index.columns.join(", ")}
                    </td>
                    <td className="border border-zinc-700 px-3 py-2 text-xs text-zinc-400">
                      {index.unique ? "UNIQUE" : "INDEX"}
                    </td>
                    <td className="border border-zinc-700 px-3 py-2">
                      <div className="flex justify-end">
                        <Button
                          className="h-8 px-2"
                          variant="danger"
                          disabled={index.name === "PRIMARY"}
                          onClick={() => handleDropIndex(index.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_2fr_auto_auto]">
          <Input
            placeholder="nazwa indeksu"
            value={newIndexName}
            onChange={(e) => setNewIndexName(e.target.value)}
          />
          <select
            multiple
            className="h-20 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-200"
            value={newIndexColumns}
            onChange={(e) =>
              setNewIndexColumns(
                Array.from(e.target.selectedOptions).map((o) => o.value),
              )
            }
          >
            {table.columns.map((column) => (
              <option key={column.name} value={column.name}>
                {column.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={newIndexUnique}
              onChange={(e) => setNewIndexUnique(e.target.checked)}
            />
            UNIQUE
          </label>
          <Button
            variant="success"
            disabled={!newIndexName || newIndexColumns.length === 0}
            onClick={handleAddIndex}
          >
            <Plus className="mr-1 h-4 w-4" /> Dodaj
          </Button>
        </div>
      </CardBlock>

      {onCheckSave && onCheckDrop ? (
        <CheckConstraintsCard
          checks={table.checks ?? []}
          onSave={onCheckSave}
          onDrop={onCheckDrop}
        />
      ) : null}

      <div className="text-xs text-zinc-500">
        Baza: {databaseName} · Tabela: {table.name}
      </div>
    </div>
  );
}

function CheckConstraintsCard({
  checks,
  onSave,
  onDrop,
}: {
  checks: { name: string; expression: string; createdAt: string }[];
  onSave: (
    check: { name: string; expression: string },
    oldName?: string,
  ) => Promise<void> | void;
  onDrop: (name: string) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [expression, setExpression] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);

  function loadCheck(check: { name: string; expression: string }) {
    setName(check.name);
    setExpression(check.expression);
    setEditingName(check.name);
  }

  function reset() {
    setName("");
    setExpression("");
    setEditingName(null);
  }

  return (
    <CardBlock title={`CHECK constraints (${checks.length})`}>
      <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
        <Input
          placeholder="nazwa CHECK"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          placeholder="expression np. age >= 0"
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          className="font-mono"
        />
        <div className="flex gap-2">
          <Button
            variant="success"
            disabled={!name.trim() || !expression.trim()}
            onClick={async () => {
              await onSave(
                { name: name.trim(), expression: expression.trim() },
                editingName ?? undefined,
              );
              reset();
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> {editingName ? "Zapisz" : "Dodaj"}
          </Button>
          {editingName ? (
            <Button variant="secondary" onClick={reset}>
              Anuluj
            </Button>
          ) : null}
        </div>
      </div>
      {checks.length === 0 ? (
        <div className="mt-3 text-sm text-zinc-500">
          Brak constraintów. Dodaj wyrażenie CHECK np. <span className="font-mono">price &gt; 0</span>.
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-md border border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-800 text-xs uppercase tracking-wide text-zinc-400">
              <tr>
                <th className="px-3 py-2 text-left">Nazwa</th>
                <th className="px-3 py-2 text-left">Expression</th>
                <th className="px-3 py-2 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">{checks.map((check) => (
                <tr key={check.name}>
                  <td className="px-3 py-2 font-mono">{check.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-300">
                    {check.expression}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        variant="secondary"
                        onClick={() => loadCheck(check)}
                        title="Edytuj"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => onDrop(check.name)}
                        title="Usuń"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardBlock>
  );
}

type SqlEditorTab = {
  id: string;
  title: string;
  sql: string;
};

type SqlPanelProps = {
  sql: string;
  setSql: (value: string) => void;
  sqlResults: SqlResult[];
  isLoading: boolean;
  tables: LocalDbTable[];
  savedQueries: SavedQuery[];
  databaseName: string;
  onRun: () => void;
  onSaveQuery: (name: string, sql: string) => void;
  onDeleteQuery: (id: string) => void;
  onEditTable?: (tableName: string) => void;
};

const SQL_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP BY",
  "ORDER BY",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "INSERT INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE FROM",
  "JOIN",
  "INNER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "FULL JOIN",
  "ON",
  "AND",
  "OR",
  "NOT",
  "NULL",
  "IS",
  "IN",
  "LIKE",
  "AS",
  "DISTINCT",
  "CREATE TABLE",
  "ALTER TABLE",
  "DROP TABLE",
  "CREATE INDEX",
  "CREATE VIEW",
  "REFRESH MATERIALIZED VIEW",
  "EXPLAIN",
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
];

const SQL_FUNCTIONS = [
  "COUNT()",
  "SUM()",
  "AVG()",
  "MIN()",
  "MAX()",
  "COALESCE(, )",
  "NULLIF(, )",
  "CAST( AS )",
  "LOWER()",
  "UPPER()",
  "LENGTH()",
  "TRIM()",
  "SUBSTRING(, , )",
  "REPLACE(, , )",
  "NOW()",
  "CURRENT_DATE",
  "CURRENT_TIMESTAMP",
];

function SqlPanel(props: SqlPanelProps) {
  const {
    sql,
    setSql,
    sqlResults,
    isLoading,
    tables,
    savedQueries,
    databaseName,
    onRun,
    onSaveQuery,
    onDeleteQuery,
    onEditTable,
  } = props;
  const [tabs, setTabs] = useState<SqlEditorTab[]>(() => {
    if (typeof window === "undefined") return [{ id: "default", title: "Zapytanie 1", sql: "" }];
    try {
      const stored = window.localStorage.getItem("localdb-panel-sql-tabs");
      if (stored) {
        const parsed = JSON.parse(stored) as SqlEditorTab[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [{ id: "default", title: "Zapytanie 1", sql: "" }];
  });
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    if (typeof window === "undefined") return "default";
    return window.localStorage.getItem("localdb-panel-sql-active") ?? "default";
  });
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem("localdb-panel-sql-history") ?? "[]");
    } catch {
      return [];
    }
  });
  const [saveName, setSaveName] = useState("");
  const [explainPlan, setExplainPlan] = useState<ExplainPlanNode | null>(null);
  const [autocomplete, setAutocomplete] = useState<{
    items: string[];
    index: number;
    prefix: string;
    visible: boolean;
  }>({ items: [], index: 0, prefix: "", visible: false });
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const tableNames = useMemo(() => tables.map((table) => table.name), [tables]);
  const columnIndex = useMemo(() => {
    const all = new Set<string>();
    for (const table of tables) for (const column of table.columns) all.add(column.name);
    return Array.from(all);
  }, [tables]);  useEffect(() => {
    setTabs((current) => {
      const target = current.findIndex((tab) => tab.id === activeTabId);
      if (target === -1) return current;
      if (current[target].sql === sql) return current;
      const next = current.slice();
      next[target] = { ...next[target], sql };
      return next;
    });
  }, [sql, activeTabId]);  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("localdb-panel-sql-tabs", JSON.stringify(tabs));
    window.localStorage.setItem("localdb-panel-sql-active", activeTabId);
  }, [tabs, activeTabId]);

  function activateTab(id: string) {
    setActiveTabId(id);
    const target = tabs.find((tab) => tab.id === id);
    if (target) setSql(target.sql);
  }

  function newTab() {
    const id = `tab-${Date.now()}`;
    setTabs((current) => [
      ...current,
      { id, title: `Zapytanie ${current.length + 1}`, sql: "" },
    ]);
    setActiveTabId(id);
    setSql("");
  }

  function closeTab(id: string) {
    setTabs((current) => {
      if (current.length === 1) return current;
      const filtered = current.filter((tab) => tab.id !== id);
      if (id === activeTabId) {
        const next = filtered[0];
        setActiveTabId(next.id);
        setSql(next.sql);
      }
      return filtered;
    });
  }

  function renameTab(id: string, title: string) {
    setTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, title: title || tab.title } : tab)),
    );
  }

  function pushHistory(value: string) {
    if (!value.trim()) return;
    setHistory((current) => {
      const filtered = current.filter((entry) => entry !== value);
      const next = [value, ...filtered].slice(0, 30);
      window.localStorage.setItem(
        "localdb-panel-sql-history",
        JSON.stringify(next),
      );
      return next;
    });
  }

  function handleRun() {
    pushHistory(sql);
    onRun();
  }

  async function handleExplain() {
    if (!databaseName || !sql.trim()) return;
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseName, sql }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setExplainPlan(data.plan);
    } catch (error) {
      setExplainPlan({
        op: "Error",
        detail: error instanceof Error ? error.message : "Błąd EXPLAIN.",
        children: [],
      });
    }
  }

  function getCurrentWord(): { word: string; start: number; end: number } {
    const textarea = textareaRef.current;
    if (!textarea) return { word: "", start: 0, end: 0 };
    const caret = textarea.selectionStart;
    let start = caret;
    while (start > 0 && /[\w.]/.test(sql[start - 1])) start -= 1;
    return { word: sql.slice(start, caret), start, end: caret };
  }

  function updateAutocomplete() {
    const { word } = getCurrentWord();
    if (!word || word.length < 1) {
      setAutocomplete({ items: [], index: 0, prefix: "", visible: false });
      return;
    }
    const lower = word.toLowerCase();
    const candidates = [
      ...tableNames,
      ...columnIndex,
      ...SQL_KEYWORDS,
      ...SQL_FUNCTIONS,
    ];
    const filtered = Array.from(new Set(candidates))
      .filter((entry) => entry.toLowerCase().startsWith(lower))
      .slice(0, 8);
    setAutocomplete({
      items: filtered,
      index: 0,
      prefix: word,
      visible: filtered.length > 0,
    });
  }

  function applyCompletion(value: string) {
    const { start, end } = getCurrentWord();
    const next = sql.slice(0, start) + value + sql.slice(end);
    setSql(next);
    setAutocomplete((current) => ({ ...current, visible: false }));
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const caret = start + value.length;
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (autocomplete.visible) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setAutocomplete((current) => ({
          ...current,
          index: (current.index + 1) % Math.max(current.items.length, 1),
        }));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setAutocomplete((current) => ({
          ...current,
          index:
            (current.index - 1 + Math.max(current.items.length, 1)) %
            Math.max(current.items.length, 1),
        }));
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        if (autocomplete.items[autocomplete.index]) {
          event.preventDefault();
          applyCompletion(autocomplete.items[autocomplete.index]);
          return;
        }
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setAutocomplete((current) => ({ ...current, visible: false }));
        return;
      }
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      handleRun();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === " ") {
      event.preventDefault();
      updateAutocomplete();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "e") {
      event.preventDefault();
      handleExplain();
    }
  }

  function insertSnippet(snippet: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setSql(sql + (sql.endsWith("\n") || sql === "" ? "" : "\n") + snippet);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = sql.slice(0, start) + snippet + sql.slice(end);
    setSql(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  }

  function clearHistory() {
    setHistory([]);
    window.localStorage.removeItem("localdb-panel-sql-history");
  }

  function handleSave() {
    if (!saveName.trim()) return;
    onSaveQuery(saveName.trim(), sql);
    setSaveName("");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Panel
        title="Query Tool"
        description="Multi-tab editor SQL z autouzupełnianiem (Ctrl+Spacja), EXPLAIN (Ctrl+E), Ctrl+Enter wykonuje."
      >
        <div className="mb-2 flex flex-wrap items-center gap-1 border-b border-zinc-700 pb-2">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center gap-1 rounded-t-md border-b-2 px-3 py-1 text-xs ${activeTabId === tab.id ? "border-[var(--accent)] bg-zinc-800 text-zinc-100" : "border-transparent text-zinc-400 hover:bg-zinc-800/50"}`}
            >
              <button
                type="button"
                className="font-medium"
                onClick={() => activateTab(tab.id)}
                onDoubleClick={() => {
                  const next = window.prompt("Nazwa zakładki", tab.title);
                  if (next) renameTab(tab.id, next);
                }}
              >
                {tab.title}
              </button>{tabs.length > 1 ? (
                <button
                  type="button"
                  onClick={() => closeTab(tab.id)}
                  className="rounded-full px-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-100"
                  title="Zamknij"
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
            onClick={newTab}
            title="Nowa zakładka"
          >
            <Plus className="inline h-3 w-3" /> Nowa
          </button>
        </div>
        <div className="mb-2 flex flex-wrap gap-2 text-xs">
          {tables.length > 0 ? (
            <select
              className="h-8 rounded border border-zinc-700 bg-zinc-900 px-2 text-zinc-200"
              defaultValue=""
              onChange={(event) => {
                if (!event.target.value) return;
                insertSnippet(event.target.value);
                event.target.value = "";
              }}
            >
              <option value="">Wstaw nazwę tabeli…</option>{tables.map((table) => (
                <option key={table.name} value={table.name}>
                  {table.name}
                </option>
              ))}
            </select>
          ) : null}
          <Button
            variant="secondary"
            className="h-8 px-3"
            onClick={() => insertSnippet("SELECT * FROM ")}
          >
            SELECT
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-3"
            onClick={() => insertSnippet("INSERT INTO ")}
          >
            INSERT
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-3"
            onClick={() => insertSnippet("UPDATE  SET  WHERE ")}
          >
            UPDATE
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-3"
            onClick={() => insertSnippet("DELETE FROM  WHERE ")}
          >
            DELETE
          </Button>
        </div>
        <div className="relative">
          <Textarea
            ref={textareaRef}
            className="min-h-96 font-mono"
            value={sql}
            onChange={(event) => {
              setSql(event.target.value);
              setAutocomplete((current) => ({ ...current, visible: false }));
            }}
            onKeyDown={handleKeyDown}
            onKeyUp={(event) => {
              if (
                /^[a-zA-Z0-9_.]$/.test(event.key) ||
                event.key === "Backspace"
              )
                updateAutocomplete();
            }}
          />
          {autocomplete.visible ? (
            <div className="absolute right-3 top-3 z-10 w-56 rounded-md border border-zinc-700 bg-zinc-950 shadow-lg">
              <div className="border-b border-zinc-800 px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-500">
                Sugestie
              </div>
              <ul className="max-h-48 overflow-auto py-1 text-xs">
                {autocomplete.items.map((item, index) => (
                  <li
                    key={item}
                    className={`cursor-pointer px-3 py-1 font-mono ${index === autocomplete.index ? "bg-[color:rgba(var(--accent-rgb),0.18)] text-zinc-100" : "text-zinc-300 hover:bg-zinc-800"}`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applyCompletion(item);
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button disabled={isLoading} onClick={handleRun}>
            <Code2 className="mr-2 h-4 w-4" /> Wykonaj (Ctrl+Enter)
          </Button>
          <Button
            variant="secondary"
            disabled={isLoading || !databaseName}
            onClick={handleExplain}
          >
            <Sparkles className="mr-2 h-4 w-4" /> EXPLAIN (Ctrl+E)
          </Button>
          <Button variant="secondary" onClick={() => setSql("")}>
            Wyczyść
          </Button>
          <Input
            className="h-9 max-w-xs"
            placeholder="nazwa do zapisania"
            value={saveName}
            onChange={(event) => setSaveName(event.target.value)}
          />
          <Button
            variant="success"
            disabled={!saveName.trim() || !sql.trim() || !databaseName}
            onClick={handleSave}
          >
            Zapisz zapytanie
          </Button>
        </div>
        {explainPlan ? (
          <div className="mt-4 rounded-md border border-zinc-700 bg-zinc-950 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Plan zapytania
              </span>
              <button
                type="button"
                className="text-xs text-zinc-500 hover:text-zinc-200"
                onClick={() => setExplainPlan(null)}
              >
                Zamknij
              </button>
            </div>
            <ExplainPlanNodeView node={explainPlan} depth={0} />
          </div>
        ) : null}
      </Panel>
      <div className="space-y-3">
        <Panel title="Wyniki" description={`${sqlResults.length} rezultatów`}>
          <SqlResults
            results={sqlResults}
            tables={tables}
            onEditTable={onEditTable}
          />
        </Panel>
        <CardBlock title={`Zapisane zapytania (${savedQueries.length})`}>
          {savedQueries.length === 0 ? (
            <div className="text-sm text-zinc-500">Brak zapisanych zapytań.</div>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-auto pr-1">{savedQueries.map((query) => (
                <li
                  key={query.id}
                  className="rounded border border-zinc-700 bg-zinc-900 p-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-200">
                      {query.name}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        className="h-7 px-2"
                        onClick={() => setSql(query.sql)}
                      >
                        Wczytaj
                      </Button>
                      <Button
                        variant="danger"
                        className="h-7 px-2"
                        onClick={() => onDeleteQuery(query.id)}
                      >
                        Usuń
                      </Button>
                    </div>
                  </div>
                  <pre className="mt-1 max-h-20 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-zinc-400">
                    {query.sql}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </CardBlock>
        <CardBlock
          title={`Historia (${history.length})`}
          right={
            history.length > 0 ? (
              <Button
                variant="secondary"
                className="h-7 px-2 text-xs"
                onClick={clearHistory}
              >
                Wyczyść
              </Button>
            ) : null
          }
        >
          {history.length === 0 ? (
            <div className="text-sm text-zinc-500">Brak historii.</div>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-auto pr-1">{history.map((entry, index) => (
                <li
                  key={index}
                  className="cursor-pointer rounded border border-zinc-700 bg-zinc-900 p-2 font-mono text-[11px] text-zinc-400 hover:border-zinc-500"
                  onClick={() => setSql(entry)}
                  title="Kliknij aby wczytać"
                >
                  {entry.length > 200 ? `${entry.slice(0, 200)}…` : entry}
                </li>
              ))}
            </ul>
          )}
        </CardBlock>
      </div>
    </div>
  );
}

type ExplainPlanNode = {
  op: string;
  detail?: string;
  estimatedRows?: number;
  estimatedCost?: number;
  children: ExplainPlanNode[];
};

function ExplainPlanNodeView({
  node,
  depth,
}: {
  node: ExplainPlanNode;
  depth: number;
}) {
  return (
    <div style={{ marginLeft: depth === 0 ? 0 : depth * 14 }}>
      <div className="flex flex-wrap items-baseline gap-2 border-l-2 border-zinc-700 pl-2 text-xs">
        <span className="font-mono text-sm font-semibold text-[var(--accent)]">
          {depth === 0 ? "→" : "↳"} {node.op}
        </span>
        {node.detail ? (
          <span className="text-zinc-400">{node.detail}</span>
        ) : null}
        {node.estimatedRows !== undefined ? (
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
            ~{node.estimatedRows.toLocaleString("pl-PL")} wierszy
          </span>
        ) : null}
        {node.estimatedCost !== undefined ? (
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
            cost {node.estimatedCost}
          </span>
        ) : null}
      </div>
      {node.children.map((child, index) => (
        <ExplainPlanNodeView key={index} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}


function ExportPanel({
  databases,
  exportDb,
  onSelectDatabase,
  selectedTable,
  onExport,
}: {
  databases: LocalDatabase[];
  exportDb: string;
  onSelectDatabase: (name: string) => void;
  selectedTable: string;
  onExport: (
    scope: "database" | "table",
    options: { format: "sql" | "json" | "zip" | "csv"; exportType: "schema" | "data" | "all" },
  ) => void;
}) {
  const [format, setFormat] = useState<"sql" | "json" | "zip" | "csv">("sql");
  const [exportType, setExportType] = useState<"schema" | "data" | "all">("all");

  return (
    <Panel
      title="Eksport"
      description="Wybierz bazę, format i zakres eksportu."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <CardBlock title="Konfiguracja">
          <div className="space-y-3">
            <div>
              <Label>Baza danych</Label>
              <select
                className="mt-1 h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                value={exportDb}
                onChange={(event) => onSelectDatabase(event.target.value)}
              >
                <option value="">— wybierz —</option>
                {databases.map((database) => (
                  <option key={database.name} value={database.name}>
                    {database.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Format</Label>
              <div className="mt-1 grid grid-cols-4 gap-2">
                {(["sql", "json", "zip", "csv"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`rounded-md border px-3 py-2 text-sm uppercase transition-colors ${format === option ? "border-zinc-300 bg-zinc-700 text-zinc-100" : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500"}`}
                    onClick={() => setFormat(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {format === "sql"
                  ? "Plik .sql do importu w innym silniku."
                  : format === "json"
                    ? "Pełny stan bazy w JSON."
                    : format === "csv"
                      ? "CSV jednej tabeli — wybierz konkretną tabelę."
                      : "Archiwum .zip zawierające .sql i .json."}
              </div>
            </div>
            {format !== "json" ? (
              <div>
                <Label>Zakres</Label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "all", label: "Schemat + dane" },
                      { value: "schema", label: "Tylko schemat" },
                      { value: "data", label: "Tylko dane" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`rounded-md border px-3 py-2 text-xs transition-colors ${exportType === option.value ? "border-zinc-300 bg-zinc-700 text-zinc-100" : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500"}`}
                      onClick={() => setExportType(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </CardBlock>

        <CardBlock title="Akcje">
          <div className="space-y-2">
            <Button
              className="w-full justify-center"
              disabled={!exportDb}
              onClick={() => onExport("database", { format, exportType })}
            >
              <Download className="mr-2 h-4 w-4" />
              Eksport bazy ({format.toUpperCase()})
            </Button>
            <Button
              className="w-full justify-center"
              variant="secondary"
              disabled={!selectedTable || !exportDb}
              onClick={() => onExport("table", { format, exportType })}
            >
              <Download className="mr-2 h-4 w-4" />
              Eksport aktywnej tabeli{selectedTable ? ` (${selectedTable})` : ""}
            </Button>
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            {!exportDb
              ? "Wybierz bazę, żeby aktywować eksport."
              : !selectedTable
                ? "Wybierz tabelę, jeśli chcesz eksportować pojedynczą tabelę."
                : "Gotowe do eksportu."}
          </div>
        </CardBlock>
      </div>
    </Panel>
  );
}

function ImportPanel({
  importSqlText,
  setImportSqlText,
  selectedDatabase,
  selectedTable,
  currentTable,
  sqlResults,
  onLoadFile,
  onImportSql,
  onImportCsv,
}: {
  importSqlText: string;
  setImportSqlText: (value: string) => void;
  selectedDatabase: string;
  selectedTable: string;
  currentTable: LocalDbTable | undefined;
  sqlResults: SqlResult[];
  onLoadFile: (file: File) => void;
  onImportSql: () => void;
  onImportCsv: (file: File) => void;
}) {
  const [dragActive, setDragActive] = useState(false);

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onLoadFile(file);
  }

  return (
    <Panel
      title="Import"
      description="Wczytaj plik .sql / .json / .csv lub wklej SQL ręcznie."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <CardBlock title="Plik">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex h-40 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition-colors ${dragActive ? "border-zinc-300 bg-zinc-800" : "border-zinc-700 bg-zinc-900"}`}
          >
            <Upload className="h-8 w-8 text-zinc-500" />
            <div className="text-sm text-zinc-300">
              Przeciągnij plik tutaj lub
            </div>
            <Input
              type="file"
              accept=".sql,.json,.csv"
              className="max-w-xs"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onLoadFile(file);
              }}
            />
            <div className="text-xs text-zinc-500">
              Obsługiwane: .sql, .json, .csv
            </div>
          </div>
          <div className="mt-3">
            <Label>Import CSV do aktywnej tabeli</Label>
            <div className="mt-1 text-xs text-zinc-500">
              Pierwszy wiersz musi zawierać nazwy kolumn istniejące w tabeli.
            </div>
            <Input
              type="file"
              accept=".csv"
              className="mt-2"
              disabled={!selectedTable || !currentTable}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImportCsv(file);
                event.target.value = "";
              }}
            />
            {!selectedTable ? (
              <div className="mt-1 text-xs text-zinc-500">
                Wybierz tabelę aby aktywować import CSV.
              </div>
            ) : null}
          </div>
        </CardBlock>

        <CardBlock title="SQL ręcznie">
          <Textarea
            className="min-h-64 font-mono"
            value={importSqlText}
            onChange={(event) => setImportSqlText(event.target.value)}
            placeholder="CREATE TABLE ...; INSERT INTO ...;"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={!selectedDatabase || !importSqlText.trim()}
              onClick={onImportSql}
            >
              <Upload className="mr-2 h-4 w-4" /> Importuj SQL
            </Button>
            <Button variant="secondary" onClick={() => setImportSqlText("")}>
              Wyczyść
            </Button>
          </div>
        </CardBlock>
      </div>
      <SqlResults results={sqlResults} />
    </Panel>
  );
}

function QueryBuilderPanel({
  tables,
  defaultTable,
  isLoading,
  sqlResults,
  onRun,
  onCopySql,
}: {
  tables: LocalDbTable[];
  defaultTable: string;
  isLoading: boolean;
  sqlResults: SqlResult[];
  onRun: (sql: string) => void;
  onCopySql: (sql: string) => void;
}) {
  const [tableName, setTableName] = useState(defaultTable);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [conditions, setConditions] = useState<
    {
      column: string;
      operator: string;
      value: string;
      connector: "AND" | "OR";
    }[]
  >([]);
  const [orderBy, setOrderBy] = useState("");
  const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("ASC");
  const [groupBy, setGroupBy] = useState("");
  const [limit, setLimit] = useState("100");
  const [offset, setOffset] = useState("");
  const [distinct, setDistinct] = useState(false);  useEffect(() => {
    setTableName(defaultTable);
  }, [defaultTable]);

  const currentTable = tables.find((t) => t.name === tableName);
  const columns = currentTable?.columns.map((c) => c.name) ?? [];

  function toggleColumn(column: string) {
    setSelectedColumns((current) =>
      current.includes(column)
        ? current.filter((c) => c !== column)
        : [...current, column],
    );
  }

  function addCondition() {
    setConditions((current) => [
      ...current,
      {
        column: columns[0] ?? "",
        operator: "=",
        value: "",
        connector: "AND",
      },
    ]);
  }

  function updateCondition(
    index: number,
    patch: Partial<{
      column: string;
      operator: string;
      value: string;
      connector: "AND" | "OR";
    }>,
  ) {
    setConditions((current) =>
      current.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  }

  function removeCondition(index: number) {
    setConditions((current) => current.filter((_, i) => i !== index));
  }

  const sql = useMemo(() => {
    if (!tableName) return "";
    const cols =
      selectedColumns.length === 0 || selectedColumns.length === columns.length
        ? "*"
        : selectedColumns.join(", ");
    const distinctPart = distinct ? "DISTINCT " : "";
    let where = "";
    if (conditions.length > 0) {
      const parts = conditions
        .filter((c) => c.column)
        .map((c, index) => {
          const operator = c.operator;
          let valuePart = "";
          if (operator === "IS NULL" || operator === "IS NOT NULL") {
            valuePart = "";
          } else if (operator === "IN" || operator === "NOT IN") {
            const items = c.value
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
              .map((v) =>
                /^-?\d+(\.\d+)?$/.test(v) ? v : `'${v.replaceAll("'", "''")}'`,
              );
            valuePart = `(${items.join(", ")})`;
          } else if (operator === "BETWEEN") {
            const [a, b] = c.value.split(",").map((v) => v.trim());
            valuePart = `${formatLiteral(a)} AND ${formatLiteral(b ?? "")}`;
          } else if (operator === "LIKE" || operator === "NOT LIKE") {
            valuePart = `'${c.value.replaceAll("'", "''")}'`;
          } else {
            valuePart = formatLiteral(c.value);
          }
          const expression = `${c.column} ${operator}${valuePart ? " " + valuePart : ""}`;
          return index === 0 ? expression : `${c.connector} ${expression}`;
        });
      if (parts.length > 0) where = ` WHERE ${parts.join(" ")}`;
    }
    const groupPart = groupBy.trim() ? ` GROUP BY ${groupBy.trim()}` : "";
    const orderPart = orderBy.trim()
      ? ` ORDER BY ${orderBy.trim()} ${orderDir}`
      : "";
    const limitPart = limit.trim() ? ` LIMIT ${limit.trim()}` : "";
    const offsetPart = offset.trim() ? ` OFFSET ${offset.trim()}` : "";
    return `SELECT ${distinctPart}${cols} FROM ${tableName}${where}${groupPart}${orderPart}${limitPart}${offsetPart};`;
  }, [
    tableName,
    selectedColumns,
    columns,
    distinct,
    conditions,
    orderBy,
    orderDir,
    groupBy,
    limit,
    offset,
  ]);

  return (
    <Panel title="Zapytanie" description="Wizualny kreator SELECT.">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <CardBlock title="Tabela i kolumny">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <select
                className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                value={tableName}
                onChange={(event) => {
                  setTableName(event.target.value);
                  setSelectedColumns([]);
                  setConditions([]);
                }}
              >
                <option value="">— wybierz tabelę —</option>
                {tables.map((table) => (
                  <option key={table.name} value={table.name}>
                    {table.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={distinct}
                  onChange={(event) => setDistinct(event.target.checked)}
                />
                DISTINCT
              </label>
              <Button
                variant="secondary"
                onClick={() => setSelectedColumns(columns)}
                disabled={!currentTable}
              >
                Wszystkie
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">{columns.length === 0 ? (
                <span className="text-sm text-zinc-500">
                  Wybierz tabelę aby zobaczyć kolumny.
                </span>
              ) : (
                columns.map((column) => {
                  const checked = selectedColumns.includes(column);
                  return (
                    <label
                      key={column}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1 text-xs transition-colors ${checked ? "border-zinc-500 bg-zinc-700 text-zinc-100" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleColumn(column)}
                      />
                      {column}
                    </label>
                  );
                })
              )}
            </div>
            <div className="mt-2 text-xs text-zinc-500">{selectedColumns.length === 0
                ? "Bez zaznaczeń = SELECT * (wszystkie kolumny)."
                : `${selectedColumns.length} z ${columns.length} kolumn.`}
            </div>
          </CardBlock>

          <CardBlock
            title="Warunki WHERE"
            right={
              <Button
                variant="secondary"
                className="h-7 px-2 text-xs"
                onClick={addCondition}
                disabled={!currentTable}
              >
                <Plus className="mr-1 h-3 w-3" /> Dodaj
              </Button>
            }
          >
            {conditions.length === 0 ? (
              <div className="text-sm text-zinc-500">Brak warunków.</div>
            ) : (
              <div className="space-y-2">
                {conditions.map((condition, index) => (
                  <div
                    key={index}
                    className="grid gap-2 sm:grid-cols-[80px_1fr_1fr_1.5fr_auto]"
                  >
                    {index === 0 ? (
                      <span className="self-center text-xs text-zinc-500">
                        WHERE
                      </span>
                    ) : (
                      <select
                        className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200"
                        value={condition.connector}
                        onChange={(event) =>
                          updateCondition(index, {
                            connector: event.target.value as "AND" | "OR",
                          })
                        }
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    )}
                    <select
                      className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200"
                      value={condition.column}
                      onChange={(event) =>
                        updateCondition(index, { column: event.target.value })
                      }
                    >
                      {columns.map((column) => (
                        <option key={column} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200"
                      value={condition.operator}
                      onChange={(event) =>
                        updateCondition(index, { operator: event.target.value })
                      }
                    >
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                      <option value="<">&lt;</option>
                      <option value=">">&gt;</option>
                      <option value="<=">&le;</option>
                      <option value=">=">&ge;</option>
                      <option value="LIKE">LIKE</option>
                      <option value="NOT LIKE">NOT LIKE</option>
                      <option value="IN">IN</option>
                      <option value="NOT IN">NOT IN</option>
                      <option value="BETWEEN">BETWEEN</option>
                      <option value="IS NULL">IS NULL</option>
                      <option value="IS NOT NULL">IS NOT NULL</option>
                    </select>
                    <Input
                      className="h-9"
                      placeholder={
                        condition.operator === "BETWEEN"
                          ? "od, do"
                          : condition.operator === "IN" || condition.operator === "NOT IN"
                            ? "wart1, wart2, ..."
                            : condition.operator === "LIKE" || condition.operator === "NOT LIKE"
                              ? "%fragment%"
                              : "wartość"
                      }
                      value={condition.value}
                      disabled={
                        condition.operator === "IS NULL" ||
                        condition.operator === "IS NOT NULL"
                      }
                      onChange={(event) =>
                        updateCondition(index, { value: event.target.value })
                      }
                    />
                    <Button
                      variant="danger"
                      className="h-9 px-3"
                      onClick={() => removeCondition(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBlock>

          <CardBlock title="Sortowanie i grupowanie">
            <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
              <Input
                placeholder="ORDER BY (np. created_at)"
                value={orderBy}
                onChange={(event) => setOrderBy(event.target.value)}
              />
              <select
                className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                value={orderDir}
                onChange={(event) =>
                  setOrderDir(event.target.value as "ASC" | "DESC")
                }
              >
                <option value="ASC">ASC</option>
                <option value="DESC">DESC</option>
              </select>
            </div>
            <div className="mt-2">
              <Input
                placeholder="GROUP BY (np. status)"
                value={groupBy}
                onChange={(event) => setGroupBy(event.target.value)}
              />
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="LIMIT"
                type="number"
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
              />
              <Input
                placeholder="OFFSET"
                type="number"
                value={offset}
                onChange={(event) => setOffset(event.target.value)}
              />
            </div>
          </CardBlock>
        </div>

        <div className="space-y-3">
          <CardBlock title="Podgląd SQL">
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded border border-zinc-700 bg-zinc-900 p-3 font-mono text-xs text-zinc-300">{sql || "—"}
            </pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                disabled={isLoading || !tableName}
                onClick={() => onRun(sql)}
              >
                <Code2 className="mr-2 h-4 w-4" /> Uruchom
              </Button>
              <Button
                variant="secondary"
                disabled={!sql}
                onClick={() => onCopySql(sql)}
              >
                Kopiuj do SQL
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedColumns([]);
                  setConditions([]);
                  setOrderBy("");
                  setGroupBy("");
                  setLimit("100");
                  setOffset("");
                  setDistinct(false);
                }}
              >
                Reset
              </Button>
            </div>
          </CardBlock>
          <Panel
            title="Wyniki"
            description={`${sqlResults.length} rezultatów`}
          >
            <SqlResults results={sqlResults} />
          </Panel>
        </div>
      </div>
    </Panel>
  );
}

function formatLiteral(value: string) {
  const trimmed = value.trim();
  if (trimmed === "" || /^null$/i.test(trimmed)) return "NULL";
  if (/^true$/i.test(trimmed)) return "TRUE";
  if (/^false$/i.test(trimmed)) return "FALSE";
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return trimmed;
  return `'${trimmed.replaceAll("'", "''")}'`;
}

function SqlResults({
  results,
  tables,
  onEditTable,
}: {
  results: SqlResult[];
  tables?: LocalDbTable[];
  onEditTable?: (tableName: string) => void;
}) {
  function detectTable(statement: string): string | null {
    const match = statement.match(/\bFROM\s+([`"\w.]+)/i);
    if (!match) return null;
    const cleaned = match[1].replace(/[`"]/g, "").split(".").at(-1);
    if (!cleaned) return null;
    if (tables && !tables.find((table) => table.name === cleaned)) return null;
    return cleaned;
  }

  return (
    <div className="mt-3 space-y-3">
      {results.map((result, index) => {
        const tableName = detectTable(result.statement);
        const editable =
          tableName &&
          tables &&
          onEditTable &&
          /^\s*SELECT/i.test(result.statement) &&
          tables.find((table) =>
            table.name === tableName
              ? table.columns.some((column) => column.primaryKey)
              : false,
          );
        return (
          <div key={index} className="rounded-md border border-zinc-700 p-3 ">
            <div className="flex items-start justify-between gap-4">
              <div className="font-mono text-xs text-zinc-500">
                {result.statement}
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs text-zinc-500">
                {editable ? (
                  <Button
                    variant="secondary"
                    className="h-7 px-2 text-xs"
                    onClick={() => onEditTable!(tableName!)}
                    title="Otwórz tabelę w Browse aby edytować inline"
                  >
                    <Edit3 className="mr-1 h-3 w-3" /> Edytuj w Browse
                  </Button>
                ) : null}
                {result.durationMs !== undefined ? (
                  <span>{result.durationMs} ms</span>
                ) : null}
              </div>
            </div>
            <div className="my-2 text-sm font-semibold">{result.message}</div>
            {result.columns.length > 0 ? (
              <DataTable
                columns={result.columns}
                rows={result.rows}
                sortable
                paginated
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function MetadataPanel({
  title,
  description,
  items,
  metaName,
  setMetaName,
  metaBody,
  setMetaBody,
  onSaveProcedure,
  onSaveFunction,
  onDelete,
  onToggle,
  onEdit,
  extra,
}: {
  title: string;
  description: string;
  items: { name: string; body: string; rawName?: string; enabled?: boolean }[];
  metaName: string;
  setMetaName: (value: string) => void;
  metaBody: string;
  setMetaBody: (value: string) => void;
  onSaveProcedure: () => void;
  onSaveFunction?: () => void;
  onDelete?: (rawName: string) => void;
  onToggle?: (rawName: string, enabled: boolean) => void;
  onEdit?: (rawName: string, body: string) => void;
  extra?: React.ReactNode;
}) {
  return (
    <Panel title={title} description={description}>
      <div className="grid gap-4 xl:grid-cols-2">
        <CardBlock title="Nowy / edycja obiektu">
          <Input
            value={metaName}
            onChange={(event) => setMetaName(event.target.value)}
            placeholder="nazwa_obiektu"
          />
          {extra}
          <Textarea
            className="min-h-52 font-mono"
            value={metaBody}
            onChange={(event) => setMetaBody(event.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={onSaveProcedure}>Zapisz</Button>
            {onSaveFunction ? (
              <Button variant="secondary" onClick={onSaveFunction}>
                Zapisz funkcję
              </Button>
            ) : null}
            <Button
              variant="secondary"
              onClick={() => {
                setMetaName("");
                setMetaBody("");
              }}
            >
              Wyczyść
            </Button>
          </div>
        </CardBlock>
        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-700 bg-zinc-900 p-6 text-center text-sm text-zinc-500">
              Brak obiektów.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.name}
                className="rounded-md border border-zinc-700 bg-zinc-900 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{item.name}</div>
                  <div className="flex shrink-0 gap-1">
                    {onToggle && item.rawName ? (
                      <Button
                        variant="secondary"
                        className="h-7 px-2 text-xs"
                        onClick={() =>
                          onToggle(item.rawName!, !(item.enabled ?? true))
                        }
                      >
                        {item.enabled === false ? "Włącz" : "Wyłącz"}
                      </Button>
                    ) : null}
                    {onEdit && item.rawName ? (
                      <Button
                        variant="edit"
                        className="h-7 px-2"
                        onClick={() => onEdit(item.rawName!, item.body)}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                    {onDelete && item.rawName ? (
                      <Button
                        variant="danger"
                        className="h-7 px-2"
                        onClick={() => onDelete(item.rawName!)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-zinc-500">
                  {item.body}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </Panel>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-900 p-12 text-center text-zinc-500  ">
      Wybierz bazę i tabelę z lewego panelu.
    </div>
  );
}
