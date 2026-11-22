// State form CPPT: tipe, nilai kosong, konversi entri↔form, payload API, templat, validasi, draf.

import type { CPPTEntry, CPPTJenis, CPPTProfesi, TbakMetode } from "@/lib/data";
import type { CpptEntryDTO, CpptItemInput } from "@/lib/api/cppt/cppt";
import { areasFor, type CPPTFieldKey } from "../cpptShared";

export interface CPPTForm {
  profesi: CPPTProfesi;
  penulis: string;
  jenis: CPPTJenis;
  subjektif: string;
  objektif: string;
  asesmen: string;
  planning: string;
  instruksi: string;
  tbakPemberi: string;
  tbakMetode: TbakMetode;
  tbakTulis: boolean;
  tbakBaca: boolean;
  tbakKonfirmasi: boolean;
}

export const EMPTY_FORM: CPPTForm = {
  profesi: "Dokter", penulis: "", jenis: "SOAP",
  subjektif: "", objektif: "", asesmen: "", planning: "", instruksi: "",
  tbakPemberi: "", tbakMetode: "Telepon", tbakTulis: false, tbakBaca: false, tbakKonfirmasi: false,
};

export function entryToForm(e: CPPTEntry): CPPTForm {
  return {
    profesi: e.profesi, penulis: e.penulis, jenis: e.jenisCatatan ?? "SOAP",
    subjektif: e.subjektif ?? "", objektif: e.objektif ?? "",
    asesmen: e.asesmen ?? "", planning: e.planning ?? "",
    instruksi: e.instruksi ?? "",
    tbakPemberi: e.tbakPemberi ?? "", tbakMetode: e.tbakMetode ?? "Telepon",
    tbakTulis: e.tbakTulis ?? false, tbakBaca: e.tbakBaca ?? false, tbakKonfirmasi: e.tbakKonfirmasi ?? false,
  };
}

// CpptEntryDTO mirror CPPTEntry 1:1 (nama field & union identik) → passthrough.
export const dtoToEntry = (d: CpptEntryDTO): CPPTEntry => ({ ...d });

/**
 * Payload API. Mode "update": bagian naratif yang dikosongkan dikirim "" (bukan undefined) — server
 * menggabung `input ?? lama`, jadi undefined berarti "biarkan isi lama" dan bagian tak bisa dihapus.
 */
export function buildPayload(form: CPPTForm, perluVerifikasi: boolean, mode: "create" | "update" = "create"): CpptItemInput {
  const isTbak = form.jenis === "TBAK";
  const t = (v: string) => (mode === "update" ? v.trim() : v.trim() || undefined);
  return {
    profesi: form.profesi,
    jenisCatatan: form.jenis,
    subjektif: isTbak ? undefined : t(form.subjektif),
    objektif: isTbak ? undefined : t(form.objektif),
    asesmen: isTbak ? undefined : t(form.asesmen),
    planning: isTbak ? undefined : t(form.planning),
    instruksi: t(form.instruksi),
    tbakPemberi: isTbak ? t(form.tbakPemberi) : undefined,
    tbakMetode: isTbak ? form.tbakMetode : undefined,
    tbakTulis: isTbak ? form.tbakTulis : undefined,
    tbakBaca: isTbak ? form.tbakBaca : undefined,
    tbakKonfirmasi: isTbak ? form.tbakKonfirmasi : undefined,
    perluVerifikasi,
  };
}

/** Bagian naratif yang berlaku untuk jenis ini (SOAP 5, SBAR 4). */
export const narasiKeys = (jenis: CPPTJenis): CPPTFieldKey[] => areasFor(jenis).map((a) => a.key);

/** Ada isi yang layak disimpan sebagai draf? */
export function hasContent(f: CPPTForm): boolean {
  return !!(
    f.subjektif.trim() || f.objektif.trim() || f.asesmen.trim() || f.planning.trim() ||
    f.instruksi.trim() || f.tbakPemberi.trim()
  );
}

// ── Validasi (dijalankan saat Simpan, bukan per ketikan) ──

export type CpptErrorKey = "penulis" | "narasi" | "tbakPemberi" | "instruksi" | "tbakSteps";
export type CpptErrors = Partial<Record<CpptErrorKey, string>>;

export function validateForm(f: CPPTForm, needPenulis: boolean): CpptErrors {
  const e: CpptErrors = {};
  if (needPenulis && !f.penulis.trim()) e.penulis = "Isi nama penulis.";
  if (f.jenis === "TBAK") {
    if (!f.tbakPemberi.trim()) e.tbakPemberi = "Isi nama pemberi instruksi.";
    if (!f.instruksi.trim()) e.instruksi = "Tuliskan isi instruksi yang diterima.";
    if (!(f.tbakTulis && f.tbakBaca && f.tbakKonfirmasi)) e.tbakSteps = "Centang ketiga langkah Tulis–Baca–Konfirmasi.";
  } else if (!narasiKeys(f.jenis).some((k) => f[k].trim())) {
    e.narasi = "Isi minimal satu bagian catatan.";
  }
  return e;
}

// ── Profesi default dari role login ──

