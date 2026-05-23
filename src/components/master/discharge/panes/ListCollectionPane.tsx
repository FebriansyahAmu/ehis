"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, Trash2, ChevronUp, ChevronDown,
  CheckCircle2, XCircle, Pencil, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DischargeListEntry, type DischargeSubKey,
  emptyListEntry, getSubByKey,
} from "@/lib/master/dischargeKlasifikasiMock";
import { sortListEntries } from "../dischargeShared";
import ListEntryForm from "./ListEntryForm";

interface Props {
  subKey: DischargeSubKey;
  entries: DischargeListEntry[];
  onChange: (entries: DischargeListEntry[]) => void;
  hasRequired?: boolean;
  hasSublabel?: boolean;
}

export default function ListCollectionPane({
  subKey, entries, onChange, hasRequired, hasSublabel,
}: Props) {
  const sub = getSubByKey(subKey);
  const Icon = sub.icon;

  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Semua" | "Aktif" | "NonAktif">("Semua");
  const [filterRequired, setFilterRequired] = useState<"Semua" | "Wajib" | "Opsional">("Semua");
  const [editId, setEditId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const sorted = useMemo(() => sortListEntries(entries), [entries]);

  const filtered = sorted.filter((e) => {
    const q = query.toLowerCase();
    const matchQ = !q
      || e.kode.toLowerCase().includes(q)
      || e.label.toLowerCase().includes(q)
      || (e.deskripsi ?? "").toLowerCase().includes(q)
      || (e.sublabel ?? "").toLowerCase().includes(q);
    const matchS = filterStatus === "Semua" || e.status === filterStatus;
    const matchR = !hasRequired || filterRequired === "Semua"
      || (filterRequired === "Wajib"    && e.required === true)
      || (filterRequired === "Opsional" && e.required !== true);
    return matchQ && matchS && matchR;
  });

  const aktifCount = entries.filter((e) => e.status === "Aktif").length;
  const wajibCount = hasRequired ? entries.filter((e) => e.required === true).length : 0;
  const maxUrutan = entries.reduce((m, e) => Math.max(m, e.urutan), 0);

  // ── Handlers ────────────────────────────────────────────

  const handleAdd = (entry: DischargeListEntry) => {
    onChange([...entries, entry]);
    setShowAddForm(false);
  };

  const handleUpdate = (id: string, patch: Partial<DischargeListEntry>) => {
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
    const swapWith = dir === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= ids.length) return;
    const aId = ids[idx], bId = ids[swapWith];
    const a = entries.find((e) => e.id === aId)!;
    const b = entries.find((e) => e.id === bId)!;
    onChange(entries.map((e) => {
      if (e.id === aId) return { ...e, urutan: b.urutan };
      if (e.id === bId) return { ...e, urutan: a.urutan };
      return e;
    }));
  };

  const toggleRequired = (id: string) => {
    handleUpdate(id, { required: !entries.find((e) => e.id === id)?.required });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                <Icon size={13} />
              </span>
              <h2 className="truncate text-sm font-bold text-slate-800">{sub.label}</h2>
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                {aktifCount}/{entries.length}
              </span>
              {hasRequired && (
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  {wajibCount} wajib
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
              {sub.deskripsi}
            </p>
            {sub.konsumen.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {sub.konsumen.map((k) => (
                  <span key={k} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-medium text-slate-600">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition focus-within:bg-white focus-within:ring-1 focus-within:ring-emerald-200">
            <Search size={13} className="shrink-0 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Cari ${sub.shortLabel.toLowerCase()}...`}
              className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-slate-300 hover:text-slate-500"
                aria-label="Bersihkan pencarian"
              >
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
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600",
                )}
              >
                {s === "NonAktif" ? "Non-Aktif" : s}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { setShowAddForm(true); setEditId(null); }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus size={13} />
            Tambah Entri
          </button>
        </div>

        {/* Sub-filter Required (Checklist only) */}
        {hasRequired && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Wajib:</span>
            {(["Semua", "Wajib", "Opsional"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterRequired(s)}
                className={cn(
                  "flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-medium transition",
                  filterRequired === s
                    ? "border-amber-400 bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                )}
              >
                {s === "Wajib" && <Star size={9} className="fill-current" />}
                {s}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden border-b border-emerald-100 bg-emerald-50/40"
            >
              <div className="p-3">
                <ListEntryForm
                  initial={emptyListEntry(maxUrutan, hasRequired ? { required: false } : {})}
                  onSave={handleAdd}
                  onCancel={() => setShowAddForm(false)}
                  existingKodes={entries.map((e) => e.kode)}
                  hasRequired={hasRequired}
                  hasSublabel={hasSublabel}
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
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">
                  {hasSublabel ? "Label & Sublabel" : "Label"}
                </th>
                {!hasSublabel && (
                  <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Deskripsi</th>
                )}
                {hasRequired && (
                  <th className="w-20 px-2 py-2 text-center text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Wajib</th>
                )}
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
                  hasRequired={hasRequired}
                  hasSublabel={hasSublabel}
                  onEditStart={() => { setEditId(entry.id); setShowAddForm(false); }}
                  onEditEnd={() => setEditId(null)}
                  onUpdate={(patch) => handleUpdate(entry.id, patch)}
                  onDelete={() => handleDelete(entry.id)}
                  onMoveUp={() => handleMove(entry.id, "up")}
                  onMoveDown={() => handleMove(entry.id, "down")}
                  onToggleRequired={() => toggleRequired(entry.id)}
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
          <strong className="text-slate-700">{entries.length}</strong> entri ·{" "}
          <span className="text-emerald-600">naik/turun urutan</span> · klik baris untuk edit inline
        </p>
      </footer>
    </div>
  );
}

// ── Row component ──────────────────────────────────────

interface RowProps {
  entry: DischargeListEntry;
  index: number;
  isEditing: boolean;
  hasRequired?: boolean;
  hasSublabel?: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onUpdate: (patch: Partial<DischargeListEntry>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleRequired: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  existingKodes: string[];
}

function Row({
  entry, index, isEditing, hasRequired, hasSublabel,
  onEditStart, onEditEnd, onUpdate, onDelete, onMoveUp, onMoveDown, onToggleRequired,
  canMoveUp, canMoveDown, existingKodes,
}: RowProps) {
  const cols = 5 + (hasRequired ? 1 : 0) + (hasSublabel ? 0 : 1);

  if (isEditing) {
    return (
      <tr className="bg-emerald-50/30">
        <td colSpan={cols + 2} className="p-3">
          <ListEntryForm
            initial={entry}
            onSave={(updated) => { onUpdate(updated); onEditEnd(); }}
            onCancel={onEditEnd}
            existingKodes={existingKodes}
            hasRequired={hasRequired}
            hasSublabel={hasSublabel}
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
        <p className="font-semibold text-slate-800">{entry.label}</p>
        {hasSublabel && entry.sublabel && (
          <p className="mt-0.5 text-[10.5px] leading-snug text-slate-500">{entry.sublabel}</p>
        )}
      </td>

      {!hasSublabel && (
        <td className="px-2 py-2 text-[10.5px] text-slate-500">
          {entry.deskripsi ? (
            <span className="line-clamp-2">{entry.deskripsi}</span>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
      )}

      {hasRequired && (
        <td className="px-2 py-2 text-center">
          <button
            type="button"
            onClick={onToggleRequired}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold transition",
              entry.required
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200",
            )}
            aria-label={entry.required ? "Set opsional" : "Set wajib"}
          >
            <Star size={9} className={entry.required ? "fill-current" : ""} />
            {entry.required ? "Wajib" : "Opsi"}
          </button>
        </td>
      )}

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
            className="rounded p-1 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
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
