"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck, ClipboardList, FileCheck2, FileText, LogOut,
  Pill, type LucideIcon,
} from "lucide-react";
import type { RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  type PasienPulangData,
  PASIEN_PULANG_MOCK,
  makeInitialSurat,
  STATUS_KEPULANGAN_CONFIG,
} from "../pasienPulang/pasienPulangShared";
import StatusPane      from "../pasienPulang/StatusPane";
import ObatJadwalPane  from "../pasienPulang/ObatJadwalPane";
import SuratPane       from "../pasienPulang/SuratPane";
import ResumeMedikPane from "../pasienPulang/ResumeMedikPane";
import ResumeMedisPane from "../pasienPulang/ResumeMedisPane";

// ── Tab definitions ───────────────────────────────────────

type TabId = "status" | "obat" | "surat" | "resume-medik" | "resume-pulang";

interface TabDef { id: TabId; label: string; icon: LucideIcon }

const TABS: TabDef[] = [
  { id: "status",        label: "Status Pulang",  icon: LogOut        },
  { id: "obat",          label: "Obat & Jadwal",  icon: Pill          },
  { id: "surat",         label: "Surat-surat",    icon: ClipboardList },
  { id: "resume-medik",  label: "Resume Medik",   icon: FileCheck2    },
  { id: "resume-pulang", label: "Resume Pulang",  icon: FileText      },
];

// ── Header ────────────────────────────────────────────────

function PasienPulangHeader({ data }: { data: PasienPulangData }) {
  const statusCfg = data.status ? STATUS_KEPULANGAN_CONFIG[data.status] : null;

  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">

        {/* Phase banner */}
        <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5">
          <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            Fase 4
          </span>
          <span className="text-[11px] font-semibold text-orange-800">Hari Pulang · PMK 24/2022</span>
        </div>

        {/* Status kepulangan chip */}
        {statusCfg && data.status && (
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", statusCfg.badge)}>
            {data.status}
          </span>
        )}

        {/* Stats */}
        <div className="ml-auto flex items-center gap-2">
          {[
            { icon: Pill,          label: "obat",    val: data.obatPulang.length     },
            { icon: CalendarCheck, label: "kontrol", val: data.jadwalKontrol.length  },
            { icon: ClipboardList, label: "surat",   val: data.surat.filter(s => s.diterbitkan).length },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1">
              <Icon size={10} className="text-slate-500" />
              <span className="text-[10px] font-semibold text-slate-600">{val} {label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function PasienPulangTab({ patient }: { patient: RawatInapPatientDetail }) {
  const initial: PasienPulangData = PASIEN_PULANG_MOCK[patient.noRM] ?? {
    status: "", tanggalPulang: "", jamPulang: "",
    dokterYangMemulangkan: patient.dpjp,
    catatanKondisiAkhir: "",
    obatPulang: [], jadwalKontrol: [], jadwalPemeriksaan: [],
    adaRujukanFKTP: false, fktpNama: "", fktpTujuan: "",
    surat: makeInitialSurat(),
    resumePulang: {
      ringkasanAnamnesis: "", hasilPemeriksaan: "", terapiDiberikan: "",
      kondisiSaatPulang: "", instruksiPulang: "", pembatasanAktivitas: "", dietPulang: "",
      tandaTanganPasien: false, dpjpApproved: false, dpjpApprovedAt: "",
    },
    resumeMedik: {
      asalMasuk: "", tanggalMasukIGD: "", diagnosisIGD: "",
      ttvMasuk: null, ttvPulang: null,
      hasilLabAbnormal: [], hasilRad: [],
      obatSelamaRawat: [], tindakan: [],
      kondisiMasuk: "", kondisiPulang: "", ringkasanKlinis: "",
      dpjpApproved: false, dpjpApprovedAt: "",
    },
  };

  const [data,      setData]      = useState<PasienPulangData>(initial);
  const [activeTab, setActiveTab] = useState<TabId>("status");

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* Header */}
      <PasienPulangHeader data={data} />

      {/* Sub-tab nav */}
      <div className="shrink-0 overflow-x-auto border-b border-slate-200 bg-white px-4">
        <div className="flex min-w-max gap-0">
          {TABS.map(tab => {
            const Icon   = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-4 py-2.5 text-[12px] font-semibold transition-all whitespace-nowrap",
                  active
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-slate-500 hover:text-slate-700",
                )}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {activeTab === "status" && (
                <StatusPane data={data} onChange={setData} patient={patient} />
              )}
              {activeTab === "obat" && (
                <ObatJadwalPane data={data} onChange={setData} />
              )}
              {activeTab === "surat" && (
                <SuratPane data={data} onChange={setData} />
              )}
              {activeTab === "resume-medik" && (
                <ResumeMedikPane data={data} onChange={setData} patient={patient} />
              )}
              {activeTab === "resume-pulang" && (
                <ResumeMedisPane data={data} onChange={setData} patient={patient} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
