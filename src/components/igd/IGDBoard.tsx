"use client";

import { useState } from "react";
import type { IGDPatient, TriageLevel, IGDStatus } from "@/lib/data";
import PatientCard from "./PatientCard";
import { cn } from "@/lib/utils";

type FilterTriage = "Semua" | TriageLevel;
type FilterStatus = "Semua" | IGDStatus;

const TRIAGE_TABS: FilterTriage[]  = ["Semua", "P1", "P2", "P3", "P4"];
const STATUS_OPTS: FilterStatus[]  = ["Semua", "Triage", "Menunggu", "Dalam Penanganan", "Observasi", "Selesai"];

const TRIAGE_COLOR: Record<FilterTriage, string> = {
  Semua: "bg-slate-800 text-white",
  P1:    "bg-rose-600 text-white",
  P2:    "bg-amber-500 text-white",
  P3:    "bg-emerald-600 text-white",
  P4:    "bg-slate-600 text-white",
};

const TRIAGE_OUTLINE: Record<FilterTriage, string> = {
  Semua: "border-slate-300 text-slate-600 hover:bg-slate-100",
  P1:    "border-rose-200 text-rose-600 hover:bg-rose-50",
  P2:    "border-amber-200 text-amber-600 hover:bg-amber-50",
  P3:    "border-emerald-200 text-emerald-600 hover:bg-emerald-50",
  P4:    "border-slate-300 text-slate-600 hover:bg-slate-50",
};

interface IGDBoardProps {
  patients: IGDPatient[];
}

export default function IGDBoard({ patients }: IGDBoardProps) {
  const [triage, setTriage]   = useState<FilterTriage>("Semua");
  const [status, setStatus]   = useState<FilterStatus>("Semua");
  const [search, setSearch]   = useState("");

  const filtered = patients.filter((p) => {
    const matchTriage = triage === "Semua" || p.triage === triage;
    const matchStatus = status === "Semua" || p.status === status;
    const matchSearch = search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.noRM.toLowerCase().includes(search.toLowerCase()) ||
      p.complaint.toLowerCase().includes(search.toLowerCase());
    return matchTriage && matchStatus && matchSearch;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Triage tabs */}
        <div className="flex items-center gap-1.5">
          {TRIAGE_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTriage(t)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                triage === t ? TRIAGE_COLOR[t] : TRIAGE_OUTLINE[t],
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <span className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden="true" />

        {/* Status select */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as FilterStatus)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          aria-label="Filter status"
        >
          {STATUS_OPTS.map((s) => (
            <option key={s} value={s}>{s === "Semua" ? "Semua Status" : s}</option>
          ))}
        </select>

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama / No. RM…"
          className="ml-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 w-48"
          aria-label="Cari pasien IGD"
        />
      </div>

      {/* Result count */}
      <p className="text-xs text-slate-400">
        Menampilkan <span className="font-semibold text-slate-600">{filtered.length}</span> pasien
      </p>

      {/* Cards grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((p, i) => (
            <PatientCard key={p.id} patient={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="font-medium text-slate-500">Tidak ada pasien ditemukan</p>
          <p className="mt-1 text-sm text-slate-400">Coba ubah filter atau kata pencarian</p>
        </div>
      )}
    </div>
  );
}
