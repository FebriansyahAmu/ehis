"use client";

// Resume Medik Pane — tab Pasien Pulang RI, sub Resume Medik (kelengkapan RM + klaim BPJS).
// Pasien NYATA (kunjungan UUID): agregat klinis ditarik dari DB (resumeMedikAggregates —
// Observation/Diagnosa/Tindakan/Resep/Lab/Rad), narasi manual persist medicalrecord.ResumeMedik
// (append latest-wins), TTD DPJP = TTE server (POST /resume-medik/sign, Dokter-only) → QR
// pada cetakan A4 (ResumeMedikCetak). Pasien demo: mock lokal (perilaku lama).

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, AlertCircle, CheckCircle2, Circle, FlaskConical, Lock,
  Pill, Printer, Radiation, Save, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RawatInapPatientDetail, IGDDiagnosa } from "@/lib/data";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/contexts/SessionContext";
import { Select, DatePicker } from "@/components/shared/inputs";
import { tteSerial } from "@/components/shared/TteQr";
import {
  getResumeMedik, saveResumeMedik, signResumeMedik, getAsalMasuk,
  type ResumeMedikInput, type AsalMasukDTO,
} from "@/lib/api/resumeMedik/resumeMedik";
import {
  type AsalMasuk, type PasienPulangData, type ResumeMedikData, type TVVSummaryItem,
  checkResumeMedikCompletion,
} from "./pasienPulangShared";
import { fetchResumeAggregates, fmtSignedAt, obsToTtv } from "./resumeMedikAggregates";
import ResumeMedikCetakModal, { type ResumeMedikTte } from "./ResumeMedikCetak";
import TtvPulangQuickRecord from "./TtvPulangQuickRecord";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ASAL_MASUK_OPTS = (["IGD", "Poliklinik", "Transfer RS Lain", "Langsung"] as AsalMasuk[])
  .map(v => ({ value: v, label: v }));

type Props = {
  data:     PasienPulangData;
  onChange: (d: PasienPulangData) => void;
  patient:  RawatInapPatientDetail;
};

// ── Helpers ───────────────────────────────────────────────

const FLAG_STYLE: Record<string, string> = {
  kritis: "bg-red-100 text-red-700 border border-red-200",
  tinggi: "bg-amber-100 text-amber-700 border border-amber-200",
  rendah: "bg-sky-100 text-sky-700 border border-sky-200",
  normal: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};
const FLAG_LABEL: Record<string, string> = {
  kritis: "KRITIS", tinggi: "↑ Tinggi", rendah: "↓ Rendah", normal: "Normal",
};

function SectionHeader({ icon: Icon, title, badge }: {
  icon: IconComponent; title: string; badge?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon size={13} className="text-slate-400" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
      {badge && (
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-sky-600">
          {badge}
        </span>
      )}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700">
        {value || <span className="italic text-slate-400">—</span>}
      </div>
    </div>
  );
}

