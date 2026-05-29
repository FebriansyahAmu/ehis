"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, AlertTriangle, WifiOff, SearchX,
  Shield, MapPin, Activity, Stethoscope, ClipboardList, Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { BPJSError, SEPRecordExt } from "@/lib/bpjs/bpjsShared";
import type { SEPResult } from "./sepShared";
import { statusChipCls, jnsLabel, klsLabel, asalLabel, fmtTgl, errorLabel } from "./sepShared";

// ── Skeleton ───────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />;
}

function LoadingSkeleton() {
  return (
    <motion.div
      key="skel"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col gap-3.5 p-5"
    >
      <Bone className="h-23 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Bone className="h-24" />
        <Bone className="h-24" />
      </div>
      <Bone className="h-17" />
      <Bone className="h-12" />
    </motion.div>
  );
}

// ── Empty state ────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      key="idle"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 ring-1 ring-emerald-100/80">
        <FileText size={32} className="text-emerald-200" strokeWidth={1.5} />
      </div>
      <div className="max-w-[200px]">
        <p className="text-sm font-semibold text-slate-500">Cari SEP</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
          Masukkan No. SEP untuk melihat detail, verifikasi status, atau mengelola SEP di V-Claim BPJS
        </p>
      </div>
    </motion.div>
  );
}

// ── Error state ────────────────────────────────────────────

function ErrorState({ error, onRetry }: { error: BPJSError; onRetry?: () => void }) {
  const { title, desc, color, retryable } = errorLabel(error);
  const cfg = {
    slate: { wrap: "bg-slate-50 ring-slate-100", icon: "text-slate-300", title: "text-slate-600", desc: "text-slate-400", Icon: SearchX },
    amber: { wrap: "bg-amber-50 ring-amber-100", icon: "text-amber-400", title: "text-amber-700", desc: "text-amber-600", Icon: AlertTriangle },
    rose:  { wrap: "bg-rose-50 ring-rose-100",   icon: "text-rose-400",  title: "text-rose-700",  desc: "text-rose-600",  Icon: WifiOff },
  }[color];

  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl ring-1", cfg.wrap)}>
        <cfg.Icon size={24} className={cfg.icon} strokeWidth={1.8} />
      </div>
      <div>
        <p className={cn("text-sm font-semibold", cfg.title)}>{title}</p>
        <p className={cn("mt-1 max-w-60 text-xs leading-relaxed", cfg.desc)}>{desc}</p>
      </div>
      {retryable && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-600 shadow-sm transition-colors hover:bg-rose-50"
        >
          Coba Lagi
        </button>
      )}
    </motion.div>
  );
}

// ── InfoPair ───────────────────────────────────────────────

function InfoPair({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={cn("mt-0.5 text-sm font-medium text-slate-800", mono && "font-mono text-xs tracking-tight")}>
        {value ?? "—"}
      </p>
    </div>
  );
}

// ── SEPFound ───────────────────────────────────────────────

