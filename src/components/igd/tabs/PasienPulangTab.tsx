"use client";

import { useState } from "react";
import {
  HeartOff, CheckCircle2, Clock, User, Stethoscope, FileText,
  Calendar, Activity, ClipboardCheck, Check, Printer,
  Send, HeartPulse, Thermometer, Wind,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  type StatusPulang, type KondisiUmum,
  STATUS_OPTIONS, KONDISI_OPTIONS, KONDISI_CLS,
  inputCls, Field, SectionHeader, SelectStatusPlaceholder,
} from "./pasienPulang/pasienPulangShared";
import SBARTransferPanel from "./pasienPulang/SBARTransferPanel";
import SembuhPanel       from "./pasienPulang/SembuhPanel";
import RujukanPanel      from "./pasienPulang/RujukanPanel";
import APSPanel          from "./pasienPulang/APSPanel";
import MeninggalPanel    from "./pasienPulang/MeninggalPanel";

// ── Main component ─────────────────────────────────────────────

export default function PasienPulangTab({ patient }: { patient: IGDPatientDetail }) {
  // Core left-column state
  const [statusPulang, setStatusPulang]     = useState<StatusPulang | null>(null);
  const [dokterPulang, setDokterPulang]     = useState(patient.doctor);
  const [tanggalPulang, setTanggalPulang]   = useState(patient.tglKunjungan);
  const [jamPulang, setJamPulang]           = useState("");
  const [kondisiUmum, setKondisiUmum]       = useState<KondisiUmum | null>(null);
  const [diagnosaKeluar, setDiagnosaKeluar] = useState<string[]>(
    patient.diagnosa.filter((d) => d.tipe === "Utama").map((d) => d.id),
  );
  const [catatanUmum, setCatatanUmum]       = useState("");
  const [submitted, setSubmitted]           = useState(false);

  // TTV terakhir
  const [tdSis, setTdSis] = useState(String(patient.vitalSigns.tdSistolik));
  const [tdDia, setTdDia] = useState(String(patient.vitalSigns.tdDiastolik));
  const [nadi, setNadi]   = useState(String(patient.vitalSigns.nadi));
  const [rr, setRr]       = useState(String(patient.vitalSigns.respirasi));
  const [suhu, setSuhu]   = useState(String(patient.vitalSigns.suhu));
  const [spo2, setSpo2]   = useState(String(patient.vitalSigns.spo2));

  // Confirmation callbacks from sub-panels
  const [sbarConfirmed, setSbarConfirmed] = useState(false);
  const [apsConfirmed, setApsConfirmed]   = useState(false);
  const [matiConfirmed, setMatiConfirmed] = useState(false);

  const handleStatusChange = (s: StatusPulang) => {
    setStatusPulang(s);
    setSbarConfirmed(false);
    setApsConfirmed(false);
    setMatiConfirmed(false);
  };

  const toggleDiagnosa = (id: string) =>
    setDiagnosaKeluar((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const canSubmit =
    statusPulang !== null &&
    kondisiUmum !== null &&
    jamPulang !== "" &&
    (statusPulang !== "Meninggal"  || matiConfirmed) &&
    (statusPulang !== "APS"        || apsConfirmed) &&
    (statusPulang !== "Rawat_Inap" || sbarConfirmed);

  // ── Success screen ──
  if (submitted && statusPulang) {
    const def = STATUS_OPTIONS.find((s) => s.id === statusPulang)!;
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <span
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl",
            statusPulang === "Meninggal"
              ? "bg-slate-800 text-slate-200"
              : "bg-emerald-100 text-emerald-600",
          )}
        >
          {statusPulang === "Meninggal" ? <HeartOff size={30} /> : <CheckCircle2 size={30} />}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">Proses Pemulangan Selesai</p>
          <p className="mt-1 text-xs text-slate-500">
            {patient.name} ({patient.noRM}) — Status:{" "}
            <span className="font-semibold text-slate-700">{def.label}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Dicatat oleh: {dokterPulang} · {tanggalPulang} {jamPulang}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Printer size={13} /> Cetak Dokumen
          </button>
          <button
            onClick={() => setSubmitted(false)}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const isMeninggal = statusPulang === "Meninggal";

  return (
    <div className="flex flex-col gap-4">

      {/* ── Patient info bar ── */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <User size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pasien</p>
              <p className="text-xs font-semibold text-slate-800">{patient.name}</p>
              <p className="text-[11px] text-slate-400">
                {patient.noRM} · {patient.age} thn · {patient.gender === "L" ? "Laki-laki" : "Perempuan"}
              </p>
            </div>
          </div>
          <div className="hidden h-7 w-px bg-slate-100 sm:block" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Stethoscope size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">DPJP</p>
              <p className="text-xs font-semibold text-slate-800">{patient.doctor}</p>
            </div>
          </div>
          <div className="hidden h-7 w-px bg-slate-100 sm:block" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Calendar size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Masuk</p>
              <p className="text-xs font-semibold text-slate-800">{patient.tglKunjungan}</p>
              <p className="text-[11px] text-slate-400">Pukul {patient.arrivalTime}</p>
            </div>
          </div>
          <div className="hidden h-7 w-px bg-slate-100 sm:block" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <FileText size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">No. Kunjungan</p>
              <p className="font-mono text-xs font-semibold text-slate-800">{patient.noKunjungan}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className={cn("grid grid-cols-1 gap-4", statusPulang !== null && "lg:grid-cols-2")}>

        {/* ── Left: Main form ── */}
        <div className="flex flex-col gap-4">

          {/* Status pemulangan */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={ClipboardCheck} title="Status Pemulangan" />
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
              {STATUS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const sel  = statusPulang === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleStatusChange(opt.id)}
                    className={cn(
                      "flex flex-col gap-1.5 rounded-xl border px-3 py-3 text-left transition",
                      sel ? opt.selected : opt.idle,
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded",
                          sel
                            ? opt.id === "Meninggal"
                              ? "bg-slate-700 text-slate-200"
                              : "bg-white/60 text-current"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        <Icon size={10} />
                      </span>
                      <span className="text-xs font-semibold leading-none">{opt.label}</span>
                      {sel && <Check size={10} className="ml-auto shrink-0" />}
                    </div>
                    <p
                      className={cn(
                        "text-[10px] leading-snug",
                        sel
                          ? opt.id === "Meninggal"
                            ? "text-slate-400"
                            : "opacity-70"
                          : "text-slate-400",
                      )}
                    >
                      {opt.sublabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Waktu & DPJP */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={Clock} title="Waktu & Penanggung Jawab" />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
              <Field label="Dokter Pemulang" required>
                <input
                  value={dokterPulang}
                  onChange={(e) => setDokterPulang(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label={isMeninggal ? "Tanggal Meninggal" : "Tanggal Pulang"} required>
                <input
                  type="date"
                  value={tanggalPulang}
                  onChange={(e) => setTanggalPulang(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label={isMeninggal ? "Jam Meninggal" : "Jam Pulang"} required>
                <input
                  type="time"
                  value={jamPulang}
                  onChange={(e) => setJamPulang(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Kondisi umum + TTV terakhir */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={Activity} title="Kondisi Saat Pulang" />
            <div className="flex flex-col gap-4 p-4">
              <Field label="Kondisi Umum" required>
                <div className="flex flex-wrap gap-2">
                  {KONDISI_OPTIONS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKondisiUmum(k)}
                      className={cn(
                        "rounded-lg border px-4 py-1.5 text-xs font-medium transition",
                        kondisiUmum === k
                          ? KONDISI_CLS[k]
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </Field>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Tanda Vital Terakhir
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {[
                    { label: "TD Sis",  val: tdSis,  set: setTdSis,  unit: "mmHg",  icon: HeartPulse },
                    { label: "TD Dia",  val: tdDia,  set: setTdDia,  unit: "mmHg",  icon: HeartPulse },
                    { label: "Nadi",    val: nadi,   set: setNadi,   unit: "×/mnt", icon: Activity   },
                    { label: "RR",      val: rr,     set: setRr,     unit: "×/mnt", icon: Wind       },
                    { label: "Suhu",    val: suhu,   set: setSuhu,   unit: "°C",    icon: Thermometer },
                    { label: "SpO₂",   val: spo2,   set: setSpo2,   unit: "%",     icon: Activity   },
                  ].map(({ label, val, set, unit }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <label className="text-center text-[10px] font-medium text-slate-400">{label}</label>
                      <input
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        className="h-8 w-full rounded-lg border border-slate-200 bg-white px-1 text-center text-xs font-semibold tabular-nums text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
                      />
                      <span className="text-center text-[9px] text-slate-400">{unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosa keluar */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={FileText} title="Diagnosa Keluar" />
            <div className="flex flex-col gap-2 p-4">
              {patient.diagnosa.map((d) => {
                const sel = diagnosaKeluar.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDiagnosa(d.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                      sel
                        ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
                        sel ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300 bg-white",
                      )}
                    >
                      {sel && <Check size={10} />}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">{d.kodeIcd10}</span>
                      <span className="text-xs font-medium">{d.namaDiagnosis}</span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1",
                        d.tipe === "Utama"
                          ? "bg-indigo-100 text-indigo-700 ring-indigo-200"
                          : "bg-slate-100 text-slate-500 ring-slate-200",
                      )}
                    >
                      {d.tipe}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catatan penutup */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={ClipboardCheck} title="Catatan Penutup" />
            <div className="p-4">
              <textarea
                value={catatanUmum}
                onChange={(e) => setCatatanUmum(e.target.value)}
                rows={3}
                placeholder="Ringkasan perjalanan pasien, tatalaksana yang diberikan, respons terapi..."
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
              />
            </div>
          </div>
        </div>

        {/* ── Right: Conditional panel ── */}
        {statusPulang !== null ? (
          <div className="flex flex-col gap-4">
            {(statusPulang === "Sembuh" || statusPulang === "Membaik") && (
              <SembuhPanel status={statusPulang} patient={patient} />
            )}
            {statusPulang === "Rawat_Inap" && (
              <SBARTransferPanel patient={patient} onConfirmedChange={setSbarConfirmed} />
            )}
            {statusPulang === "Dirujuk" && <RujukanPanel />}
            {statusPulang === "APS" && (
              <APSPanel onConfirmedChange={setApsConfirmed} />
            )}
            {statusPulang === "Meninggal" && (
              <MeninggalPanel patient={patient} onConfirmedChange={setMatiConfirmed} />
            )}
          </div>
        ) : (
          <SelectStatusPlaceholder />
        )}
      </div>

      {/* ── Sticky footer ── */}
      <div
        className={cn(
          "sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm",
          isMeninggal ? "border-slate-700 bg-slate-900" : "border-slate-200",
        )}
      >
        <div className="flex items-center gap-3">
          {!statusPulang ? (
            <p className="text-xs text-slate-400">Pilih status pemulangan dan lengkapi form</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const def = STATUS_OPTIONS.find((s) => s.id === statusPulang)!;
                return (
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ring-1",
                      isMeninggal
                        ? "bg-slate-800 text-slate-300 ring-slate-700"
                        : def.selected,
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", def.dot)} />
                    {def.label}
                  </span>
                );
              })()}
              {!canSubmit && (
                <p className={cn("text-[11px]", isMeninggal ? "text-slate-500" : "text-slate-400")}>
                  Lengkapi semua field wajib
                  {statusPulang === "Rawat_Inap" && " + konfirmasi SBAR"}
                  {statusPulang === "APS" && " + konfirmasi APS"}
                  {statusPulang === "Meninggal" && " + konfirmasi SKM"}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium transition",
              isMeninggal
                ? "border-slate-700 text-slate-400 hover:bg-slate-800"
                : "border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            <Printer size={13} /> Cetak
          </button>
          <button
            onClick={() => { if (canSubmit) setSubmitted(true); }}
            disabled={!canSubmit}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40",
              isMeninggal
                ? "bg-slate-700 hover:bg-slate-600"
                : statusPulang === "APS"
                ? "bg-amber-600 hover:bg-amber-700"
                : statusPulang === "Dirujuk"
                ? "bg-sky-600 hover:bg-sky-700"
                : statusPulang === "Rawat_Inap"
                ? "bg-violet-600 hover:bg-violet-700"
                : "bg-emerald-600 hover:bg-emerald-700",
            )}
          >
            <Send size={13} />
            {!statusPulang
              ? "Selesaikan Pemulangan"
              : isMeninggal
              ? "Catat Kematian"
              : statusPulang === "APS"
              ? "Proses Pemulangan APS"
              : statusPulang === "Rawat_Inap"
              ? "Proses Transfer SBAR"
              : statusPulang === "Dirujuk"
              ? "Buat Surat Rujukan"
              : "Selesaikan Pemulangan"}
          </button>
        </div>
      </div>
    </div>
  );
}
