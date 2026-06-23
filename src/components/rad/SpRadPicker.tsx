"use client";

// Combobox radiolog (SpRad) penanda tangan — ketik untuk menyaring, pilih dari daftar dokter
// ter-assign ke Radiologi (SDM Assignment, via useRadRoster.doctors). Teks bebas tetap boleh
// (otorisasi penanda tangan ditegakkan server pada aktor login), tapi saran memandu ke dokter
// ter-assign. Aksen teal (modul Rad). Pola listbox selaras ValidatorPicker, tapi dengan input ketik.

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RadPetugasDTO } from "@/lib/api/rad/radRoster";

interface Props {
  doctors: RadPetugasDTO[];
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}

export default function SpRadPicker({
  doctors, value, onChange, disabled, loading, placeholder = "Ketik / pilih nama radiolog…",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d) => d.namaTampil.toLowerCase().includes(q));
  }, [doctors, value]);

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

  const matchExact = doctors.some((d) => d.namaTampil === value && value.trim() !== "");

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-slate-50 px-3 transition-all",
          open ? "border-teal-400 bg-white ring-2 ring-teal-100" : "border-slate-200 hover:border-teal-300",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <Stethoscope size={14} className={cn("shrink-0", matchExact ? "text-teal-500" : "text-slate-400")} />
        <input
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(e) => { onChange(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 text-slate-400"
          aria-label="Tampilkan daftar radiolog"
        >
          <ChevronDown size={16} className={cn("transition-transform duration-200", open && "rotate-180 text-teal-500")} />
        </button>
      </div>

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
                <Stethoscope size={11} className="text-teal-500" />
                Radiolog ditugaskan ke Radiologi
              </p>
            </div>
            <div className="max-h-56 overflow-y-auto p-1.5">
              {loading ? (
                <div className="px-3 py-6 text-center text-[12px] text-slate-400">Memuat…</div>
              ) : filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-[12px] text-slate-400">
                  {doctors.length === 0
                    ? "Belum ada radiolog ter-assign ke Radiologi."
                    : "Tidak ada yang cocok — gunakan teks yang diketik."}
                </div>
              ) : (
                filtered.map((d, i) => {
                  const active = d.namaTampil === value;
                  return (
                    <motion.button
                      key={d.pegawaiId}
                      type="button"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.15 }}
                      onClick={() => { onChange(d.namaTampil); setOpen(false); }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                        active ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-slate-50",
                      )}
                    >
                      <span className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white",
                        active ? "bg-gradient-to-br from-teal-500 to-emerald-500" : "bg-slate-300",
                      )}>
                        {d.namaTampil.split(/\s+/).filter((w) => !w.includes(".")).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-semibold text-slate-800">{d.namaTampil}</span>
                        <span className="block truncate text-[10.5px] text-slate-400">{d.profesi ?? "Dokter"}</span>
                      </span>
                      {active && <Check size={15} className="shrink-0 text-teal-600" />}
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
