"use client";

import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubpageConfig } from "./mappingShared";

interface ComingSoonPaneProps {
  config: SubpageConfig;
}

export default function ComingSoonPane({ config }: ComingSoonPaneProps) {
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-full flex-col items-center justify-center px-6 py-12 text-center"
    >
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl ring-4",
          config.accent.bg,
          config.accent.text,
          config.accent.ring,
        )}
      >
        <Icon size={26} />
      </motion.span>

      <div className="mt-4 max-w-md">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 m-tiny font-bold uppercase tracking-wider text-slate-500">
          <Clock size={9} />
          Segera Hadir
        </span>
        <h2 className="mt-2.5 m-lg font-bold text-slate-900">{config.label}</h2>
        <p className="mt-1.5 m-xs leading-relaxed text-slate-500">
          {config.desc}
        </p>
      </div>

      {config.dependsOn && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5"
        >
          <span className="m-tiny font-semibold uppercase tracking-wide text-slate-500">
            Dependency
          </span>
          <ArrowRight size={11} className="text-slate-400" />
          <span className="m-xs font-semibold text-slate-700">
            {config.dependsOn}
          </span>
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="mt-6 max-w-xs m-tiny leading-relaxed text-slate-400"
      >
        Modul ini akan dibuka setelah master data prasyarat tersedia.
        Sementara, fokus pada SDM Assignment yang sudah aktif.
      </motion.p>
    </motion.div>
  );
}
