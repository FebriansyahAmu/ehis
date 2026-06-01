"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { WizardStep } from "./config";

/** Stepper horizontal dinamis (jumlah step bisa berubah saat penjamin BPJS/non-BPJS). */
export function WizardStepper({ steps, currentIdx }: { steps: WizardStep[]; currentIdx: number }) {
  return (
    <div className="flex items-start px-1">
      {steps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.id} className="flex flex-1 flex-col items-center">
            <div className="relative flex w-full items-center">
              {i > 0 && (
                <div className={cn("h-0.5 flex-1 rounded-full transition-colors duration-500",
                  done ? "bg-emerald-400" : active ? "bg-emerald-200" : "bg-slate-200")} />
              )}
              <motion.div
                animate={{
                  scale: active ? 1.15 : 1,
                  backgroundColor: done ? "#10b981" : active ? "#ffffff" : "#f8fafc",
                  borderColor: done || active ? "#10b981" : "#e2e8f0",
                  boxShadow: active ? "0 0 0 5px rgba(16,185,129,0.12)" : "none",
                }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2"
              >
                {done ? (
                  <Check size={11} className="text-white" />
                ) : (
                  <span className={cn("text-[10px] font-bold", active ? "text-emerald-600" : "text-slate-300")}>
                    {i + 1}
                  </span>
                )}
              </motion.div>
              {i < steps.length - 1 && (
                <div className={cn("h-0.5 flex-1 rounded-full transition-colors duration-500",
                  done ? "bg-emerald-400" : "bg-slate-200")} />
              )}
            </div>
            <motion.p
              animate={{ color: active ? "#059669" : done ? "#34d399" : "#cbd5e1" }}
              transition={{ duration: 0.25 }}
              className="mt-1.5 text-center text-[9px] font-bold uppercase tracking-wider"
            >
              {s.label}
            </motion.p>
          </div>
        );
      })}
    </div>
  );
}
