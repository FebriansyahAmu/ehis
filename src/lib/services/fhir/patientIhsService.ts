// FH2 — IHS Patient SatuSehat by NIK (R15). SatuSehat = OWNER master pasien (data Dukcapil).
// Default = GET `Patient?identifier=nik|…`. Playbook MPI "Pasien dengan NIK": bila GET tidak
// menemukan pasien, RS WAJIB POST Create Patient (`registerPatient`) — SatuSehat mencocokkan
// elemen identitas ke Dukcapil sebelum menerbitkan IHS. POST tidak pernah dilakukan tanpa GET dulu,
// dan tidak otomatis dari worker Encounter (operator memeriksa kelengkapan & menekan Daftarkan).
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
import { checkPatientCreate, toFhirPatientCreate, type LocalPatientForCreate } from "@/lib/fhir/adapters/patientCreate";
import type { Actor } from "@/lib/auth/actor";
import type {
  NikLookupDTO, PatientBatchDTO, PatientCreateCheckDTO, PatientIhsDTO, PatientIhsStatus, PatientRegisterDTO,
} from "@/lib/schemas/fhir/patient";

type PatientRow = NonNullable<Awaited<ReturnType<typeof patientDal.getPatient>>>;
type CreateRow = NonNullable<Awaited<ReturnType<typeof patientDal.getPatientForCreate>>>;

