"use client";

import { useState, useMemo, useEffect } from "react";
import { Check, X, AlertCircle, Flame, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DietTeksturEntry, type DietJenis, type TeksturTone,
  DIET_JENIS_CFG, TEKSTUR_TONE_CFG,
} from "@/lib/master/operasionalKlinisMock";
import { isEntryValid, isDuplicateKode, suggestKode } from "../operasionalShared";

interface Props {
  initial: DietTeksturEntry;
  existingKodes: string[];
  mode: "create" | "edit";
  onSave: (entry: DietTeksturEntry) => void;
  onCancel: () => void;
}

const TONES: TeksturTone[] = ["slate", "sky", "amber", "indigo"];

export default function DietTeksturForm({ initial, existingKodes, mode, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<DietTeksturEntry>(initial);

  useEffect(() => {
    // Reset conditional fields when jenis changes
    if (draft.jenis === "Diet") {
      setDraft((p) => ({
        ...p,
        tone: undefined,
        kaloriDefault: p.kaloriDefault ?? 1800,
        batasanDefault: p.batasanDefault ?? "",
      }));
    } else {
      setDraft((p) => ({
        ...p,
        kaloriDefault: undefined,
        batasanDefault: undefined,
        tone: p.tone ?? "slate",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.jenis]);

  const set = <K extends keyof DietTeksturEntry>(k: K, v: DietTeksturEntry[K]) => setDraft((p) => ({ ...p, [k]: v }));

  const dupKode = useMemo(() => draft.kode.trim().length > 0 && isDuplicateKode(draft.kode, existingKodes), [draft.kode, existingKodes]);
  const canSave = isEntryValid(draft) && !dupKode;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-bold ring-1",
            mode === "create" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200",
          )}>
            {mode === "create" ? "Tambah Entri" : "Edit Entri"}
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
        {/* Jenis */}
        <div className="col-span-12">
          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Jenis</label>
          <div className="mt-1 flex gap-1.5">
            {(["Diet", "Tekstur"] as DietJenis[]).map((j) => {
              const active = draft.jenis === j;
              const cfg = DIET_JENIS_CFG[j];
              return (
                <button key={j} type="button" onClick={() => set("jenis", j)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-semibold transition",
                    active
                      ? cn("border-transparent ring-1", cfg.chip)
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                  )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Kode + Label */}
        <div className="col-span-12 sm:col-span-3">
          <label htmlFor="dt-kode" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Kode</label>
          <input
            id="dt-kode"
            type="text"
            value={draft.kode}
            onChange={(e) => set("kode", e.target.value.toUpperCase())}
            placeholder="DM, TX-LNK, dst"
            className={cn(
              "mt-1 w-full rounded-md border bg-white px-2 py-1 font-mono text-[11px] outline-none transition focus:ring-1",
              dupKode
                ? "border-rose-300 text-rose-700 focus:border-rose-400 focus:ring-rose-200"
                : "border-slate-200 text-slate-800 focus:border-slate-400 focus:ring-slate-200",
            )}
          />
        </div>
        <div className="col-span-12 sm:col-span-9">
          <label htmlFor="dt-label" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Label</label>
          <input
            id="dt-label"
            type="text"
            value={draft.label}
            onChange={(e) => {
              const v = e.target.value;
              set("label", v);
              if (mode === "create" && !draft.kode) {
                const prefix = draft.jenis === "Diet" ? "" : "TX";
                set("kode", suggestKode(v, prefix).slice(0, 12));
              }
            }}
            placeholder={draft.jenis === "Diet" ? "mis. Diet Jantung Rendah Garam II" : "mis. Lunak, Saring, Cair"}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        {/* Conditional: Diet → kalori + batasan */}
        {draft.jenis === "Diet" && (
          <>
            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="dt-kal" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <Flame size={10} className="text-orange-500" /> Kalori Default
              </label>
              <div className="mt-1 flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-200">
                <input
                  id="dt-kal"
                  type="number"
                  min={0}
                  step={50}
                  value={draft.kaloriDefault ?? ""}
                  onChange={(e) => set("kaloriDefault", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  placeholder="1800"
                  className="w-full bg-transparent font-mono text-[11px] text-slate-800 outline-none"
                />
                <span className="shrink-0 text-[10px] text-slate-400">kcal/hari</span>
              </div>
            </div>
            <div className="col-span-12 sm:col-span-9">
              <label htmlFor="dt-bat" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Batasan Default</label>
              <input
                id="dt-bat"
                type="text"
                value={draft.batasanDefault ?? ""}
                onChange={(e) => set("batasanDefault", e.target.value)}
                placeholder="mis. Na < 2g/hari · cairan ≤ 1500 mL"
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
              />
            </div>
          </>
        )}

        {/* Conditional: Tekstur → tone + deskripsi */}
        {draft.jenis === "Tekstur" && (
          <>
            <div className="col-span-12">
              <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <Palette size={10} className="text-indigo-500" /> Tone (Chip Color)
              </label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {TONES.map((t) => {
                  const active = draft.tone === t;
                  const cfg = TEKSTUR_TONE_CFG[t];
                  return (
                    <button key={t} type="button" onClick={() => set("tone", t)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-medium transition",
                        active
                          ? cn("border-transparent ring-2", cfg.chip, cfg.ring)
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                      )}>
                      <span className={cn("inline-flex h-3 w-3 rounded-full ring-1", cfg.chip, cfg.ring)} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[9.5px] text-slate-400">Tone akan muncul sebagai chip warna saat tekstur dipilih di GiziNutrisiTab.</p>
            </div>
            <div className="col-span-12">
              <label htmlFor="dt-desk" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Deskripsi</label>
              <input
                id="dt-desk"
                type="text"
                value={draft.deskripsi ?? ""}
                onChange={(e) => set("deskripsi", e.target.value)}
                placeholder="mis. Makanan lunak — mudah dikunyah"
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
              />
            </div>
          </>
        )}

        {/* Urutan + Status */}
        <div className="col-span-6 sm:col-span-2">
          <label htmlFor="dt-urut" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Urut</label>
          <input
            id="dt-urut"
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
