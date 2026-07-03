"use client";

// Tab Discharge Planning (RI, SNARS ARK 5 / HPK 2 / ARK 3). Pasien NYATA (kunjungan UUID) —
// 3 step DB-wired penuh via /kunjungan/:id/discharge/* (gate clinical.rekammedis):
//   Asesmen   → append latest-wins (revisi terkini + Simpan)
//   Edukasi   → log per topik (POST catat sesi · DELETE soft-delete; petugas = user login)
//   Checklist → snapshot dokumen append latest-wins (items JSONB + catatan DPJP + Simpan)
// Pasien demo (non-UUID) = mock lokal.

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, BookOpen, Calendar, CheckCircle2,
  CheckSquare, ChevronLeft, ChevronRight, ClipboardList, LogOut, Save,
} from "lucide-react";
import type { RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import {
  getDischargeAsesmen, saveDischargeAsesmen,
  listDischargeEdukasi, addDischargeEdukasi, deleteDischargeEdukasi,
  getDischargeChecklist, saveDischargeChecklist,
  type DischargeAsesmenDTO, type DischargeEdukasiDTO, type DischargeChecklistDTO,
} from "@/lib/api/discharge/discharge";
import {
  type DischargePlanData, type DischargeAsesmen, type PhaseColor,
  type KondisiPulang, type HubunganCaregiver, type KemampuanCaregiver,
  type DukunganKeluarga, type KepatuhanObat, type RiwayatReadmisi,
  type EdukasiItem, type EdukasiLog, type ChecklistItem, type DischargeChecklist,
  DISCHARGE_MOCK, STEP_PHASES,
  makeInitialEdukasi, makeInitialChecklist,
  isAsesmenComplete, isEdukasiComplete, isChecklistComplete,
  calcDischargeReadiness,
} from "../discharge/dischargeShared";
import StepAsesmen   from "../discharge/StepAsesmen";
import StepEdukasi, { type EdukasiLogDraft } from "../discharge/StepEdukasi";
import StepChecklist from "../discharge/StepChecklist";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** DTO server → bentuk state FE (vocab union longgar dari string DB). */
function dtoToAsesmen(d: DischargeAsesmenDTO): DischargeAsesmen {
  return {
    tanggalRencanaKRS: d.tanggalRencanaKRS,
    kondisiPulang: d.kondisiPulang as KondisiPulang | "",
    caregiverNama: d.caregiverNama,
    caregiverHubungan: d.caregiverHubungan as HubunganCaregiver | "",
    caregiverKemampuan: d.caregiverKemampuan as KemampuanCaregiver | "",
    kebutuhanHomecare: d.kebutuhanHomecare,
    jenisHomecare: d.jenisHomecare,
    kebutuhanAlatBantu: d.kebutuhanAlatBantu,
    alatBantu: d.alatBantu,
    dukunganKeluarga: d.dukunganKeluarga as DukunganKeluarga | "",
    kepatuhanObatSebelumnya: d.kepatuhanObatSebelumnya as KepatuhanObat | "",
    riwayatReadmisi: d.riwayatReadmisi as RiwayatReadmisi | "",
    catatan: d.catatan,
  };
}

/** DTO log server → EdukasiLog FE (vocab union longgar dari string DB). */
function dtoToLog(d: DischargeEdukasiDTO): EdukasiLog {
  return {
    id:        d.id,
    tanggal:   d.tanggal,
    petugas:   d.petugas,
    profesi:   d.profesi   as EdukasiLog["profesi"],
    metode:    d.metode    as EdukasiLog["metode"],
    penerima:  d.penerima  as EdukasiLog["penerima"],
    pemahaman: d.pemahaman as EdukasiLog["pemahaman"],
    catatan:   d.catatan,
  };
}

/** Overlay checklist DB ke atas template FE; id tak dikenal (template berubah) → item ekstra dari snapshot. */
function dtoToChecklist(d: DischargeChecklistDTO): DischargeChecklist {
  const items: ChecklistItem[] = makeInitialChecklist().items.map((i) => ({ ...i }));
  const byId = new Map(items.map((i) => [i.id, i]));
  for (const r of d.items) {
    const t = byId.get(r.id);
    if (t) {
      t.confirmed = r.confirmed;
      t.catatan   = r.catatan;
    } else {
      items.push({
        id: r.id, label: r.label, sublabel: r.sublabel,
        required: r.required, confirmed: r.confirmed, catatan: r.catatan,
      });
    }
  }
  return { items, catatanKhusus: d.catatanKhusus, confirmedBy: d.pencatat, confirmedAt: d.updatedAt };
}

/** Grup log DB per topik ke atas template FE; topikId tak dikenal (template berubah) → item ekstra dari snapshot. */
function logsToEdukasi(rows: DischargeEdukasiDTO[]): EdukasiItem[] {
  const items = makeInitialEdukasi();
  const byId  = new Map(items.map(i => [i.id, i]));
  for (const r of rows) { // rows = createdAt desc → logs terbaru dulu (konvensi FE)
    let item = byId.get(r.topikId);
    if (!item) {
      item = { id: r.topikId, topik: r.topik, kategori: r.kategori, logs: [] };
      byId.set(r.topikId, item);
      items.push(item);
    }
    item.logs.push(dtoToLog(r));
  }
  return items;
}

// ── Step definitions ──────────────────────────────────────

interface StepDef {
  id:         string;
  label:      string;
  short:      string;
  icon:       IconComponent;
  phaseIndex: number;
}

const STEPS: StepDef[] = [
  { id: "asesmen",   label: "Asesmen Pemulangan", short: "Asesmen",   icon: ClipboardList, phaseIndex: 0 },
  { id: "edukasi",   label: "Edukasi Bertahap",   short: "Edukasi",   icon: BookOpen,      phaseIndex: 1 },
  { id: "checklist", label: "Checklist Kesiapan", short: "Checklist", icon: CheckSquare,   phaseIndex: 2 },
];

const PHASE_RING: Record<PhaseColor, { active: string; dot: string; badge: string; connector: string }> = {
  sky:     { active: "border-sky-500 bg-sky-500",         dot: "bg-sky-500",     badge: "bg-sky-100 text-sky-700",         connector: "bg-sky-300"     },
  emerald: { active: "border-emerald-500 bg-emerald-500", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700", connector: "bg-emerald-300" },
  amber:   { active: "border-amber-500 bg-amber-500",     dot: "bg-amber-500",   badge: "bg-amber-100 text-amber-700",     connector: "bg-amber-300"   },
};

const slideVariants = {
  enter:  (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
};

// ── DischargeHeader ───────────────────────────────────────

function DischargeHeader({
  patient, data,
}: { patient: RawatInapPatientDetail; data: DischargePlanData }) {
  const [now]     = useState(() => Date.now()); // snapshot render pertama (react-hooks/purity)
  const days      = patient.hariKe;
  const krsISO    = data.asesmen.tanggalRencanaKRS;
  const krsDate   = krsISO ? new Date(krsISO) : null;
  const daysToKRS = krsDate
    ? Math.ceil((krsDate.getTime() - now) / 86400000)
    : null;
  const readiness = calcDischargeReadiness(data);

  const barColor  = readiness >= 75 ? "bg-emerald-400" : readiness >= 50 ? "bg-sky-400" : "bg-amber-400";
  const textColor = readiness >= 75 ? "text-emerald-600" : readiness >= 50 ? "text-sky-600" : "text-amber-600";

  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1">
          <Calendar size={10} className="text-slate-500" />
          <span className="text-[11px] font-semibold text-slate-600">Hari ke-{days} Perawatan</span>
        </div>

        {krsDate && (
          <div className="flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1">
            <LogOut size={10} className="text-sky-500" />
            <span className="text-[11px] font-semibold text-sky-700">
              Rencana KRS:{" "}
              {krsDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              {daysToKRS !== null && (
                <span className="ml-1 font-normal text-sky-500">
                  ({daysToKRS === 0 ? "hari ini" : daysToKRS > 0 ? `${daysToKRS} hari lagi` : `H+${Math.abs(daysToKRS)}`})
                </span>
              )}
            </span>
          </div>
        )}

        <div className="flex min-w-35 flex-1 items-center gap-2">
          <span className="shrink-0 whitespace-nowrap text-[10px] font-bold text-slate-400">Kesiapan DP</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className={cn("h-full rounded-full", barColor)}
              initial={{ width: 0 }}
              animate={{ width: `${readiness}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
          <span className={cn("shrink-0 text-[11px] font-bold", textColor)}>{readiness}%</span>
        </div>
      </div>
    </div>
  );
}

// ── StepperHeader ─────────────────────────────────────────

function StepperHeader({
  current, completions, onNavigate,
}: {
  current:     number;
  completions: boolean[];
  onNavigate:  (i: number) => void;
}) {
  return (
    <div className="shrink-0 overflow-x-auto border-b border-slate-100 bg-white">
      <div className="flex min-w-max items-center gap-0 px-4 py-2">
        {STEPS.map((step, i) => {
          const Icon      = step.icon;
          const phase     = STEP_PHASES[step.phaseIndex];
          const ring      = PHASE_RING[phase.color];
          const done      = completions[i];
          const active    = i === current;
          const clickable = done || i <= current;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => clickable && onNavigate(i)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-150",
                  active    ? `${ring.badge} bg-opacity-50` :
                  clickable ? "hover:bg-slate-50" :
                              "cursor-default opacity-40",
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200",
                  active
                    ? `${ring.active} text-white shadow-md`
                    : done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white text-slate-400",
                )}>
                  {done && !active ? <CheckCircle2 size={14} /> : <Icon size={13} />}
                </div>
                <span className={cn(
                  "whitespace-nowrap text-[10px] font-semibold",
                  active ? "text-slate-700" : done ? "text-emerald-600" : "text-slate-400",
                )}>
                  {step.short}
                </span>
                <span className={cn(
                  "whitespace-nowrap rounded-full px-1.5 py-0.5 text-[8px] font-bold transition-colors",
                  active ? ring.badge : "bg-slate-100 text-slate-400",
                )}>
                  {phase.phase}
                </span>
              </button>

              {i < STEPS.length - 1 && (
                <div className={cn(
                  "mx-1 h-0.5 w-7 rounded-full transition-colors duration-300",
                  completions[i] ? ring.connector : "bg-slate-200",
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── FinalizeBanner ────────────────────────────────────────

function FinalizeBanner({ allDone, patientName }: { allDone: boolean; patientName: string }) {
  const [finalized, setFinalized] = useState(false);
  if (!allDone) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mx-4 mb-3 mt-1 rounded-xl border p-3.5",
        finalized ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
      )}
    >
      {finalized ? (
        <div className="flex items-center gap-3">
          <CheckCircle2 size={18} className="text-emerald-500" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Discharge Planning Selesai</p>
            <p className="text-xs text-emerald-700">
              Lanjutkan ke tab <strong>Pasien Pulang</strong> untuk menyelesaikan obat pulang, surat-surat, dan resume medis.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ArrowRight size={16} className="shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-800">Semua langkah selesai!</p>
              <p className="text-xs text-amber-700">Finalisasi discharge planning untuk {patientName}.</p>
            </div>
          </div>
          <button
            onClick={() => setFinalized(true)}
            className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-600 active:scale-95"
          >
            Finalisasi DP
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function DischargePlanTab({ patient }: { patient: RawatInapPatientDetail }) {
  const kunjunganId = patient.id;
  const isPersisted = UUID_RE.test(kunjunganId); // UUID = DB; demo = lokal
  const { session } = useSession();
  const petugasNama = session?.namaTampil ?? "";

  const emptyAsesmen: DischargeAsesmen = {
    tanggalRencanaKRS: "", kondisiPulang: "", caregiverNama: "",
    caregiverHubungan: "", caregiverKemampuan: "", kebutuhanHomecare: false,
    jenisHomecare: [], kebutuhanAlatBantu: false, alatBantu: [],
    dukunganKeluarga: "", kepatuhanObatSebelumnya: "", riwayatReadmisi: "", catatan: "",
  };
  const initial: DischargePlanData = (!isPersisted && DISCHARGE_MOCK[patient.noRM]) || {
    asesmen:   emptyAsesmen,
    edukasi:   makeInitialEdukasi(),
    checklist: makeInitialChecklist(),
  };

  const [data,        setData]        = useState<DischargePlanData>(initial);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction,   setDirection]   = useState(1);
  const [saving,      setSaving]      = useState(false);
  const [asesmenMeta, setAsesmenMeta] = useState<{ pencatat: string; updatedAt: string } | null>(null);

  // Muat asesmen terkini + log edukasi (kunjungan UUID). Demo → mock by noRM.
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getDischargeAsesmen(kunjunganId, ac.signal)
      .then((dto) => {
        if (ac.signal.aborted || !dto) return;
        setData((d) => ({ ...d, asesmen: dtoToAsesmen(dto) }));
        setAsesmenMeta({ pencatat: dto.pencatat, updatedAt: dto.updatedAt });
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat asesmen pemulangan", e instanceof ApiError ? e.message : undefined);
      });
    listDischargeEdukasi(kunjunganId, ac.signal)
      .then((rows) => {
        if (ac.signal.aborted) return;
        setData((d) => ({ ...d, edukasi: logsToEdukasi(rows) }));
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat log edukasi", e instanceof ApiError ? e.message : undefined);
      });
    getDischargeChecklist(kunjunganId, ac.signal)
      .then((dto) => {
        if (ac.signal.aborted || !dto) return;
        setData((d) => ({ ...d, checklist: dtoToChecklist(dto) }));
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat checklist kesiapan", e instanceof ApiError ? e.message : undefined);
      });
    return () => ac.abort();
  }, [kunjunganId, isPersisted]);

  /** Simpan asesmen (append latest-wins; pencatat = user login server-side). */
  async function handleSaveAsesmen() {
    if (!isPersisted || saving) return;
    setSaving(true);
    try {
      const dto = await saveDischargeAsesmen(kunjunganId, data.asesmen);
      setData((d) => ({ ...d, asesmen: dtoToAsesmen(dto) }));
      setAsesmenMeta({ pencatat: dto.pencatat, updatedAt: dto.updatedAt });
      toast.success("Asesmen pemulangan tersimpan");
    } catch (e) {
      toast.error("Gagal menyimpan asesmen", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  /** Simpan checklist (append latest-wins snapshot penuh; pencatat = user login server-side). */
  async function handleSaveChecklist() {
    if (!isPersisted || saving) return;
    setSaving(true);
    try {
      const c = data.checklist;
      const dto = await saveDischargeChecklist(kunjunganId, {
        items: c.items.map((i) => ({
          id: i.id, label: i.label, sublabel: i.sublabel,
          required: i.required, confirmed: i.confirmed, catatan: i.catatan,
        })),
        catatanKhusus: c.catatanKhusus,
      });
      setData((d) => ({ ...d, checklist: dtoToChecklist(dto) }));
      toast.success("Checklist kesiapan tersimpan");
    } catch (e) {
      toast.error("Gagal menyimpan checklist", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  /** Sisipkan/hapus log pada 1 item edukasi di state. */
  function patchEdukasiItem(itemId: string, fn: (logs: EdukasiLog[]) => EdukasiLog[]) {
    setData((d) => ({
      ...d,
      edukasi: d.edukasi.map((i) => (i.id === itemId ? { ...i, logs: fn(i.logs) } : i)),
    }));
  }

  /** Catat 1 sesi edukasi (persisted → POST DB, petugas = server; demo → lokal). */
  async function handleAddEdukasiLog(item: EdukasiItem, draft: EdukasiLogDraft): Promise<boolean> {
    if (!isPersisted) {
      const log: EdukasiLog = { id: `log-${Date.now()}`, petugas: petugasNama || "Petugas", ...draft };
      patchEdukasiItem(item.id, (logs) => [log, ...logs]);
      return true;
    }
    try {
      const dto = await addDischargeEdukasi(kunjunganId, {
        topikId:   item.id,
        topik:     item.topik,
        kategori:  item.kategori,
        tanggal:   draft.tanggal,
        profesi:   draft.profesi,
        metode:    draft.metode,
        penerima:  draft.penerima,
        pemahaman: draft.pemahaman,
        catatan:   draft.catatan,
      });
      patchEdukasiItem(item.id, (logs) => [dtoToLog(dto), ...logs]);
      toast.success("Log edukasi tersimpan");
      return true;
    } catch (e) {
      toast.error("Gagal menyimpan log edukasi", e instanceof ApiError ? e.message : undefined);
      return false;
    }
  }

  /** Hapus (koreksi) 1 log edukasi (persisted → DELETE soft-delete; demo → lokal). */
  async function handleDeleteEdukasiLog(item: EdukasiItem, logId: string): Promise<boolean> {
    if (!isPersisted) {
      patchEdukasiItem(item.id, (logs) => logs.filter((l) => l.id !== logId));
      return true;
    }
    try {
      await deleteDischargeEdukasi(kunjunganId, logId);
      patchEdukasiItem(item.id, (logs) => logs.filter((l) => l.id !== logId));
      toast.success("Log edukasi dihapus");
      return true;
    } catch (e) {
      toast.error("Gagal menghapus log edukasi", e instanceof ApiError ? e.message : undefined);
      return false;
    }
  }

  const completions = [
    isAsesmenComplete(data.asesmen),
    isEdukasiComplete(data.edukasi),
    isChecklistComplete(data.checklist),
  ];

  const allDone = completions.every(Boolean);
  const isFirst = currentStep === 0;
  const isLast  = currentStep === STEPS.length - 1;

  function navigate(to: number) {
    setDirection(to > currentStep ? 1 : -1);
    setCurrentStep(to);
  }

  const currentPhase = STEP_PHASES[STEPS[currentStep].phaseIndex];

  return (
    <div className="flex h-full flex-col overflow-hidden">

      <DischargeHeader patient={patient} data={data} />

      <StepperHeader current={currentStep} completions={completions} onNavigate={navigate} />

      {/* Step label bar */}
      <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-800">{STEPS[currentStep].label}</p>
            <p className="text-[11px] text-slate-400">{currentPhase.desc} · {currentPhase.std}</p>
          </div>
          <div className="flex items-center gap-2">
            {completions[currentStep] && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
              >
                <CheckCircle2 size={11} /> Lengkap
              </motion.div>
            )}
            {currentStep === 0 && isPersisted && (
              <>
                {asesmenMeta && (
                  <span className="hidden text-[10px] text-slate-400 sm:inline">
                    Tersimpan oleh {asesmenMeta.pencatat} ·{" "}
                    {asesmenMeta.updatedAt.slice(0, 10)} {asesmenMeta.updatedAt.slice(11, 16)}
                  </span>
                )}
                <button
                  onClick={() => void handleSaveAsesmen()}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-95 disabled:opacity-60"
                >
                  <Save size={12} />
                  {saving ? "Menyimpan…" : "Simpan Asesmen"}
                </button>
              </>
            )}
            {currentStep === 2 && isPersisted && (
              <>
                {data.checklist.confirmedBy && (
                  <span className="hidden text-[10px] text-slate-400 sm:inline">
                    Tersimpan oleh {data.checklist.confirmedBy} ·{" "}
                    {data.checklist.confirmedAt.slice(0, 10)} {data.checklist.confirmedAt.slice(11, 16)}
                  </span>
                )}
                <button
                  onClick={() => void handleSaveChecklist()}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-95 disabled:opacity-60"
                >
                  <Save size={12} />
                  {saving ? "Menyimpan…" : "Simpan Checklist"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isLast && <FinalizeBanner allDone={allDone} patientName={patient.name} />}

      {/* Step content */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-4">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {currentStep === 0 && (
                <StepAsesmen
                  data={data.asesmen}
                  onChange={asesmen => setData(d => ({ ...d, asesmen }))}
                  patient={patient}
                />
              )}
              {currentStep === 1 && (
                <StepEdukasi
                  items={data.edukasi}
                  petugasNama={petugasNama}
                  onAddLog={handleAddEdukasiLog}
                  onDeleteLog={handleDeleteEdukasiLog}
                />
              )}
              {currentStep === 2 && (
                <StepChecklist
                  data={data.checklist}
                  onChange={checklist => setData(d => ({ ...d, checklist }))}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="shrink-0 flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
        <button
          onClick={() => !isFirst && navigate(currentStep - 1)}
          disabled={isFirst}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all",
            isFirst
              ? "cursor-not-allowed text-slate-300"
              : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
          )}
        >
          <ChevronLeft size={15} /> Sebelumnya
        </button>

        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => {
            const ph   = STEP_PHASES[STEPS[i].phaseIndex];
            const ring = PHASE_RING[ph.color];
            return (
              <button
                key={i}
                onClick={() => navigate(i)}
                className={cn(
                  "rounded-full transition-all duration-200",
                  i === currentStep ? `h-2 w-5 ${ring.dot}` :
                  completions[i]    ? "h-2 w-2 bg-emerald-400" :
                                      "h-2 w-2 bg-slate-300 hover:bg-slate-400",
                )}
              />
            );
          })}
        </div>

        {isLast ? (
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400">
            Selesai <CheckCircle2 size={14} />
          </div>
        ) : (
          <button
            onClick={() => navigate(currentStep + 1)}
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 active:scale-95"
          >
            Berikutnya <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
