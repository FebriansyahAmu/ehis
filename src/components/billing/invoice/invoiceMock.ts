/**
 * Mock detail invoice untuk BL2 Invoice Detail.
 *
 * Schema 1:1 dengan target backend Charge/Invoice. Setiap ChargeItem punya
 * `sourceRef` ke event klinis — saat backend ready, billingStore.addCharge()
 * dipanggil dari adapter sourceAdapter.ts.
 *
 * Mock ini fokus 2 kasus realistis:
 *   - INV-001 : Joko Prasetyo, IGD BPJS Kelas 2, 14 items, status Belum Lunas
 *   - INV-009 : Sutrisno Bagus, ICU BPJS Non-PBI, 12 items, status Lunas Sebagian
 */

import type { InvoiceDetail } from "./invoiceShared";

export const INVOICE_DETAIL_MOCK: Record<string, InvoiceDetail> = {
  // ─────────────────────────────────────────────────────
  // INV-001 · Joko Prasetyo · IGD BPJS Kelas 2
  // ─────────────────────────────────────────────────────
  "INV-001": {
    id: "INV-001",
    noTagihan: "INV/2026/05/00231",
    tanggalISO: "2026-05-24T08:15",
    noKunjungan: "IGD/2026/05/0089",
    pasien: { nama: "Joko Prasetyo", noRM: "RM-2025-005", gender: "L", age: 55, verified: true },
    unit: "IGD",
    kelas: "K2",
    penjamin: { tipe: "bpjs", nama: "BPJS Non-PBI", noSEP: "SEP-2026-0524-00089" },
    dpjp: "dr. Hendra Wijaya, Sp.EM",
    status: "Belum Lunas",
    diskonInvoice: 0,
    ppnPct: 0,
    materai: 10_000,
    dibayar: 500_000,
    payments: [
      {
        id: "pay-001-01",
        tanggalISO: "2026-05-24T11:45",
        metode: "Tunai",
        nominal: 500_000,
        kasir: "Sari (Kasir-1)",
        noKwitansi: "KW/2026/05/00188",
        kategori: "Deposit",
        catatan: "Deposit awal saat pendaftaran IGD",
      },
    ],
    timeline: [
      { step: "Draft",   label: "Dibuka",         status: "done",    at: "2026-05-24T08:15", by: "Sari (Admin IGD)" },
      { step: "Final",   label: "Difinalisasi",   status: "done",    at: "2026-05-24T11:32", by: "Sari (Admin IGD)" },
      { step: "Klaim",   label: "Submit Klaim",   status: "pending", detail: "Menunggu finalisasi penagihan" },
      { step: "Selesai", label: "Lunas",          status: "pending" },
    ],
    items: [
      // ── Akomodasi ──
      {
        id: "ch-001", tanggalISO: "2026-05-24T08:20", nama: "Bed Observasi IGD",
        sourceModul: "IGD", sourceRef: "IGD-OBS-0089",
        kategori: "Akomodasi", qty: 1, satuan: "kali", hargaSatuan: 150_000, coverage: "Penjamin",
      },
      // ── Tindakan ──
      {
        id: "ch-002", tanggalISO: "2026-05-24T08:25", nama: "Triase IGD Level 2",
        sourceModul: "IGD", sourceRef: "TINDAKAN-T-0145",
        kategori: "Tindakan", qty: 1, satuan: "kali", hargaSatuan: 75_000, coverage: "Penjamin",
      },
      {
        id: "ch-003", tanggalISO: "2026-05-24T09:10", nama: "Pemasangan IV Line",
        sourceModul: "IGD", sourceRef: "TINDAKAN-T-0146",
        kategori: "Tindakan", qty: 1, satuan: "kali", hargaSatuan: 85_000, coverage: "Penjamin",
      },
      {
        id: "ch-004", tanggalISO: "2026-05-24T09:25", nama: "Oksigenasi via Nasal Kanul",
        sourceModul: "IGD", sourceRef: "TINDAKAN-T-0147",
        kategori: "Tindakan", qty: 3, satuan: "jam", hargaSatuan: 35_000, coverage: "Penjamin",
      },
      // ── Lab ──
      {
        id: "ch-005", tanggalISO: "2026-05-24T08:48", nama: "Darah Lengkap (DL/CBC)",
        sourceModul: "Lab", sourceRef: "LAB-ORD-0512",
        kategori: "Lab", qty: 1, satuan: "test", hargaSatuan: 95_000, coverage: "Penjamin",
      },
      {
        id: "ch-006", tanggalISO: "2026-05-24T08:48", nama: "Elektrolit (Na/K/Cl)",
        sourceModul: "Lab", sourceRef: "LAB-ORD-0512",
        kategori: "Lab", qty: 1, satuan: "test", hargaSatuan: 120_000, coverage: "Penjamin",
      },
      {
        id: "ch-007", tanggalISO: "2026-05-24T08:48", nama: "Glukosa Darah Sewaktu",
        sourceModul: "Lab", sourceRef: "LAB-ORD-0512",
        kategori: "Lab", qty: 1, satuan: "test", hargaSatuan: 45_000, coverage: "Penjamin",
      },
      // ── Rad ──
      {
        id: "ch-008", tanggalISO: "2026-05-24T09:55", nama: "Foto Thorax AP (CITO)",
        sourceModul: "Rad", sourceRef: "RAD-ORD-0228",
        kategori: "Rad", qty: 1, satuan: "film", hargaSatuan: 175_000, coverage: "Penjamin",
      },
      {
        id: "ch-009", tanggalISO: "2026-05-24T10:30", nama: "EKG 12 Lead",
        sourceModul: "Rad", sourceRef: "RAD-ORD-0229",
        kategori: "Rad", qty: 1, satuan: "kali", hargaSatuan: 95_000, coverage: "Penjamin",
      },
      // ── Obat & BMHP ──
      {
        id: "ch-010", tanggalISO: "2026-05-24T09:15", nama: "Ringer Laktat 500ml",
        sourceModul: "Farmasi", sourceRef: "RESEP-R-0890-01",
        kategori: "Obat & BMHP", qty: 2, satuan: "flb", hargaSatuan: 28_500, coverage: "Penjamin",
      },
      {
        id: "ch-011", tanggalISO: "2026-05-24T09:15", nama: "IV Catheter 20G",
        sourceModul: "Farmasi", sourceRef: "RESEP-R-0890-02",
        kategori: "Obat & BMHP", qty: 1, satuan: "pcs", hargaSatuan: 18_000, coverage: "Penjamin",
      },
      {
        id: "ch-012", tanggalISO: "2026-05-24T09:40", nama: "Ondansetron 4mg/2ml inj",
        sourceModul: "Farmasi", sourceRef: "RESEP-R-0890-03",
        kategori: "Obat & BMHP", qty: 1, satuan: "amp", hargaSatuan: 24_500, coverage: "Penjamin",
      },
      {
        id: "ch-013", tanggalISO: "2026-05-24T10:05", nama: "Ranitidin 50mg/2ml inj",
        sourceModul: "Farmasi", sourceRef: "RESEP-R-0890-04",
        kategori: "Obat & BMHP", qty: 1, satuan: "amp", hargaSatuan: 18_500, coverage: "Pasien",
        // contoh: obat non-formularium → coverage pasien
      },
      // ── Jasa Dokter ──
      {
        id: "ch-014", tanggalISO: "2026-05-24T11:30", nama: "Jasa Visite Dokter Spesialis EM",
        sourceModul: "IGD", sourceRef: "CPPT-V-2026-0524-001",
        kategori: "Jasa Dokter", qty: 1, satuan: "visite", hargaSatuan: 245_000, coverage: "Penjamin",
      },
    ],
  },

  // ─────────────────────────────────────────────────────
  // INV-009 · Sutrisno Bagus · ICU BPJS Non-PBI
  // ─────────────────────────────────────────────────────
  "INV-009": {
    id: "INV-009",
    noTagihan: "INV/2026/05/00239",
    tanggalISO: "2026-05-24T14:02",
    noKunjungan: "RI/2026/05/0060",
    pasien: { nama: "Sutrisno Bagus", noRM: "RM-2025-049", gender: "L", age: 72, verified: true },
    unit: "RI",
    kelas: "ICU",
    penjamin: { tipe: "bpjs", nama: "BPJS Non-PBI", noSEP: "SEP-2026-0520-00060" },
    dpjp: "dr. Hendra Wijaya, Sp.EM",
    status: "Lunas Sebagian",
    diskonInvoice: 250_000,
    alasanDiskonInvoice: "Kebijaksanaan direktur (pasien lansia + ICU > 3 hari)",
    ppnPct: 0,
    materai: 10_000,
    dibayar: 2_000_000,
    payments: [
      {
        id: "pay-009-01",
        tanggalISO: "2026-05-20T22:50",
        metode: "Transfer",
        nominal: 1_500_000,
        kasir: "Bambang (Kasir-2)",
        noKwitansi: "KW/2026/05/00142",
        kategori: "Deposit",
        bank: "BCA",
        noRef: "TRF20260520-99481",
        catatan: "Deposit awal admisi ICU",
      },
      {
        id: "pay-009-02",
        tanggalISO: "2026-05-23T10:15",
        metode: "EDC",
        nominal: 750_000,
        kasir: "Bambang (Kasir-2)",
        noKwitansi: "KW/2026/05/00163",
        kategori: "Pembayaran",
        bank: "Mandiri",
        noRef: "EDC-MDI-7724150",
        catatan: "Cicilan ke-1",
      },
      {
        id: "pay-009-03",
        tanggalISO: "2026-05-23T16:40",
        metode: "QRIS",
        nominal: -250_000,
        kasir: "Bambang (Kasir-2)",
        noKwitansi: "KW/2026/05/00171",
        kategori: "Refund",
        refundOf: "pay-009-02",
        noRef: "QRIS-RFND-201",
        catatan: "Refund kelebihan cicilan (revisi tarif)",
      },
    ],
    timeline: [
      { step: "Draft",   label: "Dibuka",       status: "done", at: "2026-05-20T22:15", by: "Bambang (Admin RI)" },
      { step: "Final",   label: "Difinalisasi", status: "done", at: "2026-05-24T07:00", by: "Bambang (Admin RI)" },
      { step: "Klaim",   label: "Proses Klaim", status: "current", at: "2026-05-24T08:45", by: "Susi (Tim Klaim)", detail: "Menunggu approval V-Claim" },
      { step: "Selesai", label: "Lunas",        status: "pending" },
    ],
    items: [
      // ── Akomodasi (5 hari ICU) ──
      {
        id: "ic-001", tanggalISO: "2026-05-20T22:30", nama: "Akomodasi ICU (Hari 1)",
        sourceModul: "Akomodasi", sourceRef: "AKOM-ICU-D1",
        kategori: "Akomodasi", qty: 1, satuan: "hari", hargaSatuan: 1_500_000, coverage: "Penjamin",
      },
      {
        id: "ic-002", tanggalISO: "2026-05-21T22:30", nama: "Akomodasi ICU (Hari 2)",
        sourceModul: "Akomodasi", sourceRef: "AKOM-ICU-D2",
        kategori: "Akomodasi", qty: 1, satuan: "hari", hargaSatuan: 1_500_000, coverage: "Penjamin",
      },
      {
        id: "ic-003", tanggalISO: "2026-05-22T22:30", nama: "Akomodasi ICU (Hari 3)",
        sourceModul: "Akomodasi", sourceRef: "AKOM-ICU-D3",
        kategori: "Akomodasi", qty: 1, satuan: "hari", hargaSatuan: 1_500_000, coverage: "Penjamin",
      },
      {
        id: "ic-004", tanggalISO: "2026-05-23T22:30", nama: "Akomodasi ICU (Hari 4)",
        sourceModul: "Akomodasi", sourceRef: "AKOM-ICU-D4",
        kategori: "Akomodasi", qty: 1, satuan: "hari", hargaSatuan: 1_500_000, coverage: "Penjamin",
      },
      // ── Tindakan ICU ──
      {
        id: "ic-005", tanggalISO: "2026-05-20T22:45", nama: "Intubasi & Ventilator Setup",
        sourceModul: "RI", sourceRef: "TINDAKAN-T-0301",
        kategori: "Tindakan", qty: 1, satuan: "kali", hargaSatuan: 1_250_000, coverage: "Penjamin",
      },
      {
        id: "ic-006", tanggalISO: "2026-05-20T23:10", nama: "Ventilator Mekanik",
        sourceModul: "RI", sourceRef: "TINDAKAN-T-0302",
        kategori: "Tindakan", qty: 96, satuan: "jam", hargaSatuan: 35_000, coverage: "Penjamin",
      },
      // ── Lab ──
      {
        id: "ic-007", tanggalISO: "2026-05-20T23:00", nama: "AGD (Analisa Gas Darah)",
        sourceModul: "Lab", sourceRef: "LAB-ORD-0505",
        kategori: "Lab", qty: 4, satuan: "test", hargaSatuan: 185_000, coverage: "Penjamin",
      },
      {
        id: "ic-008", tanggalISO: "2026-05-21T06:00", nama: "Darah Lengkap (DL/CBC)",
        sourceModul: "Lab", sourceRef: "LAB-ORD-0506",
        kategori: "Lab", qty: 3, satuan: "test", hargaSatuan: 95_000, coverage: "Penjamin",
      },
      {
        id: "ic-009", tanggalISO: "2026-05-21T11:00", nama: "Kultur Darah + Sensitivitas",
        sourceModul: "Lab", sourceRef: "LAB-ORD-0507",
        kategori: "Lab", qty: 1, satuan: "test", hargaSatuan: 425_000, coverage: "Penjamin",
      },
      // ── Rad ──
      {
        id: "ic-010", tanggalISO: "2026-05-21T08:30", nama: "Foto Thorax AP (Portable)",
        sourceModul: "Rad", sourceRef: "RAD-ORD-0220",
        kategori: "Rad", qty: 2, satuan: "film", hargaSatuan: 195_000, coverage: "Penjamin",
      },
      // ── Obat & BMHP ──
      {
        id: "ic-011", tanggalISO: "2026-05-21T06:15", nama: "Norepinephrine 4mg/4ml",
        sourceModul: "Farmasi", sourceRef: "RESEP-R-0901-01",
        kategori: "Obat & BMHP", qty: 6, satuan: "amp", hargaSatuan: 145_000, coverage: "Penjamin",
      },
      {
        id: "ic-012", tanggalISO: "2026-05-21T06:15", nama: "Meropenem 1g vial",
        sourceModul: "Farmasi", sourceRef: "RESEP-R-0901-02",
        kategori: "Obat & BMHP", qty: 12, satuan: "vial", hargaSatuan: 285_000, coverage: "Pasien",
        diskonItem: 200_000, alasanDiskon: "Selisih kelas — obat non-formularium",
      },
      // ── Jasa Dokter ──
      {
        id: "ic-013", tanggalISO: "2026-05-21T07:30", nama: "Visite Dokter ICU (4 hari)",
        sourceModul: "RI", sourceRef: "CPPT-V-2026-0521-007",
        kategori: "Jasa Dokter", qty: 4, satuan: "visite", hargaSatuan: 285_000, coverage: "Penjamin",
      },
      {
        id: "ic-014", tanggalISO: "2026-05-23T15:00", nama: "Konsultasi Sp.JP",
        sourceModul: "RI", sourceRef: "KONSUL-K-2026-0523-002",
        kategori: "Jasa Dokter", qty: 1, satuan: "konsul", hargaSatuan: 195_000, coverage: "Penjamin",
      },
    ],
  },
};

/** Resolve detail dari row id; return undefined kalau tidak ada. */
export function getInvoiceDetail(id: string): InvoiceDetail | undefined {
  return INVOICE_DETAIL_MOCK[id];
}
