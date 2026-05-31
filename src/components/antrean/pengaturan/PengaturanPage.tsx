"use client";

// ANT3 — Pengaturan Antrian (tabbed): Mapping Pos→Loket→Poli · CRUD Pos/Loket ·
// Hak Akses (RBAC stub) · Jadwal Dokter (consume Master, jangan duplikasi).

import { useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, Network, DoorOpen, ShieldCheck, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSkeletonDelay } from "@/components/master/shared";
import DensityToggle, { type DensityLevel } from "@/components/master/mapping/DensityToggle";
import { MappingPosTab } from "./MappingPosTab";
import { PosLoketTab } from "./PosLoketTab";
import { HakAksesTab } from "./HakAksesTab";
import { JadwalDokterTab } from "./JadwalDokterTab";

type TabKey = "mapping" | "posloket" | "akses" | "jadwal";

const TABS: { key: TabKey; label: string; icon: typeof Network; desc: string }[] = [
  { key: "mapping", label: "Mapping Pos Antrian", icon: Network, desc: "Pos → Loket → Poli" },
  { key: "posloket", label: "Pos & Loket", icon: DoorOpen, desc: "Tambah / ubah / hapus" },
  { key: "akses", label: "Hak Akses", icon: ShieldCheck, desc: "Peran & izin antrean" },
  { key: "jadwal", label: "Jadwal Dokter", icon: CalendarClock, desc: "Konsumsi dari Master" },
];

export function PengaturanPage() {
  const loaded = useSkeletonDelay(500);
  const [tab, setTab] = useState<TabKey>("mapping");
  const [density, setDensity] = useState<DensityLevel>("comfortable");

  if (!loaded) return <Skeleton />;

  return (
    <div data-density={density} className="flex w-full flex-col gap-5 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-800">
            <SlidersHorizontal className="h-6 w-6 text-sky-600" />
            Pengaturan Antrian
          </h1>
          <p className="m-xs text-slate-500">Konfigurasi pos antrian, loket, hak akses petugas, dan referensi jadwal dokter.</p>
        </div>
        <DensityToggle density={density} onChange={setDensity} />
      </header>

      {/* Tab bar */}
      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "group flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-left transition",
                active
                  ? "border-sky-300 bg-sky-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  active ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500",
                )}
              >
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
        {tab === "mapping" && <MappingPosTab />}
        {tab === "posloket" && <PosLoketTab />}
        {tab === "akses" && <HakAksesTab />}
        {tab === "jadwal" && <JadwalDokterTab />}
      </motion.div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex w-full flex-col gap-5 p-6">
      <div className="h-10 w-72 animate-pulse rounded-xl bg-slate-100" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 w-44 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}
