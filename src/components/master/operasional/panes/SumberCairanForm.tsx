"use client";

import { useState, useMemo, useEffect } from "react";
import { Check, X, AlertCircle, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CairanEntry, type CairanTipe,
  CAIRAN_KATEGORI, CAIRAN_TONE_CFG, CAIRAN_TIPE_CFG,
} from "@/lib/master/operasionalKlinisMock";
import { isEntryValid, isDuplicateKode, suggestKode } from "../operasionalShared";

interface Props {
  initial: CairanEntry;
  existingKodes: string[];
  mode: "create" | "edit";
  onSave: (entry: CairanEntry) => void;
  onCancel: () => void;
}

export default function SumberCairanForm({ initial, existingKodes, mode, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<CairanEntry>(initial);

  // Auto-reset kategori when tipe changes
  useEffect(() => {
    const valid = CAIRAN_KATEGORI.find((k) => k.key === draft.kategori && k.tipe === draft.tipe);
    if (!valid) {
      const fallback = CAIRAN_KATEGORI.find((k) => k.tipe === draft.tipe);
      if (fallback) setDraft((p) => ({ ...p, kategori: fallback.key }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.tipe]);

  const set = <K extends keyof CairanEntry>(k: K, v: CairanEntry[K]) => setDraft((p) => ({ ...p, [k]: v }));

  const dupKode = useMemo(() => draft.kode.trim().length > 0 && isDuplicateKode(draft.kode, existingKodes), [draft.kode, existingKodes]);
  const canSave = isEntryValid(draft) && !dupKode;

  const availableKategori = CAIRAN_KATEGORI.filter((k) => k.tipe === draft.tipe);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-bold ring-1",
            mode === "create" ? "bg-sky-50 text-sky-700 ring-sky-200" : "bg-amber-50 text-amber-700 ring-amber-200",
          )}>
            {mode === "create" ? "Tambah Sumber" : "Edit Sumber"}
          </span>
          {dupKode && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-200">
              <AlertCircle size={10} /> Kode sudah dipakai
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onCancel}
            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Batal">
            <X size={13} />
          </button>
          <button type="button" onClick={() => canSave && onSave(draft)} disabled={!canSave}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition",
              canSave ? "bg-slate-700 hover:bg-slate-800" : "cursor-not-allowed bg-slate-300",
            )}>
            <Check size={11} />
            Simpan
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-3">
        {/* Tipe segmented */}
        <div className="col-span-12">
          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Tipe Pencatatan</label>
          <div className="mt-1 flex gap-1.5">
            {(["Intake", "Output"] as CairanTipe[]).map((t) => {
              const active = draft.tipe === t;
              const cfg = CAIRAN_TIPE_CFG[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("tipe", t)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-semibold transition",
                    active
                      ? cn("border-transparent ring-1", cfg.chip)
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                  )}
                >
                  {t === "Intake" ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Kode + Label */}
        <div className="col-span-12 sm:col-span-4">
          <label htmlFor="cair-kode" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Kode</label>
          <input
            id="cair-kode"
            type="text"
            value={draft.kode}
            onChange={(e) => set("kode", e.target.value.toUpperCase())}
            placeholder="OUT-URN-FOL"
            className={cn(
              "mt-1 w-full rounded-md border bg-white px-2 py-1 font-mono text-[11px] outline-none transition focus:ring-1",
              dupKode
                ? "border-rose-300 text-rose-700 focus:border-rose-400 focus:ring-rose-200"
                : "border-slate-200 text-slate-800 focus:border-slate-400 focus:ring-slate-200",
            )}
          />
        </div>
        <div className="col-span-12 sm:col-span-8">
          <label htmlFor="cair-label" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Label</label>
          <input
            id="cair-label"
            type="text"
            value={draft.label}
            onChange={(e) => {
              const v = e.target.value;
              set("label", v);
              if (mode === "create" && !draft.kode) {
                const prefix = draft.tipe === "Intake" ? "INT" : "OUT";
                set("kode", suggestKode(v, prefix).slice(0, 20));
              }
            }}
            placeholder="mis. Kateter Foley, NaCl 0.9%, dst"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        {/* Kategori chips */}
        <div className="col-span-12">
          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Kategori ({draft.tipe})</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {availableKategori.map((k) => {
              const active = draft.kategori === k.key;
              const tone = CAIRAN_TONE_CFG[k.tone];
              return (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => set("kategori", k.key)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-medium transition",
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
        </div>

        {/* Deskripsi */}
        <div className="col-span-12 sm:col-span-9">
          <label htmlFor="cair-desk" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Deskripsi (Opsional)</label>
          <input
            id="cair-desk"
            type="text"
            value={draft.deskripsi ?? ""}
            onChange={(e) => set("deskripsi", e.target.value)}
            placeholder="mis. Saline isotonik, urine via kateter menetap, dst"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        {/* Urutan + Status */}
        <div className="col-span-6 sm:col-span-1">
          <label htmlFor="cair-urut" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Urut</label>
          <input
            id="cair-urut"
            type="number"
            min={1}
            value={draft.urutan}
            onChange={(e) => set("urutan", parseInt(e.target.value || "1", 10))}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-center font-mono text-[11px] text-slate-700 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>
        <div className="col-span-6 sm:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Status</label>
          <div className="mt-1 flex gap-1">
            {(["Aktif", "NonAktif"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("status", s)}
                className={cn(
                  "flex-1 rounded-md border px-1.5 py-1 text-[10.5px] font-semibold transition",
                  draft.status === s
                    ? s === "Aktif"
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                      : "border-slate-400 bg-slate-100 text-slate-700"
                    : "border-slate-200 bg-white text-slate-400 hover:border-slate-300",
                )}
              >
                {s === "NonAktif" ? "Non" : s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
