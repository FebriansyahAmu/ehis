/**
 * Helper utility untuk Import Excel/CSV ICD-10 & ICD-9.
 *
 * Strategi (frontend-only):
 *   - CSV: parsing real via native FileReader + custom split (RFC 4180 minimal).
 *   - Excel (.xlsx/.xls): parsing real via SheetJS (`xlsx`, dynamic-import agar
 *     bundle ringan) — `XLSX.read(arrayBuffer) → sheet_to_json(header:1)`.
 *
 * Field mapping (target): kode · nama (DISPLAY) · version · [namaInggris · chapter · blok · inaCbg]
 * Format file referensi: unduhan SatuSehat Kemenkes (CODE · DISPLAY · VERSION).
 */

import type { IcdItem, IcdJenis } from "@/lib/master/icdMock";
import { defaultIcdVersion } from "@/lib/master/icdMock";

// ── File parsing types ───────────────────────────────────

export type FileMode = "csv" | "excel";

export interface ParsedFile {
  mode: FileMode;
  fileName: string;
  headers: string[];
  rows: string[][];           // raw data rows (excluding header)
  totalRows: number;
  truncated: boolean;         // dipertahankan utk kompat UI; selalu false (semua baris diproses)
}

// ── Column mapping ───────────────────────────────────────

/** Target field di IcdItem yang bisa di-map dari kolom Excel/CSV. */
export type IcdField = "kode" | "nama" | "version" | "namaInggris" | "chapter" | "blok" | "inaCbg";

export interface IcdFieldDef {
  key: IcdField;
  label: string;
  required: boolean;
  hint: string;
  /** Pattern auto-match dari header (lowercase contains). */
  matchPatterns: string[];
}

export const ICD_FIELDS: IcdFieldDef[] = [
  // 3 inti SatuSehat — wajib di-map.
  { key: "kode",        label: "Kode · CODE",   required: true,  hint: "Kode utama (A09, I21.0, dll)",      matchPatterns: ["code", "kode", "icd"] },
  { key: "nama",        label: "Display",       required: true,  hint: "Teks tampilan SatuSehat (DISPLAY)", matchPatterns: ["display", "nama", "deskripsi", "title", "name"] },
  { key: "version",     label: "Versi · VERSION", required: true, hint: "Versi CodeSystem (mis. 2010)",     matchPatterns: ["version", "versi"] },
  // Atribut tambahan — opsional.
  { key: "namaInggris", label: "Nama Alternatif", required: false, hint: "Terjemahan / nama lokal",         matchPatterns: ["english", "inggris", "alternatif", "alt"] },
  { key: "chapter",     label: "Chapter",       required: false, hint: "Chapter (mis. I, IX, dll)",         matchPatterns: ["chapter", "bab", "group"] },
  { key: "blok",        label: "Blok",          required: false, hint: "Sub-blok dalam chapter (I20–I25)",   matchPatterns: ["blok", "block", "sub"] },
  { key: "inaCbg",      label: "INA-CBG",       required: false, hint: "Mapping INA-CBG (untuk klaim BPJS)", matchPatterns: ["cbg", "ina-cbg", "ina_cbg", "inacbg"] },
];

/** Map column-index → IcdField (atau null untuk skip). */
export type ColumnMapping = Record<number, IcdField | null>;

/** Auto-detect mapping dari header headers. */
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const map: ColumnMapping = {};
  headers.forEach((h, idx) => {
    const lower = h.toLowerCase().trim();
    const match = ICD_FIELDS.find((f) =>
      f.matchPatterns.some((p) => lower.includes(p)),
    );
    map[idx] = match ? match.key : null;
  });
  return map;
}

// ── CSV parsing (native) ─────────────────────────────────

/** Parse CSV file content. Support comma/semicolon delimiter + simple quote handling. */
export function parseCsvContent(content: string): { headers: string[]; rows: string[][] } {
  const text = content.replace(/^﻿/, ""); // strip BOM
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(lines[0]);
  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else cur += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === delimiter) { cells.push(cur.trim()); cur = ""; }
        else cur += c;
      }
    }
    cells.push(cur.trim());
    return cells;
  };

  const [headerLine, ...dataLines] = lines;
  const headers = parseLine(headerLine);
  const rows = dataLines.map(parseLine);
  return { headers, rows };
}

function detectDelimiter(line: string): string {
  const commaCount = (line.match(/,/g) ?? []).length;
  const semiCount  = (line.match(/;/g) ?? []).length;
  const tabCount   = (line.match(/\t/g) ?? []).length;
  if (tabCount > commaCount && tabCount > semiCount) return "\t";
  if (semiCount > commaCount) return ";";
  return ",";
}

// ── Excel parsing (SheetJS, real) ────────────────────────

