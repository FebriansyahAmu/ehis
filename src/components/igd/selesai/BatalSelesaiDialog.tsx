"use client";

// Dialog "Batal Selesai" (reopen) — buka kembali rekam medis yang terkunci. Alasan opsional
// (medico-legal). Waktu selesai PERTAMA tetap tercatat; waktu selesai baru dipilih saat
// menyelesaikan ulang (bukan di sini).

import { useState } from "react";
import { motion } from "framer-motion";
import { X, RotateCcw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BatalSelesaiDialog({
  selesaiAt,
  onSubmit,
  onClose,
}: {
  selesaiAt: string | null;
  onSubmit: (alasanReopen: string) => Promise<void> | void;
  onClose: () => void;
}) {
  const [alasan, setAlasan] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (saving) return;
    try {
      setSaving(true);
      await onSubmit(alasan);
      onClose();
    } catch {
      /* toast oleh pemanggil; dialog tetap terbuka */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-50">Batal Selesai</p>
            <p className="text-sm font-bold text-white">Buka kembali rekam medis</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-amber-50 transition hover:bg-white/10 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="text-[11px] leading-relaxed text-slate-600">
              Waktu selesai pertama (<b>{fmt(selesaiAt)}</b>) tetap tercatat sebagai jejak audit.
              Waktu selesai baru dapat dipilih saat menyelesaikan ulang.
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Alasan Batal Selesai <span className="text-slate-300">(opsional)</span></label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={3}
              placeholder="mis. koreksi diagnosa, tambahan tindakan, kesalahan input…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Batal</button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-bold text-white transition",
                saving ? "cursor-not-allowed bg-slate-200 text-slate-400" : "bg-amber-600 shadow-sm shadow-amber-200 hover:bg-amber-700",
              )}
            >
              <RotateCcw size={13} /> Batal Selesai
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
