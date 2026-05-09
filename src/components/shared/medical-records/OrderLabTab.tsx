"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search, X, FlaskConical, User, Building2, Calendar,
  Clock, Stethoscope, ChevronDown, ChevronRight, Printer,
  CheckCircle2, AlertCircle, Eye, Ban,
  FileText, Activity, Microscope, Radiation, HeartPulse,
  Syringe, BarChart3, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Normalized patient interface ──────────────────────────

export interface OrderLabPatient {
  doctor:       string;
  name:         string;
  noRM:         string;
  age:          number;
  gender:       "L" | "P";
  tglOrder:     string;
  unitPengirim: string;
}

// ── Types ─────────────────────────────────────────────────

type KategoriLab = "Hematologi" | "Kimia Klinik" | "Urinalisis" | "Mikrobiologi" | "Serologi" | "Koagulasi" | "Analisa Gas Darah";
type StatusOrder = "Menunggu" | "Diterima" | "Diproses" | "Selesai" | "Dibatalkan";
type StatusHasil = "Normal" | "Abnormal Rendah" | "Abnormal Tinggi" | "Kritis";

interface LabTest {
  kode: string;
  nama: string;
  kategori: KategoriLab;
  waktuTunggu: string;
  satuan?: string;
  nilaiNormal?: string;
}

interface OrderItem {
  id: string;
  kode: string;
  nama: string;
  kategori: KategoriLab;
  waktuTunggu: string;
}

interface HasilItem {
  nama: string;
  nilai: string;
  satuan: string;
  nilaiNormal: string;
  status: StatusHasil;
}

interface RiwayatOrder {
  id: string;
  noOrder: string;
  tanggal: string;
  jam: string;
  dokter: string;
  unit: string;
  status: StatusOrder;
  catatan?: string;
  items: OrderItem[];
  hasil?: HasilItem[];
}

interface ActiveOrder {
  id: string;
  noOrder: string;
  tanggal: string;
  jam: string;
  dokter: string;
  status: StatusOrder;
  catatan?: string;
  items: OrderItem[];
}

// ── Mock catalog ──────────────────────────────────────────

