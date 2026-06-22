import { Pill, FlaskConical, Radiation, Package, type LucideIcon } from "lucide-react";
import type { ResepOrderDTO } from "@/lib/api/resep/resep";
import type { LabOrderDTO } from "@/lib/api/lab/labOrder";

// ── Types ─────────────────────────────────────────────────

export type OrderType   = "Resep" | "Lab" | "Radiologi" | "BMHP";
export type OrderStatus = "Menunggu" | "Diterima" | "Diproses" | "Selesai" | "Dibatalkan";
export type FilterValue = "Semua" | OrderType;

export interface OrderItem {
  id: string;
  nama: string;
  detail?: string;
  keterangan?: string;
  isSpecial?: boolean;
  /** Tarif snapshot per item (Rp). Lab = dari Tarif Matrix; jenis lain belum tentu ada. */
  harga?: number;
}

export interface Order {
  id: string;
  type: OrderType;
  noOrder: string;
  tanggal: string;
  jam: string;
  dokter: string;
  status: OrderStatus;
  catatan?: string;
  tujuan?: string;
  items: OrderItem[];
  /** Status asli dari DB (per-jenis) — dipakai untuk Timeline yang faithful. */
  nativeStatus?: string;
  /** ISO createdAt (DB) — dipakai sort & cap waktu pada Timeline. */
  createdAtISO?: string;
}

export interface ConfirmTarget {
  id: string;
  noOrder: string;
  type: OrderType;
  itemCount: number;
}

export interface ToastData {
  uid: number;
  noOrder: string;
  type: OrderType;
}

export interface DaftarOrderPatient {
  noRM: string;
  name: string;
  dpjp?: string;
  konteks?: "igd" | "rawat-inap";
  /** Kunjungan id (UUID) → ambil order Resep+Lab dari DB. Non-UUID/absen → mock (pasien demo). */
  kunjunganId?: string;
}

// ── Config ────────────────────────────────────────────────

export interface TypeCfg {
  label: string;
  icon: LucideIcon;
  softBg: string;
  text: string;
  ring: string;
  iconCls: string;
  border: string;
}

export const TYPE_CFG: Record<OrderType, TypeCfg> = {
  Resep: {
    label: "Resep", icon: Pill,
    softBg: "bg-indigo-50", text: "text-indigo-700",
    ring: "ring-indigo-200", iconCls: "text-indigo-500", border: "border-indigo-100",
  },
  Lab: {
    label: "Lab", icon: FlaskConical,
    softBg: "bg-sky-50", text: "text-sky-700",
    ring: "ring-sky-200", iconCls: "text-sky-500", border: "border-sky-100",
  },
  Radiologi: {
    label: "Radiologi", icon: Radiation,
    softBg: "bg-teal-50", text: "text-teal-700",
    ring: "ring-teal-200", iconCls: "text-teal-500", border: "border-teal-100",
  },
  BMHP: {
    label: "BMHP", icon: Package,
    softBg: "bg-amber-50", text: "text-amber-700",
    ring: "ring-amber-200", iconCls: "text-amber-500", border: "border-amber-100",
  },
};

export const STATUS_BADGE: Record<OrderStatus, string> = {
  Menunggu:   "bg-slate-100  text-slate-600  ring-1 ring-slate-200",
  Diterima:   "bg-sky-50     text-sky-700    ring-1 ring-sky-200",
  Diproses:   "bg-amber-50   text-amber-700  ring-1 ring-amber-200",
  Selesai:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Dibatalkan: "bg-rose-50    text-rose-500   ring-1 ring-rose-200",
};

/** Latar kartu order disesuaikan status (tint lembut · selaras STATUS_BADGE). */
export const STATUS_CARD: Record<OrderStatus, string> = {
  Menunggu:   "border-slate-200   bg-slate-50/70",
  Diterima:   "border-sky-200     bg-sky-50/60",
  Diproses:   "border-amber-200   bg-amber-50/60",
  Selesai:    "border-emerald-200 bg-emerald-50/50",
  Dibatalkan: "border-rose-200    bg-rose-50/50",
};

export const STATUS_STEPS: OrderStatus[] = ["Menunggu", "Diterima", "Diproses", "Selesai"];

export const FILTER_OPTS: { value: FilterValue; label: string }[] = [
  { value: "Semua",     label: "Semua"     },
  { value: "Resep",     label: "Resep"     },
  { value: "Lab",       label: "Lab"       },
  { value: "Radiologi", label: "Radiologi" },
  { value: "BMHP",      label: "BMHP"      },
];

export const TODAY_LABEL = "14 Mei 2026";

// ── Helpers ───────────────────────────────────────────────

export function groupByDate(orders: Order[]): [string, Order[]][] {
  const map = new Map<string, Order[]>();
  for (const o of orders) {
    if (!map.has(o.tanggal)) map.set(o.tanggal, []);
    map.get(o.tanggal)!.push(o);
  }
  return [...map.entries()];
}

