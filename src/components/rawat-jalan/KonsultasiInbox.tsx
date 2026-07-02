"use client";

// Worklist Konsultasi Masuk (sisi KONSULTAN) — halaman Rawat Jalan. Konsultasi antar-SMF dari
// IGD/RI/RJ (medicalrecord.Konsultasi, GET /konsultasi?status=aktif) → kartu pasien + SBAR
// ringkas; klik → halaman jawab fokus /ehis-care/rawat-jalan/konsultasi/:id (Terima + Jawab di
// sana). Gate clinical.konsultasi:read (worklist lintas careUnit).

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare, Clock, User, ChevronRight, CheckCircle2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { listKonsultasiWorklist, type KonsultasiWorklistDTO } from "@/lib/api/konsultasi/konsultasi";
import {
  URGENCY_CONFIG, STATUS_CONFIG, elapsedSince,
} from "@/components/shared/medical-records/konsultasi/konsultasiShared";

const UNIT_BADGE: Record<string, { label: string; cls: string }> = {
  IGD:        { label: "IGD",         cls: "bg-rose-50 text-rose-600 ring-rose-200" },
  RawatInap:  { label: "Rawat Inap",  cls: "bg-indigo-50 text-indigo-600 ring-indigo-200" },
  RawatJalan: { label: "Rawat Jalan", cls: "bg-sky-50 text-sky-600 ring-sky-200" },
};

function KonsultasiCard({ item, index }: { item: KonsultasiWorklistDTO; index: number }) {
  const urgCfg  = URGENCY_CONFIG[item.urgency];
  const statCfg = STATUS_CONFIG[item.status];
  const unit    = UNIT_BADGE[item.unitAsal] ?? { label: item.unitAsal, cls: "bg-slate-50 text-slate-500 ring-slate-200" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.04 }}
    >
      <Link
        href={`/ehis-care/rawat-jalan/konsultasi/${item.id}`}
        className={cn(
          "group flex h-full flex-col rounded-xl border border-slate-200 border-l-4 bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md",
          urgCfg.border,
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-[10px] font-bold text-sky-700">
              {item.smfSingkatan}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-800">{item.pasienNama}</p>
              <p className="text-[10px] text-slate-400">{item.noRM} · {item.noKunjungan}</p>
            </div>
          </div>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold", urgCfg.badge)}>
            {item.urgency}
          </span>
        </div>

        <p className="mt-2.5 line-clamp-2 flex-1 text-[11px] leading-relaxed text-slate-500">
          {item.situation}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold ring-1", unit.cls)}>
            {unit.label}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
            {item.smfNama}
          </span>
          <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold", statCfg.badge)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", statCfg.dot)} />
            {item.status === "Terkirim" ? "Menunggu Diterima" : item.status}
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
          <span className="flex min-w-0 items-center gap-1 text-[10px] text-slate-400">
            <User size={9} className="shrink-0" />
            <span className="truncate">{item.dokterPeminta}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-slate-400">
            <Clock size={9} />
            {elapsedSince(item.tanggalRequest, item.waktuRequest)}
            <ChevronRight size={11} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-500" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function KonsultasiInbox() {
  const [items,   setItems]   = useState<KonsultasiWorklistDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    listKonsultasiWorklist("aktif", ac.signal)
      .then((rows) => { if (!ac.signal.aborted) setItems(rows); })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat konsultasi masuk", e instanceof ApiError ? e.message : undefined);
      })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, []);

  const menunggu = items.filter((i) => i.status === "Terkirim").length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <MessageSquare size={14} className="text-sky-500" />
        <p className="text-xs font-semibold text-slate-700">Konsultasi Masuk (Antar-SMF)</p>
        {menunggu > 0 && (
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 ring-1 ring-sky-200">
            {menunggu} menunggu diterima
          </span>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
            <Loader2 size={15} className="animate-spin" />
            <span className="text-xs">Memuat konsultasi…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <CheckCircle2 size={13} className="text-emerald-400" />
            Tidak ada konsultasi menunggu — semua permintaan sudah dijawab
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item, i) => (
              <KonsultasiCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
