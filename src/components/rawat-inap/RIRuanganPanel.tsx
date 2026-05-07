"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BedDouble, Activity, HeartPulse, ShieldAlert, Crown, Star, Users,
  X, Wrench, CalendarClock, AlertTriangle, LogOut,
} from "lucide-react";
import type { RIKelas, RIRuangan, RIBed, RIPenjamin } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Config ────────────────────────────────────────────────

interface KelasCfg {
  label:  string;
  icon:   LucideIcon;
  header: string;
  pulse?: boolean;
}

const KELAS_CFG: Record<RIKelas, KelasCfg> = {
  ICU:     { label: "ICU",     icon: Activity,    header: "bg-rose-600",   pulse: true },
  HCU:     { label: "HCU",     icon: HeartPulse,  header: "bg-amber-500",  pulse: true },
  Isolasi: { label: "Isolasi", icon: ShieldAlert, header: "bg-teal-600"               },
  VIP:     { label: "VIP",     icon: Crown,       header: "bg-violet-600"             },
  Kelas_1: { label: "Kelas 1", icon: Star,        header: "bg-indigo-600"             },
  Kelas_2: { label: "Kelas 2", icon: BedDouble,   header: "bg-sky-600"                },
  Kelas_3: { label: "Kelas 3", icon: Users,       header: "bg-slate-500"              },
};

const PENJAMIN_LABEL: Record<RIPenjamin, string> = {
  BPJS_PBI: "BPJS PBI", BPJS_Non_PBI: "BPJS Non-PBI",
  Umum: "Umum", Asuransi: "Asuransi", Jamkesda: "Jamkesda",
};

// ── Helpers ───────────────────────────────────────────────

function calcOcc(beds: RIBed[]) {
  return {
    total:       beds.length,
    terisi:      beds.filter((b) => b.status === "Terisi").length,
    tersedia:    beds.filter((b) => b.status === "Tersedia").length,
    dipesan:     beds.filter((b) => b.status === "Dipesan").length,
    maintenance: beds.filter((b) => b.status === "Maintenance").length,
  };
}

// ── Ward Row (census view) ────────────────────────────────

