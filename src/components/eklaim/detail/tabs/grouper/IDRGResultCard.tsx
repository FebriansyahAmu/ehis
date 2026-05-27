"use client";

/**
 * IDRGResultCard — hero card hasil iDRG grouper (Mode A).
 * Menampilkan kode 7-digit, MDC, group, severity + CC/MCC, tarif per tingkat.
 */

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Tag, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/eklaim/money";
import type { iDRGResult, TingkatKompetensiRS } from "@/lib/eklaim/eklaimShared";
import { SEVERITY_STYLE, TINGKAT_LABEL, TINGKAT_ORDER } from "./grouperShared";

interface Props {
  result: iDRGResult;
  tingkatRS: TingkatKompetensiRS;
}

export default function IDRGResultCard({ result, tingkatRS }: Props) {
  const sev = SEVERITY_STYLE[result.severity.level];
  const hasCCMCC =
    result.severity.ccList.length > 0 || result.severity.mccList.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-sky-200 bg-white shadow-sm"
    >
      {/* Decorative top strip */}
      <div className="h-1.5 bg-linear-to-r from-sky-400 via-teal-400 to-emerald-400" />

      {/* Main area */}
      <div className="p-5">
        {/* ── Row 1: Code + Severity ── */}
        <div className="flex flex-wrap items-start gap-4">

          {/* Left — Code + MDC + Group */}
          <div className="flex-1 space-y-2 min-w-0">
            {/* Mode label */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-sky-700">
                <Cpu size={10} strokeWidth={2.5} />
                Mode A · iDRG
              </span>
            </div>

            {/* 7-digit code — hero */}
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-linear-to-br from-sky-500 to-teal-500 px-4 py-2 font-mono text-4xl font-black tracking-[0.14em] text-white shadow-md">
                {result.code}
              </span>
            </div>

            {/* MDC chip + Group name */}
            <div className="space-y-0.5">
              <span className="inline-block rounded-full bg-teal-100 px-2.5 py-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-teal-700">
                {result.mdc}
              </span>
              <p className="text-base font-semibold text-slate-800 leading-snug">
                {result.group}
              </p>
            </div>
          </div>

          {/* Right — Severity badge */}
          <div
            className={cn(
              "flex shrink-0 flex-col items-center rounded-2xl border px-6 py-3.5 shadow-sm",
              sev.bg,
              sev.border,
            )}
          >
            <span className={cn("text-[10.5px] font-bold uppercase tracking-[0.15em]", sev.text)}>
              Severity
            </span>
            <span className={cn("text-5xl font-black leading-none my-1", sev.text)}>
              {result.severity.level}
            </span>
            <span className={cn("text-sm font-bold", sev.text)}>
              {result.severity.label}
            </span>
          </div>
        </div>

        {/* ── CC / MCC chips ── */}
        {hasCCMCC && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {result.severity.mccList.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[12px] font-semibold text-rose-700 ring-1 ring-rose-200"
              >
                MCC · {code}
              </span>
            ))}
            {result.severity.ccList.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[12px] font-semibold text-amber-700 ring-1 ring-amber-200"
              >
                CC · {code}
              </span>
            ))}
          </div>
        )}
        {!hasCCMCC && (
          <p className="mt-2.5 text-[12px] text-slate-400 italic">
            Tidak ada CC/MCC terdeteksi — Severity murni berdasarkan diagnosa primer + LOS
          </p>
        )}

        {/* ── Tarif per tingkat table ── */}
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">
              Tarif iDRG per Tingkat Kompetensi RS
            </p>
          </div>
          <table className="w-full">
            <tbody>
              {TINGKAT_ORDER.map((tingkat, idx) => {
                const isAktual = tingkat === tingkatRS;
                const tarif = result.tarifPerTingkat[tingkat];
                return (
                  <motion.tr
                    key={tingkat}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.2 }}
                    className={cn(
                      "border-b border-slate-100 last:border-0 transition-colors",
                      isAktual
                        ? "bg-emerald-50"
                        : idx % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/40",
                    )}
                  >
                    {/* Tingkat label */}
                    <td className="py-2.5 pl-4 pr-2">
                      <div className="flex items-center gap-2">
                        {isAktual ? (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                        ) : (
                          <span className="h-2 w-2 shrink-0" />
                        )}
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isAktual ? "font-semibold text-emerald-800" : "text-slate-700",
                          )}
                        >
                          {TINGKAT_LABEL[tingkat]}
                        </span>
                        {isAktual && (
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10.5px] font-bold text-white">
                            RS Ini
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tarif */}
                    <td className="py-2.5 pr-4 text-right">
                      <span
                        className={cn(
                          "font-mono font-bold",
                          isAktual
                            ? "text-base text-emerald-700"
                            : "text-sm text-slate-700",
                        )}
                      >
                        {formatRupiah(tarif)}
                      </span>
                    </td>

                    {/* Check icon */}
                    <td className="py-2.5 pr-3 text-right w-6">
                      {isAktual && (
                        <CheckCircle2
                          size={14}
                          strokeWidth={2.5}
                          className="text-emerald-500 ml-auto"
                        />
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Footer: versi + timestamp ── */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-slate-400">
          <span className="flex items-center gap-1">
            <Tag size={10} strokeWidth={2} />
            {result.versiGrouper}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} strokeWidth={2} />
            {new Date(result.timestampGroup).toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="ml-auto text-[11px] text-teal-600">
            {result.sumberRegulasi.replace(/_/g, " · ")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
