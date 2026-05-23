"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, Trash2, ChevronUp, ChevronDown,
  CheckCircle2, XCircle, Pencil, ShieldAlert, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type PenyakitIsolasiEntry, type IsolasiMode,
  ISOLASI_MODE_CFG,
  emptyPenyakitIsolasiEntry,
} from "@/lib/master/operasionalKlinisMock";
import { sortByUrutan } from "../operasionalShared";
import PenyakitIsolasiForm from "./PenyakitIsolasiForm";

interface Props {
  entries: PenyakitIsolasiEntry[];
  onChange: (entries: PenyakitIsolasiEntry[]) => void;
}

const MODES: IsolasiMode[] = ["Contact", "Droplet", "Airborne"];

function fmtDurasi(min?: number, max?: number): string {
  if (!min && !max) return "—";
  if (min && max) return `${min}–${max} hari`;
  if (min) return `≥${min} hari`;
  if (max) return `≤${max} hari`;
  return "—";
}

export default function PenyakitIsolasiPane({ entries, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Semua" | "Aktif" | "NonAktif">("Semua");
  const [filterMode, setFilterMode] = useState<"Semua" | IsolasiMode>("Semua");
  const [editId, setEditId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const sorted = useMemo(() => sortByUrutan(entries), [entries]);

  const filtered = sorted.filter((e) => {
    const q = query.toLowerCase();
    const matchQ = !q
      || e.kode.toLowerCase().includes(q)
      || e.label.toLowerCase().includes(q)
      || e.patogen.toLowerCase().includes(q)
      || (e.catatan ?? "").toLowerCase().includes(q);
    const matchS = filterStatus === "Semua" || e.status === filterStatus;
    const matchM = filterMode === "Semua" || e.mode === filterMode;
    return matchQ && matchS && matchM;
  });

  const perMode = useMemo(() => {
    const m: Record<IsolasiMode, number> = { Contact: 0, Droplet: 0, Airborne: 0 };
    entries.forEach((e) => { m[e.mode] += 1; });
    return m;
  }, [entries]);

  const counts = {
    total: entries.length,
    aktif: entries.filter((e) => e.status === "Aktif").length,
  };
  const maxUrutan = entries.reduce((m, e) => Math.max(m, e.urutan), 0);

  const handleAdd = (entry: PenyakitIsolasiEntry) => {
    onChange([...entries, entry]);
    setShowAddForm(false);
  };
  const handleUpdate = (id: string, patch: Partial<PenyakitIsolasiEntry>) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };
  const handleDelete = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    if (!confirm(`Hapus penyakit "${entry.label}"? Aksi ini tidak dapat di-undo.`)) return;
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
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                <ShieldAlert size={13} />
              </span>
              <h2 className="truncate text-sm font-bold text-slate-800">Penyakit Wajib Isolasi</h2>
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                {counts.aktif}/{counts.total}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
              Daftar penyakit / patogen + mode precaution (CDC Isolation Guidelines 2007) — auto-flag isolasi di PatientHeader.
            </p>
          </div>
        </div>

        {/* Mode summary cards (interactive filter) */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {MODES.map((m) => {
            const cfg = ISOLASI_MODE_CFG[m];
            const active = filterMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setFilterMode(active ? "Semua" : m)}
                className={cn(
                  "group flex items-start gap-2 rounded-lg border-l-4 px-2.5 py-1.5 text-left transition",
                  active
                    ? cn(cfg.softBg, cfg.border, "ring-1", cfg.border.replace("border", "ring"))
                    : "border-l-slate-200 bg-white hover:bg-slate-50",
                )}
              >
                <span className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ring-1",
                  cfg.chip,
                )}>
                  {perMode[m]}
                </span>
                <div className="min-w-0">
                  <p className={cn("text-[11px] font-bold uppercase tracking-wide", cfg.text)}>{cfg.label}</p>
                  <p className="mt-0.5 line-clamp-2 text-[9.5px] leading-tight text-slate-500">{cfg.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition focus-within:bg-white focus-within:ring-1 focus-within:ring-slate-300">
            <Search size={13} className="shrink-0 text-slate-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari penyakit / patogen / catatan..."
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
            Tambah Penyakit
          </button>
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
                <PenyakitIsolasiForm
                  initial={emptyPenyakitIsolasiEntry(maxUrutan, filterMode === "Semua" ? "Contact" : filterMode)}
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
            <p className="text-xs font-medium text-slate-400">Tidak ada penyakit</p>
            <p className="text-[11px] text-slate-300">Coba ubah filter atau tambah penyakit baru</p>
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 z-10 bg-slate-50 backdrop-blur">
              <tr className="border-b border-slate-200">
                <th className="w-8 px-2 py-2"></th>
                <th className="w-12 px-2 py-2 text-center text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">#</th>
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Kode</th>
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Penyakit & Patogen</th>
                <th className="w-24 px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Mode</th>
                <th className="w-28 px-2 py-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">Durasi Isolasi</th>
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
          <strong className="text-slate-700">{entries.length}</strong> penyakit · referensi: <strong className="text-slate-700">CDC Isolation Precautions 2007</strong>
        </p>
      </footer>
    </div>
  );
}

interface RowProps {
  entry: PenyakitIsolasiEntry;
  index: number;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onUpdate: (patch: Partial<PenyakitIsolasiEntry>) => void;
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
          <PenyakitIsolasiForm
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

  const cfg = ISOLASI_MODE_CFG[entry.mode];

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
        <p className="mt-0.5 italic text-[10.5px] leading-snug text-slate-500">{entry.patogen}</p>
        {entry.catatan && (
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-400">↳ {entry.catatan}</p>
        )}
      </td>

      <td className="px-2 py-2">
        <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1", cfg.chip)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
          {cfg.label}
        </span>
      </td>

      <td className="px-2 py-2">
        <span className="inline-flex items-center gap-1 text-[10px] text-slate-600">
          <Calendar size={9} className="text-slate-400" />
          {fmtDurasi(entry.durasiHariMin, entry.durasiHariMax)}
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
