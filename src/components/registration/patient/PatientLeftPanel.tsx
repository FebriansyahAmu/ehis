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
      {/* ── Profil card ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Cover — no overflow-hidden so avatar can bleed below */}
        <div
          className={cn(
            "relative h-24 bg-linear-to-br",
            patient.gender === "L"
              ? "from-slate-600 to-teal-800"
              : "from-pink-500 to-rose-600",
          )}
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-3 bottom-0 h-20 w-20 rounded-full bg-white/6" />

          {/* Avatar */}
          <div className="absolute -bottom-8 left-4 group">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt={patient.name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow-lg"
              />
            ) : (
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full text-base font-black ring-2 ring-white shadow-lg",
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
              aria-label="Ubah foto pasien"
              className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/0 transition group-hover:bg-black/30"
            >
              <Camera size={14} className="text-white opacity-0 transition group-hover:opacity-100" />
            </button>
          </div>

          {/* Top-right: gender chip + print */}
          <div className="absolute right-2 top-2 flex items-center gap-1.5">
            <span className="rounded-md bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-sm">
              {patient.gender === "L" ? "Laki-laki" : "Perempuan"}
            </span>
            <button
              onClick={() => window.print()}
              aria-label="Cetak kartu"
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-white/15 text-white/80 backdrop-blur-sm transition hover:bg-white/30 active:scale-95"
            >
              <Printer size={11} />
            </button>
          </div>
        </div>

        <div className="px-4 pt-10 pb-4">
          {/* Name + badges */}
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

          {/* ID info */}
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400">No. Rekam Medis</span>
              <span className="font-mono text-xs font-bold text-slate-800">{patient.noRM}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400">NIK</span>
              <span className="font-mono text-xs text-slate-600">{patient.nik}</span>
            </div>
            {patient.idSatusehat && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">ID Satusehat</span>
                <span className="font-mono text-xs font-semibold text-indigo-600">{patient.idSatusehat}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400">Terdaftar</span>
              <span className="text-xs text-slate-600">{patient.terdaftar}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-center ring-1 ring-inset ring-indigo-100">
              <p className="text-base font-black text-indigo-700">{patient.riwayatKunjungan.length}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">Kunjungan</p>
            </div>
            <div className="rounded-xl bg-sky-50 p-2.5 text-center ring-1 ring-inset ring-sky-100">
              <p className="text-base font-black text-sky-700">
                {patient.riwayatKunjungan.filter((k) => k.status === "Aktif").length}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-sky-400">Aktif</p>
            </div>
            <div
              className={cn(
                "rounded-xl p-2.5 text-center ring-1 ring-inset",
                upcomingCount > 0
                  ? "bg-emerald-50 ring-emerald-100"
                  : "bg-slate-50 ring-slate-100",
              )}
            >
              <p className={cn("text-base font-black", upcomingCount > 0 ? "text-emerald-700" : "text-slate-400")}>
                {upcomingCount}
              </p>
              <p className={cn("text-[9px] font-bold uppercase tracking-wider", upcomingCount > 0 ? "text-emerald-400" : "text-slate-400")}>
                Jadwal
              </p>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            onClick={onDaftarKunjungan}
            className="group mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-sky-700 active:scale-[0.98]"
          >
            <CalendarPlus size={12} className="transition group-hover:scale-110" />
            Daftar Kunjungan Baru
          </button>

          {/* Secondary actions */}
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
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-[11px] font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.97]"
              >
                <Icon size={11} className="shrink-0 text-slate-400" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tagihan card ── */}
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
                    className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 active:scale-95"
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