function WardRow({ ruangan, onOpen }: { ruangan: RIRuangan; onOpen: () => void }) {
  const cfg           = KELAS_CFG[ruangan.kelas];
  const KatIcon       = cfg.icon;
  const occ           = calcOcc(ruangan.beds);
  const pct           = occ.total === 0 ? 0 : occ.terisi / occ.total;
  const criticalCount = ruangan.beds.filter((b) => b.isKritis).length;
  const barColor      = pct >= 0.85 ? "bg-rose-500" : pct >= 0.6 ? "bg-amber-400" : "bg-emerald-500";

  return (
    <div className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/60">

      {/* Ward icon + label */}
      <div className="flex w-28 shrink-0 items-center gap-2.5">
        <div className={cn(
          "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          cfg.header,
        )}>
          {cfg.pulse && criticalCount > 0 && (
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

      {/* Occupancy progress bar */}
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

      {/* Critical alert — shown only when relevant */}
      <div className="w-20 shrink-0 text-right">
        {criticalCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700">
            <AlertTriangle size={8} />
            {criticalCount} kritis
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

function BedCard({ bed, kelas, onSelect }: {
  bed: RIBed; kelas: RIKelas; onSelect: (b: RIBed) => void;
}) {
  void kelas;

  if (bed.status === "Tersedia") return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 p-3 text-center">
      <BedDouble size={14} className="text-emerald-400" />
      <p className="text-[10px] font-black text-emerald-700">{bed.nomor}</p>
      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">Tersedia</span>
    </div>
  );

  if (bed.status === "Dipesan") return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/60 p-3 text-center">
      <CalendarClock size={14} className="text-indigo-400" />
      <p className="text-[10px] font-black text-indigo-700">{bed.nomor}</p>
      <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600">Dipesan</span>
    </div>
  );

  if (bed.status === "Maintenance") return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 text-center">
      <Wrench size={14} className="text-slate-400" />
      <p className="text-[10px] font-black text-slate-500">{bed.nomor}</p>
      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">Maintenance</span>
    </div>
  );

  const bedCls = bed.isKritis
    ? "border-rose-300 bg-rose-50"
    : bed.rencanaKeluar
    ? "border-emerald-300 bg-emerald-50"
    : "border-slate-200 bg-white";

  return (
    <button type="button" onClick={() => onSelect(bed)}
      className={cn(
        "flex cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-3 text-left transition-all hover:shadow-md",
        bedCls,
      )}>
      <div className="flex items-center justify-between gap-1">
        <p className="text-[10px] font-black text-slate-700">{bed.nomor}</p>
        <div className="flex items-center gap-0.5">
          {bed.isKritis && (
            <span className="flex h-4 w-4 items-center justify-center rounded bg-rose-500">
              <AlertTriangle size={9} className="text-white" />
            </span>
          )}
          {bed.rencanaKeluar && (
            <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500">
              <LogOut size={9} className="text-white" />
            </span>
          )}
        </div>
      </div>
      <p className="truncate text-[11px] font-semibold leading-tight text-slate-800">{bed.pasienNama}</p>
      <p className="text-[9px] text-slate-500">Hari ke-{bed.hariKe}</p>
    </button>
  );
}

// ── Bed Detail Panel ──────────────────────────────────────

function BedDetailPanel({ bed, onClose }: { bed: RIBed; onClose: () => void }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tempat Tidur</p>
          <p className="text-sm font-black text-slate-800">{bed.nomor}</p>
        </div>
        <button type="button" onClick={onClose}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50">
          <X size={12} />
        </button>
      </div>
      <div className="space-y-2 text-xs">
        {bed.isKritis && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-2.5 py-1.5 text-rose-700">
            <AlertTriangle size={11} />
            <span className="text-[10px] font-bold">PASIEN KRITIS</span>
          </div>
        )}
        {bed.rencanaKeluar && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-700">
            <LogOut size={11} />
            <span className="text-[10px] font-bold">RENCANA PULANG HARI INI</span>
          </div>
        )}
        {[
          { label: "Nama Pasien",    value: bed.pasienNama },
          { label: "No. RM",         value: bed.pasienRM,  mono: true },
          { label: "Hari Perawatan", value: `Hari ke-${bed.hariKe}` },
          { label: "Penjamin",       value: bed.penjamin ? PENJAMIN_LABEL[bed.penjamin] : undefined },
        ].map(({ label, value, mono }) =>
          value ? (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <p className={cn("font-semibold text-slate-800", mono && "font-mono")}>{value}</p>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

// ── Bed Map Modal ─────────────────────────────────────────

function BedMapModal({ ruangan, onClose }: { ruangan: RIRuangan; onClose: () => void }) {
  const cfg      = KELAS_CFG[ruangan.kelas];
  const KatIcon  = cfg.icon;
  const occ      = calcOcc(ruangan.beds);
  const pctFull  = occ.total === 0 ? 0 : occ.terisi / occ.total;
  const [selectedBed, setSelectedBed] = useState<RIBed | null>(null);

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

        {/* Header */}
        <div className={cn("flex shrink-0 items-center justify-between px-5 py-4", cfg.header)}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <KatIcon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Peta Kamar</p>
              <p className="text-sm font-black text-white">{ruangan.nama} — {cfg.label}</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30">
            <X size={15} />
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid shrink-0 grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50">
          {[
            { label: "Total",       value: occ.total,       cls: "text-slate-700"   },
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

        {/* BOR bar */}
        <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-2.5">
          <div className="flex items-center gap-3">
            <p className="shrink-0 text-[10px] font-bold text-slate-400">BOR</p>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn("h-full rounded-full transition-all duration-700",
                  pctFull >= 0.85 ? "bg-rose-500" : pctFull >= 0.6 ? "bg-amber-400" : "bg-emerald-500")}
                style={{ width: `${pctFull * 100}%` }}
              />
            </div>
            <p className="shrink-0 text-[10px] font-black tabular-nums text-slate-700">
              {Math.round(pctFull * 100)}%
            </p>
          </div>
        </div>

        {/* Bed grid + detail panel */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {ruangan.beds.map((bed) => (
                <BedCard key={bed.id} bed={bed} kelas={ruangan.kelas}
                  onSelect={(b) => setSelectedBed(selectedBed?.id === b.id ? null : b)} />
              ))}
            </div>
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
            { label: "Tersedia",       cls: "border-2 border-dashed border-emerald-300 bg-emerald-50" },
            { label: "Dipesan",        cls: "border-2 border-dashed border-indigo-300 bg-indigo-50"   },
            { label: "Terisi",         cls: "border-2 border-slate-200 bg-white"                      },
            { label: "Kritis",         cls: "border-2 border-rose-300 bg-rose-50"                     },
            { label: "Rencana Pulang", cls: "border-2 border-emerald-400 bg-emerald-100"              },
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

// ── Main Panel ────────────────────────────────────────────

const KELAS_ORDER: RIKelas[] = ["ICU", "HCU", "Isolasi", "VIP", "Kelas_1", "Kelas_2", "Kelas_3"];

export default function RIRuanganPanel({ ruangan }: { ruangan: RIRuangan[] }) {
  const [openRuangan, setOpenRuangan] = useState<RIRuangan | null>(null);

  const byKelas = KELAS_ORDER.reduce<Partial<Record<RIKelas, RIRuangan>>>((acc, k) => {
    acc[k] = ruangan.find((r) => r.kelas === k);
    return acc;
  }, {});

  const totalBeds     = ruangan.reduce((s, r) => s + r.beds.length, 0);
  const totalTerisi   = ruangan.reduce((s, r) => s + r.beds.filter((b) => b.status === "Terisi").length, 0);
  const totalTersedia = ruangan.reduce((s, r) => s + r.beds.filter((b) => b.status === "Tersedia").length, 0);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <BedDouble size={14} className="text-slate-500" />
            <p className="text-sm font-bold text-slate-700">Sensus Kamar</p>
          </div>
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
        </div>

        {/* Ward rows */}
        <div className="divide-y divide-slate-50">
          {KELAS_ORDER.map((k) => {
            const r = byKelas[k];
            if (!r) return null;
            return <WardRow key={k} ruangan={r} onOpen={() => setOpenRuangan(r)} />;
          })}
        </div>
      </div>

      {openRuangan && (
        <BedMapModal ruangan={openRuangan} onClose={() => setOpenRuangan(null)} />
      )}
    </>
  );
}
