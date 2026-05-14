"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, History, AlertTriangle,
  Salad, ShieldCheck, CheckCircle2,
} from "lucide-react";
import type { RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

import AnamnesisPaneRI   from "@/components/rawat-inap/asesmenAwal/AnamnesisPaneRI";
import RiwayatPane       from "@/components/shared/asesmen/RiwayatPane";
import AllergyPane       from "@/components/shared/asesmen/AllergyPane";
import SkriningPane      from "@/components/rawat-inap/asesmenAwal/SkriningPane";
import PenilaianRisikoPane from "@/components/rawat-inap/asesmenAwal/PenilaianRisikoPane";

// ── Sub-tab definitions ───────────────────────────────────

type SubTabId = "anamnesis" | "riwayat" | "alergi" | "skrining" | "penilaian";

interface SubTabDef {
  id: SubTabId;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  standard: string;
}

const SUB_TABS: SubTabDef[] = [
  {
    id: "anamnesis",
    label: "Anamnesis",
    sublabel: "Keluhan & Riwayat",
    icon: ClipboardList,
    standard: "AP 1.1",
  },
  {
    id: "riwayat",
    label: "Riwayat Medis",
    sublabel: "RPD · RPK · Obat",
    icon: History,
    standard: "AP 1.1",
  },
  {
    id: "alergi",
    label: "Alergi",
    sublabel: "Riwayat Alergi",
    icon: AlertTriangle,
    standard: "AP 1.1",
  },
  {
    id: "skrining",
    label: "Skrining",
    sublabel: "Gizi",
    icon: Salad,
    standard: "AP 1.3",
  },
  {
    id: "penilaian",
    label: "Penilaian Risiko",
    sublabel: "Barthel · Morse · Braden",
    icon: ShieldCheck,
    standard: "AP 1.4–1.5",
  },
];

// ── Sub-tab nav item ──────────────────────────────────────

function SubNavItem({
  tab, active, done, onClick,
}: {
  tab: SubTabDef; active: boolean; done: boolean; onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150",
        active
          ? "border-sky-300 bg-sky-600 shadow-md shadow-sky-100"
          : done
          ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100/70"
          : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50",
      )}
    >
      {/* Step number / icon */}
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold transition-colors",
        active ? "bg-white/20 text-white"
          : done ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-500",
      )}>
        {done && !active ? <CheckCircle2 size={14} /> : (
          <Icon size={14} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn(
          "text-[11px] font-bold leading-tight",
          active ? "text-white" : done ? "text-emerald-800" : "text-slate-700",
        )}>
          {tab.label}
        </p>
        <p className={cn(
          "truncate text-[9px] font-medium leading-tight mt-0.5",
          active ? "text-white/70" : done ? "text-emerald-600" : "text-slate-400",
        )}>
          {tab.sublabel}
        </p>
      </div>

      {/* Standard badge */}
      <span className={cn(
        "shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold",
        active ? "bg-white/20 text-white/90"
          : done ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-500",
      )}>
        {tab.standard}
      </span>

      {/* Active indicator bar */}
      {active && (
        <motion.div
          layoutId="asesmen-active-bar"
          className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-white/50"
        />
      )}
    </button>
  );
}

// ── Progress header ───────────────────────────────────────