function FormArea({
  label, value, onChange, rows = 3, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label} <span className="text-red-400">*</span>
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

/** TVVSummaryItem → snapshot Zod (tanpa `label`). */
function ttvSnap(t: TVVSummaryItem | null) {
  if (!t) return null;
  return {
    tanggal: t.tanggal, tekananDarah: t.tekananDarah, nadi: t.nadi, rr: t.rr,
    suhu: t.suhu, spo2: t.spo2, gcs: t.gcs, kesadaran: t.kesadaran,
  };
}

// ── Main ──────────────────────────────────────────────────

export default function ResumeMedikPane({ data, onChange, patient }: Props) {
  const isPersisted = UUID_RE.test(patient.id);
  const { session } = useSession();
  const canSignRole = !isPersisted ||
    (!!session && (session.isSuperuser || session.isGlobal || session.roles.includes("Dokter")));

  const [showPrint,  setShowPrint]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [signing,    setSigning]    = useState(false);
  const [diagnosaDb, setDiagnosaDb] = useState<IGDDiagnosa[]>([]);
  // Meta observasi — banner "TTV pulang belum/kedaluwarsa" (single source = tab TTV).
  const [obsMeta, setObsMeta] = useState<{ count: number; lastAt: string | null }>({ count: 0, lastAt: null });
  // Deteksi asal masuk server (SPRI → kunjungan asal) — terdeteksi = field jadi Auto (read-only).
  const [asalDetect, setAsalDetect] = useState<AsalMasukDTO | null>(null);

  // Ref data terkini — patch async (hydrate/save) tidak menimpa ketikan user antar-render.
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; });

  function patchMedik(patch: Partial<ResumeMedikData>) {
    const cur = dataRef.current;
    onChange({ ...cur, resumeMedik: { ...cur.resumeMedik, ...patch } });
  }

  // ── Hydrate (pasien nyata): agregat DB + revisi resume terkini ──
  // Tanpa guard sekali-jalan: StrictMode abort run pertama → run kedua fetch ulang.
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    (async () => {
      try {
        const [agg, dto, det] = await Promise.all([
          fetchResumeAggregates(patient.id, ac.signal),
          getResumeMedik(patient.id, ac.signal).catch(() => null),
          getAsalMasuk(patient.id, ac.signal).catch(() => null),
        ]);
        // Aborted → allSettled pulang kosong; JANGAN timpa state dengan hasil kosong.
        if (ac.signal.aborted) return;
        setDiagnosaDb(agg.diagnosa);
        setObsMeta({ count: agg.obsCount, lastAt: agg.lastObsAt });
        setAsalDetect(det);
        const patch: Partial<ResumeMedikData> = {
          ttvMasuk: agg.ttvMasuk,
          ttvPulang: agg.ttvPulang,
          hasilLabAbnormal: agg.hasilLabAbnormal,
          hasilRad: agg.hasilRad,
          obatSelamaRawat: agg.obatSelamaRawat,
          tindakan: agg.tindakan,
          ...(dto ? {
            asalMasuk: dto.asalMasuk as AsalMasuk | "",
            tanggalMasukIGD: dto.tanggalMasukIgd,
            diagnosisIGD: dto.diagnosisIgd,
            kondisiMasuk: dto.kondisiMasuk,
            kondisiPulang: dto.kondisiPulang,
            ringkasanKlinis: dto.ringkasanKlinis,
            dpjpApproved: !!dto.tteSignedAt,
            dpjpApprovedAt: dto.tteSignedAt ? fmtSignedAt(dto.tteSignedAt) : "",
            tteToken: dto.tteToken,
            tteSignedBy: dto.tteSignedBy,
          } : {}),
        };
        // Deteksi asal masuk mengisi yang KOSONG (nilai tersimpan resume menang).
        if (det?.terdeteksi) {
          if (!patch.asalMasuk) {
            patch.asalMasuk = det.asalMasuk as AsalMasuk;
            patch.tanggalMasukIGD = det.tanggalMasuk ? det.tanggalMasuk.slice(0, 10) : "";
          }
          if (!patch.diagnosisIGD) patch.diagnosisIGD = det.diagnosisAsal;
        }
        // obatPulang di ROOT PasienPulangData (bukan resumeMedik) — sumber ceklis
        // "Minimal 1 obat pulang" + counter header = order resep DB ber-flag isObatPulang.
        const cur = dataRef.current;
        onChange({
          ...cur,
          obatPulang: agg.obatPulang,
          resumeMedik: { ...cur.resumeMedik, ...patch },
        });
      } catch { /* agregat gagal → panel tetap tampil kosong */ }
    })();
    return () => ac.abort();
    // patchMedik stabil via dataRef — deps cukup identitas kunjungan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPersisted, patient.id]);

  function setMedik<K extends keyof ResumeMedikData>(key: K, val: ResumeMedikData[K]) {
    onChange({ ...data, resumeMedik: { ...data.resumeMedik, [key]: val } });
  }

  const rm = data.resumeMedik;

  function buildInput(): ResumeMedikInput {
    return {
      asalMasuk: rm.asalMasuk,
      tanggalMasukIgd: rm.tanggalMasukIGD,
      diagnosisIgd: rm.diagnosisIGD,
      kondisiMasuk: rm.kondisiMasuk,
      kondisiPulang: rm.kondisiPulang,
      ringkasanKlinis: rm.ringkasanKlinis,
      dataKlinis: {
        ttvMasuk: ttvSnap(rm.ttvMasuk),
        ttvPulang: ttvSnap(rm.ttvPulang),
        hasilLabAbnormal: rm.hasilLabAbnormal,
        hasilRad: rm.hasilRad,
        obatSelamaRawat: rm.obatSelamaRawat,
        tindakan: rm.tindakan,
      },
    };
  }

  // ── Simpan draft (persisted) — revisi baru = TTE di-reset (wajib TTD ulang) ──
  async function handleSave() {
    if (!isPersisted || saving) return;
    setSaving(true);
    try {
      const dto = await saveResumeMedik(patient.id, buildInput());
      patchMedik({
        dpjpApproved: false, dpjpApprovedAt: "",
        tteToken: dto.tteToken, tteSignedBy: dto.tteSignedBy,
      });
      toast.success("Resume medik tersimpan", `Pencatat: ${dto.pencatat}`);
    } catch (e) {
      toast.error("Gagal menyimpan resume medik", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  // ── TTD DPJP — persisted: simpan revisi lalu TTE server (Dokter-only) ──
  async function handleApprove() {
    if (!isPersisted) {
      const now = new Date().toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
      patchMedik({ dpjpApproved: true, dpjpApprovedAt: now });
      return;
    }
    if (signing) return;
    setSigning(true);
    try {
      await saveResumeMedik(patient.id, buildInput()); // pastikan konten TERKINI yang ditandatangani
      const dto = await signResumeMedik(patient.id);
      patchMedik({
        dpjpApproved: true,
        dpjpApprovedAt: dto.tteSignedAt ? fmtSignedAt(dto.tteSignedAt) : "",
        tteToken: dto.tteToken,
        tteSignedBy: dto.tteSignedBy,
      });
      toast.success("Resume medik ditandatangani", dto.tteToken ?? undefined);
    } catch (e) {
      toast.error("Gagal menandatangani", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSigning(false);
    }
  }

  const diagnosaList  = isPersisted ? diagnosaDb : patient.diagnosa;
  const hasDiagnosa   = diagnosaList.length > 0;
  const completions   = checkResumeMedikCompletion(data, hasDiagnosa);
  const doneCount     = completions.filter(c => c.done).length;
  const canPrint      = completions.every(c => c.done);
  const tabItems      = completions.filter(c => c.source === "tab-lain");
  const formItems     = completions.filter(c => c.source === "form-ini");
  const tabDone       = tabItems.every(c => c.done);
  const prereqSign    = completions.filter(c => c.id !== "m8").every(c => c.done);

  const lamaRawat = (() => {
    if (!data.tanggalPulang || !patient.admitDate) return "—";
    const ms   = new Date(data.tanggalPulang).getTime() - new Date(patient.admitDate).getTime();
    const days = Math.ceil(ms / 86400000);
    return `${days} hari`;
  })();

  // TTE untuk cetakan: serial server (persisted) / derivatif deterministik (demo).
  const tteInfo: ResumeMedikTte | null = rm.dpjpApproved
    ? {
        serial: rm.tteToken || tteSerial(`${patient.noRM}|${rm.dpjpApprovedAt}`, "TTE-RSM"),
        signedBy: rm.tteSignedBy || patient.dpjp,
        signedAt: rm.dpjpApprovedAt,
      }
    : null;

  return (
    <>
      <div className="flex flex-col gap-4 xl:flex-row">

        {/* ── Left: content ── */}
        <div className="min-w-0 flex-1 space-y-4">

          {/* Prerequisites banner */}
          <div className={cn(
            "rounded-xl border p-3",
            tabDone ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
          )}>
            <p className={cn("mb-2 text-[10px] font-bold uppercase tracking-wide", tabDone ? "text-emerald-700" : "text-amber-700")}>
              {tabDone ? "✓ Data dari tab terkait sudah lengkap" : "Prerequisite — Data dari tab terkait"}
            </p>
            <div className="flex flex-wrap gap-2">
              {tabItems.map(item => (
                <div key={item.id} className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                  item.done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-white text-amber-700 ring-1 ring-amber-300",
                )}>
                  {item.done
                    ? <CheckCircle2 size={10} />
                    : <AlertCircle size={10} />
                  }
                  {item.label}
                  {!item.done && item.tab && (
                    <span className="text-amber-500">→ buka tab {item.tab === "status" ? "Pasien Pulang" : "Obat & Jadwal"}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Identitas & Episode */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader icon={Activity} title="Identitas & Episode" badge="Auto" />
            <div className="mb-3 grid grid-cols-2 gap-2">
              <ReadOnly label="Nama Pasien"          value={patient.name} />
              <ReadOnly label="No. Rekam Medis"      value={patient.noRM} />
              <ReadOnly label="Umur / Jenis Kelamin" value={`${patient.age} tahun / ${patient.gender === "L" ? "Laki-laki" : "Perempuan"}`} />
              <ReadOnly label="Penjamin"             value={patient.penjamin.replace(/_/g, " ")} />
              <ReadOnly label="Tanggal MRS"          value={patient.tglMasuk} />
              <ReadOnly label="DPJP"                 value={patient.dpjp} />
              <ReadOnly label="Ruangan / Kelas"      value={`${patient.ruangan} / ${patient.kelas.replace("_", " ")}`} />
              <ReadOnly label="LOS"                  value={lamaRawat} />
              <ReadOnly label="Status Kepulangan"    value={data.status || "—"} />
              <ReadOnly label="Tanggal KRS"          value={data.tanggalPulang ? new Date(data.tanggalPulang).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
            </div>
            {/* Asal Masuk — AUTO dari rantai admisi (SPRI → kunjungan asal); fallback manual */}
            <div className="border-t border-slate-100 pt-3">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Asal Masuk <span className="text-red-400">*</span>
              </label>

              {asalDetect?.terdeteksi ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                      Auto
                    </span>
                    <p className="text-xs font-bold text-emerald-800">{rm.asalMasuk || asalDetect.asalMasuk}</p>
                    {asalDetect.noKunjunganAsal && (
                      <span className="font-mono text-[10px] text-emerald-600">{asalDetect.noKunjunganAsal}</span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] leading-snug text-emerald-700">
                    Terdeteksi dari rantai admisi (SPRI → kunjungan asal)
                    {asalDetect.tanggalMasuk && (
                      <> · masuk {new Date(asalDetect.tanggalMasuk).toLocaleString("id-ID", {
                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}</>
                    )}
                  </p>
                  {rm.asalMasuk === "IGD" && (
                    <div className="mt-2 grid grid-cols-2 gap-2 border-t border-emerald-100 pt-2">
                      <ReadOnly label="Tanggal Masuk IGD" value={rm.tanggalMasukIGD} />
                      <ReadOnly label="Diagnosis di IGD"  value={rm.diagnosisIGD} />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Select
                    value={rm.asalMasuk}
                    onChange={v => setMedik("asalMasuk", v as AsalMasuk)}
                    options={ASAL_MASUK_OPTS}
                    placeholder="— Pilih asal masuk —"
                  />

                  <AnimatePresence>
                    {rm.asalMasuk === "IGD" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 grid grid-cols-2 gap-2 overflow-hidden"
                      >
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Tanggal Masuk IGD</label>
                          <DatePicker
                            value={rm.tanggalMasukIGD}
                            onChange={v => setMedik("tanggalMasukIGD", v)}
                            placeholder="Pilih tanggal"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Diagnosis di IGD</label>
                          <input
                            type="text"
                            value={rm.diagnosisIGD}
                            onChange={e => setMedik("diagnosisIGD", e.target.value)}
                            placeholder="Diagnosis saat masuk IGD"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>

          {/* Diagnosa & Tindakan */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader icon={Activity} title="Diagnosa & Tindakan" badge="Auto dari Tab Diagnosa" />
            {hasDiagnosa ? (
              <div className="mb-3 space-y-1.5">
                {diagnosaList.map(d => (
                  <div key={d.id} className="flex items-start gap-2 text-xs">
                    <span className={cn(
                      "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold",
                      d.tipe === "Utama" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500",
                    )}>{d.tipe}</span>
                    <span className="text-slate-700">{d.namaDiagnosis}</span>
                    <span className="shrink-0 font-mono text-[10px] text-slate-400">({d.kodeIcd10})</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <AlertCircle size={13} className="shrink-0 text-amber-500" />
                <p className="text-[11px] text-amber-700">Belum ada diagnosa — isi di tab Diagnosa rekam medis</p>
              </div>
            )}
            {rm.tindakan.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-slate-400">Tindakan / Prosedur ICD-9-CM</p>
                <div className="space-y-1">
                  {rm.tindakan.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">{t.kodeIcd9}</span>
                      <span className="text-slate-700">{t.namaTindakan}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-slate-400">{t.tanggal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TTV Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader icon={Activity} title="TTV Masuk vs Pulang" badge="Auto dari TTV" />
            {isPersisted && (
              <TtvPulangQuickRecord
                kunjunganId={patient.id}
                obsCount={obsMeta.count}
                lastObsAt={obsMeta.lastAt}
                onSaved={(dto) => {
                  // Observasi baru = pengukuran terakhir → jadi TTV pulang (atau masuk bila pertama).
                  if (obsMeta.count === 0) patchMedik({ ttvMasuk: obsToTtv(dto, "Masuk") });
                  else patchMedik({ ttvPulang: obsToTtv(dto, "Pulang") });
                  setObsMeta(m => ({ count: m.count + 1, lastAt: dto.waktuObservasi }));
                }}
              />
            )}
            {rm.ttvMasuk ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-1.5 text-left text-[9px] font-bold uppercase tracking-wide text-slate-400">Parameter</th>
                      <th className="py-1.5 text-center text-[9px] font-bold uppercase tracking-wide text-slate-400">Masuk<br/><span className="text-[8px] font-normal">{rm.ttvMasuk.tanggal}</span></th>
                      <th className="py-1.5 text-center text-[9px] font-bold uppercase tracking-wide text-slate-400">Pulang<br/><span className="text-[8px] font-normal">{rm.ttvPulang?.tanggal ?? "—"}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["TD (mmHg)",  rm.ttvMasuk.tekananDarah,          rm.ttvPulang?.tekananDarah ?? "—"],
                      ["Nadi (×/m)", String(rm.ttvMasuk.nadi),          String(rm.ttvPulang?.nadi ?? "—")],
                      ["RR (×/m)",   String(rm.ttvMasuk.rr),            String(rm.ttvPulang?.rr ?? "—")],
                      ["Suhu (°C)",  String(rm.ttvMasuk.suhu),          String(rm.ttvPulang?.suhu ?? "—")],
                      ["SpO₂ (%)",   String(rm.ttvMasuk.spo2),          String(rm.ttvPulang?.spo2 ?? "—")],
                      ["GCS",        String(rm.ttvMasuk.gcs),           String(rm.ttvPulang?.gcs ?? "—")],
                      ["Kesadaran",  rm.ttvMasuk.kesadaran,             rm.ttvPulang?.kesadaran ?? "—"],
                    ].map(([param, masuk, pulang]) => (
                      <tr key={param} className="border-b border-slate-50">
                        <td className="py-1 text-slate-500">{param}</td>
                        <td className="py-1 text-center font-semibold text-slate-700">{masuk}</td>
                        <td className="py-1 text-center font-semibold text-emerald-600">{pulang}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[11px] italic text-slate-400">Data TTV belum tersedia</p>
            )}
          </div>

          {/* Lab & Rad */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Lab */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <SectionHeader icon={FlaskConical} title="Hasil Lab Abnormal" badge="Auto dari Order Lab" />
              {rm.hasilLabAbnormal.length === 0 ? (
                <p className="text-[11px] italic text-slate-400">Tidak ada hasil lab abnormal</p>
              ) : (
                <div className="space-y-1.5">
                  {rm.hasilLabAbnormal.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold", FLAG_STYLE[l.flag])}>
                        {FLAG_LABEL[l.flag]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-slate-700">{l.nama}</p>
                        <p className="text-[10px] text-slate-400">{l.nilai} {l.satuan} · rujukan {l.rujukan}</p>
                      </div>
                      <span className="shrink-0 text-[9px] text-slate-400">{l.tanggal}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rad */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <SectionHeader icon={Radiation} title="Hasil Radiologi" badge="Auto dari Order Rad" />
              {rm.hasilRad.length === 0 ? (
                <p className="text-[11px] italic text-slate-400">Tidak ada hasil radiologi</p>
              ) : (
                <div className="space-y-2.5">
                  {rm.hasilRad.map((r, i) => (
                    <div key={i}>
                      <p className="text-[11px] font-semibold text-slate-700">{r.jenis}</p>
                      <p className="text-[10px] text-slate-500">{r.tanggal}</p>
                      <p className="mt-0.5 text-[11px] italic text-slate-600">{r.kesimpulan}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Obat Selama Rawat */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader icon={Pill} title="Obat Selama Rawat" badge="Auto dari Order Resep" />
            {rm.obatSelamaRawat.length === 0 ? (
              <p className="text-[11px] italic text-slate-400">Tidak ada data obat</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      {["Nama Obat", "Dosis", "Rute", "Mulai", "Selesai"].map(h => (
                        <th key={h} className="py-1 text-left text-[9px] font-bold uppercase tracking-wide text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rm.obatSelamaRawat.map((o, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-1.5">
                          <span className="font-medium text-slate-700">{o.namaObat}</span>
                          {o.isHAM && (
                            <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[8px] font-bold text-red-700">HAM</span>
                          )}
                        </td>
                        <td className="py-1.5 text-slate-600">{o.dosis}</td>
                        <td className="py-1.5 text-slate-500">{o.rute}</td>
                        <td className="py-1.5 text-slate-400">{o.mulaiTanggal}</td>
                        <td className="py-1.5 text-slate-400">{o.akhirTanggal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Manual DPJP fields */}
          <div className="rounded-xl border border-sky-200 bg-white p-4 shadow-sm">
            <SectionHeader icon={Activity} title="Narasi Klinis (diisi DPJP)" />
            <div className="space-y-3">
              <FormArea
                label="Kondisi Masuk" rows={3}
                value={rm.kondisiMasuk}
                onChange={v => setMedik("kondisiMasuk", v)}
                placeholder="Deskripsi kondisi klinis objektif saat pasien masuk RS (TTV, keluhan utama, temuan fisik bermakna)..."
              />
              <FormArea
                label="Kondisi Pulang" rows={3}
                value={rm.kondisiPulang}
                onChange={v => setMedik("kondisiPulang", v)}
                placeholder="Kondisi klinis saat pasien dipulangkan (TTV, perkembangan keluhan, status fungsional)..."
              />
              <FormArea
                label="Ringkasan Klinis DPJP" rows={5}
                value={rm.ringkasanKlinis}
                onChange={v => setMedik("ringkasanKlinis", v)}
                placeholder="Ringkasan perjalanan klinis selama rawat inap: diagnosis kerja, tindakan, respons terapi, konsultasi, dan rencana tindak lanjut..."
              />
            </div>
          </div>

        </div>

        {/* ── Right: Completion + sign-off ── */}
        <div className="w-full shrink-0 space-y-3 xl:w-64">

          {/* Progress */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Kelengkapan Resume Medik</p>
            <div className="mb-3 flex items-end justify-between">
              <p className={cn("text-2xl font-bold", canPrint ? "text-emerald-600" : "text-sky-600")}>
                {doneCount}/{completions.length}
              </p>
              <p className="text-[10px] text-slate-400">item</p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className={cn("h-full rounded-full", canPrint ? "bg-emerald-400" : "bg-sky-400")}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((doneCount / completions.length) * 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* Tab items */}
            <p className="mb-1.5 mt-3 text-[9px] font-bold uppercase tracking-wide text-slate-400">Dari Tab Lain</p>
            <div className="space-y-1.5">
              {tabItems.map(item => (
                <div key={item.id} className="flex items-start gap-2">
                  {item.done
                    ? <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-emerald-500" />
                    : <Circle       size={11} className="mt-0.5 shrink-0 text-amber-400" />
                  }
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[11px]", item.done ? "text-slate-400 line-through" : "font-semibold text-slate-700")}>
                      {item.label}
                    </p>
                    {!item.done && <p className="text-[9px] text-amber-500">{item.hint}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Form items */}
            <p className="mb-1.5 mt-3 text-[9px] font-bold uppercase tracking-wide text-slate-400">Form Ini</p>
            <div className="space-y-1.5">
              {formItems.map(item => (
                <div key={item.id} className="flex items-start gap-2">
                  {item.done
                    ? <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-emerald-500" />
                    : <Circle       size={11} className="mt-0.5 shrink-0 text-red-300" />
                  }
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[11px]", item.done ? "text-slate-400 line-through" : "font-semibold text-slate-700")}>
                      {item.label}
                    </p>
                    {!item.done && <p className="text-[9px] text-slate-400">{item.hint}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simpan draft (pasien nyata) */}
          {isPersisted && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-[11px] font-bold transition",
                saving
                  ? "cursor-wait border-slate-200 bg-slate-50 text-slate-400"
                  : "border-sky-300 bg-white text-sky-700 hover:bg-sky-50 active:scale-95",
              )}
            >
              <Save size={12} />
              {saving ? "Menyimpan…" : "Simpan Resume (Draft)"}
            </button>
          )}

          {/* DPJP sign-off */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">TTD DPJP (TTE)</p>
            {rm.dpjpApproved ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-emerald-800">Ditandatangani Elektronik</p>
                    <p className="text-[10px] text-emerald-600">{rm.dpjpApprovedAt}</p>
                    {rm.tteToken && (
                      <p className="mt-0.5 truncate font-mono text-[9px] font-semibold text-emerald-700">{rm.tteToken}</p>
                    )}
                    {rm.tteSignedBy && (
                      <p className="text-[9px] text-emerald-600">oleh {rm.tteSignedBy}</p>
                    )}
                  </div>
                </div>
                {isPersisted && (
                  <p className="mt-2 border-t border-emerald-100 pt-1.5 text-[9px] text-emerald-600/80">
                    Perubahan isi setelah TTD membuat revisi baru — perlu simpan &amp; tanda tangan ulang.
                  </p>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={handleApprove}
                  disabled={!prereqSign || signing || !canSignRole}
                  className={cn(
                    "w-full rounded-xl py-2.5 text-[11px] font-bold transition",
                    prereqSign && !signing && canSignRole
                      ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-95"
                      : "cursor-not-allowed bg-slate-100 text-slate-400",
                  )}
                >
                  {signing
                    ? "Menandatangani…"
                    : prereqSign
                      ? "Tandatangani Resume Medik"
                      : "Lengkapi data terlebih dahulu"
                  }
                </button>
                {!canSignRole && (
                  <p className="mt-1.5 text-center text-[9px] text-amber-600">
                    Tanda tangan hanya oleh DPJP (Dokter)
                  </p>
                )}
              </>
            )}
          </div>

          {/* Print */}
          <button
            onClick={() => setShowPrint(true)}
            disabled={!canPrint}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition",
              canPrint
                ? "bg-sky-600 text-white shadow-md shadow-sky-200 hover:bg-sky-700 active:scale-95"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            {canPrint ? (
              <><Printer size={14} /> Cetak Resume Medik</>
            ) : (
              <><Lock size={13} /> {completions.length - doneCount} item belum lengkap</>
            )}
          </button>

          {!canPrint && (
            <p className="text-center text-[10px] text-slate-400">
              Lengkapi semua item untuk mengaktifkan cetak
            </p>
          )}

          {/* Info */}
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
            <p className="text-[10px] font-semibold text-sky-700">Dokumen Klaim BPJS</p>
            <p className="mt-1 text-[10px] text-sky-600">
              Resume Medik digunakan sebagai kelengkapan berkas klaim. Cetakan memuat QR
              tanda tangan elektronik (TTE) DPJP. Pastikan diagnosa ICD-10 dan tindakan
              ICD-9 lengkap sebelum pengajuan klaim.
            </p>
          </div>

        </div>
      </div>

      {/* Cetak A4 + QR TTE */}
      <ResumeMedikCetakModal
        open={showPrint}
        onClose={() => setShowPrint(false)}
        data={data}
        patient={patient}
        diagnosa={diagnosaList}
        tte={tteInfo}
      />
    </>
  );
}
