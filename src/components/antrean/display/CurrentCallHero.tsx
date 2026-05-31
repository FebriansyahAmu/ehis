"use client";

// ANT7 — Kartu panggilan utama (hero), tema terang + aksen SKY (tanpa gradient).
// Nomor besar + loket tujuan + flash saat dipanggil/recall.

import { motion } from "framer-motion";
import { ArrowRight, BellRing, Stethoscope, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DisplayCall } from "./displayShared";

export function CurrentCallHero({
  call,
  signature,
  reducedMotion,
}: {
  call: DisplayCall | undefined;
  signature: string;
  reducedMotion: boolean;
}) {
  if (!call) return <IdleHero />;

  const isRecall = call.recalls > 0;

  return (
    <motion.div
      // key=signature → animasi flash diputar ulang tiap panggilan / recall baru.
      key={signature}
      initial={reducedMotion ? false : { scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
    >
      {/* Flash overlay */}
      {!reducedMotion && (
        <motion.div
          key={`flash-${signature}`}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.1, repeat: 2, repeatType: "reverse" }}
          className={cn("pointer-events-none absolute inset-0 z-10", isRecall ? "bg-amber-300" : "bg-sky-300")}
        />
      )}

      <div className="flex items-center justify-between gap-3 bg-sky-500 px-8 py-5 text-white">
        <span className="text-3xl font-bold tracking-wide">
          {isRecall ? "Panggilan Ulang" : "Silakan Menuju"}
        </span>
        {isRecall && (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-2xl font-bold">
            <BellRing className="h-6 w-6" /> ke-{call.recalls + 1}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-7 px-8 py-6 text-center">
        <div>
          <p className="text-2xl font-semibold uppercase tracking-[0.3em] text-slate-400">Nomor Antrean</p>
          <p className="mt-1 font-mono text-[11rem] font-black leading-none tracking-tight text-sky-500 [font-variant-numeric:tabular-nums]">
            {call.nomorAntrean}
          </p>
        </div>

        <div className="flex items-center gap-5 rounded-2xl bg-sky-50 px-10 py-6 ring-1 ring-sky-100">
          <span className="text-3xl font-semibold text-slate-500">Menuju</span>
          <ArrowRight className="h-9 w-9 text-sky-400" />
          <span className="text-5xl font-black text-sky-600">{call.loket}</span>
        </div>

        <div className="flex items-center gap-3 text-2xl text-slate-500">
          <Stethoscope className="h-6 w-6 text-slate-300" />
          <span className="font-semibold text-slate-700">{call.poli}</span>
          <span className="text-slate-300">·</span>
          <span>{call.nama}</span>
        </div>
      </div>
    </motion.div>
  );
}

function IdleHero() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 rounded-3xl bg-white text-center shadow-sm ring-1 ring-slate-200">
      <motion.span
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-28 w-28 items-center justify-center rounded-full bg-sky-50 text-sky-500"
      >
        <Hourglass className="h-14 w-14" />
      </motion.span>
      <div>
        <p className="text-4xl font-black text-slate-700">Menunggu Panggilan</p>
        <p className="mt-2 text-xl text-slate-400">Nomor antrean berikutnya akan tampil di sini.</p>
      </div>
    </div>
  );
}
