// opnameService — Inventory Stok Opname. `create` = snapshot saldo lokasi (qtySistem) status
// Counting. `saveCounts` = simpan qtyFisik/alasan (Counting↔Review). `post` = movement OPNAME per
// selisih (qtyFisik − qtySistem snapshot) via movementService dalam SATU transaksi → Posted (idempoten).

import { transaction } from "@/lib/db/prisma";
import * as opnameDal from "@/lib/dal/inventory/opnameDal";
import * as stockDal from "@/lib/dal/inventory/stockDal";
import { movementService } from "@/lib/services/inventory/movementService";
import { nextDocNo } from "@/lib/services/inventory/docNo";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { OpnameEntity, OpnameStatus, OpnameLineData } from "@/lib/dal/inventory/opnameDal";
import type {
  CreateOpnameInput, SaveOpnameCountsInput, OpnameQuery, OpnameDTO,
} from "@/lib/schemas/inventory/opname";

const nu = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function enrichMany(rows: OpnameEntity[]): Promise<OpnameDTO[]> {
  const locIds = [...new Set(rows.map((r) => r.locationId))];
  const obatIds = [...new Set(rows.flatMap((r) => r.items).filter((i) => i.itemJenis === "Obat").map((i) => i.itemId))];
  const bmhpIds = [...new Set(rows.flatMap((r) => r.items).filter((i) => i.itemJenis === "BMHP").map((i) => i.itemId))];

  const [locs, obat, bmhp] = await Promise.all([
    stockDal.findLocationNames(locIds),
    stockDal.findObatByIds(obatIds),
    stockDal.findBmhpByIds(bmhpIds),
  ]);
  const lMap = new Map(locs.map((l) => [l.id, l.nama]));
  const oMap = new Map(obat.map((o) => [o.id, { kode: o.kode, nama: o.namaGenerik, satuan: o.satuanTerkecil ?? "—" }]));
  const bMap = new Map(bmhp.map((b) => [b.id, { kode: b.kode, nama: b.nama, satuan: b.satuan }]));

  return rows.map((r) => ({
    id: r.id,
    noDokumen: r.noDokumen,
    tanggal: isoDate(r.tanggal),
    locationId: r.locationId,
    locationNama: lMap.get(r.locationId) ?? r.locationId,
    status: r.status as OpnameStatus,
    petugas: r.petugas,
    lines: r.items.map((l) => {
      const m = l.itemJenis === "Obat" ? oMap.get(l.itemId) : bMap.get(l.itemId);
      return {
        id: l.id,
        itemJenis: l.itemJenis as "Obat" | "BMHP",
        itemId: l.itemId,
        nama: m?.nama ?? "(item dihapus)",
        kode: m?.kode ?? "—",
        satuan: m?.satuan ?? "—",
        qtySistem: l.qtySistem,
        qtyFisik: l.qtyFisik,
        alasan: nu(l.alasan),
      };
    }),
  }));
}

/** Status turunan: semua baris terhitung → Review; ada yang kosong → Counting. */
function deriveStatus(items: { qtyFisik: number | null }[]): OpnameStatus {
  return items.length > 0 && items.every((i) => i.qtyFisik !== null) ? "Review" : "Counting";
}

