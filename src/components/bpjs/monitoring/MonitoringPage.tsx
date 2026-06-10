"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, FileText, HeartPulse, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  KUNJUNGAN_MONITORING_MOCK,
  KLAIM_MONITORING_MOCK,
  JASA_RAHARJA_MONITORING_MOCK,
} from "@/lib/bpjs/mock/monitoringMock";
import KunjunganPanel      from "./KunjunganPanel";
import KlaimPanel          from "./KlaimPanel";
import HistoriPelayananPanel from "./HistoriPelayananPanel";
import JasaRaharjaPanel    from "./JasaRaharjaPanel";

// ── Skeleton ───────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-2">
        <Bone className="h-3 w-28" />
        <Bone className="h-5 w-44" />
        <Bone className="h-3 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Bone key={i} className="h-16 rounded-2xl" />)}
      </div>
      <Bone className="h-96 rounded-2xl" />
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconCls,
  delay = 0,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  sub: string;
  iconCls: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconCls)}>
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-black leading-none text-slate-900">{value}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>
      </div>
    </motion.div>
  );
}

// ── Tab types ──────────────────────────────────────────

type TabKey = "kunjungan" | "klaim" | "histori" | "jasaraharja";

const TABS: { key: TabKey; label: string; icon: IconComponent }[] = [
  { key: "kunjungan",   label: "Kunjungan",        icon: Activity    },
  { key: "klaim",       label: "Data Klaim",        icon: FileText    },
  { key: "histori",     label: "Histori Pelayanan", icon: HeartPulse  },
  { key: "jasaraharja", label: "Jasa Raharja",      icon: ShieldAlert },
];

const TAB_ORDER: Record<TabKey, number> = {
  kunjungan: 0, klaim: 1, histori: 2, jasaraharja: 3,
};

// ── Page ───────────────────────────────────────────────

export default function MonitoringPage() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab]       = useState<TabKey>("kunjungan");
  const [prev, setPrev]     = useState<TabKey>("kunjungan");

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(t);
  }, []);

  function switchTab(next: TabKey) {
    if (next === tab) return;
    setPrev(tab);
    setTab(next);
  }

  const dir = TAB_ORDER[tab] > TAB_ORDER[prev] ? 12 : -12;

  const stats = useMemo(() => {
    const ri      = KUNJUNGAN_MONITORING_MOCK.filter((k) => k.jnsPelayanan === "R.Inap").length;
    const rj      = KUNJUNGAN_MONITORING_MOCK.filter((k) => k.jnsPelayanan === "R.Jalan").length;
    const pending = KLAIM_MONITORING_MOCK.filter((k) => k.status === "Pending Verifikasi").length;
    const jr      = JASA_RAHARJA_MONITORING_MOCK.length;
    return { ri, rj, pending, jr };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!loaded ? (
        <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
          <PageSkeleton />
        </motion.div>
      ) : (
        <motion.div
          key="page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex h-full flex-col gap-4 p-6"
        >
          {/* Header */}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600">
              EHIS BPJS · V-Claim
            </p>
            <h1 className="mt-0.5 text-base font-bold text-slate-900">Monitoring</h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Pantau kunjungan · data klaim · riwayat pelayanan peserta · klaim Jasa Raharja
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={Activity}
              label="Kunjungan Rawat Inap"
              value={String(stats.ri)}
              sub="total SEP aktif RI"
              iconCls="bg-emerald-100 text-emerald-600"
              delay={0}
            />
            <StatCard
              icon={Activity}
              label="Kunjungan Rawat Jalan"
              value={String(stats.rj)}
              sub="total SEP aktif RJ"
              iconCls="bg-sky-100 text-sky-600"
              delay={0.06}
            />
            <StatCard
              icon={FileText}
              label="Klaim Pending"
              value={String(stats.pending)}
              sub="belum diverifikasi"
              iconCls="bg-amber-100 text-amber-600"
              delay={0.12}
            />
            <StatCard
              icon={ShieldAlert}
              label="Jasa Raharja"
              value={String(stats.jr)}
              sub="klaim kecelakaan"
              iconCls="bg-rose-100 text-rose-600"
              delay={0.18}
            />
          </div>

          {/* Tab panel */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Tab bar */}
            <div className="shrink-0 flex items-center gap-1 border-b border-slate-100 bg-slate-50/50 px-3 py-2 overflow-x-auto">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchTab(key)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all",
                    tab === key
                      ? "bg-white text-amber-700 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
                  )}
                >
                  <Icon size={11} strokeWidth={2.5} />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content — absolute-positioned for slide animation */}
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {tab === "kunjungan" && (
                  <motion.div
                    key="kunjungan"
                    initial={{ opacity: 0, x: dir }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -dir }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <KunjunganPanel />
                  </motion.div>
                )}
                {tab === "klaim" && (
                  <motion.div
                    key="klaim"
                    initial={{ opacity: 0, x: dir }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -dir }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <KlaimPanel />
                  </motion.div>
                )}
                {tab === "histori" && (
                  <motion.div
                    key="histori"
                    initial={{ opacity: 0, x: dir }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -dir }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <HistoriPelayananPanel />
                  </motion.div>
                )}
                {tab === "jasaraharja" && (
                  <motion.div
                    key="jasaraharja"
                    initial={{ opacity: 0, x: dir }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -dir }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <JasaRaharjaPanel />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
