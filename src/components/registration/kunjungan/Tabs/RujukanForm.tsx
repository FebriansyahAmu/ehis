"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownToLine, Building2, ShieldOff, Siren } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KunjunganRecord } from "@/lib/data";
import { RujukanMasukPanel } from "./rujukan/RujukanMasukPanel";
import { KontrolPascaRanapForm } from "./rujukan/KontrolPascaRanapForm";
import { RujukanIGDPanel } from "./rujukan/RujukanIGDPanel";

// ─── Helpers ──────────────────────────────────────────────────

function isBpjs(penjamin?: string): boolean {
  return (penjamin ?? "").toLowerCase().includes("bpjs");
}

// ─── NonBpjsBanner ────────────────────────────────────────────

function NonBpjsBanner({ penjamin }: { penjamin: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200">
        <ShieldOff size={14} className="text-slate-500" />
      </div>
      <div>
        <p className="text-[12px] font-bold text-slate-700">Tidak Berlaku untuk Pasien Ini</p>
        <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-400">
          Fitur rujukan BPJS hanya tersedia untuk peserta{" "}
          <span className="font-semibold">BPJS Kesehatan</span>. Pasien ini terdaftar dengan
          penjamin <span className="font-semibold text-slate-600">{penjamin || "Umum"}</span>.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Sub-menu definitions ─────────────────────────────────────

type SubMenu = "masuk" | "kontrol" | "igd";

const SUB_TABS = [
  {
    id:    "masuk"   as SubMenu,
    label: "Rujukan Masuk",
    icon:  ArrowDownToLine,
    desc:  "Cari & pilih rujukan dari FKTP via BPJS untuk SEP Rawat Jalan",
  },
  {
    id:    "kontrol" as SubMenu,
    label: "Kontrol Pasca Ranap",
    icon:  Building2,
    desc:  "Buat rujukan kontrol untuk pasien yang baru pulang dari rawat inap",
  },
  {
    id:    "igd"     as SubMenu,
    label: "Rujukan IGD",
    icon:  Siren,
    desc:  "Pengelolaan rujukan pasien gawat darurat — Perpres 82/2018 Pasal 47",
  },
] as const;

// ─── RujukanForm ──────────────────────────────────────────────

export function RujukanForm({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const [active, setActive] = useState<SubMenu>("masuk");
  const bpjs   = isBpjs(kunjungan.penjamin);
  const noBpjs = kunjungan.noPenjamin ?? kunjungan.noSEP ?? "—";

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <p className="text-[13px] font-bold text-slate-800">Surat Rujukan</p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Manajemen rujukan BPJS Kesehatan — masuk, kontrol pasca rawat inap, dan IGD
        </p>
      </div>

      {!bpjs ? (
        <NonBpjsBanner penjamin={kunjungan.penjamin ?? ""} />
      ) : (
        <>
          {/* Sub-menu pills */}
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {SUB_TABS.map(tab => {
              const Icon     = tab.icon;
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActive(tab.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all duration-150",
                    isActive
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  <Icon
                    size={11}
                    className={isActive ? "text-sky-500" : "text-slate-400"}
                  />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active tab label + description */}
          <AnimatePresence mode="wait">
            {SUB_TABS.map(tab =>
              tab.id === active ? (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex items-center gap-2"
                >
                  <tab.icon size={12} className="shrink-0 text-sky-400" />
                  <div>
                    <span className="text-[11px] font-bold text-slate-700">{tab.label}</span>
                    <span className="ml-2 text-[10.5px] text-slate-400">{tab.desc}</span>
                  </div>
                </motion.div>
              ) : null,
            )}
          </AnimatePresence>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {active === "masuk"   && <RujukanMasukPanel   noBpjs={noBpjs} />}
              {active === "kontrol" && <KontrolPascaRanapForm kunjungan={kunjungan} />}
              {active === "igd"     && <RujukanIGDPanel      noBpjs={noBpjs} />}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
