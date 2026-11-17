/**
 * L06 — kode AllergyIntolerance per kategori (fungsi murni). docs/fhir-mapping/L06-alergi-to-allergyintolerance.md.
 *  - Obat → KFA bahan zat aktif (BZA, prefix `91…`) dari `AsesmenAlergi.bzaKode`, system `http://sys-ids.kemkes.go.id/kfa`
 *    (contoh resmi `kfa|91000299 Aspirin`). SNOMED substansi untuk alergi obat = SALAH SISTEM.
 *  - Makanan / Lainnya → SNOMED `snomedCode` (contoh resmi `226963000` makanan, `128488006` lingkungan).
 */

import { FHIR_SYSTEM } from "../fhirShared";
import type { Coding } from "../conceptMap";
import type { Issue } from "./types";

const KFA_BZA = /^91\d{6,}$/;
const SCTID = /^[1-9]\d{5,17}$/;

export interface AlergiSrc {
  id: string;
  category: string;
  allergen: string;
  snomedCode: string | null;
  bzaKode: string | null;
}

export function alergiKodeOf(a: AlergiSrc): { ok: true; coding: Coding } | { ok: false; issue: Issue } {
  const base = { link: "L06" as const, resourceType: "AllergyIntolerance", localId: a.id };
  if (a.category === "Obat") {
    const kode = a.bzaKode?.trim() ?? "";
    if (!kode) {
      return { ok: false, issue: { ...base, code: "kode-kosong", message: `Alergi obat "${a.allergen}" tanpa kode KFA zat aktif (91…) — pilih obat dari Katalog Obat` } };
    }
    if (!KFA_BZA.test(kode)) {
      return { ok: false, issue: { ...base, code: "kode-tidak-valid", message: `Alergi obat "${a.allergen}": kode ${kode} bukan KFA zat aktif (91…)` } };
    }
    return { ok: true, coding: { system: FHIR_SYSTEM.kfa, code: kode, display: a.allergen } };
  }
  const kode = a.snomedCode?.trim() ?? "";
  if (!kode) {
    return { ok: false, issue: { ...base, code: "kode-kosong", message: `Alergi "${a.allergen}" tanpa kode SNOMED — ditahan` } };
  }
  if (!SCTID.test(kode)) {
    return { ok: false, issue: { ...base, code: "kode-tidak-valid", message: `Alergi "${a.allergen}": kode SNOMED ${kode} tidak valid` } };
  }
  return { ok: true, coding: { system: FHIR_SYSTEM.snomed, code: kode, display: a.allergen } };
}
