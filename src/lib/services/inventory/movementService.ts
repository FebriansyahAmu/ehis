// movementService — JANTUNG inventory (FLOWS §2). `postMovement` = primitif tunggal yang menulis
// ledger + proyeksi (batch + saldo) secara ATOMIK dalam satu transaksi caller. Semua jalur tulis
// stok (penerimaan/transfer/distribusi/opname) memanggil ini → tak ada saldo yang berubah tanpa
// satu baris StockMovement. Anti-negatif (decBatchGuarded), FEFO (ED terdekat dulu).
//
// Konvensi qty: IN/OUT/TRANSFER = magnitudo positif; ADJUST/OPNAME = delta bertanda (±).
// TRANSFER = 1 baris ledger per batch yang dipindah (from+to + batch sumber), batch identitas
// (no + ED) dipertahankan di lokasi tujuan. OUT FEFO bisa memecah jadi beberapa baris (per batch).

import { type Tx } from "@/lib/db/prisma";
import * as dal from "@/lib/dal/inventory/stockDal";
import { Errors } from "@/lib/errors/appError";
import type { ItemJenis, MovementJenisDal, MovementData } from "@/lib/dal/inventory/stockDal";

export interface MovementCtx {
  petugas: string;
  actorId?: string | null;
  refType?: string | null;
  refNo?: string | null;
  refId?: string | null;
  alasan?: string | null;
}

export interface PostMovementInput {
  jenis: MovementJenisDal;
  itemJenis: ItemJenis;
  itemId: string;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  batchNo?: string | null;
  expiryDate?: Date | null;
  qty: number;
}

interface Leg {
  batchId: string;
  batchNo: string;
  expiryDate: Date | null;
  qty: number;
}

/** Stok MASUK ke (location, batch). Tambah batch yang ada / buat baru. Kembalikan batchId. */
async function inflow(
  tx: Tx,
  p: { itemJenis: ItemJenis; itemId: string; locationId: string; batchNo: string; expiryDate: Date | null; qty: number },
): Promise<string> {
  const existing = await dal.getBatch({ itemJenis: p.itemJenis, itemId: p.itemId, locationId: p.locationId, batchNo: p.batchNo }, tx);
  if (existing) {
    await dal.incBatch(existing.id, p.qty, tx);
    return existing.id;
  }
  const created = await dal.createBatch(p, tx);
  return created.id;
}

/** Stok KELUAR dari lokasi (batch spesifik / FEFO). Anti-negatif. Kembalikan leg per batch. */
async function outflowFEFO(
  tx: Tx,
  p: { itemJenis: ItemJenis; itemId: string; locationId: string; batchNo?: string | null; qty: number },
): Promise<Leg[]> {
  let candidates;
  if (p.batchNo) {
    const b = await dal.getBatch({ itemJenis: p.itemJenis, itemId: p.itemId, locationId: p.locationId, batchNo: p.batchNo }, tx);
    candidates = b ? [b] : [];
  } else {
    candidates = await dal.listBatchesFEFO({ itemJenis: p.itemJenis, itemId: p.itemId, locationId: p.locationId }, tx);
  }
  const legs: Leg[] = [];
  let remaining = p.qty;
  for (const b of candidates) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, b.qtyOnHand);
    if (take <= 0) continue;
    const ok = await dal.decBatchGuarded(b.id, take, tx);
    if (!ok) continue; // race — batch berubah; lewati (sisa diisi batch lain / akhirnya throw)
    legs.push({ batchId: b.id, batchNo: b.batchNo, expiryDate: b.expiryDate, qty: take });
    remaining -= take;
  }
  if (remaining > 0) throw Errors.conflict("Stok tidak mencukupi di lokasi sumber");
  return legs;
}

