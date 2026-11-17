// FH5 — Sinkron rantai obat 1 kunjungan ke SatuSehat. Pola D6 (S3, docs/fhir-mapping/L18 · L20):
//   paket Request  : Medication (`<resepItemId>:med`) + MedicationRequest (`<resepItemId>`)
//   paket Dispense : Medication (`<dispensingId>:<resepItemId>:med`) + MedicationDispense (`<dispensingId>:<resepItemId>`)
// Medication TIDAK lagi dipakai ulang lintas resep (contoh resmi `Medication_forRequest` / `_forDispense`).
// Dipanggil dari encounterSyncService fase B (setelah Encounter ada). Idempoten per item.
//
// - Item tanpa master Obat / tanpa KFA → Issue L18 (KFA wajib, R12/G-5/FG-45).
// - Dispense hanya untuk obat ber-KFA aktual `93…`; obat ber-KFA virtual `92…` saja → Issue L20.
// - Order resep soft-deleted yang pernah terkirim → `entered-in-error` (Medication paket ikut).
// - `sections` = MedicationRequest/Dispense/Administration aktif untuk Composition (obat saat kunjungan / obat pulang).
// - S4b: L19 telaah → QuestionnaireResponse Q0007 (item 4 = semua MedicationRequest resep yang terkirim) ·
//   L21 MAR → MedicationAdministration per slot (Medication contained, setelah MedicationRequest item terkirim).

import "server-only";
import type { SatuSehatMode } from "@/lib/fhir/fhirShared";
import {
  kfaProductOf, toFhirMedication, toFhirMedicationAdministration, toFhirMedicationDispense, toFhirMedicationRequest,
  type KfaMapping, type LocalObat, type MedicationRefs,
} from "@/lib/fhir/adapters/medication";
import { toFhirPengkajianResep } from "@/lib/fhir/adapters/pengkajianResep";
import { addSectionRef } from "@/lib/fhir/adapters/composition";
import { diagnosaUtamaOf } from "@/lib/fhir/links/diagnosa";
import { doseOf, marLocalId, marRencanaOf, marSlotsOf } from "@/lib/fhir/links/mar";
import { q0007ItemsOf } from "@/lib/fhir/links/telaah";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as src from "@/lib/dal/fhir/medicationSourceDal";
import * as clinicalSrc from "@/lib/dal/fhir/clinicalSourceDal";
import type { UpsertResult } from "./resourceUpsert";
import type { ResourceSink, SubmitArgs } from "./resourceSink";
import type { ClinicalSyncOutcome, SyncRef } from "./clinicalSyncService";
import type { EncounterSnapshot } from "./encounterSnapshot";

type Ref = { ihsId: string; nama: string };

