/**
 * Mock Katalog Penjamin & Kelas — placeholder sebelum Tier 3 (Penjamin & Kontrak)
 * dibangun. Dipakai oleh sub-page Mapping Hub: Tarif Matrix, Formularium Penjamin.
 */

// ── Types ─────────────────────────────────────────────────

export type PenjaminTipe = "Umum" | "BPJS" | "Asuransi_Swasta" | "Jamkesda";

export interface PenjaminRecord {
  id: string;
  kode: string;
  nama: string;
  tipe: PenjaminTipe;
  desc?: string;
}

/** Kelas perawatan — universal lintas penjamin */
export type KelasRawat =
  | "VIP"
  | "Kelas_1"
  | "Kelas_2"
  | "Kelas_3"
  | "ICU"
  | "HCU"
  | "Rawat_Jalan";

export interface KelasRecord {
  id: KelasRawat;
  label: string;
  short: string;
  order: number;
}

// ── Config ───────────────────────────────────────────────

export const PENJAMIN_TIPE_CFG: Record<
  PenjaminTipe,
  { label: string; bg: string; text: string; dot: string }
> = {
  Umum:            { label: "Umum / Pribadi", bg: "bg-slate-100", text: "text-slate-700",  dot: "bg-slate-500" },
  BPJS:            { label: "BPJS Kesehatan", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Asuransi_Swasta: { label: "Asuransi Swasta", bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500" },
  Jamkesda:        { label: "Jamkesda / Daerah", bg: "bg-amber-50", text: "text-amber-700",   dot: "bg-amber-500" },
};

export const KELAS_LIST: KelasRecord[] = [
  { id: "VIP",         label: "VIP",         short: "VIP",  order: 1 },
  { id: "Kelas_1",     label: "Kelas 1",     short: "K1",   order: 2 },
  { id: "Kelas_2",     label: "Kelas 2",     short: "K2",   order: 3 },
  { id: "Kelas_3",     label: "Kelas 3",     short: "K3",   order: 4 },
  { id: "ICU",         label: "ICU / HCU",   short: "ICU",  order: 5 },
  { id: "HCU",         label: "HCU",         short: "HCU",  order: 6 },
  { id: "Rawat_Jalan", label: "Rawat Jalan", short: "RJ",   order: 7 },
];

// ── Mock Data ─────────────────────────────────────────────

export const PENJAMIN_MOCK: PenjaminRecord[] = [
  { id: "pj-001", kode: "UMUM",  nama: "Umum / Pribadi",       tipe: "Umum",            desc: "Bayar tunai / debit / kartu kredit" },
  { id: "pj-002", kode: "BPJS",  nama: "BPJS Kesehatan",       tipe: "BPJS",            desc: "Tarif INA-CBG nasional" },
  { id: "pj-003", kode: "INH",   nama: "Inhealth (Mandiri)",   tipe: "Asuransi_Swasta", desc: "PPK Mandiri Inhealth" },
  { id: "pj-004", kode: "AXA",   nama: "AXA Mandiri",          tipe: "Asuransi_Swasta", desc: "Reimburse + cashless" },
  { id: "pj-005", kode: "ALN",   nama: "Allianz Life",         tipe: "Asuransi_Swasta", desc: "Premium / Smart Health" },
  { id: "pj-006", kode: "JKD",   nama: "Jamkesda DKI",         tipe: "Jamkesda",        desc: "KJS / Kartu Jakarta Sehat" },
];

// ── Helpers ───────────────────────────────────────────────

export function getPenjaminById(id: string): PenjaminRecord | undefined {
  return PENJAMIN_MOCK.find((p) => p.id === id);
}

export function getKelasById(id: KelasRawat): KelasRecord | undefined {
  return KELAS_LIST.find((k) => k.id === id);
}

export function fmtRupiah(n: number): string {
  if (n === 0) return "—";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function fmtRupiahShort(n: number): string {
  if (n === 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)} jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} rb`;
  return `${n}`;
}
