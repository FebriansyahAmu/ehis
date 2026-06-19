// transferService — Inventory Transfer antar lokasi farmasi. Create = Draft (RESERVASI stok di
// sumber agar tak over-promise). `post` = lepas reservasi + movement TRANSFER per baris (sumber −,
// tujuan +, identitas batch dipertahankan/FEFO) dalam SATU transaksi → status Selesai. `cancel` =
// lepas reservasi → Dibatalkan (agar stok tak terkunci oleh draft terbengkalai). DTO diperkaya nama.

import { transaction } from "@/lib/db/prisma";
import * as transferDal from "@/lib/dal/inventory/transferDal";
import * as stockDal from "@/lib/dal/inventory/stockDal";
import { movementService } from "@/lib/services/inventory/movementService";
import { nextDocNo } from "@/lib/services/inventory/docNo";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { TransferEntity, TransferStatus, TransferLineData } from "@/lib/dal/inventory/transferDal";
import type { ItemJenis } from "@/lib/dal/inventory/stockDal";
import type {
  CreateStockTransferInput, StockTransferQuery, StockTransferDTO, DocStatus,
} from "@/lib/schemas/inventory/transfer";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Resolusi nama lokasi + item untuk banyak transfer → DTO. */
async function enrichMany(rows: TransferEntity[]): Promise<StockTransferDTO[]> {
  const locIds = [...new Set(rows.flatMap((r) => [r.fromLocationId, r.toLocationId]))];
  const obatIds = [...new Set(rows.flatMap((r) => r.items).filter((i) => i.itemJenis === "Obat").map((i) => i.itemId))];
  const bmhpIds = [...new Set(rows.flatMap((r) => r.items).filter((i) => i.itemJenis === "BMHP").map((i) => i.itemId))];

  const [locs, obat, bmhp] = await Promise.all([
    stockDal.findLocationNames(locIds),
    stockDal.findObatByIds(obatIds),
    stockDal.findBmhpByIds(bmhpIds),
  ]);
  const lMap = new Map(locs.map((l) => [l.id, l.nama]));
  const oMap = new Map(obat.map((o) => [o.id, { kode: o.kode, nama: o.namaGenerik }]));
  const bMap = new Map(bmhp.map((b) => [b.id, { kode: b.kode, nama: b.nama }]));

  return rows.map((r) => ({
    id: r.id,
    noDokumen: r.noDokumen,
    tanggal: isoDate(r.tanggal),
    fromLocationId: r.fromLocationId,
    fromLocationNama: lMap.get(r.fromLocationId) ?? r.fromLocationId,
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
        qty: l.qty,
      };
    }),
  }));
}

export function makeTransferService() {
  async function list(query: StockTransferQuery): Promise<{ items: StockTransferDTO[]; cursor: string | null }> {
    const limit = query.limit ?? 50;
    const status = query.status && query.status !== "Semua" ? query.status : undefined;
    const rows = await transferDal.list({ status, fromLocationId: query.fromLocationId, toLocationId: query.toLocationId, cursorId: query.cursor, limit: limit + 1 });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { items: await enrichMany(page), cursor: hasMore ? page[page.length - 1].id : null };
  }

  async function get(id: string): Promise<StockTransferDTO> {
    const r = await transferDal.findById(id);
    if (!r) throw Errors.notFound("Transfer tidak ditemukan");
    const [dto] = await enrichMany([r]);
    return dto;
  }

  async function create(input: CreateStockTransferInput, actor: Actor): Promise<StockTransferDTO> {
    const farmasi = new Set((await stockDal.listFarmasiLocations()).map((l) => l.id));
    if (!farmasi.has(input.fromLocationId)) throw Errors.validation("Lokasi sumber harus depo/gudang farmasi");
    if (!farmasi.has(input.toLocationId)) throw Errors.validation("Lokasi tujuan harus depo/gudang farmasi");
    const petugas = (await stockDal.findPegawaiNama(actor.pegawaiId))?.namaLengkap ?? "Petugas Gudang";

    const row = await transaction(async (tx) => {
      // Reservasi stok sumber per baris (guard atomik) sebelum membuat draft.
      for (const l of input.lines) {
        const ok = await stockDal.reserveBalanceGuarded({ itemJenis: l.itemJenis as ItemJenis, itemId: l.itemId, locationId: input.fromLocationId }, l.qty, tx);
        if (!ok) throw Errors.conflict("Stok tersedia di sumber tidak mencukupi untuk direservasi");
      }
      const noDokumen = await nextDocNo("TRF", tx);
      const lines: TransferLineData[] = input.lines.map((l) => ({ itemJenis: l.itemJenis, itemId: l.itemId, batchNo: l.batchNo ?? null, qty: l.qty }));
      return transferDal.createTransfer(
        { noDokumen, tanggal: input.tanggal ? new Date(input.tanggal) : new Date(), fromLocationId: input.fromLocationId, toLocationId: input.toLocationId, status: "Draft" as TransferStatus, petugas, actorId: actor.userId },
        lines, tx,
      );
    });
    const [dto] = await enrichMany([row]);
    return dto;
  }

  /** Posting: lepas reservasi + movement TRANSFER (sumber − / tujuan +) per baris → Selesai. */
  async function post(id: string, actor: Actor): Promise<StockTransferDTO> {
    const updated = await transaction(async (tx) => {
      const r = await transferDal.findById(id, tx);
      if (!r) throw Errors.notFound("Transfer tidak ditemukan");
      if (r.status === "Selesai") throw Errors.conflict("Transfer sudah diposting");
      if (r.status === "Dibatalkan") throw Errors.conflict("Transfer sudah dibatalkan");

      const ctx = { petugas: r.petugas, actorId: actor.userId, refType: "TRF", refNo: r.noDokumen, refId: r.id };
      for (const l of r.items) {
        await stockDal.releaseReserve({ itemJenis: l.itemJenis, itemId: l.itemId, locationId: r.fromLocationId }, l.qty, tx);
        await movementService.postMovement(
          { jenis: "TRANSFER", itemJenis: l.itemJenis, itemId: l.itemId, fromLocationId: r.fromLocationId, toLocationId: r.toLocationId, batchNo: l.batchNo, qty: l.qty },
          ctx, tx,
        );
      }
      await transferDal.updateStatus(r.id, { status: "Selesai", postedAt: new Date() }, tx);
      return transferDal.findById(r.id, tx);
    });
    const [dto] = await enrichMany([updated as TransferEntity]);
    return dto;
  }

  /** Batalkan draft: lepas reservasi → Dibatalkan (stok kembali tersedia). */
  async function cancel(id: string, _actor: Actor): Promise<StockTransferDTO> {
    const updated = await transaction(async (tx) => {
      const r = await transferDal.findById(id, tx);
      if (!r) throw Errors.notFound("Transfer tidak ditemukan");
      if (r.status === "Selesai") throw Errors.conflict("Transfer sudah diposting — tak bisa dibatalkan");
      if (r.status === "Dibatalkan") return r;
      for (const l of r.items) {
        await stockDal.releaseReserve({ itemJenis: l.itemJenis, itemId: l.itemId, locationId: r.fromLocationId }, l.qty, tx);
      }
      await transferDal.updateStatus(r.id, { status: "Dibatalkan" }, tx);
      return transferDal.findById(r.id, tx);
    });
    const [dto] = await enrichMany([updated as TransferEntity]);
    return dto;
  }

  return { list, get, create, post, cancel };
}

export const transferService = makeTransferService();
