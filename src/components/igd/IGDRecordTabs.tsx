"use client";

import { useState } from "react";
import {
  ClipboardList, HeartPulse, Stethoscope, Tag, FileText, Zap, LogOut,
  Pill, FlaskConical, Radiation, Send, Home,
  Repeat, HeartHandshake, ScanLine, ClipboardCheck,
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
import DisposisiTab     from "./tabs/DisposisiTab";
import ResepPasienTab   from "./tabs/ResepPasienTab";
import OrderLabTab      from "./tabs/OrderLabTab";
import OrderRadTab      from "./tabs/OrderRadTab";
import PasienPulangTab  from "./tabs/PasienPulangTab";
import RekonsiliasTab   from "./tabs/RekonsiliasTab";
import KeperawatanTab   from "./tabs/KeperawatanTab";
import PemeriksaanTab   from "./tabs/PemeriksaanTab";
import PenilaianTab     from "./tabs/PenilaianTab";

// ── Tab groups ────────────────────────────────────────────

interface TabDef { id: string; label: string; icon: LucideIcon }

const REKAM_MEDIS: TabDef[] = [
  { id: "triase",        label: "Triase",          icon: ClipboardList  },
  { id: "ttv",           label: "TTV",             icon: HeartPulse     },
  { id: "asesmen",       label: "Asesmen Medis",   icon: Stethoscope    },
  { id: "diagnosa",      label: "Diagnosa",        icon: Tag            },
  { id: "cppt",          label: "CPPT / SOAP",     icon: FileText       },
  { id: "tindakan",      label: "Tindakan IGD",    icon: Zap            },
  { id: "disposisi",     label: "Disposisi",       icon: LogOut         },
  { id: "rekonsiliasi",  label: "Rekonsiliasi",    icon: Repeat         },
  { id: "keperawatan",   label: "Keperawatan",     icon: HeartHandshake },
  { id: "pemeriksaan",   label: "Pemeriksaan",     icon: ScanLine       },
  { id: "penilaian",     label: "Penilaian",       icon: ClipboardCheck },
];

const LAYANAN: TabDef[] = [
  { id: "resep",     label: "Resep Pasien",    icon: Pill         },
  { id: "order-lab", label: "Order Lab",       icon: FlaskConical },
  { id: "order-rad", label: "Order Radiologi", icon: Radiation    },
  { id: "rujukan",   label: "Rujukan Keluar",  icon: Send         },
  { id: "pulang",    label: "Pasien Pulang",   icon: Home         },
];

const ALL_TABS = [...REKAM_MEDIS, ...LAYANAN];
type TabId = typeof ALL_TABS[number]["id"];

// ── Stub placeholder ──────────────────────────────────────

function ComingSoon({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon size={22} />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="mt-1 text-xs text-slate-400">Fitur ini sedang dalam pengembangan.</p>
      </div>
    </div>
  );
}

// ── Nav item ──────────────────────────────────────────────

function NavItem({ tab, active, onClick }: { tab: TabDef; active: boolean; onClick: () => void }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "mx-2 flex w-[calc(100%-16px)] items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition",
        active
          ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/80"
          : "text-slate-500 hover:bg-white/60 hover:text-slate-800",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={14} className={active ? "text-indigo-500" : "text-slate-400"} aria-hidden="true" />
      <span className="truncate">{tab.label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />}
    </button>
  );
}

// ── Main component ────────────────────────────────────────

export default function IGDRecordTabs({ patient }: { patient: IGDPatientDetail }) {
  const [active, setActive] = useState<TabId>("triase");
  const activeTab = ALL_TABS.find((t) => t.id === active)!;

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
                "my-1.5 flex shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-semibold transition",
                active === tab.id
                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600",
              )}
              aria-current={active === tab.id ? "page" : undefined}
            >
              <Icon size={14} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ── Desktop: vertical left nav ── */}
      <nav
        className="hidden w-44 shrink-0 overflow-y-auto border-r border-slate-200 bg-white py-3 md:flex md:flex-col md:gap-3"
        aria-label="Navigasi rekam medis"
      >
        {/* Rekam Medis group */}
        <div>
          <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Rekam Medis
          </p>
          {REKAM_MEDIS.map((tab) => (
            <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id)} />
          ))}
        </div>

        <hr className="mx-4 border-slate-100" />

        {/* Layanan group */}
        <div>
          <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Layanan
          </p>
          {LAYANAN.map((tab) => (
            <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id)} />
          ))}
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-5">
        {active === "triase"       && <TriaseTab       patient={patient} />}
        {active === "ttv"          && <TTVTab          patient={patient} />}
        {active === "asesmen"      && <AsesmenMedisTab patient={patient} />}
        {active === "diagnosa"     && <DiagnosaTab     patient={patient} />}
        {active === "cppt"         && <CPPTTab         patient={patient} />}
        {active === "tindakan"     && <TindakanTab     patient={patient} />}
        {active === "disposisi"    && <DisposisiTab    patient={patient} />}
        {active === "resep"        && <ResepPasienTab  patient={patient} />}
        {active === "order-lab"    && <OrderLabTab     patient={patient} />}
        {active === "order-rad"    && <OrderRadTab     patient={patient} />}
        {active === "pulang"       && <PasienPulangTab patient={patient} />}
        {active === "rekonsiliasi" && <RekonsiliasTab  patient={patient} />}
        {active === "keperawatan"  && <KeperawatanTab  patient={patient} />}
        {active === "pemeriksaan"  && <PemeriksaanTab  patient={patient} />}
        {active === "penilaian"    && <PenilaianTab    patient={patient} />}
        {["rujukan"].includes(active) && (
          <ComingSoon label={activeTab.label} icon={activeTab.icon} />
        )}
      </main>
    </div>
  );
}
