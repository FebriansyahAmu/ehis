/**
 * Gerbang & localId link pemeriksaan (fase B2, FLOW.md §3): L09 kesadaran · L11 nyeri.
 * L12 (skala risiko) memakai pemetaan master → ./skalaPemetaan.ts.
 *
 * Sumber tunggal per momen (keputusan D3): Triase IGD → `Triase.avpu`; observasi berkala → `Observation.statusKesadaran`.
 * Kesadaran dari PenilaianFisik/PemeriksaanFisik/PenilaianStatus TIDAK dikirim (hindari 3 versi yang berbeda).
 * Skor nyeri NRS: sumber tunggal = TTV (`Observation.skalaNyeri`, keputusan 2026-06-15).
 *
 * Murni (tanpa I/O) — aman diimpor client maupun server.
 */

import { KESADARAN_AVPU, KESADARAN_TTV, lookup, type Coding } from "../conceptMap";
import type { Issue } from "./types";

export const pemeriksaanLocalId = {
  /** L09 dari Triase IGD. */
  avpu: (triaseId: string) => `${triaseId}:avpu`,
  /** L09 dari baris TTV. */
  kesadaran: (observationId: string) => `${observationId}:kesadaran`,
  /**
   * L11 induk "Pain" & anggota NRS dari baris TTV. Sengaja BUKAN `:pain` — localId itu milik Observation lama
   * salah kamar (LOINC 72514-3 vital-signs, sebelum S3); tidak ditimpa diam-diam dengan kode lain (FG-100).
   */
  nyeri: (sumberId: string) => `${sumberId}:nyeri`,
  nyeriNrs: (observationId: string) => `${observationId}:nyeri-nrs`,
};

type Hasil = { ok: true; coding: Coding } | { ok: false; issue: Issue };

/** L09 — AVPU triase → SNOMED. Nilai di luar 4 pilihan form = data rusak → Issue. */
export function kesadaranAvpuOf(t: { id: string; avpu: string }): Hasil {
  const coding = lookup(KESADARAN_AVPU, t.avpu.trim());
  if (coding) return { ok: true, coding };
  return {
    ok: false,
    issue: {
      link: "L09", resourceType: "Observation", localId: pemeriksaanLocalId.avpu(t.id), code: "kode-tidak-valid",
      message: `AVPU triase "${t.avpu}" tidak dikenal — ditahan`,
    },
  };
}

/** L09 — status kesadaran TTV → SNOMED. Apatis belum punya padanan (D3) → ditahan. */
export function kesadaranTtvOf(o: { id: string; statusKesadaran: string }): Hasil {
  const localId = pemeriksaanLocalId.kesadaran(o.id);
  const known = Object.prototype.hasOwnProperty.call(KESADARAN_TTV, o.statusKesadaran);
  const coding = lookup(KESADARAN_TTV, o.statusKesadaran);
  if (coding) return { ok: true, coding };
  return {
    ok: false,
    issue: known
      ? { link: "L09", resourceType: "Observation", localId, code: "menunggu-keputusan", message: `Kesadaran "${o.statusKesadaran}" belum punya padanan SNOMED (keputusan D3) — ditahan` }
      : { link: "L09", resourceType: "Observation", localId, code: "kode-tidak-valid", message: `Kesadaran "${o.statusKesadaran}" tidak dikenal — ditahan` },
  };
}

/** L11 — skor NRS valid 0–10 (0 = tidak nyeri, nilai sah; form TTV mewajibkan isian). */
export function nrsOf(skalaNyeri: number | null | undefined): number | null {
  return skalaNyeri != null && Number.isInteger(skalaNyeri) && skalaNyeri >= 0 && skalaNyeri <= 10 ? skalaNyeri : null;
}
