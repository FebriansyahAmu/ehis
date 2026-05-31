"use client";

// ANT6 — Referensi (HFIS / Mobile JKN), tabbed: Poli HFIS · Mobile JKN · Jadwal Dokter.

import { useState } from "react";
import { motion } from "framer-motion";
import { BookMarked, Network, Smartphone, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSkeletonDelay } from "@/components/master/shared";
import { PoliHfisTab } from "./PoliHfisTab";
import { MobileJknTab } from "./MobileJknTab";
import { JadwalHfisTab } from "./JadwalHfisTab";

type TabKey = "poli" | "jkn" | "jadwal";

const TABS: { key: TabKey; label: string; icon: typeof Network; desc: string }[] = [
  { key: "poli", label: "Poli HFIS", icon: Network, desc: "Mapping poli RS ↔ BPJS" },
  { key: "jkn", label: "Mobile JKN", icon: Smartphone, desc: "Kapasitas & kuota per poli" },
  { key: "jadwal", label: "Jadwal Dokter HFIS", icon: CalendarClock, desc: "Sinkron ke Master" },
];

export function ReferensiPage() {
  const loaded = useSkeletonDelay(500);
  const [tab, setTab] = useState<TabKey>("poli");

  if (!loaded) return <Skeleton />;

  return (
    <div className="flex w-full flex-col gap-5 p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-800">
          <BookMarked className="h-6 w-6 text-sky-600" /> Referensi HFIS / Mobile JKN
        </h1>
        <p className="m-xs text-slate-500">Referensi integrasi BPJS: mapping poli, kapasitas Mobile JKN, dan sumber jadwal dokter.</p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-left transition",
                active ? "border-sky-300 bg-sky-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", active ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500")}>
                <t.icon className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className={cn("block m-sm font-bold", active ? "text-sky-700" : "text-slate-700")}>{t.label}</span>
                <span className="block m-tiny text-slate-400">{t.desc}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        {tab === "poli" && <PoliHfisTab />}
        {tab === "jkn" && <MobileJknTab />}
        {tab === "jadwal" && <JadwalHfisTab />}
      </motion.div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex w-full flex-col gap-5 p-6">
      <div className="h-10 w-80 animate-pulse rounded-xl bg-slate-100" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 w-44 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}
