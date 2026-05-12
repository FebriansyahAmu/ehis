"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, FileText, PenLine, Camera, CheckCircle2,
  ShieldCheck, ChevronRight, RotateCcw, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ICConsentResult, InformedConsentModalProps,
  HubunganPenanda, SignatureMethod,
} from "@/lib/informed-consent/types";
import {
  HUBUNGAN_OPTIONS, SAKSI_JABATAN_OPTIONS,
  DEFAULT_RISIKO, DEFAULT_MANFAAT, DEFAULT_ALTERNATIF,
} from "@/lib/informed-consent/types";
import SignatureDrawPane  from "./SignatureDrawPane";
import WebcamCapturePane from "./WebcamCapturePane";

// ── IC Document Components ────────────────────────────────

const SECTION_ACCENT = {
  sky:     "border-sky-100 bg-sky-50/40",
  rose:    "border-rose-100 bg-rose-50/40",
  emerald: "border-emerald-100 bg-emerald-50/40",
  amber:   "border-amber-100 bg-amber-50/40",
  violet:  "border-violet-100 bg-violet-50/40",
  slate:   "border-slate-200 bg-slate-50/40",
} as const;

const LETTER_BADGE = {
  sky:     "bg-sky-100 text-sky-700",
  rose:    "bg-rose-100 text-rose-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber:   "bg-amber-100 text-amber-700",
  violet:  "bg-violet-100 text-violet-700",
  slate:   "bg-slate-100 text-slate-600",
} as const;

type Accent = keyof typeof SECTION_ACCENT;

