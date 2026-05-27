"use client";

/**
 * BandingFormModal — EK6.2 ajukan banding dari klaim Rejected.
 *
 * Layout (max-w-4xl · max-h-[92vh]):
 *   ┌─ Header: Scale icon · noKlaim · alasan rejection ──────────────┐
 *   ├─────────────────────────────┬──────────────────────────────────┤
 *   │ LEFT (read-only context)    │ RIGHT (form input)               │
 *   │  - Info klaim (2-col grid)  │  - Alasan rejection (read-only)  │
 *   │  - Grouper result chip      │  - Alasan banding (textarea)     │
 *   │  - Tarif vs RS              │  - Upload dokumen (stub)         │
 *   │  - Rejection reason card    │  - Tingkat banding (1/2 toggle)  │
 *   ├─────────────────────────────┴──────────────────────────────────┤
 *   │ Footer: karakter counter  [Batal] [Ajukan Banding]             │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Form validation:
 *   - alasanBanding ≥ 50 karakter (hard block submit)
 *   - tingkat: default 1, switch ke 2 jika sudah ada T1 rejected
 */

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Scale,
  AlertTriangle,
  FileUp,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/eklaim/money";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";

// ── Animation Variants ────────────────────────────────────

const BACKDROP_V = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const PANEL_V = {
  hidden: { opacity: 0, scale: 0.97, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 8 },
};

// ── Min chars for valid alasan banding ───────────────────

const MIN_CHARS = 50;

// ── Sub-components ────────────────────────────────────────

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="w-[110px] shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-slate-400">:</span>
      <span className={cn("text-sm text-slate-800", mono && "font-mono font-semibold")}>
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </p>
  );
}

