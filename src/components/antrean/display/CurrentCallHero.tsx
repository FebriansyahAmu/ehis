"use client";

// ANT7 — Panggilan utama: nomor sangat besar + loket tujuan (satu-satunya aksen sky).
// Panggilan/recall baru → konten naik-pudar halus + sapuan warna lembut SEKALI (bukan
// kedip berulang). Nama pasien tidak ditampilkan (layar publik).

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DisplayCall } from "./displayShared";

const EASE = [0.22, 1, 0.36, 1] as const;

export function CurrentCallHero({
  call,
  signature,
  announceText,
}: {
  call: DisplayCall | undefined;
  signature: string;
  announceText: string;
}) {
  return (
    <section
      aria-labelledby="panggilan-judul"
      className="relative flex min-h-[28rem] flex-col overflow-hidden rounded-3xl bg-(--d-panel) ring-1 ring-(--d-line) lg:min-h-0"
    >
      <h2 id="panggilan-judul" className="sr-only">Panggilan saat ini</h2>
      <p className="sr-only" aria-live="polite">{announceText}</p>
      {call ? <Panggilan key={signature} call={call} /> : <Kosong />}
    </section>
  );
}

function Panggilan({ call }: { call: DisplayCall }) {
  const ulang = call.recalls > 0;

  return (
    <>
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 2.4, ease: "easeOut" }}
        className={cn("pointer-events-none absolute inset-0", ulang ? "bg-(--d-recall)/10" : "bg-(--d-accent)/10")}
      />

      <p className="relative flex items-center gap-3 px-10 pt-8 text-xl">
        <span aria-hidden="true" className={cn("size-2.5 rounded-full", ulang ? "bg-(--d-recall)" : "bg-(--d-accent)")} />
        <span className={ulang ? "text-(--d-recall)" : "text-(--d-text-2)"}>
          {ulang ? `Panggilan ulang ke-${call.recalls + 1}` : "Sedang dipanggil"}
        </span>
      </p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative flex flex-1 flex-col items-center justify-center gap-8 px-10 pb-10 text-center"
      >
        <div>
          <p className="text-2xl text-(--d-text-2)">Nomor antrean</p>
          {/* Ukuran mengikuti lebar DAN tinggi layar agar muat di TV 1080p maupun laptop 768p. */}
          <p className="mt-2 text-[length:clamp(6rem,min(15vw,22vh),17rem)] leading-[0.9] font-semibold tracking-[-0.02em] tabular-nums text-(--d-text)">
            {call.nomorAntrean}
          </p>
        </div>

        <span aria-hidden="true" className="h-px w-24 bg-(--d-text)/15" />

        <div>
          <p className="text-2xl text-(--d-text-2)">Silakan menuju</p>
          <p className="mt-3 text-[length:clamp(2.25rem,min(4vw,6vh),3.75rem)] leading-tight font-medium text-(--d-accent)">
            {call.loket}
          </p>
          <p className="mt-4 text-2xl text-(--d-text-2)">{call.poli}</p>
        </div>
      </motion.div>
    </>
  );
}

function Kosong() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-10 text-center">
      <p className="text-4xl font-medium text-(--d-text)">Belum ada panggilan</p>
      <p className="text-2xl text-(--d-text-2)">Nomor yang dipanggil akan tampil di sini</p>
    </div>
  );
}
