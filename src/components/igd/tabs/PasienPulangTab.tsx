"use client";

import { useState, useEffect, useMemo } from "react";
import {
  HeartOff, CheckCircle2, Clock, User, Stethoscope, FileText,
  Calendar, ClipboardCheck, Check, Printer, Send, Plus, X,
} from "lucide-react";
import type { DisposisiInput, SpriInput } from "@/lib/schemas/disposisi/disposisi";
import { nowInputValue } from "@/components/shared/inputs/DateTimePicker";
import { Select, DateTimePicker } from "@/components/shared/inputs";
import { listPetugasKunjungan, type PetugasDTO } from "@/lib/api/penugasanRuangan";
import IcdSearch, { type IcdSearchAccent } from "@/components/shared/medical-records/diagnosa/IcdSearch";
import { ICD10 } from "@/components/shared/medical-records/diagnosaShared";
import { cn } from "@/lib/utils";
import {
  type StatusPulang, type PulangPatient,
  STATUS_OPTIONS,
  inputCls, Field, SectionHeader, SelectStatusPlaceholder,
} from "./pasienPulang/pasienPulangShared";

// StatusPulang (UI) → jenis Disposisi (DB). Sembuh/Membaik = Pulang.
const STATUS_TO_JENIS: Record<StatusPulang, DisposisiInput["jenis"]> = {
  Sembuh: "Pulang",
  Membaik: "Pulang",
  Rawat_Inap: "Rawat_Inap",
  Dirujuk: "Rujuk",
  APS: "APS",
  Meninggal: "Meninggal",
};

// kondisiUmum tidak lagi dinilai terpisah di form (card dihapus) — backend tetap wajib
// (Zod min(1) + DB NOT NULL), jadi diturunkan dari status pemulangan yang dipilih.
const KONDISI_DEFAULT: Record<StatusPulang, string> = {
  Sembuh:     "Baik",
  Membaik:    "Membaik",
  Rawat_Inap: "Dalam perawatan",
  Dirujuk:    "Dirujuk ke faskes lain",
  APS:        "Pulang atas permintaan sendiri",
  Meninggal:  "Meninggal",
};
import SPRIPanel         from "./pasienPulang/SPRIPanel";
import SembuhPanel       from "./pasienPulang/SembuhPanel";
import APSPanel          from "./pasienPulang/APSPanel";
import MeninggalPanel    from "./pasienPulang/MeninggalPanel";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Accent IcdSearch (selaras DiagnosaTab — ICD-10 = sky).
const SKY: IcdSearchAccent = {
  focus: "focus:border-sky-300 focus:ring-2 focus:ring-sky-100",
  itemActive: "bg-sky-50",
  kodeText: "text-sky-600",
  badge: "bg-sky-50 text-sky-600",
};

// ── Main component ─────────────────────────────────────────────

