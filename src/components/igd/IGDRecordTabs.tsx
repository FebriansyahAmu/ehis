"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, HeartPulse, Stethoscope, Tag, FileText, Zap,
  Pill, FlaskConical, Radiation, Send, Home,
  Repeat, HeartHandshake, ScanLine, ClipboardCheck, ScanEye, ListChecks,
  type LucideIcon,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

import TriaseTab        from "./tabs/TriaseTab";
import TTVTab           from "./tabs/TTVTab";
import AsesmenMedisTab  from "./tabs/AsesmenMedisTab";
import DiagnosaTab      from "./tabs/DiagnosaTab";
import CPPTTab          from "./tabs/CPPTTab";
import TindakanTab      from "./tabs/TindakanTab";
import ResepPasienTab   from "./tabs/ResepPasienTab";
import OrderLabTab      from "./tabs/OrderLabTab";
import OrderRadTab      from "./tabs/OrderRadTab";
import PasienPulangTab  from "./tabs/PasienPulangTab";
import RekonsiliasTab   from "./tabs/RekonsiliasTab";
import KeperawatanTab   from "./tabs/KeperawatanTab";
import PemeriksaanTab   from "./tabs/PemeriksaanTab";
import PenilaianTab      from "./tabs/PenilaianTab";
import RujukanKeluarTab      from "./tabs/RujukanKeluarTab";
import PenandaanGambarTab   from "./tabs/PenandaanGambarTab";
import DaftarOrderTab        from "./tabs/DaftarOrderTab";

// ── Tab groups ────────────────────────────────────────────

interface TabDef { id: string; label: string; icon: LucideIcon }

const REKAM_MEDIS: TabDef[] = [
  { id: "triase",        label: "Triase",          icon: ClipboardList  },
  { id: "ttv",           label: "TTV",             icon: HeartPulse     },
  { id: "asesmen",       label: "Asesmen Medis",   icon: Stethoscope    },
  { id: "diagnosa",      label: "Diagnosa",        icon: Tag            },
  { id: "cppt",          label: "CPPT / SOAP",     icon: FileText       },
  { id: "tindakan",      label: "Tindakan IGD",    icon: Zap            },
  { id: "rekonsiliasi",  label: "Rekonsiliasi",    icon: Repeat         },
  { id: "keperawatan",   label: "Keperawatan",     icon: HeartHandshake },
  { id: "pemeriksaan",   label: "Pemeriksaan",     icon: ScanLine       },
  { id: "penilaian",     label: "Penilaian",       icon: ClipboardCheck },
  { id: "penandaan",    label: "Penandaan Gambar", icon: ScanEye        },
];

const LAYANAN: TabDef[] = [
  { id: "daftar-order", label: "Daftar Order",    icon: ListChecks   },
  { id: "resep",        label: "Resep Pasien",    icon: Pill         },
  { id: "order-lab",    label: "Order Lab",       icon: FlaskConical },
  { id: "order-rad",    label: "Order Radiologi", icon: Radiation    },
  { id: "rujukan",      label: "Rujukan Keluar",  icon: Send         },
  { id: "pulang",       label: "Pasien Pulang",   icon: Home         },
];

const ALL_TABS = [...REKAM_MEDIS, ...LAYANAN];
type TabId = typeof ALL_TABS[number]["id"];

// ── Nav item ──────────────────────────────────────────────

function NavItem({ tab, active, onClick }: { tab: TabDef; active: boolean; onClick: () => void }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "mx-2 flex w-[calc(100%-16px)] cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-all duration-150",
        active
          ? "bg-sky-600 text-white shadow-sm shadow-sky-200"
          : "text-slate-500 hover:bg-sky-50 hover:text-sky-700",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        size={14}
        className={cn("shrink-0", active ? "text-white/90" : "text-slate-400")}
        aria-hidden="true"
      />
      <span className="truncate">{tab.label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />}
    </button>
  );
}

// ── Main component ────────────────────────────────────────

export default function IGDRecordTabs({ patient }: { patient: IGDPatientDetail }) {
  const [active, setActive] = useState<TabId>("triase");;

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">

      {/* ── Mobile: horizontal scrollable tab bar ── */}
      <nav
        className="flex shrink-0 overflow-x-auto border-b border-slate-200 bg-white px-2 md:hidden"
        aria-label="Navigasi rekam medis"
      >
        {ALL_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "my-1.5 flex shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-semibold transition-all duration-150",
                active === tab.id
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-sky-50 hover:text-sky-600",
              )}
              aria-current={active === tab.id ? "page" : undefined}
            >
              <Icon size={13} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ── Desktop: vertical left nav ── */}
      <nav
        className="hidden w-56 shrink-0 overflow-y-auto border-r border-slate-200 bg-white py-3 md:flex md:flex-col md:gap-0"
        aria-label="Navigasi rekam medis"
      >
        {/* Branded header */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-indigo-600 px-3 py-2.5 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <ClipboardList size={13} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-200">Formulir</p>
              <p className="text-xs font-bold leading-none text-white">Rekam Medis</p>
            </div>
          </div>
        </div>

        {/* Rekam Medis group */}
        <div className="mb-2">
          <p className="mb-1 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Rekam Medis
          </p>
          {REKAM_MEDIS.map((tab) => (
            <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id)} />
          ))}
        </div>

        {/* Divider */}
        <div className="mx-3 mb-2 flex items-center gap-2">
          <div className="h-px flex-1 bg-slate-100" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Layanan</span>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        {/* Layanan group */}
        <div>
          {LAYANAN.map((tab) => (
            <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id)} />
          ))}
        </div>
      </nav>

      {/* ── Content with smooth fade transition ── */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {active === "triase"       && <TriaseTab       patient={patient} />}
            {active === "ttv"          && <TTVTab          patient={patient} />}
            {active === "asesmen"      && <AsesmenMedisTab patient={patient} />}
            {active === "diagnosa"     && <DiagnosaTab     patient={patient} />}
            {active === "cppt"         && <CPPTTab         patient={patient} />}
            {active === "tindakan"     && <TindakanTab     patient={patient} />}
            {active === "daftar-order" && <DaftarOrderTab   patient={patient} />}
            {active === "resep"        && <ResepPasienTab  patient={patient} />}
            {active === "order-lab"    && <OrderLabTab     patient={patient} />}
            {active === "order-rad"    && <OrderRadTab     patient={patient} />}
            {active === "pulang"       && <PasienPulangTab patient={patient} />}
            {active === "rekonsiliasi" && <RekonsiliasTab  patient={patient} />}
            {active === "keperawatan"  && <KeperawatanTab  patient={patient} />}
            {active === "pemeriksaan"  && <PemeriksaanTab />}
            {active === "penilaian"    && <PenilaianTab    patient={patient} />}
            {active === "rujukan"      && <RujukanKeluarTab    patient={patient} />}
            {active === "penandaan"   && <PenandaanGambarTab patient={patient} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
