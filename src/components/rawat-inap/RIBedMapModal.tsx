"use client";

// Modal Informasi Tempat Tidur RI — REFERENSI informatif (read-only). Mengganti panel collapse.
// Menampilkan seluruh bed bangsal RI (master Location) + okupansi nyata (alokasi aktif):
// Tersedia · Terisi (+ pasien) · Dipesan · Nonaktif. Dikelompokkan per bangsal, dengan
// ringkasan, filter status/kelas, dan pencarian. Modelnya selaras BedMapModal admisi,
// diperluas lintas-bangsal + lebih informatif. Tanpa aksi tulis (reservasi via flow admisi).

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  X, Search, BedDouble, BedSingle, User, Clock3, CircleSlash, DoorOpen, CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RIKelas } from "@/lib/data";
import {
  type BedItem, type BedState, RI_KELAS_CFG, RI_KELAS_ORDER, countBeds,
} from "./riLandingShared";

type Filter = "all" | "available" | "occupied";

const STATE_LABEL: Record<BedState, string> = {
  available: "Tersedia", occupied: "Terisi", reserved: "Dipesan", inactive: "Nonaktif",
};

export function RIBedMapModal({
  items,
  onClose,
  initialKelas = "Semua",
}: {
  items: BedItem[];
  onClose: () => void;
  // Pra-filter saat dibuka dari kartu kelas tertentu; "Semua" = tampilkan semua bangsal.
  initialKelas?: RIKelas | "Semua";
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [kelas, setKelas] = useState<RIKelas | "Semua">(initialKelas);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const counts = useMemo(() => countBeds(items), [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (kelas !== "Semua" && it.kelas !== kelas) return false;
      if (filter === "available" && it.state !== "available") return false;
      if (filter === "occupied" && it.state !== "occupied" && it.state !== "reserved") return false;
      if (!needle) return true;
      return (
        it.bed.kode.toLowerCase().includes(needle) ||
        it.bed.name.toLowerCase().includes(needle) ||
        it.room.name.toLowerCase().includes(needle) ||
        (it.alloc?.pasienNama ?? "").toLowerCase().includes(needle) ||
        (it.alloc?.pasienNoRm ?? "").toLowerCase().includes(needle)
      );
    });
  }, [items, q, filter, kelas]);

  // Kelompokkan hasil per bangsal (ruangan), urut sesuai prioritas kelas.
  const groups = useMemo(() => {
    const byRoom = new Map<string, { room: BedItem["room"]; kelas: RIKelas; beds: BedItem[] }>();
    for (const it of filtered) {
      const g = byRoom.get(it.room.id) ?? { room: it.room, kelas: it.kelas, beds: [] };
      g.beds.push(it);
      byRoom.set(it.room.id, g);
    }
    return [...byRoom.values()].sort(
      (a, b) => RI_KELAS_ORDER.indexOf(a.kelas) - RI_KELAS_ORDER.indexOf(b.kelas) || a.room.name.localeCompare(b.room.name, "id"),
    );
  }, [filtered]);

  const kelasOptions = useMemo(() => {
    const present = new Set(items.map((it) => it.kelas));
    return RI_KELAS_ORDER.filter((k) => present.has(k));
  }, [items]);

  const body = (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-70 flex bg-slate-900/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }} transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl ring-1 ring-black/5"
      >
        {/* Header + ringkasan */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <DoorOpen size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900">Informasi Tempat Tidur — Rawat Inap</h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Okupansi seluruh bangsal RI dari master tempat tidur · referensi (read-only)
                </p>
              </div>
            </div>
            <button
              onClick={onClose} aria-label="Tutup"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Stat icon={BedDouble} label="Total" value={counts.total} tone="slate" />
            <Stat icon={BedSingle} label="Tersedia" value={counts.available} tone="emerald" />
            <Stat icon={User} label="Terisi" value={counts.occupied} tone="rose" />
            <Stat icon={Clock3} label="Dipesan" value={counts.reserved} tone="amber" />
            {counts.inactive > 0 && <Stat icon={CircleSlash} label="Nonaktif" value={counts.inactive} tone="slate" />}
            <span className="ml-auto flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">BOR</span>
              <span className={cn("text-sm font-black tabular-nums", counts.bor >= 85 ? "text-rose-600" : counts.bor >= 60 ? "text-amber-600" : "text-emerald-600")}>
                {counts.bor}%
              </span>
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white/60 px-5 py-3 sm:px-6">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Cari bed / bangsal / pasien…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <select
            value={kelas} onChange={(e) => setKelas(e.target.value as RIKelas | "Semua")}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            aria-label="Filter kelas"
          >
            <option value="Semua">Semua Kelas</option>
            {kelasOptions.map((k) => <option key={k} value={k}>{RI_KELAS_CFG[k].label}</option>)}
          </select>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
            {([["all", "Semua"], ["available", "Tersedia"], ["occupied", "Terisi"]] as [Filter, string][]).map(([f, lab]) => (
              <button
                key={f} onClick={() => setFilter(f)}
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

        {/* Grid per bangsal */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {groups.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <BedDouble size={28} className="text-slate-300" />
              <p className="text-sm font-medium text-slate-400">Tidak ada bed cocok</p>
              <p className="text-[11px] text-slate-400">Ubah kata kunci atau filter.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((g) => {
                const cfg = RI_KELAS_CFG[g.kelas];
                const KIcon = cfg.icon;
                const gc = countBeds(g.beds);
                return (
                  <section key={g.room.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className={cn("flex h-6 w-6 items-center justify-center rounded-lg text-white", cfg.header)}>
                        <KIcon size={13} />
                      </span>
                      <p className="text-sm font-bold text-slate-800">{g.room.name}</p>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">{g.room.kode}</span>
                      <span className="ml-auto text-[11px] text-slate-400">
                        <span className="font-black tabular-nums text-slate-700">{gc.occupied + gc.reserved}</span>/{gc.total} terisi · <span className="font-semibold text-emerald-600">{gc.available} tersedia</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {g.beds.map((it) => <BedCard key={it.bed.id} item={it} />)}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex shrink-0 flex-wrap items-center gap-4 border-t border-slate-200 bg-white px-5 py-3 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Keterangan</p>
          {([
            ["available", "Tersedia", "border-emerald-300 bg-emerald-50"],
            ["occupied", "Terisi", "border-rose-200 bg-rose-50"],
            ["reserved", "Dipesan", "border-amber-200 bg-amber-50"],
            ["inactive", "Nonaktif", "border-dashed border-slate-200 bg-slate-50"],
          ] as [BedState, string, string][]).map(([s, lab, cls]) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={cn("h-3.5 w-5 rounded border-2", cls)} />
              <span className="text-[10px] text-slate-500">{lab}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(body, document.body);
}

// ── Kartu bed (informatif) ──────────────────────────────────────────────────────
function BedCard({ item }: { item: BedItem }) {
  const { bed, state, alloc } = item;

  if (state === "available") {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <BedDouble size={16} />
          </span>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-100" />
        </div>
        <div>
          <p className="font-mono text-sm font-bold text-slate-800">{bed.kode}</p>
          <p className="truncate text-[10px] text-slate-400">{bed.name}</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Tersedia</span>
      </div>
    );
  }

  if (state === "inactive") {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 opacity-80">
        <div className="flex items-center justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><BedDouble size={16} /></span>
          <CircleSlash size={15} className="text-slate-300" />
        </div>
        <div>
          <p className="font-mono text-sm font-bold text-slate-400">{bed.kode}</p>
          <p className="truncate text-[10px] text-slate-300">{bed.name}</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">Nonaktif</span>
      </div>
    );
  }

  // occupied / reserved
  const reserved = state === "reserved";
  const tone = reserved
    ? { border: "border-amber-200 bg-amber-50/70", icon: "bg-amber-100 text-amber-600 ring-amber-200", badge: "bg-amber-100 text-amber-700", info: "ring-amber-100 text-amber-700", rm: "text-amber-400" }
    : { border: "border-rose-200 bg-rose-50/60", icon: "bg-rose-100 text-rose-600 ring-rose-200", badge: "bg-rose-200/70 text-rose-700", info: "ring-rose-100 text-rose-700", rm: "text-rose-400" };
  const admit = reserved ? alloc?.reservedAt : alloc?.occupiedAt ?? alloc?.reservedAt;

  return (
    <div
      title={`${bed.kode} — ${alloc?.pasienNama ?? STATE_LABEL[state]}`}
      className={cn("flex flex-col gap-2 rounded-xl border p-3", tone.border)}
    >
      <div className="flex items-center justify-between">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg ring-1", tone.icon)}><BedDouble size={16} /></span>
        <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold", tone.badge)}>
          {reserved ? <Clock3 size={9} /> : <User size={9} />}{reserved ? "Dipesan" : "Terisi"}
        </span>
      </div>
      <div>
        <p className="font-mono text-sm font-bold text-slate-700">{bed.kode}</p>
        <p className="truncate text-[10px] text-slate-400">{bed.name}</p>
      </div>
      <div className={cn("rounded-lg bg-white/70 px-2 py-1 ring-1", tone.info)}>
        <p className="flex items-center gap-1 text-[10px] font-semibold">
          <User size={9} className="shrink-0" />
          <span className="truncate">{alloc?.pasienNama ?? "Pasien"}</span>
        </p>
        {alloc?.pasienNoRm && <p className={cn("truncate font-mono text-[9px]", tone.rm)}>{alloc.pasienNoRm}</p>}
        {admit && (
          <p className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-400">
            <CalendarDays size={8} />
            {new Date(admit).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Stat pill ────────────────────────────────────────────────────────────────────
const TONE: Record<"slate" | "emerald" | "rose" | "amber", string> = {
  slate: "bg-slate-100 text-slate-600",
  emerald: "bg-emerald-100 text-emerald-700",
  rose: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-700",
};
function Stat({ icon: Icon, label, value, tone }: { icon: typeof BedDouble; label: string; value: number; tone: keyof typeof TONE }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold", TONE[tone])}>
      <Icon size={13} />
      <span className="tabular-nums">{value}</span>
      <span className="font-medium opacity-70">{label}</span>
    </span>
  );
}
