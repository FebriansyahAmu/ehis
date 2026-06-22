"use client";

// Timeline status order (vertikal) — tahapan lifecycle per-jenis (Resep/Lab) bila ada status DB,
// else tahapan generik. Stage pertama menampilkan waktu order (createdAt). Order Dibatalkan/Ditolak
// → kartu terminal. Dipakai di detail OrderRow (Daftar Order).

import { motion } from "framer-motion";
import { Check, Ban, GitCommitVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildOrderTimeline, orderCreatedLabel, type Order } from "./daftarOrderShared";

export function OrderTimeline({ order }: { order: Order }) {
  const { stages, cancelled, cancelLabel } = buildOrderTimeline(order);
  const createdLabel = orderCreatedLabel(order);

  if (cancelled) {
    return (
      <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <Ban size={12} />
        </span>
        <div>
          <p className="text-[12px] font-bold text-rose-700">Order {cancelLabel}</p>
          <p className="text-[10px] text-rose-400">Proses dihentikan — tidak dilanjutkan.</p>
          {createdLabel && <p className="mt-0.5 text-[10px] text-slate-400">Diorder: {createdLabel}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-slate-100 bg-white/70 px-3 py-2.5">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        <GitCommitVertical size={11} className="text-slate-400" />
        Timeline Status
      </p>
      <ol className="relative">
        {stages.map((s, i) => {
          const isLast = i === stages.length - 1;
          return (
            <li key={s.label} className="relative flex gap-3 pb-3 last:pb-0">
              {/* connector */}
              {!isLast && (
                <span
                  className={cn(
                    "absolute left-[8px] top-5 -bottom-0 w-px",
                    s.state === "done" ? "bg-indigo-300" : "bg-slate-200",
                  )}
                />
              )}
              {/* node */}
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05, duration: 0.18 }}
                className={cn(
                  "relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                  s.state === "done"
                    ? "bg-indigo-600 text-white"
                    : s.state === "current"
                      ? "bg-white ring-2 ring-indigo-400"
                      : "bg-white ring-1 ring-slate-200",
                )}
              >
                {s.state === "done" ? (
                  <Check size={9} strokeWidth={3} />
                ) : s.state === "current" ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                )}
              </motion.span>
              {/* label */}
              <div className="min-w-0 flex-1 pt-px">
                <p
                  className={cn(
                    "text-[12px] leading-tight",
                    s.state === "pending" ? "text-slate-400" : "font-semibold text-slate-700",
                    s.state === "current" && "text-indigo-700",
                  )}
                >
                  {s.label}
                </p>
                {i === 0 && createdLabel && (
                  <p className="mt-0.5 text-[10px] text-slate-400">{createdLabel}</p>
                )}
                {s.state === "current" && (
                  <p className="mt-0.5 text-[10px] font-medium text-indigo-500">Sedang berjalan…</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
