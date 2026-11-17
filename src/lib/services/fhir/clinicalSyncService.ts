// FH4 — Sinkron resource klinis inti 1 kunjungan ke SatuSehat: Condition (Diagnosa ICD-10) ·
// Procedure (DiagnosaProsedur + TindakanMedis ber-kode ICD-9-CM) · Observation (TTV) ·
// AllergyIntolerance. Dipanggil dari encounterSyncService SETELAH Encounter ada
// (semua resource mereferensikan Encounter/{id}).
//
// - Per item idempoten via ResourceSink (noop bila hash sama; bundle/single — FH7).
// - Data terhapus (soft-delete) yang sudah pernah terkirim → PUT `entered-in-error`; yang belum → abaikan.
// - Gagal per item dikumpulkan, item lain tetap jalan. `conditionsOk=false` → Encounter TIDAK
//   di-finish (SatuSehat butuh diagnosis valid).
// - Koreksi kamar S3 (docs/fhir-mapping): L06 alergi obat = KFA 91 · L08 tanpa nyeri/GCS · L14 category +
//   reasonReference + tindakan tanpa ICD-9 = Issue. `sections` = referensi resource untuk Composition (L26).

import "server-only";
import type { SatuSehatMode } from "@/lib/fhir/fhirShared";
import {
  toFhirAllergy, toFhirCondition, toFhirProcedure, toFhirVitalObservations, type ClinicalRefs,
} from "@/lib/fhir/adapters/clinical";
import { addSectionRef, type SectionRefs } from "@/lib/fhir/adapters/composition";
import { PROCEDURE_CATEGORY, lookup } from "@/lib/fhir/conceptMap";
import type { Issue } from "@/lib/fhir/links/types";
import { diagnosaFinalOf, diagnosaUtamaOf } from "@/lib/fhir/links/diagnosa";
import { alergiKodeOf } from "@/lib/fhir/links/alergi";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as src from "@/lib/dal/fhir/clinicalSourceDal";
import type { UpsertResult } from "./resourceUpsert";
import type { ResourceSink, SubmitArgs } from "./resourceSink";
import type { EncounterSnapshot } from "./encounterSnapshot";

// `type` (bukan interface) agar assignable ke Prisma InputJsonValue (ihs_refs JSONB).
export type SyncRef = {
  resourceType: string;
  localId: string;
  ihsId: string;
  op: "create" | "update" | "noop";
};

export interface ClinicalSyncOutcome {
  refs: SyncRef[];
  failures: { resourceType: string; localId: string; message: string; retryable: boolean }[];
  /** Item ditahan gerbang readiness (tidak dikirim, tidak menggagalkan job) — FLOW.md §4. */
  issues: Issue[];
  /** Resource aktif terkirim per section resume (Composition L26). */
  sections: SectionRefs;
  conditionsOk: boolean;
}

type Ref = { ihsId: string; nama: string };

