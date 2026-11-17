// S4c — Sinkron fase B6 (rencana & pulang) 1 kunjungan ke SatuSehat (docs/fhir-mapping L15 · L22 · L23 · L25):
//   L22 rencana asuhan : Goal `nursing` per CarePlanGoal + CarePlan rencana rawat per masalah (category per unit)
//   L23 pemulangan     : CarePlan `736372004` dari asesmen discharge terakhir (Observation kriteria OC000055 ditahan — D15)
//   L15 edukasi        : Procedure `409073007` per sesi edukasi (SNOMED topik + KPTL 10913)
//   L25 tindak lanjut  : ServiceRequest `3457005` dari jadwal kontrol · konsultasi · rujukan eksternal (SPRI ditahan — D8)
// Dipanggil encounterSyncService SETELAH klinis (Goal.addresses butuh Condition diagnosis yang terkirim).
// Idempoten per item via ResourceSink; terhapus → entered-in-error / revoked hanya bila pernah terkirim.

import "server-only";
import { toFhirDateTime, type SatuSehatMode } from "@/lib/fhir/fhirShared";
import { addSectionRef, type ResumeSection } from "@/lib/fhir/adapters/composition";
import type { ClinicalRefs } from "@/lib/fhir/adapters/clinical";
import { toFhirCarePlan, toFhirEdukasi, toFhirGoal, toFhirTindakLanjut } from "@/lib/fhir/adapters/rencana";
import {
  CAREPLAN_CATEGORY, CAREPLAN_DISCHARGE, CAREPLAN_STATUS, GOAL_STATUS, LOKASI_TINDAK_LANJUT, TINDAK_LANJUT, lookup,
  type KunjunganUnit,
} from "@/lib/fhir/conceptMap";
import {
  edukasiKodeOf, kriteriaPemulanganIssue, rencanaLocalId as lid, rencanaPemulanganTeks, rujukanDetailOf, rujukanKodeOf,
  spriIssue, tanggalWib,
} from "@/lib/fhir/links/rencana";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as clinicalSrc from "@/lib/dal/fhir/clinicalSourceDal";
import type { UpsertResult } from "./resourceUpsert";
import type { ResourceSink, SubmitArgs } from "./resourceSink";
import type { ClinicalSyncOutcome, SyncRef } from "./clinicalSyncService";
import type { EncounterSnapshot } from "./encounterSnapshot";

type Ref = { ihsId: string; nama: string };

const PRIORITAS_KONSUL: Record<string, "stat" | "urgent" | "routine"> = { CITO: "stat", Urgen: "urgent", Rutin: "routine" };