/**
 * Parse file Excel (.xlsx/.xls) → headers + rows (semua sel jadi string).
 * Membaca sheet PERTAMA. `header:1` → matriks baris; baris-1 = header.
 * `xlsx` di-dynamic-import supaya hanya ter-load saat user benar-benar
 * meng-import Excel (bundle awal tetap ringan).
 */
export async function parseExcelFile(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  const XLSX = await import("xlsx");
  const buf = await readFileAsArrayBuffer(file);
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
    header: 1,
    defval: "",
    blankrows: false,
  });
  if (matrix.length === 0) return { headers: [], rows: [] };

  const toStr = (v: unknown): string => (v === null || v === undefined ? "" : String(v).trim());
  const [headerRow, ...dataRows] = matrix;
  const headers = (headerRow as unknown[]).map(toStr);
  const rows = dataRows
    .map((r) => (r as unknown[]).map(toStr))
    .filter((r) => r.some((c) => c !== "")); // buang baris kosong total
  return { headers, rows };
}

// ── Build IcdItem from row ───────────────────────────────

export interface BuildContext {
  jenis: IcdJenis;
  rowIdx: number;
}

export interface BuildResult {
  ok: boolean;
  item?: IcdItem;
  reason?: string;
}

/** Bangun IcdItem dari row + mapping. Validate required fields. */
export function buildIcdFromRow(
  row: string[],
  mapping: ColumnMapping,
  ctx: BuildContext,
): BuildResult {
  const getValue = (field: IcdField): string => {
    const idx = Object.entries(mapping).find(([, v]) => v === field)?.[0];
    if (idx === undefined) return "";
    return (row[Number(idx)] ?? "").trim();
  };

  const kode = getValue("kode");
  const nama = getValue("nama");
  // VERSION inti, tapi sel kosong di-fallback ke versi default (bukan gagal).
  const version = getValue("version") || defaultIcdVersion(ctx.jenis);

  if (!kode) return { ok: false, reason: "Kode (CODE) kosong" };
  if (!nama) return { ok: false, reason: "Display kosong" };

  const item: IcdItem = {
    id: `icd-imp-${ctx.rowIdx}-${Math.random().toString(36).slice(2, 6)}`,
    jenis: ctx.jenis,
    kode,
    nama,
    version,
    namaInggris: getValue("namaInggris") || undefined,
    chapter: getValue("chapter") || undefined,
    blok: getValue("blok") || undefined,
    inaCbg: getValue("inaCbg") || undefined,
    status: "Aktif",
  };
  return { ok: true, item };
}

// ── Validation summary ───────────────────────────────────

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;       // kode sudah ada di existing items
  errors: Array<{ rowIdx: number; reason: string }>;
  duplicates: Array<{ rowIdx: number; kode: string }>;
  acceptedItems: IcdItem[];    // siap commit
}

export function validateImport(
  rows: string[][],
  mapping: ColumnMapping,
  jenis: IcdJenis,
  existingItems: IcdItem[],
): ValidationSummary {
  const existingKodes = new Set(
    existingItems.filter((i) => i.jenis === jenis).map((i) => i.kode.toUpperCase()),
  );

  const summary: ValidationSummary = {
    totalRows: rows.length,
    validRows: 0,
    invalidRows: 0,
    duplicateRows: 0,
    errors: [],
    duplicates: [],
    acceptedItems: [],
  };

  const seenInBatch = new Set<string>();

  rows.forEach((row, idx) => {
    const result = buildIcdFromRow(row, mapping, { jenis, rowIdx: idx });
    if (!result.ok || !result.item) {
      summary.invalidRows++;
      summary.errors.push({ rowIdx: idx, reason: result.reason ?? "Unknown error" });
      return;
    }
    const kodeUpper = result.item.kode.toUpperCase();

    // Cek duplikat vs existing
    if (existingKodes.has(kodeUpper)) {
      summary.duplicateRows++;
      summary.duplicates.push({ rowIdx: idx, kode: result.item.kode });
      return;
    }

    // Cek duplikat dalam batch sama
    if (seenInBatch.has(kodeUpper)) {
      summary.duplicateRows++;
      summary.duplicates.push({ rowIdx: idx, kode: result.item.kode });
      return;
    }
    seenInBatch.add(kodeUpper);

    summary.validRows++;
    summary.acceptedItems.push(result.item);
  });

  return summary;
}

// ── File reading utilities ───────────────────────────────

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("File read error"));
    reader.readAsText(file, "utf-8");
  });
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error("File read error"));
    reader.readAsArrayBuffer(file);
  });
}

/** Tentukan mode parsing dari ekstensi file. */
export function detectFileMode(file: File): FileMode | "unsupported" {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "excel";
  return "unsupported";
}
