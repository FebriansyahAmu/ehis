"use client";

/**
 * SubmissionTab — Tab Submission (EK3.5).
 *
 * Alur BPJS:
 *   1. Eligibility check via vClaimAdapter.getEligibility (SEP + peserta aktif)
 *   2. Pre-submit checklist — berkas · koding · grouper · eligibility
 *   3. Batch picker — pilih batch terbuka atau buat baru
 *   4. Submit primary sky button → hasil inline
 *
 * Non-BPJS: panduan submission manual per penjamin.
 */

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Send,
  RefreshCw,
  ShieldCheck,
  FileCheck,
  Scale,
  WifiOff,
  BadgeCheck,
  Layers,
  Stethoscope,
  ClipboardCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/eklaim/money";
import type { ClaimRecord, ClaimError } from "@/lib/eklaim/eklaimShared";
import {
  getEligibility,
  submitClaim,
  toEligibilityDomain,
  type EligibilityDomainResult,
} from "@/lib/eklaim/vClaimAdapter";
import { computeBerkasProgress, fmtDateShort } from "../claimDetailShared";

// ── Mock Batches ───────────────────────────────────────────

interface BatchOption {
  id: string;
  label: string;
  periodeKlaim: string;
  count: number;
  isNew?: boolean;
}

const MOCK_OPEN_BATCHES: ReadonlyArray<BatchOption> = [
  { id: "BATCH-2026-05-A", label: "Batch Mei 2026 — A", periodeKlaim: "2026-05", count: 12 },
  { id: "BATCH-2026-05-B", label: "Batch Mei 2026 — B", periodeKlaim: "2026-05", count: 3 },
  { id: "BATCH-NEW", label: "Buat Batch Baru…", periodeKlaim: "2026-05", count: 0, isNew: true },
];

// ── Main ───────────────────────────────────────────────────

interface Props {
  claim: ClaimRecord;
}

export default function SubmissionTab({ claim }: Props) {
  const isBpjs = claim.penjamin.tipe === "bpjs";

  const [eligibility, setEligibility] = useState<EligibilityDomainResult | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  const [selectedBatchId, setSelectedBatchId] = useState(MOCK_OPEN_BATCHES[0].id);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    ok: boolean;
    noKlaim: string;
    statusBPJS: string;
    message: string;
  } | null>(null);

  const berkasProgress = useMemo(() => computeBerkasProgress(claim.berkas), [claim.berkas]);
  const kodingOk = !!claim.diagnosaPrimer;
  const grouperOk = claim.eraGrouper === "iDRG" ? !!claim.iDRG : !!claim.inaCbgLegacy;
  const eligibilityOk = eligibility?.valid === true;

  const disabledReason = useMemo(() => {
    if (!isBpjs) return "Hanya klaim BPJS yang bisa disubmit via tombol ini.";
    if (claim.statusPenjamin !== "Belum Submit")
      return `Status klaim "${claim.statusPenjamin}" — tidak bisa disubmit.`;
    if (!berkasProgress.isComplete)
      return `Berkas wajib belum lengkap (${berkasProgress.readyWajib}/${berkasProgress.totalWajib}).`;
    if (!kodingOk) return "Koding diagnosa primer belum diisi.";
    if (!grouperOk) return "Grouper belum di-resolve — buka Tab Grouper.";
    if (!eligibilityOk) return "Cek eligibility peserta terlebih dahulu.";
    return undefined;
  }, [isBpjs, claim.statusPenjamin, berkasProgress, kodingOk, grouperOk, eligibilityOk]);

  const canSubmit = !disabledReason && !submitLoading && !submitResult;

  const handleCheckEligibility = useCallback(async () => {
    const sep = claim.penjamin.sep;
    if (!sep) return;
    setEligibilityLoading(true);
    setEligibilityError(null);
    try {
      const res = await getEligibility(
        sep.noKartu,
        sep.tglTerbit,
        claim.tipePelayanan === "RJ" ? 2 : 1,
      );
      if (!res.ok) { setEligibilityError(mapClaimError(res.error)); return; }
      if (res.value.metaData.code !== "200" || !res.value.response) {
        setEligibilityError(res.value.metaData.message);
        return;
      }
      setEligibility(
        toEligibilityDomain(res.value.response, {
          kelas: claim.kelas,
          tingkat: claim.tingkatKompetensiRS,
        }),
      );
    } finally {
      setEligibilityLoading(false);
    }
  }, [claim]);

  const handleSubmit = useCallback(async () => {
    setSubmitLoading(true);
    setSubmitResult(null);
    try {
      const res = await submitClaim(claim, selectedBatchId);
      if (!res.ok) {
        setSubmitResult({
          ok: false,
          noKlaim: claim.noKlaim,
          statusBPJS: "—",
          message: mapClaimError(res.error),
        });
        return;
      }
      const resp = res.value.response;
      setSubmitResult({
        ok: res.value.metaData.code === "200",
        noKlaim: resp?.noKlaim ?? claim.noKlaim,
        statusBPJS: resp?.statusBPJS ?? "Pending Verifikasi",
        message: res.value.metaData.message,
      });
    } finally {
      setSubmitLoading(false);
    }
  }, [claim, selectedBatchId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4"
    >
      <div>
        <h2 className="text-[15px] font-bold text-slate-800">Submission</h2>
        <p className="mt-0.5 text-[12.5px] text-slate-500">
          Eligibility check · pre-submit checklist · kirim klaim ke BPJS.
        </p>
      </div>

      {!isBpjs ? (
        <NonBpjsCard tipe={claim.penjamin.tipe} nama={claim.penjamin.nama} />
      ) : (
        <>
          <EligibilitySection
            claim={claim}
            eligibility={eligibility}
            loading={eligibilityLoading}
            error={eligibilityError}
            onCheck={handleCheckEligibility}
          />
          <PreSubmitChecklist
            berkasProgress={berkasProgress}
            kodingOk={kodingOk}
            grouperOk={grouperOk}
            eligibilityOk={eligibilityOk}
          />
          <BatchPickerSection
            selectedBatchId={selectedBatchId}
            onSelect={setSelectedBatchId}
          />
          <SubmitSection
            disabledReason={disabledReason}
            canSubmit={canSubmit}
            loading={submitLoading}
            result={submitResult}
            onSubmit={handleSubmit}
            onRetry={() => setSubmitResult(null)}
          />
        </>
      )}
    </motion.div>
  );
}

