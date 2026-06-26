"use client";

// Mapping Hub → "DPJP BPJS". Petakan dokter RS ↔ kode DPJP BPJS (V-Claim referensi dokter).
// Self-fetch (board + picker via API). Sumbu Dokter↔kode (bukan ×Penjamin). Referensi di-sync
// dari BPJS (mock=seed demo selama belum ada cons-id).

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Stethoscope, RefreshCw, Search, Loader2, Link2, Unlink, Pencil, Plus,
  CheckCircle2, AlertCircle, Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { makeInitials } from "../mappingShared";
import {
  listDpjpBoard, setDpjpMapping, removeDpjpMapping, syncDpjpReferences,
  type DpjpBoardRow,
} from "@/lib/api/bpjs/dpjpMapping";
import { RefDpjpPickerModal } from "./RefDpjpPickerModal";

const errMsg = (e: unknown): string | undefined => (e instanceof Error ? e.message : undefined);

export default function DpjpBpjsPane() {
  const [rows, setRows] = useState<DpjpBoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ dokterId: string; nama: string; currentKode: string | null } | null>(null);

  const reload = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await listDpjpBoard(signal);
      setRows(data);
      setError(false);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    reload(ac.signal);
    return () => ac.abort();
  }, [reload]);

  const stats = useMemo(() => {
    const total = rows.length;
    const mapped = rows.filter((r) => r.mapped).length;
    return { total, mapped, unmapped: total - mapped, pct: total ? Math.round((mapped / total) * 100) : 0 };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.nama.toLowerCase().includes(q) || r.spesialisKode.toLowerCase().includes(q) || (r.mapped?.kode ?? "").includes(q),
    );
  }, [rows, search]);

  async function doSync() {
    setSyncing(true);
    try {
      const r = await syncDpjpReferences();
      toast.success("Referensi BPJS tersinkron", `${r.spesialis} spesialis · ${r.dpjp} dokter DPJP`);
    } catch (e) {
      toast.error("Gagal sinkron referensi", errMsg(e));
    } finally {
      setSyncing(false);
    }
  }

  async function doMap(dokterId: string, kode: string) {
    setBusyId(dokterId);
    try {
      await setDpjpMapping(dokterId, kode);
      toast.success("Dokter dipetakan");
      await reload();
    } catch (e) {
      toast.error("Gagal memetakan", errMsg(e));
    } finally {
      setBusyId(null);
      setPicker(null);
    }
  }

  async function doUnmap(row: DpjpBoardRow) {
    setBusyId(row.dokterId);
    try {
      await removeDpjpMapping(row.dokterId);
      toast.success("Mapping dilepas");
      await reload();
    } catch (e) {
      toast.error("Gagal melepas", errMsg(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
            <Stethoscope size={19} />
          </span>
          <div>
            <h2 className="m-sm font-bold text-slate-900">DPJP BPJS</h2>
            <p className="m-tiny text-slate-400">Petakan dokter RS ke kode DPJP BPJS (V-Claim referensi dokter)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={doSync}
          disabled={syncing}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {syncing ? "Menyinkron…" : "Sinkronkan Referensi BPJS"}
        </button>
      </div>

      {/* Stats + search */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
        <Stat label="Total Dokter" value={stats.total} tone="slate" />
        <Stat label="Ter-map" value={stats.mapped} tone="emerald" />
        <Stat label="Belum" value={stats.unmapped} tone="amber" />
        <div className="hidden min-w-32 flex-1 items-center gap-2 sm:flex">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${stats.pct}%` }} />
          </div>
          <span className="text-[10px] font-bold text-slate-500">{stats.pct}%</span>
        </div>
        <div className="relative w-full sm:w-56">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari dokter / spesialis…"
            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-[12px] text-slate-800 placeholder:text-slate-300 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
            <Loader2 size={16} className="animate-spin text-cyan-500" />
            <span className="text-[13px]">Memuat dokter…</span>
          </div>
        ) : error ? (
          <EmptyState icon={AlertCircle} title="Gagal memuat" desc="Periksa koneksi lalu coba lagi." tone="rose" />
        ) : rows.length === 0 ? (
          <EmptyState icon={Inbox} title="Belum ada dokter" desc="Lengkapi profil dokter di master Dokter & Nakes." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="Tidak ada hasil" desc="Coba kata kunci lain." />
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filtered.map((row) => (
                <motion.div
                  key={row.dokterId}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                >
                  {/* Dokter */}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-[12px] font-bold text-cyan-700 ring-1 ring-cyan-100">
                    {makeInitials(row.nama)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-slate-800">{row.nama}</p>
                    <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      {row.spesialisKode}
                    </span>
                  </div>

                  {/* Mapping status + aksi */}
                  {row.mapped ? (
                    <div className="flex items-center gap-2">
                      <div className="hidden min-w-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 sm:flex">
                        <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
                        <span className="font-mono text-[12px] font-bold text-emerald-700">{row.mapped.kode}</span>
                        <span className="max-w-40 truncate text-[11px] text-emerald-600">· {row.mapped.nama}</span>
                      </div>
                      <button
                        type="button"
                        disabled={busyId === row.dokterId}
                        onClick={() => setPicker({ dokterId: row.dokterId, nama: row.nama, currentKode: row.mapped?.kode ?? null })}
                        className="flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 disabled:opacity-50"
                      >
                        <Pencil size={12} /> Ganti
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.dokterId}
                        onClick={() => doUnmap(row)}
                        aria-label="Lepas mapping"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      >
                        {busyId === row.dokterId ? <Loader2 size={13} className="animate-spin" /> : <Unlink size={13} />}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="hidden items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 ring-1 ring-amber-200 sm:inline-flex">
                        <Link2 size={10} /> Belum dipetakan
                      </span>
                      <button
                        type="button"
                        disabled={busyId === row.dokterId}
                        onClick={() => setPicker({ dokterId: row.dokterId, nama: row.nama, currentKode: null })}
                        className="flex h-8 cursor-pointer items-center gap-1 rounded-lg bg-cyan-600 px-3 text-[11px] font-semibold text-white shadow-sm transition hover:bg-cyan-700 active:scale-95 disabled:opacity-50"
                      >
                        <Plus size={13} /> Petakan
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {picker && (
          <RefDpjpPickerModal
            dokterId={picker.dokterId}
            dokterNama={picker.nama}
            currentKode={picker.currentKode}
            onSelect={(kode) => doMap(picker.dokterId, kode)}
            onClose={() => setPicker(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────
function Stat({ label, value, tone }: { label: string; value: number; tone: "slate" | "emerald" | "amber" }) {
  const cfg = {
    slate: "text-slate-700",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  }[tone];
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={cn("text-[15px] font-bold tabular-nums", cfg)}>{value}</span>
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
    </div>
  );
}

function EmptyState({
  icon: Icon, title, desc, tone = "slate",
}: {
  icon: typeof Inbox;
  title: string;
  desc: string;
  tone?: "slate" | "rose";
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <span className={cn(
        "flex h-12 w-12 items-center justify-center rounded-2xl",
        tone === "rose" ? "bg-rose-50 text-rose-300" : "bg-slate-50 text-slate-300",
      )}>
        <Icon size={24} />
      </span>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="max-w-xs text-xs text-slate-400">{desc}</p>
    </div>
  );
}
