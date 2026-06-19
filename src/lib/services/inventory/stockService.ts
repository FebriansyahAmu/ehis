// stockService — read Daftar Barang + detail item. Saldo (proyeksi) di-join ke katalog master
// (Obat/Bmhp, cross-schema soft-ref) → DTO siap-tampil. ACTOR-LESS (read murni) → Server Component
// boleh panggil langsung (SSR hybrid, API-RULES §6.1).

import * as defaultDal from "@/lib/dal/inventory/stockDal";
import { Errors } from "@/lib/errors/appError";
import type {
  InvLocationDTO, InvStockRowDTO, InvItemDetailDTO, InvItemJenis,
} from "@/lib/schemas/inventory/stock";

type Dal = typeof defaultDal;

function tipeFromLocType(t: string): "Gudang" | "Depo" | "Unit" {
  if (t === "Gudang_Farmasi") return "Gudang";
  if (t === "Farmasi") return "Depo";
  return "Unit";
}

export function makeStockService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Lokasi farmasi (Depo/Gudang) — pilihan dropdown Daftar Barang. */
  async function listLocations(): Promise<InvLocationDTO[]> {
    const rows = await dal.listFarmasiLocations();
    return rows.map((r) => ({ id: r.id, kode: r.kode, nama: r.nama, tipe: tipeFromLocType(r.locationType) }));
  }

  /** Saldo per item di satu lokasi + snapshot katalog → baris Daftar Barang. */
  async function listStock(locationId: string): Promise<InvStockRowDTO[]> {
    const balances = await dal.listBalancesByLocation(locationId);
    const obatIds = balances.filter((b) => b.itemJenis === "Obat").map((b) => b.itemId);
    const bmhpIds = balances.filter((b) => b.itemJenis === "BMHP").map((b) => b.itemId);
    const [obat, bmhp] = await Promise.all([dal.findObatByIds(obatIds), dal.findBmhpByIds(bmhpIds)]);
    const obatMap = new Map(obat.map((o) => [o.id, o]));
    const bmhpMap = new Map(bmhp.map((b) => [b.id, b]));

    const out: InvStockRowDTO[] = [];
    for (const b of balances) {
      if (b.itemJenis === "Obat") {
        const o = obatMap.get(b.itemId);
        if (!o) continue; // katalog terhapus → lewati
        out.push({
          itemJenis: "Obat", itemId: b.itemId, kode: o.kode, nama: o.namaGenerik, kategori: o.kategori,
          satuan: o.satuanTerkecil ?? "—", isHAM: o.isHAM, hargaSatuan: o.hargaSatuan,
          qty: b.qtyOnHand, qtyReserved: b.qtyReserved, min: b.min, max: b.max, reorderPoint: b.reorderPoint,
        });
      } else {
        const m = bmhpMap.get(b.itemId);
        if (!m) continue;
        out.push({
          itemJenis: "BMHP", itemId: b.itemId, kode: m.kode, nama: m.nama, kategori: m.kategori,
          satuan: m.satuan, isSteril: m.isSteril, hargaSatuan: m.hargaSatuan,
          qty: b.qtyOnHand, qtyReserved: b.qtyReserved, min: b.min, max: b.max, reorderPoint: b.reorderPoint,
        });
      }
    }
    out.sort((a, z) => a.nama.localeCompare(z.nama));
    return out;
  }

  /** Detail satu item: saldo lintas-lokasi + batch (FEFO) + pergerakan terkini. */
  async function itemDetail(jenis: InvItemJenis, itemId: string): Promise<InvItemDetailDTO> {
    const ref = { itemJenis: jenis, itemId };
    const [balances, batches, movements] = await Promise.all([
      dal.listBalancesByItem(ref),
      dal.listBatchesByItem(ref),
      dal.listRecentMovementsByItem(ref, 8),
    ]);

    let kode = "", nama = "", kategori = "", satuan = "—", hargaSatuan = 0;
    let isHAM: boolean | undefined;
    let isSteril: boolean | undefined;
    if (jenis === "Obat") {
      const [o] = await dal.findObatByIds([itemId]);
      if (!o) throw Errors.notFound("Obat tidak ditemukan");
      kode = o.kode; nama = o.namaGenerik; kategori = o.kategori; satuan = o.satuanTerkecil ?? "—"; hargaSatuan = o.hargaSatuan; isHAM = o.isHAM;
    } else {
      const [m] = await dal.findBmhpByIds([itemId]);
      if (!m) throw Errors.notFound("BMHP tidak ditemukan");
      kode = m.kode; nama = m.nama; kategori = m.kategori; satuan = m.satuan; hargaSatuan = m.hargaSatuan; isSteril = m.isSteril;
    }

    const locIds = Array.from(new Set([...balances.map((b) => b.locationId), ...batches.map((b) => b.locationId)]));
    const locs = await dal.findLocationNames(locIds);
    const locName = new Map(locs.map((l) => [l.id, l.nama]));

    return {
      itemJenis: jenis, itemId, kode, nama, kategori, satuan, isHAM, isSteril, hargaSatuan,
      balances: balances.map((b) => ({
        locationId: b.locationId, locationNama: locName.get(b.locationId) ?? b.locationId,
        qty: b.qtyOnHand, min: b.min, max: b.max, reorderPoint: b.reorderPoint,
      })),
      batches: batches.map((b) => ({
        id: b.id, batchNo: b.batchNo, locationNama: locName.get(b.locationId) ?? b.locationId,
        qty: b.qtyOnHand, expiryDate: b.expiryDate ? b.expiryDate.toISOString().slice(0, 10) : null,
      })),
      movements: movements.map((m) => ({
        id: m.id, jenis: m.jenis, refNo: m.refNo, qty: m.qty, waktu: m.createdAt.toISOString(),
      })),
    };
  }

  return { listLocations, listStock, itemDetail };
}

export const stockService = makeStockService();
