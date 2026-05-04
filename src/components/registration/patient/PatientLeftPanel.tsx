"use client";

import Link from "next/link";
import {
  User,
  Shield,
  Calendar,
  ClipboardList,
  Phone,
  Mail,
  AlertCircle,
  Info,
  Pencil,
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

interface PatientLeftPanelProps {
  patient: PatientMaster;
  jadwalList: JadwalItem[];
  jadwalShowAll: boolean;
  upcomingCount: number;
  onEditData: () => void;
  onEditKontak: () => void;
  onUbahPenjamin: () => void;
  onLihatRiwayat: () => void;
  onTambahJadwal: () => void;
  onToggleJadwal: () => void;
  onInfoLengkap: () => void;
}

export function PatientLeftPanel({
  patient,
  jadwalList,
  jadwalShowAll,
  upcomingCount,
  onEditData,
  onEditKontak,
  onUbahPenjamin,
  onLihatRiwayat,
  onTambahJadwal,
  onToggleJadwal,
  onInfoLengkap,
}: PatientLeftPanelProps) {
  const pjCfg = PENJAMIN_CFG[patient.penjamin.tipe];
  const activeVisit = patient.riwayatKunjungan.find((k) => k.status === "Aktif");

  return (
    <div className="flex flex-col gap-4">
      {/* Card: Informasi Pasien (compact) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <User size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Informasi Pasien</span>
          </div>
          <EditSmallBtn onClick={onEditData} />
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">NIK</span>
              <span className="font-mono text-xs font-medium text-slate-700">{patient.nik}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gol. Darah</span>
              <span className="text-xs font-medium text-slate-700">{patient.golonganDarah}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tgl. Lahir</span>
              <span className="text-xs font-medium text-slate-700">{patient.tanggalLahir}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jenis Kelamin</span>
              <span className="text-xs font-medium text-slate-700">
                {patient.gender === "L" ? "Laki-laki" : "Perempuan"}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <Phone size={11} className="shrink-0 text-slate-400" />
              <span className="text-xs font-medium text-slate-700">{patient.noHp}</span>
              <button
                onClick={onEditKontak}
                className="ml-auto flex cursor-pointer items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-400 transition hover:text-indigo-600"
              >
                <Pencil size={9} />
              </button>
            </div>
            {patient.email && (
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <Mail size={11} className="shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{patient.email}</span>
              </div>
            )}
          </div>

          {patient.alergi && patient.alergi.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-rose-500">
                <AlertCircle size={9} />
              </span>
              {patient.alergi.map((a) => (
                <span key={a} className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                  {a}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={onInfoLengkap}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2 text-[11px] font-medium text-slate-400 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <Info size={11} /> Lihat Info Lengkap
          </button>
        </div>
      </div>

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
                <span className="mt-0.5 block text-[9px] text-slate-400">s/d {patient.penjamin.berlakuSampai}</span>
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
                  <div key={idx} className={cn("rounded-lg border px-3 py-2 transition", cfg.border, cfg.cardBg)}>
                    <div className="flex items-center gap-2">
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.dot)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className={cn("text-[11px] font-bold leading-tight", isUpcoming ? "text-sky-800" : "text-slate-600")}>
                            {j.tanggal}
                            {j.jam && <span className="ml-1 font-normal text-slate-400">{j.jam}</span>}
                          </p>
                          <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold", cfg.badge)}>
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

      {/* Card: Riwayat Pendaftaran Terkini */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <ClipboardList size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Riwayat Pendaftaran Terkini</span>
          </div>
          <button
            onClick={onLihatRiwayat}
            className="flex cursor-pointer items-center gap-0.5 text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            Lihat Semua <ChevronRight size={11} />
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {patient.riwayatKunjungan.slice(0, 3).map((k) => {
            const uc = UNIT_CFG[k.unit];
            const UIcon = uc.icon;
            return (
              <div key={k.id} className="px-4 py-3 transition hover:bg-slate-50/60">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] font-semibold text-slate-800">{k.noPendaftaran}</p>
                    <p className="font-mono text-[10px] text-slate-400">{k.noKunjungan}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", KUNJUNGAN_STATUS[k.status])}>
                      {STATUS_LABEL[k.status]}
                    </span>
                    {k.detailPath && (
                      <Link
                        href={k.detailPath}
                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <ArrowRight size={11} />
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] text-slate-500">{k.tanggal}</span>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", uc.bg, uc.text)}>
                    <UIcon size={9} /> {k.unit}
                  </span>
                </div>
                {(k.noSEP || k.noPenjamin) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] mb-0.5">
                    {k.noPenjamin && (
                      <span className="flex items-center gap-1 font-mono text-slate-500">
                        <Hash size={9} className="text-slate-400" /> {k.noPenjamin}
                      </span>
                    )}
                    {k.noSEP && (
                      <span className="flex items-center gap-1 font-mono text-emerald-600">
                        <FileText size={9} /> SEP {k.noSEP}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-slate-500 line-clamp-1">{k.diagnosa}</p>
              </div>
            );
          })}
        </div>
        {patient.riwayatKunjungan.length > 3 && (
          <div className="border-t border-slate-100 px-4 py-2">
            <button
              onClick={onLihatRiwayat}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-800"
            >
              <Eye size={11} /> {patient.riwayatKunjungan.length - 3} pendaftaran lainnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
