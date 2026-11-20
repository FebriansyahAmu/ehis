// rsProfilService — Master Profil RS (SINGLETON). Business rule + map entity↔DTO.
// GET actor-less (SSR/public-read: identitas RS non-sensitif, dipakai KOP semua cetakan).
// Bila baris belum ada → kembalikan default (RS_PROFIL_INITIAL) TANPA menulis (no write-on-read);
// baris lahir saat Save/Upload pertama. Save/Logo di-gate `master.konfigurasi:update` di Route.

import * as defaultDal from "@/lib/dal/master/rsProfilDal";
import type { RsProfilData, RsProfilEntity } from "@/lib/dal/master/rsProfilDal";
import { syncRootIdentity, type RootIdentityData } from "@/lib/dal/ruanganDal";
import { transaction } from "@/lib/db/prisma";
import type { Actor } from "@/lib/auth/actor";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import {
  type UpsertRsProfilInput, type RsProfilDTO,
  type RsAlamatDTO, type RsAkreditasiDTO, type RsShiftDTO, type RsKopDTO,
} from "@/lib/schemas/master/profilRs";

type Dal = typeof defaultDal;

function entityToDTO(e: RsProfilEntity): RsProfilDTO {
  return {
    nama: e.nama,
    namaInggris: e.namaInggris ?? undefined,
    kode: e.kode,
    kelas: e.kelas as RsProfilDTO["kelas"],
    tipe: e.tipe as RsProfilDTO["tipe"],
    kepemilikan: e.kepemilikan as RsProfilDTO["kepemilikan"],
    telp: e.telp,
    fax: e.fax ?? undefined,
    email: e.email,
    website: e.website ?? undefined,
    alamat: e.alamat as unknown as RsAlamatDTO,
    akreditasi: e.akreditasi as unknown as RsAkreditasiDTO,
    shift: e.shift as unknown as RsShiftDTO,
    kop: e.kop as unknown as RsKopDTO,
    logoDataUrl: e.logoDataUrl ?? null,
    updatedAt: e.updatedAt.toISOString(),
    updatedBy: e.updatedBy ?? null,
  };
}

/** Default efektif (baris belum ada) — dari konstanta seed, logo kosong. */
function defaultDTO(): RsProfilDTO {
  const d = RS_PROFIL_INITIAL;
  return {
    nama: d.nama,
    namaInggris: d.namaInggris,
    kode: d.kode,
    kelas: d.kelas,
    tipe: d.tipe,
    kepemilikan: d.kepemilikan,
    telp: d.telp,
    fax: d.fax,
    email: d.email,
    website: d.website,
    alamat: d.alamat,
    akreditasi: d.akreditasi,
    shift: d.shift,
    kop: d.kop,
    logoDataUrl: null,
  };
}

/** Payload upsert → data DAL (default konstanta agar create pertama valid). */
function inputToData(input: UpsertRsProfilInput, actor: Actor): RsProfilData {
  return {
    nama: input.nama,
    namaInggris: input.namaInggris ?? null,
    kode: input.kode,
    kelas: input.kelas,
    tipe: input.tipe,
    kepemilikan: input.kepemilikan,
    telp: input.telp,
    fax: input.fax ?? null,
    email: input.email,
    website: input.website ?? null,
    alamat: input.alamat,
    akreditasi: input.akreditasi,
    shift: input.shift,
    kop: input.kop,
    updatedBy: actor.pegawaiId,
  };
}

/** Profil RS → kolom Organization root (RS Induk di Unit & Ruangan). String kosong → null. */
export function rootIdentityFromProfil(p: Pick<RsProfilData, "kode" | "nama" | "telp" | "email" | "alamat">): RootIdentityData {
  const v = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);
  return {
    kode: p.kode.trim().toUpperCase(),
    nama: p.nama.trim(),
    telp: v(p.telp),
    email: v(p.email),
    alamat: v(p.alamat.jalan),
    kodePos: v(p.alamat.kodePos),
    provinsiNama: v(p.alamat.provinsi),
    kotaNama: v(p.alamat.kota),
    kecamatanNama: v(p.alamat.kecamatan),
    kelurahanNama: v(p.alamat.kelurahan),
    kelurahanKode: v(p.alamat.kodeWilayah),
  };
}

export interface SaveRsProfilResult {
  profil: RsProfilDTO;
  /** Jumlah baris Organization yang ikut diselaraskan (root 0/1 · sub-unit beralamat warisan). */
  rsInduk: { root: number; units: number };
}

export function makeRsProfilService(deps: { dal?: Dal; syncRoot?: typeof syncRootIdentity } = {}) {
  const dal = deps.dal ?? defaultDal;
  const syncRoot = deps.syncRoot ?? syncRootIdentity;

  /** Profil efektif (DB bila ada, else default konstanta). ACTOR-LESS. */
  async function get(): Promise<RsProfilDTO> {
    const row = await dal.get();
    return row ? entityToDTO(row) : defaultDTO();
  }

  /**
   * Simpan profil tekstual (upsert singleton) + selaraskan RS Induk (Organization root) dalam SATU
   * transaksi — Profil RS sumber kebenaran identitas; Unit & Ruangan hanya menampilkannya.
   */
  async function save(input: UpsertRsProfilInput, actor: Actor): Promise<SaveRsProfilResult> {
    const data = inputToData(input, actor);
    return transaction(async (tx) => {
      const row = await dal.upsert(data, tx);
      const rsInduk = await syncRoot(rootIdentityFromProfil(data), tx);
      return { profil: entityToDTO(row), rsInduk };
    });
  }

  /** Set logo (data URI). Baris dijamin ada dulu (seed default bila perlu). */
  async function saveLogo(dataUrl: string, actor: Actor): Promise<RsProfilDTO> {
    await ensureRow(actor);
    return entityToDTO(await dal.updateLogo(dataUrl, actor.pegawaiId));
  }

  /** Hapus logo (kembali ke placeholder). */
  async function removeLogo(actor: Actor): Promise<RsProfilDTO> {
    await ensureRow(actor);
    return entityToDTO(await dal.updateLogo(null, actor.pegawaiId));
  }

  // Seed baris singleton dari default bila belum ada (agar updateLogo tak gagal).
  async function ensureRow(actor: Actor): Promise<void> {
    if (await dal.get()) return;
    const d = defaultDTO();
    await dal.upsert({
      nama: d.nama,
      namaInggris: d.namaInggris ?? null,
      kode: d.kode,
      kelas: d.kelas,
      tipe: d.tipe,
      kepemilikan: d.kepemilikan,
      telp: d.telp,
      fax: d.fax ?? null,
      email: d.email,
      website: d.website ?? null,
      alamat: d.alamat,
      akreditasi: d.akreditasi,
      shift: d.shift,
      kop: d.kop,
      updatedBy: actor.pegawaiId,
    });
  }

  return { get, save, saveLogo, removeLogo };
}

export const rsProfilService = makeRsProfilService();
