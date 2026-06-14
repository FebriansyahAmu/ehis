// penandaanAnatomiService — tab Pemeriksaan, sub Anatomi (body-map per area). Daftar hidup:
// list · add (tandai area) · update (catatan) · remove (soft-delete, lepas tanda). pemeriksa =
// input override ATAU nama actor. RBAC di Route: clinical.pemeriksaan (read/create/update/delete).
// ABAC careUnit di route() choke-point (clinical.* + params.id). Selaras tindakanMedisService.

import * as defaultDal from "@/lib/dal/pemeriksaan/penandaanAnatomiDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { PenandaanEntity } from "@/lib/dal/pemeriksaan/penandaanAnatomiDal";
import {
  type PenandaanAnatomiInput, type PenandaanAnatomiUpdate, type PenandaanAnatomiDTO,
} from "@/lib/schemas/pemeriksaan/penandaanAnatomi";

type Dal = typeof defaultDal;

function toDTO(e: PenandaanEntity): PenandaanAnatomiDTO {
  return { id: e.id, region: e.region, label: e.label, catatan: e.catatan };
}

export function makePenandaanAnatomiService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertMilik(kunjunganId: string, itemId: string): Promise<PenandaanEntity> {
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Penandaan anatomi tidak ditemukan");
    }
    return item;
  }

  async function list(kunjunganId: string, _actor: Actor): Promise<PenandaanAnatomiDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  async function add(
    kunjunganId: string, input: PenandaanAnatomiInput, actor: Actor,
  ): Promise<PenandaanAnatomiDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = input.pemeriksa?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      region: input.region,
      label: input.label,
      catatan: input.catatan?.trim() ?? "",
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  async function update(
    kunjunganId: string, itemId: string, input: PenandaanAnatomiUpdate, _actor: Actor,
  ): Promise<PenandaanAnatomiDTO> {
    await assertKunjungan(kunjunganId);
    await assertMilik(kunjunganId, itemId);
    if (input.catatan !== undefined) {
      const count = await dal.update(itemId, { catatan: input.catatan.trim() });
      if (count === 0) throw Errors.notFound("Penandaan anatomi tidak ditemukan");
    }
    return toDTO(await assertMilik(kunjunganId, itemId));
  }

  async function remove(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    await assertMilik(kunjunganId, itemId);
    await dal.softDelete(itemId);
  }

  return { list, add, update, remove };
}

export const penandaanAnatomiService = makePenandaanAnatomiService();
