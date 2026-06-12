"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, ChevronDown, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ObatRecord } from "@/lib/master/obatMock";
import { buildFhirMedication } from "./kfaMapHelpers";

interface Props {
  obat: ObatRecord;
}

/**
 * Pratinjau resource FHIR `Medication` yang dihasilkan dari mapping KFA —
 * konkretkan tujuan interop SatuSehat. Collapsible + tombol salin JSON.
 */
export default function KfaFhirPreview({ obat }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const json = useMemo(
    () => JSON.stringify(buildFhirMedication(obat, obat.kfa ?? { zatAktif: [] }), null, 2),
    [obat],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard tak tersedia — abaikan */
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-slate-50"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-white">
          <Code2 size={12} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-700">
            Pratinjau FHIR · Medication
          </span>
          <span className="block text-[10px] text-slate-400">
            Struktur yang dikirim ke SatuSehat dari mapping ini
          </span>
        </span>
        <ChevronDown
          size={15}
          className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-slate-100"
          >
            <div className="relative">
              <button
                type="button"
                onClick={copy}
                className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/90 px-2 py-1 text-[10px] font-semibold text-slate-100 backdrop-blur transition hover:bg-slate-700"
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? "Tersalin" : "Salin"}
              </button>
              <pre className="max-h-72 overflow-auto bg-slate-900 px-3 py-2.5 text-[11px] leading-relaxed text-slate-100">
                <code className="font-mono">{json}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
