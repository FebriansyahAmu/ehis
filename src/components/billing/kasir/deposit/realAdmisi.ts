// Adapter: proyeksi billing (BillingKunjunganRowDTO) → PasienAdmisi (bentuk Deposit Awal yang ADA).
// Deposit Awal desainnya TIDAK berubah — hanya sumber datanya kini nyata (kunjungan RI + pembayaran DB).
// Kandidat = kunjungan Rawat Inap yang BELUM ada pembayaran (dibayar = 0) → "admisi pending, belum deposit".
// Setelah deposit pertama tercatat, dibayar > 0 → pasien lepas dari daftar (refetch page-level).

import type { BillingKunjunganRowDTO } from "@/lib/api/billing/projection";
import type { PasienAdmisi } from "@/lib/billing/depositMock";
import type { KelasFilter } from "@/components/billing/tagihan/tagihanShared";
import type { PenjaminTipeRow } from "@/lib/billing/tagihanBoardMock";

const KELAS_MAP: Record<string, KelasFilter> = {
  VIP: "VIP", Kelas_1: "K1", Kelas_2: "K2", Kelas_3: "K3", ICU: "ICU", HCU: "HCU", Isolasi: "K3",
};
const PENJAMIN_MAP: Record<string, PenjaminTipeRow> = {
  BPJS_Non_PBI: "bpjs", BPJS_PBI: "bpjs", Umum: "umum", Asuransi: "asuransi", Jamkesda: "jamkesda",
};
const PENJAMIN_NAMA: Record<string, string> = {
  BPJS_Non_PBI: "BPJS Non-PBI", BPJS_PBI: "BPJS PBI", Umum: "Umum / Pribadi", Asuransi: "Asuransi", Jamkesda: "Jamkesda",
};

/** Kandidat deposit awal = kunjungan Rawat Inap yang belum menerima pembayaran apa pun. */
export function isDepositPending(d: BillingKunjunganRowDTO): boolean {
  return d.unit === "RawatInap" && d.dibayar <= 0;
}

/** BillingKunjunganRowDTO → PasienAdmisi (kelas/penjamin dipetakan; kategori/urgensi default). */
export function mapBillingRowToAdmisi(d: BillingKunjunganRowDTO): PasienAdmisi {
  return {
    id: d.kunjunganId,
    noKunjungan: d.noKunjungan,
    pasien: {
      nama: d.pasien.nama,
      noRM: d.pasien.noRM,
      gender: d.pasien.gender,
      age: d.pasien.age,
    },
    unit: "RI",
    kelas: d.kelas ? (KELAS_MAP[d.kelas] ?? "K3") : "K3",
    penjamin: {
      tipe: PENJAMIN_MAP[d.penjaminTipe] ?? "umum",
      nama: PENJAMIN_NAMA[d.penjaminTipe] ?? d.penjaminTipe,
    },
    dpjp: "",                    // proyeksi billing tak membawa DPJP → dikosongkan (row menyembunyikan bila kosong)
    kategori: "RI Baru",         // default (proyeksi billing tak punya kategori admisi)
    urgensi: "Rutin",            // default (tanpa penanda urgensi)
    rencanaAdmisi: d.waktuKunjungan,
  };
}

/** Filter + map baris proyeksi billing → daftar pasien admisi pending deposit. */
export function toPendingAdmisi(rows: BillingKunjunganRowDTO[]): PasienAdmisi[] {
  return rows.filter(isDepositPending).map(mapBillingRowToAdmisi);
}
