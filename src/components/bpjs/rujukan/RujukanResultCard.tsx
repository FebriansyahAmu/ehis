"use client";

import { motion } from "framer-motion";
import { ArrowRight, User, Calendar, Stethoscope, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RujukanRecord } from "@/lib/bpjs/bpjsShared";
import { fmtDate, jnsPelLabel, statusCls, asalBadgeCls } from "./rujukanShared";

interface Props {
  item: RujukanRecord;
  index?: number;
}

export default function RujukanResultCard({ item, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, delay: index * 0.06, ease: "easeOut" }}
      className="flex flex-col gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", asalBadgeCls(item.asalRujukan))}>
            {item.asalRujukan}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", statusCls(item.status))}>
            {item.status}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
            {jnsPelLabel(item.jnsPelayanan)}
          </span>
        </div>
        <p className="shrink-0 font-mono text-[10px] leading-relaxed text-slate-400">{item.noRujukan}</p>
      </div>

      {/* PPK route */}
      <div className="flex items-stretch gap-2">
        <div className="flex min-w-0 flex-1 flex-col rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Asal</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-700">{item.ppkAsal.nama}</p>
          <p className="font-mono text-[10px] text-slate-400">{item.ppkAsal.kode}</p>
        </div>
        <div className="flex shrink-0 items-center">
          <ArrowRight size={14} className="text-teal-400" strokeWidth={2} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col rounded-xl bg-teal-50/60 px-3 py-2 ring-1 ring-teal-100/80">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-teal-500">Tujuan</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-teal-800">{item.ppkRujukan.nama}</p>
          <p className="font-mono text-[10px] text-teal-500">{item.ppkRujukan.kode}</p>
        </div>
      </div>

      {/* Diagnosa + Poli */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <Stethoscope size={11} className="mt-0.5 shrink-0 text-slate-400" strokeWidth={2} />
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Diagnosa</p>
            <p className="mt-0.5 font-mono text-[11px] font-bold text-slate-800">{item.diagnosa.kode}</p>
            <p className="mt-0.5 text-[10px] leading-tight text-slate-500 line-clamp-2">{item.diagnosa.nama}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <MapPin size={11} className="mt-0.5 shrink-0 text-slate-400" strokeWidth={2} />
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Poli Tujuan</p>
            <p className="mt-0.5 font-mono text-[11px] font-bold text-slate-800">{item.poli.kode}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">{item.poli.nama}</p>
          </div>
        </div>
      </div>

      {/* Peserta */}
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-100">
          <User size={12} className="text-teal-600" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-800">{item.peserta.nama}</p>
          <p className="font-mono text-[10px] text-slate-400">{item.peserta.noKartu}</p>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
          item.peserta.statusPeserta.kode === "0"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-rose-100 text-rose-600",
        )}>
          {item.peserta.statusPeserta.keterangan}
        </span>
      </div>

      {/* Masa berlaku */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
        <div className="flex items-center gap-1">
          <Calendar size={10} className="text-slate-400" strokeWidth={2} />
          <span>Tgl Rujukan: <strong className="text-slate-700">{fmtDate(item.tglRujukan)}</strong></span>
        </div>
        <span className="text-slate-300">·</span>
        <span>
          Berlaku: <strong className="text-slate-700">{fmtDate(item.masaBerlaku.from)}</strong>
          {" — "}
          <strong className="text-slate-700">{fmtDate(item.masaBerlaku.to)}</strong>
        </span>
      </div>

      {/* Keluhan / Catatan */}
      {(item.keluhan ?? item.catatan) && (
        <div className="rounded-xl bg-amber-50/60 px-3 py-2 ring-1 ring-amber-100/80">
          <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-500">
            {item.keluhan ? "Keluhan" : "Catatan"}
          </p>
          <p className="text-[11px] leading-relaxed text-amber-800">
            {item.keluhan ?? item.catatan}
          </p>
        </div>
      )}
    </motion.div>
  );
}
