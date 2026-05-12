"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Crop, RotateCcw } from "lucide-react";

interface CropPaneProps {
  imageUrl: string;
  onCrop: (croppedDataUrl: string) => void;
  onRetake: () => void;
}

// Crop box in percentage of RENDERED image (0–100)
interface Box { x: number; y: number; w: number; h: number }
type Handle = "move" | "nw" | "ne" | "sw" | "se";

// Rendered image bounds inside the container (accounts for object-fit: contain letterboxing)
interface ImgBounds { offsetX: number; offsetY: number; renderW: number; renderH: number }

const MIN_PCT = 8; // minimum box dimension in %

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

export default function CropPane({ imageUrl, onCrop, onRetake }: CropPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef       = useRef<HTMLImageElement>(null);
  const boundsRef    = useRef<ImgBounds | null>(null);

  const [box, setBox] = useState<Box>({ x: 8, y: 8, w: 84, h: 84 });

  const dragRef = useRef<{
    handle: Handle;
    startX: number; startY: number;
    startBox: Box;
  } | null>(null);

  // Compute rendered image bounds after layout
  function computeBounds() {
    const container = containerRef.current;
    const img       = imgRef.current;
    if (!container || !img || !img.naturalWidth) return;
    const cW = container.clientWidth;
    const cH = container.clientHeight;
    const iAspect = img.naturalWidth / img.naturalHeight;
    const cAspect = cW / cH;
    let renderW, renderH, offsetX = 0, offsetY = 0;
    if (iAspect > cAspect) {
      renderW = cW; renderH = cW / iAspect;
      offsetY = (cH - renderH) / 2;
    } else {
      renderH = cH; renderW = cH * iAspect;
      offsetX = (cW - renderW) / 2;
    }
    boundsRef.current = { offsetX, offsetY, renderW, renderH };
  }

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) computeBounds();
    else img.addEventListener("load", computeBounds);
    return () => img.removeEventListener("load", computeBounds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // Convert container-space pointer delta (px) → percentage delta in image space
  function deltaToPct(dx: number, dy: number) {
    const b = boundsRef.current;
    if (!b) return { dpx: 0, dpy: 0 };
    return { dpx: dx / b.renderW * 100, dpy: dy / b.renderH * 100 };
  }

  function onPointerDown(e: React.PointerEvent, handle: Handle) {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, startBox: { ...box } };
  }

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { handle, startX, startY, startBox: s } = dragRef.current;
    const rawDx = e.clientX - startX;
    const rawDy = e.clientY - startY;
    const { dpx: dx, dpy: dy } = deltaToPct(rawDx, rawDy);

    let { x, y, w, h } = s;

    if (handle === "move") {
      x = clamp(s.x + dx, 0, 100 - s.w);
      y = clamp(s.y + dy, 0, 100 - s.h);
    } else if (handle === "nw") {
      const nx = clamp(s.x + dx, 0, s.x + s.w - MIN_PCT);
      const ny = clamp(s.y + dy, 0, s.y + s.h - MIN_PCT);
      w = s.x + s.w - nx; h = s.y + s.h - ny; x = nx; y = ny;
    } else if (handle === "ne") {
      const ny = clamp(s.y + dy, 0, s.y + s.h - MIN_PCT);
      w = clamp(s.w + dx, MIN_PCT, 100 - s.x);
      h = s.y + s.h - ny; y = ny;
    } else if (handle === "sw") {
      const nx = clamp(s.x + dx, 0, s.x + s.w - MIN_PCT);
      w = s.x + s.w - nx; x = nx;
      h = clamp(s.h + dy, MIN_PCT, 100 - s.y);
    } else if (handle === "se") {
      w = clamp(s.w + dx, MIN_PCT, 100 - s.x);
      h = clamp(s.h + dy, MIN_PCT, 100 - s.y);
    }

    setBox({ x, y, w, h });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPointerUp() { dragRef.current = null; }

  function handleCrop() {
    const img = imgRef.current;
    const b   = boundsRef.current;
    if (!img || !b) return;

    const { offsetX, offsetY, renderW, renderH } = b;
    const nW = img.naturalWidth;
    const nH = img.naturalHeight;

    // Convert box% of rendered image → natural image pixels
    const cx = Math.round((box.x / 100) * renderW - offsetX + b.offsetX);
    const cy = Math.round((box.y / 100) * renderH - offsetY + b.offsetY);
    const cw = Math.round((box.w / 100) * renderW);
    const ch = Math.round((box.h / 100) * renderH);

    // Clamp to actual image bounds
    const sx = clamp(Math.round(cx / renderW * nW), 0, nW - 1);
    const sy = clamp(Math.round(cy / renderH * nH), 0, nH - 1);
    const sw = clamp(Math.round(cw / renderW * nW), 1, nW - sx);
    const sh = clamp(Math.round(ch / renderH * nH), 1, nH - sy);

    const canvas = document.createElement("canvas");
    canvas.width = sw; canvas.height = sh;
    canvas.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    onCrop(canvas.toDataURL("image/png"));
  }

  // Overlay dim: 4 strips outside the crop box (in container %)
  const b = boundsRef.current;
  const boxInContainer = b ? {
    left:   b.offsetX / (containerRef.current?.clientWidth  || 1) * 100 + box.x * b.renderW / (containerRef.current?.clientWidth  || 1),
    top:    b.offsetY / (containerRef.current?.clientHeight || 1) * 100 + box.y * b.renderH / (containerRef.current?.clientHeight || 1),
    width:  box.w * b.renderW / (containerRef.current?.clientWidth  || 1),
    height: box.h * b.renderH / (containerRef.current?.clientHeight || 1),
  } : { left: box.x, top: box.y, width: box.w, height: box.h };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-600">Crop Area Tanda Tangan</p>
        <p className="text-[10px] text-slate-400">Seret sudut · geser box untuk pindah</p>
      </div>

      {/* Crop container */}
      <div
        ref={containerRef}
        className="relative select-none overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-inner"
        style={{ height: 240 }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Full image */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="captured"
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />

        {/* Dim overlay — 4 strips outside crop box */}
        <div className="pointer-events-none absolute inset-0">
          {/* Top */}
          <div className="absolute inset-x-0 top-0 bg-black/55"
            style={{ height: `${boxInContainer.top}%` }} />
          {/* Bottom */}
          <div className="absolute inset-x-0 bottom-0 bg-black/55"
            style={{ top: `${boxInContainer.top + boxInContainer.height}%` }} />
          {/* Left */}
          <div className="absolute left-0 bg-black/55"
            style={{
              top: `${boxInContainer.top}%`, height: `${boxInContainer.height}%`,
              width: `${boxInContainer.left}%`,
            }} />
          {/* Right */}
          <div className="absolute right-0 bg-black/55"
            style={{
              top: `${boxInContainer.top}%`, height: `${boxInContainer.height}%`,
              left: `${boxInContainer.left + boxInContainer.width}%`,
            }} />
        </div>

        {/* Crop box border + drag handle */}
        <div
          className="absolute cursor-move"
          style={{
            left:   `${boxInContainer.left}%`,
            top:    `${boxInContainer.top}%`,
            width:  `${boxInContainer.width}%`,
            height: `${boxInContainer.height}%`,
          }}
          onPointerDown={e => onPointerDown(e, "move")}
        >
          {/* Border */}
          <div className="pointer-events-none absolute inset-0 rounded-sm border-2 border-white shadow-lg" />

          {/* Rule-of-thirds grid */}
          <div className="pointer-events-none absolute inset-0">
            {[33, 66].map(p => (
              <div key={`h${p}`} className="absolute inset-x-0 border-t border-white/25"
                style={{ top: `${p}%` }} />
            ))}
            {[33, 66].map(p => (
              <div key={`v${p}`} className="absolute inset-y-0 border-l border-white/25"
                style={{ left: `${p}%` }} />
            ))}
          </div>

          {/* 4 corner resize handles */}
          {(["nw", "ne", "sw", "se"] as Handle[]).map(h => (
            <div
              key={h}
              className="absolute z-10 h-5 w-5 rounded-sm border-2 border-sky-400 bg-white shadow-md"
              style={{
                top:    h[0] === "n" ? -6  : undefined,
                bottom: h[0] === "s" ? -6  : undefined,
                left:   h[1] === "w" ? -6  : undefined,
                right:  h[1] === "e" ? -6  : undefined,
                cursor: h === "nw" || h === "se" ? "nwse-resize" : "nesw-resize",
              }}
              onPointerDown={e => onPointerDown(e, h)}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button
          type="button" onClick={onRetake} whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-500 shadow-sm transition hover:bg-slate-50"
        >
          <RotateCcw size={13} /> Ambil Ulang
        </motion.button>
        <motion.button
          type="button" onClick={handleCrop} whileTap={{ scale: 0.97 }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          <Crop size={13} /> Konfirmasi Crop
        </motion.button>
      </div>
    </motion.div>
  );
}
