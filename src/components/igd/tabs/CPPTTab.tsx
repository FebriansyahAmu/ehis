"use client";

import { useState } from "react";
import { Copy, Pencil, X } from "lucide-react";
import type { IGDPatientDetail, CPPTEntry, CPPTProfesi } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Profesi config ────────────────────────────────────────

const PROFESI_CLS: Record<CPPTProfesi, string> = {
  Dokter:      "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  Perawat:     "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  Bidan:       "bg-pink-50 text-pink-700 ring-1 ring-pink-200",
  Apoteker:    "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  Gizi:        "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Fisioterapi: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Lainnya:     "bg-slate-100 text-slate-600",
};

const PROFESI_LIST: CPPTProfesi[] = [
  "Dokter", "Perawat", "Bidan", "Apoteker", "Gizi", "Fisioterapi", "Lainnya",
];

// ── SOAP + I letter badges ────────────────────────────────

const SOAP_BADGE: Record<string, string> = {
  S: "bg-sky-100 text-sky-700",
  O: "bg-violet-100 text-violet-700",
  A: "bg-amber-100 text-amber-700",
  P: "bg-emerald-100 text-emerald-700",
  I: "bg-rose-100 text-rose-700",
};

function SOAPRow({ letter, value }: { letter: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold",
          SOAP_BADGE[letter] ?? "bg-slate-100 text-slate-500",
        )}
      >
        {letter}
      </span>
      <p className="flex-1 text-sm leading-relaxed text-slate-700 whitespace-pre-line">{value}</p>
    </div>
  );
}

// ── Form textarea primitive ───────────────────────────────

