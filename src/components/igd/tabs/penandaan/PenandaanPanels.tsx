"use client";

// Panel kanan Penandaan Gambar: form anotasi · item daftar · panel detail · toast simpan.

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Pencil, X, Save, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SEV,
  SEV_ORDER,
  MODEL_LABEL,
  type Anotasi,
  type Severitas,
} from "./penandaanShared";

// ── Form anotasi baru ─────────────────────────────────────

export interface AnotasiFormProps {
  /** prefill dari regio hasil raycast 3D (tetap bisa diedit) */
  initialLabel?: string;
  region: string;
  onSave: (data: Pick<Anotasi, "label" | "deskripsi" | "severitas">) => void;
  onCancel: () => void;
  labelPlaceholder?: string;
}

export function AnotasiForm({
  initialLabel,
  region,
  onSave,
  onCancel,
  labelPlaceholder,
}: AnotasiFormProps) {
  const [label, setLabel] = useState(initialLabel ?? "");
  const [deskripsi, setDeskripsi] = useState("");
  const [severitas, setSeveritas] = useState<Severitas>("Ringan");

  const canSave = label.trim().length > 0;

  const commit = () => {
    if (!canSave) return;
    onSave({ label: label.trim(), deskripsi: deskripsi.trim(), severitas });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-3 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
          <MapPin size={11} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-indigo-800">Anotasi Baru</p>
          <p className="text-[9px] text-indigo-500">Regio: {region}</p>
        </div>
        <button
          onClick={onCancel}
          aria-label="Batal"
          className="ml-auto flex h-5 w-5 items-center justify-center rounded text-indigo-300 hover:bg-indigo-100 hover:text-indigo-600"
        >
          <X size={11} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-3">
        <div>
          <label className="mb-1 block text-[10px] font-semibold text-slate-500">
            Label Lokasi <span className="text-rose-400">*</span>
          </label>
          <input
            autoFocus
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") onCancel();
            }}
            placeholder={
              labelPlaceholder ?? "mis. Dahi kanan, siku kiri, punggung bawah…"
            }
            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold text-slate-500">
            Severitas Temuan
          </label>
          <div className="flex flex-wrap gap-1">
            {SEV_ORDER.map((s) => {
              const c = SEV[s];
              const act = severitas === s;
              return (
                <button
                  key={s}
                  onClick={() => setSeveritas(s)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all duration-150",
                    act
                      ? cn("border-transparent ring-1", c.bg, c.text, c.ring)
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      act ? c.dot : "bg-slate-300",
                    )}
                  />
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold text-slate-500">
            Keterangan{" "}
            <span className="font-normal text-slate-400">(opsional)</span>
          </label>
          <textarea
            rows={2}
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Deskripsi klinis: ukuran, bentuk, warna, nyeri tekan, dll…"
            className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={commit}
            disabled={!canSave}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={11} /> Simpan Anotasi
          </button>
          <button
            onClick={onCancel}
            className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            Batal
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Item daftar anotasi ───────────────────────────────────

export function AnotasiItem({
  anotasi,
  displayIdx,
  selected,
  onSelect,
  onDelete,
}: {
  anotasi: Anotasi;
  displayIdx: number;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const c = SEV[anotasi.severitas];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.17 }}
      onClick={onSelect}
      className={cn(
        "group cursor-pointer rounded-xl border p-2.5 transition-all duration-150",
        selected
          ? "border-indigo-200 bg-indigo-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70",
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
            c.pinBg,
          )}
        >
          {displayIdx + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {anotasi.kind === "draw" ? (
              <Pencil size={11} className="shrink-0 text-slate-400" />
            ) : (
              <MapPin size={11} className="shrink-0 text-slate-400" />
            )}
            <p className="truncate text-xs font-semibold text-slate-800">
              {anotasi.label}
            </p>
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1",
                c.bg,
                c.text,
                c.ring,
              )}
            >
              {anotasi.severitas}
            </span>
          </div>
          {anotasi.deskripsi && (
            <p className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-slate-500">
              {anotasi.deskripsi}
            </p>
          )}
          <p className="mt-0.5 text-[9px] text-slate-400">
            {MODEL_LABEL[anotasi.mode]} · {anotasi.region} · {anotasi.createdAt}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Hapus anotasi"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Panel detail anotasi terpilih ─────────────────────────

export function DetailPanel({
  anotasi,
  displayIdx,
  onClose,
}: {
  anotasi: Anotasi;
  displayIdx: number;
  onClose: () => void;
}) {
  const c = SEV[anotasi.severitas];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.17 }}
      className={cn("overflow-hidden rounded-xl border shadow-sm", c.border, c.bg)}
    >
      <div className={cn("flex items-center gap-2 border-b px-3 py-2", c.border)}>
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white",
            c.pinBg,
          )}
        >
          {anotasi.kind === "draw" ? <Pencil size={11} /> : displayIdx + 1}
        </div>
        <p className={cn("text-xs font-bold", c.text)}>{anotasi.label}</p>
        <span
          className={cn(
            "ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1",
            c.bg,
            c.text,
            c.ring,
          )}
        >
          {anotasi.severitas}
        </span>
        <button
          onClick={onClose}
          aria-label="Tutup detail"
          className="ml-auto flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-slate-600"
        >
          <X size={10} />
        </button>
      </div>
      <div className="px-3 py-2.5">
        {anotasi.deskripsi ? (
          <p className="text-[11px] leading-relaxed text-slate-700">
            {anotasi.deskripsi}
          </p>
        ) : (
          <p className="text-[10px] italic text-slate-400">
            Tidak ada keterangan tambahan.
          </p>
        )}
        <p className="mt-2 text-[9px] text-slate-400">
          {MODEL_LABEL[anotasi.mode]} · {anotasi.region} · {anotasi.createdAt}
        </p>
      </div>
    </motion.div>
  );
}

// ── Toast simpan ──────────────────────────────────────────

export function SaveToast({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
    >
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 shadow-lg">
        <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
        <p className="text-xs font-semibold text-emerald-800">
          Penandaan gambar berhasil disimpan
        </p>
        <button
          onClick={onDismiss}
          className="ml-2 text-emerald-400 hover:text-emerald-600"
        >
          <X size={11} />
        </button>
      </div>
    </motion.div>
  );
}