const LAB_CATALOG: LabTest[] = [
  { kode: "LAB-H001", nama: "Darah Lengkap (DL)", kategori: "Hematologi", waktuTunggu: "1–2 jam" },
  { kode: "LAB-H002", nama: "Hemoglobin (Hb)", kategori: "Hematologi", waktuTunggu: "30 mnt" },
  { kode: "LAB-H003", nama: "Hematokrit", kategori: "Hematologi", waktuTunggu: "30 mnt" },
  { kode: "LAB-H004", nama: "Trombosit", kategori: "Hematologi", waktuTunggu: "30 mnt" },
  { kode: "LAB-H005", nama: "Leukosit", kategori: "Hematologi", waktuTunggu: "30 mnt" },
  { kode: "LAB-H006", nama: "Diff Count", kategori: "Hematologi", waktuTunggu: "1 jam" },
  { kode: "LAB-H007", nama: "Retikulosit", kategori: "Hematologi", waktuTunggu: "2 jam" },
  { kode: "LAB-K001", nama: "GDS (Gula Darah Sewaktu)", kategori: "Kimia Klinik", waktuTunggu: "15 mnt" },
  { kode: "LAB-K002", nama: "GDP (Gula Darah Puasa)", kategori: "Kimia Klinik", waktuTunggu: "15 mnt" },
  { kode: "LAB-K003", nama: "HbA1c", kategori: "Kimia Klinik", waktuTunggu: "2 jam" },
  { kode: "LAB-K004", nama: "Ureum / BUN", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K005", nama: "Kreatinin", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K006", nama: "SGOT / AST", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K007", nama: "SGPT / ALT", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K008", nama: "Natrium (Na)", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K009", nama: "Kalium (K)", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K010", nama: "Klorida (Cl)", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K011", nama: "Kolesterol Total", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K012", nama: "Trigliserida", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K013", nama: "HDL Kolesterol", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K014", nama: "LDL Kolesterol", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K015", nama: "Asam Urat", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K016", nama: "Protein Total", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K017", nama: "Albumin", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K018", nama: "Troponin I / T", kategori: "Kimia Klinik", waktuTunggu: "30 mnt" },
  { kode: "LAB-K019", nama: "CK-MB", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
  { kode: "LAB-K020", nama: "BNP / NT-proBNP", kategori: "Kimia Klinik", waktuTunggu: "2 jam" },
  { kode: "LAB-K021", nama: "D-Dimer", kategori: "Kimia Klinik", waktuTunggu: "2 jam" },
  { kode: "LAB-K022", nama: "CRP (C-Reactive Protein)", kategori: "Kimia Klinik", waktuTunggu: "2 jam" },
  { kode: "LAB-K023", nama: "Procalcitonin (PCT)", kategori: "Kimia Klinik", waktuTunggu: "2 jam" },
  { kode: "LAB-U001", nama: "Urinalisis Lengkap", kategori: "Urinalisis", waktuTunggu: "30 mnt" },
  { kode: "LAB-U002", nama: "Sedimen Urin", kategori: "Urinalisis", waktuTunggu: "45 mnt" },
  { kode: "LAB-U003", nama: "Protein Urin Kuantitatif", kategori: "Urinalisis", waktuTunggu: "1 jam" },
  { kode: "LAB-M001", nama: "Kultur Darah (Blood Culture)", kategori: "Mikrobiologi", waktuTunggu: "3–5 hari" },
  { kode: "LAB-M002", nama: "Kultur Urin", kategori: "Mikrobiologi", waktuTunggu: "2–3 hari" },
  { kode: "LAB-M003", nama: "Gram Staining", kategori: "Mikrobiologi", waktuTunggu: "2 jam" },
  { kode: "LAB-S001", nama: "Widal Test", kategori: "Serologi", waktuTunggu: "2 jam" },
  { kode: "LAB-S002", nama: "HBsAg", kategori: "Serologi", waktuTunggu: "2 jam" },
  { kode: "LAB-S003", nama: "Anti HCV", kategori: "Serologi", waktuTunggu: "2 jam" },
  { kode: "LAB-S004", nama: "HIV Rapid Test", kategori: "Serologi", waktuTunggu: "1 jam" },
  { kode: "LAB-S005", nama: "Dengue NS1 / IgM / IgG", kategori: "Serologi", waktuTunggu: "2 jam" },
  { kode: "LAB-C001", nama: "PT (Prothrombin Time)", kategori: "Koagulasi", waktuTunggu: "1 jam" },
  { kode: "LAB-C002", nama: "APTT", kategori: "Koagulasi", waktuTunggu: "1 jam" },
  { kode: "LAB-C003", nama: "INR", kategori: "Koagulasi", waktuTunggu: "1 jam" },
  { kode: "LAB-C004", nama: "Fibrinogen", kategori: "Koagulasi", waktuTunggu: "2 jam" },
  { kode: "LAB-A001", nama: "Analisa Gas Darah (AGD)", kategori: "Analisa Gas Darah", waktuTunggu: "30 mnt" },
  { kode: "LAB-A002", nama: "Laktat", kategori: "Analisa Gas Darah", waktuTunggu: "30 mnt" },
];

// ── Mock active orders per patient ────────────────────────

const ACTIVE_ORDERS_MOCK: Record<string, ActiveOrder[]> = {
  "RM-2025-005": [
    {
      id: "ao-1",
      noOrder: "LAB/2026/04/0312",
      tanggal: "14 April 2026",
      jam: "10:35",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Diproses",
      catatan: "CITO — Troponin urgent",
      items: [
        { id: "oi-1", kode: "LAB-K018", nama: "Troponin I / T", kategori: "Kimia Klinik", waktuTunggu: "30 mnt" },
        { id: "oi-2", kode: "LAB-H001", nama: "Darah Lengkap (DL)", kategori: "Hematologi", waktuTunggu: "1–2 jam" },
        { id: "oi-3", kode: "LAB-A001", nama: "Analisa Gas Darah (AGD)", kategori: "Analisa Gas Darah", waktuTunggu: "30 mnt" },
      ],
    },
  ],
  "RM-2025-012": [
    {
      id: "ao-2",
      noOrder: "LAB/2026/04/0305",
      tanggal: "14 April 2026",
      jam: "11:08",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Menunggu",
      items: [
        { id: "oi-4", kode: "LAB-K001", nama: "GDS (Gula Darah Sewaktu)", kategori: "Kimia Klinik", waktuTunggu: "15 mnt" },
      ],
    },
  ],
  "RM-2025-003": [
    {
      id: "ao-ri-1",
      noOrder: "LAB/2026/05/0421",
      tanggal: "3 Mei 2025",
      jam: "08:20",
      dokter: "dr. Dewi Kusuma, Sp.JP",
      status: "Selesai",
      catatan: "Monitoring GJK — BNP serial",
      items: [
        { id: "oi-ri-1", kode: "LAB-K020", nama: "BNP / NT-proBNP", kategori: "Kimia Klinik", waktuTunggu: "2 jam" },
        { id: "oi-ri-2", kode: "LAB-K004", nama: "Ureum / BUN", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
        { id: "oi-ri-3", kode: "LAB-K005", nama: "Kreatinin", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
      ],
    },
  ],
};

// ── Mock riwayat lab per noRM ─────────────────────────────

const RIWAYAT_LAB_MOCK: Record<string, RiwayatOrder[]> = {
  "RM-2025-005": [
    {
      id: "rl-1",
      noOrder: "LAB/2026/04/0189",
      tanggal: "10 April 2026",
      jam: "08:15",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      unit: "Poli Jantung",
      status: "Selesai",
      items: [
        { id: "ri-1", kode: "LAB-K011", nama: "Kolesterol Total", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
        { id: "ri-2", kode: "LAB-K013", nama: "HDL Kolesterol", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
        { id: "ri-3", kode: "LAB-K014", nama: "LDL Kolesterol", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
        { id: "ri-4", kode: "LAB-K012", nama: "Trigliserida", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
      ],
      hasil: [
        { nama: "Kolesterol Total", nilai: "248", satuan: "mg/dL", nilaiNormal: "< 200", status: "Abnormal Tinggi" },
        { nama: "HDL Kolesterol", nilai: "38", satuan: "mg/dL", nilaiNormal: "> 40", status: "Abnormal Rendah" },
        { nama: "LDL Kolesterol", nilai: "172", satuan: "mg/dL", nilaiNormal: "< 130", status: "Abnormal Tinggi" },
        { nama: "Trigliserida", nilai: "195", satuan: "mg/dL", nilaiNormal: "< 150", status: "Abnormal Tinggi" },
      ],
    },
    {
      id: "rl-2",
      noOrder: "LAB/2026/02/0091",
      tanggal: "12 Februari 2026",
      jam: "10:20",
      dokter: "dr. Anisa Putri, Sp.PD",
      unit: "IGD",
      status: "Selesai",
      items: [
        { id: "ri-5", kode: "LAB-H001", nama: "Darah Lengkap (DL)", kategori: "Hematologi", waktuTunggu: "1–2 jam" },
        { id: "ri-6", kode: "LAB-K018", nama: "Troponin I / T", kategori: "Kimia Klinik", waktuTunggu: "30 mnt" },
        { id: "ri-7", kode: "LAB-C001", nama: "PT (Prothrombin Time)", kategori: "Koagulasi", waktuTunggu: "1 jam" },
        { id: "ri-8", kode: "LAB-C002", nama: "APTT", kategori: "Koagulasi", waktuTunggu: "1 jam" },
        { id: "ri-9", kode: "LAB-A001", nama: "Analisa Gas Darah (AGD)", kategori: "Analisa Gas Darah", waktuTunggu: "30 mnt" },
      ],
      hasil: [
        { nama: "Hemoglobin", nilai: "12.8", satuan: "g/dL", nilaiNormal: "13.5–17.5", status: "Abnormal Rendah" },
        { nama: "Leukosit", nilai: "14.2", satuan: "10³/µL", nilaiNormal: "4.5–11.0", status: "Abnormal Tinggi" },
        { nama: "Trombosit", nilai: "215", satuan: "10³/µL", nilaiNormal: "150–400", status: "Normal" },
        { nama: "Troponin I", nilai: "2.8", satuan: "ng/mL", nilaiNormal: "< 0.04", status: "Kritis" },
        { nama: "PT", nilai: "14.2", satuan: "detik", nilaiNormal: "11.0–13.5", status: "Abnormal Tinggi" },
        { nama: "APTT", nilai: "38", satuan: "detik", nilaiNormal: "25–35", status: "Abnormal Tinggi" },
        { nama: "pH", nilai: "7.31", satuan: "", nilaiNormal: "7.35–7.45", status: "Abnormal Rendah" },
        { nama: "pO2", nilai: "68", satuan: "mmHg", nilaiNormal: "80–100", status: "Abnormal Rendah" },
        { nama: "pCO2", nilai: "48", satuan: "mmHg", nilaiNormal: "35–45", status: "Abnormal Tinggi" },
      ],
    },
  ],
  "RM-2025-012": [
    {
      id: "rl-3",
      noOrder: "LAB/2026/04/0155",
      tanggal: "8 April 2026",
      jam: "09:00",
      dokter: "dr. Dewi Kusuma, Sp.JP",
      unit: "Rawat Jalan",
      status: "Selesai",
      items: [
        { id: "ri-10", kode: "LAB-K001", nama: "GDS (Gula Darah Sewaktu)", kategori: "Kimia Klinik", waktuTunggu: "15 mnt" },
        { id: "ri-11", kode: "LAB-K003", nama: "HbA1c", kategori: "Kimia Klinik", waktuTunggu: "2 jam" },
      ],
      hasil: [
        { nama: "GDS", nilai: "320", satuan: "mg/dL", nilaiNormal: "70–140", status: "Kritis" },
        { nama: "HbA1c", nilai: "9.2", satuan: "%", nilaiNormal: "< 5.7", status: "Kritis" },
      ],
    },
  ],
  "RM-2025-003": [
    {
      id: "rl-ri-1",
      noOrder: "LAB/2026/04/0380",
      tanggal: "28 April 2026",
      jam: "07:45",
      dokter: "dr. Dewi Kusuma, Sp.JP",
      unit: "Rawat Inap",
      status: "Selesai",
      items: [
        { id: "ri-ri-1", kode: "LAB-H001", nama: "Darah Lengkap (DL)", kategori: "Hematologi", waktuTunggu: "1–2 jam" },
        { id: "ri-ri-2", kode: "LAB-K020", nama: "BNP / NT-proBNP", kategori: "Kimia Klinik", waktuTunggu: "2 jam" },
        { id: "ri-ri-3", kode: "LAB-K008", nama: "Natrium (Na)", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
        { id: "ri-ri-4", kode: "LAB-K009", nama: "Kalium (K)", kategori: "Kimia Klinik", waktuTunggu: "1 jam" },
      ],
      hasil: [
        { nama: "Hemoglobin", nilai: "10.2", satuan: "g/dL", nilaiNormal: "13.5–17.5", status: "Abnormal Rendah" },
        { nama: "Leukosit", nilai: "9.8", satuan: "10³/µL", nilaiNormal: "4.5–11.0", status: "Normal" },
        { nama: "BNP", nilai: "1240", satuan: "pg/mL", nilaiNormal: "< 100", status: "Kritis" },
        { nama: "Natrium", nilai: "131", satuan: "mEq/L", nilaiNormal: "136–145", status: "Abnormal Rendah" },
        { nama: "Kalium", nilai: "3.2", satuan: "mEq/L", nilaiNormal: "3.5–5.0", status: "Abnormal Rendah" },
      ],
    },
  ],
};

// ── Badge configs ─────────────────────────────────────────

const KATEGORI_ICON: Record<KategoriLab, React.ElementType> = {
  Hematologi: HeartPulse,
  "Kimia Klinik": FlaskConical,
  Urinalisis: Syringe,
  Mikrobiologi: Microscope,
  Serologi: Activity,
  Koagulasi: BarChart3,
  "Analisa Gas Darah": Radiation,
};

const KATEGORI_COLOR: Record<KategoriLab, { bg: string; text: string; ring: string; icon: string }> = {
  Hematologi:          { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200",    icon: "text-rose-500"    },
  "Kimia Klinik":      { bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200",     icon: "text-sky-500"     },
  Urinalisis:          { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   icon: "text-amber-500"   },
  Mikrobiologi:        { bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-200",  icon: "text-violet-500"  },
  Serologi:            { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", icon: "text-emerald-500" },
  Koagulasi:           { bg: "bg-orange-50",  text: "text-orange-700",  ring: "ring-orange-200",  icon: "text-orange-500"  },
  "Analisa Gas Darah": { bg: "bg-indigo-50",  text: "text-indigo-700",  ring: "ring-indigo-200",  icon: "text-indigo-500"  },
};

const STATUS_ORDER_BADGE: Record<StatusOrder, string> = {
  Menunggu:    "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  Diterima:    "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  Diproses:    "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Selesai:     "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Dibatalkan:  "bg-rose-50 text-rose-500 ring-1 ring-rose-200",
};

const HASIL_STATUS_CLS: Record<StatusHasil, { badge: string; val: string }> = {
  Normal:            { badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", val: "text-emerald-700" },
  "Abnormal Rendah": { badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",             val: "text-sky-700"     },
  "Abnormal Tinggi": { badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       val: "text-amber-700"   },
  Kritis:            { badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",          val: "text-rose-700 font-bold" },
};

// ── Lab search ────────────────────────────────────────────

function LabSearch({ onSelect }: { onSelect: (test: LabTest) => void }) {
  const [query,   setQuery]   = useState("");
  const [open,    setOpen]    = useState(false);
  const [results, setResults] = useState<LabTest[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    const filtered = LAB_CATALOG.filter(
      (t) => t.nama.toLowerCase().includes(q.toLowerCase()) || t.kode.toLowerCase().includes(q.toLowerCase()),
    ).slice(0, 8);
    setResults(filtered);
    setOpen(filtered.length > 0);
  };

  const pick = (test: LabTest) => {
    setQuery("");
    setOpen(false);
    onSelect(test);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => query.length >= 2 && results.length > 0 && setOpen(true)}
          placeholder="Ketik nama pemeriksaan atau kode LAB-..."
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((test) => {
            const color = KATEGORI_COLOR[test.kategori];
            const Icon  = KATEGORI_ICON[test.kategori];
            return (
              <button
                key={test.kode}
                type="button"
                onClick={() => pick(test)}
                className="flex w-full items-center gap-3 border-b border-slate-50 px-3 py-2.5 text-left text-xs last:border-0 transition hover:bg-slate-50"
              >
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1", color.bg, color.ring)}>
                  <Icon size={11} className={color.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{test.nama}</p>
                  <p className="text-[10px] text-slate-400">{test.kode}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium ring-1", color.bg, color.text, color.ring)}>
                    {test.kategori}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                    <Clock size={9} /> {test.waktuTunggu}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── KategoriChip ──────────────────────────────────────────

function KategoriChip({ kategori }: { kategori: KategoriLab }) {
  const color = KATEGORI_COLOR[kategori];
  const Icon  = KATEGORI_ICON[kategori];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1", color.bg, color.text, color.ring)}>
      <Icon size={9} />
      {kategori}
    </span>
  );
}

// ── Hasil modal ───────────────────────────────────────────

function HasilModal({ order, onClose }: { order: RiwayatOrder; onClose: () => void }) {
  const hasil       = order.hasil ?? [];
  const kritisCount = hasil.filter((h) => h.status === "Kritis").length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <FileText size={13} />
              </span>
              <p className="text-sm font-semibold text-slate-800">Hasil Pemeriksaan Lab</p>
              {kritisCount > 0 && (
                <span className="flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 ring-1 ring-rose-200">
                  <AlertCircle size={10} /> {kritisCount} nilai kritis
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-9 text-[11px] text-slate-400">
              <span className="font-mono">{order.noOrder}</span>
              <span>·</span>
              <span>{order.tanggal} {order.jam}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Stethoscope size={10} />{order.dokter}</span>
              <span>·</span>
              <span>{order.unit}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Printer size={12} /> Cetak
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              aria-label="Tutup"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pemeriksaan</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">Hasil</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Satuan</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nilai Normal</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Interpretasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {hasil.map((h, i) => {
                const cls = HASIL_STATUS_CLS[h.status];
                return (
                  <tr key={i} className={cn("transition hover:bg-slate-50/70", h.status === "Kritis" && "bg-rose-50/50")}>
                    <td className="px-5 py-2.5 font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        {h.status === "Kritis" && <AlertCircle size={11} className="shrink-0 text-rose-500" />}
                        {h.nama}
                      </div>
                    </td>
                    <td className={cn("px-4 py-2.5 text-right font-bold tabular-nums", cls.val)}>{h.nilai}</td>
                    <td className="px-4 py-2.5 text-slate-500">{h.satuan}</td>
                    <td className="px-4 py-2.5 text-slate-400">{h.nilaiNormal}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", cls.badge)}>{h.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-[11px] text-slate-400">{hasil.length} parameter diperiksa</p>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────

function EmptyOrder() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
        <FlaskConical size={18} />
      </span>
      <p className="text-xs text-slate-400">Belum ada pemeriksaan dalam daftar order</p>
      <p className="text-[11px] text-slate-300">Cari tindakan lab di kolom kiri</p>
    </div>
  );
}

// ── Riwayat Lab section ───────────────────────────────────

function RiwayatLabSection({ riwayat }: { riwayat: RiwayatOrder[] }) {
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set([riwayat[0]?.id]));
  const [modalOrder, setModalOrder] = useState<RiwayatOrder | null>(null);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (riwayat.length === 0) return null;

  return (
    <>
      {modalOrder && <HasilModal order={modalOrder} onClose={() => setModalOrder(null)} />}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
          <Clock size={13} className="text-slate-400" />
          <p className="text-xs font-semibold text-slate-700">Riwayat Pemeriksaan Lab</p>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {riwayat.length} order
          </span>
        </div>

        <div className="divide-y divide-slate-50">
          {riwayat.map((r) => {
            const open = expanded.has(r.id);
            return (
              <div key={r.id}>
                <div className="flex items-center gap-2 px-4 py-2.5 transition hover:bg-slate-50">
                  <button
                    type="button"
                    onClick={() => toggle(r.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="shrink-0 text-slate-400">
                      {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-xs font-semibold text-slate-700">{r.tanggal}</span>
                      <span className="text-[11px] text-slate-400">{r.jam}</span>
                      <span className="font-mono text-[11px] text-slate-400">{r.noOrder}</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Stethoscope size={10} /> {r.dokter}
                      </span>
                      <span className="text-[11px] text-slate-400">{r.unit}</span>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">{r.items.length} tes</span>
                    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", STATUS_ORDER_BADGE[r.status])}>
                      {r.status}
                    </span>
                    {r.status === "Selesai" && r.hasil && (
                      <button
                        type="button"
                        onClick={() => setModalOrder(r)}
                        className="flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <Eye size={10} /> Lihat Hasil
                      </button>
                    )}
                  </div>
                </div>

                {open && (
                  <div className="border-t border-slate-50 bg-slate-50/40 px-4 pb-3 pt-2">
                    <div className="flex flex-col gap-1.5">
                      {r.items.map((item) => {
                        const color = KATEGORI_COLOR[item.kategori];
                        const Icon  = KATEGORI_ICON[item.kategori];
                        return (
                          <div key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1", color.bg, color.ring)}>
                              <Icon size={11} className={color.icon} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-slate-800">{item.nama}</p>
                              <p className="text-[10px] text-slate-400">{item.kode}</p>
                            </div>
                            <KategoriChip kategori={item.kategori} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Active order card ─────────────────────────────────────

function ActiveOrderCard({ order, onCancel }: { order: ActiveOrder; onCancel: (id: string) => void }) {
  const canCancel = order.status === "Menunggu";

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border shadow-xs",
      order.status === "Dibatalkan" ? "border-slate-200 opacity-60" : "border-slate-200 bg-white",
    )}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-mono text-[11px] font-semibold text-slate-700">{order.noOrder}</span>
          <span className="text-[11px] text-slate-400">{order.jam} · {order.tanggal}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", STATUS_ORDER_BADGE[order.status])}>
            {order.status}
          </span>
          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(order.id)}
              className="flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-600 transition hover:bg-rose-100"
            >
              <Ban size={10} /> Batalkan
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-2.5">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Stethoscope size={11} className="shrink-0 text-slate-400" />
          <span>{order.dokter}</span>
          {order.catatan && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-amber-600">{order.catatan}</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {order.items.map((item) => {
            const color = KATEGORI_COLOR[item.kategori];
            const Icon  = KATEGORI_ICON[item.kategori];
            return (
              <span
                key={item.id}
                className={cn("inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium ring-1", color.bg, color.text, color.ring)}
              >
                <Icon size={10} className={color.icon} />
                {item.nama}
                <span className="ml-0.5 text-[10px] opacity-70">({item.waktuTunggu})</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export default function OrderLabTab({ patient }: { patient: OrderLabPatient }) {
  const [orderItems,    setOrderItems]    = useState<OrderItem[]>([]);
  const [catatan,       setCatatan]       = useState("");
  const [priority,      setPriority]      = useState<"Rutin" | "Cito">("Rutin");
  const [submitted,     setSubmitted]     = useState(false);
  const [activeOrders,  setActiveOrders]  = useState<ActiveOrder[]>(
    ACTIVE_ORDERS_MOCK[patient.noRM] ?? [],
  );

  const riwayat        = RIWAYAT_LAB_MOCK[patient.noRM] ?? [];
  const alreadyInOrder = new Set(orderItems.map((i) => i.kode));

  const addTest = (test: LabTest) => {
    if (alreadyInOrder.has(test.kode)) return;
    setOrderItems((prev) => [
      ...prev,
      { id: `oi-${Date.now()}`, kode: test.kode, nama: test.nama, kategori: test.kategori, waktuTunggu: test.waktuTunggu },
    ]);
  };

  const removeTest  = (id: string) => setOrderItems((prev) => prev.filter((i) => i.id !== id));
  const cancelOrder = (orderId: string) =>
    setActiveOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "Dibatalkan" as StatusOrder } : o));

  const handleSubmit = () => {
    if (orderItems.length === 0) return;
    const newOrder: ActiveOrder = {
      id:       `ao-${Date.now()}`,
      noOrder:  `LAB/2026/04/${String(Math.floor(Math.random() * 900) + 100).padStart(4, "0")}`,
      tanggal:  patient.tglOrder,
      jam:      new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      dokter:   patient.doctor,
      status:   "Menunggu",
      catatan:  priority === "Cito" ? "CITO" : catatan || undefined,
      items:    orderItems,
    };
    setActiveOrders((prev) => [newOrder, ...prev]);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={28} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-700">Order Lab Berhasil Dikirim</p>
          <p className="mt-1 text-xs text-slate-500">
            {orderItems.length} pemeriksaan · prioritas{" "}
            <span className={cn("font-semibold", priority === "Cito" ? "text-rose-600" : "text-slate-700")}>{priority}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">Pengirim: {patient.doctor}</p>
        </div>
        <button
          onClick={() => { setSubmitted(false); setOrderItems([]); setCatatan(""); setPriority("Rutin"); }}
          className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Buat Order Baru
        </button>
      </div>
    );
  }

  const nonCancelledActiveOrders = activeOrders.filter((o) => o.status !== "Dibatalkan");
  const cancelledOrders          = activeOrders.filter((o) => o.status === "Dibatalkan");

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header info ── */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <User size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Dokter Pengirim</p>
              <p className="text-xs font-semibold text-slate-800">{patient.doctor}</p>
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-100 sm:block" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <FileText size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pasien</p>
              <p className="text-xs font-semibold text-slate-800">{patient.name}</p>
              <p className="text-[11px] text-slate-400">
                {patient.noRM} · {patient.age} thn · {patient.gender === "L" ? "Laki-laki" : "Perempuan"}
              </p>
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-100 sm:block" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Calendar size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tanggal Order</p>
              <p className="text-xs font-semibold text-slate-800">{patient.tglOrder}</p>
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-100 sm:block" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Building2 size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Unit Pengirim</p>
              <p className="text-xs font-semibold text-slate-800">{patient.unitPengirim}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column area ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* ── Left: Panduan + Search + form ── */}
        <div className="flex flex-col gap-3">

          <div className="rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-sky-600">Panduan Order Lab</p>
            <ul className="space-y-1">
              {[
                "Order CITO memerlukan persetujuan dokter jaga dan konfirmasi ke lab.",
                "Hasil pemeriksaan hematologi rutin tersedia dalam 1–2 jam.",
                "Kultur darah memerlukan sampel sebelum pemberian antibiotik.",
                "Pemeriksaan AGD wajib dicantumkan kondisi O₂ pasien saat pengambilan.",
                "Untuk pemeriksaan khusus, lampirkan indikasi klinis yang jelas.",
                "Order dapat dibatalkan selama status masih 'Menunggu'.",
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-sky-700">
                  <span className="mt-0.5 shrink-0 text-sky-400">•</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold text-slate-700">Tambah Pemeriksaan</p>

            <div className="flex flex-col gap-3">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Cari Tindakan Lab <span className="text-rose-400">*</span>
                </p>
                <LabSearch onSelect={addTest} />
                <p className="mt-1.5 text-[10px] text-slate-400">
                  Ketik minimal 2 karakter · pemeriksaan yang sudah ditambah tidak muncul kembali
                </p>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Paket Cepat</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "DL + Elektrolit",    tests: ["LAB-H001", "LAB-K008", "LAB-K009", "LAB-K010"] },
                    { label: "Panel Jantung",       tests: ["LAB-K018", "LAB-K019", "LAB-K020", "LAB-A001"] },
                    { label: "Fungsi Ginjal",       tests: ["LAB-K004", "LAB-K005"] },
                    { label: "Fungsi Hati",         tests: ["LAB-K006", "LAB-K007", "LAB-K016", "LAB-K017"] },
                    { label: "Panel DM",            tests: ["LAB-K001", "LAB-K003"] },
                    { label: "Koagulasi Lengkap",   tests: ["LAB-C001", "LAB-C002", "LAB-C003", "LAB-C004"] },
                  ].map((pkg) => {
                    const allAdded = pkg.tests.every((kode) => alreadyInOrder.has(kode));
                    return (
                      <button
                        key={pkg.label}
                        type="button"
                        disabled={allAdded}
                        onClick={() => {
                          pkg.tests.forEach((kode) => {
                            const test = LAB_CATALOG.find((t) => t.kode === kode);
                            if (test && !alreadyInOrder.has(kode)) addTest(test);
                          });
                        }}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition",
                          allAdded
                            ? "cursor-default border-emerald-200 bg-emerald-50 text-emerald-600"
                            : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700",
                        )}
                      >
                        {allAdded ? <><Check size={9} className="mr-0.5 inline" />{pkg.label}</> : `+ ${pkg.label}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Prioritas</p>
                <div className="flex gap-2">
                  {(["Rutin", "Cito"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                        priority === p
                          ? p === "Cito"
                            ? "border-rose-400 bg-rose-50 text-rose-700"
                            : "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      {p === "Cito" && <AlertCircle size={11} />}
                      {p}
                    </button>
                  ))}
                </div>
                {priority === "Cito" && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-rose-600">
                    <AlertCircle size={10} />
                    Order CITO memerlukan konfirmasi telepon ke laboratorium
                  </p>
                )}
              </div>

              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Catatan Klinis</p>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={2}
                  placeholder="Contoh: pasien sedang antikoagulan, kondisi O₂ saat pengambilan AGD..."
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Daftar order + active orders ── */}
        <div className="flex flex-col gap-3">

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-slate-700">Daftar Order Baru</p>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-600">
                  {orderItems.length}
                </span>
              </div>
              {orderItems.length > 0 && (
                <button
                  onClick={() => setOrderItems([])}
                  className="text-[11px] text-slate-400 transition hover:text-rose-500"
                >
                  Hapus semua
                </button>
              )}
            </div>
            <div className="p-3">
              {orderItems.length === 0 ? (
                <EmptyOrder />
              ) : (
                <div className="flex flex-col gap-2">
                  {orderItems.map((item) => {
                    const color = KATEGORI_COLOR[item.kategori];
                    const Icon  = KATEGORI_ICON[item.kategori];
                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1", color.bg, color.ring)}>
                          <Icon size={14} className={color.icon} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800">{item.nama}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <KategoriChip kategori={item.kategori} />
                            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                              <Clock size={9} /> {item.waktuTunggu}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeTest(item.id)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {activeOrders.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
                <Activity size={13} className="text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">Order Aktif</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {nonCancelledActiveOrders.length} order
                </span>
              </div>
              <div className="flex flex-col gap-3 p-3">
                {nonCancelledActiveOrders.map((order) => (
                  <ActiveOrderCard key={order.id} order={order} onCancel={cancelOrder} />
                ))}
                {cancelledOrders.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Dibatalkan</p>
                    {cancelledOrders.map((order) => (
                      <ActiveOrderCard key={order.id} order={order} onCancel={cancelOrder} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {riwayat.length > 0 && <RiwayatLabSection riwayat={riwayat} />}

      {/* ── Sticky footer ── */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {orderItems.length === 0 ? (
            <p className="text-xs text-slate-400">Tambahkan pemeriksaan ke daftar order terlebih dahulu</p>
          ) : (
            <>
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{orderItems.length} pemeriksaan</span> siap dikirim
              </p>
              {priority === "Cito" && (
                <span className="flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 ring-1 ring-rose-200">
                  <AlertCircle size={10} /> CITO
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            Simpan Draft
          </button>
          <button
            onClick={handleSubmit}
            disabled={orderItems.length === 0}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40",
              priority === "Cito" ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700",
            )}
          >
            <FlaskConical size={13} />
            {priority === "Cito" ? "Kirim Order CITO" : "Kirim Order ke Lab"}
          </button>
        </div>
      </div>
    </div>
  );
}
