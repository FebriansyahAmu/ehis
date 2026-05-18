"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor, ZoomIn, ZoomOut, RotateCcw, Upload, AlertTriangle,
  Type, Trash2, LayoutGrid, Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type RadOrder } from "../radShared";
import { getMockSeries, type SeriesDef } from "./viewer/MockImage";

// ── Types ─────────────────────────────────────────────────

type GridMode     = "1x1" | "2x2";
type WindowPreset = "standard" | "lung" | "mediastinum" | "bone" | "brain" | "soft";

interface Annotation {
  id: string; seriesId: string;
  x: number; y: number; text: string;
}

interface PendingAnn { seriesId: string; x: number; y: number }

// ── Constants ─────────────────────────────────────────────

const WINDOW_PRESETS: Record<WindowPreset, { label: string; filter: string }> = {
  standard:    { label: "Standard",        filter: "grayscale(100%) brightness(0.85) contrast(1.2)" },
  lung:        { label: "Paru",            filter: "grayscale(100%) brightness(0.42) contrast(2.8)" },
  mediastinum: { label: "Mediastinum",     filter: "grayscale(100%) brightness(0.68) contrast(1.6)" },
  bone:        { label: "Tulang",          filter: "grayscale(100%) brightness(1.10) contrast(3.0)" },
  brain:       { label: "Otak",            filter: "grayscale(100%) brightness(0.78) contrast(1.8)" },
  soft:        { label: "Jaringan Lunak",  filter: "grayscale(100%) brightness(0.90) contrast(1.4)" },
};

// ── ImageCell ─────────────────────────────────────────────

