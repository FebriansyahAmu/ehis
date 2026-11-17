// FH3–FH7 — Sinkron 1 kunjungan ke SatuSehat (dipanggil outbox worker, aktor sistem). Payload
// dibangun dari state TERKINI dan dikirim lewat ResourceSink (FH7):
//   bundle (default) : semua resource → 1 Bundle transaction (atomik: semua masuk / tidak sama sekali).
//   single           : per resource (POST/PUT langsung).
//
// Urutan (wajib karena referensi — docs/fhir-mapping/FLOW.md §3):
//   A) Encounter dipastikan ada (in-progress bila belum pernah terkirim) — entry pertama bundle.
//   B) Keluhan utama CC (L03) · klinis (FH4) · rantai obat (FH5) · diagnostik (FH6) · kondisi pulang (L24).
//   D) Composition resume (FH7).
//   C) Encounter final: status target + diagnosis CC & DD + length + dischargeDisposition.
// Gerbang "blokir finished" (S2): tanpa CC atau diagnosis → Encounter tetap in-progress + Issue
// `syarat-finished`. Mode single: `finished` juga ditahan bila Condition gagal (FG-27).
//
// Prasyarat referensi (R15): Patient (di-resolve otomatis bila belum), Practitioner DPJP & Location
// ruangan (WAJIB sudah onboarding FH1 — bila belum, job gagal non-retry; antre ulang manual).
//
// `previewEncounter` menjalankan logika yang SAMA dengan PreviewSink (tanpa jaringan, tanpa tulis):
// konsol melihat persis resource apa yang akan/sudah dikirim, prasyarat yang kurang tidak
// menghentikan pratinjau — dicatat sebagai `blockers` dengan referensi placeholder.

import "server-only";
import { getSatuSehatConfig } from "@/lib/fhir/server/config";
import { encounterStatusOf, toFhirEncounter, type EncounterStatus, type LocalEncounter } from "@/lib/fhir/adapters/encounter";
import { addSectionRef, mergeSectionRefs, toFhirComposition } from "@/lib/fhir/adapters/composition";
import { toFhirChiefComplaint, toFhirKondisiPulang } from "@/lib/fhir/adapters/encounterCondition";
import type { FhirError, FhirResourceBase } from "@/lib/fhir/fhirShared";
import type { Issue } from "@/lib/fhir/links/types";
import { diagnosaFinalOf } from "@/lib/fhir/links/diagnosa";
import {
  ccLocalId, finishedBlockers, keluhanUtamaOf, kondisiPulangLocalId, kondisiPulangOf,
} from "@/lib/fhir/links/encounterFinal";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as src from "@/lib/dal/fhir/encounterSourceDal";
import * as clinicalSrc from "@/lib/dal/fhir/clinicalSourceDal";
import { ensurePatientIhs } from "./patientIhsService";
import { makePreviewSink, makeSink, type FlushResult, type PreviewItem, type PreviewSink } from "./resourceSink";
import { syncClinical, type SyncRef } from "./clinicalSyncService";
import { syncMedication } from "./medicationSyncService";
import { syncDiagnostic } from "./diagnosticSyncService";
import { loadEncounterSnapshot } from "./encounterSnapshot";
import type { auditActorOf } from "./audit";

export type JobResult =
  | { kind: "acked"; refs: SyncRef[]; notes?: string[] }
  | { kind: "skipped"; reason: string }
  | { kind: "failed"; message: string; retryable: boolean; error?: FhirError };

type Ref = { ihsId: string; nama: string };
type Failure = { resourceType: string; message: string; retryable: boolean };
type Audit = ReturnType<typeof auditActorOf>;

/** Referensi yang belum terpetakan saat pratinjau (tidak pernah ikut terkirim). */
export const UNMAPPED_REF = "(belum-terpetakan)";

export interface EncounterPlan {
  /** Status Encounter target; null = kunjungan belum layak dikirim (lihat `skipReason`). */
  target: EncounterStatus | null;
  skipReason?: string;
  /** Prasyarat yang kurang — job nyata akan GAGAL sampai dilengkapi. */
  blockers: string[];
  /** Info non-blokir (mis. pasien akan di-resolve otomatis by NIK saat kirim). */
  infos: string[];
  /** Teks ringkas item yang ditahan (= `issues[].message`) — dipertahankan untuk tampilan lama. */
  notes: string[];
  /** Item ditahan gerbang readiness per link (kode kosong, nakes tanpa IHS, …) — FLOW.md §4. */
  issues: Issue[];
  items: PreviewItem[];
}

export function syncEncounter(kunjunganId: string, audit: Audit): Promise<JobResult> {
  return runEncounter(kunjunganId, audit, null).then((r) => r.result);
}

