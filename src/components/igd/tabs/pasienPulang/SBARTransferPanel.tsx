"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, BookOpen, Stethoscope, Navigation2, Check } from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Field, inputCls, textareaCls } from "./pasienPulangShared";

// ── Config ─────────────────────────────────────────────────────

const SBAR_CONFIG = [
  {
    key: "S" as const,
    label: "Situation",
    sub: "Kondisi Saat Ini",
    icon: AlertCircle,
    border: "border-violet-200",
    headBg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-200",
    chipBg: "bg-violet-50",
  },
  {
    key: "B" as const,
    label: "Background",
    sub: "Latar Belakang Klinis",
    icon: BookOpen,
    border: "border-sky-200",
    headBg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-200",
    chipBg: "bg-sky-50",
  },
  {
    key: "A" as const,
    label: "Assessment",
    sub: "Penilaian Klinis",
    icon: Stethoscope,
    border: "border-amber-200",
    headBg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    chipBg: "bg-amber-50",
  },
  {
    key: "R" as const,
    label: "Recommendation",
    sub: "Rekomendasi Transfer",
    icon: Navigation2,
    border: "border-emerald-200",
    headBg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    chipBg: "bg-emerald-50",
  },
] as const;

type SBARKey = typeof SBAR_CONFIG[number]["key"];
type KondisiTransfer = "Stabil" | "Tidak Stabil" | "Kritis";
type KelasRawat = "VIP" | "Kelas 1" | "Kelas 2" | "Kelas 3" | "ICU" | "HCU" | "Isolasi";

const KONDISI_TRANSFER = ["Stabil", "Tidak Stabil", "Kritis"] as const;
const KELAS_RAWAT: KelasRawat[] = ["VIP", "Kelas 1", "Kelas 2", "Kelas 3", "ICU", "HCU", "Isolasi"];
const TRANSPORT_OPTS = ["Brankar", "Kursi Roda", "Jalan Kaki", "Ambulance Internal"] as const;

// ── Sub-components ─────────────────────────────────────────────

function SBARSection({
  sKey,
  complete,
  children,
}: {
  sKey: SBARKey;
  complete: boolean;
  children: React.ReactNode;
}) {
  const c = SBAR_CONFIG.find((x) => x.key === sKey)!;
  const Icon = c.icon;
  return (
    <div className={cn("overflow-hidden rounded-xl border shadow-sm", c.border)}>
      <div className={cn("flex items-center gap-2.5 border-b px-4 py-2.5", c.headBg, c.border)}>
        <motion.span
          animate={complete ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.25 }}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black",
            complete ? "bg-emerald-500 text-white" : cn("bg-white ring-1", c.ring, c.text),
          )}
        >
          {complete ? <Check size={13} /> : sKey}
        </motion.span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-[10px] font-black uppercase tracking-widest", c.text)}>
            {sKey} — {c.label}
          </p>
          <p className={cn("text-[11px] opacity-70", c.text)}>{c.sub}</p>
        </div>
        {complete && (
          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            Lengkap ✓
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 bg-white p-4">{children}</div>
    </div>
  );
}

