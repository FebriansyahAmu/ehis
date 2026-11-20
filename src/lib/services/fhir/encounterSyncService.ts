// FH3–FH7 — Sinkron 1 kunjungan ke SatuSehat (dipanggil outbox worker, aktor sistem). Payload
// dibangun dari state TERKINI dan dikirim lewat ResourceSink (FH7):
//   bundle (default) : semua resource → 1 Bundle transaction (atomik: semua masuk / tidak sama sekali).
//   single           : per resource (POST/PUT langsung).
//
// Urutan (wajib karena referensi):
//   1) Encounter dipastikan ada (in-progress bila belum pernah terkirim) — entry pertama bundle.
//   2) Resource klinis (FH4) · rantai obat (FH5) · diagnostik (FH6) · Composition resume (FH7).
//   3) Encounter final (status target + diagnosis dari Condition).
// Mode single: `finished` ditahan bila Condition gagal (SatuSehat butuh diagnosis valid, FG-27).
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
import { toFhirComposition } from "@/lib/fhir/adapters/composition";
import type { FhirError } from "@/lib/fhir/fhirShared";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as src from "@/lib/dal/fhir/encounterSourceDal";
import * as clinicalSrc from "@/lib/dal/fhir/clinicalSourceDal";
import { ensurePatientIhs } from "./patientIhsService";
import { makePreviewSink, makeSink, type FlushResult, type PreviewItem, type PreviewSink } from "./resourceSink";
import { syncClinical, type SyncRef } from "./clinicalSyncService";
import { syncMedication } from "./medicationSyncService";
import { syncDiagnostic } from "./diagnosticSyncService";
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
  /** Data yang dilewati builder (obat tanpa KFA, lab tanpa LOINC, …). */
  notes: string[];
  items: PreviewItem[];
}

export function syncEncounter(kunjunganId: string, audit: Audit): Promise<JobResult> {
  return runEncounter(kunjunganId, audit, null).then((r) => r.result);
}

export async function previewEncounter(kunjunganId: string, audit: Audit): Promise<EncounterPlan> {
  const sink = makePreviewSink(getSatuSehatConfig().mode);
  const { result, blockers, infos, target } = await runEncounter(kunjunganId, audit, sink);
  return {
    target,
    ...(result.kind === "skipped" ? { skipReason: result.reason } : {}),
    blockers,
    infos,
    notes: result.kind === "acked" ? (result.notes ?? []) : [],
    items: result.kind === "skipped" ? [] : sink.items(),
  };
}

