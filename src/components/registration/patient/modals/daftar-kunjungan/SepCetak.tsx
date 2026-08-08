"use client";

// Cetak SEP — sheet 1:1 format resmi BPJS (SepBpjsSheet) dari KunjunganDTO, dicetak di
// kertas Envelope #10 (105 × 241 mm, landscape). Reuse mekanisme print app:
// `.print-area`/`.no-print` (globals.css) + triggerPrint(). Ukuran @page di-inject scoped
// di modal ini agar tak mengganggu cetakan A4 lain.
// Nama DPJP diresolusi dari master Dokter (dpjpId = Dokter.id) → "Dokter" & "Sub/Spesialis".

import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";
import { useRsProfil } from "@/lib/master/rsProfilClient";
import { triggerPrint } from "@/components/billing/invoice/modals/print/printShared";
import { getDokter } from "@/lib/api/dokter";
import { SepBpjsSheet } from "@/components/shared/sep/SepBpjsSheet";
import { buildSepPrintDataFromKunjungan } from "@/components/shared/sep/sepPrintShared";
import type { KunjunganDTO } from "@/lib/api/kunjungan";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface DpjpInfo { nama?: string; spesialisLabel?: string }

/** Sheet A4 SEP (1:1 BPJS) — render di dalam `.print-area`. */
export function SepCetakSheet({ kunjungan, dpjp }: { kunjungan: KunjunganDTO; dpjp?: DpjpInfo }) {
  const rs = useRsProfil();
  const data = buildSepPrintDataFromKunjungan(kunjungan, {
    rsNama: rs.nama,
    dpjpNama: dpjp?.nama,
    spesialisLabel: dpjp?.spesialisLabel,
  });
  if (!data) {
    return (
      <div className="w-full bg-white px-10 py-10 text-center font-sans text-sm text-slate-500">
        SEP belum tersedia untuk kunjungan ini.
      </div>
    );
  }
  return <SepBpjsSheet data={data} />;
}

/** Modal preview + cetak SEP. Resolusi nama DPJP dari master Dokter. */
export function SepPrintModal({ kunjungan, onClose }: { kunjungan: KunjunganDTO; onClose: () => void }) {
  const [dpjp, setDpjp] = useState<DpjpInfo | undefined>();

  useEffect(() => {
    const id = kunjungan.dpjpId;
    if (!id || !UUID_RE.test(id)) return;
    const ac = new AbortController();
    getDokter(id, ac.signal)
      .then((d) => { if (!ac.signal.aborted) setDpjp({ nama: d.namaTampil, spesialisLabel: d.spesialisLabel }); })
      .catch(() => { /* fallback "-" */ });
    return () => ac.abort();
  }, [kunjungan.dpjpId]);

  return (
    <div className="no-print fixed inset-0 z-[60] flex flex-col bg-slate-900/60 backdrop-blur-sm">
      {/* Ukuran kertas Envelope #10 landscape — scoped ke gate SEP, override @page A4 global. */}
      <style>{`@media print { @page { size: 241mm 105mm; margin: 4mm 6mm; } }`}</style>
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-3 bg-white px-5 py-3 shadow">
        <div>
          <p className="text-sm font-bold text-slate-800">Cetak SEP</p>
          <p className="text-[11px] text-slate-400">{kunjungan.sep?.noSep ?? "—"} · {kunjungan.pasien.nama}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => triggerPrint()}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            <Printer size={14} /> Cetak / Simpan PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-fit rounded-lg bg-white shadow-xl">
          <div className="print-area" data-paper="ENV10">
            <SepCetakSheet kunjungan={kunjungan} dpjp={dpjp} />
          </div>
        </div>
      </div>
    </div>
  );
}
