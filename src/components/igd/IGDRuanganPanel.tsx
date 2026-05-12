"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Scissors, Stethoscope, Activity, HeartPulse,
  BedDouble, X, Wrench, ChevronDown, Clock, Timer,
  AlertTriangle,
} from "lucide-react";
import type { IGDKategoriRuangan, IGDRuangan, IGDBed, TriageLevel } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Config ────────────────────────────────────────────────

interface KategoriCfg {
  label:  string;
  desc:   string;
  icon:   LucideIcon;
  header: string;
  pulse?: boolean;
}

const KATEGORI_CFG: Record<IGDKategoriRuangan, KategoriCfg> = {
  BEDAH:       { label: "Bedah",       desc: "Ruang tindakan bedah",             icon: Scissors,    header: "bg-rose-600"   },
  NON_BEDAH:   { label: "Non Bedah",   desc: "Observasi & perawatan medis",      icon: Stethoscope, header: "bg-sky-600"    },
  IRDA:        { label: "IRDA",        desc: "Intensif Resusitasi & Stabilisasi", icon: Activity,    header: "bg-amber-500", pulse: true },
  IRDO:        { label: "IRDO",        desc: "Intensif Observasi & Monitoring",   icon: HeartPulse,  header: "bg-teal-600",  pulse: true },
  BOARDING_BED:{ label: "Boarding Bed",desc: "Pasien tunggu rawat inap",          icon: Timer,       header: "bg-indigo-600",pulse: true },
};

const TRIAGE_CHIP: Record<TriageLevel, string> = {
  P1: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  P2: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  P3: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  P4: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

const TRIAGE_BED_BG: Record<TriageLevel, string> = {
  P1: "border-rose-300 bg-rose-50",
  P2: "border-amber-300 bg-amber-50",
  P3: "border-emerald-300 bg-emerald-50",
  P4: "border-slate-300 bg-slate-50",
};

// ── Helpers ───────────────────────────────────────────────

function calcOccupancy(rooms: IGDRuangan[]) {
  const beds = rooms.flatMap((r) => r.beds);
  return {
    total:       beds.length,
    terisi:      beds.filter((b) => b.status === "Terisi").length,
    tersedia:    beds.filter((b) => b.status === "Tersedia").length,
    maintenance: beds.filter((b) => b.status === "Maintenance").length,
  };
}

function calcBoardingStats(rooms: IGDRuangan[]) {
  const beds = rooms
    .flatMap((r) => r.beds)
    .filter((b) => b.status === "Terisi" && b.boardingJam !== undefined);
  if (beds.length === 0) return { avgJam: 0, maxJam: 0 };
  const total  = beds.reduce((s, b) => s + (b.boardingJam ?? 0), 0);
  return {
    avgJam: Math.round(total / beds.length),
    maxJam: Math.max(...beds.map((b) => b.boardingJam ?? 0)),
  };
}

function boardingTimeClasses(jam: number) {
  if (jam > 6) return { text: "text-rose-700",   bg: "bg-rose-50 border-rose-100"     };
  if (jam >= 3) return { text: "text-amber-700",  bg: "bg-amber-50 border-amber-100"   };
  return              { text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" };
}

// ── Kategori Row ─────────────────────────────────────────

function KategoriRow({
  kategori, rooms, onOpen,
}: { kategori: IGDKategoriRuangan; rooms: IGDRuangan[]; onOpen: () => void }) {
  const cfg     = KATEGORI_CFG[kategori];
  const KatIcon = cfg.icon;
  const occ     = calcOccupancy(rooms);
  const pct     = occ.total === 0 ? 0 : occ.terisi / occ.total;
  const barColor = pct >= 0.85 ? "bg-rose-500" : pct >= 0.6 ? "bg-amber-400" : "bg-emerald-500";
  const boarding = kategori === "BOARDING_BED" ? calcBoardingStats(rooms) : null;

  return (
    <div className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/60">

      {/* Icon + label */}
      <div className="flex w-36 shrink-0 items-center gap-2.5">
        <div className={cn(
          "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          cfg.header,
        )}>
          {cfg.pulse && pct >= 0.85 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
          )}
          <KatIcon size={13} className="text-white" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{cfg.label}</p>
          <p className="text-[10px] text-slate-400">{occ.total} bed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex flex-1 items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <span className="w-9 shrink-0 text-right text-[11px] font-black tabular-nums text-slate-600">
          {Math.round(pct * 100)}%
        </span>
      </div>

      {/* Occupancy counts */}
      <div className="hidden items-center gap-5 sm:flex">
        <div className="text-right">
          <p className="text-[11px] font-black tabular-nums text-slate-800">
            {occ.terisi}
            <span className="font-normal text-slate-400">/{occ.total}</span>
          </p>
          <p className="text-[10px] text-slate-400">terisi</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-black tabular-nums text-emerald-600">{occ.tersedia}</p>
          <p className="text-[10px] text-slate-400">tersedia</p>
        </div>
      </div>

      {/* Status badge */}
      <div className="w-24 shrink-0 text-right">
        {boarding && boarding.avgJam > 0 ? (
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
            boarding.avgJam > 6
              ? "bg-rose-100 text-rose-700"
              : boarding.avgJam >= 3
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700",
          )}>
            <Timer size={8} />
            avg {boarding.avgJam}j
          </span>
        ) : pct >= 0.85 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700">
            <AlertTriangle size={8} />
            PENUH
          </span>
        ) : null}
      </div>

      {/* Detail button */}
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-700"
        aria-label={`Lihat peta kamar ${cfg.label}`}
      >
        Detail
      </button>
    </div>
  );
}

