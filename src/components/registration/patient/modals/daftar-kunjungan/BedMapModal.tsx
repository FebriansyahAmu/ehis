"use client";

// Bed-map visual (fullscreen) — pengganti dropdown bed di admisi Rawat Inap. Menampilkan
// seluruh bed ruangan terpilih sebagai kartu: HIJAU = tersedia (klik untuk reservasi),
// MERAH = terisi (+ nama pasien pemakai), abu = tidak aktif. Dipakai dari StepKunjunganRi.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  BedDouble, X, Search, Check, CheckCircle2, User, DoorOpen,
  CircleSlash, Clock3, BedSingle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationNode, BedSubRecord } from "@/components/master/ruangan/ruanganShared";
import type { BedAllocationDTO } from "@/lib/api/bedAllocation";

type BedState = "available" | "occupied" | "unavailable";
type Filter = "all" | "available" | "occupied";

interface BedView {
  bed: BedSubRecord;
  state: BedState;
  alloc?: BedAllocationDTO;
}

interface BedMapModalProps {
  room: LocationNode;
  /** bedId → alokasi aktif (untuk tandai terisi + nama pemakai). */
  allocByBed: Map<string, BedAllocationDTO>;
  selectedBedId: string;
  onSelect: (bed: BedSubRecord) => void;
  onClose: () => void;
}

