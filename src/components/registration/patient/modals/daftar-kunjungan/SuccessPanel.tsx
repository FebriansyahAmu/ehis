"use client";

import { Check, FileText, Printer, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import type { KunjunganDTO } from "@/lib/api/kunjungan";

const PENJAMIN_LABEL: Record<string, string> = {
  Umum: "Umum / Mandiri",
  BPJS_Non_PBI: "BPJS Non-PBI",
  BPJS_PBI: "BPJS PBI",
  Asuransi: "Asuransi",
  Jamkesda: "Jamkesda",
};

export function SuccessPanel({
  created, kodebooking, onClose, onCetakSep,
}: {
  created: KunjunganDTO;
  kodebooking?: string;
  onClose: () => void;
  onCetakSep?: () => void;
}) {
  const sep = created.sep;
  const sepError = created.sepError;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-12 text-center" style={{ minHeight: 460 }}>
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50"
      >
        <Check size={28} className="text-emerald-600" strokeWidth={2.5} />
      </motion.div>
      <div>
        <p className="text-lg font-black text-slate-900">Kunjungan Terdaftar</p>
        <p className="mt-1 text-sm text-slate-500">{created.pasien.nama} · {created.poli ?? created.unit}</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2 rounded-2xl bg-slate-50 px-6 py-5 text-left ring-1 ring-slate-200">
        <SuccessRow label="No. Kunjungan" value={created.noKunjungan} />
        <SuccessRow label="No. RM" value={created.pasien.noRm} />
        <SuccessRow label="Penjamin" value={PENJAMIN_LABEL[created.penjaminTipe] ?? created.penjaminTipe} />
        {sep?.noSep && <SuccessRow label="No. SEP" value={sep.noSep} highlight />}
        {kodebooking && <SuccessRow label="Kode Booking" value={kodebooking} />}
      </div>

      {sep?.noSep && (
        <p className="flex max-w-xs items-center justify-center gap-1.5 text-xs text-sky-600">
          <FileText size={12} /> SEP berhasil diterbitkan bersama pendaftaran kunjungan.
        </p>
      )}

      {sepError && (
        <div className="flex w-full max-w-xs items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-left">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <div className="text-[11px] leading-relaxed text-amber-700">
            <p className="font-bold">SEP belum terbit ({sepError.code}).</p>
            <p>{sepError.message}. Kunjungan tetap terdaftar — terbitkan SEP nanti dari detail kunjungan / menu BPJS setelah data diperbaiki.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        {sep?.noSep && onCetakSep && (
          <button
            onClick={onCetakSep}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98]"
          >
            <Printer size={15} /> Cetak SEP
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.98]"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}

function SuccessRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-8">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className={`font-mono text-xs font-semibold ${highlight ? "text-sky-600" : "text-slate-700"}`}>{value}</span>
    </div>
  );
}
