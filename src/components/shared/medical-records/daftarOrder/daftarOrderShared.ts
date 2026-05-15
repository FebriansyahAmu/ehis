import { Pill, FlaskConical, Radiation, Package, type LucideIcon } from "lucide-react";

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
      tujuan: "Depo Rawat Inap",
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
      tujuan: "Depo Rawat Inap",
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
      tujuan: "Apotek Rawat Jalan",
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
      tujuan: "Apotek Rawat Jalan",
      items: [
        { id: "rj2-rxi-1", nama: "Amoxicillin-Clavulanat 625mg", detail: "3×1 · Oral · ×7", keterangan: "Sesudah makan" },
        { id: "rj2-rxi-2", nama: "Azithromycin 500mg",           detail: "1×1 · Oral · ×5", keterangan: "Atypical coverage" },
        { id: "rj2-rxi-3", nama: "Paracetamol 500mg",            detail: "3×1 · Oral · ×10", keterangan: "PRN demam/nyeri" },
        { id: "rj2-rxi-4", nama: "Ambroxol 30mg",               detail: "3×1 · Oral · ×5",  keterangan: "Mukolitik" },
      ],
    },
  ],
};