function ProgressHeader({ doneCount, total }: { doneCount: number; total: number }) {
  const pct = Math.round((doneCount / total) * 100);
  const allDone = doneCount === total;

  return (
    <div className={cn(
      "rounded-xl border p-4 transition-colors",
      allDone
        ? "border-emerald-200 bg-emerald-50"
        : "border-sky-100 bg-linear-to-r from-sky-50 to-white",
    )}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className={cn(
            "text-xs font-bold",
            allDone ? "text-emerald-800" : "text-sky-800",
          )}>
            {allDone ? "Asesmen Awal Lengkap" : "Asesmen Awal Rawat Inap"}
          </p>
          <p className={cn(
            "text-[10px] mt-0.5",
            allDone ? "text-emerald-600" : "text-sky-600",
          )}>
            {allDone
              ? "Semua komponen asesmen telah diisi — SNARS AP 1 terpenuhi"
              : `${doneCount} dari ${total} komponen selesai · Wajib diselesaikan dalam 24 jam (SNARS AP 1)`
            }
          </p>
        </div>
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-black text-sm tabular-nums",
          allDone
            ? "border-emerald-400 bg-emerald-100 text-emerald-700"
            : "border-sky-300 bg-white text-sky-700",
        )}>
          {pct}
          <span className="text-[8px] font-bold">%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {SUB_TABS.map((tab, i) => {
          const segDone = i < doneCount;
          return (
            <motion.div
              key={tab.id}
              className={cn(
                "flex-1 rounded-full transition-colors",
                segDone
                  ? allDone ? "bg-emerald-400" : "bg-sky-400"
                  : "bg-slate-200",
              )}
              style={{ height: 5 }}
              initial={false}
              animate={{ opacity: segDone ? 1 : 0.4 }}
              transition={{ duration: 0.3 }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────

interface AsesmenAwalTabProps {
  patient: RawatInapPatientDetail;
}

// ── Main component ────────────────────────────────────────

export default function AsesmenAwalTab({ patient }: AsesmenAwalTabProps) {
  const [active, setActive] = useState<SubTabId>("anamnesis");
  const [prevTab, setPrevTab] = useState<SubTabId>("anamnesis");

  const [doneAnamnesis,  setDoneAnamnesis]  = useState(false);
  const [doneRiwayat,    setDoneRiwayat]    = useState(false);
  const [doneAlergi,     setDoneAlergi]     = useState(false);
  const [doneGizi,       setDoneGizi]       = useState(false);
  const [donePenilaian,  setDonePenilaian]  = useState(false);

  const doneSkrining = doneGizi;

  const DONE_MAP: Record<SubTabId, boolean> = {
    anamnesis: doneAnamnesis,
    riwayat:   doneRiwayat,
    alergi:    doneAlergi,
    skrining:  doneSkrining,
    penilaian: donePenilaian,
  };

  const doneCount = Object.values(DONE_MAP).filter(Boolean).length;

  const activeIdx = SUB_TABS.findIndex(t => t.id === active);
  const prevIdx   = SUB_TABS.findIndex(t => t.id === prevTab);
  const direction = activeIdx >= prevIdx ? 1 : -1;

  function navigate(id: SubTabId) {
    setPrevTab(active);
    setActive(id);
  }

  const patientBase = {
    noRM: patient.noRM,
    riwayatAlergi: patient.riwayatAlergi,
    obatSaatIni: patient.obatSaatIni,
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Progress header */}
      <ProgressHeader doneCount={doneCount} total={SUB_TABS.length} />

      {/* Main layout: sub-nav + content */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">

        {/* ── Sub-tab navigation ── */}
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:w-52 lg:shrink-0 lg:flex-col lg:pb-0" aria-label="Asesmen awal sub-tab">
          {SUB_TABS.map((tab) => (
            <SubNavItem
              key={tab.id}
              tab={tab}
              active={active === tab.id}
              done={DONE_MAP[tab.id]}
              onClick={() => navigate(tab.id)}
            />
          ))}
        </nav>

        {/* ── Content area ── */}
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={active}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 20 }),
                center: { opacity: 1, x: 0 },
                exit:  (d: number) => ({ opacity: 0, x: d * -16 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {active === "anamnesis" && (
                <AnamnesisPaneRI
                  patient={patient}
                  onComplete={setDoneAnamnesis}
                />
              )}
              {active === "riwayat" && (
                <RiwayatPane
                  patient={patientBase}
                  onComplete={setDoneRiwayat}
                />
              )}
              {active === "alergi" && (
                <AllergyPane
                  noRM={patient.noRM}
                  onComplete={setDoneAlergi}
                />
              )}
              {active === "skrining" && (
                <SkriningPane
                  noRM={patient.noRM}
                  onGiziComplete={setDoneGizi}
                />
              )}
              {active === "penilaian" && (
                <PenilaianRisikoPane
                  onComplete={setDonePenilaian}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Next sub-tab nudge */}
      {!DONE_MAP[active] && (
        <AnimatePresence>
          <motion.div
            key={`nudge-${active}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.5 }}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">
                {SUB_TABS.find(t => t.id === active)?.label}
              </span>
              {" "}belum selesai — isi semua field wajib untuk menandai sub-tab ini selesai.
            </p>
            {activeIdx < SUB_TABS.length - 1 && (
              <button
                type="button"
                onClick={() => navigate(SUB_TABS[activeIdx + 1].id)}
                className="ml-4 shrink-0 rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-sky-700"
              >
                Lanjut →
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      )}

    </div>
  );
}
