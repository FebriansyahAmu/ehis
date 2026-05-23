"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Trash2, GripVertical, ChevronUp, ChevronDown,
  CheckCircle2, XCircle, Pencil, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type EnumEntry, type EnumGroup, type EnumTone,
  TONE_CFG, TONE_LIST, emptyEnumEntry, isEnumEntryValid,
} from "@/lib/master/statusEnumMock";
import { resolveIcon, sortEntries, suggestKode } from "./statusEnumShared";
import EnumEntryForm from "./EnumEntryForm";

interface Props {
  group: EnumGroup;
  onChange: (entries: EnumEntry[]) => void;
}

export default function EnumTable({ group, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Semua" | "Aktif" | "NonAktif">("Semua");
  const [editId, setEditId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const sorted = useMemo(() => sortEntries(group.entries), [group.entries]);

  const filtered = sorted.filter((e) => {
    const q = query.toLowerCase();
    const matchQ = !q
      || e.kode.toLowerCase().includes(q)
      || e.label.toLowerCase().includes(q)
      || (e.deskripsi ?? "").toLowerCase().includes(q);
    const matchS = filterStatus === "Semua" || e.status === filterStatus;
    return matchQ && matchS;
  });

  const aktifCount = group.entries.filter((e) => e.status === "Aktif").length;
  const maxUrutan = group.entries.reduce((m, e) => Math.max(m, e.urutan), 0);

  // ── Handlers ────────────────────────────────────────────

  const handleAdd = (entry: EnumEntry) => {
    onChange([...group.entries, entry]);
    setShowAddForm(false);
  };

  const handleUpdate = (id: string, patch: Partial<EnumEntry>) => {
    onChange(group.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const handleDelete = (id: string) => {
    const entry = group.entries.find((e) => e.id === id);
    if (!entry) return;
    if (!confirm(`Hapus entri "${entry.label}"? Aksi ini tidak dapat di-undo.`)) return;
    onChange(group.entries.filter((e) => e.id !== id));
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    const sortedIds = sorted.map((e) => e.id);
    const idx = sortedIds.indexOf(id);
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= sortedIds.length) return;
    const aId = sortedIds[idx], bId = sortedIds[swapWith];
    const a = group.entries.find((e) => e.id === aId)!;
    const b = group.entries.find((e) => e.id === bId)!;
    onChange(group.entries.map((e) => {
      if (e.id === aId) return { ...e, urutan: b.urutan };
      if (e.id === bId) return { ...e, urutan: a.urutan };
      return e;
    }));
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-700">
                <group.icon size={13} />
              </span>
              <h2 className="truncate text-sm font-bold text-slate-800">{group.label}</h2>
              <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                {aktifCount}/{group.entries.length}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
              {group.deskripsi}
            </p>
            {group.konsumen.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {group.konsumen.map((k) => (
                  <span key={k} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-medium text-slate-600">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition focus-within:bg-white focus-within:ring-1 focus-within:ring-violet-200">
            <Search size={13} className="shrink-0 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Cari ${group.label.toLowerCase()}...`}
              className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-slate-300 hover:text-slate-500">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex gap-1">
            {(["Semua", "Aktif", "NonAktif"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "rounded px-2.5 py-1.5 text-[10.5px] font-medium transition",
                  filterStatus === s
                    ? "bg-violet-600 text-white"
                    : "border border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600",
                )}
              >
                {s === "NonAktif" ? "Non-Aktif" : s}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { setShowAddForm(true); setEditId(null); }}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            <Plus size={13} />
            Tambah Entri
          </button>
        </div>
      </header>

      {/* Body — table */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden border-b border-violet-100 bg-violet-50/40"
            >
              <div className="p-3">
                <EnumEntryForm
                  initial={emptyEnumEntry(maxUrutan)}
                  onSave={handleAdd}
                  onCancel={() => setShowAddForm(false)}
                  existingKodes={group.entries.map((e) => e.kode)}
                  mode="create"
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
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Label</th>
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Deskripsi</th>
                <th className="w-24 px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Tone</th>
                <th className="w-20 px-2 py-2 text-center text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="w-24 px-2 py-2 text-right text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((entry, i) => (
                <EntryRow
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
                  existingKodes={group.entries.filter((e) => e.id !== entry.id).map((e) => e.kode)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <footer className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-4 py-2">
        <p className="text-[10px] text-slate-500">
          <strong className="text-slate-700">{filtered.length}</strong> dari{" "}
          <strong className="text-slate-700">{group.entries.length}</strong> entri ·{" "}
          <span className="text-violet-600">drag urutan</span> · klik baris untuk edit inline
        </p>
      </footer>
    </div>
  );
}

// ── Row component ────────────────────────────────────────

interface RowProps {
  entry: EnumEntry;
  index: number;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onUpdate: (patch: Partial<EnumEntry>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  existingKodes: string[];
}

function EntryRow({
  entry, index, isEditing,
  onEditStart, onEditEnd, onUpdate, onDelete,
  onMoveUp, onMoveDown, canMoveUp, canMoveDown,
  existingKodes,
}: RowProps) {
  const toneCfg = TONE_CFG[entry.tone];
  const Icon = resolveIcon(entry.icon);

  if (isEditing) {
    return (
      <tr className="bg-violet-50/30">
        <td colSpan={8} className="p-3">
          <EnumEntryForm
            initial={entry}
            onSave={(updated) => { onUpdate(updated); onEditEnd(); }}
            onCancel={onEditEnd}
            existingKodes={existingKodes}
            mode="edit"
          />
        </td>
      </tr>
    );
  }

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay: index * 0.01 }}
      className="group hover:bg-slate-50/60"
    >
      {/* Drag handle / move */}
      <td className="px-1 py-1.5">
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="rounded p-0.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Naik"
          >
            <ChevronUp size={11} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="rounded p-0.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Turun"
          >
            <ChevronDown size={11} />
          </button>
        </div>
      </td>

      <td className="px-2 py-2 text-center font-mono text-[10px] text-slate-400">{entry.urutan}</td>

      <td className="px-2 py-2">
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
          {entry.kode}
        </code>
      </td>

      <td className="px-2 py-2">
        <div className="flex items-center gap-1.5">
          {Icon && (
            <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded", toneCfg.chip)}>
              <Icon size={10} />
            </span>
          )}
          <span className="font-semibold text-slate-800">{entry.label}</span>
        </div>
      </td>

      <td className="px-2 py-2 text-[10.5px] text-slate-500">
        {entry.deskripsi ? (
          <span className="line-clamp-2">{entry.deskripsi}</span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>

      <td className="px-2 py-2">
        <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase", toneCfg.chip)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", toneCfg.dot)} />
          {TONE_CFG[entry.tone].label}
        </span>
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
          <button
            type="button"
            onClick={onEditStart}
            className="rounded p-1 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600"
            aria-label="Edit"
          >
            <Pencil size={11} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            aria-label="Hapus"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}
