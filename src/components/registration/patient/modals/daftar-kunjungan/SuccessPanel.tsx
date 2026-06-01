"use client";

import { Check, FileText } from "lucide-react";
import { motion } from "framer-motion";
import type { KunjunganRecord } from "@/lib/data";

export function SuccessPanel({
  created, kodebooking, onClose,
}: {
  created: KunjunganRecord;
  kodebooking?: string;
  onClose: () => void;
}) {
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
        <p className="mt-1 text-sm text-slate-500">{created.unit} · {created.dokter}</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2 rounded-2xl bg-slate-50 px-6 py-5 text-left ring-1 ring-slate-200">
        <SuccessRow label="No. Kunjungan" value={created.noKunjungan} />
        <SuccessRow label="No. Pendaftaran" value={created.noPendaftaran} />
        {created.penjamin && <SuccessRow label="Penjamin" value={created.penjamin} />}
        {created.noSEP && <SuccessRow label="No. SEP" value={created.noSEP} highlight />}
        {kodebooking && <SuccessRow label="Kode Booking" value={kodebooking} />}
      </div>

      {created.noSEP && (
        <p className="flex max-w-xs items-center justify-center gap-1.5 text-xs text-sky-600">
          <FileText size={12} /> SEP berhasil diterbitkan bersama pendaftaran kunjungan.
        </p>
      )}
      {kodebooking && (
        <p className="max-w-xs text-xs text-emerald-600">
          Antrean diperbarui → status <span className="font-semibold">Menunggu Poli</span> (task 3 terkirim ke BPJS).
        </p>
      )}

      <button
        onClick={onClose}
        className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.98]"
      >
        Selesai
      </button>
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