function FieldLabel({ htmlFor, children, required }: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-slate-700">
      {children}
      {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

// ── File Upload Stub ──────────────────────────────────────

interface UploadedFile {
  name: string;
  size: number;
}

function FileUploadArea({
  files,
  onAdd,
  onRemove,
}: {
  files: UploadedFile[];
  onAdd: (f: UploadedFile[]) => void;
  onRemove: (idx: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).map((f) => ({
      name: f.name,
      size: f.size,
    }));
    onAdd(picked);
    e.target.value = "";
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-4 py-5 text-center transition-colors hover:border-teal-300 hover:bg-teal-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
      >
        <FileUp size={20} className="text-slate-400" />
        <p className="text-sm font-medium text-slate-600">
          Klik untuk unggah dokumen pendukung
        </p>
        <p className="text-[11.5px] text-slate-400">
          PDF, JPG, PNG — maks 10 MB / file
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        className="sr-only"
        onChange={handleChange}
        aria-label="Upload dokumen pendukung"
      />

      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((f, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                <span className="truncate text-sm text-slate-700">{f.name}</span>
                <span className="shrink-0 text-[11.5px] text-slate-400">
                  ({(f.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="ml-2 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-rose-600"
                aria-label={`Hapus ${f.name}`}
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  claim: ClaimRecord;
  /** If claim already has a rejected Tingkat 1, default to Tingkat 2. */
  defaultTingkat?: 1 | 2;
  onSuccess?: () => void;
}

// ── Main Modal ────────────────────────────────────────────

export default function BandingFormModal({
  open,
  onClose,
  claim,
  defaultTingkat = 1,
  onSuccess,
}: Props) {
  const [tingkat, setTingkat] = useState<1 | 2>(defaultTingkat);
  const [alasan, setAlasan] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const charCount = alasan.length;
  const isValid = charCount >= MIN_CHARS;

  const tarif = claim.iDRG?.tarifAktual ?? claim.inaCbgLegacy?.tarif.kelas2 ?? 0n;
  const grouperCode = claim.eraGrouper === "iDRG"
    ? `iDRG ${claim.iDRG?.code ?? "—"}`
    : `CBG ${claim.inaCbgLegacy?.code ?? "—"}`;

  function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    setTimeout(() => {
      console.info(`[Banding] Klaim ${claim.noKlaim} · Tingkat ${tingkat} · alasan: "${alasan.slice(0, 40)}..." · ${files.length} dok`);
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSubmitted(false);
        setAlasan("");
        setFiles([]);
        setTingkat(defaultTingkat);
      }, 1400);
    }, 900);
  }

  function handleClose() {
    if (submitting) return;
    onClose();
    setAlasan("");
    setFiles([]);
    setTingkat(defaultTingkat);
    setSubmitted(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-60 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
          aria-label="Ajukan Banding Klaim"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
            variants={BACKDROP_V}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.18 }}
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
            style={{ maxHeight: "92vh" }}
            variants={PANEL_V}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {/* ── Header ── */}
            <div className="relative flex shrink-0 items-center justify-between overflow-hidden border-b border-slate-200 bg-linear-to-br from-white via-teal-50/30 to-sky-50/20 px-5 py-3">
              <motion.div
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-400 via-amber-400 to-rose-400 bg-size-[200%_100%]"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-sky-600 shadow-sm ring-1 ring-teal-400/30">
                  <Scale size={15} strokeWidth={2.3} className="text-white" />
                </span>
                <div>
                  <h2 className="text-[13.5px] font-extrabold leading-tight tracking-tight text-slate-900">
                    Ajukan Banding Klaim
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    <span className="font-mono">{claim.noKlaim}</span>
                    {" · "}
                    {claim.penjamin.nama}
                    {" · "}
                    Tingkat {tingkat}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                aria-label="Tutup"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:opacity-40"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            {/* ── Body: 2-col ── */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* LEFT: read-only klaim context */}
              <div className="flex w-[340px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-slate-50/60 p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                {/* Klaim info */}
                <SectionLabel>Informasi Klaim</SectionLabel>
                <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5">
                  <InfoRow label="No. Rekam Medis" value={claim.pasienId} mono />
                  <InfoRow label="No. Kunjungan"   value={claim.kunjunganId} mono />
                  <InfoRow label="Jenis Layanan"   value={claim.tipePelayanan} />
                  <InfoRow
                    label="Penjamin"
                    value={`${claim.penjamin.nama} (${claim.penjamin.tipe.toUpperCase()})`}
                  />
                  <InfoRow label="LOS"             value={`${claim.los} hari`} />
                  <InfoRow
                    label="Diagnosa Primer"
                    value={`${claim.diagnosaPrimer.kode} — ${claim.diagnosaPrimer.deskripsi}`}
                  />
                </div>

                {/* Grouper result */}
                <div className="mt-4">
                  <SectionLabel>Hasil Grouper</SectionLabel>
                  <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5">
                    <div className="rounded-lg bg-teal-50 px-3 py-2 text-center ring-1 ring-teal-200">
                      <p className="text-[10px] text-slate-500">Kode</p>
                      <p className="font-mono text-[15px] font-black text-teal-700">{grouperCode}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500">Tarif Grouper</p>
                      <p className="text-sm font-bold text-emerald-700">{formatRupiah(tarif)}</p>
                      <p className="text-[11px] text-slate-500">Tarif RS: {formatRupiah(claim.tarifRS)}</p>
                    </div>
                  </div>
                </div>

                {/* Alasan Rejection (read-only) */}
                {claim.rejectionReason && (
                  <div className="mt-4">
                    <SectionLabel>Alasan Penolakan BPJS</SectionLabel>
                    <div className="flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-rose-500" />
                      <p className="text-sm leading-relaxed text-rose-800">{claim.rejectionReason}</p>
                    </div>
                  </div>
                )}

              </div>

              {/* RIGHT: form */}
              <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-5 [scrollbar-width:thin]">

                {/* Success state */}
                <AnimatePresence>
                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center"
                    >
                      <CheckCircle2 size={44} className="text-emerald-500" />
                      <p className="text-base font-bold text-slate-800">Banding Berhasil Diajukan</p>
                      <p className="text-sm text-slate-500">
                        Status klaim diubah ke <strong>Banding Submitted</strong>.
                        Tim verifikator BPJS akan merespons dalam 14 hari kerja.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!submitted && (
                  <div className="space-y-5">

                    {/* 1. Tingkat Banding */}
                    <div>
                      <FieldLabel>Tingkat Banding</FieldLabel>
                      <div
                        role="radiogroup"
                        aria-label="Pilih tingkat banding"
                        className="inline-flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5"
                      >
                        {([1, 2] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            role="radio"
                            aria-checked={tingkat === t}
                            onClick={() => setTingkat(t)}
                            className={cn(
                              "rounded-md px-5 py-2 text-sm font-semibold transition-all duration-150",
                              tingkat === t
                                ? "bg-white text-teal-700 shadow-sm ring-1 ring-teal-200"
                                : "text-slate-600 hover:text-slate-800",
                            )}
                          >
                            Tingkat {t}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1.5 text-[11.5px] text-slate-500">
                        {tingkat === 1
                          ? "Verifikator BPJS cabang — batas waktu 14 hari kerja (PMK 26/2021)"
                          : "Eskalasi ke kantor pusat BPJS — dipilih jika Tingkat 1 sudah ditolak"}
                      </p>
                    </div>

                    {/* 2. Alasan Banding */}
                    <div>
                      <FieldLabel htmlFor="alasan-banding" required>
                        Alasan Banding
                      </FieldLabel>
                      <textarea
                        id="alasan-banding"
                        value={alasan}
                        onChange={(e) => setAlasan(e.target.value)}
                        rows={7}
                        placeholder={
                          "Jelaskan dasar keberatan secara rinci:\n" +
                          "• Apa yang tidak tepat dari alasan penolakan?\n" +
                          "• Dokumen / regulasi apa yang mendukung klaim ini?\n" +
                          "• Referensi Pedoman iDRG 2025 / PMK / surat edaran BPJS jika ada."
                        }
                        className={cn(
                          "w-full resize-none rounded-lg border bg-white px-3.5 py-3 text-sm text-slate-800 placeholder:text-slate-400",
                          "transition-colors focus:outline-none focus:ring-2",
                          isValid
                            ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-500/15"
                            : charCount > 0
                            ? "border-amber-300 focus:border-amber-400 focus:ring-amber-500/15"
                            : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/15",
                        )}
                      />

                      {/* Char counter + validation feedback */}
                      <div className="mt-1.5 flex items-center justify-between">
                        <p
                          className={cn(
                            "text-[11.5px]",
                            isValid
                              ? "text-emerald-600"
                              : charCount > 0
                              ? "text-amber-600"
                              : "text-slate-400",
                          )}
                        >
                          {isValid ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={11} /> Alasan sudah cukup detail
                            </span>
                          ) : charCount > 0 ? (
                            <span className="flex items-center gap-1">
                              <XCircle size={11} /> Minimal {MIN_CHARS - charCount} karakter lagi
                            </span>
                          ) : (
                            `Minimal ${MIN_CHARS} karakter`
                          )}
                        </p>
                        <p className="tabular-nums text-[11.5px] text-slate-400">
                          {charCount} kar.
                        </p>
                      </div>
                    </div>

                    {/* 3. Upload Dokumen Pendukung */}
                    <div>
                      <FieldLabel>Dokumen Pendukung</FieldLabel>
                      <FileUploadArea
                        files={files}
                        onAdd={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
                        onRemove={(idx) => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                      />
                      <p className="mt-1.5 text-[11.5px] text-slate-500">
                        Opsional — lampirkan surat keterangan DPJP, hasil lab, atau referensi regulasi.
                      </p>
                    </div>

                    {/* 4. Summary before submit */}
                    {isValid && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                        className="rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-teal-800">Ringkasan Pengajuan</p>
                        <ul className="mt-1.5 space-y-0.5 text-[12.5px] text-teal-700">
                          <li>• Klaim: <span className="font-mono">{claim.noKlaim}</span></li>
                          <li>• Tingkat banding: <span className="font-semibold">Tingkat {tingkat}</span></li>
                          <li>• Dokumen pendukung: <span className="font-semibold">{files.length} file</span></li>
                          <li>• Alasan: {charCount} karakter</li>
                        </ul>
                      </motion.div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white/90 px-5 py-3">
              <p className="text-[11.5px] text-slate-500">
                Ref: <span className="font-medium text-slate-600">PMK 26/2021</span> · Banding berlaku maks. <strong>30 hari</strong> sejak penolakan
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                >
                  Batal
                </button>
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isValid || submitting || submitted}
                  whileHover={isValid && !submitting ? { scale: 1.02 } : {}}
                  whileTap={isValid && !submitting ? { scale: 0.98 } : {}}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold shadow-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50",
                    isValid && !submitting
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "cursor-not-allowed bg-slate-200 text-slate-400",
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                      Mengajukan...
                    </>
                  ) : (
                    <>
                      <Scale size={13} strokeWidth={2.2} />
                      Ajukan Banding T{tingkat}
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
