// stockDal — akses Prisma MURNI domain inventory/stok (FLOWS §2). Batch + saldo (proyeksi) +
// ledger (movement) + read join master (Obat/Bmhp/Location, cross-schema soft-ref). Tanpa aturan
// bisnis (itu di movementService/stockService). Terima `tx?` — komposisi transaksi di Service.

import { db, type Tx } from "@/lib/db/prisma";

export type ItemJenis = "Obat" | "BMHP";
export type MovementJenisDal = "IN" | "OUT" | "TRANSFER" | "ADJUST" | "OPNAME";

export interface ItemRef {
  itemJenis: ItemJenis;
  itemId: string;
}

// ── StockBatch (saldo per batch) ───────────────────────────────────────────────
export function getBatch(p: ItemRef & { locationId: string; batchNo: string }, tx?: Tx) {
  return db(tx).stockBatch.findUnique({
    where: {
      locationId_itemJenis_itemId_batchNo: {
        locationId: p.locationId, itemJenis: p.itemJenis, itemId: p.itemId, batchNo: p.batchNo,
      },
    },
  });
}

export function createBatch(
  p: ItemRef & { locationId: string; batchNo: string; expiryDate: Date | null; qty: number },
  tx?: Tx,
) {
  return db(tx).stockBatch.create({
    data: {
      itemJenis: p.itemJenis, itemId: p.itemId, locationId: p.locationId,
      batchNo: p.batchNo, expiryDate: p.expiryDate, qtyOnHand: p.qty,
    },
  });
}

export function incBatch(id: string, delta: number, tx?: Tx) {
  return db(tx).stockBatch.update({ where: { id }, data: { qtyOnHand: { increment: delta } } });
}

/** Kurangi batch dengan guard anti-negatif (atomik). false bila stok < amount. */
export async function decBatchGuarded(id: string, amount: number, tx?: Tx): Promise<boolean> {
  const r = await db(tx).stockBatch.updateMany({
    where: { id, qtyOnHand: { gte: amount } },
    data: { qtyOnHand: { decrement: amount } },
  });
  return r.count > 0;
}