export function matchesSearch(order: Order, q: string): boolean {
  if (!q) return true;
  const lq = q.toLowerCase();
  return (
    order.noOrder.toLowerCase().includes(lq) ||
    order.dokter.toLowerCase().includes(lq) ||
    order.items.some((i) => i.nama.toLowerCase().includes(lq)) ||
    (order.catatan?.toLowerCase().includes(lq) ?? false)
  );
}

// ── DB → Order mapping (Resep + Lab per kunjungan) ────────

const fmtTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const fmtJam = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

/** Status DB (per-jenis) → status terpadu Daftar Order. */
const RESEP_STATUS_MAP: Record<string, OrderStatus> = {
  Menunggu: "Menunggu", Diterima: "Diterima", Ditelaah: "Diproses",
  Dikembalikan: "Diproses", Selesai: "Selesai", Dibatalkan: "Dibatalkan",
};
const LAB_STATUS_MAP: Record<string, OrderStatus> = {
  Menunggu: "Menunggu", Diterima: "Diterima", Dianalisa: "Diproses",
  Divalidasi: "Diproses", Selesai: "Selesai", Ditolak: "Dibatalkan", Dibatalkan: "Dibatalkan",
};

const withCito = (prioritas: string, catatan: string | null): string | undefined => {
  if (prioritas === "CITO") return catatan ? `CITO — ${catatan}` : "CITO";
  return catatan ?? undefined;
};

export function mapResepToOrder(d: ResepOrderDTO): Order {
  return {
    id: d.id,
    type: "Resep",
    noOrder: `RX-${d.id.slice(0, 8).toUpperCase()}`,
    tanggal: fmtTanggal(d.createdAt),
    jam: fmtJam(d.createdAt),
    createdAtISO: d.createdAt,
    dokter: d.penulis,
    status: RESEP_STATUS_MAP[d.status] ?? "Menunggu",
    nativeStatus: d.status,
    catatan: withCito(d.prioritas, d.catatan),
    tujuan: d.depoNama,
    items: d.items.map((it) => ({
      id: it.id,
      nama: it.namaObat,
      detail: [it.dosis, it.signa, it.rute, it.jumlah ? `×${it.jumlah}` : null]
        .filter(Boolean)
        .join(" · ") || undefined,
      keterangan: it.keterangan ?? undefined,
      isSpecial: it.isHAM,
    })),
  };
}

export function mapLabToOrder(d: LabOrderDTO): Order {
  return {
    id: d.id,
    type: "Lab",
    noOrder: `LAB-${d.id.slice(0, 8).toUpperCase()}`,
    tanggal: fmtTanggal(d.createdAt),
    jam: fmtJam(d.createdAt),
    createdAtISO: d.createdAt,
    dokter: d.penulis,
    status: LAB_STATUS_MAP[d.status] ?? "Menunggu",
    nativeStatus: d.status,
    catatan: withCito(d.prioritas, d.catatan),
    tujuan: d.labNama,
    items: d.items.map((it) => ({
      id: it.id,
      nama: it.namaTes,
      detail: [it.kategori, it.waktuTunggu].filter(Boolean).join(" · ") || undefined,
      isSpecial: d.prioritas === "CITO",
      harga: it.harga ?? undefined,
    })),
  };
}

// ── Estimasi biaya (akumulasi tarif per jenis + total) ────

export const fmtRp = (n: number) => "Rp " + n.toLocaleString("id-ID");

/** Total tarif 1 order (jumlahkan harga item yang tersedia). */
export function orderCost(o: Order): number {
  return o.items.reduce((s, it) => s + (it.harga ?? 0), 0);
}

/** Akumulasi tarif per jenis + grand total. Order Dibatalkan TIDAK dihitung. */
export function costByType(orders: Order[]): { byType: Record<OrderType, number>; total: number } {
  const byType: Record<OrderType, number> = { Resep: 0, Lab: 0, Radiologi: 0, BMHP: 0 };
  for (const o of orders) {
    if (o.status === "Dibatalkan") continue;
    byType[o.type] += orderCost(o);
  }
  return { byType, total: byType.Resep + byType.Lab + byType.Radiologi + byType.BMHP };
}

/** Gabung + urutkan (terbaru dulu) order Resep & Lab DB → daftar terpadu. */
export function mergeDbOrders(resep: ResepOrderDTO[], lab: LabOrderDTO[]): Order[] {
  return [...resep.map(mapResepToOrder), ...lab.map(mapLabToOrder)].sort(
    (a, b) => (b.createdAtISO ?? "").localeCompare(a.createdAtISO ?? ""),
  );
}

// ── Timeline status (faithful per-jenis bila ada nativeStatus, else generik) ──

export type TimelineState = "done" | "current" | "pending";
export interface TimelineStage { label: string; state: TimelineState; }

