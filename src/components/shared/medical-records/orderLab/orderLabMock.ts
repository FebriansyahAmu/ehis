// Mock order aktif + riwayat lab per noRM — display-only (history viewer tab Order Lab).
// Diekstrak dari OrderLabTab.tsx. Kode item = legacy mock (tak harus match katalog DB; tampilan saja).
// Source-of-truth order asli → ORDERS_MOCK / DB (saat backend order lab siap).

import type { ActiveOrder, RiwayatOrder } from "./orderLabShared";

export const ACTIVE_ORDERS_MOCK: Record<string, ActiveOrder[]> = {
  "RM-2025-005": [
    {
      id: "ao-1",
      noOrder: "LAB/2026/04/0312",
      tanggal: "14 April 2026",
      jam: "10:35",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Diproses",
      catatan: "CITO — Troponin urgent",
      items: [
        { id: "oi-1", kode: "TROP", nama: "Troponin I", kategori: "Kimia Klinik", waktuTunggu: "30 mnt" },
        { id: "oi-2", kode: "DR", nama: "Darah Rutin (Hematologi Lengkap)", kategori: "Hematologi", waktuTunggu: "1 jam" },
        { id: "oi-3", kode: "ELE", nama: "Elektrolit (Na / K / Cl)", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
      ],
    },
  ],
  "RM-2025-012": [
    {
      id: "ao-2",
      noOrder: "LAB/2026/04/0305",
      tanggal: "14 April 2026",
      jam: "11:08",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Menunggu",
      items: [
        { id: "oi-4", kode: "GDS", nama: "Glukosa Darah Sewaktu (GDS)", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
      ],
    },
  ],
  "RM-2025-003": [
    {
      id: "ao-ri-1",
      noOrder: "LAB/2026/05/0421",
      tanggal: "3 Mei 2025",
      jam: "08:20",
      dokter: "dr. Dewi Kusuma, Sp.JP",
      status: "Selesai",
      catatan: "Monitoring GJK — PCT serial",
      items: [
        { id: "oi-ri-1", kode: "PCT", nama: "Prokalsitonin (PCT)", kategori: "Kimia Klinik", waktuTunggu: "2 jam" },
        { id: "oi-ri-2", kode: "UR", nama: "Ureum", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
        { id: "oi-ri-3", kode: "CR", nama: "Kreatinin", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
      ],
    },
  ],
};

export const RIWAYAT_LAB_MOCK: Record<string, RiwayatOrder[]> = {
  "RM-2025-005": [
    {
      id: "rl-1",
      noOrder: "LAB/2026/04/0189",
      tanggal: "10 April 2026",
      jam: "08:15",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      unit: "Poli Jantung",
      status: "Selesai",
      items: [
        { id: "ri-1", kode: "KOL", nama: "Kolesterol Total", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
        { id: "ri-2", kode: "HDL", nama: "HDL Kolesterol", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
        { id: "ri-4", kode: "TG", nama: "Trigliserida", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
      ],
      hasil: [
        { nama: "Kolesterol Total", nilai: "248", satuan: "mg/dL", nilaiNormal: "< 200", status: "Abnormal Tinggi" },
        { nama: "HDL Kolesterol", nilai: "38", satuan: "mg/dL", nilaiNormal: "> 40", status: "Abnormal Rendah" },
        { nama: "Trigliserida", nilai: "195", satuan: "mg/dL", nilaiNormal: "< 150", status: "Abnormal Tinggi" },
      ],
    },
    {
      id: "rl-2",
      noOrder: "LAB/2026/02/0091",
      tanggal: "12 Februari 2026",
      jam: "10:20",
      dokter: "dr. Anisa Putri, Sp.PD",
      unit: "IGD",
      status: "Selesai",
      items: [
        { id: "ri-5", kode: "DR", nama: "Darah Rutin (Hematologi Lengkap)", kategori: "Hematologi", waktuTunggu: "1 jam" },
        { id: "ri-6", kode: "TROP", nama: "Troponin I", kategori: "Kimia Klinik", waktuTunggu: "30 mnt" },
        { id: "ri-7", kode: "PT", nama: "Protrombin Time (PT/INR)", kategori: "Koagulasi", waktuTunggu: "1 jam" },
        { id: "ri-8", kode: "APTT", nama: "aPTT", kategori: "Koagulasi", waktuTunggu: "1 jam" },
      ],
      hasil: [
        { nama: "Hemoglobin", nilai: "12.8", satuan: "g/dL", nilaiNormal: "13.5–17.5", status: "Abnormal Rendah" },
        { nama: "Leukosit", nilai: "14.2", satuan: "10³/µL", nilaiNormal: "4.5–11.0", status: "Abnormal Tinggi" },
        { nama: "Trombosit", nilai: "215", satuan: "10³/µL", nilaiNormal: "150–400", status: "Normal" },
        { nama: "Troponin I", nilai: "2.8", satuan: "ng/mL", nilaiNormal: "< 0.04", status: "Kritis" },
        { nama: "PT", nilai: "14.2", satuan: "detik", nilaiNormal: "11.0–13.5", status: "Abnormal Tinggi" },
        { nama: "APTT", nilai: "38", satuan: "detik", nilaiNormal: "25–35", status: "Abnormal Tinggi" },
      ],
    },
  ],
  "RM-2025-012": [
    {
      id: "rl-3",
      noOrder: "LAB/2026/04/0155",
      tanggal: "8 April 2026",
      jam: "09:00",
      dokter: "dr. Dewi Kusuma, Sp.JP",
      unit: "Rawat Jalan",
      status: "Selesai",
      items: [
        { id: "ri-10", kode: "GDS", nama: "Glukosa Darah Sewaktu (GDS)", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
        { id: "ri-11", kode: "HBA1C", nama: "HbA1c", kategori: "Kimia Klinik", waktuTunggu: "2 jam" },
      ],
      hasil: [
        { nama: "GDS", nilai: "320", satuan: "mg/dL", nilaiNormal: "70–140", status: "Kritis" },
        { nama: "HbA1c", nilai: "9.2", satuan: "%", nilaiNormal: "< 5.7", status: "Kritis" },
      ],
    },
  ],
  "RM-2025-003": [
    {
      id: "rl-ri-1",
      noOrder: "LAB/2026/04/0380",
      tanggal: "28 April 2026",
      jam: "07:45",
      dokter: "dr. Dewi Kusuma, Sp.JP",
      unit: "Rawat Inap",
      status: "Selesai",
      items: [
        { id: "ri-ri-1", kode: "DR", nama: "Darah Rutin (Hematologi Lengkap)", kategori: "Hematologi", waktuTunggu: "1 jam" },
        { id: "ri-ri-2", kode: "PCT", nama: "Prokalsitonin (PCT)", kategori: "Kimia Klinik", waktuTunggu: "2 jam" },
        { id: "ri-ri-3", kode: "ELE", nama: "Elektrolit (Na / K / Cl)", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
      ],
      hasil: [
        { nama: "Hemoglobin", nilai: "10.2", satuan: "g/dL", nilaiNormal: "13.5–17.5", status: "Abnormal Rendah" },
        { nama: "Leukosit", nilai: "9.8", satuan: "10³/µL", nilaiNormal: "4.5–11.0", status: "Normal" },
        { nama: "Prokalsitonin", nilai: "4.2", satuan: "ng/mL", nilaiNormal: "< 0.5", status: "Kritis" },
        { nama: "Natrium", nilai: "131", satuan: "mEq/L", nilaiNormal: "136–145", status: "Abnormal Rendah" },
        { nama: "Kalium", nilai: "3.2", satuan: "mEq/L", nilaiNormal: "3.5–5.0", status: "Abnormal Rendah" },
      ],
    },
  ],
};
