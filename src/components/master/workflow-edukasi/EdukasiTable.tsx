"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type EdukasiEntry, type EdukasiCollection,
  emptyEdukasiEntry,
} from "@/lib/master/edukasiMock";
import { sortEntries } from "./edukasiShared";
import EdukasiEntryForm from "./EdukasiEntryForm";
import EdukasiRow from "./EdukasiRow";

interface Props {
  collection: EdukasiCollection;
  onChange: (entries: EdukasiEntry[]) => void;
}

export default function EdukasiTable({ collection, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Semua" | "Aktif" | "NonAktif">("Semua");
  const [filterKategori, setFilterKategori] = useState<string>("Semua");
  const [editId, setEditId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const sorted = useMemo(() => sortEntries(collection.entries), [collection.entries]);

  const filtered = sorted.filter((e) => {
    const q = query.toLowerCase();
    const matchQ = !q
      || e.kode.toLowerCase().includes(q)
      || e.label.toLowerCase().includes(q)
      || (e.deskripsi ?? "").toLowerCase().includes(q);
    const matchS = filterStatus === "Semua" || e.status === filterStatus;
    const matchK = filterKategori === "Semua"
      || (collection.hasKategori && e.kategori === filterKategori)
      || (collection.hasKondisi  && e.kondisi  === filterKategori)
      || (collection.hasTone     && e.tone     === filterKategori);
    return matchQ && matchS && matchK;
  });

  const aktifCount = collection.entries.filter((e) => e.status === "Aktif").length;
  const maxUrutan = collection.entries.reduce((m, e) => Math.max(m, e.urutan), 0);

  // ── Handlers ────────────────────────────────────────────

  const handleAdd = (entry: EdukasiEntry) => {
    onChange([...collection.entries, entry]);
    setShowAddForm(false);
  };

  const handleUpdate = (id: string, patch: Partial<EdukasiEntry>) => {
    onChange(collection.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const handleDelete = (id: string) => {
    const entry = collection.entries.find((e) => e.id === id);
    if (!entry) return;
    if (!confirm(`Hapus entri "${entry.label}"? Aksi ini tidak dapat di-undo.`)) return;
    onChange(collection.entries.filter((e) => e.id !== id));
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    const sortedIds = sorted.map((e) => e.id);
    const idx = sortedIds.indexOf(id);
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= sortedIds.length) return;
    const aId = sortedIds[idx], bId = sortedIds[swapWith];
    const a = collection.entries.find((e) => e.id === aId)!;
    const b = collection.entries.find((e) => e.id === bId)!;
    onChange(collection.entries.map((e) => {
      if (e.id === aId) return { ...e, urutan: b.urutan };
      if (e.id === bId) return { ...e, urutan: a.urutan };
      return e;
    }));
  };

  // ── Conditional column header label ──────────────────────

  const extraColHeader = collection.hasKategori ? "Kategori"
    : collection.hasTone ? "Tone"
    : collection.hasKondisi ? "Kondisi"
    : null;

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                <collection.icon size={13} />
              </span>
              <h2 className="truncate text-sm font-bold text-slate-800">{collection.label}</h2>
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                {aktifCount}/{collection.entries.length}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
              {collection.deskripsi}
            </p>
            {collection.konsumen.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {collection.konsumen.map((k) => (
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
          <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition focus-within:bg-white focus-within:ring-1 focus-within:ring-amber-200">
            <Search size={13} className="shrink-0 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Cari ${collection.shortLabel.toLowerCase()}...`}
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
                    ? "bg-amber-600 text-white"
                    : "border border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600",
                )}
              >
                {s === "NonAktif" ? "Non-Aktif" : s}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { setShowAddForm(true); setEditId(null); }}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-amber-700"
          >
            <Plus size={13} />
            Tambah Entri
          </button>
        </div>

        {/* Sub-filter (kategori/tone/kondisi) — show when collection has flag */}
        {extraColHeader && (
          <CategoryFilterStrip
            collection={collection}
            filter={filterKategori}
            onChange={setFilterKategori}
          />
        )}
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
              className="overflow-hidden border-b border-amber-100 bg-amber-50/40"
            >
              <div className="p-3">
                <EdukasiEntryForm
                  collection={collection}
                  initial={emptyEdukasiEntry(maxUrutan, defaultsForCollection(collection))}
                  onSave={handleAdd}
                  onCancel={() => setShowAddForm(false)}
                  existingKodes={collection.entries.map((e) => e.kode)}
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
                {extraColHeader && (
                  <th className="w-32 px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">{extraColHeader}</th>
                )}
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Deskripsi</th>
                <th className="w-20 px-2 py-2 text-center text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="w-24 px-2 py-2 text-right text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((entry, i) => (
                <EdukasiRow
                  key={entry.id}
                  entry={entry}
                  collection={collection}
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
                  existingKodes={collection.entries.filter((e) => e.id !== entry.id).map((e) => e.kode)}
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
          <strong className="text-slate-700">{collection.entries.length}</strong> entri ·{" "}
          <span className="text-amber-600">naik/turun urutan</span> · klik baris untuk edit inline
        </p>
      </footer>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────

function defaultsForCollection(c: EdukasiCollection): Partial<EdukasiEntry> {
  if (c.hasKategori) return { kategori: "Medis" };
  if (c.hasTone) return { tone: "emerald" };
  if (c.hasKondisi) return { kondisi: "Umum" };
  return {};
}

// ── Category filter strip ───────────────────────────────

import {
  KATEGORI_LIST, KATEGORI_CFG,
  TONE_LIST, TONE_CFG,
  KONDISI_LIST, KONDISI_CFG,
} from "@/lib/master/edukasiMock";

function CategoryFilterStrip({
  collection, filter, onChange,
}: {
  collection: EdukasiCollection;
  filter: string;
  onChange: (v: string) => void;
}) {
  const options: { value: string; label: string; dot?: string }[] = [
    { value: "Semua", label: "Semua" },
  ];

  if (collection.hasKategori) {
    KATEGORI_LIST.forEach((k) => options.push({ value: k, label: k, dot: KATEGORI_CFG[k].dot }));
  } else if (collection.hasTone) {
    TONE_LIST.forEach((t) => options.push({ value: t, label: TONE_CFG[t].label, dot: TONE_CFG[t].dot }));
  } else if (collection.hasKondisi) {
    KONDISI_LIST.forEach((k) => options.push({ value: k, label: k, dot: KONDISI_CFG[k].dot }));
  }

  return (
    <div className="mt-2.5 flex flex-wrap gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-medium transition",
            filter === opt.value
              ? "border-amber-400 bg-amber-50 text-amber-700 ring-1 ring-amber-100"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
          )}
        >
          {opt.dot && <span className={cn("h-1.5 w-1.5 rounded-full", opt.dot)} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