export async function syncMedication(
  snap: Pick<EncounterSnapshot, "resep" | "diagnosa" | "mar">,
  ctx: {
    env: SatuSehatMode;
    orgId: string;
    unit: MedicationRefs["unit"];
    patient: Ref;
    encounterIhsId: string;
    sink: ResourceSink;
  },
): Promise<Omit<ClinicalSyncOutcome, "conditionsOk">> {
  const out: Omit<ClinicalSyncOutcome, "conditionsOk"> = { refs: [], failures: [], issues: [], sections: {} };
  const { resep, diagnosa } = snap;
  if (!resep.length) return out;

  // L21 — slot MAR (entri terakhir per resepItem × tanggal × shift), dikelompokkan per item resep.
  const marByItem = new Map<string, EncounterSnapshot["mar"]>();
  for (const s of marSlotsOf(snap.mar)) marByItem.set(s.resepItemId, [...(marByItem.get(s.resepItemId) ?? []), s]);

  const kodes = [...new Set(resep.flatMap((r) => r.items.map((i) => i.kodeObat)).filter(Boolean))];
  const depoKodes = [...new Set(resep.map((r) => r.depoKode).filter((x): x is string => !!x))];
  const pegawaiIds = [...new Set(
    [
      ...resep.flatMap((r) => [r.authorPegawaiId, ...r.dispensings.map((d) => d.authorPegawaiId), ...r.telaahs.map((t) => t.authorPegawaiId)]),
      ...snap.mar.map((m) => m.authorPegawaiId),
    ].filter((x): x is string => !!x),
  )];

  const [obat, depos, pracMaps, names] = await Promise.all([
    src.listObatByKode(kodes),
    src.listLocationByKode(depoKodes),
    resourceMapDal.findManyByLocal(ctx.env, "Practitioner", pegawaiIds),
    clinicalSrc.listPegawaiNama(pegawaiIds),
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
  const submit = async (localType: string, localId: string, resource: SubmitArgs["resource"], deleted: boolean) =>
    record(localType, localId, await ctx.sink.submit({ localType, localId, resource, allowCreate: !deleted }));

  for (const r of resep) {
    const deleted = !!r.deletedAt;
    const local = { id: r.id, prioritas: r.prioritas, status: r.status, isObatPulang: r.isObatPulang, createdAt: r.createdAt, deleted };
    const section = r.isObatPulang ? "obatPulang" : "obat";
    const mrIhsResep: string[] = []; // L19 item 4 — MedicationRequest resep ini yang terkirim

    for (const [idx, it] of r.items.entries()) {
      const o = obatByKode.get(it.kodeObat);
      const kfa = (o?.kfa ?? null) as unknown as KfaMapping | null;
      const reqProduct = kfaProductOf(kfa, "request");
      if (!o || !kfa || !reqProduct) {
        if (!deleted) {
          out.issues.push({ link: "L18", resourceType: "MedicationRequest", localId: it.id, code: "kode-kosong", message: `Obat "${it.namaObat}" belum ber-KFA (92…/93…) di master — MedicationRequest ditahan` });
          if (marByItem.get(it.id)?.length) {
            out.issues.push({ link: "L21", resourceType: "MedicationAdministration", localId: `${it.id}:mar`, code: "kode-kosong", message: `Pemberian obat "${it.namaObat}" ditahan — MedicationRequest belum terkirim (obat belum ber-KFA, lihat L18)` });
          }
        }
        continue;
      }
      const obatLocal: LocalObat = { id: o.id, namaGenerik: o.namaGenerik, namaDagang: o.namaDagang, status: o.status, kfa };
      const item = { ...it, seq: idx + 1 };

      // ── Paket Request ──
      const reqMedId = `${it.id}:med`;
      const reqMed = toFhirMedication(obatLocal, ctx.orgId, { identifier: `${r.id}-${item.seq}`, untuk: "request", deleted });
      const reqMedIhs = reqMed ? await submit("Medication", reqMedId, reqMed, deleted) : undefined;
      if (!reqMedIhs) continue;
      const refs: MedicationRefs = {
        orgId: ctx.orgId, unit: ctx.unit, patient: ctx.patient, encounter: { ihsId: ctx.encounterIhsId },
        medication: { ihsId: reqMedIhs, nama: reqProduct.display || o.namaGenerik },
      };
      const mrIhs = await submit("MedicationRequest", it.id,
        toFhirMedicationRequest(local, item, refs, { requester: pracOf(r.authorPegawaiId), reason }), deleted);
      if (!mrIhs) continue; // dispense & administration butuh MedicationRequest
      if (!deleted) {
        addSectionRef(out.sections, section, "MedicationRequest", mrIhs);
        mrIhsResep.push(mrIhs);
      }

      // ── L21 Pemberian obat (MAR) — 1 MedicationAdministration per slot, Medication contained ──
      for (const slot of marByItem.get(it.id) ?? []) {
        const localId = marLocalId(slot);
        const rencana = marRencanaOf(slot);
        if (rencana.aksi === "tahan") {
          if (!deleted) out.issues.push(rencana.issue);
          continue;
        }
        // Belum diberikan (Ditunda) / order dihapus → hanya tarik bila slot pernah terkirim (allowCreate false).
        const plan = rencana.aksi === "kirim" && !deleted
          ? { status: rencana.status, alasan: rencana.alasan, waktu: rencana.waktu }
          : { status: "entered-in-error" as const, waktu: rencana.waktu };
        const tarik = plan.status === "entered-in-error";
        const med = toFhirMedication(obatLocal, ctx.orgId, { identifier: `mar-${localId.split(":").join("-")}`, untuk: "request", deleted: tarik });
        if (!med) continue;
        const maIhs = await submit("MedicationAdministration", localId, toFhirMedicationAdministration(
          slot,
          plan,
          med,
          { ...refs, request: { ihsId: mrIhs } },
          { performer: pracOf(slot.authorPegawaiId), dose: doseOf(slot.dosis) },
        ), tarik);
        if (maIhs && !tarik) addSectionRef(out.sections, section, "MedicationAdministration", maIhs);
      }

      // ── Paket Dispense (per dispensing) ──
      const dispProduct = kfaProductOf(kfa, "dispense");
      for (const d of r.dispensings) {
        const localId = `${d.id}:${it.id}`;
        if (!dispProduct) {
          if (!deleted) out.issues.push({ link: "L20", resourceType: "MedicationDispense", localId, code: "kategori-salah", message: `Obat "${it.namaObat}" hanya ber-KFA virtual (92…) — penyerahan wajib KFA produk aktual (93…)` });
          continue;
        }
        const dispMed = toFhirMedication(obatLocal, ctx.orgId, { identifier: `${d.id}-${item.seq}`, untuk: "dispense", deleted });
        const dispMedIhs = dispMed ? await submit("Medication", `${localId}:med`, dispMed, deleted) : undefined;
        if (!dispMedIhs) continue;
        const mdIhs = await submit("MedicationDispense", localId, toFhirMedicationDispense(
          local, item, d,
          { ...refs, medication: { ihsId: dispMedIhs, nama: dispProduct.display || o.namaGenerik }, request: { ihsId: mrIhs } },
          { performer: pracOf(d.authorPegawaiId), location: depoOf(r.depoKode) },
        ), deleted);
        if (mdIhs && !deleted) addSectionRef(out.sections, section, "MedicationDispense", mdIhs);
      }
    }

    // ── L19 Pengkajian resep — 1 QuestionnaireResponse Q0007 per telaah (telaah ulang = resource baru) ──
    for (const t of r.telaahs) {
      const q = q0007ItemsOf(t);
      if (!q.ok) {
        if (!deleted) out.issues.push(q.issue);
        continue;
      }
      await submit("QuestionnaireResponse", t.id, toFhirPengkajianResep(
        { createdAt: t.createdAt, deleted },
        q.items,
        { patient: ctx.patient, encounterIhsId: ctx.encounterIhsId },
        { author: pracOf(t.authorPegawaiId), medicationRequestIhsIds: mrIhsResep },
      ), deleted);
    }
  }
  return out;
}
