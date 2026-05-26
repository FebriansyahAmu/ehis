/**
 * Berkas Templates Mock (EK0.2).
 *
 * Template berkas wajib per kombinasi (penjamin × tipePelayanan).
 * Dipakai `berkasChecker.ts` (EK0.3) untuk validasi kelengkapan klaim sebelum submit.
 *
 * Convention: tiap template = list metadata (kategori + nama + wajib + catatan).
 * Per-claim instance jadi `BerkasKlaim` (dengan id, status, file, sumber, dst.)
 * via factory `instansiBerkasFromTemplate()`.
 *
 * Reference: PMK 26/2021 (Pedoman Verifikasi BPJS) + AAJI Standar Klaim.
 */

import type { BerkasKategori, BerkasKlaim, TipePelayanan, TipePenjamin } from "./eklaimShared";

// ── Template Type ──────────────────────────────────────

export interface BerkasTemplate {
  kategori: BerkasKategori;
  nama: string;
  wajib: boolean;
  /** Hint untuk verifikator / coder — kondisi/syarat khusus. */
  catatanKhusus?: string;
}

// ── BPJS — Rawat Inap (paling lengkap) ─────────────────

export const BERKAS_TEMPLATE_BPJS_RI: ReadonlyArray<BerkasTemplate> = [
  {
    kategori: "SEP",
    nama: "Surat Eligibilitas Pasien (SEP)",
    wajib: true,
    catatanKhusus: "Cetak SEP saat admisi via V-Claim",
  },
  {
    kategori: "Identitas",
    nama: "Foto KTP + Kartu BPJS",
    wajib: true,
  },
  {
    kategori: "Rujukan",
    nama: "Surat Rujukan FKTP",
    wajib: true,
    catatanKhusus: "Optional jika admisi via IGD emergency",
  },
  {
    kategori: "ResumeMedis",
    nama: "Resume Medis (ditandatangani DPJP)",
    wajib: true,
    catatanKhusus: "Wajib finalisasi sebelum klaim · PMK 269/2008",
  },
  {
    kategori: "Tindakan",
    nama: "Lembar Tindakan / Laporan Operasi",
    wajib: true,
    catatanKhusus: "Jika ada tindakan/operasi tercatat di koding ICD-9-CM-IM",
  },
  {
    kategori: "Lab",
    nama: "Hasil Pemeriksaan Laboratorium",
    wajib: true,
    catatanKhusus: "Auto-pull dari /ehis-care/laboratorium order Tervalidasi",
  },
  {
    kategori: "Rad",
    nama: "Hasil Pemeriksaan Radiologi",
    wajib: false,
    catatanKhusus: "Wajib jika ada order radiologi dalam kasus",
  },
  {
    kategori: "Billing",
    nama: "Rincian Tagihan Itemized",
    wajib: true,
    catatanKhusus: "Auto-pull dari /ehis-billing/tagihan/[id] charge items",
  },
  {
    kategori: "Grouper",
    nama: "Hasil iDRG Grouper",
    wajib: true,
    catatanKhusus: "Bridging real-time INA-Grouper iDRG (Pedoman iDRG 2025)",
  },
  {
    kategori: "Khusus",
    nama: "Laporan Anestesi (jika operasi)",
    wajib: false,
    catatanKhusus: "Wajib jika ada tindakan operasi dengan anestesi",
  },
  {
    kategori: "Khusus",
    nama: "Laporan Kemoterapi / Dialisis (jika applicable)",
    wajib: false,
  },
];

// ── BPJS — Rawat Jalan (lebih ringan) ──────────────────

export const BERKAS_TEMPLATE_BPJS_RJ: ReadonlyArray<BerkasTemplate> = [
  {
    kategori: "SEP",
    nama: "Surat Eligibilitas Pasien (SEP)",
    wajib: true,
  },
  {
    kategori: "Identitas",
    nama: "Foto KTP + Kartu BPJS",
    wajib: true,
  },
  {
    kategori: "Rujukan",
    nama: "Surat Rujukan FKTP",
    wajib: true,
  },
  {
    kategori: "ResumeMedis",
    nama: "Resume Pemeriksaan Poliklinik (ditandatangani DPJP)",
    wajib: true,
  },
  {
    kategori: "Lab",
    nama: "Hasil Pemeriksaan Laboratorium",
    wajib: false,
    catatanKhusus: "Wajib jika order lab dilakukan",
  },
  {
    kategori: "Rad",
    nama: "Hasil Pemeriksaan Radiologi",
    wajib: false,
    catatanKhusus: "Wajib jika order radiologi dilakukan",
  },
  {
    kategori: "Billing",
    nama: "Rincian Tagihan Itemized",
    wajib: true,
  },
  {
    kategori: "Grouper",
    nama: "Hasil iDRG Grouper (Same Day Care)",
    wajib: true,
  },
];

