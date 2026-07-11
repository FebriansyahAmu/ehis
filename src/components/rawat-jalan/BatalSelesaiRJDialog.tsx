"use client";

// Dialog "Batalkan Selesai" (reopen) khusus Rawat Jalan — HIGH ALERT. Membuka kembali rekam
// medis yang sudah difinalkan & terkunci. Pengguna WAJIB memilih tujuan pembatalan:
//   · "koreksi"     — Perbaikan Pengimputan  → tgl keluar DIPERTAHANKAN (frozen).
//   · "menyeluruh"  — Perbaikan Menyeluruh   → tgl keluar BARU saat penyelesaian ulang.
// Jejak audit (waktu selesai pertama) selalu tersimpan pada kedua mode.

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X, ShieldAlert, PencilLine, CalendarClock, RotateCcw, Check, TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ReopenMode = "koreksi" | "menyeluruh";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    timeZone: "UTC", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface ModeDef {
  id: ReopenMode;
  icon: IconComponent;
  title: string;
  desc: string;
  effect: string;
  alert?: boolean; // penanda tambahan high-alert (ubah tgl keluar)
}

const MODES: ModeDef[] = [
  {
    id: "koreksi",
    icon: PencilLine,
    title: "Perbaikan Pengimputan",
    desc: "Koreksi kesalahan input (diagnosa, catatan, tindakan) tanpa mengubah waktu kepulangan.",
    effect: "Tanggal keluar dipertahankan",
  },
  {
    id: "menyeluruh",
    icon: CalendarClock,
    title: "Perbaikan Menyeluruh",
    desc: "Pelayanan dibuka penuh kembali; tanggal keluar lama dihapus dan ditetapkan ulang saat penyelesaian berikutnya.",
    effect: "Tanggal keluar BARU",
    alert: true,
  },
];

export default function BatalSelesaiRJDialog({
  patientName,
  selesaiAt,
  onSubmit,
  onClose,
}: {
  patientName: string;
  selesaiAt: string | null;
  onSubmit: (mode: ReopenMode, alasan: string) => Promise<void> | void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<ReopenMode | null>(null);
  const [alasan, setAlasan] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = mode !== null && !saving;

  async function submit() {
    if (!canSubmit) return;
    try {
      setSaving(true);
      await onSubmit(mode!, alasan);
      onClose();
    } catch {
      /* toast oleh pemanggil; dialog tetap terbuka */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-2xl"
      >
        {/* Header — high alert */}
        <div className="flex items-center justify-between bg-linear-to-r from-rose-600 to-rose-700 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <ShieldAlert size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-100">High Alert · Batalkan Selesai</p>
              <p className="text-sm font-bold text-white">{patientName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-rose-100 transition hover:bg-white/10 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {/* Peringatan utama */}
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
            <TriangleAlert size={16} className="mt-0.5 shrink-0 text-rose-500" />
            <div className="text-[11px] leading-relaxed text-rose-800">
              Anda akan <b>membuka kembali</b> rekam medis yang telah difinalkan &amp; terkunci.
              Tindakan ini tercatat dalam jejak audit. Waktu selesai pertama
              (<b>{fmt(selesaiAt)}</b>) tetap tersimpan sebagai riwayat.
            </div>
          </div>

          {/* Pilihan mode */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Tujuan pembatalan <span className="text-rose-400">*</span>
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODES.map((m) => {
                const sel = mode === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "group relative flex flex-col gap-1.5 rounded-xl border p-3 text-left transition",
                      sel
                        ? m.alert
                          ? "border-rose-400 bg-rose-50 ring-2 ring-rose-200"
                          : "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1",
                        sel
                          ? m.alert ? "bg-rose-100 text-rose-600 ring-rose-200" : "bg-emerald-100 text-emerald-600 ring-emerald-200"
                          : "bg-slate-100 text-slate-500 ring-slate-200",
                      )}>
                        <Icon size={14} />
                      </span>
                      <span className={cn(
                        "text-xs font-bold",
                        sel ? (m.alert ? "text-rose-800" : "text-emerald-800") : "text-slate-700",
                      )}>
                        {m.title}
                      </span>
                      {sel && (
                        <span className={cn(
                          "ml-auto flex h-4 w-4 items-center justify-center rounded-full text-white",
                          m.alert ? "bg-rose-500" : "bg-emerald-500",
                        )}>
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-snug text-slate-500">{m.desc}</p>
                    <span className={cn(
                      "mt-0.5 inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                      m.alert ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600",
                    )}>
                      {m.alert && <TriangleAlert size={10} />}
                      {m.effect}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Peringatan ekstra saat mode "menyeluruh" */}
          {mode === "menyeluruh" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-100/60 px-3 py-2"
            >
              <TriangleAlert size={13} className="mt-0.5 shrink-0 text-rose-600" />
              <p className="text-[11px] leading-relaxed text-rose-800">
                <b>Perhatian:</b> tanggal keluar lama akan dihapus. Pastikan Anda menetapkan
                tanggal keluar yang benar saat menyelesaikan kembali kunjungan ini.
              </p>
            </motion.div>
          )}

          {/* Alasan (medico-legal) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Alasan <span className="text-slate-300">(opsional, medico-legal)</span>
            </label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={2}
              placeholder="mis. koreksi kode diagnosa, kesalahan input tanggal, tambahan tindakan…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Batal</button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-bold text-white transition",
                canSubmit ? "bg-rose-600 shadow-sm shadow-rose-200 hover:bg-rose-700" : "cursor-not-allowed bg-slate-200 text-slate-400",
              )}
            >
              <RotateCcw size={13} /> Batalkan Selesai
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
