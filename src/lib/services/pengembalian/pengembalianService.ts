// pengembalianService — Pengembalian Obat pasien pulang (PMK 72/2016 Ps. 20).
// Workflow: Draft (perawat/dokter isi & koreksi) → Diverifikasi (stamp sekali).
// perawatPenyerah = actor create · apotekerPenerima = actor verify — keduanya server-otoritatif.
// VERIFIKASI HANYA APOTEKER — RBAC route coarse (clinical.pengembalian:update dimiliki
// Dokter/Perawat juga utk koreksi Draft), refinement per-aksi di Service (pola careplan
// verify Dokter-only / MAR verifikator HAM). Bypass isSuperuser||isGlobal.
// RBAC clinical.pengembalian di Route; ABAC careUnit di route() (Apoteker lolos via
// isAncillaryActor). Stok kembali ke depo (Inventory IN) = fase later.

import * as defaultDal from "@/lib/dal/pengembalian/pengembalianDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { transaction } from "@/lib/db/prisma";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { PengembalianEntity } from "@/lib/dal/pengembalian/pengembalianDal";
import {
  type PengembalianCreateInput, type PengembalianUpdateInput,
  type PengembalianDTO, type PengembalianItemInput,
} from "@/lib/schemas/pengembalian/pengembalian";

type Dal = typeof defaultDal;

function toDTO(e: PengembalianEntity): PengembalianDTO {
  return {
    id: e.id,
    resepOrderId: e.resepOrderId ?? null,
    noResepRef: e.noResepRef,
    tanggal: e.tanggal,
    status: e.status,
    catatan: e.catatan,
    perawatPenyerah: e.perawatPenyerah,
    apotekerPenerima: e.apotekerPenerima,
    verifiedAt: e.verifiedAt ? e.verifiedAt.toISOString() : null,
    items: e.items.map((i) => ({
      id: i.id,
      resepItemId: i.resepItemId ?? null,
      namaObat: i.namaObat,
      satuan: i.satuan,
      isHAM: i.isHAM,
      isNarPsi: i.isNarPsi,
      jumlahDispensasi: i.jumlahDispensasi,
      jumlahDiberikan: i.jumlahDiberikan,
      jumlahKembalikan: i.jumlahKembalikan,
      kondisi: i.kondisi,
      alasan: i.alasan,
    })),
    createdAt: e.createdAt.toISOString(),
  };
}

const toItemData = (i: PengembalianItemInput) => ({
  resepItemId: i.resepItemId ?? null,
  namaObat: i.namaObat,
  satuan: i.satuan,
  isHAM: i.isHAM,
  isNarPsi: i.isNarPsi,
  jumlahDispensasi: i.jumlahDispensasi,
  jumlahDiberikan: i.jumlahDiberikan,
  jumlahKembalikan: i.jumlahKembalikan,
  kondisi: i.kondisi,
  alasan: i.alasan,
});

export function makePengembalianService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertMilik(kunjunganId: string, itemId: string): Promise<PengembalianEntity> {
    const row = await dal.findById(itemId);
    if (!row || row.kunjunganId !== kunjunganId || row.deletedAt) {
      throw Errors.notFound("Dokumen pengembalian tidak ditemukan");
    }
    return row;
  }

  /** GET — daftar pengembalian aktif per kunjungan (terbaru dulu). */
  async function list(kunjunganId: string, _actor: Actor): Promise<PengembalianDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  /** POST — buat dokumen Draft; perawatPenyerah = actor login. */
  async function create(
    kunjunganId: string, input: PengembalianCreateInput, actor: Actor,
  ): Promise<PengembalianDTO> {
    await assertKunjungan(kunjunganId);
    const perawatPenyerah = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      resepOrderId: input.resepOrderId ?? null,
      noResepRef: input.noResepRef,
      tanggal: input.tanggal,
      catatan: input.catatan,
      perawatPenyerah,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
      items: input.items.map(toItemData),
    });
    return toDTO(row);
  }

  /** PATCH — koreksi Draft (replace-all items + header), atomik; terkunci pasca-verifikasi. */
  async function update(
    kunjunganId: string, itemId: string, input: PengembalianUpdateInput, actor: Actor,
  ): Promise<PengembalianDTO> {
    void actor;
    await assertKunjungan(kunjunganId);
    await assertMilik(kunjunganId, itemId);
    const row = await transaction(async (tx) => {
      const n = await dal.updateDraftHeader(itemId, {
        ...(input.tanggal ? { tanggal: input.tanggal } : {}),
        ...(input.catatan !== undefined ? { catatan: input.catatan } : {}),
      }, tx);
      if (n === 0) throw Errors.forbiddenState("Dokumen sudah diverifikasi — tidak bisa diubah");
      await dal.replaceItems(itemId, input.items.map(toItemData), tx);
      const fresh = await dal.findById(itemId, tx);
      if (!fresh) throw Errors.notFound("Dokumen pengembalian tidak ditemukan");
      return fresh;
    });
    return toDTO(row);
  }

  /** POST /verify — verifikasi penerimaan fisik. HANYA APOTEKER (refinement Service). */
  async function verify(kunjunganId: string, itemId: string, actor: Actor): Promise<PengembalianDTO> {
    await assertKunjungan(kunjunganId);
    await assertMilik(kunjunganId, itemId);
    if (!actor.isSuperuser && !actor.isGlobal && !actor.roles.includes("Apoteker")) {
      throw Errors.forbidden("Verifikasi penerimaan pengembalian hanya oleh Apoteker");
    }
    const apoteker = await resolveActorNama(actor);
    const n = await dal.verify(itemId, apoteker);
    if (n === 0) throw Errors.forbiddenState("Dokumen sudah diverifikasi");
    const fresh = await dal.findById(itemId);
    if (!fresh) throw Errors.notFound("Dokumen pengembalian tidak ditemukan");
    return toDTO(fresh);
  }

  /** DELETE — hapus Draft (soft-delete; dokumen terverifikasi tidak boleh hilang). */
  async function remove(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    await assertMilik(kunjunganId, itemId);
    const n = await dal.softDeleteDraft(itemId);
    if (n === 0) throw Errors.forbiddenState("Dokumen sudah diverifikasi — tidak bisa dihapus");
  }

  return { list, create, update, verify, remove };
}

export const pengembalianService = makePengembalianService();
