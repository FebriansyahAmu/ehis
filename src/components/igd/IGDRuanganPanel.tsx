"use client";

import { useState } from "react";
import {
  Scissors, Stethoscope, Activity, HeartPulse,
  BedDouble, X, Wrench, ChevronRight, Clock, Timer,
  type LucideIcon,
} from "lucide-react";
import type { IGDKategoriRuangan, IGDRuangan, IGDBed, TriageLevel } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Config ────────────────────────────────────────────────

interface KategoriCfg {
  label: string;
  desc: string;
  icon: LucideIcon;
  ring:       string;
  badge:      string;
  header:     string;
  arc:        string;
  cardBg:     string;
  cardBorder: string;
  pulse?: boolean;
}

const KATEGORI_CFG: Record<IGDKategoriRuangan, KategoriCfg> = {
  BEDAH: {
    label:      "Bedah",
    desc:       "Ruang tindakan bedah",
    icon:       Scissors,
    ring:       "ring-rose-200",
    badge:      "bg-rose-600 text-white",
    header:     "bg-rose-600",
    arc:        "text-rose-500",
    cardBg:     "bg-rose-50",
    cardBorder: "border-rose-200",
  },
  NON_BEDAH: {
    label:      "Non Bedah",
    desc:       "Observasi & perawatan medis",
    icon:       Stethoscope,
    ring:       "ring-sky-200",
    badge:      "bg-sky-600 text-white",
    header:     "bg-sky-600",
    arc:        "text-sky-500",
    cardBg:     "bg-sky-50",
    cardBorder: "border-sky-200",
  },
  IRDA: {
    label:      "IRDA",
    desc:       "Intensif Resusitasi & Stabilisasi",
    icon:       Activity,
    ring:       "ring-amber-200",
    badge:      "bg-amber-600 text-white",
    header:     "bg-amber-600",
    arc:        "text-amber-500",
    cardBg:     "bg-amber-50",
    cardBorder: "border-amber-200",
    pulse:      true,
  },
  IRDO: {
    label:      "IRDO",
    desc:       "Intensif Observasi & Monitoring",
    icon:       HeartPulse,
    ring:       "ring-teal-200",
    badge:      "bg-teal-600 text-white",
    header:     "bg-teal-600",
    arc:        "text-teal-500",
    cardBg:     "bg-teal-50",
    cardBorder: "border-teal-200",
    pulse:      true,
  },
  BOARDING_BED: {
    label:      "Boarding Bed",
    desc:       "Pasien tunggu rawat inap",
    icon:       Timer,
    ring:       "ring-indigo-200",
    badge:      "bg-indigo-600 text-white",
    header:     "bg-indigo-600",
    arc:        "text-indigo-500",
    cardBg:     "bg-indigo-50",
    cardBorder: "border-indigo-200",
    pulse:      true,
  },
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
  const avgJam = Math.round(total / beds.length);
  const maxJam = Math.max(...beds.map((b) => b.boardingJam ?? 0));
  return { avgJam, maxJam };
}

