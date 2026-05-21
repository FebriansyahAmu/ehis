"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Wallet, Briefcase, ListChecks, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PENJAMIN_INITIAL,
  type PenjaminRecord,
} from "@/lib/master/penjaminStore";
import { emptyPenjamin, TIPE_CFG } from "./penjaminShared";

import PenjaminList   from "./PenjaminList";
import PenjaminDetail from "./PenjaminDetail";

// ── Skeleton ─────────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Bone className="h-3 w-36" />
          <Bone className="h-5 w-52" />
          <Bone className="h-3 w-72" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((k) => <Bone key={k} className="h-16 w-28 rounded-xl" />)}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-4">
        <Bone className="h-full w-85 rounded-xl" />
        <Bone className="h-full flex-1 rounded-xl" />
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
        <ShieldCheck size={22} className="text-emerald-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-600">Pilih penjamin untuk diedit</p>
        <p className="mt-0.5 text-xs text-slate-400">atau tambah penjamin baru di kiri</p>
      </div>
      <button
        onClick={onAdd}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
      >
        + Tambah Penjamin
      </button>
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: { bg: string; text: string };
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-sm">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", accent.bg)}>
        <Icon size={15} className={accent.text} />
      </div>
      <div>
        <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
        <p className="text-[10px] font-semibold text-slate-500">{label}</p>
        {sub && <p className="text-[9px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────

export default function PenjaminPage() {
  const [loaded, setLoaded] = useState(false);

  const [items,    setItems]    = useState<PenjaminRecord[]>(() => structuredClone(PENJAMIN_INITIAL));
  const [selected, setSelected] = useState<PenjaminRecord | null>(() => PENJAMIN_INITIAL[0] ?? null);
  const [draft,    setDraft]    = useState<PenjaminRecord | null>(
    () => PENJAMIN_INITIAL[0] ? structuredClone(PENJAMIN_INITIAL[0]) : null,
  );
  const [isNew,    setIsNew]    = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(t);
  }, []);

  // ── Derived stats ──
  const stats = useMemo(() => {
    const aktif       = items.filter((p) => p.status === "Aktif").length;
    const bpjs        = items.filter((p) => p.tipe === "BPJS").length;
    const asuransi    = items.filter((p) => p.tipe === "Asuransi_Swasta").length;
    const totalPlafon = items.reduce((s, p) => s + (p.kontrak?.totalPlafon ?? 0), 0);
    return { aktif, bpjs, asuransi, totalPlafon };
  }, [items]);

  const isDirty = useMemo(
    () => !!draft && JSON.stringify(selected ?? {}) !== JSON.stringify(draft),
    [selected, draft],
  );

  // ── Handlers ──
  const selectPenjamin = (p: PenjaminRecord) => {
    if (isDirty && !confirm("Ada perubahan belum tersimpan. Buang?")) return;
    setSelected(p); setDraft(structuredClone(p)); setIsNew(false);
  };

  const addPenjamin = () => {
    if (isDirty && !confirm("Ada perubahan belum tersimpan. Buang?")) return;
    const fresh = emptyPenjamin();
    setSelected(null); setDraft(fresh); setIsNew(true);
  };

  const savePenjamin = () => {
    if (!draft) return;
    if (isNew) {
      setItems((prev) => [...prev, draft]);
    } else {
      setItems((prev) => prev.map((x) => (x.id === draft.id ? draft : x)));
    }
    setSelected(draft); setIsNew(false);
  };

  const cancelPenjamin = () => {
    if (isDirty && !confirm("Buang perubahan?")) return;
    setDraft(selected ? structuredClone(selected) : null);
  };

  const deletePenjamin = () => {
    if (!draft || !confirm(`Hapus penjamin "${draft.nama}"?`)) return;
    setItems((prev) => prev.filter((x) => x.id !== draft.id));
    setSelected(null); setDraft(null);
  };

  return (
    <div className="flex h-full flex-col">
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
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
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex shrink-0 items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
                  EHIS Master · Operasional
                </p>
                <h1 className="mt-0.5 text-xl font-bold text-slate-900">Penjamin &amp; Kontrak</h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Kelola BPJS, asuransi swasta, dan Jamkesda — lengkap dengan PKS, plafon, dan
                  kode SMF/Poli untuk klaim.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <StatCard label="Total" value={items.length}
                  icon={ShieldCheck} accent={{ bg: TIPE_CFG.BPJS.bg, text: TIPE_CFG.BPJS.text }} />
                <StatCard label="Aktif" value={stats.aktif} sub={`${items.length - stats.aktif} non-aktif`}
                  icon={ListChecks} accent={{ bg: "bg-emerald-50", text: "text-emerald-600" }} />
                <StatCard label="Asuransi" value={stats.asuransi} sub={`${stats.bpjs} BPJS`}
                  icon={Briefcase} accent={{ bg: "bg-sky-50", text: "text-sky-600" }} />
                <StatCard label="Total Plafon" value={`Rp ${fmtShort(stats.totalPlafon)}`}
                  sub="gabungan kontrak" icon={Wallet}
                  accent={{ bg: "bg-amber-50", text: "text-amber-600" }} />
              </div>
            </motion.div>

            {/* Cross-link banner ke Mapping Hub */}
            <Link
              href="/ehis-master/mapping?sub=penjamin-ruangan"
              className="group shrink-0 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-2 transition hover:bg-emerald-100/60"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/10 ring-1 ring-emerald-200">
                <Network size={14} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-emerald-800">
                  Mapping Penjamin × Ruangan ada di Mapping Hub
                </p>
                <p className="text-[10px] text-emerald-700/80">
                  Hubungkan kode SMF penjamin (INT/IGD/JAN/dst) ke ruangan rumah sakit dari satu pintu.
                </p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 transition group-hover:bg-emerald-600 group-hover:text-white">
                Buka Mapping Hub →
              </span>
            </Link>

            {/* Two-panel body */}
            <div className="flex min-h-0 flex-1 gap-4">
              <div className="w-85 shrink-0">
                <PenjaminList
                  items={items}
                  selected={selected}
                  onSelect={selectPenjamin}
                  onAdd={addPenjamin}
                />
              </div>
              <div className="flex min-w-0 flex-1">
                {draft ? (
                  <PenjaminDetail
                    draft={draft}
                    isNew={isNew}
                    isDirty={isDirty}
                    onPatch={(p) => setDraft((prev) => prev ? { ...prev, ...p } : prev)}
                    onSave={savePenjamin}
                    onCancel={cancelPenjamin}
                    onDelete={deletePenjamin}
                  />
                ) : (
                  <EmptyState onAdd={addPenjamin} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────

function fmtShort(n: number): string {
  if (!n || n === 0) return "0";
  if (n >= 1_000_000_000) {
    const v = n / 1_000_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} M`;
  }
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} jt`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)} rb`;
  return String(n);
}
