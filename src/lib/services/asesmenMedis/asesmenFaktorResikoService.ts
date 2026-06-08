// asesmenFaktorResikoService — Asesmen·Riwayat·Faktor Resiko. Append-only "latest wins".

import * as defaultDal from "@/lib/dal/asesmenMedis/asesmenFaktorResikoDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AsesmenFaktorResikoInput, AsesmenFaktorResikoDTO } from "@/lib/schemas/asesmenMedis/asesmenFaktorResiko";
import type { AsesmenFaktorResikoEntity } from "@/lib/dal/asesmenMedis/asesmenFaktorResikoDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<AsesmenFaktorResikoEntity>;

function toDTO(r: NonNullEntity): AsesmenFaktorResikoDTO {
  return {
    id: r.id,
    kunjunganId: r.kunjunganId,
    penyakit: r.penyakit,
    penyakitLain: r.penyakitLain,
    perilaku: r.perilaku,
    perilakuLain: r.perilakuLain,
    pemeriksa: r.pemeriksa,
    authorUserId: r.authorUserId,
    createdAt: r.createdAt.toISOString(),
  };
}

export function makeAsesmenFaktorResikoService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function save(kunjunganId: string, input: AsesmenFaktorResikoInput, actor: Actor): Promise<AsesmenFaktorResikoDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      penyakit: input.penyakit,
      penyakitLain: input.penyakitLain ?? null,
      perilaku: input.perilaku,
      perilakuLain: input.perilakuLain ?? null,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  async function getLatest(kunjunganId: string, _actor: Actor): Promise<AsesmenFaktorResikoDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latestByKunjungan(kunjunganId);
    return row ? toDTO(row) : null;
  }

  return { save, getLatest };
}

export const asesmenFaktorResikoService = makeAsesmenFaktorResikoService();