function VitalChip({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-slate-50 px-2 py-1.5 ring-1 ring-slate-200">
      <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm font-bold tabular-nums text-slate-800">{value}</span>
      <span className="text-[9px] text-slate-400">{unit}</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────

interface Props {
  patient: IGDPatientDetail;
  onConfirmedChange: (v: boolean) => void;
}

export default function SBARTransferPanel({ patient, onConfirmedChange }: Props) {
  const vs = patient.vitalSigns;

  // S — Situation
  const [kondisi, setKondisi] = useState<KondisiTransfer | null>(null);
  const [keluhan, setKeluhan] = useState("");
  const [lamaObs, setLamaObs] = useState("");

  // B — Background
  const [tatalaksana, setTatalaksana] = useState("");
  const [hasilPx, setHasilPx]         = useState("");
  const [alergi, setAlergi]           = useState("Tidak ada");

  // A — Assessment
  const [gcs, setGcs]       = useState(String(vs.gcsEye + vs.gcsVerbal + vs.gcsMotor));
  const [nyeri, setNyeri]   = useState(String(vs.skalaNyeri));
  const [penilaian, setPenilaian] = useState("");

  // R — Recommendation
  const [bangsal, setBangsal]     = useState("");
  const [kelas, setKelas]         = useState<KelasRawat | null>(null);
  const [noBed, setNoBed]         = useState("");
  const [dpjp, setDpjp]           = useState("");
  const [transport, setTransport] = useState("");
  const [pendamping, setPendamping] = useState("");
  const [instruksi, setInstruksi] = useState("");

  // Confirmation
  const [readback, setReadback] = useState(false);

  const sComplete = kondisi !== null && keluhan.trim() !== "";
  const bComplete = tatalaksana.trim() !== "";
  const aComplete = penilaian.trim() !== "";
  const rComplete = bangsal.trim() !== "" && dpjp.trim() !== "" && kelas !== null;
  const allComplete = sComplete && bComplete && aComplete && rComplete;
  const completedCount = [sComplete, bComplete, aComplete, rComplete].filter(Boolean).length;

  // Auto-uncheck readback if any required section becomes incomplete
  useEffect(() => {
    if (!allComplete && readback) {
      setReadback(false);
      onConfirmedChange(false);
    }
  }, [allComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleReadback = () => {
    const next = !readback;
    setReadback(next);
    onConfirmedChange(next);
  };

  const kondisiCls = (k: KondisiTransfer) =>
    k === "Stabil"
      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
      : k === "Tidak Stabil"
      ? "border-amber-400 bg-amber-50 text-amber-700"
      : "border-rose-500 bg-rose-50 text-rose-700";

  const completionMap: Record<SBARKey, boolean> = {
    S: sComplete,
    B: bComplete,
    A: aComplete,
    R: rComplete,
  };

  return (
    <div className="flex flex-col gap-4">

      {/* ── Progress tracker ── */}
      <div className="overflow-hidden rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-violet-700">SBAR Transfer — IGD → Rawat Inap</p>
          <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
            {completedCount}/4 seksi · SKP 2
          </span>
        </div>
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-violet-100">
          <motion.div
            className="h-full rounded-full bg-violet-500"
            animate={{ width: `${(completedCount / 4) * 100}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {SBAR_CONFIG.map((cfg) => {
            const done = completionMap[cfg.key];
            return (
              <div
                key={cfg.key}
                className={cn(
                  "flex flex-col items-center rounded-lg py-1.5 transition-colors",
                  done ? "bg-emerald-100" : cfg.chipBg,
                )}
              >
                <span className={cn("text-[11px] font-black", done ? "text-emerald-700" : cfg.text)}>
                  {cfg.key}
                </span>
                <span
                  className={cn(
                    "hidden text-[9px] font-medium sm:block",
                    done ? "text-emerald-600" : cfg.text,
                  )}
                >
                  {done ? "Lengkap" : cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── S — Situation ── */}
      <SBARSection sKey="S" complete={sComplete}>
        <Field label="Kondisi Saat Transfer" required>
          <div className="flex flex-wrap gap-1.5">
            {KONDISI_TRANSFER.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKondisi(k)}
                className={cn(
                  "rounded-lg border px-4 py-1.5 text-xs font-medium transition",
                  kondisi === k
                    ? kondisiCls(k)
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                {k}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Keluhan Utama / Masalah Klinis Saat Ini" required>
          <textarea
            value={keluhan}
            onChange={(e) => setKeluhan(e.target.value)}
            rows={2}
            placeholder="Sesak napas progresif, saturasi menurun hingga 88%, takikardi 118×/mnt, edema tungkai bilateral..."
            className={textareaCls}
          />
        </Field>
        <Field label="Lama Observasi di IGD">
          <input
            value={lamaObs}
            onChange={(e) => setLamaObs(e.target.value)}
            placeholder="Contoh: 3 jam 45 menit"
            className={inputCls}
          />
        </Field>
      </SBARSection>

      {/* ── B — Background ── */}
      <SBARSection sKey="B" complete={bComplete}>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Diagnosa Kerja
          </p>
          <div className="flex flex-wrap gap-1.5">
            {patient.diagnosa.map((d) => (
              <span
                key={d.id}
                className="rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-200"
              >
                {d.kodeIcd10} · {d.namaDiagnosis}
              </span>
            ))}
          </div>
        </div>
        <Field label="Tatalaksana yang Sudah Diberikan di IGD" required>
          <textarea
            value={tatalaksana}
            onChange={(e) => setTatalaksana(e.target.value)}
            rows={3}
            placeholder="IVFD RL 500cc/jam, O₂ masker NRM 8 L/mnt, Furosemide 40mg IV sudah diberikan, loading Aspirin 320mg, monitor EKG terpasang..."
            className={textareaCls}
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Hasil Pemeriksaan Relevan (Lab / Radiologi)">
            <textarea
              value={hasilPx}
              onChange={(e) => setHasilPx(e.target.value)}
              rows={2}
              placeholder="Hb 8.2 g/dL, Troponin I 2.4 ng/mL ↑, BNP 820 pg/mL ↑, Foto Thorax: kardiomegali + kongesti..."
              className={textareaCls}
            />
          </Field>
          <Field label="Riwayat Alergi">
            <textarea
              value={alergi}
              onChange={(e) => setAlergi(e.target.value)}
              rows={2}
              className={textareaCls}
            />
          </Field>
        </div>
      </SBARSection>

      {/* ── A — Assessment ── */}
      <SBARSection sKey="A" complete={aComplete}>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Tanda Vital Terakhir (auto dari TTV)
          </p>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
            <VitalChip label="TD" value={`${vs.tdSistolik}/${vs.tdDiastolik}`} unit="mmHg" />
            <VitalChip label="Nadi" value={vs.nadi} unit="×/mnt" />
            <VitalChip label="RR" value={vs.respirasi} unit="×/mnt" />
            <VitalChip label="Suhu" value={vs.suhu} unit="°C" />
            <VitalChip label="SpO₂" value={vs.spo2} unit="%" />
            <div className="flex flex-col items-center rounded-lg bg-slate-50 px-2 py-1.5 ring-1 ring-slate-200">
              <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">GCS</span>
              <input
                value={gcs}
                onChange={(e) => setGcs(e.target.value)}
                className="w-full bg-transparent text-center text-sm font-bold tabular-nums text-slate-800 outline-none"
              />
              <span className="text-[9px] text-slate-400">/15</span>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-slate-50 px-2 py-1.5 ring-1 ring-slate-200">
              <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">NRS</span>
              <input
                value={nyeri}
                onChange={(e) => setNyeri(e.target.value)}
                className="w-full bg-transparent text-center text-sm font-bold tabular-nums text-slate-800 outline-none"
              />
              <span className="text-[9px] text-slate-400">/10</span>
            </div>
          </div>
        </div>
        <Field label="Penilaian Klinis Dokter" required>
          <textarea
            value={penilaian}
            onChange={(e) => setPenilaian(e.target.value)}
            rows={2}
            placeholder="Pasien dengan GJK NYHA III eksaserbasi akut, respon awal terhadap diuretik baik, hemodinamik membaik namun masih perlu monitoring ketat..."
            className={textareaCls}
          />
        </Field>
      </SBARSection>

      {/* ── R — Recommendation ── */}
      <SBARSection sKey="R" complete={rComplete}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ruang / Bangsal Tujuan" required>
            <input
              value={bangsal}
              onChange={(e) => setBangsal(e.target.value)}
              placeholder="Contoh: Ruang Bougenville"
              className={inputCls}
            />
          </Field>
          <Field label="Nomor Tempat Tidur">
            <input
              value={noBed}
              onChange={(e) => setNoBed(e.target.value)}
              placeholder="Contoh: 305-B"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Kelas Perawatan" required>
          <div className="flex flex-wrap gap-1.5">
            {KELAS_RAWAT.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKelas(k)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                  kelas === k
                    ? "border-violet-400 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                {k}
              </button>
            ))}
          </div>
        </Field>
        <Field label="DPJP Rawat Inap Penerima" required>
          <input
            value={dpjp}
            onChange={(e) => setDpjp(e.target.value)}
            placeholder="Nama dokter DPJP yang menerima"
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Transportasi Internal">
            <select
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              className={inputCls}
            >
              <option value="">Pilih...</option>
              {TRANSPORT_OPTS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Nakes Pendamping">
            <input
              value={pendamping}
              onChange={(e) => setPendamping(e.target.value)}
              placeholder="Nama perawat / dokter jaga"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Instruksi Khusus untuk Tim Rawat Inap">
          <textarea
            value={instruksi}
            onChange={(e) => setInstruksi(e.target.value)}
            rows={2}
            placeholder="Monitor ketat tanda vital tiap 1 jam, restriksi cairan 1000cc/hari, posisi head-up 30°, lanjutkan Furosemide drip..."
            className={textareaCls}
          />
        </Field>
      </SBARSection>

      {/* ── Confirmation read-back ── */}
      <button
        type="button"
        onClick={toggleReadback}
        disabled={!allComplete}
        className={cn(
          "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition",
          !allComplete && "cursor-not-allowed opacity-50",
          readback
            ? "border-emerald-400 bg-emerald-50"
            : "border-slate-200 bg-white hover:border-violet-300",
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
            readback
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-300 bg-white",
          )}
        >
          {readback && <Check size={10} />}
        </span>
        <div>
          <p
            className={cn(
              "text-xs font-semibold",
              readback ? "text-emerald-800" : "text-slate-700",
            )}
          >
            Konfirmasi Read-Back — Verifikasi SBAR (SKP 2)
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {allComplete
              ? "Bangsal telah dikonfirmasi dan siap menerima pasien. Semua informasi SBAR telah dibacakan ulang dan diverifikasi bersama tim."
              : "Lengkapi semua seksi wajib (S, B, A, R) sebelum konfirmasi read-back."}
          </p>
        </div>
      </button>
    </div>
  );
}
