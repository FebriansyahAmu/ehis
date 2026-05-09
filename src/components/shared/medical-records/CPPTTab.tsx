"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarDays, Search, LayoutTemplate, ChevronDown, Flag } from "lucide-react";
import type { CPPTEntry, CPPTProfesi } from "@/lib/data";
import { cn } from "@/lib/utils";
import { fmtDate, todayISO, PROFESI_CLS, PROFESI_LIST, SOAP_BADGE } from "./cpptShared";
import CPPTEntryCard from "./CPPTEntryCard";

// ── SOAP Templates ────────────────────────────────────────

interface CPPTTemplate {
  id: string; label: string; profesi: CPPTProfesi;
  fields: Partial<Pick<CPPTForm, "subjektif"|"objektif"|"asesmen"|"planning"|"instruksi">>;
}

const CPPT_TEMPLATES: CPPTTemplate[] = [
  { id: "visite", label: "Visite Harian", profesi: "Dokter", fields: {
    subjektif: "Pasien mengeluh ..., riwayat ...",
    objektif:  "KU: baik. TD: .../... mmHg, N: .../mnt, S: ...°C, SpO₂: ...%.",
    asesmen:   "..., kondisi membaik/stabil.",
    planning:  "Lanjutkan terapi ...",
    instruksi: "Monitor TTV tiap ... jam.",
  }},
  { id: "pulang", label: "Siap Pulang", profesi: "Dokter", fields: {
    subjektif: "Pasien merasa lebih baik, keluhan berkurang signifikan.",
    objektif:  "TTV dalam batas normal. Pemeriksaan fisik tanpa kelainan akut.",
    asesmen:   "Kondisi klinis stabil, layak dipulangkan.",
    planning:  "Obat pulang: ..., kontrol poli ... dalam ... hari.",
    instruksi: "Edukasi pasien dan keluarga tanda bahaya, anjuran diet dan aktivitas.",
  }},
  { id: "shift", label: "Laporan Shift", profesi: "Perawat", fields: {
    objektif:  "TTV jam ...: TD .../..., N: ..., S: ...°C, SpO₂: ...%. Input/output: ...",
    asesmen:   "Kondisi pasien ..., tidak ada / ada kejadian luar biasa: ...",
    instruksi: "Observasi tiap ... jam. Hubungi DPJP bila ...",
  }},
  { id: "edukasi", label: "Edukasi Pasien", profesi: "Perawat", fields: {
    subjektif: "Pasien/keluarga menyatakan paham/belum paham mengenai ...",
    asesmen:   "Edukasi diberikan mengenai: ..., diet, aktivitas, tanda bahaya.",
    instruksi: "Evaluasi ulang pemahaman pasien pada kunjungan berikutnya.",
  }},
];

// ── Sub-components ────────────────────────────────────────

