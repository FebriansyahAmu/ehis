// Pengembalian Obat Pasien Pulang · PMK 72/2016 Ps. 20

export type KondisiObat     = "Baik" | "Rusak" | "Kadaluarsa";
export type AlasanKembalian = "Pasien Pulang" | "Ganti Terapi" | "Obat Berlebih" | "Reaksi Obat" | "Lainnya";
export type StatusPengembalian = "Draft" | "Diverifikasi" | "Selesai";

export interface ItemKembalian {
  id:                string;
  resepItemId:       string;
  namaObat:          string;
  satuan:            string;
  isHAM:             boolean;
  isNarPsi:          boolean;
  lotNo?:            string;
  expiredDate?:      string;
  jumlahDispensasi:  number;
  jumlahDiberikan:   number;
  jumlahKembalikan:  number;
  kondisi:           KondisiObat;
  alasan:            AlasanKembalian;
}

export interface PengembalianRecord {
  id:                string;
  noRM:              string;
  tanggal:           string;
  noResepRef:        string;
  perawatPenyerah:   string;
  apotekerPenerima:  string;
  items:             ItemKembalian[];
  catatan?:          string;
  status:            StatusPengembalian;
  verifiedAt?:       string;
}

// ── Config ────────────────────────────────────────────────

export const ALASAN_OPTIONS: AlasanKembalian[] = [
  "Pasien Pulang", "Ganti Terapi", "Obat Berlebih", "Reaksi Obat", "Lainnya",
];

export const KONDISI_CFG: Record<KondisiObat, { badge: string; dot: string }> = {
  Baik:       { badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-400" },
  Rusak:      { badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",          dot: "bg-rose-500"    },
  Kadaluarsa: { badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-400"   },
};

export const STATUS_PENGEMBALIAN_CFG: Record<StatusPengembalian, { label: string; badge: string }> = {
  Draft:        { label: "Draft",        badge: "bg-slate-100 text-slate-600"                      },
  Diverifikasi: { label: "Diverifikasi", badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200"       },
  Selesai:      { label: "Selesai",      badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
};

// ── Mock data ─────────────────────────────────────────────

export const PENGEMBALIAN_MOCK: Record<string, PengembalianRecord[]> = {
  "RM-2025-003": [
    {
      id: "pkb-1", noRM: "RM-2025-003",
      tanggal: "2026-05-18", noResepRef: "RES/2026/05/0510",
      perawatPenyerah: "Ns. Ratna", apotekerPenerima: "Apt. Rina S.Farm.",
      status: "Diverifikasi", verifiedAt: "2026-05-18T10:30:00",
      catatan: "Obat dalam kondisi baik, kemasan asli. Bisoprolol sisa blister 2 tablet.",
      items: [
        {
          id: "pki-1", resepItemId: "rr-3",
          namaObat: "Furosemide 40mg Injeksi", satuan: "Ampul",
          isHAM: false, isNarPsi: false,
          lotNo: "FUR-2024-B12", expiredDate: "2027-03",
          jumlahDispensasi: 10, jumlahDiberikan: 8, jumlahKembalikan: 2,
          kondisi: "Baik", alasan: "Pasien Pulang",
        },
        {
          id: "pki-2", resepItemId: "rr-4",
          namaObat: "Bisoprolol 2.5mg Tab", satuan: "Tablet",
          isHAM: false, isNarPsi: false,
          lotNo: "BIS-2024-A05", expiredDate: "2026-12",
          jumlahDispensasi: 7, jumlahDiberikan: 5, jumlahKembalikan: 2,
          kondisi: "Baik", alasan: "Pasien Pulang",
        },
        {
          id: "pki-3", resepItemId: "rr-5",
          namaObat: "Ramipril 5mg Tab", satuan: "Tablet",
          isHAM: false, isNarPsi: false,
          lotNo: "RAM-2024-C07", expiredDate: "2027-06",
          jumlahDispensasi: 7, jumlahDiberikan: 5, jumlahKembalikan: 2,
          kondisi: "Baik", alasan: "Pasien Pulang",
        },
        {
          id: "pki-4", resepItemId: "rr-6",
          namaObat: "Spironolakton 25mg Tab", satuan: "Tablet",
          isHAM: false, isNarPsi: false,
          lotNo: "SPI-2025-A02", expiredDate: "2027-01",
          jumlahDispensasi: 7, jumlahDiberikan: 5, jumlahKembalikan: 2,
          kondisi: "Baik", alasan: "Pasien Pulang",
        },
      ],
    },
  ],
  "RM-2025-007": [
    {
      id: "pkb-2", noRM: "RM-2025-007",
      tanggal: "2025-05-10", noResepRef: "RES/2025/05/0518",
      perawatPenyerah: "Ns. Dewi ICU", apotekerPenerima: "Apt. Sari S.Farm.",
      status: "Selesai", verifiedAt: "2025-05-10T14:00:00",
      catatan: "Vancomycin dihentikan per rekomendasi DRP-3. Sisa vial dikembalikan dalam kondisi baik sebelum kadaluarsa.",
      items: [
        {
          id: "pki-5", resepItemId: "icu-rr-6",
          namaObat: "Meropenem 1g Injeksi", satuan: "Vial",
          isHAM: false, isNarPsi: false,
          lotNo: "MER-2024-D03", expiredDate: "2026-08",
          jumlahDispensasi: 6, jumlahDiberikan: 4, jumlahKembalikan: 2,
          kondisi: "Baik", alasan: "Pasien Pulang",
        },
        {
          id: "pki-6", resepItemId: "icu-rr-7",
          namaObat: "Vancomycin 1g Injeksi", satuan: "Vial",
          isHAM: true, isNarPsi: false,
          lotNo: "VAN-2024-E11", expiredDate: "2026-11",
          jumlahDispensasi: 6, jumlahDiberikan: 2, jumlahKembalikan: 4,
          kondisi: "Baik", alasan: "Ganti Terapi",
        },
      ],
    },
  ],
};

export function getPengembalianForRM(noRM: string): PengembalianRecord[] {
  return PENGEMBALIAN_MOCK[noRM] ?? [];
}

export function totalKembalian(record: PengembalianRecord) {
  return record.items.reduce((s, i) => s + i.jumlahKembalikan, 0);
}
