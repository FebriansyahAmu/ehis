// asesmenObstetriService — Asesmen·Riwayat·Obstetri (KB+GPA+ANC scalar; persalinan list).
// Append-only "latest wins".

import * as defaultDal from "@/lib/dal/asesmenMedis/asesmenObstetriDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AsesmenObstetriInput, AsesmenObstetriDTO } from "@/lib/schemas/asesmenMedis/asesmenObstetri";
import type { AsesmenObstetriEntity } from "@/lib/dal/asesmenMedis/asesmenObstetriDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<AsesmenObstetriEntity>;

function toDTO(r: NonNullEntity): AsesmenObstetriDTO {
  return {
    id: r.id,
    kunjunganId: r.kunjunganId,
    metodeKb: r.metodeKb,
    kbSejak: r.kbSejak,
    kbKeterangan: r.kbKeterangan,
    gravida: r.gravida,
    para: r.para,
    abortus: r.abortus,
    ancKunjungan: r.ancKunjungan,
    ancUsiaKehamilan: r.ancUsiaKehamilan,
    ancTempat: r.ancTempat,
    ancPetugas: r.ancPetugas,
    ancCatatan: r.ancCatatan,
    persalinan: r.persalinanItems.map((i) => ({
      id: i.id,
      tahun: i.tahun,
      usiaKehamilan: i.usiaKehamilan,
      jenis: i.jenis,
      bbLahir: i.bbLahir,
      kondisiAnak: i.kondisiAnak,
      keterangan: i.keterangan,
      urutan: i.urutan,
    })),
    pemeriksa: r.pemeriksa,
    authorUserId: r.authorUserId,
    createdAt: r.createdAt.toISOString(),
  };
}

export function makeAsesmenObstetriService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function save(kunjunganId: string, input: AsesmenObstetriInput, actor: Actor): Promise<AsesmenObstetriDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      metodeKb: input.metodeKb ?? null,
      kbSejak: input.kbSejak ?? null,
      kbKeterangan: input.kbKeterangan ?? null,
      gravida: input.gravida ?? null,
      para: input.para ?? null,
      abortus: input.abortus ?? null,
      ancKunjungan: input.ancKunjungan ?? null,
      ancUsiaKehamilan: input.ancUsiaKehamilan ?? null,
      ancTempat: input.ancTempat ?? null,
      ancPetugas: input.ancPetugas ?? null,
      ancCatatan: input.ancCatatan ?? null,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
      persalinan: input.persalinan.map((it, i) => ({
        tahun: it.tahun ?? null,
        usiaKehamilan: it.usiaKehamilan ?? null,
        jenis: it.jenis ?? null,
        bbLahir: it.bbLahir ?? null,
        kondisiAnak: it.kondisiAnak ?? null,
        keterangan: it.keterangan ?? null,
        urutan: i,
      })),
    });
    return toDTO(row);
  }

  async function getLatest(kunjunganId: string, _actor: Actor): Promise<AsesmenObstetriDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latestByKunjungan(kunjunganId);
    return row ? toDTO(row) : null;
  }

  return { save, getLatest };
}

export const asesmenObstetriService = makeAsesmenObstetriService();
