// rsProfilService — Master Profil RS (SINGLETON). Business rule + map entity↔DTO.
// GET actor-less (SSR/public-read: identitas RS non-sensitif, dipakai KOP semua cetakan).
// Bila baris belum ada → kembalikan default (RS_PROFIL_INITIAL) TANPA menulis (no write-on-read);
// baris lahir saat Save/Upload pertama. Save/Logo di-gate `master.konfigurasi:update` di Route.

import * as defaultDal from "@/lib/dal/master/rsProfilDal";
import type { RsProfilData, RsProfilEntity } from "@/lib/dal/master/rsProfilDal";
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

export function makeRsProfilService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Profil efektif (DB bila ada, else default konstanta). ACTOR-LESS. */
  async function get(): Promise<RsProfilDTO> {
    const row = await dal.get();
    return row ? entityToDTO(row) : defaultDTO();
  }

  /** Simpan profil tekstual (upsert singleton). */
  async function save(input: UpsertRsProfilInput, actor: Actor): Promise<RsProfilDTO> {
    return entityToDTO(await dal.upsert(inputToData(input, actor)));
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
