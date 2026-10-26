// FH3/FH4 — Sinkron 1 kunjungan ke SatuSehat (dipanggil outbox worker, aktor sistem). Payload
// dibangun dari state TERKINI. Tiga fase (urutan wajib karena referensi):
//   1) Pastikan Encounter ada (POST `in-progress` bila belum pernah terkirim).
//   2) Resource klinis inti (FH4: Condition/Procedure/Observation/AllergyIntolerance) → Encounter/{id}.
//   3) Encounter final (status target + diagnosis dari Condition terpetakan) — PUT bila berubah.
// `finished` TIDAK dikirim bila ada Condition gagal (SatuSehat butuh diagnosis valid) → job gagal,
// Encounter tetap in-progress, retry melanjutkan secara idempoten.
//
// Prasyarat referensi (R15): Patient (di-resolve otomatis bila belum), Practitioner DPJP & Location
// ruangan (WAJIB sudah onboarding FH1 — bila belum, job gagal non-retry; antre ulang manual).

import "server-only";
import { getSatuSehatConfig } from "@/lib/fhir/server/config";
import { encounterStatusOf, toFhirEncounter, type EncounterStatus, type LocalEncounter } from "@/lib/fhir/adapters/encounter";
import type { FhirError } from "@/lib/fhir/fhirShared";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as src from "@/lib/dal/fhir/encounterSourceDal";
import { ensurePatientIhs } from "./patientIhsService";
import { upsertClinicalResource } from "./resourceUpsert";
import { syncClinical, type SyncRef } from "./clinicalSyncService";
import { syncMedication } from "./medicationSyncService";
import { syncDiagnostic } from "./diagnosticSyncService";
import type { auditActorOf } from "./audit";

export type JobResult =
  | { kind: "acked"; refs: SyncRef[]; notes?: string[] }
  | { kind: "skipped"; reason: string }
  | { kind: "failed"; message: string; retryable: boolean; error?: FhirError };

