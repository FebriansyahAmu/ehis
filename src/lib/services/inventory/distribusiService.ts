// distribusiService — Inventory Distribusi (amprahan): permintaan stok antar lokasi farmasi
// (gudang → depo). Create = Draft (RESERVASI sumber per qtyMinta). `fulfill` = lepas reservasi +
// movement TRANSFER per baris (qtyKeluar = qtyMinta) + isi qtyKeluar → Selesai. `cancel` = lepas
// reservasi → Dibatalkan. DTO diperkaya nama. Beda dari Transfer: demand-driven (pemohon + qtyMinta).

import { transaction } from "@/lib/db/prisma";
import * as distribusiDal from "@/lib/dal/inventory/distribusiDal";
import * as stockDal from "@/lib/dal/inventory/stockDal";
import { movementService } from "@/lib/services/inventory/movementService";
import { nextDocNo } from "@/lib/services/inventory/docNo";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { DistribusiEntity, DistribusiStatus, DistribusiLineData } from "@/lib/dal/inventory/distribusiDal";
import type { ItemJenis } from "@/lib/dal/inventory/stockDal";
import type {
  CreateDistribusiInput, DistribusiQuery, DistribusiDTO, DocStatus,
} from "@/lib/schemas/inventory/distribusi";

const nu = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function enrichMany(rows: DistribusiEntity[]): Promise<DistribusiDTO[]> {
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
    pemohon: r.pemohon,
    petugas: nu(r.petugas) ?? null,
    lines: r.items.map((l) => {
      const m = l.itemJenis === "Obat" ? oMap.get(l.itemId) : bMap.get(l.itemId);
      return {
        itemJenis: l.itemJenis as "Obat" | "BMHP",
        itemId: l.itemId,
        nama: m?.nama ?? "(item dihapus)",
        kode: m?.kode ?? "—",
        qtyMinta: l.qtyMinta,
        qtyKeluar: l.qtyKeluar,
      };
    }),
  }));
}

export function makeDistribusiService() {
  async function list(query: DistribusiQuery): Promise<{ items: DistribusiDTO[]; cursor: string | null }> {
    const limit = query.limit ?? 50;
    const status = query.status && query.status !== "Semua" ? query.status : undefined;
    const rows = await distribusiDal.list({ status, fromLocationId: query.fromLocationId, toLocationId: query.toLocationId, cursorId: query.cursor, limit: limit + 1 });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { items: await enrichMany(page), cursor: hasMore ? page[page.length - 1].id : null };
  }

  async function get(id: string): Promise<DistribusiDTO> {
    const r = await distribusiDal.findById(id);
    if (!r) throw Errors.notFound("Permintaan distribusi tidak ditemukan");
    const [dto] = await enrichMany([r]);
    return dto;
  }

  async function create(input: CreateDistribusiInput, actor: Actor): Promise<DistribusiDTO> {
    const farmasi = new Set((await stockDal.listFarmasiLocations()).map((l) => l.id));
    if (!farmasi.has(input.fromLocationId)) throw Errors.validation("Lokasi sumber harus depo/gudang farmasi");
    if (!farmasi.has(input.toLocationId)) throw Errors.validation("Lokasi tujuan harus depo/gudang farmasi");

    const row = await transaction(async (tx) => {
      for (const l of input.lines) {
        const ok = await stockDal.reserveBalanceGuarded({ itemJenis: l.itemJenis as ItemJenis, itemId: l.itemId, locationId: input.fromLocationId }, l.qtyMinta, tx);
        if (!ok) throw Errors.conflict("Stok tersedia di sumber tidak mencukupi untuk direservasi");
      }
      const noDokumen = await nextDocNo("DST", tx);
      const lines: DistribusiLineData[] = input.lines.map((l) => ({ itemJenis: l.itemJenis, itemId: l.itemId, qtyMinta: l.qtyMinta, qtyKeluar: 0 }));
      return distribusiDal.createRequest(
        { noDokumen, tanggal: input.tanggal ? new Date(input.tanggal) : new Date(), fromLocationId: input.fromLocationId, toLocationId: input.toLocationId, status: "Draft" as DistribusiStatus, pemohon: input.pemohon, actorId: actor.userId },
        lines, tx,
      );
    });
    const [dto] = await enrichMany([row]);
    return dto;
  }

  /** Penuhi permintaan: lepas reservasi + TRANSFER (qtyKeluar = qtyMinta) per baris → Selesai. */
  async function fulfill(id: string, actor: Actor): Promise<DistribusiDTO> {
    const petugas = (await stockDal.findPegawaiNama(actor.pegawaiId))?.namaLengkap ?? "Petugas Gudang";
    const updated = await transaction(async (tx) => {
      const r = await distribusiDal.findById(id, tx);
      if (!r) throw Errors.notFound("Permintaan distribusi tidak ditemukan");
      if (r.status === "Selesai") throw Errors.conflict("Permintaan sudah diproses");
      if (r.status === "Dibatalkan") throw Errors.conflict("Permintaan sudah dibatalkan");

      const ctx = { petugas, actorId: actor.userId, refType: "DST", refNo: r.noDokumen, refId: r.id };
      for (const l of r.items) {
        await stockDal.releaseReserve({ itemJenis: l.itemJenis, itemId: l.itemId, locationId: r.fromLocationId }, l.qtyMinta, tx);
        await movementService.postMovement(
          { jenis: "TRANSFER", itemJenis: l.itemJenis, itemId: l.itemId, fromLocationId: r.fromLocationId, toLocationId: r.toLocationId, qty: l.qtyMinta },
          ctx, tx,
        );
        await distribusiDal.setItemKeluar(l.id, l.qtyMinta, tx);
      }
      await distribusiDal.updateHeader(r.id, { status: "Selesai", petugas, postedAt: new Date() }, tx);
      return distribusiDal.findById(r.id, tx);
    });
    const [dto] = await enrichMany([updated as DistribusiEntity]);
    return dto;
  }

  /** Batalkan draft: lepas reservasi → Dibatalkan. */
  async function cancel(id: string, _actor: Actor): Promise<DistribusiDTO> {
    const updated = await transaction(async (tx) => {
      const r = await distribusiDal.findById(id, tx);
      if (!r) throw Errors.notFound("Permintaan distribusi tidak ditemukan");
      if (r.status === "Selesai") throw Errors.conflict("Permintaan sudah diproses — tak bisa dibatalkan");
      if (r.status === "Dibatalkan") return r;
      for (const l of r.items) {
        await stockDal.releaseReserve({ itemJenis: l.itemJenis, itemId: l.itemId, locationId: r.fromLocationId }, l.qtyMinta, tx);
      }
      await distribusiDal.updateHeader(r.id, { status: "Dibatalkan" }, tx);
      return distribusiDal.findById(r.id, tx);
    });
    const [dto] = await enrichMany([updated as DistribusiEntity]);
    return dto;
  }

  return { list, get, create, fulfill, cancel };
}

export const distribusiService = makeDistribusiService();
