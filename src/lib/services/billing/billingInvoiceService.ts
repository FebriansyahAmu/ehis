// billingInvoiceService — lifecycle Invoice + Payment (Slice 2a). Charge tetap PROYEKSI order
// (billingProjectionService); Invoice = header persist (lazy-create); total/sisa/status DIHITUNG
// (proyeksi − Σ payment). Bayar = SATU pintu (Kasir) — kasir di-resolve server dari actor (anti-spoof),
// void bukan delete. Nomor INV/KW via BillingCounter. Layered: dipanggil route (gate billing.*).

import { transaction } from "@/lib/db/prisma";
import * as invoiceDal from "@/lib/dal/billing/invoiceDal";
import * as paymentDal from "@/lib/dal/billing/paymentDal";
import * as billingCounterDal from "@/lib/dal/billing/billingCounterDal";
import * as billingReadDal from "@/lib/dal/billing/billingReadDal";
import { billingProjectionService } from "./billingProjectionService";
import { deriveBillingStatus } from "./billingStatus";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { InvoiceEntity } from "@/lib/dal/billing/invoiceDal";
import type { PaymentEntity } from "@/lib/dal/billing/paymentDal";
import type {
  PaymentInput, PaymentDTO, InvoiceStateDTO, RecentPaymentDTO, PaymentSummaryDTO,
  InvoiceAdjustmentInput, BillingRingkasDTO,
} from "@/lib/schemas/billing/payment";

function periodeNow(): { periode: string; yyyy: string; mm: string } {
  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return { periode: `${yyyy}${mm}`, yyyy, mm };
}

const pad5 = (n: number) => String(n).padStart(5, "0");

function ageFrom(tglLahir: Date | null): number {
  if (!tglLahir) return 0;
  const ms = Date.now() - tglLahir.getTime();
  return ms > 0 ? Math.floor(ms / (365.25 * 24 * 3600 * 1000)) : 0;
}

function toPaymentDTO(p: PaymentEntity): PaymentDTO {
  return {
    id: p.id,
    noKwitansi: p.noKwitansi,
    metode: p.metode,
    kategori: p.kategori,
    nominal: p.nominal,
    kasir: p.kasir,
    source: p.source,
    bank: p.bank,
    noRef: p.noRef,
    catatan: p.catatan,
    voided: p.voided,
    voidReason: p.voidReason,
    createdAt: p.createdAt.toISOString(),
  };
}

/** Komposisi state = proyeksi charge + invoice header + payment → total/sisa/status. */
async function buildState(
  kunjunganId: string, invoice: InvoiceEntity | null, payments: PaymentEntity[],
): Promise<InvoiceStateDTO> {
  const [proj, headers] = await Promise.all([
    billingProjectionService.projectByKunjungan(kunjunganId),
    billingReadDal.findKunjunganHeaders([kunjunganId]),
  ]);
  const hdr = headers[0];
  const dibayar = payments.filter((p) => !p.voided).reduce((s, p) => s + p.nominal, 0);
  const diskonInvoice = invoice?.diskonInvoice ?? 0;
  const materai = invoice?.materai ?? 0;
  const ppnPct = invoice?.ppnPct ?? 0;
  const afterDiskon = Math.max(0, proj.subtotal - diskonInvoice);
  const ppn = Math.round((afterDiskon * ppnPct) / 100);
  const grandTotal = afterDiskon + ppn + materai;
  const sisa = Math.max(0, grandTotal - dibayar);

  return {
    invoiceId: invoice?.id ?? null,
    noInvoice: invoice?.noInvoice ?? null,
    kunjunganId: proj.kunjunganId,
    noKunjungan: proj.noKunjungan,
    unit: proj.unit,
    status: deriveBillingStatus(proj.subtotal, grandTotal, dibayar),
    locked: proj.locked,
    selesaiAt: proj.selesaiAt,
    waktuKunjungan: hdr?.waktuKunjungan ? hdr.waktuKunjungan.toISOString() : null,
    pasien: {
      noRM: proj.pasien.noRM,
      nama: proj.pasien.nama,
      gender: hdr?.pasien.gender === "P" ? "P" : "L",
      age: ageFrom(hdr?.pasien.tanggalLahir ?? null),
    },
    penjaminTipe: proj.penjaminTipe,
    dpjp: null,
    kelas: proj.kelas,
    noSep: proj.noSep,
    items: proj.items,
    subtotal: proj.subtotal,
    untariffedCount: proj.untariffedCount,
    diskonInvoice, materai, ppnPct,
    grandTotal, dibayar, sisa,
    payments: payments.map(toPaymentDTO),
    version: invoice?.version ?? 0,
  };
}

