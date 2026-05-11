"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MUST_QUESTIONS, GIZI_RISK, getGiziRisk, type GiziScore, type GiziState } from "./asesmenShared";

// ── Props ─────────────────────────────────────────────────

interface GiziPaneProps {
  /** Called when all 3 MUST items have been answered */
  onComplete?: (done: boolean) => void;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{children}</p>;
}

// ── Main pane ─────────────────────────────────────────────

export default function GiziPane({ onComplete }: GiziPaneProps) {
  const [scores, setScores] = useState<GiziState>({ bmi: null, bb: null, akut: null });
  const [ahliGizi, setAhliGizi] = useState("");
  const [catatan, setCatatan] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [petugas, setPetugas] = useState("");

  const total     = Object.values(scores).reduce<number>((acc, v) => acc + (v ?? 0), 0);
  const allFilled = Object.values(scores).every(v => v !== null);
  const risk      = getGiziRisk(total, allFilled);

  function handleScore(key: keyof GiziState, score: GiziScore) {
    const updated = { ...scores, [key]: score };
    setScores(updated);
    const filled = Object.values(updated).every(v => v !== null);
    onComplete?.(filled);
  }

  const INPUT_CLS = "h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2">

        {/* MUST Questions */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-2.5">
            <span className="text-xs font-semibold text-slate-700">MUST — Malnutrition Universal Screening Tool</span>
          </div>
          <div className="flex flex-col gap-4 p-4">
            {MUST_QUESTIONS.map(q => (
              <div key={q.key}>
                <Label>{q.label}</Label>
                <div className="flex flex-col gap-1">
                  {q.options.map(opt => (
                    <button
                      key={opt.score}
                      type="button"
                      onClick={() => handleScore(q.key, opt.score)}
                      className={cn(
                        "flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs font-medium transition",
                        scores[q.key] === opt.score
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      <span>{opt.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{opt.hint}</span>
                        <span className={cn(
                          "ml-2 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold",
                          opt.score === 0 ? "bg-slate-100 text-slate-500"
                            : opt.score === 1 ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700",
                        )}>
                          Skor {opt.score}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: result + follow-up */}
        <div className="flex flex-col gap-3">

          {/* Score result */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-2.5">
              <span className="text-xs font-semibold text-slate-700">Hasil Skrining</span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Total Skor MUST</span>
                <span className={cn(
                  "rounded-lg border px-3 py-1 text-lg font-bold",
                  !allFilled ? "border-slate-200 bg-slate-50 text-slate-400"
                    : total === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : total === 1 ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-rose-200 bg-rose-50 text-rose-700",
                )}>
                  {total}
                </span>
              </div>

              {/* Visual bar */}
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className={cn(
                    "h-2 flex-1 rounded-full transition-colors",
                    allFilled && i < total
                      ? total >= 2 ? "bg-rose-400" : total === 1 ? "bg-amber-400" : "bg-emerald-400"
                      : "bg-slate-100",
                  )} />
                ))}
              </div>

              {risk ? (
                <div className={cn("rounded-md border p-3", risk.cls)}>
                  <p className="text-xs font-bold">{risk.label}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed opacity-80">{risk.action}</p>
                </div>
              ) : (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-center text-[11px] text-slate-400">
                  Isi semua pertanyaan untuk melihat hasil
                </div>
              )}

              <div className="flex gap-2 text-[10px]">
                {[{ s: "0", l: "Rendah", cls: "bg-emerald-50 text-emerald-700" }, { s: "1", l: "Sedang", cls: "bg-amber-50 text-amber-700" }, { s: "≥2", l: "Tinggi", cls: "bg-rose-50 text-rose-700" }].map(r => (
                  <span key={r.s} className={cn("rounded-md px-2 py-0.5 font-semibold", r.cls)}>{r.s} – {r.l}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Follow-up */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-2.5">
              <span className="text-xs font-semibold text-slate-700">Tindak Lanjut</span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div>
                <Label>Dirujuk ke Ahli Gizi</Label>
                <input value={ahliGizi} onChange={e => setAhliGizi(e.target.value)}
                  placeholder="Nama ahli gizi / Tidak dirujuk" className={INPUT_CLS} />
              </div>
              <div>
                <Label>Catatan / Rencana Intervensi Gizi</Label>
                <textarea rows={3} value={catatan} onChange={e => setCatatan(e.target.value)}
                  placeholder="Rencana diet, suplemen, konsultasi lanjutan..."
                  className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Nama Petugas</Label><input value={petugas} onChange={e => setPetugas(e.target.value)} placeholder="Nama..." className={INPUT_CLS} /></div>
                <div><Label>Tanggal Skrining</Label><input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className={INPUT_CLS} /></div>
              </div>
              <button type="button"
                className="w-full rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700">
                Simpan Skrining Gizi
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
