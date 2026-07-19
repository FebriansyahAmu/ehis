// Shared untuk sub-tab Tarif sederhana (Ruang Rawat & Administrasi) — grid baris × penjamin,
// 1 nilai per (baris, penjamin). Beda dari Tarif Matrix (federasi katalog × tier): di sini baris =
// himpunan tetap (kelas kamar / unit), kolom = penjamin (dipilih via tab). Map key [penjamin][rowKey].

import type { TarifInput } from "../tarifShared";

export interface SimpleTarifRow {
  key: string;
  label: string;
  hint?: string;
}

export interface SimpleCell {
  id: string; // id edge (untuk DELETE)
  harga: number;
  jasaSarana: number | null;
  jasaMedis: number | null;
  jasaParamedis: number | null;
  /** Metadata SK penetapan tarif (opsional). tglSk = "YYYY-MM-DD". */
  noSk: string | null;
  tglSk: string | null;
}

export interface SimpleTarifEdge extends SimpleCell {
  rowKey: string;       // kelas ATAU unit
  penjaminKode: string;
}

/** Input dari editor 1 baris: harga + komponen (TarifInput) + metadata SK opsional. */
export interface SimpleTarifInput extends TarifInput {
  noSk: string | null;
  tglSk: string | null;
}

// [penjaminKode][rowKey] → cell
export type SimpleTarifMap = Record<string, Record<string, SimpleCell>>;

export function simpleMapFromEdges(edges: SimpleTarifEdge[]): SimpleTarifMap {
  const m: SimpleTarifMap = {};
  for (const e of edges) {
    (m[e.penjaminKode] ??= {});
    m[e.penjaminKode][e.rowKey] = {
      id: e.id, harga: e.harga, jasaSarana: e.jasaSarana, jasaMedis: e.jasaMedis, jasaParamedis: e.jasaParamedis,
      noSk: e.noSk, tglSk: e.tglSk,
    };
  }
  return m;
}

export function getSimpleCell(map: SimpleTarifMap, penjaminKode: string, rowKey: string): SimpleCell | undefined {
  return map[penjaminKode]?.[rowKey];
}

export function setSimpleCell(map: SimpleTarifMap, penjaminKode: string, rowKey: string, cell: SimpleCell): SimpleTarifMap {
  const next: SimpleTarifMap = { ...map };
  next[penjaminKode] = { ...(next[penjaminKode] ?? {}), [rowKey]: cell };
  return next;
}

export function clearSimpleCell(map: SimpleTarifMap, penjaminKode: string, rowKey: string): SimpleTarifMap {
  const sheet = map[penjaminKode];
  if (!sheet?.[rowKey]) return map;
  const next: SimpleTarifMap = { ...map };
  next[penjaminKode] = { ...sheet };
  delete next[penjaminKode][rowKey];
  return next;
}

/** Konfigurasi 1 sub-tab tarif sederhana (kamar/administrasi). API di-adaptasi ke bentuk umum. */
export interface SimpleTarifConfig {
  id: "kamar" | "administrasi";
  title: string;
  subtitle: string;
  rowHeader: string;       // "Kelas" | "Unit"
  unitSuffix?: string;     // "/hari" untuk kamar; kosong untuk administrasi
  rows: SimpleTarifRow[];
  listAll: (signal?: AbortSignal) => Promise<SimpleTarifEdge[]>;
  upsert: (rowKey: string, penjaminKode: string, input: SimpleTarifInput) => Promise<SimpleTarifEdge>;
  remove: (id: string) => Promise<void>;
}

// Baris tetap — kelas kamar (selaras enum RIKelas) & unit layanan (selaras kunjungan.unit).
export const KELAS_ROWS: SimpleTarifRow[] = [
  { key: "VIP",     label: "VIP" },
  { key: "Kelas_1", label: "Kelas 1" },
  { key: "Kelas_2", label: "Kelas 2" },
  { key: "Kelas_3", label: "Kelas 3" },
  { key: "ICU",     label: "ICU", hint: "Intensive Care Unit" },
  { key: "HCU",     label: "HCU", hint: "High Care Unit" },
  { key: "Isolasi", label: "Isolasi" },
];

export const UNIT_ROWS: SimpleTarifRow[] = [
  { key: "IGD",        label: "IGD", hint: "Instalasi Gawat Darurat" },
  { key: "RawatJalan", label: "Rawat Jalan", hint: "Poliklinik / RJ" },
  { key: "RawatInap",  label: "Rawat Inap", hint: "Admisi bangsal" },
];
