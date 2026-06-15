// serahTerimaService — tab Serah Terima Shift (handover keperawatan SBAR, closed-loop).
// list · add (perawat keluar menyusun) · receive ("Terima": stamp penerima + jam, sekali) ·
// remove (soft-delete). perawatKeluar/perawatMasuk = input override ATAU nama actor. jamTerima
// distempel Service (WIB "HH:mm"). RBAC di Route: clinical.keperawatan (read/create/update/delete).
// ABAC careUnit di route() choke-point (clinical.* + params.id). Selaras asuhanKeperawatanService.

import * as defaultDal from "@/lib/dal/serahTerima/serahTerimaDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { SerahTerimaEntity } from "@/lib/dal/serahTerima/serahTerimaDal";
import {
  type SerahTerimaInput,
  type ReceiveInput,
  type SerahTerimaDTO,
} from "@/lib/schemas/serahTerima/serahTerima";

type Dal = typeof defaultDal;

// Jam terima distempel server (WIB "HH:mm") — selaras TIME_FMT asuhanKeperawatan.
const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function toDTO(e: SerahTerimaEntity): SerahTerimaDTO {
  return {
    id: e.id,
    tanggal: e.tanggal,
    shift: e.shift as SerahTerimaDTO["shift"],
    jamSerahTerima: e.jamSerahTerima,
    perawatKeluar: e.perawatKeluar,
    perawatMasuk: e.perawatMasuk,
    jamTerima: e.jamTerima ?? undefined,
    situation: e.situation,
    background: e.background,
    assessment: e.assessment,
    recommendation: e.recommendation,
  };
}

export function makeSerahTerimaService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertMilik(kunjunganId: string, itemId: string): Promise<SerahTerimaEntity> {
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Serah terima tidak ditemukan");
    }
    return item;
  }

  // GET — daftar serah terima aktif per kunjungan (urut buat).
  async function list(kunjunganId: string, _actor: Actor): Promise<SerahTerimaDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  // POST — perawat keluar menyusun catatan SBAR (entry baru = belum diterima).
  async function add(
    kunjunganId: string, input: SerahTerimaInput, actor: Actor,
  ): Promise<SerahTerimaDTO> {
    await assertKunjungan(kunjunganId);
    const perawatKeluar = input.perawatKeluar?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      tanggal: input.tanggal,
      shift: input.shift,
      jamSerahTerima: input.jamSerahTerima,
      situation: input.situation.trim(),
      background: input.background.trim(),
      assessment: input.assessment.trim(),
      recommendation: input.recommendation.trim(),
      perawatKeluar,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  // PATCH — perawat masuk "Terima": stamp penerima + jam (sekali; double-terima ditolak).
  async function receive(
    kunjunganId: string, itemId: string, input: ReceiveInput, actor: Actor,
  ): Promise<SerahTerimaDTO> {
    await assertKunjungan(kunjunganId);
    const existing = await assertMilik(kunjunganId, itemId);
    if (existing.perawatMasuk.trim() !== "") {
      throw Errors.forbiddenState("Serah terima sudah diterima");
    }
    const perawatMasuk = input.perawatMasuk?.trim() || (await resolveActorNama(actor));
    const now = new Date();
    const count = await dal.receive(itemId, {
      perawatMasuk,
      jamTerima: TIME_FMT.format(now),
      receivedAt: now,
      receivedByUserId: actor.userId,
      receivedByPegawaiId: actor.pegawaiId,
    });
    if (count === 0) throw Errors.conflict("Serah terima sudah diterima");
    return toDTO(await assertMilik(kunjunganId, itemId));
  }

  // DELETE — soft-delete (entered-in-error, jejak medico-legal).
  async function remove(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    await assertMilik(kunjunganId, itemId);
    await dal.softDelete(itemId);
  }

  return { list, add, receive, remove };
}

export const serahTerimaService = makeSerahTerimaService();