/** State invoice untuk 1 kunjungan (tidak membuat invoice). */
async function getInvoiceState(kunjunganId: string): Promise<InvoiceStateDTO> {
  const invoice = await invoiceDal.findByKunjungan(kunjunganId);
  const payments = invoice ? await paymentDal.listByInvoice(invoice.id) : [];
  return buildState(kunjunganId, invoice, payments);
}

/**
 * Ringkas billing 1 kunjungan untuk konsumen KLINIS (widget/gate discharge di rekam medis).
 * Reuse getInvoiceState lalu slim → cukup status + sisa. Route memakai gate klinis
 * (clinical.rekammedis:read), bukan billing.invoice — staf medis boleh lihat sisa tagihan pasiennya.
 */
async function getRingkas(kunjunganId: string): Promise<BillingRingkasDTO> {
  const s = await getInvoiceState(kunjunganId);
  // Breakdown per kategori dari item proyeksi (Σ = subtotal, termasuk Akomodasi RI).
  const map = new Map<string, number>();
  for (const it of s.items) {
    map.set(it.kategori, (map.get(it.kategori) ?? 0) + it.qty * it.hargaSatuan);
  }
  return {
    invoiceId: s.invoiceId,
    status: s.status,
    penjaminTipe: s.penjaminTipe,
    subtotal: s.subtotal,
    grandTotal: s.grandTotal,
    dibayar: s.dibayar,
    sisa: s.sisa,
    untariffedCount: s.untariffedCount,
    byKategori: [...map.entries()].map(([kategori, total]) => ({ kategori, total })),
  };
}

/** Resolve-or-create Invoice (lazy). Aman terhadap race via unique(kunjunganId) → re-find. */
async function resolveInvoice(kunjunganId: string, kasirNama: string, actor: Actor): Promise<InvoiceEntity> {
  const existing = await invoiceDal.findByKunjungan(kunjunganId);
  if (existing) return existing;
  const { periode, yyyy, mm } = periodeNow();
  try {
    return await transaction(async (tx) => {
      const seq = await billingCounterDal.nextSeq("INV", periode, tx);
      const noInvoice = `INV/${yyyy}/${mm}/${pad5(seq)}`;
      return invoiceDal.create(
        { kunjunganId, noInvoice, createdBy: kasirNama, authorUserId: actor.userId }, tx,
      );
    });
  } catch (e) {
    const again = await invoiceDal.findByKunjungan(kunjunganId); // race: dibuat konkuren
    if (again) return again;
    throw e;
  }
}

/** Catat pembayaran (Kasir). Refund → nominal negatif. Resolve-or-create invoice dulu. */
async function recordPayment(kunjunganId: string, input: PaymentInput, actor: Actor): Promise<InvoiceStateDTO> {
  await billingProjectionService.projectByKunjungan(kunjunganId); // guard: kunjungan ada (404 bila tidak)
  const kasir = await resolveActorNama(actor);
  const invoice = await resolveInvoice(kunjunganId, kasir, actor);
  const signed = input.kategori === "Refund" ? -Math.abs(input.nominal) : Math.abs(input.nominal);

  await transaction(async (tx) => {
    const { periode, yyyy, mm } = periodeNow();
    const seq = await billingCounterDal.nextSeq("KW", periode, tx);
    await paymentDal.create({
      invoiceId: invoice.id,
      noKwitansi: `KW/${yyyy}/${mm}/${pad5(seq)}`,
      metode: input.metode,
      kategori: input.kategori,
      nominal: signed,
      kasir,
      authorUserId: actor.userId,
      shiftId: input.shiftId ?? null,
      source: input.source ?? null,
      bank: input.bank ?? null,
      noRef: input.noRef ?? null,
      bukti: input.bukti ?? null,
      catatan: input.catatan ?? null,
    }, tx);
  });

  return getInvoiceState(kunjunganId);
}

