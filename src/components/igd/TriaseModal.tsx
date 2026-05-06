"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  Siren, AlertTriangle, User, ClipboardList,
  Activity, CheckCircle2, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EMPTY_FORM, Label, RadioGroup, CheckGroup, Block, TriasePrimaryForm,
} from "./TriasePrimaryForm";
import type { TriaseEntryForm } from "./TriasePrimaryForm";

// ── Triage config ─────────────────────────────────────────

const TRIAGE_OPT = [
  {
    id: "P1", label: "P1", sub: "MERAH", desc: "Kritis · Mengancam jiwa",
    card: "border-rose-600 bg-rose-600", ring: "ring-rose-500",
    dot: "bg-rose-400", pulse: true,
  },
  {
    id: "P2", label: "P2", sub: "KUNING", desc: "Gawat · Segera ditangani",
    card: "border-amber-500 bg-amber-500", ring: "ring-amber-400",
    dot: "bg-amber-400", pulse: false,
  },
  {
    id: "P3", label: "P3", sub: "HIJAU", desc: "Tidak gawat darurat",
    card: "border-emerald-600 bg-emerald-600", ring: "ring-emerald-500",
    dot: "bg-emerald-500", pulse: false,
  },
  {
    id: "P4", label: "P4", sub: "HITAM", desc: "Harapan sangat kecil",
    card: "border-slate-800 bg-slate-800", ring: "ring-slate-600",
    dot: "bg-slate-600", pulse: false,
  },
] as const;

const SAVE_CLS: Record<string, string> = {
  P1: "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
  P2: "bg-amber-500 hover:bg-amber-600 shadow-amber-200",
  P3: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
  P4: "bg-slate-800 hover:bg-slate-900 shadow-slate-200",
};

// ── Auto-suggest logic ────────────────────────────────────

function suggestLevel(f: TriaseEntryForm): string | null {
  if (!f.airwayStatus && !f.breathingQuality && !f.nadiTeraba && !f.avpu) return null;
  if (
    f.airwayStatus === "Tersumbat Total" ||
    f.breathingQuality === "Tidak Bernapas" ||
    f.nadiTeraba === "Tidak Teraba" ||
    f.avpu === "Unresponsive"
  ) return "P1";
  if (
    f.airwayStatus === "Tersumbat Parsial" ||
    f.breathingQuality === "Sesak / Distress" ||
    f.avpu === "Pain" ||
    f.perdarahan === "Ada — Tidak Terkontrol" ||
    f.crt === "≥ 2 detik"
  ) return "P2";
  if (f.avpu === "Verbal") return "P3";
  if (f.avpu === "Alert" && f.breathingQuality === "Normal" && f.nadiTeraba === "Teraba") return "P3";
  return null;
}

// ── Section divider ───────────────────────────────────────

function SectionDiv({
  num, title, icon: Icon, color,
}: {
  num: string; title: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-xl", color)}>
        <Icon size={13} className="text-white" />
      </div>
      <span className="text-sm font-bold text-slate-800">{num} · {title}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────

function makeDefaultForm(): TriaseEntryForm {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, "0");
  return {
    ...EMPTY_FORM,
    waktuTriase: `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}T${p(n.getHours())}:${p(n.getMinutes())}`,
  };
}

// ── TriaseModal ───────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onSimpan?: (data: TriaseEntryForm) => void;
}

