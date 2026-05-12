"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, Plus, X, Save, RotateCcw,
  BookOpen, Stethoscope, Target, Activity, ClipboardList,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusLuaran } from "@/lib/data";
import {
  SDKI_CATALOG, STATUS_LUARAN_CONFIG,
  emptyForm, applyTemplate,
  type AsuhanFormState, type SdkiCatalogItem,
} from "@/components/shared/medical-records/keperawatanShared";

// ── Shared primitives ──────────────────────────────────────

type AccentKey = "indigo" | "emerald" | "sky" | "amber" | "rose";

const ACCENT: Record<AccentKey, { head: string; dot: string; text: string }> = {
  indigo:  { head: "bg-indigo-50 text-indigo-700 border-indigo-200",    dot: "bg-indigo-400",  text: "text-indigo-700"  },
  emerald: { head: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400", text: "text-emerald-700" },
  sky:     { head: "bg-sky-50 text-sky-700 border-sky-200",             dot: "bg-sky-400",     text: "text-sky-700"     },
  amber:   { head: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-400",   text: "text-amber-700"   },
  rose:    { head: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-400",    text: "text-rose-700"    },
};

function FL({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">{children}</p>;
}

function TA({
  value, onChange, placeholder, rows = 2,
}: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-50"
    />
  );
}

function TI({
  value, onChange, placeholder, className, type = "text",
}: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-50",
        className,
      )}
    />
  );
}

