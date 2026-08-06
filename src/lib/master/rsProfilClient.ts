"use client";

// rsProfilClient — store klien profil RS untuk KONSUMEN CETAKAN (KOP surat + logo).
//
// Masalah: puluhan template cetak (surat sakit/sehat, resume, SEP, rujukan, invoice,
// e-klaim…) butuh identitas RS + logo yang sama, tersebar lintas modul. Solusi: 1 store
// modul-level yang FETCH SEKALI (`/master/profil-rs`) + bagikan via useSyncExternalStore.
//
// Fallback = RS_PROFIL_INITIAL (konstanta) → tak pernah "kosong" saat loading/gagal/SSR.
// Konsumen cukup ganti `RS_PROFIL_INITIAL` → `useRsProfil()`; hasil DB (incl. logo) otomatis
// tersaji di seluruh cetakan. Halaman Profil RS memanggil setRsProfilCache() sesudah simpan
// agar KOP tercermin seketika tanpa reload.

import { useSyncExternalStore } from "react";
import { RS_PROFIL_INITIAL, type RSProfil } from "./rsProfilStore";
import { getRsProfil, type RsProfilDTO } from "@/lib/api/master/profilRs";

/** Profil RS + logo (untuk KOP). Superset RSProfil. */
export interface RsProfilFull extends RSProfil {
  logoDataUrl: string | null;
}

let cache: RsProfilFull = { ...RS_PROFIL_INITIAL, logoDataUrl: null };
let phase: "idle" | "loading" | "ready" = "idle";
const subs = new Set<() => void>();

function emit() {
  for (const f of subs) f();
}

/** DTO → RsProfilFull (bentuk hampir identik; buang meta updatedAt/By). */
export function dtoToFull(dto: RsProfilDTO): RsProfilFull {
  return {
    nama: dto.nama,
    namaInggris: dto.namaInggris,
    kode: dto.kode,
    kelas: dto.kelas,
    tipe: dto.tipe,
    kepemilikan: dto.kepemilikan,
    telp: dto.telp,
    fax: dto.fax,
    email: dto.email,
    website: dto.website,
    alamat: dto.alamat,
    akreditasi: dto.akreditasi,
    shift: dto.shift,
    kop: dto.kop,
    logoDataUrl: dto.logoDataUrl ?? null,
  };
}

async function ensureLoaded() {
  if (phase !== "idle") return;
  phase = "loading";
  try {
    cache = dtoToFull(await getRsProfil());
  } catch {
    /* pertahankan fallback konstanta */
  } finally {
    phase = "ready";
    emit();
  }
}

/** Perbarui cache manual (dipanggil halaman Profil RS sesudah Simpan/Upload logo). */
export function setRsProfilCache(next: RsProfilFull) {
  cache = next;
  phase = "ready";
  emit();
}

/** Profil RS live untuk cetakan. Fetch sekali (client) + fallback konstanta. */
export function useRsProfil(): RsProfilFull {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      void ensureLoaded(); // trigger di mount pertama (guarded)
      return () => subs.delete(cb);
    },
    () => cache,       // client snapshot
    () => cache,       // server snapshot (SSR = fallback konstanta, stabil)
  );
}
