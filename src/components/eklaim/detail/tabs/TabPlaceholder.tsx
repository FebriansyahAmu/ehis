"use client";

/**
 * TabPlaceholder — reusable placeholder untuk tab yang belum diimplement (EK3.1).
 *
 * Saat fase EK3.2-EK3.6 selesai per tab, placeholder ini di-replace dengan
 * content asli. Pattern: setiap tab spesifik akan import komponennya sendiri
 * dari `tabs/<TabName>Tab.tsx`.
 *
 * Visual: card teal-tinted dengan icon + heading + bullet list "akan datang"
 * + estimasi fase + acceptance highlight.
 */

import { motion } from "framer-motion";
import { Sparkles, Check, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface Props {
  /** Tab icon (sama dengan tab nav). */
  icon: LucideIcon;
  /** Judul tab. */
  title: string;
  /** Fase EK3.x yang akan implement (e.g. "EK3.2"). */
  phase: string;
  /** Estimasi effort (e.g. "1 hari"). */
  effort: string;
  /** Penjelasan apa yang akan ada di tab ini saat selesai. */
  description: string;
  /** Daftar checkbox acceptance/feature yang akan ada. */
  bullets: ReadonlyArray<string>;
}

export default function TabPlaceholder({
  icon: Icon,
  title,
  phase,
  effort,
  description,
  bullets,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mx-auto w-full max-w-3xl rounded-xl border border-teal-100 bg-linear-to-br from-white via-white to-teal-50/40 p-6 shadow-sm ring-1 ring-teal-50"
    >
      {/* Header: icon + title + phase chip */}
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 ring-1 ring-teal-200">
          <Icon size={18} strokeWidth={2.2} className="text-teal-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
              Tab {title}
            </h2>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
              <Sparkles size={9} strokeWidth={2.6} />
              {phase}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              · {effort}
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
            {description}
          </p>
        </div>
      </div>

      {/* Bullets list */}
      <div className="mt-5 rounded-lg border border-slate-100 bg-white px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Yang akan dibangun
        </p>
        <ul className="mt-2 space-y-1.5">
          {bullets.map((b, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.05 + i * 0.03 }}
              className="flex items-start gap-2 text-[12.5px] text-slate-700"
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm",
                  "bg-slate-100 ring-1 ring-slate-200",
                )}
              >
                <Check size={9} strokeWidth={2.8} className="text-slate-400" />
              </span>
              <span>{b}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Footer hint */}
      <p className="mt-4 text-[11.5px] italic text-slate-400">
        EK3.1 menyiapkan kerangka — implementasi tab content menyusul pada fase {phase}.
      </p>
    </motion.div>
  );
}
