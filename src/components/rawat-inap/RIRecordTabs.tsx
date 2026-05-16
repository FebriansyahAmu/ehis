"use client";

import { useState } from "react";
import IdentitasVerifikasiBanner, { type VerifikasiInfo } from "@/components/shared/medical-records/IdentitasVerifikasiBanner";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, HeartPulse, Tag, HeartHandshake, ScanLine,
  Pill, FlaskConical, Radiation, ClipboardList, LogOut,
  MessageSquare, Droplets, DoorOpen, Stethoscope, ArrowRightLeft,
  ListChecks, ShieldCheck, Repeat, Target, Salad, Activity, Tablets, type LucideIcon,
} from "lucide-react";
import type { RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

import AsesmenAwalTab   from "./tabs/AsesmenAwalTab";
import CPPTTab          from "./tabs/CPPTTab";
import TTVTab           from "./tabs/TTVTab";
import DiagnosaTab      from "./tabs/DiagnosaTab";
import KeperawatanTab   from "./tabs/KeperawatanTab";
import PemeriksaanTab   from "./tabs/PemeriksaanTab";
import IntakeOutputTab  from "./tabs/IntakeOutputTab";
import ResepTab         from "@/components/shared/medical-records/ResepTab";
import OrderLabTab      from "./tabs/OrderLabTab";
import OrderRadTab      from "./tabs/OrderRadTab";
import KonsultasiTab    from "@/components/shared/medical-records/KonsultasiTab";
import DischargePlanTab  from "./tabs/DischargePlanTab";
import PasienPulangTab  from "./tabs/PasienPulangTab";
import HandoverTab          from "./tabs/HandoverTab";
import DaftarOrderTab       from "./tabs/DaftarOrderTab";
import InformedConsentTab   from "./tabs/InformedConsentTab";
import RekonsiliasTab       from "./tabs/RekonsiliasTab";
import CarePlanTab          from "./tabs/CarePlanTab";
import GiziNutrisiTab      from "./tabs/GiziNutrisiTab";
import ICUScoringTab       from "./tabs/ICUScoringTab";
import FarmasiTab          from "@/components/shared/medical-records/FarmasiTab";

// ── Tab definitions ───────────────────────────────────────

interface TabDef { id: string; label: string; icon: LucideIcon; done: boolean; showFor?: string[] }

const REKAM_MEDIS: TabDef[] = [
  { id: "asesmen-awal", label: "Asesmen Awal",         icon: Stethoscope,    done: true  },
  { id: "care-plan",   label: "Rencana Asuhan",       icon: Target,         done: true  },
  { id: "cppt",        label: "CPPT / SOAP",          icon: FileText,       done: true  },
  { id: "ttv",          label: "TTV",                  icon: HeartPulse,     done: true  },
  { id: "diagnosa",     label: "Diagnosa",             icon: Tag,            done: true  },
  { id: "keperawatan",  label: "Asuhan Keperawatan",   icon: HeartHandshake, done: true  },
  { id: "pemeriksaan",  label: "Pemeriksaan Fisik",    icon: ScanLine,       done: true  },
  { id: "intake-output",label: "Intake / Output",      icon: Droplets,       done: true  },
  { id: "gizi-nutrisi", label: "Gizi & Nutrisi",       icon: Salad,          done: true  },
  { id: "icu-scoring",  label: "ICU Scoring",          icon: Activity,       done: true, showFor: ["ICU", "HCU"] },
  { id: "handover",          label: "Serah Terima Shift",  icon: ArrowRightLeft, done: true },
  { id: "informed-consent",  label: "Informed Consent",    icon: ShieldCheck,    done: true },
  { id: "rekonsiliasi",      label: "Rekonsiliasi Obat",   icon: Repeat,         done: true },
];

const LAYANAN: TabDef[] = [
  { id: "daftar-order", label: "Daftar Order",          icon: ListChecks,     done: true  },
  { id: "resep",        label: "Resep & Obat",         icon: Pill,           done: true  },
  { id: "farmasi",      label: "Status Farmasi",       icon: Tablets,        done: true  },
  { id: "order-lab",    label: "Order Lab",            icon: FlaskConical,   done: true  },
  { id: "order-rad",    label: "Order Radiologi",      icon: Radiation,      done: true  },
  { id: "konsultasi",   label: "Konsultasi",           icon: MessageSquare,  done: true  },
  { id: "discharge",    label: "Discharge Planning",   icon: LogOut,         done: true  },
  { id: "pasien-pulang",label: "Pasien Pulang",        icon: DoorOpen,       done: true  },
];

const ALL_TABS = [...REKAM_MEDIS, ...LAYANAN];
type TabId = typeof ALL_TABS[number]["id"];

// ── NavItem ───────────────────────────────────────────────

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
      <Icon size={14} className={cn("shrink-0", active ? "text-white/90" : "text-slate-400")} aria-hidden />
      <span className="flex-1 truncate">{tab.label}</span>
      {!tab.done && (
        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600 ring-1 ring-amber-200">
          Soon
        </span>
      )}
      {active && tab.done && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />}
    </button>
  );
}

