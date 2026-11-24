"use client";

// Navigasi penjamin (pengganti dropdown filter): daftar kiri di layar lebar, baris chip geser di
// ponsel. Item terpilih ditandai aria-current + garis aksen; tiap item menampilkan cakupan kode
// (bilah + angka) dan status penjamin bila tidak aktif.

import { Layers } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { MappingRuanganRecord, PenjaminRecord } from "@/lib/master/penjaminStore";
import { STATUS_CFG, TIPE_CFG } from "@/components/master/penjamin/penjaminShared";
import { coverageOf, pct } from "./prShared";

function Bar({ value }: { value: number }) {
  return (
    <span aria-hidden="true" className="block h-1 w-full overflow-hidden rounded-full bg-slate-200/80">
      <span
        className={cn("block h-full rounded-full transition-[width] duration-300", value === 100 ? "bg-emerald-500" : value >= 50 ? "bg-teal-500" : "bg-amber-500")}
        style={{ width: `${value}%` }}
      />
    </span>
  );
}

export function PenjaminNav({ penjaminList, mappings, selected, onSelect }: {
  penjaminList: PenjaminRecord[];
  mappings: MappingRuanganRecord[];
  /** "all" atau id penjamin. */
  selected: string;
  onSelect: (id: string) => void;
}) {
  const totalKode = penjaminList.reduce((n, p) => n + p.kelas.length, 0);
  const totalMapped = penjaminList.reduce((n, p) => n + coverageOf(p, mappings).mapped, 0);

  const itemCls = (on: boolean) => cn(
    "group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition",
    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-600",
    "before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:transition",
    on ? "bg-emerald-50 before:bg-emerald-600" : "hover:bg-slate-50 before:bg-transparent",
  );

  return (
    <nav aria-label="Penjamin" className="min-w-0">
      <ul className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin] lg:flex-col lg:gap-0.5 lg:overflow-x-visible lg:pb-0">
        <li className="w-56 shrink-0 lg:w-auto">
          <button type="button" onClick={() => onSelect("all")} aria-current={selected === "all" ? "true" : undefined} className={itemCls(selected === "all")}>
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Layers className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate m-sm font-semibold text-slate-900">Semua penjamin</span>
                <span className="shrink-0 m-tiny tabular-nums text-slate-500">{totalMapped}/{totalKode}</span>
              </span>
              <span className="mt-1 block"><Bar value={pct(totalMapped, totalKode)} /></span>
            </span>
          </button>
        </li>
        {penjaminList.map((p) => {
          const cfg = TIPE_CFG[p.tipe];
          const Icon = cfg.icon;
          const cov = coverageOf(p, mappings);
          const on = selected === p.id;
          return (
            <li key={p.id} className="w-56 shrink-0 lg:w-auto">
              <button type="button" onClick={() => onSelect(p.id)} aria-current={on ? "true" : undefined} className={itemCls(on)}>
                <span aria-hidden="true" className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", cfg.bg, cfg.text, cfg.ring)}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={cn("truncate m-sm font-semibold", on ? "text-emerald-950" : "text-slate-800")}>{p.nama}</span>
                    <span className="shrink-0 m-tiny tabular-nums text-slate-500">{cov.mapped}/{cov.total}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5">
                    <span className="m-mini font-bold tracking-wide text-slate-500">{cfg.short}</span>
                    {p.status !== "Aktif" && (
                      <span className={cn("rounded px-1 m-mini font-semibold", STATUS_CFG[p.status].bg, STATUS_CFG[p.status].text)}>
                        {STATUS_CFG[p.status].label}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block"><Bar value={pct(cov.mapped, cov.total)} /></span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
