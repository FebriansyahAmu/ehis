"use client";

// Alur pasien hari ini: satu bilah proporsi (hiasan, aria-hidden) + angka per tahap
// sebagai daftar berurutan. Warna tahap = langkah netral; hanya tahap terpadat yang
// memakai aksen, dan selalu disertai teks "terpadat" (tidak bergantung warna).

import { cn } from "@/lib/utils";
import type { Tahap, TahapKey } from "./berandaStats";

const WARNA: Record<TahapKey | "batal", string> = {
  belumHadir: "bg-slate-300",
  admisi: "bg-slate-400",
  poli: "bg-slate-500",
  farmasi: "bg-slate-600",
  selesai: "bg-emerald-500",
  batal: "bg-rose-400",
};

export function AlurPasienPanel({
  tahap,
  batal,
  terpadat,
}: {
  tahap: Tahap[];
  batal: number;
  terpadat: TahapKey | null;
}) {
  const total = tahap.reduce((n, t) => n + t.count, 0) + batal;
  const segmen = [...tahap.map((t) => ({ key: t.key, count: t.count })), { key: "batal" as const, count: batal }];

  return (
    <section aria-labelledby="alur-judul" className="rounded-2xl bg-white p-5 ring-1 ring-slate-900/8 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="alur-judul" className="m-lg font-medium text-slate-900">Alur pasien hari ini</h2>
        <p className="m-sm text-slate-500">
          <span className="tabular-nums text-slate-700">{total}</span> antrean
          {batal > 0 && (
            <>
              {" · "}
              <span className="tabular-nums">{batal}</span> batal atau tidak hadir
            </>
          )}
        </p>
      </div>

      <div aria-hidden="true" className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {segmen
          .filter((s) => s.count > 0)
          .map((s) => (
            <span
              key={s.key}
              className={cn("h-full", s.key === terpadat ? "bg-indigo-500" : WARNA[s.key])}
              style={{ flexGrow: s.count }}
            />
          ))}
      </div>

      <ol className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {tahap.map((t) => {
          const padat = t.key === terpadat;
          return (
            <li key={t.key} className="min-w-0 lg:border-l lg:border-slate-900/6 lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
              <p className="flex items-center gap-2 m-sm text-slate-600">
                <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", padat ? "bg-indigo-500" : WARNA[t.key])} />
                {t.label}
              </p>
              <p className={cn("mt-2 text-3xl font-medium leading-none tabular-nums", padat ? "text-indigo-700" : "text-slate-900")}>
                {t.count}
              </p>
              <p className="mt-2 m-xs text-slate-500">
                {t.rincian}
                {padat && <span className="text-indigo-700"> · terpadat</span>}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
