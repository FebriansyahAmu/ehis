"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ClipboardList, Stethoscope, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster } from "@/lib/data";
import { ModalShell } from "../primitives";
import {
  UNIT_CFG,
  KUNJUNGAN_STATUS,
  STATUS_LABEL,
  FILTER_OPTS,
  type FilterStatus,
} from "../config";

export function RiwayatKunjunganModal({
  kunjungan,
  onClose,
}: {
  kunjungan: PatientMaster["riwayatKunjungan"];
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<FilterStatus>("Semua");

  const filtered = useMemo(
    () => (filter === "Semua" ? kunjungan : kunjungan.filter((k) => k.status === filter)),
    [kunjungan, filter],
  );

  return (
    <ModalShell
      title="Riwayat Pendaftaran"
      subtitle="Semua riwayat pendaftaran pasien ini"
      onClose={onClose}
      size="2xl"
    >
      <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-slate-100 px-5 py-3">
        {FILTER_OPTS.map((opt) => {
          const cnt =
            opt.key === "Semua"
              ? kunjungan.length
              : kunjungan.filter((k) => k.status === opt.key).length;
          return (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition",
                filter === opt.key ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
              )}
            >
              {opt.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[9px] font-bold",
                  filter === opt.key ? "bg-white/20 text-white" : "text-slate-400",
                )}
              >
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400">Tidak ada kunjungan.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-200">
                {["No. Pendaftaran", "Tanggal", "Unit", "Penjamin & No. SEP", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((k) => {
                const uc = UNIT_CFG[k.unit];
                const UIcon = uc.icon;
                return (
                  <tr key={k.id} className="group transition-colors hover:bg-indigo-50/40">
                    <td className="px-4 py-3">
                      <p className="font-mono text-[11px] font-semibold text-slate-800">{k.noPendaftaran}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-400">{k.noKunjungan}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-600">{k.tanggal}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold", uc.bg, uc.text)}>
                        <UIcon size={10} aria-hidden="true" />
                        {k.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {k.penjamin ? (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[11px] font-semibold text-slate-700">{k.penjamin}</p>
                          {k.noPenjamin && (
                            <p className="font-mono text-[10px] text-slate-500">No. {k.noPenjamin}</p>
                          )}
                          {k.noSEP ? (
                            <p className="font-mono text-[10px] tracking-widest text-emerald-700">SEP {k.noSEP}</p>
                          ) : (
                            <p className="text-[10px] italic text-slate-400">Tanpa SEP</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold", KUNJUNGAN_STATUS[k.status])}>
                        {STATUS_LABEL[k.status] ?? k.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {k.detailPath ? (
                          <Link
                            href={k.detailPath}
                            onClick={onClose}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-semibold text-teal-600 transition hover:border-teal-300 hover:bg-teal-100"
                          >
                            <ClipboardList size={10} /> Pendaftaran
                          </Link>
                        ) : (
                          <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                            <ClipboardList size={10} /> Pendaftaran
                          </span>
                        )}
                        {k.klinisPath ? (
                          <Link
                            href={k.klinisPath}
                            onClick={onClose}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100"
                          >
                            <Stethoscope size={10} /> Kunjungan
                          </Link>
                        ) : (
                          <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                            <Stethoscope size={10} /> Kunjungan
                          </span>
                        )}
                        <div className="group/icd relative">
                          <button className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600">
                            <Hash size={10} /> ICD
                          </button>
                          <div className="pointer-events-none absolute right-0 top-8 z-30 hidden w-60 rounded-xl border border-slate-200 bg-white p-3 shadow-xl group-hover/icd:block">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Kode ICD-10</p>
                            <p className="mt-1 font-mono text-sm font-bold text-indigo-700">{k.kodeICD ?? "—"}</p>
                            <div className="mt-2 border-t border-slate-100 pt-2">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Diagnosa</p>
                              <p className="mt-0.5 text-[11px] leading-snug text-slate-700">{k.diagnosa}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex shrink-0 justify-end border-t border-slate-100 px-5 py-3">
        <button
          onClick={onClose}
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Tutup
        </button>
      </div>
    </ModalShell>
  );
}
