// Lab Module — Types, Config, DB mapping, Workflow Overlay
// Standard: ISO 15189:2022 · SNARS AP 5.9/5.11 · PMK 43/2013
//
// Order lab dibaca dari DB (medicalrecord.LabOrder via /lab/orders) — TANPA mock. Header + items
// dari DB; progres workflow (sampel/hasil/validasi) = overlay client in-session (_labStore) sampai
// endpoint persist hasil/sampel/validasi tersedia (follow-up). mapDbLabOrder = DTO → LabOrder;
// applyWorkflowOverlay = tempel overlay sesi.

import type { LabOrderWorklistDTO } from "@/lib/schemas/lab/labOrder";
import type { LabResultDTO } from "@/lib/schemas/lab/labResult";
import type { LabTestDTO, LabRujukanDTO } from "@/lib/schemas/master/labTest";

// ── Types ─────────────────────────────────────────────────

export type LabStatus =
  | "Menunggu"         // Order placed, awaiting lab receipt
  | "Diterima"         // Identity verified, receipt confirmed (SKP 1)
  | "Ambil Sampel"     // Sample collection in progress
  | "Sampel Diterima"  // Sample registered at lab
  | "Dianalisa"        // Analysis in progress
  | "Divalidasi"       // Awaiting SpPK/supervisor sign-off
  | "Selesai"          // Results released
  | "Ditolak";         // Specimen rejected

// Selaras master.LabKategoriEnum (10 nilai) — katalog DB boleh kirim semuanya.
export type KategoriLab =
  | "Hematologi" | "Kimia Klinik" | "Urinalisis" | "Mikrobiologi" | "Serologi"
  | "Koagulasi" | "Analisa Gas Darah" | "Feses" | "Imunologi" | "Toksikologi";

export type PrioritasLab    = "CITO" | "Segera" | "Rutin";
export type UnitAsalLab     = "IGD" | "Rawat Inap" | "Rawat Jalan";
export type FlagHasil       = "N" | "H" | "L" | "C";
export type AlasanPenolakan =
  | "Hemolisis" | "Lipemia" | "Bekuan"
  | "Volume Kurang" | "Salah Tabung" | "Label Rusak/Salah" | "Lainnya";

// ── Interfaces ────────────────────────────────────────────

export interface LabOrderItem {
  id:          string;
  /** Katalog master.LabTest.id (bila dari katalog) → ambil parameter saat entry hasil. */
  labTestId?:  string | null;
  kode:        string;
  nama:        string;
  kategori:    KategoriLab;
  waktuTunggu: string;
  isSpecial?:  boolean;
}

export interface HasilItem {
  /** Kunci unik baris (param-level bila dari katalog). Fallback ke `kode`. */
  rowKey?:       string;
  kode:          string;
  nama:          string;
  kategori:      KategoriLab;
  nilai?:        string;
  satuan:        string;
  rujukanStr:    string;
  nilaiMin?:     number;
  nilaiMax?:     number;
  criticalLow?:  number;
  criticalHigh?: number;
  flag?:         FlagHasil;
}

export interface SpecimenInfo {
  jenisTube:     string;
  volumeMl?:     string;
  waktuAmbil?:   string;
  petugas?:      string;
  lokasi?:       string;
  kondisi?:      "Baik" | AlasanPenolakan;
  noRegistrasi?: string;
  waktuTerima?:  string;
}

export interface PenolakanInfo {
  alasan:     AlasanPenolakan | string;
  waktu:      string;
  petugas:    string;
  instruksi?: string;
}

export interface CriticalNotif {
  testNama:         string;
  nilai:            string;
  threshold:        string;
  konfirmasiOleh?:  string;
  metode?:          "Telepon" | "SMS" | "WhatsApp" | "Langsung";
  waktu?:           string;
  confirmed:        boolean;
}

export interface LabTimestamps {
  order?:       string;
  terima?:      string;
  ambil?:       string;
  registrasi?:  string;
  analisa?:     string;
  validasi?:    string;
  rilis?:       string;
}

export interface LabOrder {
  id:                string;
  noOrder:           string;
  noRM:              string;
  namaPasien:        string;
  tanggalLahir:      string;
  usia:              number;
  gender:            "L" | "P";
  tanggal:           string;
  jam:               string;
  dokter:            string;
  unitAsal:          UnitAsalLab;
  ruangan?:          string;
  prioritas:         PrioritasLab;
  status:            LabStatus;
  items:             LabOrderItem[];
  hasil?:            HasilItem[];
  specimen?:         SpecimenInfo;
  catatan?:          string;
  penolakan?:        PenolakanInfo;
  criticalNotifs?:   CriticalNotif[];
  timestamps:        LabTimestamps;
  diterima_oleh?:    string;
  analis?:           string;
  validator?:        string;
  catatanValidator?: string;
}

