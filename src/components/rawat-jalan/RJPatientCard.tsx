"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Stethoscope, Clock } from "lucide-react";
import type { RJPatient } from "@/lib/data";
import { cn } from "@/lib/utils";
import { STATUS_CFG, POLI_CFG, PENJAMIN_CFG } from "./rjShared";

interface Props {
  patient: RJPatient;
  index:   number;
}

export default function RJPatientCard({ patient: p, index }: Props) {
  const sc = STATUS_CFG[p.status];
  const pc = POLI_CFG[p.poli];
  const pj = PENJAMIN_CFG[p.penjamin];
  const isSelesai = p.status === "Selesai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2, ease: "easeOut" }}
    >
      <Link href={`/ehis-care/rawat-jalan/${p.id}`} className="block">
        <article className={cn(
          "group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
          "border-l-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
          sc.border,
          isSelesai && "opacity-70",
        )}>

          {/* ── Header row ── */}
          <div className="flex items-start gap-3 p-4 pb-2.5">
            {/* Nomor antrian */}
            <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100">
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">No</span>
              <span className="text-base font-black leading-none text-slate-700">{p.nomorAntrian}</span>
            </div>

            {/* Identitas */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">{p.name}</p>
              <p className="text-[10px] text-slate-400">
                <span className="font-mono">{p.noRM}</span>
                <span className="mx-1 text-slate-300">·</span>
                <span>{p.age} thn · {p.gender === "L" ? "♂" : "♀"}</span>
              </p>
            </div>

            {/* Status chip */}
            <span className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold",
              sc.badge,
            )}>
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", sc.dot,
                p.status !== "Selesai" && "animate-pulse",
              )} />
              {sc.label}
            </span>
          </div>

          {/* ── Poli + Penjamin ── */}
          <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2.5">
            <span className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold", pc.badge)}>
              {pc.label}
            </span>
            <span className="ml-auto">
              <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", pj.badge)}>
                {pj.label}
              </span>
            </span>
          </div>

          {/* ── Keluhan ── */}
          <div className="px-4 pb-3">
            <p className="line-clamp-1 text-xs text-slate-600">{p.keluhan}</p>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <Stethoscope size={11} className="shrink-0 text-slate-400" />
              <p className="truncate text-[10px] text-slate-500">{p.dokter}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-[10px] text-slate-400">
              <Clock size={10} />
              <span>{p.waktuDaftar}</span>
            </div>
          </div>

        </article>
      </Link>
    </motion.div>
  );
}