export function makeOpnameService() {
  async function list(query: OpnameQuery): Promise<{ items: OpnameDTO[]; cursor: string | null }> {
    const limit = query.limit ?? 50;
    const status = query.status && query.status !== "Semua" ? query.status : undefined;
    const rows = await opnameDal.list({ status, locationId: query.locationId, cursorId: query.cursor, limit: limit + 1 });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { items: await enrichMany(page), cursor: hasMore ? page[page.length - 1].id : null };
  }

  async function get(id: string): Promise<OpnameDTO> {
    const r = await opnameDal.findById(id);
    if (!r) throw Errors.notFound("Sesi opname tidak ditemukan");
    const [dto] = await enrichMany([r]);
    return dto;
  }

  /** Mulai sesi: snapshot saldo lokasi (qtySistem). qtyFisik null = belum dihitung. */
  async function create(input: CreateOpnameInput, actor: Actor): Promise<OpnameDTO> {
    const farmasi = new Set((await stockDal.listFarmasiLocations()).map((l) => l.id));
    if (!farmasi.has(input.locationId)) throw Errors.validation("Lokasi harus depo/gudang farmasi");
    const balances = await stockDal.listBalancesByLocation(input.locationId);
    if (balances.length === 0) throw Errors.validation("Lokasi belum memiliki stok untuk dihitung");
    const petugas = (await stockDal.findPegawaiNama(actor.pegawaiId))?.namaLengkap ?? "Petugas Gudang";

    const row = await transaction(async (tx) => {
      const noDokumen = await nextDocNo("OPN", tx);
      const lines: OpnameLineData[] = balances.map((b) => ({ itemJenis: b.itemJenis, itemId: b.itemId, qtySistem: b.qtyOnHand, qtyFisik: null }));
      return opnameDal.createSession(
        { noDokumen, tanggal: input.tanggal ? new Date(input.tanggal) : new Date(), locationId: input.locationId, status: "Counting" as OpnameStatus, petugas, actorId: actor.userId },
        lines, tx,
      );
    });
    const [dto] = await enrichMany([row]);
    return dto;
  }

  /** Simpan hitungan fisik per baris (hanya baris milik sesi). Tak boleh saat Posted. */
  async function saveCounts(id: string, input: SaveOpnameCountsInput, _actor: Actor): Promise<OpnameDTO> {
    const updated = await transaction(async (tx) => {
      const r = await opnameDal.findById(id, tx);
      if (!r) throw Errors.notFound("Sesi opname tidak ditemukan");
      if (r.status === "Posted") throw Errors.conflict("Sesi sudah diposting — tak bisa diubah");
      const owned = new Set(r.items.map((i) => i.id));
      for (const c of input.items) {
        if (!owned.has(c.itemRowId)) continue;
        await opnameDal.updateItem(c.itemRowId, { qtyFisik: c.qtyFisik, alasan: c.alasan ?? null }, tx);
      }
      const fresh = await opnameDal.findById(id, tx);
      await opnameDal.updateStatus(id, { status: deriveStatus(fresh!.items) }, tx);
      return opnameDal.findById(id, tx);
    });
    const [dto] = await enrichMany([updated as OpnameEntity]);
    return dto;
  }

  /** Posting: movement OPNAME per selisih (qtyFisik − qtySistem) → Posted. Wajib semua terhitung. */
  async function post(id: string, actor: Actor): Promise<OpnameDTO> {
    const updated = await transaction(async (tx) => {
      const r = await opnameDal.findById(id, tx);
      if (!r) throw Errors.notFound("Sesi opname tidak ditemukan");
      if (r.status === "Posted") throw Errors.conflict("Sesi sudah diposting");
      if (r.items.some((i) => i.qtyFisik === null)) throw Errors.conflict("Masih ada item belum dihitung");

      for (const l of r.items) {
        const delta = (l.qtyFisik as number) - l.qtySistem;
        if (delta === 0) continue;
        await movementService.postMovement(
          { jenis: "OPNAME", itemJenis: l.itemJenis, itemId: l.itemId, fromLocationId: r.locationId, qty: delta },
          { petugas: r.petugas, actorId: actor.userId, refType: "OPN", refNo: r.noDokumen, refId: r.id, alasan: l.alasan ?? "Penyesuaian stok opname" },
          tx,
        );
      }
      await opnameDal.updateStatus(r.id, { status: "Posted", postedAt: new Date() }, tx);
      return opnameDal.findById(r.id, tx);
    });
    const [dto] = await enrichMany([updated as OpnameEntity]);
    return dto;
  }

  return { list, get, create, saveCounts, post };
}

export const opnameService = makeOpnameService();