export async function syncEncounter(kunjunganId: string, audit: ReturnType<typeof auditActorOf>): Promise<JobResult> {
  const k = await src.getKunjungan(kunjunganId);
  if (!k) return { kind: "skipped", reason: "Kunjungan tidak ditemukan / dihapus" };

  const target = encounterStatusOf(k.status);
  if (!target) return { kind: "skipped", reason: `Status ${k.status} belum dikirim (menunggu diterima)` };

  const { mode: env, orgId } = getSatuSehatConfig();
  const existing = await resourceMapDal.findByLocal(env, "Encounter", k.id);
  if (target === "cancelled" && !existing) return { kind: "skipped", reason: "Dibatalkan sebelum pernah terkirim" };

  // ── Referensi ──
  const patient = await ensurePatientIhs(k.patientId, audit);
  if (!patient.ok) return { kind: "failed", message: patient.message, retryable: patient.retryable };

  const missing: string[] = [];
  let practitioner: { ihsId: string; nama: string } | undefined;
  if (k.dpjpId) {
    const d = await src.getDokter(k.dpjpId);
    const m = d ? await resourceMapDal.findByLocal(env, "Practitioner", d.pegawaiId) : null;
    if (d && m) {
      const p = d.pegawai;
      practitioner = { ihsId: m.ihsId, nama: [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(" ") };
    } else missing.push("DPJP belum terpetakan ke Practitioner (jalankan onboarding practitioner)");
  } else missing.push("Kunjungan tanpa DPJP");

  let location: { ihsId: string; nama: string } | undefined;
  if (k.ruanganId) {
    const [r, m] = await Promise.all([src.getRuangan(k.ruanganId), resourceMapDal.findByLocal(env, "Location", k.ruanganId)]);
    if (r && m) location = { ihsId: m.ihsId, nama: r.nama };
    else missing.push("Ruangan belum terpetakan ke Location (jalankan onboarding location)");
  } else missing.push("Kunjungan tanpa ruangan");

  // Kunjungan yang dibatalkan cukup ubah status — referensi lain tak wajib lengkap.
  if (missing.length && target !== "cancelled") return { kind: "failed", message: missing.join("; "), retryable: false };

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
  const baseRefs = { orgId, patient: { ihsId: patient.ihsId, nama: k.pasien.nama }, practitioner, location };
  const sendEncounter = (status: EncounterStatus, diagnoses: { ihsId: string; display: string; rank: number }[] = []) =>
    upsertClinicalResource({
      env, localType: "Encounter", localId: k.id, audit,
      resource: toFhirEncounter(local, { ...baseRefs, diagnoses }, status),
    });
  const refs: SyncRef[] = [];

  // Batal: cukup status cancelled.
  if (target === "cancelled") {
    const r = await sendEncounter("cancelled");
    if (!r?.ok) return fail(r?.ok === false ? r.error : undefined, "Gagal membatalkan Encounter");
    return { kind: "acked", refs: [{ resourceType: "Encounter", localId: k.id, ihsId: r.ihsId, op: r.op }] };
  }

  // ── Fase 1: pastikan Encounter ada ──
  let encounterIhs = existing?.ihsId;
  if (!encounterIhs) {
    const r = await sendEncounter("in-progress");
    if (!r?.ok) return fail(r?.ok === false ? r.error : undefined, "Gagal membuat Encounter");
    encounterIhs = r.ihsId;
    refs.push({ resourceType: "Encounter", localId: k.id, ihsId: r.ihsId, op: r.op });
  }

  // ── Fase 2: resource klinis inti ──
  const cl = await syncClinical(k.id, {
    env,
    audit,
    refs: {
      orgId,
      patient: { ihsId: patient.ihsId, nama: k.pasien.nama },
      encounter: { ihsId: encounterIhs, display: `Kunjungan ${k.pasien.nama} (${k.noKunjungan})` },
    },
  });
  refs.push(...cl.refs);

  // FH5: rantai obat (Medication → MedicationRequest → MedicationDispense).
  const med = await syncMedication(k.id, {
    env, orgId, unit: k.unit, audit,
    patient: { ihsId: patient.ihsId, nama: k.pasien.nama },
    encounterIhsId: encounterIhs,
  });
  refs.push(...med.refs);
  cl.failures.push(...med.failures);
  cl.notes.push(...med.notes);

  // FH6: penunjang Lab/Rad (ServiceRequest → Observation hasil → DiagnosticReport).
  const diag = await syncDiagnostic(k.id, {
    env, audit,
    refs: { orgId, patient: { ihsId: patient.ihsId, nama: k.pasien.nama }, encounter: { ihsId: encounterIhs } },
  });
  refs.push(...diag.refs);
  cl.failures.push(...diag.failures);
  cl.notes.push(...diag.notes);

  if (target === "finished" && !cl.conditionsOk) {
    return summarizeFailures(cl.failures, "Diagnosis (Condition) gagal terkirim — Encounter belum di-finish");
  }

  // ── Fase 3: Encounter final ──
  let diagnoses: { ihsId: string; display: string; rank: number }[] = [];
  if (target === "finished") {
    const dx = await src.listDiagnosaFinal(k.id);
    const maps = new Map((await resourceMapDal.findManyByLocal(env, "Condition", dx.map((d) => d.id))).map((m) => [m.localId, m.ihsId]));
    diagnoses = dx
      .filter((d) => maps.has(d.id))
      .map((d, i) => ({ ihsId: maps.get(d.id)!, display: `${d.kodeIcd10} ${d.namaDiagnosis}`, rank: i + 1 }));
  }
  const fin = await sendEncounter(target, diagnoses);
  if (!fin?.ok) return fail(fin?.ok === false ? fin.error : undefined, "Gagal memperbarui Encounter");
  if (fin.op !== "noop" || !refs.some((r) => r.resourceType === "Encounter")) {
    refs.push({ resourceType: "Encounter", localId: k.id, ihsId: fin.ihsId, op: fin.op });
  }

  if (cl.failures.length) return summarizeFailures(cl.failures, "Sebagian resource klinis gagal terkirim");
  return { kind: "acked", refs, ...(cl.notes.length ? { notes: cl.notes } : {}) };
}

function fail(error: FhirError | undefined, fallback: string): JobResult {
  return { kind: "failed", message: error?.message ?? fallback, retryable: error?.retryable ?? false, error };
}

function summarizeFailures(failures: { resourceType: string; message: string; retryable: boolean }[], head: string): JobResult {
  const detail = failures.slice(0, 3).map((f) => `${f.resourceType}: ${f.message}`).join(" | ");
  const more = failures.length > 3 ? ` (+${failures.length - 3} lainnya)` : "";
  return { kind: "failed", message: `${head} — ${detail}${more}`, retryable: failures.some((f) => f.retryable) };
}
