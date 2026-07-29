"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Activity, AlertCircle, Check, CheckCircle2, FileText,
  RotateCcw, Stethoscope, User,
} from "lucide-react";
import type { KunjunganRecord } from "@/lib/data";
import { Select } from "@/components/shared/inputs/Select";
import { DiagnosaCombobox } from "./DiagnosaCombobox";
import {
  KODE_RS, NAMA_RS, getIcdName, MOCK_SEP_RANAP, SMF_LIST,
  type IcdOption,
} from "./rujukanTypes";

// ─── Types ────────────────────────────────────────────────────

type SEPState = "idle" | "used";
type BadgeTone = "wajib" | "opsional" | "sumber" | "otomatis";

// ─── Small primitives ─────────────────────────────────────────

const BADGE_CLS: Record<BadgeTone, string> = {
  wajib:    "bg-rose-50 text-rose-600 ring-rose-100",
  opsional: "bg-slate-100 text-slate-500 ring-slate-200",
  sumber:   "bg-sky-50 text-sky-600 ring-sky-100",
  otomatis: "bg-teal-50 text-teal-600 ring-teal-100",
};

function Badge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide ring-1", BADGE_CLS[tone])}>
      {children}
    </span>
  );
}

/** Header baris untuk tiap seksi: label + badge + indikator "Terisi". */
function SectionLabel({
  children, badge, hint, done,
}: {
  children: React.ReactNode;
  badge?:   React.ReactNode;
  hint?:    string;
  done?:    boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{children}</p>
      {badge}
      {hint && <span className="text-[9.5px] font-normal normal-case text-slate-300">{hint}</span>}
      {done && (
        <span className="ml-auto flex items-center gap-0.5 text-[9px] font-bold text-emerald-500">
          <Check size={10} /> Terisi
        </span>
      )}
    </div>
  );
}

/** Kartu field — background & border menyorot hijau saat terisi. */
function FieldCard({
  label, badge, hint, done, children,
}: {
  label:    string;
  badge?:   React.ReactNode;
  hint?:    string;
  done?:    boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border p-3 transition-colors duration-200",
        done ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white",
      )}
    >
      <SectionLabel badge={badge} hint={hint} done={done}>{label}</SectionLabel>
      {children}
    </div>
  );
}

// ─── Readiness banner ─────────────────────────────────────────

function ReqChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold ring-1 transition-colors",
        ok ? "bg-emerald-100 text-emerald-700 ring-emerald-200" : "bg-white text-slate-400 ring-slate-200",
      )}
    >
      {ok ? <Check size={10} /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
      {label}
    </span>
  );
}

function ReadinessBanner({ sepReady, dxReady }: { sepReady: boolean; dxReady: boolean }) {
  const ready = sepReady && dxReady;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3.5 py-2.5 transition-colors duration-200",
        ready ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50",
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-lg", ready ? "bg-emerald-100" : "bg-slate-200")}>
          {ready ? <CheckCircle2 size={13} className="text-emerald-600" /> : <AlertCircle size={13} className="text-slate-500" />}
        </span>
        <p className={cn("text-[11.5px] font-bold", ready ? "text-emerald-700" : "text-slate-600")}>
          {ready ? "Siap membuat rujukan kontrol" : "Lengkapi data wajib terlebih dahulu"}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <ReqChip ok={sepReady} label="SEP Ranap" />
        <ReqChip ok={dxReady} label="Diagnosa" />
      </div>
    </div>
  );
}

// ─── PPPKInfoBar ──────────────────────────────────────────────

function PPPKInfoBar({ dokter }: { dokter: string }) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Activity size={12} className="shrink-0 text-sky-400" />
        <span className="font-mono text-[11px] font-bold text-slate-700">{KODE_RS}</span>
        <span className="truncate text-[10.5px] text-slate-400">{NAMA_RS}</span>
      </div>
      <div className="h-px bg-slate-200" />
      <div className="flex items-center gap-2">
        <User size={12} className="shrink-0 text-sky-400" />
        <span className="text-[10.5px] text-slate-600">{dokter}</span>
      </div>
    </div>
  );
}

// ─── LastSEPCard ──────────────────────────────────────────────

