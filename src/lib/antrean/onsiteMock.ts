// ANT-ONSITE — Mock katalog poli + dokter + kuota untuk kiosk APM.
// Mock-first: kode poli mengikuti referensi HFIS/BPJS (lihat rujukanMock).
// Saat backend ready → swap ke `/ehis-master/jadwal-dokter` (single source jadwal)
// + referensi poli HFIS. UI kiosk tidak berubah.

import type { CaraBayar } from "./types";

// ── Poli ───────────────────────────────────────────────────

export interface PoliOnsite {
  /** kode poli BPJS/HFIS (mis. "INT", "JAN"). */
  kode: string;
  nama: string;
  /** label lucide icon — di-resolve di komponen. */
  icon: PoliIconKey;
}

export type PoliIconKey =
  | "stethoscope"
  | "heart"
  | "lungs"
  | "scalpel"
  | "brain"
  | "baby"
  | "ear"
  | "eye"
  | "bone"
  | "tooth";

export const POLI_ONSITE: ReadonlyArray<PoliOnsite> = [
  { kode: "UMU", nama: "Poli Umum", icon: "stethoscope" },
  { kode: "INT", nama: "Penyakit Dalam", icon: "stethoscope" },
  { kode: "JAN", nama: "Jantung", icon: "heart" },
  { kode: "PAR", nama: "Paru", icon: "lungs" },
  { kode: "BED", nama: "Bedah", icon: "scalpel" },
  { kode: "SAR", nama: "Saraf", icon: "brain" },
  { kode: "ANA", nama: "Anak", icon: "baby" },
  { kode: "THT", nama: "THT-KL", icon: "ear" },
  { kode: "MAT", nama: "Mata", icon: "eye" },
  { kode: "ORT", nama: "Ortopedi", icon: "bone" },
  { kode: "GIG", nama: "Gigi & Mulut", icon: "tooth" },
  { kode: "OBG", nama: "Obstetri & Ginekologi", icon: "baby" },
];

// ── Dokter ─────────────────────────────────────────────────

export interface DokterOnsite {
  kode: string;
  nama: string;
  poliKode: string;
  /** jam praktik display, mis. "08:00 – 14:00". */
  jamPraktik: string;
  jamMulai: string; // "08:00" — basis estimasi
  /** rerata menit per pasien (untuk estimasi jam dilayani). */
  menitPerPasien: number;
  kuotaJKN: number;
  terisiJKN: number;
  kuotaNonJKN: number;
  terisiNonJKN: number;
}

