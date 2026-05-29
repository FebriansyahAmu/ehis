"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, User, Shield, MapPin, Activity,
  CreditCard, ArrowRight, AlertTriangle, WifiOff, SearchX,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { PesertaRecord, BPJSError } from "@/lib/bpjs/bpjsShared";
import type { KepesertaanResult } from "./kepesertaanShared";
import {
  kelasChipCls, jenisChipCls, statusChipCls,
  fmtTgl, sexLabel, errorLabel,
} from "./kepesertaanShared";

// ── Utils ──────────────────────────────────────────────────

function getInitials(nama: string): string {
  return nama.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function membershipPct(tmt: string | null, tat: string | null): number {
  if (!tmt || !tat) return 0;
  const now   = Date.now();
  const start = new Date(tmt).getTime();
  const end   = new Date(tat).getTime();
  if (end <= start || now >= end) return 0;
  if (now <= start) return 100;
  return Math.round(((end - now) / (end - start)) * 100);
}

function barCls(pct: number, aktif: boolean): string {
  if (!aktif || pct === 0) return "bg-rose-400";
  if (pct < 25) return "bg-amber-400";
  return "bg-emerald-400";
}

function barTextCls(pct: number, aktif: boolean): string {
  if (!aktif || pct === 0) return "text-rose-500";
  if (pct < 25) return "text-amber-500";
  return "text-emerald-600";
}

// ── Skeleton ───────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />;
}

function LoadingSkeleton() {
  return (
    <motion.div
      key="skel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-3.5 p-5"
    >
      <Bone className="h-23 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Bone className="h-28" />
        <Bone className="h-28" />
      </div>
      <Bone className="h-17" />
      <Bone className="h-10" />
    </motion.div>
  );
}

// ── Empty state ────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      key="idle"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-50 ring-1 ring-sky-100/80">
        <UserCheck size={32} className="text-sky-200" strokeWidth={1.5} />
      </div>
      <div className="max-w-[200px]">
        <p className="text-sm font-semibold text-slate-500">Verifikasi Peserta</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
          Masukkan nomor kartu BPJS atau NIK KTP untuk memeriksa status kepesertaan
        </p>
      </div>
      <div className="flex gap-5 text-xs text-slate-300">
        <span className="flex items-center gap-1.5">
          <CreditCard size={11} strokeWidth={1.8} />
          Kartu BPJS 13 digit
        </span>
        <span className="flex items-center gap-1.5">
          <User size={11} strokeWidth={1.8} />
          NIK KTP 16 digit
        </span>
      </div>
    </motion.div>
  );
}

// ── Error state ────────────────────────────────────────────

