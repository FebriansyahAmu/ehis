// billingInvoiceService — lifecycle Invoice + Payment (Slice 2a). Charge tetap PROYEKSI order
// (billingProjectionService); Invoice = header persist (lazy-create); total/sisa/status DIHITUNG
// (proyeksi − Σ payment). Bayar = SATU pintu (Kasir) — kasir di-resolve server dari actor (anti-spoof),
// void bukan delete. Nomor INV/KW via BillingCounter. Layered: dipanggil route (gate billing.*).

import { transaction, type Tx } from "@/lib/db/prisma";
import * as invoiceDal from "@/lib/dal/billing/invoiceDal";
import * as invoiceItemDal from "@/lib/dal/billing/invoiceItemDal";
import * as auditLogDal from "@/lib/dal/billing/auditLogDal";
import * as paymentDal from "@/lib/dal/billing/paymentDal";
import * as billingCounterDal from "@/lib/dal/billing/billingCounterDal";
import * as billingReadDal from "@/lib/dal/billing/billingReadDal";
import { billingProjectionService } from "./billingProjectionService";
import { deriveBillingStatus } from "./billingStatus";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { Prisma } from "@/generated/prisma/client";
import type { InvoiceEntity } from "@/lib/dal/billing/invoiceDal";
import type { InvoiceItemData, InvoiceItemEntity } from "@/lib/dal/billing/invoiceItemDal";
import type { AuditLogEntity } from "@/lib/dal/billing/auditLogDal";
import type { PaymentEntity } from "@/lib/dal/billing/paymentDal";
import type { BillingChargeDTO } from "@/lib/schemas/billing/projection";
import type { AuditEventDTO, AuditDiffDTO, AuditTargetDTO } from "@/lib/schemas/billing/audit";
import type {
  PaymentInput, PaymentDTO, InvoiceStateDTO, RecentPaymentDTO, PaymentSummaryDTO,
  InvoiceAdjustmentInput, BillingRingkasDTO, InvoiceFinalizeInput, InvoiceReopenInput,
} from "@/lib/schemas/billing/payment";

// Audit trail — jejak immutable (billing.AuditLog). Ditulis dalam tx aksi; aktor server-resolved.
interface AuditMeta { diff?: AuditDiffDTO[]; target?: AuditTargetDTO }
interface AuditEntry {
  action: string; summary: string;
  amount?: number | null; reason?: string | null; noKwitansi?: string | null; meta?: AuditMeta;
}
async function writeAudit(
  tx: Tx | undefined, invoiceId: string, kunjunganId: string,
  actor: Actor, actorNama: string, e: AuditEntry,
): Promise<void> {
  await auditLogDal.create({
    invoiceId, kunjunganId, action: e.action, actorNama,
    actorRole: actor.roles[0] ?? null, actorUserId: actor.userId,
    summary: e.summary, amount: e.amount ?? null, reason: e.reason ?? null,
    noKwitansi: e.noKwitansi ?? null,
    meta: e.meta ? (e.meta as unknown as Prisma.InputJsonValue) : undefined,
  }, tx);
}

function toAuditDTO(r: AuditLogEntity): AuditEventDTO {
  const meta = (r.meta ?? {}) as AuditMeta;
  return {
    id: r.id,
    at: r.createdAt.toISOString(),
    invoiceId: r.invoiceId,
    action: r.action,
    actor: { name: r.actorNama, role: r.actorRole ?? "" },
    summary: r.summary,
    amount: r.amount ?? undefined,
    reason: r.reason ?? undefined,
    noKwitansi: r.noKwitansi ?? undefined,
    target: meta.target,
    diff: meta.diff,
  };
}

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

/** Baris snapshot beku (InvoiceItem) → bentuk charge UI (BillingChargeDTO). */
function toChargeFromSnapshot(it: InvoiceItemEntity): BillingChargeDTO {
  return {
    id: it.id,
    tanggalISO: it.tanggal.toISOString(),
    nama: it.nama,
    sourceModul: it.sourceModul as BillingChargeDTO["sourceModul"],
    sourceRef: it.sourceRef,
    kategori: it.kategori as BillingChargeDTO["kategori"],
    qty: it.qty,
    satuan: it.satuan,
    hargaSatuan: it.hargaSatuan,
    coverage: it.coverage as BillingChargeDTO["coverage"],
    untariffed: it.untariffed,
  };
}