export function BedMapModal({ room, allocByBed, selectedBedId, onSelect, onClose }: BedMapModalProps) {
  const [pick, setPick] = useState(selectedBedId);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // Esc untuk tutup.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const views = useMemo<BedView[]>(() => {
    return [...room.beds]
      .sort((a, b) => a.kode.localeCompare(b.kode, "id", { numeric: true }))
      .map((bed) => {
        const alloc = allocByBed.get(bed.id);
        const state: BedState =
          bed.status !== "active" ? "unavailable" : alloc ? "occupied" : "available";
        return { bed, state, alloc };
      });
  }, [room.beds, allocByBed]);

  const counts = useMemo(
    () => ({
      total: views.length,
      available: views.filter((v) => v.state === "available").length,
      occupied: views.filter((v) => v.state === "occupied").length,
      unavailable: views.filter((v) => v.state === "unavailable").length,
    }),
    [views],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return views.filter((v) => {
      if (filter === "available" && v.state !== "available") return false;
      if (filter === "occupied" && v.state !== "occupied") return false;
      if (!needle) return true;
      return (
        v.bed.kode.toLowerCase().includes(needle) ||
        v.bed.name.toLowerCase().includes(needle) ||
        (v.alloc?.pasienNama ?? "").toLowerCase().includes(needle)
      );
    });
  }, [views, filter, q]);

  const pickedBed = views.find((v) => v.bed.id === pick && v.state === "available")?.bed ?? null;

  const confirm = () => {
    if (pickedBed) { onSelect(pickedBed); onClose(); }
  };

  const body = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-70 flex bg-slate-900/60 p-3 backdrop-blur-sm sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl ring-1 ring-black/5"
      >
        {/* ── Header ── */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <DoorOpen size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  {room.name}
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
                    {room.kode}
                  </span>
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Pilih bed yang tersedia untuk reservasi rawat inap
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup peta bed"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>

          {/* Ringkasan + legenda */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Stat icon={BedDouble} label="Total" value={counts.total} tone="slate" />
            <Stat icon={BedSingle} label="Tersedia" value={counts.available} tone="emerald" />
            <Stat icon={User} label="Terisi" value={counts.occupied} tone="rose" />
            {counts.unavailable > 0 && (
              <Stat icon={CircleSlash} label="Tidak Aktif" value={counts.unavailable} tone="slate" />
            )}
          </div>
        </div>

        {/* ── Toolbar: search + filter ── */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white/60 px-5 py-3 sm:px-6">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari bed / pasien…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
            {([
              ["all", "Semua"],
              ["available", "Tersedia"],
              ["occupied", "Terisi"],
            ] as [Filter, string][]).map(([f, lab]) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-semibold transition",
                  filter === f ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700",
                )}
              >
                {lab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Grid bed ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <BedDouble size={28} className="text-slate-300" />
              <p className="text-sm font-medium text-slate-400">Tidak ada bed cocok</p>
              <p className="text-[11px] text-slate-400">Ubah kata kunci atau filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.map((v) => (
                <BedCard
                  key={v.bed.id}
                  view={v}
                  selected={v.bed.id === pick}
                  onPick={() => v.state === "available" && setPick(v.bed.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer: konfirmasi ── */}
        <div className="flex shrink-0 items-center gap-3 border-t border-slate-200 bg-white px-5 py-3.5 sm:px-6">
          <div className="min-w-0 flex-1 text-xs">
            {pickedBed ? (
              <span className="flex items-center gap-1.5 text-slate-600">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                Bed direservasi:{" "}
                <span className="font-mono font-bold text-slate-800">{pickedBed.kode}</span>
                <span className="truncate text-slate-400">· {pickedBed.name}</span>
              </span>
            ) : (
              <span className="text-slate-400">Belum ada bed dipilih — ketuk kartu hijau.</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            Batal
          </button>
          <button
            onClick={confirm}
            disabled={!pickedBed}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition active:scale-[0.98]",
              pickedBed
                ? "cursor-pointer bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            <Check size={14} /> Reservasi Bed Ini
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(body, document.body);
}

// ── Kartu bed ──────────────────────────────────────────────────────────────────
function BedCard({ view, selected, onPick }: { view: BedView; selected: boolean; onPick: () => void }) {
  const { bed, state, alloc } = view;

  if (state === "available") {
    return (
      <button
        onClick={onPick}
        className={cn(
          "group relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3 text-left transition active:scale-[0.98]",
          selected
            ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
            : "border-emerald-200 bg-white hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-100/60",
        )}
      >
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg ring-1 transition",
              selected
                ? "bg-emerald-600 text-white ring-emerald-600"
                : "bg-emerald-50 text-emerald-600 ring-emerald-100 group-hover:bg-emerald-100",
            )}
          >
            <BedDouble size={16} />
          </span>
          {selected ? (
            <CheckCircle2 size={18} className="text-emerald-600" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-100" />
          )}
        </div>
        <div>
          <p className="font-mono text-sm font-bold text-slate-800">{bed.kode}</p>
          <p className="truncate text-[10px] text-slate-400">{bed.name}</p>
        </div>
        {selected ? (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
            <Check size={10} /> Direservasi
          </span>
        ) : (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            Tersedia
          </span>
        )}
      </button>
    );
  }

  if (state === "occupied") {
    const occupied = alloc?.status === "Occupied";
    return (
      <div
        title={`${bed.kode} — ${alloc?.pasienNama ?? "Terisi"}`}
        className="relative flex cursor-not-allowed flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3"
      >
        <div className="flex items-center justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600 ring-1 ring-rose-200">
            <BedDouble size={16} />
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
              occupied ? "bg-rose-200/70 text-rose-700" : "bg-amber-100 text-amber-700",
            )}
          >
            {occupied ? <User size={9} /> : <Clock3 size={9} />}
            {occupied ? "Ditempati" : "Dipesan"}
          </span>
        </div>
        <div>
          <p className="font-mono text-sm font-bold text-slate-700">{bed.kode}</p>
          <p className="truncate text-[10px] text-slate-400">{bed.name}</p>
        </div>
        <div className="rounded-lg bg-white/70 px-2 py-1 ring-1 ring-rose-100">
          <p className="flex items-center gap-1 text-[10px] font-semibold text-rose-700">
            <User size={9} className="shrink-0" />
            <span className="truncate">{alloc?.pasienNama ?? "Pasien"}</span>
          </p>
          {alloc?.pasienNoRm && (
            <p className="truncate font-mono text-[9px] text-rose-400">{alloc.pasienNoRm}</p>
          )}
        </div>
      </div>
    );
  }

  // unavailable
  return (
    <div className="relative flex cursor-not-allowed flex-col gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 opacity-80">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
          <BedDouble size={16} />
        </span>
        <CircleSlash size={15} className="text-slate-300" />
      </div>
      <div>
        <p className="font-mono text-sm font-bold text-slate-400">{bed.kode}</p>
        <p className="truncate text-[10px] text-slate-300">{bed.name}</p>
      </div>
      <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">
        Tidak Aktif
      </span>
    </div>
  );
}

// ── Stat pill (header) ──────────────────────────────────────────────────────────
const TONE: Record<"slate" | "emerald" | "rose", string> = {
  slate: "bg-slate-100 text-slate-600",
  emerald: "bg-emerald-100 text-emerald-700",
  rose: "bg-rose-100 text-rose-700",
};
function Stat({
  icon: Icon, label, value, tone,
}: {
  icon: typeof BedDouble;
  label: string;
  value: number;
  tone: "slate" | "emerald" | "rose";
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold", TONE[tone])}>
      <Icon size={13} />
      <span className="tabular-nums">{value}</span>
      <span className="font-medium opacity-70">{label}</span>
    </span>
  );
}
