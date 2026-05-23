"use client";

/**
 * Strip 5 KPI hero cards di atas grid Beranda.
 * Lebih besar dari `StatCard` shared (yang dipakai di sub-master pages)
 * karena ini halaman landing dan butuh visual hierarchy yang lebih dominan.
 */

import { motion } from "framer-motion";
import { Users, Layers3, BookMarked, Network, Settings2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BerandaStats } from "./berandaShared";

interface KPI {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub: string;
  /** Tailwind soft bg + text classes */
  tone: { bg: string; text: string; ring: string; bar: string };
}

function buildKpis(s: BerandaStats): KPI[] {
  return [
    { icon: Users,       label: "Sumber Daya",      value: s.sdm,            sub: "Dokter + Pengguna",            tone: { bg: "bg-teal-50",    text: "text-teal-700",    ring: "ring-teal-100",    bar: "bg-teal-500"    } },
    { icon: Layers3,     label: "Katalog Klinis",   value: s.katalog,        sub: "Obat · Tindakan · Penunjang",  tone: { bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-100",     bar: "bg-sky-500"     } },
    { icon: BookMarked,  label: "Reference",        value: s.reference,      sub: "ICD · Asesmen · SDKI · Skala", tone: { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-100",    bar: "bg-rose-500"    } },
    { icon: Network,     label: "Mapping Coverage", value: `${s.mapping}%`,  sub: "Avg cell terisi (8 matriks)",  tone: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-100", bar: "bg-emerald-500" } },
    { icon: Settings2,   label: "Operasional",      value: s.operasional,    sub: "Tarif · Penjamin · PPK",       tone: { bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-100",  bar: "bg-violet-500"  } },
  ];
}

export default function KPIStrip({ stats }: { stats: BerandaStats }) {
  const kpis = buildKpis(stats);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {kpis.map((k, i) => (
        <motion.div
          key={k.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.04 }}
          className="group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          <div className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg ring-1",
                k.tone.bg,
                k.tone.text,
                k.tone.ring,
              )}
            >
              <k.icon size={16} />
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {String(i + 1).padStart(2, "0")}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{k.label}</p>
            <p className="mt-0.5 text-2xl font-black leading-tight tracking-tight text-slate-900">{k.value}</p>
            <p className="mt-0.5 text-[10.5px] leading-tight text-slate-500">{k.sub}</p>
          </div>
          {/* subtle accent strip */}
          <span
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100",
              k.tone.bar,
            )}
          />
        </motion.div>
      ))}
    </div>
  );
}
