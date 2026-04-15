import { Plus, Search } from "lucide-react";
import type { IGDPatientDetail, DiagnosaTipe } from "@/app/lib/data";
import { cn } from "@/app/lib/utils";

const TIPE_CLS: Record<DiagnosaTipe, string> = {
  Utama:      "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  Sekunder:   "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  Komplikasi: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Komorbid:   "bg-slate-100 text-slate-600",
};

const TIPE_ORDER: DiagnosaTipe[] = ["Utama", "Sekunder", "Komplikasi", "Komorbid"];

export default function DiagnosaTab({ patient }: { patient: IGDPatientDetail }) {
  const sorted = [...patient.diagnosa].sort(
    (a, b) => TIPE_ORDER.indexOf(a.tipe) - TIPE_ORDER.indexOf(b.tipe),
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-semibold text-slate-700">Tambah Diagnosis ICD-10</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Cari kode atau nama diagnosis ICD-10…"
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              readOnly
            />
          </div>
          <button className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700">
            <Plus size={13} />
            Tambah
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
          <span className="text-xs font-semibold text-slate-700">Daftar Diagnosis</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {patient.diagnosa.length}
          </span>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {TIPE_ORDER.map((t) => (
              <span key={t} className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", TIPE_CLS[t])}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Belum ada diagnosis yang ditegakkan
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sorted.map((diag) => (
              <li key={diag.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-14 shrink-0 font-mono text-xs font-semibold text-slate-700">
                  {diag.kodeIcd10}
                </span>
                <p className="flex-1 text-xs text-slate-800">{diag.namaDiagnosis}</p>
                <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold", TIPE_CLS[diag.tipe])}>
                  {diag.tipe}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
