/**
 * Pure logic helpers untuk Tagihan Board: filter, sort, dan derive summary.
 * Tidak menyentuh React state — semua input → output deterministic.
 */

import { TAGIHAN_BOARD_MOCK, type TagihanRow, sisa } from "@/lib/billing/tagihanBoardMock";
import type { TagihanFilterState, QuickTab } from "./tagihanShared";

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
  const q = filters.search.trim().toLowerCase();
  const fromTs = new Date(filters.periodeFrom + "T00:00:00").getTime();
  const toTs   = new Date(filters.periodeTo   + "T23:59:59").getTime();

  return items.filter((row) => {
    if (q) {
      const hay = `${row.noTagihan} ${row.pasien.nama} ${row.pasien.noRM} ${row.noKunjungan}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    const rowTs = new Date(row.tanggalISO).getTime();
    if (rowTs < fromTs || rowTs > toTs) return false;

    if (filters.units.length && !filters.units.includes(row.unit)) return false;
    if (filters.kelas.length && !filters.kelas.includes(row.kelas)) return false;
    if (filters.penjamin !== "all" && row.penjamin.tipe !== filters.penjamin) return false;
    if (filters.status.length && !filters.status.includes(row.status)) return false;

    if (!matchesQuickTab(row, filters.quickTab)) return false;

    return true;
  });
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

// ── Re-export untuk konsumen ───────────────────────────

export { TAGIHAN_BOARD_MOCK, sisa };
export type { TagihanRow };
