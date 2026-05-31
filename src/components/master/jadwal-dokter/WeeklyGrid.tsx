"use client";

// Master Jadwal Dokter — grid mingguan: baris = dokter, kolom = 7 hari.
// Sel berisi slot (jam + kuota) yang bisa diklik untuk edit, atau "+" untuk tambah.

import { Plus, Wifi, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { HARI_ALL, type Hari, type JadwalDokter, type JadwalSlot } from "@/lib/master/jadwalDokterStore";

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  Aktif: { label: "Aktif", cls: "bg-emerald-50 text-emerald-700" },
  Cuti: { label: "Cuti", cls: "bg-amber-50 text-amber-700" },
  Nonaktif: { label: "Nonaktif", cls: "bg-slate-100 text-slate-500" },
};

export function WeeklyGrid({
  rows,
  onEdit,
}: {
  rows: JadwalDokter[];
  onEdit: (dokter: JadwalDokter, hari: Hari, slot?: JadwalSlot) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
        Tidak ada dokter sesuai filter.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="sticky left-0 z-10 bg-slate-50/80 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Dokter
            </th>
            {HARI_ALL.map((h) => (
              <th key={h} className="min-w-[120px] px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.dokterKode} className="border-b border-slate-100 align-top last:border-0">
              {/* Dokter cell */}
              <td className="sticky left-0 z-10 bg-white px-4 py-3">
                <p className="text-sm font-bold text-slate-800">{d.dokterNama}</p>
                <p className="text-[11px] text-slate-500">{d.poliNama} · {d.spesialis}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", STATUS_CFG[d.status]?.cls)}>
                    {STATUS_CFG[d.status]?.label}
                  </span>
                  {d.sumber === "HFIS" && (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-600">
                      <Wifi className="h-2.5 w-2.5" /> HFIS
                    </span>
                  )}
                </div>
              </td>

              {/* Hari cells */}
              {HARI_ALL.map((h) => {
                const slot = d.slots.find((s) => s.hari === h);
                return (
                  <td key={h} className="px-2 py-2 text-center">
                    {slot ? (
                      <button
                        type="button"
                        onClick={() => onEdit(d, h, slot)}
                        className="group flex w-full flex-col gap-1 rounded-xl border border-sky-200 bg-sky-50/60 px-2 py-2 text-left transition hover:border-sky-300 hover:bg-sky-50"
                      >
                        <span className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold tabular-nums text-slate-700">
                            {slot.jamMulai}–{slot.jamSelesai}
                          </span>
                          <Pencil className="h-3 w-3 text-sky-400 opacity-0 transition group-hover:opacity-100" />
                        </span>
                        <span className="flex flex-wrap gap-1">
                          <KuotaPill label="JKN" value={slot.kuotaJKN} tone="bg-emerald-100 text-emerald-700" />
                          <KuotaPill label="Non" value={slot.kuotaNonJKN} tone="bg-slate-100 text-slate-600" />
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEdit(d, h)}
                        className="flex h-full min-h-[52px] w-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-slate-300 transition hover:border-sky-300 hover:bg-sky-50/40 hover:text-sky-500"
                        title={`Tambah slot ${h}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KuotaPill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums", tone)}>
      {label} {value}
    </span>
  );
}