// ── Main ─────────────────────────────────────────────────

export default function RIRecordTabs({ patient }: { patient: RawatInapPatientDetail }) {
  const [active, setActive] = useState<TabId>("cppt");

  const visibleRM   = REKAM_MEDIS.filter((t) => !t.showFor || t.showFor.includes(patient.kelas));
  const visibleTabs = [...visibleRM, ...LAYANAN];

  // ── Identitas verifikasi ──────────────────────────────────
  const [identitasVerified, setIdentitasVerified] = useState(false);
  const [verifikasiInfo,    setVerifikasiInfo]    = useState<VerifikasiInfo | null>(null);

  function handleVerifikasiIdentitas(perawat: string) {
    setIdentitasVerified(true);
    setVerifikasiInfo({
      perawat,
      waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    });
  }

  function withIdentitas(content: React.ReactNode) {
    return (
      <div>
        <IdentitasVerifikasiBanner
          namaLengkap={patient.name}
          tanggalLahir={patient.tanggalLahir}
          noRM={patient.noRM}
          isVerified={identitasVerified}
          verifikasiInfo={verifikasiInfo ?? undefined}
          onVerify={handleVerifikasiIdentitas}
        />
        <motion.div
          animate={{
            opacity: identitasVerified ? 1 : 0.12,
            filter:  identitasVerified ? "blur(0px)" : "blur(3px)",
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ pointerEvents: identitasVerified ? "auto" : "none" }}
        >
          {content}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">

      {/* ── Mobile: horizontal scroll tabs ── */}
      <nav
        className="flex shrink-0 overflow-x-auto border-b border-slate-200 bg-white px-2 md:hidden"
        aria-label="Navigasi rekam medis rawat inap"
      >
        {visibleTabs.map((tab) => {
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
            >
              <Icon size={13} aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ── Desktop: vertical left nav ── */}
      <nav
        className="hidden w-56 shrink-0 overflow-y-auto border-r border-slate-200 bg-white py-3 md:flex md:flex-col"
        aria-label="Navigasi rekam medis rawat inap"
      >
        {/* Header */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-indigo-600 px-3 py-2.5 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <ClipboardList size={13} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-200">Rawat Inap</p>
              <p className="text-xs font-bold leading-none text-white">Rekam Medis</p>
            </div>
          </div>
        </div>

        {/* Rekam Medis group */}
        <div className="mb-2">
          <p className="mb-1 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Rekam Medis</p>
          {visibleRM.map((tab) => (
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

      {/* ── Tab content ── */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {active === "asesmen-awal" && <AsesmenAwalTab  patient={patient} />}
            {active === "care-plan"   && <CarePlanTab    patient={patient} />}
            {active === "cppt"        && <CPPTTab        patient={patient} />}
            {active === "ttv"         && <TTVTab         patient={patient} />}
            {active === "diagnosa"    && <DiagnosaTab    patient={patient} />}
            {active === "keperawatan" && <KeperawatanTab patient={patient} />}
            {active === "pemeriksaan"   && <PemeriksaanTab   patient={patient} />}
            {active === "intake-output" && <IntakeOutputTab   patient={patient} />}
            {active === "gizi-nutrisi"  && <GiziNutrisiTab   patient={patient} />}
            {active === "icu-scoring"   && <ICUScoringTab    patient={patient} />}
            {active === "handover"         && <HandoverTab         patient={patient} />}
            {active === "informed-consent" && <InformedConsentTab   patient={patient} />}
            {active === "rekonsiliasi"     && <RekonsiliasTab       patient={patient} />}
            {active === "daftar-order"  && <DaftarOrderTab    patient={patient} />}
            {active === "farmasi"       && <FarmasiTab        patient={{ noRM: patient.noRM, name: patient.name, context: "ri" }} />}
            {active === "resep"         && withIdentitas(<ResepTab patient={{
              noRM:          patient.noRM,
              name:          patient.name,
              dpjp:          patient.dpjp,
              riwayatAlergi: patient.riwayatAlergi,
              resepRI:       patient.resepRI ? { items: patient.resepRI.items, mar: patient.resepRI.mar } : undefined,
              perawatJaga:   patient.ttvHistory?.[0]?.perawat,
            }} />)}
            {active === "order-lab"     && withIdentitas(<OrderLabTab    patient={patient} />)}
            {active === "order-rad"     && withIdentitas(<OrderRadTab    patient={patient} />)}
            {active === "konsultasi"    && <KonsultasiTab     noRM={patient.noRM} dokterPeminta={patient.dpjp} />}
            {active === "discharge"     && <DischargePlanTab  patient={patient} />}
            {active === "pasien-pulang" && withIdentitas(<PasienPulangTab patient={patient} />)}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
