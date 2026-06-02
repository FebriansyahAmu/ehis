// Konfigurasi & tipe lokal wizard "Pendaftaran Kunjungan Baru".
// Step SEP mengadopsi flow dari components/registration/kunjungan/Tabs/sep.

import { AlertCircle, Stethoscope, BedDouble } from "lucide-react";
import type { TipePenjamin } from "@/lib/data";
import type { IcdOption } from "@/components/registration/kunjungan/Tabs/rujukan/rujukanTypes";

export type UnitDaftar = "IGD" | "Rawat Jalan" | "Rawat Inap";
export type CaraMasuk = "Datang Sendiri" | "Rujukan Puskesmas" | "Rujukan RS" | "Transfer Internal";
export type TriaseLevel = 1 | 2 | 3 | 4 | 5;

export const TRIASE_CFG: Record<TriaseLevel, { label: string; idle: string; active: string }> = {
  1: { label: "I — Resusitasi", idle: "border-rose-200 bg-rose-50 text-rose-700", active: "border-rose-600 bg-rose-600 text-white" },
  2: { label: "II — Emergent", idle: "border-orange-200 bg-orange-50 text-orange-700", active: "border-orange-500 bg-orange-500 text-white" },
  3: { label: "III — Urgent", idle: "border-yellow-200 bg-yellow-50 text-yellow-700", active: "border-yellow-500 bg-yellow-500 text-white" },
  4: { label: "IV — Semi-Urgent", idle: "border-green-200 bg-green-50 text-green-700", active: "border-green-500 bg-green-500 text-white" },
  5: { label: "V — Non-Urgent", idle: "border-slate-200 bg-slate-50 text-slate-600", active: "border-slate-500 bg-slate-500 text-white" },
};

export const UNIT_DAFTAR_CFG: {
  id: UnitDaftar;
  icon: typeof AlertCircle;
  label: string;
  desc: string;
  idle: string;
  active: string;
  dot: string;
}[] = [
  {
    id: "IGD",
    icon: AlertCircle,
    label: "IGD",
    desc: "Kegawatdaruratan",
    idle: "border-slate-100 hover:border-rose-200 hover:bg-rose-50/40",
    active: "border-rose-300 bg-rose-50 ring-2 ring-rose-100",
    dot: "bg-rose-500",
  },
  {
    id: "Rawat Jalan",
    icon: Stethoscope,
    label: "Rawat Jalan",
    desc: "Poli & konsultasi",
    idle: "border-slate-100 hover:border-sky-200 hover:bg-sky-50/40",
    active: "border-sky-300 bg-sky-50 ring-2 ring-sky-100",
    dot: "bg-sky-500",
  },
  {
    id: "Rawat Inap",
    icon: BedDouble,
    label: "Rawat Inap",
    desc: "Rawat di ruangan",
    idle: "border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40",
    active: "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100",
    dot: "bg-emerald-500",
  },
];

export const isBpjs = (t: TipePenjamin): boolean => t === "BPJS_Non_PBI" || t === "BPJS_PBI";

// Kategori penjamin di level UI (3 opsi). PBI/Non-PBI ditentukan dari hasil
// verifikasi kepesertaan, bukan dipilih manual. `tipe` = representatif untuk styling.
export type PenjaminKategori = "Umum" | "BPJS" | "Asuransi";

export const PENJAMIN_KATEGORI_OPTS: { value: PenjaminKategori; label: string; tipe: TipePenjamin }[] = [
  { value: "Umum", label: "Umum / Mandiri", tipe: "Umum" },
  { value: "BPJS", label: "BPJS / JKN", tipe: "BPJS_Non_PBI" },
  { value: "Asuransi", label: "Asuransi Lainnya", tipe: "Asuransi" },
];

export function kategoriOf(t: TipePenjamin): PenjaminKategori {
  if (isBpjs(t)) return "BPJS";
  if (t === "Asuransi" || t === "Jamkesda") return "Asuransi";
  return "Umum";
}

/** No. SEP dummy untuk pasien BPJS (mock — backend terbitkan via V-Claim). */
export function genSEP(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `SEP-${ymd}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

// ── State form ──────────────────────────────────────────────
export interface KunjunganForm {
  unit: UnitDaftar;
  tanggal: string;
  jam: string;
  caraMasuk: CaraMasuk;
  dokter: string;
  keluhan: string;
  triase: TriaseLevel;
  caraDatang: string;
  poli: string;
  asalMasuk: string;
  kelasRawat: string;
}

export interface PenjaminForm {
  tipe: TipePenjamin;
  nama: string;
  nomor: string;
  kelas: "" | "1" | "2" | "3";
  noPolis: string;
}

export type WizardStepId = "kunjungan" | "penjamin" | "rujukan" | "sep" | "review";
export interface WizardStep { id: WizardStepId; label: string }

// Rujukan untuk SEP Rawat Jalan BPJS. `noRujukan` + `diagnosa` = data inti.
// source "masuk" = rujukan FKTP via BPJS · "kontrol" = kontrol pasca ranap (No. SEP terakhir).
export interface RujukanPick {
  source: "masuk" | "kontrol";
  noRujukan: string;
  diagnosa: IcdOption | null;
}

// ── Style tokens bersama antar-step ─────────────────────────
export const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
export const labelCls =
  "mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400";
