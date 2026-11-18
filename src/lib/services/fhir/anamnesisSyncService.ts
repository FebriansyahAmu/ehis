// S4d — Sinkron anamnesis & fisik 1 kunjungan ke SatuSehat (docs/fhir-mapping L04 · L05 · L10):
//   L04 riwayat penyakit pribadi  : Condition `previous-condition` per penyakit (SNOMED "History of …" dari katalog)
//   L05 riwayat penyakit keluarga : FamilyMemberHistory per anggota (SNOMED "Family history …" dari katalog)
//   L07 riwayat pengobatan        : MedicationStatement per obat katalog (KFA 92/93 dari master Obat; S5a)
//   L10 pemeriksaan fisik         : Observation `exam` head-to-toe — 5 sistem padan (D12), sisanya Issue
//   L27 riwayat perjalanan        : ClinicalImpression 312850006 dari Anamnesis.rps (S6a)
// Dipanggil encounterSyncService di fase B1/B2 (setelah Encounter ada). Sumber "latest wins" → localId tingkat
// kunjungan; item yang hilang dari simpanan terbaru dikirim entered-in-error (hanya bila pernah terkirim).

import "server-only";
import type { SatuSehatMode } from "@/lib/fhir/fhirShared";
import { addSectionRef } from "@/lib/fhir/adapters/composition";
import type { ClinicalRefs } from "@/lib/fhir/adapters/clinical";
import {
  toFhirRiwayatKeluarga, toFhirRiwayatObat, toFhirRiwayatPenyakit, toFhirRiwayatPerjalanan,
} from "@/lib/fhir/adapters/anamnesis";
import { toFhirPemeriksaanFisik } from "@/lib/fhir/adapters/pemeriksaan";
import {
  indeksKatalog, pemeriksaanFisikRencana, riwayatKeluargaRencana, riwayatPenyakitRencana,
} from "@/lib/fhir/links/anamnesis";
import { riwayatObatRencana, type KfaProduk } from "@/lib/fhir/links/riwayatObat";
import { riwayatPerjalananRencana } from "@/lib/fhir/links/riwayatPerjalanan";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as clinicalSrc from "@/lib/dal/fhir/clinicalSourceDal";
import type { UpsertResult } from "./resourceUpsert";
import type { ResourceSink, SubmitArgs } from "./resourceSink";
import type { ClinicalSyncOutcome, SyncRef } from "./clinicalSyncService";
import type { EncounterSnapshot } from "./encounterSnapshot";

type Ref = { ihsId: string; nama: string };

