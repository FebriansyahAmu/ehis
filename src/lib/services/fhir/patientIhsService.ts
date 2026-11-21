// FH2 — Resolve IHS Patient SatuSehat by NIK (R15). SatuSehat = OWNER master pasien (data
// Dukcapil) → RS TIDAK membuat Patient untuk pasien ber-NIK; cukup GET `Patient?identifier=nik|…`.
//
// - Hasil disimpan ke `fhir.ResourceMap(env, Patient, pasienId)`; `Pasien.idSatusehat` hanya env prod.
// - Verifikasi ringan gender + tanggal lahir lokal vs SatuSehat (data quality / SKP 1) — beda =
//   peringatan, peta tetap disimpan (NIK = anchor identitas).
// - Pasien tanpa NIK (Mr.X/WNA/bayi baru lahir) → `no_nik`; create Patient by NIK-ibu/paspor
//   ditunda (FHIR-GAP FG-20).

import "server-only";
import { getSatuSehatConfig } from "@/lib/fhir/server/config";
import { FHIR_SYSTEM, type Bundle, type FhirResourceBase, type SatuSehatMode } from "@/lib/fhir/fhirShared";
import { decryptPii } from "@/lib/crypto/pii";
import { Errors } from "@/lib/errors/appError";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as patientDal from "@/lib/dal/fhir/patientSourceDal";
import { fhirRequest } from "./transport";
import { auditActorOf } from "./audit";
import type { Actor } from "@/lib/auth/actor";
import type { NikLookupDTO, PatientBatchDTO, PatientIhsDTO, PatientIhsStatus } from "@/lib/schemas/fhir/patient";

type PatientRow = NonNullable<Awaited<ReturnType<typeof patientDal.getPatient>>>;

interface FhirPatient extends FhirResourceBase {
  resourceType: "Patient";
  name?: { text?: string; given?: string[]; family?: string }[];
  gender?: string;
  birthDate?: string;
}

const GENDER: Record<string, string> = { L: "male", P: "female" };

/** Cegah batch paralel di proses ini. */
let batchRunning = false;

// ── Baca peta (tanpa panggilan SatuSehat) ───────────────────

export async function getForPatient(patientId: string): Promise<PatientIhsDTO> {
  const p = await patientDal.getPatient(patientId);
  if (!p) throw Errors.notFound("Pasien tidak ditemukan");
  const env = getSatuSehatConfig().mode;
  const m = await resourceMapDal.findByLocal(env, "Patient", p.id);
  return {
    patientId: p.id,
    noRm: p.noRm,
    mode: env,
    status: m ? "cached" : nikOf(p) ? "not_found" : "no_nik",
    ihsId: m?.ihsId ?? null,
    lastSyncAt: m?.lastSyncAt.toISOString() ?? null,
    message: m ? undefined : nikOf(p) ? "Belum di-resolve ke SatuSehat" : noNikReason(p),
  };
}

// ── Resolve 1 pasien ────────────────────────────────────────

export async function resolveForPatient(patientId: string, actor: Actor, opts: { force?: boolean } = {}): Promise<PatientIhsDTO> {
  const p = await patientDal.getPatient(patientId);
  if (!p) throw Errors.notFound("Pasien tidak ditemukan");
  if (p.mergedIntoId) throw Errors.validation("Pasien ini sudah digabung (merge) — resolve pada rekam survivor");
  return resolveRow(p, getSatuSehatConfig().mode, auditActorOf(actor), !!opts.force);
}

async function resolveRow(
  p: PatientRow,
  env: SatuSehatMode,
  audit: ReturnType<typeof auditActorOf>,
  force: boolean,
): Promise<PatientIhsDTO> {
  const base = { patientId: p.id, noRm: p.noRm, mode: env };

  if (!force) {
    const m = await resourceMapDal.findByLocal(env, "Patient", p.id);
    if (m) return { ...base, status: "cached", ihsId: m.ihsId, lastSyncAt: m.lastSyncAt.toISOString() };
  }

  const nik = nikOf(p);
  if (!nik) return { ...base, status: "no_nik", ihsId: null, lastSyncAt: null, message: noNikReason(p) };

  const res = await searchByNik(nik, audit, p.id);
  if (!res.ok) return { ...base, status: "failed", ihsId: null, lastSyncAt: null, message: res.message };
  if (!res.patient?.id) {
    return { ...base, status: "not_found", ihsId: null, lastSyncAt: null, message: "NIK tidak ditemukan di SatuSehat — periksa ulang NIK pasien" };
  }

  const ihsId = res.patient.id;
  const saved = await resourceMapDal.upsert({ env, localType: "Patient", localId: p.id, resourceType: "Patient", ihsId });
  if (env === "prod" && p.idSatusehat !== ihsId) await patientDal.setIdSatusehat(p.id, ihsId);

  const verifikasi = verify(p, res.patient);
  const mismatch = verifikasi.gender === false || verifikasi.tanggalLahir === false;
  return {
    ...base,
    status: "resolved",
    ihsId,
    lastSyncAt: saved.lastSyncAt.toISOString(),
    verifikasi,
    ...(mismatch ? { message: "Identitas lokal BERBEDA dengan SatuSehat (jenis kelamin/tanggal lahir) — verifikasi ulang di registrasi" } : {}),
  };
}

