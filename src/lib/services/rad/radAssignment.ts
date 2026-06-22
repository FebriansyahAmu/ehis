// radAssignment — ABAC SDM Assignment untuk aksi Radiologi (penunjang standalone). Berdampingan dgn
// RBAC (route() → assertCan). RBAC = "boleh aksi jenis ini?"; SDM Assignment = "orang ini benar-benar
// ditugaskan ke Radiologi ini?". Roster = pegawai aktif ter-assign ke Location tipe Radiologi
// (master.penugasanRuangan). Order ber-radKode → ruangan spesifik; kosong → semua Location Radiologi.
//
// BYPASS: superuser (Admin) SELALU lolos. Role global (isGlobal, tak terikat unit) juga lolos —
// SDM Assignment = unit-scoping, konsisten dgn careUnit ABAC (lihat docs/ASSIGNMENT-RULES.md).
// Pola identik labAssignment.ts (LocationType.Radiologi · validator = radiolog).

import * as ruanganDal from "@/lib/dal/ruanganDal";
import * as penugasanDal from "@/lib/dal/penugasanRuanganDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { RadPetugasDTO } from "@/lib/schemas/rad/radOrder";

/** Nama tampil pegawai (gelar depan + nama + gelar belakang). */
function namaTampil(p: { gelarDepan: string | null; namaLengkap: string; gelarBelakang: string | null }): string {
  const depan = p.gelarDepan ? `${p.gelarDepan} ` : "";
  const belakang = p.gelarBelakang ? `, ${p.gelarBelakang}` : "";
  return `${depan}${p.namaLengkap}${belakang}`;
}

/** Roster petugas Radiologi (dedup per pegawai) — radKode → ruangan spesifik else semua Radiologi. */
export async function radRoster(radKode: string | null | undefined): Promise<RadPetugasDTO[]> {
  const radLocs = await ruanganDal.listLocationsByType("Radiologi");
  const match = radKode ? radLocs.find((l) => l.kode === radKode) : undefined;
  const locationIds = match ? [match.id] : radLocs.map((l) => l.id);

  const rows = await penugasanDal.listPetugasByLocations({ locationIds });
  const seen = new Set<string>();
  const out: RadPetugasDTO[] = [];
  for (const r of rows) {
    if (seen.has(r.pegawaiId)) continue;
    seen.add(r.pegawaiId);
    out.push({ pegawaiId: r.pegawaiId, namaTampil: namaTampil(r.pegawai), profesi: r.pegawai.profesi });
  }
  return out;
}

/** Profesi dokter (radiolog Sp.Rad / dokter) → kandidat validator. */
export function isDoctor(p: RadPetugasDTO): boolean {
  return (p.profesi ?? "").toLowerCase().includes("dokter");
}

/** true bila actor melewati cek SDM (superuser/Admin, atau role global tak terikat unit). */
export function radAssignmentBypassed(actor: Actor): boolean {
  return actor.isSuperuser || actor.isGlobal;
}

/** Assert ACTOR ter-assign ke Radiologi (penerima/radiografer/radiolog). Lempar FORBIDDEN bila bukan SDM ter-assign. */
export async function assertActorAssignedToRad(actor: Actor, radKode: string | null | undefined): Promise<void> {
  if (radAssignmentBypassed(actor)) return;
  const roster = await radRoster(radKode);
  if (!roster.some((p) => p.pegawaiId === actor.pegawaiId)) {
    throw Errors.forbidden(
      "Anda belum ditugaskan ke unit Radiologi (SDM Assignment). Hubungi admin untuk penugasan.",
    );
  }
}

/**
 * Resolusi nama validator dari pegawai terpilih (HARUS radiolog ter-assign Radiologi).
 * Non-bypass: pilihan wajib & diverifikasi → kembalikan nama dari roster (anti-spoof).
 * Bypass (superuser/global): pakai pilihan bila valid, else nama fallback, else nama actor.
 */
export async function resolveValidatorNama(
  actor: Actor,
  radKode: string | null | undefined,
  picked: { pegawaiId?: string; nama?: string },
  fallbackActorNama: () => Promise<string>,
): Promise<string> {
  const bypass = radAssignmentBypassed(actor);

  if (picked.pegawaiId) {
    const roster = await radRoster(radKode);
    const doc = roster.find((p) => p.pegawaiId === picked.pegawaiId && isDoctor(p));
    if (doc) return doc.namaTampil;
    if (!bypass) throw Errors.forbidden("Validator harus radiolog yang ditugaskan ke Radiologi (SDM Assignment).");
    return picked.nama?.trim() || (await fallbackActorNama());
  }

  if (!bypass) throw Errors.forbidden("Pilih radiolog validator yang ditugaskan ke Radiologi (SDM Assignment).");
  return picked.nama?.trim() || (await fallbackActorNama());
}