export async function previewEncounter(kunjunganId: string, audit: Audit): Promise<EncounterPlan> {
  const sink = makePreviewSink(getSatuSehatConfig().mode);
  const { result, blockers, infos, issues, target } = await runEncounter(kunjunganId, audit, sink);
  return {
    target,
    ...(result.kind === "skipped" ? { skipReason: result.reason } : {}),
    blockers,
    infos,
    notes: issues.map((i) => i.message),
    issues,
    items: result.kind === "skipped" ? [] : sink.items(),
  };
}

async function runEncounter(
  kunjunganId: string,
  audit: Audit,
  preview: PreviewSink | null,
): Promise<{ result: JobResult; blockers: string[]; infos: string[]; issues: Issue[]; target: EncounterStatus | null }> {
  const blockers: string[] = [];
  const infos: string[] = [];
  const issues: Issue[] = [];
  let target: EncounterStatus | null = null;
  const done = (result: JobResult) => ({ result, blockers, infos, issues, target });

  const k = await src.getKunjungan(kunjunganId);
  if (!k) return done({ kind: "skipped", reason: "Kunjungan tidak ditemukan / dihapus" });

  target = encounterStatusOf(k.status);
  if (!target) return done({ kind: "skipped", reason: `Status ${k.status} belum dikirim (menunggu diterima)` });

  const { mode: env, orgId, syncMode } = getSatuSehatConfig();
  const existing = await resourceMapDal.findByLocal(env, "Encounter", k.id);
  if (target === "cancelled" && !existing) return done({ kind: "skipped", reason: "Dibatalkan sebelum pernah terkirim" });

  // ── Referensi ──
  let patientIhs: string;
  if (preview) {
    // Pratinjau tak memanggil SatuSehat: pakai peta yang ada, resolve NIK terjadi saat kirim nyata.
    const m = await resourceMapDal.findByLocal(env, "Patient", k.patientId);
    patientIhs = m?.ihsId ?? UNMAPPED_REF;
    if (!m) infos.push("Pasien belum punya IHS Patient — di-resolve otomatis by NIK saat dikirim (gagal bila tanpa NIK / tak terdaftar)");
  } else {
    const patient = await ensurePatientIhs(k.patientId, audit);
    if (!patient.ok) return done({ kind: "failed", message: patient.message, retryable: patient.retryable });
    patientIhs = patient.ihsId;
  }

  const missing: string[] = [];
  let practitioner: Ref | undefined;
  if (k.dpjpId) {
    const d = await src.getDokter(k.dpjpId);
    const m = d ? await resourceMapDal.findByLocal(env, "Practitioner", d.pegawaiId) : null;
    if (d && m) {
      const p = d.pegawai;
      practitioner = { ihsId: m.ihsId, nama: [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(" ") };
    } else missing.push("DPJP belum terpetakan ke Practitioner (jalankan onboarding practitioner)");
  } else missing.push("Kunjungan tanpa DPJP");

  let location: Ref | undefined;
  if (k.ruanganId) {
    const [r, m] = await Promise.all([src.getRuangan(k.ruanganId), resourceMapDal.findByLocal(env, "Location", k.ruanganId)]);
    if (r && m) location = { ihsId: m.ihsId, nama: r.nama };
    else missing.push("Ruangan belum terpetakan ke Location (jalankan onboarding location)");
  } else missing.push("Kunjungan tanpa ruangan");

  // Kunjungan yang dibatalkan cukup ubah status — referensi lain tak wajib lengkap.
  if (missing.length && target !== "cancelled") {
    if (!preview) return done({ kind: "failed", message: missing.join("; "), retryable: false });
    blockers.push(...missing);
    practitioner ??= { ihsId: UNMAPPED_REF, nama: "DPJP" };
    location ??= { ihsId: UNMAPPED_REF, nama: "Ruangan" };
  }

  const local: LocalEncounter = {
    noKunjungan: k.noKunjungan,
    unit: k.unit,
    status: k.status,
    waktuKunjungan: k.waktuKunjungan,
    dilayaniAt: k.dilayaniAt,
    selesaiAt: k.selesaiAt,
    kelas: k.kelas,
    kelasHak: k.kelasHak,
    titipan: k.titipan,
    disposisi: k.disposisiRiwayat[0] ?? null,
  };
  const patientRef: Ref = { ihsId: patientIhs, nama: k.pasien.nama };
  const baseRefs = { orgId, patient: patientRef, practitioner, location };
  const sink = preview ?? makeSink(syncMode, env, audit, k.id);
  const sendEncounter = (
    status: EncounterStatus,
    diagnoses: { ihsId: string; display: string; rank: number }[] = [],
    chiefComplaint?: { ihsId: string; display: string },
  ) => sink.submit({
    localType: "Encounter", localId: k.id,
    resource: toFhirEncounter(local, { ...baseRefs, diagnoses, chiefComplaint }, status),
  });

  const refs: SyncRef[] = [];
  const failures: Failure[] = [];

  // ── Batal: cukup status cancelled ──
  if (target === "cancelled") {
    const r = await sendEncounter("cancelled");
    if (!r?.ok) return done(fail(r?.ok === false ? r.error : undefined, "Gagal membatalkan Encounter"));
    refs.push({ resourceType: "Encounter", localId: k.id, ihsId: r.ihsId, op: r.op });
    return done(finish(await sink.flush(), refs, failures, issues));
  }

  // ── Snapshot sumber: 1 putaran query paralel, dibagi ke semua builder (FLOW §2 ①) ──
  const snap = await loadEncounterSnapshot(k.id);
  const dxFinal = diagnosaFinalOf(snap.diagnosa);
  local.triagedAt = snap.triaseWaktu; // statusHistory `triaged` (IGD)

  // ── Fase 1: pastikan Encounter ada ──
  let encounterIhs = existing?.ihsId;
  if (!encounterIhs) {
    const r = await sendEncounter("in-progress");
    if (!r?.ok) return done(fail(r?.ok === false ? r.error : undefined, "Gagal membuat Encounter"));
    encounterIhs = r.ihsId; // bundle: `urn:uuid:…` sementara
  }
  const encounterRef: Ref = { ihsId: encounterIhs, nama: `Kunjungan ${k.pasien.nama} (${k.noKunjungan})` };
  const clinicalRefs = { orgId, patient: patientRef, encounter: { ihsId: encounterIhs, display: encounterRef.nama } };

  /** Kirim 1 Condition tingkat kunjungan; ihsId bila terkirim/tak berubah, undefined bila gagal. */
  const submitCondition = async (localId: string, resource: FhirResourceBase) => {
    const r = await sink.submit({ localType: "Condition", localId, resource });
    if (r?.ok) {
      refs.push({ resourceType: "Condition", localId, ihsId: r.ihsId, op: r.op });
      return r.ihsId;
    }
    if (r) failures.push({ resourceType: "Condition", message: r.error.message, retryable: r.error.retryable });
    return undefined;
  };

  // ── Fase B1: keluhan utama → Condition chief-complaint (L03) ──
  let chiefComplaint: { ihsId: string; display: string } | undefined;
  const cc = keluhanUtamaOf(k.id, snap.anamnesis);
  if (!cc.ok) issues.push(cc.issue);
  else {
    const recorder = await authorOf(env, snap.anamnesis?.authorPegawaiId ?? null);
    const ihsId = await submitCondition(ccLocalId(k.id), toFhirChiefComplaint(cc.data, clinicalRefs, recorder));
    if (ihsId) chiefComplaint = { ihsId, display: cc.data.display };
  }

  // ── Fase B2–B5: klinis · obat · diagnostik ──
  const cl = await syncClinical(snap, { env, sink, refs: clinicalRefs });
  const med = await syncMedication(snap, { env, orgId, unit: k.unit, sink, patient: patientRef, encounterIhsId: encounterIhs });
  const diag = await syncDiagnostic(snap, { env, sink, refs: { orgId, patient: patientRef, encounter: { ihsId: encounterIhs } } });
  for (const o of [cl, med, diag]) {
    refs.push(...o.refs);
    failures.push(...o.failures);
    issues.push(...o.issues);
  }

  // Diagnosis final yang terkirim (DD, Utama dulu) — dipakai Composition (L26) & Encounter final (L01).
  const dxSent = new Map(cl.refs.filter((r) => r.resourceType === "Condition").map((r) => [r.localId, r.ihsId]));
  const diagnoses = dxFinal
    .filter((d) => dxSent.has(d.id))
    .map((d, i) => ({ ihsId: dxSent.get(d.id)!, display: `${d.kodeIcd10} ${d.namaDiagnosis}`, rank: i + 1 }));

  // Referensi resource per section resume (Composition L26) — hanya resource aktif yang terkirim.
  const sections = mergeSectionRefs(cl.sections, med.sections, diag.sections);
  if (chiefComplaint) addSectionRef(sections, "keluhanUtama", "Condition", chiefComplaint.ihsId);
  for (const d of diagnoses) addSectionRef(sections, "diagnosis", "Condition", d.ihsId);

  // ── Fase B6: kondisi saat meninggalkan RS → Condition problem-list-item (L24, D11) ──
  const disposisi = k.disposisiRiwayat[0] ?? null;
  if (target === "finished" && disposisi) {
    const kp = kondisiPulangOf(k.id, disposisi);
    if (kp && !kp.ok) issues.push(kp.issue);
    else if (kp) {
      const ihsId = await submitCondition(
        kondisiPulangLocalId(k.id),
        toFhirKondisiPulang({ kode: kp.kode, lokal: kp.lokal, recordedAt: disposisi.waktuKeluar }, clinicalRefs),
      );
      if (ihsId) addSectionRef(sections, "kondisiPulang", "Condition", ihsId);
    }
  }

  // ── Fase D: resume → Composition ──
  const resume = snap.resume;
  if (resume) {
    const author = (await authorOf(env, resume.authorPegawaiId)) ?? practitioner;
    if (!author) {
      issues.push({
        link: "L26", resourceType: "Composition", localId: k.id, code: "nakes-tanpa-ihs",
        message: "Resume medis ditahan — penulis/DPJP belum terpetakan ke Practitioner",
      });
    } else {
      const r = await sink.submit({
        localType: "Composition",
        localId: k.id, // 1 Composition per kunjungan, revisi resume = PUT
        resource: toFhirComposition(
          {
            kunjunganId: k.id, noKunjungan: k.noKunjungan, unit: k.unit,
            ringkasanKlinis: resume.ringkasanKlinis, signedAt: resume.tteSignedAt, createdAt: resume.createdAt,
          },
          { orgId, patient: patientRef, encounter: encounterRef, author },
          sections,
        ),
      });
      if (r?.ok) refs.push({ resourceType: "Composition", localId: k.id, ihsId: r.ihsId, op: r.op });
      else if (r) failures.push({ resourceType: "Composition", message: r.error.message, retryable: r.error.retryable });
    }
  }

  if (sink.mode === "single" && target === "finished" && !cl.conditionsOk) {
    return done(summarizeFailures(failures, "Diagnosis (Condition) gagal terkirim — Encounter belum di-finish"));
  }

  // ── Fase C: Encounter final (+ diagnosis CC & DD) ──
  if (target === "finished") {
    // Gerbang "blokir finished" (FLOW §4): tanpa CC / diagnosis → tetap in-progress, resource fase B
    // tetap terkirim; dikirim finished pada sinkron berikutnya setelah data dilengkapi.
    const hold = finishedBlockers(k.id, !!chiefComplaint, diagnoses.length);
    if (hold.length) {
      issues.push(...hold);
      target = "in-progress";
    }
  }
  const fin = await sendEncounter(target, diagnoses, chiefComplaint);
  if (!fin?.ok) return done(fail(fin?.ok === false ? fin.error : undefined, "Gagal memperbarui Encounter"));
  refs.unshift({ resourceType: "Encounter", localId: k.id, ihsId: fin.ihsId, op: existing ? fin.op : "create" });

  return done(finish(await sink.flush(), refs, failures, issues));
}

/**
 * Selesaikan job: bundle gagal = semua gagal; id sementara → IHS id; gagal per item → failed.
 * Item ditahan (issues) TIDAK menggagalkan job — disimpan sebagai `notes` di sync_log untuk konsol.
 */
function finish(
  flushed: FlushResult,
  refs: SyncRef[],
  failures: Failure[],
  issues: Issue[],
): JobResult {
  if (!flushed.ok) return fail(flushed.error, "Bundle transaction ditolak SatuSehat");
  const resolved = refs.map((r) => ({ ...r, ihsId: flushed.resolved.get(r.ihsId) ?? r.ihsId }));
  if (failures.length) return summarizeFailures(failures, "Sebagian resource gagal terkirim");
  const notes = issues.map((i) => i.message);
  return { kind: "acked", refs: resolved, ...(notes.length ? { notes } : {}) };
}

async function authorOf(env: string, pegawaiId: string | null): Promise<Ref | undefined> {
  if (!pegawaiId) return undefined;
  const [m, names] = await Promise.all([
    resourceMapDal.findByLocal(env, "Practitioner", pegawaiId),
    clinicalSrc.listPegawaiNama([pegawaiId]),
  ]);
  if (!m) return undefined;
  const p = names[0];
  return { ihsId: m.ihsId, nama: p ? [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(" ") : "" };
}

function fail(error: FhirError | undefined, fallback: string): JobResult {
  return { kind: "failed", message: error?.message ?? fallback, retryable: error?.retryable ?? false, error };
}

function summarizeFailures(failures: Failure[], head: string): JobResult {
  const detail = failures.slice(0, 3).map((f) => `${f.resourceType}: ${f.message}`).join(" | ");
  const more = failures.length > 3 ? ` (+${failures.length - 3} lainnya)` : "";
  return { kind: "failed", message: `${head} — ${detail}${more}`, retryable: failures.some((f) => f.retryable) };
}
