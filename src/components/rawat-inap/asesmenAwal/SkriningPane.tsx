"use client";

import GiziPane from "@/components/shared/asesmen/GiziPane";

interface SkriningPaneProps {
  noRM?: string;
  /** id kunjungan DB (UUID) → GiziPane mode DB (fetch riwayat + persist). Non-UUID → demo. */
  kunjunganId?: string;
  /** Nama user login → "Nama Petugas" read-only di mode DB. */
  recordedBy?: string;
  onGiziComplete?: (done: boolean) => void;
}

export default function SkriningPane({ noRM, kunjunganId, recordedBy, onGiziComplete }: SkriningPaneProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-linear-to-r from-sky-50 to-white px-4 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Skrining Gizi Awal (MUST)</span>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">SNARS AP 1.3</span>
          </div>
        </div>
        <div className="p-4">
          <GiziPane noRM={noRM} kunjunganId={kunjunganId} recordedBy={recordedBy} onComplete={onGiziComplete} />
        </div>
      </div>
    </div>
  );
}
