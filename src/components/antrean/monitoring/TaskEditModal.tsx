"use client";

// ANT5 — Koreksi waktu task manual + kirim ulang (re-send) ke outbox BPJS.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, RefreshCw, Save, AlertTriangle } from "lucide-react";
import { editTaskWaktu, resendTask } from "@/lib/antrean/antreanStore";
import { TASK_LABEL, type AntreanRecord, type TaskLog } from "@/lib/antrean/types";
import { KirimBadge, toLocalInput } from "./monitoringShared";

export function TaskEditModal({
  rec,
  task,
  onClose,
  onToast,
}: {
  rec: AntreanRecord;
  task: TaskLog;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const [val, setVal] = useState(toLocalInput(task.waktu));
  const [err, setErr] = useState<string | null>(null);

  const handleSave = () => {
    const ms = new Date(val).getTime();
    if (Number.isNaN(ms)) { setErr("Format waktu tidak valid"); return; }
    const r = editTaskWaktu(rec.kodebooking, task.taskid, ms);
    if (!r.ok) { setErr(r.error ?? "Gagal menyimpan"); return; }
    onToast(`Waktu task ${task.taskid} diperbarui`);
    onClose();
  };

  const handleResend = () => {
    resendTask(rec.kodebooking, task.taskid);
    onToast(`Task ${task.taskid} dikirim ulang ke BPJS`);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-start gap-3 border-b border-slate-100 bg-sky-50/60 px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <Clock className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="m-base font-bold text-slate-800">Task {task.taskid}</h3>
              <p className="m-tiny text-slate-500">{TASK_LABEL[task.taskid]}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4 px-5 py-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span className="m-xs text-slate-500">Status kirim · {task.attempts}× attempt</span>
              <KirimBadge status={task.kirim} />
            </div>

            {task.error && (
              <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 m-tiny text-rose-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {task.error}
              </p>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="m-tiny font-semibold uppercase tracking-wide text-slate-400">Waktu Kejadian (koreksi manual)</span>
              <input
                type="datetime-local"
                value={val}
                onChange={(e) => { setVal(e.target.value); setErr(null); }}
                className="rounded-lg border border-slate-200 px-3 py-2 m-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
              {err && <span className="m-tiny font-medium text-rose-600">{err}</span>}
              <span className="m-mini text-slate-400">Validasi monoton: tidak boleh mendahului task sebelumnya / melampaui task berikutnya.</span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3.5">
            <button
              type="button"
              onClick={handleResend}
              disabled={task.kirim === "terkirim"}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 m-sm font-semibold text-sky-600 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <RefreshCw className="h-4 w-4" /> Kirim Ulang
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 m-sm font-semibold text-slate-500 transition hover:bg-slate-100">
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 m-sm font-bold text-white shadow-sm transition hover:bg-sky-700"
              >
                <Save className="h-4 w-4" /> Simpan
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
