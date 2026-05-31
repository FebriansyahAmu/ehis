"use client";

// ANT3.4 — Jadwal Dokter: tampilan READ-ONLY hasil consume. Source of truth =
// sub-menu Master `/ehis-master/jadwal-dokter` (prasyarat, belum dibangun). Jangan duplikasi.

import Link from "next/link";
import { CalendarClock, Clock, Info, ExternalLink, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { POLI_ONSITE, listDokterByPoli, type DokterOnsite } from "@/lib/antrean/onsiteMock";

export function JadwalDokterTab() {
  const poliWithDokter = POLI_ONSITE.map((p) => ({ poli: p, dokter: listDokterByPoli(p.kode) })).filter(
    (g) => g.dokter.length > 0,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Cross-link source of truth */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
          <p className="m-xs text-sky-800">
            Jadwal dikelola di <span className="font-mono font-semibold">/ehis-master/jadwal-dokter</span> (single source, tarik via HFIS).
            Di sini hanya <span className="inline-flex items-center gap-1 font-semibold"><Lock className="h-3 w-3" /> baca-saja</span> untuk verifikasi mapping antrean.
          </p>
        </div>
        <Link
          href="/ehis-master"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 m-xs font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-100"
        >
          Buka Master <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {poliWithDokter.map(({ poli, dokter }) => (
        <section key={poli.kode} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div>
              <p className="m-sm font-bold text-slate-800">{poli.nama}</p>
              <p className="m-tiny font-mono text-slate-400">{poli.kode} · {dokter.length} dokter</p>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {dokter.map((d) => (
              <DokterCard key={d.kode} d={d} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DokterCard({ d }: { d: DokterOnsite }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5">
      <div>
        <p className="m-sm font-bold text-slate-800">{d.nama}</p>
        <p className="flex items-center gap-1.5 m-tiny text-slate-400">
          <Clock className="h-3.5 w-3.5" /> {d.jamPraktik} · {d.menitPerPasien} mnt/pasien
        </p>
      </div>
      <KuotaRow label="JKN" terisi={d.terisiJKN} total={d.kuotaJKN} tone="bg-emerald-500" />
      <KuotaRow label="Non-JKN" terisi={d.terisiNonJKN} total={d.kuotaNonJKN} tone="bg-slate-400" />
    </div>
  );
}

function KuotaRow({ label, terisi, total, tone }: { label: string; terisi: number; total: number; tone: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((terisi / total) * 100)) : 0;
  const penuh = terisi >= total;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between m-tiny">
        <span className="font-medium text-slate-500">{label}</span>
        <span className={cn("font-bold tabular-nums", penuh ? "text-rose-500" : "text-slate-600")}>
          {terisi}/{total}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full", penuh ? "bg-rose-400" : tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