function ICSection({ letter, title, accent, delay = 0, children }: {
  letter: string; title: string; accent: Accent;
  delay?: number; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className={cn("rounded-xl border p-4", SECTION_ACCENT[accent])}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className={cn("flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black", LETTER_BADGE[accent])}>
          {letter}
        </span>
        <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{title}</h4>
      </div>
      {children}
    </motion.div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
          <ChevronRight size={12} className="mt-0.5 shrink-0 text-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-36 shrink-0 font-medium text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

// ── Signature method tab button ───────────────────────────

const SIG_METHODS: { id: SignatureMethod; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "draw",   label: "Tanda Tangan Digital", icon: PenLine, desc: "Gambar TTD langsung di layar" },
  { id: "webcam", label: "Foto TTD Fisik",        icon: Camera,  desc: "Foto tanda tangan di kertas" },
];

// ── Input / Select shared styles ─────────────────────────

const FIELD_CLS = "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

// ── Main Modal ────────────────────────────────────────────

export default function InformedConsentModal({
  isOpen, onClose, onSave,
  tindakan, deskripsiTindakan, dokterPelaksana,
  pasienNama, pasienNoRM, ruangan,
  risiko    = DEFAULT_RISIKO,
  manfaat   = DEFAULT_MANFAAT,
  alternatif = DEFAULT_ALTERNATIF,
}: InformedConsentModalProps) {

  const [mounted, setMounted]         = useState(false);
  const [sudahBaca, setSudahBaca]     = useState(false);
  const [sigMethod, setSigMethod]     = useState<SignatureMethod>("draw");
  const [prevMethod, setPrevMethod]   = useState<SignatureMethod>("draw");
  const [capturedSig, setCapturedSig] = useState<string | null>(null);
  const [hubungan, setHubungan]       = useState<HubunganPenanda>("Pasien Sendiri");
  const [namaPenanda, setNamaPenanda] = useState("");
  const [saksiNama, setSaksiNama]     = useState("");
  const [saksiJabatan, setSaksiJabatan] = useState("Perawat");

  useEffect(() => { setMounted(true); }, []);

  const canSave = sudahBaca && capturedSig !== null && namaPenanda.trim() !== "" && saksiNama.trim() !== "";

  const sigTabIdx  = SIG_METHODS.findIndex(m => m.id === sigMethod);
  const prevTabIdx = SIG_METHODS.findIndex(m => m.id === prevMethod);
  const direction  = sigTabIdx >= prevTabIdx ? 1 : -1;

  const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

  function switchMethod(id: SignatureMethod) {
    if (id === sigMethod) return;
    setPrevMethod(sigMethod);
    setSigMethod(id);
    setCapturedSig(null);
  }

  function resetForm() {
    setSudahBaca(false);
    setSigMethod("draw");
    setPrevMethod("draw");
    setCapturedSig(null);
    setHubungan("Pasien Sendiri");
    setNamaPenanda("");
    setSaksiNama("");
    setSaksiJabatan("Perawat");
  }

  function handleClose() {
    onClose();
    setTimeout(resetForm, 350);
  }

  function handleSave() {
    if (!capturedSig) return;
    onSave({
      signatureMethod: sigMethod,
      signatureImagePng: capturedSig,
      hubungan, namaPenanda, saksiNama, saksiJabatan,
      consentedAt: new Date().toISOString(),
    });
    handleClose();
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">

          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal card */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 28 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.96, y: 16  }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.1 }}
            className="relative z-10 flex w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            style={{ maxHeight: "92vh" }}
          >

            {/* ── Header ──────────────────────────────── */}
            <div className="shrink-0 rounded-t-2xl border-b border-slate-100 bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                    <FileText size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">
                      Formulir Persetujuan Tindakan Kedokteran
                    </p>
                    <p className="text-[10px] font-medium text-sky-200 mt-0.5">PMK No. 290/2008</p>
                  </div>
                </div>
                <motion.button
                  type="button" onClick={handleClose} whileTap={{ scale: 0.92 }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Patient info strip */}
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { label: pasienNama },
                  { label: pasienNoRM },
                  { label: tindakan },
                  { label: dokterPelaksana },
                  ...(ruangan ? [{ label: ruangan }] : []),
                ].map(({ label }, i) => (
                  <span key={i} className="rounded-lg bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Scrollable body ──────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Section A — Identitas */}
              <ICSection letter="A" title="Identitas Pasien & Tindakan" accent="sky" delay={0.05}>
                <div className="space-y-1.5">
                  <InfoRow label="Nama Pasien"     value={pasienNama} />
                  <InfoRow label="No. Rekam Medis" value={pasienNoRM} />
                  <InfoRow label="Tindakan Medis"  value={tindakan} />
                  <InfoRow label="Dokter Pelaksana" value={dokterPelaksana} />
                  {ruangan && <InfoRow label="Ruangan"   value={ruangan} />}
                  <InfoRow label="Tanggal"          value={today} />
                </div>
              </ICSection>

              {/* Section B — Penjelasan */}
              <ICSection letter="B" title="Penjelasan Tindakan Medis" accent="slate" delay={0.1}>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dokter pelaksana telah memberikan penjelasan yang lengkap dan jelas kepada
                  saya/keluarga mengenai tindakan <strong className="text-slate-800">&ldquo;{tindakan}&rdquo;</strong> yang
                  akan dilakukan, mencakup: tujuan tindakan, cara pelaksanaan, durasi yang diperkirakan,
                  serta kondisi yang memerlukan penanganan tambahan.
                  {deskripsiTindakan && (
                    <span className="mt-1 block text-slate-700">{deskripsiTindakan}</span>
                  )}
                </p>
              </ICSection>

              {/* Section C — Risiko */}
              <ICSection letter="C" title="Risiko & Kemungkinan Komplikasi" accent="rose" delay={0.15}>
                <BulletList items={risiko} />
              </ICSection>

              {/* Section D — Manfaat */}
              <ICSection letter="D" title="Manfaat yang Diharapkan" accent="emerald" delay={0.2}>
                <BulletList items={manfaat} />
              </ICSection>

              {/* Section E — Alternatif */}
              <ICSection letter="E" title="Alternatif Tindakan" accent="amber" delay={0.25}>
                <BulletList items={alternatif} />
              </ICSection>

              {/* Section F — Pernyataan */}
              <ICSection letter="F" title="Pernyataan Persetujuan" accent="violet" delay={0.3}>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dengan ini saya/keluarga yang bertanda tangan di bawah ini menyatakan bahwa:
                  (1) Saya telah mendapat penjelasan yang lengkap dari <strong className="text-slate-800">{dokterPelaksana}</strong> mengenai
                  tindakan <strong className="text-slate-800">&ldquo;{tindakan}&rdquo;</strong>.
                  (2) Saya memahami risiko, manfaat, dan alternatif yang telah dijelaskan.
                  (3) Saya memiliki hak untuk menarik kembali persetujuan ini kapan saja sebelum tindakan dilaksanakan.
                  (4) Dengan penuh kesadaran dan <strong className="text-slate-800">tanpa paksaan</strong>, saya
                  menyatakan <span className="font-bold text-violet-700">SETUJU</span> untuk dilaksanakannya tindakan medis tersebut.
                </p>
                <p className="mt-2.5 text-[10px] text-slate-400">
                  Dasar hukum: PMK No. 290/2008 tentang Persetujuan Tindakan Kedokteran.
                </p>
              </ICSection>

              {/* ── Checkbox gate ───────────────────────── */}
              <motion.label
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all",
                  sudahBaca
                    ? "border-emerald-300 bg-emerald-50 shadow-sm shadow-emerald-100"
                    : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/40",
                )}
              >
                <div className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                  sudahBaca ? "border-emerald-500 bg-emerald-500" : "border-slate-300",
                )}>
                  <AnimatePresence>
                    {sudahBaca && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      >
                        <CheckCircle2 size={13} className="text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <input type="checkbox" className="sr-only" checked={sudahBaca}
                  onChange={e => setSudahBaca(e.target.checked)} />
                <div>
                  <p className={cn("text-xs font-bold", sudahBaca ? "text-emerald-800" : "text-slate-700")}>
                    Saya/keluarga telah membaca dan memahami seluruh isi formulir ini
                  </p>
                  <p className={cn("mt-0.5 text-[10px]", sudahBaca ? "text-emerald-600" : "text-slate-400")}>
                    Centang untuk melanjutkan ke bagian tanda tangan
                  </p>
                </div>
              </motion.label>

              {/* ── Signature section ────────────────────── */}
              <motion.div
                animate={{ opacity: sudahBaca ? 1 : 0.35 }}
                transition={{ duration: 0.3 }}
                style={{ pointerEvents: sudahBaca ? "auto" : "none" }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-sky-600" />
                  <p className="text-xs font-bold text-slate-700">Tanda Tangan Persetujuan</p>
                </div>

                <AnimatePresence mode="wait">
                  {capturedSig ? (
                    /* ── Captured state ──────────────────── */
                    <motion.div
                      key="captured"
                      initial={{ opacity: 0, scale: 0.94, y: 8 }}
                      animate={{ opacity: 1, scale: 1,    y: 0 }}
                      exit={{   opacity: 0, scale: 0.94  }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                      className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3"
                    >
                      <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-emerald-200 bg-white">
                        <img src={capturedSig} alt="TTD" className="h-full w-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-700">Tanda tangan berhasil</span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-emerald-600">
                          {sigMethod === "draw" ? "Tanda Tangan Digital" : "Foto TTD Fisik (Auto-Enhanced)"}
                        </p>
                      </div>
                      <motion.button
                        type="button" whileTap={{ scale: 0.96 }}
                        onClick={() => setCapturedSig(null)}
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                      >
                        <RotateCcw size={11} /> Ganti
                      </motion.button>
                    </motion.div>
                  ) : (
                    /* ── Method tabs + pane ──────────────── */
                    <motion.div key="tabs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {/* Tab switcher */}
                      <div className="mb-3 flex gap-1.5 rounded-xl bg-slate-100 p-1">
                        {SIG_METHODS.map(m => {
                          const Icon = m.icon;
                          const active = sigMethod === m.id;
                          return (
                            <motion.button
                              key={m.id} type="button" onClick={() => switchMethod(m.id)}
                              whileTap={{ scale: 0.97 }}
                              className={cn(
                                "relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[11px] font-semibold transition-all",
                                active ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
                              )}
                            >
                              {active && (
                                <motion.div
                                  layoutId="sig-tab-bg"
                                  className="absolute inset-0 rounded-lg bg-white shadow-sm"
                                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                />
                              )}
                              <Icon size={13} className="relative z-10" />
                              <span className="relative z-10">{m.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Pane with direction-aware transition */}
                      <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                          key={sigMethod} custom={direction}
                          variants={{
                            enter:  (d: number) => ({ opacity: 0, x: d * 24 }),
                            center: { opacity: 1, x: 0 },
                            exit:   (d: number) => ({ opacity: 0, x: d * -16 }),
                          }}
                          initial="enter" animate="center" exit="exit"
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          {sigMethod === "draw" ? (
                            <SignatureDrawPane  onCapture={setCapturedSig} />
                          ) : (
                            <WebcamCapturePane onCapture={setCapturedSig} />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* ── Form fields ──────────────────────────── */}
              <motion.div
                animate={{ opacity: sudahBaca ? 1 : 0.35 }}
                transition={{ duration: 0.3 }}
                style={{ pointerEvents: sudahBaca ? "auto" : "none" }}
                className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Data Penanda Tangan & Saksi
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Hubungan dengan Pasien</label>
                    <select
                      value={hubungan}
                      onChange={e => setHubungan(e.target.value as HubunganPenanda)}
                      className={FIELD_CLS}
                    >
                      {HUBUNGAN_OPTIONS.map(h => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Nama Lengkap Penanda</label>
                    <input
                      type="text" value={namaPenanda}
                      onChange={e => setNamaPenanda(e.target.value)}
                      placeholder="Nama sesuai KTP"
                      className={FIELD_CLS}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Nama Saksi</label>
                    <input
                      type="text" value={saksiNama}
                      onChange={e => setSaksiNama(e.target.value)}
                      placeholder="Nama petugas saksi"
                      className={FIELD_CLS}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Jabatan Saksi</label>
                    <select
                      value={saksiJabatan}
                      onChange={e => setSaksiJabatan(e.target.value)}
                      className={FIELD_CLS}
                    >
                      {SAKSI_JABATAN_OPTIONS.map(j => <option key={j}>{j}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Completion hint */}
              <AnimatePresence>
                {!canSave && sudahBaca && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"
                  >
                    <AlertCircle size={13} className="shrink-0 text-amber-500" />
                    <p className="text-[11px] text-amber-700">
                      {!capturedSig
                        ? "Belum ada tanda tangan — pilih metode dan tandatangani terlebih dahulu."
                        : "Lengkapi nama penanda dan nama saksi untuk dapat menyimpan."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom spacer */}
              <div className="h-2" />
            </div>

            {/* ── Footer ──────────────────────────────── */}
            <div className="shrink-0 flex items-center justify-between gap-3 rounded-b-2xl border-t border-slate-100 bg-white px-6 py-4">
              <motion.button
                type="button" onClick={handleClose} whileTap={{ scale: 0.97 }}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </motion.button>

              <div className="flex items-center gap-3">
                {/* Progress chips */}
                <div className="hidden items-center gap-1.5 sm:flex">
                  {[
                    { label: "Baca",       done: sudahBaca },
                    { label: "TTD",        done: !!capturedSig },
                    { label: "Data",       done: !!namaPenanda && !!saksiNama },
                  ].map(({ label, done }) => (
                    <span key={label} className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
                      done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400",
                    )}>
                      {done && <CheckCircle2 size={9} />}
                      {label}
                    </span>
                  ))}
                </div>

                <motion.button
                  type="button" onClick={handleSave}
                  disabled={!canSave}
                  whileTap={canSave ? { scale: 0.97 } : undefined}
                  animate={canSave ? { scale: [1, 1.01, 1] } : { scale: 1 }}
                  transition={canSave ? { repeat: 1, duration: 0.4, delay: 0.2 } : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold shadow-sm transition-all",
                    canSave
                      ? "bg-sky-600 text-white hover:bg-sky-700 shadow-sky-200"
                      : "cursor-not-allowed bg-slate-100 text-slate-400",
                  )}
                >
                  <ShieldCheck size={14} />
                  Simpan Persetujuan
                </motion.button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