// ── Pastikan IHS ada (dipakai worker Encounter, aktor sistem) ─

export type EnsureIhsResult = { ok: true; ihsId: string } | { ok: false; message: string; retryable: boolean };

export async function ensurePatientIhs(patientId: string, audit: ReturnType<typeof auditActorOf>): Promise<EnsureIhsResult> {
  const env = getSatuSehatConfig().mode;
  const m = await resourceMapDal.findByLocal(env, "Patient", patientId);
  if (m) return { ok: true, ihsId: m.ihsId };
  const p = await patientDal.getPatient(patientId);
  if (!p) return { ok: false, message: "Pasien tidak ditemukan", retryable: false };
  const r = await resolveRow(p, env, audit, false);
  if (r.ihsId) return { ok: true, ihsId: r.ihsId };
  return { ok: false, message: `IHS Patient: ${r.message ?? r.status}`, retryable: r.status === "failed" };
}

// ── Batch (pasien belum terpetakan) ─────────────────────────

export async function resolveBatch(actor: Actor, limit: number): Promise<PatientBatchDTO> {
  if (batchRunning) throw Errors.conflict("Resolve batch pasien sedang berjalan — tunggu hingga selesai");
  batchRunning = true;
  const t0 = Date.now();
  try {
    const env = getSatuSehatConfig().mode;
    const audit = auditActorOf(actor);
    const rows = await patientDal.listUnresolved(env, limit);
    const counts: Record<PatientIhsStatus, number> = { cached: 0, resolved: 0, not_found: 0, no_nik: 0, failed: 0 };
    const perhatian: PatientIhsDTO[] = [];

    // Sekuensial — hormati kuota SatuSehat (R11); batch dibatasi ≤100.
    for (const p of rows) {
      const r = await resolveRow(p, env, audit, false);
      counts[r.status]++;
      if (r.status !== "resolved" && r.status !== "cached") perhatian.push(r);
      else if (r.message) perhatian.push(r); // resolved tapi identitas tak cocok
    }

    return { mode: env, diproses: rows.length, counts, perhatian, sisa: rows.length === limit, durationMs: Date.now() - t0 };
  } finally {
    batchRunning = false;
  }
}

// ── Tool NIK lookup (tanpa menyimpan) ───────────────────────

export async function lookupByNik(nik: string, actor: Actor): Promise<NikLookupDTO> {
  const env = getSatuSehatConfig().mode;
  const res = await searchByNik(nik, auditActorOf(actor));
  if (!res.ok) throw Errors.validation(`SatuSehat: ${res.message}`);
  const pt = res.patient;
  return {
    mode: env,
    found: !!pt?.id,
    ihsId: pt?.id ?? null,
    nama: pt?.name?.[0]?.text ?? ([pt?.name?.[0]?.given?.join(" "), pt?.name?.[0]?.family].filter(Boolean).join(" ") || null),
    gender: pt?.gender ?? null,
    tanggalLahir: pt?.birthDate ?? null,
  };
}

// ── Helper ──────────────────────────────────────────────────

/** `patientId` = tautan log pengiriman ke pasien lokal (tool lookup NIK tanpa pasien → tak ditautkan). */
async function searchByNik(
  nik: string,
  audit: ReturnType<typeof auditActorOf>,
  patientId?: string,
): Promise<{ ok: true; patient: FhirPatient | null } | { ok: false; message: string }> {
  const res = await fhirRequest<Bundle<FhirPatient>>(
    { method: "GET", path: `Patient?identifier=${encodeURIComponent(`${FHIR_SYSTEM.nik}|${nik}`)}` },
    {
      ...audit, endpoint: "Patient?identifier={nik}", resourceType: "Patient", nik,
      ...(patientId ? { localType: "Patient", localId: patientId } : {}),
    },
  );
  if (!res.ok) return { ok: false, message: res.error.message };
  return { ok: true, patient: res.value.body?.entry?.[0]?.resource ?? null };
}

function nikOf(p: PatientRow): string | null {
  if (p.isAnonim || p.isWna || !p.nikEnc) return null;
  try {
    const nik = decryptPii(p.nikEnc).replace(/\D/g, "");
    return nik.length === 16 ? nik : null;
  } catch {
    return null;
  }
}

function noNikReason(p: PatientRow): string {
  if (p.isAnonim) return "Pasien anonim (Mr.X) — lengkapi identitas dulu";
  if (p.isWna) return "Pasien WNA (paspor) — resolve by paspor belum didukung";
  return "NIK kosong / tidak valid (harus 16 digit)";
}

function verify(p: PatientRow, s: FhirPatient): { gender: boolean | null; tanggalLahir: boolean | null } {
  const lahir = p.tanggalLahir ? p.tanggalLahir.toISOString().slice(0, 10) : null;
  return {
    gender: s.gender ? GENDER[p.gender] === s.gender : null,
    tanggalLahir: s.birthDate && lahir ? s.birthDate === lahir : null,
  };
}
