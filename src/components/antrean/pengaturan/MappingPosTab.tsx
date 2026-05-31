"use client";

// ANT3.1 — Mapping Pos Antrian: tetapkan poli yang dilayani tiap pos (toggle chip).
// Source of truth = posStore. Board "Buka Loket" + estimasi consume mapping ini.

import { MapPin, DoorOpen, Stethoscope, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { POLI_ONSITE } from "@/lib/antrean/onsiteMock";
import { usePosStore, togglePoli } from "@/lib/antrean/posStore";

export function MappingPosTab() {
  const posList = usePosStore();

  return (
    <div className="flex flex-col gap-4">
      <p className="m-xs text-slate-500">
        Centang poli yang dilayani tiap pos antrian. Hanya poli terpetakan yang tampil sebagai tujuan saat pendaftaran di pos tersebut.
      </p>

      {posList.map((pos) => (
        <section key={pos.kode} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="m-sm font-bold text-slate-800">{pos.nama}</p>
                <p className="flex items-center gap-2 m-tiny text-slate-400">
                  <span className="font-mono">{pos.kode}</span>
                  <span className="inline-flex items-center gap-1">
                    <DoorOpen className="h-3 w-3" /> {pos.loket.length} loket
                  </span>
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 m-tiny font-bold text-sky-700">
              <Stethoscope className="h-3.5 w-3.5" /> {pos.poli.length} poli
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-4">
            {POLI_ONSITE.map((poli) => {
              const on = pos.poli.includes(poli.kode);
              return (
                <button
                  key={poli.kode}
                  type="button"
                  onClick={() => togglePoli(pos.kode, poli.kode)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition",
                    on
                      ? "border-sky-300 bg-sky-50 text-sky-800"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      on ? "border-sky-500 bg-sky-500 text-white" : "border-slate-300",
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate m-xs font-semibold">{poli.nama}</span>
                    <span className="block m-mini font-mono text-slate-400">{poli.kode}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
