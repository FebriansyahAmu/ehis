"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Droplets, ArrowDownToLine, ArrowUpFromLine, GlassWater, Heart, MoreHorizontal, Minus, AlertCircle } from "lucide-react";
import type { IOEntry, IntakeKategori, OutputKategori } from "@/lib/data";
import { cn } from "@/lib/utils";
import { INTAKE_CATS, OUTPUT_CATS, INTAKE_CHIP, OUTPUT_CHIP, detectShift, fmtVol } from "./ioShared";

// ── Types ───────────────────────────────────────────────────

interface Props {
  todayEntries: IOEntry[];        // entries for today only
  onAdd:        (entry: Omit<IOEntry, "id">) => void;
  onRemove:     (id: string) => void;
}

// ── Icon map ────────────────────────────────────────────────

const ICONS: Record<string, React.ElementType> = {
  Oral: GlassWater, IV: Droplets, NGT: ArrowDownToLine, Transfusi: Heart, Lainnya: MoreHorizontal,
  Urine: Droplets, Drainase: ArrowDownToLine, Feses: Minus, Muntah: ArrowUpFromLine, Perdarahan: AlertCircle,
};

// ── Helpers ─────────────────────────────────────────────────

function nowTime(): string { return new Date().toTimeString().slice(0, 5); }
function genId():   string { return `io-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

const SHIFTS_ORDER = ["Pagi", "Siang", "Malam"] as const;

// ── Sub-components ──────────────────────────────────────────

function TipeToggle({ value, onChange }: { value: "intake" | "output"; onChange: (v: "intake" | "output") => void }) {
  return (
    <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
      {(["intake", "output"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            "flex-1 cursor-pointer rounded-lg py-2.5 text-sm font-bold transition-all duration-150",
            value === t
              ? t === "intake"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-amber-500 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          {t === "intake" ? "↓  INTAKE (Masuk)" : "↑  OUTPUT (Keluar)"}
        </button>
      ))}
    </div>
  );
}

function CatGrid({
  cats, selected, onSelect,
}: {
  cats: typeof INTAKE_CATS | typeof OUTPUT_CATS;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {cats.map((c) => {
        const Icon = ICONS[c.id] ?? MoreHorizontal;
        const active = selected === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-[11px] font-semibold ring-1 transition-all duration-150",
              active ? c.ring : c.soft + " hover:opacity-80",
            )}
          >
            <Icon size={16} aria-hidden />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Entry list row ───────────────────────────────────────────

function EntryRow({ entry, onRemove }: { entry: IOEntry; onRemove: () => void }) {
  const chipCls = entry.tipe === "intake"
    ? (INTAKE_CHIP[entry.kategori] ?? "bg-slate-100 text-slate-600")
    : (OUTPUT_CHIP[entry.kategori] ?? "bg-slate-100 text-slate-600");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.14 }}
      className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-xs"
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", entry.tipe === "intake" ? "bg-sky-400" : "bg-amber-400")} />
      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", chipCls)}>
        {entry.kategori}
      </span>
      {entry.subKategori && (
        <span className="truncate text-[11px] text-slate-500">{entry.subKategori}</span>
      )}
      <span className="ml-auto shrink-0 text-xs font-bold text-slate-800">{fmtVol(entry.volume)}</span>
      <span className="shrink-0 text-[10px] text-slate-400">{entry.waktu}</span>
      <button
        type="button"
        onClick={onRemove}
        className="cursor-pointer text-slate-300 transition hover:text-rose-500"
        aria-label="Hapus entri"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}

// ── Main ────────────────────────────────────────────────────

export default function EntriPane({ todayEntries, onAdd, onRemove }: Props) {
  const [tipe,        setTipe]        = useState<"intake" | "output">("intake");
  const [kategori,    setKategori]    = useState<string | null>(null);
  const [subKategori, setSubKategori] = useState<string>("");
  const [volume,      setVolume]      = useState<string>("");
  const [waktu,       setWaktu]       = useState<string>(nowTime);
  const [catatan,     setCatatan]     = useState<string>("");

  const cats = tipe === "intake" ? INTAKE_CATS : OUTPUT_CATS;
  const activeCat = cats.find((c) => c.id === kategori);
  const hasSub    = (activeCat?.sub?.length ?? 0) > 0;

  function handleTipeChange(v: "intake" | "output") {
    setTipe(v);
    setKategori(null);
    setSubKategori("");
  }

  function handleKategoriSelect(id: string) {
    setKategori(id);
    setSubKategori("");
  }

  function handleSubmit() {
    const vol = parseInt(volume, 10);
    if (!kategori || isNaN(vol) || vol <= 0) return;
    const shift = detectShift(waktu);
    const tanggal = new Date().toISOString().slice(0, 10);
    onAdd({
      waktu, tanggal, shift, tipe,
      kategori: kategori as IntakeKategori | OutputKategori,
      subKategori: subKategori || undefined,
      volume: vol,
      catatan: catatan || undefined,
    });
    setKategori(null);
    setSubKategori("");
    setVolume("");
    setCatatan("");
    setWaktu(nowTime());
  }

  const isValid = !!kategori && parseInt(volume, 10) > 0;

  // Group today's entries by shift
  const byShift = SHIFTS_ORDER.map((s) => ({
    shift: s,
    entries: todayEntries.filter((e) => e.shift === s).sort((a, b) => a.waktu.localeCompare(b.waktu)),
  })).filter((g) => g.entries.length > 0);

  const todayTotal = {
    intake: todayEntries.filter((e) => e.tipe === "intake").reduce((s, e) => s + e.volume, 0),
    output: todayEntries.filter((e) => e.tipe === "output").reduce((s, e) => s + e.volume, 0),
  };

  return (
    <div className="flex flex-col gap-4">

      {/* ── Form card ── */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">

        {/* Tipe toggle */}
        <TipeToggle value={tipe} onChange={handleTipeChange} />

        {/* Step 1: Kategori */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            1 · Pilih Kategori {tipe === "intake" ? "Masuk" : "Keluar"}
          </p>
          <CatGrid cats={cats} selected={kategori} onSelect={handleKategoriSelect} />
        </div>

        {/* Step 2: SubKategori (if available) */}
        <AnimatePresence>
          {kategori && hasSub && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                2 · Jenis / Sub-Kategori
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeCat!.sub.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubKategori(s === subKategori ? "" : s)}
                    className={cn(
                      "cursor-pointer rounded-full px-3 py-1 text-[11px] font-medium ring-1 transition-all",
                      subKategori === s
                        ? "bg-indigo-600 text-white ring-indigo-600"
                        : "bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300 hover:text-indigo-700",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Volume + Waktu */}
        <AnimatePresence>
          {kategori && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {hasSub ? "3" : "2"} · Volume &amp; Waktu
              </p>
              <div className="flex flex-wrap gap-3">
                {/* Volume */}
                <div className="flex min-w-[140px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="number"
                    min={1}
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-2xl font-bold text-slate-800 outline-none placeholder:text-slate-300"
                  />
                  <span className="shrink-0 text-sm font-semibold text-slate-400">mL</span>
                </div>
                {/* Waktu */}
                <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Waktu</p>
                  <input
                    type="time"
                    value={waktu}
                    onChange={(e) => setWaktu(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-800 outline-none"
                  />
                  <p className="text-[9px] text-slate-400">Shift: {detectShift(waktu)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Catatan (optional) */}
        <AnimatePresence>
          {kategori && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.12 }}
              className="overflow-hidden"
            >
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan (opsional) — mis: drip rate, lumen CVC..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white transition-colors"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          className={cn(
            "flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
            isValid
              ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
              : "cursor-not-allowed bg-slate-100 text-slate-400",
          )}
        >
          <Plus size={15} />
          Tambah Entri
        </button>
      </div>

      {/* ── Today summary chips ── */}
      {todayEntries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-700 ring-1 ring-sky-200">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            Intake hari ini: {fmtVol(todayTotal.intake)}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Output hari ini: {fmtVol(todayTotal.output)}
          </span>
        </div>
      )}

      {/* ── Entry list by shift ── */}
      {byShift.length > 0 ? (
        <div className="flex flex-col gap-3">
          {byShift.map(({ shift, entries }) => (
            <div key={shift}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Shift {shift}
              </p>
              <AnimatePresence>
                {entries.map((e) => (
                  <EntryRow key={e.id} entry={e} onRemove={() => onRemove(e.id)} />
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center shadow-xs">
          <p className="text-sm font-semibold text-slate-400">Belum ada entri hari ini</p>
          <p className="mt-1 text-xs text-slate-400">Tambahkan intake atau output menggunakan form di atas</p>
        </div>
      )}
    </div>
  );
}
