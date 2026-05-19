/**
 * Mock Depo Farmasi — placeholder sebelum Gudang Farmasi modul dibangun.
 * Dipakai oleh sub-page Mapping Hub: Distribusi Obat.
 */

// ── Types ─────────────────────────────────────────────────

export type DepoTipe = "Gudang" | "Depo_Unit" | "Apotek_Layanan";

export interface DepoRecord {
  id: string;
  kode: string;
  nama: string;
  tipe: DepoTipe;
  /** Unit / lokasi fisik */
  lokasi: string;
  /** Penanggung jawab (Apoteker) */
  pic: string;
  jamOperasional: string;
}

// ── Config ───────────────────────────────────────────────

export const DEPO_TIPE_CFG: Record<
  DepoTipe,
  { label: string; short: string; bg: string; text: string; dot: string }
> = {
  Gudang:          { label: "Gudang Pusat",     short: "Gd",   bg: "bg-slate-100",   text: "text-slate-700",   dot: "bg-slate-500" },
  Depo_Unit:       { label: "Depo Unit Klinis", short: "Depo", bg: "bg-rose-50",     text: "text-rose-700",    dot: "bg-rose-500" },
  Apotek_Layanan:  { label: "Apotek Layanan",   short: "Apo",  bg: "bg-violet-50",   text: "text-violet-700",  dot: "bg-violet-500" },
};

// ── Mock Data ─────────────────────────────────────────────

export const DEPO_MOCK: DepoRecord[] = [
  { id: "depo-001", kode: "GD-PUSAT", nama: "Gudang Farmasi Pusat", tipe: "Gudang",         lokasi: "Lt. Dasar Belakang", pic: "Apt. Ahmad Fauzi",      jamOperasional: "24 jam" },
  { id: "depo-002", kode: "DEPO-IGD", nama: "Depo IGD",             tipe: "Depo_Unit",      lokasi: "IGD Lt. 1",          pic: "Apt. Rina Setiawati",    jamOperasional: "24 jam" },
  { id: "depo-003", kode: "DEPO-ICU", nama: "Depo ICU/HCU",         tipe: "Depo_Unit",      lokasi: "ICU Lt. 3",          pic: "Apt. Dimas Pratama",     jamOperasional: "24 jam" },
  { id: "depo-004", kode: "DEPO-OK",  nama: "Depo Kamar Operasi",   tipe: "Depo_Unit",      lokasi: "OK Lt. 2",           pic: "Apt. Ika Sari",          jamOperasional: "06-22" },
  { id: "depo-005", kode: "APO-RI",   nama: "Apotek Rawat Inap",    tipe: "Apotek_Layanan", lokasi: "Lt. 2 Sayap Kanan",  pic: "Apt. Bagus Wibowo",      jamOperasional: "24 jam" },
  { id: "depo-006", kode: "APO-RJ",   nama: "Apotek Rawat Jalan",   tipe: "Apotek_Layanan", lokasi: "Lt. 1 Lobby",        pic: "Apt. Sari Rahmawati",    jamOperasional: "07-21" },
];

// ── Helpers ───────────────────────────────────────────────

export function getDepoById(id: string): DepoRecord | undefined {
  return DEPO_MOCK.find((d) => d.id === id);
}