const RESEP_STAGES = ["Order Dibuat", "Diterima Farmasi", "Telaah & Penyiapan", "Selesai / Diserahkan"];
const RESEP_IDX: Record<string, number> = { Menunggu: 0, Diterima: 1, Ditelaah: 2, Dikembalikan: 2, Selesai: 3 };
const LAB_STAGES = ["Order Dibuat", "Diterima Lab", "Analisa", "Validasi", "Selesai / Rilis"];
const LAB_IDX: Record<string, number> = { Menunggu: 0, Diterima: 1, Dianalisa: 2, Divalidasi: 3, Selesai: 4 };
const GENERIC_STAGES = ["Menunggu", "Diterima", "Diproses", "Selesai"];
const GENERIC_IDX: Record<OrderStatus, number> = { Menunggu: 0, Diterima: 1, Diproses: 2, Selesai: 3, Dibatalkan: 0 };

export interface OrderTimeline {
  stages: TimelineStage[];
  cancelled: boolean;
  cancelLabel?: string;
}

export function buildOrderTimeline(order: Order): OrderTimeline {
  if (order.status === "Dibatalkan") {
    return { stages: [], cancelled: true, cancelLabel: order.nativeStatus === "Ditolak" ? "Ditolak" : "Dibatalkan" };
  }
  let labels: string[];
  let idx: number;
  if (order.type === "Resep" && order.nativeStatus) {
    labels = RESEP_STAGES; idx = RESEP_IDX[order.nativeStatus] ?? 0;
  } else if (order.type === "Lab" && order.nativeStatus) {
    labels = LAB_STAGES; idx = LAB_IDX[order.nativeStatus] ?? 0;
  } else {
    labels = GENERIC_STAGES; idx = GENERIC_IDX[order.status] ?? 0;
  }
  const last = labels.length - 1;
  return {
    cancelled: false,
    stages: labels.map((label, i) => ({
      label,
      state: i < idx ? "done" : i === idx ? (i === last ? "done" : "current") : "pending",
    })),
  };
}

/** Label tanggal+jam createdAt untuk stage pertama Timeline. */
export function orderCreatedLabel(order: Order): string | null {
  if (!order.createdAtISO) return null;
  return `${fmtTanggal(order.createdAtISO)} · ${fmtJam(order.createdAtISO)}`;
}

// ── Mock data ─────────────────────────────────────────────

