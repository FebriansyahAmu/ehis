// Adapter: proyeksi billing (BillingKunjunganRowDTO) → TagihanRow (bentuk board Tagihan yang ADA).
// Board tampilannya TIDAK berubah — hanya sumber datanya kini nyata (order klinis + pembayaran DB).
// Status & dibayar NYATA (Slice 2b): billingStatus (Draft/Belum Lunas/Lunas Sebagian/Lunas) + Σ
// payment non-void, diturunkan server (billingProjectionService.listKunjunganBilling).

import type { BillingKunjunganRowDTO } from "@/lib/api/billing/projection";
import type { TagihanRow } from "./tagihanBoardLogic";
import type { UnitFilter, KelasFilter, StatusFilter } from "./tagihanShared";
import type { PenjaminTipeRow } from "@/lib/billing/tagihanBoardMock";

const UNIT_MAP: Record<string, UnitFilter> = { IGD: "IGD", RawatInap: "RI", RawatJalan: "RJ" };
const KELAS_MAP: Record<string, KelasFilter> = {
  VIP: "VIP", Kelas_1: "K1", Kelas_2: "K2", Kelas_3: "K3", ICU: "ICU", HCU: "HCU", Isolasi: "K3",
};
const PENJAMIN_MAP: Record<string, PenjaminTipeRow> = {
  BPJS_Non_PBI: "bpjs", BPJS_PBI: "bpjs", Umum: "umum", Asuransi: "asuransi", Jamkesda: "jamkesda",
};
const PENJAMIN_NAMA: Record<string, string> = {
  BPJS_Non_PBI: "BPJS Non-PBI", BPJS_PBI: "BPJS PBI", Umum: "Umum / Pribadi", Asuransi: "Asuransi", Jamkesda: "Jamkesda",
};

// billingStatus server = subset StatusFilter yang sama persis (Draft/Belum Lunas/Lunas Sebagian/Lunas).
const STATUS_MAP: Record<string, StatusFilter> = {
  "Draft": "Draft",
  "Belum Lunas": "Belum Lunas",
  "Lunas Sebagian": "Lunas Sebagian",
  "Lunas": "Lunas",
};

export function mapProjectionRow(d: BillingKunjunganRowDTO): TagihanRow {
  return {
    id: d.kunjunganId,
    noTagihan: d.noKunjungan,
    tanggalISO: d.waktuKunjungan,
    noKunjungan: d.noKunjungan,
    pasien: { nama: d.pasien.nama, noRM: d.pasien.noRM, gender: d.pasien.gender, age: d.pasien.age },
    unit: UNIT_MAP[d.unit] ?? "RI",
    kelas: d.kelas ? (KELAS_MAP[d.kelas] ?? "RJ") : "RJ",
    penjamin: { tipe: PENJAMIN_MAP[d.penjaminTipe] ?? "umum", nama: PENJAMIN_NAMA[d.penjaminTipe] ?? d.penjaminTipe },
    dpjp: "",
    total: d.total,
    dibayar: d.dibayar,
    status: STATUS_MAP[d.billingStatus] ?? "Draft",
  };
}