export async function syncRencana(
  snap: Pick<
    EncounterSnapshot,
    "kunjunganId" | "carePlan" | "dischargeAsesmen" | "edukasi" | "jadwalKontrol" | "konsultasi" | "rujukan" | "spri" | "rsKontak"
  >,
  ctx: {
    env: SatuSehatMode;
    sink: ResourceSink;
    unit: KunjunganUnit;
    refs: ClinicalRefs;
    /** Condition diagnosis terkirim per kode ICD-10 (huruf besar) — Goal.addresses (L22). */
    conditionByKode: Map<string, { ihsId: string; display: string }>;
    /** Diagnosis Utama — reasonCode tindak lanjut (L25). */
    reason?: { kode: string; nama: string };
  },
): Promise<Omit<ClinicalSyncOutcome, "conditionsOk">> {
  const out: Omit<ClinicalSyncOutcome, "conditionsOk"> = { refs: [], failures: [], issues: [], sections: {} };
  const { kunjunganId, carePlan, dischargeAsesmen, edukasi, jadwalKontrol, konsultasi, rujukan, spri, rsKontak } = snap;
  const { refs } = ctx;

  // Practitioner — hanya yang sudah onboarding (FH1).
  const pegawaiIds = [...new Set([
    ...carePlan.flatMap((m) => [m.authorPegawaiId, ...m.goals.map((g) => g.authorPegawaiId)]),
    dischargeAsesmen?.authorPegawaiId ?? null,
    ...edukasi.map((e) => e.authorPegawaiId),
    ...jadwalKontrol.flatMap((j) => [j.authorPegawaiId, j.dokterPegawaiId]),
    ...konsultasi.flatMap((k) => [k.authorPegawaiId, k.konsultanPegawaiId]),
    ...rujukan.map((r) => r.authorPegawaiId),
  ].filter((x): x is string => !!x))];
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
  const section = (keys: ResumeSection[], resourceType: string, ihsId: string | undefined) => {
    if (ihsId) for (const k of keys) addSectionRef(out.sections, k, resourceType, ihsId);
  };
  const tanpaAuthor = (link: "L22" | "L23", localId: string, apa: string) =>
    out.issues.push({ link, resourceType: "CarePlan", localId, code: "nakes-tanpa-ihs", message: `${apa} ditahan — pencatat belum terpetakan ke Practitioner (CarePlan.author wajib)` });

  // ── L22 rencana asuhan: Goal per tujuan → CarePlan per masalah ──
  for (const m of carePlan) {
    const mDeleted = !!m.deletedAt;
    const addresses = m.sumber === "Diagnosa" && m.refKode.trim() ? ctx.conditionByKode.get(m.refKode.trim().toUpperCase()) : undefined;
    const goalIhs: string[] = [];
    for (const g of m.goals) {
      const deleted = mDeleted || !!g.deletedAt;
      const st = lookup(GOAL_STATUS, g.status);
      const lifecycle = deleted ? "entered-in-error"
        : m.status === "Batal" ? "cancelled"
        : m.status === "Teratasi" ? "completed"
        : st?.lifecycle ?? "active";
      const ihs = await submit("Goal", g.id, toFhirGoal(
        { ...g, lifecycle, achievement: st?.achievement, statusDate: tanggalWib(g.waktu) },
        refs,
        { expressedBy: pracOf(g.authorPegawaiId), addresses },
      ), deleted);
      if (ihs && !deleted) {
        goalIhs.push(ihs);
        section(["rencanaRawat"], "Goal", ihs);
      }
    }
    const author = pracOf(m.authorPegawaiId);
    if (!author) {
      if (!mDeleted) tanpaAuthor("L22", m.id, `Rencana asuhan "${m.masalah}"`);
      continue;
    }
    const tujuan = m.goals.filter((g) => !g.deletedAt).map((g) => g.target.trim()).filter(Boolean);
    const description = [
      `${m.masalah}${m.refKode.trim() ? ` (${m.sumber} ${m.refKode.trim()})` : ""}`,
      tujuan.length ? `Tujuan: ${tujuan.join("; ")}` : "",
    ].filter(Boolean).join(". ");
    const ihs = await submit("CarePlan", m.id, toFhirCarePlan(
      {
        status: mDeleted ? "entered-in-error" : lookup(CAREPLAN_STATUS, m.status) ?? "active",
        category: CAREPLAN_CATEGORY[ctx.unit], title: m.masalah, description, created: m.tanggalInput,
      },
      refs,
      { author, goalIhsIds: goalIhs },
    ), mDeleted);
    if (!mDeleted) section(["rencanaRawat"], "CarePlan", ihs);
  }

  // ── L23 perencanaan pemulangan (asesmen discharge terakhir) ──
  if (dischargeAsesmen) {
    out.issues.push(kriteriaPemulanganIssue(kunjunganId));
    const author = pracOf(dischargeAsesmen.authorPegawaiId);
    const localId = lid.rencanaPemulangan(kunjunganId);
    if (!author) tanpaAuthor("L23", localId, "Rencana pemulangan");
    else {
      const ihs = await submit("CarePlan", localId, toFhirCarePlan(
        {
          status: "active", category: CAREPLAN_DISCHARGE, title: "Perencanaan Pemulangan Pasien",
          description: rencanaPemulanganTeks(dischargeAsesmen), created: dischargeAsesmen.createdAt,
        },
        refs,
        { author },
      ), false);
      section(["kondisiPulang", "tindakLanjut"], "CarePlan", ihs);
    }
  }

  // ── L15 edukasi ──
  for (const e of edukasi) {
    const deleted = !!e.deletedAt;
    const k = edukasiKodeOf(e);
    if (!k.ok) {
      if (!deleted) out.issues.push(k.issue);
      continue;
    }
    // EHIS mencatat TANGGAL sesi; jam = saat dicatat bila di hari yang sama, selain itu tanggal saja.
    const waktu = tanggalWib(e.createdAt) === e.tanggal ? toFhirDateTime(e.createdAt) : e.tanggal;
    const ihs = await submit("Procedure", e.id, toFhirEdukasi(
      {
        topik: k.coding, waktu, deleted,
        note: [e.topik, `Metode ${e.metode} · penerima ${e.penerima} · pemahaman ${e.pemahaman} (${e.profesi})`, e.catatan],
      },
      refs,
      { performer: pracOf(e.authorPegawaiId) },
    ), deleted);
    if (!deleted) section(["edukasi"], "Procedure", ihs);
  }

  // ── L25 rencana tindak lanjut ──
  const kontakDarurat = rsKontak?.telp?.trim() ? `Dalam keadaan darurat dapat menghubungi ${rsKontak.nama} di nomor ${rsKontak.telp.trim()}` : "";
  const instruksi = (...xs: string[]) => xs.map((x) => x.trim()).filter(Boolean).join(". ");

  for (const j of jadwalKontrol) {
    const deleted = !!j.deletedAt;
    const ihs = await submit("ServiceRequest", lid.kontrol(j.id), toFhirTindakLanjut(
      {
        identifier: j.nomor, status: deleted ? "revoked" : "active", code: TINDAK_LANJUT.kontrol,
        text: `Kontrol ${j.poliNama}${j.dokterNama ? ` — ${j.dokterNama}` : ""}`, priority: "routine",
        occurrence: j.tanggal, authoredOn: j.createdAt, location: { coding: LOKASI_TINDAK_LANJUT.poli, text: j.poliNama },
        patientInstruction: instruksi(`Kontrol ${j.tanggal} di ${j.poliNama}`, j.catatan, kontakDarurat),
      },
      refs,
      { requester: pracOf(j.authorPegawaiId), performer: pracOf(j.dokterPegawaiId), reason: ctx.reason },
    ), deleted);
    if (!deleted) section(["tindakLanjut"], "ServiceRequest", ihs);
  }

  for (const k of konsultasi) {
    const deleted = !!k.deletedAt;
    const ihs = await submit("ServiceRequest", lid.konsultasi(k.id), toFhirTindakLanjut(
      {
        identifier: k.id, status: deleted ? "revoked" : k.status === "Selesai" ? "completed" : "active",
        code: TINDAK_LANJUT.konsultasi, text: `Konsultasi ${k.smfNama}`, priority: PRIORITAS_KONSUL[k.urgency] ?? "routine",
        occurrence: toFhirDateTime(k.createdAt), authoredOn: k.createdAt,
      },
      refs,
      { requester: pracOf(k.authorPegawaiId), performer: pracOf(k.konsultanPegawaiId), reason: ctx.reason },
    ), deleted);
    if (!deleted) section(["tindakLanjut"], "ServiceRequest", ihs);
  }

  for (const r of rujukan) {
    const deleted = !!r.deletedAt;
    const d = rujukanDetailOf(r.detail);
    const kode = rujukanKodeOf(r.id, d);
    if (!kode.ok) {
      if (!deleted) out.issues.push(kode.issue);
      continue;
    }
    const ihs = await submit("ServiceRequest", lid.rujukan(r.id), toFhirTindakLanjut(
      {
        identifier: r.nomor, status: deleted ? "revoked" : "active", code: kode.coding,
        text: `Rujukan ke ${d.tujuan || "fasyankes lain"}${d.poli ? ` — ${d.poli}` : ""}`, priority: "routine",
        occurrence: d.tglRencanaKunjungan || toFhirDateTime(r.createdAt), authoredOn: r.createdAt,
        // BPJS tipeRujukan "2" = rujuk balik ke FKTP → Primary care clinic; selain itu Hospital.
        location: { coding: d.tipeRujukan === "2" ? LOKASI_TINDAK_LANJUT.faskesPrimer : LOKASI_TINDAK_LANJUT.rumahSakit, text: d.tujuan || undefined },
        patientInstruction: instruksi(`Rujukan ke ${d.tujuan || "fasyankes lain"}`, d.catatan, kontakDarurat),
      },
      refs,
      { requester: pracOf(r.authorPegawaiId), reason: d.diagnosa ?? ctx.reason },
    ), deleted);
    if (!deleted) section(["tindakLanjut"], "ServiceRequest", ihs);
  }

  for (const s of spri) out.issues.push(spriIssue(s.id));

  return out;
}
