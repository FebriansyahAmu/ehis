"use client";

/**
 * INACBGResultCard — display hasil grouper INA-CBG Legacy (Mode B).
 * Amber accent · tarif per-kelas table · legacy warning banner.
 * isReference=true: panel sekunder Mode C (tanpa warning banner).
 */

import { motion } from "framer-motion";
import { Clock, Tag, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/eklaim/money";
import type { InaCbgLegacyResult, KelasRawat } from "@/lib/eklaim/eklaimShared";
import { SEVERITY_STYLE, getInaCbgTarifForKelas, kelasTarifLabel } from "./grouperShared";

interface Props {
  result: InaCbgLegacyResult;
  kelas: KelasRawat;
  /** True jika ditampilkan sebagai panel sekunder di Mode C Comparator. */
  isReference?: boolean;
}

type InaCbgTarif = InaCbgLegacyResult["tarif"];

interface KelasRow {
  key: keyof InaCbgTarif;
  label: string;
  matchKelas: ReadonlyArray<KelasRawat>;
}

const KELAS_ROWS: ReadonlyArray<KelasRow> = [
  { key: "kelas3", label: "Kelas III", matchKelas: ["Kelas_3"] },
  { key: "kelas2", label: "Kelas II",  matchKelas: ["Kelas_2"] },
  { key: "kelas1", label: "Kelas I",   matchKelas: ["Kelas_1", "KRIS"] },
  { key: "vip",    label: "VIP",       matchKelas: ["VIP"] },
];

export default function INACBGResultCard({ result, kelas, isReference }: Props) {
  const sv = SEVERITY_STYLE[result.severity];
  const tarifAktual = getInaCbgTarifForKelas(result.tarif, kelas);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border shadow-sm",
        isReference ? "border-amber-200 bg-amber-50/20" : "border-slate-200 bg-white",
      )}
    >
      {/* Accent strip */}
      <div className="h-1.5 bg-linear-to-r from-amber-400 via-orange-400 to-yellow-400" />

      {/* Legacy warning (primary mode only) */}
      {!isReference && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2">
          <TriangleAlert size={13} strokeWidth={2.2} className="shrink-0 text-amber-600" />
          <p className="text-[11.5px] font-semibold text-amber-800">
            Mode INA-CBG Legacy — sistem pengelompokan pra-Oktober 2025.
          </p>
        </div>
      )}

      {/* Header: code · group · severity · tarif aktual */}
      <div className="flex flex-wrap items-start gap-4 px-5 py-4">
        {/* Code block */}
        <div className="flex flex-col gap-1.5">
          <div className="rounded-xl bg-linear-to-br from-amber-500 to-orange-500 px-4 py-2.5 shadow-sm">
            <span className="font-mono text-2xl font-black tracking-widest text-white">
              {result.code}
            </span>
          </div>
          <div className="flex gap-1.5">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-700">
              INA-CBG
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500">
              {result.versiGrouper}
            </span>
          </div>
        </div>

        {/* Group + severity */}
        <div className="min-w-[120px] flex-1">
          <p className="text-[13px] font-bold leading-snug text-slate-800">{result.group}</p>
          <div
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5",
              sv.bg, sv.border,
            )}
          >
            <span className={cn("text-xl font-black leading-none", sv.text)}>
              {["I", "II", "III"][result.severity - 1]}
            </span>
            <span className={cn("text-[12px] font-semibold", sv.text)}>
              {result.severity === 1 ? "Ringan" : result.severity === 2 ? "Sedang" : "Berat"}
            </span>
          </div>
        </div>

        {/* Tarif aktual */}
        <div className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-right">
          <p className="text-[11px] font-medium text-amber-700">Tarif Aktual</p>
          <p className="font-mono text-lg font-black text-amber-900">{formatRupiah(tarifAktual)}</p>
          <p className="text-[10.5px] text-amber-600">{kelasTarifLabel(kelas)}</p>
        </div>
      </div>

      {/* Tarif per kelas table */}
      <div className="overflow-x-auto border-t border-slate-100 px-5 pb-4 pt-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Tarif per Kelas Rawat
        </p>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Kelas
              </th>
              <th className="pb-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Tarif INA-CBG
              </th>
              <th className="w-5" />
            </tr>
          </thead>
          <tbody>
            {KELAS_ROWS.map((row, i) => {
              const isActive = row.matchKelas.includes(kelas);
              return (
                <motion.tr
                  key={row.key}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.18 }}
                  className={cn(
                    "border-b border-slate-50 last:border-0",
                    isActive && "bg-amber-50/80",
                  )}
                >
                  <td
                    className={cn(
                      "py-2 text-[13px]",
                      isActive ? "font-semibold text-amber-800" : "text-slate-600",
                    )}
                  >
                    {row.label}
                    {isActive && (
                      <span className="ml-2 rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Pasien
                      </span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "py-2 text-right font-mono font-semibold",
                      isActive ? "text-base text-amber-900" : "text-[13px] text-slate-700",
                    )}
                  >
                    {formatRupiah(result.tarif[row.key])}
                  </td>
                  <td className="py-2 pl-2">
                    {isActive && <span className="block h-2 w-2 rounded-full bg-amber-500" />}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-2.5">
        <Tag size={11} strokeWidth={2} className="shrink-0 text-slate-400" />
        <span className="text-[11.5px] text-slate-500">{result.versiGrouper}</span>
        <Clock size={11} strokeWidth={2} className="ml-auto shrink-0 text-slate-400" />
        <span className="text-[11.5px] text-slate-500">
          {new Date(result.timestampGroup).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
