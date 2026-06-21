// labAssignment — ABAC SDM Assignment untuk aksi Lab (penunjang standalone). Berdampingan dgn RBAC
// (route() → assertCan). RBAC = "boleh aksi jenis ini?"; SDM Assignment = "orang ini benar-benar
// ditugaskan ke Lab ini?". Roster = pegawai aktif ter-assign ke Location tipe Laboratorium
// (master.penugasanRuangan). Order ber-labKode → ruangan spesifik; kosong → semua Location Lab.
//
// BYPASS: superuser (Admin) SELALU lolos. Role global (isGlobal, tak terikat unit) juga lolos —
// SDM Assignment = unit-scoping, konsisten dgn careUnit ABAC (lihat docs/ASSIGNMENT-RULES.md).

import * as ruanganDal from "@/lib/dal/ruanganDal";
import * as penugasanDal from "@/lib/dal/penugasanRuanganDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { LabPetugasDTO } from "@/lib/schemas/lab/labOrder";

/** Nama tampil pegawai (gelar depan + nama + gelar belakang). */
function namaTampil(p: { gelarDepan: string | null; namaLengkap: string; gelarBelakang: string | null }): string {
  const depan = p.gelarDepan ? `${p.gelarDepan} ` : "";
  const belakang = p.gelarBelakang ? `, ${p.gelarBelakang}` : "";
  return `${depan}${p.namaLengkap}${belakang}`;
}

/** Roster petugas Lab (dedup per pegawai) untuk order — labKode → ruangan spesifik else semua Lab. */
export async function labRoster(labKode: string | null | undefined): Promise<LabPetugasDTO[]> {
  const labLocs = await ruanganDal.listLocationsByType("Laboratorium");
  const match = labKode ? labLocs.find((l) => l.kode === labKode) : undefined;
  const locationIds = match ? [match.id] : labLocs.map((l) => l.id);

  const rows = await penugasanDal.listPetugasByLocations({ locationIds });
  const seen = new Set<string>();
  const out: LabPetugasDTO[] = [];
  for (const r of rows) {
    if (seen.has(r.pegawaiId)) continue;
    seen.add(r.pegawaiId);
    out.push({ pegawaiId: r.pegawaiId, namaTampil: namaTampil(r.pegawai), profesi: r.pegawai.profesi });
  }
  return out;
}

/** Profesi dokter (Umum/Spesialis) → kandidat validator. */
export function isDoctor(p: LabPetugasDTO): boolean {
  return (p.profesi ?? "").toLowerCase().includes("dokter");
}

/** true bila actor melewati cek SDM (superuser/Admin, atau role global tak terikat unit). */
export function labAssignmentBypassed(actor: Actor): boolean {
  return actor.isSuperuser || actor.isGlobal;
}

/** Assert ACTOR ter-assign ke Lab (penerima/analis). Lempar FORBIDDEN bila bukan SDM ter-assign. */
export async function assertActorAssignedToLab(actor: Actor, labKode: string | null | undefined): Promise<void> {
  if (labAssignmentBypassed(actor)) return;
  const roster = await labRoster(labKode);
  if (!roster.some((p) => p.pegawaiId === actor.pegawaiId)) {
    throw Errors.forbidden(
      "Anda belum ditugaskan ke unit Laboratorium (SDM Assignment). Hubungi admin untuk penugasan.",
    );
  }
}

/**
 * Resolusi nama validator dari pegawai terpilih (HARUS dokter ter-assign Lab).
 * Non-bypass: pilihan wajib & diverifikasi → kembalikan nama dari roster (anti-spoof).
 * Bypass (superuser/global): pakai pilihan bila valid, else nama fallback, else nama actor.
 */
export async function resolveValidatorNama(
  actor: Actor,
  labKode: string | null | undefined,
  picked: { pegawaiId?: string; nama?: string },
  fallbackActorNama: () => Promise<string>,
): Promise<string> {
  const bypass = labAssignmentBypassed(actor);

  if (picked.pegawaiId) {
    const roster = await labRoster(labKode);
    const doc = roster.find((p) => p.pegawaiId === picked.pegawaiId && isDoctor(p));
    if (doc) return doc.namaTampil;
    if (!bypass) throw Errors.forbidden("Validator harus dokter yang ditugaskan ke Laboratorium (SDM Assignment).");
    // bypass: pilihan tak valid → fallback nama/actor
    return picked.nama?.trim() || (await fallbackActorNama());
  }

  if (!bypass) throw Errors.forbidden("Pilih dokter validator yang ditugaskan ke Laboratorium (SDM Assignment).");
  return picked.nama?.trim() || (await fallbackActorNama());
}