function FormArea({ label, value, onChange, placeholder, rows = 2, badge, badgeCls }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  badge?: string;
  badgeCls?: string;
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

function entryToForm(entry: CPPTEntry): CPPTForm {
  return {
    profesi:   entry.profesi,
    penulis:   entry.penulis,
    subjektif: entry.subjektif  ?? "",
    objektif:  entry.objektif   ?? "",
    asesmen:   entry.asesmen    ?? "",
    planning:  entry.planning   ?? "",
    instruksi: entry.instruksi  ?? "",
  };
}

// ── Component ─────────────────────────────────────────────

export default function CPPTTab({ patient }: { patient: IGDPatientDetail }) {
  const [form, setForm]           = useState<CPPTForm>(EMPTY);
  const [entries, setEntries]     = useState<CPPTEntry[]>([...patient.cppt].reverse());
  const [editingId, setEditingId] = useState<string | null>(null);

  const set = <K extends keyof CPPTForm>(k: K, v: CPPTForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // ── Copy: fill form as a fresh new entry ──────────────
  const handleCopy = (entry: CPPTEntry) => {
    setForm(entryToForm(entry));
    setEditingId(null);
  };

  // ── Edit: fill form and track which entry to update ──
  const handleEdit = (entry: CPPTEntry) => {
    setForm(entryToForm(entry));
    setEditingId(entry.id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  // ── Submit: new or update ────────────────────────────
  const handleSubmit = () => {
    const hasContent = form.subjektif || form.objektif || form.asesmen || form.planning || form.instruksi;
    if (!form.penulis || !hasContent) return;

    const waktu = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    if (editingId) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                waktu,
                profesi:   form.profesi,
                penulis:   form.penulis,
                subjektif: form.subjektif  || undefined,
                objektif:  form.objektif   || undefined,
                asesmen:   form.asesmen    || undefined,
                planning:  form.planning   || undefined,
                instruksi: form.instruksi  || undefined,
              }
            : e,
        ),
      );
      setEditingId(null);
    } else {
      const newEntry: CPPTEntry = {
        id: `cppt-${Date.now()}`,
        waktu,
        profesi:   form.profesi,
        penulis:   form.penulis,
        subjektif: form.subjektif  || undefined,
        objektif:  form.objektif   || undefined,
        asesmen:   form.asesmen    || undefined,
        planning:  form.planning   || undefined,
        instruksi: form.instruksi  || undefined,
      };
      setEntries((prev) => [newEntry, ...prev]);
    }
    setForm(EMPTY);
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">

      {/* ── Left: Form ── */}
      <div className="flex flex-col gap-3 md:w-2/5 md:shrink-0">
        <section className={cn(
          "rounded-xl border bg-white shadow-sm transition",
          editingId
            ? "border-amber-300 ring-2 ring-amber-100"
            : "border-slate-200",
        )}>
          <div className={cn(
            "flex items-center justify-between gap-2 border-b px-5 py-3.5",
            editingId ? "border-amber-200 bg-amber-50/60" : "border-slate-100 bg-slate-50/60",
          )}>
            <h2 className={cn("text-sm font-semibold", editingId ? "text-amber-800" : "text-slate-700")}>
              {editingId ? "Edit Catatan CPPT" : "Tambah Catatan CPPT"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
              >
                <X size={12} />
                Batal
              </button>
            )}
          </div>

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

            <FormArea
              badge="S" badgeCls={SOAP_BADGE.S} label="Subjektif"
              value={form.subjektif} onChange={(v) => set("subjektif", v)}
              placeholder="Keluhan yang dirasakan pasien..."
            />
            <FormArea
              badge="O" badgeCls={SOAP_BADGE.O} label="Objektif"
              value={form.objektif} onChange={(v) => set("objektif", v)}
              placeholder="Temuan pemeriksaan, hasil lab / radiologi..."
            />
            <FormArea
              badge="A" badgeCls={SOAP_BADGE.A} label="Asesmen"
              value={form.asesmen} onChange={(v) => set("asesmen", v)}
              placeholder="Diagnosis / masalah klinis..."
            />
            <FormArea
              badge="P" badgeCls={SOAP_BADGE.P} label="Planning"
              value={form.planning} onChange={(v) => set("planning", v)}
              placeholder="Rencana tatalaksana..." rows={3}
            />
            <FormArea
              badge="I" badgeCls={SOAP_BADGE.I} label="Instruksi"
              value={form.instruksi} onChange={(v) => set("instruksi", v)}
              placeholder="Instruksi kepada perawat / tenaga kesehatan lain..." rows={2}
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!form.penulis}
              className={cn(
                "w-full rounded-lg py-2 text-sm font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40",
                editingId
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-indigo-600 hover:bg-indigo-700",
              )}
            >
              {editingId ? "Simpan Perubahan" : "Simpan Catatan CPPT"}
            </button>
          </div>
        </section>
      </div>

      {/* ── Right: History ── */}
      <div className="flex flex-1 flex-col gap-3 md:min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-700">Riwayat CPPT</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {entries.length}
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-400">
            Belum ada catatan CPPT
          </div>
        ) : (
          entries.map((entry, idx) => (
            <article
              key={entry.id}
              className={cn(
                "animate-fade-in rounded-xl border bg-white shadow-sm transition",
                editingId === entry.id
                  ? "border-amber-300 ring-2 ring-amber-100"
                  : "border-slate-200",
              )}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className={cn(
                "flex flex-wrap items-center gap-2 border-b px-4 py-3",
                editingId === entry.id
                  ? "border-amber-200 bg-amber-50/60"
                  : "border-slate-100 bg-slate-50/60",
              )}>
                <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-600">
                  {entry.waktu}
                </span>
                <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", PROFESI_CLS[entry.profesi])}>
                  {entry.profesi}
                </span>
                <span className="text-sm text-slate-500">{entry.penulis}</span>

                {/* Action buttons */}
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(entry)}
                    title="Salin ke form baru"
                    className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <Copy size={11} />
                    Salin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(entry)}
                    title="Edit catatan ini"
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition",
                      editingId === entry.id
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600",
                    )}
                  >
                    <Pencil size={11} />
                    Edit
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 p-4">
                <SOAPRow letter="S" value={entry.subjektif} />
                <SOAPRow letter="O" value={entry.objektif} />
                <SOAPRow letter="A" value={entry.asesmen} />
                <SOAPRow letter="P" value={entry.planning} />
                <SOAPRow letter="I" value={entry.instruksi} />
              </div>
            </article>
          ))
        )}
      </div>

    </div>
  );
}
