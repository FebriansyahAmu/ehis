"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search, X, User, Building2, Calendar,
  Clock, Stethoscope, ChevronDown, ChevronRight, Printer,
  CheckCircle2, AlertCircle, Eye, Ban,
  FileText, Activity, Radiation, Scan, MonitorX,
  Microscope, Layers, Zap, Check, Send,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────

type ModalitasRad =
  | "X-Ray"
  | "CT Scan"
  | "MRI"
  | "USG"
  | "Fluoroskopi"
  | "Kedokteran Nuklir";

type StatusOrder = "Menunggu" | "Diterima" | "Diproses" | "Selesai" | "Dibatalkan";

interface RadTest {
  kode: string;
  nama: string;
  modalitas: ModalitasRad;
  waktuTunggu: string;
  persiapan?: string;
}

interface OrderItem {
  id: string;
  kode: string;
  nama: string;
  modalitas: ModalitasRad;
  waktuTunggu: string;
  persiapan?: string;
}

interface HasilRad {
  modalitas: ModalitasRad;
  proyeksi?: string;
  temuan: string;
  kesan: string;
  radiolog: string;
  tanggalBaca: string;
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
  hasil?: HasilRad[];
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

const RAD_CATALOG: RadTest[] = [
  // X-Ray
  { kode: "RAD-XR001", nama: "Foto Thorax PA", modalitas: "X-Ray", waktuTunggu: "30–60 mnt" },
  { kode: "RAD-XR002", nama: "Foto Thorax AP + Lateral", modalitas: "X-Ray", waktuTunggu: "30–60 mnt" },
  { kode: "RAD-XR003", nama: "Foto Abdomen 3 Posisi", modalitas: "X-Ray", waktuTunggu: "45 mnt" },
  { kode: "RAD-XR004", nama: "Foto Cervical AP + Lateral", modalitas: "X-Ray", waktuTunggu: "30 mnt" },
  { kode: "RAD-XR005", nama: "Foto Pelvis AP", modalitas: "X-Ray", waktuTunggu: "30 mnt" },
  { kode: "RAD-XR006", nama: "Foto Femur AP + Lateral", modalitas: "X-Ray", waktuTunggu: "30 mnt" },
  { kode: "RAD-XR007", nama: "Foto Tibia-Fibula AP + Lateral", modalitas: "X-Ray", waktuTunggu: "30 mnt" },
  { kode: "RAD-XR008", nama: "Foto Humerus AP + Lateral", modalitas: "X-Ray", waktuTunggu: "30 mnt" },
  { kode: "RAD-XR009", nama: "Foto Genu AP + Lateral", modalitas: "X-Ray", waktuTunggu: "30 mnt" },
  { kode: "RAD-XR010", nama: "Foto Skull AP + Lateral", modalitas: "X-Ray", waktuTunggu: "30 mnt" },
  { kode: "RAD-XR011", nama: "Foto Cruris AP + Lateral", modalitas: "X-Ray", waktuTunggu: "30 mnt" },
  { kode: "RAD-XR012", nama: "Foto Antebrachii AP + Lateral", modalitas: "X-Ray", waktuTunggu: "30 mnt" },

  // CT Scan
  { kode: "RAD-CT001", nama: "CT Scan Kepala Non-Kontras", modalitas: "CT Scan", waktuTunggu: "1–2 jam" },
  { kode: "RAD-CT002", nama: "CT Scan Kepala + Kontras", modalitas: "CT Scan", waktuTunggu: "1–2 jam", persiapan: "Cek fungsi ginjal sebelum kontras" },
  { kode: "RAD-CT003", nama: "CT Scan Thorax Non-Kontras", modalitas: "CT Scan", waktuTunggu: "1–2 jam" },
  { kode: "RAD-CT004", nama: "CT Scan Thorax + Kontras (CTPA)", modalitas: "CT Scan", waktuTunggu: "1–2 jam", persiapan: "Cek fungsi ginjal, puasa 4 jam" },
  { kode: "RAD-CT005", nama: "CT Scan Abdomen Non-Kontras", modalitas: "CT Scan", waktuTunggu: "1–2 jam" },
  { kode: "RAD-CT006", nama: "CT Scan Abdomen + Kontras", modalitas: "CT Scan", waktuTunggu: "2 jam", persiapan: "Puasa 4 jam, cek fungsi ginjal" },
  { kode: "RAD-CT007", nama: "CT Scan Whole Abdomen Triphasic", modalitas: "CT Scan", waktuTunggu: "2–3 jam", persiapan: "Puasa 4 jam, cek fungsi ginjal" },
  { kode: "RAD-CT008", nama: "CT Scan Pelvis + Kontras", modalitas: "CT Scan", waktuTunggu: "2 jam", persiapan: "Puasa 4 jam, cek fungsi ginjal" },
  { kode: "RAD-CT009", nama: "CT Scan Cervical Non-Kontras", modalitas: "CT Scan", waktuTunggu: "1–2 jam" },
  { kode: "RAD-CT010", nama: "CT Scan Thoracolumbar", modalitas: "CT Scan", waktuTunggu: "1–2 jam" },
  { kode: "RAD-CT011", nama: "CT Angiografi Kepala (CTA)", modalitas: "CT Scan", waktuTunggu: "2–3 jam", persiapan: "Cek fungsi ginjal, puasa 4 jam" },

  // MRI
  { kode: "RAD-MR001", nama: "MRI Kepala Non-Kontras", modalitas: "MRI", waktuTunggu: "3–4 jam", persiapan: "Lepas semua logam; pasien kooperatif" },
  { kode: "RAD-MR002", nama: "MRI Kepala + Kontras", modalitas: "MRI", waktuTunggu: "3–4 jam", persiapan: "Cek fungsi ginjal, lepas logam" },
  { kode: "RAD-MR003", nama: "MRI Lumbosacral", modalitas: "MRI", waktuTunggu: "3–4 jam", persiapan: "Lepas semua logam" },
  { kode: "RAD-MR004", nama: "MRI Cervical", modalitas: "MRI", waktuTunggu: "3–4 jam", persiapan: "Lepas semua logam" },
  { kode: "RAD-MR005", nama: "MRI Abdomen", modalitas: "MRI", waktuTunggu: "4–5 jam", persiapan: "Puasa 4–6 jam, lepas logam" },

  // USG
  { kode: "RAD-US001", nama: "USG Abdomen Atas", modalitas: "USG", waktuTunggu: "1–2 jam", persiapan: "Puasa minimal 6 jam" },
  { kode: "RAD-US002", nama: "USG Abdomen Bawah", modalitas: "USG", waktuTunggu: "1–2 jam", persiapan: "Kandung kemih penuh" },
  { kode: "RAD-US003", nama: "USG Whole Abdomen", modalitas: "USG", waktuTunggu: "1–2 jam", persiapan: "Puasa 6 jam + kandung kemih penuh" },
  { kode: "RAD-US004", nama: "USG Thorax", modalitas: "USG", waktuTunggu: "1 jam" },
  { kode: "RAD-US005", nama: "USG Ginjal", modalitas: "USG", waktuTunggu: "1 jam" },
  { kode: "RAD-US006", nama: "USG FAST (Trauma)", modalitas: "USG", waktuTunggu: "30 mnt" },
  { kode: "RAD-US007", nama: "Echocardiografi", modalitas: "USG", waktuTunggu: "2–3 jam" },

  // Fluoroskopi
  { kode: "RAD-FL001", nama: "BNO–IVP", modalitas: "Fluoroskopi", waktuTunggu: "3–4 jam", persiapan: "Puasa, persiapan usus, cek fungsi ginjal" },
  { kode: "RAD-FL002", nama: "Colon In Loop", modalitas: "Fluoroskopi", waktuTunggu: "4–5 jam", persiapan: "Persiapan usus 2–3 hari" },
  { kode: "RAD-FL003", nama: "Myelografi", modalitas: "Fluoroskopi", waktuTunggu: "4–5 jam", persiapan: "Puasa, informed consent" },

  // Kedokteran Nuklir
  { kode: "RAD-NM001", nama: "Bone Scan", modalitas: "Kedokteran Nuklir", waktuTunggu: "1–2 hari", persiapan: "Injeksi radiofarmaka 3 jam sebelum scan" },
  { kode: "RAD-NM002", nama: "Thyroid Scan", modalitas: "Kedokteran Nuklir", waktuTunggu: "1 hari", persiapan: "Stop obat tiroid 2 minggu sebelum" },
];

// ── Mock active orders per noRM ───────────────────────────

const ACTIVE_ORDERS_MOCK: Record<string, ActiveOrder[]> = {
  "RM-2025-005": [
    {
      id: "ao-rad-1",
      noOrder: "RAD/2026/04/0218",
      tanggal: "14 April 2026",
      jam: "09:50",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Diproses",
      catatan: "CITO — evaluasi edema paru",
      items: [
        { id: "roi-1", kode: "RAD-XR001", nama: "Foto Thorax PA", modalitas: "X-Ray", waktuTunggu: "30–60 mnt" },
        { id: "roi-2", kode: "RAD-CT001", nama: "CT Scan Kepala Non-Kontras", modalitas: "CT Scan", waktuTunggu: "1–2 jam" },
      ],
    },
  ],
  "RM-2025-012": [
    {
      id: "ao-rad-2",
      noOrder: "RAD/2026/04/0205",
      tanggal: "14 April 2026",
      jam: "11:30",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      status: "Menunggu",
      items: [
        { id: "roi-3", kode: "RAD-US006", nama: "USG FAST (Trauma)", modalitas: "USG", waktuTunggu: "30 mnt" },
      ],
    },
  ],
};

// ── Mock riwayat per noRM ─────────────────────────────────

const RIWAYAT_RAD_MOCK: Record<string, RiwayatOrder[]> = {
  "RM-2025-005": [
    {
      id: "rr-1",
      noOrder: "RAD/2026/02/0114",
      tanggal: "12 Februari 2026",
      jam: "10:45",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      unit: "IGD",
      status: "Selesai",
      items: [
        { id: "rri-1", kode: "RAD-XR001", nama: "Foto Thorax PA", modalitas: "X-Ray", waktuTunggu: "30–60 mnt" },
        { id: "rri-2", kode: "RAD-XR010", nama: "Foto Skull AP + Lateral", modalitas: "X-Ray", waktuTunggu: "30 mnt" },
      ],
      hasil: [
        {
          modalitas: "X-Ray",
          proyeksi: "PA",
          temuan:
            "Jantung: kardiomegali (CTR ± 0.58). Aorta: elongasi ringan. Trakea: deviasi minimal ke kanan. Hilus: melebar bilateral. Kedua paru: tampak infiltrat difus di zona bawah bilateral, kesan edema paru. Sinus kostofrenikus bilateral tumpul (efusi pleura minimal bilateral). Diafragma: mendatar.",
          kesan:
            "Kardiomegali dengan gambaran edema paru dan efusi pleura minimal bilateral. Curiga gagal jantung kongestif.",
          radiolog: "dr. Purnomo, Sp.Rad",
          tanggalBaca: "12 Feb 2026, 12:30",
        },
        {
          modalitas: "X-Ray",
          proyeksi: "AP + Lateral",
          temuan:
            "Tulang-tulang kepala: intak, tidak tampak fraktur. Jaringan lunak: tidak tampak pembengkakan. Sinus paranasalis: dalam batas normal.",
          kesan: "Tidak tampak kelainan pada foto kepala.",
          radiolog: "dr. Purnomo, Sp.Rad",
          tanggalBaca: "12 Feb 2026, 12:35",
        },
      ],
    },
    {
      id: "rr-2",
      noOrder: "RAD/2026/01/0058",
      tanggal: "5 Januari 2026",
      jam: "14:20",
      dokter: "dr. Anisa Putri, Sp.PD",
      unit: "Poli Penyakit Dalam",
      status: "Selesai",
      items: [
        { id: "rri-3", kode: "RAD-CT001", nama: "CT Scan Kepala Non-Kontras", modalitas: "CT Scan", waktuTunggu: "1–2 jam" },
      ],
      hasil: [
        {
          modalitas: "CT Scan",
          temuan:
            "Parenkim otak: tidak tampak lesi hiperdens (perdarahan intrakranial). Tidak tampak lesi hipodens (infark). Sistem ventrikel: tidak melebar, tidak ada midline shift. Sulci kortikal: tidak melebar. Fossa posterior: serebelum normal. Tulang kepala: intak.",
          kesan:
            "CT Scan Kepala Non-Kontras dalam batas normal. Tidak tampak perdarahan intrakranial maupun infark akut.",
          radiolog: "dr. Rini Susanti, Sp.Rad",
          tanggalBaca: "5 Jan 2026, 16:00",
        },
      ],
    },
  ],
  "RM-2025-012": [
    {
      id: "rr-3",
      noOrder: "RAD/2026/04/0099",
      tanggal: "8 April 2026",
      jam: "08:30",
      dokter: "dr. Dewi Kusuma, Sp.JP",
      unit: "Poli Jantung",
      status: "Selesai",
      items: [
        { id: "rri-4", kode: "RAD-XR001", nama: "Foto Thorax PA", modalitas: "X-Ray", waktuTunggu: "30–60 mnt" },
        { id: "rri-5", kode: "RAD-US007", nama: "Echocardiografi", modalitas: "USG", waktuTunggu: "2–3 jam" },
      ],
      hasil: [
        {
          modalitas: "X-Ray",
          proyeksi: "PA",
          temuan:
            "Jantung: CTR ± 0.54, batas jantung kiri melebar ke lateral. Aorta: tidak tampak elongasi bermakna. Paru: corakan vaskular meningkat, tidak tampak infiltrat. Sinus kostofrenikus bilateral tajam.",
          kesan: "Kardiomegali ringan. Tidak tampak tanda bendungan paru.",
          radiolog: "dr. Purnomo, Sp.Rad",
          tanggalBaca: "8 Apr 2026, 09:15",
        },
        {
          modalitas: "USG",
          temuan:
            "LV: dilatasi ringan (LVEDD 58 mm), hipokinesis dinding inferior. EF 42% (Simpson biplane). LA: dilatasi ringan. Katup: MR ringan, tidak ada stenosis bermakna. Perikardium: tidak ada efusi.",
          kesan:
            "Disfungsi sistolik LV ringan-sedang (EF 42%), LV dan LA dilatasi ringan. Hipokinesis dinding inferior, pertimbangkan iskemia. MR ringan.",
          radiolog: "dr. Kartika, Sp.JP (Ekokardiografi)",
          tanggalBaca: "8 Apr 2026, 11:00",
        },
      ],
    },
  ],
};

// ── Badge configs ─────────────────────────────────────────

const MODALITAS_ICON: Record<ModalitasRad, React.ElementType> = {
  "X-Ray":             Radiation,
  "CT Scan":           Scan,
  "MRI":               Layers,
  "USG":               Activity,
  "Fluoroskopi":       MonitorX,
  "Kedokteran Nuklir": Microscope,
};

const MODALITAS_COLOR: Record<ModalitasRad, { bg: string; text: string; ring: string; icon: string }> = {
  "X-Ray":             { bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200",     icon: "text-sky-500"     },
  "CT Scan":           { bg: "bg-indigo-50",  text: "text-indigo-700",  ring: "ring-indigo-200",  icon: "text-indigo-500"  },
  "MRI":               { bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-200",  icon: "text-violet-500"  },
  "USG":               { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", icon: "text-emerald-500" },
  "Fluoroskopi":       { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   icon: "text-amber-500"   },
  "Kedokteran Nuklir": { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200",    icon: "text-rose-500"    },
};

const STATUS_ORDER_BADGE: Record<StatusOrder, string> = {
  Menunggu:   "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  Diterima:   "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  Diproses:   "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Selesai:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Dibatalkan: "bg-rose-50 text-rose-500 ring-1 ring-rose-200",
};

// ── Rad search ────────────────────────────────────────────

function RadSearch({ onSelect }: { onSelect: (test: RadTest) => void }) {
  const [query, setQuery]     = useState("");
  const [open, setOpen]       = useState(false);
  const [results, setResults] = useState<RadTest[]>([]);
  const containerRef          = useRef<HTMLDivElement>(null);

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
    const filtered = RAD_CATALOG.filter(
      (t) => t.nama.toLowerCase().includes(q.toLowerCase()) || t.kode.toLowerCase().includes(q.toLowerCase()),
    ).slice(0, 8);
    setResults(filtered);
    setOpen(filtered.length > 0);
  };

  const pick = (test: RadTest) => {
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
          placeholder="Ketik nama pemeriksaan atau kode RAD-..."
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((test) => {
            const color = MODALITAS_COLOR[test.modalitas];
            const Icon  = MODALITAS_ICON[test.modalitas];
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
                    {test.modalitas}
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

// ── ModalitasChip ─────────────────────────────────────────

function ModalitasChip({ modalitas }: { modalitas: ModalitasRad }) {
  const color = MODALITAS_COLOR[modalitas];
  const Icon  = MODALITAS_ICON[modalitas];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1", color.bg, color.text, color.ring)}>
      <Icon size={9} />
      {modalitas}
    </span>
  );
}

// ── Hasil modal ───────────────────────────────────────────

interface HasilModalProps {
  order: RiwayatOrder;
  onClose: () => void;
}

function HasilModal({ order, onClose }: HasilModalProps) {
  const hasil = order.hasil ?? [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Radiation size={13} />
              </span>
              <p className="text-sm font-semibold text-slate-800">Hasil Pemeriksaan Radiologi</p>
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

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {hasil.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-10">Hasil belum tersedia.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {hasil.map((h, i) => {
                const color = MODALITAS_COLOR[h.modalitas];
                const Icon  = MODALITAS_ICON[h.modalitas];
                return (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                    {/* Expertise header */}
                    <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-2.5">
                      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1", color.bg, color.ring)}>
                        <Icon size={11} className={color.icon} />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1", color.bg, color.text, color.ring)}>
                          {h.modalitas}
                        </span>
                        {h.proyeksi && (
                          <span className="text-[11px] text-slate-500">Proyeksi: {h.proyeksi}</span>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] font-semibold text-slate-600">{h.radiolog}</p>
                        <p className="text-[10px] text-slate-400">{h.tanggalBaca}</p>
                      </div>
                    </div>

                    {/* Temuan */}
                    <div className="px-4 pt-3 pb-2">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Temuan / Deskripsi</p>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{h.temuan}</p>
                    </div>

                    {/* Kesan */}
                    <div className="mx-4 mb-3 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2.5">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-500">Kesan / Kesimpulan</p>
                      <p className="text-xs font-medium leading-relaxed text-indigo-800">{h.kesan}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-[11px] text-slate-400">{hasil.length} pemeriksaan dibaca</p>
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
        <Radiation size={18} />
      </span>
      <p className="text-xs text-slate-400">Belum ada pemeriksaan dalam daftar order</p>
      <p className="text-[11px] text-slate-300">Cari tindakan radiologi di kolom kiri</p>
    </div>
  );
}

// ── Riwayat Radiologi section ─────────────────────────────

function RiwayatRadSection({ riwayat }: { riwayat: RiwayatOrder[] }) {
  const [expanded, setExpanded]   = useState<Set<string>>(new Set([riwayat[0]?.id]));
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
          <p className="text-xs font-semibold text-slate-700">Riwayat Pemeriksaan Radiologi</p>
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
                    <span className="text-[11px] text-slate-400">{r.items.length} tindakan</span>
                    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", STATUS_ORDER_BADGE[r.status])}>
                      {r.status}
                    </span>
                    {r.status === "Selesai" && r.hasil && (
                      <button
                        type="button"
                        onClick={() => setModalOrder(r)}
                        className="flex items-center gap-1 rounded-md border border-sky-300 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 transition hover:bg-sky-100"
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
                        const color = MODALITAS_COLOR[item.modalitas];
                        const Icon  = MODALITAS_ICON[item.modalitas];
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                          >
                            <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1", color.bg, color.ring)}>
                              <Icon size={11} className={color.icon} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-slate-800">{item.nama}</p>
                              <p className="text-[10px] text-slate-400">{item.kode}</p>
                            </div>
                            <ModalitasChip modalitas={item.modalitas} />
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

function ActiveOrderCard({
  order,
  onCancel,
}: {
  order: ActiveOrder;
  onCancel: (id: string) => void;
}) {
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
            const color = MODALITAS_COLOR[item.modalitas];
            const Icon  = MODALITAS_ICON[item.modalitas];
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

export default function OrderRadTab({ patient }: { patient: IGDPatientDetail }) {
  const [orderItems, setOrderItems]   = useState<OrderItem[]>([]);
  const [catatan, setCatatan]         = useState("");
  const [priority, setPriority]       = useState<"Rutin" | "Cito">("Rutin");
  const [submitted, setSubmitted]     = useState(false);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>(
    ACTIVE_ORDERS_MOCK[patient.noRM] ?? [],
  );

  const riwayat = RIWAYAT_RAD_MOCK[patient.noRM] ?? [];

  const alreadyInOrder = new Set(orderItems.map((i) => i.kode));

  const addTest = (test: RadTest) => {
    if (alreadyInOrder.has(test.kode)) return;
    setOrderItems((prev) => [
      ...prev,
      {
        id: `roi-${Date.now()}`,
        kode: test.kode,
        nama: test.nama,
        modalitas: test.modalitas,
        waktuTunggu: test.waktuTunggu,
        persiapan: test.persiapan,
      },
    ]);
  };

  const removeTest = (id: string) => setOrderItems((prev) => prev.filter((i) => i.id !== id));

  const cancelOrder = (orderId: string) =>
    setActiveOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "Dibatalkan" as StatusOrder } : o)),
    );

  const handleSubmit = () => {
    if (orderItems.length === 0) return;
    const newOrder: ActiveOrder = {
      id: `ao-rad-${Date.now()}`,
      noOrder: `RAD/2026/04/${String(Math.floor(Math.random() * 900) + 100).padStart(4, "0")}`,
      tanggal: patient.tglKunjungan,
      jam: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      dokter: patient.doctor,
      status: "Menunggu",
      catatan: priority === "Cito" ? "CITO" : catatan || undefined,
      items: orderItems,
    };
    setActiveOrders((prev) => [newOrder, ...prev]);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
          <CheckCircle2 size={28} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-700">Order Radiologi Berhasil Dikirim</p>
          <p className="mt-1 text-xs text-slate-500">
            {orderItems.length} tindakan · prioritas{" "}
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

  // Persiapan notices for items that have preparation notes
  const itemsWithPersiapan = orderItems.filter((i) => i.persiapan);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header info ── */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <User size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Dokter Pengirim</p>
              <p className="text-xs font-semibold text-slate-800">{patient.doctor}</p>
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-100 sm:block" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
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
              <p className="text-xs font-semibold text-slate-800">{patient.tglKunjungan}</p>
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-100 sm:block" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Building2 size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Unit Pengirim</p>
              <p className="text-xs font-semibold text-slate-800">IGD</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column area ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* ── Left: Panduan + Search ── */}
        <div className="flex flex-col gap-3">

          {/* Panduan */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-sky-600">Panduan Order Radiologi</p>
            <ul className="space-y-1">
              {[
                "Foto polos (X-Ray) tidak memerlukan persiapan khusus.",
                "CT Scan dengan kontras: cek fungsi ginjal (kreatinin) dan puasa 4 jam.",
                "MRI: pastikan pasien bebas implan logam dan klaustrofobia.",
                "USG abdomen: pasien puasa minimal 6 jam sebelum pemeriksaan.",
                "Order CITO memerlukan konfirmasi telepon ke unit radiologi.",
                "Cantumkan klinis dan diagnosis kerja pada setiap order.",
                "Order dapat dibatalkan selama status masih 'Menunggu'.",
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-sky-700">
                  <span className="mt-0.5 shrink-0 text-sky-400">•</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          {/* Search */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold text-slate-700">Tambah Pemeriksaan</p>

            <div className="flex flex-col gap-3">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Cari Tindakan Radiologi <span className="text-rose-400">*</span>
                </p>
                <RadSearch onSelect={addTest} />
                <p className="mt-1.5 text-[10px] text-slate-400">Ketik minimal 2 karakter · tindakan yang sudah ditambah tidak muncul kembali</p>
              </div>

              {/* Quick-add paket */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Paket Cepat</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Trauma Survey",   tests: ["RAD-XR001", "RAD-XR003", "RAD-XR005", "RAD-XR010"] },
                    { label: "Chest + Skull",   tests: ["RAD-XR001", "RAD-XR010"] },
                    { label: "Abdomen Akut",    tests: ["RAD-XR003", "RAD-US003"] },
                    { label: "Stroke Protocol", tests: ["RAD-CT001"] },
                    { label: "PE Protocol",     tests: ["RAD-CT004"] },
                    { label: "FAST USG",        tests: ["RAD-US006"] },
                  ].map((pkg) => {
                    const allAdded = pkg.tests.every((kode) => alreadyInOrder.has(kode));
                    return (
                      <button
                        key={pkg.label}
                        type="button"
                        disabled={allAdded}
                        onClick={() => {
                          pkg.tests.forEach((kode) => {
                            const test = RAD_CATALOG.find((t) => t.kode === kode);
                            if (test && !alreadyInOrder.has(kode)) addTest(test);
                          });
                        }}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition",
                          allAdded
                            ? "cursor-default border-emerald-200 bg-emerald-50 text-emerald-600"
                            : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700",
                        )}
                      >
                        {allAdded ? <><Check size={9} className="mr-0.5 inline" />{pkg.label}</> : `+ ${pkg.label}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Persiapan notice */}
              {itemsWithPersiapan.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600">
                    Persiapan Diperlukan
                  </p>
                  <ul className="space-y-1">
                    {itemsWithPersiapan.map((item) => (
                      <li key={item.id} className="flex items-start gap-1.5 text-[11px] text-amber-700">
                        <AlertCircle size={10} className="mt-0.5 shrink-0 text-amber-500" />
                        <span><span className="font-medium">{item.nama}:</span> {item.persiapan}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Priority */}
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
                            : "border-sky-400 bg-sky-50 text-sky-700"
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
                    Order CITO memerlukan konfirmasi telepon ke unit radiologi
                  </p>
                )}
              </div>

              {/* Klinis / indikasi */}
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Klinis &amp; Indikasi <span className="normal-case font-normal text-slate-300">(wajib diisi)</span>
                </p>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={2}
                  placeholder="Contoh: nyeri dada, curiga edema paru; trauma kepala dengan penurunan kesadaran..."
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Daftar order + active orders ── */}
        <div className="flex flex-col gap-3">

          {/* Daftar order baru */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-slate-700">Daftar Order Baru</p>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">
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
                    const color = MODALITAS_COLOR[item.modalitas];
                    const Icon  = MODALITAS_ICON[item.modalitas];
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs"
                      >
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1", color.bg, color.ring)}>
                          <Icon size={14} className={color.icon} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800">{item.nama}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <ModalitasChip modalitas={item.modalitas} />
                            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                              <Clock size={9} /> {item.waktuTunggu}
                            </span>
                          </div>
                          {item.persiapan && (
                            <p className="mt-1 text-[10px] text-amber-600">
                              <AlertCircle size={9} className="mr-0.5 inline" />
                              {item.persiapan}
                            </p>
                          )}
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

          {/* Active orders */}
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

      {/* ── Riwayat ── */}
      {riwayat.length > 0 && <RiwayatRadSection riwayat={riwayat} />}

      {/* ── Sticky footer ── */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {orderItems.length === 0 ? (
            <p className="text-xs text-slate-400">Tambahkan tindakan radiologi ke daftar order terlebih dahulu</p>
          ) : (
            <>
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{orderItems.length} tindakan</span> siap dikirim
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
              priority === "Cito" ? "bg-rose-600 hover:bg-rose-700" : "bg-sky-600 hover:bg-sky-700",
            )}
          >
            <Send size={13} />
            {priority === "Cito" ? "Kirim Order CITO" : "Kirim Order ke Radiologi"}
          </button>
        </div>
      </div>
    </div>
  );
}
