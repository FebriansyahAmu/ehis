// edukasiPasienService — Asesmen Medis · Edukasi · Pasien & Keluarga (HPK 2).
// Append-only log: `record` menulis 1 catatan sesi; `list` = riwayat. Petugas/edukator =
// user login (actor→pegawai), bukan free-text.
//
// RBAC `clinical.igd` di Route; ABAC unit-scope menyusul (TODO-CLINICAL §keputusan 4).

import * as defaultDal from "@/lib/dal/asesmenMedis/edukasiPasienDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  EdukasiPasienInput,
  EdukasiPasienDTO,
  EduPenerima,
  EduPemahaman,
} from "@/lib/schemas/asesmenMedis/edukasiPasien";
import type { EdukasiPasienEntity } from "@/lib/dal/asesmenMedis/edukasiPasienDal";

type Dal = typeof defaultDal;

function toDTO(e: EdukasiPasienEntity): EdukasiPasienDTO {
  return {
    id: e.id,
    kunjunganId: e.kunjunganId,
    penerima: e.penerima as EduPenerima,
    namaPenerima: e.namaPenerima,
    hubungan: e.hubungan,
    topik: e.topik,
    media: e.media,
    metode: e.metode,
    hambatan: e.hambatan,
    catatanHambatan: e.catatanHambatan,
    pemahaman: e.pemahaman as EduPemahaman,
    rencanaTindakLanjut: e.rencanaTindakLanjut,
    catatan: e.catatan,
    tanggal: e.tanggal,
    jam: e.jam,
    petugas: e.petugas,
    createdAt: e.createdAt.toISOString(),
  };
}

export function makeEdukasiPasienService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Validasi kunjungan ada & belum dihapus (asesmen shared → tanpa batasan unit). */
  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  /** Simpan 1 catatan edukasi (append). Petugas dari user login. */
  async function record(kunjunganId: string, input: EdukasiPasienInput, actor: Actor): Promise<EdukasiPasienDTO> {
    await assertKunjungan(kunjunganId);
    const petugas = await resolveActorNama(actor);

    const row = await dal.create({
      kunjunganId,
      penerima: input.penerima,
      namaPenerima: input.namaPenerima ?? null,
      hubungan: input.hubungan ?? null,
      topik: input.topik,
      media: input.media,
      metode: input.metode ?? null,
      hambatan: input.hambatan,
      catatanHambatan: input.catatanHambatan ?? null,
      pemahaman: input.pemahaman,
      rencanaTindakLanjut: input.rencanaTindakLanjut ?? null,
      catatan: input.catatan ?? null,
      tanggal: input.tanggal ?? null,
      jam: input.jam ?? null,
      petugas,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });

    return toDTO(row);
  }

  /** Riwayat edukasi kunjungan (terbaru dulu). */
  async function list(kunjunganId: string, _actor: Actor): Promise<EdukasiPasienDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.listByKunjungan(kunjunganId);
    return rows.map(toDTO);
  }

  /** Soft-delete 1 catatan edukasi (jejak medico-legal terjaga). Guard kepemilikan kunjungan. */
  async function deleteItem(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Catatan edukasi tidak ditemukan");
    }
    await dal.softDelete(itemId);
  }

  return { record, list, deleteItem };
}

export const edukasiPasienService = makeEdukasiPasienService();
