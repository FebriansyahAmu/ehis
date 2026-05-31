"use client";

// ANT7 — Papan Informasi: media engaging untuk ruang tunggu. Default = slide info
// layanan berputar otomatis. Video-ready: beri prop `videoSrc` untuk memutar video.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  HeartPulse,
  Syringe,
  Smartphone,
  Clock,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoSlide {
  icon: LucideIcon;
  title: string;
  text: string;
}

const SLIDES: InfoSlide[] = [
  { icon: HeartPulse, title: "IGD 24 Jam", text: "Instalasi Gawat Darurat melayani 24 jam setiap hari tanpa antrean." },
  { icon: Syringe, title: "Vaksinasi Tersedia", text: "Layanan imunisasi anak & dewasa di Poli Anak dan Poli Umum." },
  { icon: Smartphone, title: "Daftar via Mobile JKN", text: "Ambil antrean online dari rumah — pindai QR di loket pendaftaran." },
  { icon: ShieldCheck, title: "Siapkan Berkas BPJS", text: "Bawa kartu JKN aktif dan surat rujukan FKTP yang masih berlaku." },
  { icon: Clock, title: "Jam Besuk Pasien", text: "Siang 11.00–13.00 & sore 17.00–19.00. Mohon tertib & jaga ketenangan." },
];

const ROTATE_MS = 6000;

export function InfoBoard({ videoSrc }: { videoSrc?: string }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (videoSrc) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [videoSrc]);

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-slate-100 px-6 py-3.5">
        <Sparkles className="h-6 w-6 text-sky-500" />
        <h2 className="text-2xl font-bold text-slate-700">Informasi Layanan</h2>
      </div>

      <div className="relative min-h-0 flex-1">
        {videoSrc ? (
          <video
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            aria-label="Video informasi rumah sakit"
            className="h-full w-full object-cover"
          />
        ) : (
          <SlideShow idx={idx} onJump={setIdx} />
        )}
      </div>
    </section>
  );
}

function SlideShow({ idx, onJump }: { idx: number; onJump: (i: number) => void }) {
  const slide = SLIDES[idx];
  const Icon = slide.icon;
  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-hidden bg-sky-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center"
          >
            <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-sky-500 text-white shadow-sm">
              <Icon className="h-12 w-12" />
            </span>
            <div>
              <p className="text-3xl font-black text-sky-600">{slide.title}</p>
              <p className="mx-auto mt-2 max-w-md text-xl leading-relaxed text-slate-500">{slide.text}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex shrink-0 items-center justify-center gap-2 py-3">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Tampilkan info ${i + 1}`}
            onClick={() => onJump(i)}
            className={cn(
              "h-2.5 rounded-full transition-all",
              i === idx ? "w-8 bg-sky-500" : "w-2.5 bg-sky-200 hover:bg-sky-300",
            )}
          />
        ))}
      </div>
    </div>
  );
}
