"use client";

import { motion } from "framer-motion";
import {
  Trash2, ChevronUp, ChevronDown,
  CheckCircle2, XCircle, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type EdukasiEntry, type EdukasiCollection,
  KATEGORI_CFG, TONE_CFG, KONDISI_CFG,
} from "@/lib/master/edukasiMock";
import EdukasiEntryForm from "./EdukasiEntryForm";

interface Props {
  entry: EdukasiEntry;
  collection: EdukasiCollection;
  index: number;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onUpdate: (patch: Partial<EdukasiEntry>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  existingKodes: string[];
}

export default function EdukasiRow({
  entry, collection, index, isEditing,
  onEditStart, onEditEnd, onUpdate, onDelete,
  onMoveUp, onMoveDown, canMoveUp, canMoveDown,
  existingKodes,
}: Props) {
  if (isEditing) {
    return (
      <tr className="bg-amber-50/30">
        <td colSpan={collection.hasKategori || collection.hasTone || collection.hasKondisi ? 8 : 7} className="p-3">
          <EdukasiEntryForm
            collection={collection}
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
      {/* Move buttons */}
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
        <span className="font-semibold text-slate-800">{entry.label}</span>
      </td>

      {/* Conditional extra column */}
      {(collection.hasKategori || collection.hasTone || collection.hasKondisi) && (
        <td className="px-2 py-2">
          <ExtraCell entry={entry} collection={collection} />
        </td>
      )}

      <td className="px-2 py-2 text-[10.5px] text-slate-500">
        {entry.deskripsi ? (
          <span className="line-clamp-2">{entry.deskripsi}</span>
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
          <button
            type="button"
            onClick={onEditStart}
            className="rounded p-1 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
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

// ── Sub-cell ────────────────────────────────────────────

function ExtraCell({ entry, collection }: { entry: EdukasiEntry; collection: EdukasiCollection }) {
  if (collection.hasKategori && entry.kategori) {
    const cfg = KATEGORI_CFG[entry.kategori];
    return (
      <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase", cfg.chip)}>
        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
        {entry.kategori}
      </span>
    );
  }
  if (collection.hasTone && entry.tone) {
    const cfg = TONE_CFG[entry.tone];
    return (
      <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase", cfg.chip)}>
        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
        {cfg.label}
      </span>
    );
  }
  if (collection.hasKondisi && entry.kondisi) {
    const cfg = KONDISI_CFG[entry.kondisi];
    return (
      <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase", cfg.chip)}>
        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
        {entry.kondisi}
      </span>
    );
  }
  return <span className="text-slate-300">—</span>;
}
