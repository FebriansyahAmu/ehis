"use client";

// ANT3.4 — Jadwal Dokter: tampilan READ-ONLY hasil consume Master Jadwal Dokter
// (single source: /ehis-master/jadwal-dokter, tarik via HFIS). Jangan duplikasi.

import Link from "next/link";
import { useMemo } from "react";
import { CalendarClock, Clock, Info, ExternalLink, Lock, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { useJadwalDokter, HARI_ALL, type JadwalDokter } from "@/lib/master/jadwalDokterStore";

export function JadwalDokterTab() {
  const jadwal = useJadwalDokter();

  const byPoli = useMemo(() => {
    const map = new Map<string, { nama: string; dokter: JadwalDokter[] }>();
    for (const d of jadwal) {
      const g = map.get(d.poliKode) ?? { nama: d.poliNama, dokter: [] };
      g.dokter.push(d);
      map.set(d.poliKode, g);
    }
    return Array.from(map, ([kode, g]) => ({ kode, ...g }));
  }, [jadwal]);

  return (
    <div className="flex flex-col gap-4">
      {/* Cross-link source of truth */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
          <p className="m-xs text-sky-800">
            Dikonsumsi dari <span className="font-mono font-semibold">/ehis-master/jadwal-dokter</span> (single source, tarik via HFIS).
            Di sini <span className="inline-flex items-center gap-1 font-semibold"><Lock className="h-3 w-3" /> baca-saja</span> — ubah jadwal & kuota di Master.
          </p>
        </div>
        <Link
          href="/ehis-master/jadwal-dokter"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 m-xs font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-100"
        >
          Kelola di Master <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {byPoli.map((poli) => (
        <section key={poli.kode} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div>
              <p className="m-sm font-bold text-slate-800">{poli.nama}</p>
              <p className="m-tiny font-mono text-slate-400">{poli.kode} · {poli.dokter.length} dokter</p>
            </div>
          </div>

          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {poli.dokter.map((d) => (
              <DokterCard key={d.dokterKode} d={d} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DokterCard({ d }: { d: JadwalDokter }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-sm font-bold text-slate-800">{d.dokterNama}</p>
          <p className="m-tiny text-slate-400">{d.spesialis}</p>
        </div>
        {d.sumber === "HFIS" && (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 m-mini font-semibold text-sky-600">
            <Wifi className="h-3 w-3" /> HFIS
          </span>
        )}
      </div>

      {d.slots.length === 0 ? (
        <p className="m-tiny italic text-slate-300">Belum ada jadwal.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {HARI_ALL.map((h) => {
            const slot = d.slots.find((s) => s.hari === h);
            if (!slot) return null;
            return (
              <div key={h} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                <span className="flex items-center gap-2 m-xs">
                  <span className="w-12 font-semibold text-slate-600">{h}</span>
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Clock className="h-3 w-3" /> {slot.jamMulai}–{slot.jamSelesai}
                  </span>
                </span>
                <span className="flex gap-1">
                  <Pill label="JKN" value={slot.kuotaJKN} tone="bg-emerald-100 text-emerald-700" />
                  <Pill label="Non" value={slot.kuotaNonJKN} tone="bg-slate-200 text-slate-600" />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Pill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 m-mini font-semibold tabular-nums", tone)}>
      {label} {value}
    </span>
  );
}
