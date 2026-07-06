// Konfigurasi & tipe lokal wizard "Pendaftaran Kunjungan Baru".
// Step SEP mengadopsi flow dari components/registration/kunjungan/Tabs/sep.

import { AlertCircle, Stethoscope, BedDouble } from "lucide-react";
import type { TipePenjamin } from "@/lib/data";
import type { IcdOption } from "@/components/registration/kunjungan/Tabs/rujukan/rujukanTypes";

export type UnitDaftar = "IGD" | "Rawat Jalan" | "Rawat Inap";
export type CaraMasuk = "Datang Sendiri" | "Rujukan Puskesmas" | "Rujukan RS" | "Transfer Internal";
export type TriaseLevel = 1 | 2 | 3 | 4;

// `code` = label prioritas P1..P4 (header box landscape) · `name` = kategori singkat · `label` =
// teks penuh (dipakai di Review). `dot` = warna indikator level pada box landscape.
export const TRIASE_CFG: Record<
  TriaseLevel,
  { code: string; name: string; label: string; dot: string; idle: string; active: string }
> = {
  1: { code: "P1", name: "Resusitasi",  label: "P1 — Resusitasi",  dot: "bg-rose-500",   idle: "border-rose-200 bg-rose-50 text-rose-700",     active: "border-rose-600 bg-rose-600 text-white" },
  2: { code: "P2", name: "Emergent",    label: "P2 — Emergent",    dot: "bg-orange-500", idle: "border-orange-200 bg-orange-50 text-orange-700", active: "border-orange-500 bg-orange-500 text-white" },
  3: { code: "P3", name: "Urgent",      label: "P3 — Urgent",      dot: "bg-yellow-500", idle: "border-yellow-200 bg-yellow-50 text-yellow-700", active: "border-yellow-500 bg-yellow-500 text-white" },
  4: { code: "P4", name: "Semi-Urgent", label: "P4 — Semi-Urgent", dot: "bg-green-500",  idle: "border-green-200 bg-green-50 text-green-700",   active: "border-green-500 bg-green-500 text-white" },
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

// Hak kelas BPJS ("1"/"2"/"3") → RIKelas (untuk bandingkan dgn kelas kamar & basis tagihan titipan).
export const HAK_TO_RIKELAS: Record<string, "Kelas_1" | "Kelas_2" | "Kelas_3"> = {
  "1": "Kelas_1", "2": "Kelas_2", "3": "Kelas_3",
};
// Label tampilan RIKelas (dipakai dialog konfirmasi kelas + titipan).
export const RIKELAS_LABEL: Record<string, string> = {
  VIP: "VIP", Kelas_1: "Kelas 1", Kelas_2: "Kelas 2", Kelas_3: "Kelas 3",
  ICU: "ICU", HCU: "HCU", Isolasi: "Isolasi",
};

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
  /** DPJP teks-bebas (unit non-IGD). IGD memakai dpjpId/dpjpNama dari dokter ter-assign ruangan. */
  dokter: string;
  keluhan: string;
  /** Level triase IGD — opsional (boleh `null`; triase dapat ditentukan perawat IGD nanti). */
  triase: TriaseLevel | null;
  /** Poli Tujuan (Rawat Jalan) — NAMA poli (kontrak `kunjungan.poli`, dibaca worklist). */
  poli: string;
  /** Master Location id poli terpilih (Rawat_Jalan) — transient: untuk memuat dokter ter-assign
   *  poli (tidak dikirim ke server; DPJP dikirim via dpjpId). */
  poliRuanganId: string;
  asalMasuk: string;
  kelasRawat: string;
  /** Kelas KAMAR aktual dari ruangan RI terpilih (RIKelas: "Kelas_3"/"VIP"/"ICU"…). Placement fisik
   *  → jadi `kunjungan.kelas`. Diisi saat pilih ruangan (StepKunjunganRi). */
  kelasKamar: string;
  // ── IGD: ruangan layanan + DPJP ter-assign ruangan (master) ──
  /** Ruangan IGD terpilih (master Location id) → persist Kunjungan.ruanganId. */
  ruanganId: string;
  ruanganNama: string;
  /** DPJP terpilih (master Dokter id) → persist Kunjungan.dpjpId. */
  dpjpId: string;
  dpjpNama: string;
  // ── Rawat Inap: bed yang di-reserve saat daftar (ruanganId/ruanganNama dipakai bersama IGD) ──
  /** Bed terpilih (master Bed id) → reserve Kunjungan.bedId. */
  bedId: string;
  bedNama: string;
}

export interface PenjaminForm {
  tipe: TipePenjamin;
  nama: string;
  nomor: string;
  kelas: "" | "1" | "2" | "3";
  noPolis: string;
}

/** DPJP yang DITETAPKAN SPRI (admisi RI dari worklist) — untuk peringatan bila operator
 * memilih DPJP berbeda saat pendaftaran Rawat Inap. */
export interface SpriDpjpHint {
  nama: string;
  smf?: string | null;
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
