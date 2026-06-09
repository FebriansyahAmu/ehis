// asesmenPenyakitKeluargaService — Asesmen·Riwayat·Penyakit Keluarga. Append-only "latest wins".

import * as defaultDal from "@/lib/dal/asesmenMedis/asesmenPenyakitKeluargaDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AsesmenPenyakitKeluargaInput, AsesmenPenyakitKeluargaDTO } from "@/lib/schemas/asesmenMedis/asesmenPenyakitKeluarga";
import type { AsesmenPenyakitKeluargaEntity } from "@/lib/dal/asesmenMedis/asesmenPenyakitKeluargaDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<AsesmenPenyakitKeluargaEntity>;

function toDTO(r: NonNullEntity): AsesmenPenyakitKeluargaDTO {
  return {
    id: r.id,
    kunjunganId: r.kunjunganId,
    riwayatLain: r.riwayatLain,
    items: r.items.map((i) => ({
      id: i.id,
      anggota: i.anggota,
      penyakit: i.penyakit,
      keterangan: i.keterangan,
      urutan: i.urutan,
    })),
    pemeriksa: r.pemeriksa,
    authorUserId: r.authorUserId,
    createdAt: r.createdAt.toISOString(),
  };
}

export function makeAsesmenPenyakitKeluargaService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function save(
    kunjunganId: string,
    input: AsesmenPenyakitKeluargaInput,
    actor: Actor,
  ): Promise<AsesmenPenyakitKeluargaDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      riwayatLain: input.riwayatLain ?? null,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
      items: input.items.map((it, i) => ({
        anggota: it.anggota,
        penyakit: it.penyakit,
        keterangan: it.keterangan ?? null,
        urutan: i,
      })),
    });
    return toDTO(row);
  }

  async function getLatest(kunjunganId: string, _actor: Actor): Promise<AsesmenPenyakitKeluargaDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latestByKunjungan(kunjunganId);
    return row ? toDTO(row) : null;
  }

  return { save, getLatest };
}

export const asesmenPenyakitKeluargaService = makeAsesmenPenyakitKeluargaService();
