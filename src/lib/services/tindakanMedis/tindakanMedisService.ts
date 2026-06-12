// tindakanMedisService — tab Tindakan (pencatatan tindakan dilakukan per kunjungan). Per-item
// tambah/ubah-jumlah/hapus(soft). Pelaksana = input (override) atau nama actor (user login).
// RBAC di Route: clinical.tindakan (read/create/update/delete). ABAC careUnit di route() choke-point
// (clinical.*). Selaras diagnosaService (bagian prosedur).

import * as defaultDal from "@/lib/dal/tindakanMedis/tindakanMedisDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  TindakanMedisInput, TindakanMedisUpdate, TindakanMedisDTO,
} from "@/lib/schemas/tindakanMedis/tindakanMedis";
import type { TindakanMedisEntity } from "@/lib/dal/tindakanMedis/tindakanMedisDal";

type Dal = typeof defaultDal;

function toDTO(t: TindakanMedisEntity): TindakanMedisDTO {
  return {
    id: t.id,
    tindakanId: t.tindakanId ?? null,
    kode: t.kode,
    nama: t.nama,
    kategori: t.kategori,
    jumlah: t.jumlah,
    harga: t.harga ?? null,
    pelaksana: t.pelaksana,
    dilakukanPada: t.dilakukanPada.toISOString(),
    createdAt: t.createdAt.toISOString(),
  };
}

export function makeTindakanMedisService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertMilik(kunjunganId: string, itemId: string): Promise<TindakanMedisEntity> {
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Tindakan tidak ditemukan");
    }
    return item;
  }

  async function list(kunjunganId: string, _actor: Actor): Promise<TindakanMedisDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  async function add(
    kunjunganId: string,
    input: TindakanMedisInput,
    actor: Actor,
  ): Promise<TindakanMedisDTO> {
    await assertKunjungan(kunjunganId);
    const pelaksana = input.pelaksana?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      tindakanId: input.tindakanId ?? null,
      kode: input.kode ?? "",
      nama: input.nama,
      kategori: input.kategori,
      jumlah: input.jumlah,
      harga: input.harga ?? null,
      penjaminKode: input.penjaminKode ?? null,
      jenisRuangan: input.jenisRuangan ?? null,
      pelaksana,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  async function update(
    kunjunganId: string,
    itemId: string,
    input: TindakanMedisUpdate,
    _actor: Actor,
  ): Promise<TindakanMedisDTO> {
    await assertKunjungan(kunjunganId);
    await assertMilik(kunjunganId, itemId);
    const count = await dal.update(itemId, { jumlah: input.jumlah, pelaksana: input.pelaksana });
    if (count === 0) throw Errors.notFound("Tindakan tidak ditemukan");
    return toDTO(await assertMilik(kunjunganId, itemId));
  }

  async function remove(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    await assertMilik(kunjunganId, itemId);
    await dal.softDelete(itemId);
  }

  return { list, add, update, remove };
}

export const tindakanMedisService = makeTindakanMedisService();
