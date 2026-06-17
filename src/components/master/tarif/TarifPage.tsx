"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Layers, Power, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { TARIF_MOCK, PAKET_MOCK } from "@/lib/master/tarifMock";
import type { PaketLayanan } from "@/lib/master/tarifMock";
import PaketList   from "./PaketList";
import PaketDetail from "./PaketDetail";
import { fmtIDRShort, calcPaketTotal } from "./tarifShared";

// Katalog item untuk komposisi paket (resolve nama/kode/harga). Read-only di sini.
// CATATAN: tarif dasar per-tindakan kini dikelola di Mapping Hub → Tarif Matrix
// (/ehis-master/mapping?sub=tarif). TARIF_MOCK dipertahankan sebagai sumber bundling paket
// sampai federasi chargemaster (TODO-CHARGEMASTER) menyediakan katalog tindakan terpadu.
const TARIF_CATALOG = TARIF_MOCK;

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
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50">
        <Package size={22} className="text-teal-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-600">Pilih paket untuk diedit</p>
        <p className="mt-0.5 text-xs text-slate-400">atau tambah paket layanan baru</p>
      </div>
      <button onClick={onAdd}
        className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition">
        + Tambah Paket
      </button>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: IconComponent; accent: { bg: string; text: string };
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

export default function TarifPage() {
  const [loaded, setLoaded] = useState(false);

  const [pakets, setPakets] = useState<PaketLayanan[]>(() => structuredClone(PAKET_MOCK));
  const [selP,   setSelP]   = useState<PaketLayanan | null>(() => PAKET_MOCK[0] ?? null);
  const [draftP, setDraftP] = useState<PaketLayanan | null>(() => PAKET_MOCK[0] ? structuredClone(PAKET_MOCK[0]) : null);
  const [isNewP, setIsNewP] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(t);
  }, []);

  // ── Derived stats ──────────────────────────────────────
  const aktifCount = useMemo(() => pakets.filter((p) => p.status === "Aktif").length, [pakets]);
  const totalItem  = useMemo(() => pakets.reduce((s, p) => s + p.items.length, 0), [pakets]);
  const avgHarga   = useMemo(() => {
    const aktif = pakets.filter((p) => p.status === "Aktif");
    if (!aktif.length) return 0;
    const sum = aktif.reduce((s, p) => s + (p.tarifUmum || calcPaketTotal(p.items, TARIF_CATALOG)), 0);
    return Math.round(sum / aktif.length);
  }, [pakets]);

  // ── Paket handlers ─────────────────────────────────────
  const isDirtyP = useMemo(
    () => !!draftP && JSON.stringify(selP ?? {}) !== JSON.stringify(draftP),
    [selP, draftP],
  );

  const selectPaket = (p: PaketLayanan) => {
    if (isDirtyP && !confirm("Ada perubahan belum tersimpan. Buang?")) return;
    setSelP(p); setDraftP(structuredClone(p)); setIsNewP(false);
  };
  const addPaket = (p: PaketLayanan) => {
    setSelP(null); setDraftP(p); setIsNewP(true);
  };
  const savePaket = () => {
    if (!draftP) return;
    if (isNewP) {
      setPakets((prev) => [...prev, draftP]);
    } else {
      setPakets((prev) => prev.map((x) => x.id === draftP.id ? draftP : x));
    }
    setSelP(draftP); setIsNewP(false);
  };
  const cancelPaket = () => {
    if (isDirtyP && !confirm("Buang perubahan?")) return;
    setDraftP(selP ? structuredClone(selP) : null);
  };
  const deletePaket = () => {
    if (!draftP || !confirm(`Hapus paket "${draftP.nama}"?`)) return;
    setPakets((prev) => prev.filter((x) => x.id !== draftP.id));
    setSelP(null); setDraftP(null);
  };

  return (
    <div className="flex h-full flex-col">
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
            <PageSkeleton />
          </motion.div>
        ) : (
          <motion.div key="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }} className="flex h-full flex-col gap-4 p-6">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex shrink-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-600">
                  EHIS Master · Operasional
                </p>
                <h1 className="mt-0.5 text-xl font-bold text-slate-900">Paket Layanan</h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Kelola paket bundling layanan RS (komposisi item + harga paket). Tarif dasar per-tindakan
                  dikelola di <span className="font-semibold text-teal-700">Mapping Hub → Tarif Matrix</span>.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <StatCard label="Total Paket" value={pakets.length} icon={Package}
                  accent={{ bg: "bg-teal-50", text: "text-teal-600" }} />
                <StatCard label="Aktif" value={aktifCount} icon={Power}
                  accent={{ bg: "bg-emerald-50", text: "text-emerald-600" }} />
                <StatCard label="Total Item" value={totalItem} icon={Layers}
                  accent={{ bg: "bg-sky-50", text: "text-sky-600" }} />
                <StatCard label="Avg. Paket" value={`Rp ${fmtIDRShort(avgHarga)}`}
                  sub="paket aktif" icon={DollarSign}
                  accent={{ bg: "bg-amber-50", text: "text-amber-600" }} />
              </div>
            </motion.div>

            {/* Two-panel body — Paket only */}
            <div className="flex min-h-0 flex-1 gap-4">
              <div className="w-85 shrink-0">
                <PaketList items={pakets} selected={selP}
                  onSelect={selectPaket} onAdd={addPaket} />
              </div>
              <div className="flex min-w-0 flex-1">
                {draftP ? (
                  <PaketDetail draft={draftP} isNew={isNewP} isDirty={isDirtyP}
                    allTarifs={TARIF_CATALOG}
                    onPatch={(p) => setDraftP((prev) => prev ? { ...prev, ...p } : prev)}
                    onSave={savePaket} onCancel={cancelPaket} onDelete={deletePaket} />
                ) : (
                  <EmptyState onAdd={() => addPaket({ ...PAKET_MOCK[0], id: `paket-${Date.now()}` })} />
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
