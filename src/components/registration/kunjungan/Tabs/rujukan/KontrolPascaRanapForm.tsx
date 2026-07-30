"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Activity, FileText, Stethoscope, User } from "lucide-react";
import type { KunjunganRecord } from "@/lib/data";
import { Select } from "@/components/shared/inputs/Select";
import { DiagnosaCombobox } from "./DiagnosaCombobox";
import {
  Badge, SectionLabel, FieldCard, ReadinessBanner,
  RujukanConfirmPanel, RujukanSuccessState,
} from "./rujukanFormShared";
import {
  KODE_RS, NAMA_RS, getIcdName, MOCK_SEP_RANAP, SMF_LIST,
  type IcdOption,
} from "./rujukanTypes";

// ─── Types ────────────────────────────────────────────────────

type SEPState = "idle" | "used";

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
    return (
      <RujukanSuccessState
        title="Rujukan Kontrol Berhasil Dibuat"
        noRujukan={noRujukan}
        pickedLabel="Dipilih untuk SEP Kontrol Pasca Ranap"
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Readiness overview */}
      <ReadinessBanner
        reqs={[{ ok: sepReady, label: "SEP Ranap" }, { ok: dxReady, label: "Diagnosa" }]}
        readyLabel="Siap membuat rujukan kontrol"
        pendingLabel="Lengkapi data wajib terlebih dahulu"
      />

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
          <RujukanConfirmPanel
            key="confirm"
            title="Konfirmasi Buat & Pilih Rujukan"
            subtitle="Rujukan akan dibuat dan langsung dipilih untuk SEP Kontrol"
            rows={[
              ["Kode RS",       KODE_RS],
              ["Dokter DPJP",   dokter],
              ["No. SEP Ranap", noSEPActive],
              ["Diagnosa",      `${diagnosa.code} — ${diagnosa.name}`],
              ...(smf ? [["SMF", smf] as [string, string]] : []),
            ]}
            warning={<>Rujukan kontrol berlaku <strong>1 kali</strong> dan harus digunakan dalam <strong>1 bulan</strong> sejak tanggal keluar rawat inap.</>}
            confirmLabel="Ya, Buat & Pilih"
            onConfirm={handleConfirm}
            onCancel={() => setConfirming(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
