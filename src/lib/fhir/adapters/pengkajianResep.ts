/**
 * Adapter L19 — Telaah resep → QuestionnaireResponse Q0007 (Pengkajian Resep). Fungsi murni.
 * Struktur = contoh Bundle resmi RI (item 1–3 sejajar + item 4 `valueReference` ke SEMUA MedicationRequest resep;
 * contoh IGD menaruh item 2/3 di dalam item 1 — tidak diikuti). Jawaban: links/telaah.ts.
 */

import { toFhirDateTime, type FhirResourceBase } from "../fhirShared";
import { Q0007, Q0007_ITEM_RESEP, type QrItem } from "../links/telaah";

type FhirRes = FhirResourceBase & Record<string, unknown>;
type Ref = { ihsId: string; nama: string };

export function toFhirPengkajianResep(
  /** `deleted` = order resep dihapus → `entered-in-error` (hanya bila pernah terkirim). */
  t: { createdAt: Date; deleted?: boolean },
  items: QrItem[],
  refs: { patient: Ref; encounterIhsId: string },
  extra: { author?: Ref; medicationRequestIhsIds: string[] },
): FhirRes {
  const resep: QrItem[] = extra.medicationRequestIhsIds.length
    ? [{
        ...Q0007_ITEM_RESEP,
        answer: extra.medicationRequestIhsIds.map((id) => ({ valueReference: { reference: `MedicationRequest/${id}` } })),
      }]
    : [];
  return {
    resourceType: "QuestionnaireResponse",
    questionnaire: Q0007,
    status: t.deleted ? "entered-in-error" : "completed",
    subject: { reference: `Patient/${refs.patient.ihsId}`, display: refs.patient.nama },
    encounter: { reference: `Encounter/${refs.encounterIhsId}` },
    authored: toFhirDateTime(t.createdAt),
    ...(extra.author ? { author: { reference: `Practitioner/${extra.author.ihsId}`, display: extra.author.nama } } : {}),
    source: { reference: `Patient/${refs.patient.ihsId}` },
    item: [...items, ...resep],
  };
}
