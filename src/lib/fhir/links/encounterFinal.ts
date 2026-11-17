/**
 * Readiness & turunan data untuk penyelesaian Encounter (langkah S2) — fungsi MURNI, tanpa I/O.
 *  - L03 keluhan utama (CC) dari anamnesis terbaru.
 *  - L24 kondisi saat meninggalkan RS dari disposisi berlaku.
 *  - L01 `length` (lama kunjungan) dan gerbang "blokir finished" (FLOW.md §4).
 */

import { KONDISI_PULANG, lookup, type Coding, type KunjunganUnit } from "../conceptMap";
import type { LocalKeluhanUtama } from "../adapters/encounterCondition";
import type { Issue } from "./types";

/** localId resource_map — 1 per kunjungan; revisi anamnesis/disposisi = PUT resource yang sama. */
export const ccLocalId = (kunjunganId: string) => `${kunjunganId}:cc`;
export const kondisiPulangLocalId = (kunjunganId: string) => `${kunjunganId}:kondisi-pulang`;

export interface AnamnesisSrc {
  keluhanUtama: string;
  keluhanSnomedKode: string | null;
  keluhanSnomedDisplay: string | null;
  createdAt: Date;
}

/** L03 — keluhan utama siap kirim, atau Issue bila belum ada anamnesis / belum dikodekan SNOMED. */
export function keluhanUtamaOf(
  kunjunganId: string,
  a: AnamnesisSrc | null,
): { ok: true; data: LocalKeluhanUtama } | { ok: false; issue: Issue } {
  const base = { link: "L03" as const, resourceType: "Condition", localId: ccLocalId(kunjunganId) };
  if (!a) {
    return { ok: false, issue: { ...base, code: "kode-kosong", message: "Keluhan utama belum ada — isi Anamnesis" } };
  }
  if (!a.keluhanSnomedKode || !a.keluhanSnomedDisplay) {
    return {
      ok: false,
      issue: { ...base, code: "kode-kosong", message: "Keluhan utama belum dikodekan SNOMED — pilih kode keluhan di Anamnesis" },
    };
  }
  return {
    ok: true,
    data: { kode: a.keluhanSnomedKode, display: a.keluhanSnomedDisplay, teks: a.keluhanUtama, recordedAt: a.createdAt },
  };
}

export interface DisposisiSrc {
  jenis: string;
  kondisiUmum: string;
}

/**
 * L24 — kode kondisi saat meninggalkan RS. `null` = tidak berlaku (Meninggal → cukup `exp-*`;
 * Rawat_Inap → pasien tidak meninggalkan RS, mengikuti contoh resmi IGD tanpa Condition kondisi).
 */
export function kondisiPulangOf(
  kunjunganId: string,
  d: DisposisiSrc,
): { ok: true; kode: Coding; lokal: string } | { ok: false; issue: Issue } | null {
  if (d.jenis === "Meninggal" || d.jenis === "Rawat_Inap") return null;
  const lokal = d.kondisiUmum.trim();
  const base = { link: "L24" as const, resourceType: "Condition", localId: kondisiPulangLocalId(kunjunganId) };
  const kode = lookup(KONDISI_PULANG, lokal);
  if (kode === undefined) {
    return { ok: false, issue: { ...base, code: "kode-tidak-valid", message: `Kondisi pulang "${lokal}" belum punya padanan SNOMED` } };
  }
  if (kode === null) {
    return {
      ok: false,
      issue: {
        ...base, code: "kode-kosong",
        message: `Kondisi pulang tidak dinilai (form Pasien Pulang mengisi "${lokal}") — Condition kondisi tidak dikirim`,
      },
    };
  }
  return { ok: true, kode, lokal };
}

const WIB = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
const hariWib = (d: Date) => Date.parse(`${WIB.format(d)}T00:00:00Z`) / 86_400_000;

/**
 * L01 `Encounter.length` (UCUM). RI: selisih HARI kalender WIB, minimal 1 (masuk & pulang di hari yang
 * sama = 1 hari; contoh resmi RI 25→30 Des = 5 d). RJ/IGD: menit (dibulatkan).
 */
export function lamaKunjunganOf(unit: KunjunganUnit, masuk: Date, keluar: Date) {
  if (unit === "RawatInap") {
    const value = Math.max(1, hariWib(keluar) - hariWib(masuk));
    return { value, unit: "d", system: "http://unitsofmeasure.org", code: "d" };
  }
  const value = Math.max(0, Math.round((keluar.getTime() - masuk.getTime()) / 60_000));
  return { value, unit: "min", system: "http://unitsofmeasure.org", code: "min" };
}

/**
 * Gerbang "blokir finished" (FLOW.md §4): SatuSehat mensyaratkan Encounter `finished` membawa diagnosis
 * CC (keluhan utama) + diagnosis klinis. Bila belum terpenuhi → Encounter tetap dikirim `in-progress`
 * (resource fase B tetap terkirim) dan Issue `syarat-finished` tampil di konsol.
 */
export function finishedBlockers(kunjunganId: string, ccTerkirim: boolean, jumlahDiagnosis: number): Issue[] {
  const base = { link: "L01" as const, resourceType: "Encounter", localId: kunjunganId, code: "syarat-finished" as const };
  const out: Issue[] = [];
  if (!ccTerkirim) out.push({ ...base, message: "Encounter ditahan in-progress — Condition keluhan utama (CC) belum siap" });
  if (jumlahDiagnosis === 0) out.push({ ...base, message: "Encounter ditahan in-progress — belum ada diagnosis (ICD-10) terkirim" });
  return out;
}
