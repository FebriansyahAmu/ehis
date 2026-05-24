/**
 * Pure logic helpers untuk Tagihan Board: filter, sort, dan derive summary.
 * Tidak menyentuh React state — semua input → output deterministic.
 */

import { TAGIHAN_BOARD_MOCK, type TagihanRow, sisa } from "@/lib/billing/tagihanBoardMock";
import type { TagihanFilterState, QuickTab } from "./tagihanShared";

export type QuickTabCounts = Record<QuickTab, number>;

// ── Sort ───────────────────────────────────────────────

export type SortKey =
  | "noTagihan" | "tanggal" | "pasien" | "total" | "dibayar" | "sisa" | "status";
export type SortDir = "asc" | "desc";

export interface SortState {
  key: SortKey | null;
  dir: SortDir;
}

export function cycleSort(current: SortState, key: SortKey): SortState {
  if (current.key !== key) return { key, dir: "asc" };
  if (current.dir === "asc")  return { key, dir: "desc" };
  return { key: null, dir: "asc" };
}

// ── Filter ─────────────────────────────────────────────

export function applyFilters(
  items: TagihanRow[],
  filters: TagihanFilterState,
): TagihanRow[] {
  return items.filter((row) =>
    passesCoreFilters(row, filters) && matchesQuickTab(row, filters.quickTab),
  );
}

/** Apply semua filter KECUALI quickTab — dipakai untuk hitung count per tab
 *  (so counts mereflect "kalau klik tab ini, dapat berapa baris"). */
export function applyFiltersExceptQuickTab(
  items: TagihanRow[],
  filters: TagihanFilterState,
): TagihanRow[] {
  return items.filter((row) => passesCoreFilters(row, filters));
}

function passesCoreFilters(row: TagihanRow, filters: TagihanFilterState): boolean {
  const q = filters.search.trim().toLowerCase();
  if (q) {
    const hay = `${row.noTagihan} ${row.pasien.nama} ${row.pasien.noRM} ${row.noKunjungan}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  const fromTs = new Date(filters.periodeFrom + "T00:00:00").getTime();
  const toTs   = new Date(filters.periodeTo   + "T23:59:59").getTime();
  const rowTs = new Date(row.tanggalISO).getTime();
  if (rowTs < fromTs || rowTs > toTs) return false;

  if (filters.units.length && !filters.units.includes(row.unit)) return false;
  if (filters.kelas.length && !filters.kelas.includes(row.kelas)) return false;
  if (filters.penjamin !== "all" && row.penjamin.tipe !== filters.penjamin) return false;
  if (filters.status.length && !filters.status.includes(row.status)) return false;

  return true;
}

function matchesQuickTab(row: TagihanRow, tab: QuickTab): boolean {
  switch (tab) {
    case "semua":         return true;
    case "draft":         return row.status === "Draft";
    case "belum-lunas":   return row.status === "Belum Lunas" || row.status === "Lunas Sebagian";
    case "klaim-pending": return row.status === "Proses Klaim";
    case "hari-ini":      return isToday(row.tanggalISO);
  }
}

/** Hitung jumlah row per QuickTab setelah filter lain di-apply. */
export function computeQuickTabCounts(
  items: TagihanRow[],
  filters: TagihanFilterState,
): QuickTabCounts {
  const base = applyFiltersExceptQuickTab(items, filters);
  return {
    "semua":         base.length,
    "draft":         base.filter((r) => r.status === "Draft").length,
    "belum-lunas":   base.filter((r) => r.status === "Belum Lunas" || r.status === "Lunas Sebagian").length,
    "klaim-pending": base.filter((r) => r.status === "Proses Klaim").length,
    "hari-ini":      base.filter((r) => isToday(r.tanggalISO)).length,
  };
}

function isToday(iso: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return iso.startsWith(today);
}

// ── Sort apply ─────────────────────────────────────────

export function applySort(items: TagihanRow[], sort: SortState): TagihanRow[] {
  if (!sort.key) return items;
  const dir = sort.dir === "asc" ? 1 : -1;
  const key = sort.key;
  const arr = [...items];
  arr.sort((a, b) => {
    const va = readKey(a, key);
    const vb = readKey(b, key);
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
    return String(va).localeCompare(String(vb), "id-ID", { numeric: true }) * dir;
  });
  return arr;
}

function readKey(row: TagihanRow, key: SortKey): string | number {
  switch (key) {
    case "noTagihan": return row.noTagihan;
    case "tanggal":   return new Date(row.tanggalISO).getTime();
    case "pasien":    return row.pasien.nama;
    case "total":     return row.total;
    case "dibayar":   return row.dibayar;
    case "sisa":      return sisa(row);
    case "status":    return row.status;
  }
}

// ── Format helpers ─────────────────────────────────────

export function formatRelativeId(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (diffMin < 1)       return "Baru saja";
  if (diffMin < 60)      return `${diffMin} mnt lalu`;
  if (diffMin < 1440)    return `${Math.floor(diffMin / 60)} jam lalu`;
  if (diffMin < 1440 * 7) return `${Math.floor(diffMin / 1440)} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

export function formatTanggalShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) +
    " · " +
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatTanggalFull(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) +
    " · " +
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ── Export CSV (BL1.3) ─────────────────────────────────

/** Generate CSV (Excel-compatible) dari rows + trigger download di browser.
 *  Stub untuk BL1.3 "Export Excel"; xlsx-lib bisa di-swap nanti tanpa ubah caller. */
export function exportTagihanCsv(
  rows: TagihanRow[],
  filename = `tagihan-${new Date().toISOString().slice(0, 10)}.csv`,
): void {
  if (typeof window === "undefined") return;
  const header = [
    "No Tagihan", "Tanggal", "No Kunjungan", "No RM", "Pasien", "Gender", "Usia",
    "Unit", "Kelas", "Penjamin", "DPJP", "Total", "Dibayar", "Sisa", "Status",
  ];
  const lines = rows.map((r) => [
    r.noTagihan, r.tanggalISO, r.noKunjungan, r.pasien.noRM, r.pasien.nama,
    r.pasien.gender, r.pasien.age, r.unit, r.kelas, r.penjamin.nama, r.dpjp,
    r.total, r.dibayar, sisa(r), r.status,
  ].map(csvCell).join(","));
  const csv = [header.join(","), ...lines].join("\r\n");
  // BOM agar Excel kenali UTF-8 (Rupiah / unicode aman)
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  // Quote jika ada koma / quote / newline
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ── Re-export untuk konsumen ───────────────────────────

export { TAGIHAN_BOARD_MOCK, sisa };
export type { TagihanRow };
