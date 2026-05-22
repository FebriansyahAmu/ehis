"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ObatRecord,
  OBAT_MOCK, emptyObatRecord,
} from "@/lib/master/obatMock";
import ObatList from "./ObatList";
import ObatDetail from "./ObatDetail";
import ObatEmptyState from "./ObatEmptyState";
import { fmtIDR } from "./katalogObatShared";

// ── Skeleton ─────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-3 w-32" />
          <Bone className="h-5 w-56" />
          <Bone className="h-3 w-80" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-12 w-32" />
          <Bone className="h-12 w-32" />
          <Bone className="h-12 w-32" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-4">
        <Bone className="h-full w-[340px]" />
        <Bone className="h-full flex-1" />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────

export default function KatalogObatPage() {
  const [items, setItems] = useState<ObatRecord[]>(OBAT_MOCK);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ObatRecord | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(t);
  }, []);

  const selected = useMemo(
    () => items.find((o) => o.id === selectedId) ?? null,
    [items, selectedId],
  );

  const isDirty = useMemo(() => {
    if (!draft) return false;
    if (isNew) return true;
    if (!selected) return false;
    return JSON.stringify(selected) !== JSON.stringify(draft);
  }, [draft, selected, isNew]);

  const stats = useMemo(() => {
    const total = items.length;
    const form = items.filter((o) => o.isFormularium).length;
    const ham = items.filter((o) => o.isHAM).length;
    const narpsi = items.filter(
      (o) => o.golongan?.startsWith("Narkotika") || o.golongan?.startsWith("Psikotropika"),
    ).length;
    const avgHarga = total
      ? Math.round(items.reduce((sum, o) => sum + (o.hargaSatuan ?? 0), 0) / total)
      : 0;
    return { total, form, ham, narpsi, avgHarga };
  }, [items]);

  const handleSelect = (id: string) => {
    if (isDirty && !confirm("Ada perubahan belum tersimpan. Buang & pindah obat?")) return;
    const found = items.find((o) => o.id === id);
    if (!found) return;
    setSelectedId(id);
    setDraft(structuredClone(found));
    setIsNew(false);
  };

  const handleAddNew = () => {
    if (isDirty && !confirm("Ada perubahan belum tersimpan. Buang & buat obat baru?")) return;
    const fresh = emptyObatRecord();
    setSelectedId(null);
    setDraft(fresh);
    setIsNew(true);
  };

  const handlePatch = (patch: Partial<ObatRecord>) => {
    if (!draft) return;
    setDraft({ ...draft, ...patch });
  };

  const handleSave = () => {
    if (!draft) return;
    if (isNew) {
      setItems((prev) => [draft, ...prev]);
      setSelectedId(draft.id);
      setIsNew(false);
    } else {
      setItems((prev) => prev.map((o) => (o.id === draft.id ? draft : o)));
    }
  };

  const handleCancel = () => {
    if (isDirty && !confirm("Buang perubahan?")) return;
    if (isNew) {
      setDraft(null);
      setSelectedId(null);
      setIsNew(false);
    } else if (selected) {
      setDraft(structuredClone(selected));
    }
  };

  const handleDelete = () => {
    if (!selected) return;
    if (!confirm(`Hapus obat "${selected.namaGenerik}"? Aksi ini tidak dapat di-undo.`)) return;
    setItems((prev) => prev.filter((o) => o.id !== selected.id));
    setSelectedId(null);
    setDraft(null);
  };

  return (
    <div className="flex h-full flex-col">
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
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex shrink-0 items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="m-mini font-semibold uppercase tracking-widest text-violet-600">
                  EHIS Master · Katalog Klinis
                </p>
                <h1 className="mt-0.5 m-lg font-bold text-slate-900">Katalog Obat</h1>
                <p className="mt-0.5 m-xs text-slate-500">
                  Pusat data obat — identitas, klasifikasi (Formularium / HAM / LASA / Narkotika-Psikotropika),
                  informasi klinis, harga & coverage. Source-of-truth untuk farmasi, resep, dan billing.
                </p>
              </div>

              {/* Stats inline */}
              <div className="flex shrink-0 gap-2">
                <Stat icon={Pill}        label="Total"        value={`${stats.total}`}                  cls="bg-violet-50 text-violet-600" />
                <Stat icon={Sparkles}    label="Formularium"  value={`${stats.form}`}                   cls="bg-emerald-50 text-emerald-600" />
                <Stat icon={ShieldAlert} label="HAM / Nar-Psi" value={`${stats.ham} / ${stats.narpsi}`} cls="bg-rose-50 text-rose-600" />
                <Stat icon={Wallet}      label="Avg Harga"    value={fmtIDR(stats.avgHarga)}            cls="bg-amber-50 text-amber-600" />
              </div>
            </motion.div>

            {/* Body: List + Detail */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
              <ObatList
                items={items}
                selectedId={selectedId}
                onSelect={handleSelect}
                onAddNew={handleAddNew}
              />

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {draft ? (
                  <ObatDetail
                    draft={draft}
                    isNew={isNew}
                    isDirty={isDirty}
                    onPatch={handlePatch}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onDelete={!isNew ? handleDelete : undefined}
                  />
                ) : (
                  <ObatEmptyState totalObat={items.length} onAddNew={handleAddNew} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function Stat({
  icon: Icon, label, value, cls,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  cls: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
      <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", cls)}>
        <Icon size={12} />
      </span>
      <div>
        <p className="m-mini font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="m-base font-black leading-none text-slate-900">{value}</p>
      </div>
    </div>
  );
}
