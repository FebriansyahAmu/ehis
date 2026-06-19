// DTO — Inventory dashboard (Beranda overview + Monitoring). Read-only agregat lintas lokasi.
// Status stok & warna di-resolve di FE (helper mock STOK_STATUS_CFG); server kirim angka + status.

export type StokStatus = "Aman" | "Rendah" | "Kritis" | "Habis" | "Berlebih";

export interface InvStockAlertRow {
  itemJenis: "Obat" | "BMHP";
  itemId: string;
  nama: string;
  satuan: string;
  locationNama: string;
  qty: number;
  reorderPoint: number;
  status: StokStatus;
}

export interface InvExpiringRow {
  id: string;
  itemId: string;
  nama: string;
  satuan: string;
  batchNo: string;
  locationNama: string;
  qty: number;
  expiryDate: string; // YYYY-MM-DD
}

export interface InvMovementRow {
  id: string;
  jenis: "IN" | "OUT" | "TRANSFER" | "ADJUST" | "OPNAME";
  itemId: string;
  nama: string;
  refNo: string | null;
  qty: number;
  waktu: string; // ISO
}

export interface InvMoverRow {
  itemJenis: "Obat" | "BMHP";
  itemId: string;
  nama: string;
  kategori: string;
  satuan: string;
  qty: number;
}

export interface InvLocationValueRow {
  locationId: string;
  locationNama: string;
  nilai: number;
}

// ── Beranda overview ──
export interface InvBerandaDTO {
  kpi: { sku: number; nilai: number; reorder: number; expiring: number };
  lowStock: InvStockAlertRow[];
  expiring: InvExpiringRow[];
  recent: InvMovementRow[];
}

// ── Monitoring ──
export interface InvMonitoringDTO {
  kpi: { nilaiTotal: number; reorder: number; expiring: number; habis: number };
  reorder: InvStockAlertRow[];
  expiry: InvExpiringRow[];
  valueByLocation: InvLocationValueRow[];
  movers: InvMoverRow[];
}
