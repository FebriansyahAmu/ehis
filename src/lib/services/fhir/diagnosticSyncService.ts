// FH6 — Sinkron penunjang (Lab/Rad) 1 kunjungan ke SatuSehat. Dipanggil di fase 2 encounterSyncService.
//   Lab : ServiceRequest per item tes → (bila hasil TERVALIDASI) Observation per parameter → DiagnosticReport per tes.
//   Rad : ServiceRequest per item pemeriksaan → (bila ekspertise TERVALIDASI) Observation temuan → DiagnosticReport per order.
//
// - LOINC wajib (master.lab_test/lab_parameter/rad_catalog.loinc_code) — tanpa LOINC → dilewati + catatan.
// - Peta Observation lab = `<labOrderId>:<rowKey>` (stabil lintas revisi hasil "latest wins" → PUT, bukan duplikat).
// - Order soft-deleted yang pernah terkirim → entered-in-error (SR & DR).

import "server-only";
import type { SatuSehatMode } from "@/lib/fhir/fhirShared";
import {
  toFhirDiagnosticReport, toFhirLabObservation, toFhirRadObservation, toFhirServiceRequest,
  type DiagRefs, type Loinc,
} from "@/lib/fhir/adapters/diagnostic";
import { diagnosaUtamaOf } from "@/lib/fhir/links/diagnosa";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as src from "@/lib/dal/fhir/diagnosticSourceDal";
import * as clinicalSrc from "@/lib/dal/fhir/clinicalSourceDal";
import type { UpsertResult } from "./resourceUpsert";
import type { ResourceSink, SubmitArgs } from "./resourceSink";
import type { ClinicalSyncOutcome, SyncRef } from "./clinicalSyncService";
import type { EncounterSnapshot } from "./encounterSnapshot";

type Ref = { ihsId: string; nama: string };
type Outcome = Omit<ClinicalSyncOutcome, "conditionsOk">;

/**
 * Pengaman: hasil Lab lama sempat tersimpan dengan `labTestId`/`labParameterId` NULL (FHIR-GAP FG-58,
 * sudah diperbaiki + backfill) — id tersedia di `rowKey` = "<labTestId>:<labParameterId>".
 */
function withIds<V extends { labTestId: string | null; labParameterId: string | null; rowKey: string }>(v: V): V {
  if (v.labTestId && v.labParameterId) return v;
  const [rkTest, rkParam] = v.rowKey.split(":");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return {
    ...v,
    labTestId: v.labTestId ?? (uuid.test(rkTest ?? "") ? rkTest : null),
    labParameterId: v.labParameterId ?? (uuid.test(rkParam ?? "") ? rkParam : null),
  };
}

const loincOf = (x: { loincCode: string | null; loincDisplay: string | null; nama: string } | undefined): Loinc | null =>
  x?.loincCode?.trim() ? { code: x.loincCode.trim(), display: x.loincDisplay?.trim() || x.nama } : null;

