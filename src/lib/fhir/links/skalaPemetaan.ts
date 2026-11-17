/**
 * Pemetaan instrumen skala (master.SkalaInstrument.fhir_pemetaan) → kamar SatuSehat — L11 (nyeri) · L12 (risiko).
 *
 * Kolom master hanya menyimpan KUNCI di bawah; kode, kategori, tipe nilai, dan pita interpretasi ada di sini
 * (diverifikasi verbatim dari playbook IGD v5.2 §5 — asesmen nyeri & kajian risiko jatuh). Admin memilih kunci
 * di Master Skala → tidak bisa salah ketik kode. Pemetaan TIDAK berdasarkan nama instrumen (bisa diubah admin).
 * docs/fhir-mapping/L11-nyeri-to-observation.md · L12-penilaian-to-observation.md.
 *
 * Aman diimpor client maupun server (tanpa I/O) — dipakai juga oleh dropdown form Master Skala.
 */

import type { Coding } from "../conceptMap";
import type { Issue, IssueCode, LinkId } from "./types";

export const SKALA_FHIR_KEYS = [
  "morse", "humpty-dumpty", "edmonson", "wong-baker", "nrs", "nips", "flacc", "cpot", "braden", "braden-q",
  "barthel", "tidak-dikirim",
] as const;
export type SkalaFhirKey = (typeof SKALA_FHIR_KEYS)[number];

const CLINICAL_TERM = "http://terminology.kemkes.go.id/CodeSystem/clinical-term";

/** Pita interpretasi skor (batas inklusif). Skor di luar semua pita → tanpa `interpretation`. */
export interface PitaInterpretasi {
  min: number;
  max: number;
  coding: Coding;
  text: string;
}

const pita = (min: number, max: number, code: string, display: string, text: string): PitaInterpretasi => ({
  min, max, coding: { system: CLINICAL_TERM, code, display }, text,
});

export type SkalaFhirDef =
  | {
      aksi: "kirim";
      link: Extract<LinkId, "L11" | "L12">;
      label: string;
      category: "exam" | "survey";
      code: Coding;
      /** `quantity` = valueQuantity `{score}` (risiko jatuh) · `integer` = valueInteger (skala nyeri). */
      nilai: "quantity" | "integer";
      pita: PitaInterpretasi[];
      /** Skala nyeri: dikirim sebagai anggota (`hasMember`) Observation induk "Pain" 22253000. */
      nyeri: boolean;
    }
  | { aksi: "tahan"; link: Extract<LinkId, "L11" | "L12">; label: string; issue: IssueCode; alasan: string }
  | { aksi: "lewati"; label: string; alasan: string };