export function makeMovementService() {
  /**
   * Posting satu event pergerakan stok. WAJIB dipanggil di dalam transaksi (`tx`) caller agar
   * 1 dokumen (mis. penerimaan banyak baris) atomik. Tulis ledger + proyeksi konsisten.
   */
  async function postMovement(input: PostMovementInput, ctx: MovementCtx, tx: Tx): Promise<void> {
    const base = { itemJenis: input.itemJenis, itemId: input.itemId };
    const writeMv = (extra: Partial<MovementData> & { qty: number }) =>
      dal.createMovement(
        {
          jenis: input.jenis, itemJenis: input.itemJenis, itemId: input.itemId,
          refType: ctx.refType, refNo: ctx.refNo, refId: ctx.refId, alasan: ctx.alasan,
          petugas: ctx.petugas, actorId: ctx.actorId,
          ...extra,
        },
        tx,
      );

    switch (input.jenis) {
      case "IN": {
        if (!input.toLocationId || !input.batchNo) throw Errors.validation("Penerimaan butuh lokasi tujuan + batch");
        if (input.qty <= 0) throw Errors.validation("Qty penerimaan harus > 0");
        const batchId = await inflow(tx, { ...base, locationId: input.toLocationId, batchNo: input.batchNo, expiryDate: input.expiryDate ?? null, qty: input.qty });
        await dal.balanceDelta({ ...base, locationId: input.toLocationId }, input.qty, tx);
        await writeMv({ toLocationId: input.toLocationId, batchId, qty: input.qty });
        return;
      }
      case "OUT": {
        if (!input.fromLocationId) throw Errors.validation("Pengeluaran butuh lokasi sumber");
        if (input.qty <= 0) throw Errors.validation("Qty pengeluaran harus > 0");
        const legs = await outflowFEFO(tx, { ...base, locationId: input.fromLocationId, batchNo: input.batchNo, qty: input.qty });
        await dal.balanceDelta({ ...base, locationId: input.fromLocationId }, -input.qty, tx);
        for (const l of legs) await writeMv({ fromLocationId: input.fromLocationId, batchId: l.batchId, qty: l.qty });
        return;
      }
      case "TRANSFER": {
        if (!input.fromLocationId || !input.toLocationId) throw Errors.validation("Transfer butuh lokasi sumber + tujuan");
        if (input.qty <= 0) throw Errors.validation("Qty transfer harus > 0");
        const legs = await outflowFEFO(tx, { ...base, locationId: input.fromLocationId, batchNo: input.batchNo, qty: input.qty });
        for (const l of legs) {
          await inflow(tx, { ...base, locationId: input.toLocationId, batchNo: l.batchNo, expiryDate: l.expiryDate, qty: l.qty });
          await writeMv({ fromLocationId: input.fromLocationId, toLocationId: input.toLocationId, batchId: l.batchId, qty: l.qty });
        }
        await dal.balanceDelta({ ...base, locationId: input.fromLocationId }, -input.qty, tx);
        await dal.balanceDelta({ ...base, locationId: input.toLocationId }, input.qty, tx);
        return;
      }
      case "ADJUST":
      case "OPNAME": {
        if (!input.fromLocationId) throw Errors.validation("Penyesuaian butuh lokasi");
        if (input.qty === 0) return;
        if (input.qty > 0) {
          const batchNo = input.batchNo ?? `ADJ-${new Date().toISOString().slice(0, 10)}`;
          const batchId = await inflow(tx, { ...base, locationId: input.fromLocationId, batchNo, expiryDate: input.expiryDate ?? null, qty: input.qty });
          await dal.balanceDelta({ ...base, locationId: input.fromLocationId }, input.qty, tx);
          await writeMv({ fromLocationId: input.fromLocationId, batchId, qty: input.qty });
        } else {
          const legs = await outflowFEFO(tx, { ...base, locationId: input.fromLocationId, batchNo: input.batchNo, qty: -input.qty });
          await dal.balanceDelta({ ...base, locationId: input.fromLocationId }, input.qty, tx);
          for (const l of legs) await writeMv({ fromLocationId: input.fromLocationId, batchId: l.batchId, qty: -l.qty });
        }
        return;
      }
    }
  }

  return { postMovement };
}

export const movementService = makeMovementService();
