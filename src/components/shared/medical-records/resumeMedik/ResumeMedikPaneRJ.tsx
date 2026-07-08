"use client";

// Resume Medik (Rawat Jalan) — memakai infra SHARED yang sama dengan RI: agregat klinis dari DB
// (resumeMedikAggregates — Observation/Diagnosa/Tindakan/Resep/Lab/Rad), narasi manual persist ke
// medicalrecord.ResumeMedik (append latest-wins, endpoint unit-agnostic /kunjungan/:id/resume-medik),
// TTE dokter (POST /resume-medik/sign, Dokter-only) → QR pada cetak A4 (ResumeMedikCetak konteks "rj").
// Pasien demo (non-UUID): lokal saja.

import { useEffect, useRef, useState } from "react";
import {
  Activity, AlertCircle, CheckCircle2, FlaskConical, Pill, Printer, Radiation, Save, ShieldCheck, Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import type { IGDDiagnosa } from "@/lib/data";
import { tteSerial } from "@/components/shared/TteQr";
import {
  getResumeMedik, saveResumeMedik, signResumeMedik, type ResumeMedikInput,
} from "@/lib/api/resumeMedik/resumeMedik";
import { getAnamnesis, type AnamnesisDTO } from "@/lib/api/asesmenMedis/anamnesis";
import { fetchResumeAggregates, fmtSignedAt } from "./resumeMedikAggregates";
import ResumeMedikCetakModal, {
  type ResumeMedikPrintModel, type ResumeMedikTte,
} from "./ResumeMedikCetak";
import type { ResumeMedikData, TVVSummaryItem } from "./resumeMedikTypes";
import type { SuratPatient } from "../suratDokumen/suratDokumenShared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function emptyResume(): ResumeMedikData {
  return {
    asalMasuk: "", tanggalMasukIGD: "", diagnosisIGD: "",
    ttvMasuk: null, ttvPulang: null, hasilLabAbnormal: [], hasilRad: [],
    obatSelamaRawat: [], tindakan: [],
    kondisiMasuk: "", kondisiPulang: "", ringkasanKlinis: "",
    dpjpApproved: false, dpjpApprovedAt: "", tteToken: null, tteSignedBy: null,
  };
}

function ttvSnap(t: TVVSummaryItem | null) {
  if (!t) return null;
  return {
    tanggal: t.tanggal, tekananDarah: t.tekananDarah, nadi: t.nadi, rr: t.rr,
    suhu: t.suhu, spo2: t.spo2, gcs: t.gcs, kesadaran: t.kesadaran,
  };
}

function fmtTgl(v?: string): string {
  if (!v) return "—";
  const d = new Date(/^\d{4}-\d{2}-\d{2}/.test(v) ? `${v.slice(0, 10)}T00:00:00` : v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// Anamnesis → narasi "Kondisi Saat Datang" (Keluhan Utama + RPS + onset/faktor bila ada).
function anamnesisToNarrative(a: AnamnesisDTO): string {
  const parts: string[] = [];
  if (a.keluhanUtama) parts.push(`Keluhan Utama: ${a.keluhanUtama}`);
  if (a.rps) parts.push(`Riwayat Penyakit Sekarang: ${a.rps}`);
  const extra: string[] = [];
  if (a.onsetDurasi) extra.push(`Onset/durasi: ${a.onsetDurasi}`);
  if (a.faktorPemberat) extra.push(`Faktor memperberat: ${a.faktorPemberat}`);
  if (a.faktorPeringan) extra.push(`Faktor memperingan: ${a.faktorPeringan}`);
  if (extra.length) parts.push(extra.join(" · "));
  return parts.join("\n");
}

// ── UI helpers ────────────────────────────────────────────
function StatChip({ icon: Icon, label, n }: { icon: IconComponent; label: string; n: number }) {
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-xl border px-3 py-2",
      n > 0 ? "border-sky-100 bg-sky-50/60" : "border-slate-100 bg-slate-50",
    )}>
      <Icon size={14} className={n > 0 ? "text-sky-500" : "text-slate-300"} />
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className={cn("text-sm font-bold", n > 0 ? "text-slate-800" : "text-slate-400")}>{n}</p>
      </div>
    </div>
  );
}

