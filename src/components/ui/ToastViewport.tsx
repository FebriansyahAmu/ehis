"use client";

// Toast viewport global — stack di KANAN ATAS (top-4 right-4). Di-mount sekali di
// root layout. Auto-dismiss + tombol tutup. aria-live untuk a11y.
//
// success = kartu hijau penuh (penegasan positif); error/warning/info = kartu putih
// dengan aksen warna (agar masalah tak membanjiri layar dengan warna pekat).

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

interface TypeCfg {
  card: string;
  icon: IconComponent;
  iconCls: string;
  titleCls: string;
  msgCls: string;
  closeCls: string;
}

const TYPE_CFG: Record<ToastType, TypeCfg> = {
  success: {
    card: "border-emerald-600 bg-emerald-600",
    icon: CheckCircle2,
    iconCls: "text-white",
    titleCls: "text-white",
    msgCls: "text-emerald-50/90",
    closeCls: "text-emerald-100 hover:bg-emerald-500 hover:text-white focus-visible:ring-emerald-300",
  },
  error: {
    card: "border-rose-300 bg-white",
    icon: XCircle,
    iconCls: "text-rose-600",
    titleCls: "text-rose-700",
    msgCls: "text-slate-500",
    closeCls: "text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-slate-300",
  },
  warning: {
    card: "border-amber-300 bg-white",
    icon: AlertCircle,
    iconCls: "text-amber-600",
    titleCls: "text-amber-700",
    msgCls: "text-slate-500",
    closeCls: "text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-slate-300",
  },
  info: {
    card: "border-sky-300 bg-white",
    icon: Info,
    iconCls: "text-sky-600",
    titleCls: "text-sky-700",
    msgCls: "text-slate-500",
    closeCls: "text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-slate-300",
  },
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
                "pointer-events-auto flex w-80 items-start gap-3 rounded-2xl border p-3.5 shadow-lg",
                cfg.card,
              )}
            >
              <Icon size={16} className={cn("mt-0.5 shrink-0", cfg.iconCls)} />
              <div className="min-w-0 flex-1">
                <p className={cn("text-[12px] font-semibold leading-tight", cfg.titleCls)}>{t.title}</p>
                {t.message && <p className={cn("mt-0.5 text-[11px] leading-snug", cfg.msgCls)}>{t.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className={cn(
                  "shrink-0 rounded-md p-0.5 transition focus-visible:outline-none focus-visible:ring-2",
                  cfg.closeCls,
                )}
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
