// asesmenGinekologiService — Asesmen·Riwayat·Ginekologi. Append-only "latest wins".

import * as defaultDal from "@/lib/dal/asesmenMedis/asesmenGinekologiDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AsesmenGinekologiInput, AsesmenGinekologiDTO } from "@/lib/schemas/asesmenMedis/asesmenGinekologi";
import type { AsesmenGinekologiEntity } from "@/lib/dal/asesmenMedis/asesmenGinekologiDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<AsesmenGinekologiEntity>;

function toDTO(r: NonNullEntity): AsesmenGinekologiDTO {
  return {
    id: r.id,
    kunjunganId: r.kunjunganId,
    statusMenstruasi: r.statusMenstruasi,
    hpht: r.hpht,
    siklus: r.siklus,
    lamaMenstruasi: r.lamaMenstruasi,
    dismenorea: r.dismenorea,
    menoragia: r.menoragia,
    keputihan: r.keputihan,
    papSmear: r.papSmear,
    papTahun: r.papTahun,
    papHasil: r.papHasil,
    iva: r.iva,
    ivaTahun: r.ivaTahun,
    ivaHasil: r.ivaHasil,
    catatan: r.catatan,
    pemeriksa: r.pemeriksa,
    authorUserId: r.authorUserId,
    createdAt: r.createdAt.toISOString(),
  };
}

export function makeAsesmenGinekologiService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function save(kunjunganId: string, input: AsesmenGinekologiInput, actor: Actor): Promise<AsesmenGinekologiDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      statusMenstruasi: input.statusMenstruasi ?? null,
      hpht: input.hpht ?? null,
      siklus: input.siklus ?? null,
      lamaMenstruasi: input.lamaMenstruasi ?? null,
      dismenorea: input.dismenorea ?? null,
      menoragia: input.menoragia ?? null,
      keputihan: input.keputihan ?? null,
      papSmear: input.papSmear ?? null,
      papTahun: input.papTahun ?? null,
      papHasil: input.papHasil ?? null,
      iva: input.iva ?? null,
      ivaTahun: input.ivaTahun ?? null,
      ivaHasil: input.ivaHasil ?? null,
      catatan: input.catatan ?? null,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  async function getLatest(kunjunganId: string, _actor: Actor): Promise<AsesmenGinekologiDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latestByKunjungan(kunjunganId);
    return row ? toDTO(row) : null;
  }

  return { save, getLatest };
}

export const asesmenGinekologiService = makeAsesmenGinekologiService();