export const DOKTER_ONSITE: ReadonlyArray<DokterOnsite> = [
  // Poli Umum
  { kode: "D-UMU-1", nama: "dr. Rini Kusuma", poliKode: "UMU", jamPraktik: "08:00 – 14:00", jamMulai: "08:00", menitPerPasien: 8, kuotaJKN: 40, terisiJKN: 12, kuotaNonJKN: 20, terisiNonJKN: 4 },
  { kode: "D-UMU-2", nama: "dr. Tono Wijaya", poliKode: "UMU", jamPraktik: "13:00 – 19:00", jamMulai: "13:00", menitPerPasien: 8, kuotaJKN: 40, terisiJKN: 5, kuotaNonJKN: 20, terisiNonJKN: 2 },
  // Penyakit Dalam
  { kode: "D-INT-1", nama: "dr. Anisa Putri, Sp.PD", poliKode: "INT", jamPraktik: "08:00 – 12:00", jamMulai: "08:00", menitPerPasien: 12, kuotaJKN: 25, terisiJKN: 18, kuotaNonJKN: 10, terisiNonJKN: 6 },
  { kode: "D-INT-2", nama: "dr. Yudi Santosa, Sp.PD", poliKode: "INT", jamPraktik: "10:00 – 15:00", jamMulai: "10:00", menitPerPasien: 12, kuotaJKN: 25, terisiJKN: 25, kuotaNonJKN: 10, terisiNonJKN: 3 },
  // Jantung
  { kode: "D-JAN-1", nama: "dr. Dewi Kusuma, Sp.JP", poliKode: "JAN", jamPraktik: "08:00 – 12:00", jamMulai: "08:00", menitPerPasien: 15, kuotaJKN: 20, terisiJKN: 9, kuotaNonJKN: 8, terisiNonJKN: 2 },
  { kode: "D-JAN-2", nama: "dr. Ahmad Fauzi, Sp.JP", poliKode: "JAN", jamPraktik: "13:00 – 17:00", jamMulai: "13:00", menitPerPasien: 15, kuotaJKN: 20, terisiJKN: 14, kuotaNonJKN: 8, terisiNonJKN: 1 },
  // Paru
  { kode: "D-PAR-1", nama: "dr. Susanto, Sp.P", poliKode: "PAR", jamPraktik: "09:00 – 14:00", jamMulai: "09:00", menitPerPasien: 12, kuotaJKN: 20, terisiJKN: 7, kuotaNonJKN: 8, terisiNonJKN: 1 },
  // Bedah
  { kode: "D-BED-1", nama: "dr. Indra Kurniawan, Sp.B", poliKode: "BED", jamPraktik: "08:00 – 12:00", jamMulai: "08:00", menitPerPasien: 14, kuotaJKN: 18, terisiJKN: 10, kuotaNonJKN: 8, terisiNonJKN: 3 },
  // Saraf
  { kode: "D-SAR-1", nama: "dr. Budi Hartono, Sp.S", poliKode: "SAR", jamPraktik: "10:00 – 15:00", jamMulai: "10:00", menitPerPasien: 14, kuotaJKN: 18, terisiJKN: 6, kuotaNonJKN: 6, terisiNonJKN: 0 },
  // Anak
  { kode: "D-ANA-1", nama: "dr. Maya Sari, Sp.A", poliKode: "ANA", jamPraktik: "08:00 – 13:00", jamMulai: "08:00", menitPerPasien: 10, kuotaJKN: 30, terisiJKN: 11, kuotaNonJKN: 15, terisiNonJKN: 5 },
  // THT
  { kode: "D-THT-1", nama: "dr. Reza Pratama, Sp.THT-KL", poliKode: "THT", jamPraktik: "09:00 – 13:00", jamMulai: "09:00", menitPerPasien: 12, kuotaJKN: 18, terisiJKN: 4, kuotaNonJKN: 8, terisiNonJKN: 1 },
  // Mata
  { kode: "D-MAT-1", nama: "dr. Lestari Wulandari, Sp.M", poliKode: "MAT", jamPraktik: "08:00 – 12:00", jamMulai: "08:00", menitPerPasien: 12, kuotaJKN: 20, terisiJKN: 8, kuotaNonJKN: 8, terisiNonJKN: 2 },
  // Ortopedi
  { kode: "D-ORT-1", nama: "dr. Galih Permana, Sp.OT", poliKode: "ORT", jamPraktik: "13:00 – 17:00", jamMulai: "13:00", menitPerPasien: 15, kuotaJKN: 16, terisiJKN: 16, kuotaNonJKN: 6, terisiNonJKN: 2 },
  // Gigi
  { kode: "D-GIG-1", nama: "drg. Putri Andini", poliKode: "GIG", jamPraktik: "08:00 – 14:00", jamMulai: "08:00", menitPerPasien: 20, kuotaJKN: 16, terisiJKN: 5, kuotaNonJKN: 10, terisiNonJKN: 3 },
  // Obgyn
  { kode: "D-OBG-1", nama: "dr. Sinta Maharani, Sp.OG", poliKode: "OBG", jamPraktik: "09:00 – 14:00", jamMulai: "09:00", menitPerPasien: 15, kuotaJKN: 18, terisiJKN: 7, kuotaNonJKN: 8, terisiNonJKN: 2 },
];

// ── Helpers ────────────────────────────────────────────────

export function getPoli(kode: string): PoliOnsite | undefined {
  return POLI_ONSITE.find((p) => p.kode === kode);
}

export function listDokterByPoli(poliKode: string): DokterOnsite[] {
  return DOKTER_ONSITE.filter((d) => d.poliKode === poliKode);
}

/** Sisa kuota dokter sesuai cara bayar. */
export function sisaKuota(dokter: DokterOnsite, caraBayar: CaraBayar): number {
  return caraBayar === "BPJS"
    ? Math.max(0, dokter.kuotaJKN - dokter.terisiJKN)
    : Math.max(0, dokter.kuotaNonJKN - dokter.terisiNonJKN);
}

export function kuotaTotal(dokter: DokterOnsite, caraBayar: CaraBayar): number {
  return caraBayar === "BPJS" ? dokter.kuotaJKN : dokter.kuotaNonJKN;
}

export function kuotaTerisi(dokter: DokterOnsite, caraBayar: CaraBayar): number {
  return caraBayar === "BPJS" ? dokter.terisiJKN : dokter.terisiNonJKN;
}

/**
 * Estimasi waktu (timestamp ms hari ini) pasien akan dilayani:
 * jamMulai dokter + (jumlah terisi × menitPerPasien).
 */
export function estimasiDilayani(dokter: DokterOnsite, caraBayar: CaraBayar): number {
  const [h, m] = dokter.jamMulai.split(":").map((n) => parseInt(n, 10));
  const base = new Date();
  base.setHours(h, m, 0, 0);
  const antrianDepan = kuotaTerisi(dokter, caraBayar);
  return base.getTime() + antrianDepan * dokter.menitPerPasien * 60_000;
}

/** Jumlah poli yang punya minimal 1 dokter dengan sisa kuota > 0 (untuk Beranda KPI). */
export function poliTersediaCount(caraBayar: CaraBayar = "BPJS"): number {
  return POLI_ONSITE.filter((p) =>
    listDokterByPoli(p.kode).some((d) => sisaKuota(d, caraBayar) > 0),
  ).length;
}
