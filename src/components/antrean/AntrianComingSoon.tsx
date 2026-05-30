"use client";

// Placeholder untuk tab Antrean yang belum dibangun (fase ANT2/ANT3/ANT5/ANT6/ANT7).
// Diganti komponen nyata saat fase terkait dikerjakan.

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function AntrianComingSoon({
  title,
  phase,
  desc,
  icon,
}: {
  title: string;
  phase: string;
  desc: string;
  // ReactNode (bukan komponen) agar bisa di-pass dari Server Component stub page.
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex max-w-md flex-col items-center gap-5 rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
          {icon}
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">{phase}</span>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-800">{title}</h1>
          <p className="mt-2 text-slate-500">{desc}</p>
        </div>
        <Link
          href="/ehis-antrian"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
        </Link>
      </motion.div>
    </div>
  );
}