export interface LabWorkflowData {
  status?:           LabStatus;
  hasil?:            HasilItem[];
  specimen?:         SpecimenInfo;
  penolakan?:        PenolakanInfo;
  criticalNotifs?:   CriticalNotif[];
  timestamps?:       Partial<LabTimestamps>;
  diterima_oleh?:    string;
  analis?:           string;
  validator?:        string;
  catatanValidator?: string;
}

// ── Config Maps ───────────────────────────────────────────

export const LAB_STATUS_CFG: Record<LabStatus, {
  label: string; badge: string; dot: string; step: number; action: string;
}> = {
  "Menunggu":        { label: "Menunggu",         badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",       dot: "bg-slate-400",    step: 0, action: "Terima Order"    },
  "Diterima":        { label: "Diterima",          badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",              dot: "bg-sky-400",      step: 1, action: "Entry Hasil"     },
  // Pengambilan/registrasi sampel dilakukan di luar aplikasi (step dihapus). Status berikut
  // dipertahankan untuk kompatibilitas tipe (tak lagi dihasilkan UI) → step disetarakan "Diterima".
  "Ambil Sampel":    { label: "Ambil Sampel",      badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",           dot: "bg-blue-400",     step: 1, action: "Entry Hasil"     },
  "Sampel Diterima": { label: "Sampel Diterima",   badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",     dot: "bg-violet-400",   step: 1, action: "Entry Hasil"     },
  "Dianalisa":       { label: "Dianalisa",         badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",        dot: "bg-amber-400",    step: 2, action: "Validasi Hasil"  },
  "Divalidasi":      { label: "Menunggu Validasi", badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",     dot: "bg-orange-400",   step: 3, action: "Rilis Hasil"     },
  "Selesai":         { label: "Selesai",           badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",  dot: "bg-emerald-400",  step: 4, action: ""               },
  "Ditolak":         { label: "Ditolak",           badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",           dot: "bg-rose-400",     step: -1, action: ""              },
};

// Alur ringkas (tanpa step sampel): Menunggu → Diterima → [Entry Hasil] → Divalidasi → Selesai.
export const LAB_STATUS_STEPS: LabStatus[] = [
  "Menunggu", "Diterima", "Dianalisa", "Divalidasi", "Selesai",
];

export const KATEGORI_CFG: Record<KategoriLab, { badge: string; dot: string; abbrev: string }> = {
  "Hematologi":        { badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",       dot: "bg-rose-400",    abbrev: "Hema"  },
  "Kimia Klinik":      { badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",           dot: "bg-sky-400",     abbrev: "Kimia" },
  "Urinalisis":        { badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",     dot: "bg-amber-400",   abbrev: "Urin"  },
  "Mikrobiologi":      { badge: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",        dot: "bg-teal-400",    abbrev: "Mikro" },
  "Serologi":          { badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",  dot: "bg-violet-400",  abbrev: "Sero"  },
  "Koagulasi":         { badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",  dot: "bg-orange-400",  abbrev: "Koag"  },
  "Analisa Gas Darah": { badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",    dot: "bg-slate-500",   abbrev: "AGD"   },
  "Feses":             { badge: "bg-stone-100 text-stone-700 ring-1 ring-stone-200",    dot: "bg-stone-400",   abbrev: "Feses" },
  "Imunologi":         { badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",  dot: "bg-indigo-400",  abbrev: "Imuno" },
  "Toksikologi":       { badge: "bg-lime-50 text-lime-700 ring-1 ring-lime-200",        dot: "bg-lime-500",    abbrev: "Toks"  },
};

export const PRIORITAS_CFG: Record<PrioritasLab, { badge: string; ring: string }> = {
  CITO:   { badge: "bg-rose-500 text-white",       ring: "ring-rose-300"  },
  Segera: { badge: "bg-amber-100 text-amber-700",  ring: "ring-amber-200" },
  Rutin:  { badge: "bg-slate-100 text-slate-600",  ring: "ring-slate-200" },
};

export const UNIT_CFG: Record<UnitAsalLab, { badge: string }> = {
  "IGD":         { badge: "bg-rose-100 text-rose-700"     },
  "Rawat Inap":  { badge: "bg-sky-100 text-sky-700"       },
  "Rawat Jalan": { badge: "bg-emerald-100 text-emerald-700" },
};

export const FLAG_CFG: Record<FlagHasil, { cls: string; label: string }> = {
  N: { cls: "text-emerald-600",                      label: "N"      },
  H: { cls: "text-amber-700 font-bold",              label: "H ↑"    },
  L: { cls: "text-sky-700 font-bold",                label: "L ↓"    },
  C: { cls: "text-rose-700 font-extrabold",          label: "KRITIS" },
};

export const ALASAN_PENOLAKAN: AlasanPenolakan[] = [
  "Hemolisis", "Lipemia", "Bekuan", "Volume Kurang",
  "Salah Tabung", "Label Rusak/Salah", "Lainnya",
];

// ── TAT Configuration ─────────────────────────────────────

export const TAT_TARGET: Record<PrioritasLab | UnitAsalLab, number> = {
  CITO:          60,
  Segera:        120,
  Rutin:         240,
  IGD:           60,
  "Rawat Inap":  120,
  "Rawat Jalan": 120,
};

// ── DB mapping (DTO → LabOrder) ───────────────────────────

function calcUsia(tglLahir: string | null): number {
  if (!tglLahir) return 0;
  const d = new Date(tglLahir);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a < 0 ? 0 : a;
}

function toLabStatus(s: string): LabStatus {
  return (s in LAB_STATUS_CFG ? s : "Menunggu") as LabStatus;
}

function toKategori(k: string): KategoriLab {
  return (k in KATEGORI_CFG ? k : "Kimia Klinik") as KategoriLab;
}

function toPrioritas(p: string): PrioritasLab {
  return (p === "CITO" || p === "Segera" || p === "Rutin" ? p : "Rutin") as PrioritasLab;
}

function toUnitAsal(u: string): UnitAsalLab {
  return (u === "IGD" || u === "Rawat Inap" || u === "Rawat Jalan" ? u : "Rawat Jalan") as UnitAsalLab;
}

/** DTO worklist Lab (medicalrecord.LabOrder) → LabOrder FE (hasil/specimen kosong = overlay sesi). */
export function mapDbLabOrder(dto: LabOrderWorklistDTO): LabOrder {
  const dt = new Date(dto.createdAt);
  return {
    id:           dto.id,
    noOrder:      dto.noOrder,
    noRM:         dto.noRM,
    namaPasien:   dto.namaPasien,
    tanggalLahir: dto.tanggalLahir ?? "",
    usia:         calcUsia(dto.tanggalLahir),
    gender:       dto.gender,
    tanggal:      dto.createdAt.slice(0, 10),
    jam:          isNaN(dt.getTime()) ? "" : dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    dokter:       dto.penulis,
    unitAsal:     toUnitAsal(dto.unit),
    prioritas:    toPrioritas(dto.prioritas),
    status:       toLabStatus(dto.status),
    catatan:      dto.catatan ?? undefined,
    items: dto.items.map((it) => ({
      id:          it.id,
      labTestId:   it.labTestId,
      kode:        it.kodeTes,
      nama:        it.namaTes,
      kategori:    toKategori(it.kategori),
      waktuTunggu: it.waktuTunggu ?? "—",
    })),
    timestamps: { order: dto.createdAt },
  };
}

// ── Entry Hasil dari katalog (parameter master.LabTest → baris HasilItem) ──
// Pengambilan sampel di luar aplikasi → baris hasil disusun langsung dari parameter
// katalog tes yang diorder, rujukan disesuaikan gender+usia pasien.

/** Baris rujukan paling cocok utk gender+usia (fallback LP / baris pertama). */
function pickRujukan(rujukan: LabRujukanDTO[], gender: "L" | "P", usia: number): LabRujukanDTO | undefined {
  if (rujukan.length === 0) return undefined;
  const inAge = (r: LabRujukanDTO) =>
    (r.usiaMin === undefined || usia >= r.usiaMin) && (r.usiaMax === undefined || usia <= r.usiaMax);
  return (
    rujukan.find((r) => r.gender === gender && inAge(r)) ??
    rujukan.find((r) => r.gender === "LP" && inAge(r)) ??
    rujukan.find((r) => r.gender === gender) ??
    rujukan.find((r) => r.gender === "LP") ??
    rujukan[0]
  );
}

/** Susun baris Entry Hasil (1 baris per parameter katalog). Tes tanpa katalog → 1 baris tes. */
export function buildHasilFromCatalog(order: LabOrder, tests: LabTestDTO[]): HasilItem[] {
  const byId = new Map(tests.map((t) => [t.id, t]));
  const rows: HasilItem[] = [];
  for (const item of order.items) {
    const test = item.labTestId ? byId.get(item.labTestId) : undefined;
    if (test && test.parameters.length > 0) {
      for (const p of test.parameters) {
        const r = pickRujukan(p.rujukan, order.gender, order.usia);
        rows.push({
          rowKey:       `${test.id}:${p.id}`,
          kode:         test.kode || item.kode,
          nama:         p.nama,
          kategori:     item.kategori,
          satuan:       p.satuan ?? "",
          rujukanStr:   r ? `${r.low} – ${r.high}` : (p.nilaiNormalText || "—"),
          nilaiMin:     r?.low,
          nilaiMax:     r?.high,
          criticalLow:  p.criticalLow ?? undefined,
          criticalHigh: p.criticalHigh ?? undefined,
        });
      }
    } else {
      rows.push({
        rowKey:     item.id,
        kode:       item.kode,
        nama:       item.nama,
        kategori:   item.kategori,
        satuan:     "",
        rujukanStr: "—",
      });
    }
  }
  return rows;
}

/** Kunci unik baris hasil (param-level bila dari katalog, else kode tes). */
export const hasilKey = (h: HasilItem): string => h.rowKey ?? h.kode;

/** Nilai hasil tersimpan (DTO DB) → baris HasilItem (kategori di-coerce agar KATEGORI_CFG aman). */
export function dtoValueToHasil(v: LabResultDTO["values"][number]): HasilItem {
  return {
    rowKey:       v.rowKey,
    kode:         v.kodeTes,
    nama:         v.nama,
    kategori:     (v.kategori in KATEGORI_CFG ? v.kategori : "Kimia Klinik") as KategoriLab,
    nilai:        v.nilai ?? undefined,
    satuan:       v.satuan,
    rujukanStr:   v.rujukanStr,
    nilaiMin:     v.nilaiMin ?? undefined,
    nilaiMax:     v.nilaiMax ?? undefined,
    criticalLow:  v.criticalLow ?? undefined,
    criticalHigh: v.criticalHigh ?? undefined,
    flag:         v.flag ?? undefined,
  };
}

// ── Workflow Overlay (in-session; BUKAN mock data — kosong saat awal) ──
// Progres sampel/hasil/validasi belum punya endpoint persist → ditahan client per order id.

const _labStore = new Map<string, LabWorkflowData>();

export function updateLabWorkflow(id: string, data: LabWorkflowData): void {
  const prev = _labStore.get(id) ?? {};
  _labStore.set(id, {
    ...prev,
    ...data,
    timestamps: { ...(prev.timestamps ?? {}), ...(data.timestamps ?? {}) },
  });
}

/** Tempel overlay sesi pada order hasil mapDbLabOrder (status/hasil/specimen/timestamps terbaru). */
export function applyWorkflowOverlay(base: LabOrder): LabOrder {
  const overlay = _labStore.get(base.id);
  if (!overlay) return base;
  return {
    ...base,
    ...overlay,
    timestamps:     { ...base.timestamps, ...(overlay.timestamps ?? {}) },
    specimen:       overlay.specimen  ?? base.specimen,
    hasil:          overlay.hasil     ?? base.hasil,
    penolakan:      overlay.penolakan ?? base.penolakan,
    criticalNotifs: overlay.criticalNotifs ?? base.criticalNotifs,
  };
}

// ── Utility Functions ─────────────────────────────────────

export function calcTATMenit(from?: string, to?: string): number | null {
  if (!from || !to) return null;
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000);
}

export function getTATStatus(
  menit: number | null,
  prioritas: PrioritasLab,
  unitAsal: UnitAsalLab,
): "ok" | "warning" | "over" | "pending" {
  if (menit === null) return "pending";
  const target = prioritas === "CITO"
    ? TAT_TARGET.CITO
    : unitAsal === "IGD" ? TAT_TARGET.IGD
    : unitAsal === "Rawat Inap" ? TAT_TARGET["Rawat Inap"]
    : TAT_TARGET["Rawat Jalan"];
  if (menit <= target * 0.8) return "ok";
  if (menit <= target) return "warning";
  return "over";
}

export function getTATElapsed(timestamps: LabTimestamps): number | null {
  if (!timestamps.order) return null;
  const end = timestamps.rilis ?? new Date().toISOString().slice(0, 16);
  return calcTATMenit(timestamps.order, end);
}

export function autoFlag(
  nilai: string | undefined,
  nilaiMin?: number,
  nilaiMax?: number,
  criticalLow?: number,
  criticalHigh?: number,
): FlagHasil | undefined {
  if (!nilai) return undefined;
  const v = parseFloat(nilai);
  if (isNaN(v)) return undefined;
  if (criticalLow  !== undefined && v < criticalLow)  return "C";
  if (criticalHigh !== undefined && v > criticalHigh) return "C";
  if (nilaiMin !== undefined && v < nilaiMin) return "L";
  if (nilaiMax !== undefined && v > nilaiMax) return "H";
  return "N";
}

export function hasCriticalResult(hasil: HasilItem[]): boolean {
  return hasil.some((h) => h.flag === "C" && !!h.nilai);
}

export function fmtTimestamp(ts?: string): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
