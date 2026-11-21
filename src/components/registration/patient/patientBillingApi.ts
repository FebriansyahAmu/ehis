// Adapter: ringkasan tagihan per kunjungan (BillingKunjunganRowDTO, proyeksi billing NYATA) →
// BillingRecord (bentuk kartu Tagihan dashboard pasien). Rincian dikosongkan — detail = modul
// Billing (kartu men-deep-link ke /ehis-billing/tagihan/kunjungan/[kid]).

import type { BillingRecord, UnitKunjungan, StatusTagihan } from "@/lib/data";
import type { BillingKunjunganRowDTO } from "@/lib/api/billing/projection";
import { localYmd } from "@/lib/time/localTime";

const UNIT_MAP: Record<string, UnitKunjungan> = {
  IGD: "IGD",
  RawatJalan: "Rawat Jalan",
  RawatInap: "Rawat Inap",
};

const PENJAMIN_LABEL: Record<string, string> = {
  BPJS_Non_PBI: "BPJS Non-PBI",
  BPJS_PBI: "BPJS PBI",
  Umum: "Umum",
  Asuransi: "Asuransi",
  Jamkesda: "Jamkesda",
};

/** billingStatus (Draft|Belum Lunas|Lunas Sebagian|Lunas) → StatusTagihan kartu. */
function toStatusTagihan(billingStatus: string): StatusTagihan {
  if (billingStatus === "Lunas") return "Lunas";
  if (billingStatus === "Lunas Sebagian") return "Lunas Sebagian";
  return "Belum Lunas"; // "Draft" (tak ada charge) & "Belum Lunas" → belum lunas
}

export function dtoToBillingRecord(d: BillingKunjunganRowDTO): BillingRecord {
  return {
    id: d.kunjunganId,            // = kunjunganId → dipakai kartu utk deep-link detail Billing
    noTagihan: d.noKunjungan,
    tanggal: localYmd(d.waktuKunjungan),
    noKunjungan: d.noKunjungan,
    unit: UNIT_MAP[d.unit] ?? "Rawat Jalan",
    rincian: [],                  // detail rincian = ranah modul Billing
    totalBiaya: d.total,
    dibayar: d.dibayar,
    status: toStatusTagihan(d.billingStatus),
    penjamin: PENJAMIN_LABEL[d.penjaminTipe] ?? d.penjaminTipe,
  };
}
