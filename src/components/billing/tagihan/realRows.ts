// Adapter: proyeksi billing (BillingKunjunganRowDTO) → TagihanRow (bentuk board Tagihan yang ADA).
// Board tampilannya TIDAK berubah — hanya sumber datanya kini nyata (order klinis, bukan mock).
// Status = derivasi proyeksi (Slice 1, belum ada pembayaran): total 0 → Draft · terkunci → Belum
// Lunas · selain itu Draft. dibayar = 0 (pembayaran nyata menyusul Slice 2 di tab Pembayaran).

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

export function mapProjectionRow(d: BillingKunjunganRowDTO): TagihanRow {
  const status: StatusFilter = d.total <= 0 ? "Draft" : d.locked ? "Belum Lunas" : "Draft";
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
    dibayar: 0,
    status,
  };
}
