/**
 * Helper utility untuk Import Excel/CSV ICD-10 & ICD-9.
 *
 * Strategi (frontend-only, mock-ready):
 *   - CSV: parsing real via native FileReader + custom split (RFC 4180 minimal).
 *   - Excel (.xlsx): demo mode dengan sample data — saat backend ready, install
 *     `xlsx` (SheetJS) dan replace `parseExcelDemo()` dengan real parsing via
 *     `XLSX.read(arrayBuffer).Sheets[firstName] → XLSX.utils.sheet_to_json()`.
 *
 * Field mapping (target): kode · nama · namaInggris · chapter · blok · inaCbg
 * Format file referensi: WHO ICD-10 master file atau Kemkes Buku ICD-10 Volume 1.
 */

import type { IcdItem, IcdJenis } from "@/lib/master/icdMock";

// ── File parsing types ───────────────────────────────────

export type FileMode = "csv" | "excel-demo";

export interface ParsedFile {
  mode: FileMode;
  fileName: string;
  headers: string[];
  rows: string[][];           // raw data rows (excluding header)
  totalRows: number;
  truncated: boolean;         // true bila >MAX_PREVIEW_ROWS, sebagian saja preview-nya
}

export const MAX_PREVIEW_ROWS = 500;

// ── Column mapping ───────────────────────────────────────

/** Target field di IcdItem yang bisa di-map dari kolom Excel/CSV. */
export type IcdField = "kode" | "nama" | "namaInggris" | "chapter" | "blok" | "inaCbg";

export interface IcdFieldDef {
  key: IcdField;
  label: string;
  required: boolean;
  hint: string;
  /** Pattern auto-match dari header (lowercase contains). */
  matchPatterns: string[];
}

export const ICD_FIELDS: IcdFieldDef[] = [
  { key: "kode",        label: "Kode",          required: true,  hint: "Kode utama (A09, I21.0, dll)",      matchPatterns: ["kode", "code", "icd"] },
  { key: "nama",        label: "Nama (ID)",     required: true,  hint: "Nama diagnosis Bahasa Indonesia",   matchPatterns: ["nama", "indonesia", "deskripsi", "title_id"] },
  { key: "namaInggris", label: "Nama (EN)",     required: false, hint: "Nama diagnosis Bahasa Inggris",     matchPatterns: ["english", "inggris", "title_en", "title", "name"] },
  { key: "chapter",     label: "Chapter",       required: true,  hint: "Chapter WHO (mis. I, IX, dll)",     matchPatterns: ["chapter", "bab", "group"] },
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

// ── Excel demo mode ──────────────────────────────────────

/**
 * Mock parser untuk file .xlsx (demo mode).
 *
 * Saat backend ready, ganti dengan:
 *   import * as XLSX from "xlsx";
 *   const wb = XLSX.read(arrayBuffer);
 *   const sheet = wb.Sheets[wb.SheetNames[0]];
 *   const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
 *   return { headers: rows[0], rows: rows.slice(1) };
 */
export function parseExcelDemo(fileName: string): { headers: string[]; rows: string[][] } {
  const headers = ["Kode", "Nama Indonesia", "English Title", "Chapter", "Blok", "INA-CBG"];
  const rows: string[][] = [
    ["A00.0", "Kolera akibat Vibrio cholerae 01, biotipe cholerae", "Cholera due to Vibrio cholerae 01, biovar cholerae", "I. Infeksi & Parasit", "A00–A09", "A-4-13"],
    ["A00.1", "Kolera akibat Vibrio cholerae 01, biotipe el tor",   "Cholera due to Vibrio cholerae 01, biovar eltor",   "I. Infeksi & Parasit", "A00–A09", "A-4-13"],
    ["A00.9", "Kolera, tidak spesifik",                              "Cholera, unspecified",                              "I. Infeksi & Parasit", "A00–A09", ""],
    ["A01.0", "Demam tifoid",                                        "Typhoid fever",                                     "I. Infeksi & Parasit", "A00–A09", "A-4-13"],
    ["A01.4", "Demam paratifoid, tidak spesifik",                    "Paratyphoid fever, unspecified",                    "I. Infeksi & Parasit", "A00–A09", ""],
    ["A02.0", "Enteritis salmonella",                                "Salmonella enteritis",                              "I. Infeksi & Parasit", "A00–A09", ""],
    ["A03.0", "Shigellosis akibat Shigella dysenteriae",             "Shigellosis due to Shigella dysenteriae",           "I. Infeksi & Parasit", "A00–A09", ""],
    ["A04.0", "Infeksi E. coli enteropatogenik",                     "Enteropathogenic Escherichia coli infection",       "I. Infeksi & Parasit", "A00–A09", ""],
    ["A04.7", "Enterokolitis akibat Clostridium difficile",          "Enterocolitis due to Clostridium difficile",        "I. Infeksi & Parasit", "A00–A09", ""],
    ["A05.0", "Keracunan makanan staphylococcal",                    "Foodborne staphylococcal intoxication",             "I. Infeksi & Parasit", "A00–A09", ""],
    ["A06.0", "Disentri amebik akut",                                "Acute amoebic dysentery",                           "I. Infeksi & Parasit", "A00–A09", ""],
    ["A08.0", "Enteritis rotavirus",                                  "Rotaviral enteritis",                              "I. Infeksi & Parasit", "A00–A09", ""],
    ["A15.1", "Tuberkulosis paru, hanya tes kultur positif",         "Tuberculosis of lung, confirmed by culture only",   "I. Infeksi & Parasit", "A15–A19", "A-4-15"],
    ["A15.2", "Tuberkulosis paru, histologis positif",                "Tuberculosis of lung, confirmed histologically",    "I. Infeksi & Parasit", "A15–A19", "A-4-15"],
    ["A16.0", "TB paru, tanpa pemeriksaan bakteriologis/histologis", "Tuberculosis of lung, without mention of bacteriological or histological confirmation", "I. Infeksi & Parasit", "A15–A19", ""],
    // Reference: ini sample 15 baris — file .xlsx asli WHO bisa 15.000+ kode
  ];
  void fileName;
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
  const chapter = getValue("chapter");

  if (!kode) return { ok: false, reason: "Kode kosong" };
  if (!nama) return { ok: false, reason: "Nama (ID) kosong" };
  if (!chapter) return { ok: false, reason: "Chapter kosong" };

  const item: IcdItem = {
    id: `icd-imp-${ctx.rowIdx}-${Math.random().toString(36).slice(2, 6)}`,
    jenis: ctx.jenis,
    kode,
    nama,
    namaInggris: getValue("namaInggris") || undefined,
    chapter,
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

/** Tentukan mode parsing dari ekstensi file. */
export function detectFileMode(file: File): FileMode | "unsupported" {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "excel-demo";
  return "unsupported";
}
