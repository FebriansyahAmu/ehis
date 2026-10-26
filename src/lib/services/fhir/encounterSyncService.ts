// FH3 — Sinkron 1 Encounter (dipanggil outbox worker, aktor sistem). Bangun payload dari state
// kunjungan TERKINI → POST (belum terpetakan) / PUT (sudah, bila hash berubah) → ResourceMap.
//
// Prasyarat referensi (resolve-first, R15): Patient (di-resolve otomatis bila belum), Practitioner
// DPJP & Location ruangan (WAJIB sudah onboarding FH1 — bila belum, job gagal non-retry, antre
// ulang manual setelah onboarding).

import "server-only";
import { createHash } from "node:crypto";
import { getSatuSehatConfig } from "@/lib/fhir/server/config";
import { encounterStatusOf, toFhirEncounter, type FhirEncounter } from "@/lib/fhir/adapters/encounter";
import type { FhirError, FhirResourceBase } from "@/lib/fhir/fhirShared";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as src from "@/lib/dal/fhir/encounterSourceDal";
import { fhirRequest } from "./transport";
import { ensurePatientIhs } from "./patientIhsService";
import type { auditActorOf } from "./audit";

export type JobResult =
  | { kind: "acked"; refs: { resourceType: string; localId: string; ihsId: string; op: "create" | "update" | "noop" }[] }
  | { kind: "skipped"; reason: string }
  | { kind: "failed"; message: string; retryable: boolean; error?: FhirError };

const hashOf = (r: unknown) => createHash("sha256").update(JSON.stringify(r)).digest("hex");

export async function syncEncounter(kunjunganId: string, audit: ReturnType<typeof auditActorOf>): Promise<JobResult> {
  const k = await src.getKunjungan(kunjunganId);
  if (!k) return { kind: "skipped", reason: "Kunjungan tidak ditemukan / dihapus" };

  const status = encounterStatusOf(k.status);
  if (!status) return { kind: "skipped", reason: `Status ${k.status} belum dikirim (menunggu diterima)` };

  const { mode: env, orgId } = getSatuSehatConfig();
  const existing = await resourceMapDal.findByLocal(env, "Encounter", k.id);
  if (status === "cancelled" && !existing) return { kind: "skipped", reason: "Dibatalkan sebelum pernah terkirim" };

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
  if (missing.length && status !== "cancelled") return { kind: "failed", message: missing.join("; "), retryable: false };

  // Diagnosis (FH4): hanya Condition yang sudah terpetakan.
  let diagnoses: { ihsId: string; display: string; rank: number }[] = [];
  if (status === "finished") {
    const dx = await src.listDiagnosaFinal(k.id);
    const maps = new Map((await resourceMapDal.findManyByLocal(env, "Condition", dx.map((d) => d.id))).map((m) => [m.localId, m.ihsId]));
    diagnoses = dx
      .filter((d) => maps.has(d.id))
      .map((d, i) => ({ ihsId: maps.get(d.id)!, display: `${d.kodeIcd10} ${d.namaDiagnosis}`, rank: i + 1 }));
  }

  const resource = toFhirEncounter(
    {
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
    },
    { orgId, patient: { ihsId: patient.ihsId, nama: k.pasien.nama }, practitioner, location, diagnoses },
    status,
  );
  const hash = hashOf(resource);

  if (existing?.hash === hash) {
    return { kind: "acked", refs: [{ resourceType: "Encounter", localId: k.id, ihsId: existing.ihsId, op: "noop" }] };
  }

  const res = existing
    ? await fhirRequest<FhirEncounter>(
        { method: "PUT", path: `Encounter/${existing.ihsId}`, body: { ...resource, id: existing.ihsId } },
        { ...audit, endpoint: "Encounter/{id}", resourceType: "Encounter" },
      )
    : await fhirRequest<FhirEncounter>(
        { method: "POST", path: "Encounter", body: resource },
        { ...audit, endpoint: "Encounter", resourceType: "Encounter" },
      );
  if (!res.ok) return { kind: "failed", message: res.error.message, retryable: res.error.retryable, error: res.error };

  const ihsId = existing?.ihsId ?? res.value.body?.id;
  if (!ihsId) return { kind: "failed", message: "Respons SatuSehat tanpa id Encounter", retryable: false };
  await resourceMapDal.upsert({
    env, localType: "Encounter", localId: k.id, resourceType: "Encounter", ihsId, hash,
    versionId: (res.value.body as FhirResourceBase | null)?.meta?.versionId ?? null,
  });
  return { kind: "acked", refs: [{ resourceType: "Encounter", localId: k.id, ihsId, op: existing ? "update" : "create" }] };
}
