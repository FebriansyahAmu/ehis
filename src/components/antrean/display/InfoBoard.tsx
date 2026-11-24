"use client";

// ANT7 — Papan informasi ruang tunggu. Default = info layanan berganti tiap 8 detik dengan
// pudar silang (opacity saja, dua slide ditumpuk di sel grid yang sama). Bisa dijeda dari
// kontrol layar. Video-ready: beri prop `videoSrc` untuk memutar video.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, HeartPulse, ShieldCheck, Smartphone, Syringe, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoSlide {
  icon: LucideIcon;
  title: string;
  text: string;
}

const SLIDES: InfoSlide[] = [
  { icon: HeartPulse, title: "IGD 24 jam", text: "Instalasi Gawat Darurat melayani pasien 24 jam setiap hari." },
  { icon: Syringe, title: "Layanan vaksinasi", text: "Imunisasi anak dan dewasa tersedia di Poli Anak dan Poli Umum." },
  { icon: Smartphone, title: "Daftar lewat Mobile JKN", text: "Ambil antrean dari rumah, lalu pindai QR di loket pendaftaran." },
  { icon: ShieldCheck, title: "Siapkan berkas BPJS", text: "Bawa kartu JKN aktif dan surat rujukan FKTP yang masih berlaku." },
  { icon: Clock, title: "Jam besuk pasien", text: "Siang pukul 11.00–13.00 dan sore pukul 17.00–19.00." },
];

const ROTATE_MS = 8000;

export function InfoBoard({ videoSrc, paused }: { videoSrc?: string; paused: boolean }) {
  const [idx, setIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoSrc || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [videoSrc, paused]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else void v.play().catch(() => {});
  }, [paused]);

  const slide = SLIDES[idx];
  const Icon = slide.icon;

  return (
    <section
      aria-labelledby="info-judul"
      className="flex flex-col overflow-hidden rounded-3xl bg-(--d-panel) ring-1 ring-(--d-line)"
    >
      <div className="flex items-center justify-between gap-4 px-8 pt-6">
        <h2 id="info-judul" className="text-xl font-medium text-(--d-text-2)">Informasi layanan</h2>
        {!videoSrc && (
          <span aria-hidden="true" className="flex gap-1.5">
            {SLIDES.map((s, i) => (
              <span
                key={s.title}
                className={cn(
                  "h-1 w-6 rounded-full transition-colors duration-500",
                  i === idx ? "bg-(--d-text)/70" : "bg-(--d-text)/15",
                )}
              />
            ))}
          </span>
        )}
      </div>

      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          aria-label="Video informasi rumah sakit"
          className="mt-4 aspect-video w-full object-cover"
        />
      ) : (
        <div className="grid min-h-40 px-8 pt-5 pb-8">
          <AnimatePresence initial={false}>
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="col-start-1 row-start-1 flex items-start gap-5"
            >
              <span
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-(--d-raised) text-(--d-text-2)"
              >
                <Icon className="size-7" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-medium text-(--d-text)">{slide.title}</p>
                <p className="mt-2 text-lg leading-relaxed text-(--d-text-2)">{slide.text}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
