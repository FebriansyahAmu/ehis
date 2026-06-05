// pegawaiService — business rules domain master/kepegawaian (FLOWS §2). Tak import
// prisma langsung (pakai `transaction` + DAL). PII (NIK) di-enc/hash di sini (boundary),
// DTO mapping di sini (mask NIK). Non-determinisme via `clock` yang di-inject (FLOWS §14).

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/pegawaiDal";
import { systemClock, type Clock } from "@/lib/core/clock";
import { encryptPii, hashPii, decryptPii, maskPii } from "@/lib/crypto/pii";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  CreatePegawaiInput,
  UpdatePegawaiInput,
  ListQuery,
  PegawaiDTO,
  PegawaiListItemDTO,
} from "@/lib/schemas/pegawai";
import type { PegawaiEntity, PegawaiListEntity, UpdatePegawaiData } from "@/lib/dal/pegawaiDal";

type Dal = typeof defaultDal;
type NonNullEntity = NonNullable<PegawaiEntity>;

export function makePegawaiService(deps: { clock?: Clock; dal?: Dal } = {}) {
  const clock = deps.clock ?? systemClock;
  const dal = deps.dal ?? defaultDal;

  // ── Helpers ─────────────────────────────────────────────────────────────---
  /** Parse ISO date (UTC eksplisit, deterministik). `noFuture` utk tanggal lahir. */
  function toDate(iso: string | undefined, opts: { noFuture?: boolean } = {}): Date | undefined {
    if (!iso) return undefined;
    const d = new Date(`${iso}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) throw Errors.validation("Tanggal tidak valid");
    if (opts.noFuture && d.getTime() > clock.now().getTime()) {
      throw Errors.validation("Tanggal tidak boleh di masa depan");
    }
    return d;
  }

  function namaTampil(p: { gelarDepan: string | null; namaLengkap: string; gelarBelakang: string | null }): string {
    const depan = p.gelarDepan ? `${p.gelarDepan} ` : "";
    const belakang = p.gelarBelakang ? `, ${p.gelarBelakang}` : "";
    return `${depan}${p.namaLengkap}${belakang}`;
  }

  // "User ini dokter?" → punya tautan Practitioner ATAU profesi termasuk kelompok dokter
  // (intent saat provisioning, sebelum master Dokter dibuat). Selaras DOCTOR_PROFESI di wizard.
  const DOKTER_PROFESI = new Set(["Dokter", "Dokter Gigi", "Dokter Spesialis"]);
  function isDokter(p: { practitionerId: string | null; profesi: string | null }): boolean {
    return p.practitionerId !== null || (p.profesi !== null && DOKTER_PROFESI.has(p.profesi));
  }

  function umur(tgl: Date | null): number | null {
    if (!tgl) return null;
    const now = clock.now();
    let age = now.getUTCFullYear() - tgl.getUTCFullYear();
    const m = now.getUTCMonth() - tgl.getUTCMonth();
    if (m < 0 || (m === 0 && now.getUTCDate() < tgl.getUTCDate())) age--;
    return Math.max(0, age);
  }

  // ── DTO mapping (mask PII; entity Prisma TIDAK bocor) ─────────────────────---
  function toListDTO(p: PegawaiListEntity): PegawaiListItemDTO {
    return {
      id: p.id,
      nip: p.nip,
      nikMasked: p.nikEnc ? maskPii(decryptPii(p.nikEnc)) : null,
      namaLengkap: p.namaLengkap,
      namaTampil: namaTampil(p),
      jenisKelamin: p.jenisKelamin,
      statusPegawai: p.statusPegawai,
      profesi: p.profesi,
      unitKerja: p.unitKerja,
      practitionerId: p.practitionerId,
      isDokter: isDokter(p),
      isActive: p.isActive,
      version: p.version,
      createdAt: p.createdAt.toISOString(),
    };
  }

  function toDTO(p: NonNullEntity): PegawaiDTO {
    return {
      id: p.id,
      nip: p.nip,
      nikMasked: p.nikEnc ? maskPii(decryptPii(p.nikEnc)) : null,
      namaLengkap: p.namaLengkap,
      namaTampil: namaTampil(p),
      gelarDepan: p.gelarDepan,
      gelarBelakang: p.gelarBelakang,
      agama: p.agama,
      jenisKelamin: p.jenisKelamin,
      tempatLahir: p.tempatLahir,
      tanggalLahir: p.tanggalLahir ? p.tanggalLahir.toISOString().slice(0, 10) : null,
      umur: umur(p.tanggalLahir),
      statusPegawai: p.statusPegawai,
      profesi: p.profesi,
      unitKerja: p.unitKerja,
      tglMasuk: p.tglMasuk ? p.tglMasuk.toISOString().slice(0, 10) : null,
      alamat: p.alamat,
      noHp: p.noHp,
      email: p.email,
      foto: p.foto,
      practitionerId: p.practitionerId,
      isDokter: isDokter(p),
      isActive: p.isActive,
      version: p.version,
      createdAt: p.createdAt.toISOString(),
      kontakDarurat: p.kontakDarurat.map((k) => ({
        nama: k.nama,
        hubungan: k.hubungan,
        noHp: k.noHp,
        alamat: k.alamat,
      })),
    };
  }

  // ── Operasi domain ─────────────────────────────────────────────────────────
  /** Tambah pegawai. NIK & NIP unik (cek dulu utk pesan ramah; DB unique = backstop). */
  async function createPegawai(input: CreatePegawaiInput, _actor: Actor): Promise<PegawaiDTO> {
    const nikHash = hashPii(input.nik);
    if (await dal.findByNikHash(nikHash)) throw Errors.conflict("NIK sudah terdaftar pada pegawai lain");
    if (await dal.findByNip(input.nip)) throw Errors.conflict(`NIP ${input.nip} sudah dipakai pegawai lain`);

    const created = await dal.create({
      nip: input.nip,
      nikEnc: encryptPii(input.nik),
      nikHash,
      namaLengkap: input.namaLengkap,
      gelarDepan: input.gelarDepan,
      gelarBelakang: input.gelarBelakang,
      jenisKelamin: input.jenisKelamin,
      agama: input.agama,
      tempatLahir: input.tempatLahir,
      tanggalLahir: toDate(input.tanggalLahir, { noFuture: true }),
      statusPegawai: input.statusPegawai,
      profesi: input.profesi,
      unitKerja: input.unitKerja,
      tglMasuk: toDate(input.tglMasuk),
      alamat: input.alamat,
      noHp: input.noHp,
      email: input.email,
      foto: input.foto,
      practitionerId: input.practitionerId,
      kontakDarurat: input.kontakDarurat ?? [],
    });
    return toDTO(created);
  }

  /** Detail pegawai. */
  async function getPegawai(id: string, _actor: Actor): Promise<PegawaiDTO> {
    const found = await dal.findById(id);
    if (!found) throw Errors.notFound("Pegawai tidak ditemukan");
    return toDTO(found);
  }

  /** List/cari pegawai (cursor pagination). */
  async function listPegawai(query: ListQuery): Promise<{ items: PegawaiListItemDTO[]; cursor: string | null }> {
    const { items, nextCursor } = await dal.list({
      q: query.q,
      status: query.status,
      aktif: query.aktif === undefined ? undefined : query.aktif === "true",
      cursor: query.cursor,
      limit: query.limit,
    });
    return { items: items.map(toListDTO), cursor: nextCursor };
  }

  /** Ubah pegawai. Version guard (optimistic concurrency). NIK/NIP unik dijaga. */
  async function updatePegawai(id: string, input: UpdatePegawaiInput, _actor: Actor): Promise<PegawaiDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Pegawai tidak ditemukan");

    // Uniqueness saat NIK/NIP diganti (abaikan bila menunjuk dirinya sendiri).
    if (input.nik) {
      const dup = await dal.findByNikHash(hashPii(input.nik));
      if (dup && dup.id !== id) throw Errors.conflict("NIK sudah terdaftar pada pegawai lain");
    }
    if (input.nip) {
      const dup = await dal.findByNip(input.nip);
      if (dup && dup.id !== id) throw Errors.conflict(`NIP ${input.nip} sudah dipakai pegawai lain`);
    }

    const patch: UpdatePegawaiData = {
      nip: input.nip,
      namaLengkap: input.namaLengkap,
      gelarDepan: input.gelarDepan,
      gelarBelakang: input.gelarBelakang,
      jenisKelamin: input.jenisKelamin,
      agama: input.agama,
      tempatLahir: input.tempatLahir,
      tanggalLahir: toDate(input.tanggalLahir, { noFuture: true }),
      statusPegawai: input.statusPegawai,
      profesi: input.profesi,
      unitKerja: input.unitKerja,
      tglMasuk: toDate(input.tglMasuk),
      alamat: input.alamat,
      noHp: input.noHp,
      email: input.email,
      foto: input.foto,
      practitionerId: input.practitionerId, // null = lepas tautan; undefined = skip
      isActive: input.isActive,
      ...(input.nik ? { nikEnc: encryptPii(input.nik), nikHash: hashPii(input.nik) } : {}),
    };

    const updated = await transaction(async (tx) => {
      const count = await dal.updateWithVersion(id, input.expectedVersion, patch, tx);
      if (count === 0) throw Errors.conflictVersion();
      if (input.kontakDarurat !== undefined) await dal.replaceKontakDarurat(id, input.kontakDarurat, tx);
      const fresh = await dal.findById(id, tx);
      if (!fresh) throw Errors.notFound("Pegawai tidak ditemukan");
      return fresh;
    });
    return toDTO(updated);
  }

  /**
   * Soft-delete pegawai (version guard). TODO(cross-domain): bila pegawai punya akun
   * login (auth.User.pegawaiId), cegah/handle via use-case orchestrator agar tidak
   * meninggalkan akun yatim (FLOWS §"zero orphan account") — domain ini tetap murni.
   */
  async function deletePegawai(id: string, expectedVersion: number, _actor: Actor): Promise<void> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Pegawai tidak ditemukan");
    const count = await dal.softDeleteWithVersion(id, expectedVersion, clock.now());
    if (count === 0) throw Errors.conflictVersion();
  }

  return { createPegawai, getPegawai, listPegawai, updatePegawai, deletePegawai };
}

export const pegawaiService = makePegawaiService();
