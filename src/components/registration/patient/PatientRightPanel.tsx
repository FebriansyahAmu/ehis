"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ClipboardList,
  Calendar,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster } from "@/lib/data";
import {
  PENJAMIN_CFG,
  UNIT_CFG,
  JADWAL_CFG,
  type JadwalItem,
  type JadwalStatus,
} from "./config";
import { RiwayatTab } from "./RiwayatTab";

type TabId = "riwayat" | "penjamin" | "jadwal";

interface PatientRightPanelProps {
  patient: PatientMaster;
  jadwalList: JadwalItem[];
  upcomingCount: number;
  onLihatRiwayat: () => void;
  onTambahJadwal: () => void;
}

export function PatientRightPanel({
  patient,
  jadwalList,
  upcomingCount,
  onLihatRiwayat,
  onTambahJadwal,
}: PatientRightPanelProps) {
  const [tab, setTab]           = useState<TabId>("riwayat");
  const [jadwalAll, setJadwalAll] = useState(false);

  const pjCfg      = PENJAMIN_CFG[patient.penjamin.tipe];
  const activeVisit = patient.riwayatKunjungan.find((k) => k.status === "Aktif");
  // No. SEP terbaru: utamakan field penjamin (mock), fallback SEP kunjungan terkini (API).
  const latestSEP  = patient.penjamin.noSEP ?? patient.riwayatKunjungan.find((k) => k.noSEP)?.noSEP;

  const TABS: { id: TabId; label: string; icon: typeof Shield; badge: number | null }[] = [
    { id: "riwayat",  label: "Riwayat", icon: ClipboardList, badge: patient.riwayatKunjungan.length },
    { id: "penjamin", label: "Jaminan", icon: Shield,        badge: null },
    { id: "jadwal",   label: "Jadwal",  icon: Calendar,      badge: upcomingCount > 0 ? upcomingCount : null },
  ];

  const tabSubtitle: Record<TabId, string> = {
    riwayat:  `${patient.riwayatKunjungan.length} kunjungan tercatat`,
    penjamin: pjCfg.label,
    jadwal:   upcomingCount > 0 ? `${upcomingCount} jadwal mendatang` : "Belum ada jadwal aktif",
  };

  const tabAction: Record<TabId, React.ReactNode> = {
    riwayat: (
      <button
        onClick={onLihatRiwayat}
        className="flex cursor-pointer items-center gap-0.5 text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-800"
      >
        Semua <ChevronRight size={10} />
      </button>
    ),
    penjamin: null,
    jadwal: (
      <button
        onClick={onTambahJadwal}
        className="flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
      >
        <Plus size={10} /> Tambah
      </button>
    ),
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

      {/* ── Tab navigation ── */}
      <div className="flex border-b border-slate-100 px-1.5 pt-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-t-lg px-3 py-2.5 text-[11px] font-semibold transition-colors duration-150",
                isActive ? "text-sky-700" : "text-slate-400 hover:text-slate-600",
              )}
            >
              <Icon size={12} className="shrink-0" />
              {t.label}
              {t.badge !== null && (
                <span
                  className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none transition-colors",
                    isActive ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-400",
                  )}
                >
                  {t.badge}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="rpanel-tab-line"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-sky-500"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Context bar ── */}
      <div className="flex items-center justify-between border-b border-slate-50 px-4 py-2">
        <span className="text-[10px] text-slate-400">{tabSubtitle[tab]}</span>
        {tabAction[tab]}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >

          {/* ══ Riwayat ══ */}
          {tab === "riwayat" && <RiwayatTab patient={patient} />}

          {/* ══ Penjamin ══ */}
          {tab === "penjamin" && (
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

              {latestSEP && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">No. SEP</p>
                  <p className="mt-0.5 font-mono text-sm font-bold tracking-widest text-emerald-800">
                    {latestSEP}
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
                  <p className="mt-0.5 font-mono text-sm font-semibold text-indigo-800">
                    {patient.penjamin.noPolis}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ══ Jadwal ══ */}
          {tab === "jadwal" && (
            <div className="p-3 space-y-2">
              {jadwalList.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Calendar size={24} className="text-slate-200" />
                  <p className="text-xs text-slate-400">Belum ada jadwal kontrol</p>
                  <button
                    onClick={onTambahJadwal}
                    className="cursor-pointer text-[11px] font-semibold text-indigo-500 transition hover:text-indigo-700"
                  >
                    + Tambah jadwal
                  </button>
                </div>
              ) : (
                <>
                  {(jadwalAll ? jadwalList : jadwalList.slice(0, 3)).map((j, idx) => {
                    const cfg        = JADWAL_CFG[j.status as JadwalStatus];
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
                                {j.jam && (
                                  <span className="ml-1 font-normal text-slate-400">{j.jam}</span>
                                )}
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
                              {j.poli && (
                                <span className="text-slate-400">{" · "}{j.poli}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {jadwalList.length > 3 && (
                    <button
                      onClick={() => setJadwalAll((v) => !v)}
                      className="flex w-full cursor-pointer items-center justify-center gap-1 py-1 text-[10px] font-semibold text-slate-400 transition hover:text-slate-600"
                    >
                      {jadwalAll ? (
                        <><ChevronDown size={10} className="rotate-180" /> Sembunyikan</>
                      ) : (
                        <><ChevronDown size={10} /> {jadwalList.length - 3} lainnya</>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
