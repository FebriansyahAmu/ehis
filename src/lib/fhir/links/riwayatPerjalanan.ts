/**
 * S6a — L27 riwayat perjalanan penyakit → ClinicalImpression `312850006` (fungsi murni, client-safe).
 *
 * Sumber: `Anamnesis.rps` (Riwayat Penyakit Sekarang — narasi wajib di form Anamnesis IGD/RI/RJ). Anamnesis
 * append-only "latest wins" → 1 resource per KUNJUNGAN (localId tetap), simpan ulang = PUT resource yang sama.
 * Narasi dikosongkan di simpanan terbaru → `tarik` (entered-in-error; sink hanya meng-update bila pernah terkirim).
 *
 * Playbook RJ/RI bab 6 · IGD bab 8: kode 312850006 + `summary` (string). Daftar elemen IGD ikut menandai
 * `investigation.code` & `prognosisCodeableConcept` wajib, tetapi contoh resmi RI (bundle Postman) tidak memuat
 * keduanya — diikuti contoh resmi; dicatat untuk uji sandbox (FG-141).
 */

import type { Rencana } from "./anamnesis";

export const riwayatPerjalananLocalId = (kunjunganId: string) => `${kunjunganId}:riwayat-perjalanan`;

export interface AnamnesisRpsRow {
  rps: string | null;
  authorPegawaiId: string | null;
  createdAt: Date;
}

export interface RiwayatPerjalananItem {
  localId: string;
  summary: string;
  waktu: Date;
  authorPegawaiId: string | null;
}

/** Isian kosong / tanda kosong ("-", ".", "–") = tidak ada narasi. */
const narasiOf = (s: string | null | undefined): string => {
  const t = (s ?? "").trim();
  return /^[-–—.\s]*$/.test(t) ? "" : t;
};

export function riwayatPerjalananRencana(kunjunganId: string, latest: AnamnesisRpsRow | null): Rencana<RiwayatPerjalananItem> {
  if (!latest) return { kirim: [], tarik: [], issues: [] };
  const item: RiwayatPerjalananItem = {
    localId: riwayatPerjalananLocalId(kunjunganId),
    summary: narasiOf(latest.rps),
    waktu: latest.createdAt,
    authorPegawaiId: latest.authorPegawaiId,
  };
  return item.summary ? { kirim: [item], tarik: [], issues: [] } : { kirim: [], tarik: [item], issues: [] };
}
