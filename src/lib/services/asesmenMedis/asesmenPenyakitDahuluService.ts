// asesmenPenyakitDahuluService — domain Asesmen·Riwayat·Penyakit Dahulu (shared IGD/RI/RJ).
// Append-only "latest wins": `save` append baris baru; `getLatest` = terbaru. Tanpa transaksi
// (single insert). Pemeriksa = user login (actor). RBAC `clinical.igd` di Route.

import * as defaultDal from "@/lib/dal/asesmenMedis/asesmenPenyakitDahuluDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AsesmenPenyakitDahuluInput, AsesmenPenyakitDahuluDTO } from "@/lib/schemas/asesmenMedis/asesmenPenyakitDahulu";
import type { AsesmenPenyakitDahuluEntity } from "@/lib/dal/asesmenMedis/asesmenPenyakitDahuluDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<AsesmenPenyakitDahuluEntity>;

function toDTO(r: NonNullEntity): AsesmenPenyakitDahuluDTO {
  return {
    id: r.id,
    kunjunganId: r.kunjunganId,
    penyakit: r.penyakit,
    catatan: r.catatan,
    pemeriksa: r.pemeriksa,
    authorUserId: r.authorUserId,
    createdAt: r.createdAt.toISOString(),
  };
}

export function makeAsesmenPenyakitDahuluService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function save(
    kunjunganId: string,
    input: AsesmenPenyakitDahuluInput,
    actor: Actor,
  ): Promise<AsesmenPenyakitDahuluDTO> {
    await assertKunjungan(kunjunganId);
    const pemeriksa = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      penyakit: input.penyakit,
      catatan: input.catatan ?? null,
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  async function getLatest(kunjunganId: string, _actor: Actor): Promise<AsesmenPenyakitDahuluDTO | null> {
    await assertKunjungan(kunjunganId);
    const row = await dal.latestByKunjungan(kunjunganId);
    return row ? toDTO(row) : null;
  }

  return { save, getLatest };
}

export const asesmenPenyakitDahuluService = makeAsesmenPenyakitDahuluService();
