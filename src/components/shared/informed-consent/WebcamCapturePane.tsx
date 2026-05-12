"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import {
  Camera, RotateCcw, CheckCircle2, AlertTriangle,
  SlidersHorizontal, Loader2, Eye,
} from "lucide-react";
import { processSignaturePhoto } from "@/lib/informed-consent/imageEnhance";
import CropPane from "./CropPane";

type Phase = "viewfinder" | "crop" | "processing" | "preview";

interface WebcamCapturePaneProps {
  onCapture: (dataUrl: string) => void;
}

const CHECKER_STYLE: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(45deg, #f1f5f9 25%, transparent 25%)",
    "linear-gradient(-45deg, #f1f5f9 25%, transparent 25%)",
    "linear-gradient(45deg, transparent 75%, #f1f5f9 75%)",
    "linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)",
  ].join(", "),
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
  backgroundColor: "white",
};

export default function WebcamCapturePane({ onCapture }: WebcamCapturePaneProps) {
  const webcamRef   = useRef<Webcam>(null);
  const counterRef  = useRef(0);

  const [phase,       setPhase]       = useState<Phase>("viewfinder");
  const [rawCapture,  setRawCapture]  = useState<string | null>(null);
  const [cropped,     setCropped]     = useState<string | null>(null);
  const [enhanced,    setEnhanced]    = useState<string | null>(null);
  const [autoThresh,  setAutoThresh]  = useState(180);
  const [sensitivity, setSensitivity] = useState(50);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showSlider,  setShowSlider]  = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [showRaw,     setShowRaw]     = useState(false);

  // Step 1: capture webcam → go to crop
  function handleCapture() {
    const raw = webcamRef.current?.getScreenshot();
    if (!raw) return;
    setRawCapture(raw);
    setPhase("crop");
  }

  // Step 2: crop confirmed → send to API for enhancement
  async function handleCropConfirm(croppedUrl: string) {
    setCropped(croppedUrl);
    setPhase("processing");
    try {
      const { enhanced: img, autoThresh: t } = await processSignaturePhoto(croppedUrl, sensitivity);
      setEnhanced(img);
      setAutoThresh(t);
      setPhase("preview");
    } catch {
      setPhase("crop");
    }
  }

  async function handleSensitivityChange(val: number) {
    setSensitivity(val);
    if (!cropped) return;
    const myCount = ++counterRef.current;
    setIsAdjusting(true);
    try {
      const { enhanced: re } = await processSignaturePhoto(cropped, val);
      if (myCount === counterRef.current) setEnhanced(re);
    } finally {
      if (myCount === counterRef.current) setIsAdjusting(false);
    }
  }

  function handleRetake() {
    setPhase("viewfinder");
    setRawCapture(null);
    setCropped(null);
    setEnhanced(null);
    setShowSlider(false);
    setShowRaw(false);
    setSensitivity(50);
    setCameraError(null);
  }

  // ── Error state ───────────────────────────────────────────
  if (cameraError) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
          <AlertTriangle size={22} className="text-rose-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-rose-700">Kamera Tidak Dapat Diakses</p>
          <p className="mt-1 text-xs text-rose-500 leading-relaxed max-w-xs">
            {cameraError.includes("Permission") || cameraError.includes("NotAllowed")
              ? "Izin akses kamera ditolak. Klik ikon kunci di address bar dan izinkan kamera."
              : cameraError}
          </p>
        </div>
        <motion.button
          type="button" onClick={handleRetake} whileTap={{ scale: 0.96 }}
          className="rounded-xl border border-rose-200 bg-white px-5 py-2 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50"
        >
          Coba Lagi
        </motion.button>
      </div>
    );
  }

  // ── Viewfinder ────────────────────────────────────────────
  if (phase === "viewfinder") {
    return (
      <motion.div
        key="viewfinder"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="space-y-3"
      >
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black shadow-inner" style={{ height: 240 }}>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/png"
            videoConstraints={{ width: 1280, height: 720 }}
            onUserMediaError={(err) =>
              setCameraError(typeof err === "string" ? err : (err as Error).message)
            }
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div className="pointer-events-none absolute inset-4 rounded-lg border-2 border-dashed border-white/30" />
          <div className="pointer-events-none absolute bottom-3 left-0 right-0 text-center">
            <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-medium text-white/80">
              Tempelkan kertas TTD ke kamera
            </span>
          </div>
        </div>
        <motion.button
          type="button" onClick={handleCapture} whileTap={{ scale: 0.97 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          <Camera size={16} /> Ambil Foto
        </motion.button>
      </motion.div>
    );
  }

  // ── Crop ─────────────────────────────────────────────────
  if (phase === "crop") {
    return (
      <CropPane
        imageUrl={rawCapture!}
        onCrop={handleCropConfirm}
        onRetake={handleRetake}
      />
    );
  }

  // ── Processing ────────────────────────────────────────────
  if (phase === "processing") {
    return (
      <motion.div
        key="processing"
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 rounded-xl border border-slate-100 bg-linear-to-b from-sky-50 to-white py-12"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
        >
          <Loader2 size={32} className="text-sky-500" />
        </motion.div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Memproses gambar...</p>
          <p className="mt-1 text-xs text-slate-500">Menghilangkan bayangan &amp; background</p>
        </div>
        <div className="flex gap-1.5">
          {["Grayscale", "Normalize", "Threshold"].map((step, i) => (
            <motion.span
              key={step}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-semibold text-sky-600"
            >
              {step}
            </motion.span>
          ))}
        </div>
      </motion.div>
    );
  }

  // ── Preview ───────────────────────────────────────────────
  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Comparison toggle */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-600">Hasil Enhancement</p>
        <button
          type="button"
          onClick={() => setShowRaw(v => !v)}
          className="flex items-center gap-1 text-[10px] font-medium text-slate-400 transition hover:text-sky-600"
        >
          <Eye size={11} /> {showRaw ? "Lihat hasil" : "Lihat asli"}
        </button>
      </div>

      {/* Result on checkered background */}
      <div
        className="relative flex min-h-45 items-center justify-center overflow-hidden rounded-xl border border-slate-200 shadow-inner"
        style={CHECKER_STYLE}
      >
        <AnimatePresence mode="wait">
          {isAdjusting ? (
            <motion.div key="adj"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm"
            >
              <Loader2 size={20} className="animate-spin text-sky-500" />
            </motion.div>
          ) : (
            <motion.img
              key={showRaw ? "raw" : "enh"}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={showRaw ? cropped! : enhanced!}
              alt="Tanda tangan"
              style={{ maxHeight: 160, maxWidth: "100%", objectFit: "contain" }}
            />
          )}
        </AnimatePresence>

        {!showRaw && (
          <motion.span
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-2 right-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-600"
          >
            Background dihilangkan
          </motion.span>
        )}
      </div>

      {/* Sensitivity slider */}
      <div>
        <button
          type="button"
          onClick={() => setShowSlider(v => !v)}
          className="flex items-center gap-1.5 text-[11px] font-medium text-sky-600 transition hover:text-sky-700"
        >
          <SlidersHorizontal size={12} />
          {showSlider ? "Sembunyikan pengaturan" : "Sesuaikan ketebalan tinta"}
        </button>

        <AnimatePresence>
          {showSlider && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-2 rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Kurang tinta</span>
                  <span className="font-bold text-sky-700">Kepekaan: {sensitivity}%</span>
                  <span>Lebih banyak tinta</span>
                </div>
                <input
                  type="range" min={10} max={90} value={sensitivity}
                  onChange={e => handleSensitivityChange(Number(e.target.value))}
                  className="w-full accent-sky-600"
                />
                <p className="text-center text-[10px] text-slate-400">
                  Sensitivitas lokal: <span className="font-semibold text-slate-600">k = {(autoThresh / 100).toFixed(2)}</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <motion.button
          type="button" onClick={handleRetake} whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <RotateCcw size={13} /> Ambil Ulang
        </motion.button>
        <motion.button
          type="button" onClick={() => enhanced && onCapture(enhanced)}
          whileTap={{ scale: 0.97 }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          <CheckCircle2 size={13} /> Gunakan Tanda Tangan Ini
        </motion.button>
      </div>
    </motion.div>
  );
}
