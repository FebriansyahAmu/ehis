/**
 * Banding Mock (EK6.1).
 *
 * 8 BandingRecord entries cross-link ke CLAIM_BOARD_MOCK via claimId.
 * Distribusi:
 *   Submitted : 2  (baru diajukan, menunggu V-Claim)
 *   Review    : 2  (sedang dikaji verifikator BPJS)
 *   Approved  : 3  (banding dikabulkan)
 *   Rejected  : 1  (banding ditolak — escalation Tingkat 2)
 *
 * Claim IDs yang ada banding:
 *   CLM-2026-05-008  Siska Lestari  · N18.5 · Rejected
 *   CLM-2026-05-013  Eko Prasetyo   · N17.9 · Banding Submitted
 *   CLM-2026-05-024  Tono Iskandar  · I21.0 · Banding Approved
 */

import type { BandingRecord } from "./eklaimShared";

export const BANDING_MOCK: ReadonlyArray<BandingRecord> = [
  // ─── CLM-2026-05-013 (Eko Prasetyo) ────────────────────
  {
    id: "BND-2026-05-001",
    claimId: "CLM-2026-05-013",
    tingkat: 1,
    alasanRejectionAsli:
      "Prosedur dialisis (39.95) tidak sesuai protokol BPJS Non-PBI — tidak ada " +
      "dokumentasi CKD Stage 5 dalam 3 bulan terakhir. Resume medis tidak lengkap.",
    alasanBanding:
      "Telah dilampirkan ringkasan medis 4 bulan terakhir beserta hasil lab kreatinin serial " +
      "dari laboratorium internal. Koding N17.9 sudah sesuai Pedoman iDRG 2025 Bab VIII.3. " +
      "Kami melampirkan 3 berkas pendukung tambahan termasuk surat keterangan DPJP.",
    dokumenPendukung: [],
    submittedAt: "2026-05-25T10:30",
    submittedBy: "Susi (Tim Klaim)",
    status: "Submitted",
  },

  // ─── CLM-2026-05-008 (Siska Lestari) — Tingkat 1 ──────
  {
    id: "BND-2026-05-002",
    claimId: "CLM-2026-05-008",
    tingkat: 1,
    alasanRejectionAsli:
      "Resume medis tidak mencantumkan justifikasi indikasi dialisis intensif " +
      "sesuai PMK 26/2021 Pasal 7 ayat 3.",
    alasanBanding:
      "Resume medis telah diperbarui dengan tanda tangan DPJP dan dilampirkan surat " +
      "keterangan spesialis nefrologi. Indikasi dialisis sudah sesuai klinis dan regulasi. " +
      "Silahkan lihat lampiran halaman 2-4.",
    dokumenPendukung: [],
    submittedAt: "2026-05-24T14:00",
    submittedBy: "Rina (Tim Klaim)",
    status: "Review",
    reviewerBpjs: "dr. Hendro (Verifikator BPJS Cabang Jakarta)",
  },

  // ─── CLM-2026-05-008 (Siska Lestari) — Tingkat 2 escalation ─
  {
    id: "BND-2026-05-003",
    claimId: "CLM-2026-05-008",
    tingkat: 2,
    alasanRejectionAsli:
      "Banding Tingkat 1 ditolak — verifikator cabang tetap tidak setuju indikasi dialisis.",
    alasanBanding:
      "Eskalasi ke kantor pusat BPJS Kesehatan. Telah disertakan surat keberatan formal " +
      "dari Direktur RS + second opinion konsultan nefrologi eksternal. " +
      "Dokumen lengkap sesuai format standar pengajuan Tingkat 2.",
    dokumenPendukung: [],
    submittedAt: "2026-05-26T09:00",
    submittedBy: "Susi (Tim Klaim)",
    status: "Submitted",
  },

  // ─── CLM-2026-05-024 (Tono Iskandar) — Approved ────────
  {
    id: "BND-2025-09-001",
    claimId: "CLM-2026-05-024",
    tingkat: 1,
    alasanRejectionAsli:
      "Kode INA-CBG I-1-01-II tidak match dengan output grouper verifikator — " +
      "severity level berbeda (RS: II, BPJS: I).",
    alasanBanding:
      "Disampaikan dokumentasi klinis lengkap + cross-reference output grouper software RS. " +
      "Severity II sudah tepat berdasarkan diagnosa sekunder I10 + E11.9.",
    dokumenPendukung: [],
    submittedAt: "2025-10-05T11:00",
    submittedBy: "Anita (Coder)",
    status: "Approved",
    reviewerBpjs: "dr. Agus (Verifikator BPJS Pusat)",
    reviewedAt: "2025-10-18T15:00",
    hasilBanding: "Banding dikabulkan. Kode dan severity divalidasi sesuai klaim asli RS.",
  },

  // ─── CLM-2026-05-013 (Eko Prasetyo) — Review ───────────
  {
    id: "BND-2026-04-001",
    claimId: "CLM-2026-05-013",
    tingkat: 1,
    alasanRejectionAsli:
      "Berkas SEP tidak valid — masa berlaku habis 2 hari sebelum tanggal pelayanan.",
    alasanBanding:
      "SEP telah diperpanjang dan dilampirkan. Data V-Claim diverifikasi valid per tanggal layanan. " +
      "Terlampir bukti print-out status keanggotaan dari Mobile JKN.",
    dokumenPendukung: [],
    submittedAt: "2026-04-14T10:00",
    submittedBy: "Rina (Tim Klaim)",
    status: "Review",
    reviewerBpjs: "dr. Wati (Verifikator BPJS Cabang Jakarta)",
  },

  // ─── CLM-2026-05-024 (Tono Iskandar) — Approved ────────
  {
    id: "BND-2026-04-002",
    claimId: "CLM-2026-05-024",
    tingkat: 1,
    alasanRejectionAsli:
      "Diagnosa sekunder tidak relevan dengan grouper — tidak sesuai ICS v1 Indonesian Coding Standard.",
    alasanBanding:
      "Diagnosa sekunder I10 dan E11.9 sudah valid ICS v1. Dilampirkan korespondensi " +
      "konsultasi coding dengan tim BPJS dan referensi Pedoman iDRG 2025.",
    dokumenPendukung: [],
    submittedAt: "2026-04-20T08:30",
    submittedBy: "Anita (Coder)",
    status: "Approved",
    reviewerBpjs: "dr. Wati (Verifikator BPJS Cabang Jakarta)",
    reviewedAt: "2026-05-04T10:00",
    hasilBanding: "Banding dikabulkan. Koding valid sesuai ICS v1 + Pedoman iDRG 2025.",
  },

  // ─── CLM-2026-05-008 (Siska Lestari) — Rejected ────────
  {
    id: "BND-2026-03-001",
    claimId: "CLM-2026-05-008",
    tingkat: 1,
    alasanRejectionAsli:
      "Kode prosedur 39.95 tidak tercover BPJS Non-PBI untuk LOS kurang dari 5 hari.",
    alasanBanding:
      "LOS 6 hari sudah melebihi ambang batas minimal sesuai surat edaran BPJS No. 14/2025. " +
      "Dilampirkan salinan surat edaran dan catatan medis harian.",
    dokumenPendukung: [],
    submittedAt: "2026-03-10T14:00",
    submittedBy: "Rina (Tim Klaim)",
    status: "Rejected",
    reviewerBpjs: "dr. Hendro (Verifikator BPJS Cabang Jakarta)",
    reviewedAt: "2026-03-25T11:00",
    hasilBanding:
      "Banding ditolak. LOS terhitung dari tanggal masuk ICU tidak memenuhi syarat minimum.",
  },

  // ─── CLM-2026-05-024 (Tono Iskandar) — Old Approved ────
  {
    id: "BND-2025-08-001",
    claimId: "CLM-2026-05-024",
    tingkat: 1,
    alasanRejectionAsli:
      "Tarif klaim melebihi batas atas yang ditetapkan BPJS untuk kode I-1-01-II di RS tipe B.",
    alasanBanding:
      "RS beroperasi di tingkat kompetensi utama (setara B+). Dilampirkan SK penetapan " +
      "tingkat kompetensi RS dari Kemenkes + SK tarif iDRG 2025.",
    dokumenPendukung: [],
    submittedAt: "2025-08-12T09:30",
    submittedBy: "Susi (Tim Klaim)",
    status: "Approved",
    reviewerBpjs: "dr. Agus (Verifikator BPJS Pusat)",
    reviewedAt: "2025-08-28T14:30",
    hasilBanding: "Banding dikabulkan. Tingkat kompetensi RS terverifikasi utama.",
  },
];
