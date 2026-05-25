"use client";

/**
 * 5 KPI hero card di atas Beranda Billing.
 *
 * KPI:
 *   1. Tagihan Hari Ini       — count + total Rp (amber)
 *   2. Outstanding             — count + total Rp sisa (rose)
 *   3. Klaim Pending           — count + total Rp (sky)
 *   4. Pendapatan Hari Ini     — total + count transaksi (emerald)
 *   5. Shift Aktif             — count + counter unik (violet)
 */

import { motion } from "framer-motion";
import {
  Receipt, AlertCircle, ShieldCheck, TrendingUp, Layers,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiahShort } from "@/lib/master/penjaminMock";
import type { BillingStats } from "./berandaBillingShared";

interface KPI {
  icon:  LucideIcon;
  label: string;
  value: string;
  sub:   string;
  tone:  { bg: string; text: string; ring: string; bar: string };
}

function buildKpis(s: BillingStats): KPI[] {
  return [
    {
      icon: Receipt,
      label: "Tagihan Hari Ini",
      value: String(s.tagihanHariIni.count),
      sub:   `${fmtRupiahShort(s.tagihanHariIni.total)} · invoice baru`,
      tone:  { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-100",   bar: "bg-amber-500"   },
    },
    {
      icon: AlertCircle,
      label: "Outstanding",
      value: fmtRupiahShort(s.outstanding.total),
      sub:   `${s.outstanding.count} invoice belum lunas`,
      tone:  { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-100",    bar: "bg-rose-500"    },
    },
    {
      icon: ShieldCheck,
      label: "Klaim Pending",
      value: String(s.klaimPending.count),
      sub:   `${fmtRupiahShort(s.klaimPending.total)} · menunggu approval`,
      tone:  { bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-100",     bar: "bg-sky-500"     },
    },
    {
      icon: TrendingUp,
      label: "Pendapatan Hari Ini",
      value: fmtRupiahShort(s.pendapatanHariIni.total),
      sub:   `${s.pendapatanHariIni.count} transaksi · lintas counter`,
      tone:  { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-100", bar: "bg-emerald-500" },
    },
    {
      icon: Layers,
      label: "Shift Aktif",
      value: String(s.shiftAktif.count),
      sub:   `${s.shiftAktif.counters} counter buka`,
      tone:  { bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-100",  bar: "bg-violet-500"  },
    },
  ];
}

export default function KPIStripBilling({ stats }: { stats: BillingStats }) {
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
            <p className="mt-0.5 text-2xl font-black leading-tight tracking-tight tabular-nums text-slate-900">
              {k.value}
            </p>
            <p className="mt-0.5 text-[10.5px] leading-tight text-slate-500">{k.sub}</p>
          </div>
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
