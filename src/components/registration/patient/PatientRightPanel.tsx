"use client";

import Link from "next/link";
import {
  Shield,
  ClipboardList,
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Eye,
  Hash,
  FileText,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster } from "@/lib/data";
import { EditSmallBtn } from "./primitives";
import {
  PENJAMIN_CFG,
  UNIT_CFG,
  KUNJUNGAN_STATUS,
  STATUS_LABEL,
  JADWAL_CFG,
  type JadwalItem,
  type JadwalStatus,
} from "./config";

interface PatientRightPanelProps {
  patient: PatientMaster;
  jadwalList: JadwalItem[];
  jadwalShowAll: boolean;
  upcomingCount: number;
  onUbahPenjamin: () => void;
  onLihatRiwayat: () => void;
  onTambahJadwal: () => void;
  onToggleJadwal: () => void;
}

export function PatientRightPanel({
  patient,
  jadwalList,
  jadwalShowAll,
  upcomingCount,
  onUbahPenjamin,
  onLihatRiwayat,
  onTambahJadwal,
  onToggleJadwal,
}: PatientRightPanelProps) {
  const pjCfg = PENJAMIN_CFG[patient.penjamin.tipe];
  const activeVisit = patient.riwayatKunjungan.find((k) => k.status === "Aktif");
  const latestKunjungan = patient.riwayatKunjungan[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* Card: Penjamin & Jaminan */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Penjamin &amp; Jaminan</span>
          </div>
          <EditSmallBtn onClick={onUbahPenjamin} label="Ubah" />
        </div>
        <div className="p-4 space-y-3">
          <div className={cn("flex items-center gap-3 rounded-xl border p-3", pjCfg.bg, pjCfg.border)}>
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", pjCfg.badge)}>
              <Shield size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800">{pjCfg.label}</p>
              {patient.penjamin.nomor && (
                <p className="font-mono text-[10px] text-slate-500">{patient.penjamin.nomor}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              {patient.penjamin.kelas && (
                <span className="block rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  Kelas {patient.penjamin.kelas}
                </span>
              )}
              {patient.penjamin.berlakuSampai && (
                <span className="mt-0.5 block text-[9px] text-slate-400">
                  s/d {patient.penjamin.berlakuSampai}
                </span>
              )}
            </div>
          </div>

          {patient.penjamin.noSEP && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">No. SEP</p>
              <p className="mt-0.5 font-mono text-sm font-bold tracking-widest text-emerald-800">
                {patient.penjamin.noSEP}
              </p>
            </div>
          )}

          {activeVisit && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Unit Aktif</p>
                <div className="mt-1">
                  {(() => {
                    const UIcon = UNIT_CFG[activeVisit.unit].icon;
                    return (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                          UNIT_CFG[activeVisit.unit].bg,
                          UNIT_CFG[activeVisit.unit].text,
                        )}
                      >
                        <UIcon size={9} /> {activeVisit.unit}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Tgl Masuk</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-700">{activeVisit.tanggal}</p>
              </div>
            </div>
          )}

          {patient.penjamin.noPolis && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">No. Polis Asuransi</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-indigo-800">{patient.penjamin.noPolis}</p>
            </div>
          )}
        </div>
      </div>

      {/* Card: Riwayat Pendaftaran Terkini */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <ClipboardList size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Riwayat Pendaftaran</span>
            {patient.riwayatKunjungan.length > 0 && (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                {patient.riwayatKunjungan.length}
              </span>
            )}
          </div>
          <button
            onClick={onLihatRiwayat}
            className="flex cursor-pointer items-center gap-0.5 text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            Lihat Semua <ChevronRight size={11} />
          </button>
        </div>

        {!latestKunjungan ? (
          <div className="flex flex-col items-center gap-1.5 py-7 text-center">
            <ClipboardList size={20} className="text-slate-200" />
            <p className="text-[10px] text-slate-400">Belum ada pendaftaran</p>
          </div>
        ) : (
          <div className="p-4">
            {(() => {
              const k = latestKunjungan;
              const uc = UNIT_CFG[k.unit];
              const UIcon = uc.icon;
              return (
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <div
                    className={cn(
                      "h-0.5 w-full",
                      k.status === "Aktif"
                        ? "bg-sky-400"
                        : k.status === "Selesai"
                          ? "bg-emerald-400"
                          : "bg-slate-200",
                    )}
                  />
                  <div className="bg-slate-50/50 p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-[11px] font-bold leading-tight text-slate-800">
                          {k.noPendaftaran}
                        </p>
                        <p className="font-mono text-[9px] text-slate-400 mt-0.5">{k.noKunjungan}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          KUNJUNGAN_STATUS[k.status],
                        )}
                      >
                        {STATUS_LABEL[k.status] ?? k.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{k.tanggal}</span>
                      <span className="select-none text-slate-200">·</span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold",
                          uc.bg,
                          uc.text,
                        )}
                      >
                        <UIcon size={8} /> {k.unit}
                      </span>
                    </div>

                    {(k.penjamin || k.noSEP || k.noPenjamin) && (
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        {k.penjamin && (
                          <span className="text-[10px] font-semibold text-slate-600">{k.penjamin}</span>
                        )}
                        {k.noPenjamin && (
                          <span className="flex items-center gap-0.5 font-mono text-[10px] text-slate-400">
                            <Hash size={9} /> {k.noPenjamin}
                          </span>
                        )}
                        {k.noSEP && (
                          <span className="flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-emerald-700">
                            <FileText size={8} /> SEP {k.noSEP}
                          </span>
                        )}
                      </div>
                    )}

                    {k.diagnosa && (
                      <p className="line-clamp-1 text-[11px] leading-snug text-slate-600">{k.diagnosa}</p>
                    )}

                    {k.orderedServices && k.orderedServices.length > 0 && (
                      <div className="ml-2 border-l-2 border-slate-200 pl-4 space-y-1">
                        {k.orderedServices.map((svc) => {
                          const sc = UNIT_CFG[svc.unit];
                          const SIcon = sc.icon;
                          return (
                            <div key={svc.unit} className="relative flex items-center gap-2">
                              <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex items-center">
                                <div className="h-px w-3 bg-slate-200" />
                                <div
                                  className={cn(
                                    "h-2 w-2 shrink-0 rounded-full border",
                                    svc.selesai
                                      ? "border-emerald-400 bg-emerald-400"
                                      : "border-amber-400 bg-amber-100",
                                  )}
                                />
                              </div>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold",
                                  sc.bg,
                                  sc.text,
                                )}
                              >
                                <SIcon size={8} /> {svc.unit}
                              </span>
                              <span
                                className={cn(
                                  "text-[8px] font-semibold",
                                  svc.selesai ? "text-emerald-500" : "text-amber-500",
                                )}
                              >
                                {svc.selesai ? "Selesai" : "Proses"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {k.detailPath && (
                      <div className="border-t border-slate-100 pt-2.5">
                        <Link
                          href={k.detailPath}
                          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-800"
                        >
                          <ArrowRight size={10} /> Lihat Detail Pendaftaran
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {patient.riwayatKunjungan.length > 1 && (
              <button
                onClick={onLihatRiwayat}
                className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1 py-1.5 text-[10px] font-semibold text-slate-400 transition hover:text-indigo-600"
              >
                <Eye size={10} /> {patient.riwayatKunjungan.length - 1} pendaftaran lainnya
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card: Jadwal Kontrol */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Jadwal Kontrol</span>
            {upcomingCount > 0 && (
              <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">
                {upcomingCount}
              </span>
            )}
          </div>
          <button
            onClick={onTambahJadwal}
            className="flex cursor-pointer items-center gap-0.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            <Plus size={10} /> Tambah
          </button>
        </div>
        <div className="p-3 space-y-2">
          {jadwalList.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-5 text-center">
              <Calendar size={20} className="text-slate-200" />
              <p className="text-[10px] text-slate-400">Belum ada jadwal kontrol</p>
              <button
                onClick={onTambahJadwal}
                className="cursor-pointer text-[10px] font-semibold text-indigo-500 transition hover:text-indigo-700"
              >
                + Tambah jadwal
              </button>
            </div>
          ) : (
            <>
              {(jadwalShowAll ? jadwalList : jadwalList.slice(0, 3)).map((j, idx) => {
                const cfg = JADWAL_CFG[j.status as JadwalStatus];
                const isUpcoming = j.status === "Dijadwalkan";
                return (
                  <div
                    key={idx}
                    className={cn("rounded-lg border px-3 py-2 transition", cfg.border, cfg.cardBg)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.dot)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={cn(
                              "text-[11px] font-bold leading-tight",
                              isUpcoming ? "text-sky-800" : "text-slate-600",
                            )}
                          >
                            {j.tanggal}
                            {j.jam && <span className="ml-1 font-normal text-slate-400">{j.jam}</span>}
                          </p>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold",
                              cfg.badge,
                            )}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <p className="truncate text-[10px] text-slate-500">
                          {j.dokter}
                          {j.poli && <span className="text-slate-400">{" · "}{j.poli}</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {jadwalList.length > 3 && (
                <button
                  onClick={onToggleJadwal}
                  className="flex w-full cursor-pointer items-center justify-center gap-1 py-1 text-[10px] font-semibold text-slate-400 transition hover:text-slate-600"
                >
                  {jadwalShowAll ? (
                    <><ChevronUp size={10} /> Sembunyikan</>
                  ) : (
                    <><ChevronDown size={10} /> {jadwalList.length - 3} lainnya</>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
