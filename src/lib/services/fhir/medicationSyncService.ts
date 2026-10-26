// FH5 — Sinkron rantai obat 1 kunjungan ke SatuSehat: Medication (per master Obat ber-KFA, dipakai
// ulang lintas resep) → MedicationRequest (per ResepItem) → MedicationDispense (per dispensing × item).
// Dipanggil dari encounterSyncService fase 2 (setelah Encounter ada). Idempoten per item.
//
// - Item tanpa master Obat / tanpa KFA → dilewati + catatan (KFA wajib, R12/G-5/FG-45).
// - Order resep soft-deleted yang pernah terkirim → `entered-in-error`.

import "server-only";
import type { SatuSehatMode } from "@/lib/fhir/fhirShared";
import {
  kfaProductOf, toFhirMedication, toFhirMedicationDispense, toFhirMedicationRequest,
  type KfaMapping, type MedicationRefs,
} from "@/lib/fhir/adapters/medication";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as src from "@/lib/dal/fhir/medicationSourceDal";
import * as clinicalSrc from "@/lib/dal/fhir/clinicalSourceDal";
import type { UpsertResult } from "./resourceUpsert";
import type { ResourceSink } from "./resourceSink";
import type { ClinicalSyncOutcome, SyncRef } from "./clinicalSyncService";

type Ref = { ihsId: string; nama: string };

export async function syncMedication(
  kunjunganId: string,
  ctx: {
    env: SatuSehatMode;
    orgId: string;
    unit: MedicationRefs["unit"];
    patient: Ref;
    encounterIhsId: string;
    sink: ResourceSink;
  },
): Promise<Omit<ClinicalSyncOutcome, "conditionsOk">> {
  const out: Omit<ClinicalSyncOutcome, "conditionsOk"> = { refs: [], failures: [], notes: [] };
  const resep = await src.listResep(kunjunganId);
  if (!resep.length) return out;

  const kodes = [...new Set(resep.flatMap((r) => r.items.map((i) => i.kodeObat)).filter(Boolean))];
  const depoKodes = [...new Set(resep.map((r) => r.depoKode).filter((x): x is string => !!x))];
  const pegawaiIds = [...new Set(
    resep.flatMap((r) => [r.authorPegawaiId, ...r.dispensings.map((d) => d.authorPegawaiId)]).filter((x): x is string => !!x),
  )];

  const [obat, depos, pracMaps, names, diagnosa] = await Promise.all([
    src.listObatByKode(kodes),
    src.listLocationByKode(depoKodes),
    resourceMapDal.findManyByLocal(ctx.env, "Practitioner", pegawaiIds),
    clinicalSrc.listPegawaiNama(pegawaiIds),
    clinicalSrc.listDiagnosa(kunjunganId),
  ]);
  const obatByKode = new Map(obat.map((o) => [o.kode, o]));
  const nameOf = new Map(names.map((p) => [p.id, [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(" ")]));
  const prac = new Map<string, Ref>(pracMaps.map((m) => [m.localId, { ihsId: m.ihsId, nama: nameOf.get(m.localId) ?? "" }]));
  const pracOf = (id: string | null) => (id ? prac.get(id) : undefined);
  const locMaps = await resourceMapDal.findManyByLocal(ctx.env, "Location", depos.map((d) => d.id));
  const locIhs = new Map(locMaps.map((m) => [m.localId, m.ihsId]));
  const depoOf = (kode: string | null): Ref | undefined => {
    const d = depos.find((x) => x.kode === kode);
    const ihs = d ? locIhs.get(d.id) : undefined;
    return d && ihs ? { ihsId: ihs, nama: d.nama } : undefined;
  };
  const utama = diagnosa.find((d) => !d.deletedAt && d.tipe === "Utama" && d.kodeIcd10.trim());
  const reason = utama ? { kode: utama.kodeIcd10.trim().toUpperCase(), nama: utama.namaDiagnosis } : undefined;

  const record = (resourceType: string, localId: string, r: UpsertResult | null): string | undefined => {
    if (!r) return undefined;
    if (r.ok) {
      out.refs.push({ resourceType, localId, ihsId: r.ihsId, op: r.op } satisfies SyncRef);
      return r.ihsId;
    }
    out.failures.push({ resourceType, localId, message: r.error.message, retryable: r.error.retryable });
    return undefined;
  };

  // Medication per master Obat (sekali per run).
  const medIhs = new Map<string, Ref | null>();
  const ensureMedication = async (kode: string): Promise<Ref | null> => {
    if (medIhs.has(kode)) return medIhs.get(kode)!;
    const o = obatByKode.get(kode);
    const kfa = (o?.kfa ?? null) as unknown as KfaMapping | null;
    const product = kfaProductOf(kfa);
    let ref: Ref | null = null;
    if (o && kfa && product) {
      const res = toFhirMedication({ id: o.id, namaGenerik: o.namaGenerik, namaDagang: o.namaDagang, status: o.status, kfa }, ctx.orgId);
      const ihs = res
        ? record("Medication", o.id, await ctx.sink.submit({ localType: "Medication", localId: o.id, resource: res }))
        : undefined;
      if (ihs) ref = { ihsId: ihs, nama: product.display || o.namaGenerik };
    }
    medIhs.set(kode, ref);
    return ref;
  };

  for (const r of resep) {
    const deleted = !!r.deletedAt;
    const local = { id: r.id, prioritas: r.prioritas, status: r.status, isObatPulang: r.isObatPulang, createdAt: r.createdAt, deleted };

    for (const [idx, it] of r.items.entries()) {
      const medication = await ensureMedication(it.kodeObat);
      if (!medication) {
        if (!deleted) out.notes.push(`Obat "${it.namaObat}" belum ber-KFA di master — MedicationRequest dilewati`);
        continue;
      }
      const item = { ...it, seq: idx + 1 };
      const refs: MedicationRefs = {
        orgId: ctx.orgId, unit: ctx.unit, patient: ctx.patient, encounter: { ihsId: ctx.encounterIhsId }, medication,
      };

      const mrIhs = record("MedicationRequest", it.id, await ctx.sink.submit({
        localType: "MedicationRequest", localId: it.id, allowCreate: !deleted,
        resource: toFhirMedicationRequest(local, item, refs, { requester: pracOf(r.authorPegawaiId), reason }),
      }));
      if (!mrIhs) continue; // dispense butuh MedicationRequest

      for (const d of r.dispensings) {
        const localId = `${d.id}:${it.id}`;
        record("MedicationDispense", localId, await ctx.sink.submit({
          localType: "MedicationDispense", localId, allowCreate: !deleted,
          resource: toFhirMedicationDispense(local, item, d, { ...refs, request: { ihsId: mrIhs } }, {
            performer: pracOf(d.authorPegawaiId),
            location: depoOf(r.depoKode),
          }),
        }));
      }
    }
  }
  return out;
}
