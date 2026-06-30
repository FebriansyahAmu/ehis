"use client";

// Picker "Template Cepat" anamnesis — shared IGD/RI/RJ. Menarik template dari DB master
// (GET /master/template-anamnesis-tersedia?modul=) sesuai context modul; klik → onApply(t)
// mengisi form. Single source = master.template_anamnesis (gantikan konstanta hardcode lama).
//
// Fetch saat mount (lazy-ringan; 1 request kecil). Loading/empty/error ditangani in-place —
// form anamnesis tetap berfungsi penuh meski template gagal dimuat.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FileText, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listAnamnesisTemplate, type AnamnesisTemplateDTO, type ModulContextDTO,
} from "@/lib/api/master/templateAnamnesisTersedia";

export type { AnamnesisTemplateDTO };

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";

export default function AnamnesisTemplatePicker({
  modul, onApply,
}: {
  modul: ModulContextDTO;
  onApply: (t: AnamnesisTemplateDTO) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AnamnesisTemplateDTO[] | null>(null);
  const [state, setState] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    const ac = new AbortController();
    listAnamnesisTemplate(modul, ac.signal)
      .then((rows) => { if (ac.signal.aborted) return; setItems(rows); setState("done"); })
      .catch((e) => { if (!isAbort(e) && !ac.signal.aborted) setState("error"); });
    return () => ac.abort();
  }, [modul]);

  const total = items?.length ?? 0;

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100">
        <Sparkles size={12} /> Template Cepat
        {state === "done" && total > 0 && (
          <span className="rounded-full bg-sky-100 px-1.5 text-[10px] font-bold text-sky-600">{total}</span>
        )}
        <ChevronDown size={11} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-8 z-20 max-h-80 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            {state === "loading" ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
                <Loader2 size={13} className="animate-spin text-sky-500" /> Memuat template…
              </div>
            ) : state === "error" ? (
              <div className="flex items-center gap-2 px-4 py-5 text-xs text-rose-600">
                <AlertCircle size={13} className="shrink-0" /> Gagal memuat template.
              </div>
            ) : !items || items.length === 0 ? (
              <div className="px-4 py-5 text-center text-xs text-slate-400">
                Belum ada template untuk modul ini.
              </div>
            ) : (
              items.map((t) => (
                <button key={t.id} type="button"
                  onClick={() => { onApply(t); setOpen(false); }}
                  className="flex w-full items-start gap-2.5 px-4 py-3 text-left text-xs transition hover:bg-sky-50 first:rounded-t-xl last:rounded-b-xl">
                  <FileText size={13} className="mt-0.5 shrink-0 text-sky-500" />
                  <span className="font-semibold text-slate-700">{t.label}</span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