export const ORDERS_MOCK: Record<string, Order[]> = {

  // ── IGD: Joko Prasetyo ──────────────────────────────────
  "RM-2025-005": [
    {
      id: "do-bmhp-1", type: "BMHP", noOrder: "BMHP/2026/04/0088",
      tanggal: "14 April 2026", jam: "11:15",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Diproses", tujuan: "Gudang Farmasi IGD",
      items: [
        { id: "bi-1", nama: "Infus Set Dewasa",     detail: "×2 pcs"    },
        { id: "bi-2", nama: "Abocath No.18",         detail: "×3 pcs"    },
        { id: "bi-3", nama: "NaCl 0,9% 500mL",      detail: "×4 botol"  },
        { id: "bi-4", nama: "Kasa Steril 10×10cm",  detail: "×5 lembar" },
        { id: "bi-5", nama: "Plester Elastis 10cm", detail: "×1 roll"   },
      ],
    },
    {
      id: "do-rad-1", type: "Radiologi", noOrder: "RAD/2026/04/0044",
      tanggal: "14 April 2026", jam: "10:40",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Menunggu", catatan: "Cek cardiomegaly & efusi pleura",
      tujuan: "Instalasi Radiologi",
      items: [
        { id: "ri-1", nama: "Foto Thorax AP/PA", detail: "RAD-001" },
        { id: "ri-2", nama: "EKG 12 Lead",       detail: "RAD-011" },
      ],
    },
    {
      id: "do-rx-1", type: "Resep", noOrder: "RES/2026/04/0201",
      tanggal: "14 April 2026", jam: "11:00",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Menunggu", tujuan: "Depo IGD",
      items: [
        { id: "rxi-1", nama: "Aspirin 100mg",      detail: "1×1 · Oral · ×30",    keterangan: "PC" },
        { id: "rxi-2", nama: "Morfin 10mg/mL Inj", detail: "PRN · IV Bolus · ×3", keterangan: "Titrasi 2-4mg", isSpecial: true },
        { id: "rxi-3", nama: "NaCl 0,9% 500mL",   detail: "IV Drip · ×2",        keterangan: "KCL 20 mEq add-mix" },
      ],
    },
    {
      id: "do-lab-1", type: "Lab", noOrder: "LAB/2026/04/0312",
      tanggal: "14 April 2026", jam: "10:35",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Diproses", catatan: "CITO — Troponin urgent",
      tujuan: "Laboratorium Klinik",
      items: [
        { id: "li-1", nama: "Troponin I / T",          detail: "LAB-K018 · 30 mnt",  isSpecial: true },
        { id: "li-2", nama: "Darah Lengkap (DL)",      detail: "LAB-H001 · 1–2 jam" },
        { id: "li-3", nama: "Analisa Gas Darah (AGD)", detail: "LAB-A001 · 30 mnt"  },
      ],
    },
    {
      id: "do-rx-2", type: "Resep", noOrder: "RES/2026/04/0189",
      tanggal: "10 April 2026", jam: "09:30",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Selesai", tujuan: "Apotek Rawat Jalan",
      items: [
        { id: "rxi-4", nama: "Aspirin 100mg",     detail: "1×1 · Oral · ×30" },
        { id: "rxi-5", nama: "Atorvastatin 20mg", detail: "1×1 · Oral · ×30" },
        { id: "rxi-6", nama: "Amlodipine 5mg",    detail: "1×1 · Oral · ×30" },
      ],
    },
    {
      id: "do-lab-2", type: "Lab", noOrder: "LAB/2026/04/0189",
      tanggal: "10 April 2026", jam: "08:15",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Selesai", tujuan: "Laboratorium Klinik",
      items: [
        { id: "li-4", nama: "Kolesterol Total", detail: "LAB-K011" },
        { id: "li-5", nama: "HDL Kolesterol",   detail: "LAB-K013" },
        { id: "li-6", nama: "LDL Kolesterol",   detail: "LAB-K014" },
        { id: "li-7", nama: "Trigliserida",     detail: "LAB-K012" },
      ],
    },
    {
      id: "do-rad-2", type: "Radiologi", noOrder: "RAD/2026/02/0011",
      tanggal: "12 Februari 2026", jam: "10:05",
      dokter: "dr. Anisa Putri, Sp.PD",
      status: "Selesai", tujuan: "Instalasi Radiologi",
      items: [
        { id: "ri-3", nama: "Foto Thorax AP",             detail: "RAD-001" },
        { id: "ri-4", nama: "CT Scan Thorax Non Kontras", detail: "RAD-015" },
      ],
    },
    {
      id: "do-bmhp-2", type: "BMHP", noOrder: "BMHP/2026/02/0021",
      tanggal: "12 Februari 2026", jam: "10:10",
      dokter: "dr. Anisa Putri, Sp.PD",
      status: "Selesai", tujuan: "Gudang Farmasi IGD",
      items: [
        { id: "bi-6", nama: "Sarung Tangan Steril No.7", detail: "×5 pasang" },
        { id: "bi-7", nama: "Folley Catheter No.16",     detail: "×1 pcs"    },
        { id: "bi-8", nama: "Urine Bag 2000mL",          detail: "×1 pcs"    },
      ],
    },
  ],

  // ── IGD: Siti Rahayu ────────────────────────────────────
  "RM-2025-012": [
    {
      id: "do-bmhp-3", type: "BMHP", noOrder: "BMHP/2026/04/0071",
      tanggal: "14 April 2026", jam: "11:20",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Diterima", tujuan: "Gudang Farmasi IGD",
      items: [
        { id: "bi-9",  nama: "Infus Set Dewasa",   detail: "×1 pcs"   },
        { id: "bi-10", nama: "Abocath No.20",       detail: "×2 pcs"   },
        { id: "bi-11", nama: "Ringer Laktat 500mL", detail: "×3 botol" },
      ],
    },
    {
      id: "do-lab-3", type: "Lab", noOrder: "LAB/2026/04/0305",
      tanggal: "14 April 2026", jam: "11:08",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Menunggu", tujuan: "Laboratorium Klinik",
      items: [
        { id: "li-8", nama: "GDS (Gula Darah Sewaktu)", detail: "LAB-K001 · 15 mnt" },
        { id: "li-9", nama: "HbA1c",                   detail: "LAB-K003 · 2 jam"  },
      ],
    },
    {
      id: "do-rx-3", type: "Resep", noOrder: "RES/2026/04/0155",
      tanggal: "8 April 2026", jam: "09:00",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Selesai", tujuan: "Apotek Rawat Jalan",
      items: [
        { id: "rxi-7", nama: "Metformin 500mg", detail: "2×1 · Oral · ×60" },
        { id: "rxi-8", nama: "Omeprazole 20mg", detail: "1×1 · Oral · ×30" },
      ],
    },
  ],

  // ── Rawat Inap: GJK NYHA III (Hari ke-7) ───────────────
  "RM-2025-003": [

    // ── Hari ke-7 · 14 Mei 2026 ──
    {
      id: "ri-lab-h7a", type: "Lab", noOrder: "LAB/2026/05/0892",
      tanggal: "14 Mei 2026", jam: "06:30",
      dokter: "dr. Budi Santoso, Sp.JP",
      status: "Diproses", catatan: "CITO — Monitoring BNP + fungsi ginjal",
      tujuan: "Laboratorium Klinik",
      items: [
        { id: "rl-1", nama: "BNP (B-type Natriuretic Peptide)", detail: "LAB-K021 · 2 jam", isSpecial: true },
        { id: "rl-2", nama: "Ureum",                            detail: "LAB-K007 · 1 jam" },
        { id: "rl-3", nama: "Kreatinin",                        detail: "LAB-K008 · 1 jam" },
        { id: "rl-4", nama: "Elektrolit (Na/K/Cl)",             detail: "LAB-K009 · 1 jam" },
      ],
    },
    {
      id: "ri-rx-h7a", type: "Resep", noOrder: "RES/2026/05/0541",
      tanggal: "14 Mei 2026", jam: "07:15",
      dokter: "dr. Budi Santoso, Sp.JP",
      status: "Menunggu", catatan: "Eskalasi dosis furosemide — respons diuretik belum optimal",
      tujuan: "Apotek RI",
      items: [
        { id: "rr-1", nama: "Furosemide 80mg Injeksi", detail: "2×1 · IV bolus · 2 ampul", keterangan: "Naikkan dari 40mg", isSpecial: true },
        { id: "rr-2", nama: "KCl 25 mEq",              detail: "Addmix NaCl 0,9% 500mL",   keterangan: "Monitor kalium" },
      ],
    },

    // ── Hari ke-6 · 13 Mei 2026 ──
    {
      id: "ri-lab-h6a", type: "Lab", noOrder: "LAB/2026/05/0857",
      tanggal: "13 Mei 2026", jam: "06:30",
      dokter: "dr. Budi Santoso, Sp.JP",
      status: "Selesai", tujuan: "Laboratorium Klinik",
      items: [
        { id: "rl-5", nama: "Darah Lengkap (DL)",   detail: "LAB-H001 · 1–2 jam" },
        { id: "rl-6", nama: "Elektrolit (Na/K/Cl)", detail: "LAB-K009 · 1 jam"   },
        { id: "rl-7", nama: "BNP",                  detail: "LAB-K021 · 2 jam",  isSpecial: true },
      ],
    },
    {
      id: "ri-rx-h6a", type: "Resep", noOrder: "RES/2026/05/0510",
      tanggal: "13 Mei 2026", jam: "08:00",
      dokter: "dr. Budi Santoso, Sp.JP",
      status: "Selesai", tujuan: "Depo Rawat Inap",
      items: [
        { id: "rr-3", nama: "Furosemide 40mg Injeksi", detail: "2×1 · IV bolus" },
        { id: "rr-4", nama: "Bisoprolol 2,5mg",         detail: "1×1 · Oral" },
        { id: "rr-5", nama: "Ramipril 5mg",             detail: "1×1 · Oral" },
        { id: "rr-6", nama: "Spironolakton 25mg",       detail: "1×1 · Oral" },
      ],
    },

    // ── Hari ke-5 · 12 Mei 2026 ──
    {
      id: "ri-rad-h5a", type: "Radiologi", noOrder: "RAD/2026/05/0218",
      tanggal: "12 Mei 2026", jam: "09:00",
      dokter: "dr. Budi Santoso, Sp.JP",
      status: "Selesai", catatan: "Serial thorax — monitoring perbaikan edema paru",
      tujuan: "Instalasi Radiologi",
      items: [
        { id: "rad-1", nama: "Foto Thorax PA", detail: "RAD-001" },
      ],
    },
    {
      id: "ri-bmhp-h5a", type: "BMHP", noOrder: "BMHP/2026/05/0134",
      tanggal: "12 Mei 2026", jam: "07:30",
      dokter: "dr. Budi Santoso, Sp.JP",
      status: "Selesai", tujuan: "Gudang Farmasi Rawat Inap",
      items: [
        { id: "rb-1", nama: "Infus Set Mikro",    detail: "×2 pcs"   },
        { id: "rb-2", nama: "NaCl 0,9% 100mL",   detail: "×4 botol" },
        { id: "rb-3", nama: "Three-Way Stopcock", detail: "×2 pcs"   },
        { id: "rb-4", nama: "Urine Bag 2000mL",   detail: "×1 pcs"   },
      ],
    },

    // ── Hari ke-3 · 10 Mei 2026 ──
    {
      id: "ri-lab-h3a", type: "Lab", noOrder: "LAB/2026/05/0803",
      tanggal: "10 Mei 2026", jam: "06:00",
      dokter: "dr. Budi Santoso, Sp.JP",
      status: "Selesai", tujuan: "Laboratorium Klinik",
      items: [
        { id: "rl-8",  nama: "Ureum",             detail: "LAB-K007 · 1 jam" },
        { id: "rl-9",  nama: "Kreatinin",          detail: "LAB-K008 · 1 jam" },
        { id: "rl-10", nama: "Asam Urat",          detail: "LAB-K010 · 1 jam" },
        { id: "rl-11", nama: "SGOT / SGPT",        detail: "LAB-K015 · 1 jam" },
        { id: "rl-12", nama: "BNP",                detail: "LAB-K021 · 2 jam", isSpecial: true },
      ],
    },

    // ── Hari ke-1 · 8 Mei 2026 (masuk) ──
    {
      id: "ri-lab-h1a", type: "Lab", noOrder: "LAB/2026/05/0741",
      tanggal: "8 Mei 2026", jam: "10:30",
      dokter: "dr. Budi Santoso, Sp.JP",
      status: "Selesai", catatan: "Panel lengkap awal masuk rawat inap",
      tujuan: "Laboratorium Klinik",
      items: [
        { id: "rl-13", nama: "Darah Lengkap (DL)",         detail: "LAB-H001 · 1–2 jam" },
        { id: "rl-14", nama: "BNP",                        detail: "LAB-K021 · 2 jam",  isSpecial: true },
        { id: "rl-15", nama: "Troponin I (CITO)",          detail: "LAB-K018 · 30 mnt", isSpecial: true },
        { id: "rl-16", nama: "Ureum / Kreatinin",          detail: "LAB-K007/008 · 1 jam" },
        { id: "rl-17", nama: "Elektrolit (Na/K/Cl/Mg)",   detail: "LAB-K009 · 1 jam" },
        { id: "rl-18", nama: "PT / APTT",                  detail: "LAB-G001 · 1 jam" },
        { id: "rl-19", nama: "SGOT / SGPT",                detail: "LAB-K015 · 1 jam" },
      ],
    },
    {
      id: "ri-rad-h1a", type: "Radiologi", noOrder: "RAD/2026/05/0192",
      tanggal: "8 Mei 2026", jam: "11:00",
      dokter: "dr. Budi Santoso, Sp.JP",
      status: "Selesai", catatan: "Asesmen awal GJK akut dekompensasi",
      tujuan: "Instalasi Radiologi",
      items: [
        { id: "rad-2", nama: "Foto Thorax PA",                    detail: "RAD-001" },
        { id: "rad-3", nama: "Ekokardiografi (Bedside Echo GJK)", detail: "RAD-025" },
      ],
    },
    {
      id: "ri-bmhp-h1a", type: "BMHP", noOrder: "BMHP/2026/05/0091",
      tanggal: "8 Mei 2026", jam: "10:00",
      dokter: "dr. Budi Santoso, Sp.JP",
      status: "Selesai", tujuan: "Gudang Farmasi Rawat Inap",
      items: [
        { id: "rb-5", nama: "Central Venous Catheter (CVC) Kit", detail: "×1 set",   isSpecial: true },
        { id: "rb-6", nama: "Infus Set Dewasa",                  detail: "×3 pcs"    },
        { id: "rb-7", nama: "Abocath No.18",                     detail: "×3 pcs"    },
        { id: "rb-8", nama: "Folley Catheter No.16",             detail: "×1 pcs"    },
        { id: "rb-9", nama: "Urine Bag 2000mL",                  detail: "×1 pcs"    },
      ],
    },
    {
      id: "ri-rx-h1a", type: "Resep", noOrder: "RES/2026/05/0481",
      tanggal: "8 Mei 2026", jam: "12:00",
      dokter: "dr. Budi Santoso, Sp.JP",
      status: "Selesai", catatan: "Terapi awal GJK akut dekompensasi",
      tujuan: "Apotek RI",
      items: [
        { id: "rr-7",  nama: "Furosemide 40mg Injeksi",     detail: "4×1 · IV bolus",             isSpecial: true },
        { id: "rr-8",  nama: "Dobutamine 250mg/20mL Inj",   detail: "Syringe pump 5mcg/kgBB/min", isSpecial: true },
        { id: "rr-9",  nama: "ISDN (Isosorbide Dinitrate)", detail: "IV drip 20mcg/mnt" },
        { id: "rr-10", nama: "Aspirin 100mg",               detail: "1×1 · Oral" },
        { id: "rr-11", nama: "Clopidogrel 75mg",            detail: "1×1 · Oral" },
      ],
    },
  ],

  // ── Rawat Jalan: Budiman Santoso · Poli Jantung · CAD (rj-1) ──
  "RM-2025-021": [
    {
      id: "rj1-lab-1", type: "Lab", noOrder: "LAB/2026/05/1041",
      tanggal: "15 Mei 2026", jam: "08:45",
      dokter: "dr. Ahmad Fauzi, Sp.JP",
      status: "Menunggu", catatan: "Workup angina tidak stabil — CITO Troponin",
      tujuan: "Laboratorium Klinik",
      items: [
        { id: "rj1-li-1", nama: "Troponin I (CITO)",    detail: "LAB-K018 · 30 mnt", isSpecial: true },
        { id: "rj1-li-2", nama: "Darah Lengkap (DL)",   detail: "LAB-H001 · 1–2 jam" },
        { id: "rj1-li-3", nama: "Kolesterol Total",      detail: "LAB-K011 · 1 jam" },
        { id: "rj1-li-4", nama: "LDL Kolesterol",        detail: "LAB-K014 · 1 jam" },
        { id: "rj1-li-5", nama: "Kreatinin",             detail: "LAB-K008 · 1 jam" },
        { id: "rj1-li-6", nama: "Elektrolit (Na/K/Cl)", detail: "LAB-K009 · 1 jam" },
      ],
    },
    {
      id: "rj1-rad-1", type: "Radiologi", noOrder: "RAD/2026/05/0301",
      tanggal: "15 Mei 2026", jam: "08:50",
      dokter: "dr. Ahmad Fauzi, Sp.JP",
      status: "Diproses", catatan: "Evaluasi kardiomegali & iskemia",
      tujuan: "Instalasi Radiologi",
      items: [
        { id: "rj1-ri-1", nama: "EKG 12 Lead",     detail: "RAD-011" },
        { id: "rj1-ri-2", nama: "Foto Thorax PA",   detail: "RAD-001" },
      ],
    },
    {
      id: "rj1-rx-1", type: "Resep", noOrder: "RES/2026/05/0721",
      tanggal: "15 Mei 2026", jam: "09:15",
      dokter: "dr. Ahmad Fauzi, Sp.JP",
      status: "Menunggu", catatan: "Terapi CAD + anti-angina",
      tujuan: "Apotek RJ",
      items: [
        { id: "rj1-rxi-1", nama: "Aspirin 100mg",          detail: "1×1 · Oral · ×30",  keterangan: "Sesudah makan" },
        { id: "rj1-rxi-2", nama: "Clopidogrel 75mg",       detail: "1×1 · Oral · ×30",  keterangan: "DAPT" },
        { id: "rj1-rxi-3", nama: "Bisoprolol 5mg",         detail: "1×1 · Oral · ×30" },
        { id: "rj1-rxi-4", nama: "Atorvastatin 40mg",      detail: "1×1 · Malam · ×30" },
        { id: "rj1-rxi-5", nama: "Nitrogliserin 0,5mg SL", detail: "PRN — saat nyeri dada", keterangan: "Max 3× per 15 mnt", isSpecial: true },
      ],
    },
  ],

  // ── Rawat Jalan: Dewi Rahmawati · Poli Umum · CAP (rj-2) ──
  "RM-2025-034": [
    {
      id: "rj2-lab-1", type: "Lab", noOrder: "LAB/2026/05/1058",
      tanggal: "15 Mei 2026", jam: "09:10",
      dokter: "dr. Rini Kusuma, Sp.PD",
      status: "Diproses", catatan: "Workup pneumonia komunitas",
      tujuan: "Laboratorium Klinik",
      items: [
        { id: "rj2-li-1", nama: "Darah Lengkap (DL)",  detail: "LAB-H001 · 1–2 jam" },
        { id: "rj2-li-2", nama: "CRP Kuantitatif",     detail: "LAB-I003 · 1 jam",  isSpecial: true },
        { id: "rj2-li-3", nama: "LED (Laju Endap Darah)", detail: "LAB-H003 · 1 jam" },
        { id: "rj2-li-4", nama: "SGOT / SGPT",         detail: "LAB-K015 · 1 jam" },
      ],
    },
    {
      id: "rj2-rad-1", type: "Radiologi", noOrder: "RAD/2026/05/0318",
      tanggal: "15 Mei 2026", jam: "09:05",
      dokter: "dr. Rini Kusuma, Sp.PD",
      status: "Selesai", catatan: "Konfirmasi infiltrat pneumonia",
      tujuan: "Instalasi Radiologi",
      items: [
        { id: "rj2-ri-1", nama: "Foto Thorax PA/Lateral", detail: "RAD-001" },
      ],
    },
    {
      id: "rj2-rx-1", type: "Resep", noOrder: "RES/2026/05/0738",
      tanggal: "15 Mei 2026", jam: "09:30",
      dokter: "dr. Rini Kusuma, Sp.PD",
      status: "Menunggu", catatan: "Empiris CAP derajat ringan-sedang",
      tujuan: "Apotek RJ",
      items: [
        { id: "rj2-rxi-1", nama: "Amoxicillin-Clavulanat 625mg", detail: "3×1 · Oral · ×7", keterangan: "Sesudah makan" },
        { id: "rj2-rxi-2", nama: "Azithromycin 500mg",           detail: "1×1 · Oral · ×5", keterangan: "Atypical coverage" },
        { id: "rj2-rxi-3", nama: "Paracetamol 500mg",            detail: "3×1 · Oral · ×10", keterangan: "PRN demam/nyeri" },
        { id: "rj2-rxi-4", nama: "Ambroxol 30mg",               detail: "3×1 · Oral · ×5",  keterangan: "Mukolitik" },
      ],
    },
  ],

  // ── ICU: Hasan Basri · RM-2025-007 · Sepsis + ARDS ──────
  "RM-2025-007": [
    {
      id: "icu-rx-h3a", type: "Resep", noOrder: "RES/2025/05/0544",
      tanggal: "7 Mei 2025", jam: "08:30",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Diproses", catatan: "CITO — Lanjut terapi sepsis ICU hari ke-3",
      tujuan: "Apotek RI",
      items: [
        { id: "icu-rr-1", nama: "Norepinephrine 4mg/4mL",  detail: "Titrasi 0.25 mcg/kgBB/mnt · IV Drip CVC", keterangan: "HAM — titrasi MAP ≥65 mmHg", isSpecial: true },
        { id: "icu-rr-2", nama: "Meropenem 1g Inj",         detail: "q12h (disesuaikan AKI) · IV Drip 30 mnt",  keterangan: "Panduan kultur: Klebsiella sensitif" },
        { id: "icu-rr-3", nama: "Midazolam 15mg/3mL",       detail: "Sedasi 0.04 mg/kgBB/jam · IV Drip CVC",   keterangan: "Target RASS -2 s/d -3" },
        { id: "icu-rr-4", nama: "Pantoprazole 40mg Inj",    detail: "1×1 · IV Drip",                            keterangan: "Profilaksis ulkus stres" },
      ],
    },
    {
      id: "icu-rx-h1a", type: "Resep", noOrder: "RES/2025/05/0518",
      tanggal: "5 Mei 2025", jam: "16:00",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Selesai", catatan: "Terapi awal sepsis — resusitasi dan stabilisasi",
      tujuan: "Apotek RI",
      items: [
        { id: "icu-rr-5", nama: "Norepinephrine 4mg/4mL", detail: "Mulai 0.1 mcg/kgBB/mnt · IV Drip CVC",  keterangan: "HAM", isSpecial: true },
        { id: "icu-rr-6", nama: "Meropenem 1g Inj",       detail: "q8h · IV Drip 30 mnt",                   keterangan: "Empiris sepsis" },
        { id: "icu-rr-7", nama: "Vancomycin 1g Inj",      detail: "q12h · IV Drip 1 jam",                   keterangan: "Coverage MRSA (kultur pending)", isSpecial: true },
      ],
    },
    {
      id: "icu-lab-h1a", type: "Lab", noOrder: "LAB/2025/05/0631",
      tanggal: "5 Mei 2025", jam: "15:45",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Selesai", catatan: "CITO Panel Sepsis — kultur darah, CBC, laktat",
      tujuan: "Laboratorium Klinik",
      items: [
        { id: "icu-li-1", nama: "Kultur Darah × 2 botol",        detail: "LAB-M001 · 48–72 jam", isSpecial: true },
        { id: "icu-li-2", nama: "Darah Lengkap (DL)",            detail: "LAB-H001 · 1–2 jam" },
        { id: "icu-li-3", nama: "Laktat",                         detail: "LAB-K022 · 30 mnt",    isSpecial: true },
        { id: "icu-li-4", nama: "Kreatinin + BUN",               detail: "LAB-K008 · 1 jam" },
        { id: "icu-li-5", nama: "Elektrolit (Na/K/Cl)",          detail: "LAB-K009 · 1 jam" },
        { id: "icu-li-6", nama: "CRP Kuantitatif",               detail: "LAB-I003 · 1 jam" },
        { id: "icu-li-7", nama: "PT / APTT / Fibrinogen",        detail: "LAB-G001/G002 · 1 jam" },
        { id: "icu-li-8", nama: "Procalcitonin (PCT)",           detail: "LAB-I004 · 1 jam", isSpecial: true },
      ],
    },
    {
      id: "icu-lab-h3a", type: "Lab", noOrder: "LAB/2025/05/0662",
      tanggal: "7 Mei 2025", jam: "06:00",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Selesai", catatan: "Monitor AKI + respons antibiotik hari ke-3",
      tujuan: "Laboratorium Klinik",
      items: [
        { id: "icu-li-9",  nama: "Kreatinin + BUN",              detail: "LAB-K008 · 1 jam" },
        { id: "icu-li-10", nama: "Elektrolit (Na/K/Cl)",         detail: "LAB-K009 · 1 jam" },
        { id: "icu-li-11", nama: "Procalcitonin (PCT)",          detail: "LAB-I004 · 1 jam", isSpecial: true },
        { id: "icu-li-12", nama: "Darah Lengkap (DL)",           detail: "LAB-H001 · 1–2 jam" },
      ],
    },
    {
      id: "icu-rad-h1a", type: "Radiologi", noOrder: "RAD/2025/05/0218",
      tanggal: "5 Mei 2025", jam: "16:30",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Selesai", catatan: "Konfirmasi infiltrat bilateral — ARDS assessment",
      tujuan: "Instalasi Radiologi",
      items: [
        { id: "icu-ri-1", nama: "Foto Thorax AP (Bedside)",      detail: "RAD-001" },
        { id: "icu-ri-2", nama: "USG Bedside (Lung + FAST)",     detail: "RAD-026", isSpecial: true },
      ],
    },
  ],
};

export function updateOrderStatus(orderId: string, status: OrderStatus): void {
  for (const orders of Object.values(ORDERS_MOCK)) {
    const order = orders.find((o) => o.id === orderId);
    if (order) { order.status = status; return; }
  }
}