function ErrorState({ error, onRetry }: { error: BPJSError; onRetry?: () => void }) {
  const { title, desc, color, retryable } = errorLabel(error);
  const cfg = {
    slate: { wrap: "bg-slate-50 ring-slate-100",  icon: "text-slate-300",  title: "text-slate-600",  desc: "text-slate-400",  Icon: SearchX },
    amber: { wrap: "bg-amber-50 ring-amber-100",  icon: "text-amber-400",  title: "text-amber-700",  desc: "text-amber-600",  Icon: AlertTriangle },
    rose:  { wrap: "bg-rose-50  ring-rose-100",   icon: "text-rose-400",   title: "text-rose-700",   desc: "text-rose-600",   Icon: WifiOff },
  }[color];

  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
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

// ── PesertaFound ───────────────────────────────────────────

function PesertaFound({ peserta }: { peserta: PesertaRecord }) {
  const isAktif  = peserta.statusPeserta.kode === "0";
  const hasCOB   = peserta.cob.nmAsuransi !== null;
  const prolanis = peserta.informasi.prolanisPRB;
  const pct      = membershipPct(peserta.tglTMT, peserta.tglTAT);

  return (
    <motion.div
      key="found"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-3.5 p-4"
    >
      {/* ── Identity header ── */}
      <div className={cn(
        "rounded-2xl border p-4",
        isAktif ? "border-emerald-200/60 bg-emerald-50/30" : "border-rose-200/60 bg-rose-50/30",
      )}>
        <div className="flex items-start gap-3">
          {/* Initials avatar */}
          <div className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
            isAktif ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600",
          )}>
            {getInitials(peserta.nama)}
          </div>

          {/* Name + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-bold text-slate-800">{peserta.nama}</h2>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", statusChipCls(peserta.statusPeserta.kode))}>
                {peserta.statusPeserta.keterangan}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{sexLabel(peserta.sex)}</span>
              <span className="text-slate-300">·</span>
              <span>{peserta.umur.umurSekarang}</span>
              {prolanis && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="rounded-md bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
                    PRB · {prolanis}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Hak kelas badge */}
          <span className={cn("shrink-0 rounded-xl px-2.5 py-1 text-xs font-bold", kelasChipCls(peserta.hakKelas.kode))}>
            {peserta.hakKelas.keterangan}
          </span>
        </div>

        {/* Key identifiers row */}
        <div className="mt-3 grid grid-cols-3 gap-3 rounded-xl border border-white/70 bg-white/60 px-3 py-2.5">
          <InfoPair label="No. Kartu" value={peserta.noKartu} mono />
          <InfoPair label="NIK" value={peserta.nik} mono />
          <InfoPair label="Tgl. Lahir" value={fmtTgl(peserta.tglLahir)} />
        </div>
      </div>

      {/* ── Kepesertaan + FKTP ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200/60 bg-white p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Shield size={12} className="text-sky-500" strokeWidth={2.3} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kepesertaan</p>
          </div>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", jenisChipCls(peserta.jenisPeserta.kode))}>
            {peserta.jenisPeserta.keterangan}
          </span>
          {/* Validity bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{fmtTgl(peserta.tglTMT)}</span>
              <span>{fmtTgl(peserta.tglTAT)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className={cn("h-full rounded-full", barCls(pct, isAktif))}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              />
            </div>
            <p className={cn("mt-1 text-[10px] font-semibold", barTextCls(pct, isAktif))}>
              {isAktif ? `${pct}% sisa masa berlaku` : "Kepesertaan tidak aktif"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/60 bg-white p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5">
            <MapPin size={12} className="text-teal-500" strokeWidth={2.3} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">FKTP Terdaftar</p>
          </div>
          <p className="text-sm font-semibold leading-snug text-slate-800">{peserta.provUmum.nmProvider}</p>
          <p className="mt-1 font-mono text-[11px] text-slate-400">{peserta.provUmum.kdProvider}</p>
        </div>
      </div>

      {/* ── Rekam Medis & Kontak ── */}
      <div className="rounded-xl border border-slate-200/60 bg-white p-3.5">
        <div className="mb-2.5 flex items-center gap-1.5">
          <Activity size={12} className="text-slate-400" strokeWidth={2.3} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rekam Medis & Kontak</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <InfoPair label="No. Rekam Medis" value={peserta.mr.noMR ?? "—"} mono />
          <InfoPair label="Telepon" value={peserta.mr.noTelepon ?? "—"} mono />
          <InfoPair label="TMT Pendaftaran" value={fmtTgl(peserta.tglTMT)} />
        </div>
      </div>

      {/* ── COB — conditional ── */}
      {hasCOB && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="rounded-xl border border-emerald-200/60 bg-emerald-50/30 p-3.5"
        >
          <div className="mb-2.5 flex items-center gap-1.5">
            <CreditCard size={12} className="text-emerald-600" strokeWidth={2.3} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">COB — Asuransi Tambahan</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoPair label="Nama Asuransi" value={peserta.cob.nmAsuransi} />
            <InfoPair label="No. Polis" value={peserta.cob.noAsuransi} mono />
            <InfoPair label="TMT Asuransi" value={fmtTgl(peserta.cob.tglTMT)} />
            <InfoPair label="TAT Asuransi" value={fmtTgl(peserta.cob.tglTAT)} />
          </div>
        </motion.div>
      )}

      {/* ── Quick actions ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="grid grid-cols-2 gap-2 pt-0.5"
      >
        <Link
          href={`/ehis-registration?peserta=${peserta.noKartu}`}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 px-3 py-2.5 text-xs font-semibold text-white shadow-sm shadow-sky-200/60 transition-all hover:bg-sky-600 hover:shadow-md hover:shadow-sky-300/40"
        >
          Buat SEP
          <ArrowRight size={12} strokeWidth={2.5} />
        </Link>
        <Link
          href={`/ehis-bpjs/vclaim/rujukan?kartu=${peserta.noKartu}`}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
        >
          Cari Rujukan
          <ArrowRight size={12} strokeWidth={2.5} />
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ── Main export ────────────────────────────────────────────

interface PesertaDetailCardProps {
  result: KepesertaanResult;
  onRetry?: () => void;
}

export default function PesertaDetailCard({ result, onRetry }: PesertaDetailCardProps) {
  return (
    <div className="h-full">
      <AnimatePresence mode="wait">
        {result.status === "idle"    && <EmptyState />}
        {result.status === "loading" && <LoadingSkeleton />}
        {result.status === "found"   && <PesertaFound key="found" peserta={result.peserta} />}
        {result.status === "error"   && <ErrorState key="error" error={result.error} onRetry={onRetry} />}
      </AnimatePresence>
    </div>
  );
}
