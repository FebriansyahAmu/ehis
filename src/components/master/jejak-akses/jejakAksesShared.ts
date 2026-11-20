// Label, warna, dan format waktu halaman Jejak Akses rekam medis.

import type { AksesJalur } from "@/lib/api/audit/aksesRekamMedis";

/** Jalur hak akses — teks + warna (bukan warna saja). Teks ≥ 4.5:1 di latar tint. */
export const JALUR_CFG: Record<AksesJalur, { label: string; hint: string; className: string }> = {
  unit: {
    label: "Unit kerja",
    hint: "Pasien berada di unit kerja pegawai",
    className: "bg-slate-100 text-slate-700",
  },
  penunjang: {
    label: "Penunjang",
    hint: "Petugas Lab/Rad/Farmasi membuka order lintas unit",
    className: "bg-sky-50 text-sky-800",
  },
  global: {
    label: "Hak global",
    hint: "Dibuka lewat hak superuser/role global, di luar unit kerja — perlu ditinjau",
    className: "bg-amber-50 text-amber-800",
  },
  audit: {
    label: "Membuka log",
    hint: "Membuka halaman Jejak Akses untuk pasien ini",
    className: "bg-teal-50 text-teal-800",
  },
};

const DOMAIN_LABEL: Record<string, string> = {
  kunjungan: "Data kunjungan",
  "identitas-pasien": "Identitas pasien",
  "jejak-akses:pasien": "Jejak akses pasien",
  "jejak-akses:pegawai": "Jejak akses pegawai",
  cppt: "CPPT",
  observasi: "TTV",
  diagnosa: "Diagnosa",
  prosedur: "Prosedur",
  tindakan: "Tindakan",
  resep: "Resep",
  lab: "Laboratorium",
  rad: "Radiologi",
  farmasi: "Farmasi",
  triase: "Triase",
  "asuhan-keperawatan": "Keperawatan",
  "resume-medik": "Resume medik",
  mar: "MAR",
  "care-plan": "Care plan",
  konsultasi: "Konsultasi",
  billing: "Tagihan",
};

/** "asesmen-gizi" → "Asesmen gizi" bila belum dipetakan. */
export function domainLabel(d: string): string {
  const known = DOMAIN_LABEL[d];
  if (known) return known;
  const s = d.replace(/[-_:]/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : d;
}

export const UNIT_LABEL: Record<string, string> = {
  IGD: "IGD",
  RawatJalan: "Rawat Jalan",
  RawatInap: "Rawat Inap",
};

const TZ = "Asia/Jakarta";
const fmtTanggalJam = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const fmtJam = new Intl.DateTimeFormat("id-ID", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const fmtIso = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

export const formatWaktu = (iso: string) => fmtTanggalJam.format(new Date(iso));
export const formatJam = (iso: string) => fmtJam.format(new Date(iso));

/** Tanggal hari ini (WIB) ± n hari, format YYYY-MM-DD. */
export function tanggalWib(offsetHari = 0): string {
  return fmtIso.format(new Date(Date.now() + offsetHari * 24 * 60 * 60 * 1000));
}
