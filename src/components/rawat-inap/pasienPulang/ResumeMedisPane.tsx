"use client";

// Resume Pulang Pane — tab Pasien Pulang RI, sub Resume Pulang (salinan discharge summary
// untuk PASIEN, PMK 24/2022). Pasien NYATA (kunjungan UUID): 4 narasi autofill dari domain
// klinis (anamnesis · lab/rad · resep/tindakan · TTV pulang) → DPJP suntingan; persist
// medicalrecord.ResumePulang (append latest-wins); TTD DPJP = TTE server (Dokter-only) → QR
// pada cetakan A4. Pasien demo: mock lokal (perilaku lama).

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle, CheckCircle2, Circle, Lock, Printer, Save, ShieldCheck, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RawatInapPatientDetail, IGDDiagnosa } from "@/lib/data";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/contexts/SessionContext";
import { tteSerial } from "@/components/shared/TteQr";
import {
  getResumePulang, saveResumePulang, signResumePulang, type ResumePulangInput,
} from "@/lib/api/resumePulang/resumePulang";
import { getAnamnesis } from "@/lib/api/asesmenMedis/anamnesis";
import { getDisposisi } from "@/lib/api/disposisi/disposisi";
import { fetchResumeAggregates, fmtSignedAt } from "@/components/shared/medical-records/resumeMedik/resumeMedikAggregates";
import { composeResumePulangSuggestion, type ResumePulangSuggestion } from "./resumePulangAutofill";
import {
  type PasienPulangData, type ResumeMedisRI,
  checkResumeCompletion,
} from "./pasienPulangShared";
import ResumePulangCetakModal, { type ResumePulangTte } from "./ResumePulangCetak";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  data:     PasienPulangData;
  onChange: (d: PasienPulangData) => void;
  patient:  RawatInapPatientDetail;
};

// Field yang bisa di-autofill (kunci ResumeMedisRI).
const AUTOFILL_KEYS = ["ringkasanAnamnesis", "hasilPemeriksaan", "terapiDiberikan", "kondisiSaatPulang"] as const;