function LastSEPCard({
  used, onUse, onManual,
}: {
  used:     boolean;
  onUse:    () => void;
  onManual: () => void;
}) {
  const d = MOCK_SEP_RANAP;
  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-colors duration-200",
        used ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className={cn("flex h-5 w-5 items-center justify-center rounded-md ring-1",
              used ? "bg-emerald-100 ring-emerald-200" : "bg-slate-100 ring-slate-200")}>
              <FileText size={10} className={used ? "text-emerald-600" : "text-slate-400"} />
            </span>
            <span className="font-mono text-[11px] font-bold text-slate-700">{d.noSEP}</span>
            {used && (
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                Digunakan
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 pl-6.5">
            {([
              ["Diagnosa",   `${d.diagnosa} — ${getIcdName(d.diagnosa)}`],
              ["Tgl Keluar", d.tglKeluar],
              ["Kelas",      d.kelas],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k}>
                <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">{k}</p>
                <p className="truncate text-[10px] font-medium text-slate-600">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {!used && (
          <button
            type="button"
            onClick={onUse}
            className="shrink-0 rounded-lg bg-sky-600 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-sky-700 active:scale-95"
          >
            Gunakan
          </button>
        )}
      </div>

      {!used && (
        <button
          type="button"
          onClick={onManual}
          className="mt-2 text-[9.5px] text-slate-400 underline underline-offset-2 hover:text-slate-600"
        >
          Input nomor SEP lain
        </button>
      )}
    </div>
  );
}

// ─── ManualSEPInput ───────────────────────────────────────────

function ManualSEPInput({
  value, onChange, onCancel,
}: {
  value:    string;
  onChange: (v: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Masukkan nomor SEP Rawat Inap…"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[12px] text-slate-800 placeholder:text-slate-300 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
      />
      <button
        type="button"
        onClick={onCancel}
        className="text-[9.5px] text-slate-400 underline underline-offset-2 hover:text-slate-600"
      >
        Gunakan SEP terakhir
      </button>
    </div>
  );
}

// ─── ConfirmPanel ─────────────────────────────────────────────

function ConfirmPanel({
  noSEP, diagnosa, smf, dokter, onConfirm, onCancel,
}: {
  noSEP:     string;
  diagnosa:  IcdOption;
  smf:       string;
  dokter:    string;
  onConfirm: () => void;
  onCancel:  () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div className="overflow-hidden rounded-xl border border-sky-200 bg-sky-50 shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-100 bg-sky-500 px-4 py-3">
          <div>
            <p className="text-[12px] font-bold text-white">Konfirmasi Buat &amp; Pilih Rujukan</p>
            <p className="text-[9.5px] text-white/70">Rujukan akan dibuat dan langsung dipilih untuk SEP Kontrol</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-white/15 text-white/80 transition hover:bg-white/25"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 p-4">
          {/* Summary */}
          <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-sky-100">
            {([
              ["Kode RS",       KODE_RS],
              ["Dokter DPJP",   dokter],
              ["No. SEP Ranap", noSEP],
              ["Diagnosa",      `${diagnosa.code} — ${diagnosa.name}`],
              ...(smf ? [["SMF", smf] as [string, string]] : []),
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex items-start gap-3">
                <span className="w-24 shrink-0 text-[9.5px] font-bold uppercase tracking-wide text-slate-400">{k}</span>
                <span className="flex-1 text-[11px] font-semibold text-slate-700">{v}</span>
              </div>
            ))}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
            <AlertCircle size={11} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-[10px] leading-relaxed text-amber-700">
              Rujukan kontrol berlaku <strong>1 kali</strong> dan harus digunakan dalam{" "}
              <strong>1 bulan</strong> sejak tanggal keluar rawat inap.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-sky-600 py-2.5 text-[11px] font-bold text-white transition hover:bg-sky-700 active:scale-95"
            >
              Ya, Buat &amp; Pilih
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SuccessState ─────────────────────────────────────────────

function SuccessState({ noRujukan, onReset }: { noRujukan: string; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center gap-4 py-8 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 18 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100"
      >
        <Check size={24} className="text-emerald-600" />
      </motion.div>

      <div className="space-y-2">
        <p className="text-[14px] font-bold text-slate-800">Rujukan Kontrol Berhasil Dibuat</p>
        <p className="text-[10.5px] text-slate-400">Nomor rujukan yang dihasilkan:</p>
        <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 px-4 py-2.5">
          <span className="font-mono text-[12px] font-bold text-sky-700">{noRujukan}</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2"
      >
        <CheckCircle2 size={12} className="text-emerald-500" />
        <p className="text-[10.5px] font-semibold text-emerald-700">Dipilih untuk SEP Kontrol Pasca Ranap</p>
      </motion.div>

      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        <RotateCcw size={11} />
        Buat Rujukan Lain
      </button>
    </motion.div>
  );
}

// ─── KontrolPascaRanapForm ────────────────────────────────────

export function KontrolPascaRanapForm({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const [sepState,   setSepState]   = useState<SEPState>("idle");
  const [manualSEP,  setManualSEP]  = useState(false);
  const [noSEPInput, setNoSEPInput] = useState("");
  const [smf,        setSmf]        = useState("");
  const [diagnosa,   setDiagnosa]   = useState<IcdOption | null>(null);
  const [catatan,    setCatatan]    = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [noRujukan,  setNoRujukan]  = useState("");

  const noSEPActive = manualSEP ? noSEPInput.trim() : MOCK_SEP_RANAP.noSEP;
  const sepReady    = manualSEP ? noSEPInput.trim().length >= 10 : sepState === "used";
  const dxReady     = diagnosa !== null;
  const canSubmit   = sepReady && dxReady;
  const dokter      = kunjungan.dokter ?? "—";

  const handleConfirm = () => {
    const ts = Date.now().toString().slice(-6);
    const d  = new Date();
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setNoRujukan(`${KODE_RS}${dd}${mm}${yy}K${ts}`);
    setConfirming(false);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSepState("idle");
    setManualSEP(false);
    setNoSEPInput("");
    setSmf("");
    setDiagnosa(null);
    setCatatan("");
    setConfirming(false);
    setSubmitted(false);
    setNoRujukan("");
  };

  if (submitted) {
    return <SuccessState noRujukan={noRujukan} onReset={handleReset} />;
  }

  return (
    <div className="space-y-4">
      {/* Readiness overview */}
      <ReadinessBanner sepReady={sepReady} dxReady={dxReady} />

      {/* Two-column layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Left: sumber data ── */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <SectionLabel badge={<Badge tone="sumber">Sumber</Badge>} hint="dari kunjungan ranap sebelumnya" done={sepReady}>
              SEP Rawat Inap
            </SectionLabel>
            {manualSEP ? (
              <ManualSEPInput
                value={noSEPInput}
                onChange={setNoSEPInput}
                onCancel={() => { setManualSEP(false); setNoSEPInput(""); }}
              />
            ) : (
              <LastSEPCard
                used={sepState === "used"}
                onUse={() => setSepState("used")}
                onManual={() => setManualSEP(true)}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <SectionLabel badge={<Badge tone="otomatis">Otomatis</Badge>}>Data PPPK Rumah Sakit</SectionLabel>
            <PPPKInfoBar dokter={dokter} />
          </div>
        </div>

        {/* ── Right: rincian rujukan ── */}
        <div className="space-y-4">
          <FieldCard label="Diagnosa" hint="ICD-10" badge={<Badge tone="wajib">Wajib</Badge>} done={dxReady}>
            <DiagnosaCombobox value={diagnosa} onChange={setDiagnosa} />
          </FieldCard>

          <FieldCard label="SMF Tujuan" badge={<Badge tone="opsional">Opsional</Badge>} done={smf !== ""}>
            <Select
              value={smf}
              onChange={setSmf}
              options={SMF_LIST}
              icon={Stethoscope}
              placeholder="Pilih SMF tujuan…"
            />
          </FieldCard>

          <FieldCard label="Catatan" badge={<Badge tone="opsional">Opsional</Badge>} done={catatan.trim().length > 0}>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={2}
              placeholder="Keterangan tambahan jika diperlukan…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 placeholder:text-slate-300 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </FieldCard>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="text-[10px] text-slate-400">
          {!sepReady && "Pilih SEP Rawat Inap terlebih dahulu"}
          {sepReady && !dxReady && "Diagnosa ICD-10 wajib diisi"}
          {canSubmit && "Semua syarat terpenuhi — siap dibuat"}
        </div>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => setConfirming(true)}
          className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2.5 text-[12px] font-bold text-white shadow-sm shadow-sky-200/70 transition hover:bg-sky-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <Stethoscope size={13} />
          Buat &amp; Pilih Rujukan
        </button>
      </div>

      {/* Confirm panel (inline) */}
      <AnimatePresence>
        {confirming && diagnosa && (
          <ConfirmPanel
            key="confirm"
            noSEP={noSEPActive}
            diagnosa={diagnosa}
            smf={smf}
            dokter={dokter}
            onConfirm={handleConfirm}
            onCancel={() => setConfirming(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
