// Konfigurasi tab "Ubah Penjamin": jenis penjamin (pilihan UI) → enum kanonik, aksen warna, helper format.
//
// Komposisi warna: tiap JENIS punya aksen identitas (sky / slate / teal / indigo), sedangkan warna
// semantik dipakai konsisten lintas tab: amber = perubahan yang belum disimpan, emerald = terverifikasi
// / SEP terbit, rose = galat / peserta tidak aktif. Tanpa ungu.

import { HardHat, HeartPulse, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";
import type { TipePenjamin } from "@/lib/data";

export type PenjaminType = "bpjs-jkn" | "umum" | "bpjs-naker" | "asuransi";

export interface PenjaminAccent {
  /** Kotak ikon saat ditekankan (kartu terpilih / ringkasan). */
  tile: string;
  /** Kartu pilihan saat terpilih (border + latar). */
  selected: string;
  /** Bulatan centang kartu terpilih. */
  check: string;
  /** Teks judul saat terpilih (≥ 4.5:1 di latar tint). */
  text: string;
}

export interface PenjaminOpt {
  id: PenjaminType;
  label: string;
  sub: string;
  icon: LucideIcon;
  accent: PenjaminAccent;
}

export const PENJAMIN_OPTS: readonly PenjaminOpt[] = [
  {
    id: "bpjs-jkn", label: "BPJS / JKN", sub: "Kartu Indonesia Sehat · terbit SEP", icon: HeartPulse,
    accent: { tile: "bg-sky-100 text-sky-700", selected: "border-sky-500 bg-sky-50/70", check: "bg-sky-600", text: "text-sky-900" },
  },
  {
    id: "umum", label: "Umum / Mandiri", sub: "Tarif umum · bayar di Kasir", icon: Wallet,
    accent: { tile: "bg-slate-200 text-slate-700", selected: "border-slate-500 bg-slate-50", check: "bg-slate-700", text: "text-slate-900" },
  },
  {
    id: "bpjs-naker", label: "BPJS Ketenagakerjaan", sub: "Kecelakaan kerja / PAK", icon: HardHat,
    accent: { tile: "bg-teal-100 text-teal-700", selected: "border-teal-500 bg-teal-50/70", check: "bg-teal-600", text: "text-teal-900" },
  },
  {
    id: "asuransi", label: "Asuransi Lainnya", sub: "Swasta / perusahaan", icon: ShieldCheck,
    accent: { tile: "bg-indigo-100 text-indigo-700", selected: "border-indigo-500 bg-indigo-50/70", check: "bg-indigo-600", text: "text-indigo-900" },
  },
];

export const optOf = (t: PenjaminType): PenjaminOpt => PENJAMIN_OPTS.find((o) => o.id === t) ?? PENJAMIN_OPTS[0];

// BPJS Ketenagakerjaan tak punya enum sendiri → dipetakan ke Asuransi (jaminan kerja) dgn nama eksplisit.
export const NONBPJS_TIPE: Record<Exclude<PenjaminType, "bpjs-jkn">, TipePenjamin> = {
  umum: "Umum", "bpjs-naker": "Asuransi", asuransi: "Asuransi",
};

/** Label penjamin kunjungan (teks bebas dari DTO/mock) → jenis pilihan UI. */
export function typeOf(penjamin?: string | null): PenjaminType {
  if (!penjamin) return "bpjs-jkn";
  const p = penjamin.toLowerCase();
  if (p.includes("bpjs") || p.includes("jkn") || p.includes("pbi") || p.includes("kis")) {
    return p.includes("kerja") || p.includes("naker") ? "bpjs-naker" : "bpjs-jkn";
  }
  if (p.includes("umum") || p.includes("mandiri")) return "umum";
  if (p.includes("asuransi") || p.includes("swasta") || p.includes("polis")) return "asuransi";
  return "bpjs-jkn";
}

/** Label tampilan sesudah simpan (patch lokal) — tetap terbaca ulang benar oleh `typeOf`. */
export function savedLabel(t: Exclude<PenjaminType, "bpjs-jkn">, asuransiNama: string): string {
  if (t === "umum") return "Umum / Mandiri";
  if (t === "bpjs-naker") return "BPJS Ketenagakerjaan";
  const nama = asuransiNama.trim();
  return nama ? `Asuransi · ${nama}` : "Asuransi";
}

export const digitsOnly = (s: string) => s.replace(/\D/g, "");

/** "0001234567890" → "0001 2345 6789 0" (lebih mudah dicocokkan dengan kartu fisik). */
export const groupDigits = (s: string) => digitsOnly(s).replace(/(\d{4})(?=\d)/g, "$1 ");

/** No. Kartu JKN utuh (13 digit) — nomor tersimpan bisa termasker, yang begitu tak dibandingkan. */
export const isFullNoKartu = (s: string | undefined) => !!s && /^\d{13}$/.test(s.trim());

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** Tanggal kalender "YYYY-MM-DD" (bukan instan) → "31 Desember 2031". Format lain apa adanya. */
export function fmtTanggal(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return ymd;
  return `${Number(m[3])} ${BULAN[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

/** Nama untuk dicocokkan: huruf kecil, tanpa gelar/tanda baca, spasi tunggal. */
export const normName = (s: string) =>
  s.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