export default function PasienPulangTab({
  patient,
  onComplete,
  excludeStatus,
}: {
  patient: PulangPatient;
  /** Selesaikan kunjungan (persist + kunci). Absen → mode demo (sukses lokal). */
  onComplete?: (disposisi: DisposisiInput, waktuSelesai: string) => Promise<void> | void;
  /** Status yang disembunyikan dari pilihan (mis. RI sembunyikan "Rawat_Inap"). */
  excludeStatus?: StatusPulang[];
}) {
  const kunjunganId = patient.id ?? "";
  const isPersisted = UUID_RE.test(kunjunganId);
  const statusOptions = excludeStatus?.length
    ? STATUS_OPTIONS.filter((o) => !excludeStatus.includes(o.id))
    : STATUS_OPTIONS;

  // Core left-column state
  const [statusPulang, setStatusPulang]     = useState<StatusPulang | null>(null);
  const [dokterPulang, setDokterPulang]     = useState(patient.doctor);
  const [waktuPulang, setWaktuPulang]       = useState(() => nowInputValue()); // "YYYY-MM-DDTHH:mm"
  const [saving, setSaving]                 = useState(false);
  const [diagnosaKeluar, setDiagnosaKeluar] = useState<string[]>(
    patient.diagnosa.filter((d) => d.tipe === "Utama").map((d) => d.id),
  );
  const [draftDiag, setDraftDiag]           = useState("");
  const [extraDiagnosa, setExtraDiagnosa]   = useState<string[]>([]);
  const [catatanUmum, setCatatanUmum]       = useState("");
  const [submitted, setSubmitted]           = useState(false);

  // Roster dokter ter-assign ruangan kunjungan (konsumen klinis — sama pola Pemeriksaan Fisik).
  // Simpan PetugasDTO penuh: nama utk Select + `spesialistik` utk turunkan SMF/poli SPRI.
  const [dokterRoster, setDokterRoster] = useState<PetugasDTO[]>([]);

  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    listPetugasKunjungan(kunjunganId, "Dokter", ac.signal)
      .then(setDokterRoster)
      .catch(() => { /* 403/belum login → fallback DPJP header */ });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  // Opsi dokter pemulang = roster + DPJP header (patient.doctor) + nilai terpilih.
  const dokterOptions = useMemo(() => {
    const set = new Set(dokterRoster.map((p) => p.namaTampil));
    if (patient.doctor && patient.doctor !== "—") set.add(patient.doctor);
    if (dokterPulang) set.add(dokterPulang);
    return [...set].sort((a, b) => a.localeCompare(b, "id"));
  }, [dokterRoster, patient.doctor, dokterPulang]);

  // Data + konfirmasi dari sub-panel per-status (di-emit via onChange → disertakan saat complete).
  const [spriForm, setSpriForm]           = useState<SpriInput | null>(null);
  const [sembuhData, setSembuhData]       = useState({ instruksi: "", obatPulang: "" });
  const [apsData, setApsData]             = useState({ alasan: "", edukasi: "", penandatangan: "", hubungan: "" });
  const [apsConfirmed, setApsConfirmed]   = useState(false);
  const [matiConfirmed, setMatiConfirmed] = useState(false);

  const handleStatusChange = (s: StatusPulang) => {
    setStatusPulang(s);
    setSpriForm(null);
    setApsConfirmed(false);
    setMatiConfirmed(false);
  };

  const toggleDiagnosa = (id: string) =>
    setDiagnosaKeluar((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const addExtraDiag = () => {
    const v = draftDiag.trim();
    if (!v) return;
    setExtraDiagnosa((p) => [...p, v]);
    setDraftDiag("");
  };
  const removeExtraDiag = (i: number) =>
    setExtraDiagnosa((p) => p.filter((_, idx) => idx !== i));

  const canSubmit =
    statusPulang !== null &&
    waktuPulang !== "" &&
    (statusPulang !== "Meninggal"  || matiConfirmed) &&
    (statusPulang !== "APS"        || apsConfirmed) &&
    (statusPulang !== "Rawat_Inap" || spriForm !== null);

  // Submit → Selesaikan Kunjungan (persist + kunci) bila onComplete ada; selain itu demo lokal.
  async function handleSubmit() {
    if (!canSubmit || saving) return;
    if (!onComplete) { setSubmitted(true); return; }
    const diagnosaLabels = [
      ...patient.diagnosa
        .filter((d) => diagnosaKeluar.includes(d.id))
        .map((d) => `${d.kodeIcd10} ${d.namaDiagnosis}`),
      ...extraDiagnosa,
    ];
    const isSembuhMembaik = statusPulang === "Sembuh" || statusPulang === "Membaik";
    const isAps = statusPulang === "APS";
    const disposisi: DisposisiInput = {
      jenis: STATUS_TO_JENIS[statusPulang!],
      dokter: dokterPulang.trim() || undefined,
      kondisiUmum: KONDISI_DEFAULT[statusPulang!],
      diagnosaKeluar: diagnosaLabels,
      // instruksi pulang: dari panel Sembuh/Membaik bila ada; selain itu catatan penutup.
      instruksi: (isSembuhMembaik ? sembuhData.instruksi.trim() : "") || catatanUmum.trim() || undefined,
      catatan: catatanUmum.trim() || undefined,
      // Sembuh/Membaik
      obatPulang: isSembuhMembaik ? (sembuhData.obatPulang.trim() || undefined) : undefined,
      // APS
      apsAlasan: isAps ? (apsData.alasan.trim() || undefined) : undefined,
      edukasiRisiko: isAps ? (apsData.edukasi.trim() || undefined) : undefined,
      penandatangan: isAps ? (apsData.penandatangan.trim() || undefined) : undefined,
      hubunganPenandatangan: isAps ? (apsData.hubungan.trim() || undefined) : undefined,
      // Rawat Inap → SPRI (server menerbitkan No. Referensi atomik)
      spri: statusPulang === "Rawat_Inap" ? (spriForm ?? undefined) : undefined,
    };
    try {
      setSaving(true);
      await onComplete(disposisi, waktuPulang);
      setSubmitted(true);
    } catch {
      /* toast ditangani pemanggil (shell); tetap di form */
    } finally {
      setSaving(false);
    }
  }

  const waktuLabel = waktuPulang ? waktuPulang.replace("T", " ") : "—";

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
            Dicatat oleh: {dokterPulang} · {waktuLabel}
          </p>
          {statusPulang === "Rawat_Inap" && (
            <p className="mx-auto mt-3 max-w-sm rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[11px] leading-snug text-violet-700">
              SPRI telah diterbitkan. No. Referensi BPJS &amp; admisi Rawat Inap dilanjutkan di{" "}
              <span className="font-semibold">Worklist Admisi Registrasi</span> (bila BPJS bermasalah, dapat direvisi di sana).
            </p>
          )}
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
  // Dirujuk: cukup status saja (tanpa panel surat rujukan eksternal).
  const hasRightPanel = statusPulang !== null && statusPulang !== "Dirujuk";

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
              {patient.arrivalTime && (
                <p className="text-[11px] text-slate-400">Pukul {patient.arrivalTime}</p>
              )}
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
      <div className={cn("grid grid-cols-1 gap-4", hasRightPanel && "lg:grid-cols-2")}>

        {/* ── Left: Main form ── */}
        <div className="flex flex-col gap-4">

          {/* Status pemulangan */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={ClipboardCheck} title="Status Pemulangan" />
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
              {statusOptions.map((opt) => {
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
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <Field label="Dokter Pemulang (DPJP)" required hint="Dipilih dari dokter yang ditugaskan ke ruangan ini.">
                <Select
                  value={dokterPulang}
                  onChange={setDokterPulang}
                  options={dokterOptions}
                  icon={Stethoscope}
                  searchable
                  placeholder="— Pilih dokter penanggung jawab —"
                />
              </Field>
              <Field label={isMeninggal ? "Tanggal & Jam Meninggal" : "Tanggal & Jam Pulang"} required>
                <DateTimePicker
                  value={waktuPulang}
                  onChange={setWaktuPulang}
                  placeholder="Pilih tanggal & jam"
                />
              </Field>
            </div>
          </div>

          {/* Diagnosa keluar */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={FileText} title="Diagnosa Keluar" />
            <div className="flex flex-col gap-3 p-4">
              {patient.diagnosa.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Dari Rekam Medis
                  </p>
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
              )}

              {/* Tambah diagnosa: pilih kode ICD-10 lalu sambung ketikan, atau tulis manual. */}
              <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Tambah Diagnosa Lain
                </p>
                <IcdSearch
                  jenis="ICD-10"
                  placeholder="Cari kode / nama ICD-10… (min. 2 karakter)"
                  accent={SKY}
                  fallback={ICD10}
                  onSelect={(p) => setDraftDiag(`${p.kode} — ${p.nama}`)}
                />
                <div className="flex items-center gap-2">
                  <input
                    value={draftDiag}
                    onChange={(e) => setDraftDiag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addExtraDiag(); }
                    }}
                    placeholder="Pilih ICD di atas lalu sambung ketikan, atau tulis manual…"
                    className={cn(inputCls, "flex-1")}
                  />
                  <button
                    type="button"
                    onClick={addExtraDiag}
                    disabled={!draftDiag.trim()}
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={13} /> Tambah
                  </button>
                </div>
                {extraDiagnosa.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {extraDiagnosa.map((label, i) => (
                      <div
                        key={`${label}-${i}`}
                        className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-800"
                      >
                        <FileText size={12} className="shrink-0 text-indigo-400" />
                        <span className="min-w-0 flex-1 wrap-break-word">{label}</span>
                        <button
                          type="button"
                          onClick={() => removeExtraDiag(i)}
                          aria-label="Hapus diagnosa"
                          className="shrink-0 text-indigo-400 transition hover:text-rose-500"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

        {/* ── Right: Conditional panel (Dirujuk tanpa panel) ── */}
        {statusPulang === null ? (
          <SelectStatusPlaceholder />
        ) : hasRightPanel ? (
          <div className="flex flex-col gap-4">
            {(statusPulang === "Sembuh" || statusPulang === "Membaik") && (
              <SembuhPanel status={statusPulang} patient={patient} onChange={setSembuhData} />
            )}
            {statusPulang === "Rawat_Inap" && (
              <SPRIPanel
                patient={patient}
                dokterOptions={dokterOptions}
                roster={dokterRoster}
                onChange={setSpriForm}
              />
            )}
            {statusPulang === "APS" && (
              <APSPanel onConfirmedChange={setApsConfirmed} onChange={setApsData} />
            )}
            {statusPulang === "Meninggal" && (
              <MeninggalPanel patient={patient} onConfirmedChange={setMatiConfirmed} />
            )}
          </div>
        ) : null}
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
                  {statusPulang === "Rawat_Inap" && " + terbitkan SPRI"}
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
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
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
              ? "Selesaikan & Rawat Inap"
              : "Selesaikan Pemulangan"}
          </button>
        </div>
      </div>
    </div>
  );
}
