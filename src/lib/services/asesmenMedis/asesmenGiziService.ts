// asesmenGiziService — Asesmen Medis · Skrining Gizi (MUST). Append-only time-series:
// `record` menulis 1 baris skrining; `list` = riwayat. total & risiko = DERIVED (tak disimpan).
// Petugas = user login (actor→pegawai), bukan free-text.
//
// RBAC `clinical.igd` di Route; ABAC unit-scope menyusul (TODO-CLINICAL §keputusan 4).

import * as defaultDal from "@/lib/dal/asesmenMedis/asesmenGiziDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AsesmenGiziInput, AsesmenGiziDTO, GiziRiskKey } from "@/lib/schemas/asesmenMedis/asesmenGizi";
import type { AsesmenGiziEntity } from "@/lib/dal/asesmenMedis/asesmenGiziDal";

type Dal = typeof defaultDal;

/** Risiko MUST dari total skor — selaras getGiziRiskKey FE (>=2 high · 1 mid · 0 low). */
function riskOf(total: number): GiziRiskKey {
  if (total >= 2) return "high";
  if (total === 1) return "mid";
  return "low";
}

function toDTO(g: AsesmenGiziEntity): AsesmenGiziDTO {
  const total = g.skorBmi + g.skorBb + g.skorAkut;
  return {
    id: g.id,
    kunjunganId: g.kunjunganId,
    scores: { bmi: g.skorBmi, bb: g.skorBb, akut: g.skorAkut },
    total,
    risk: riskOf(total),
    ahliGizi: g.ahliGizi,
    catatan: g.catatan,
    tanggal: g.tanggal,
    petugas: g.petugas,
    savedAt: g.createdAt.toISOString(),
    createdAt: g.createdAt.toISOString(),
  };
}

export function makeAsesmenGiziService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Validasi kunjungan ada & belum dihapus (asesmen shared → tanpa batasan unit). */
  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  /** Simpan 1 skrining (append). Petugas dari user login. */
  async function record(kunjunganId: string, input: AsesmenGiziInput, actor: Actor): Promise<AsesmenGiziDTO> {
    await assertKunjungan(kunjunganId);
    const petugas = await resolveActorNama(actor);

    const row = await dal.create({
      kunjunganId,
      skorBmi: input.skorBmi,
      skorBb: input.skorBb,
      skorAkut: input.skorAkut,
      ahliGizi: input.ahliGizi ?? null,
      catatan: input.catatan ?? null,
      tanggal: input.tanggal ?? null,
      petugas,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });

    return toDTO(row);
  }

  /** Riwayat skrining kunjungan (terbaru dulu). */
  async function list(kunjunganId: string, _actor: Actor): Promise<AsesmenGiziDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.listByKunjungan(kunjunganId);
    return rows.map(toDTO);
  }

  return { record, list };
}

export const asesmenGiziService = makeAsesmenGiziService();
