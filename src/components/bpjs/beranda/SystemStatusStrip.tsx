"use client";

/**
 * SystemStatusStrip — compact pill badges for the dark dashboard header.
 * V-Claim · Aplicares · LZ-String with animated ping dot.
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  fmtAgo,
  getSystemStatuses,
  type SystemServiceStatus,
} from "./berandaBPJSShared";

const HEALTH_LABEL: Record<SystemServiceStatus["health"], string> = {
  online:   "Online",
  degraded: "Degraded",
  offline:  "Offline",
};

const HEALTH_CLS: Record<
  SystemServiceStatus["health"],
  { dot: string; text: string; ring: string; bg: string }
> = {
  online:   { dot: "bg-emerald-500", text: "text-emerald-700", ring: "ring-emerald-200", bg: "bg-emerald-50" },
  degraded: { dot: "bg-amber-500",   text: "text-amber-700",   ring: "ring-amber-200",   bg: "bg-amber-50"   },
  offline:  { dot: "bg-rose-500",    text: "text-rose-700",    ring: "ring-rose-200",    bg: "bg-rose-50"    },
};

function ServicePill({ svc, index }: { svc: SystemServiceStatus; index: number }) {
  const cls = HEALTH_CLS[svc.health];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: 0.08 + index * 0.07 }}
      title={`${svc.label} · ${HEALTH_LABEL[svc.health]} · ${svc.hint} · Sync ${fmtAgo(svc.lastSyncAgoSec)} lalu`}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1",
        cls.bg,
        cls.ring,
      )}
    >
      {/* Animated dot */}
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {svc.health !== "offline" && (
          <span
            className={cn(
              "absolute inset-0 animate-ping rounded-full opacity-60",
              cls.dot,
            )}
          />
        )}
        <span className={cn("relative h-1.5 w-1.5 rounded-full", cls.dot)} />
      </span>

      <span className="text-xs font-medium text-slate-600">{svc.label}</span>
      <span className={cn("text-xs font-semibold", cls.text)}>
        {HEALTH_LABEL[svc.health]}
      </span>
    </motion.div>
  );
}

export default function SystemStatusStrip() {
  const services = getSystemStatuses();
  return (
    <div className="hidden items-center gap-1.5 sm:flex" aria-label="Status Sistem">
      {services.map((svc, i) => (
        <ServicePill key={svc.key} svc={svc} index={i} />
      ))}
    </div>
  );
}
