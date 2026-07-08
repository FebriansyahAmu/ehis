"use client";

// Kartu TTE DPJP untuk PANEL (bukan cetak) — menampilkan QR tanda tangan elektronik saat resume
// medik sudah ditandatangani. Payload QR SELARAS dengan ResumeMedikCetak
// (EHIS-RESMED|noKunjungan|noRM|signedBy|signedAt|serial) → QR di layar = QR di kertas.
// Layout vertikal/center (muat di sidebar sempit RI maupun panel lebar RJ).

import { ShieldCheck } from "lucide-react";
import TteQr from "@/components/shared/TteQr";
import type { ResumeMedikTte } from "./ResumeMedikCetak";

export default function ResumeMedikTteCard({
  tte, noKunjungan, noRM, size = 88,
}: {
  tte: ResumeMedikTte;
  noKunjungan: string;
  noRM: string;
  size?: number;
}) {
  const payload = `EHIS-RESMED|${noKunjungan}|${noRM}|${tte.signedBy}|${tte.signedAt}|${tte.serial}`;
  return (
    <div className="flex flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-1.5 self-stretch">
        <ShieldCheck size={13} className="shrink-0 text-emerald-600" />
        <p className="text-[11px] font-bold text-emerald-800">Tanda Tangan Elektronik DPJP</p>
      </div>
      <div className="mt-2 rounded-lg border border-emerald-200 bg-white p-1.5">
        <TteQr value={payload} size={size} />
      </div>
      <p className="mt-1.5 break-all font-mono text-[10.5px] font-bold tracking-wider text-emerald-800">{tte.serial}</p>
      <p className="mt-0.5 text-[12px] font-bold text-slate-800">{tte.signedBy}</p>
      <p className="text-[9.5px] text-emerald-700">Ditandatangani · {tte.signedAt}</p>
      <p className="mt-1 text-[9px] leading-snug text-slate-400">
        Sah tanpa tanda tangan basah — UU ITE No. 11/2008 Ps. 11.
      </p>
    </div>
  );
}
