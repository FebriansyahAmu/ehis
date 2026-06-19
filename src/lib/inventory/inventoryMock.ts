/**
 * EHIS Inventory (Logistik) — TIPE + MOCK DATA (FE-first).
 *
 * Layer stok operasional di atas master Obat+BMHP. Schema 1:1 dengan target Prisma
 * schema `inventory` (lihat TODO-INVENTORY.md §4). Mock-first → swap: saat backend siap,
 * data pindah ke DB (diakses via `@/lib/api/inventory/*`), tipe dipertahankan.
 *
 * Prinsip: movement-ledger = source of truth; saldo (StockBalance) = proyeksi. Di FE mock,
 * saldo disimpan langsung untuk kesederhanaan; helper menghitung status & nilai.
 */

// ── Enum / Union ──────────────────────────────────────────

export type ItemJenis = "Obat" | "BMHP";
export type LokasiTipe = "Gudang" | "Depo" | "Unit";
export type StokStatus = "Aman" | "Rendah" | "Kritis" | "Habis" | "Berlebih";
export type MovementJenis = "IN" | "OUT" | "TRANSFER" | "ADJUST" | "OPNAME";
export type DocStatus = "Draft" | "Diproses" | "Selesai" | "Dibatalkan";
export type OpnameStatus = "Draft" | "Counting" | "Review" | "Posted";
export type VendorJenis = "PBF" | "Distributor" | "Manufaktur";

// ── Entities ──────────────────────────────────────────────

export interface InventoryLocation {
  id: string;
  kode: string;
  nama: string;
  tipe: LokasiTipe;
}

export interface InventoryItem {
  id: string;
  /** SKU internal */
  kode: string;
  jenis: ItemJenis;
  /** Referensi katalog master (obatId / bmhpId) */
  catalogId: string;
  nama: string;
  kategori: string;
  satuan: string;
  /** Flag penanganan (HAM untuk obat, steril untuk BMHP) */
  isHAM?: boolean;
  isSteril?: boolean;
  /** Harga jual snapshot (rupiah) — untuk nilai stok */
  hargaSatuan: number;
}

export interface StockBalance {
  itemId: string;
  locationId: string;
  qty: number;
  min: number;
  max: number;
  reorderPoint: number;
}

export interface StockBatch {
  id: string;
  itemId: string;
  locationId: string;
  batchNo: string;
  /** ISO date */
  expiryDate: string;
  qty: number;
}

export interface StockMovement {
  id: string;
  /** ISO datetime */
  waktu: string;
  jenis: MovementJenis;
  itemId: string;
  fromLocationId?: string;
  toLocationId?: string;
  qty: number;
  batchNo?: string;
  refType?: string;
  refNo?: string;
  alasan?: string;
  petugas: string;
}

export interface Vendor {
  id: string;
  kode: string;
  nama: string;
  jenis: VendorJenis;
  izinPbf?: string;
  kontakNama: string;
  telp: string;
  email?: string;
  alamat: string;
  leadTimeHari: number;
  status: "Aktif" | "Non_Aktif";
}

export interface GoodsReceiptLine {
  itemId: string;
  batchNo: string;
  expiryDate: string;
  qty: number;
  hargaBeli: number;
}
export interface GoodsReceipt {
  id: string;
  noDokumen: string;
  tanggal: string;
  vendorId: string;
  noSuratJalan?: string;
  noPO?: string;
  toLocationId: string;
  status: DocStatus;
  lines: GoodsReceiptLine[];
  petugas: string;
}

export interface TransferLine {
  itemId: string;
  batchNo?: string;
  qty: number;
}
export interface StockTransfer {
  id: string;
  noDokumen: string;
  tanggal: string;
  fromLocationId: string;
  toLocationId: string;
  status: DocStatus;
  lines: TransferLine[];
  petugas: string;
}

export interface DistribusiLine {
  itemId: string;
  qtyMinta: number;
  qtyKeluar: number;
}
export interface DistribusiRequest {
  id: string;
  noDokumen: string;
  tanggal: string;
  /** Unit peminta */
  fromLocationId: string; // gudang/depo sumber
  toLocationId: string; // unit tujuan
  status: DocStatus;
  lines: DistribusiLine[];
  pemohon: string;
  petugas?: string;
}

