import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = { title: "Laporan" };

export default function EhisReportPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 ring-4 ring-emerald-100">
        <BarChart3 size={24} className="text-emerald-600" />
      </span>
      <div className="text-center">
        <h1 className="text-lg font-bold text-slate-900">EHIS Report</h1>
        <p className="mt-1 text-sm text-slate-500">
          Modul rekapitulasi & statistik sedang dalam pengembangan.
        </p>
      </div>
    </div>
  );
}