function FormArea({ label, value, onChange, placeholder, rows = 2, badge, badgeCls }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; badge?: string; badgeCls?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        {badge && (
          <span className={cn("flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold", badgeCls)}>
            {badge}
          </span>
        )}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      </div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

function DateSep({ iso }: { iso: string }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1.5">
      <CalendarDays size={11} className="text-slate-400" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {fmtDate(iso)}
      </span>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

// ── Form state ────────────────────────────────────────────

interface CPPTForm {
  profesi: CPPTProfesi;
  penulis: string;
  subjektif: string;
  objektif: string;
  asesmen: string;
  planning: string;
  instruksi: string;
}

const EMPTY: CPPTForm = {
  profesi: "Dokter", penulis: "",
  subjektif: "", objektif: "", asesmen: "", planning: "", instruksi: "",
};

function entryToForm(e: CPPTEntry): CPPTForm {
  return {
    profesi: e.profesi, penulis: e.penulis,
    subjektif: e.subjektif ?? "", objektif: e.objektif ?? "",
    asesmen: e.asesmen ?? "", planning: e.planning ?? "",
    instruksi: e.instruksi ?? "",
  };
}

// ── Props ─────────────────────────────────────────────────

export interface CPPTTabProps {
  initialEntries: CPPTEntry[];
  showDate?: boolean;             // RI mode: group entries by date, stamp new entries with today
  requiresVerification?: boolean; // SNARS: show DPJP co-sign UI per entry
}

// ── Component ─────────────────────────────────────────────

export default function CPPTTab({ initialEntries, showDate = false, requiresVerification = false }: CPPTTabProps) {
  const [form, setForm]           = useState<CPPTForm>(EMPTY);
  const [entries, setEntries]     = useState<CPPTEntry[]>([...initialEntries]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery]     = useState("");
  const [filterProfesi, setFilterProfesi] = useState<CPPTProfesi | "Semua">("Semua");
  const [onlyFlagged, setOnlyFlagged]     = useState(false);

  const set = <K extends keyof CPPTForm>(k: K, v: CPPTForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleCopy = (e: CPPTEntry) => { setForm(entryToForm(e)); setEditingId(null); };
  const handleEdit = (e: CPPTEntry) => { setForm(entryToForm(e)); setEditingId(e.id); };
  const handleCancelEdit = () => { setEditingId(null); setForm(EMPTY); };

  const handleVerify = (id: string, verifiedBy: string, verifiedAt: string) => {
    setEntries((prev) =>
      prev.map((e) => e.id === id ? { ...e, verified: true, verifiedBy, verifiedAt } : e),
    );
  };

  const handleFlag = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => e.id === id ? { ...e, flagged: !e.flagged } : e),
    );
  };

  const applyTemplate = (t: CPPTTemplate) => {
    setForm((prev) => ({ ...prev, profesi: t.profesi, ...t.fields }));
    setShowTemplates(false);
  };

  const handleSubmit = () => {
    const hasContent = form.subjektif || form.objektif || form.asesmen || form.planning || form.instruksi;
    if (!form.penulis || !hasContent) return;

    const waktu = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    if (editingId) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? { ...e, waktu, profesi: form.profesi, penulis: form.penulis,
                subjektif: form.subjektif || undefined, objektif: form.objektif || undefined,
                asesmen: form.asesmen || undefined, planning: form.planning || undefined,
                instruksi: form.instruksi || undefined,
                ...(requiresVerification && { verified: false, verifiedBy: undefined, verifiedAt: undefined }) }
            : e,
        ),
      );
      setEditingId(null);
    } else {
      const newEntry: CPPTEntry = {
        id:        `cppt-${Date.now()}`,
        waktu,
        tanggal:   showDate ? todayISO() : undefined,
        profesi:   form.profesi,
        penulis:   form.penulis,
        subjektif: form.subjektif  || undefined,
        objektif:  form.objektif   || undefined,
        asesmen:   form.asesmen    || undefined,
        planning:  form.planning   || undefined,
        instruksi: form.instruksi  || undefined,
        verified:  requiresVerification ? false : undefined,
        flagged:   false,
      };
      setEntries((prev) => [newEntry, ...prev]);
    }
    setForm(EMPTY);
  };

  // ── Filter + sort ─────────────────────────────────────
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterProfesi !== "Semua" && e.profesi !== filterProfesi) return false;
      if (onlyFlagged && !e.flagged) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return [e.penulis, e.subjektif, e.objektif, e.asesmen, e.planning, e.instruksi]
          .some((f) => f?.toLowerCase().includes(q));
      }
      return true;
    });
  }, [entries, filterProfesi, onlyFlagged, searchQuery]);

  const displayed = [...filtered].sort((a, b) => {
    if (showDate && a.tanggal && b.tanggal) {
      return b.tanggal.localeCompare(a.tanggal) || b.waktu.localeCompare(a.waktu);
    }
    return 0;
  });

  const dateGroups: Record<string, CPPTEntry[]> = showDate
    ? displayed.reduce((acc, e) => {
        const key = e.tanggal ?? "no-date";
        if (!acc[key]) acc[key] = [];
        acc[key].push(e);
        return acc;
      }, {} as Record<string, CPPTEntry[]>)
    : {};

  const sortedDates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));
  const flaggedCount = entries.filter((e) => e.flagged).length;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">

      {/* ── Left: Form ── */}
      <motion.div
        className="flex flex-col gap-3 md:w-2/5 md:shrink-0"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <section className={cn(
          "rounded-xl border bg-white shadow-sm transition",
          editingId ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200",
        )}>
          {/* Form header */}
          <div className={cn(
            "flex items-center justify-between gap-2 border-b px-5 py-3.5",
            editingId ? "border-amber-200 bg-amber-50/60" : "border-slate-100 bg-slate-50/60",
          )}>
            <h2 className={cn("text-sm font-semibold", editingId ? "text-amber-800" : "text-slate-700")}>
              {editingId ? "Edit Catatan CPPT" : "Tambah Catatan CPPT"}
            </h2>
            <div className="flex items-center gap-2">
              {showDate && !editingId && (
                <span className="flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 ring-1 ring-indigo-200">
                  <CalendarDays size={9} />
                  {fmtDate(todayISO())}
                </span>
              )}
              {!editingId && (
                <button
                  type="button"
                  onClick={() => setShowTemplates((v) => !v)}
                  className={cn(
                    "flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition",
                    showTemplates
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600",
                  )}
                >
                  <LayoutTemplate size={11} />
                  Template
                  <ChevronDown size={10} className={cn("transition-transform", showTemplates && "rotate-180")} />
                </button>
              )}
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                >
                  <X size={12} /> Batal
                </button>
              )}
            </div>
          </div>

          {/* Template panel */}
          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden border-b border-indigo-100 bg-indigo-50/40"
              >
                <div className="p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                    Pilih Template SOAP
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CPPT_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="flex flex-col items-start rounded-lg border border-indigo-100 bg-white px-3 py-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        <span className={cn("mb-1 rounded px-1.5 py-0.5 text-[10px] font-semibold", PROFESI_CLS[t.profesi])}>
                          {t.profesi}
                        </span>
                        <span className="text-xs font-medium text-slate-700">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-4 p-5">
            {/* Profesi */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Profesi</p>
              <div className="flex flex-wrap gap-1.5">
                {PROFESI_LIST.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("profesi", p)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                      form.profesi === p
                        ? PROFESI_CLS[p]
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Penulis */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Nama Penulis <span className="text-rose-400">*</span>
              </p>
              <input
                type="text"
                value={form.penulis}
                onChange={(e) => set("penulis", e.target.value)}
                placeholder="Nama lengkap..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <FormArea badge="S" badgeCls={SOAP_BADGE.S} label="Subjektif"
              value={form.subjektif} onChange={(v) => set("subjektif", v)}
              placeholder="Keluhan yang dirasakan pasien..." />
            <FormArea badge="O" badgeCls={SOAP_BADGE.O} label="Objektif"
              value={form.objektif} onChange={(v) => set("objektif", v)}
              placeholder="Temuan pemeriksaan, lab, radiologi..." />
            <FormArea badge="A" badgeCls={SOAP_BADGE.A} label="Asesmen"
              value={form.asesmen} onChange={(v) => set("asesmen", v)}
              placeholder="Diagnosis / masalah klinis..." />
            <FormArea badge="P" badgeCls={SOAP_BADGE.P} label="Planning"
              value={form.planning} onChange={(v) => set("planning", v)}
              placeholder="Rencana tatalaksana..." rows={3} />
            <FormArea badge="I" badgeCls={SOAP_BADGE.I} label="Instruksi"
              value={form.instruksi} onChange={(v) => set("instruksi", v)}
              placeholder="Instruksi kepada perawat / tenaga kesehatan lain..." rows={2} />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!form.penulis}
              className={cn(
                "w-full rounded-lg py-2 text-sm font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40",
                editingId ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700",
              )}
            >
              {editingId ? "Simpan Perubahan" : "Simpan Catatan CPPT"}
            </button>
          </div>
        </section>
      </motion.div>

      {/* ── Right: History ── */}
      <div className="flex flex-1 flex-col gap-3 md:min-w-0">

        {/* History header + search/filter */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-700">Riwayat CPPT</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {filtered.length}
              {filtered.length !== entries.length && (
                <span className="text-slate-400"> / {entries.length}</span>
              )}
            </span>
            {flaggedCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600 ring-1 ring-rose-200">
                <Flag size={9} className="fill-rose-400 text-rose-400" />
                {flaggedCount} tindak lanjut
              </span>
            )}
          </div>

          {/* Search input */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari catatan..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setOnlyFlagged((v) => !v)}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition",
                onlyFlagged
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600",
              )}
            >
              <Flag size={10} className={onlyFlagged ? "fill-rose-400 text-rose-400" : ""} />
              Tindak Lanjut
            </button>

            <div className="h-4 w-px bg-slate-200" />

            {(["Semua", ...PROFESI_LIST] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFilterProfesi(p as CPPTProfesi | "Semua")}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition",
                  filterProfesi === p
                    ? p === "Semua"
                      ? "border-slate-400 bg-slate-100 text-slate-700"
                      : PROFESI_CLS[p as CPPTProfesi]
                    : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Entry list — independently scrollable */}
        <div className="flex flex-col gap-3 md:max-h-[calc(100vh-280px)] md:overflow-y-auto md:pr-1">
          {filtered.length === 0 ? (
            <motion.div
              className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-400"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              {entries.length === 0 ? "Belum ada catatan CPPT" : "Tidak ada catatan yang cocok"}
            </motion.div>
          ) : showDate ? (
            sortedDates.map((date, di) => (
              <div key={date}>
                <DateSep iso={date} />
                {dateGroups[date].map((entry, idx) => (
                  <CPPTEntryCard
                    key={entry.id}
                    entry={entry}
                    editingId={editingId}
                    onCopy={handleCopy}
                    onEdit={handleEdit}
                    onVerify={handleVerify}
                    onFlag={handleFlag}
                    requiresVerification={requiresVerification}
                    delay={(di * 3 + idx) * 0.04}
                  />
                ))}
              </div>
            ))
          ) : (
            displayed.map((entry, idx) => (
              <CPPTEntryCard
                key={entry.id}
                entry={entry}
                editingId={editingId}
                onCopy={handleCopy}
                onEdit={handleEdit}
                onVerify={handleVerify}
                onFlag={handleFlag}
                requiresVerification={requiresVerification}
                delay={idx * 0.04}
              />
            ))
          )}
        </div>
      </div>

    </div>
  );
}
