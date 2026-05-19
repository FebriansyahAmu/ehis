"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BedSingle, Plus, Trash2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type BedSubRecord, type BedStatus,
  BED_STATUS_CFG, newId,
} from "../ruanganShared";
import { fieldCls } from "./OrganizationForm";

interface BedManagerPanelProps {
  beds: BedSubRecord[];
  kapasitas: number;
  onChange: (beds: BedSubRecord[]) => void;
}

const STATUS_OPTIONS: BedStatus[] = ["active", "inactive", "suspended"];

export default function BedManagerPanel({
  beds, kapasitas, onChange,
}: BedManagerPanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKode, setNewKode] = useState("");

  const overCapacity = beds.length >= kapasitas;
  const activeCount = beds.filter((b) => b.status === "active").length;

  const handleAdd = () => {
    if (!newName.trim() || !newKode.trim()) return;
    const next: BedSubRecord = {
      id: newId("bed"),
      name: newName.trim(),
      kode: newKode.trim().toUpperCase(),
      status: "active",
    };
    onChange([...beds, next]);
    setNewName("");
    setNewKode("");
    setAddOpen(false);
  };

  const handleUpdate = (id: string, patch: Partial<BedSubRecord>) => {
    onChange(beds.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const handleRemove = (id: string) => {
    const bed = beds.find((b) => b.id === id);
    if (!bed) return;
    if (!confirm(`Hapus bed "${bed.name}"?`)) return;
    onChange(beds.filter((b) => b.id !== id));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-50 text-amber-600">
            <BedSingle size={11} />
          </span>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
              Daftar Bed
            </h3>
            <p className="text-[9px] text-slate-400">
              {beds.length} / {kapasitas} bed · {activeCount} aktif
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          disabled={overCapacity && !addOpen}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition",
            overCapacity && !addOpen
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : addOpen
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "bg-teal-600 text-white shadow-sm hover:bg-teal-700 active:scale-[0.98]",
          )}
        >
          {addOpen ? <><X size={10} />Batal</> : <><Plus size={10} />Tambah Bed</>}
        </button>
      </div>

      {/* Capacity warning */}
      {overCapacity && (
        <div className="mb-2.5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
          <AlertTriangle size={11} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-[10px] text-amber-800">
            Sudah mencapai kapasitas. Naikkan kapasitas ruangan untuk menambah bed.
          </p>
        </div>
      )}

      {/* Add form */}
      <AnimatePresence initial={false}>
        {addOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="mb-3 overflow-hidden"
          >
            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-teal-300 bg-teal-50/40 p-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                  Nama Bed
                </p>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Bed 05"
                  className={fieldCls}
                  autoFocus
                />
              </div>
              <div className="flex-1">
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                  Kode Bed
                </p>
                <input
                  type="text"
                  value={newKode}
                  onChange={(e) => setNewKode(e.target.value.toUpperCase())}
                  placeholder="MEL-05"
                  className={cn(fieldCls, "font-mono uppercase")}
                />
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newName.trim() || !newKode.trim()}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition",
                  newName.trim() && newKode.trim()
                    ? "bg-teal-600 text-white shadow-sm hover:bg-teal-700 active:scale-[0.98]"
                    : "cursor-not-allowed bg-slate-200 text-slate-400",
                )}
              >
                <Plus size={11} />
                Tambah
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bed list */}
      {beds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center">
          <BedSingle size={18} className="mx-auto text-slate-300" />
          <p className="mt-1.5 text-[11px] font-semibold text-slate-600">Belum ada bed</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Tambahkan bed sesuai kapasitas ruangan
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {beds.map((bed) => (
              <BedRow
                key={bed.id}
                bed={bed}
                onChange={(patch) => handleUpdate(bed.id, patch)}
                onRemove={() => handleRemove(bed.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Bed Row ────────────────────────────────────────────────

interface BedRowProps {
  bed: BedSubRecord;
  onChange: (patch: Partial<BedSubRecord>) => void;
  onRemove: () => void;
}

function BedRow({ bed, onChange, onRemove }: BedRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-lg border border-slate-200 bg-white"
    >
      <div className="flex flex-col gap-2 p-2.5 sm:flex-row sm:items-center">
        {/* Name + Kode */}
        <div className="flex flex-1 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600">
            <BedSingle size={12} />
          </span>
          <div className="grid flex-1 grid-cols-2 gap-2">
            <input
              type="text"
              value={bed.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Nama"
              className={fieldCls}
            />
            <input
              type="text"
              value={bed.kode}
              onChange={(e) => onChange({ kode: e.target.value.toUpperCase() })}
              placeholder="Kode"
              className={cn(fieldCls, "font-mono uppercase")}
            />
          </div>
        </div>

        {/* Status segmented */}
        <div className="flex shrink-0 gap-1">
          {STATUS_OPTIONS.map((s) => {
            const cfg = BED_STATUS_CFG[s];
            const active = bed.status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ status: s })}
                title={cfg.label}
                aria-label={cfg.label}
                className={cn(
                  "rounded-md border px-2.5 py-1.5 text-[10px] font-semibold transition",
                  active
                    ? cn("border-transparent ring-2 ring-offset-1", cfg.bg, cfg.text, cfg.ring)
                    : "border-slate-200 bg-white text-slate-400 hover:border-slate-300",
                )}
              >
                {cfg.label.charAt(0)}
              </button>
            );
          })}
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={onRemove}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          aria-label="Hapus bed"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </motion.div>
  );
}
