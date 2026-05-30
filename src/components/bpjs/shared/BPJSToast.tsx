"use client";

/**
 * BPJS Toast Container (BP8.3).
 * Fixed bottom-right stack, max 3 visible. Auto-dismiss + manual dismiss.
 */

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getToasts,
  subscribeToasts,
  dismissToast,
  type BPJSToastItem,
  type BPJSToastType,
} from "@/lib/bpjs/bpjsToastStore";

const EMPTY_TOASTS: BPJSToastItem[] = [];

const TYPE_CFG: Record<
  BPJSToastType,
  { bg: string; border: string; text: string; icon: React.ElementType }
> = {
  success: {
    bg: "bg-white", border: "border-emerald-300", text: "text-emerald-700",
    icon: CheckCircle2,
  },
  error: {
    bg: "bg-white", border: "border-rose-300", text: "text-rose-700",
    icon: XCircle,
  },
  warning: {
    bg: "bg-white", border: "border-amber-300", text: "text-amber-700",
    icon: AlertCircle,
  },
  info: {
    bg: "bg-white", border: "border-sky-300", text: "text-sky-700",
    icon: Info,
  },
};

export default function BPJSToastContainer() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, () => EMPTY_TOASTS);

  return (
    <div
      aria-live="polite"
      aria-label="Notifikasi BPJS"
      className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const cfg = TYPE_CFG[toast.type];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 48, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={cn(
                "pointer-events-auto flex w-80 items-start gap-3 rounded-2xl border p-3.5 shadow-lg",
                cfg.bg, cfg.border,
              )}
            >
              <Icon size={16} className={cn("mt-0.5 shrink-0", cfg.text)} />

              <div className="min-w-0 flex-1">
                <p className={cn("text-[12px] font-semibold leading-tight", cfg.text)}>
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                aria-label="Tutup notifikasi"
              >
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