export interface OpnameLine {
  itemId: string;
  qtySistem: number;
  qtyFisik: number | null;
  alasan?: string;
}
export interface OpnameSession {
  id: string;
  noDokumen: string;
  tanggal: string;
  locationId: string;
  status: OpnameStatus;
  lines: OpnameLine[];
  petugas: string;
}

// ── Status config (palet TANPA ungu) ──────────────────────

export const STOK_STATUS_CFG: Record<
  StokStatus,
  { label: string; bg: string; text: string; dot: string; ring: string }
> = {
  Aman:     { label: "Aman",       bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  Rendah:   { label: "Rendah",     bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   ring: "ring-amber-200" },
  Kritis:   { label: "Kritis",     bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500",  ring: "ring-orange-200" },
  Habis:    { label: "Habis",      bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500",    ring: "ring-rose-200" },
  Berlebih: { label: "Berlebih",   bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500",     ring: "ring-sky-200" },
};

export const MOVEMENT_CFG: Record<
  MovementJenis,
  { label: string; bg: string; text: string; sign: "+" | "-" | "±" }
> = {
  IN:       { label: "Masuk",     bg: "bg-emerald-50", text: "text-emerald-700", sign: "+" },
  OUT:      { label: "Keluar",    bg: "bg-rose-50",    text: "text-rose-700",    sign: "-" },
  TRANSFER: { label: "Transfer",  bg: "bg-cyan-50",    text: "text-cyan-700",    sign: "±" },
  ADJUST:   { label: "Penyesuaian", bg: "bg-amber-50", text: "text-amber-700",   sign: "±" },
  OPNAME:   { label: "Opname",    bg: "bg-slate-100",  text: "text-slate-700",   sign: "±" },
};

export const DOC_STATUS_CFG: Record<
  DocStatus | OpnameStatus,
  { label: string; bg: string; text: string }
> = {
  Draft:      { label: "Draft",      bg: "bg-slate-100",  text: "text-slate-600" },
  Diproses:   { label: "Diproses",   bg: "bg-amber-50",   text: "text-amber-700" },
  Selesai:    { label: "Selesai",    bg: "bg-emerald-50", text: "text-emerald-700" },
  Dibatalkan: { label: "Dibatalkan", bg: "bg-rose-50",    text: "text-rose-700" },
  Counting:   { label: "Penghitungan", bg: "bg-cyan-50",  text: "text-cyan-700" },
  Review:     { label: "Review",     bg: "bg-amber-50",   text: "text-amber-700" },
  Posted:     { label: "Diposting",  bg: "bg-emerald-50", text: "text-emerald-700" },
};

// ── Helpers ───────────────────────────────────────────────

export function stokStatus(b: StockBalance): StokStatus {
  if (b.qty <= 0) return "Habis";
  if (b.qty <= b.reorderPoint * 0.5) return "Kritis";
  if (b.qty <= b.reorderPoint) return "Rendah";
  if (b.qty >= b.max * 0.95) return "Berlebih";
  return "Aman";
}

export function fmtIDR(n: number | undefined | null): string {
  if (!n || n <= 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function fmtIDRcompact(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n}`;
}

/** Hari menuju kedaluwarsa (negatif = sudah ED). */
export function daysToExpiry(iso: string, now: Date = new Date()): number {
  const ms = new Date(iso).getTime() - now.getTime();
  return Math.ceil(ms / 86_400_000);
}

export function itemInitials(nama: string): string {
  const parts = nama.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ── Mock Data ─────────────────────────────────────────────

export const INV_LOCATIONS: InventoryLocation[] = [
  { id: "loc-gd", kode: "GD-PUSAT", nama: "Gudang Farmasi Pusat", tipe: "Gudang" },
  { id: "loc-igd", kode: "DEPO-IGD", nama: "Depo IGD", tipe: "Depo" },
  { id: "loc-ri", kode: "APO-RI", nama: "Apotek Rawat Inap", tipe: "Depo" },
  { id: "loc-rj", kode: "APO-RJ", nama: "Apotek Rawat Jalan", tipe: "Depo" },
  { id: "loc-ok", kode: "DEPO-OK", nama: "Depo Kamar Operasi", tipe: "Unit" },
];

export const INV_ITEMS: InventoryItem[] = [
  // Obat
  { id: "it-amox", kode: "SKU-OBT-001", jenis: "Obat", catalogId: "obt-001", nama: "Amoxicillin-Clav 625 mg", kategori: "Antibiotik", satuan: "Tablet", hargaSatuan: 8500 },
  { id: "it-cef", kode: "SKU-OBT-002", jenis: "Obat", catalogId: "obt-002", nama: "Ceftriaxone 1 g", kategori: "Antibiotik", satuan: "Vial", hargaSatuan: 38000 },
  { id: "it-pcm", kode: "SKU-OBT-003", jenis: "Obat", catalogId: "obt-010", nama: "Paracetamol 500 mg", kategori: "Analgesik", satuan: "Tablet", hargaSatuan: 850 },
  { id: "it-keto", kode: "SKU-OBT-004", jenis: "Obat", catalogId: "obt-012", nama: "Ketorolac 30 mg/ml", kategori: "Analgesik", satuan: "Ampul", hargaSatuan: 12500 },
  { id: "it-epi", kode: "SKU-OBT-005", jenis: "Obat", catalogId: "obt-020", nama: "Epinephrine 1 mg/ml", kategori: "Kardiovaskular", satuan: "Ampul", isHAM: true, hargaSatuan: 9500 },
  { id: "it-nor", kode: "SKU-OBT-006", jenis: "Obat", catalogId: "obt-021", nama: "Norepinephrine 4 mg/4ml", kategori: "Kardiovaskular", satuan: "Ampul", isHAM: true, hargaSatuan: 42000 },
  { id: "it-mid", kode: "SKU-OBT-007", jenis: "Obat", catalogId: "obt-030", nama: "Midazolam 5 mg/ml", kategori: "Neurologi", satuan: "Ampul", isHAM: true, hargaSatuan: 18000 },
  { id: "it-ns", kode: "SKU-OBT-008", jenis: "Obat", catalogId: "obt-040", nama: "NaCl 0,9% 500 ml", kategori: "Vitamin & Cairan", satuan: "Botol", hargaSatuan: 9500 },
  { id: "it-rl", kode: "SKU-OBT-009", jenis: "Obat", catalogId: "obt-041", nama: "Ringer Laktat 500 ml", kategori: "Vitamin & Cairan", satuan: "Botol", hargaSatuan: 11000 },
  { id: "it-omz", kode: "SKU-OBT-010", jenis: "Obat", catalogId: "obt-050", nama: "Omeprazole 40 mg", kategori: "Saluran Cerna", satuan: "Vial", hargaSatuan: 16500 },
  // BMHP
  { id: "it-sp3", kode: "SKU-BHP-001", jenis: "BMHP", catalogId: "bhp-spuit3", nama: "Spuit 3 cc", kategori: "Alat Suntik & Infus", satuan: "Pcs", isSteril: true, hargaSatuan: 1800 },
  { id: "it-ivc", kode: "SKU-BHP-002", jenis: "BMHP", catalogId: "bhp-ivcath", nama: "IV Catheter No. 20", kategori: "Kateter & Selang", satuan: "Pcs", isSteril: true, hargaSatuan: 8500 },
  { id: "it-inf", kode: "SKU-BHP-003", jenis: "BMHP", catalogId: "bhp-infusset", nama: "Infus Set Makro", kategori: "Alat Suntik & Infus", satuan: "Set", isSteril: true, hargaSatuan: 6500 },
  { id: "it-glv", kode: "SKU-BHP-004", jenis: "BMHP", catalogId: "bhp-handscoon", nama: "Handscoon Non-Steril M", kategori: "Sarung Tangan", satuan: "Box", hargaSatuan: 65000 },
  { id: "it-kasa", kode: "SKU-BHP-005", jenis: "BMHP", catalogId: "bhp-kasa", nama: "Kasa Steril 16x16", kategori: "Kasa & Pembalut", satuan: "Lembar", isSteril: true, hargaSatuan: 1200 },
  { id: "it-msk", kode: "SKU-BHP-006", jenis: "BMHP", catalogId: "bhp-masker", nama: "Masker Bedah 3-Ply", kategori: "APD", satuan: "Box", hargaSatuan: 35000 },
  { id: "it-fol", kode: "SKU-BHP-007", jenis: "BMHP", catalogId: "bhp-folley", nama: "Folley Catheter No. 16", kategori: "Kateter & Selang", satuan: "Pcs", isSteril: true, hargaSatuan: 14000 },
  { id: "it-ekg", kode: "SKU-BHP-008", jenis: "BMHP", catalogId: "bhp-elektroda", nama: "Elektroda EKG", kategori: "Alat Diagnostik Habis Pakai", satuan: "Pcs", hargaSatuan: 1500 },
];

// Saldo: tiap item di Gudang + sebagian depo. (itemId, locationId) → qty/min/max/reorder.
function bal(itemId: string, locationId: string, qty: number, min: number, max: number, rop: number): StockBalance {
  return { itemId, locationId, qty, min, max, reorderPoint: rop };
}

export const INV_BALANCES: StockBalance[] = [
  // Gudang Pusat (stok semua)
  bal("it-amox", "loc-gd", 1850, 300, 3000, 600),
  bal("it-cef", "loc-gd", 420, 100, 800, 200),
  bal("it-pcm", "loc-gd", 5200, 800, 8000, 1500),
  bal("it-keto", "loc-gd", 90, 80, 600, 160),     // Rendah
  bal("it-epi", "loc-gd", 38, 60, 400, 120),      // Kritis (HAM)
  bal("it-nor", "loc-gd", 145, 40, 300, 80),
  bal("it-mid", "loc-gd", 0, 30, 200, 60),        // Habis (HAM)
  bal("it-ns", "loc-gd", 2400, 400, 2500, 800),   // Berlebih
  bal("it-rl", "loc-gd", 1600, 400, 2500, 800),
  bal("it-omz", "loc-gd", 310, 80, 600, 160),
  bal("it-sp3", "loc-gd", 8200, 2000, 12000, 4000),
  bal("it-ivc", "loc-gd", 640, 500, 3000, 1000),  // Rendah
  bal("it-inf", "loc-gd", 1500, 300, 2000, 600),
  bal("it-glv", "loc-gd", 95, 40, 300, 80),
  bal("it-kasa", "loc-gd", 12000, 2000, 15000, 4000),
  bal("it-msk", "loc-gd", 60, 50, 400, 100),
  bal("it-fol", "loc-gd", 210, 60, 500, 120),
  bal("it-ekg", "loc-gd", 3400, 1000, 6000, 2000),
  // Depo IGD (emergency)
  bal("it-epi", "loc-igd", 12, 20, 80, 40),       // Kritis
  bal("it-nor", "loc-igd", 28, 10, 60, 20),
  bal("it-cef", "loc-igd", 35, 15, 80, 30),
  bal("it-ns", "loc-igd", 65, 20, 80, 40),
  bal("it-sp3", "loc-igd", 420, 100, 800, 200),
  bal("it-ivc", "loc-igd", 38, 50, 300, 100),     // Kritis
  bal("it-kasa", "loc-igd", 640, 150, 1000, 300),
  // Apotek RI
  bal("it-amox", "loc-ri", 340, 80, 600, 150),
  bal("it-pcm", "loc-ri", 1200, 200, 1500, 400),
  bal("it-omz", "loc-ri", 75, 40, 300, 80),       // Rendah
  bal("it-glv", "loc-ri", 22, 15, 120, 30),       // Rendah
  // Apotek RJ
  bal("it-amox", "loc-rj", 280, 60, 500, 120),
  bal("it-pcm", "loc-rj", 940, 150, 1200, 300),
  bal("it-msk", "loc-rj", 18, 20, 150, 40),       // Kritis
  // Depo OK
  bal("it-mid", "loc-ok", 14, 10, 60, 20),
  bal("it-keto", "loc-ok", 25, 15, 80, 30),
  bal("it-fol", "loc-ok", 48, 20, 150, 40),
];

export const INV_BATCHES: StockBatch[] = [
  { id: "bt-1", itemId: "it-amox", locationId: "loc-gd", batchNo: "AMX-2405", expiryDate: "2026-08-31", qty: 1850 },
  { id: "bt-2", itemId: "it-cef", locationId: "loc-gd", batchNo: "CFX-2406", expiryDate: "2026-07-15", qty: 420 },
  { id: "bt-3", itemId: "it-pcm", locationId: "loc-gd", batchNo: "PCM-2403", expiryDate: "2027-03-31", qty: 5200 },
  { id: "bt-4", itemId: "it-epi", locationId: "loc-gd", batchNo: "EPI-2312", expiryDate: "2026-07-05", qty: 38 },   // akan ED
  { id: "bt-5", itemId: "it-ns", locationId: "loc-gd", batchNo: "NS-2402", expiryDate: "2026-06-28", qty: 800 },    // segera ED
  { id: "bt-6", itemId: "it-omz", locationId: "loc-gd", batchNo: "OMZ-2404", expiryDate: "2026-09-30", qty: 310 },
  { id: "bt-7", itemId: "it-sp3", locationId: "loc-gd", batchNo: "SP3-2401", expiryDate: "2028-01-31", qty: 8200 },
  { id: "bt-8", itemId: "it-kasa", locationId: "loc-gd", batchNo: "KSA-2312", expiryDate: "2026-12-31", qty: 12000 },
  { id: "bt-9", itemId: "it-ivc", locationId: "loc-gd", batchNo: "IVC-2405", expiryDate: "2027-05-31", qty: 640 },
  { id: "bt-10", itemId: "it-cef", locationId: "loc-igd", batchNo: "CFX-2406", expiryDate: "2026-07-15", qty: 35 },
  { id: "bt-11", itemId: "it-epi", locationId: "loc-igd", batchNo: "EPI-2312", expiryDate: "2026-07-05", qty: 12 },
  { id: "bt-12", itemId: "it-amox", locationId: "loc-ri", batchNo: "AMX-2405", expiryDate: "2026-08-31", qty: 340 },
];

export const INV_MOVEMENTS: StockMovement[] = [
  { id: "mv-1", waktu: "2026-06-19T08:12:00", jenis: "IN", itemId: "it-amox", toLocationId: "loc-gd", qty: 1000, batchNo: "AMX-2405", refType: "GRN", refNo: "GRN-2606-014", petugas: "Apt. Ahmad Fauzi" },
  { id: "mv-2", waktu: "2026-06-19T09:40:00", jenis: "TRANSFER", itemId: "it-epi", fromLocationId: "loc-gd", toLocationId: "loc-igd", qty: 20, refType: "TRF", refNo: "TRF-2606-031", petugas: "Apt. Rina" },
  { id: "mv-3", waktu: "2026-06-19T10:05:00", jenis: "OUT", itemId: "it-pcm", fromLocationId: "loc-rj", qty: 60, refType: "DST", refNo: "DST-2606-088", alasan: "Permintaan Rawat Jalan", petugas: "Apt. Sari" },
  { id: "mv-4", waktu: "2026-06-18T14:22:00", jenis: "ADJUST", itemId: "it-msk", fromLocationId: "loc-rj", qty: -4, refType: "OPN", refNo: "OPN-2606-003", alasan: "Selisih opname (rusak)", petugas: "Apt. Sari" },
  { id: "mv-5", waktu: "2026-06-18T11:00:00", jenis: "IN", itemId: "it-ivc", toLocationId: "loc-gd", qty: 500, batchNo: "IVC-2405", refType: "GRN", refNo: "GRN-2606-013", petugas: "Apt. Ahmad Fauzi" },
  { id: "mv-6", waktu: "2026-06-18T13:30:00", jenis: "TRANSFER", itemId: "it-sp3", fromLocationId: "loc-gd", toLocationId: "loc-igd", qty: 200, refType: "TRF", refNo: "TRF-2606-030", petugas: "Apt. Rina" },
  { id: "mv-7", waktu: "2026-06-17T16:10:00", jenis: "OUT", itemId: "it-cef", fromLocationId: "loc-igd", qty: 8, refType: "DST", refNo: "DST-2606-085", alasan: "Pemakaian IGD", petugas: "Apt. Rina" },
  { id: "mv-8", waktu: "2026-06-17T09:15:00", jenis: "OPNAME", itemId: "it-glv", fromLocationId: "loc-ri", qty: -2, refType: "OPN", refNo: "OPN-2606-002", alasan: "Stok fisik < sistem", petugas: "Apt. Bagus" },
];

export const INV_VENDORS: Vendor[] = [
  { id: "vn-1", kode: "VND-001", nama: "PT Kimia Farma Trading & Distribution", jenis: "PBF", izinPbf: "PBF-3273-001", kontakNama: "Budi Hartono", telp: "022-7234110", email: "order@kftd.co.id", alamat: "Jl. Soekarno-Hatta No. 12, Bandung", leadTimeHari: 3, status: "Aktif" },
  { id: "vn-2", kode: "VND-002", nama: "PT Anugerah Pharmindo Lestari (APL)", jenis: "PBF", izinPbf: "PBF-3171-220", kontakNama: "Sinta Maharani", telp: "021-5849221", email: "cs@apl.co.id", alamat: "Jl. Daan Mogot KM 12, Jakarta Barat", leadTimeHari: 2, status: "Aktif" },
  { id: "vn-3", kode: "VND-003", nama: "PT Enseval Putera Megatrading", jenis: "Distributor", izinPbf: "PBF-3275-118", kontakNama: "Rudi Salim", telp: "021-4615555", email: "sales@enseval.com", alamat: "Jl. Pulo Lentut No. 10, Jakarta Timur", leadTimeHari: 4, status: "Aktif" },
  { id: "vn-4", kode: "VND-004", nama: "PT Sinar Roda Utama (Alkes)", jenis: "Distributor", kontakNama: "Maya Putri", telp: "031-7328890", email: "info@sinarroda.co.id", alamat: "Jl. Rungkut Industri No. 5, Surabaya", leadTimeHari: 5, status: "Aktif" },
  { id: "vn-5", kode: "VND-005", nama: "PT Otsuka Indonesia", jenis: "Manufaktur", kontakNama: "Hendra Wijaya", telp: "021-8970011", email: "order@otsuka.co.id", alamat: "Lawang, Malang", leadTimeHari: 7, status: "Non_Aktif" },
];

export const INV_RECEIPTS: GoodsReceipt[] = [
  { id: "gr-1", noDokumen: "GRN-2606-014", tanggal: "2026-06-19", vendorId: "vn-1", noSuratJalan: "SJ/KFTD/0619", noPO: "PO-2606-021", toLocationId: "loc-gd", status: "Selesai", petugas: "Apt. Ahmad Fauzi", lines: [
    { itemId: "it-amox", batchNo: "AMX-2405", expiryDate: "2026-08-31", qty: 1000, hargaBeli: 6200 },
    { itemId: "it-pcm", batchNo: "PCM-2403", expiryDate: "2027-03-31", qty: 2000, hargaBeli: 520 },
  ] },
  { id: "gr-2", noDokumen: "GRN-2606-015", tanggal: "2026-06-19", vendorId: "vn-4", noSuratJalan: "SJ/SRU/2210", toLocationId: "loc-gd", status: "Diproses", petugas: "Apt. Ahmad Fauzi", lines: [
    { itemId: "it-ivc", batchNo: "IVC-2406", expiryDate: "2027-06-30", qty: 1000, hargaBeli: 6000 },
    { itemId: "it-glv", batchNo: "GLV-2405", expiryDate: "2028-05-31", qty: 50, hargaBeli: 48000 },
  ] },
  { id: "gr-3", noDokumen: "GRN-2606-013", tanggal: "2026-06-18", vendorId: "vn-2", noSuratJalan: "SJ/APL/4410", noPO: "PO-2606-019", toLocationId: "loc-gd", status: "Selesai", petugas: "Apt. Ahmad Fauzi", lines: [
    { itemId: "it-cef", batchNo: "CFX-2406", expiryDate: "2026-07-15", qty: 300, hargaBeli: 29000 },
  ] },
];

export const INV_TRANSFERS: StockTransfer[] = [
  { id: "tf-1", noDokumen: "TRF-2606-031", tanggal: "2026-06-19", fromLocationId: "loc-gd", toLocationId: "loc-igd", status: "Selesai", petugas: "Apt. Rina", lines: [
    { itemId: "it-epi", batchNo: "EPI-2312", qty: 20 },
    { itemId: "it-sp3", qty: 200 },
  ] },
  { id: "tf-2", noDokumen: "TRF-2606-032", tanggal: "2026-06-19", fromLocationId: "loc-gd", toLocationId: "loc-ri", status: "Diproses", petugas: "Apt. Bagus", lines: [
    { itemId: "it-amox", qty: 200 },
    { itemId: "it-omz", qty: 60 },
  ] },
  { id: "tf-3", noDokumen: "TRF-2606-029", tanggal: "2026-06-17", fromLocationId: "loc-gd", toLocationId: "loc-ok", status: "Selesai", petugas: "Apt. Ika", lines: [
    { itemId: "it-mid", qty: 20 },
    { itemId: "it-keto", qty: 30 },
  ] },
];

export const INV_DISTRIBUSI: DistribusiRequest[] = [
  { id: "ds-1", noDokumen: "DST-2606-088", tanggal: "2026-06-19", fromLocationId: "loc-rj", toLocationId: "loc-rj", status: "Selesai", pemohon: "Poli Umum", petugas: "Apt. Sari", lines: [
    { itemId: "it-pcm", qtyMinta: 60, qtyKeluar: 60 },
  ] },
  { id: "ds-2", noDokumen: "DST-2606-089", tanggal: "2026-06-19", fromLocationId: "loc-igd", toLocationId: "loc-igd", status: "Diproses", pemohon: "Tim IGD Shift Pagi", lines: [
    { itemId: "it-epi", qtyMinta: 10, qtyKeluar: 0 },
    { itemId: "it-ivc", qtyMinta: 40, qtyKeluar: 0 },
  ] },
  { id: "ds-3", noDokumen: "DST-2606-090", tanggal: "2026-06-19", fromLocationId: "loc-gd", toLocationId: "loc-ok", status: "Draft", pemohon: "Kamar Operasi", lines: [
    { itemId: "it-mid", qtyMinta: 15, qtyKeluar: 0 },
    { itemId: "it-fol", qtyMinta: 20, qtyKeluar: 0 },
  ] },
];

export const INV_OPNAME: OpnameSession[] = [
  { id: "op-1", noDokumen: "OPN-2606-004", tanggal: "2026-06-19", locationId: "loc-igd", status: "Counting", petugas: "Apt. Rina", lines: [
    { itemId: "it-epi", qtySistem: 12, qtyFisik: 12 },
    { itemId: "it-nor", qtySistem: 28, qtyFisik: 27, alasan: "1 ampul pecah" },
    { itemId: "it-cef", qtySistem: 35, qtyFisik: null },
    { itemId: "it-ivc", qtySistem: 38, qtyFisik: null },
  ] },
  { id: "op-2", noDokumen: "OPN-2606-003", tanggal: "2026-06-18", locationId: "loc-rj", status: "Posted", petugas: "Apt. Sari", lines: [
    { itemId: "it-msk", qtySistem: 22, qtyFisik: 18, alasan: "Rusak/expired" },
    { itemId: "it-amox", qtySistem: 280, qtyFisik: 280 },
    { itemId: "it-pcm", qtySistem: 940, qtyFisik: 940 },
  ] },
  { id: "op-3", noDokumen: "OPN-2606-005", tanggal: "2026-06-19", locationId: "loc-gd", status: "Draft", petugas: "Apt. Ahmad Fauzi", lines: [] },
];

// ── Lookups ───────────────────────────────────────────────

export function locById(id: string): InventoryLocation | undefined {
  return INV_LOCATIONS.find((l) => l.id === id);
}
export function itemById(id: string): InventoryItem | undefined {
  return INV_ITEMS.find((i) => i.id === id);
}
export function vendorById(id: string): Vendor | undefined {
  return INV_VENDORS.find((v) => v.id === id);
}
