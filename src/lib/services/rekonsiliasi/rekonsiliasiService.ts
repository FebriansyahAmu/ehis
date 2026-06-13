// rekonsiliasiService — tab Rekonsiliasi (medication reconciliation per fase). Append-only: tiap
// simpan = snapshot baru. `list` = riwayat (semua snapshot, terbaru dulu). Petugas = input override
// atau nama actor (user login). RBAC di Route: clinical.rekonsiliasi (read/create). ABAC careUnit di route()
// choke-point (clinical.* + params.id). Selaras tindakanMedisService / asesmen* services.

import * as defaultDal from "@/lib/dal/rekonsiliasi/rekonsiliasiDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { RekonsiliasiInput, RekonsiliasiDTO } from "@/lib/schemas/rekonsiliasi/rekonsiliasi";
import type { RekonsiliasiEntity } from "@/lib/dal/rekonsiliasi/rekonsiliasiDal";

type Dal = typeof defaultDal;

function toDTO(r: RekonsiliasiEntity): RekonsiliasiDTO {
  return {
    id: r.id,
    fase: r.fase,
    selesai: r.selesai,
    catatan: r.catatan ?? null,
    waktu: r.waktu.toISOString(),
    petugas: r.petugas,
    obatList: r.obatList.map((o) => ({
      id: o.id,
      namaObat: o.namaObat,
      dosis: o.dosis ?? null,
      rute: o.rute ?? null,
      frekuensi: o.frekuensi ?? null,
      sumber: o.sumber ?? null,
      keputusan: o.keputusan,
      gantiDengan: o.gantiDengan ?? null,
      alasan: o.alasan ?? null,
      isHAM: o.isHAM,
    })),
    createdAt: r.createdAt.toISOString(),
  };
}

export function makeRekonsiliasiService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  /** Riwayat rekonsiliasi (semua snapshot lintas fase & versi, terbaru dulu). */
  async function list(kunjunganId: string, _actor: Actor): Promise<RekonsiliasiDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  /** Simpan 1 snapshot rekonsiliasi (append-only). Petugas = input atau nama actor. */
  async function add(
    kunjunganId: string,
    input: RekonsiliasiInput,
    actor: Actor,
  ): Promise<RekonsiliasiDTO> {
    await assertKunjungan(kunjunganId);
    const petugas = input.petugas?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      fase: input.fase,
      selesai: input.selesai,
      catatan: input.catatan ?? null,
      waktu: input.waktu ?? new Date(),
      petugas,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
      obatList: input.obatList.map((o) => ({
        namaObat: o.namaObat,
        dosis: o.dosis ?? null,
        rute: o.rute ?? null,
        frekuensi: o.frekuensi ?? null,
        sumber: o.sumber ?? null,
        keputusan: o.keputusan,
        gantiDengan: o.gantiDengan ?? null,
        alasan: o.alasan ?? null,
        isHAM: o.isHAM,
      })),
    });
    return toDTO(row);
  }

  return { list, add };
}

export const rekonsiliasiService = makeRekonsiliasiService();
