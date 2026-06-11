// penugasanRuanganService — business rules domain master/PenugasanRuangan (FLOWS §2).
// Link Pegawai ⇄ Ruangan. Tak import prisma langsung (pakai `transaction` + DAL). DTO GABUNGAN
// (identitas Pegawai ⋈ nama ruangan). Create idempoten (pasangan unik). Delete = hard delete.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/penugasanRuanganDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  CreatePenugasanInput, ListQuery, PenugasanRuanganDTO, PetugasDTO,
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

  /**
   * Roster petugas untuk SATU kunjungan (konsumen klinis — dropdown PJ triase/DPJP).
   * Petugas = pegawai aktif ber-penugasan ke RUANGAN kunjungan (SDM Assignment).
   * Kunjungan tanpa ruangan (mis. RJ lama) → fallback lintas-ruangan (semua penugasan
   * ber-profesi itu), dedup per pegawai. Identitas TERBATAS (nama+profesi) — bukan
   * data SDM penuh (role klinis tak punya master.pegawai:read).
   */
  async function listPetugasKunjungan(
    kunjunganId: string,
    profesi: string | undefined,
    _actor: Actor,
  ): Promise<PetugasDTO[]> {
    const kunjungan = await kunjunganDal.findById(kunjunganId);
    if (!kunjungan) throw Errors.notFound("Kunjungan tidak ditemukan");

    const perRuangan = !!kunjungan.ruanganId;
    const rows = await dal.listPetugas({
      locationId: kunjungan.ruanganId ?? undefined,
      profesi,
    });

    const seen = new Set<string>();
    const petugas: PetugasDTO[] = [];
    for (const r of rows) {
      if (seen.has(r.pegawaiId)) continue;
      seen.add(r.pegawaiId);
      petugas.push({
        pegawaiId: r.pegawaiId,
        namaTampil: namaTampil(r.pegawai),
        profesi: r.pegawai.profesi,
        ruanganKode: perRuangan ? r.location.kode : null,
        ruanganNama: perRuangan ? r.location.nama : null,
      });
    }
    return petugas;
  }

  return { listPenugasan, createPenugasan, deletePenugasan, listPetugasKunjungan };
}

export const penugasanRuanganService = makePenugasanRuanganService();
