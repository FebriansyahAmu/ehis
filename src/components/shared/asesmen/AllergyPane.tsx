"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, HelpCircle, ShieldCheck,
  Trash2, Plus, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type AllergyEntry, type AllergyCategory, type AllergySeverity, type AllergyStatus,
  CAT_CFG, SEV_CFG, QUICK_PICKS, REACTIONS, SNOMED_CODES, ALLERGY_MOCK,
} from "./asesmenShared";

// ── Allergy card ──────────────────────────────────────────

export function AllergyCard({ entry, onDelete }: { entry: AllergyEntry; onDelete: (id: string) => void }) {
  const cat     = CAT_CFG[entry.category];
  const sev     = SEV_CFG[entry.severity];
  const CatIcon = cat.icon;

  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-sm", sev.borderL)}>
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
          <CatIcon size={14} className={cat.iconCls} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-bold text-slate-800">{entry.allergen}</p>
            <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", sev.badgeCls)}>{entry.severity}</span>
            <span className={cn(
              "flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
              entry.status === "Terkonfirmasi"
                ? "bg-indigo-50 text-indigo-600 ring-indigo-200"
                : "bg-slate-100 text-slate-500 ring-slate-200",
            )}>
              {entry.status === "Terkonfirmasi" ? <CheckCircle2 size={9} /> : <HelpCircle size={9} />}
              {entry.status}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{entry.category}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {entry.reactions.map(r => (
              <span key={r} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{r}</span>
            ))}
          </div>
          {entry.snomedCode && (
            <p className="mt-1.5 flex items-center gap-1">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-400">SNOMED</span>
              <span className="font-mono text-[10px] text-slate-500">{entry.snomedCode}</span>
              <span className="text-[10px] text-slate-400">
                — {SNOMED_CODES.find(s => s.code === entry.snomedCode)?.display ?? ""}
              </span>
            </p>
          )}
          {entry.keterangan && (
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500 italic">{entry.keterangan}</p>
          )}
        </div>
        <button type="button" onClick={() => onDelete(entry.id)}
          className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
          aria-label={`Hapus alergi ${entry.allergen}`}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Input helpers ─────────────────────────────────────────

const INPUT_CLS = "h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}{required && <span className="ml-0.5 text-rose-400">*</span>}
    </p>
  );
}

// ── Props ─────────────────────────────────────────────────

interface AllergyPaneProps {
  noRM: string;
  onComplete?: (done: boolean) => void;
}

// ── Main pane ─────────────────────────────────────────────

