import type { Metadata } from "next";
import { Database } from "lucide-react";

export const metadata: Metadata = { title: "Master Data" };

export default function EhisMasterPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 ring-4 ring-violet-100">
        <Database size={24} className="text-violet-600" />
      </span>
      <div className="text-center">
        <h1 className="text-lg font-bold text-slate-900">EHIS Master</h1>
        <p className="mt-1 text-sm text-slate-500">
          Modul data master & referensi sedang dalam pengembangan.
        </p>
      </div>
    </div>
  );
}
