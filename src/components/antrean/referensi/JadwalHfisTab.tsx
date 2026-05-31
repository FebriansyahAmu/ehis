"use client";

// ANT6 — Jadwal Dokter HFIS: tarik/sinkron jadwal dari HFIS → mengisi Master
// (single source /ehis-master/jadwal-dokter). Antrean & RJ consume dari Master.

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, RefreshCw, Wifi, ExternalLink, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useJadwalDokter, syncFromHFIS } from "@/lib/master/jadwalDokterStore";

export function JadwalHfisTab() {
  const jadwal = useJadwalDokter();
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const stats = useMemo(() => {
    const lastSync = jadwal.reduce((mx, d) => Math.max(mx, d.syncedAt ?? 0), 0);
    const slots = jadwal.reduce((n, d) => n + d.slots.length, 0);
    const fromHfis = jadwal.filter((d) => d.sumber === "HFIS").length;
    return { dokter: jadwal.length, slots, lastSync, fromHfis };
  }, [jadwal]);

  const handleSync = () => {
    setSyncing(true);
    setJustSynced(false);
    setTimeout(() => {
      syncFromHFIS();
      setSyncing(false);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 2500);
    }, 1100);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <p className="m-xs text-amber-800">
          Jadwal dokter <span className="font-semibold">tidak disimpan di modul antrean</span>. Sinkronisasi HFIS mengisi{" "}
          <span className="font-mono font-semibold">/ehis-master/jadwal-dokter</span> sebagai sumber tunggal — Antrean & Rawat Jalan consume dari sana.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <CalendarClock className="h-6 w-6" />
            </span>
            <div>
              <p className="m-base font-bold text-slate-800">Sinkron Jadwal dari HFIS</p>
              <p className="flex items-center gap-1.5 m-tiny text-slate-500">
                <Wifi className="h-3.5 w-3.5" />
                {stats.lastSync
                  ? `Terakhir: ${new Date(stats.lastSync).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                  : "Belum pernah sinkron"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 m-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            {syncing ? "Menarik dari HFIS…" : "Tarik & Sinkron"}
          </button>
        </div>

        {justSynced && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 m-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Sinkron selesai — {stats.dokter} dokter · {stats.slots} slot diperbarui di Master.
          </p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Dokter" value={stats.dokter} />
          <Stat label="Slot Mingguan" value={stats.slots} />
          <Stat label="Sumber HFIS" value={stats.fromHfis} />
        </div>
      </div>

      <Link
        href="/ehis-master/jadwal-dokter"
        className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 m-xs font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-50"
      >
        Buka Master Jadwal Dokter <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
      <p className="text-xl font-extrabold leading-none text-slate-800 tabular-nums">{value}</p>
      <p className="mt-1 m-tiny text-slate-400">{label}</p>
    </div>
  );
}
