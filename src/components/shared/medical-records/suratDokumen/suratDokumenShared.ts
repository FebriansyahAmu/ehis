// ── Types ─────────────────────────────────────────────────

export type JenisSurat = "ket-sakit" | "surat-kontrol" | "ket-sehat" | "resume-medis";

export interface SuratPatient {
  noRM:              string;
  name:              string;
  age:               number;
  gender:            "L" | "P";
  tanggalLahir:      string;
  dokter:            string;
  diagnosa?:         string;
  tanggalKunjungan?: string;
}

export interface FormField {
  id:          string;
  label:       string;
  type:        "text" | "date" | "textarea" | "select";
  placeholder?: string;
  options?:    string[];
  required?:   boolean;
  rows?:       number;
  autoFill?:   keyof SuratPatient;
}

export interface SuratConfig {
  label:       string;
  description: string;
  colorBase:   "rose" | "sky" | "emerald" | "indigo";
  fields:      FormField[];
}

export interface SuratDibuat {
  id:           string;
  jenis:        JenisSurat;
  nomorSurat:   string;
  tanggalBuat:  string;
  data:         Record<string, string>;
  dokterPembuat: string;
}

// ── Config ────────────────────────────────────────────────

export const SURAT_CONFIG: Record<JenisSurat, SuratConfig> = {
  "ket-sakit": {
    label:       "Surat Keterangan Sakit",
    description: "Keterangan tidak dapat bekerja / sekolah",
    colorBase:   "rose",
    fields: [
      { id: "mulai",    label: "Tanggal Mulai Sakit",   type: "date",     required: true, autoFill: "tanggalKunjungan" },
      { id: "selesai",  label: "Tanggal Selesai Sakit", type: "date",     required: true },
      { id: "diagnosa", label: "Diagnosa",               type: "text",     required: true, placeholder: "Diagnosa utama", autoFill: "diagnosa" },
      { id: "catatan",  label: "Keterangan Tambahan",    type: "textarea", placeholder: "Catatan tambahan (opsional)", rows: 3 },
    ],
  },
  "surat-kontrol": {
    label:       "Surat Kontrol",
    description: "Jadwal kunjungan ulang / follow-up",
    colorBase:   "sky",
    fields: [
      { id: "tanggalKontrol", label: "Tanggal Kontrol",     type: "date",   required: true },
      { id: "poli",           label: "Poli / Unit Tujuan",  type: "select", required: true,
        options: ["Poli Jantung","Poli Penyakit Dalam","Poli Paru","Poli Bedah","Poli Saraf","Poli Anak","Poli THT","Poli Mata","Poli Kebidanan","Poli Umum"] },
      { id: "dokterTujuan",   label: "Dokter yang Dituju",  type: "text",   placeholder: "Nama dokter (opsional)" },
      { id: "catatan",        label: "Instruksi / Catatan", type: "textarea", placeholder: "Instruksi untuk kunjungan berikutnya", rows: 3 },
    ],
  },
  "ket-sehat": {
    label:       "Surat Keterangan Sehat",
    description: "Pernyataan kondisi kesehatan baik",
    colorBase:   "emerald",
    fields: [
      { id: "tujuan",  label: "Tujuan Surat",           type: "select",   required: true,
        options: ["Melamar Pekerjaan","Keperluan Sekolah","Keperluan Administrasi","Keperluan Olahraga","Keperluan SIM / SKCK","Lainnya"] },
      { id: "hasil",   label: "Hasil Pemeriksaan Umum", type: "textarea", required: true, placeholder: "Pasien dalam keadaan sehat secara umum...", rows: 3 },
      { id: "catatan", label: "Catatan Tambahan",        type: "textarea", placeholder: "Catatan lain (opsional)", rows: 2 },
    ],
  },
  "resume-medis": {
    label:       "Resume Medis Kunjungan",
    description: "Ringkasan kunjungan untuk rujukan / arsip",
    colorBase:   "indigo",
    fields: [
      { id: "anamnesis",   label: "Anamnesis Singkat",   type: "textarea", required: true, placeholder: "Keluhan utama dan riwayat perjalanan penyakit...", rows: 3 },
      { id: "diagnosa",    label: "Diagnosa",             type: "text",     required: true, placeholder: "Diagnosa utama kunjungan ini", autoFill: "diagnosa" },
      { id: "tatalaksana", label: "Tatalaksana",          type: "textarea", placeholder: "Tindakan dan pengobatan yang diberikan...", rows: 3 },
      { id: "obat",        label: "Obat yang Diberikan", type: "textarea", placeholder: "Daftar obat pulang (nama, dosis, frekuensi)...", rows: 2 },
      { id: "saran",       label: "Saran & Anjuran",     type: "textarea", placeholder: "Anjuran dokter kepada pasien...", rows: 2 },
    ],
  },
};

