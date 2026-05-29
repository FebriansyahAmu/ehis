"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck, CalendarDays, CheckSquare, FileSearch, FileText, List, Trash2, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { RENCANA_KONTROL_MOCK } from "@/lib/bpjs/vClaimRencanaKontrol";
import CariSEPRKPanel from "./CariSEPRKPanel";
import InsertUpdateRKPanel from "./InsertUpdateRKPanel";
import InsertUpdateSPRIPanel from "./InsertUpdateSPRIPanel";
import HapusRKPanel from "./HapusRKPanel";
import CariNoSuratPanel from "./CariNoSuratPanel";
import DataRKListPanel from "./DataRKListPanel";
import ReferensiPoliDokterPanel from "./ReferensiPoliDokterPanel";

// ── Skeleton ───────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-2">
        <Bone className="h-3 w-32" />
        <Bone className="h-5 w-52" />
        <Bone className="h-3 w-80" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0,1,2].map((i) => <Bone key={i} className="h-16 rounded-2xl" />)}
      </div>
      <Bone className="h-96 rounded-2xl" />
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, iconCls, delay = 0,
}: {
  icon: React.ElementType;
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

// ── Tab config ─────────────────────────────────────────

type TabKey = "cari-sep" | "insert-rk" | "spri" | "hapus" | "no-surat" | "data-list" | "referensi";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "cari-sep",   label: "Cari SEP",      icon: FileSearch    },
  { key: "insert-rk",  label: "Insert/Update RK", icon: CalendarDays },
  { key: "spri",       label: "SPRI",           icon: CalendarCheck },
  { key: "hapus",      label: "Hapus",          icon: Trash2        },
  { key: "no-surat",   label: "No. Surat",      icon: FileText      },
  { key: "data-list",  label: "Data List",      icon: List          },
  { key: "referensi",  label: "Referensi",      icon: Stethoscope   },
];

const TAB_ORDER: Record<TabKey, number> = {
  "cari-sep": 0, "insert-rk": 1, "spri": 2, "hapus": 3,
  "no-surat": 4, "data-list": 5, "referensi": 6,
};

// ── Page ───────────────────────────────────────────────

export default function RencanaKontrolPage() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab]       = useState<TabKey>("cari-sep");
  const [prev, setPrev]     = useState<TabKey>("cari-sep");

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
    const total   = RENCANA_KONTROL_MOCK.length;
    const issued  = RENCANA_KONTROL_MOCK.filter((r) => r.status === "Issued").length;
    const kontrol = RENCANA_KONTROL_MOCK.filter((r) => r.jenis === "Kontrol").length;
    const spri    = RENCANA_KONTROL_MOCK.filter((r) => r.jenis === "SPRI").length;
    return { total, issued, kontrol, spri };
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
            <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">
              EHIS BPJS · V-Claim
            </p>
            <h1 className="mt-0.5 text-base font-bold text-slate-900">Rencana Kontrol</h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Kelola Rencana Kontrol V2 · SPRI · PRB Form 9 penyakit kronik · Referensi Poli &amp; Dokter
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              icon={CalendarDays}
              label="Total RK + SPRI"
              value={String(stats.total)}
              sub={`Kontrol ${stats.kontrol} · SPRI ${stats.spri}`}
              iconCls="bg-violet-100 text-violet-600"
              delay={0}
            />
            <StatCard
              icon={CheckSquare}
              label="Status Issued"
              value={String(stats.issued)}
              sub="surat kontrol aktif"
              iconCls="bg-emerald-100 text-emerald-600"
              delay={0.07}
            />
            <StatCard
              icon={Stethoscope}
              label="Endpoint Tercakup"
              value="11"
              sub="Insert · Update · Delete · List · Ref"
              iconCls="bg-sky-100 text-sky-600"
              delay={0.14}
            />
          </div>

          {/* Tab panel */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Tab bar */}
            <div className="shrink-0 flex items-center gap-1 overflow-x-auto border-b border-slate-100 bg-slate-50/50 px-3 py-2">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchTab(key)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all",
                    tab === key
                      ? "bg-white text-violet-700 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
                  )}
                >
                  <Icon size={11} strokeWidth={2.5} />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {tab === "cari-sep" && (
                  <motion.div key="cari-sep"
                    initial={{ opacity: 0, x: dir }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -dir }} transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col">
                    <CariSEPRKPanel />
                  </motion.div>
                )}
                {tab === "insert-rk" && (
                  <motion.div key="insert-rk"
                    initial={{ opacity: 0, x: dir }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -dir }} transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col">
                    <InsertUpdateRKPanel />
                  </motion.div>
                )}
                {tab === "spri" && (
                  <motion.div key="spri"
                    initial={{ opacity: 0, x: dir }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -dir }} transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col">
                    <InsertUpdateSPRIPanel />
                  </motion.div>
                )}
                {tab === "hapus" && (
                  <motion.div key="hapus"
                    initial={{ opacity: 0, x: dir }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -dir }} transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col">
                    <HapusRKPanel />
                  </motion.div>
                )}
                {tab === "no-surat" && (
                  <motion.div key="no-surat"
                    initial={{ opacity: 0, x: dir }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -dir }} transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col">
                    <CariNoSuratPanel />
                  </motion.div>
                )}
                {tab === "data-list" && (
                  <motion.div key="data-list"
                    initial={{ opacity: 0, x: dir }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -dir }} transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col">
                    <DataRKListPanel />
                  </motion.div>
                )}
                {tab === "referensi" && (
                  <motion.div key="referensi"
                    initial={{ opacity: 0, x: dir }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -dir }} transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col">
                    <ReferensiPoliDokterPanel />
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