export const SKALA_FHIR: Record<SkalaFhirKey, SkalaFhirDef> = {
  morse: {
    aksi: "kirim", link: "L12", label: "Morse Fall Scale (risiko jatuh dewasa)", category: "exam",
    code: { system: "http://loinc.org", code: "59461-4", display: "Fall risk level [Morse Fall Scale]" },
    nilai: "quantity", nyeri: false,
    pita: [
      pita(0, 24, "OI000026", "0 - 24 (Risiko rendah)", "Risiko rendah"),
      pita(25, 44, "OI000027", "25 - 44 (Risiko sedang)", "Risiko sedang"),
      pita(45, Number.POSITIVE_INFINITY, "OI000028", "≥ 45 (Risiko tinggi)", "Risiko tinggi"),
    ],
  },
  "humpty-dumpty": {
    aksi: "kirim", link: "L12", label: "Humpty Dumpty (risiko jatuh anak)", category: "exam",
    code: { system: CLINICAL_TERM, code: "OC000035", display: "Humpty Dumpty Scale" },
    nilai: "quantity", nyeri: false,
    // Playbook: "7 - 11" & "> 12" → skor tepat 12 tidak tercakup (FG-105): dikirim tanpa interpretation.
    pita: [
      pita(7, 11, "OI000021", "7 - 11 (Risiko rendah)", "Risiko rendah"),
      pita(13, Number.POSITIVE_INFINITY, "OI000022", "> 12 (Risiko tinggi)", "Risiko tinggi"),
    ],
  },
  edmonson: {
    aksi: "kirim", link: "L12", label: "Edmonson (risiko jatuh psikiatri)", category: "exam",
    code: { system: CLINICAL_TERM, code: "OC000036", display: "Edmonson Psychiatric Fall Risk Assessment" },
    nilai: "quantity", nyeri: false,
    // Playbook: "0 - 89" & "> 90" → skor tepat 90 tidak tercakup (FG-105).
    pita: [
      pita(0, 89, "OI000023", "0 - 89 (Risiko rendah)", "Risiko rendah"),
      pita(91, Number.POSITIVE_INFINITY, "OI000024", "> 90 (Risiko tinggi)", "Risiko tinggi"),
    ],
  },
  "wong-baker": {
    aksi: "kirim", link: "L11", label: "Wong-Baker FACES (nyeri)", category: "survey",
    code: { system: "http://loinc.org", code: "38221-8", display: "Pain severity Wong-Baker FACES pain rating scale" },
    // Batas skor interpretasi nyeri (OI000019/OI000020/76948002) tidak tertulis di playbook → tanpa interpretation.
    nilai: "integer", nyeri: true, pita: [],
  },
  nrs: {
    aksi: "lewati", label: "NRS (nyeri)",
    alasan: "Skor NRS dikirim dari Tanda Vital (sumber tunggal) — penilaian skala ganda tidak dikirim",
  },
  nips: {
    aksi: "tahan", link: "L11", label: "NIPS (nyeri neonatus)", issue: "kode-kosong",
    alasan: "panel NIPS 101967-8 butuh kode LOINC + jawaban LA per item — pemetaan item belum dibangun",
  },
  flacc: {
    aksi: "tahan", link: "L11", label: "FLACC (nyeri non-verbal)", issue: "di-luar-playbook",
    alasan: "FLACC tidak ada di playbook (D5)",
  },
  cpot: {
    aksi: "tahan", link: "L11", label: "CPOT (nyeri ICU)", issue: "di-luar-playbook",
    alasan: "CPOT tidak ada di playbook (D5)",
  },
  braden: {
    aksi: "tahan", link: "L12", label: "Braden (risiko dekubitus)", issue: "menunggu-keputusan",
    alasan: "skrining dekubitus 285304000 (boolean) butuh ambang skor klinis (D13)",
  },
  "braden-q": {
    aksi: "tahan", link: "L12", label: "Braden Q (risiko dekubitus anak)", issue: "menunggu-keputusan",
    alasan: "skrining dekubitus 285304000 (boolean) butuh ambang skor klinis (D13)",
  },
  barthel: {
    aksi: "tahan", link: "L12", label: "Barthel Index (ADL)", issue: "di-luar-playbook",
    alasan: "playbook memakai WHODAS 2.0, bukan Barthel (D5)",
  },
  "tidak-dikirim": {
    aksi: "lewati", label: "Tidak dikirim ke SatuSehat",
    alasan: "Instrumen tanpa kamar di 3 modul pelayanan (mis. skrining gizi = Modul Gizi, fase lanjut)",
  },
};

/** Kunci dari DB (string bebas) → kunci valid; nilai tak dikenal/kosong → null. */
export function skalaFhirKeyOf(v: string | null | undefined): SkalaFhirKey | null {
  return v != null && (SKALA_FHIR_KEYS as readonly string[]).includes(v) ? (v as SkalaFhirKey) : null;
}

export type SkalaRencana =
  | { aksi: "kirim"; def: Extract<SkalaFhirDef, { aksi: "kirim" }> }
  | { aksi: "tahan"; issue: Issue }
  | { aksi: "lewati" };

/** Rencana kirim 1 baris PenilaianSkala berdasar pemetaan instrumennya di master. */
export function skalaRencanaOf(pemetaan: string | null | undefined, row: { id: string; skalaNama: string }): SkalaRencana {
  const key = skalaFhirKeyOf(pemetaan);
  if (!key) {
    return {
      aksi: "tahan",
      issue: {
        link: "L12", resourceType: "Observation", localId: row.id, code: "kode-kosong",
        message: `Skala "${row.skalaNama}" belum dipetakan ke SatuSehat — atur "Pemetaan SatuSehat" di Master Skala`,
      },
    };
  }
  const def = SKALA_FHIR[key];
  if (def.aksi === "kirim") return { aksi: "kirim", def };
  if (def.aksi === "lewati") return { aksi: "lewati" };
  return {
    aksi: "tahan",
    issue: { link: def.link, resourceType: "Observation", localId: row.id, code: def.issue, message: `Skala "${row.skalaNama}" ditahan — ${def.alasan}` },
  };
}

/** Pita interpretasi untuk skor; undefined bila tidak ada pita yang mencakup (mis. Humpty Dumpty 12). */
export function pitaOf(def: { pita: PitaInterpretasi[] }, skor: number): PitaInterpretasi | undefined {
  return def.pita.find((p) => skor >= p.min && skor <= p.max);
}
