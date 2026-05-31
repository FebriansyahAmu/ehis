"use client";

// ANT3.2 — Tambah Pos Antrian: CRUD pos & loket. Source of truth = posStore.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, Check, X, DoorOpen, RotateCcw, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  usePosStore,
  addPos,
  renamePos,
  removePos,
  addLoket,
  removeLoket,
  resetPosConfig,
} from "@/lib/antrean/posStore";

export function PosLoketTab() {
  const posList = usePosStore();
  const [newPos, setNewPos] = useState("");

  const handleAddPos = () => {
    const nama = newPos.trim();
    if (!nama) return;
    addPos(nama);
    setNewPos("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tambah pos */}
      <section className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="m-tiny font-semibold uppercase tracking-wide text-slate-400">Nama Pos Antrian Baru</span>
          <input
            value={newPos}
            onChange={(e) => setNewPos(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddPos()}
            placeholder="mis. Pendaftaran Eksekutif"
            className={inputClass}
          />
        </label>
        <button
          type="button"
          onClick={handleAddPos}
          disabled={!newPos.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 m-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Plus className="h-4 w-4" /> Tambah Pos
        </button>
        <button
          type="button"
          onClick={resetPosConfig}
          title="Kembalikan ke konfigurasi awal"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 m-sm font-semibold text-slate-500 transition hover:bg-slate-100"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </section>

      {posList.length === 0 ? (
        <p className="rounded-2xl bg-white py-12 text-center m-sm text-slate-400 ring-1 ring-slate-200">
          Belum ada pos antrian. Tambah pos di atas.
        </p>
      ) : (
        posList.map((pos) => <PosCard key={pos.kode} kode={pos.kode} nama={pos.nama} loket={pos.loket} />)
      )}
    </div>
  );
}

function PosCard({
  kode,
  nama,
  loket,
}: {
  kode: string;
  nama: string;
  loket: { kode: string; nama: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nama);
  const [newLoket, setNewLoket] = useState("");

  const saveName = () => {
    if (draft.trim()) renamePos(kode, draft.trim());
    setEditing(false);
  };

  const handleAddLoket = () => {
    const n = newLoket.trim();
    if (!n) return;
    addLoket(kode, n);
    setNewLoket("");
  };

  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <MapPin className="h-5 w-5" />
          </span>
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                autoFocus
                className={cn(inputClass, "py-1.5")}
              />
              <IconBtn icon={Check} tone="emerald" title="Simpan" onClick={saveName} />
              <IconBtn icon={X} tone="slate" title="Batal" onClick={() => { setDraft(nama); setEditing(false); }} />
            </div>
          ) : (
            <div>
              <p className="flex items-center gap-2 m-sm font-bold text-slate-800">
                {nama}
                <button type="button" onClick={() => setEditing(true)} className="text-slate-300 transition hover:text-sky-600">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </p>
              <p className="m-tiny font-mono text-slate-400">{kode} · {loket.length} loket</p>
            </div>
          )}
        </div>
        <IconBtn icon={Trash2} tone="rose" title="Hapus pos" onClick={() => removePos(kode)} />
      </div>

      <div className="flex flex-col gap-2 p-4">
        <AnimatePresence initial={false}>
          {loket.map((l) => (
            <motion.div
              key={l.kode}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2"
            >
              <span className="flex items-center gap-2 m-sm text-slate-700">
                <DoorOpen className="h-4 w-4 text-slate-400" />
                {l.nama}
                <span className="m-mini font-mono text-slate-400">{l.kode}</span>
              </span>
              <IconBtn icon={Trash2} tone="rose" title="Hapus loket" onClick={() => removeLoket(kode, l.kode)} />
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <input
            value={newLoket}
            onChange={(e) => setNewLoket(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddLoket()}
            placeholder="Nama loket baru, mis. Loket 4"
            className={cn(inputClass, "flex-1 py-1.5")}
          />
          <button
            type="button"
            onClick={handleAddLoket}
            disabled={!newLoket.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 m-xs font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus className="h-3.5 w-3.5" /> Loket
          </button>
        </div>
      </div>
    </section>
  );
}

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 m-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

const ICON_TONE: Record<string, string> = {
  emerald: "text-emerald-600 hover:bg-emerald-50",
  rose: "text-rose-600 hover:bg-rose-50",
  slate: "text-slate-500 hover:bg-slate-100",
};

function IconBtn({
  icon: Icon,
  tone,
  title,
  onClick,
}: {
  icon: typeof Trash2;
  tone: keyof typeof ICON_TONE;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg transition", ICON_TONE[tone])}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
