"use client";

// ANT6 — Referensi Mobile JKN: kapasitas/kuota JKN & non-JKN per poli + jam praktik.
// Derive dari Master Jadwal Dokter (single source) — bukan data terpisah.

import { useMemo } from "react";
import Link from "next/link";
import { Smartphone, Info, ExternalLink, ShieldCheck, Wallet, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useJadwalDokter } from "@/lib/master/jadwalDokterStore";

interface PoliCap {
  poliKode: string;
  poliNama: string;
  dokter: number;
  kuotaJKN: number;
  kuotaNonJKN: number;
  jamMin: string;
  jamMax: string;
}

export function MobileJknTab() {
  const jadwal = useJadwalDokter();

  const caps = useMemo<PoliCap[]>(() => {
    const map = new Map<string, PoliCap>();
    for (const d of jadwal) {
      const c = map.get(d.poliKode) ?? {
        poliKode: d.poliKode,
        poliNama: d.poliNama,
        dokter: 0,
        kuotaJKN: 0,
        kuotaNonJKN: 0,
        jamMin: "23:59",
        jamMax: "00:00",
      };
      c.dokter += 1;
      for (const s of d.slots) {
        c.kuotaJKN += s.kuotaJKN;
        c.kuotaNonJKN += s.kuotaNonJKN;
        if (s.jamMulai < c.jamMin) c.jamMin = s.jamMulai;
        if (s.jamSelesai > c.jamMax) c.jamMax = s.jamSelesai;
      }
      map.set(d.poliKode, c);
    }
    return Array.from(map.values()).sort((a, b) => a.poliNama.localeCompare(b.poliNama));
  }, [jadwal]);

  const totalJKN = caps.reduce((n, c) => n + c.kuotaJKN, 0);
  const totalNon = caps.reduce((n, c) => n + c.kuotaNonJKN, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
        <p className="m-xs text-sky-800">
          Kapasitas yang dipublikasikan ke <span className="font-semibold">Mobile JKN</span> diturunkan dari{" "}
          <span className="font-mono font-semibold">/ehis-master/jadwal-dokter</span> (kuota mingguan per poli). Read-only.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Summary icon={Users} label="Poli Terlayani" value={caps.length} tone="bg-sky-100 text-sky-600" />
        <Summary icon={ShieldCheck} label="Kuota JKN / Minggu" value={totalJKN} tone="bg-emerald-100 text-emerald-600" />
        <Summary icon={Wallet} label="Kuota Non-JKN / Minggu" value={totalNon} tone="bg-slate-100 text-slate-600" />
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-4 py-3 m-tiny font-bold uppercase tracking-wide text-slate-400">Poli</th>
              <th className="px-4 py-3 text-center m-tiny font-bold uppercase tracking-wide text-slate-400">Dokter</th>
              <th className="px-4 py-3 text-center m-tiny font-bold uppercase tracking-wide text-slate-400">Jam Praktik</th>
              <th className="px-4 py-3 text-center m-tiny font-bold uppercase tracking-wide text-slate-400">Kuota JKN</th>
              <th className="px-4 py-3 text-center m-tiny font-bold uppercase tracking-wide text-slate-400">Kuota Non-JKN</th>
            </tr>
          </thead>
          <tbody>
            {caps.map((c) => (
              <tr key={c.poliKode} className="border-b border-slate-100 last:border-0 hover:bg-sky-50/30">
                <td className="px-4 py-3">
                  <p className="m-sm font-semibold text-slate-700">{c.poliNama}</p>
                  <p className="m-tiny font-mono text-slate-400">{c.poliKode}</p>
                </td>
                <td className="px-4 py-3 text-center m-sm font-semibold text-slate-600 tabular-nums">{c.dokter}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 m-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" /> {c.jamMin}–{c.jamMax}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 m-xs font-bold text-emerald-700 tabular-nums">{c.kuotaJKN}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 m-xs font-bold text-slate-600 tabular-nums">{c.kuotaNonJKN}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link
        href="/ehis-master/jadwal-dokter"
        className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 m-xs font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-50"
      >
        <Smartphone className="h-3.5 w-3.5" /> Atur kuota di Master Jadwal Dokter <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function Summary({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="m-tiny font-medium text-slate-500">{label}</p>
        <p className="text-xl font-extrabold leading-tight text-slate-800 tabular-nums">{value}</p>
      </div>
    </div>
  );
}
