// asesmenGayaHidupService — Asesmen·Riwayat·Gaya Hidup. Append-only "latest wins".

import * as defaultDal from "@/lib/dal/asesmenMedis/asesmenGayaHidupDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AsesmenGayaHidupInput, AsesmenGayaHidupDTO } from "@/lib/schemas/asesmenMedis/asesmenGayaHidup";
import type { AsesmenGayaHidupEntity } from "@/lib/dal/asesmenMedis/asesmenGayaHidupDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<AsesmenGayaHidupEntity>;

function toDTO(r: NonNullEntity): AsesmenGayaHidupDTO {
  return {
    id: r.id,
    kunjunganId: r.kunjunganId,
    merokokStatus: r.merokokStatus,
    rokokPerHari: r.rokokPerHari,
    merokokSejak: r.merokokSejak,
    berhentiSejak: r.berhentiSejak,
    paparanAsap: r.paparanAsap,
    paparanDetail: r.paparanDetail,
    catatan: r.catatan,
    pemeriksa: r.pemeriksa,
    authorUserId: r.authorUserId,
    createdAt: r.createdAt.toISOString(),
  };
}

export function makeAsesmenGayaHidupService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function save(kunjunganId: string, input: AsesmenGayaHidupInput, actor: Actor): Promise<AsesmenGayaHidupDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      merokokStatus: input.merokokStatus ?? null,
      rokokPerHari: input.rokokPerHari ?? null,
      merokokSejak: input.merokokSejak ?? null,
      berhentiSejak: input.berhentiSejak ?? null,
      paparanAsap: input.paparanAsap ?? null,
      paparanDetail: input.paparanDetail ?? null,
      catatan: input.catatan ?? null,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  async function getLatest(kunjunganId: string, _actor: Actor): Promise<AsesmenGayaHidupDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latestByKunjungan(kunjunganId);
    return row ? toDTO(row) : null;
  }

  return { save, getLatest };
}

export const asesmenGayaHidupService = makeAsesmenGayaHidupService();