// ── Error mapper ───────────────────────────────────────────

function mapClaimError(err: ClaimError): string {
  switch (err.type) {
    case "NetworkError":
      return `Jaringan: ${err.message}${err.retryable ? " (coba lagi)" : ""}`;
    case "AuthError":
      return `Auth gagal: ${err.message}`;
    case "ValidationError":
      return `Validasi (${err.field}): ${err.message}`;
    case "EligibilityError":
      return `Eligibility: ${err.reason}`;
    case "DuplicateClaimError":
      return `Duplikat dengan ${err.existingClaimId}`;
    case "ConcurrencyError":
      return `Conflict versi v${err.attemptedVersion} vs v${err.currentVersion}`;
    case "GrouperError":
      return `Grouper: ${err.message}`;
  }
}

// ── EligibilitySection ─────────────────────────────────────

function EligibilitySection({
  claim,
  eligibility,
  loading,
  error,
  onCheck,
}: {
  claim: ClaimRecord;
  eligibility: EligibilityDomainResult | null;
  loading: boolean;
  error: string | null;
  onCheck: () => void;
}) {
  const sep = claim.penjamin.sep;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} strokeWidth={2} className="text-sky-600" />
          <span className="text-[12.5px] font-bold text-slate-700">Eligibility Peserta</span>
        </div>
        <button
          type="button"
          onClick={onCheck}
          disabled={loading || !sep}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-[12px] font-semibold transition-colors",
            loading || !sep
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : "bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800",
          )}
        >
          {loading
            ? <Loader2 size={12} className="animate-spin" />
            : <RefreshCw size={12} strokeWidth={2.5} />}
          {loading ? "Mengecek…" : eligibility ? "Refresh" : "Cek Eligibility"}
        </button>
      </div>

      {sep ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-4">
          <InfoPair label="No. SEP" value={sep.noSEP} mono />
          <InfoPair label="No. Kartu" value={sep.noKartu} mono />
          <InfoPair label="Tgl Terbit" value={fmtDateShort(sep.tglTerbit)} />
          <InfoPair
            label="Masa Berlaku"
            value={`${fmtDateShort(sep.masaBerlaku.from)} – ${fmtDateShort(sep.masaBerlaku.to)}`}
          />
        </div>
      ) : (
        <p className="px-4 py-3 text-[12.5px] text-amber-700">
          SEP tidak tersedia pada klaim ini.
        </p>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 border-t border-rose-100 bg-rose-50 px-4 py-3"
          >
            <WifiOff size={13} className="mt-0.5 shrink-0 text-rose-600" />
            <div>
              <p className="text-[12.5px] font-semibold text-rose-800">Gagal cek eligibility</p>
              <p className="text-[12px] text-rose-600">{error}</p>
            </div>
          </motion.div>
        )}

        {eligibility && !error && (
          <motion.div
            key="ok"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "grid grid-cols-2 gap-x-4 gap-y-2 border-t px-4 py-3 sm:grid-cols-4",
              eligibility.valid
                ? "border-emerald-100 bg-emerald-50/40"
                : "border-rose-100 bg-rose-50/40",
            )}
          >
            <div className="col-span-2 flex items-center gap-2 sm:col-span-4">
              {eligibility.valid
                ? <BadgeCheck size={14} className="shrink-0 text-emerald-600" />
                : <XCircle size={14} className="shrink-0 text-rose-600" />}
              <span
                className={cn(
                  "text-[12.5px] font-bold",
                  eligibility.valid ? "text-emerald-800" : "text-rose-800",
                )}
              >
                {eligibility.valid ? "Peserta AKTIF — Eligible" : "Peserta tidak eligible"}
              </span>
              {eligibility.remark && (
                <span className="text-[12px] text-slate-500">({eligibility.remark})</span>
              )}
            </div>
            <InfoPair label="Kelas Dijamin" value={eligibility.kelasDijamin} />
            <InfoPair
              label="Plafon"
              value={eligibility.plafon ? formatRupiah(eligibility.plafon) : "—"}
            />
            <InfoPair
              label="Sisa Hari Rawat"
              value={
                eligibility.sisaHariRawat !== undefined
                  ? `${eligibility.sisaHariRawat} hari`
                  : "—"
              }
            />
            <InfoPair
              label="Tingkat Kompetensi RS"
              value={eligibility.tingkatKompetensiRSDijamin}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── PreSubmitChecklist ─────────────────────────────────────