function boardingTimeClasses(jam: number) {
  if (jam > 6) return { text: "text-rose-700",   bg: "bg-rose-50 border-rose-100"   };
  if (jam >= 3) return { text: "text-amber-700",  bg: "bg-amber-50 border-amber-100" };
  return              { text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" };
}

// ── SVG Occupancy Ring ────────────────────────────────────

function OccupancyRing({
  occupied, total, colorClass,
}: { occupied: number; total: number; colorClass: string }) {
  const r    = 22;
  const circ = 2 * Math.PI * r;
  const pct  = total === 0 ? 0 : occupied / total;
  const dash = pct * circ;
  return (
    <svg width={56} height={56} viewBox="0 0 56 56" className="shrink-0" aria-hidden="true">
      <circle cx={28} cy={28} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-slate-100" />
      <circle
        cx={28} cy={28} r={r} fill="none"
        stroke="currentColor" strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        className={colorClass}
        style={{ transition: "stroke-dasharray 0.4s ease" }}
      />
    </svg>
  );
}

// ── Bed Card ─────────────────────────────────────────────

function BedCard({ bed, onSelect }: { bed: IGDBed; onSelect: (b: IGDBed) => void }) {
  if (bed.status === "Tersedia") {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 p-3 text-center transition-colors duration-150 hover:border-emerald-300 hover:bg-emerald-50">
        <BedDouble size={16} className="text-emerald-400" />
        <p className="text-[10px] font-bold text-emerald-600">{bed.nomor}</p>
        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
          Tersedia
        </span>
      </div>
    );
  }

  if (bed.status === "Maintenance") {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 text-center">
        <Wrench size={15} className="text-slate-400" />
        <p className="text-[10px] font-bold text-slate-500">{bed.nomor}</p>
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
          Maintenance
        </span>
      </div>
    );
  }

  // Terisi
  const triageBg = bed.triage ? TRIAGE_BED_BG[bed.triage] : "border-sky-200 bg-sky-50";
  const bCls     = bed.boardingJam !== undefined ? boardingTimeClasses(bed.boardingJam) : null;

  return (
    <button
      onClick={() => onSelect(bed)}
      className={cn(
        "flex cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
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
      <p className="truncate text-[11px] font-semibold leading-tight text-slate-800">
        {bed.pasienNama}
      </p>
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
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Pasien</span>
          <span className="font-semibold text-slate-800">{bed.pasienNama}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No. RM</span>
          <span className="font-mono text-slate-700">{bed.pasienRM}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Masuk Sejak</span>
          <span className="text-slate-700">{bed.masukSejak}</span>
        </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

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
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30"
          >
            <X size={15} />
          </button>
        </div>

        {/* Occupancy summary strip */}
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

        {/* Bed grid + detail side panel */}
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
            { label: "Terisi",      cls: "border-2 border-rose-300 bg-rose-50" },
            { label: "Maintenance", cls: "border-2 border-dashed border-slate-300 bg-slate-50" },
          ].map(({ label, cls }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={cn("h-3.5 w-5 rounded", cls)} />
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Category Summary Card ─────────────────────────────────

function KategoriCard({
  kategori, rooms, onOpen,
}: { kategori: IGDKategoriRuangan; rooms: IGDRuangan[]; onOpen: () => void }) {
  const cfg     = KATEGORI_CFG[kategori];
  const KatIcon = cfg.icon;
  const occ     = calcOccupancy(rooms);
  const pctFull = occ.total === 0 ? 0 : occ.terisi / occ.total;
  const isCritical = pctFull >= 0.85;

  const boarding        = kategori === "BOARDING_BED" ? calcBoardingStats(rooms) : null;
  const boardingCritical = boarding ? boarding.avgJam > 6 : false;
  const bCls            = boarding ? boardingTimeClasses(boarding.avgJam) : null;

  const showAlert = isCritical || boardingCritical;

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
        cfg.cardBorder,
        `ring-1 ${cfg.ring}`,
      )}
    >
      {/* Colored top bar */}
      <div className={cn("flex items-center justify-between px-4 py-3", cfg.header)}>
        <div className="flex items-center gap-2">
          {cfg.pulse && showAlert && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
          )}
          <KatIcon
            size={14}
            className="text-white transition-transform duration-200 group-hover:scale-110"
          />
          <p className="text-sm font-black tracking-wide text-white">{cfg.label}</p>
        </div>
        {showAlert && (
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-bold text-white">
            {boardingCritical ? "LAMA" : "PENUH"}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <p className="text-[11px] text-slate-500">{cfg.desc}</p>

        {/* Occupancy ring + numbers */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <OccupancyRing occupied={occ.terisi} total={occ.total} colorClass={cfg.arc} />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[11px] font-black leading-none text-slate-700">
                {Math.round(pctFull * 100)}
                <span className="text-[8px] text-slate-400">%</span>
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <div>
              <p className="text-xl font-black tabular-nums text-slate-900">
                {occ.terisi}
                <span className="text-sm font-medium text-slate-400">/{occ.total}</span>
              </p>
              <p className="text-[10px] text-slate-400">bed terisi</p>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600">{occ.tersedia} tersedia</p>
          </div>
        </div>

        {/* Boarding wait stats — BOARDING_BED only */}
        {boarding && bCls && (
          <div className={cn("flex items-center justify-between rounded-xl border px-3 py-2.5", bCls.bg)}>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Avg. Boarding</p>
              <p className={cn("mt-0.5 text-base font-black tabular-nums leading-none", bCls.text)}>
                {boarding.avgJam}
                <span className="ml-0.5 text-[10px] font-semibold">jam</span>
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Maks.</p>
              <p className={cn("mt-0.5 text-base font-black tabular-nums leading-none", bCls.text)}>
                {boarding.maxJam}
                <span className="ml-0.5 text-[10px] font-semibold">jam</span>
              </p>
            </div>
          </div>
        )}

        {/* Room list */}
        <div className="space-y-1.5">
          {rooms.map((room) => {
            const rOcc = calcOccupancy([room]);
            const rPct = rOcc.total === 0 ? 0 : rOcc.terisi / rOcc.total;
            return (
              <div key={room.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-[10px] font-medium text-slate-600">{room.nama}</p>
                    <p className="ml-1 shrink-0 text-[10px] font-semibold text-slate-500">
                      {rOcc.terisi}/{rOcc.total}
                    </p>
                  </div>
                  <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        rPct >= 1 ? "bg-rose-500" : rPct >= 0.7 ? "bg-amber-400" : "bg-emerald-500",
                      )}
                      style={{ width: `${rPct * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer CTA */}
      <div className={cn("border-t px-4 py-3", cfg.cardBorder, cfg.cardBg)}>
        <button
          onClick={onOpen}
          className={cn(
            "flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all duration-150",
            cfg.cardBorder,
            "bg-white text-slate-700 hover:opacity-90",
          )}
        >
          <BedDouble size={12} />
          {kategori === "BOARDING_BED" ? "Monitor Boarding" : "Lihat Peta Kamar"}
          <ChevronRight
            size={12}
            className="ml-auto transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </button>
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────

const KATEGORI_ORDER: IGDKategoriRuangan[] = ["BEDAH", "NON_BEDAH", "IRDA", "IRDO", "BOARDING_BED"];

export default function IGDRuanganPanel({ ruangan }: { ruangan: IGDRuangan[] }) {
  const [openKategori, setOpenKategori] = useState<IGDKategoriRuangan | null>(null);

  const grouped = KATEGORI_ORDER.reduce<Record<IGDKategoriRuangan, IGDRuangan[]>>(
    (acc, k) => {
      acc[k] = ruangan.filter((r) => r.kategori === k);
      return acc;
    },
    {} as Record<IGDKategoriRuangan, IGDRuangan[]>,
  );

  return (
    <>
      {/* Panel header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BedDouble size={15} className="text-slate-500" />
          <p className="text-sm font-bold text-slate-700">Klasifikasi Ruangan IGD</p>
        </div>
        <p className="hidden text-[11px] text-slate-400 sm:block">Klik kamar untuk melihat detail bed</p>
      </div>

      {/* Category grid — 1col mobile → 2col sm → 3col lg → 5col xl */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {KATEGORI_ORDER.map((k) => (
          <KategoriCard
            key={k}
            kategori={k}
            rooms={grouped[k]}
            onOpen={() => setOpenKategori(k)}
          />
        ))}
      </div>

      {/* Bed map modal */}
      {openKategori && (
        <BedMapModal
          kategori={openKategori}
          rooms={grouped[openKategori]}
          onClose={() => setOpenKategori(null)}
        />
      )}
    </>
  );
}
