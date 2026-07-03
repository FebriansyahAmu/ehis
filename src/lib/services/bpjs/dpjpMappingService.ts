// Service Mapping Hub "DPJP BPJS" — Dokter RS ↔ kode DPJP BPJS (R3 layering: Service → DAL).
// Sumbu Dokter↔kode (bukan ×Penjamin). RBAC di Route: master.mapping.

import * as dpjpDal from "@/lib/dal/bpjs/dpjpDal";
import { syncRefSpesialis, syncRefDpjp } from "./referensiDpjp";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  DpjpBoardRow, DpjpTersediaDTO, RefDpjpOption, RefDpjpQuery, SyncRefResult,
} from "@/lib/schemas/bpjs/dpjpMapping";

/** Board: semua dokter RS + status mapping. */
export async function listBoard(): Promise<DpjpBoardRow[]> {
  return dpjpDal.listDokterWithMapping();
}

/** Konsumsi klinis: dokter RS + kode DPJP BPJS ter-map (picker kodeDokter payload BPJS).
 *  Gate di Route = clinical.rekammedis:read (BUKAN master.mapping) — read-only, tanpa aksi mapping. */
export async function listDpjpTersedia(): Promise<DpjpTersediaDTO[]> {
  const rows = await dpjpDal.listDokterWithMapping();
  return rows.map((r) => ({
    dokterId: r.dokterId,
    pegawaiId: r.pegawaiId,
    nama: r.nama,
    spesialisKode: r.spesialisKode,
    kodeBpjs: r.mapped?.kode ?? null,
  }));
}

/** Picker referensi DPJP BPJS (search + filter spesialis). */
export async function searchRef(q: RefDpjpQuery): Promise<RefDpjpOption[]> {
  const rows = await dpjpDal.listRefDpjp({ search: q.search, kodeSpesialis: q.kodeSpesialis, limit: q.limit });
  return rows.map((r) => ({
    kode: r.kode,
    nama: r.nama,
    kodeSpesialis: r.kodeSpesialis ?? null,
    mappedDokterId: r.mapping?.dokterId ?? null,
  }));
}

/** Petakan dokter ↔ kode DPJP BPJS (1:1). Tolak bila kode sudah dipakai dokter lain. */
export async function setMapping(
  dokterId: string,
  refDpjpKode: string,
  actor: Actor,
): Promise<{ dokterId: string; refDpjpKode: string }> {
  const dokter = await dpjpDal.getDokterById(dokterId);
  if (!dokter) throw Errors.notFound("Dokter tidak ditemukan");

  const ref = await dpjpDal.getRefByKode(refDpjpKode);
  if (!ref) throw Errors.notFound("Kode DPJP BPJS tidak ditemukan (sinkronkan referensi dulu)");

  const existing = await dpjpDal.getMappingByRefKode(refDpjpKode);
  if (existing && existing.dokterId !== dokterId) {
    throw Errors.conflict("Kode DPJP ini sudah dipetakan ke dokter lain");
  }

  await dpjpDal.upsertMapping(dokterId, refDpjpKode, actor.userId);
  return { dokterId, refDpjpKode };
}

/** Lepas mapping dokter. */
export async function removeMapping(dokterId: string): Promise<void> {
  await dpjpDal.deleteMapping(dokterId);
}

/** Jalankan sync referensi (spesialis lalu dokter DPJP). Mock=seed demo / real=callBpjs. */
export async function runSync(actor: Actor): Promise<SyncRefResult> {
  const who = { actor: actor.userId, actorRole: actor.roles[0] ?? "admin" };
  const spesialis = await syncRefSpesialis(who);
  const dpjp = await syncRefDpjp({}, who);
  return { spesialis, dpjp };
}