async function runEncounter(
  kunjunganId: string,
  audit: Audit,
  preview: PreviewSink | null,
): Promise<{ result: JobResult; blockers: string[]; infos: string[]; target: EncounterStatus | null }> {
  const blockers: string[] = [];
  const infos: string[] = [];
  let target: EncounterStatus | null = null;
  const done = (result: JobResult) => ({ result, blockers, infos, target });

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
    } else missing.push("DPJP belum terpetakan ke Practitioner — jalankan Prerequisites langkah 4 (Nomor IHS Tenaga Kesehatan)");
  } else missing.push("Kunjungan tanpa DPJP (Practitioner)");

  let location: Ref | undefined;
  if (k.ruanganId) {
    const [r, m] = await Promise.all([src.getRuangan(k.ruanganId), resourceMapDal.findByLocal(env, "Location", k.ruanganId)]);
    if (r && m) location = { ihsId: m.ihsId, nama: r.nama };
    else missing.push("Ruangan belum terpetakan ke Location — jalankan Prerequisites langkah 3 (Registrasi Struktur Lokasi)");
  } else missing.push("Kunjungan tanpa ruangan (Location)");

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
  const sendEncounter = (status: EncounterStatus, diagnoses: { ihsId: string; display: string; rank: number }[] = []) =>
    sink.submit({ localType: "Encounter", localId: k.id, resource: toFhirEncounter(local, { ...baseRefs, diagnoses }, status) });

  const refs: SyncRef[] = [];
  const failures: Failure[] = [];
  const notes: string[] = [];

  // ── Batal: cukup status cancelled ──
  if (target === "cancelled") {
    const r = await sendEncounter("cancelled");
    if (!r?.ok) return done(fail(r?.ok === false ? r.error : undefined, "Gagal membatalkan Encounter"));
    refs.push({ resourceType: "Encounter", localId: k.id, ihsId: r.ihsId, op: r.op });
    return done(finish(await sink.flush(), refs, failures, notes));
  }

  // ── Fase 1: pastikan Encounter ada ──
  let encounterIhs = existing?.ihsId;
  if (!encounterIhs) {
    const r = await sendEncounter("in-progress");
    if (!r?.ok) return done(fail(r?.ok === false ? r.error : undefined, "Gagal membuat Encounter"));
    encounterIhs = r.ihsId; // bundle: `urn:uuid:…` sementara
  }
  const encounterRef: Ref = { ihsId: encounterIhs, nama: `Kunjungan ${k.pasien.nama} (${k.noKunjungan})` };

  // ── Fase 2: klinis · obat · diagnostik · resume ──
  const cl = await syncClinical(k.id, {
    env, sink,
    refs: { orgId, patient: patientRef, encounter: { ihsId: encounterIhs, display: encounterRef.nama } },
  });
  const med = await syncMedication(k.id, { env, orgId, unit: k.unit, sink, patient: patientRef, encounterIhsId: encounterIhs });
  const diag = await syncDiagnostic(k.id, { env, sink, refs: { orgId, patient: patientRef, encounter: { ihsId: encounterIhs } } });
  for (const o of [cl, med, diag]) {
    refs.push(...o.refs);
    failures.push(...o.failures);
    notes.push(...o.notes);
  }

  const resume = await src.getLatestResume(k.id);
  if (resume) {
    const author = (await authorOf(env, resume.authorPegawaiId)) ?? practitioner;
    if (!author) {
      notes.push("Resume medis dilewati — penulis/DPJP belum terpetakan ke Practitioner");
    } else {
      const dx = await src.listDiagnosaFinal(k.id);
      const r = await sink.submit({
        localType: "Composition",
        localId: k.id, // 1 Composition per kunjungan, revisi resume = PUT
        resource: toFhirComposition(
          {
            kunjunganId: k.id, noKunjungan: k.noKunjungan, unit: k.unit,
            ringkasanKlinis: resume.ringkasanKlinis, kondisiMasuk: resume.kondisiMasuk, kondisiPulang: resume.kondisiPulang,
            diagnosisKeluar: dx.map((d) => `${d.kodeIcd10} — ${d.namaDiagnosis}`),
            signedAt: resume.tteSignedAt, createdAt: resume.createdAt,
          },
          { orgId, patient: patientRef, encounter: encounterRef, author },
        ),
      });
      if (r?.ok) refs.push({ resourceType: "Composition", localId: k.id, ihsId: r.ihsId, op: r.op });
      else if (r) failures.push({ resourceType: "Composition", message: r.error.message, retryable: r.error.retryable });
    }
  }

  if (sink.mode === "single" && target === "finished" && !cl.conditionsOk) {
    return done(summarizeFailures(failures, "Diagnosis (Condition) gagal terkirim — Encounter belum di-finish"));
  }

  // ── Fase 3: Encounter final (+ diagnosis) ──
  let diagnoses: { ihsId: string; display: string; rank: number }[] = [];
  if (target === "finished") {
    const dx = await src.listDiagnosaFinal(k.id);
    const sent = new Map(cl.refs.filter((r) => r.resourceType === "Condition").map((r) => [r.localId, r.ihsId]));
    diagnoses = dx
      .filter((d) => sent.has(d.id))
      .map((d, i) => ({ ihsId: sent.get(d.id)!, display: `${d.kodeIcd10} ${d.namaDiagnosis}`, rank: i + 1 }));
  }
  const fin = await sendEncounter(target, diagnoses);
  if (!fin?.ok) return done(fail(fin?.ok === false ? fin.error : undefined, "Gagal memperbarui Encounter"));
  refs.unshift({ resourceType: "Encounter", localId: k.id, ihsId: fin.ihsId, op: existing ? fin.op : "create" });

  return done(finish(await sink.flush(), refs, failures, notes));
}

/** Selesaikan job: bundle gagal = semua gagal; id sementara → IHS id; gagal per item → failed. */
function finish(
  flushed: FlushResult,
  refs: SyncRef[],
  failures: Failure[],
  notes: string[],
): JobResult {
  if (!flushed.ok) return fail(flushed.error, "Bundle transaction ditolak SatuSehat");
  const resolved = refs.map((r) => ({ ...r, ihsId: flushed.resolved.get(r.ihsId) ?? r.ihsId }));
  if (failures.length) return summarizeFailures(failures, "Sebagian resource gagal terkirim");
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
