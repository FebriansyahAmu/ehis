// FH4 — Sinkron resource klinis inti 1 kunjungan ke SatuSehat: Condition (Diagnosa ICD-10) ·
// Procedure (DiagnosaProsedur + TindakanMedis ber-kode ICD-9-CM) · Observation (TTV) ·
// AllergyIntolerance (ber-SNOMED). Dipanggil dari encounterSyncService SETELAH Encounter ada
// (semua resource mereferensikan Encounter/{id}).
//
// - Per item idempoten (upsertClinicalResource: noop bila hash sama).
// - Data terhapus (soft-delete) yang sudah pernah terkirim → PUT `entered-in-error`; yang belum → abaikan.
// - Gagal per item dikumpulkan, item lain tetap jalan. `conditionsOk=false` → Encounter TIDAK
//   di-finish (SatuSehat butuh diagnosis valid).

import "server-only";
import type { SatuSehatMode } from "@/lib/fhir/fhirShared";
import {
  toFhirAllergy, toFhirCondition, toFhirProcedure, toFhirVitalObservations, type ClinicalRefs,
} from "@/lib/fhir/adapters/clinical";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as src from "@/lib/dal/fhir/clinicalSourceDal";
import { upsertClinicalResource, type UpsertResult } from "./resourceUpsert";
import type { FhirRequestAudit } from "./transport";

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
  notes: string[];
  conditionsOk: boolean;
}

type Ref = { ihsId: string; nama: string };

export async function syncClinical(
  kunjunganId: string,
  ctx: { env: SatuSehatMode; refs: ClinicalRefs; audit: Pick<FhirRequestAudit, "actor" | "actorRole"> },
): Promise<ClinicalSyncOutcome> {
  const out: ClinicalSyncOutcome = { refs: [], failures: [], notes: [], conditionsOk: true };
  const [diagnosa, prosedur, tindakan, ttv, alergi] = await Promise.all([
    src.listDiagnosa(kunjunganId),
    src.listProsedur(kunjunganId),
    src.listTindakanBerkode(kunjunganId),
    src.listTtv(kunjunganId),
    src.listAlergi(kunjunganId),
  ]);

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

  const record = (resourceType: string, localId: string, r: UpsertResult | null) => {
    if (!r) return;
    if (r.ok) out.refs.push({ resourceType, localId, ihsId: r.ihsId, op: r.op });
    else out.failures.push({ resourceType, localId, message: r.error.message, retryable: r.error.retryable });
  };
  const send = (localType: string, localId: string, resource: Parameters<typeof upsertClinicalResource>[0]["resource"], deleted = false) =>
    upsertClinicalResource({ env: ctx.env, localType, localId, resource, audit: ctx.audit, allowCreate: !deleted });

  // ── Condition ──
  for (const d of diagnosa) {
    if (!d.kodeIcd10.trim()) {
      if (!d.deletedAt) out.notes.push(`Diagnosa "${d.namaDiagnosis}" tanpa kode ICD-10 — dilewati`);
      continue;
    }
    const r = await send("Condition", d.id, toFhirCondition({ ...d, deleted: !!d.deletedAt }, ctx.refs), !!d.deletedAt);
    record("Condition", d.id, r);
    if (r && !r.ok && !d.deletedAt) out.conditionsOk = false;
  }

  // ── Procedure ──
  const utama = diagnosa.find((d) => !d.deletedAt && d.tipe === "Utama" && d.kodeIcd10.trim());
  const reason = utama ? { kode: utama.kodeIcd10.trim().toUpperCase(), nama: utama.namaDiagnosis } : undefined;
  const kodeProsedur = new Set(prosedur.filter((p) => !p.deletedAt).map((p) => p.kode.trim()));

  for (const p of prosedur) {
    const deleted = !!p.deletedAt;
    const res = toFhirProcedure(
      { kode: p.kode, nama: p.nama, catatan: p.catatan, waktu: p.createdAt, deleted },
      ctx.refs,
      { performer: pracOf(p.authorPegawaiId), reason },
    );
    record("Procedure", p.id, await send("Procedure", p.id, res, deleted));
  }
  for (const t of tindakan) {
    const deleted = !!t.deletedAt;
    // Kode yang sama sudah dikodekan di DiagnosaProsedur → jangan kirim ganda.
    if (!deleted && kodeProsedur.has(t.kode.trim())) continue;
    const res = toFhirProcedure(
      { kode: t.kode, nama: t.nama, waktu: t.dilakukanPada, deleted },
      ctx.refs,
      { performer: pracOf(t.authorPegawaiId), reason },
    );
    record("Procedure", t.id, await send("Procedure", t.id, res, deleted));
  }

  // ── Observation (TTV) ──
  for (const o of ttv) {
    for (const v of toFhirVitalObservations(o, ctx.refs, pracOf(o.authorPegawaiId))) {
      const localId = `${o.id}:${v.key}`;
      record("Observation", localId, await send("Observation", localId, v.resource));
    }
  }

  // ── AllergyIntolerance ──
  for (const a of alergi) {
    if (!a.snomedCode?.trim()) {
      if (!a.deletedAt) out.notes.push(`Alergi "${a.allergen}" tanpa kode SNOMED — dilewati`);
      continue;
    }
    const deleted = !!a.deletedAt;
    const res = toFhirAllergy(
      { ...a, snomedCode: a.snomedCode.trim(), deleted },
      ctx.refs,
      pracOf(a.authorPegawaiId),
    );
    record("AllergyIntolerance", a.id, await send("AllergyIntolerance", a.id, res, deleted));
  }

  return out;
}