const ROLE_PROFESI: [RegExp, CPPTProfesi][] = [
  [/dokter/i, "Dokter"],
  [/perawat/i, "Perawat"],
  [/bidan/i, "Bidan"],
  [/apoteker|farmasi/i, "Apoteker"],
  [/gizi|nutrisi/i, "Gizi"],
  [/fisio/i, "Fisioterapi"],
];

export function profesiFromRoles(roles: readonly string[]): CPPTProfesi | null {
  for (const [re, p] of ROLE_PROFESI) if (roles.some((r) => re.test(r))) return p;
  return null;
}

// ── Templat ──

export interface CPPTTemplate {
  id: string;
  label: string;
  jenis: Exclude<CPPTJenis, "TBAK">;
  /** Profesi yang lazim memakai (petunjuk saja — tidak mengubah profesi form). */
  profesi: CPPTProfesi;
  fields: Partial<Pick<CPPTForm, CPPTFieldKey>>;
}

export const CPPT_TEMPLATES: CPPTTemplate[] = [
  { id: "visite", label: "Visite harian", jenis: "SOAP", profesi: "Dokter", fields: {
    subjektif: "Pasien mengeluh ..., riwayat ...",
    objektif:  "KU: baik. TD: .../... mmHg, N: .../mnt, S: ...°C, SpO₂: ...%.",
    asesmen:   "..., kondisi membaik/stabil.",
    planning:  "Lanjutkan terapi ...",
    instruksi: "Monitor TTV tiap ... jam.",
  }},
  { id: "pulang", label: "Siap pulang", jenis: "SOAP", profesi: "Dokter", fields: {
    subjektif: "Pasien merasa lebih baik, keluhan berkurang signifikan.",
    objektif:  "TTV dalam batas normal. Pemeriksaan fisik tanpa kelainan akut.",
    asesmen:   "Kondisi klinis stabil, layak dipulangkan.",
    planning:  "Obat pulang: ..., kontrol poli ... dalam ... hari.",
    instruksi: "Edukasi pasien dan keluarga tanda bahaya, anjuran diet dan aktivitas.",
  }},
  { id: "shift", label: "Laporan shift", jenis: "SOAP", profesi: "Perawat", fields: {
    objektif:  "TTV jam ...: TD .../..., N: ..., S: ...°C, SpO₂: ...%. Input/output: ...",
    asesmen:   "Kondisi pasien ..., tidak ada / ada kejadian luar biasa: ...",
    instruksi: "Observasi tiap ... jam. Hubungi DPJP bila ...",
  }},
  { id: "edukasi", label: "Edukasi pasien", jenis: "SOAP", profesi: "Perawat", fields: {
    subjektif: "Pasien/keluarga menyatakan paham/belum paham mengenai ...",
    asesmen:   "Edukasi diberikan mengenai: ..., diet, aktivitas, tanda bahaya.",
    instruksi: "Evaluasi ulang pemahaman pasien pada kunjungan berikutnya.",
  }},
  { id: "lapor-dpjp", label: "Lapor perburukan ke DPJP", jenis: "SBAR", profesi: "Perawat", fields: {
    subjektif: "Pasien ... (umur, RM) mengalami ... sejak jam ...",
    objektif:  "Dirawat dengan ..., terapi berjalan ... TTV terakhir: ...",
    asesmen:   "Kondisi cenderung memburuk: ...",
    planning:  "Mohon advis / visite segera untuk ...",
  }},
  { id: "telaah-obat", label: "Telaah / konseling obat", jenis: "SOAP", profesi: "Apoteker", fields: {
    subjektif: "Pasien mendapat terapi ..., keluhan terkait obat: ...",
    objektif:  "Resep: ... Hasil lab terkait: ...",
    asesmen:   "Masalah terkait obat: interaksi / dosis / duplikasi / efek samping ...",
    planning:  "Rekomendasi: ...",
  }},
];

/** Isi templat hanya ke bagian yang MASIH KOSONG (tulisan operator tidak ditimpa). */
export function applyTemplate(f: CPPTForm, t: CPPTTemplate): { form: CPPTForm; filled: number } {
  const next = { ...f, jenis: t.jenis };
  let filled = 0;
  for (const [k, v] of Object.entries(t.fields) as [CPPTFieldKey, string][]) {
    if (!next[k].trim()) { next[k] = v; filled += 1; }
  }
  return { form: next, filled };
}

// ── Draf (memori proses saja) ──
// Draf catatan yang belum disimpan bertahan saat pindah tab rekam medis, tapi SENGAJA tidak ditulis ke
// localStorage/sessionStorage: isinya data klinis dan PC di ruang perawatan dipakai bergantian.
// Hilang saat halaman dimuat ulang / logout.

const DRAFTS = new Map<string, CPPTForm>();

export const draftStore = {
  get: (key: string) => DRAFTS.get(key) ?? null,
  set: (key: string, f: CPPTForm) => { if (hasContent(f)) DRAFTS.set(key, f); else DRAFTS.delete(key); },
  clear: (key: string) => { DRAFTS.delete(key); },
};
