/**
 * Charge Ingest — high-level orchestrator yang gabung adapter + store.
 *
 * Setiap fungsi ingest:
 *   1. Resolve target invoiceId via `findActiveInvoiceForPasien(noRM)` (jika
 *      caller tidak pass `invoiceId` eksplisit)
 *   2. Pull penjamin + kelas dari invoice detail
 *   3. Konversi event → ChargeItem[] via `sourceAdapter.*`
 *   4. Append ke store via `billingStore.appendCharges` (dedupe by sourceRef)
 *   5. Return `IngestResult` agar caller bisa log/notif
 *
 * Idempotent: re-call dengan event sama → 0 added, N skipped.
 *
 * Caller tipikal: action handler di pane klinis (handleValidate, handleSerahkan,
 * dst) panggil 1 line: `ingestLabOrder(order)`.
 */

import type { LabOrder } from "@/components/lab/labShared";
import type { RadOrder } from "@/components/rad/radShared";
import type { FarmasiOrder } from "@/components/farmasi/farmasiShared";
import {
  chargeFromLabOrder, chargeFromRadOrder, chargeFromFarmasiOrder,
  chargeFromTindakan, chargeFromAkomodasi, chargeFromJasaDokter,
  type TindakanInput, type JasaDokterInput,
} from "./sourceAdapter";
import {
  findActiveInvoiceForPasien, getInvoiceDetail, appendCharges,
  type AppendChargesResult,
} from "./billingStore";
import type { PriceContext } from "./priceResolver";

// ── Public type ─────────────────────────────────────────

export interface IngestResult extends AppendChargesResult {
  invoiceId: string | null;
  /** Reason saat ok=false untuk debugging/logging. */
  reason?: "no-invoice" | "invoice-not-in-store" | "no-items";
}

const failNoInvoice: IngestResult = {
  ok: false, added: 0, skipped: 0,
  invoiceId: null, reason: "no-invoice",
};

const failNotInStore: IngestResult = {
  ok: false, added: 0, skipped: 0,
  invoiceId: null, reason: "invoice-not-in-store",
};

// ── Helpers ──────────────────────────────────────────────

/** Resolve invoice + bangun PriceContext dari detail invoice di store. */
function resolveContext(
  noRM: string,
  explicitInvoiceId?: string,
): { invoiceId: string; ctx: PriceContext } | null {
  const invoiceId = explicitInvoiceId ?? findActiveInvoiceForPasien(noRM)?.invoiceId;
  if (!invoiceId) return null;
  const detail = getInvoiceDetail(invoiceId);
  if (!detail) return null;
  return {
    invoiceId,
    ctx: { penjamin: detail.penjamin.tipe, kelas: detail.kelas },
  };
}

// ── Lab ──────────────────────────────────────────────────

/**
 * Ingest 1 lab order yang baru di-validasi → 1 charge per test item.
 *
 * Trigger point: `ValidasiPane.handleValidate` (lab) setelah
 * `updateLabWorkflow(id, { status: "Selesai" })`.
 */
export function ingestLabOrder(
  order: LabOrder,
  invoiceId?: string,
): IngestResult {
  const resolved = resolveContext(order.noRM, invoiceId);
  if (!resolved) return failNoInvoice;

  const items = chargeFromLabOrder(order, resolved.ctx);
  if (items.length === 0) {
    return { ok: true, added: 0, skipped: 0, invoiceId: resolved.invoiceId, reason: "no-items" };
  }

  const result = appendCharges(resolved.invoiceId, items);
  if (!result.ok) return { ...failNotInStore, invoiceId: resolved.invoiceId };
  return { ...result, invoiceId: resolved.invoiceId };
}

// ── Rad ──────────────────────────────────────────────────

export function ingestRadOrder(
  order: RadOrder,
  invoiceId?: string,
): IngestResult {
  const resolved = resolveContext(order.noRM, invoiceId);
  if (!resolved) return failNoInvoice;

  const items = chargeFromRadOrder(order, resolved.ctx);
  if (items.length === 0) {
    return { ok: true, added: 0, skipped: 0, invoiceId: resolved.invoiceId, reason: "no-items" };
  }

  const result = appendCharges(resolved.invoiceId, items);
  if (!result.ok) return { ...failNotInStore, invoiceId: resolved.invoiceId };
  return { ...result, invoiceId: resolved.invoiceId };
}