export async function syncAnamnesisFisik(
  snap: Pick<
    EncounterSnapshot,
    "kunjunganId" | "penyakitDahulu" | "penyakitKeluarga" | "pemeriksaanFisik" | "katalogRiwayat" | "riwayatObat" | "anamnesis"
  >,
  ctx: { env: SatuSehatMode; sink: ResourceSink; refs: ClinicalRefs },
): Promise<Omit<ClinicalSyncOutcome, "conditionsOk">> {
  const out: Omit<ClinicalSyncOutcome, "conditionsOk"> = { refs: [], failures: [], issues: [], sections: {} };
  const { kunjunganId, penyakitDahulu, penyakitKeluarga, pemeriksaanFisik, katalogRiwayat, riwayatObat, anamnesis } = snap;
  const katalog = indeksKatalog(katalogRiwayat);

  const riwayat = riwayatPenyakitRencana(kunjunganId, penyakitDahulu, katalog);
  const keluarga = riwayatKeluargaRencana(kunjunganId, penyakitKeluarga, katalog);
  const fisik = pemeriksaanFisikRencana(kunjunganId, pemeriksaanFisik);
  const obat = riwayatObatRencana(
    kunjunganId, riwayatObat.rows, new Map(riwayatObat.kfa.map((o) => [o.id, (o.kfa ?? null) as KfaProduk | null])),
  );
  const perjalanan = riwayatPerjalananRencana(kunjunganId, anamnesis ?? null);
  out.issues.push(...riwayat.issues, ...keluarga.issues, ...obat.issues, ...fisik.issues, ...perjalanan.issues);

  // Practitioner (recorder L04 · performer L10) — hanya yang sudah onboarding (FH1); selain itu tanpa referensi.
  // L10: dokter pemeriksa disimpan sebagai NAMA saja → performer = pencatat (FG-130).
  const pegawaiIds = [...new Set(
    [...riwayat.kirim, ...riwayat.tarik, ...fisik.kirim, ...fisik.tarik, ...perjalanan.kirim, ...perjalanan.tarik]
      .map((i) => i.authorPegawaiId).filter((x): x is string => !!x),
  )];
  const [pracMaps, names] = await Promise.all([
    resourceMapDal.findManyByLocal(ctx.env, "Practitioner", pegawaiIds),
    clinicalSrc.listPegawaiNama(pegawaiIds),
  ]);
  const nameOf = new Map(names.map((p) => [p.id, [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(" ")]));
  const prac = new Map<string, Ref>(pracMaps.map((m) => [m.localId, { ihsId: m.ihsId, nama: nameOf.get(m.localId) ?? "" }]));
  const pracOf = (id: string | null) => (id ? prac.get(id) : undefined);

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

  // ── L04 riwayat penyakit pribadi ──
  for (const [items, deleted] of [[riwayat.kirim, false], [riwayat.tarik, true]] as const) {
    for (const p of items) {
      const res = toFhirRiwayatPenyakit({ ...p, deleted }, ctx.refs, pracOf(p.authorPegawaiId));
      const ihs = await submit("Condition", p.localId, res, deleted);
      if (ihs && !deleted) addSectionRef(out.sections, "riwayatPenyakit", "Condition", ihs);
    }
  }

  // ── L05 riwayat penyakit keluarga ──
  for (const [items, deleted] of [[keluarga.kirim, false], [keluarga.tarik, true]] as const) {
    for (const f of items) {
      const ihs = await submit("FamilyMemberHistory", f.localId, toFhirRiwayatKeluarga({ ...f, deleted }, ctx.refs), deleted);
      if (ihs && !deleted) addSectionRef(out.sections, "riwayatKeluarga", "FamilyMemberHistory", ihs);
    }
  }

  // ── L07 riwayat pengobatan ──
  for (const [items, deleted] of [[obat.kirim, false], [obat.tarik, true]] as const) {
    for (const o of items) {
      const ihs = await submit("MedicationStatement", o.localId, toFhirRiwayatObat({ ...o, deleted }, ctx.refs), deleted);
      if (ihs && !deleted) addSectionRef(out.sections, "riwayatObat", "MedicationStatement", ihs);
    }
  }

  // ── L27 riwayat perjalanan penyakit (S6a) — section "Perencanaan Perawatan" mengikuti contoh resmi RI ──
  for (const [items, deleted] of [[perjalanan.kirim, false], [perjalanan.tarik, true]] as const) {
    for (const c of items) {
      const res = toFhirRiwayatPerjalanan({ ...c, deleted }, ctx.refs, pracOf(c.authorPegawaiId));
      const ihs = await submit("ClinicalImpression", c.localId, res, deleted);
      if (ihs && !deleted) addSectionRef(out.sections, "rencanaRawat", "ClinicalImpression", ihs);
    }
  }

  // ── L10 pemeriksaan fisik head-to-toe ──
  for (const [items, deleted] of [[fisik.kirim, false], [fisik.tarik, true]] as const) {
    for (const o of items) {
      const res = toFhirPemeriksaanFisik(o.coding, o.teks, { refs: ctx.refs, waktu: o.waktu, performer: pracOf(o.authorPegawaiId) }, deleted);
      const ihs = await submit("Observation", o.localId, res, deleted);
      if (ihs && !deleted) addSectionRef(out.sections, "headToToe", "Observation", ihs);
    }
  }

  return out;
}
