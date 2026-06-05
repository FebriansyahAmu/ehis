// dokterService — business rules domain master/Dokter (FLOWS §2 · doc §B). Tak import
// prisma langsung (pakai `transaction` + DAL). Dokter = ekstensi 1:1 Pegawai → DTO
// GABUNGAN (kredensial ⋈ identitas Pegawai, NIK di-mask di sini). Non-determinisme via
// `clock` inject (FLOWS §14). Pointer `Pegawai.practitionerId` di-maintain transaksional.

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/dokterDal";
import { DOKTER_PROFESI } from "@/lib/dal/dokterDal";
import { systemClock, type Clock } from "@/lib/core/clock";
import { decryptPii, maskPii } from "@/lib/crypto/pii";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import {
  SPESIALIS_LABEL,
  type CreateDokterInput,
  type UpdateDokterInput,
  type ListQuery,
  type DokterDTO,
  type DokterListItemDTO,
  type DokterTanpaProfilDTO,
  type SpesialisKode,
} from "@/lib/schemas/dokter";
import type {
  DokterEntity, DokterListEntity, DokterTanpaProfilEntity, UpdateDokterData,
} from "@/lib/dal/dokterDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<DokterEntity>;

const DOKTER_PROFESI_SET = new Set<string>(DOKTER_PROFESI);