function FormArea({ label, value, onChange, placeholder, rows = 3, badge }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; badge?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</label>
        {badge}
      </div>
      <textarea
        value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function ResumeMedikPaneRJ({ patient }: { patient: SuratPatient }) {
  const { session } = useSession();
  const kunjunganId = patient.kunjunganId ?? "";
  const isPersisted = UUID_RE.test(kunjunganId);
  const canSign = !isPersisted ||
    (!!session && (session.isSuperuser || session.isGlobal || session.roles.includes("Dokter")));

  const [rm, setRm] = useState<ResumeMedikData>(emptyResume);
  const [diagnosaDb, setDiagnosaDb] = useState<IGDDiagnosa[]>([]);
  const [anamnesisPrefill, setAnamnesisPrefill] = useState("");
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  const rmRef = useRef(rm);
  useEffect(() => { rmRef.current = rm; });

  // Hydrate (pasien nyata): agregat DB + revisi resume terkini.
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    (async () => {
      try {
        const [agg, dto, anam] = await Promise.all([
          fetchResumeAggregates(kunjunganId, ac.signal),
          getResumeMedik(kunjunganId, ac.signal).catch(() => null),
          getAnamnesis(kunjunganId, ac.signal).catch(() => null),
        ]);
        if (ac.signal.aborted) return;
        setDiagnosaDb(agg.diagnosa);
        const prefill = anam ? anamnesisToNarrative(anam) : "";
        setAnamnesisPrefill(prefill);
        setRm(prev => ({
          ...prev,
          ttvMasuk: agg.ttvMasuk, ttvPulang: agg.ttvPulang,
          hasilLabAbnormal: agg.hasilLabAbnormal, hasilRad: agg.hasilRad,
          obatSelamaRawat: agg.obatSelamaRawat, tindakan: agg.tindakan,
          // Narasi tersimpan resume MENANG; "Kondisi Saat Datang" kosong → autofill dari Anamnesis
          // (Keluhan Utama + RPS). DPJP tetap bisa mengedit sebelum simpan.
          kondisiMasuk: dto?.kondisiMasuk || prefill || "",
          kondisiPulang: dto?.kondisiPulang ?? prev.kondisiPulang,
          ringkasanKlinis: dto?.ringkasanKlinis ?? prev.ringkasanKlinis,
          ...(dto ? {
            dpjpApproved: !!dto.tteSignedAt,
            dpjpApprovedAt: dto.tteSignedAt ? fmtSignedAt(dto.tteSignedAt) : "",
            tteToken: dto.tteToken, tteSignedBy: dto.tteSignedBy,
          } : {}),
        }));
      } catch { /* agregat gagal → panel tetap tampil */ }
    })();
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  function setField<K extends keyof ResumeMedikData>(key: K, val: ResumeMedikData[K]) {
    setRm(prev => ({ ...prev, [key]: val }));
  }

  function buildInput(): ResumeMedikInput {
    const cur = rmRef.current;
    return {
      asalMasuk: "", tanggalMasukIgd: "", diagnosisIgd: "",
      kondisiMasuk: cur.kondisiMasuk, kondisiPulang: cur.kondisiPulang, ringkasanKlinis: cur.ringkasanKlinis,
      dataKlinis: {
        ttvMasuk: ttvSnap(cur.ttvMasuk), ttvPulang: ttvSnap(cur.ttvPulang),
        hasilLabAbnormal: cur.hasilLabAbnormal, hasilRad: cur.hasilRad,
        obatSelamaRawat: cur.obatSelamaRawat, tindakan: cur.tindakan,
      },
    };
  }

  async function handleSave() {
    if (!isPersisted) { toast.info("Mode demo", "Resume pasien contoh tidak dipersist."); return; }
    if (saving) return;
    setSaving(true);
    try {
      const dto = await saveResumeMedik(kunjunganId, buildInput());
      // Revisi baru → TTE di-reset (wajib tanda tangan ulang).
      setRm(prev => ({ ...prev, dpjpApproved: false, dpjpApprovedAt: "", tteToken: dto.tteToken, tteSignedBy: dto.tteSignedBy }));
      toast.success("Resume medik tersimpan", `Pencatat: ${dto.pencatat}`);
    } catch (e) {
      toast.error("Gagal menyimpan resume medik", e instanceof ApiError ? e.message : undefined);
    } finally { setSaving(false); }
  }

  async function handleSign() {
    if (!isPersisted) {
      const now = new Date().toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
      setRm(prev => ({ ...prev, dpjpApproved: true, dpjpApprovedAt: now }));
      return;
    }
    if (signing) return;
    setSigning(true);
    try {
      await saveResumeMedik(kunjunganId, buildInput()); // pastikan konten TERKINI yang ditandatangani
      const dto = await signResumeMedik(kunjunganId);
      setRm(prev => ({
        ...prev, dpjpApproved: true,
        dpjpApprovedAt: dto.tteSignedAt ? fmtSignedAt(dto.tteSignedAt) : "",
        tteToken: dto.tteToken, tteSignedBy: dto.tteSignedBy,
      }));
      toast.success("Resume medik ditandatangani", dto.tteToken ?? undefined);
    } catch (e) {
      toast.error("Gagal menandatangani", e instanceof ApiError ? e.message : undefined);
    } finally { setSigning(false); }
  }

  const diagnosaList: IGDDiagnosa[] = isPersisted
    ? diagnosaDb
    : (patient.diagnosa ? [{ id: "d0", kodeIcd10: "", namaDiagnosis: patient.diagnosa, tipe: "Utama" }] : []);

  const tteInfo: ResumeMedikTte | null = rm.dpjpApproved
    ? {
        serial: rm.tteToken || tteSerial(`${patient.noRM}|${rm.dpjpApprovedAt}`, "TTE-RSM"),
        signedBy: rm.tteSignedBy || patient.dokter,
        signedAt: rm.dpjpApprovedAt,
      }
    : null;

  const printModel: ResumeMedikPrintModel = {
    konteks: "rj",
    pasien: {
      nama: patient.name, noRM: patient.noRM, umur: `${patient.age} tahun`, gender: patient.gender,
      penjamin: (patient.penjamin ?? "Umum").replace(/_/g, " "),
      tanggalLahir: patient.tanggalLahir || undefined,
    },
    periodeTitle: "Data Kunjungan",
    periodeRows: [
      { label: "Tanggal Kunjungan", value: fmtTgl(patient.tanggalKunjungan) },
      { label: "Poliklinik", value: patient.poli ? `Poliklinik ${patient.poli}` : "Poliklinik" },
      { label: "Dokter Pemeriksa", value: patient.dokter },
      { label: "Penjamin", value: (patient.penjamin ?? "Umum").replace(/_/g, " ") },
    ],
    rm,
    diagnosa: diagnosaList,
    noKunjungan: "",
    dpjp: patient.dokter,
    tte: tteInfo,
  };

  const ttv = rm.ttvMasuk;

  return (
    <>
      <div className="flex flex-col gap-4">

        {/* Identitas & kunjungan */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="mb-3 flex items-center gap-2">
            <Stethoscope size={13} className="text-sky-500" />
            <p className="text-sm font-semibold text-slate-700">Resume Medik Rawat Jalan</p>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-600">Auto</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] sm:grid-cols-4">
            {[
              ["Pasien", patient.name],
              ["No. RM", patient.noRM],
              ["Poliklinik", patient.poli || "—"],
              ["Dokter", patient.dokter],
              ["Tanggal Kunjungan", fmtTgl(patient.tanggalKunjungan)],
              ["Penjamin", (patient.penjamin ?? "Umum").replace(/_/g, " ")],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{k}</p>
                <p className="font-medium text-slate-700">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Data klinis terkumpul (agregat DB) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="mb-3 flex items-center gap-2">
            <Activity size={13} className="text-slate-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data Klinis Terkumpul</p>
            {!isPersisted && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-amber-600">Demo</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <StatChip icon={Stethoscope} label="Diagnosa" n={diagnosaList.length} />
            <StatChip icon={Activity} label="Tindakan" n={rm.tindakan.length} />
            <StatChip icon={Pill} label="Obat" n={rm.obatSelamaRawat.length} />
            <StatChip icon={FlaskConical} label="Lab Abnormal" n={rm.hasilLabAbnormal.length} />
            <StatChip icon={Radiation} label="Radiologi" n={rm.hasilRad.length} />
          </div>

          {ttv && (
            <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">TTV Kunjungan · {ttv.tanggal}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-700">
                <span>TD <b>{ttv.tekananDarah}</b></span>
                <span>Nadi <b>{ttv.nadi}</b></span>
                <span>RR <b>{ttv.rr}</b></span>
                <span>Suhu <b>{ttv.suhu}°C</b></span>
                <span>SpO₂ <b>{ttv.spo2}%</b></span>
                <span>GCS <b>{ttv.gcs}</b></span>
                <span>{ttv.kesadaran}</span>
              </div>
            </div>
          )}

          {diagnosaList.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {diagnosaList.map(d => (
                <span key={d.id} className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-medium ring-1",
                  d.tipe === "Utama" ? "bg-sky-50 text-sky-700 ring-sky-200" : "bg-slate-50 text-slate-600 ring-slate-200",
                )}>
                  {d.kodeIcd10 && <span className="font-mono">{d.kodeIcd10} </span>}{d.namaDiagnosis}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Narasi dokter */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="mb-3 flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Narasi Klinis — Diisi Dokter</p>
          </div>
          <div className="flex flex-col gap-3">
            <FormArea
              label="Kondisi Saat Datang" value={rm.kondisiMasuk} onChange={v => setField("kondisiMasuk", v)}
              rows={4} placeholder="Keluhan & kondisi pasien saat datang ke poliklinik…"
              badge={!!anamnesisPrefill && rm.kondisiMasuk === anamnesisPrefill
                ? <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-indigo-600">Autofill · Anamnesis</span>
                : undefined}
            />
            <FormArea label="Kondisi Saat Pulang" value={rm.kondisiPulang} onChange={v => setField("kondisiPulang", v)} placeholder="Kondisi pasien setelah pemeriksaan / tindakan…" />
            <FormArea label="Ringkasan Klinis / Anjuran" value={rm.ringkasanKlinis} onChange={v => setField("ringkasanKlinis", v)} rows={4} placeholder="Ringkasan pemeriksaan, terapi, edukasi, dan anjuran tindak lanjut…" />
          </div>
        </div>

        {/* Status TTE + aksi */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="flex items-center gap-2 text-[11px]">
            {rm.dpjpApproved ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700">
                <CheckCircle2 size={12} /> Ditandatangani · {rm.dpjpApprovedAt}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">
                <AlertCircle size={12} /> Belum ditandatangani
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button" onClick={handleSave} disabled={saving || !isPersisted}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save size={12} /> {saving ? "Menyimpan…" : "Simpan"}
            </button>
            <button
              type="button" onClick={handleSign} disabled={signing || !canSign}
              title={!canSign ? "Hanya Dokter yang dapat menandatangani" : undefined}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShieldCheck size={12} /> {signing ? "Menandatangani…" : rm.dpjpApproved ? "Tandatangani Ulang" : "Tandatangani (TTE)"}
            </button>
            <button
              type="button" onClick={() => setShowPrint(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-sky-700"
            >
              <Printer size={12} /> Cetak
            </button>
          </div>
        </div>
      </div>

      <ResumeMedikCetakModal open={showPrint} onClose={() => setShowPrint(false)} model={printModel} />
    </>
  );
}