// ── Farmasi ──────────────────────────────────────────────

/**
 * Ingest 1 farmasi order Selesai → 1 charge per item obat.
 *
 * Trigger point: `FarmasiOrderTabs.handleSerahkan` setelah
 * `updateFarmasiWorkflow(id, { status: "Selesai" })`.
 */
export function ingestFarmasiOrder(
  order: FarmasiOrder,
  invoiceId?: string,
): IngestResult {
  const resolved = resolveContext(order.noRM, invoiceId);
  if (!resolved) return failNoInvoice;

  const items = chargeFromFarmasiOrder(order, resolved.ctx);
  if (items.length === 0) {
    return { ok: true, added: 0, skipped: 0, invoiceId: resolved.invoiceId, reason: "no-items" };
  }

  const result = appendCharges(resolved.invoiceId, items);
  if (!result.ok) return { ...failNotInStore, invoiceId: resolved.invoiceId };
  return { ...result, invoiceId: resolved.invoiceId };
}

// ── Tindakan ─────────────────────────────────────────────

export interface IngestTindakanInput extends TindakanInput {
  /** RM pasien — untuk resolve invoiceId jika tidak di-pass eksplisit. */
  noRM: string;
}

/** Ingest 1 tindakan entry (IGD/RI/RJ) → 1 charge. */
export function ingestTindakan(
  entry: IngestTindakanInput,
  invoiceId?: string,
): IngestResult {
  const resolved = resolveContext(entry.noRM, invoiceId);
  if (!resolved) return failNoInvoice;

  const item = chargeFromTindakan(entry, resolved.ctx);
  const result = appendCharges(resolved.invoiceId, [item]);
  if (!result.ok) return { ...failNotInStore, invoiceId: resolved.invoiceId };
  return { ...result, invoiceId: resolved.invoiceId };
}

// ── Jasa Dokter ──────────────────────────────────────────

export interface IngestJasaDokterInput extends JasaDokterInput {
  noRM: string;
}

export function ingestJasaDokter(
  entry: IngestJasaDokterInput,
  invoiceId?: string,
): IngestResult {
  const resolved = resolveContext(entry.noRM, invoiceId);
  if (!resolved) return failNoInvoice;

  const item = chargeFromJasaDokter(entry, resolved.ctx);
  const result = appendCharges(resolved.invoiceId, [item]);
  if (!result.ok) return { ...failNotInStore, invoiceId: resolved.invoiceId };
  return { ...result, invoiceId: resolved.invoiceId };
}

// ── Akomodasi (RI hari rawat) ────────────────────────────

export interface IngestAkomodasiInput {
  invoiceId:      string;
  kunjunganId:    string;
  tanggalAdmisi:  string;          // ISO datetime
  tanggalSampai?: string;          // default = today
}

/**
 * Ingest akomodasi (kamar rawat) untuk range tanggal admisi → today.
 *
 * Idempotent: sourceRef per hari (`akomodasi:{kunjungan}:{YYYY-MM-DD}`), aman
 * dipanggil ulang setiap mount. Schedule harian backend = cron / WebSocket
 * push; di mock cukup panggil saat InvoiceDetailPage mount.
 */
export function ingestAkomodasi(input: IngestAkomodasiInput): IngestResult {
  const detail = getInvoiceDetail(input.invoiceId);
  if (!detail) return { ...failNotInStore, invoiceId: input.invoiceId };

  // Rawat jalan tidak ada akomodasi
  if (detail.kelas === "RJ") {
    return { ok: true, added: 0, skipped: 0, invoiceId: input.invoiceId, reason: "no-items" };
  }

  const items = chargeFromAkomodasi(
    {
      kunjunganId:   input.kunjunganId,
      kelas:         detail.kelas,
      tanggalAdmisi: input.tanggalAdmisi,
      tanggalSampai: input.tanggalSampai,
    },
    { penjamin: detail.penjamin.tipe, kelas: detail.kelas },
  );

  if (items.length === 0) {
    return { ok: true, added: 0, skipped: 0, invoiceId: input.invoiceId, reason: "no-items" };
  }

  const result = appendCharges(input.invoiceId, items);
  return { ...result, invoiceId: input.invoiceId };
}
