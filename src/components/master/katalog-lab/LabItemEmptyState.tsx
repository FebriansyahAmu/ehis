"use client";

import { FlaskConical, Plus } from "lucide-react";

interface Props {
  totalItem: number;
  onAddNew: () => void;
}

export default function LabItemEmptyState({ totalItem, onAddNew }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 ring-4 ring-sky-100">
        <FlaskConical size={28} className="text-sky-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">Pilih pemeriksaan untuk diedit</p>
        <p className="mt-0.5 text-xs text-slate-400">
          {totalItem} pemeriksaan tersedia · Klik item di panel kiri, atau tambah baru.
        </p>
      </div>
      <button
        onClick={onAddNew}
        className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
      >
        <Plus size={13} />
        Tambah Pemeriksaan
      </button>
    </div>
  );
}
