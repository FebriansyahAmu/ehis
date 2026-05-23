"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, Trash2, ChevronUp, ChevronDown,
  CheckCircle2, XCircle, Pencil, UtensilsCrossed, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DietTeksturEntry, type DietJenis,
  DIET_JENIS_CFG, TEKSTUR_TONE_CFG,
  emptyDietTeksturEntry,
} from "@/lib/master/operasionalKlinisMock";
import { sortByUrutan } from "../operasionalShared";
import DietTeksturForm from "./DietTeksturForm";

interface Props {
  entries: DietTeksturEntry[];
  onChange: (entries: DietTeksturEntry[]) => void;
}

export default function DietTeksturPane({ entries, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Semua" | "Aktif" | "NonAktif">("Semua");
  const [filterJenis, setFilterJenis] = useState<"Semua" | DietJenis>("Semua");
  const [editId, setEditId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const sorted = useMemo(() => sortByUrutan(entries), [entries]);

  const filtered = sorted.filter((e) => {
    const q = query.toLowerCase();
    const matchQ = !q
      || e.kode.toLowerCase().includes(q)
      || e.label.toLowerCase().includes(q)
      || (e.batasanDefault ?? "").toLowerCase().includes(q)
      || (e.deskripsi ?? "").toLowerCase().includes(q);
    const matchS = filterStatus === "Semua" || e.status === filterStatus;
    const matchJ = filterJenis === "Semua" || e.jenis === filterJenis;
    return matchQ && matchS && matchJ;
  });

  const counts = {
    total: entries.length,
    aktif: entries.filter((e) => e.status === "Aktif").length,
    diet: entries.filter((e) => e.jenis === "Diet").length,
    tekstur: entries.filter((e) => e.jenis === "Tekstur").length,
  };
  const maxUrutan = entries.reduce((m, e) => Math.max(m, e.urutan), 0);

  const handleAdd = (entry: DietTeksturEntry) => {
    onChange([...entries, entry]);
    setShowAddForm(false);
  };
  const handleUpdate = (id: string, patch: Partial<DietTeksturEntry>) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };
  const handleDelete = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    if (!confirm(`Hapus entri "${entry.label}"? Aksi ini tidak dapat di-undo.`)) return;
    onChange(entries.filter((e) => e.id !== id));
  };
  const handleMove = (id: string, dir: "up" | "down") => {
    const ids = sorted.map((e) => e.id);
    const idx = ids.indexOf(id);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= ids.length) return;
    const aId = ids[idx], bId = ids[swap];
    const a = entries.find((e) => e.id === aId)!;
    const b = entries.find((e) => e.id === bId)!;
    onChange(entries.map((e) => {
      if (e.id === aId) return { ...e, urutan: b.urutan };
      if (e.id === bId) return { ...e, urutan: a.urutan };
      return e;
    }));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                <UtensilsCrossed size={13} />
              </span>
              <h2 className="truncate text-sm font-bold text-slate-800">Tipe Diet & Tekstur</h2>
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                {counts.aktif}/{counts.total}
              </span>
              <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1", DIET_JENIS_CFG.Diet.chip)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", DIET_JENIS_CFG.Diet.dot)} />
                {counts.diet} diet
              </span>
              <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1", DIET_JENIS_CFG.Tekstur.chip)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", DIET_JENIS_CFG.Tekstur.dot)} />
                {counts.tekstur} tekstur
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
              Pilihan tipe diet + tekstur makanan untuk order diet pasien — di-konsumsi oleh GiziNutrisiTab Rawat Inap.
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition focus-within:bg-white focus-within:ring-1 focus-within:ring-slate-300">
            <Search size={13} className="shrink-0 text-slate-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode / nama diet / batasan..."
              className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none" />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-slate-300 hover:text-slate-500" aria-label="Bersihkan">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex gap-1">
            {(["Semua", "Aktif", "NonAktif"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setFilterStatus(s)}
                className={cn(
                  "rounded px-2.5 py-1.5 text-[10.5px] font-medium transition",
                  filterStatus === s
                    ? "bg-slate-700 text-white"
                    : "border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700",
                )}>
                {s === "NonAktif" ? "Non-Aktif" : s}
              </button>
            ))}
          </div>

          <button type="button" onClick={() => { setShowAddForm(true); setEditId(null); }}
            className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-800">
            <Plus size={13} />
            Tambah Entri
          </button>
        </div>

        {/* Sub-filter Jenis */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Jenis:</span>
          <button
            type="button"
            onClick={() => setFilterJenis("Semua")}
            className={cn(
              "rounded-md border px-2 py-0.5 text-[10.5px] font-medium transition",
              filterJenis === "Semua"
                ? "border-slate-400 bg-slate-100 text-slate-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
            )}
          >
            Semua
          </button>
          {(["Diet", "Tekstur"] as DietJenis[]).map((j) => {
            const active = filterJenis === j;
            const cfg = DIET_JENIS_CFG[j];
            return (
              <button
                key={j}
                type="button"
                onClick={() => setFilterJenis(j)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-medium transition",
                  active
                    ? cn("border-transparent ring-1", cfg.chip)
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden border-b border-slate-200 bg-slate-50/60"
            >
              <div className="p-3">
                <DietTeksturForm
                  initial={emptyDietTeksturEntry(maxUrutan, filterJenis === "Tekstur" ? "Tekstur" : "Diet")}
                  existingKodes={entries.map((e) => e.kode)}
                  mode="create"
                  onSave={handleAdd}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-xs font-medium text-slate-400">Tidak ada entri</p>
            <p className="text-[11px] text-slate-300">Coba ubah filter atau tambah entri baru</p>
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 z-10 bg-slate-50 backdrop-blur">
              <tr className="border-b border-slate-200">
                <th className="w-8 px-2 py-2"></th>
                <th className="w-12 px-2 py-2 text-center text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">#</th>
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Kode</th>
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Label & Detail</th>
                <th className="w-20 px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Jenis</th>
                <th className="w-28 px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Kalori / Tone</th>
                <th className="w-20 px-2 py-2 text-center text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="w-24 px-2 py-2 text-right text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((entry, i) => (
                <Row
                  key={entry.id}
                  entry={entry}
                  index={i}
                  isEditing={editId === entry.id}
                  onEditStart={() => { setEditId(entry.id); setShowAddForm(false); }}
                  onEditEnd={() => setEditId(null)}
                  onUpdate={(patch) => handleUpdate(entry.id, patch)}
                  onDelete={() => handleDelete(entry.id)}
                  onMoveUp={() => handleMove(entry.id, "up")}
                  onMoveDown={() => handleMove(entry.id, "down")}
                  canMoveUp={i > 0}
                  canMoveDown={i < filtered.length - 1}
                  existingKodes={entries.filter((e) => e.id !== entry.id).map((e) => e.kode)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-4 py-2">
        <p className="text-[10px] text-slate-500">
          <strong className="text-slate-700">{filtered.length}</strong> dari{" "}
          <strong className="text-slate-700">{entries.length}</strong> entri · klik baris untuk edit inline
        </p>
      </footer>
    </div>
  );
}

interface RowProps {
  entry: DietTeksturEntry;
  index: number;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onUpdate: (patch: Partial<DietTeksturEntry>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  existingKodes: string[];
}

function Row({
  entry, index, isEditing,
  onEditStart, onEditEnd, onUpdate, onDelete, onMoveUp, onMoveDown,
  canMoveUp, canMoveDown, existingKodes,
}: RowProps) {
  if (isEditing) {
    return (
      <tr className="bg-slate-50/60">
        <td colSpan={8} className="p-3">
          <DietTeksturForm
            initial={entry}
            existingKodes={existingKodes}
            mode="edit"
            onSave={(updated) => { onUpdate(updated); onEditEnd(); }}
            onCancel={onEditEnd}
          />
        </td>
      </tr>
    );
  }

  const jenisCfg = DIET_JENIS_CFG[entry.jenis];
  const toneCfg = entry.tone ? TEKSTUR_TONE_CFG[entry.tone] : null;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay: index * 0.01 }}
      className="group hover:bg-slate-50/60"
    >
      <td className="px-1 py-1.5">
        <div className="flex flex-col items-center">
          <button type="button" onClick={onMoveUp} disabled={!canMoveUp}
            className="rounded p-0.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Naik"><ChevronUp size={11} /></button>
          <button type="button" onClick={onMoveDown} disabled={!canMoveDown}
            className="rounded p-0.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Turun"><ChevronDown size={11} /></button>
        </div>
      </td>

      <td className="px-2 py-2 text-center font-mono text-[10px] text-slate-400">{entry.urutan}</td>

      <td className="px-2 py-2">
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">{entry.kode}</code>
      </td>

      <td className="px-2 py-2">
        <p className="font-semibold text-slate-800">{entry.label}</p>
        {entry.jenis === "Diet" && entry.batasanDefault && (
          <p className="mt-0.5 line-clamp-1 text-[10.5px] leading-snug text-slate-500">{entry.batasanDefault}</p>
        )}
        {entry.jenis === "Tekstur" && entry.deskripsi && (
          <p className="mt-0.5 line-clamp-1 text-[10.5px] leading-snug text-slate-500">{entry.deskripsi}</p>
        )}
      </td>

      <td className="px-2 py-2">
        <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1", jenisCfg.chip)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", jenisCfg.dot)} />
          {jenisCfg.label}
        </span>
      </td>

      <td className="px-2 py-2">
        {entry.jenis === "Diet" && entry.kaloriDefault ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 ring-1 ring-orange-200">
            <Flame size={9} />
            {entry.kaloriDefault.toLocaleString("id-ID")} kcal
          </span>
        ) : entry.jenis === "Tekstur" && toneCfg ? (
          <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1", toneCfg.chip)}>
            {toneCfg.label}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>

      <td className="px-2 py-2 text-center">
        {entry.status === "Aktif" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-semibold text-emerald-700">
            <CheckCircle2 size={9} /> Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-500">
            <XCircle size={9} /> Non
          </span>
        )}
      </td>

      <td className="px-2 py-2">
        <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
          <button type="button" onClick={onEditStart} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Edit">
            <Pencil size={11} />
          </button>
          <button type="button" onClick={onDelete} className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" aria-label="Hapus">
            <Trash2 size={11} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}