export async function syncDiagnostic(
  snap: Pick<EncounterSnapshot, "lab" | "rad" | "diagnosa">,
  ctx: { env: SatuSehatMode; refs: DiagRefs; sink: ResourceSink },
): Promise<Outcome> {
  const out: Outcome = { refs: [], failures: [], issues: [] };
  const { lab, rad, diagnosa } = snap;
  if (!lab.length && !rad.length) return out;

  // ── Referensi master & practitioner ──
  const labTestIds = [...new Set(lab.flatMap((o) => o.items.map((i) => i.labTestId)).filter((x): x is string => !!x))];
  const radIds = [...new Set(rad.flatMap((o) => o.items.map((i) => i.radCatalogId)).filter((x): x is string => !!x))];
  const validatorUserIds = [...new Set([...lab, ...rad].map((o) => o.results[0]?.validatorUserId).filter((x): x is string => !!x))];

  const [tests, params, radCat, userPeg] = await Promise.all([
    src.listLabTestLoinc(labTestIds),
    src.listLabParametersByTest(labTestIds),
    src.listRadCatalogLoinc(radIds),
    src.listUserPegawai(validatorUserIds),
  ]);
  const testById = new Map(tests.map((t) => [t.id, t]));
  const paramById = new Map(params.map((p) => [p.id, p]));
  const paramByName = new Map(params.map((p) => [`${p.testId}|${p.nama.trim().toLowerCase()}`, p]));
  const paramOf = (v: { labParameterId: string | null; labTestId: string | null; nama: string }) =>
    (v.labParameterId ? paramById.get(v.labParameterId) : undefined)
    ?? (v.labTestId ? paramByName.get(`${v.labTestId}|${v.nama.trim().toLowerCase()}`) : undefined);
  const radById = new Map(radCat.map((c) => [c.id, c]));
  const pegawaiOfUser = new Map(userPeg.map((u) => [u.id, u.pegawaiId]));

  const pegawaiIds = [...new Set([
    ...[...lab, ...rad].map((o) => o.authorPegawaiId),
    ...[...lab, ...rad].map((o) => o.results[0]?.authorPegawaiId),
    ...userPeg.map((u) => u.pegawaiId),
  ].filter((x): x is string => !!x))];
  const [pracMaps, names] = await Promise.all([
    resourceMapDal.findManyByLocal(ctx.env, "Practitioner", pegawaiIds),
    clinicalSrc.listPegawaiNama(pegawaiIds),
  ]);
  const nameOf = new Map(names.map((p) => [p.id, [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(" ")]));
  const prac = new Map<string, Ref>(pracMaps.map((m) => [m.localId, { ihsId: m.ihsId, nama: nameOf.get(m.localId) ?? "" }]));
  const pracOf = (pegawaiId: string | null | undefined) => (pegawaiId ? prac.get(pegawaiId) : undefined);
  const validatorOf = (userId: string | null | undefined) => pracOf(userId ? pegawaiOfUser.get(userId) : undefined);

  const reason = diagnosaUtamaOf(diagnosa);

  const record = (resourceType: string, localId: string, r: UpsertResult | null): string | undefined => {
    if (!r) return undefined;
    if (r.ok) {
      out.refs.push({ resourceType, localId, ihsId: r.ihsId, op: r.op } satisfies SyncRef);
      return r.ihsId;
    }
    out.failures.push({ resourceType, localId, message: r.error.message, retryable: r.error.retryable });
    return undefined;
  };
  const send = (localType: string, localId: string, resource: SubmitArgs["resource"], deleted: boolean) =>
    ctx.sink.submit({ localType, localId, resource, allowCreate: !deleted });

  // ── Lab ──
  for (const o of lab) {
    const deleted = !!o.deletedAt;
    const order = { id: o.id, prioritas: o.prioritas, status: o.status, catatan: o.catatan, createdAt: o.createdAt, deleted };
    const result = o.results[0];
    const validated = !!result?.validatedAt && !deleted;

    for (const it of o.items) {
      const loinc = loincOf(it.labTestId ? testById.get(it.labTestId) : undefined);
      if (!loinc) {
        if (!deleted) out.issues.push({ link: "L16", resourceType: "ServiceRequest", localId: it.id, code: "kode-kosong", message: `Tes lab "${it.namaTes}" belum ber-LOINC — ditahan` });
        continue;
      }
      const srIhs = record("ServiceRequest", it.id, await send("ServiceRequest", it.id,
        toFhirServiceRequest("lab", order, { id: it.id, nama: it.namaTes }, loinc, ctx.refs, { requester: pracOf(o.authorPegawaiId), reason }), deleted));
      if (!srIhs || !validated || !result) continue;

      const issued = result.validatedAt!;
      const performer = pracOf(result.authorPegawaiId);
      const obsIhs: string[] = [];
      for (const v of result.values.map(withIds).filter((x) => x.labTestId === it.labTestId && x.nilai?.trim())) {
        const p = paramOf(v);
        const pl = loincOf(p);
        const localId = `${o.id}:${v.rowKey}`;
        if (!pl) {
          out.issues.push({ link: "L16", resourceType: "Observation", localId, code: "kode-kosong", message: `Parameter "${v.nama}" (${it.namaTes}) belum ber-LOINC — hasil ditahan` });
          continue;
        }
        const ihs = record("Observation", localId, await send("Observation", localId, toFhirLabObservation(
          { nilai: v.nilai!.trim(), satuan: v.satuan, rujukanStr: v.rujukanStr, flag: v.flag, numerik: p?.tipeHasil !== "Kualitatif" },
          pl, ctx.refs, { serviceRequestIhsId: srIhs, issued, performer },
        ), false));
        if (ihs) obsIhs.push(ihs);
      }

      record("DiagnosticReport", it.id, await send("DiagnosticReport", it.id, toFhirDiagnosticReport("lab", it.id, loinc, ctx.refs, {
        deleted: false, issued, observationIhsIds: obsIhs, serviceRequestIhsIds: [srIhs],
        performer: validatorOf(result.validatorUserId) ?? performer, conclusion: result.catatanValidator,
      }), false));
    }
  }

  // ── Rad ──
  for (const o of rad) {
    const deleted = !!o.deletedAt;
    const order = { id: o.id, prioritas: o.prioritas, status: o.status, catatan: o.catatan, createdAt: o.createdAt, deleted };
    const srIhsIds: string[] = [];
    let reportLoinc: Loinc | null = null;

    for (const it of o.items) {
      const loinc = loincOf(it.radCatalogId ? radById.get(it.radCatalogId) : undefined);
      if (!loinc) {
        if (!deleted) out.issues.push({ link: "L17", resourceType: "ServiceRequest", localId: it.id, code: "kode-kosong", message: `Pemeriksaan radiologi "${it.nama}" belum ber-LOINC — ditahan` });
        continue;
      }
      reportLoinc ??= loinc;
      const srIhs = record("ServiceRequest", it.id, await send("ServiceRequest", it.id,
        toFhirServiceRequest("rad", order, { id: it.id, nama: it.nama }, loinc, ctx.refs, { requester: pracOf(o.authorPegawaiId), reason }), deleted));
      if (srIhs) srIhsIds.push(srIhs);
    }

    const result = o.results[0];
    if (deleted || !result?.validatedAt || !reportLoinc || !srIhsIds.length) continue;
    const issued = result.validatedAt;
    const performer = validatorOf(result.validatorUserId) ?? pracOf(result.authorPegawaiId);

    const obsIhs: string[] = [];
    if (result.temuan?.trim()) {
      const localId = `${o.id}:temuan`;
      const ihs = record("Observation", localId, await send("Observation", localId,
        toFhirRadObservation(result.temuan.trim(), reportLoinc, ctx.refs, { serviceRequestIhsIds: srIhsIds, issued, performer }), false));
      if (ihs) obsIhs.push(ihs);
    }
    const conclusion = [result.kesan?.trim(), result.saran?.trim() ? `Saran: ${result.saran.trim()}` : ""].filter(Boolean).join("\n");
    record("DiagnosticReport", o.id, await send("DiagnosticReport", o.id, toFhirDiagnosticReport("rad", o.id, reportLoinc, ctx.refs, {
      deleted: false, issued, observationIhsIds: obsIhs, serviceRequestIhsIds: srIhsIds, performer, conclusion: conclusion || null,
    }), false));
  }

  return out;
}
