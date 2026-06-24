// ⚠️ MOCK / STUB SEMENTARA — Cek Kepesertaan JKN (BPJS) yang SELALU sukses & status AKTIF.
//
// Dipakai untuk pengembangan agar alur Pendaftaran Kunjungan Baru (StepPenjamin → SEP) bisa jalan
// tanpa integrasi V-Claim. Fungsi `cariKepesertaanJkn()` TIDAK PERNAH mengembalikan null/Tidak Aktif:
// nomor apa pun → peserta AKTIF + data lengkap (tersintesis deterministik dari nomor).
//
// 🔁 GANTI KE PRODUKSI: tukar body `cariKepesertaanJkn()` dengan panggilan BFF V-Claim BPJS
//    (cek kepesertaan by noKartu / NIK), kembalikan status & masa berlaku ASLI, dan tangani
//    "tidak ditemukan". Checklist lengkap + daftar call-site → docs/MOCK-JKN-KEPESERTAAN.md.

import { BPJS_MOCK, type BpjsData, type BpjsMode } from "./sepTypes";

export interface KepesertaanQuery {
  mode: BpjsMode;   // "kartu" | "nik"
  value: string;    // digit No. Kartu (13) / NIK (16)
  /** Override nama peserta → samakan dengan pasien yang sedang didaftarkan (mock; abaikan saat produksi). */
  nama?: string;
}

const NAMA_POOL = [
  "Budi Santoso", "Dewi Lestari", "Ahmad Hidayat", "Siti Nurhaliza",
  "Rangga Wijaya", "Putri Maharani", "Eko Prasetyo", "Rina Wati",
];
const FKTP_POOL = [
  "Puskesmas Cempaka Putih", "Puskesmas Menteng", "Klinik Pratama Sehat",
  "Puskesmas Kebon Jeruk", "Dokter Keluarga dr. Sari",
];

const digitsOf = (s: string) => s.replace(/\D/g, "");
const sumDigits = (s: string) => [...s].reduce((a, c) => a + (Number(c) || 0), 0);

/** Masa berlaku = 5 tahun dari hari ini (selalu masih berlaku). */
function berlakuSd5Tahun(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  return d.toISOString().slice(0, 10);
}

/** Sintesis data peserta deterministik dari nomor input (untuk nomor di luar BPJS_MOCK). */
function synth(q: KepesertaanQuery): BpjsData {
  const v = digitsOf(q.value);
  const noKartu = q.mode === "kartu" ? v.padEnd(13, "0").slice(0, 13) : ("000" + v).slice(0, 13);
  const nik = q.mode === "nik" ? v.padEnd(16, "0").slice(0, 16) : (v + "0000000000000000").slice(0, 16);
  const sum = sumDigits(v);
  return {
    nama: NAMA_POOL[sum % NAMA_POOL.length],
    noKartu,
    nik,
    jenis: sum % 2 === 0 ? "Non-PBI" : "PBI",
    kelas: (["Kelas I", "Kelas II", "Kelas III"] as const)[sum % 3],
    fktp: FKTP_POOL[sum % FKTP_POOL.length],
    status: "Aktif",
    berlakuSd: berlakuSd5Tahun(),
  };
}

/**
 * Cek kepesertaan JKN — MOCK: SELALU mengembalikan peserta AKTIF + data lengkap. NEVER null.
 * Nomor yang dikenal (BPJS_MOCK) memakai nama/FKTP aslinya tetapi status DIPAKSA "Aktif" & masa
 * berlaku diperpanjang; nomor lain → data tersintesis deterministik. Delay ringan meniru latensi.
 */
export async function cariKepesertaanJkn(q: KepesertaanQuery): Promise<BpjsData> {
  await new Promise((r) => setTimeout(r, 600));
  const v = digitsOf(q.value);
  const base = BPJS_MOCK[v] ?? synth(q);
  // Nama = pasien yang sedang didaftarkan (bila ada) → konsisten dengan data RM. Else fallback.
  const nama = q.nama?.trim() || base.nama;
  // Paksa selalu AKTIF & masih berlaku (sesuai kebutuhan "selalu true").
  return { ...base, nama, status: "Aktif", berlakuSd: berlakuSd5Tahun() };
}
