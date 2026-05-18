"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IdentitasVerifikasiBanner, { type VerifikasiInfo } from "@/components/shared/medical-records/IdentitasVerifikasiBanner";
import {
  Stethoscope, HeartPulse, FileText, Tag, ScanLine,
  MessageSquare, ShieldCheck, ListChecks, Pill,
  FlaskConical, Radiation, ScrollText, Navigation,
  type LucideIcon,
} from "lucide-react";
import type { RJPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

import AsesmenAwalRJTab from "./tabs/AsesmenAwalRJTab";
import TTVTab           from "@/components/shared/medical-records/TTVTab";
import CPPTTab          from "@/components/shared/medical-records/CPPTTab";
import DiagnosaTab      from "@/components/shared/medical-records/DiagnosaTab";
import PemeriksaanRJTab from "./tabs/PemeriksaanRJTab";
import KonsultasiTab      from "@/components/shared/medical-records/KonsultasiTab";
import InformedConsentTab from "@/components/shared/medical-records/InformedConsentTab";
import DaftarOrderTab    from "@/components/shared/medical-records/DaftarOrderTab";
import ResepTab          from "@/components/shared/medical-records/ResepTab";
import OrderLabTab       from "@/components/shared/medical-records/OrderLabTab";
import OrderRadTab       from "@/components/shared/medical-records/OrderRadTab";
import SuratDokumenTab  from "@/components/shared/medical-records/SuratDokumenTab";
import DisposisiRJTab  from "./tabs/DisposisiRJTab";

// ── Tab definitions ───────────────────────────────────────

interface TabDef { id: string; label: string; icon: LucideIcon; done: boolean }

const REKAM_MEDIS: TabDef[] = [
  { id: "asesmen-awal",     label: "Asesmen Awal",      icon: Stethoscope,   done: true  },
  { id: "ttv",              label: "TTV",               icon: HeartPulse,    done: true  },
  { id: "cppt",             label: "CPPT / SOAP",       icon: FileText,      done: true  },
  { id: "diagnosa",         label: "Diagnosa",          icon: Tag,           done: true  },
  { id: "pemeriksaan",      label: "Pemeriksaan Fisik", icon: ScanLine,      done: true  },
  { id: "konsultasi",       label: "Konsultasi",        icon: MessageSquare, done: true  },
  { id: "informed-consent", label: "Informed Consent",  icon: ShieldCheck,   done: true  },
];

const LAYANAN: TabDef[] = [
  { id: "daftar-order", label: "Daftar Order",     icon: ListChecks,  done: true  },
  { id: "resep",        label: "Resep & Obat",     icon: Pill,        done: true  },
  { id: "order-lab",    label: "Order Lab",        icon: FlaskConical,done: true  },
  { id: "order-rad",    label: "Order Radiologi",  icon: Radiation,   done: true  },
  { id: "surat",        label: "Surat & Dokumen",  icon: ScrollText,  done: true  },
  { id: "disposisi",    label: "Disposisi",        icon: Navigation,  done: true  },
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
    >
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{tab.label}</span>
      {!tab.done && (
        <span className={cn(
          "ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400",
        )}>
          baru
        </span>
      )}
    </button>
  );
}

// ── Group label ───────────────────────────────────────────

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 mt-4 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-400 first:mt-2">
      {children}
    </p>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RJRecordTabs({ patient }: { patient: RJPatientDetail }) {
  const [active, setActive] = useState<TabId>("asesmen-awal");

  // ── Identitas verifikasi (untuk tab aksi: Resep, Order Lab, Order Rad) ──
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
  };

  return (
    <div className="flex min-h-0 flex-1">

      {/* ── Sidebar ── */}
      <nav
        className="flex w-52 shrink-0 flex-col overflow-y-auto border-r border-slate-100 bg-slate-50/60 pb-6"
        aria-label="Tab rekam medis"
      >
        <GroupLabel>Rekam Medis</GroupLabel>
        {REKAM_MEDIS.map(tab => (
          <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id)} />
        ))}

        <GroupLabel>Layanan</GroupLabel>
        {LAYANAN.map(tab => (
          <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id)} />
        ))}
      </nav>

      {/* ── Content ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 p-4 md:p-6"
          >
            {active === "asesmen-awal" && <AsesmenAwalRJTab patient={patient} />}
            {active === "ttv" && (
              <TTVTab
                vitalSigns={patient.vitalSigns}
                statusKesadaran={patient.statusKesadaran}
              />
            )}
            {active === "cppt" && (
              <CPPTTab initialEntries={patient.cppt} />
            )}
            {active === "diagnosa" && (
              <DiagnosaTab initialDiagnosa={patient.diagnosa} />
            )}
            {active === "pemeriksaan" && <PemeriksaanRJTab patient={patient} />}
            {active === "konsultasi"      && <KonsultasiTab noRM={patient.noRM} dokterPeminta={patient.dokter} />}
            {active === "informed-consent" && <InformedConsentTab patient={patient} />}
            {active === "daftar-order" && <DaftarOrderTab patient={{ noRM: patient.noRM, name: patient.name, dpjp: patient.dokter }} />}
            {active === "resep"        && withIdentitas(<ResepTab
              showMAR={false}
              patient={{ noRM: patient.noRM, name: patient.name, dpjp: patient.dokter, riwayatAlergi: patient.riwayatAlergi }}
            />)}
            {active === "order-lab" && withIdentitas(<OrderLabTab patient={{
              doctor:       patient.dokter,
              name:         patient.name,
              noRM:         patient.noRM,
              age:          patient.age,
              gender:       patient.gender,
              tglOrder:     patient.tanggalKunjungan,
              unitPengirim: patient.poli.replace(/_/g, " "),
            }} />)}
            {active === "order-rad" && withIdentitas(<OrderRadTab patient={{
              doctor:       patient.dokter,
              name:         patient.name,
              noRM:         patient.noRM,
              age:          patient.age,
              gender:       patient.gender,
              tglOrder:     patient.tanggalKunjungan,
              unitPengirim: patient.poli.replace(/_/g, " "),
            }} />)}
            {active === "surat" && <SuratDokumenTab patient={{
              noRM:             patient.noRM,
              name:             patient.name,
              age:              patient.age,
              gender:           patient.gender,
              tanggalLahir:     patient.tanggalLahir,
              dokter:           patient.dokter,
              diagnosa:         patient.diagnosa.find(d => d.tipe === "Utama")?.namaDiagnosis,
              tanggalKunjungan: patient.tanggalKunjungan,
            }} />}
            {active === "disposisi" && <DisposisiRJTab patient={patient} />}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