/** Batch ber-stok di lokasi, urut FEFO (ED terdekat dulu; null ED paling akhir). */
export function listBatchesFEFO(ref: ItemRef & { locationId: string }, tx?: Tx) {
  return db(tx).stockBatch.findMany({
    where: { itemJenis: ref.itemJenis, itemId: ref.itemId, locationId: ref.locationId, qtyOnHand: { gt: 0 } },
    orderBy: [{ expiryDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  });
}

// ── StockBalance (rollup per item×lokasi + kebijakan reorder) ──────────────────
export function getBalance(ref: ItemRef & { locationId: string }, tx?: Tx) {
  return db(tx).stockBalance.findUnique({
    where: { locationId_itemJenis_itemId: { locationId: ref.locationId, itemJenis: ref.itemJenis, itemId: ref.itemId } },
  });
}

/** Upsert delta saldo rollup (create qtyOnHand=delta bila belum ada, else increment). */
export function balanceDelta(ref: ItemRef & { locationId: string }, delta: number, tx?: Tx) {
  return db(tx).stockBalance.upsert({
    where: { locationId_itemJenis_itemId: { locationId: ref.locationId, itemJenis: ref.itemJenis, itemId: ref.itemId } },
    create: { itemJenis: ref.itemJenis, itemId: ref.itemId, locationId: ref.locationId, qtyOnHand: delta },
    update: { qtyOnHand: { increment: delta } },
  });
}

/**
 * Reservasi stok di saldo rollup (qtyReserved += qty) dengan guard atomik:
 * hanya berhasil bila TERSEDIA (qtyOnHand − qtyReserved) ≥ qty. Dipakai saat dokumen
 * transfer/distribusi berstatus Draft "memegang" stok agar tak over-promise. false = tak cukup.
 */
export async function reserveBalanceGuarded(ref: ItemRef & { locationId: string }, qty: number, tx?: Tx): Promise<boolean> {
  const n = await db(tx).$executeRaw`
    UPDATE inventory.stock_balance
       SET qty_reserved = qty_reserved + ${qty}, updated_at = now()
     WHERE location_id = ${ref.locationId}::uuid
       AND item_jenis = ${ref.itemJenis}::inventory."ItemJenis"
       AND item_id = ${ref.itemId}::uuid
       AND (qty_on_hand - qty_reserved) >= ${qty}`;
  return n > 0;
}

/** Lepas reservasi (qtyReserved −= qty, tak pernah < 0). Saat dokumen diposting/dibatalkan. */
export async function releaseReserve(ref: ItemRef & { locationId: string }, qty: number, tx?: Tx): Promise<void> {
  await db(tx).$executeRaw`
    UPDATE inventory.stock_balance
       SET qty_reserved = GREATEST(qty_reserved - ${qty}, 0), updated_at = now()
     WHERE location_id = ${ref.locationId}::uuid
       AND item_jenis = ${ref.itemJenis}::inventory."ItemJenis"
       AND item_id = ${ref.itemId}::uuid`;
}

/** Set kebijakan reorder (min/max/ROP) — upsert tanpa menyentuh qty. */
export function setBalancePolicy(
  ref: ItemRef & { locationId: string },
  p: { min: number; max: number; reorderPoint: number },
  tx?: Tx,
) {
  return db(tx).stockBalance.upsert({
    where: { locationId_itemJenis_itemId: { locationId: ref.locationId, itemJenis: ref.itemJenis, itemId: ref.itemId } },
    create: { itemJenis: ref.itemJenis, itemId: ref.itemId, locationId: ref.locationId, ...p },
    update: { ...p },
  });
}

// ── StockMovement (ledger, append-only) ────────────────────────────────────────
export interface MovementData {
  jenis: MovementJenisDal;
  itemJenis: ItemJenis;
  itemId: string;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  batchId?: string | null;
  qty: number;
  refType?: string | null;
  refNo?: string | null;
  refId?: string | null;
  alasan?: string | null;
  petugas: string;
  actorId?: string | null;
}

export function createMovement(d: MovementData, tx?: Tx) {
  return db(tx).stockMovement.create({
    data: {
      jenis: d.jenis, itemJenis: d.itemJenis, itemId: d.itemId,
      fromLocationId: d.fromLocationId ?? null, toLocationId: d.toLocationId ?? null,
      batchId: d.batchId ?? null, qty: d.qty,
      refType: d.refType ?? null, refNo: d.refNo ?? null, refId: d.refId ?? null, alasan: d.alasan ?? null,
      petugas: d.petugas, actorId: d.actorId ?? null,
    },
  });
}

// ── Reads (untuk stockService) ─────────────────────────────────────────────────
export function listBalancesByLocation(locationId: string, tx?: Tx) {
  return db(tx).stockBalance.findMany({ where: { locationId } });
}
export function listBalancesByItem(ref: ItemRef, tx?: Tx) {
  return db(tx).stockBalance.findMany({ where: { itemJenis: ref.itemJenis, itemId: ref.itemId } });
}
/** Batch ber-stok di satu lokasi (FEFO) — basis ED terdekat per item (overlay stok klinis). */
export function listBatchesByLocation(locationId: string, tx?: Tx) {
  return db(tx).stockBatch.findMany({
    where: { locationId, qtyOnHand: { gt: 0 } },
    orderBy: [{ expiryDate: { sort: "asc", nulls: "last" } }],
  });
}
export function listBatchesByItem(ref: ItemRef, tx?: Tx) {
  return db(tx).stockBatch.findMany({
    where: { itemJenis: ref.itemJenis, itemId: ref.itemId },
    orderBy: [{ expiryDate: { sort: "asc", nulls: "last" } }],
  });
}
export function listRecentMovementsByItem(ref: ItemRef, limit: number, tx?: Tx) {
  return db(tx).stockMovement.findMany({
    where: { itemJenis: ref.itemJenis, itemId: ref.itemId },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });
}

// ── Aggregate reads (Monitoring + Beranda) ─────────────────────────────────────
/** Semua saldo rollup (lintas lokasi) — basis nilai stok, reorder, SKU, habis. */
export function listAllBalances(tx?: Tx) {
  return db(tx).stockBalance.findMany({});
}
/** Batch ber-stok yang ED ≤ cutoff (FEFO alert). */
export function listExpiringBatches(cutoff: Date, tx?: Tx) {
  return db(tx).stockBatch.findMany({
    where: { qtyOnHand: { gt: 0 }, expiryDate: { not: null, lte: cutoff } },
    orderBy: [{ expiryDate: "asc" }],
  });
}
/** Pergerakan stok terkini lintas item (feed Beranda). */
export function listRecentMovements(limit: number, tx?: Tx) {
  return db(tx).stockMovement.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: limit });
}
/** Barang paling bergerak = Σ qty movement OUT+TRANSFER, per item, desc. */
export function topMovers(limit: number, tx?: Tx) {
  return db(tx).stockMovement.groupBy({
    by: ["itemJenis", "itemId"],
    where: { jenis: { in: ["OUT", "TRANSFER"] } },
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
    take: limit,
  });
}

