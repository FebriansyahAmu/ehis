// Konstanta & helper tampilan tab Mutasi (IGD · Rawat Inap).

import type { BedState, LokasiDTO } from "@/lib/api/mutasi";

/** Alasan yang sering dipakai — mengisi kolom alasan (tetap bisa diubah bebas). */
export const ALASAN_PRESET = [
  "Perubahan kondisi klinis",
  "Butuh pemantauan intensif",
  "Kondisi membaik — turun level perawatan",
  "Isolasi / pencegahan infeksi",
  "Penyesuaian kelas / hak rawat",
  "Permintaan pasien / keluarga",
] as const;

/** Status bed di peta: warna + label teks (warna bukan satu-satunya penanda). */
export const BED_STATE: Record<BedState, { label: string; card: string; dot: string }> = {
  available: { label: "Kosong", card: "border-emerald-300 bg-emerald-50 text-emerald-900 hover:border-emerald-500", dot: "bg-emerald-500" },
  occupied: { label: "Terisi", card: "border-rose-200 bg-rose-50 text-rose-900", dot: "bg-rose-500" },
  reserved: { label: "Direservasi", card: "border-amber-200 bg-amber-50 text-amber-900", dot: "bg-amber-500" },
  current: { label: "Posisi pasien", card: "border-sky-300 bg-sky-50 text-sky-900", dot: "bg-sky-500" },
  target: { label: "Tujuan mutasi", card: "border-dashed border-sky-400 bg-white text-sky-900", dot: "bg-sky-400" },
  unavailable: { label: "Nonaktif", card: "border-slate-200 bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

export const kelasLabel = (k: string | null | undefined) => (k ? k.replace("_", " ") : null);

export const LOCATION_TYPE_LABEL: Record<string, string> = {
  IGD: "IGD", Rawat_Inap: "Rawat Inap", ICU: "ICU", HCU: "HCU", Isolasi: "Isolasi",
};
export const isRiRoomType = (t: string) => t !== "IGD";

/** Ukuran tombol aksi tab Mutasi (ringkas, tetap ≥ 36px). */
export const BTN = "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 m-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70";

export function lokasiLabel(l: LokasiDTO): string {
  if (!l.ruanganNama) return "Belum tercatat";
  return l.bedKode ? `${l.ruanganNama} · Bed ${l.bedKode}` : l.ruanganNama;
}

/** Instan ISO → "23 Nov 2026, 14.05" menurut zona perangkat. */
export function fmtWaktu(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const errMsg = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;
