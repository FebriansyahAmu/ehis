"use client";

// ANT6 — Referensi Poli HFIS: mapping poli RS ↔ poli BPJS (read-only mock).

import { useState } from "react";
import { Search, ArrowRight, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { POLI_HFIS_MAP } from "@/lib/antrean/refMock";

export function PoliHfisTab() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = POLI_HFIS_MAP.filter(
    (m) => !q || `${m.rsKode} ${m.rsNama} ${m.bpjsKode} ${m.bpjsNama}`.toLowerCase().includes(q),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-xs text-slate-500">
          Mapping poli internal RS ke kode poli BPJS (HFIS). Dipakai saat kirim antrean & SEP. <span className="font-mono">{POLI_HFIS_MAP.length} poli</span>.
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari poli…"
            className="w-60 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 m-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-4 py-3 m-tiny font-bold uppercase tracking-wide text-slate-400">Poli RS</th>
              <th className="px-4 py-3" />
              <th className="px-4 py-3 m-tiny font-bold uppercase tracking-wide text-slate-400">Poli BPJS (HFIS)</th>
              <th className="px-4 py-3 text-right m-tiny font-bold uppercase tracking-wide text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.rsKode} className="border-b border-slate-100 last:border-0 hover:bg-sky-50/30">
                <td className="px-4 py-3">
                  <p className="m-sm font-semibold text-slate-700">{m.rsNama}</p>
                  <p className="m-tiny font-mono text-slate-400">{m.rsKode}</p>
                </td>
                <td className="px-2 py-3 text-center">
                  <ArrowRight className="mx-auto h-4 w-4 text-slate-300" />
                </td>
                <td className="px-4 py-3">
                  <p className="m-sm font-semibold text-slate-700">{m.bpjsNama}</p>
                  <p className="m-tiny font-mono text-slate-400">{m.bpjsKode}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 m-tiny font-semibold",
                      m.aktif ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", m.aktif ? "bg-emerald-500" : "bg-slate-400")} />
                    {m.aktif ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="flex items-center gap-2 m-tiny text-slate-400">
        <Network className="h-3.5 w-3.5" /> Sumber: WS <span className="font-mono">ref/poli</span> HFIS (mock). Read-only.
      </p>
    </div>
  );
}
