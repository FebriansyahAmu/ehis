"use client";

// Toast viewport global — stack di KANAN ATAS (top-4 right-4). Di-mount sekali di
// root layout. Auto-dismiss + tombol tutup. aria-live untuk a11y.

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getToasts,
  subscribeToasts,
  dismissToast,
  type ToastItem,
  type ToastType,
} from "@/lib/ui/toastStore";

const EMPTY: ToastItem[] = [];

const TYPE_CFG: Record<ToastType, { border: string; text: string; icon: React.ElementType }> = {
  success: { border: "border-emerald-300", text: "text-emerald-700", icon: CheckCircle2 },
  error: { border: "border-rose-300", text: "text-rose-700", icon: XCircle },
  warning: { border: "border-amber-300", text: "text-amber-700", icon: AlertCircle },
  info: { border: "border-sky-300", text: "text-sky-700", icon: Info },
};

export default function ToastViewport() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, () => EMPTY);

  return (
    <div
      aria-live="polite"
      aria-label="Notifikasi"
      className="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const cfg = TYPE_CFG[t.type];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 48, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={cn(
                "pointer-events-auto flex w-80 items-start gap-3 rounded-2xl border bg-white p-3.5 shadow-lg",
                cfg.border,
              )}
            >
              <Icon size={16} className={cn("mt-0.5 shrink-0", cfg.text)} />
              <div className="min-w-0 flex-1">
                <p className={cn("text-[12px] font-semibold leading-tight", cfg.text)}>{t.title}</p>
                {t.message && <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{t.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
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
