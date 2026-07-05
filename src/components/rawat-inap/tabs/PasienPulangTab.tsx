"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck, ClipboardList, FileCheck2, FileText, LogOut,
  Pill, CheckCircle2, HeartOff, Stethoscope, Clock, type LucideIcon,
} from "lucide-react";
import type { RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import { getDisposisi, type DisposisiDTO } from "@/lib/api/disposisi/disposisi";
import {
  type PasienPulangData,
  PASIEN_PULANG_MOCK,
  makeInitialSurat,
  STATUS_KEPULANGAN_CONFIG,
} from "../pasienPulang/pasienPulangShared";
import BillingGateBanner from "../pasienPulang/BillingGateBanner";
import ObatJadwalPane    from "../pasienPulang/ObatJadwalPane";
import SuratPane         from "../pasienPulang/SuratPane";
import ResumeMedikPane   from "../pasienPulang/ResumeMedikPane";
import ResumeMedisPane   from "../pasienPulang/ResumeMedisPane";
import PengembalianPane  from "@/components/farmasi/pengembalian/PengembalianPane";
import DisposisiPane     from "@/components/igd/tabs/PasienPulangTab";
import type { DisposisiCompleteFn } from "@/components/igd/IGDRecordTabs";
import type { PulangPatient } from "@/components/igd/tabs/pasienPulang/pasienPulangShared";

// ── Tab definitions ───────────────────────────────────────
// Sub "Pasien Pulang" (disposisi, reuse form IGD tanpa opsi Rawat Inap) diposisikan
// SEBELUM Resume Pulang — urutan kerja: administrasi → disposisi → cetak resume.

type TabId = "status" | "obat" | "surat" | "resume-medik" | "resume-pulang" | "pengembalian";

interface TabDef { id: TabId; label: string; icon: LucideIcon }

const TABS: TabDef[] = [
  { id: "obat",          label: "Obat & Jadwal",  icon: Pill          },
  { id: "pengembalian",  label: "Kembalian Obat", icon: CalendarCheck },
  { id: "surat",         label: "Surat-surat",    icon: ClipboardList },
  { id: "resume-medik",  label: "Resume Medik",   icon: FileCheck2    },
  { id: "status",        label: "Pasien Pulang",  icon: LogOut        },
  { id: "resume-pulang", label: "Resume Pulang",  icon: FileText      },
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Banner "Pasien Sudah Dipulangkan" (dari disposisi persisted) ──────────────

const JENIS_BANNER: Record<DisposisiDTO["jenis"], { label: string; meninggal?: boolean }> = {
  Pulang:     { label: "Pulang Atas Saran Dokter" },
  APS:        { label: "Pulang Atas Permintaan Sendiri (APS)" },
  Rujuk:      { label: "Dirujuk ke RS Lain" },
  Meninggal:  { label: "Meninggal", meninggal: true },
  Rawat_Inap: { label: "Rawat Inap" },
};

function fmtWaktuKeluar(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function DischargedBanner({ disposisi }: { disposisi: DisposisiDTO }) {
  const cfg = JENIS_BANNER[disposisi.jenis];
  const isMeninggal = !!cfg.meninggal;
  const tone = isMeninggal
    ? { wrap: "border-slate-300 bg-slate-100", icon: "bg-slate-700 text-slate-100", head: "text-slate-800", sub: "text-slate-500", val: "text-slate-700" }
    : { wrap: "border-emerald-300 bg-emerald-50", icon: "bg-emerald-500 text-white", head: "text-emerald-800", sub: "text-emerald-600/80", val: "text-emerald-800" };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("shrink-0 border-b px-4 py-2.5", tone.wrap)}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tone.icon)}>
            {isMeninggal ? <HeartOff size={15} /> : <CheckCircle2 size={15} />}
          </span>
          <div className="min-w-0">
            <p className={cn("text-[10px] font-bold uppercase tracking-widest", tone.sub)}>
              {isMeninggal ? "Kunjungan Selesai" : "Pasien Sudah Dipulangkan"}
            </p>
            <p className={cn("text-sm font-bold leading-tight", tone.head)}>{cfg.label}</p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            <Clock size={12} className={tone.sub} />
            <span className={cn("text-[11px] font-medium", tone.val)}>{fmtWaktuKeluar(disposisi.waktuKeluar)}</span>
          </span>
          {disposisi.dokter && (
            <span className="flex items-center gap-1.5">
              <Stethoscope size={12} className={tone.sub} />
              <span className={cn("text-[11px] font-medium", tone.val)}>{disposisi.dokter}</span>
            </span>
          )}
          {disposisi.diagnosaKeluar.length > 0 && (
            <span className="flex items-center gap-1.5">
              <FileText size={12} className={tone.sub} />
              <span className={cn("text-[11px] font-medium", tone.val)}>{disposisi.diagnosaKeluar.length} diagnosa keluar</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Header ────────────────────────────────────────────────

function PasienPulangHeader({ data }: { data: PasienPulangData }) {
  const statusCfg = data.status ? STATUS_KEPULANGAN_CONFIG[data.status] : null;

  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">

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

export default function PasienPulangTab({
  patient,
  onComplete,
}: {
  patient: RawatInapPatientDetail;
  /** Selesaikan kunjungan (persist Disposisi + kunci) — diteruskan ke form disposisi. */
  onComplete?: DisposisiCompleteFn;
}) {
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
  const [activeTab, setActiveTab] = useState<TabId>("obat");
  // Disposisi persisted (transisi complete) → banner "sudah dipulangkan" lintas sub-tab.
  const [disposisi, setDisposisi] = useState<DisposisiDTO | null>(null);

  useEffect(() => {
    if (!UUID_RE.test(patient.id)) return;
    const ac = new AbortController();
    getDisposisi(patient.id, ac.signal)
      .then((d) => { if (!ac.signal.aborted) setDisposisi(d); })
      .catch(() => { /* belum diselesaikan → banner tak tampil */ });
    return () => ac.abort();
  }, [patient.id]);

  // Bungkus onComplete: setelah selesai → refetch disposisi agar banner hijau muncul segera.
  const handleComplete: DisposisiCompleteFn | undefined = onComplete
    ? async (disp, waktu) => {
        await onComplete(disp, waktu);
        if (UUID_RE.test(patient.id)) {
          getDisposisi(patient.id).then(setDisposisi).catch(() => {});
        }
      }
    : undefined;

  // Adapter RI → potongan pasien yang dibutuhkan form disposisi (reuse form IGD, tanpa fork).
  const pulangPatient: PulangPatient = useMemo(() => ({
    id:               patient.id,
    noRM:             patient.noRM,
    noKunjungan:      patient.noKunjungan,
    name:             patient.name,
    age:              patient.age,
    gender:           patient.gender,
    doctor:           patient.dpjp,
    diagnosa:         patient.diagnosa,
    tglKunjungan:     patient.tglMasuk,
    arrivalTime:      "", // RI tak mencatat jam masuk di header
    noBpjs:           patient.noBpjs,
    namaKeluarga:     patient.namaKeluarga,
    hubunganKeluarga: patient.hubunganKeluarga,
    noHp:             patient.noHp,
  }), [patient]);

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* Header */}
      <PasienPulangHeader data={data} />

      {/* Banner hijau "Pasien Sudah Dipulangkan" — muncul saat disposisi persisted */}
      {disposisi && <DischargedBanner disposisi={disposisi} />}

      {/* BL6.2 — Discharge gate: sisa tagihan banner (reactive via billingStore) */}
      <BillingGateBanner noRM={patient.noRM} />

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
                <DisposisiPane patient={pulangPatient} excludeStatus={["Rawat_Inap"]} onComplete={handleComplete} />
              )}
              {activeTab === "obat" && (
                <ObatJadwalPane data={data} onChange={setData} patient={patient} />
              )}
              {activeTab === "pengembalian" && (
                <PengembalianPane noRM={patient.noRM} kunjunganId={patient.id} />
              )}
              {activeTab === "surat" && (
                <SuratPane data={data} onChange={setData} patient={patient} />
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
