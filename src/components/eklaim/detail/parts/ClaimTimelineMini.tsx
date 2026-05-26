"use client";

/**
 * ClaimTimelineMini — horizontal pipeline 5-stage mini untuk banner header (EK3.1).
 *
 * Visual:
 *   ● Koding ──── ● Verif RS ──── ◌ Submit ──── ◌ Verif BPJS ──── ◌ Selesai
 *
 * State per stage:
 * - `done`   → solid teal node + check icon (✓)
 * - `active` → ringed pulse teal/sky + stage icon (current step)
 * - `idle`   → muted slate outline + stage icon
 * - `error`  → solid rose node + alert icon
 *
 * Connector line antar node berubah warna sesuai stage transition.
 */

import { motion } from "framer-motion";
import { Check, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  TIMELINE_STAGES,
  resolveStageStates,
  type StageState,
} from "../claimDetailShared";
import type { ClaimStatus } from "@/lib/eklaim/eklaimShared";

interface Props {
  status: ClaimStatus;
  /** Layout horizontal full-width (true) atau compact (false untuk mobile). */
  className?: string;
}

interface NodeStyle {
  bg: string;
  ring: string;
  text: string;
  pulse?: boolean;
}

const NODE_STYLE: Record<StageState, NodeStyle> = {
  done: {
    bg: "bg-teal-500",
    ring: "ring-teal-200",
    text: "text-white",
  },
  active: {
    bg: "bg-sky-500",
    ring: "ring-sky-300",
    text: "text-white",
    pulse: true,
  },
  idle: {
    bg: "bg-white",
    ring: "ring-slate-200",
    text: "text-slate-400",
  },
  error: {
    bg: "bg-rose-500",
    ring: "ring-rose-200",
    text: "text-white",
  },
};

const LABEL_STYLE: Record<StageState, string> = {
  done: "text-teal-700",
  active: "text-sky-700",
  idle: "text-slate-400",
  error: "text-rose-700",
};

export default function ClaimTimelineMini({ status, className }: Props) {
  const states = resolveStageStates(status);

  return (
    <ol
      aria-label="Tahapan klaim"
      className={cn(
        "flex w-full items-center justify-between gap-1",
        className,
      )}
    >
      {TIMELINE_STAGES.map((stage, idx) => {
        const state = states[stage.key];
        const nextState = idx < TIMELINE_STAGES.length - 1
          ? states[TIMELINE_STAGES[idx + 1].key]
          : null;
        const style = NODE_STYLE[state];
        const labelStyle = LABEL_STYLE[state];
        const Icon =
          state === "done" ? Check
            : state === "error" ? AlertTriangle
              : stage.icon;

        return (
          <li
            key={stage.key}
            className="flex min-w-0 flex-1 items-center"
            aria-current={state === "active" ? "step" : undefined}
          >
            {/* Node + label */}
            <div className="flex min-w-0 flex-col items-center gap-1">
              <motion.span
                initial={false}
                animate={{
                  scale: state === "active" ? [1, 1.06, 1] : 1,
                }}
                transition={
                  state === "active"
                    ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.25 }
                }
                className={cn(
                  "relative inline-flex h-6 w-6 items-center justify-center rounded-full ring-2 shadow-sm",
                  style.bg,
                  style.ring,
                  style.text,
                )}
                title={`${stage.label} · ${stateLabel(state)}`}
              >
                <Icon size={11} strokeWidth={2.6} />
                {style.pulse && (
                  <motion.span
                    className="absolute inset-0 rounded-full ring-2 ring-sky-400"
                    initial={{ opacity: 0.6, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.7 }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}
              </motion.span>
              <span
                className={cn(
                  "hidden whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-wider sm:inline",
                  labelStyle,
                )}
              >
                {stage.shortLabel}
              </span>
            </div>

            {/* Connector line ke node berikutnya */}
            {idx < TIMELINE_STAGES.length - 1 && (
              <div className="mx-1 flex-1">
                <ConnectorLine from={state} to={nextState ?? "idle"} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ── Connector Line ─────────────────────────────────────

function ConnectorLine({ from, to }: { from: StageState; to: StageState }) {
  // Connector "done" hanya jika both done (or `from` done && `to` active/done)
  const isFilled = from === "done" || from === "error";
  const fillClass =
    from === "error"
      ? "bg-rose-300"
      : to === "active"
        ? "bg-gradient-to-r from-teal-400 to-sky-400"
        : "bg-teal-300";

  return (
    <div className="relative h-0.5 w-full rounded-full bg-slate-200">
      <motion.div
        initial={false}
        animate={{ scaleX: isFilled ? 1 : 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ transformOrigin: "left" }}
        className={cn("h-full rounded-full", fillClass)}
      />
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────

function stateLabel(state: StageState): string {
  switch (state) {
    case "done":   return "selesai";
    case "active": return "sedang berjalan";
    case "error":  return "perlu perhatian";
    case "idle":   return "belum dicapai";
  }
}