export function makeDokterService(deps: { clock?: Clock; dal?: Dal } = {}) {
  const clock = deps.clock ?? systemClock;
  const dal = deps.dal ?? defaultDal;

  // ── Helpers ─────────────────────────────────────────────────────────────---
  function toDate(iso: string | undefined): Date | undefined {
    if (!iso) return undefined;
    const d = new Date(`${iso}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) throw Errors.validation("Tanggal tidak valid");
    return d;
  }

  /** Patch tanggal nullable: undefined=skip · null=kosongkan · "iso"=set. */
  function toDatePatch(v: string | null | undefined): Date | null | undefined {
    if (v === undefined) return undefined;
    if (v === null) return null;
    return toDate(v);
  }

  function namaTampil(p: { gelarDepan: string | null; namaLengkap: string; gelarBelakang: string | null }): string {
    const depan = p.gelarDepan ? `${p.gelarDepan} ` : "";
    const belakang = p.gelarBelakang ? `, ${p.gelarBelakang}` : "";
    return `${depan}${p.namaLengkap}${belakang}`;
  }

  /** Lisensi kedaluwarsa? (inklusif tanggal berlaku — lewat bila < awal hari ini UTC). */
  function isExpired(tgl: Date | null): boolean {
    if (!tgl) return false;
    const now = clock.now();
    const startToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return tgl.getTime() < startToday;
  }

  const isoDate = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);

  // ── DTO mapping (identitas dari Pegawai; NIK MASKED) ───────────────────────--
  function toListDTO(d: DokterListEntity): DokterListItemDTO {
    return {
      id: d.id,
      pegawaiId: d.pegawaiId,
      nip: d.pegawai.nip,
      nikMasked: d.pegawai.nikEnc ? maskPii(decryptPii(d.pegawai.nikEnc)) : null,
      namaTampil: namaTampil(d.pegawai),
      spesialisKode: d.spesialisKode as SpesialisKode,
      spesialisLabel: SPESIALIS_LABEL[d.spesialisKode as SpesialisKode],
      noStr: d.noStr,
      noSip: d.noSip,
      statusPraktik: d.statusPraktik,
      strExpired: isExpired(d.strBerlakuHingga),
      sipExpired: isExpired(d.sipBerlakuHingga),
      version: d.version,
      createdAt: d.createdAt.toISOString(),
    };
  }

  function toDTO(d: NonNullEntity): DokterDTO {
    return {
      ...toListDTO(d),
      namaLengkap: d.pegawai.namaLengkap,
      jenisKelamin: d.pegawai.jenisKelamin,
      tanggalLahir: isoDate(d.pegawai.tanggalLahir),
      email: d.pegawai.email,
      noHp: d.pegawai.noHp,
      profesi: d.pegawai.profesi,
      kualifikasi: d.kualifikasi,
      strBerlakuHingga: isoDate(d.strBerlakuHingga),
      sipBerlakuHingga: isoDate(d.sipBerlakuHingga),
      ihsPractitionerId: d.ihsPractitionerId,
    };
  }

  function toTanpaProfilDTO(p: DokterTanpaProfilEntity): DokterTanpaProfilDTO {
    return {
      pegawaiId: p.id,
      nip: p.nip,
      namaTampil: namaTampil(p),
      profesi: p.profesi,
      unitKerja: p.unitKerja,
    };
  }

  // ── Operasi domain ─────────────────────────────────────────────────────────
  /** List/cari dokter (cursor pagination). */
  async function listDokter(query: ListQuery): Promise<{ items: DokterListItemDTO[]; cursor: string | null }> {
    const { items, nextCursor } = await dal.list({
      q: query.q,
      spesialis: query.spesialis,
      status: query.status,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toListDTO), cursor: nextCursor };
  }

  /** Detail dokter (⋈ Pegawai). */
  async function getDokter(id: string, _actor: Actor): Promise<DokterDTO> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Dokter tidak ditemukan");
    return toDTO(found);
  }

  /** Dokter tanpa profil: pegawai dokter yang belum punya profil Dokter (G3). */
  async function listTanpaProfil(_actor: Actor): Promise<DokterTanpaProfilDTO[]> {
    const rows = await dal.listTanpaProfil();
    return rows.map(toTanpaProfilDTO);
  }

  /**
   * Buat profil Dokter untuk pegawai existing (provisioning). Transaksi:
   * guard profesi-dokter + uniqueness 1:1 → create → set pointer Pegawai.practitionerId.
   */
  async function createDokter(input: CreateDokterInput, _actor: Actor): Promise<DokterDTO> {
    const created = await transaction(async (tx) => {
      const peg = await dal.findPegawai(input.pegawaiId, tx);
      if (!peg) throw Errors.notFound("Pegawai tidak ditemukan");
      if (!peg.profesi || !DOKTER_PROFESI_SET.has(peg.profesi)) {
        throw Errors.validation(
          "Pegawai bukan tenaga dokter — profesi harus Dokter / Dokter Gigi / Dokter Spesialis",
        );
      }
      if (await dal.findByPegawai(input.pegawaiId, tx)) {
        throw Errors.conflict("Pegawai ini sudah memiliki profil Dokter");
      }

      const row = await dal.create(
        {
          pegawaiId: input.pegawaiId,
          spesialisKode: input.spesialisKode,
          // kualifikasi kosong → auto-fill label spesialis (cermin FE).
          kualifikasi: input.kualifikasi?.trim() || SPESIALIS_LABEL[input.spesialisKode],
          noStr: input.noStr,
          strBerlakuHingga: toDate(input.strBerlakuHingga),
          noSip: input.noSip,
          sipBerlakuHingga: toDate(input.sipBerlakuHingga),
          statusPraktik: input.statusPraktik,
          ihsPractitionerId: input.ihsPractitionerId,
        },
        tx,
      );
      await dal.linkPegawai(input.pegawaiId, row.id, tx);
      return row;
    });
    return toDTO(created);
  }

  /** Ubah kredensial klinis (version guard). Identitas TIDAK di sini (G4). */
  async function updateDokter(id: string, input: UpdateDokterInput, _actor: Actor): Promise<DokterDTO> {
    const patch: UpdateDokterData = {
      spesialisKode: input.spesialisKode,
      kualifikasi: input.kualifikasi,
      noStr: input.noStr,
      strBerlakuHingga: toDatePatch(input.strBerlakuHingga),
      noSip: input.noSip,
      sipBerlakuHingga: toDatePatch(input.sipBerlakuHingga),
      statusPraktik: input.statusPraktik,
      ihsPractitionerId: input.ihsPractitionerId,
    };

    const updated = await transaction(async (tx) => {
      const count = await dal.updateWithVersion(id, input.expectedVersion, patch, tx);
      if (count === 0) {
        // Bedakan "tak ada" vs "stale" untuk pesan akurat.
        const exists = await dal.findById(id, tx);
        if (!exists) throw Errors.notFound("Dokter tidak ditemukan");
        throw Errors.conflictVersion();
      }
      const fresh = await dal.findById(id, tx);
      if (!fresh) throw Errors.notFound("Dokter tidak ditemukan");
      return fresh;
    });
    return toDTO(updated);
  }

  /** Soft-delete profil Dokter + lepas pointer Pegawai.practitionerId (transaksi). */
  async function deleteDokter(id: string, expectedVersion: number, _actor: Actor): Promise<void> {
    await transaction(async (tx) => {
      const existing = await dal.findById(id, tx);
      if (!existing) throw Errors.notFound("Dokter tidak ditemukan");
      const count = await dal.softDeleteWithVersion(id, expectedVersion, clock.now(), tx);
      if (count === 0) throw Errors.conflictVersion();
      await dal.unlinkPegawai(existing.pegawaiId, tx);
    });
  }

  return { listDokter, getDokter, listTanpaProfil, createDokter, updateDokter, deleteDokter };
}

export const dokterService = makeDokterService();
