"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Printer, FileText, Receipt, Tag, BookOpen, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { type FarmasiOrder } from "@/components/farmasi/farmasiShared";
import { getPatientInfo } from "@/components/farmasi/farmasiShared";

// ── Helpers ───────────────────────────────────────────────

function fmtRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

// ── Print document card ───────────────────────────────────

interface DocCardProps {
  icon:    React.ReactNode;
  title:   string;
  desc:    string;
  color:   string;
  onClick: () => void;
  printed: boolean;
}

function DocCard({ icon, title, desc, color, onClick, printed }: DocCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all",
        printed
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30",
      )}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", color)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
      </div>
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
        printed ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500",
      )}>
        {printed ? <Check size={14} /> : <Printer size={14} />}
      </div>
    </motion.button>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function CetakPane({ order }: { order: FarmasiOrder }) {
  const patient = getPatientInfo(order.noRM);
  const [printed, setPrinted] = useState<Record<string, boolean>>({});

  const totalHarga = order.items.reduce((s, i) => s + (i.hargaSatuan ?? 0) * i.jumlah, 0);

  function handlePrint(type: string) {
    // In production this would call window.print() with a specific print template
    setPrinted((p) => ({ ...p, [type]: true }));
  }

  const docs = [
    {
      id:    "resep",
      icon:  <FileText size={18} className="text-indigo-600" />,
      title: "Cetak Resep",
      desc:  `${order.noOrder} · ${order.items.length} item obat · ${order.dokterPeminta}`,
      color: "bg-indigo-100",
    },
    {
      id:    "kwitansi",
      icon:  <Receipt size={18} className="text-emerald-600" />,
      title: "Kwitansi Pembayaran",
      desc:  `Total: ${fmtRupiah(totalHarga)} · ${order.items.length} item`,
      color: "bg-emerald-100",
    },
    {
      id:    "label",
      icon:  <Tag size={18} className="text-amber-600" />,
      title: "Label Obat",
      desc:  `${order.items.length} label · nama pasien, aturan pakai, lot, exp`,
      color: "bg-amber-100",
    },
    {
      id:    "etiket",
      icon:  <BookOpen size={18} className="text-sky-600" />,
      title: "Etiket Aturan Pakai",
      desc:  "Nama obat · cara minum · waktu minum · efek samping umum",
      color: "bg-sky-100",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Patient + order summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Ringkasan Order</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          {[
            ["Pasien",    order.namaPasien],
            ["No. RM",    order.noRM],
            ["No. Order", order.noOrder],
            ["Tanggal",   order.tanggal],
            ["Dokter",    order.dokterPeminta],
            ["Depo",      order.depo],
            ...(patient?.ruangan ? [["Ruangan", `${patient.ruangan}${patient.noBed ? ` · ${patient.noBed}` : ""}`]] : []),
            ["Total",     fmtRupiah(totalHarga)],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-1">
              <span className="shrink-0 text-slate-400 w-20">{k}</span>
              <span className="font-semibold text-slate-700 truncate">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Obat list */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Daftar Obat</p>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold text-slate-400 w-4">{i + 1}.</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{item.namaObat}</p>
                  <p className="text-[10px] text-slate-400">{item.dosis} · {item.rute}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold text-slate-700">{item.jumlah} {item.satuanObat ?? "Tab"}</p>
                <p className="text-[10px] text-slate-400">{fmtRupiah((item.hargaSatuan ?? 0) * item.jumlah)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Print options */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Pilih Dokumen untuk Dicetak</p>
        {docs.map((doc) => (
          <DocCard
            key={doc.id}
            icon={doc.icon} title={doc.title} desc={doc.desc} color={doc.color}
            printed={!!printed[doc.id]}
            onClick={() => handlePrint(doc.id)}
          />
        ))}
      </div>

      {/* Print all */}
      <button
        onClick={() => docs.forEach((d) => handlePrint(d.id))}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-200 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
      >
        <Printer size={15} />
        Cetak Semua Dokumen
      </button>
    </div>
  );
}
