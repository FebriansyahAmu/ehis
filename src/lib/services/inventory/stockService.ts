// stockService — read Daftar Barang + detail item. Saldo (proyeksi) di-join ke katalog master
// (Obat/Bmhp, cross-schema soft-ref) → DTO siap-tampil. ACTOR-LESS (read murni) → Server Component
// boleh panggil langsung (SSR hybrid, API-RULES §6.1).

import * as defaultDal from "@/lib/dal/inventory/stockDal";
import { transaction } from "@/lib/db/prisma";
import { movementService } from "@/lib/services/inventory/movementService";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  InvLocationDTO, InvStockRowDTO, InvItemDetailDTO, InvItemJenis,
  SetStockPolicyInput, StockPolicyDTO, AdjustStockInput, AdjustStockResultDTO,
  StokKlinisRow, StokKlinisStatus,
} from "@/lib/schemas/inventory/stock";

type Dal = typeof defaultDal;

function stokKlinisStatus(qty: number, rop: number): StokKlinisStatus {
  if (qty <= 0) return "Habis";
  if (qty <= rop) return "Menipis";
  return "Aman";
}

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

  /** Atur kebijakan reorder (min/ROP/max) untuk item di lokasi (saldo harus sudah ada). */
  async function setPolicy(input: SetStockPolicyInput): Promise<StockPolicyDTO> {
    const ref = { itemJenis: input.itemJenis, itemId: input.itemId, locationId: input.locationId };
    const existing = await dal.getBalance(ref);
    if (!existing) throw Errors.notFound("Item belum punya saldo di lokasi ini");
    await dal.setBalancePolicy(ref, { min: input.min, max: input.max, reorderPoint: input.reorderPoint });
    return { ...ref, min: input.min, reorderPoint: input.reorderPoint, max: input.max };
  }

  /** Penyesuaian cepat 1 item (ADJUST) — set ke jumlah / ±selisih, dengan alasan. Tulis 1 movement. */
  async function adjust(input: AdjustStockInput, actor: Actor): Promise<AdjustStockResultDTO> {
    const ref = { itemJenis: input.itemJenis, itemId: input.itemId, locationId: input.locationId };
    const existing = await dal.getBalance(ref);
    if (!existing) throw Errors.notFound("Item belum punya saldo di lokasi ini");
    const before = existing.qtyOnHand;
    const delta = input.mode === "set" ? input.value - before : input.value;
    if (delta === 0) throw Errors.validation("Tidak ada perubahan stok");
    const after = before + delta;
    if (after < 0) throw Errors.validation("Penyesuaian membuat stok menjadi negatif");

    const petugas = (await dal.findPegawaiNama(actor.pegawaiId))?.namaLengkap ?? "Petugas Gudang";
    const alasan = input.catatan ? `${input.alasan} — ${input.catatan}` : input.alasan;
    await transaction(async (tx) => {
      await movementService.postMovement(
        { jenis: "ADJUST", itemJenis: input.itemJenis, itemId: input.itemId, fromLocationId: input.locationId, qty: delta },
        { petugas, actorId: actor.userId, refType: "ADJ", alasan },
        tx,
      );
    });
    return { ...ref, qtyBefore: before, qtyAfter: after, delta };
  }

  /** Overlay stok klinis: saldo Obat di satu depo + ED terdekat, keyed by itemId. Advisory (read murni). */
  async function listStokKlinis(lokasiId: string): Promise<StokKlinisRow[]> {
    const [balances, batches] = await Promise.all([
      dal.listBalancesByLocation(lokasiId),
      dal.listBatchesByLocation(lokasiId),
    ]);
    const edByItem = new Map<string, string>(); // itemId → ED terdekat (YYYY-MM-DD)
    for (const b of batches) {
      if (b.itemJenis !== "Obat" || !b.expiryDate) continue;
      const iso = b.expiryDate.toISOString().slice(0, 10);
      const cur = edByItem.get(b.itemId);
      if (!cur || iso < cur) edByItem.set(b.itemId, iso);
    }
    return balances
      .filter((b) => b.itemJenis === "Obat")
      .map((b) => ({
        itemId: b.itemId,
        qtyOnHand: b.qtyOnHand,
        qtyReserved: b.qtyReserved,
        available: Math.max(0, b.qtyOnHand - b.qtyReserved),
        reorderPoint: b.reorderPoint,
        status: stokKlinisStatus(b.qtyOnHand, b.reorderPoint),
        nearestED: edByItem.get(b.itemId) ?? null,
      }));
  }

  return { listLocations, listStock, itemDetail, setPolicy, adjust, listStokKlinis };
}

export const stockService = makeStockService();
