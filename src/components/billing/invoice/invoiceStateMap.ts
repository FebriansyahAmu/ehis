// Mapper bersama: InvoiceStateDTO (nyata, dari getInvoiceState) → InvoiceDetail (bentuk komponen
// desain billing). Dipakai KunjunganInvoiceDetail (detail) + Kasir Quick Bayar (kwitansi + charge
// summary) agar bentuk data konsisten & tanpa duplikasi. Read-only: charge = proyeksi (tanpa
// diskon/void item). Status/kelas/penjamin dipetakan ke vocab board.

import type { InvoiceStateDTO } from "@/lib/api/billing/invoice";
import type { UnitFilter, KelasFilter, StatusFilter } from "../tagihan/tagihanShared";
import type { PenjaminTipeRow } from "@/lib/billing/tagihanBoardMock";
import type {
  InvoiceDetail, ChargeItem, PaymentRecord, TimelineEntry,
  SourceModul, KategoriCharge, Coverage, MetodeBayar, PaymentKategori, PaymentSource,
} from "./invoiceShared";

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
const STATUS_MAP: Record<string, StatusFilter> = {
  "Draft": "Draft", "Belum Lunas": "Belum Lunas", "Lunas Sebagian": "Lunas Sebagian", "Lunas": "Lunas",
};

/** InvoiceStateDTO (nyata) → InvoiceDetail (bentuk komponen desain). */
export function invoiceStateToDetail(s: InvoiceStateDTO): InvoiceDetail {
  const items: ChargeItem[] = s.items.map((it) => ({
    id: it.id,
    tanggalISO: it.tanggalISO,
    nama: it.nama,
    sourceModul: it.sourceModul as SourceModul,
    sourceRef: it.sourceRef,
    kategori: it.kategori as KategoriCharge,
    qty: it.qty,
    satuan: it.satuan,
    hargaSatuan: it.hargaSatuan,
    coverage: it.coverage as Coverage,
  }));

  const payments: PaymentRecord[] = s.payments.map((p) => ({
    id: p.id,
    tanggalISO: p.createdAt,
    metode: p.metode as MetodeBayar,
    nominal: p.nominal,
    kasir: p.kasir,
    noKwitansi: p.noKwitansi,
    kategori: p.kategori as PaymentKategori,
    source: (p.source as PaymentSource | null) ?? undefined,
    catatan: p.catatan ?? undefined,
    bank: p.bank ?? undefined,
    noRef: p.noRef ?? undefined,
    voided: p.voided,
    voidReason: p.voidReason ?? undefined,
  }));

  const isUmum = s.penjaminTipe === "Umum";
  const isLunas = s.status === "Lunas";
  const timeline: TimelineEntry[] = [
    { step: "Draft", label: "Tagihan", status: "done" },
    {
      step: "Final",
      label: s.locked ? "Rekam Terkunci" : "Rawat Berjalan",
      status: s.locked ? "done" : "current",
      at: s.selesaiAt ?? undefined,
    },
    ...(isUmum ? [] : [{ step: "Klaim" as const, label: "Klaim Penjamin", status: "pending" as const }]),
    {
      step: "Selesai",
      label: isLunas ? "Lunas" : "Pelunasan",
      status: isLunas ? "done" : s.dibayar > 0 ? "current" : "pending",
    },
  ];

  return {
    id: s.kunjunganId,
    noTagihan: s.noInvoice ?? s.noKunjungan,
    tanggalISO: s.waktuKunjungan ?? items[0]?.tanggalISO ?? s.selesaiAt ?? new Date().toISOString(),
    noKunjungan: s.noKunjungan,
    pasien: {
      nama: s.pasien.nama,
      noRM: s.pasien.noRM,
      gender: s.pasien.gender,
      age: s.pasien.age,
      verified: false,
    },
    unit: UNIT_MAP[s.unit] ?? "RI",
    kelas: s.kelas ? (KELAS_MAP[s.kelas] ?? "RJ") : "RJ",
    penjamin: {
      tipe: PENJAMIN_MAP[s.penjaminTipe] ?? "umum",
      nama: PENJAMIN_NAMA[s.penjaminTipe] ?? s.penjaminTipe,
      noSEP: s.noSep ?? undefined,
    },
    dpjp: s.dpjp ?? "—",
    status: STATUS_MAP[s.status] ?? "Draft",
    items,
    diskonInvoice: s.diskonInvoice,
    ppnPct: s.ppnPct,
    materai: s.materai,
    dibayar: s.dibayar,
    payments,
    timeline,
  };
}
