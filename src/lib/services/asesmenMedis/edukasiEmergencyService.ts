// edukasiEmergencyService — Asesmen Medis · Edukasi · Emergency (HPK 2). Append-only log +
// soft-delete. record/list/deleteItem. Petugas = user login (actor→pegawai), bukan free-text.
//
// RBAC `clinical.igd` di Route; ABAC unit-scope menyusul (TODO-CLINICAL §keputusan 4).

import * as defaultDal from "@/lib/dal/asesmenMedis/edukasiEmergencyDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { EdukasiEmergencyInput, EdukasiEmergencyDTO, EduEmergencyTipe } from "@/lib/schemas/asesmenMedis/edukasiEmergency";
import type { EdukasiEmergencyEntity } from "@/lib/dal/asesmenMedis/edukasiEmergencyDal";

type Dal = typeof defaultDal;

function toDTO(e: EdukasiEmergencyEntity): EdukasiEmergencyDTO {
  return {
    id: e.id,
    kunjunganId: e.kunjunganId,
    tipe: e.tipe as EduEmergencyTipe,
    instruksi: e.instruksi,
    instruksiObat: e.instruksiObat,
    diet: e.diet,
    aktivitas: e.aktivitas,
    tandaBahaya: e.tandaBahaya,
    followUpDate: e.followUpDate,
    followUpLokasi: e.followUpLokasi,
    kontakEmergency: e.kontakEmergency,
    catatan: e.catatan,
    petugas: e.petugas,
    createdAt: e.createdAt.toISOString(),
  };
}

export function makeEdukasiEmergencyService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  /** Simpan 1 instruksi emergency (append). Petugas dari user login. */
  async function record(kunjunganId: string, input: EdukasiEmergencyInput, actor: Actor): Promise<EdukasiEmergencyDTO> {
    await assertKunjungan(kunjunganId);
    const petugas = await resolveActorNama(actor);

    const row = await dal.create({
      kunjunganId,
      tipe: input.tipe,
      instruksi: input.instruksi,
      instruksiObat: input.instruksiObat ?? null,
      diet: input.diet ?? null,
      aktivitas: input.aktivitas ?? null,
      tandaBahaya: input.tandaBahaya,
      followUpDate: input.followUpDate ?? null,
      followUpLokasi: input.followUpLokasi ?? null,
      kontakEmergency: input.kontakEmergency ?? null,
      catatan: input.catatan ?? null,
      petugas,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });

    return toDTO(row);
  }

  /** Riwayat instruksi emergency kunjungan (terbaru dulu). */
  async function list(kunjunganId: string, _actor: Actor): Promise<EdukasiEmergencyDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.listByKunjungan(kunjunganId);
    return rows.map(toDTO);
  }

  /** Soft-delete 1 instruksi (jejak medico-legal terjaga). Guard kepemilikan kunjungan. */
  async function deleteItem(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Instruksi emergency tidak ditemukan");
    }
    await dal.softDelete(itemId);
  }

  return { record, list, deleteItem };
}

export const edukasiEmergencyService = makeEdukasiEmergencyService();