interface FhirPatient extends FhirResourceBase {
  resourceType: "Patient";
  identifier?: { system?: string; value?: string }[];
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
    return {
      ...base, status: "not_found", ihsId: null, lastSyncAt: null,
      message: "NIK tidak ditemukan di SatuSehat — periksa ulang NIK; bila sudah benar, daftarkan pasien (POST Patient)",
    };
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

// ── Daftarkan pasien (GET dulu → POST bila tidak ditemukan) ─

/** Cegah POST ganda untuk pasien yang sama di proses ini (klik ganda / dua tab). */
const registering = new Set<string>();

export async function registerPatient(patientId: string, actor: Actor): Promise<PatientRegisterDTO> {
  const p = await patientDal.getPatientForCreate(patientId);
  if (!p) throw Errors.notFound("Pasien tidak ditemukan");
  if (p.mergedIntoId) throw Errors.validation("Pasien ini sudah digabung (merge) — daftarkan rekam survivor");
  const env = getSatuSehatConfig().mode;
  const base = { patientId: p.id, noRm: p.noRm, mode: env };

  const known = await resourceMapDal.findByLocal(env, "Patient", p.id);
  if (known) {
    return { ...base, outcome: "cached", ihsId: known.ihsId, lastSyncAt: known.lastSyncAt.toISOString(), message: "Sudah terpetakan — tidak didaftarkan ulang" };
  }

  const nik = nikOf(p);
  const input = createInput(p, nik, kkOf(p));
  const { kurang } = checkPatientCreate(input);
  if (!nik || kurang.length) {
    return { ...base, outcome: "incomplete", ihsId: null, lastSyncAt: null, kurang, message: "Data pasien belum lengkap untuk POST Patient — lengkapi di registrasi" };
  }

  if (registering.has(p.id)) throw Errors.conflict("Pendaftaran pasien ini sedang diproses — tunggu hingga selesai");
  registering.add(p.id);
  try {
    const audit = auditActorOf(actor);

    // 1) GET by NIK — langkah 1 Playbook; jangan POST bila sudah ada.
    const found = await searchByNik(nik, audit, p.id);
    if (!found.ok) {
      return { ...base, outcome: "failed", ihsId: null, lastSyncAt: null, message: `Cari by NIK gagal — POST dibatalkan: ${found.message}` };
    }
    if (found.patient?.id) return mapExisting(p, env, found.patient, found.patient.id, base);

    // 2) POST Create Patient record.
    const res = await fhirRequest<FhirPatient>(
      { method: "POST", path: "Patient", body: toFhirPatientCreate(input) },
      { ...audit, endpoint: "Patient · daftar (POST)", resourceType: "Patient", nik, localType: "Patient", localId: p.id },
    );
    if (!res.ok) {
      // Terdaftar oleh pihak lain di antara GET dan POST → ambil yang ada, bukan gagal.
      if (res.error.status === 409) {
        const again = await searchByNik(nik, audit, p.id);
        if (again.ok && again.patient?.id) return mapExisting(p, env, again.patient, again.patient.id, base);
      }
      return {
        ...base, outcome: "failed", ihsId: null, lastSyncAt: null,
        message: `SatuSehat menolak pendaftaran: ${res.error.message}`,
        ...(res.error.issues?.length ? { issues: res.error.issues.map(issueText) } : {}),
      };
    }

    const body = res.value.body;
    const ihsId = body?.id ?? body?.identifier?.find((i) => i.system === FHIR_SYSTEM.ihsNumber)?.value;
    if (!ihsId) {
      return { ...base, outcome: "failed", ihsId: null, lastSyncAt: null, message: "SatuSehat menerima POST tetapi tidak mengembalikan id — cek Log pengiriman, lalu Cari IHS" };
    }
    const saved = await resourceMapDal.upsert({
      env, localType: "Patient", localId: p.id, resourceType: "Patient", ihsId, versionId: body?.meta?.versionId ?? null,
    });
    if (env === "prod" && p.idSatusehat !== ihsId) await patientDal.setIdSatusehat(p.id, ihsId);
    return { ...base, outcome: "created", ihsId, lastSyncAt: saved.lastSyncAt.toISOString(), message: `Pasien terdaftar di SatuSehat — IHS ${ihsId}` };
  } finally {
    registering.delete(p.id);
  }
}

async function mapExisting(
  p: CreateRow,
  env: SatuSehatMode,
  pt: FhirPatient,
  ihsId: string,
  base: { patientId: string; noRm: string; mode: SatuSehatMode },
): Promise<PatientRegisterDTO> {
  const saved = await resourceMapDal.upsert({ env, localType: "Patient", localId: p.id, resourceType: "Patient", ihsId });
  if (env === "prod" && p.idSatusehat !== ihsId) await patientDal.setIdSatusehat(p.id, ihsId);
  const v = verify(p, pt);
  const beda = v.gender === false || v.tanggalLahir === false;
  return {
    ...base, outcome: "resolved", ihsId, lastSyncAt: saved.lastSyncAt.toISOString(),
    message: beda
      ? `Sudah terdaftar (IHS ${ihsId}) — dipetakan tanpa POST, tetapi jenis kelamin/tanggal lahir BERBEDA dengan SatuSehat`
      : `Sudah terdaftar di SatuSehat (IHS ${ihsId}) — dipetakan tanpa POST`,
  };
}

/**
 * Pratinjau body POST Patient + kesiapan untuk konsol (tanpa panggilan SatuSehat). `mask` mengganti
 * NIK/KK terenkripsi dengan versi dimasker untuk ditampilkan.
 */
export async function previewPatientCreate(
  patientId: string,
  mask: (enc: string | null) => string | null,
): Promise<{ payload: FhirResourceBase; check: PatientCreateCheckDTO } | null> {
  const p = await patientDal.getPatientForCreate(patientId);
  if (!p) return null;
  const { kurang, saran } = checkPatientCreate(createInput(p, nikOf(p), kkOf(p)));
  return {
    payload: toFhirPatientCreate(createInput(p, mask(p.nikEnc), kkOf(p) ? mask(p.noKkEnc) : null)),
    check: { siap: kurang.length === 0, kurang, saran },
  };
}

function createInput(p: CreateRow, nik: string | null, noKk: string | null): LocalPatientForCreate {
  return {
    nik, noKk,
    nama: p.nama, gender: p.gender, tanggalLahir: p.tanggalLahir, tempatLahir: p.tempatLahir,
    statusPerkawinan: p.statusPerkawinan, noHp: p.noHp, isWna: p.isWna, isAnonim: p.isAnonim,
    alamatKtp: p.alamat[0] ?? null,
  };
}

function kkOf(p: CreateRow): string | null {
  if (!p.noKkEnc) return null;
  try {
    const kk = decryptPii(p.noKkEnc).replace(/\D/g, "");
    return kk.length === 16 ? kk : null;
  } catch {
    return null;
  }
}

function issueText(i: { diagnostics?: string; details?: { text?: string }; code: string; expression?: string[] }): string {
  const what = i.diagnostics ?? i.details?.text ?? i.code;
  return i.expression?.length ? `${i.expression.join(", ")}: ${what}` : what;
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