/** Charge proyeksi → data baris snapshot (ditulis saat finalize). */
function toSnapshotData(c: BillingChargeDTO): InvoiceItemData {
  return {
    tanggal: new Date(c.tanggalISO),
    nama: c.nama,
    sourceModul: c.sourceModul,
    sourceRef: c.sourceRef,
    kategori: c.kategori,
    qty: c.qty,
    satuan: c.satuan,
    hargaSatuan: c.hargaSatuan,
    coverage: c.coverage,
    untariffed: !!c.untariffed,
  };
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

  // Charge: Draft = proyeksi HIDUP (proj) · Final = SNAPSHOT beku (InvoiceItem). Header
  // (pasien/unit/penjamin/kelas/SEP) selalu dari proyeksi (identitas tak dibekukan).
  const isFinal = invoice?.status === "Final";
  let items = proj.items;
  let subtotal = proj.subtotal;
  let untariffedCount = proj.untariffedCount;
  if (isFinal && invoice) {
    const snap = await invoiceItemDal.listByInvoice(invoice.id);
    items = snap.map(toChargeFromSnapshot);
    subtotal = snap.reduce((s, i) => s + i.qty * i.hargaSatuan, 0);
    untariffedCount = snap.filter((i) => i.untariffed).length;
  }

  const dibayar = payments.filter((p) => !p.voided).reduce((s, p) => s + p.nominal, 0);
  const diskonInvoice = invoice?.diskonInvoice ?? 0;
  const materai = invoice?.materai ?? 0;
  const ppnPct = invoice?.ppnPct ?? 0;
  const afterDiskon = Math.max(0, subtotal - diskonInvoice);
  const ppn = Math.round((afterDiskon * ppnPct) / 100);
  const grandTotal = afterDiskon + ppn + materai;
  const sisa = Math.max(0, grandTotal - dibayar);

  return {
    invoiceId: invoice?.id ?? null,
    noInvoice: invoice?.noInvoice ?? null,
    kunjunganId: proj.kunjunganId,
    noKunjungan: proj.noKunjungan,
    unit: proj.unit,
    status: deriveBillingStatus(subtotal, grandTotal, dibayar),
    lifecycle: isFinal ? "Final" : "Draft",
    finalizedAt: invoice?.finalizedAt ? invoice.finalizedAt.toISOString() : null,
    finalizedBy: invoice?.finalizedBy ?? null,
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
    items,
    subtotal,
    untariffedCount,
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
    lifecycle: s.lifecycle,
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
      const created = await invoiceDal.create(
        { kunjunganId, noInvoice, createdBy: kasirNama, authorUserId: actor.userId }, tx,
      );
      await writeAudit(tx, created.id, kunjunganId, actor, kasirNama, {
        action: "invoice.create",
        summary: "Draft invoice dibuka",
        meta: { target: { type: "invoice", id: created.id, label: noInvoice } },
      });
      return created;
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
    const noKwitansi = `KW/${yyyy}/${mm}/${pad5(seq)}`;
    await paymentDal.create({
      invoiceId: invoice.id,
      noKwitansi,
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
    const isRefund = input.kategori === "Refund";
    await writeAudit(tx, invoice.id, kunjunganId, actor, kasir, {
      action: isRefund ? "payment.refund" : "payment.add",
      summary: `${input.kategori} via ${input.metode}`,
      amount: Math.abs(input.nominal),
      reason: isRefund ? (input.catatan ?? null) : null,
      noKwitansi,
      meta: { target: { type: "payment" } },
    });
  });

  // Auto-finalisasi saat PELUNASAN: hanya kategori "Pembayaran" yang membuat sisa = 0
  // (tagihan bertarif & masih Draft). Deposit/Refund/cicilan TIDAK memicu. Force = true agar
  // item belum bertarif (Rp0) tak memblokir (pasien sudah lunas). Best-effort: kegagalan
  // auto-finalisasi tak membatalkan pembayaran yang sudah tercatat.
  const afterPay = await getInvoiceState(kunjunganId);
  if (input.kategori === "Pembayaran" && afterPay.lifecycle === "Draft" && afterPay.subtotal > 0 && afterPay.sisa === 0) {
    try {
      return await finalizeInvoice(kunjunganId, { force: true }, actor);
    } catch {
      return afterPay;
    }
  }
  return afterPay;
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
  if (invoice.status === "Final") {
    throw Errors.forbiddenState("Tagihan sudah difinalisasi — batalkan finalisasi untuk menyesuaikan");
  }
  const before = { diskonInvoice: invoice.diskonInvoice, materai: invoice.materai, ppnPct: invoice.ppnPct };

  await transaction(async (tx) => {
    const count = await invoiceDal.updateAdjustment(
      invoice.id,
      { diskonInvoice: input.diskonInvoice, materai: input.materai, ppnPct: input.ppnPct, catatan: input.alasan ?? null },
      input.expectedVersion,
      tx,
    );
    if (count === 0) throw Errors.conflictVersion("Invoice telah diubah — muat ulang lalu coba lagi");

    const diff: AuditDiffDTO[] = [];
    if (before.diskonInvoice !== input.diskonInvoice) diff.push({ field: "Diskon Invoice", before: before.diskonInvoice, after: input.diskonInvoice, isMoney: true });
    if (before.materai !== input.materai) diff.push({ field: "Materai", before: before.materai, after: input.materai, isMoney: true });
    if (before.ppnPct !== input.ppnPct) diff.push({ field: "PPN %", before: before.ppnPct, after: input.ppnPct });
    await writeAudit(tx, invoice.id, kunjunganId, actor, kasir, {
      action: "invoice.diskon",
      summary: "Penyesuaian invoice diperbarui",
      amount: input.diskonInvoice || null,
      reason: input.alasan ?? null,
      meta: diff.length ? { diff } : undefined,
    });
  });

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

  await writeAudit(undefined, invoice.id, kunjunganId, actor, voidedBy, {
    action: "payment.void",
    summary: `Pembayaran ${payment.noKwitansi} dibatalkan`,
    amount: Math.abs(payment.nominal),
    reason: alasan,
    noKwitansi: payment.noKwitansi,
    meta: { target: { type: "payment", id: payment.id } },
  });

  return getInvoiceState(kunjunganId);
}

/**
 * Finalisasi tagihan (Draft → Final). BEKUKAN charge proyeksi → snapshot billing.InvoiceItem
 * dalam 1 tx. Aksi BILLING (gate billing.invoice:update) — TIDAK dipicu discharge klinis.
 * Guard: subtotal > 0; untariffed > 0 ditolak kecuali `force` (peringatan FE). Idempoten via
 * setFinal (where status='Draft'). Payment tetap boleh setelah Final (bayar tagihan beku).
 */
async function finalizeInvoice(
  kunjunganId: string, input: InvoiceFinalizeInput, actor: Actor,
): Promise<InvoiceStateDTO> {
  const proj = await billingProjectionService.projectByKunjungan(kunjunganId); // 404 guard + baris snapshot
  if (proj.subtotal <= 0) throw Errors.validation("Tidak ada tagihan untuk difinalisasi");
  if (proj.untariffedCount > 0 && !input.force) {
    throw Errors.validation(
      `Ada ${proj.untariffedCount} item belum bertarif (Rp0). Konfirmasi untuk tetap memfinalisasi.`,
      { untariffedCount: proj.untariffedCount },
    );
  }
  const nama = await resolveActorNama(actor);
  const invoice = await resolveInvoice(kunjunganId, nama, actor);
  if (invoice.status === "Final") throw Errors.forbiddenState("Tagihan sudah difinalisasi");

  await transaction(async (tx) => {
    const count = await invoiceDal.setFinal(
      invoice.id, { finalizedBy: nama, finalizedByUserId: actor.userId }, input.expectedVersion, tx,
    );
    if (count === 0) throw Errors.conflictVersion("Invoice telah diubah — muat ulang lalu coba lagi");
    await invoiceItemDal.deleteByInvoice(invoice.id, tx); // idempoten (Draft harusnya kosong)
    await invoiceItemDal.createMany(invoice.id, proj.items.map(toSnapshotData), tx);
    await writeAudit(tx, invoice.id, kunjunganId, actor, nama, {
      action: "invoice.finalize",
      summary: `Tagihan difinalisasi · ${proj.items.length} baris dibekukan`,
      amount: proj.subtotal,
      reason: input.force && proj.untariffedCount > 0
        ? `Dipaksa: ${proj.untariffedCount} item belum bertarif`
        : null,
      meta: { diff: [{ field: "Status", before: "Draft", after: "Final" }] },
    });
  });

  return getInvoiceState(kunjunganId);
}

/**
 * Batalkan finalisasi (Final → Draft). Buang snapshot InvoiceItem → charge kembali proyeksi hidup.
 * Gate billing.invoice:update; `alasan` wajib (deliberasi + intent audit). Pembayaran DIPERTAHANKAN.
 */
async function reopenInvoice(
  kunjunganId: string, input: InvoiceReopenInput, actor: Actor,
): Promise<InvoiceStateDTO> {
  const invoice = await invoiceDal.findByKunjungan(kunjunganId);
  if (!invoice) throw Errors.notFound("Invoice tidak ditemukan untuk kunjungan ini");
  if (invoice.status !== "Final") throw Errors.forbiddenState("Tagihan belum difinalisasi");
  const nama = await resolveActorNama(actor); // pastikan actor valid + stempel audit

  await transaction(async (tx) => {
    const count = await invoiceDal.setDraft(invoice.id, input.expectedVersion, tx);
    if (count === 0) throw Errors.conflictVersion("Invoice telah diubah — muat ulang lalu coba lagi");
    await invoiceItemDal.deleteByInvoice(invoice.id, tx);
    await writeAudit(tx, invoice.id, kunjunganId, actor, nama, {
      action: "invoice.reopen",
      summary: "Finalisasi dibatalkan · charge kembali proyeksi",
      reason: input.alasan,
      meta: { diff: [{ field: "Status", before: "Final", after: "Draft" }] },
    });
  });

  return getInvoiceState(kunjunganId);
}

/** Riwayat audit 1 kunjungan (read) — timeline mutasi finansial invoice. */
async function listAudit(kunjunganId: string): Promise<AuditEventDTO[]> {
  const rows = await auditLogDal.listByKunjungan(kunjunganId);
  return rows.map(toAuditDTO);
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
  getInvoiceState, getRingkas, recordPayment, setAdjustment, finalizeInvoice, reopenInvoice,
  voidPayment, listPayments, listAudit, listRecentPayments, paymentSummary,
};