export default function AllergyPane({ noRM, onComplete }: AllergyPaneProps) {
  const [entries, setEntries] = useState<AllergyEntry[]>(
    () => structuredClone(ALLERGY_MOCK[noRM] ?? []),
  );
  const [noKA, setNoKA] = useState(false);
  const [form, setForm] = useState<{
    category: AllergyCategory;
    allergen: string;
    reactions: string[];
    severity: AllergySeverity;
    status: AllergyStatus;
    keterangan: string;
    snomedCode: string;
  }>({ category: "Obat", allergen: "", reactions: [], severity: "Sedang", status: "Terkonfirmasi", keterangan: "", snomedCode: "" });

  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const toggleReaction = (r: string) =>
    setF("reactions", form.reactions.includes(r) ? form.reactions.filter(x => x !== r) : [...form.reactions, r]);

  const canAdd = form.allergen.trim() !== "" && form.reactions.length > 0;

  function handleAdd() {
    if (!canAdd) return;
    const updated = [
      { id: `alg-${Date.now()}`, category: form.category, allergen: form.allergen.trim(), reactions: form.reactions, severity: form.severity, status: form.status, keterangan: form.keterangan.trim(), snomedCode: form.snomedCode || undefined },
      ...entries,
    ];
    setEntries(updated);
    setNoKA(false);
    setForm({ ...form, allergen: "", reactions: [], keterangan: "", snomedCode: "" });
    onComplete?.(true);
  }

  const handleDelete = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    if (updated.length === 0 && !noKA) onComplete?.(false);
  };

  const handleNKA = (val: boolean) => {
    setNoKA(val);
    onComplete?.(val || entries.length > 0);
  };

  const severeEntries = entries.filter(e => e.severity === "Berat");

  return (
    <div className="flex flex-col gap-4">

      {/* Severe allergy banner */}
      <AnimatePresence>
        {severeEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100">
              <AlertTriangle size={14} className="text-rose-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Peringatan Alergi — Risiko Tinggi</p>
              <p className="mt-0.5 text-[11px] text-rose-600">
                {severeEntries.map(e => (
                  <span key={e.id} className="mr-2 font-semibold">{e.allergen} ({e.reactions.join(", ")})</span>
                ))}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 md:flex-row md:items-start">

        {/* Left: Add form */}
        <div className={cn("flex flex-col gap-3 md:w-64 md:shrink-0 transition-opacity", noKA && "pointer-events-none opacity-40")}>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-2.5">
              <span className="text-xs font-semibold text-slate-700">Tambah Alergi Baru</span>
            </div>
            <div className="flex flex-col gap-3 p-4">

              {/* Category */}
              <div>
                <Label required>Kategori</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["Obat", "Makanan", "Lainnya"] as AllergyCategory[]).map(cat => {
                    const cfg = CAT_CFG[cat]; const Icon = cfg.icon; const active = form.category === cat;
                    return (
                      <button key={cat} type="button" onClick={() => setF("category", cat)}
                        className={cn("flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-semibold transition",
                          active ? cfg.activeCls : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                        <Icon size={14} className={active ? undefined : "text-slate-400"} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allergen name */}
              <div>
                <Label required>Nama Alergen</Label>
                <input type="text" value={form.allergen}
                  onChange={e => setF("allergen", e.target.value)}
                  placeholder="Ketik nama alergen..."
                  className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {QUICK_PICKS[form.category].map(pick => (
                    <button key={pick} type="button" onClick={() => setF("allergen", pick)}
                      className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium transition",
                        form.allergen === pick ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600")}>
                      {pick}
                    </button>
                  ))}
                </div>
              </div>

              {/* SNOMED CT */}
              <div>
                <Label>Kode SNOMED CT</Label>
                <select value={form.snomedCode} onChange={e => setF("snomedCode", e.target.value)}
                  className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100">
                  <option value="">— Pilih kode SNOMED CT —</option>
                  {SNOMED_CODES.map(s => <option key={s.code} value={s.code}>[{s.code}] {s.display}</option>)}
                </select>
              </div>

              {/* Reactions */}
              <div>
                <Label required>Jenis Reaksi</Label>
                <div className="flex flex-wrap gap-1">
                  {REACTIONS.map(r => {
                    const sel = form.reactions.includes(r);
                    return (
                      <button key={r} type="button" onClick={() => toggleReaction(r)}
                        className={cn("rounded-md px-2 py-1 text-[10px] font-semibold transition",
                          sel ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200" : "bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600")}>
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity */}
              <div>
                <Label required>Tingkat Keparahan</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["Ringan", "Sedang", "Berat"] as AllergySeverity[]).map(sev => {
                    const cfg = SEV_CFG[sev]; const active = form.severity === sev;
                    return (
                      <button key={sev} type="button" onClick={() => setF("severity", sev)}
                        className={cn("rounded-lg border py-1.5 text-[11px] font-semibold transition",
                          active ? cfg.activeCls : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                        {sev}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div>
                <Label>Status Konfirmasi</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["Terkonfirmasi", "Dicurigai"] as AllergyStatus[]).map(s => {
                    const Icon = s === "Terkonfirmasi" ? CheckCircle2 : HelpCircle; const active = form.status === s;
                    return (
                      <button key={s} type="button" onClick={() => setF("status", s)}
                        className={cn("flex items-center justify-center gap-1 rounded-lg border py-1.5 text-[11px] font-semibold transition",
                          active ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                        <Icon size={11} />{s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Keterangan</Label>
                <textarea rows={2} value={form.keterangan}
                  onChange={e => setF("keterangan", e.target.value)}
                  placeholder="Catatan tambahan, kondisi khusus..."
                  className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
              </div>

              <button type="button" onClick={handleAdd} disabled={!canAdd}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40">
                <Plus size={13} /> Tambah Alergi
              </button>
            </div>
          </div>
        </div>

        {/* Right: Allergy list */}
        <div className="flex flex-1 flex-col gap-3 md:min-w-0">

          {/* NKA toggle */}
          <button type="button" onClick={() => handleNKA(!noKA)}
            className={cn("flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
              noKA ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50")}>
            <div className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", noKA ? "bg-emerald-500" : "bg-slate-200")}>
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200", noKA ? "translate-x-4" : "translate-x-0.5")} />
            </div>
            <div className="flex-1">
              <p className={cn("text-xs font-semibold", noKA ? "text-emerald-800" : "text-slate-600")}>
                Tidak Ada Riwayat Alergi yang Diketahui (NKA)
              </p>
              <p className={cn("text-[10px]", noKA ? "text-emerald-600" : "text-slate-400")}>
                {noKA ? "Pasien tidak memiliki riwayat alergi tercatat" : "Aktifkan jika pasien tidak memiliki riwayat alergi"}
              </p>
            </div>
            {noKA && <ShieldCheck size={16} className="shrink-0 text-emerald-500" />}
          </button>

          {/* Count + severity summary */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">
              Daftar Alergi
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {entries.length}
              </span>
            </p>
            {entries.length > 0 && (
              <div className="flex gap-1.5 text-[10px]">
                {(["Berat", "Sedang", "Ringan"] as AllergySeverity[]).map(sev => {
                  const count = entries.filter(e => e.severity === sev).length;
                  if (count === 0) return null;
                  return (
                    <span key={sev} className={cn("rounded-md px-2 py-0.5 font-semibold", SEV_CFG[sev].badgeCls)}>
                      {count} {sev}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* List or empty states */}
          {noKA && entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-10 text-center">
              <ShieldCheck size={22} className="text-emerald-400" />
              <p className="text-xs font-semibold text-emerald-700">Tidak Ada Riwayat Alergi Diketahui</p>
              <p className="text-[11px] text-emerald-500">NKA telah dikonfirmasi dan dicatat</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center shadow-sm">
              <AlertTriangle size={22} className="text-slate-300" />
              <p className="text-xs font-medium text-slate-400">Belum ada alergi yang dicatat</p>
              <p className="text-[11px] text-slate-400">Tambahkan dari panel kiri, atau aktifkan NKA</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {entries.map(entry => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 24, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <AllergyCard entry={entry} onDelete={handleDelete} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {entries.length > 0 && (
            <div className="flex justify-end">
              <button type="button"
                className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700">
                Simpan Data Alergi
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