interface ChecklistItemData {
  label: string;
  sublabel: string;
  ok: boolean;
  icon: LucideIcon;
}

function PreSubmitChecklist({
  berkasProgress,
  kodingOk,
  grouperOk,
  eligibilityOk,
}: {
  berkasProgress: ReturnType<typeof computeBerkasProgress>;
  kodingOk: boolean;
  grouperOk: boolean;
  eligibilityOk: boolean;
}) {
  const items: ChecklistItemData[] = [
    {
      label: "Berkas wajib lengkap",
      sublabel: berkasProgress.isComplete
        ? `${berkasProgress.totalWajib}/${berkasProgress.totalWajib} berkas siap`
        : `${berkasProgress.readyWajib}/${berkasProgress.totalWajib} berkas siap`,
      ok: berkasProgress.isComplete,
      icon: FileCheck,
    },
    {
      label: "Koding diagnosa final",
      sublabel: kodingOk ? "Diagnosa primer tersedia" : "Diagnosa primer belum diisi",
      ok: kodingOk,
      icon: Stethoscope,
    },
    {
      label: "Grouper hasil resolved",
      sublabel: grouperOk ? "Hasil grouper tersedia" : "Jalankan grouper di Tab Grouper",
      ok: grouperOk,
      icon: Scale,
    },
    {
      label: "Eligibility peserta valid",
      sublabel: eligibilityOk
        ? "Status peserta AKTIF"
        : "Cek eligibility di atas terlebih dahulu",
      ok: eligibilityOk,
      icon: ShieldCheck,
    },
  ];

  const doneCount = items.filter((i) => i.ok).length;
  const allDone = doneCount === items.length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={14} strokeWidth={2} className="text-slate-600" />
          <span className="text-[12.5px] font-bold text-slate-700">Pre-Submit Checklist</span>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-bold",
            allDone ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
          )}
        >
          {doneCount}/{items.length} siap
        </span>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.18 }}
              className={cn("flex items-center gap-3 px-4 py-2.5", !item.ok && "bg-rose-50/20")}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  item.ok ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400",
                )}
              >
                <Icon size={13} strokeWidth={2.2} />
              </div>
              <div className="flex-1">
                <p
                  className={cn(
                    "text-[13px] font-semibold",
                    item.ok ? "text-slate-800" : "text-slate-600",
                  )}
                >
                  {item.label}
                </p>
                <p className="text-[11.5px] text-slate-400">{item.sublabel}</p>
              </div>
              {item.ok
                ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                : <XCircle size={16} className="shrink-0 text-slate-300" />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── BatchPickerSection ─────────────────────────────────────

function BatchPickerSection({
  selectedBatchId,
  onSelect,
}: {
  selectedBatchId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <Layers size={13} strokeWidth={2} className="text-slate-500" />
        <span className="text-[12.5px] font-bold text-slate-700">Pilih Batch Submission</span>
        <span className="ml-auto text-[11px] text-slate-400">
          Max tgl 10 bulan berikut (Permenkes 76/2016)
        </span>
      </div>
      <div className="p-4">
        <div className="grid gap-2 sm:grid-cols-3">
          {MOCK_OPEN_BATCHES.map((batch) => {
            const isSelected = batch.id === selectedBatchId;
            return (
              <button
                key={batch.id}
                type="button"
                onClick={() => onSelect(batch.id)}
                className={cn(
                  "flex flex-col rounded-xl border px-3 py-2.5 text-left transition-colors",
                  isSelected
                    ? "border-sky-400 bg-sky-50 ring-1 ring-sky-200"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <span
                  className={cn(
                    "text-[12.5px] font-semibold",
                    isSelected ? "text-sky-800" : "text-slate-700",
                  )}
                >
                  {batch.label}
                </span>
                {!batch.isNew && (
                  <span
                    className={cn(
                      "mt-0.5 text-[11.5px]",
                      isSelected ? "text-sky-600" : "text-slate-400",
                    )}
                  >
                    {batch.count} klaim · {batch.periodeKlaim}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── SubmitSection ──────────────────────────────────────────

function SubmitSection({
  disabledReason,
  canSubmit,
  loading,
  result,
  onSubmit,
  onRetry,
}: {
  disabledReason: string | undefined;
  canSubmit: boolean;
  loading: boolean;
  result: { ok: boolean; noKlaim: string; statusBPJS: string; message: string } | null;
  onSubmit: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <Send size={13} strokeWidth={2} className="text-slate-500" />
        <span className="text-[12.5px] font-bold text-slate-700">Submit ke BPJS</span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        {disabledReason && !result && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-[12.5px] text-amber-700">{disabledReason}</p>
          </div>
        )}

        {!result && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || loading}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13.5px] font-bold transition-all",
              canSubmit && !loading
                ? "bg-sky-600 text-white shadow-sm hover:bg-sky-700 active:bg-sky-800"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            {loading
              ? <Loader2 size={15} className="animate-spin" />
              : <Send size={15} strokeWidth={2.5} />}
            {loading ? "Mengirim ke BPJS…" : "Submit ke BPJS"}
          </button>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-4",
                result.ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50",
              )}
            >
              <div className="flex items-start gap-2.5">
                {result.ok
                  ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  : <XCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />}
                <div>
                  <p
                    className={cn(
                      "text-[13.5px] font-bold",
                      result.ok ? "text-emerald-800" : "text-rose-800",
                    )}
                  >
                    {result.ok ? "Klaim berhasil disubmit" : "Gagal submit klaim"}
                  </p>
                  <p
                    className={cn(
                      "text-[12.5px]",
                      result.ok ? "text-emerald-700" : "text-rose-700",
                    )}
                  >
                    {result.message}
                  </p>
                </div>
              </div>
              {result.ok && (
                <div className="grid grid-cols-2 gap-2">
                  <InfoPair label="No. Klaim BPJS" value={result.noKlaim} mono />
                  <InfoPair label="Status BPJS" value={result.statusBPJS} />
                </div>
              )}
              {!result.ok && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 self-start rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <RefreshCw size={11} strokeWidth={2.5} />
                  Coba Lagi
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── NonBpjsCard ────────────────────────────────────────────

function NonBpjsCard({ tipe, nama }: { tipe: string; nama: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
      <div className="flex items-start gap-2.5">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="text-[13.5px] font-bold text-amber-900">
            Penjamin Non-BPJS — {nama}
          </p>
          <p className="mt-0.5 text-[12.5px] text-amber-700">
            Submit klaim <strong>{tipe}</strong> dilakukan secara manual sesuai SLA
            dan format masing-masing penjamin. Catat nomor klaim & update status setelah
            ada konfirmasi resmi dari penjamin.
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-amber-200 bg-white px-4 py-3">
        <p className="text-[12.5px] font-semibold text-slate-700">
          Langkah submission manual:
        </p>
        <ol className="mt-1.5 list-inside list-decimal space-y-1 text-[12px] text-slate-600">
          <li>Cetak berkas klaim — Tab Berkas → Generate Berkas</li>
          <li>Kirim ke kantor / portal penjamin sesuai ketentuan masing-masing</li>
          <li>Catat nomor klaim & estimasi persetujuan dari penjamin</li>
          <li>Update status klaim di EHIS setelah ada notifikasi resmi</li>
        </ol>
      </div>
    </div>
  );
}

// ── InfoPair ───────────────────────────────────────────────

function InfoPair({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={cn("text-[13px] text-slate-800", mono ? "font-mono" : "font-semibold")}>
        {value}
      </p>
    </div>
  );
}
