// asesmenPerawatanService — Asesmen·Riwayat·Perawatan & Tindakan (rawat + bedah).
// Append-only "latest wins".

import * as defaultDal from "@/lib/dal/asesmenMedis/asesmenPerawatanDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AsesmenPerawatanInput, AsesmenPerawatanDTO } from "@/lib/schemas/asesmenMedis/asesmenPerawatan";
import type { AsesmenPerawatanEntity } from "@/lib/dal/asesmenMedis/asesmenPerawatanDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<AsesmenPerawatanEntity>;

function toDTO(r: NonNullEntity): AsesmenPerawatanDTO {
  return {
    id: r.id,
    kunjunganId: r.kunjunganId,
    rawat: r.rawatItems.map((i) => ({
      id: i.id,
      rs: i.rs,
      unit: i.unit,
      tanggal: i.tanggal,
      diagnosa: i.diagnosa,
      keterangan: i.keterangan,
      urutan: i.urutan,
    })),
    bedah: r.pembedahanItems.map((i) => ({
      id: i.id,
      tanggal: i.tanggal,
      tindakan: i.tindakan,
      rs: i.rs,
      dokter: i.dokter,
      keterangan: i.keterangan,
      urutan: i.urutan,
    })),
    pemeriksa: r.pemeriksa,
    authorUserId: r.authorUserId,
    createdAt: r.createdAt.toISOString(),
  };
}

export function makeAsesmenPerawatanService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function save(kunjunganId: string, input: AsesmenPerawatanInput, actor: Actor): Promise<AsesmenPerawatanDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
      rawat: input.rawat.map((it, i) => ({
        rs: it.rs ?? null,
        unit: it.unit ?? null,
        tanggal: it.tanggal ?? null,
        diagnosa: it.diagnosa ?? null,
        keterangan: it.keterangan ?? null,
        urutan: i,
      })),
      bedah: input.bedah.map((it, i) => ({
        tanggal: it.tanggal ?? null,
        tindakan: it.tindakan ?? null,
        rs: it.rs ?? null,
        dokter: it.dokter ?? null,
        keterangan: it.keterangan ?? null,
        urutan: i,
      })),
    });
    return toDTO(row);
  }

  async function getLatest(kunjunganId: string, _actor: Actor): Promise<AsesmenPerawatanDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latestByKunjungan(kunjunganId);
    return row ? toDTO(row) : null;
  }

  return { save, getLatest };
}

export const asesmenPerawatanService = makeAsesmenPerawatanService();
