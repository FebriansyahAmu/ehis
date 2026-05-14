"use client";

import GiziPane from "@/components/shared/asesmen/GiziPane";

interface SkriningPaneProps {
  noRM?: string;
  onGiziComplete?: (done: boolean) => void;
}

export default function SkriningPane({ noRM, onGiziComplete }: SkriningPaneProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-linear-to-r from-indigo-50 to-white px-4 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Skrining Gizi Awal (MUST)</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">SNARS AP 1.3</span>
          </div>
        </div>
        <div className="p-4">
          <GiziPane noRM={noRM} onComplete={onGiziComplete} />
        </div>
      </div>
    </div>
  );
}