// ── Bed Card (inside modal) ───────────────────────────────

function BedCard({ bed, onSelect }: { bed: IGDBed; onSelect: (b: IGDBed) => void }) {
  if (bed.status === "Tersedia") {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 p-3 text-center transition-colors hover:border-emerald-300 hover:bg-emerald-50">
        <BedDouble size={16} className="text-emerald-400" />
        <p className="text-[10px] font-bold text-emerald-600">{bed.nomor}</p>
        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">Tersedia</span>
      </div>
    );
  }

  if (bed.status === "Maintenance") {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 text-center">
        <Wrench size={15} className="text-slate-400" />
        <p className="text-[10px] font-bold text-slate-500">{bed.nomor}</p>
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">Maintenance</span>
      </div>
    );
  }

  const triageBg = bed.triage ? TRIAGE_BED_BG[bed.triage] : "border-sky-200 bg-sky-50";
  const bCls     = bed.boardingJam !== undefined ? boardingTimeClasses(bed.boardingJam) : null;

  return (
    <button
      onClick={() => onSelect(bed)}
      className={cn(
        "flex cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
        triageBg,
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <p className="text-[10px] font-black text-slate-700">{bed.nomor}</p>
        {bed.triage && (
          <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-bold", TRIAGE_CHIP[bed.triage])}>
            {bed.triage}
          </span>
        )}
      </div>
      <p className="truncate text-[11px] font-semibold leading-tight text-slate-800">{bed.pasienNama}</p>
      <div className="flex items-center gap-1 text-[9px] text-slate-500">
        <Clock size={9} />
        {bed.masukSejak}
      </div>
      {bCls && bed.boardingJam !== undefined && (
        <div className={cn("flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold", bCls.text, bCls.bg.split(" ")[0])}>
          <Timer size={8} />
          {bed.boardingJam}j boarding
        </div>
      )}
    </button>
  );
}

// ── Bed Detail Panel ──────────────────────────────────────

function BedDetailPanel({ bed, onClose }: { bed: IGDBed; onClose: () => void }) {
  const bCls = bed.boardingJam !== undefined ? boardingTimeClasses(bed.boardingJam) : null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tempat Tidur</p>
          <p className="text-sm font-black text-slate-800">{bed.nomor}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50"
        >
          <X size={12} />
        </button>
      </div>
      {bed.triage && (
        <span className={cn("mb-3 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold", TRIAGE_CHIP[bed.triage])}>
          {bed.triage} —{" "}
          {bed.triage === "P1" ? "Kritis" : bed.triage === "P2" ? "Urgent" : "Non-urgent"}
        </span>
      )}
      <div className="space-y-2 text-xs">
        {[
          { label: "Nama Pasien", value: bed.pasienNama },
          { label: "No. RM",      value: bed.pasienRM,  mono: true },
          { label: "Masuk Sejak", value: bed.masukSejak },
        ].map(({ label, value, mono }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
            <span className={cn("font-semibold text-slate-800", mono && "font-mono")}>{value}</span>
          </div>
        ))}
        {bCls && bed.boardingJam !== undefined && (
          <div className={cn("mt-1 flex items-center gap-2 rounded-lg border px-3 py-2", bCls.bg, bCls.text)}>
            <Timer size={13} />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Lama Boarding</p>
              <p className="text-sm font-black">{bed.boardingJam} jam</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bed Map Modal ─────────────────────────────────────────

function BedMapModal({
  kategori, rooms, onClose,
}: { kategori: IGDKategoriRuangan; rooms: IGDRuangan[]; onClose: () => void }) {
  const cfg              = KATEGORI_CFG[kategori];
  const KatIcon          = cfg.icon;
  const occ              = calcOccupancy(rooms);
  const [activeRoom, setActiveRoom]   = useState(rooms[0]?.id ?? "");
  const [selectedBed, setSelectedBed] = useState<IGDBed | null>(null);
  const currentRoom = rooms.find((r) => r.id === activeRoom);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.96, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 4 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className={cn("flex shrink-0 items-center justify-between px-5 py-4", cfg.header)}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <KatIcon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Peta Kamar IGD</p>
              <p className="text-sm font-black text-white">{cfg.label}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30"
          >
            <X size={15} />
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid shrink-0 grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50">
          {[
            { label: "Total Bed",   value: occ.total,       cls: "text-slate-700"   },
            { label: "Terisi",      value: occ.terisi,      cls: "text-rose-600"    },
            { label: "Tersedia",    value: occ.tersedia,    cls: "text-emerald-600" },
            { label: "Maintenance", value: occ.maintenance, cls: "text-slate-400"   },
          ].map(({ label, value, cls }) => (
            <div key={label} className="flex flex-col items-center py-3 text-center">
              <p className={cn("text-xl font-black tabular-nums", cls)}>{value}</p>
              <p className="text-[10px] text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Room tabs */}
        {rooms.length > 1 && (
          <div className="flex shrink-0 gap-1 border-b border-slate-100 bg-white px-4 pt-3">
            {rooms.map((room) => {
              const rOcc    = calcOccupancy([room]);
              const isActive = activeRoom === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => { setActiveRoom(room.id); setSelectedBed(null); }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-t-lg border border-b-0 px-3.5 py-2 text-xs font-semibold transition",
                    isActive
                      ? "border-slate-200 bg-white text-indigo-600 shadow-xs"
                      : "border-transparent text-slate-400 hover:text-slate-600",
                  )}
                >
                  {room.nama}
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                    isActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500",
                  )}>
                    {rOcc.terisi}/{rOcc.total}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Bed grid + detail panel */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5">
            {currentRoom && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {currentRoom.beds.map((bed) => (
                  <BedCard
                    key={bed.id}
                    bed={bed}
                    onSelect={(b) => setSelectedBed(selectedBed?.id === b.id ? null : b)}
                  />
                ))}
              </div>
            )}
          </div>
          {selectedBed && (
            <div className="w-52 shrink-0 border-l border-slate-100 p-3">
              <BedDetailPanel bed={selectedBed} onClose={() => setSelectedBed(null)} />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex shrink-0 flex-wrap items-center gap-5 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Keterangan</p>
          {[
            { label: "Tersedia",    cls: "border-2 border-dashed border-emerald-300 bg-emerald-50" },
            { label: "Terisi",      cls: "border-2 border-rose-300 bg-rose-50"                     },
            { label: "Maintenance", cls: "border-2 border-dashed border-slate-300 bg-slate-50"     },
          ].map(({ label, cls }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={cn("h-3.5 w-5 rounded", cls)} />
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Panel ────────────────────────────────────────────

const KATEGORI_ORDER: IGDKategoriRuangan[] = ["BEDAH", "NON_BEDAH", "IRDA", "IRDO", "BOARDING_BED"];

export default function IGDRuanganPanel({ ruangan }: { ruangan: IGDRuangan[] }) {
  const [openKategori, setOpenKategori] = useState<IGDKategoriRuangan | null>(null);
  const [expanded,     setExpanded]     = useState(false);

  const grouped = KATEGORI_ORDER.reduce<Record<IGDKategoriRuangan, IGDRuangan[]>>(
    (acc, k) => { acc[k] = ruangan.filter((r) => r.kategori === k); return acc; },
    {} as Record<IGDKategoriRuangan, IGDRuangan[]>,
  );

  const allBeds       = ruangan.flatMap((r) => r.beds);
  const totalBeds     = allBeds.length;
  const totalTerisi   = allBeds.filter((b) => b.status === "Terisi").length;
  const totalTersedia = allBeds.filter((b) => b.status === "Tersedia").length;

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Header — always visible, acts as toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50"
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-2">
            <BedDouble size={14} className="text-slate-500" />
            <p className="text-sm font-bold text-slate-700">Klasifikasi Ruangan IGD</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span>
                <span className="font-black tabular-nums text-slate-800">{totalTerisi}</span>
                <span className="text-slate-400">/{totalBeds}</span>
                {" "}terisi
              </span>
              <span className="text-emerald-600">
                <span className="font-black tabular-nums">{totalTersedia}</span>
                {" "}tersedia
              </span>
            </div>
            <ChevronDown
              size={14}
              className={cn(
                "shrink-0 text-slate-400 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </div>
        </button>

        {/* Kategori rows — collapsible */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="kategori-rows"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div className="divide-y divide-slate-50 border-t border-slate-100">
                {KATEGORI_ORDER.map((k, i) => {
                  const rooms = grouped[k];
                  if (!rooms || rooms.length === 0) return null;
                  return (
                    <motion.div
                      key={k}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.18, ease: "easeOut" }}
                    >
                      <KategoriRow
                        kategori={k}
                        rooms={rooms}
                        onOpen={() => setOpenKategori(k)}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {openKategori && (
          <BedMapModal
            kategori={openKategori}
            rooms={grouped[openKategori]}
            onClose={() => setOpenKategori(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
