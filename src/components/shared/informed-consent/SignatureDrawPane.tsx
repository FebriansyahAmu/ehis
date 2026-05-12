"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, PenLine, CheckCircle2 } from "lucide-react";
import SignaturePad from "signature_pad";

interface SignatureDrawPaneProps {
  onCapture: (dataUrl: string) => void;
}

export default function SignatureDrawPane({ onCapture }: SignatureDrawPaneProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const padRef     = useRef<SignaturePad | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePad(canvas, {
      penColor: "#0f172a",
      backgroundColor: "rgba(0,0,0,0)",
      minWidth: 1.2,
      maxWidth: 3,
    });
    padRef.current = pad;

    // Use ResizeObserver for reliable initial sizing + window resize
    const ro = new ResizeObserver(() => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect  = canvas.getBoundingClientRect();
      canvas.width  = rect.width  * ratio;
      canvas.height = rect.height * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.clear();
      setHasDrawn(false);
    });
    ro.observe(canvas);

    pad.addEventListener("endStroke", () => setHasDrawn(!pad.isEmpty()));

    return () => {
      ro.disconnect();
      pad.off();
    };
  }, []);

  function handleClear() {
    padRef.current?.clear();
    setHasDrawn(false);
  }

  function handleCapture() {
    if (!padRef.current || padRef.current.isEmpty()) return;
    onCapture(padRef.current.toDataURL("image/png"));
  }

  return (
    <div className="space-y-3">
      {/* Canvas area */}
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white transition-colors hover:border-sky-200"
        style={{ height: 200 }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", touchAction: "none", cursor: "crosshair" }}
        />
        <AnimatePresence>
          {!hasDrawn && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2"
            >
              <PenLine size={28} className="text-slate-200" />
              <p className="text-[11px] font-medium text-slate-300 select-none">
                Tanda tangan di area ini
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Signature line */}
        <div className="pointer-events-none absolute bottom-10 left-8 right-8 border-b border-dashed border-slate-200" />
        <p className="pointer-events-none absolute bottom-3 right-4 select-none text-[9px] font-medium text-slate-300">
          Tanda Tangan
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button
          type="button" onClick={handleClear}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <Trash2 size={13} /> Bersihkan
        </motion.button>
        <motion.button
          type="button" onClick={handleCapture}
          disabled={!hasDrawn}
          whileTap={{ scale: hasDrawn ? 0.97 : 1 }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckCircle2 size={13} /> Gunakan Tanda Tangan Ini
        </motion.button>
      </div>
    </div>
  );
}