export default function TriaseModal({ open, onClose, onSimpan }: Props) {
  const [form, setForm] = useState<TriaseEntryForm>(makeDefaultForm);
  const set = useCallback(
    <K extends keyof TriaseEntryForm>(k: K, v: TriaseEntryForm[K]) =>
      setForm((prev) => ({ ...prev, [k]: v })),
    [],
  );

  const shakeControls = useAnimation();

  const handleBackdropClick = useCallback(() => {
    shakeControls.start({
      x: [0, -10, 10, -6, 6, -3, 3, 0],
      transition: { duration: 0.38, ease: "easeInOut" },
    });
  }, [shakeControls]);

  const handleClose = useCallback(() => {
    setForm(makeDefaultForm);
    onClose();
  }, [onClose]);

  const handleSimpan = useCallback(() => {
    onSimpan?.(form);
    setForm(makeDefaultForm);
    onClose();
  }, [form, onSimpan, onClose]);

  const suggested = suggestLevel(form);
  const isCritical =
    form.airwayStatus === "Tersumbat Total" ||
    form.breathingQuality === "Tidak Bernapas" ||
    form.nadiTeraba === "Tidak Teraba" ||
    form.avpu === "Unresponsive";

  const steps = [
    { label: "Identitas", done: !!form.namaPasien && !!form.jenisKelamin && !!form.usia },
    { label: "Keluhan",   done: !!form.keluhanUtama && !!form.caraMasuk },
    { label: "Survey",    done: !!form.airwayStatus && !!form.breathingQuality && !!form.nadiTeraba && !!form.avpu },
    { label: "Keputusan", done: !!form.triageLevel && !!form.perawatTriase },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === 4;

  const inp = "h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto p-4">
      {/* Backdrop — no close on click, only shake */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Modal — entrance via direct animate prop, shake via shakeControls wrapper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.32, bounce: 0.12 }}
        className="relative z-10 my-4 w-full max-w-4xl"
      >
      <motion.div
        animate={shakeControls}
        className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl"
      >
        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-10 shrink-0 bg-gradient-to-r from-rose-600 via-rose-500 to-red-500">
          <div className="px-5 pt-4 pb-3">
            {/* Title row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Siren size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight text-white">
                    Triase Pasien Baru
                  </h2>
                  <p className="text-xs text-rose-100">
                    {form.namaPasien
                      ? <span className="font-semibold text-white">{form.namaPasien}</span>
                      : <span>Nama belum diisi</span>}
                    {form.usia && <span className="text-rose-200"> · {form.usia} thn</span>}
                    {form.jenisKelamin && <span className="text-rose-200"> · {form.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}</span>}
                  </p>
                </div>
              </div>
              {form.triageLevel && (
                <span className="shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-black tracking-widest text-white ring-1 ring-white/30">
                  {form.triageLevel}
                </span>
              )}
            </div>

            {/* Progress steps */}
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center">
                  <div className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black transition-all duration-300",
                    s.done ? "bg-white text-rose-600" : "bg-white/25 text-white",
                  )}>
                    {s.done ? <Check size={10} strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={cn("ml-1 text-[10px] font-semibold", s.done ? "text-white" : "text-rose-200")}>
                    {s.label}
                  </span>
                  {i < 3 && (
                    <div className={cn("mx-2 h-px w-5 transition-all duration-500",
                      s.done ? "bg-white/60" : "bg-white/20")} />
                  )}
                </div>
              ))}
              <span className="ml-auto rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                {doneCount}/4
              </span>
            </div>
          </div>

          {/* Critical alert */}
          <AnimatePresence>
            {isCritical && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2.5 border-t border-rose-400/40 bg-rose-700/80 px-5 py-2.5">
                  <AlertTriangle size={13} className="shrink-0 animate-pulse text-white" />
                  <p className="text-xs font-bold text-white">
                    KONDISI KRITIS TERDETEKSI — Aktifkan tim resusitasi segera
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex flex-col gap-5 p-5">

          {/* 01 — Identitas */}
          <section aria-labelledby="sec-identitas">
            <SectionDiv num="01" title="Identitas Pasien" icon={User} color="bg-indigo-600" />
            <div className="mt-3 flex flex-col gap-3">
              <div>
                <Label required>Nama Lengkap Pasien</Label>
                <input
                  type="text" value={form.namaPasien}
                  onChange={(e) => set("namaPasien", e.target.value)}
                  placeholder="Nama sesuai KTP atau yang diketahui keluarga..."
                  className={inp} autoFocus
                />
              </div>

              <div>
                <Label required>Jenis Kelamin</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["L", "P"] as const).map((id) => {
                    const isSelected = form.jenisKelamin === id;
                    return (
                      <button
                        key={id} type="button"
                        onClick={() => set("jenisKelamin", id)}
                        className={cn(
                          "rounded-xl border-2 py-3.5 text-center transition-all duration-200",
                          isSelected && id === "L" && "border-indigo-500 bg-indigo-50 shadow-sm",
                          isSelected && id === "P" && "border-rose-400 bg-rose-50 shadow-sm",
                          !isSelected && "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                        )}>
                        <p className={cn("text-xl font-black leading-none",
                          isSelected ? (id === "L" ? "text-indigo-700" : "text-rose-600") : "text-slate-600")}>
                          {id}
                        </p>
                        <p className={cn("mt-0.5 text-xs font-medium",
                          isSelected ? (id === "L" ? "text-indigo-400" : "text-rose-400") : "text-slate-400")}>
                          {id === "L" ? "Laki-laki" : "Perempuan"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>Usia</Label>
                  <div className="relative">
                    <input
                      type="number" min={0} max={150} value={form.usia}
                      onChange={(e) => set("usia", e.target.value)}
                      placeholder="0" className={cn(inp, "pr-12")}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      tahun
                    </span>
                  </div>
                </div>
                <div>
                  <Label>No. KTP / NIK</Label>
                  <input
                    type="text" value={form.noKTP}
                    onChange={(e) => set("noKTP", e.target.value)}
                    placeholder="16 digit (opsional)..." className={inp}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 02 — Kedatangan */}
          <section aria-labelledby="sec-kedatangan">
            <SectionDiv num="02" title="Cara Masuk & Kondisi Awal" icon={Siren} color="bg-rose-500" />
            <div className="mt-3">
              <Block title="Informasi Kedatangan">
                <div className="grid gap-3 sm:grid-cols-2">
                  <RadioGroup
                    label="Cara Masuk" required
                    options={["Jalan Kaki", "Kursi Roda", "Brankar", "Ambulans RS", "Ambulans 118"]}
                    value={form.caraMasuk} onChange={(v) => set("caraMasuk", v)}
                  />
                  <RadioGroup
                    label="Kondisi Saat Tiba" required
                    options={["Sadar", "Penurunan Kesadaran", "Tidak Sadar", "Gelisah / Agitasi"]}
                    value={form.kondisiTiba} onChange={(v) => set("kondisiTiba", v)} color="rose"
                  />
                </div>
              </Block>
            </div>
          </section>

          {/* 03 — Anamnesis */}
          <section aria-labelledby="sec-anamnesis">
            <SectionDiv num="03" title="Anamnesis Keluhan" icon={ClipboardList} color="bg-amber-500" />
            <div className="mt-3">
              <Block title="Keluhan Utama & Riwayat Penyakit">
                <div>
                  <Label required>Keluhan Utama</Label>
                  <textarea
                    rows={2} value={form.keluhanUtama}
                    onChange={(e) => set("keluhanUtama", e.target.value)}
                    placeholder="Tuliskan keluhan utama pasien saat ini secara singkat dan jelas..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs placeholder:text-slate-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label required>Onset</Label>
                    <input type="text" value={form.onset}
                      onChange={(e) => set("onset", e.target.value)}
                      placeholder="2 jam SMRS, mendadak..." className={inp} />
                  </div>
                  <div>
                    <Label>Lokasi Keluhan</Label>
                    <input type="text" value={form.lokasiKeluhan}
                      onChange={(e) => set("lokasiKeluhan", e.target.value)}
                      placeholder="Dada substernal, perut..." className={inp} />
                  </div>
                  <RadioGroup label="Skala Berat"
                    options={["Ringan", "Sedang", "Berat", "Sangat Berat"]}
                    value={form.skalaBerat} onChange={(v) => set("skalaBerat", v)} color="amber" />
                </div>
                <RadioGroup label="Kualitas Keluhan"
                  options={["Tumpul", "Tajam / Menusuk", "Seperti Ditekan", "Seperti Terbakar", "Berdenyut", "Kolik"]}
                  value={form.kualitasKeluhan} onChange={(v) => set("kualitasKeluhan", v)} color="amber" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Faktor Pemberat</Label>
                    <input type="text" value={form.faktorPemberat}
                      onChange={(e) => set("faktorPemberat", e.target.value)}
                      placeholder="Aktivitas, berbaring..." className={inp} />
                  </div>
                  <div>
                    <Label>Faktor Peringan</Label>
                    <input type="text" value={form.faktorPeringan}
                      onChange={(e) => set("faktorPeringan", e.target.value)}
                      placeholder="Istirahat, obat tertentu..." className={inp} />
                  </div>
                </div>
                <CheckGroup label="Gejala Penyerta"
                  options={["Mual", "Muntah", "Demam", "Sesak Napas", "Nyeri Kepala", "Pusing", "Keringat Dingin", "Lemas", "Pingsan", "Diare", "Batuk", "Kejang"]}
                  values={form.gejalaPenyerta} onChange={(v) => set("gejalaPenyerta", v)} color="amber" />
                <div>
                  <Label>Riwayat Keluhan Serupa</Label>
                  <input type="text" value={form.riwayatSerupa}
                    onChange={(e) => set("riwayatSerupa", e.target.value)}
                    placeholder="Pernah mengalami sebelumnya? Kapan?" className={inp} />
                </div>
              </Block>
            </div>
          </section>

          {/* 04 — Primary Survey */}
          <section aria-labelledby="sec-survey">
            <SectionDiv num="04" title="Primary Survey ABCDE" icon={Activity} color="bg-emerald-600" />
            <div className="mt-3">
              <TriasePrimaryForm form={form} set={set} />
            </div>
          </section>

          {/* 05 — Keputusan Triase */}
          <section aria-labelledby="sec-keputusan" className="pb-1">
            <SectionDiv num="05" title="Keputusan Triase" icon={CheckCircle2} color="bg-indigo-600" />

            <AnimatePresence>
              {suggested && !form.triageLevel && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5"
                >
                  <span className="text-xs font-semibold text-indigo-700">
                    Saran berdasarkan survey:
                  </span>
                  <span className="rounded-md bg-indigo-600 px-2.5 py-0.5 text-xs font-black text-white">
                    {suggested}
                  </span>
                  <span className="text-xs text-indigo-400">
                    · Perawat tetap menentukan keputusan akhir
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TRIAGE_OPT.map((opt) => {
                const isActive = form.triageLevel === opt.id;
                const isSuggested = suggested === opt.id && !isActive;
                return (
                  <button
                    key={opt.id} type="button"
                    onClick={() => set("triageLevel", opt.id)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-5 text-center transition-all duration-200",
                      isActive ? opt.card + " shadow-lg" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md",
                      isSuggested && "ring-2 ring-offset-1 " + opt.ring,
                    )}
                  >
                    {isSuggested && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-600">
                        Saran
                      </span>
                    )}
                    <span className="relative flex h-4 w-4">
                      {opt.pulse && isActive && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" />
                      )}
                      <span className={cn("relative inline-flex h-4 w-4 rounded-full",
                        isActive ? "bg-white/80" : opt.dot)} />
                    </span>
                    <div>
                      <p className={cn("text-xl font-black leading-none",
                        isActive ? "text-white" : "text-slate-800")}>{opt.label}</p>
                      <p className={cn("mt-0.5 text-[10px] font-bold tracking-[0.15em]",
                        isActive ? "text-white/80" : "text-slate-400")}>{opt.sub}</p>
                    </div>
                    <p className={cn("text-[10px] leading-tight",
                      isActive ? "text-white/70" : "text-slate-400")}>{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

        </div>

        {/* ── Sticky footer ── */}
        <div className="sticky bottom-0 shrink-0 border-t border-slate-100 bg-white/95 px-5 py-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              {allDone ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <Check size={13} strokeWidth={3} />
                  Semua bagian lengkap — siap disimpan
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  {4 - doneCount} bagian wajib belum terisi · Klik di luar form untuk konfirmasi batal
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <button
                type="button" onClick={handleClose}
                className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300"
              >
                Batal
              </button>
              <button
                type="button" onClick={handleSimpan} disabled={!allDone}
                className={cn(
                  "rounded-xl px-6 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  form.triageLevel
                    ? (SAVE_CLS[form.triageLevel] ?? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200")
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
                )}
              >
                Simpan Triase
              </button>
            </div>
          </div>
        </div>

      </motion.div>
      </motion.div>
    </div>,
    document.body
  );
}