function ImageCell({
  series, selected, windowFilter, zoom, annotations, annMode,
  onSelect, onPosition, onDeleteAnn,
}: {
  series:       SeriesDef;
  selected:     boolean;
  windowFilter: string;
  zoom:         number;
  annotations:  Annotation[];
  annMode:      boolean;
  onSelect:     () => void;
  onPosition:   (x: number, y: number) => void;
  onDeleteAnn:  (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (annMode && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      onPosition(
        ((e.clientX - rect.left) / rect.width)  * 100,
        ((e.clientY - rect.top)  / rect.height) * 100,
      );
    } else {
      onSelect();
    }
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden rounded-xl bg-black border transition-all select-none",
        selected  ? "border-teal-400 ring-2 ring-teal-400/30" : "border-slate-700 hover:border-slate-500",
        annMode   && "cursor-crosshair",
      )}
      style={{ aspectRatio: "1 / 1.1" }}
    >
      {/* Rendered image with CSS window/level filter */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ filter: windowFilter }}>
        <div className="h-full w-full" style={{ transform: `scale(${zoom})`, transition: "transform 0.2s ease" }}>
          {series.svg}
        </div>
      </div>

      {/* Annotations */}
      {annotations.map((ann) => (
        <button
          key={ann.id}
          className="group absolute z-10 flex items-center gap-1 rounded bg-yellow-400/90 px-1.5 py-0.5 text-[9px] font-bold text-black shadow"
          style={{ left: `${ann.x}%`, top: `${ann.y}%`, transform: "translate(-50%,-50%)" }}
          onClick={(e) => { e.stopPropagation(); onDeleteAnn(ann.id); }}
        >
          {ann.text}
          <Trash2 size={7} className="hidden group-hover:block opacity-70" />
        </button>
      ))}

      {/* Series label overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-[10px] font-bold text-white">{series.label}</p>
        <p className="text-[9px] text-slate-400">{series.subtitle}</p>
      </div>

      {selected && (
        <div className="pointer-events-none absolute left-2 top-2">
          <span className="rounded bg-teal-500/80 px-1.5 py-0.5 text-[8px] font-bold text-white">AKTIF</span>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function ViewerPane({ order }: { order: RadOrder }) {
  const mod    = order.items[0]?.modalitas ?? "Konvensional";
  const series = getMockSeries(mod);

  const [gridMode,    setGridMode]    = useState<GridMode>("2x2");
  const [preset,      setPreset]      = useState<WindowPreset>("standard");
  const [selId,       setSelId]       = useState(series[0]?.id ?? "");
  const [zoom,        setZoom]        = useState(1);
  const [annMode,     setAnnMode]     = useState(false);
  const [annText,     setAnnText]     = useState("");
  const [pending,     setPending]     = useState<PendingAnn | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const displaySeries = gridMode === "1x1"
    ? series.filter((s) => s.id === selId).slice(0, 1)
    : series.slice(0, 4);

  const confirmAnnotation = () => {
    if (!pending || !annText.trim()) return;
    setAnnotations((prev) => [
      ...prev,
      { id: Date.now().toString(), seriesId: pending.seriesId, x: pending.x, y: pending.y, text: annText.trim() },
    ]);
    setPending(null);
    setAnnText("");
  };

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_220px]">

      {/* ── Left: Viewer ── */}
      <div className="flex flex-col gap-3">

        {/* Header */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-800 px-4 py-3 text-white">
          <Monitor size={20} className="shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Image Viewer</p>
            <p className="text-[11px] text-slate-400">{mod} · {series.length} seri · Mock Preview</p>
          </div>
          {/* Grid mode toggle */}
          <div className="flex gap-1 rounded-lg bg-slate-700 p-1">
            {([["1x1", Square], ["2x2", LayoutGrid]] as [GridMode, typeof Square][]).map(([mode, Icon]) => (
              <button key={mode} onClick={() => setGridMode(mode)}
                className={cn(
                  "rounded p-1.5 transition-all",
                  gridMode === mode ? "bg-teal-500 text-white" : "text-slate-400 hover:text-slate-200",
                )}>
                <Icon size={13} />
              </button>
            ))}
          </div>
        </div>

        {/* Image grid */}
        <motion.div
          layout
          className={cn("grid gap-2", gridMode === "1x1" ? "grid-cols-1" : "grid-cols-2")}
        >
          {displaySeries.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
            >
              <ImageCell
                series={s}
                selected={selId === s.id}
                windowFilter={WINDOW_PRESETS[preset].filter}
                zoom={zoom}
                annotations={annotations.filter((a) => a.seriesId === s.id)}
                annMode={annMode}
                onSelect={() => setSelId(s.id)}
                onPosition={(x, y) => { setSelId(s.id); setPending({ seriesId: s.id, x, y }); }}
                onDeleteAnn={(id) => setAnnotations((prev) => prev.filter((a) => a.id !== id))}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Annotation input bar */}
        <AnimatePresence>
          {pending && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-2 rounded-xl border border-yellow-300 bg-yellow-50 px-3 py-2"
            >
              <Type size={13} className="shrink-0 text-yellow-600" />
              <input
                autoFocus
                value={annText}
                onChange={(e) => setAnnText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmAnnotation();
                  if (e.key === "Escape") { setPending(null); setAnnText(""); }
                }}
                placeholder="Ketik anotasi lalu tekan Enter…"
                className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-yellow-400"
              />
              <button onClick={confirmAnnotation}
                className="rounded-lg bg-yellow-400 px-2 py-1 text-[11px] font-bold text-black">
                Tambah
              </button>
              <button onClick={() => { setPending(null); setAnnText(""); }}
                className="text-[11px] text-slate-400 hover:text-slate-600">Batal</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Watermark notice */}
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-[10px] leading-relaxed text-amber-700">
            <strong>HANYA PREVIEW — BUKAN PENGGANTI DICOM VIEWER RESMI.</strong>{" "}
            Gambar di atas adalah mock placeholder untuk demonstrasi sistem. Gunakan workstation PACS resmi untuk pembacaan diagnostik.
          </p>
        </div>
      </div>

      {/* ── Right: Controls ── */}
      <div className="flex flex-col gap-3">

        {/* Window / Level preset */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Window Preset</p>
          <div className="flex flex-col gap-1.5">
            {(Object.entries(WINDOW_PRESETS) as [WindowPreset, { label: string; filter: string }][]).map(([key, cfg]) => (
              <button key={key} onClick={() => setPreset(key)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11px] font-medium text-left transition-all",
                  preset === key
                    ? "bg-teal-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:border-teal-200 hover:text-teal-700",
                )}>
                <span className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  preset === key ? "bg-white/70" : "bg-slate-300",
                )} />
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Zoom · {Math.round(zoom * 100)}%
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-teal-300">
              <ZoomOut size={14} />
            </button>
            <div className="relative flex-1 h-1.5 rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-teal-500 transition-all"
                style={{ width: `${((zoom - 0.5) / 2.5) * 100}%` }}
              />
            </div>
            <button onClick={() => setZoom((z) => Math.min(3, parseFloat((z + 0.25).toFixed(2))))}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-teal-300">
              <ZoomIn size={14} />
            </button>
          </div>
          <button onClick={() => setZoom(1)}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-1.5 text-[11px] text-slate-500 hover:border-teal-300 transition-colors">
            <RotateCcw size={11} /> Reset
          </button>
        </div>

        {/* Annotation mode */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Anotasi</p>
          <button
            onClick={() => setAnnMode((v) => !v)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-semibold transition-all",
              annMode
                ? "bg-yellow-400 text-black"
                : "border border-slate-200 text-slate-600 hover:border-yellow-300",
            )}
          >
            <Type size={12} />
            {annMode ? "Klik gambar untuk menandai" : "Mode Anotasi"}
          </button>

          {annotations.length > 0 && (
            <div className="mt-3 flex flex-col gap-1">
              <p className="mb-1 text-[9px] font-bold text-slate-400">{annotations.length} ANOTASI</p>
              {annotations.map((ann) => (
                <div key={ann.id} className="flex items-center justify-between rounded-lg bg-yellow-50 px-2 py-1.5">
                  <p className="truncate text-[10px] font-medium text-slate-700">{ann.text}</p>
                  <button
                    onClick={() => setAnnotations((prev) => prev.filter((a) => a.id !== ann.id))}
                    className="ml-2 shrink-0 text-slate-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Upload Gambar</p>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-4 text-center transition-colors hover:border-teal-300">
            <Upload size={16} className="text-slate-400" />
            <p className="text-[11px] text-slate-500">PNG · JPG · DICOM thumbnail</p>
            <p className="text-[9px] text-slate-400">Klik untuk pilih file</p>
            <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.dcm" />
          </label>
        </div>

        {/* Series selector */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Seri</p>
          <div className="flex flex-col gap-1">
            {series.map((s) => (
              <button key={s.id} onClick={() => setSelId(s.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] transition-all",
                  selId === s.id
                    ? "bg-teal-50 font-semibold text-teal-700"
                    : "text-slate-500 hover:bg-slate-50",
                )}>
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", selId === s.id ? "bg-teal-500" : "bg-slate-300")} />
                <span className="font-bold">{s.label}</span>
                <span className="truncate text-slate-400">· {s.subtitle}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
