"use client";

// Bagan anatomi interaktif berbasis CITRA nyata (anterior, per jenis kelamin) di atas backdrop
// imaging gelap. Dua alat: Pin (klik → titik) & Draw (tahan-seret → coretan area). Keduanya
// mendeteksi regio otomatis (bodyChart.regionAt) dan membuka form keterangan + severitas.
// Zoom (tombol + scroll) & geser (drag saat alat Pin & ter-zoom). Koordinat disimpan dalam %
// terhadap citra (stage ter-transform) → presisi mengikuti zoom/geser.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Plus, MapPin, Pencil, ZoomIn, ZoomOut, Maximize2, Hand } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SEV,
  ANATOMY_SRC,
  ANATOMY_W,
  ANATOMY_H,
  MODEL_LABEL,
  type Anotasi,
  type ModelJenis,
  type AnnTool,
} from "./penandaanShared";
import { regionAt } from "./bodyChart";

type Pt = { x: number; y: number };

// Tinta coretan = MERAH (bukan ungu/indigo). Severitas tetap terbaca dari warna badge bernomor.
const DRAW_COLOR = "#ef4444";
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const r1 = (n: number) => Math.round(n * 10) / 10;
const toPath = (pts: Pt[]) =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"} ${r1(p.x)} ${r1(p.y)}`).join(" ");
const centroid = (pts: Pt[]): Pt => {
  const s = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / pts.length, y: s.y / pts.length };
};

// ── Badge bernomor (titik / jangkar coretan) ──────────────
function MarkerBadge({
  anotasi,
  displayIdx,
  selected,
  invScale,
  onClick,
}: {
  anotasi: Anotasi;
  displayIdx: number;
  selected: boolean;
  invScale: number; // counter-scale agar ukuran badge tetap walau di-zoom
  onClick: () => void;
}) {
  const c = SEV[anotasi.severitas];
  if (!anotasi.koordinat2d) return null;
  const Icon = anotasi.kind === "draw" ? Pencil : null;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{ left: `${anotasi.koordinat2d.x}%`, top: `${anotasi.koordinat2d.y}%` }}
      className="group absolute z-20 -translate-x-1/2 -translate-y-1/2"
      aria-label={`Anotasi ${displayIdx + 1}: ${anotasi.label}`}
    >
      <div style={{ transform: `scale(${invScale})` }}>
        <div
          className={cn(
            "pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100",
            c.pinBg,
          )}
        >
          {anotasi.label}
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className={cn(
            "relative flex h-6 w-6 items-center justify-center rounded-full shadow-md ring-2 ring-white transition-all duration-150",
            c.pinBg,
            selected ? "scale-125 ring-offset-1 ring-offset-slate-900" : "hover:scale-110",
          )}
        >
          {Icon ? (
            <Icon size={11} className="text-white" />
          ) : (
            <span className="text-[9px] font-bold leading-none text-white">{displayIdx + 1}</span>
          )}
          {selected && (
            <span className={cn("absolute -inset-1.5 animate-ping rounded-full opacity-25", c.pinBg)} />
          )}
        </motion.div>
      </div>
    </button>
  );
}

// ── Viewer ────────────────────────────────────────────────
export interface BodyMap2DProps {
  gender: ModelJenis;
  tool: AnnTool;
  /** mode geser (dimiliki induk agar pemilihan alat selalu mematikannya) */
  panMode: boolean;
  onPanModeChange: (v: boolean) => void;
  markers: Anotasi[];
  pending: { kind: AnnTool; koordinat2d: Pt | null; path: Pt[] | null } | null;
  selectedId: string | null;
  onMark: (koordinat: Pt, region: string) => void;
  onDraw: (path: Pt[], anchor: Pt, region: string) => void;
  onSelectMarker: (id: string) => void;
}

