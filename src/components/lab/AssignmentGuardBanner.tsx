"use client";

// Peringatan in-pane: aksi Lab (terima order / entry hasil) hanya untuk petugas yang
// DITUGASKAN ke Laboratorium (SDM Assignment). Konsisten lintas pane (Penerimaan/Entry Hasil).

import { ShieldAlert } from "lucide-react";

export default function AssignmentGuardBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3">
      <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
      <div>
        <p className="text-[12px] font-bold text-amber-800">Belum Ditugaskan ke Laboratorium</p>
        <p className="text-[11px] text-amber-700">{message}</p>
      </div>
    </div>
  );
}
