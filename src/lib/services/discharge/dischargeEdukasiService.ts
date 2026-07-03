// dischargeEdukasiService — Discharge Planning step 2: Edukasi Bertahap (SNARS HPK 2).
// Daftar hidup log per topik: list · add (1 sesi edukasi) · remove (soft-delete; koreksi =
// hapus + baris baru). petugas SELALU nama actor login (server-otoritatif, anti-spoof).
// RBAC clinical.rekammedis di Route; ABAC careUnit di route() choke-point.

import * as defaultDal from "@/lib/dal/discharge/dischargeEdukasiDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { DischargeEdukasiEntity } from "@/lib/dal/discharge/dischargeEdukasiDal";
import {
  type DischargeEdukasiInput, type DischargeEdukasiDTO,
} from "@/lib/schemas/discharge/dischargeEdukasi";

type Dal = typeof defaultDal;

function toDTO(e: DischargeEdukasiEntity): DischargeEdukasiDTO {
  return {
    id: e.id,
    topikId: e.topikId,
    topik: e.topik,
    kategori: e.kategori,
    tanggal: e.tanggal,
    petugas: e.petugas,
    profesi: e.profesi,
    metode: e.metode,
    penerima: e.penerima,
    pemahaman: e.pemahaman,
    catatan: e.catatan,
    createdAt: e.createdAt.toISOString(),
  };
}

export function makeDischargeEdukasiService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertMilik(kunjunganId: string, itemId: string): Promise<DischargeEdukasiEntity> {
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Log edukasi tidak ditemukan");
    }
    return item;
  }

  /** GET — semua log edukasi aktif per kunjungan (terbaru dulu; FE grup per topik). */
  async function list(kunjunganId: string, _actor: Actor): Promise<DischargeEdukasiDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  /** POST — catat 1 sesi edukasi; petugas = actor login. */
  async function add(
    kunjunganId: string, input: DischargeEdukasiInput, actor: Actor,
  ): Promise<DischargeEdukasiDTO> {
    await assertKunjungan(kunjunganId);
    const petugas = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      topikId: input.topikId,
      topik: input.topik,
      kategori: input.kategori,
      tanggal: input.tanggal,
      profesi: input.profesi,
      metode: input.metode,
      penerima: input.penerima,
      pemahaman: input.pemahaman,
      catatan: input.catatan,
      petugas,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  /** DELETE — soft-delete (koreksi; jejak medico-legal utuh). */
  async function remove(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    await assertMilik(kunjunganId, itemId);
    await dal.softDelete(itemId);
  }

  return { list, add, remove };
}

export const dischargeEdukasiService = makeDischargeEdukasiService();
