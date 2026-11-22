import type { CPPTProfesi, CPPTJenis, TbakMetode } from "@/lib/data";
import { localYmd } from "@/lib/time/localTime";

export const MONTHS_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

export function fmtDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)} ${MONTHS_ID[parseInt(m, 10) - 1]} ${y}`;
}

/** Tanggal hari ini menurut jam LOKAL perangkat (bukan UTC). */
export function todayISO(): string {
  return localYmd(new Date());
}

/** "Hari ini" / "Kemarin" / "21 November 2026" untuk pemisah tanggal riwayat. */
export function dayLabel(iso: string): string {
  const today = todayISO();
  if (iso === today) return "Hari ini";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (iso === localYmd(y)) return "Kemarin";
  return fmtDate(iso);
}

// Warna profesi — tanpa ungu (Apoteker = teal).
export const PROFESI_CLS: Record<CPPTProfesi, string> = {
  Dokter:      "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  Perawat:     "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  Bidan:       "bg-pink-50 text-pink-700 ring-1 ring-pink-200",
  Apoteker:    "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  Gizi:        "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Fisioterapi: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  Lainnya:     "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

export const PROFESI_LIST: CPPTProfesi[] = [
  "Dokter","Perawat","Bidan","Apoteker","Gizi","Fisioterapi","Lainnya",
];

export const SOAP_BADGE: Record<string, string> = {
  S: "bg-sky-100 text-sky-800",
  O: "bg-teal-100 text-teal-800",
  A: "bg-amber-100 text-amber-800",
  P: "bg-emerald-100 text-emerald-800",
  I: "bg-rose-100 text-rose-800",
};

// ── Jenis catatan (SKP 2 — metode komunikasi efektif) ─────

export const CPPT_JENIS_LIST: CPPTJenis[] = ["SOAP", "SBAR", "TBAK"];

export const CPPT_JENIS_META: Record<
  CPPTJenis,
  { label: string; ket: string; chip: string; active: string; dot: string; bar: string }
> = {
  SOAP: {
    label: "SOAP",
    ket: "Catatan perkembangan rutin",
    chip: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    active: "border-indigo-500 bg-indigo-50/80 text-indigo-900",
    dot: "bg-indigo-500",
    bar: "bg-indigo-400",
  },
  SBAR: {
    label: "SBAR",
    ket: "Pelaporan / komunikasi kondisi",
    chip: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    active: "border-sky-500 bg-sky-50/80 text-sky-900",
    dot: "bg-sky-500",
    bar: "bg-sky-400",
  },
  TBAK: {
    label: "TBAK",
    ket: "Instruksi verbal / via telepon",
    chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    active: "border-rose-500 bg-rose-50/80 text-rose-900",
    dot: "bg-rose-500",
    bar: "bg-rose-400",
  },
};

// ── Area naratif per jenis (S/O/A/P/I vs S/B/A/R) ─────────

export type CPPTFieldKey = "subjektif" | "objektif" | "asesmen" | "planning" | "instruksi";

export interface CPPTAreaDef {
  key: CPPTFieldKey;
  badge: string;
  label: string;
  placeholder: string;
  badgeCls: string;
  /** Tinggi minimum (baris) saat kosong — field tetap tumbuh mengikuti isi. */
  rows?: number;
}

export const SOAP_AREAS: CPPTAreaDef[] = [
  { key: "subjektif", badge: "S", label: "Subjektif", placeholder: "Keluhan yang dirasakan pasien...", badgeCls: SOAP_BADGE.S },
  { key: "objektif",  badge: "O", label: "Objektif",  placeholder: "Temuan pemeriksaan, TTV, lab, radiologi...", badgeCls: SOAP_BADGE.O },
  { key: "asesmen",   badge: "A", label: "Asesmen",   placeholder: "Diagnosis / masalah klinis...", badgeCls: SOAP_BADGE.A },
  { key: "planning",  badge: "P", label: "Planning",  placeholder: "Rencana tatalaksana...", badgeCls: SOAP_BADGE.P, rows: 3 },
  { key: "instruksi", badge: "I", label: "Instruksi", placeholder: "Instruksi kepada perawat / tenaga kesehatan lain...", badgeCls: SOAP_BADGE.I },
];

export const SBAR_BADGE: Record<string, string> = {
  S: "bg-sky-100 text-sky-800",
  B: "bg-teal-100 text-teal-800",
  A: "bg-amber-100 text-amber-800",
  R: "bg-emerald-100 text-emerald-800",
};

export const SBAR_AREAS: CPPTAreaDef[] = [
  { key: "subjektif", badge: "S", label: "Situation · Situasi", placeholder: "Kondisi / masalah pasien saat ini, identitas singkat...", badgeCls: SBAR_BADGE.S },
  { key: "objektif",  badge: "B", label: "Background · Latar", placeholder: "Riwayat singkat, diagnosis, terapi berjalan, TTV...", badgeCls: SBAR_BADGE.B },
  { key: "asesmen",   badge: "A", label: "Assessment · Analisis", placeholder: "Penilaian / analisis kondisi pasien saat ini...", badgeCls: SBAR_BADGE.A },
  { key: "planning",  badge: "R", label: "Recommendation · Rekomendasi", placeholder: "Usulan tindakan / yang diharapkan dari penerima laporan...", badgeCls: SBAR_BADGE.R, rows: 3 },
];

/** Area naratif sesuai jenis (TBAK ditangani terpisah — bukan area naratif). */
export function areasFor(jenis: CPPTJenis): CPPTAreaDef[] {
  return jenis === "SBAR" ? SBAR_AREAS : SOAP_AREAS;
}

// ── TBAK (Tulis–Baca–Konfirmasi) ──────────────────────────

export const TBAK_METODE_LIST: TbakMetode[] = ["Telepon", "Lisan"];

export const TBAK_STEPS: { key: "tbakTulis" | "tbakBaca" | "tbakKonfirmasi"; label: string; ket: string }[] = [
  { key: "tbakTulis", label: "Tulis", ket: "Instruksi dituliskan lengkap" },
  { key: "tbakBaca", label: "Baca", ket: "Dibacakan ulang ke pemberi instruksi" },
  { key: "tbakKonfirmasi", label: "Konfirmasi", ket: "Pemberi instruksi mengonfirmasi kebenaran" },
];

/** TBAK yang belum diverifikasi DPJP lewat dari 1×24 jam (SKP 2). Tanggal + jam = waktu lokal catatan. */
export function tbakOverdue(tanggal: string | undefined, waktu: string, now = new Date()): boolean {
  if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || !/^\d{2}:\d{2}$/.test(waktu)) return false;
  const t = new Date(`${tanggal}T${waktu}:00`);
  return !Number.isNaN(t.getTime()) && now.getTime() - t.getTime() > 24 * 60 * 60 * 1000;
}
