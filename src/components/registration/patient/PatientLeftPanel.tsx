"use client";

import { useMemo } from "react";
import {
  Camera,
  Printer,
  CalendarPlus,
  Info,
  ClipboardList,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster } from "@/lib/data";
import {
  PENJAMIN_CFG,
  UNIT_CFG,
  TAGIHAN_STATUS,
  calcKasir,
  fmtRp,
} from "./config";

interface PatientLeftPanelProps {
  patient: PatientMaster;
  upcomingCount: number;
  photoPreview: string | null;
  photoRef: React.RefObject<HTMLInputElement | null>;
  onInfoLengkap: () => void;
  onDaftarKunjungan: () => void;
  onKasir: () => void;
  onOpenBilling: (id: string) => void;
}

export function PatientLeftPanel({
  patient,
  upcomingCount,
  photoPreview,
  photoRef,
  onInfoLengkap,
  onDaftarKunjungan,
  onKasir,
  onOpenBilling,
}: PatientLeftPanelProps) {
  const pjCfg = PENJAMIN_CFG[patient.penjamin.tipe];
  const initials = patient.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const kasirCalc = useMemo(
    () => (patient.kasir ? calcKasir(patient.kasir) : null),
    [patient.kasir],
  );
  const totalDeposit = patient.kasir?.deposits.reduce((s, d) => s + d.jumlah, 0) ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Card: Profil Pasien */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div
          className={cn(
            "relative h-20 bg-linear-to-br",
            patient.gender === "L"
              ? "from-slate-600 to-teal-800"
              : "from-pink-500 to-rose-600",
          )}
        >
          <div className="absolute -bottom-7 left-4 group">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt={patient.name}
                className="h-14 w-14 rounded-full object-cover ring-3 ring-white shadow-md"
              />
            ) : (
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full text-base font-black ring-3 ring-white shadow-md",
                  patient.gender === "L"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-pink-100 text-pink-700",
                )}
              >
                {initials}
              </div>
            )}
            <button
              onClick={() => photoRef.current?.click()}
              className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/0 transition group-hover:bg-black/30"
            >
              <Camera size={12} className="text-white opacity-0 transition group-hover:opacity-100" />
            </button>
          </div>
          <div className="absolute right-2 top-2">
            <button
              onClick={() => window.print()}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-white/15 text-white/80 transition hover:bg-white/25"
            >
              <Printer size={11} />
            </button>
          </div>
        </div>

        <div className="px-4 pt-9 pb-4">
          <div className="mb-3">
            <h2 className="text-sm font-bold leading-snug text-slate-900 line-clamp-2 wrap-break-words">
              {patient.name}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                {patient.age} thn · {patient.gender === "L" ? "L" : "P"}
              </span>
              <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-700">
                {patient.golonganDarah}
              </span>
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", pjCfg.badge)}>
                {pjCfg.label}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 px-3 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">No. Rekam Medis</span>
              <span className="font-mono text-[11px] font-bold text-slate-800">{patient.noRM}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">NIK</span>
              <span className="font-mono text-[11px] text-slate-600">{patient.nik}</span>
            </div>
            {patient.idSatusehat && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">ID Satusehat</span>
                <span className="font-mono text-[11px] font-semibold text-indigo-600">{patient.idSatusehat}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">Terdaftar</span>
              <span className="text-[11px] text-slate-600">{patient.terdaftar}</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-center">
              <p className="text-base font-black text-indigo-700">{patient.riwayatKunjungan.length}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">Kunjungan</p>
            </div>
            <div className="rounded-xl bg-sky-50 p-2.5 text-center">
              <p className="text-base font-black text-sky-700">
                {patient.riwayatKunjungan.filter((k) => k.status === "Aktif").length}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-sky-400">Aktif</p>
            </div>
            <div className={cn("rounded-xl p-2.5 text-center", upcomingCount > 0 ? "bg-emerald-50" : "bg-slate-50")}>
              <p className={cn("text-base font-black", upcomingCount > 0 ? "text-emerald-700" : "text-slate-400")}>
                {upcomingCount}
              </p>
              <p className={cn("text-[9px] font-bold uppercase tracking-wider", upcomingCount > 0 ? "text-emerald-400" : "text-slate-400")}>
                Jadwal
              </p>
            </div>
          </div>

          <button
            onClick={onDaftarKunjungan}
            className="group mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            <CalendarPlus size={11} className="transition group-hover:rotate-6" />{" "}
            Daftar Kunjungan Baru
          </button>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {[
              { icon: Camera,        label: "Ubah Foto",   onClick: () => photoRef.current?.click() },
              { icon: Printer,       label: "Cetak Kartu", onClick: () => window.print() },
              { icon: Info,          label: "Info Pasien", onClick: onInfoLengkap },
              { icon: ClipboardList, label: "Rekam Medis", onClick: () => {} },
            ].map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-[11px] font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Icon size={11} className="shrink-0 text-slate-400" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card: Rincian Tagihan */}
      {patient.billing.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <Receipt size={12} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Rincian Tagihan</span>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {patient.billing.length} tagihan
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {patient.billing.map((b) => {
              const uc = UNIT_CFG[b.unit];
              const UIcon = uc.icon;
              const isActive = b.noTagihan === patient.kasir?.noTagihan;
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/70"
                >
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", uc.bg)}>
                    <UIcon size={13} className={uc.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-700">{b.unit}</p>
                    <p className="font-mono text-[9px] text-slate-400 truncate">{b.noKunjungan}</p>
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
                  <button
                    onClick={() => (isActive ? onKasir() : onOpenBilling(b.id))}
                    title={isActive ? "Buka kasir lengkap" : "Lihat rincian"}
                    className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600"
                  >
                    <ArrowRight size={12} />
                  </button>
                </div>
              );
            })}
          </div>
          {((kasirCalc?.sisaBayar ?? 0) > 0 || totalDeposit > 0) && (
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-1">
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
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
          <Receipt size={20} className="text-slate-200" />
          <p className="text-xs text-slate-400">Tidak ada tagihan</p>
        </div>
      )}
    </div>
  );
}
