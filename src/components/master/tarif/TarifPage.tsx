"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Layers, Power, DollarSign, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listPaketLayanan, createPaketLayanan, updatePaketLayanan, deletePaketLayanan, type PaketDTO,
} from "@/lib/api/master/paketLayanan";
import {
  type PaketDraft, dtoToDraft, emptyPaketDraft, draftToCreateInput, draftToUpdateInput,
} from "./paketMasterShared";
import PaketList   from "./PaketList";
import PaketDetail from "./PaketDetail";
import { fmtIDRShort } from "./tarifShared";

// Data paket dari master DB (master.PaketLayanan). Kode PKT-NNNN di-generate SERVER (auto).
// CATATAN: tarif dasar per-tindakan dikelola di Mapping Hub → Tarif Matrix; paket = bundling.

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
  const [pakets, setPakets] = useState<PaketDTO[] | null>(null); // null = memuat
  const [selP,   setSelP]   = useState<PaketDraft | null>(null); // salinan "bersih" terpilih
  const [draftP, setDraftP] = useState<PaketDraft | null>(null); // salinan editable
  const [isNewP, setIsNewP] = useState(false);
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listPaketLayanan({ limit: 500 })
      .then(({ items }) => {
        if (!alive) return;
        setPakets(items);
        if (items[0]) { const d = dtoToDraft(items[0]); setSelP(d); setDraftP(structuredClone(d)); }
      })
      .catch(() => { if (alive) { setPakets([]); setErr("Gagal memuat paket dari server."); } });
    return () => { alive = false; };
  }, []);

  /** Muat ulang daftar dari DB, opsional pilih paket tertentu (mis. setelah create/update). */
  async function reload(selectId?: string) {
    const { items } = await listPaketLayanan({ limit: 500 });
    setPakets(items);
    const target = selectId ? items.find((p) => p.id === selectId) : undefined;
    if (target) { const d = dtoToDraft(target); setSelP(d); setDraftP(structuredClone(d)); setIsNewP(false); }
    return items;
  }

  const list = pakets ?? [];

  // ── Derived stats (dep `pakets` stabil; hindari array baru tiap render) ──
  const aktifCount = useMemo(() => (pakets ?? []).filter((p) => p.status === "Aktif").length, [pakets]);
  const totalItem  = useMemo(() => (pakets ?? []).reduce((s, p) => s + p.items.length, 0), [pakets]);
  const avgHarga   = useMemo(() => {
    const aktif = (pakets ?? []).filter((p) => p.status === "Aktif");
    if (!aktif.length) return 0;
    return Math.round(aktif.reduce((s, p) => s + p.hargaUmum, 0) / aktif.length);
  }, [pakets]);

  const isDirtyP = useMemo(
    () => !!draftP && JSON.stringify(selP ?? {}) !== JSON.stringify(draftP),
    [selP, draftP],
  );

  // ── Handlers ───────────────────────────────────────────
  const selectPaket = (p: PaketDTO) => {
    if (isDirtyP && !confirm("Ada perubahan belum tersimpan. Buang?")) return;
    const d = dtoToDraft(p); setSelP(d); setDraftP(structuredClone(d)); setIsNewP(false); setErr(null);
  };
  const addPaket = () => {
    if (isDirtyP && !confirm("Ada perubahan belum tersimpan. Buang?")) return;
    setSelP(null); setDraftP(emptyPaketDraft()); setIsNewP(true); setErr(null);
  };
  const savePaket = async () => {
    if (!draftP || busy) return;
    setBusy(true); setErr(null);
    try {
      const saved = isNewP
        ? await createPaketLayanan(draftToCreateInput(draftP))
        : draftP.id ? await updatePaketLayanan(draftP.id, draftToUpdateInput(draftP)) : null;
      if (saved) await reload(saved.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan paket.");
    } finally { setBusy(false); }
  };
  const cancelPaket = () => {
    if (isDirtyP && !confirm("Buang perubahan?")) return;
    if (isNewP) { setIsNewP(false); setSelP(null); setDraftP(null); }
    else setDraftP(selP ? structuredClone(selP) : null);
    setErr(null);
  };
  const deletePaket = async () => {
    if (!draftP?.id || busy || !confirm(`Hapus paket "${draftP.nama}"?`)) return;
    setBusy(true); setErr(null);
    try {
      await deletePaketLayanan(draftP.id);
      setSelP(null); setDraftP(null); setIsNewP(false);
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menghapus paket.");
    } finally { setBusy(false); }
  };

  const loaded = pakets !== null;

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
                  Kelola paket bundling layanan RS (komposisi item + harga paket). Kode paket
                  <span className="font-semibold text-teal-700"> otomatis</span> dari sistem.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <StatCard label="Total Paket" value={list.length} icon={Package}
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

            {err && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700 ring-1 ring-rose-100">
                <AlertCircle size={13} className="shrink-0" /> {err}
              </div>
            )}

            {/* Two-panel body — Paket only */}
            <div className="flex min-h-0 flex-1 gap-4">
              <div className="w-85 shrink-0">
                <PaketList items={list} selectedId={selP?.id ?? null}
                  onSelect={selectPaket} onAdd={addPaket} />
              </div>
              <div className="flex min-w-0 flex-1">
                {draftP ? (
                  <PaketDetail draft={draftP} isNew={isNewP} isDirty={isDirtyP} busy={busy}
                    onPatch={(p) => setDraftP((prev) => prev ? { ...prev, ...p } : prev)}
                    onSave={savePaket} onCancel={cancelPaket} onDelete={deletePaket} />
                ) : (
                  <EmptyState onAdd={addPaket} />
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
