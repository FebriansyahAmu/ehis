/**
 * Billing Store — observable mutable state untuk InvoiceDetail.
 *
 * Pattern: module-level singleton + pub/sub via React `useSyncExternalStore`.
 * Tidak butuh library eksternal (Zustand/Jotai/dst). Aman SSR-friendly:
 * `getSnapshot` + `getServerSnapshot` return reference yang stabil.
 *
 * Tanggung jawab:
 *   - Hold canonical `InvoiceDetail` per id (seeded dari INVOICE_DETAIL_MOCK)
 *   - Mutator immutable: `setInvoice`, `appendCharges`, `mutateInvoice`
 *   - Resolver: `findActiveInvoiceForPasien(noRM)` — utama untuk charge ingest
 *   - Listener notification setiap mutasi
 *   - React hook `useInvoiceDetail(id)` untuk komponen
 *
 * Backend ready: ganti seed + mutator pakai Prisma + WebSocket push. Hook UI
 * tetap sama (zero refactor caller).
 */

import { useSyncExternalStore } from "react";
import type {
  ChargeItem, InvoiceDetail,
} from "@/components/billing/invoice/invoiceShared";
import { INVOICE_DETAIL_MOCK } from "@/components/billing/invoice/invoiceMock";
import { TAGIHAN_BOARD_MOCK } from "@/lib/billing/tagihanBoardMock";

// ── Internal state ──────────────────────────────────────

/**
 * Snapshot canonical state. Setiap mutasi clone object id-nya (immutable di
 * level invoice agar React re-render via reference equality check).
 */
const _store = new Map<string, InvoiceDetail>();
const _listeners = new Set<() => void>();

/** Seed lazy — pertama kali ada konsumen yang baca. */
let _seeded = false;
function ensureSeeded(): void {
  if (_seeded) return;
  for (const [id, detail] of Object.entries(INVOICE_DETAIL_MOCK)) {
    // Deep-ish clone agar mutasi via mock seed tidak bocor ke runtime store.
    _store.set(id, { ...detail, items: [...detail.items], payments: [...detail.payments], timeline: [...detail.timeline] });
  }
  _seeded = true;
}

function notify(): void {
  for (const listener of _listeners) listener();
}

// ── Read API ─────────────────────────────────────────────

/** Snapshot bacaan untuk 1 invoice. `null` jika belum ada di store. */
export function getInvoiceDetail(id: string): InvoiceDetail | null {
  ensureSeeded();
  return _store.get(id) ?? null;
}

/** Daftar semua invoice id yang ada di store (read-only). */
export function listInvoiceIds(): string[] {
  ensureSeeded();
  return Array.from(_store.keys());
}

/**
 * Cari invoice aktif untuk pasien tertentu (by noRM).
 *
 * Strategi:
 *   1. Lookup di store (sudah terseed dari INVOICE_DETAIL_MOCK)
 *   2. Fallback ke TAGIHAN_BOARD_MOCK (jika invoice tidak punya detail full)
 *
 * "Aktif" = status BUKAN "Lunas"/"Void". Return invoice paling baru.
 */
export function findActiveInvoiceForPasien(noRM: string): {
  invoiceId: string;
  source: "store" | "board";
} | null {
  ensureSeeded();

  // Scan store dulu
  let best: { id: string; tanggalISO: string; status: string } | null = null;
  for (const [id, detail] of _store.entries()) {
    if (detail.pasien.noRM !== noRM) continue;
    if (detail.status === "Lunas" || detail.status === "Void") continue;
    if (!best || detail.tanggalISO > best.tanggalISO) {
      best = { id, tanggalISO: detail.tanggalISO, status: detail.status };
    }
  }
  if (best) return { invoiceId: best.id, source: "store" };

  // Fallback ke board (invoice tanpa detail full, mis. row TAGIHAN_BOARD_MOCK)
  let boardBest: { id: string; tanggalISO: string } | null = null;
  for (const row of TAGIHAN_BOARD_MOCK) {
    if (row.pasien.noRM !== noRM) continue;
    if (row.status === "Lunas" || row.status === "Void") continue;
    if (!boardBest || row.tanggalISO > boardBest.tanggalISO) {
      boardBest = { id: row.id, tanggalISO: row.tanggalISO };
    }
  }
  return boardBest ? { invoiceId: boardBest.id, source: "board" } : null;
}

// ── Write API ────────────────────────────────────────────

/** Replace 1 invoice (full). Notify subscribers. */
export function setInvoiceDetail(id: string, detail: InvoiceDetail): void {
  ensureSeeded();
  _store.set(id, detail);
  notify();
}

/**
 * Mutator helper: berikan fungsi yang menerima current InvoiceDetail dan
 * return next. Jika invoice tidak ditemukan, no-op (return false).
 */
export function mutateInvoice(
  id: string,
  mutator: (current: InvoiceDetail) => InvoiceDetail,
): boolean {
  ensureSeeded();
  const current = _store.get(id);
  if (!current) return false;
  const next = mutator(current);
  _store.set(id, next);
  notify();
  return true;
}

export interface AppendChargesResult {
  added:   number;
  skipped: number;
  ok:      boolean;
}

/**
 * Append charge items ke invoice. Default: dedupe by `sourceRef` (item yang
 * sudah ada di invoice akan di-skip).
 *
 * Caller boleh `opts.allowDuplicateSourceRef = true` untuk paksa append
 * (mis. adjustment manual).
 */
export function appendCharges(
  invoiceId: string,
  items: ChargeItem[],
  opts?: { allowDuplicateSourceRef?: boolean },
): AppendChargesResult {
  ensureSeeded();
  const current = _store.get(invoiceId);
  if (!current) return { added: 0, skipped: items.length, ok: false };

  const allowDup = opts?.allowDuplicateSourceRef ?? false;
  const existingRefs = new Set(current.items.map((it) => it.sourceRef));

  const toAdd: ChargeItem[] = [];
  let skipped = 0;
  for (const item of items) {
    if (!allowDup && existingRefs.has(item.sourceRef)) {
      skipped += 1;
      continue;
    }
    toAdd.push(item);
    existingRefs.add(item.sourceRef);
  }

  if (toAdd.length === 0) {
    return { added: 0, skipped, ok: true };
  }

  _store.set(invoiceId, {
    ...current,
    items: [...current.items, ...toAdd],
  });
  notify();
  return { added: toAdd.length, skipped, ok: true };
}

// ── Subscribe API ────────────────────────────────────────

export function subscribe(listener: () => void): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

// ── React hook ───────────────────────────────────────────

/**
 * Subscribe ke 1 invoice. Re-render component setiap kali invoice id-nya
 * dimutasi (append charge / mutate). SSR-safe.
 */
export function useInvoiceDetail(id: string): InvoiceDetail | null {
  return useSyncExternalStore(
    subscribe,
    () => getInvoiceDetail(id),
    () => getInvoiceDetail(id),
  );
}

/**
 * Subscribe ke 1 invoice tapi return signature stable saat null (untuk hook
 * yang butuh non-null guarantee). Dipakai utility helpers downstream.
 */
export function useInvoiceItems(id: string): ChargeItem[] {
  const detail = useInvoiceDetail(id);
  return detail?.items ?? [];
}