// ── Color map ─────────────────────────────────────────────

export const COLOR_MAP: Record<SuratConfig["colorBase"], {
  cardInactive: string; cardActive: string;
  iconInactive: string; iconActive: string;
  textActive:   string; subActive:  string;
  ring:         string; btn:        string;
  badge:        string; chipBg:     string;
}> = {
  rose: {
    cardInactive: "bg-white border-slate-200 hover:border-rose-300 hover:shadow-rose-100",
    cardActive:   "bg-rose-600 border-rose-600 shadow-rose-200",
    iconInactive: "bg-rose-50 text-rose-500",
    iconActive:   "bg-rose-500 text-white",
    textActive:   "text-white", subActive: "text-rose-100",
    ring: "focus:ring-rose-400", btn: "bg-rose-600 hover:bg-rose-700",
    badge: "bg-rose-100 text-rose-700 ring-rose-200", chipBg: "bg-rose-50",
  },
  sky: {
    cardInactive: "bg-white border-slate-200 hover:border-sky-300 hover:shadow-sky-100",
    cardActive:   "bg-sky-600 border-sky-600 shadow-sky-200",
    iconInactive: "bg-sky-50 text-sky-500",
    iconActive:   "bg-sky-500 text-white",
    textActive:   "text-white", subActive: "text-sky-100",
    ring: "focus:ring-sky-400", btn: "bg-sky-600 hover:bg-sky-700",
    badge: "bg-sky-100 text-sky-700 ring-sky-200", chipBg: "bg-sky-50",
  },
  emerald: {
    cardInactive: "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-emerald-100",
    cardActive:   "bg-emerald-600 border-emerald-600 shadow-emerald-200",
    iconInactive: "bg-emerald-50 text-emerald-500",
    iconActive:   "bg-emerald-500 text-white",
    textActive:   "text-white", subActive: "text-emerald-100",
    ring: "focus:ring-emerald-400", btn: "bg-emerald-600 hover:bg-emerald-700",
    badge: "bg-emerald-100 text-emerald-700 ring-emerald-200", chipBg: "bg-emerald-50",
  },
  indigo: {
    cardInactive: "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-indigo-100",
    cardActive:   "bg-indigo-600 border-indigo-600 shadow-indigo-200",
    iconInactive: "bg-indigo-50 text-indigo-500",
    iconActive:   "bg-indigo-500 text-white",
    textActive:   "text-white", subActive: "text-indigo-100",
    ring: "focus:ring-indigo-400", btn: "bg-indigo-600 hover:bg-indigo-700",
    badge: "bg-indigo-100 text-indigo-700 ring-indigo-200", chipBg: "bg-indigo-50",
  },
};

// ── Helpers ────────────────────────────────────────────────

export function genSuratId(): string {
  return `surat-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

export function genNomorSurat(jenis: JenisSurat): string {
  const prefix: Record<JenisSurat, string> = {
    "ket-sakit":     "SKS",
    "surat-kontrol": "SKT",
    "ket-sehat":     "SKH",
    "resume-medis":  "RMK",
  };
  const d = new Date();
  return `${prefix[jenis]}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(Date.now()).slice(-4)}`;
}

export function fmtTanggalSurat(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}