// ── BPJS — IGD (emergency, rujukan optional) ───────────

export const BERKAS_TEMPLATE_BPJS_IGD: ReadonlyArray<BerkasTemplate> = [
  {
    kategori: "SEP",
    nama: "Surat Eligibilitas Pasien (SEP)",
    wajib: true,
    catatanKhusus: "Cetak SEP dalam 3x24 jam setelah admisi IGD",
  },
  {
    kategori: "Identitas",
    nama: "Foto KTP + Kartu BPJS",
    wajib: true,
  },
  {
    kategori: "Rujukan",
    nama: "Surat Rujukan FKTP",
    wajib: false,
    catatanKhusus: "Tidak wajib untuk kasus emergency murni (P1/P2)",
  },
  {
    kategori: "ResumeMedis",
    nama: "Resume Medis IGD (ditandatangani DPJP IGD)",
    wajib: true,
  },
  {
    kategori: "Tindakan",
    nama: "Lembar Tindakan IGD",
    wajib: true,
    catatanKhusus: "Wajib jika ada tindakan tercatat",
  },
  {
    kategori: "Lab",
    nama: "Hasil Pemeriksaan Laboratorium",
    wajib: false,
  },
  {
    kategori: "Rad",
    nama: "Hasil Pemeriksaan Radiologi",
    wajib: false,
  },
  {
    kategori: "Billing",
    nama: "Rincian Tagihan Itemized",
    wajib: true,
  },
  {
    kategori: "Grouper",
    nama: "Hasil iDRG Grouper",
    wajib: true,
  },
];

// ── Asuransi (Standar AAJI) ────────────────────────────

export const BERKAS_TEMPLATE_ASURANSI: ReadonlyArray<BerkasTemplate> = [
  {
    kategori: "Identitas",
    nama: "Foto KTP + Kartu Asuransi (Polis)",
    wajib: true,
  },
  {
    kategori: "ResumeMedis",
    nama: "Resume Medis (ditandatangani DPJP)",
    wajib: true,
    catatanKhusus: "Format sesuai AAJI · cover diagnosis primer + sekunder",
  },
  {
    kategori: "Tindakan",
    nama: "Lembar Tindakan / Laporan Operasi",
    wajib: false,
    catatanKhusus: "Wajib jika ada tindakan/operasi",
  },
  {
    kategori: "Lab",
    nama: "Hasil Pemeriksaan Laboratorium",
    wajib: false,
  },
  {
    kategori: "Rad",
    nama: "Hasil Pemeriksaan Radiologi",
    wajib: false,
  },
  {
    kategori: "Khusus",
    nama: "Form Klaim Penjamin (per perusahaan asuransi)",
    wajib: true,
    catatanKhusus: "Form berbeda per asuransi (Mandiri Inhealth/Allianz/AXA/Prudential dst.)",
  },
  {
    kategori: "Khusus",
    nama: "Surat Pengantar / Pre-Authorization (cashless)",
    wajib: false,
    catatanKhusus: "Wajib untuk skema cashless · tidak perlu untuk reimbursement",
  },
  {
    kategori: "Billing",
    nama: "Rincian Tagihan Itemized",
    wajib: true,
  },
];

// ── Template Lookup ────────────────────────────────────

/**
 * Resolve template berkas yang sesuai untuk kombinasi (penjamin × tipePelayanan).
 * Asuransi pakai 1 template untuk semua tipe (form penjamin yang varies).
 */
export function getBerkasTemplate(
  penjamin: TipePenjamin,
  tipePelayanan: TipePelayanan,
): ReadonlyArray<BerkasTemplate> {
  if (penjamin === "asuransi") return BERKAS_TEMPLATE_ASURANSI;

  // BPJS + Jamkesda pakai template BPJS (Jamkesda umumnya copy struktur BPJS)
  switch (tipePelayanan) {
    case "RI":
      return BERKAS_TEMPLATE_BPJS_RI;
    case "RJ":
    case "SameDay":
      return BERKAS_TEMPLATE_BPJS_RJ;
  }
}

/**
 * Factory: instansiasi `BerkasKlaim[]` dari template.
 * Status default semua "Belum"; sumber default "upload-manual".
 * Caller bisa override per-item untuk auto-pull dari modul lain.
 */
export function instansiBerkasFromTemplate(
  template: ReadonlyArray<BerkasTemplate>,
  claimId: string,
): BerkasKlaim[] {
  return template.map((tpl, idx) => ({
    id: `${claimId}-berkas-${String(idx + 1).padStart(2, "0")}`,
    kategori: tpl.kategori,
    nama: tpl.nama,
    wajib: tpl.wajib,
    status: "Belum",
    sumber: { type: "upload-manual" },
    catatan: tpl.catatanKhusus,
  }));
}
