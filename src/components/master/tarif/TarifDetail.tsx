"use client";

import { useState } from "react";
import { Save, Trash2, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TarifRecord } from "@/lib/master/tarifMock";
import {
  KATEGORI_CFG, KATEGORI_LIST, STATUS_CFG, STATUS_LIST,
  SATUAN_LIST, UNIT_OPTIONS,
  fmtIDR, fmtIDRShort, calcMarginPct, calcDiffPct, isTarifValid,
} from "./tarifShared";

type Tab = "identitas" | "harga";

const INPUT = cn(
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800",
  "outline-none placeholder:text-slate-400 transition",
  "hover:border-slate-300 focus:border-teal-400 focus:ring-1 focus:ring-teal-100",
);
const SELECT = cn(INPUT, "appearance-none cursor-pointer");
const LABEL  = "block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1";

interface Props {
  draft:    TarifRecord;
  isNew:    boolean;
  isDirty:  boolean;
  onPatch:  (p: Partial<TarifRecord>) => void;
  onSave:   () => void;
  onCancel: () => void;
  onDelete: () => void;
}

// ── Right-panel widgets ──────────────────────────────────────

function PreviewCard({ draft }: { draft: TarifRecord }) {
  const cfg    = KATEGORI_CFG[draft.kategori];
  const stsCfg = STATUS_CFG[draft.status];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Colored header band */}
      <div className={cn("flex flex-col items-center gap-2 px-4 pt-5 pb-4", cfg.bg)}>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm ring-1", cfg.ring)}>
          <cfg.icon size={22} className={cfg.text} />
        </div>
        <div className="text-center">
          <p className={cn("text-sm font-bold leading-snug", cfg.text)}>
            {draft.nama || "Nama Tarif"}
          </p>
          <div className="mt-1 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="font-mono text-[10px] text-slate-500">{draft.kode || "—"}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold ring-1", stsCfg.bg, stsCfg.text, "ring-current/20")}>
              {stsCfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* Price highlight */}
      {draft.tarifUmum > 0 && (
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Tarif Umum</p>
          <p className="mt-0.5 text-base font-black text-teal-700">{fmtIDR(draft.tarifUmum)}</p>
          <p className="text-[10px] text-slate-400">{draft.satuan}</p>
        </div>
      )}

      {/* Detail rows */}
      <div className="divide-y divide-slate-50 px-4 py-1">
        <div className="flex items-start justify-between gap-2 py-2.5">
          <span className="text-[10px] font-semibold uppercase text-slate-400 shrink-0">Kategori</span>
          <span className="text-[11px] font-semibold text-slate-700 text-right">{draft.kategori}</span>
        </div>
        {draft.kodeICD && (
          <div className="flex items-start justify-between gap-2 py-2.5">
            <span className="text-[10px] font-semibold uppercase text-slate-400 shrink-0">Kode ICD</span>
            <span className="font-mono text-[11px] font-semibold text-slate-700">{draft.kodeICD}</span>
          </div>
        )}
        {draft.deskripsi && (
          <div className="py-2.5">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Keterangan</span>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{draft.deskripsi}</p>
          </div>
        )}
        {draft.unitTerkait.length > 0 && (
          <div className="py-2.5">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Unit Terkait</span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {draft.unitTerkait.map((u) => (
                <span key={u} className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", cfg.bg, cfg.text)}>
                  {u}
                </span>
              ))}
            </div>
          </div>
        )}
        {!draft.nama && (
          <p className="py-3 text-center text-[11px] italic text-slate-400">Isi form untuk melihat preview</p>
        )}
      </div>
    </div>
  );
}

