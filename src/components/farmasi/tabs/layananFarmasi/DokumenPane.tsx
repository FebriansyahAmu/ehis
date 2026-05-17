"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Printer, FileText, Receipt, Tag, BookOpen, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type FarmasiOrder, getPatientInfo } from "@/components/farmasi/farmasiShared";

function fmtRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

// ── Print doc card ─────────────────────────────────────────

interface DocCardProps {
  icon: React.ReactNode; title: string; desc: string; color: string;
  printed: boolean; onClick: () => void;
}

function DocCard({ icon, title, desc, color, printed, onClick }: DocCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
        printed
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/30",
      )}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", color)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{desc}</p>
      </div>
      <motion.div
        animate={printed ? { scale: [1, 1.25, 1] } : {}}
        transition={{ duration: 0.3 }}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
          printed ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500",
        )}
      >
        {printed ? <Check size={14} /> : <Printer size={14} />}
      </motion.div>
    </motion.button>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function DokumenPane({ order }: { order: FarmasiOrder }) {
  const patient        = getPatientInfo(order.noRM);
  const [printed, setPrinted] = useState<Record<string, boolean>>({});

  const totalHarga   = order.items.reduce((s, i) => s + (i.hargaSatuan ?? 0) * i.jumlah, 0);
  const printedCount = Object.values(printed).filter(Boolean).length;

  const docs = [
    {
      id: "resep", icon: <FileText size={16} className="text-sky-600" />, color: "bg-sky-100",
      title: "Cetak Resep",
      desc:  `${order.noOrder} · ${order.items.length} item · ${order.dokterPeminta}`,
    },
    {
      id: "kwitansi", icon: <Receipt size={16} className="text-emerald-600" />, color: "bg-emerald-100",
      title: "Kwitansi Pembayaran",
      desc:  `Total: ${fmtRupiah(totalHarga)} · ${order.items.length} item`,
    },
    {
      id: "label", icon: <Tag size={16} className="text-amber-600" />, color: "bg-amber-100",
      title: "Label Obat",
      desc:  `${order.items.length} label · nama pasien, aturan pakai, lot, exp`,
    },
    {
      id: "etiket", icon: <BookOpen size={16} className="text-sky-600" />, color: "bg-sky-100",
      title: "Etiket Aturan Pakai",
      desc:  "Cara minum · waktu minum · efek samping umum",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Cetak Dokumen</p>
        {printedCount > 0 && (
          <span className="text-[10px] font-semibold text-emerald-600">{printedCount}/{docs.length} dicetak</span>
        )}
      </div>

      {/* Order summary */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          {(
            [
              ["Pasien",    order.namaPasien],
              ["No. RM",    order.noRM],
              ["No. Order", order.noOrder],
              ["Tanggal",   order.tanggal],
              ["Dokter",    order.dokterPeminta],
              ["Depo",      order.depo],
              ...(patient?.ruangan
                ? [["Ruangan", `${patient.ruangan}${patient.noBed ? ` · ${patient.noBed}` : ""}`]]
                : []),
              ["Total",     fmtRupiah(totalHarga)],
            ] as [string, string][]
          ).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-1.5">
              <span className="w-20 shrink-0 text-slate-400">{k}</span>
              <span className="truncate font-semibold text-slate-700">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {docs.map((doc) => (
          <DocCard
            key={doc.id}
            icon={doc.icon} title={doc.title} desc={doc.desc} color={doc.color}
            printed={!!printed[doc.id]}
            onClick={() => setPrinted((p) => ({ ...p, [doc.id]: true }))}
          />
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setPrinted(Object.fromEntries(docs.map((d) => [d.id, true])))}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-sky-200 py-2.5 text-sm font-bold text-sky-700 transition hover:bg-sky-50"
      >
        <Printer size={14} />Cetak Semua Dokumen
      </motion.button>
    </div>
  );
}
