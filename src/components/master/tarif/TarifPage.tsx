"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Package, Tag, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { TARIF_MOCK, PAKET_MOCK } from "@/lib/master/tarifMock";
import type { TarifRecord, PaketLayanan } from "@/lib/master/tarifMock";
import TarifList   from "./TarifList";
import TarifDetail from "./TarifDetail";
import PaketList   from "./PaketList";
import PaketDetail from "./PaketDetail";
import { fmtIDRShort } from "./tarifShared";

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
      <Bone className="h-9 w-52 rounded-xl" />
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
        <Tag size={22} className="text-teal-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-600">Pilih item untuk diedit</p>
        <p className="mt-0.5 text-xs text-slate-400">atau tambah tarif / paket baru</p>
      </div>
      <button onClick={onAdd}
        className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition">
        + Tambah Baru
      </button>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent }: {
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

// ── View tab button ──────────────────────────────────────────

function ViewTab({ label, icon: Icon, active, onClick }: {
  label: string; icon: React.ElementType; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-teal-600 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

// ── Main page ────────────────────────────────────────────────

type View = "tarif" | "paket";

export default function TarifPage() {
  const [loaded,  setLoaded]  = useState(false);
  const [view,    setView]    = useState<View>("tarif");

  const [items,   setItems]   = useState<TarifRecord[]>(() => structuredClone(TARIF_MOCK));
  const [pakets,  setPakets]  = useState<PaketLayanan[]>(() => structuredClone(PAKET_MOCK));

  const [selT,    setSelT]    = useState<TarifRecord | null>(() => TARIF_MOCK[0] ?? null);
  const [draftT,  setDraftT]  = useState<TarifRecord | null>(() => TARIF_MOCK[0] ? structuredClone(TARIF_MOCK[0]) : null);
  const [isNewT,  setIsNewT]  = useState(false);

  const [selP,    setSelP]    = useState<PaketLayanan | null>(() => PAKET_MOCK[0] ?? null);
  const [draftP,  setDraftP]  = useState<PaketLayanan | null>(() => PAKET_MOCK[0] ? structuredClone(PAKET_MOCK[0]) : null);
  const [isNewP,  setIsNewP]  = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(t);
  }, []);

  // ── Derived stats ──────────────────────────────────────
  const aktifCount  = useMemo(() => items.filter((r) => r.status === "Aktif").length, [items]);
  const avgUmum     = useMemo(() => {
    const aktif = items.filter((r) => r.status === "Aktif");
    return aktif.length ? Math.round(aktif.reduce((s, r) => s + r.tarifUmum, 0) / aktif.length) : 0;
  }, [items]);

  // ── Tarif handlers ─────────────────────────────────────
  const isDirtyT = useMemo(
    () => !!draftT && JSON.stringify(selT ?? {}) !== JSON.stringify(draftT),
    [selT, draftT],
  );

  const selectTarif = (r: TarifRecord) => {
    if (isDirtyT && !confirm("Ada perubahan belum tersimpan. Buang?")) return;
    setSelT(r); setDraftT(structuredClone(r)); setIsNewT(false);
  };
  const addTarif = (r: TarifRecord) => {
    setSelT(null); setDraftT(r); setIsNewT(true);
  };
  const saveTarif = () => {
    if (!draftT) return;
    if (isNewT) {
      setItems((prev) => [...prev, draftT]);
    } else {
      setItems((prev) => prev.map((x) => x.id === draftT.id ? draftT : x));
    }
    setSelT(draftT); setIsNewT(false);
  };
  const cancelTarif = () => {
    if (isDirtyT && !confirm("Buang perubahan?")) return;
    setDraftT(selT ? structuredClone(selT) : null);
  };
  const deleteTarif = () => {
    if (!draftT || !confirm(`Hapus tarif "${draftT.nama}"?`)) return;
    setItems((prev) => prev.filter((x) => x.id !== draftT.id));
    setSelT(null); setDraftT(null);
  };

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

  const switchView = (v: View) => {
    if ((v === "tarif" ? isDirtyT : isDirtyP) && !confirm("Ada perubahan belum tersimpan. Buang?")) return;
    setView(v);
  };

  return (
    <div className="flex h-full flex-col">
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
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
                <h1 className="mt-0.5 text-xl font-bold text-slate-900">Tarif & Paket Layanan</h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Kelola tarif dasar (Umum · BPJS · Asuransi) dan paket bundling layanan RS.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <StatCard label="Total Tarif" value={items.length} icon={Tag}
                  accent={{ bg: "bg-teal-50", text: "text-teal-600" }} />
                <StatCard label="Aktif" value={aktifCount} icon={Receipt}
                  accent={{ bg: "bg-emerald-50", text: "text-emerald-600" }} />
                <StatCard label="Paket" value={pakets.length} icon={Package}
                  accent={{ bg: "bg-sky-50", text: "text-sky-600" }} />
                <StatCard label="Avg. Tarif" value={`Rp ${fmtIDRShort(avgUmum)}`}
                  sub="tarif aktif" icon={DollarSign}
                  accent={{ bg: "bg-amber-50", text: "text-amber-600" }} />
              </div>
            </motion.div>

            {/* View switcher */}
            <div className="shrink-0 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
              <ViewTab label="Tarif Dasar"     icon={Receipt} active={view === "tarif"} onClick={() => switchView("tarif")} />
              <ViewTab label="Paket Layanan"   icon={Package} active={view === "paket"} onClick={() => switchView("paket")} />
            </div>

            {/* Two-panel body */}
            <AnimatePresence mode="wait">
              <motion.div key={view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                className="flex min-h-0 flex-1 gap-4">

                {view === "tarif" && (
                  <>
                    <div className="w-85 shrink-0">
                      <TarifList items={items} selected={selT}
                        onSelect={selectTarif} onAdd={addTarif} />
                    </div>
                    <div className="flex min-w-0 flex-1">
                      {draftT ? (
                        <TarifDetail draft={draftT} isNew={isNewT} isDirty={isDirtyT}
                          onPatch={(p) => setDraftT((prev) => prev ? { ...prev, ...p } : prev)}
                          onSave={saveTarif} onCancel={cancelTarif} onDelete={deleteTarif} />
                      ) : (
                        <EmptyState onAdd={() => addTarif({ ...TARIF_MOCK[0], id: `tarif-${Date.now()}` })} />
                      )}
                    </div>
                  </>
                )}

                {view === "paket" && (
                  <>
                    <div className="w-85 shrink-0">
                      <PaketList items={pakets} selected={selP}
                        onSelect={selectPaket} onAdd={addPaket} />
                    </div>
                    <div className="flex min-w-0 flex-1">
                      {draftP ? (
                        <PaketDetail draft={draftP} isNew={isNewP} isDirty={isDirtyP}
                          allTarifs={items}
                          onPatch={(p) => setDraftP((prev) => prev ? { ...prev, ...p } : prev)}
                          onSave={savePaket} onCancel={cancelPaket} onDelete={deletePaket} />
                      ) : (
                        <EmptyState onAdd={() => addPaket({ ...PAKET_MOCK[0], id: `paket-${Date.now()}` })} />
                      )}
                    </div>
                  </>
                )}

              </motion.div>
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