function PriceCompareCard({ draft }: { draft: TarifRecord }) {
  const margin = draft.hpp ? calcMarginPct(draft.tarifUmum, draft.hpp) : null;
  const entries: { label: string; value?: number; cls: string }[] = [
    { label: "Umum",     value: draft.tarifUmum,      cls: "bg-teal-500"   },
    { label: "BPJS",     value: draft.tarifBPJS,      cls: "bg-sky-400"    },
    { label: "Asuransi", value: draft.tarifAsuransi,  cls: "bg-violet-400" },
    { label: "HPP",      value: draft.hpp,            cls: "bg-amber-400"  },
  ];
  const maxVal = Math.max(...entries.map((e) => e.value ?? 0));

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Perbandingan Harga</p>

      <div className="space-y-2.5">
        {entries.map(({ label, value, cls }) => {
          const pct = maxVal > 0 && value ? Math.round((value / maxVal) * 100) : 0;
          const diffBpjs = label === "BPJS" && value && draft.tarifUmum
            ? calcDiffPct(draft.tarifUmum, value) : null;
          const diffAs = label === "Asuransi" && value && draft.tarifUmum
            ? calcDiffPct(draft.tarifUmum, value) : null;
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-500">{label}</span>
                <div className="flex items-center gap-1">
                  {(diffBpjs !== null) && (
                    <span className={cn("text-[9px] font-semibold", diffBpjs < 0 ? "text-rose-500" : "text-emerald-600")}>
                      {diffBpjs > 0 ? "+" : ""}{diffBpjs}%
                    </span>
                  )}
                  {(diffAs !== null) && (
                    <span className={cn("text-[9px] font-semibold", diffAs > 0 ? "text-emerald-600" : "text-rose-500")}>
                      {diffAs > 0 ? "+" : ""}{diffAs}%
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-slate-700">
                    {value ? fmtIDRShort(value) : "—"}
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200">
                <motion.div
                  className={cn("h-full rounded-full", cls)}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {margin !== null && draft.tarifUmum > 0 && (
        <div className={cn(
          "mt-1 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-bold",
          margin >= 30 ? "text-emerald-600" : margin >= 10 ? "text-amber-600" : "text-rose-600",
        )}>
          {margin >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          Margin {margin}%
          <span className="ml-auto text-[10px] font-normal text-slate-400">dari Tarif Umum</span>
        </div>
      )}

      {!draft.tarifUmum && (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Info size={11} /> Isi Tarif Umum untuk melihat perbandingan
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────

export default function TarifDetail({ draft, isNew, isDirty, onPatch, onSave, onCancel, onDelete }: Props) {
  const [tab, setTab] = useState<Tab>("identitas");
  const cfg    = KATEGORI_CFG[draft.kategori];
  const stsCfg = STATUS_CFG[draft.status];
  const valid  = isTarifValid(draft);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* Header strip */}
      <div className="shrink-0 border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", cfg.bg)}>
              <cfg.icon size={16} className={cfg.text} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {draft.nama || (isNew ? "Tarif Baru" : "—")}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-slate-400">{draft.kode || "—"}</span>
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", stsCfg.bg, stsCfg.text)}>
                  {stsCfg.label}
                </span>
              </div>
            </div>
          </div>
          {isDirty && (
            <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-600 ring-1 ring-amber-200">
              Belum tersimpan
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-1">
          {(["identitas", "harga"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition",
                tab === t ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
              )}
            >
              {t === "identitas" ? "Identitas" : "Harga"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — two-section layout */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            className="flex h-full gap-0">

            {/* ── Left: form ──────────────────────────────── */}
            <div className="flex-1 overflow-y-auto border-r border-slate-100 p-5 space-y-4">

              {tab === "identitas" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Kode<span className="ml-0.5 text-rose-500">*</span></label>
                      <input value={draft.kode} onChange={(e) => onPatch({ kode: e.target.value })}
                        placeholder="cth. TM-001" className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Satuan</label>
                      <select value={draft.satuan} onChange={(e) => onPatch({ satuan: e.target.value as TarifRecord["satuan"] })}
                        className={SELECT}>
                        {SATUAN_LIST.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Nama Tarif<span className="ml-0.5 text-rose-500">*</span></label>
                    <input value={draft.nama} onChange={(e) => onPatch({ nama: e.target.value })}
                      placeholder="Nama layanan / tindakan" className={INPUT} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Kategori</label>
                      <select value={draft.kategori} onChange={(e) => onPatch({ kategori: e.target.value as TarifRecord["kategori"] })}
                        className={SELECT}>
                        {KATEGORI_LIST.map((k) => <option key={k}>{k}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Status</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {STATUS_LIST.map((s) => (
                          <button key={s} onClick={() => onPatch({ status: s })}
                            className={cn(
                              "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition",
                              draft.status === s
                                ? cn(STATUS_CFG[s].bg, STATUS_CFG[s].text, "border-transparent")
                                : "border-slate-200 text-slate-500 hover:border-slate-300",
                            )}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Kode ICD (opsional)</label>
                    <input value={draft.kodeICD ?? ""} onChange={(e) => onPatch({ kodeICD: e.target.value || undefined })}
                      placeholder="cth. 89.52" className={cn(INPUT, "max-w-[160px]")} />
                  </div>

                  <div>
                    <label className={LABEL}>Deskripsi</label>
                    <textarea value={draft.deskripsi ?? ""} onChange={(e) => onPatch({ deskripsi: e.target.value || undefined })}
                      rows={2} placeholder="Keterangan singkat..."
                      className={cn(INPUT, "resize-none")} />
                  </div>

                  <div>
                    <label className={LABEL}>Unit Terkait</label>
                    <div className="flex flex-wrap gap-1.5">
                      {UNIT_OPTIONS.map((u) => {
                        const on = draft.unitTerkait.includes(u);
                        return (
                          <button key={u}
                            onClick={() => onPatch({ unitTerkait: on
                              ? draft.unitTerkait.filter((x) => x !== u)
                              : [...draft.unitTerkait, u] })}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
                              on ? "border-teal-400 bg-teal-50 text-teal-700"
                                 : "border-slate-200 text-slate-500 hover:border-teal-300",
                            )}>{u}</button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {tab === "harga" && (
                <>
                  <div>
                    <label className={LABEL}>Tarif Umum<span className="ml-0.5 text-rose-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">Rp</span>
                      <input type="number" min={0} value={draft.tarifUmum || ""}
                        onChange={(e) => onPatch({ tarifUmum: Number(e.target.value) })}
                        className={cn(INPUT, "pl-8")} />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>BPJS INA-CBG (Referensi)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">Rp</span>
                      <input type="number" min={0} value={draft.tarifBPJS ?? ""}
                        onChange={(e) => onPatch({ tarifBPJS: e.target.value ? Number(e.target.value) : undefined })}
                        className={cn(INPUT, "pl-8")} />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Tarif Asuransi</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">Rp</span>
                      <input type="number" min={0} value={draft.tarifAsuransi ?? ""}
                        onChange={(e) => onPatch({ tarifAsuransi: e.target.value ? Number(e.target.value) : undefined })}
                        className={cn(INPUT, "pl-8")} />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>HPP / Biaya Pokok</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">Rp</span>
                      <input type="number" min={0} value={draft.hpp ?? ""}
                        onChange={(e) => onPatch({ hpp: e.target.value ? Number(e.target.value) : undefined })}
                        className={cn(INPUT, "pl-8")} />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">Digunakan untuk menghitung margin keuntungan</p>
                  </div>
                </>
              )}
            </div>

            {/* ── Right: preview / comparison ─────────────── */}
            <div className="w-56 shrink-0 overflow-y-auto bg-slate-50/30 p-4">
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}>
                  {tab === "identitas" && <PreviewCard draft={draft} />}
                  {tab === "harga"     && <PriceCompareCard draft={draft} />}
                </motion.div>
              </AnimatePresence>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer actions */}
      <div className="shrink-0 flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
        {!isNew ? (
          <button onClick={onDelete}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition">
            <Trash2 size={12} /> Hapus
          </button>
        ) : <div />}
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={!isDirty}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition">
            Batal
          </button>
          <button onClick={onSave} disabled={!isDirty || !valid}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-40 transition">
            <Save size={12} /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
