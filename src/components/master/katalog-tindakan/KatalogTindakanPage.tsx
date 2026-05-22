"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2, Scissors, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { TINDAKAN_MOCK, emptyTindakanRecord } from "@/lib/master/tindakanMock";
import type { TindakanRecord } from "@/lib/master/tindakanMock";
import TindakanList from "./TindakanList";
import TindakanDetail from "./TindakanDetail";
import TindakanEmptyState from "./TindakanEmptyState";

// ── Skeleton ─────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-3 w-36" />
          <Bone className="h-5 w-52" />
          <Bone className="h-3 w-72" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => <Bone key={i} className="h-12 w-28" />)}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-4">
        <Bone className="h-full w-[320px]" />
        <Bone className="h-full flex-1" />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────

export default function KatalogTindakanPage() {
  const [items, setItems] = useState<TindakanRecord[]>(TINDAKAN_MOCK);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TindakanRecord | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(t);
  }, []);

  const selected = useMemo(
    () => items.find((t) => t.id === selectedId) ?? null,
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
    const aktif = items.filter((t) => (t.status ?? "Aktif") === "Aktif").length;
    const bedah = items.filter((t) =>
      t.kategori === "Bedah_Minor" || t.kategori === "Bedah_Mayor" || t.kategori === "Bedah_Khusus",
    ).length;
    const canggih = items.filter((t) => t.kompleksitas === "Canggih" || t.kompleksitas === "Khusus").length;
    return { total, aktif, bedah, canggih };
  }, [items]);

  const guardDirty = (action: () => void, msg: string) => {
    if (isDirty && !confirm(msg)) return;
    action();
  };

  const handleSelect = (id: string) => {
    guardDirty(() => {
      const found = items.find((t) => t.id === id);
      if (!found) return;
      setSelectedId(id);
      setDraft(structuredClone(found));
      setIsNew(false);
    }, "Ada perubahan belum tersimpan. Buang & pindah tindakan?");
  };

  const handleAddNew = () => {
    guardDirty(() => {
      const fresh = emptyTindakanRecord();
      setSelectedId(null);
      setDraft(fresh);
      setIsNew(true);
    }, "Ada perubahan belum tersimpan. Buang & buat tindakan baru?");
  };

  const handlePatch = (patch: Partial<TindakanRecord>) => {
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
      setItems((prev) => prev.map((t) => (t.id === draft.id ? draft : t)));
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
    if (!selected || !confirm(`Hapus tindakan "${selected.nama}"? Aksi ini tidak dapat di-undo.`)) return;
    setItems((prev) => prev.filter((t) => t.id !== selected.id));
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
                <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-600">
                  EHIS Master · Katalog Klinis
                </p>
                <h1 className="mt-0.5 text-xl font-bold text-slate-900">Katalog Tindakan</h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pusat data tindakan medis — identitas ICD-9, kategori, kompleksitas, spesialis & unit default.
                  Source-of-truth untuk Kewenangan Klinis, Layanan Unit, dan Tarif Matrix.
                </p>
              </div>

              {/* Stats */}
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <StatCard icon={Zap}          label="Total"        value={`${stats.total}`}   cls="bg-teal-50 text-teal-600" />
                <StatCard icon={CheckCircle2} label="Aktif"        value={`${stats.aktif}`}   cls="bg-emerald-50 text-emerald-600" />
                <StatCard icon={Scissors}     label="Bedah"        value={`${stats.bedah}`}   cls="bg-orange-50 text-orange-600" />
                <StatCard icon={Star}         label="Khusus/Canggih" value={`${stats.canggih}`} cls="bg-amber-50 text-amber-600" />
              </div>
            </motion.div>

            {/* Body */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
              <TindakanList
                items={items}
                selectedId={selectedId}
                onSelect={handleSelect}
                onAddNew={handleAddNew}
              />

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {draft ? (
                  <TindakanDetail
                    draft={draft}
                    isNew={isNew}
                    isDirty={isDirty}
                    onPatch={handlePatch}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onDelete={!isNew ? handleDelete : undefined}
                  />
                ) : (
                  <TindakanEmptyState totalTindakan={items.length} onAddNew={handleAddNew} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────

function StatCard({
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
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-black leading-none text-slate-900">{value}</p>
      </div>
    </div>
  );
}
