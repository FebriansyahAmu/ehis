"use client";

/**
 * CoderSignature — checkbox sign-off koder dengan timestamp audit trail.
 * Signing: emerald state. Unsigned: slate state. Reversible hingga submit.
 */

import { CheckCircle2, Clock, PenLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  coderName: string;
  isSigned: boolean;
  signedAt?: string;
  onSign: () => void;
  onUnsign: () => void;
  disabled?: boolean;
}

function fmtSignedAt(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CoderSignature({
  coderName,
  isSigned,
  signedAt,
  onSign,
  onUnsign,
  disabled,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3.5 transition-colors",
        isSigned
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-slate-200 bg-white",
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1",
            isSigned
              ? "bg-emerald-100 ring-emerald-200"
              : "bg-slate-100 ring-slate-200",
          )}
        >
          {isSigned ? (
            <CheckCircle2 size={14} strokeWidth={2.4} className="text-emerald-700" />
          ) : (
            <PenLine size={14} strokeWidth={2.2} className="text-slate-500" />
          )}
        </span>
        <div>
          <p
            className={cn(
              "text-[12.5px] font-semibold uppercase tracking-wide",
              isSigned ? "text-emerald-700" : "text-slate-500",
            )}
          >
            Tanda Tangan Coder
          </p>
          <p className="text-[11.5px] text-slate-400">
            Audit trail per UU PDP 27/2022 · wajib sebelum submit
          </p>
        </div>
      </div>

      {/* Checkbox row */}
      <label
        className={cn(
          "flex cursor-pointer select-none items-start gap-3 rounded-lg p-2.5 transition-colors",
          isSigned ? "bg-emerald-50" : "bg-slate-50 hover:bg-slate-100",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <input
          type="checkbox"
          checked={isSigned}
          onChange={(e) => {
            if (disabled) return;
            e.target.checked ? onSign() : onUnsign();
          }}
          className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
        />
        <span className="text-sm leading-snug text-slate-800">
          Saya,{" "}
          <span className="font-semibold text-slate-900">{coderName}</span>,
          menyatakan bahwa koding ICD-10-IM dan ICD-9-CM-IM pada klaim ini telah
          sesuai dengan Pedoman Pengodean iDRG 2025 Kemenkes dan kondisi klinis
          pasien. Koding ini{" "}
          <span className="font-semibold">final dan siap untuk disubmit</span>.
        </span>
      </label>

      {/* Signed state */}
      <AnimatePresence>
        {isSigned && signedAt && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-100/60 px-3 py-2">
              <CheckCircle2
                size={14}
                strokeWidth={2.4}
                className="shrink-0 text-emerald-700"
              />
              <span className="text-sm font-semibold text-emerald-800">
                Ditandatangani oleh {coderName}
              </span>
              <span className="flex items-center gap-1 text-[12.5px] text-emerald-700">
                <Clock size={11} strokeWidth={2} />
                {fmtSignedAt(signedAt)}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={onUnsign}
                  className="ml-auto rounded-md bg-white px-2 py-0.5 text-[12px] font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-rose-600"
                >
                  Batalkan
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
