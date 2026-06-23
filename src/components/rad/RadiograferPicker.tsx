"use client";

// Pemilih radiografer pelaksana akuisisi — listbox kustom MULTI-select (bisa >1, DICOM Operators'
// Name VM 1-n). Sumber = petugas ter-assign Radiologi (SDM Assignment, via useRadRoster). Chip
// terpilih di trigger; toggle per baris. Aksen teal (selaras modul Rad; bukan ungu).

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Radiation, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RadPetugasDTO } from "@/lib/api/rad/radRoster";

/** Inisial dari nama tampil (abaikan gelar ber-titik mis. "AMR"/"S.Tr.Rad"). */
function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const real = words.filter((w) => !w.includes("."));
  const pick = (real.length ? real : words).slice(0, 2);
  return pick.map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

interface Props {
  petugas: RadPetugasDTO[];
  value: string[];                       // pegawaiId[] terpilih
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function RadiograferPicker({ petugas, value, onChange, disabled, loading }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = petugas.filter((p) => value.includes(p.pegawaiId));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-left transition-all",
          open ? "border-teal-400 ring-2 ring-teal-100" : "border-slate-200 hover:border-teal-300",
          disabled && "cursor-not-allowed opacity-60 hover:border-slate-200",
        )}
      >
        {selected.length === 0 ? (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-300 text-white">
              <UserRound size={16} />
            </span>
            <span className="flex-1 text-[13px] text-slate-400">
              {loading ? "Memuat petugas…" : "Pilih radiografer…"}
            </span>
          </>
        ) : (
          <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {selected.map((p) => (
              <span
                key={p.pegawaiId}
                className="flex items-center gap-1.5 rounded-lg bg-teal-50 py-1 pl-1.5 pr-1 text-[12px] font-semibold text-teal-800 ring-1 ring-teal-200"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br from-teal-500 to-emerald-500 text-[9px] font-bold text-white">
                  {initials(p.namaTampil)}
                </span>
                <span className="max-w-[140px] truncate">{p.namaTampil}</span>
                {!disabled && (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); toggle(p.pegawaiId); }}
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-teal-500 transition hover:bg-teal-200/60 hover:text-teal-700"
                    aria-label={`Hapus ${p.namaTampil}`}
                  >
                    <X size={11} />
                  </span>
                )}
              </span>
            ))}
          </span>
        )}
        <ChevronDown
          size={16}
          className={cn("shrink-0 text-slate-400 transition-transform duration-200", open && "rotate-180 text-teal-500")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40"
          >
            <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <Radiation size={11} className="text-teal-500" />
                Petugas ditugaskan ke Radiologi · bisa pilih lebih dari satu
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto p-1.5">
              {petugas.length === 0 ? (
                <div className="px-3 py-6 text-center text-[12px] text-slate-400">
                  {loading ? "Memuat…" : "Belum ada petugas ter-assign ke Radiologi."}
                </div>
              ) : (
                petugas.map((p, i) => {
                  const active = value.includes(p.pegawaiId);
                  return (
                    <motion.button
                      key={p.pegawaiId}
                      type="button"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.15 }}
                      onClick={() => toggle(p.pegawaiId)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                        active ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white",
                          active ? "bg-gradient-to-br from-teal-500 to-emerald-500" : "bg-slate-300",
                        )}
                      >
                        {initials(p.namaTampil)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-semibold text-slate-800">{p.namaTampil}</span>
                        <span className="block truncate text-[10.5px] text-slate-400">{p.profesi ?? "Radiografer"}</span>
                      </span>
                      <span className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition",
                        active ? "border-teal-500 bg-teal-500" : "border-slate-300",
                      )}>
                        {active && <Check size={12} className="text-white" />}
                      </span>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
