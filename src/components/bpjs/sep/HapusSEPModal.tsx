"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Trash2, Loader2, CheckCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SEPRecordExt } from "@/lib/bpjs/bpjsShared";
import { statusChipCls } from "./sepShared";

interface HapusSEPModalProps {
  sep: SEPRecordExt | null;
  onConfirm: (noSep: string, alasan: string) => Promise<void>;
  onClose: () => void;
  onDeleted?: () => void;
}

const BLOCKED_STATUSES: SEPRecordExt["statusInternal"][] = ["Deleted", "Closed"];
const MIN_ALASAN = 20;

export default function HapusSEPModal({ sep, onConfirm, onClose, onDeleted }: HapusSEPModalProps) {
  const [alasan, setAlasan]       = useState("");
  const [touched, setTouched]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const isBlocked  = sep ? BLOCKED_STATUSES.includes(sep.statusInternal) : false;
  const alasanErr  = touched && alasan.trim().length < MIN_ALASAN
    ? `Min. ${MIN_ALASAN} karakter (${alasan.trim().length}/${MIN_ALASAN})`
    : null;

  async function handleConfirm() {
    setTouched(true);
    if (!sep || isBlocked || alasan.trim().length < MIN_ALASAN) return;
    setLoading(true);
    setModalError(null);
    try {
      await onConfirm(sep.noSEP, alasan.trim());
      setDone(true);
      onDeleted?.();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setAlasan("");
    setTouched(false);
    setDone(false);
    setModalError(null);
    onClose();
  }

  return (
    <AnimatePresence>
      {sep && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/60"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <Trash2 size={14} className="text-rose-600" strokeWidth={2.3} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">Hapus SEP</p>
                <p className="truncate font-mono text-xs text-slate-500">{sep.noSEP}</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {done ? (
                /* Success state */
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                    <CheckCircle size={22} className="text-emerald-500" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">SEP Berhasil Dihapus</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Penghapusan telah tercatat di audit trail V-Claim BPJS.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-1 rounded-xl bg-slate-100 px-5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    Tutup
                  </button>
                </div>
              ) : isBlocked ? (
                /* Blocked state */
                <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" strokeWidth={2} />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Tidak Dapat Dihapus</p>
                      <p className="mt-1 text-xs leading-relaxed text-amber-700">
                        SEP dengan status{" "}
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", statusChipCls(sep.statusInternal))}>
                          {sep.statusInternal}
                        </span>{" "}
                        tidak dapat dihapus. SEP Closed sudah memiliki data klaim atau sudah ada tanggal pulang.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Warning banner */}
                  <div className="mb-4 rounded-xl bg-rose-50 p-3.5 ring-1 ring-rose-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-rose-500" strokeWidth={2} />
                      <p className="text-xs leading-relaxed text-rose-700">
                        Tindakan ini <span className="font-bold">tidak dapat dibatalkan</span> dan akan tercatat di audit trail BPJS (UU PDP 27/2022). Pastikan tidak ada klaim aktif yang terhubung ke SEP ini.
                      </p>
                    </div>
                  </div>

                  {/* SEP summary */}
                  <div className="mb-4 rounded-xl border border-slate-200/60 bg-slate-50/50 px-3.5 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600">
                        {sep.diagAwal} · {sep.diagAwalNama ?? "—"}
                      </p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", statusChipCls(sep.statusInternal))}>
                        {sep.statusInternal}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-400">{sep.noKartu}</p>
                  </div>

                  {/* Alasan textarea */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-600">Alasan Penghapusan</label>
                      <span className={cn(
                        "text-xs tabular-nums",
                        alasan.trim().length >= MIN_ALASAN ? "text-emerald-500" : "text-slate-400",
                      )}>
                        {alasan.trim().length}/{MIN_ALASAN}+
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={alasan}
                      placeholder="Tuliskan alasan penghapusan SEP ini (wajib min. 20 karakter)…"
                      onChange={(e) => setAlasan(e.target.value)}
                      onBlur={() => setTouched(true)}
                      className={cn(
                        "w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 transition-all focus:outline-none focus:ring-2",
                        alasanErr
                          ? "border-rose-300 bg-rose-50/30 focus:ring-rose-100"
                          : "border-slate-200 bg-white focus:border-rose-300 focus:ring-rose-100",
                      )}
                    />
                    <AnimatePresence mode="wait">
                      {alasanErr && (
                        <motion.p
                          key="err"
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.14 }}
                          className="mt-1 text-xs font-medium text-rose-500"
                        >
                          {alasanErr}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* API error */}
                  {modalError && (
                    <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200">
                      {modalError}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!done && !isBlocked && (
              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 px-5 py-3.5">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  Batal
                </button>
                <motion.button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading || (touched && !!alasanErr)}
                  whileTap={!loading ? { scale: 0.97 } : undefined}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-rose-200/60 transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? <><Loader2 size={12} className="animate-spin" />Menghapus…</>
                    : <><Trash2 size={12} strokeWidth={2.3} />Hapus SEP</>
                  }
                </motion.button>
              </div>
            )}

            {!done && isBlocked && (
              <div className="flex justify-end border-t border-slate-100 px-5 py-3.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Tutup
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
