// receiptService — Inventory Penerimaan (GoodsReceipt). Create = Draft (belum pengaruhi stok).
// `post` = transisi → posting movement IN per baris (stok BERTAMBAH via movementService, batch+saldo)
// dalam SATU transaksi, lalu status Selesai. DTO diperkaya nama vendor/lokasi/item.

import { transaction } from "@/lib/db/prisma";
import * as receiptDal from "@/lib/dal/inventory/receiptDal";
import * as stockDal from "@/lib/dal/inventory/stockDal";
import { movementService } from "@/lib/services/inventory/movementService";
import { nextDocNo } from "@/lib/services/inventory/docNo";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { ReceiptEntity, GRStatus } from "@/lib/dal/inventory/receiptDal";
import type {
  CreateGoodsReceiptInput, GoodsReceiptQuery, GoodsReceiptDTO, DocStatus,
} from "@/lib/schemas/inventory/receipt";

const nu = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Batch key bila No. Batch tak diisi:
 *  - ED ada  → turunkan dari ED (kelompokkan per kadaluwarsa, FEFO tetap akurat)
 *  - ED kosong → pool "UMUM" (barang tanpa batch & tanpa ED, ED batch = null)
 */
function defaultBatch(ed?: string): string {
  return ed ? `ED-${ed.replaceAll("-", "")}` : "UMUM";
}

/** Enrich banyak receipt → DTO (batch-fetch nama vendor/lokasi/item). */
async function enrichMany(rows: ReceiptEntity[]): Promise<GoodsReceiptDTO[]> {
  const vendorIds = [...new Set(rows.map((r) => r.vendorId))];
  const locIds = [...new Set(rows.map((r) => r.toLocationId))];
  const obatIds = [...new Set(rows.flatMap((r) => r.items).filter((i) => i.itemJenis === "Obat").map((i) => i.itemId))];
  const bmhpIds = [...new Set(rows.flatMap((r) => r.items).filter((i) => i.itemJenis === "BMHP").map((i) => i.itemId))];

  const [vendors, locs, obat, bmhp] = await Promise.all([
    receiptDal.findVendorsByIds(vendorIds),
    stockDal.findLocationNames(locIds),
    stockDal.findObatByIds(obatIds),
    stockDal.findBmhpByIds(bmhpIds),
  ]);
  const vMap = new Map(vendors.map((v) => [v.id, v.nama]));
  const lMap = new Map(locs.map((l) => [l.id, l.nama]));
  const oMap = new Map(obat.map((o) => [o.id, { kode: o.kode, nama: o.namaGenerik }]));
  const bMap = new Map(bmhp.map((b) => [b.id, { kode: b.kode, nama: b.nama }]));

  return rows.map((r) => ({
    id: r.id,
    noDokumen: r.noDokumen,
    tanggal: isoDate(r.tanggal),
    vendorId: r.vendorId,
    vendorNama: vMap.get(r.vendorId) ?? "—",
    noSuratJalan: nu(r.noSuratJalan),
    noPo: nu(r.noPo),
    toLocationId: r.toLocationId,
    toLocationNama: lMap.get(r.toLocationId) ?? r.toLocationId,
    status: r.status as DocStatus,
    petugas: r.petugas,
    lines: r.items.map((l) => {
      const m = l.itemJenis === "Obat" ? oMap.get(l.itemId) : bMap.get(l.itemId);
      return {
        itemJenis: l.itemJenis as "Obat" | "BMHP",
        itemId: l.itemId,
        nama: m?.nama ?? "(item dihapus)",
        kode: m?.kode ?? "—",
        batchNo: l.batchNo,
        expiryDate: l.expiryDate ? isoDate(l.expiryDate) : null,
        qty: l.qty,
        hargaBeli: l.hargaBeli,
      };
    }),
  }));
}

export function makeReceiptService() {
  async function list(query: GoodsReceiptQuery): Promise<{ items: GoodsReceiptDTO[]; cursor: string | null }> {
    const limit = query.limit ?? 50;
    const status = query.status && query.status !== "Semua" ? query.status : undefined;
    const rows = await receiptDal.list({ status, vendorId: query.vendorId, toLocationId: query.locationId, cursorId: query.cursor, limit: limit + 1 });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const items = await enrichMany(page);
    return { items, cursor: hasMore ? page[page.length - 1].id : null };
  }

  async function get(id: string): Promise<GoodsReceiptDTO> {
    const r = await receiptDal.findById(id);
    if (!r) throw Errors.notFound("Penerimaan tidak ditemukan");
    const [dto] = await enrichMany([r]);
    return dto;
  }

  async function create(input: CreateGoodsReceiptInput, actor: Actor): Promise<GoodsReceiptDTO> {
    const petugas = (await receiptDal.findPegawaiNama(actor.pegawaiId))?.namaLengkap ?? "Petugas Gudang";
    const row = await transaction(async (tx) => {
      const noDokumen = await nextDocNo("GRN", tx);
      const header = {
        noDokumen,
        tanggal: input.tanggal ? new Date(input.tanggal) : new Date(),
        vendorId: input.vendorId,
        noSuratJalan: input.noSuratJalan ?? null,
        noPo: input.noPo ?? null,
        toLocationId: input.toLocationId,
        status: "Draft" as GRStatus,
        petugas,
        actorId: actor.userId,
      };
      const lines = input.lines.map((l) => ({
        itemJenis: l.itemJenis,
        itemId: l.itemId,
        batchNo: l.batchNo ?? defaultBatch(l.expiryDate),
        expiryDate: l.expiryDate ? new Date(l.expiryDate) : null,
        qty: l.qty,
        hargaBeli: l.hargaBeli ?? 0,
      }));
      return receiptDal.createReceipt(header, lines, tx);
    });
    const [dto] = await enrichMany([row]);
    return dto;
  }

  /** Posting penerimaan: stok BERTAMBAH (movement IN per baris) + status Selesai. Idempoten via status. */
  async function post(id: string, actor: Actor): Promise<GoodsReceiptDTO> {
    const updated = await transaction(async (tx) => {
      const r = await receiptDal.findById(id, tx);
      if (!r) throw Errors.notFound("Penerimaan tidak ditemukan");
      if (r.status === "Selesai") throw Errors.conflict("Penerimaan sudah diposting");
      if (r.status === "Dibatalkan") throw Errors.conflict("Penerimaan sudah dibatalkan");

      const ctx = { petugas: r.petugas, actorId: actor.userId, refType: "GRN", refNo: r.noDokumen, refId: r.id };
      for (const l of r.items) {
        await movementService.postMovement(
          { jenis: "IN", itemJenis: l.itemJenis, itemId: l.itemId, toLocationId: r.toLocationId, batchNo: l.batchNo, expiryDate: l.expiryDate, qty: l.qty },
          ctx, tx,
        );
      }
      await receiptDal.updateStatus(r.id, { status: "Selesai", postedAt: new Date() }, tx);
      return receiptDal.findById(r.id, tx);
    });
    const [dto] = await enrichMany([updated as ReceiptEntity]);
    return dto;
  }

  return { list, get, create, post };
}

export const receiptService = makeReceiptService();
