import {
  ORDERS_MOCK,
  type Order,
} from "@/components/shared/medical-records/daftarOrder/daftarOrderShared";

// ── Types ─────────────────────────────────────────────────

export type FarmasiStatus  = "Menunggu" | "Ditelaah" | "Siap Diserahkan" | "Selesai" | "Dikembalikan";
export type DepoTujuan     = "Depo IGD" | "Apotek RI" | "Apotek RJ";
export type UnitAsal       = "IGD" | "Rawat Inap" | "Rawat Jalan";
export type PrioritasOrder = "CITO" | "Segera" | "Rutin";
export type IntervensiType = "Dose_Adjustment" | "Substitusi" | "Interaksi" | "Efek_Samping" | "Rekomendasi";

export interface FarmasiOrderItem {
  id:            string;
  namaObat:      string;
  kodeObat:      string;
  dosis:         string;
  signa:         string;
  jumlah:        number;
  rute:          string;
  kategori:      "Reguler" | "Narkotika" | "Psikotropika";
  isHAM:         boolean;
  lotNo?:        string;
  expiredDate?:  string;
  labelDicetak?: boolean;
}

export interface TelaahCheck {
  administratif: boolean;
  farmasetis:    boolean;
  klinis:        boolean;
}

export interface TelaahData {
  checks:          TelaahCheck;
  catatan?:        string;
  apoteker:        string;
  waktu:           string;
  result:          "Disetujui" | "Dikembalikan";
  alasanKembali?:  string;
}

export interface SerahTerima {
  waktu:           string;
  perawatPenerima: string;
  apoteker:        string;
  catatan?:        string;
}

export interface CatatanFarmasi {
  id:            string;
  tipe:          IntervensiType;
  isi:           string;
  rekomendasi?:  string;
  dokterDituju?: string;
  apoteker:      string;
  waktu:         string;
}

export interface FarmasiOrder {
  id:             string;
  noOrder:        string;
  noRM:           string;
  namaPasien:     string;
  unit:           UnitAsal;
  depo:           DepoTujuan;
  dokterPeminta:  string;
  tanggal:        string;
  jam:            string;
  status:         FarmasiStatus;
  prioritas:      PrioritasOrder;
  hasHAM:         boolean;
  items:          FarmasiOrderItem[];
  telaah?:        TelaahData;
  serahTerima?:   SerahTerima;
  catatan?:       CatatanFarmasi[];
}

// ── Config maps ───────────────────────────────────────────