function DynList({
  items, onChange, onAdd, onRemove, placeholder, accent = "indigo",
}: {
  items: string[]; onChange: (i: number, v: string) => void;
  onAdd: () => void; onRemove: (i: number) => void;
  placeholder?: string; accent?: AccentKey;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((val, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", ACCENT[accent].dot)} />
          <input
            value={val}
            onChange={e => onChange(idx, e.target.value)}
            placeholder={placeholder ?? `Item ${idx + 1}...`}
            className="flex-1 border-b border-slate-200 bg-transparent py-1 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
          />
          {items.length > 1 && (
            <button type="button" onClick={() => onRemove(idx)} className="shrink-0 cursor-pointer text-slate-300 transition hover:text-rose-500">
              <X size={12} />
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={onAdd} className="mt-1 flex w-fit items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-indigo-600">
        <Plus size={12} /> Tambah
      </button>
    </div>
  );
}

function FSection({
  title, icon: Icon, accent = "indigo", defaultOpen = true, children,
}: { title: string; icon: React.ElementType; accent?: AccentKey; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 transition",
          open ? cn("rounded-t-xl border-b", ACCENT[accent].head) : "rounded-xl hover:bg-slate-50",
        )}
      >
        <div className="flex items-center gap-2">
          <Icon size={13} />
          <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }} className="flex">
          <ChevronDown size={13} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="p-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SDKI Catalog Panel ─────────────────────────────────────

const IV_SECTIONS: { key: keyof AsuhanFormState["intervensi"]; label: string; accent: AccentKey; tint: string }[] = [
  { key: "observasi",  label: "Observasi",  accent: "sky",     tint: "bg-sky-50/70 border-sky-100"         },
  { key: "terapeutik", label: "Terapeutik", accent: "emerald", tint: "bg-emerald-50/70 border-emerald-100" },
  { key: "edukasi",    label: "Edukasi",    accent: "amber",   tint: "bg-amber-50/70 border-amber-100"     },
  { key: "kolaborasi", label: "Kolaborasi", accent: "indigo",  tint: "bg-indigo-50/70 border-indigo-100"   },
];

function CatalogPanel({
  selectedKode, onSelect,
}: { selectedKode: string; onSelect: (item: SdkiCatalogItem) => void }) {
  const [search, setSearch]   = useState("");
  const [open,   setOpen]     = useState(true);

  const filtered = search.trim()
    ? SDKI_CATALOG.filter(
        i => i.nama.toLowerCase().includes(search.toLowerCase()) ||
             i.kode.toLowerCase().includes(search.toLowerCase())
      )
    : SDKI_CATALOG;

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="flex w-full cursor-pointer items-center justify-between rounded-t-xl px-3.5 py-2.5 transition hover:bg-indigo-50/70"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-700">Katalog SDKI Cepat</span>
          <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">
            {SDKI_CATALOG.length} diagnosa
          </span>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }} className="flex text-indigo-500">
          <ChevronDown size={13} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-indigo-100 p-3">
              {/* Search */}
              <div className="relative mb-2.5">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari diagnosa SDKI..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {filtered.map(item => {
                  const active = selectedKode === item.kode;
                  return (
                    <button
                      key={item.kode}
                      type="button"
                      onClick={() => onSelect(item)}
                      className={cn(
                        "flex cursor-pointer flex-col items-start gap-0.5 rounded-lg border p-2.5 text-left transition-all duration-150 active:scale-95",
                        active
                          ? "border-indigo-400 bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50",
                      )}
                    >
                      <span className={cn("text-[10px] font-bold", active ? "text-indigo-200" : "text-indigo-500")}>
                        {item.kode}
                      </span>
                      <span className="text-xs font-semibold leading-tight line-clamp-2">{item.nama}</span>
                    </button>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">Diagnosa tidak ditemukan</p>
              )}

              <p className="mt-2 text-center text-[10px] text-indigo-400">
                Pilih diagnosa untuk mengisi formulir secara otomatis · dapat diedit sebelum disimpan
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Form Component ────────────────────────────────────

export type FormMode = "new" | "edit" | "copy";

interface Props {
  initial?: AsuhanFormState;
  mode:     FormMode;
  onSave:   (data: AsuhanFormState) => void;
  onReset:  () => void;
}

export default function AsuhanForm({ initial, mode, onSave, onReset }: Props) {
  const [f, setF] = useState<AsuhanFormState>(() => initial ?? emptyForm());

  function set<K extends keyof AsuhanFormState>(k: K, v: AsuhanFormState[K]) {
    setF(p => ({ ...p, [k]: v }));
  }

  function handleCatalogSelect(item: SdkiCatalogItem) {
    const patch = applyTemplate(item);
    setF(p => ({ ...p, ...patch }));
  }

  const khChg = (i: number, v: string) => set("kriteriaHasil", f.kriteriaHasil.map((x, j) => j === i ? v : x));
  const khAdd = () => set("kriteriaHasil", [...f.kriteriaHasil, ""]);
  const khRem = (i: number) => set("kriteriaHasil", f.kriteriaHasil.filter((_, j) => j !== i));
  type IK = keyof AsuhanFormState["intervensi"];
  const ivChg = (k: IK, i: number, v: string) =>
    set("intervensi", { ...f.intervensi, [k]: f.intervensi[k].map((x, j) => j === i ? v : x) });
  const ivAdd = (k: IK) => set("intervensi", { ...f.intervensi, [k]: [...f.intervensi[k], ""] });
  const ivRem = (k: IK, i: number) =>
    set("intervensi", { ...f.intervensi, [k]: f.intervensi[k].filter((_, j) => j !== i) });

  const canSave = f.diagnosa.trim() && f.perawat.trim();

  const saveLabel =
    mode === "edit" ? "Simpan Perubahan" :
    mode === "copy" ? "Simpan Salinan"   :
                     "Simpan Asuhan";

  return (
    <div className="flex flex-col gap-2.5">

      {/* SDKI Catalog */}
      <CatalogPanel selectedKode={f.kodeSdki} onSelect={handleCatalogSelect} />

      {/* Data Pengkajian */}
      <FSection title="Data Pengkajian" icon={ClipboardList} accent="indigo">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-indigo-400" /> Data Mayor
            </p>
            <div className="space-y-2.5">
              <div><FL>Subjektif</FL><TA value={f.dataMayor.subjektif} onChange={v => set("dataMayor", { ...f.dataMayor, subjektif: v })} placeholder="Keluhan pasien/keluarga..." /></div>
              <div><FL>Objektif</FL><TA  value={f.dataMayor.objektif}  onChange={v => set("dataMayor", { ...f.dataMayor, objektif: v })}  placeholder="Hasil pemeriksaan..." /></div>
            </div>
          </div>
          <div>
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-slate-400" /> Data Minor
            </p>
            <div className="space-y-2.5">
              <div><FL>Subjektif</FL><TA value={f.dataMinor.subjektif} onChange={v => set("dataMinor", { ...f.dataMinor, subjektif: v })} placeholder="Keluhan tambahan..." /></div>
              <div><FL>Objektif</FL><TA  value={f.dataMinor.objektif}  onChange={v => set("dataMinor", { ...f.dataMinor, objektif: v })}  placeholder="Data pendukung..." /></div>
            </div>
          </div>
        </div>
        <div className="mt-3.5">
          <FL>Faktor Risiko</FL>
          <TA value={f.faktorResiko} onChange={v => set("faktorResiko", v)} placeholder="Faktor risiko yang berkontribusi (untuk diagnosa risiko)..." rows={2} />
        </div>
      </FSection>

      {/* Diagnosa Keperawatan */}
      <FSection title="Diagnosa Keperawatan (SDKI)" icon={Stethoscope} accent="rose">
        <div className="space-y-2.5">
          {f.kodeSdki && (
            <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-2.5 py-1.5">
              <span className="text-[11px] font-bold text-indigo-500">{f.kodeSdki}</span>
            </div>
          )}
          <div>
            <FL>Diagnosa <span className="normal-case text-rose-400">*wajib</span></FL>
            <TA value={f.diagnosa} onChange={v => set("diagnosa", v)}
              placeholder="Contoh: Nyeri Akut b.d agen pencedera fisik d.d pasien mengeluh nyeri skala 7..." rows={2} />
          </div>
          <div>
            <FL>Penyebab / Etiologi</FL>
            <TA value={f.penyebab} onChange={v => set("penyebab", v)} placeholder="Contoh: Agen pencedera fisik (trauma, prosedur invasif)..." rows={2} />
          </div>
        </div>
      </FSection>

      {/* Luaran SLKI */}
      <FSection title="Luaran Keperawatan (SLKI)" icon={Target} accent="emerald">
        <div className="space-y-3">
          <div>
            <FL>Target Waktu</FL>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 whitespace-nowrap">Setelah intervensi</span>
              <TI value={f.tujuanDurasi} onChange={v => set("tujuanDurasi", v)} placeholder="0" className="w-16 text-center" />
              <select
                value={f.tujuanUnit}
                onChange={e => set("tujuanUnit", e.target.value as "Jam" | "Hari")}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400"
              >
                <option value="Jam">Jam</option>
                <option value="Hari">Hari</option>
              </select>
              <span className="text-xs text-slate-500">selama</span>
              <TI value={f.selama} onChange={v => set("selama", v)} placeholder="pasien dirawat..." className="flex-1" />
            </div>
          </div>
          <div>
            <FL>Kriteria Hasil</FL>
            <DynList items={f.kriteriaHasil} onChange={khChg} onAdd={khAdd} onRemove={khRem}
              placeholder="Kriteria yang diharapkan..." accent="emerald" />
          </div>
          <div>
            <FL>Status Luaran Saat Ini</FL>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_LUARAN_CONFIG) as StatusLuaran[]).map(s => {
                const cfg = STATUS_LUARAN_CONFIG[s];
                const active = f.statusLuaran === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("statusLuaran", s)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition-all active:scale-95",
                      active ? cfg.cls + " shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                    )}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </FSection>

      {/* Intervensi SIKI */}
      <FSection title="Intervensi Keperawatan (SIKI)" icon={Activity} accent="sky" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-2.5">
          {IV_SECTIONS.map(({ key, label, accent, tint }) => (
            <div key={key} className={cn("rounded-lg border p-3", tint)}>
              <div className="mb-2 flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", ACCENT[accent].dot)} />
                <p className={cn("text-[11px] font-bold uppercase tracking-widest", ACCENT[accent].text)}>{label}</p>
              </div>
              <DynList
                items={f.intervensi[key]}
                onChange={(i, v) => ivChg(key, i, v)}
                onAdd={() => ivAdd(key)}
                onRemove={i => ivRem(key, i)}
                placeholder="Tindakan..."
                accent={accent}
              />
            </div>
          ))}
        </div>
      </FSection>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5">
        <div>
          <FL>Tanggal Input</FL>
          <input
            type="date"
            value={f.tanggalInput}
            onChange={e => set("tanggalInput", e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
          />
        </div>
        <div>
          <FL>Perawat <span className="normal-case text-rose-400">*wajib</span></FL>
          <TI value={f.perawat} onChange={v => set("perawat", v)} placeholder="Nama perawat pelaksana..." />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-0.5">
        <button
          type="button"
          onClick={onReset}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        >
          <RotateCcw size={13} /> Reset
        </button>
        <button
          type="button"
          onClick={() => canSave && onSave(f)}
          disabled={!canSave}
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
            mode === "copy" ? "bg-sky-600 hover:bg-sky-700" : "bg-indigo-600 hover:bg-indigo-700",
          )}
        >
          <Save size={14} />
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
