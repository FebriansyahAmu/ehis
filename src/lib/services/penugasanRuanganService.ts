// penugasanRuanganService — business rules domain master/PenugasanRuangan (FLOWS §2).
// Link Pegawai ⇄ Ruangan. Tak import prisma langsung (pakai `transaction` + DAL). DTO GABUNGAN
// (identitas Pegawai ⋈ nama ruangan). Create idempoten (pasangan unik). Delete = hard delete.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/penugasanRuanganDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  CreatePenugasanInput, ListQuery, PenugasanRuanganDTO,
} from "@/lib/schemas/penugasanRuangan";
import type { PenugasanEntity } from "@/lib/dal/penugasanRuanganDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<PenugasanEntity>;

export function makePenugasanRuanganService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  // ── Helpers ─────────────────────────────────────────────────────────────---
  function namaTampil(p: { gelarDepan: string | null; namaLengkap: string; gelarBelakang: string | null }): string {
    const depan = p.gelarDepan ? `${p.gelarDepan} ` : "";
    const belakang = p.gelarBelakang ? `, ${p.gelarBelakang}` : "";
    return `${depan}${p.namaLengkap}${belakang}`;
  }

  function toDTO(e: NonNullEntity): PenugasanRuanganDTO {
    return {
      id: e.id,
      pegawaiId: e.pegawaiId,
      namaTampil: namaTampil(e.pegawai),
      nip: e.pegawai.nip,
      profesi: e.pegawai.profesi,
      locationId: e.locationId,
      ruanganKode: e.location.kode,
      ruanganNama: e.location.nama,
      peran: e.peran,
      createdAt: e.createdAt.toISOString(),
    };
  }

  // ── Operasi domain ─────────────────────────────────────────────────────────
  /** List/filter penugasan (cursor pagination). */
  async function listPenugasan(query: ListQuery): Promise<{ items: PenugasanRuanganDTO[]; cursor: string | null }> {
    const { items, nextCursor } = await dal.list({
      locationId: query.locationId,
      pegawaiId: query.pegawaiId,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toDTO), cursor: nextCursor };
  }

  /**
   * Tugaskan pegawai ke ruangan (idempoten). Guard eksistensi pegawai + ruangan, lalu
   * kembalikan penugasan yang sudah ada (created=false) atau buat baru (created=true).
   */
  async function createPenugasan(
    input: CreatePenugasanInput,
    _actor: Actor,
  ): Promise<{ penugasan: PenugasanRuanganDTO; created: boolean }> {
    return transaction(async (tx) => {
      if (!(await dal.findPegawai(input.pegawaiId, tx))) {
        throw Errors.notFound("Pegawai tidak ditemukan");
      }
      if (!(await dal.findLocation(input.locationId, tx))) {
        throw Errors.notFound("Ruangan tidak ditemukan");
      }
      const existing = await dal.findByPair(input.pegawaiId, input.locationId, tx);
      if (existing) return { penugasan: toDTO(existing), created: false };

      const row = await dal.create(
        { pegawaiId: input.pegawaiId, locationId: input.locationId, peran: input.peran },
        tx,
      );
      return { penugasan: toDTO(row), created: true };
    });
  }

  /** Lepas penugasan (hard delete). */
  async function deletePenugasan(id: string, _actor: Actor): Promise<void> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Penugasan tidak ditemukan");
    await dal.deleteById(id);
  }

  return { listPenugasan, createPenugasan, deletePenugasan };
}

export const penugasanRuanganService = makePenugasanRuanganService();