/** Set penyesuaian level-invoice (diskon/materai/PPN). Lazy-create invoice; guard subtotal + versi. */
async function setAdjustment(
  kunjunganId: string, input: InvoiceAdjustmentInput, actor: Actor,
): Promise<InvoiceStateDTO> {
  const proj = await billingProjectionService.projectByKunjungan(kunjunganId); // guard 404 + subtotal
  if (input.diskonInvoice > proj.subtotal) {
    throw Errors.validation("Diskon invoice tidak boleh melebihi subtotal tagihan");
  }
  const kasir = await resolveActorNama(actor);
  const invoice = await resolveInvoice(kunjunganId, kasir, actor);
  const count = await invoiceDal.updateAdjustment(
    invoice.id,
    { diskonInvoice: input.diskonInvoice, materai: input.materai, ppnPct: input.ppnPct, catatan: input.alasan ?? null },
    input.expectedVersion,
  );
  if (count === 0) throw Errors.conflictVersion("Invoice telah diubah — muat ulang lalu coba lagi");
  return getInvoiceState(kunjunganId);
}

/** Void 1 pembayaran (bukan delete). Verifikasi payment ∈ invoice kunjungan (anti-IDOR). */
async function voidPayment(
  kunjunganId: string, paymentId: string, alasan: string, actor: Actor,
): Promise<InvoiceStateDTO> {
  const invoice = await invoiceDal.findByKunjungan(kunjunganId);
  if (!invoice) throw Errors.notFound("Invoice tidak ditemukan untuk kunjungan ini");
  const payment = await paymentDal.findById(paymentId);
  if (!payment || payment.invoiceId !== invoice.id) throw Errors.notFound("Pembayaran tidak ditemukan");

  const voidedBy = await resolveActorNama(actor);
  const count = await paymentDal.voidGuarded(paymentId, invoice.id, { voidReason: alasan, voidedBy });
  if (count === 0) throw Errors.validation("Pembayaran sudah dibatalkan sebelumnya");

  return getInvoiceState(kunjunganId);
}

/** Daftar pembayaran 1 kunjungan (read). */
async function listPayments(kunjunganId: string): Promise<PaymentDTO[]> {
  const invoice = await invoiceDal.findByKunjungan(kunjunganId);
  if (!invoice) return [];
  const payments = await paymentDal.listByInvoice(invoice.id);
  return payments.map(toPaymentDTO);
}

/** Pembayaran terbaru (feed Kasir) — non-void, opsional per shift; pasien di-resolve dari header. */
async function listRecentPayments(shiftId: string | undefined, limit: number): Promise<RecentPaymentDTO[]> {
  const rows = await billingReadDal.listRecentPaymentRows(shiftId, limit);
  if (rows.length === 0) return [];
  const headers = await billingReadDal.findKunjunganHeaders([...new Set(rows.map((r) => r.kunjunganId))]);
  const byKid = new Map(headers.map((h) => [h.id, h]));
  return rows.map((r) => {
    const h = byKid.get(r.kunjunganId);
    return {
      id: r.id,
      noKwitansi: r.noKwitansi,
      metode: r.metode,
      kategori: r.kategori,
      nominal: r.nominal,
      kasir: r.kasir,
      source: r.source,
      bank: r.bank,
      noRef: r.noRef,
      catatan: r.catatan,
      voided: r.voided,
      tanggalISO: r.createdAt.toISOString(),
      kunjunganId: r.kunjunganId,
      noInvoice: r.noInvoice,
      noKunjungan: h?.noKunjungan ?? "",
      pasienNama: h?.pasien.nama ?? "—",
      pasienRM: h?.pasien.noRm ?? "",
    };
  });
}

const METODE_KEYS = ["Tunai", "Transfer", "QRIS", "EDC", "Voucher"] as const;

/** Ringkasan pembayaran (Dashboard Kasir) — per shift dan/atau tanggal. */
async function paymentSummary(shiftId: string | undefined, date: string | undefined): Promise<PaymentSummaryDTO> {
  const rows = await billingReadDal.aggregatePaymentSummary({ shiftId, date });
  const byMetode = { Tunai: 0, Transfer: 0, QRIS: 0, EDC: 0, Voucher: 0 };
  let totalMasuk = 0, totalRefund = 0, totalTransaksi = 0;
  for (const r of rows) {
    const masuk = Number(r.masuk), refund = Number(r.refund), trx = Number(r.trx);
    if ((METODE_KEYS as readonly string[]).includes(r.metode)) {
      byMetode[r.metode as (typeof METODE_KEYS)[number]] = masuk;
    }
    totalMasuk += masuk;
    totalRefund += refund;
    totalTransaksi += trx;
  }
  return { byMetode, totalMasuk, totalRefund, totalTransaksi };
}

export const billingInvoiceService = {
  getInvoiceState, getRingkas, recordPayment, setAdjustment, voidPayment, listPayments, listRecentPayments, paymentSummary,
};
