"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, Trash2, ChevronUp, ChevronDown,
  CheckCircle2, XCircle, Pencil, Droplets, ArrowDownCircle, ArrowUpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CairanEntry, type CairanTipe,
  CAIRAN_KATEGORI, CAIRAN_TONE_CFG, CAIRAN_TIPE_CFG,
  emptyCairanEntry,
} from "@/lib/master/operasionalKlinisMock";
import { sortByUrutan } from "../operasionalShared";
import SumberCairanForm from "./SumberCairanForm";

interface Props {
  entries: CairanEntry[];
  onChange: (entries: CairanEntry[]) => void;
}

export default function SumberCairanPane({ entries, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Semua" | "Aktif" | "NonAktif">("Semua");
  const [filterTipe, setFilterTipe] = useState<"Semua" | CairanTipe>("Semua");
  const [filterKategori, setFilterKategori] = useState<string>("Semua");
  const [editId, setEditId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const sorted = useMemo(() => sortByUrutan(entries), [entries]);

  const filtered = sorted.filter((e) => {
    const q = query.toLowerCase();
    const matchQ = !q
      || e.kode.toLowerCase().includes(q)
      || e.label.toLowerCase().includes(q)
      || (e.deskripsi ?? "").toLowerCase().includes(q);
    const matchS = filterStatus === "Semua" || e.status === filterStatus;
    const matchT = filterTipe === "Semua" || e.tipe === filterTipe;
    const matchK = filterKategori === "Semua" || e.kategori === filterKategori;
    return matchQ && matchS && matchT && matchK;
  });

  const counts = {
    total: entries.length,
    aktif: entries.filter((e) => e.status === "Aktif").length,
    intake: entries.filter((e) => e.tipe === "Intake").length,
    output: entries.filter((e) => e.tipe === "Output").length,
  };
  const maxUrutan = entries.reduce((m, e) => Math.max(m, e.urutan), 0);

  // Kategori chips available per active tipe filter
  const visibleKategori = filterTipe === "Semua"
    ? CAIRAN_KATEGORI
    : CAIRAN_KATEGORI.filter((k) => k.tipe === filterTipe);

  const handleAdd = (entry: CairanEntry) => {
    onChange([...entries, entry]);
    setShowAddForm(false);
  };
  const handleUpdate = (id: string, patch: Partial<CairanEntry>) => {
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
      {/* Header */}
      <header className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700">
                <Droplets size={13} />
              </span>
              <h2 className="truncate text-sm font-bold text-slate-800">Sumber Cairan & Output</h2>
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                {counts.aktif}/{counts.total}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                <ArrowDownCircle size={9} /> {counts.intake} intake
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-200">
                <ArrowUpCircle size={9} /> {counts.output} output
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
              Item sumber pencatatan I/O harian — di-konsumsi oleh IntakeOutputTab Rawat Inap.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition focus-within:bg-white focus-within:ring-1 focus-within:ring-slate-300">
            <Search size={13} className="shrink-0 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode / nama / deskripsi..."
              className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-slate-300 hover:text-slate-500" aria-label="Bersihkan">
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
                    ? "bg-slate-700 text-white"
                    : "border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700",
                )}
              >
                {s === "NonAktif" ? "Non-Aktif" : s}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { setShowAddForm(true); setEditId(null); }}
            className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={13} />
            Tambah Sumber
          </button>
        </div>

        {/* Sub-filter Tipe */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tipe:</span>
          {(["Semua", "Intake", "Output"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setFilterTipe(t); setFilterKategori("Semua"); }}
              className={cn(
                "rounded-md border px-2 py-0.5 text-[10.5px] font-medium transition",
                filterTipe === t
                  ? t === "Intake"
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    : t === "Output"
                      ? "border-rose-400 bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                      : "border-slate-400 bg-slate-50 text-slate-700 ring-1 ring-slate-100"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Sub-filter Kategori */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kategori:</span>
          <button
            type="button"
            onClick={() => setFilterKategori("Semua")}
            className={cn(
              "rounded-md border px-2 py-0.5 text-[10px] font-medium transition",
              filterKategori === "Semua"
                ? "border-slate-400 bg-slate-100 text-slate-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
            )}
          >
            Semua
          </button>
          {visibleKategori.map((k) => {
            const tone = CAIRAN_TONE_CFG[k.tone];
            const active = filterKategori === k.key;
            return (
              <button
                key={k.key}
                type="button"
                onClick={() => setFilterKategori(k.key)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition",
                  active
                    ? cn("border-transparent", tone.chip, "ring-1", tone.ring)
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                {k.label}
              </button>
            );
          })}
        </div>
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
              className="overflow-hidden border-b border-slate-200 bg-slate-50/60"
            >
              <div className="p-3">
                <SumberCairanForm
                  initial={emptyCairanEntry(maxUrutan, filterTipe === "Output" ? "Output" : "Intake")}
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
            <p className="text-xs font-medium text-slate-400">Tidak ada sumber</p>
            <p className="text-[11px] text-slate-300">Coba ubah filter atau tambah sumber baru</p>
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 z-10 bg-slate-50 backdrop-blur">
              <tr className="border-b border-slate-200">
                <th className="w-8 px-2 py-2"></th>
                <th className="w-12 px-2 py-2 text-center text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">#</th>
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Kode</th>
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Label & Deskripsi</th>
                <th className="w-24 px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Tipe</th>
                <th className="w-32 px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Kategori</th>
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
          <strong className="text-slate-700">{entries.length}</strong> sumber · klik baris untuk edit inline
        </p>
      </footer>
    </div>
  );
}

// ── Row ─────────────────────────────────────────────────

interface RowProps {
  entry: CairanEntry;
  index: number;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onUpdate: (patch: Partial<CairanEntry>) => void;
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
          <SumberCairanForm
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

  const kategoriCfg = CAIRAN_KATEGORI.find((k) => k.key === entry.kategori);
  const tone = kategoriCfg ? CAIRAN_TONE_CFG[kategoriCfg.tone] : CAIRAN_TONE_CFG.slate;
  const tipeCfg = CAIRAN_TIPE_CFG[entry.tipe];

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
            aria-label="Naik">
            <ChevronUp size={11} />
          </button>
          <button type="button" onClick={onMoveDown} disabled={!canMoveDown}
            className="rounded p-0.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Turun">
            <ChevronDown size={11} />
          </button>
        </div>
      </td>

      <td className="px-2 py-2 text-center font-mono text-[10px] text-slate-400">{entry.urutan}</td>

      <td className="px-2 py-2">
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">{entry.kode}</code>
      </td>

      <td className="px-2 py-2">
        <p className="font-semibold text-slate-800">{entry.label}</p>
        {entry.deskripsi && (
          <p className="mt-0.5 line-clamp-1 text-[10.5px] text-slate-500">{entry.deskripsi}</p>
        )}
      </td>

      <td className="px-2 py-2">
        <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1", tipeCfg.chip)}>
          {entry.tipe === "Intake" ? <ArrowDownCircle size={9} /> : <ArrowUpCircle size={9} />}
          {tipeCfg.label}
        </span>
      </td>

      <td className="px-2 py-2">
        <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1", tone.chip)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
          {kategoriCfg?.label ?? entry.kategori}
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