function FormArea({
  label, value, onChange, rows = 3, required, placeholder, autoFilled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  rows?: number; required?: boolean; placeholder?: string; autoFilled?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {autoFilled && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-600">
            <Sparkles size={8} /> Auto
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</label>
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
        {value || <span className="italic text-slate-400">—</span>}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function ResumeMedisPane({ data, onChange, patient }: Props) {
  const isPersisted = UUID_RE.test(patient.id);
  const { session } = useSession();
  const canSignRole = !isPersisted ||
    (!!session && (session.isSuperuser || session.isGlobal || session.roles.includes("Dokter")));

  const [showPrint,  setShowPrint]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [signing,    setSigning]    = useState(false);
  const [diagnosaDb, setDiagnosaDb] = useState<IGDDiagnosa[]>([]);
  // Saran autofill terkini (untuk tombol "Isi Otomatis" + badge field).
  const [suggestion, setSuggestion] = useState<ResumePulangSuggestion | null>(null);

  // Ref data terkini — patch async tidak menimpa ketikan user antar-render.
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; });

  // ── Hydrate (pasien nyata): saved resume-pulang + saran autofill + status/obat/diagnosa ──
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    (async () => {
      try {
        const [agg, saved, anamnesis, disposisi] = await Promise.all([
          fetchResumeAggregates(patient.id, ac.signal),
          getResumePulang(patient.id, ac.signal).catch(() => null),
          getAnamnesis(patient.id, ac.signal).catch(() => null),
          getDisposisi(patient.id, ac.signal).catch(() => null),
        ]);
        if (ac.signal.aborted) return;
        setDiagnosaDb(agg.diagnosa);
        const sug = composeResumePulangSuggestion(agg, anamnesis, disposisi);
        setSuggestion(sug);

        const cur = dataRef.current;
        const rp = { ...cur.resumePulang };
        if (saved) {
          rp.ringkasanAnamnesis  = saved.ringkasanAnamnesis;
          rp.hasilPemeriksaan    = saved.hasilPemeriksaan;
          rp.terapiDiberikan     = saved.terapiDiberikan;
          rp.kondisiSaatPulang   = saved.kondisiSaatPulang;
          rp.instruksiPulang     = saved.instruksiPulang;
          rp.pembatasanAktivitas = saved.pembatasanAktivitas;
          rp.dietPulang          = saved.dietPulang;
          rp.tandaTanganPasien   = saved.tandaTanganPasien;
          rp.dpjpApproved        = !!saved.tteSignedAt;
          rp.dpjpApprovedAt      = saved.tteSignedAt ? fmtSignedAt(saved.tteSignedAt) : "";
          rp.tteToken            = saved.tteToken;
          rp.tteSignedBy         = saved.tteSignedBy;
        }
        // Prefill autofill fields yang KOSONG (saved / ketikan menang).
        for (const k of AUTOFILL_KEYS) {
          if (!rp[k].trim() && sug[k].trim()) rp[k] = sug[k];
        }

        // Root: status + tanggal/jam pulang (disposisi) + obat pulang (agg).
        const rootPatch: Partial<PasienPulangData> = { obatPulang: agg.obatPulang };
        if (disposisi) {
          const d = new Date(disposisi.waktuKeluar);
          if (!Number.isNaN(d.getTime())) {
            const p = (n: number) => String(n).padStart(2, "0");
            if (!cur.tanggalPulang) rootPatch.tanggalPulang = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
            if (!cur.jamPulang) rootPatch.jamPulang = `${p(d.getHours())}:${p(d.getMinutes())}`;
          }
          if (!cur.status) {
            const map: Record<string, PasienPulangData["status"]> = {
              Pulang: "Pulang Atas Saran Dokter", APS: "APS", Rujuk: "Dirujuk RS Lain", Meninggal: "Meninggal",
            };
            const s = map[disposisi.jenis];
            if (s) rootPatch.status = s;
          }
        }
        onChange({ ...cur, ...rootPatch, resumePulang: rp });
      } catch { /* gagal → panel tetap tampil kosong */ }
    })();
    return () => ac.abort();
    // dataRef stabil; deps cukup identitas kunjungan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPersisted, patient.id]);

  function setResume<K extends keyof ResumeMedisRI>(key: K, val: ResumeMedisRI[K]) {
    onChange({ ...data, resumePulang: { ...data.resumePulang, [key]: val } });
  }

  const rp = data.resumePulang;

  // Isi Otomatis: timpa 4 field autofill dengan saran terkini (aksi eksplisit DPJP).
  function handleAutofill() {
    if (!suggestion) return;
    const cur = dataRef.current;
    const next = { ...cur.resumePulang };
    let filled = 0;
    for (const k of AUTOFILL_KEYS) {
      if (suggestion[k].trim()) { next[k] = suggestion[k]; filled++; }
    }
    onChange({ ...cur, resumePulang: next });
    toast.success("Terisi dari rekam medis", `${filled} bagian narasi diisi otomatis`);
  }

  function buildInput(): ResumePulangInput {
    return {
      ringkasanAnamnesis: rp.ringkasanAnamnesis,
      hasilPemeriksaan: rp.hasilPemeriksaan,
      terapiDiberikan: rp.terapiDiberikan,
      kondisiSaatPulang: rp.kondisiSaatPulang,
      instruksiPulang: rp.instruksiPulang,
      pembatasanAktivitas: rp.pembatasanAktivitas,
      dietPulang: rp.dietPulang,
      tandaTanganPasien: rp.tandaTanganPasien,
    };
  }

  async function handleSave() {
    if (!isPersisted || saving) return;
    setSaving(true);
    try {
      const dto = await saveResumePulang(patient.id, buildInput());
      const cur = dataRef.current;
      onChange({ ...cur, resumePulang: { ...cur.resumePulang,
        dpjpApproved: false, dpjpApprovedAt: "", tteToken: dto.tteToken, tteSignedBy: dto.tteSignedBy } });
      toast.success("Resume pulang tersimpan", `Pencatat: ${dto.pencatat}`);
    } catch (e) {
      toast.error("Gagal menyimpan resume pulang", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!isPersisted) {
      const now = new Date().toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
      onChange({ ...data, resumePulang: { ...data.resumePulang, dpjpApproved: true, dpjpApprovedAt: now } });
      return;
    }
    if (signing) return;
    setSigning(true);
    try {
      await saveResumePulang(patient.id, buildInput()); // pastikan konten terkini yang ditandatangani
      const dto = await signResumePulang(patient.id);
      const cur = dataRef.current;
      onChange({ ...cur, resumePulang: { ...cur.resumePulang,
        dpjpApproved: true,
        dpjpApprovedAt: dto.tteSignedAt ? fmtSignedAt(dto.tteSignedAt) : "",
        tteToken: dto.tteToken, tteSignedBy: dto.tteSignedBy } });
      toast.success("Resume pulang ditandatangani", dto.tteToken ?? undefined);
    } catch (e) {
      toast.error("Gagal menandatangani", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSigning(false);
    }
  }

  const diagnosaList = isPersisted ? diagnosaDb : patient.diagnosa;
  const hasDiagnosa  = diagnosaList.length > 0;
  const completions  = checkResumeCompletion(data, hasDiagnosa);
  const doneCount    = completions.filter(c => c.done).length;
  const canPrint     = completions.every(c => c.done);
  const prereqSign   = completions.filter(c => c.id !== "c7").every(c => c.done);

  // TTE untuk cetakan: serial server (persisted) / derivatif deterministik (demo).
  const tteInfo: ResumePulangTte | null = rp.dpjpApproved
    ? {
        serial: rp.tteToken || tteSerial(`${patient.noRM}|${rp.dpjpApprovedAt}`, "TTE-RSP"),
        signedBy: rp.tteSignedBy || patient.dpjp,
        signedAt: rp.dpjpApprovedAt,
      }
    : null;

  return (
    <>
      <div className="flex flex-col gap-4 xl:flex-row">

        {/* ── Left: Form ── */}
        <div className="min-w-0 flex-1 space-y-4">

          {/* Auto-fill identity */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Identitas (Auto-fill)</p>
            <div className="grid grid-cols-2 gap-2">
              <ReadOnly label="Nama Pasien"       value={patient.name} />
              <ReadOnly label="No. Rekam Medis"   value={patient.noRM} />
              <ReadOnly label="Umur / Jenis Kelamin" value={`${patient.age} tahun / ${patient.gender === "L" ? "Laki-laki" : "Perempuan"}`} />
              <ReadOnly label="Penjamin"          value={patient.penjamin.replace(/_/g, " ")} />
              <ReadOnly label="Tanggal Masuk"     value={patient.tglMasuk} />
              <ReadOnly label="DPJP"              value={patient.dpjp} />
            </div>
          </div>

          {/* Diagnosa auto-fill */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Diagnosa (dari Tab Diagnosa)</p>
            {hasDiagnosa ? (
              <div className="space-y-1.5">
                {diagnosaList.map(d => (
                  <div key={d.id} className="flex items-start gap-2 text-xs">
                    <span className={cn(
                      "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold",
                      d.tipe === "Utama" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500",
                    )}>{d.tipe}</span>
                    <span className="text-slate-700">{d.namaDiagnosis}</span>
                    <span className="shrink-0 font-mono text-[10px] text-slate-400">({d.kodeIcd10})</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <AlertCircle size={13} className="shrink-0 text-amber-500" />
                <p className="text-[11px] text-amber-700">Belum ada diagnosa — isi di tab Diagnosa rekam medis</p>
              </div>
            )}
          </div>

          {/* Autofill banner (pasien nyata) */}
          {isPersisted && suggestion && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="shrink-0 text-emerald-500" />
                <p className="text-[11px] text-emerald-800">
                  Narasi Anamnesis · Penunjang · Terapi · Kondisi Pulang dapat diisi otomatis dari rekam medis.
                </p>
              </div>
              <button
                onClick={handleAutofill}
                className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 active:scale-95"
              >
                Isi Otomatis dari Rekam Medis
              </button>
            </div>
          )}

          {/* Manual sections */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Anamnesis & Pemeriksaan</p>
            <div className="space-y-3">
              <FormArea
                label="Anamnesis Singkat & Pemeriksaan Fisik" rows={4}
                autoFilled={isPersisted && rp.ringkasanAnamnesis.trim().length > 0}
                value={rp.ringkasanAnamnesis}
                onChange={v => setResume("ringkasanAnamnesis", v)}
                placeholder="Keluhan masuk, riwayat singkat, pemeriksaan fisik bermakna saat masuk..."
              />
              <FormArea
                label="Hasil Penunjang Bermakna" rows={3}
                autoFilled={isPersisted && rp.hasilPemeriksaan.trim().length > 0}
                value={rp.hasilPemeriksaan}
                onChange={v => setResume("hasilPemeriksaan", v)}
                placeholder="Lab, radiologi, dan pemeriksaan khusus yang bermakna..."
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Terapi & Kondisi Pulang</p>
            <div className="space-y-3">
              <FormArea
                label="Terapi yang Diberikan" rows={3} required
                autoFilled={isPersisted && rp.terapiDiberikan.trim().length > 0}
                value={rp.terapiDiberikan}
                onChange={v => setResume("terapiDiberikan", v)}
                placeholder="Obat, tindakan, prosedur, konsultasi yang dilakukan selama rawat inap..."
              />
              <FormArea
                label="Kondisi Saat Pulang" rows={3} required
                autoFilled={isPersisted && rp.kondisiSaatPulang.trim().length > 0}
                value={rp.kondisiSaatPulang}
                onChange={v => setResume("kondisiSaatPulang", v)}
                placeholder="Kondisi objektif pasien saat pulang (TTV, keluhan, status fungsional)..."
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Instruksi & Diet</p>
            <div className="space-y-3">
              <FormArea
                label="Instruksi & Anjuran Pulang" rows={4} required
                value={rp.instruksiPulang}
                onChange={v => setResume("instruksiPulang", v)}
                placeholder="Instruksi kepulangan, anjuran, tanda bahaya yang harus segera ke RS..."
              />
              <FormArea
                label="Pembatasan Aktivitas" rows={2}
                value={rp.pembatasanAktivitas}
                onChange={v => setResume("pembatasanAktivitas", v)}
                placeholder="Aktivitas yang diperbolehkan / dibatasi..."
              />
              <FormArea
                label="Diet Pulang" rows={2}
                value={rp.dietPulang}
                onChange={v => setResume("dietPulang", v)}
                placeholder="Anjuran diet di rumah..."
              />
            </div>
          </div>

        </div>

        {/* ── Right: Completion checker ── */}
        <div className="w-full shrink-0 space-y-3 xl:w-64">

          {/* Progress */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Kelengkapan Resume</p>

            <div className="mb-3 flex items-end justify-between">
              <p className={cn("text-2xl font-bold", canPrint ? "text-emerald-600" : "text-amber-600")}>
                {doneCount}/{completions.length}
              </p>
              <p className="text-[10px] text-slate-400">item</p>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className={cn("h-full rounded-full", canPrint ? "bg-emerald-400" : "bg-amber-400")}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((doneCount / completions.length) * 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            <div className="mt-3 space-y-1.5">
              {completions.map(item => (
                <div key={item.id} className="flex items-start gap-2">
                  {item.done
                    ? <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                    : <Circle       size={12} className="mt-0.5 shrink-0 text-red-300" />
                  }
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-[11px]",
                      item.done ? "text-slate-400 line-through" : "font-semibold text-slate-700",
                    )}>
                      {item.label}
                    </p>
                    {!item.done && (
                      <p className="text-[9px] text-slate-400">{item.hint}</p>
                    )}
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
                  : "border-orange-300 bg-white text-orange-700 hover:bg-orange-50 active:scale-95",
              )}
            >
              <Save size={12} />
              {saving ? "Menyimpan…" : "Simpan Resume (Draft)"}
            </button>
          )}

          {/* DPJP sign-off */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">TTD DPJP (TTE)</p>
            {rp.dpjpApproved ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-emerald-800">Ditandatangani Elektronik</p>
                    <p className="text-[10px] text-emerald-600">{rp.dpjpApprovedAt}</p>
                    {rp.tteToken && (
                      <p className="mt-0.5 truncate font-mono text-[9px] font-semibold text-emerald-700">{rp.tteToken}</p>
                    )}
                    {rp.tteSignedBy && <p className="text-[9px] text-emerald-600">oleh {rp.tteSignedBy}</p>}
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
                      ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
                      : "cursor-not-allowed bg-slate-100 text-slate-400",
                  )}
                >
                  {signing ? "Menandatangani…" : prereqSign ? "Tandatangani Resume Pulang" : "Lengkapi data terlebih dahulu"}
                </button>
                {!canSignRole && (
                  <p className="mt-1.5 text-center text-[9px] text-amber-600">Tanda tangan hanya oleh DPJP (Dokter)</p>
                )}
              </>
            )}
          </div>

          {/* Print button */}
          <button
            onClick={() => setShowPrint(true)}
            disabled={!canPrint}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition",
              canPrint
                ? "bg-orange-500 text-white shadow-md shadow-orange-200 hover:bg-orange-600 active:scale-95"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            {canPrint ? (
              <><Printer size={14} /> Cetak Resume Pulang</>
            ) : (
              <><Lock size={13} /> {completions.length - doneCount} item belum lengkap</>
            )}
          </button>

          {!canPrint && (
            <p className="text-center text-[10px] text-slate-400">
              Lengkapi semua item di atas untuk mengaktifkan cetak
            </p>
          )}

          {/* Info */}
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
            <p className="text-[10px] font-semibold text-orange-700">Dokumen Pasien</p>
            <p className="mt-1 text-[10px] text-orange-600">
              Resume Pulang adalah salinan untuk pasien berisi instruksi, obat, dan jadwal kontrol.
              Cetakan memuat QR tanda tangan elektronik (TTE) DPJP. Untuk klaim BPJS gunakan tab Resume Medik.
            </p>
          </div>

        </div>
      </div>

      {/* Cetak A4 + QR TTE */}
      <ResumePulangCetakModal
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