function SEPFound({ sep, onDelete }: { sep: SEPRecordExt; onDelete?: (noSep: string) => void }) {
  const isKLL      = sep.jaminan && sep.jaminan.lakaLantas !== "0";
  const hasRujukan = !!sep.rujukan.noRujukan;
  const isNaikKelas = !!sep.klsRawat.klsRawatNaik;
  const isDeletable = sep.statusInternal !== "Deleted" && sep.statusInternal !== "Closed";

  return (
    <motion.div
      key="found"
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-3.5 p-4"
    >
      {/* SEP Header */}
      <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-4">
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No. SEP</p>
            <p className="mt-0.5 break-all font-mono text-sm font-bold text-slate-800">{sep.noSEP}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", statusChipCls(sep.statusInternal))}>
              {sep.statusInternal}
            </span>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              sep.jnsPelayanan === "1" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700",
            )}>
              {jnsLabel(sep.jnsPelayanan)}
            </span>
          </div>
        </div>

        {/* Key dates */}
        <div className="mt-3 grid grid-cols-3 gap-3 rounded-xl border border-white/70 bg-white/60 px-3 py-2.5">
          <InfoPair label="Tgl. Terbit"   value={fmtTgl(sep.tglTerbit)} />
          <InfoPair label="Berlaku s/d"   value={fmtTgl(sep.masaBerlaku.to)} />
          <InfoPair label="Tgl. Pulang"   value={sep.tglPulang ? fmtTgl(sep.tglPulang) : "—"} />
        </div>
      </div>

      {/* Poli & DPJP + Kelas Rawat */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200/60 bg-white p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Stethoscope size={12} className="text-emerald-500" strokeWidth={2.3} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Poli & DPJP</p>
          </div>
          <p className="text-sm font-semibold text-slate-800">{sep.poli.tujuan}</p>
          {sep.poli.eksekutif === "1" && (
            <span className="mt-1 inline-block rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
              Eksekutif
            </span>
          )}
          {sep.dpjpLayan && (
            <p className="mt-1.5 text-xs text-slate-500">
              DPJP: <span className="font-mono text-slate-700">{sep.dpjpLayan}</span>
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200/60 bg-white p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Shield size={12} className="text-teal-500" strokeWidth={2.3} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kelas Rawat</p>
          </div>
          <p className="text-sm font-semibold text-slate-800">{klsLabel(sep.klsRawat.klsRawatHak)}</p>
          {isNaikKelas && (
            <div className="mt-1.5 space-y-0.5 text-xs text-slate-500">
              <p>Naik → Kelas {sep.klsRawat.klsRawatNaik}</p>
              <p>Tanggung Jawab: {sep.klsRawat.penanggungJawab ?? "—"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Diagnosa */}
      <div className="rounded-xl border border-slate-200/60 bg-white p-3.5">
        <div className="mb-2.5 flex items-center gap-1.5">
          <ClipboardList size={12} className="text-slate-400" strokeWidth={2.3} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Diagnosa Awal</p>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 font-mono text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
            {sep.diagAwal}
          </span>
          <p className="text-sm text-slate-700">{sep.diagAwalNama ?? "—"}</p>
        </div>
      </div>

      {/* Identitas & Kontak */}
      <div className="rounded-xl border border-slate-200/60 bg-white p-3.5">
        <div className="mb-2.5 flex items-center gap-1.5">
          <Activity size={12} className="text-slate-400" strokeWidth={2.3} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Identitas & Kontak</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <InfoPair label="No. Kartu"       value={sep.noKartu} mono />
          <InfoPair label="No. Rekam Medis" value={sep.noMR ?? "—"} mono />
          <InfoPair label="Telepon"         value={sep.noTelp ?? "—"} mono />
        </div>
      </div>

      {/* Rujukan — conditional */}
      {hasRujukan && (
        <motion.div
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="rounded-xl border border-teal-200/60 bg-teal-50/30 p-3.5"
        >
          <div className="mb-2.5 flex items-center gap-1.5">
            <MapPin size={12} className="text-teal-600" strokeWidth={2.3} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Rujukan</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoPair label="Asal Rujukan" value={asalLabel(sep.rujukan.asalRujukan)} />
            <InfoPair label="No. Rujukan"  value={sep.rujukan.noRujukan} mono />
            {sep.rujukan.tglRujukan  && <InfoPair label="Tgl. Rujukan"  value={fmtTgl(sep.rujukan.tglRujukan)} />}
            {sep.rujukan.ppkRujukan  && <InfoPair label="PPK Rujukan"   value={sep.rujukan.ppkRujukan} mono />}
          </div>
        </motion.div>
      )}

      {/* Jaminan KLL — conditional */}
      {isKLL && sep.jaminan && (
        <motion.div
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="rounded-xl border border-amber-200/60 bg-amber-50/30 p-3.5"
        >
          <div className="mb-2.5 flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-amber-600" strokeWidth={2.3} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Jaminan Kecelakaan</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoPair label="No. Laporan Polisi" value={sep.jaminan.noLP ?? "—"} mono />
            {sep.jaminan.penjamin?.tglKejadian && (
              <InfoPair label="Tgl. Kejadian" value={fmtTgl(sep.jaminan.penjamin.tglKejadian)} />
            )}
            {sep.jaminan.penjamin?.keterangan && (
              <div className="col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Keterangan</p>
                <p className="mt-0.5 text-xs text-slate-700">{sep.jaminan.penjamin.keterangan}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Catatan — conditional */}
      {sep.catatan && (
        <div className="rounded-xl border border-slate-200/60 bg-white p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Catatan</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{sep.catatan}</p>
        </div>
      )}

      {/* Audit trail */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Audit Trail</p>
        <div className="space-y-1 text-[11px] text-slate-500">
          <p>
            Dibuat: <span className="font-medium text-slate-700">{sep.audit.createdBy}</span>
            {" · "}{fmtTgl(sep.audit.createdAt?.slice(0, 10))}
          </p>
          {sep.audit.updatedBy && (
            <p>
              Diperbarui: <span className="font-medium text-slate-700">{sep.audit.updatedBy}</span>
              {" · "}{fmtTgl(sep.audit.updatedAt?.slice(0, 10))}
            </p>
          )}
          {sep.audit.deletedBy && (
            <p className="text-rose-500">
              Dihapus: <span className="font-medium">{sep.audit.deletedBy}</span>
              {" · "}{fmtTgl(sep.audit.deletedAt?.slice(0, 10))}
            </p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="grid grid-cols-2 gap-2 pt-0.5"
      >
        {isDeletable ? (
          <button
            type="button"
            onClick={() => onDelete?.(sep.noSEP)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-xs font-semibold text-rose-600 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50"
          >
            <Trash2 size={12} strokeWidth={2.5} />
            Hapus SEP
          </button>
        ) : (
          <div className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-xs font-semibold text-slate-400">
            <Trash2 size={12} strokeWidth={2.5} />
            Tidak Dapat Dihapus
          </div>
        )}
        <a
          href={`/ehis-bpjs/vclaim/sep?update=${encodeURIComponent(sep.noSEP)}`}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-semibold text-white shadow-sm shadow-emerald-200/60 transition-all hover:bg-emerald-600 hover:shadow-md hover:shadow-emerald-300/40"
        >
          Update Tgl Pulang
        </a>
      </motion.div>
    </motion.div>
  );
}

// ── Main export ────────────────────────────────────────────

interface SEPDetailCardProps {
  result: SEPResult;
  onRetry?: () => void;
  onDelete?: (noSep: string) => void;
}

export default function SEPDetailCard({ result, onRetry, onDelete }: SEPDetailCardProps) {
  return (
    <div className="h-full">
      <AnimatePresence mode="wait">
        {result.status === "idle"    && <EmptyState />}
        {result.status === "loading" && <LoadingSkeleton />}
        {result.status === "found"   && <SEPFound key="found" sep={result.sep} onDelete={onDelete} />}
        {result.status === "error"   && <ErrorState key="error" error={result.error} onRetry={onRetry} />}
      </AnimatePresence>
    </div>
  );
}