export async function syncClinical(
  snap: Pick<EncounterSnapshot, "diagnosa" | "prosedur" | "tindakan" | "ttv" | "alergi">,
  ctx: { env: SatuSehatMode; refs: ClinicalRefs; sink: ResourceSink },
): Promise<ClinicalSyncOutcome> {
  const out: ClinicalSyncOutcome = { refs: [], failures: [], issues: [], sections: {}, conditionsOk: true };
  const { diagnosa, prosedur, tindakan, ttv, alergi } = snap;

  // Practitioner (performer/recorder) — hanya yang sudah onboarding FH1; selain itu tanpa performer.
  const pegawaiIds = [...new Set(
    [...prosedur, ...tindakan, ...ttv, ...alergi].map((r) => r.authorPegawaiId).filter((x): x is string => !!x),
  )];
  const [pracMaps, names] = await Promise.all([
    resourceMapDal.findManyByLocal(ctx.env, "Practitioner", pegawaiIds),
    src.listPegawaiNama(pegawaiIds),
  ]);
  const nameOf = new Map(names.map((p) => [p.id, [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(" ")]));
  const practitioner = new Map<string, Ref>(pracMaps.map((m) => [m.localId, { ihsId: m.ihsId, nama: nameOf.get(m.localId) ?? "" }]));
  const pracOf = (id: string | null) => (id ? practitioner.get(id) : undefined);

  /** Catat hasil kirim; ihsId bila sukses. */
  const record = (resourceType: string, localId: string, r: UpsertResult | null): string | undefined => {
    if (!r) return undefined;
    if (r.ok) {
      out.refs.push({ resourceType, localId, ihsId: r.ihsId, op: r.op });
      return r.ihsId;
    }
    out.failures.push({ resourceType, localId, message: r.error.message, retryable: r.error.retryable });
    return undefined;
  };
  const send = (localType: string, localId: string, resource: SubmitArgs["resource"], deleted = false) =>
    ctx.sink.submit({ localType, localId, resource, allowCreate: !deleted });

  // ── Condition (L13) ──
  for (const d of diagnosa) {
    if (!d.kodeIcd10.trim()) {
      if (!d.deletedAt) out.issues.push({ link: "L13", resourceType: "Condition", localId: d.id, code: "kode-kosong", message: `Diagnosa "${d.namaDiagnosis}" tanpa kode ICD-10 — ditahan` });
      continue;
    }
    const r = await send("Condition", d.id, toFhirCondition({ ...d, deleted: !!d.deletedAt }, ctx.refs), !!d.deletedAt);
    record("Condition", d.id, r);
    if (r && !r.ok && !d.deletedAt) out.conditionsOk = false;
  }

  // ── Procedure (L14) ──
  // Alasan: Condition diagnosis Utama yang terkirim → reasonReference; belum terkirim → reasonCode ICD-10.
  const utama = diagnosaFinalOf(diagnosa).find((d) => d.tipe === "Utama");
  const utamaIhs = utama ? out.refs.find((x) => x.resourceType === "Condition" && x.localId === utama.id)?.ihsId : undefined;
  const reasonCondition = utama && utamaIhs ? { ihsId: utamaIhs, display: `${utama.kodeIcd10} ${utama.namaDiagnosis}` } : undefined;
  const reason = diagnosaUtamaOf(diagnosa);
  // Kategori: dari katalog tindakan; prosedur (pengodean) meminjam kategori tindakan ber-kode sama.
  const kategoriByKode = new Map(tindakan.filter((t) => !t.deletedAt && t.kode.trim()).map((t) => [t.kode.trim(), t.kategori]));
  const categoryOf = (kategori: string | undefined) => lookup(PROCEDURE_CATEGORY, kategori) ?? null;
  const kodeProsedur = new Set(prosedur.filter((p) => !p.deletedAt).map((p) => p.kode.trim()));
  const sendProcedure = async (localId: string, deleted: boolean, res: SubmitArgs["resource"]) => {
    const ihs = record("Procedure", localId, await send("Procedure", localId, res, deleted));
    if (ihs && !deleted) addSectionRef(out.sections, "tindakan", "Procedure", ihs);
  };

  for (const p of prosedur) {
    const deleted = !!p.deletedAt;
    await sendProcedure(p.id, deleted, toFhirProcedure(
      { kode: p.kode, nama: p.nama, catatan: p.catatan, waktu: p.createdAt, deleted },
      ctx.refs,
      { performer: pracOf(p.authorPegawaiId), category: categoryOf(kategoriByKode.get(p.kode.trim())), reasonCondition, reason },
    ));
  }
  for (const t of tindakan) {
    const deleted = !!t.deletedAt;
    if (!t.kode.trim()) {
      if (!deleted) out.issues.push({ link: "L14", resourceType: "Procedure", localId: t.id, code: "kode-kosong", message: `Tindakan "${t.nama}" tanpa kode ICD-9-CM — ditahan (lengkapi di Katalog Tindakan)` });
      continue;
    }
    // Kode yang sama sudah dikodekan di DiagnosaProsedur → jangan kirim ganda.
    if (!deleted && kodeProsedur.has(t.kode.trim())) continue;
    await sendProcedure(t.id, deleted, toFhirProcedure(
      { kode: t.kode, nama: t.nama, waktu: t.dilakukanPada, deleted },
      ctx.refs,
      { performer: pracOf(t.authorPegawaiId), category: categoryOf(t.kategori), reasonCondition, reason },
    ));
  }

  // ── Observation tanda vital (L08) ──
  for (const o of ttv) {
    for (const v of toFhirVitalObservations(o, ctx.refs, pracOf(o.authorPegawaiId))) {
      const localId = `${o.id}:${v.key}`;
      const ihs = record("Observation", localId, await send("Observation", localId, v.resource));
      if (ihs) addSectionRef(out.sections, "tandaVital", "Observation", ihs);
    }
  }

  // ── AllergyIntolerance (L06) ──
  for (const a of alergi) {
    const deleted = !!a.deletedAt;
    const kode = alergiKodeOf(a);
    if (!kode.ok) {
      if (!deleted) out.issues.push(kode.issue);
      continue;
    }
    const ihs = record("AllergyIntolerance", a.id, await send(
      "AllergyIntolerance", a.id, toFhirAllergy({ ...a, deleted }, kode.coding, ctx.refs, pracOf(a.authorPegawaiId)), deleted,
    ));
    if (ihs && !deleted) addSectionRef(out.sections, "alergi", "AllergyIntolerance", ihs);
  }

  return out;
}
