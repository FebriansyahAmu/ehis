"use client";

// ANT-ONSITE — Step poli & dokter: pilih poli (grid) → pilih dokter (sisa kuota).
// Pasien BPJS berujukan: poli rujukan dipilih otomatis (tetap bisa diubah).

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Ticket, CheckCircle2, FileCheck2 } from "lucide-react";
import {
  POLI_ONSITE,
  listDokterByPoli,
  sisaKuota,
  kuotaTerisi,
  kuotaTotal,
  estimasiDilayani,
} from "@/lib/antrean/onsiteMock";
import { cn } from "@/lib/utils";
import type { CaraBayar } from "@/lib/antrean/types";
import { KioskButton, KuotaBar, PoliIcon } from "../apmUi";
import type { ApmRujukan } from "../apmTypes";

function jamFromMs(ms: number): string {
  return new Date(ms).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function StepPoliDokter({
  caraBayar,
  rujukan,
  onSelectionChange,
  onAmbil,
}: {
  caraBayar: CaraBayar;
  rujukan: ApmRujukan | null;
  onSelectionChange?: (poliKode?: string, kodedokter?: string) => void;
  onAmbil: (poliKode: string, kodedokter: string) => void;
}) {
  const [poliKode, setPoliKode] = useState<string | undefined>(rujukan?.poliKode);
  const [kodedokter, setKodedokter] = useState<string | undefined>(undefined);

  const pickPoli = (kode: string) => {
    setPoliKode(kode);
    setKodedokter(undefined);
    onSelectionChange?.(kode, undefined);
  };
  const pickDokter = (kode: string) => {
    setKodedokter(kode);
    onSelectionChange?.(poliKode, kode);
  };

  const dokterList = poliKode ? listDokterByPoli(poliKode) : [];

  return (
    <div className="flex flex-col gap-7 pb-24">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Pilih Poli & Dokter</h2>
        <p className="mt-2 text-lg text-slate-500">
          Penjamin: <span className="font-semibold text-slate-700">{caraBayar === "BPJS" ? "BPJS Kesehatan" : "Umum / Mandiri"}</span>
        </p>
      </div>

      {rujukan && (
        <div className="mx-auto flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
          <FileCheck2 className="h-4 w-4" aria-hidden />
          Sesuai rujukan: Poli {rujukan.poliNama}
        </div>
      )}

      {/* Grid poli */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">1 · Poli Tujuan</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {POLI_ONSITE.map((p) => {
            const total = listDokterByPoli(p.kode).reduce((n, d) => n + sisaKuota(d, caraBayar), 0);
            const habis = total === 0;
            const active = poliKode === p.kode;
            return (
              <motion.button
                key={p.kode}
                type="button"
                whileTap={habis ? undefined : { scale: 0.97 }}
                disabled={habis}
                onClick={() => pickPoli(p.kode)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center ring-1 transition-all",
                  active
                    ? "ring-2 ring-indigo-600 shadow-md"
                    : "ring-slate-200 hover:ring-slate-300 hover:shadow-sm",
                  habis && "cursor-not-allowed opacity-40",
                )}
              >
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl",
                    active ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-500",
                  )}
                >
                  <PoliIcon icon={p.icon} className="h-6 w-6" />
                </span>
                <span className="text-sm font-bold leading-tight text-slate-700">{p.nama}</span>
                <span className={cn("text-xs font-medium", habis ? "text-rose-400" : "text-slate-400")}>
                  {habis ? "Kuota penuh" : `${total} slot`}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Dokter */}
      <AnimatePresence mode="wait">
        {poliKode && (
          <motion.section
            key={poliKode}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">2 · Dokter</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {dokterList.map((d) => {
                const sisa = sisaKuota(d, caraBayar);
                const habis = sisa === 0;
                const active = kodedokter === d.kode;
                return (
                  <button
                    key={d.kode}
                    type="button"
                    disabled={habis}
                    onClick={() => pickDokter(d.kode)}
                    className={cn(
                      "flex flex-col gap-3 rounded-2xl bg-white p-5 text-left ring-1 transition-all",
                      active ? "ring-2 ring-indigo-600 shadow-md" : "ring-slate-200 hover:ring-slate-300 hover:shadow-sm",
                      habis && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-slate-800">{d.nama}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                          <Clock className="h-4 w-4" aria-hidden />
                          {d.jamPraktik}
                        </p>
                      </div>
                      {active && <CheckCircle2 className="h-6 w-6 shrink-0 text-indigo-600" aria-hidden />}
                    </div>
                    <KuotaBar terisi={kuotaTerisi(d, caraBayar)} total={kuotaTotal(d, caraBayar)} />
                    {!habis && (
                      <p className="text-xs font-medium text-slate-400">
                        Estimasi dilayani sekitar pukul{" "}
                        <span className="font-bold text-slate-600">
                          {jamFromMs(estimasiDilayani(d, caraBayar))}
                        </span>
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-16 z-10 flex justify-center px-6">
        <KioskButton
          variant="primary"
          icon={Ticket}
          disabled={!poliKode || !kodedokter}
          onClick={() => poliKode && kodedokter && onAmbil(poliKode, kodedokter)}
          className="w-full max-w-md shadow-2xl"
        >
          Ambil Antrean
        </KioskButton>
      </div>
    </div>
  );
}