// ── Master joins (cross-schema, read-only — item ref di-resolve di sini) ────────
export function listFarmasiLocations(tx?: Tx) {
  return db(tx).location.findMany({
    where: { deletedAt: null, active: true, locationType: { in: ["Farmasi", "Gudang_Farmasi"] } },
    select: { id: true, kode: true, nama: true, locationType: true },
    orderBy: [{ locationType: "asc" }, { nama: "asc" }],
  });
}
export function findObatByIds(ids: string[], tx?: Tx) {
  return db(tx).obat.findMany({
    where: { id: { in: ids } },
    select: { id: true, kode: true, namaGenerik: true, kategori: true, satuanTerkecil: true, isHAM: true, hargaSatuan: true },
  });
}
export function findBmhpByIds(ids: string[], tx?: Tx) {
  return db(tx).bmhp.findMany({
    where: { id: { in: ids } },
    select: { id: true, kode: true, nama: true, kategori: true, satuan: true, isSteril: true, hargaSatuan: true },
  });
}
export function findLocationNames(ids: string[], tx?: Tx) {
  return db(tx).location.findMany({ where: { id: { in: ids } }, select: { id: true, nama: true } });
}
/** Resolve Location.kode → id (aktif/non-deleted) — untuk pengeluaran stok dari depo (dispenseOut). */
export function findLocationIdByKode(kode: string, tx?: Tx) {
  return db(tx).location.findFirst({ where: { kode, deletedAt: null }, select: { id: true } });
}
/** Resolve kode Obat (OBT-…) → id — item resep hanya menyimpan kode, butuh UUID utk movement. */
export function findObatByKodes(kodes: string[], tx?: Tx) {
  return db(tx).obat.findMany({ where: { kode: { in: kodes }, deletedAt: null }, select: { id: true, kode: true } });
}
/** Batch by id (no + ED) — utk reversal IN (kompensasi) saat order dibatalkan. */
export function findBatchById(id: string, tx?: Tx) {
  return db(tx).stockBatch.findUnique({ where: { id }, select: { batchNo: true, expiryDate: true } });
}
/** Movement OUT ber-ref tertentu (refType+refId) — basis reversal kompensasi. */
export function listMovementsByRef(refType: string, refId: string, jenis: MovementJenisDal, tx?: Tx) {
  return db(tx).stockMovement.findMany({
    where: { refType, refId, jenis },
    select: { itemJenis: true, itemId: true, fromLocationId: true, batchId: true, qty: true },
  });
}
export function findPegawaiNama(id: string | null | undefined, tx?: Tx) {
  if (!id) return Promise.resolve(null);
  return db(tx).pegawai.findFirst({ where: { id }, select: { namaLengkap: true } });
}
