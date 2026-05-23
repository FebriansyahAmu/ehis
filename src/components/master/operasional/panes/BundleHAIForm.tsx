"use client";

import { useState, useMemo } from "react";
import { Check, X, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type BundleHAIEntry, type BundleTipe,
  BUNDLE_CFG_MASTER,
} from "@/lib/master/operasionalKlinisMock";
import { isEntryValid, isDuplicateKode, suggestKode } from "../operasionalShared";

interface Props {
  initial: BundleHAIEntry;
  existingKodes: string[];
  mode: "create" | "edit";
  onSave: (entry: BundleHAIEntry) => void;
  onCancel: () => void;
}

const BUNDLES: BundleTipe[] = ["VAP", "CAUTI", "CLABSI"];

export default function BundleHAIForm({ initial, existingKodes, mode, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<BundleHAIEntry>(initial);

  const set = <K extends keyof BundleHAIEntry>(k: K, v: BundleHAIEntry[K]) => setDraft((p) => ({ ...p, [k]: v }));

  const dupKode = useMemo(() => draft.kode.trim().length > 0 && isDuplicateKode(draft.kode, existingKodes), [draft.kode, existingKodes]);
  const canSave = isEntryValid(draft) && !dupKode && draft.detail.trim().length > 0;

  const activeCfg = BUNDLE_CFG_MASTER[draft.bundle];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-bold ring-1",
            mode === "create" ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-amber-50 text-amber-700 ring-amber-200",
          )}>
            {mode === "create" ? "Tambah Item Bundle" : "Edit Item Bundle"}
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

      {/* Bundle picker — 3 button cards */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Bundle</label>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          {BUNDLES.map((b) => {
            const active = draft.bundle === b;
            const cfg = BUNDLE_CFG_MASTER[b];
            return (
              <button
                key={b}
                type="button"
                onClick={() => set("bundle", b)}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-md border-l-4 px-2 py-1.5 text-left transition",
                  active
                    ? cn(cfg.softBg, cfg.border, "ring-1", cfg.border.replace("border", "ring"))
                    : "border-l-slate-200 bg-white hover:bg-slate-50",
                )}
              >
                <span className={cn("text-[11px] font-bold uppercase tracking-wide", active ? cfg.text : "text-slate-600")}>
                  {cfg.label}
                </span>
                <span className="line-clamp-1 text-[9.5px] text-slate-500">{cfg.fullName}</span>
              </button>
            );
          })}
        </div>
        <div className={cn("mt-1.5 flex items-start gap-1.5 rounded-md p-1.5 ring-1", activeCfg.softBg, activeCfg.border.replace("border", "ring"))}>
          <AlertTriangle size={11} className={cn("mt-0.5 shrink-0", activeCfg.text)} />
          <p className={cn("text-[10px] leading-snug", activeCfg.text)}>
            <strong>Trigger:</strong> {activeCfg.trigger}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-3">
          <label htmlFor="bh-kode" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Kode</label>
          <input
            id="bh-kode"
            type="text"
            value={draft.kode}
            onChange={(e) => set("kode", e.target.value.toUpperCase())}
            placeholder={`${draft.bundle.slice(0, 3)}-XXX`}
            className={cn(
              "mt-1 w-full rounded-md border bg-white px-2 py-1 font-mono text-[11px] outline-none transition focus:ring-1",
              dupKode
                ? "border-rose-300 text-rose-700 focus:border-rose-400 focus:ring-rose-200"
                : "border-slate-200 text-slate-800 focus:border-slate-400 focus:ring-slate-200",
            )}
          />
        </div>
        <div className="col-span-12 sm:col-span-9">
          <label htmlFor="bh-label" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Item Checklist</label>
          <input
            id="bh-label"
            type="text"
            value={draft.label}
            onChange={(e) => {
              const v = e.target.value;
              set("label", v);
              if (mode === "create" && !draft.kode) {
                const prefix = draft.bundle === "VAP" ? "VAP" : draft.bundle === "CAUTI" ? "CTI" : "CLB";
                set("kode", suggestKode(v, prefix).slice(0, 18));
              }
            }}
            placeholder="mis. Elevasi kepala 30–45°"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        <div className="col-span-12">
          <label htmlFor="bh-det" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Detail / Instruksi Operasional</label>
          <textarea
            id="bh-det"
            value={draft.detail}
            onChange={(e) => set("detail", e.target.value)}
            placeholder="mis. Head-of-Bed terpantau setiap shift · Scrub port ≥15 detik · dst"
            rows={2}
            className="mt-1 w-full resize-none rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
          <p className="mt-0.5 text-[9.5px] text-slate-400">Akan tampil di tooltip / sub-label saat perawat mencentang item bundle.</p>
        </div>

        <div className="col-span-6 sm:col-span-2">
          <label htmlFor="bh-urut" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Urut</label>
          <input
            id="bh-urut"
            type="number"
            min={1}
            value={draft.urutan}
            onChange={(e) => set("urutan", parseInt(e.target.value || "1", 10))}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-center font-mono text-[11px] text-slate-700 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Status</label>
          <div className="mt-1 flex gap-1">
            {(["Aktif", "NonAktif"] as const).map((s) => (
              <button key={s} type="button" onClick={() => set("status", s)}
                className={cn(
                  "flex-1 rounded-md border px-1.5 py-1 text-[10.5px] font-semibold transition",
                  draft.status === s
                    ? s === "Aktif"
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                      : "border-slate-400 bg-slate-100 text-slate-700"
                    : "border-slate-200 bg-white text-slate-400 hover:border-slate-300",
                )}>
                {s === "NonAktif" ? "Non" : s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
