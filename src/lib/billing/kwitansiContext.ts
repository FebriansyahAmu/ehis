/**
 * Kwitansi Context (BL3.2 + BL3.3) — bangun `InvoiceDetail` synthetic untuk
 * `KwitansiPrintModal` saat kita hanya punya `ShiftPaymentLog` (no full invoice
 * loaded, mis. dari Recent Feed atau Deposit baru).
 *
 * 2 sumber:
 *   - `fromExistingInvoice(log)` — `invoiceId` ada di `INVOICE_DETAIL_MOCK`
 *   - `fromDepositInput(pasien, log)` — invoice masih draft (deposit awal)
 *
 * Tujuan: KwitansiPrintModal hanya butuh `{detail, payment}` — adapter ini
 * memastikan caller (QuickBayarPanel, DepositAwalPanel, RecentPaymentsFeed)
 * tidak duplikasi logic synthesize header.
 *
 * Saat backend ready (B2.3): swap `fromDepositInput` dengan response invoice
 * dari `prisma.invoice.create({...})` — adapter ini bisa dihapus karena
 * Quick Bayar tinggal `prisma.invoice.findUnique` by id.
 */

import { INVOICE_DETAIL_MOCK } from "@/components/billing/invoice/invoiceMock";
import type {
  InvoiceDetail, PaymentRecord,
} from "@/components/billing/invoice/invoiceShared";
import type { ShiftPaymentLog } from "@/lib/billing/shiftPaymentsMock";
import type { PasienAdmisi } from "@/lib/billing/depositMock";

export interface KwitansiContext {
  detail: InvoiceDetail;
  payment: PaymentRecord;
}

// ── ShiftPaymentLog → PaymentRecord (strip extension) ──

function toPaymentRecord(log: ShiftPaymentLog): PaymentRecord {
  // ShiftPaymentLog extends PaymentRecord dengan invoice metadata + draftDetail —
  // strip 5 field tambahan agar tipe match PaymentRecord pure.
  const {
    invoiceId: _id, invoiceNo: _no, pasienNama: _n, pasienRM: _rm,
    draftDetail: _dd,
    ...rest
  } = log;
  void _id; void _no; void _n; void _rm; void _dd;
  return rest;
}

// ── Variant A: invoice sudah ada di INVOICE_DETAIL_MOCK ──

/**
 * Build kwitansi context dari `ShiftPaymentLog` yang refer ke invoice existing.
 * Return null jika `invoiceId` tidak ketemu di mock (mis. INV-DRAFT-* dari deposit).
 */
export function fromExistingInvoice(log: ShiftPaymentLog): KwitansiContext | null {
  const detail = INVOICE_DETAIL_MOCK[log.invoiceId];
  if (!detail) return null;
  return { detail, payment: toPaymentRecord(log) };
}

// ── Variant B: invoice draft (deposit awal) ──

/**
 * Synthesize `InvoiceDetail` dari `PasienAdmisi` + `ShiftPaymentLog`.
 * Dipakai saat kasir buka deposit awal — invoice belum exist di DB
 * (masih `INV-DRAFT-<pasienId>`), jadi UI kwitansi build header sendiri.
 *
 * Backend B2.3: setelah `depositMutation`, response berisi `invoice` row →
 * swap call ini dengan `prisma.invoice.findUnique({ where: { id }})`.
 */
export function fromDepositInput(
  pasien: PasienAdmisi,
  log: ShiftPaymentLog,
): KwitansiContext {
  const payment = toPaymentRecord(log);
  const detail: InvoiceDetail = {
    id: log.invoiceId,
    noTagihan: log.invoiceNo,
    tanggalISO: log.tanggalISO,
    noKunjungan: pasien.noKunjungan,
    pasien: {
      nama: pasien.pasien.nama,
      noRM: pasien.pasien.noRM,
      gender: pasien.pasien.gender,
      age: pasien.pasien.age,
      verified: true,
    },
    unit: pasien.unit,
    kelas: pasien.kelas,
    penjamin: {
      tipe: pasien.penjamin.tipe,
      nama: pasien.penjamin.nama,
    },
    dpjp: pasien.dpjp,
    status: "Draft",
    items: [],
    diskonInvoice: 0,
    ppnPct: 0,
    materai: 0,
    dibayar: payment.nominal,
    payments: [payment],
    timeline: [
      { step: "Draft",   label: "Dibuka via deposit awal",   status: "current", at: payment.tanggalISO, by: payment.kasir },
      { step: "Final",   label: "Difinalisasi saat pulang",  status: "pending" },
      { step: "Klaim",   label: "Submit klaim (jika BPJS)",  status: "pending" },
      { step: "Selesai", label: "Lunas",                     status: "pending" },
    ],
  };
  return { detail, payment };
}

// ── Convenience untuk Quick Bayar & RecentFeed ─────────

/**
 * Resolusi otomatis dari log:
 *   1. Jika log punya `draftDetail` (deposit awal yang baru di-buka) → pakai itu.
 *   2. Else lookup ke `INVOICE_DETAIL_MOCK` via `invoiceId`.
 *   3. Else return null — caller tampilkan toast "detail tidak tersedia".
 */
export function fromShiftLog(log: ShiftPaymentLog): KwitansiContext | null {
  if (log.draftDetail) {
    return { detail: log.draftDetail, payment: toPaymentRecord(log) };
  }
  return fromExistingInvoice(log);
}