export const STATUS_CFG: Record<FarmasiStatus, {
  label:    string;
  badge:    string;
  dot:      string;
  step:     number;
  action:   string;
  actionCls: string;
}> = {
  Menunggu:          { label: "Menunggu Telaah",  badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",         dot: "bg-amber-400",   step: 0, action: "Telaah",     actionCls: "bg-indigo-600 hover:bg-indigo-700 text-white"         },
  Ditelaah:          { label: "Siap Dispensasi",  badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",               dot: "bg-sky-500",     step: 1, action: "Dispensasi", actionCls: "bg-sky-600 hover:bg-sky-700 text-white"               },
  "Siap Diserahkan": { label: "Siap Diserahkan",  badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",      dot: "bg-indigo-500",  step: 2, action: "Serahkan",   actionCls: "bg-emerald-600 hover:bg-emerald-700 text-white"       },
  Selesai:           { label: "Diserahkan",        badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",   dot: "bg-emerald-500", step: 3, action: "Detail",     actionCls: "bg-slate-100 hover:bg-slate-200 text-slate-700"       },
  Dikembalikan:      { label: "Dikembalikan",      badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",            dot: "bg-rose-500",    step:-1, action: "Detail",     actionCls: "bg-slate-100 hover:bg-slate-200 text-slate-700"       },
};

export const DEPO_CFG: Record<DepoTujuan, { badge: string; unit: UnitAsal }> = {
  "Depo IGD":  { badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",       unit: "IGD"         },
  "Apotek RI": { badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200", unit: "Rawat Inap"  },
  "Apotek RJ": { badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",          unit: "Rawat Jalan" },
};

export const PRIORITAS_CFG: Record<PrioritasOrder, { badge: string }> = {
  CITO:   { badge: "bg-rose-500 text-white"      },
  Segera: { badge: "bg-amber-500 text-white"     },
  Rutin:  { badge: "bg-slate-100 text-slate-600" },
};

export const INTERVENSI_CFG: Record<IntervensiType, { label: string; badge: string }> = {
  Dose_Adjustment: { label: "Penyesuaian Dosis", badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"     },
  Substitusi:      { label: "Substitusi Obat",   badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200"           },
  Interaksi:       { label: "Interaksi Obat",    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200"        },
  Efek_Samping:    { label: "Efek Samping",       badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-200" },
  Rekomendasi:     { label: "Rekomendasi",        badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" },
};

export const TELAAH_ADM_ITEMS  = ["Nama lengkap & identitas pasien", "No. RM sesuai gelang", "Tanggal penulisan resep", "Nama & paraf dokter penulis"];
export const TELAAH_FARM_ITEMS = ["Dosis dalam rentang normal", "Bentuk sediaan sesuai kondisi", "Rute & cara pemberian tepat", "Aturan pakai & durasi jelas"];
export const TELAAH_KLIN_ITEMS = ["Indikasi sesuai diagnosa", "Tidak ada kontraindikasi absolut", "Tidak ada interaksi signifikan", "Tidak ada duplikasi terapi"];

// ── Patient lookup ────────────────────────────────────────

const PATIENT_INFO: Record<string, { namaPasien: string; unit: UnitAsal }> = {
  "RM-2025-005": { namaPasien: "Joko Prasetyo",   unit: "IGD"         },
  "RM-2025-012": { namaPasien: "Siti Rahayu",     unit: "IGD"         },
  "RM-2025-003": { namaPasien: "Ahmad Fauzi",     unit: "Rawat Inap"  },
  "RM-2025-007": { namaPasien: "Hasan Basri",     unit: "Rawat Inap"  },
  "RM-2025-021": { namaPasien: "Budiman Santoso", unit: "Rawat Jalan" },
  "RM-2025-034": { namaPasien: "Dewi Rahmawati",  unit: "Rawat Jalan" },
};

// ── Tujuan → Depo mapping ─────────────────────────────────

const TUJUAN_TO_DEPO: Partial<Record<string, DepoTujuan>> = {
  "Depo IGD":  "Depo IGD",
  "Apotek RI": "Apotek RI",
  "Apotek RJ": "Apotek RJ",
};

// ── HAM / Kategori detection ──────────────────────────────

const HAM_KEYWORDS = [
  "morfin", "heparin", "warfarin", "norepinefrin", "epinefrin", "dobutamin",
  "isdn", "nitrogliserin", "kcl", "kalium klorid", "insulin", "oksitosin",
  "magnesium sulfat",
];
const NARKOTIKA_KW    = ["morfin", "petidin", "fentanil", "kodein", "tramadol"];
const PSIKOTROPIKA_KW = ["diazepam", "alprazolam", "midazolam", "lorazepam"];

function isHAMDrug(name: string): boolean {
  const low = name.toLowerCase();
  return HAM_KEYWORDS.some((kw) => low.includes(kw));
}

function kategoriObat(name: string): FarmasiOrderItem["kategori"] {
  const low = name.toLowerCase();
  if (NARKOTIKA_KW.some((kw)    => low.includes(kw))) return "Narkotika";
  if (PSIKOTROPIKA_KW.some((kw) => low.includes(kw))) return "Psikotropika";
  return "Reguler";
}

function parseJumlah(detail?: string): number {
  if (!detail) return 1;
  const all = [...detail.matchAll(/×(\d+)/g)];
  return all.length > 0 ? (parseInt(all[all.length - 1][1], 10) || 1) : 1;
}

function parseRute(detail?: string): string {
  if (!detail) return "PO";
  if (/IV drip/i.test(detail))   return "IV drip";
  if (/IV bolus/i.test(detail))  return "IV bolus";
  if (/\bIV\b/.test(detail))    return "IV";
  if (/\bSC\b/.test(detail))    return "SC";
  if (/\bIM\b/.test(detail))    return "IM";
  if (/\bSL\b/.test(detail))    return "SL";
  if (/oral/i.test(detail))     return "PO";
  return "PO";
}

// ── Workflow store (in-memory, per session) ───────────────

interface WorkflowData {
  status?:      FarmasiStatus;
  items?:       FarmasiOrderItem[];
  telaah?:      TelaahData;
  serahTerima?: SerahTerima;
  catatan?:     CatatanFarmasi[];
}

const workflowStore = new Map<string, WorkflowData>();

export function updateFarmasiWorkflow(orderId: string, data: Partial<WorkflowData>): void {
  workflowStore.set(orderId, { ...workflowStore.get(orderId), ...data });
}

// ── Order derivation ──────────────────────────────────────

function mapOrderStatus(s: string): FarmasiStatus {
  if (s === "Selesai")  return "Selesai";
  if (s === "Diproses") return "Ditelaah";
  return "Menunggu";
}

function deriveItems(order: Order, wf?: WorkflowData): FarmasiOrderItem[] {
  if (wf?.items) return wf.items;
  return order.items.map((item): FarmasiOrderItem => ({
    id:       item.id,
    namaObat: item.nama,
    kodeObat: `RX-${item.id}`,
    dosis:    item.detail ?? "",
    signa:    item.keterangan ?? "",
    jumlah:   parseJumlah(item.detail),
    rute:     parseRute(item.detail),
    kategori: kategoriObat(item.nama),
    isHAM:    isHAMDrug(item.nama),
  }));
}

export function deriveResepOrders(noRM?: string): FarmasiOrder[] {
  const entries = noRM
    ? ([[noRM, ORDERS_MOCK[noRM] ?? []]] as [string, Order[]][])
    : (Object.entries(ORDERS_MOCK) as [string, Order[]][]);

  return entries.flatMap(([rm, orders]) =>
    orders
      .filter((o) => o.type === "Resep")
      .map((o): FarmasiOrder => {
        const wf      = workflowStore.get(o.id);
        const depo    = TUJUAN_TO_DEPO[o.tujuan ?? ""] ?? "Apotek RJ";
        const patient = PATIENT_INFO[rm];
        const items   = deriveItems(o, wf);
        return {
          id:            o.id,
          noOrder:       o.noOrder,
          noRM:          rm,
          namaPasien:    patient?.namaPasien ?? "Pasien",
          unit:          patient?.unit ?? DEPO_CFG[depo].unit,
          depo,
          dokterPeminta: o.dokter,
          tanggal:       o.tanggal,
          jam:           o.jam,
          status:        wf?.status ?? mapOrderStatus(o.status),
          prioritas:     o.catatan?.includes("CITO") ? "CITO" : "Rutin",
          hasHAM:        items.some((i) => i.isHAM),
          items,
          telaah:        wf?.telaah,
          serahTerima:   wf?.serahTerima,
          catatan:       wf?.catatan,
        };
      }),
  );
}
