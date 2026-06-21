"use client";

// Pemilih dokter validator — listbox kustom (bukan <select> default). Avatar inisial + profesi,
// popover beranimasi, klik-luar/Escape menutup. Sumber = dokter ter-assign Lab (SDM Assignment).
// Aksen sky→indigo (selaras modul Lab; bukan ungu).

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Stethoscope, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabPetugasDTO } from "@/lib/api/lab/labRoster";

/** Inisial dari nama tampil (abaikan gelar ber-titik mis. "dr."/"Sp.PK"). */
function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const real = words.filter((w) => !w.includes("."));
  const pick = (real.length ? real : words).slice(0, 2);
  return pick.map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

interface Props {
  doctors: LabPetugasDTO[];
  value: string;                       // pegawaiId terpilih
  onChange: (pegawaiId: string) => void;
  disabled?: boolean;
  /** bypass (superuser/global) → boleh kosong, placeholder beda. */
  optional?: boolean;
}

export default function ValidatorPicker({ doctors, value, onChange, disabled, optional }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = doctors.find((d) => d.pegawaiId === value);

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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left transition-all",
          open ? "border-sky-400 ring-2 ring-sky-100" : "border-slate-200 hover:border-sky-300",
          disabled && "cursor-not-allowed opacity-60 hover:border-slate-200",
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold text-white shadow-sm",
            selected ? "bg-gradient-to-br from-sky-500 to-indigo-500" : "bg-slate-300",
          )}
        >
          {selected ? initials(selected.namaTampil) : <UserRound size={16} />}
        </span>
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block truncate text-[13px] font-bold text-slate-800">{selected.namaTampil}</span>
              <span className="block truncate text-[11px] text-slate-400">{selected.profesi ?? "Dokter"}</span>
            </>
          ) : (
            <span className="text-[13px] text-slate-400">
              {optional ? "Pilih dokter (opsional)…" : "Pilih dokter validator…"}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={cn("shrink-0 text-slate-400 transition-transform duration-200", open && "rotate-180 text-sky-500")}
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
                <Stethoscope size={11} className="text-sky-500" />
                Dokter ditugaskan ke Laboratorium
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto p-1.5">
              {doctors.length === 0 ? (
                <div className="px-3 py-6 text-center text-[12px] text-slate-400">
                  Belum ada dokter ter-assign ke Laboratorium.
                </div>
              ) : (
                doctors.map((d, i) => {
                  const active = d.pegawaiId === value;
                  return (
                    <motion.button
                      key={d.pegawaiId}
                      type="button"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.15 }}
                      onClick={() => { onChange(d.pegawaiId); setOpen(false); }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                        active ? "bg-sky-50 ring-1 ring-sky-200" : "hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white",
                          active ? "bg-gradient-to-br from-sky-500 to-indigo-500" : "bg-slate-300",
                        )}
                      >
                        {initials(d.namaTampil)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-semibold text-slate-800">{d.namaTampil}</span>
                        <span className="block truncate text-[10.5px] text-slate-400">{d.profesi ?? "Dokter"}</span>
                      </span>
                      {active && <Check size={15} className="shrink-0 text-sky-600" />}
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
