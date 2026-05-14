"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, TrendingDown, TrendingUp, Minus, AlertTriangle, BarChart3 } from "lucide-react";
import type { RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  ICU_SCORING_MOCK, emptyICUScoring, getSOFARisk, getAPACHERisk,
  type SOFAEntry, type APACHEEntry, type ICUScoringData,
} from "./icuScoring/icuScoringShared";
import SOFAPane   from "./icuScoring/SOFAPane";
import APACHEPane from "./icuScoring/APACHEPane";
import TrendPane  from "./icuScoring/TrendPane";

type PaneId = "sofa" | "apache" | "trend";

const PANES: { id: PaneId; label: string; sub: string }[] = [
  { id: "sofa",   label: "SOFA Score",  sub: "6 Organ Sistem" },
  { id: "apache", label: "APACHE II",   sub: "12 + Usia + Kronik" },
  { id: "trend",  label: "Tren 7 Hari", sub: "Grafik + Tabel"   },
];

// ── TrendArrow ─────────────────────────────────────────────

function TrendArrow({ delta, invert = false }: { delta: number; invert?: boolean }) {
  const improving = invert ? delta > 0 : delta < 0;
  if (delta === 0) return <Minus size={13} className="text-slate-400" />;
  if (improving)   return <TrendingDown size={13} className="text-emerald-500" />;
  return               <TrendingUp   size={13} className="text-rose-500"    />;
}

// ── ScoreSummaryCard ──────────────────────────────────────

function ScoreSummaryCard({ sofa, apache }: { sofa: SOFAEntry[]; apache: APACHEEntry[] }) {
  const sorted        = [...sofa].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const latestSOFA    = sorted.at(-1);
  const prevSOFA      = sorted.at(-2);
  const sortedA       = [...apache].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const latestAPACHE  = sortedA.at(-1);
  const prevAPACHE    = sortedA.at(-2);

  const sofaDelta    = (latestSOFA && prevSOFA)       ? latestSOFA.total   - prevSOFA.total   : 0;
  const apacheDelta  = (latestAPACHE && prevAPACHE)   ? latestAPACHE.total - prevAPACHE.total : 0;

  const sofaRisk   = latestSOFA   ? getSOFARisk(latestSOFA.total)     : null;
  const apacheRisk = latestAPACHE ? getAPACHERisk(latestAPACHE.total) : null;

  const cards = [
    {
      title:  "SOFA Score",
      sub:    sofaRisk?.label ?? "Belum ada data",
      value:  latestSOFA?.total,
      suffix: "/24",
      delta:  sofaDelta,
      icon:   Activity,
      bg:     "bg-sky-100",
      color:  "text-sky-600",
      note:   sofaRisk ? `Est. mortalitas ${sofaRisk.mort}` : "Input data pertama",
    },
    {
      title:  "APACHE II",
      sub:    apacheRisk?.label ?? "Belum ada data",
      value:  latestAPACHE?.total,
      suffix: "/71",
      delta:  apacheDelta,
      icon:   BarChart3,
      bg:     "bg-indigo-100",
      color:  "text-indigo-600",
      note:   latestAPACHE ? `APS: ${latestAPACHE.aps} poin` : "Input data pertama",
    },
    {
      title:  "Est. Mortalitas",
      sub:    latestAPACHE ? "berdasarkan APACHE II" : "–",
      value:  latestAPACHE?.mortalitas,
      suffix: "%",
      delta:  0,
      icon:   AlertTriangle,
      bg:     latestAPACHE && latestAPACHE.mortalitas > 50 ? "bg-rose-100"  : "bg-amber-100",
      color:  latestAPACHE && latestAPACHE.mortalitas > 50 ? "text-rose-600" : "text-amber-600",
      note:   "Estimasi populasi, bukan individual",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((c, i) => (
        <motion.div
          key={c.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.2 }}
          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-xs"
        >
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", c.bg)}>
            <c.icon size={15} className={c.color} aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{c.title}</p>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <motion.span
                key={c.value}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="text-3xl font-black tabular-nums text-slate-800"
              >
                {c.value ?? "—"}
              </motion.span>
              {c.value !== undefined && (
                <>
                  <span className="text-xs text-slate-400">{c.suffix}</span>
                  {c.delta !== 0 && <TrendArrow delta={c.delta} />}
                </>
              )}
            </div>
            <p className="mt-0.5 truncate text-[10px] text-slate-400">{c.sub}</p>
            <p className="mt-0.5 text-[9px] text-slate-300">{c.note}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── PanePills ─────────────────────────────────────────────

function PanePills({ active, onChange }: { active: PaneId; onChange: (p: PaneId) => void }) {
  return (
    <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
      {PANES.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={cn(
            "relative flex-1 rounded-lg py-2 px-2 text-center transition-all duration-150",
            active === p.id
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-50 hover:text-sky-600",
          )}
        >
          <p className={cn("text-xs font-semibold leading-none", active === p.id ? "text-white" : "text-slate-600")}>
            {p.label}
          </p>
          <p className={cn("mt-0.5 text-[9px]", active === p.id ? "text-sky-200" : "text-slate-400")}>
            {p.sub}
          </p>
        </button>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function ICUScoringTab({ patient }: { patient: RawatInapPatientDetail }) {
  const rm      = patient.noRM;
  const initial = ICU_SCORING_MOCK[rm] ?? emptyICUScoring();

  const [data,       setData]       = useState<ICUScoringData>(initial);
  const [activePane, setActivePane] = useState<PaneId>("sofa");

  function saveSOFA(entry: SOFAEntry) {
    setData((p) => {
      const filtered = p.sofa.filter((e) => e.tanggal !== entry.tanggal);
      return { ...p, sofa: [...filtered, entry].sort((a, b) => a.tanggal.localeCompare(b.tanggal)) };
    });
  }

  function saveAPACHE(entry: APACHEEntry) {
    setData((p) => {
      const filtered = p.apache.filter((e) => e.tanggal !== entry.tanggal);
      return { ...p, apache: [...filtered, entry].sort((a, b) => a.tanggal.localeCompare(b.tanggal)) };
    });
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Score summary */}
      <ScoreSummaryCard sofa={data.sofa} apache={data.apache} />

      {/* Clinical note */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2">
        <p className="text-[10px] text-slate-400">
          <span className="font-semibold text-slate-500">SOFA</span> — evaluasi disfungsi organ harian ·{" "}
          <span className="font-semibold text-slate-500">APACHE II</span> — prediksi mortalitas saat masuk ICU ·{" "}
          Skor menurun = perbaikan klinis. SNARS PP · ICU international
        </p>
      </div>

      {/* Sub-tab pills */}
      <PanePills active={activePane} onChange={setActivePane} />

      {/* Pane content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activePane}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {activePane === "sofa"   && <SOFAPane   history={data.sofa}   onSave={saveSOFA}   />}
          {activePane === "apache" && <APACHEPane history={data.apache} onSave={saveAPACHE} />}
          {activePane === "trend"  && <TrendPane  data={data}                                />}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
