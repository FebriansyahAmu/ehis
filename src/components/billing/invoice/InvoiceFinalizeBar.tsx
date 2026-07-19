"use client";

// InvoiceFinalizeBar — strip lifecycle finalisasi tagihan (Slice 2f), di antara banner & tab detail.
// Draft = charge = proyeksi order (bisa berubah) → tombol "Finalisasi Tagihan" (bekukan snapshot).
// Final = charge BEKU → pill hijau (oleh siapa/kapan) + "Batalkan Finalisasi" (reopen, alasan wajib).
// Aksi = gate billing.invoice:update. Finalize dgn item belum bertarif → modal konfirmasi (force).

import { useState } from "react";
import { CheckCircle2, Lock, Undo2, AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  lifecycle: "Draft" | "Final";
  finalizedAt: string | null;
  finalizedBy: string | null;
  untariffedCount: number;
  subtotal: number;
  canManage: boolean;
  busy: boolean;
  errorMsg: string | null;
  onFinalize: (force: boolean) => void;
  onReopen: (alasan: string) => void;
}

export default function InvoiceFinalizeBar({
  lifecycle, finalizedAt, finalizedBy, untariffedCount, subtotal,
  canManage, busy, errorMsg, onFinalize, onReopen,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [alasan, setAlasan] = useState("");

  const isFinal = lifecycle === "Final";
  const nothingToBill = subtotal <= 0;

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b px-6 py-2",
          isFinal
            ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20"
            : "border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40",
        )}
      >
        {isFinal ? (
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-emerald-800 dark:text-emerald-300">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
              <Lock size={11} /> FINAL
            </span>
            <span className="font-medium">Tagihan difinalisasi — charge dibekukan.</span>
            {(finalizedBy || finalizedAt) && (
              <span className="text-emerald-700/80 dark:text-emerald-400/70">
                {finalizedBy ? `oleh ${finalizedBy}` : ""}{finalizedBy && finalizedAt ? " · " : ""}
                {finalizedAt ? fmtWaktu(finalizedAt) : ""}
              </span>
            )}
          </span>
        ) : (
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
              DRAFT
            </span>
            <span className="font-medium">Charge mengikuti order (masih dapat berubah).</span>
            {untariffedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <AlertTriangle size={12} /> {untariffedCount} item belum bertarif
              </span>
            )}
          </span>
        )}

        <div className="flex items-center gap-2">
          {errorMsg && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600">
              <AlertTriangle size={12} /> {errorMsg}
            </span>
          )}
          {canManage && (
            isFinal ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => { setAlasan(""); setReopenOpen(true); }}
                className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-rose-700 transition-all hover:bg-rose-50 active:scale-[0.97] disabled:opacity-50 dark:border-rose-900/50 dark:bg-slate-900 dark:text-rose-400"
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <Undo2 size={12} />}
                Batalkan Finalisasi
              </button>
            ) : (
              <button
                type="button"
                disabled={busy || nothingToBill}
                title={nothingToBill ? "Belum ada tagihan untuk difinalisasi" : undefined}
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1 text-[11.5px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                Finalisasi Tagihan
              </button>
            )
          )}
        </div>
      </div>

      {/* Modal konfirmasi finalisasi */}
      {confirmOpen && (
        <Modal onClose={() => setConfirmOpen(false)} accent="emerald" title="Finalisasi Tagihan" icon={Lock}>
          <p className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
            Charge akan <b>dibekukan</b> (snapshot). Setelah final, penyesuaian tak dapat diubah
            hingga finalisasi dibatalkan. Pembayaran tetap dapat diproses.
          </p>
          {untariffedCount > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertTriangle size={14} className="mt-0.5 flex-none" />
              <span>
                Ada <b>{untariffedCount} item belum bertarif</b> (Rp0). Item ini akan ikut dibekukan
                dengan harga Rp0 — pastikan tarif sudah benar sebelum lanjut.
              </span>
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => { setConfirmOpen(false); onFinalize(untariffedCount > 0); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 size={13} /> Ya, Finalisasi
            </button>
          </div>
        </Modal>
      )}

      {/* Modal batalkan finalisasi (reopen) */}
      {reopenOpen && (
        <Modal onClose={() => setReopenOpen(false)} accent="rose" title="Batalkan Finalisasi" icon={Undo2}>
          <p className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
            Snapshot charge akan dibuang dan tagihan kembali <b>Draft</b> (mengikuti order).
            Pembayaran yang sudah tercatat tetap dipertahankan.
          </p>
          <label className="mt-3 block text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">
            Alasan pembatalan <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            rows={3}
            autoFocus
            placeholder="mis. koreksi tarif akomodasi / order lab menyusul"
            className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] text-slate-700 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReopenOpen(false)}
              className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={busy || !alasan.trim()}
              onClick={() => { setReopenOpen(false); onReopen(alasan.trim()); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Undo2 size={13} /> Batalkan Finalisasi
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Modal ringan (portal-free, overlay penuh) ───────────────────────────────
function Modal({
  children, onClose, title, icon: Icon, accent,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: "emerald" | "rose";
}) {
  const accentCls = accent === "emerald" ? "text-emerald-600" : "text-rose-600";
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 text-[14px] font-bold text-slate-800 dark:text-slate-100">
            <Icon size={16} className={accentCls} /> {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function fmtWaktu(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
