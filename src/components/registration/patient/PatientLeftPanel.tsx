"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Camera,
  Printer,
  Info,
  ClipboardList,
  Receipt,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster } from "@/lib/data";
import { UNIT_CFG, TAGIHAN_STATUS, calcKasir, fmtRp } from "./config";

interface PatientLeftPanelProps {
  patient: PatientMaster;
  photoRef: React.RefObject<HTMLInputElement | null>;
  onInfoLengkap: () => void;
  onOpenBilling: (id: string) => void;
}

export function PatientLeftPanel({
  patient,
  photoRef,
  onInfoLengkap,
  onOpenBilling,
}: PatientLeftPanelProps) {
  const kasirCalc = useMemo(
    () => (patient.kasir ? calcKasir(patient.kasir) : null),
    [patient.kasir],
  );
  const totalDeposit = patient.kasir?.deposits.reduce((s, d) => s + d.jumlah, 0) ?? 0;

  // Data-only (tanpa closure pembaca-ref di dalam array yang di-render). Ref dibaca dalam
  // arrow onClick inline di JSX → konteks event handler (lolos react-hooks/refs).
  const quickActions = [
    { key: "info",  icon: Info,          label: "Info Pasien" },
    { key: "rm",    icon: ClipboardList, label: "Rekam Medis" },
    { key: "cetak", icon: Printer,       label: "Cetak Kartu" },
    { key: "foto",  icon: Camera,        label: "Ubah Foto" },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Aksi Cepat ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold text-slate-800">Aksi Cepat</p>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.key}
                onClick={() => {
                  if (a.key === "info") onInfoLengkap();
                  else if (a.key === "cetak") window.print();
                  else if (a.key === "foto") photoRef.current?.click();
                  // "rm": placeholder Rekam Medis (belum di-wire)
                }}
                className="group flex cursor-pointer flex-col items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50 active:scale-[0.97]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-100 transition group-hover:text-sky-600 group-hover:ring-sky-200">
                  <Icon size={14} />
                </span>
                <span className="text-[11px] font-semibold text-slate-600 transition group-hover:text-sky-700">
                  {a.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tagihan (read-only ringkasan — aksi pembayaran di /ehis-billing) ── */}
      {patient.billing.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <Receipt size={13} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Rincian Tagihan</span>
              <span
                title="Tampilan ringkasan. Pembayaran dikelola di modul Billing Kasir."
                className="rounded-full bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500 ring-1 ring-slate-200"
              >
                Read-only
              </span>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {patient.billing.length} tagihan
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {patient.billing.map((b) => {
              const uc = UNIT_CFG[b.unit];
              const UIcon = uc.icon;
              return (
                <button
                  key={b.id}
                  onClick={() => onOpenBilling(b.id)}
                  title="Lihat rincian tagihan (read-only)"
                  className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50/70"
                >
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", uc.bg)}>
                    <UIcon size={14} className={uc.text} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-700">{b.unit}</p>
                    <p className="truncate font-mono text-[9px] text-slate-400">{b.noKunjungan}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-black text-slate-900">{fmtRp(b.totalBiaya)}</p>
                    <span
                      className={cn(
                        "text-[9px] font-semibold leading-tight",
                        TAGIHAN_STATUS[b.status].split(" ").find((c) => c.startsWith("text-"))!,
                      )}
                    >
                      {b.status}
                    </span>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition group-hover:border-teal-300 group-hover:bg-teal-50 group-hover:text-teal-600">
                    <ArrowRight size={12} />
                  </span>
                </button>
              );
            })}
          </div>
          {((kasirCalc?.sisaBayar ?? 0) > 0 || totalDeposit > 0) && (
            <div className="space-y-1 border-t border-slate-100 bg-slate-50 px-4 py-3">
              {kasirCalc && kasirCalc.sisaBayar > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-rose-500">Sisa Bayar Aktif</span>
                  <span className="font-bold text-rose-600">{fmtRp(kasirCalc.sisaBayar)}</span>
                </div>
              )}
              {totalDeposit > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-500">Deposit</span>
                  <span className="font-semibold text-emerald-600">{fmtRp(totalDeposit)}</span>
                </div>
              )}
            </div>
          )}
          {/* ── Deep-link CTA: aksi pembayaran via /ehis-billing ── */}
          <div className="border-t border-slate-100 bg-amber-50/40 px-3 py-2.5">
            <Link
              href="/ehis-billing/tagihan"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-[11px] font-semibold text-amber-700 shadow-xs transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
            >
              <span className="flex items-center gap-1.5">
                <Receipt size={11} className="text-amber-500" />
                Buka di Billing Kasir
              </span>
              <ExternalLink size={11} className="text-amber-400 transition group-hover:translate-x-0.5 group-hover:text-amber-600" />
            </Link>
            <p className="mt-1.5 px-0.5 text-[9.5px] leading-tight text-slate-400">
              Pembayaran, deposit, refund, dan cetak kwitansi dikelola di modul Billing.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50">
            <Receipt size={20} className="text-slate-300" />
          </span>
          <p className="text-xs font-medium text-slate-500">Belum ada tagihan</p>
          <p className="text-[10px] text-slate-400">Tagihan muncul setelah ada kunjungan berbiaya.</p>
        </div>
      )}
    </div>
  );
}
