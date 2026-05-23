"use client";

import { useState, useMemo } from "react";
import { Check, X, AlertCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type PenyakitIsolasiEntry, type IsolasiMode,
  ISOLASI_MODE_CFG,
} from "@/lib/master/operasionalKlinisMock";
import { isEntryValid, isDuplicateKode, suggestKode } from "../operasionalShared";

interface Props {
  initial: PenyakitIsolasiEntry;
  existingKodes: string[];
  mode: "create" | "edit";
  onSave: (entry: PenyakitIsolasiEntry) => void;
  onCancel: () => void;
}

const MODES: IsolasiMode[] = ["Contact", "Droplet", "Airborne"];

export default function PenyakitIsolasiForm({ initial, existingKodes, mode, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<PenyakitIsolasiEntry>(initial);

  const set = <K extends keyof PenyakitIsolasiEntry>(k: K, v: PenyakitIsolasiEntry[K]) => setDraft((p) => ({ ...p, [k]: v }));

  const dupKode = useMemo(() => draft.kode.trim().length > 0 && isDuplicateKode(draft.kode, existingKodes), [draft.kode, existingKodes]);
  const validDurasi = !draft.durasiHariMin || !draft.durasiHariMax || draft.durasiHariMin <= draft.durasiHariMax;
  const canSave = isEntryValid(draft) && draft.patogen.trim().length > 0 && !dupKode && validDurasi;

  const activeCfg = ISOLASI_MODE_CFG[draft.mode];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-bold ring-1",
            mode === "create" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-sky-50 text-sky-700 ring-sky-200",
          )}>
            {mode === "create" ? "Tambah Penyakit" : "Edit Penyakit"}
          </span>
          {dupKode && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-200">
              <AlertCircle size={10} /> Kode sudah dipakai
            </span>
          )}
          {!validDurasi && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-200">
              <AlertCircle size={10} /> Min &gt; Max
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

      {/* Mode picker — 3 button cards */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Mode Precaution</label>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          {MODES.map((m) => {
            const active = draft.mode === m;
            const cfg = ISOLASI_MODE_CFG[m];
            return (
              <button
                key={m}
                type="button"
                onClick={() => set("mode", m)}
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
                <span className="line-clamp-2 text-[9.5px] leading-tight text-slate-500">{cfg.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-3">
          <label htmlFor="pi-kode" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Kode</label>
          <input
            id="pi-kode"
            type="text"
            value={draft.kode}
            onChange={(e) => set("kode", e.target.value.toUpperCase())}
            placeholder="MRSA, TB-PARU, dst"
            className={cn(
              "mt-1 w-full rounded-md border bg-white px-2 py-1 font-mono text-[11px] outline-none transition focus:ring-1",
              dupKode
                ? "border-rose-300 text-rose-700 focus:border-rose-400 focus:ring-rose-200"
                : "border-slate-200 text-slate-800 focus:border-slate-400 focus:ring-slate-200",
            )}
          />
        </div>
        <div className="col-span-12 sm:col-span-9">
          <label htmlFor="pi-label" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Nama Penyakit / Kondisi</label>
          <input
            id="pi-label"
            type="text"
            value={draft.label}
            onChange={(e) => {
              const v = e.target.value;
              set("label", v);
              if (mode === "create" && !draft.kode) {
                set("kode", suggestKode(v).slice(0, 12));
              }
            }}
            placeholder="mis. MRSA, TB Paru Aktif, Varicella"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        <div className="col-span-12">
          <label htmlFor="pi-pat" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Patogen / Agen Penyebab</label>
          <input
            id="pi-pat"
            type="text"
            value={draft.patogen}
            onChange={(e) => set("patogen", e.target.value)}
            placeholder="mis. Methicillin-Resistant Staphylococcus aureus, Mycobacterium tuberculosis, Influenza A/B virus"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] italic text-slate-700 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        {/* Durasi range */}
        <div className="col-span-12 sm:col-span-3">
          <label htmlFor="pi-dmin" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <Calendar size={10} className={activeCfg.text} /> Durasi Min (hari)
          </label>
          <input
            id="pi-dmin"
            type="number"
            min={0}
            value={draft.durasiHariMin ?? ""}
            onChange={(e) => set("durasiHariMin", e.target.value ? parseInt(e.target.value, 10) : undefined)}
            placeholder="—"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-center font-mono text-[11px] text-slate-800 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>
        <div className="col-span-12 sm:col-span-3">
          <label htmlFor="pi-dmax" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <Calendar size={10} className={activeCfg.text} /> Durasi Max (hari)
          </label>
          <input
            id="pi-dmax"
            type="number"
            min={0}
            value={draft.durasiHariMax ?? ""}
            onChange={(e) => set("durasiHariMax", e.target.value ? parseInt(e.target.value, 10) : undefined)}
            placeholder="opsional"
            className={cn(
              "mt-1 w-full rounded-md border bg-white px-2 py-1 text-center font-mono text-[11px] text-slate-800 outline-none transition focus:ring-1",
              validDurasi
                ? "border-slate-200 focus:border-slate-400 focus:ring-slate-200"
                : "border-rose-300 focus:border-rose-400 focus:ring-rose-200",
            )}
          />
        </div>
        <div className="col-span-12 sm:col-span-6">
          <label htmlFor="pi-cat" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Catatan Lepas Isolasi</label>
          <input
            id="pi-cat"
            type="text"
            value={draft.catatan ?? ""}
            onChange={(e) => set("catatan", e.target.value)}
            placeholder="mis. Sampai 3× kultur negatif berturut"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        <div className="col-span-6 sm:col-span-2">
          <label htmlFor="pi-urut" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Urut</label>
          <input
            id="pi-urut"
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
