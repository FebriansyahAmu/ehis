// asesmenTuberkulosisService — Asesmen·Riwayat·Tuberkulosis. Append-only "latest wins".

import * as defaultDal from "@/lib/dal/asesmenMedis/asesmenTuberkulosisDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AsesmenTuberkulosisInput, AsesmenTuberkulosisDTO } from "@/lib/schemas/asesmenMedis/asesmenTuberkulosis";
import type { AsesmenTuberkulosisEntity } from "@/lib/dal/asesmenMedis/asesmenTuberkulosisDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<AsesmenTuberkulosisEntity>;

function toDTO(r: NonNullEntity): AsesmenTuberkulosisDTO {
  return {
    id: r.id,
    kunjunganId: r.kunjunganId,
    riwayatTbc: r.riwayatTbc,
    tahunPengobatan: r.tahunPengobatan,
    statusOat: r.statusOat,
    kontakTbc: r.kontakTbc,
    penunjang: r.penunjang,
    tcmDilakukan: r.tcmDilakukan,
    tcmHasil: r.tcmHasil,
    sputumDilakukan: r.sputumDilakukan,
    sputumHasil: r.sputumHasil,
    sputumGrade: r.sputumGrade,
    catatan: r.catatan,
    pemeriksa: r.pemeriksa,
    authorUserId: r.authorUserId,
    createdAt: r.createdAt.toISOString(),
  };
}

export function makeAsesmenTuberkulosisService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function save(kunjunganId: string, input: AsesmenTuberkulosisInput, actor: Actor): Promise<AsesmenTuberkulosisDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      riwayatTbc: input.riwayatTbc ?? null,
      tahunPengobatan: input.tahunPengobatan ?? null,
      statusOat: input.statusOat ?? null,
      kontakTbc: input.kontakTbc ?? null,
      penunjang: input.penunjang ?? null,
      tcmDilakukan: input.tcmDilakukan ?? null,
      tcmHasil: input.tcmHasil ?? null,
      sputumDilakukan: input.sputumDilakukan ?? null,
      sputumHasil: input.sputumHasil ?? null,
      sputumGrade: input.sputumGrade ?? null,
      catatan: input.catatan ?? null,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  async function getLatest(kunjunganId: string, _actor: Actor): Promise<AsesmenTuberkulosisDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latestByKunjungan(kunjunganId);
    return row ? toDTO(row) : null;
  }

  return { save, getLatest };
}

export const asesmenTuberkulosisService = makeAsesmenTuberkulosisService();
