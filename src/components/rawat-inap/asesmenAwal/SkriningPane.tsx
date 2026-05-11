"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import GiziPane from "@/components/shared/asesmen/GiziPane";
import { type NyeriData, NRS_LABELS, KARAKTER_NYERI } from "./asesmenAwalShared";

// ── Primitives ────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}{required && <span className="ml-0.5 text-rose-400">*</span>}
    </p>
  );
}

function Block({ title, badge, children }: { title?: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-2.5">
          <span className="text-xs font-semibold text-slate-700">{title}</span>
          {badge && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">{badge}</span>}
        </div>
      )}
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </div>
  );
}

const INPUT_CLS = "h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50";

// ── NRS Pain scale ────────────────────────────────────────

function NRSScale({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {/* Scale bar */}
      <div className="flex gap-0.5">
        {Array.from({ length: 11 }, (_, i) => {
          const lbl = NRS_LABELS[i];
          const selected = value === i;
          const isHighRisk = i >= 7;
          const isMid = i >= 4;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={cn(
                "relative flex-1 rounded-md py-3 text-xs font-bold transition-all",
                selected
                  ? isHighRisk ? "bg-rose-500 text-white shadow-sm scale-110"
                    : isMid ? "bg-amber-500 text-white shadow-sm scale-110"
                    : "bg-emerald-500 text-white shadow-sm scale-110"
                  : isHighRisk ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : isMid ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
              )}
            >
              {i}
            </button>
          );
        })}
      </div>

      {/* Labels below */}
      <div className="flex justify-between px-0.5 text-[9px] text-slate-400">
        <span>Tidak Nyeri</span>
        <span>Nyeri Sedang</span>
        <span>Nyeri Maksimal</span>
      </div>

      {/* Selected result */}
      <AnimatePresence mode="wait">
        {value !== null && (
          <motion.div
            key={value}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={cn("flex items-center justify-between rounded-lg border px-3 py-2", NRS_LABELS[value].cls)}
          >
            <span className="text-xs font-bold">NRS {value} — {NRS_LABELS[value].label}</span>
            {value >= 7 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-200">
                Nyeri Berat — Intervensi Segera
              </span>
            )}
            {value >= 4 && value < 7 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                Nyeri Sedang — Monitor Ketat
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────

interface SkriningPaneProps {
  onGiziComplete?: (done: boolean) => void;
  onNyeriComplete?: (done: boolean) => void;
}

// ── Main component ────────────────────────────────────────

export default function SkriningPane({ onGiziComplete, onNyeriComplete }: SkriningPaneProps) {
  const [nyeri, setNyeri] = useState<NyeriData>({
    nrs: null, lokasi: "", karakter: "", durasi: "", pemberat: "", peringan: "",
  });

  const setN = <K extends keyof NyeriData>(k: K, v: NyeriData[K]) => {
    const updated = { ...nyeri, [k]: v };
    setNyeri(updated);
    const done = updated.nrs !== null;
    onNyeriComplete?.(done);
  };

  const toggleKarakter = (k: string) => {
    const val = nyeri.karakter;
    const arr = val ? val.split(", ").filter(Boolean) : [];
    const updated = arr.includes(k) ? arr.filter(x => x !== k) : [...arr, k];
    setN("karakter", updated.join(", "));
  };

  const karakterArr = nyeri.karakter ? nyeri.karakter.split(", ").filter(Boolean) : [];

  return (
    <div className="flex flex-col gap-4">

      {/* MUST Skrining Gizi */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white px-4 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Skrining Gizi Awal (MUST)</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">SNARS AP 1.3</span>
          </div>
        </div>
        <div className="p-4">
          <GiziPane onComplete={onGiziComplete} />
        </div>
      </div>

      {/* Asesmen Nyeri Terstruktur */}
      <Block title="Asesmen Nyeri Terstruktur" badge="SNARS AP 1.2">
        <p className="text-[11px] text-slate-400">
          Nilai nyeri awal saat masuk. Monitoring nyeri lanjutan ada di lembar TTV setiap shift.
        </p>

        <div>
          <Label required>Skala Nyeri (NRS 0–10)</Label>
          <NRSScale value={nyeri.nrs} onChange={v => setN("nrs", v)} />
        </div>

        <AnimatePresence>
          {nyeri.nrs !== null && nyeri.nrs > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 pt-1">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Lokasi Nyeri</Label>
                    <input value={nyeri.lokasi} onChange={e => setN("lokasi", e.target.value)}
                      placeholder="Dada, perut kanan atas, kepala..."
                      className={INPUT_CLS} />
                  </div>
                  <div>
                    <Label>Durasi / Frekuensi</Label>
                    <input value={nyeri.durasi} onChange={e => setN("durasi", e.target.value)}
                      placeholder="Terus-menerus, hilang timbul, ± 2 jam..."
                      className={INPUT_CLS} />
                  </div>
                </div>

                <div>
                  <Label>Karakter / Kualitas Nyeri</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {KARAKTER_NYERI.map(k => {
                      const sel = karakterArr.includes(k);
                      return (
                        <button key={k} type="button" onClick={() => toggleKarakter(k)}
                          className={cn(
                            "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                            sel ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-500 hover:bg-indigo-50/40",
                          )}>
                          {k}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Faktor Pemberat</Label>
                    <input value={nyeri.pemberat} onChange={e => setN("pemberat", e.target.value)}
                      placeholder="Aktivitas, bergerak, makan..."
                      className={INPUT_CLS} />
                  </div>
                  <div>
                    <Label>Faktor Peringan</Label>
                    <input value={nyeri.peringan} onChange={e => setN("peringan", e.target.value)}
                      placeholder="Istirahat, obat, posisi tertentu..."
                      className={INPUT_CLS} />
                  </div>
                </div>

                {nyeri.nrs >= 4 && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5"
                  >
                    <p className="text-[11px] font-semibold text-amber-800">
                      ⚠ Nyeri {nyeri.nrs >= 7 ? "Berat" : "Sedang"} — Dokumentasikan di CPPT dan rencanakan intervensi analgesia.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end">
          <button type="button"
            className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700">
            Simpan Asesmen Nyeri
          </button>
        </div>
      </Block>

    </div>
  );
}
