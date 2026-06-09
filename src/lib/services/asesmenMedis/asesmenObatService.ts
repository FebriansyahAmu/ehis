// asesmenObatService — Asesmen·Riwayat·Pemberian Obat. Append-only "latest wins"
// (parent + item snapshot). Nested create atomik → tanpa transaction eksplisit.

import * as defaultDal from "@/lib/dal/asesmenMedis/asesmenObatDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AsesmenObatInput, AsesmenObatDTO } from "@/lib/schemas/asesmenMedis/asesmenObat";
import type { AsesmenObatEntity } from "@/lib/dal/asesmenMedis/asesmenObatDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<AsesmenObatEntity>;

function toDTO(r: NonNullEntity): AsesmenObatDTO {
  return {
    id: r.id,
    kunjunganId: r.kunjunganId,
    items: r.items.map((i) => ({
      id: i.id,
      nama: i.nama,
      dosis: i.dosis,
      frekuensi: i.frekuensi,
      rute: i.rute,
      sejak: i.sejak,
      indikasi: i.indikasi,
      urutan: i.urutan,
    })),
    pemeriksa: r.pemeriksa,
    authorUserId: r.authorUserId,
    createdAt: r.createdAt.toISOString(),
  };
}

export function makeAsesmenObatService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function save(kunjunganId: string, input: AsesmenObatInput, actor: Actor): Promise<AsesmenObatDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
      items: input.items.map((it, i) => ({
        nama: it.nama,
        dosis: it.dosis ?? null,
        frekuensi: it.frekuensi ?? null,
        rute: it.rute ?? null,
        sejak: it.sejak ?? null,
        indikasi: it.indikasi ?? null,
        urutan: i,
      })),
    });
    return toDTO(row);
  }

  async function getLatest(kunjunganId: string, _actor: Actor): Promise<AsesmenObatDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latestByKunjungan(kunjunganId);
    return row ? toDTO(row) : null;
  }

  return { save, getLatest };
}

export const asesmenObatService = makeAsesmenObatService();