export default function BodyMap2D({
  gender,
  tool,
  panMode,
  onPanModeChange,
  markers,
  pending,
  selectedId,
  onMark,
  onDraw,
  onSelectMarker,
}: BodyMap2DProps) {
  const viewportRef = useRef<HTMLDivElement>(null); // box tetap (clip + wheel)
  const stageRef = useRef<HTMLDivElement>(null); // lapisan ter-transform (zoom/geser)
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [draft, setDraft] = useState<Pt[] | null>(null);
  const draftRef = useRef<Pt[] | null>(null);
  const drawingRef = useRef(false);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pt>({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panRef = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  const setDraftBoth = (v: Pt[] | null) => {
    draftRef.current = v;
    setDraft(v);
  };

  // batas geser agar citra tetap menutup viewport
  const clampPan = (x: number, y: number, z: number): Pt => {
    const r = viewportRef.current?.getBoundingClientRect();
    if (!r) return { x, y };
    const maxX = (r.width * (z - 1)) / 2;
    const maxY = (r.height * (z - 1)) / 2;
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  };

  const applyZoom = (next: number) => {
    const z = clamp(Math.round(next * 100) / 100, ZOOM_MIN, ZOOM_MAX);
    zoomRef.current = z;
    setZoom(z);
    if (z === 1) {
      setPan({ x: 0, y: 0 });
      onPanModeChange(false); // tak ada yang bisa digeser di 1×
    } else {
      setPan((p) => clampPan(p.x, p.y, z));
    }
  };
  const resetView = () => {
    zoomRef.current = 1;
    setZoom(1);
    setPan({ x: 0, y: 0 });
    onPanModeChange(false);
  };

  // scroll = zoom (listener non-pasif agar preventDefault)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyZoom(zoomRef.current * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // koordinat % relatif stage (sudah memperhitungkan transform)
  const pct = (e: { clientX: number; clientY: number }): Pt | null => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (pending) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    if (panMode) {
      // mode geser eksplisit → drag menggeser di alat apa pun
      panRef.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y, moved: false };
    } else if (tool === "draw") {
      const p = pct(e);
      if (!p) return;
      drawingRef.current = true;
      setDraftBoth([p]);
    } else {
      // pin: pointerdown → kandidat klik / geser
      panRef.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y, moved: false };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (drawingRef.current) {
      const p = pct(e);
      if (!p) return;
      const prev = draftRef.current;
      if (!prev) {
        setDraftBoth([p]);
        return;
      }
      const last = prev[prev.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 0.6) return; // throttle jarak
      setDraftBoth([...prev, p]);
      return;
    }
    if (panRef.current) {
      const dx = e.clientX - panRef.current.sx;
      const dy = e.clientY - panRef.current.sy;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) panRef.current.moved = true;
      if (zoomRef.current > 1) setPan(clampPan(panRef.current.ox + dx, panRef.current.oy + dy, zoomRef.current));
      return;
    }
    if (!pending) {
      const p = pct(e);
      if (p) setHoverLabel(regionAt(p.x, p.y));
    }
  };

  const finishDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const pts = draftRef.current;
    setDraftBoth(null);
    if (pts && pts.length >= 2) {
      const anchor = centroid(pts);
      onDraw(pts, anchor, regionAt(anchor.x, anchor.y));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (drawingRef.current) {
      finishDraw();
      return;
    }
    if (panRef.current) {
      const wasPan = panRef.current.moved;
      panRef.current = null;
      // tandai titik hanya bila alat Pin, bukan mode geser, & tak digeser
      if (!wasPan && !panMode && tool === "pin" && !pending) {
        const p = pct(e);
        if (p) onMark(p, regionAt(p.x, p.y));
      }
    }
  };

  const onPointerLeave = () => {
    if (drawingRef.current) finishDraw();
    panRef.current = null;
    setHoverLabel(null);
  };

  const invScale = 1 / zoom;
  const cursor = pending
    ? "cursor-default"
    : panMode || (tool === "pin" && zoom > 1)
      ? "cursor-grab active:cursor-grabbing"
      : "cursor-crosshair";

  const zbtn =
    "flex h-7 w-7 items-center justify-center rounded-lg border border-slate-600/60 bg-slate-900/80 text-slate-200 shadow-sm backdrop-blur transition hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-900/80";

  return (
    <div className="flex justify-center p-3">
      <div
        ref={viewportRef}
        className="relative overflow-hidden rounded-xl ring-1 ring-slate-700/60"
        style={{
          aspectRatio: `${ANATOMY_W} / ${ANATOMY_H}`,
          height: "clamp(440px, 72vh, 780px)",
          background:
            "radial-gradient(ellipse 75% 60% at 50% 32%, #1e293b 0%, #0f172a 70%, #0b1120 100%)",
        }}
      >
        {/* stage ter-transform (zoom + geser) */}
        <div
          ref={stageRef}
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {/* citra anatomi */}
          <Image
            src={ANATOMY_SRC[gender]}
            alt={`Bagan anatomi ${MODEL_LABEL[gender]} (anterior)`}
            fill
            priority
            sizes="(max-width: 768px) 80vw, 540px"
            className="pointer-events-none select-none object-contain"
            draggable={false}
          />

          {/* coretan tersimpan + draft + pending */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {markers
              .filter((a) => a.kind === "draw" && a.path)
              .map((a) => (
                <path
                  key={a.id}
                  d={toPath(a.path!)}
                  fill="none"
                  stroke={DRAW_COLOR}
                  strokeWidth={(selectedId === a.id ? 4 : 2.5) * invScale}
                  strokeOpacity={selectedId === a.id ? 1 : 0.85}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  style={selectedId === a.id ? { filter: "drop-shadow(0 0 3px rgba(255,255,255,0.45))" } : undefined}
                />
              ))}
            {draft && draft.length > 1 && (
              <path
                d={toPath(draft)}
                fill="none"
                stroke={DRAW_COLOR}
                strokeWidth={2.5 * invScale}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${3 * invScale} ${2 * invScale}`}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {pending?.kind === "draw" && pending.path && (
              <path
                d={toPath(pending.path)}
                fill="none"
                stroke={DRAW_COLOR}
                strokeWidth={3 * invScale}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* lapisan interaksi */}
          <div
            className={cn("absolute inset-0 z-10 touch-none", cursor)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
          />

          {/* badge marker (titik & jangkar coretan) */}
          <AnimatePresence>
            {markers.map((a, i) => (
              <MarkerBadge
                key={a.id}
                anotasi={a}
                displayIdx={i}
                selected={selectedId === a.id}
                invScale={invScale}
                onClick={() => onSelectMarker(a.id)}
              />
            ))}
          </AnimatePresence>

          {/* ghost pin (pending titik) */}
          {pending?.kind === "pin" && pending.koordinat2d && (
            <div
              style={{ left: `${pending.koordinat2d.x}%`, top: `${pending.koordinat2d.y}%` }}
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
            >
              <div style={{ transform: `scale(${invScale})` }}>
                <div className="flex h-6 w-6 animate-bounce items-center justify-center rounded-full bg-red-500 shadow-md ring-2 ring-white">
                  <Plus size={13} className="text-white" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* chip regio ter-hover */}
        <div
          className={cn(
            "pointer-events-none absolute left-2 top-2 z-30 flex items-center gap-1.5 rounded-full border border-sky-300/40 bg-slate-900/80 px-2.5 py-1 shadow-sm backdrop-blur transition-opacity duration-150",
            hoverLabel ? "opacity-100" : "opacity-0",
          )}
        >
          <Crosshair size={10} className="text-sky-300" />
          <span className="text-[10px] font-semibold text-sky-100">{hoverLabel ?? "—"}</span>
        </div>

        {/* kontrol zoom */}
        <div className="absolute right-2 top-2 z-30 flex flex-col items-center gap-1">
          <button type="button" onClick={() => applyZoom(zoom * 1.25)} disabled={zoom >= ZOOM_MAX} className={zbtn} aria-label="Perbesar">
            <ZoomIn size={14} />
          </button>
          <button type="button" onClick={() => applyZoom(zoom / 1.25)} disabled={zoom <= ZOOM_MIN} className={zbtn} aria-label="Perkecil">
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={() => onPanModeChange(!panMode)}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Mode geser"
            aria-pressed={panMode}
            className={cn(zbtn, panMode && "border-sky-400 bg-sky-500/25 text-sky-100 hover:bg-sky-500/30")}
          >
            <Hand size={13} />
          </button>
          <button type="button" onClick={resetView} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} className={zbtn} aria-label="Reset tampilan">
            <Maximize2 size={13} />
          </button>
          <span className="mt-0.5 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300 backdrop-blur">
            {zoom.toFixed(1)}×
          </span>
        </div>

        {/* hint alat */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-slate-600/50 bg-slate-900/75 px-3 py-1 shadow-sm backdrop-blur">
          {panMode ? (
            <>
              <Hand size={10} className="text-sky-300" />
              <span className="text-[9px] font-medium text-slate-200">Seret untuk menggeser citra · scroll zoom</span>
            </>
          ) : tool === "draw" ? (
            <>
              <Pencil size={10} className="text-red-400" />
              <span className="text-[9px] font-medium text-slate-200">
                Tahan &amp; seret untuk menggambar{zoom > 1 ? " · ikon tangan untuk geser" : ""}
              </span>
            </>
          ) : (
            <>
              <MapPin size={10} className="text-red-400" />
              <span className="text-[9px] font-medium text-slate-200">
                {zoom > 1 ? "Klik menandai · seret menggeser · scroll zoom" : "Klik untuk menandai titik · scroll zoom"}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
