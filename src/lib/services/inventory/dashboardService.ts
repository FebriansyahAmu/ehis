// dashboardService — agregat read-only Inventory: Beranda (`overview`) + Monitoring (`monitoring`).
// Saldo (proyeksi) di-join snapshot katalog master → nilai stok, reorder, kedaluwarsa (FEFO), movers,
// pergerakan terkini. ACTOR-LESS (read murni) → boleh dipanggil langsung di Server Component.

import * as defaultDal from "@/lib/dal/inventory/stockDal";
import type {
  InvBerandaDTO, InvMonitoringDTO, StokStatus, InvStockAlertRow, InvExpiringRow,
} from "@/lib/schemas/inventory/dashboard";

type Dal = typeof defaultDal;
const DAY = 86_400_000;
const ALERT = new Set<StokStatus>(["Habis", "Kritis", "Rendah"]);

function stokStatus(qty: number, reorderPoint: number, max: number): StokStatus {
  if (qty <= 0) return "Habis";
  if (qty <= reorderPoint * 0.5) return "Kritis";
  if (qty <= reorderPoint) return "Rendah";
  if (qty >= max * 0.95) return "Berlebih";
  return "Aman";
}
function sev(s: StokStatus): number {
  return s === "Habis" ? 0 : s === "Kritis" ? 1 : 2;
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface ItemSnap { kode: string; nama: string; kategori: string; satuan: string; harga: number }

export function makeDashboardService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function loadItems(obatIds: string[], bmhpIds: string[]): Promise<Map<string, ItemSnap>> {
    const [obat, bmhp] = await Promise.all([dal.findObatByIds(obatIds), dal.findBmhpByIds(bmhpIds)]);
    const m = new Map<string, ItemSnap>();
    for (const o of obat) m.set(`Obat:${o.id}`, { kode: o.kode, nama: o.namaGenerik, kategori: o.kategori, satuan: o.satuanTerkecil ?? "—", harga: o.hargaSatuan });
    for (const b of bmhp) m.set(`BMHP:${b.id}`, { kode: b.kode, nama: b.nama, kategori: b.kategori, satuan: b.satuan, harga: b.hargaSatuan });
    return m;
  }

  async function overview(): Promise<InvBerandaDTO> {
    const cutoff = new Date(Date.now() + 90 * DAY);
    const [balances, batches, recent] = await Promise.all([
      dal.listAllBalances(),
      dal.listExpiringBatches(cutoff),
      dal.listRecentMovements(6),
    ]);

    const obatIds = new Set<string>(), bmhpIds = new Set<string>(), locIds = new Set<string>();
    const collect = (j: string, id: string) => (j === "Obat" ? obatIds : bmhpIds).add(id);
    for (const b of balances) { collect(b.itemJenis, b.itemId); locIds.add(b.locationId); }
    for (const b of batches) { collect(b.itemJenis, b.itemId); locIds.add(b.locationId); }
    for (const m of recent) collect(m.itemJenis, m.itemId);
    const [items, locs] = await Promise.all([loadItems([...obatIds], [...bmhpIds]), dal.findLocationNames([...locIds])]);
    const lName = new Map(locs.map((l) => [l.id, l.nama]));

    let nilai = 0;
    const lowStock: InvStockAlertRow[] = [];
    for (const b of balances) {
      const it = items.get(`${b.itemJenis}:${b.itemId}`);
      if (!it) continue;
      nilai += b.qtyOnHand * it.harga;
      const status = stokStatus(b.qtyOnHand, b.reorderPoint, b.max);
      if (ALERT.has(status)) {
        lowStock.push({ itemJenis: b.itemJenis, itemId: b.itemId, nama: it.nama, satuan: it.satuan, locationNama: lName.get(b.locationId) ?? b.locationId, qty: b.qtyOnHand, reorderPoint: b.reorderPoint, status });
      }
    }
    lowStock.sort((a, z) => sev(a.status) - sev(z.status));

    const expiring: InvExpiringRow[] = batches.map((b) => {
      const it = items.get(`${b.itemJenis}:${b.itemId}`);
      return { id: b.id, itemId: b.itemId, nama: it?.nama ?? "—", satuan: it?.satuan ?? "—", batchNo: b.batchNo, locationNama: lName.get(b.locationId) ?? b.locationId, qty: b.qtyOnHand, expiryDate: b.expiryDate ? isoDate(b.expiryDate) : "" };
    });
    const recentRows = recent.map((m) => {
      const it = items.get(`${m.itemJenis}:${m.itemId}`);
      return { id: m.id, jenis: m.jenis, itemId: m.itemId, nama: it?.nama ?? "—", refNo: m.refNo, qty: m.qty, waktu: m.createdAt.toISOString() };
    });

    const skuSet = new Set(balances.map((b) => `${b.itemJenis}:${b.itemId}`));
    return { kpi: { sku: skuSet.size, nilai, reorder: lowStock.length, expiring: expiring.length }, lowStock: lowStock.slice(0, 7), expiring: expiring.slice(0, 6), recent: recentRows };
  }

  async function monitoring(): Promise<InvMonitoringDTO> {
    const cutoff = new Date(Date.now() + 120 * DAY);
    const [balances, batches, moversRaw] = await Promise.all([
      dal.listAllBalances(),
      dal.listExpiringBatches(cutoff),
      dal.topMovers(6),
    ]);

    const obatIds = new Set<string>(), bmhpIds = new Set<string>(), locIds = new Set<string>();
    const collect = (j: string, id: string) => (j === "Obat" ? obatIds : bmhpIds).add(id);
    for (const b of balances) { collect(b.itemJenis, b.itemId); locIds.add(b.locationId); }
    for (const b of batches) { collect(b.itemJenis, b.itemId); locIds.add(b.locationId); }
    for (const m of moversRaw) collect(m.itemJenis, m.itemId);
    const [items, locs] = await Promise.all([loadItems([...obatIds], [...bmhpIds]), dal.findLocationNames([...locIds])]);
    const lName = new Map(locs.map((l) => [l.id, l.nama]));

    let nilaiTotal = 0, habis = 0;
    const reorder: InvStockAlertRow[] = [];
    const locVal = new Map<string, number>();
    for (const b of balances) {
      const it = items.get(`${b.itemJenis}:${b.itemId}`);
      if (!it) continue;
      const val = b.qtyOnHand * it.harga;
      nilaiTotal += val;
      locVal.set(b.locationId, (locVal.get(b.locationId) ?? 0) + val);
      if (b.qtyOnHand <= 0) habis++;
      const status = stokStatus(b.qtyOnHand, b.reorderPoint, b.max);
      if (ALERT.has(status)) {
        reorder.push({ itemJenis: b.itemJenis, itemId: b.itemId, nama: it.nama, satuan: it.satuan, locationNama: lName.get(b.locationId) ?? b.locationId, qty: b.qtyOnHand, reorderPoint: b.reorderPoint, status });
      }
    }
    reorder.sort((a, z) => sev(a.status) - sev(z.status));

    const expiry: InvExpiringRow[] = batches.map((b) => {
      const it = items.get(`${b.itemJenis}:${b.itemId}`);
      return { id: b.id, itemId: b.itemId, nama: it?.nama ?? "—", satuan: it?.satuan ?? "—", batchNo: b.batchNo, locationNama: lName.get(b.locationId) ?? b.locationId, qty: b.qtyOnHand, expiryDate: b.expiryDate ? isoDate(b.expiryDate) : "" };
    });
    const valueByLocation = [...locVal.entries()]
      .map(([locationId, nilai]) => ({ locationId, locationNama: lName.get(locationId) ?? locationId, nilai }))
      .sort((a, z) => z.nilai - a.nilai);
    const movers = moversRaw.map((m) => {
      const it = items.get(`${m.itemJenis}:${m.itemId}`);
      return { itemJenis: m.itemJenis, itemId: m.itemId, nama: it?.nama ?? "—", kategori: it?.kategori ?? "—", satuan: it?.satuan ?? "—", qty: m._sum.qty ?? 0 };
    });

    return { kpi: { nilaiTotal, reorder: reorder.length, expiring: expiry.length, habis }, reorder, expiry, valueByLocation, movers };
  }

  return { overview, monitoring };
}

export const dashboardService = makeDashboardService();
