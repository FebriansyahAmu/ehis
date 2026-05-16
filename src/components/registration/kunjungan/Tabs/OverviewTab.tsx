"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Stethoscope, Shield, Hash, FileText, CheckCircle,
  FilePen, ClipboardList, AlertCircle, Copy, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KunjunganRecord, UnitKunjungan } from "@/lib/data";
import { UNIT_CFG } from "../shared";

interface Props {
  kunjungan: KunjunganRecord;
  icdCodes: string[];
}

// ─── Copy button ──────────────────────────────────────────────

function CopyBtn({ value, dark }: { value: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handle}
      title={copied ? "Disalin!" : "Salin nomor"}
      className={cn(
        "flex h-6 items-center gap-1 rounded-md px-1.5 text-[10px] font-semibold transition",
        dark
          ? copied
            ? "bg-white/25 text-white"
            : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
          : copied
          ? "bg-emerald-100 text-emerald-600"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200",
      )}
    >
      {copied ? <Check size={9} /> : <Copy size={9} />}
      {copied ? "Disalin" : "Salin"}
    </button>
  );
}

// ─── Card shell ───────────────────────────────────────────────

function Card({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn("overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm", className)}
    >
      {children}
    </motion.div>
  );
}

function CardHead({
  icon: Icon,
  iconCls,
  title,
  extra,
}: {
  icon: React.ElementType;
  iconCls: string;
  title: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-50 px-4 py-2.5">
      <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", iconCls)}>
        <Icon size={12} />
      </div>
      <p className="flex-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{title}</p>
      {extra}
    </div>
  );
}

// ─── Ringkasan card ───────────────────────────────────────────

function RingkasanCard({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const unit = UNIT_CFG[kunjungan.unit as UnitKunjungan];
  return (
    <Card delay={0}>
      <CardHead icon={ClipboardList} iconCls="bg-sky-50 text-sky-600" title="Ringkasan Kunjungan" />
      <div className="space-y-3 p-4">

        {/* No. Pendaftaran strip */}
        <div className="flex items-center gap-3 rounded-lg bg-sky-600 px-3.5 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-sky-200">No. Pendaftaran</p>
            <p className="mt-0.5 font-mono text-[15px] font-black tracking-tight text-white">
              {kunjungan.noPendaftaran}
            </p>
          </div>
          <CopyBtn value={kunjungan.noPendaftaran} dark />
          <span className={cn("shrink-0 rounded px-2 py-0.5 text-[10px] font-bold", unit.bg, unit.text)}>
            {kunjungan.unit}
          </span>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-center">
          <div>
            <p className="text-[8.5px] font-semibold uppercase tracking-wider text-slate-400">No. Kunjungan</p>
            <p className="mt-0.5 font-mono text-[11px] font-bold text-slate-700">{kunjungan.noKunjungan}</p>
          </div>
          <div>
            <p className="text-[8.5px] font-semibold uppercase tracking-wider text-slate-400">Tanggal</p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-700">{kunjungan.tanggal}</p>
          </div>
          <div>
            <p className="text-[8.5px] font-semibold uppercase tracking-wider text-slate-400">Cara Masuk</p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-700">
              {kunjungan.caraMasuk ?? "—"}
            </p>
          </div>
        </div>

        {/* DPJP — bright */}
        <div className="flex items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500 shadow-sm shadow-sky-200">
            <Stethoscope size={14} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-wider text-sky-500">DPJP</p>
            <p className="mt-0.5 truncate text-[13px] font-bold text-sky-900">{kunjungan.dokter}</p>
          </div>
        </div>

        {/* Keluhan */}
        <div className="rounded-lg bg-amber-50 px-3.5 py-2.5 ring-1 ring-amber-100">
          <p className="mb-1 text-[8.5px] font-bold uppercase tracking-[0.15em] text-amber-500">Keluhan Utama</p>
          <p className="text-[12px] leading-relaxed text-slate-700">{kunjungan.keluhan}</p>
        </div>

      </div>
    </Card>
  );
}

// ─── Penjamin card ────────────────────────────────────────────

function PenjaminCard({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const hasSEP = !!kunjungan.noSEP;
  return (
    <Card delay={0.06}>
      <CardHead icon={Shield} iconCls="bg-slate-100 text-slate-600" title="Penjamin & SEP" />
      <div className="space-y-2.5 p-4">

        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800">
            <Shield size={14} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Jenis Penjamin</p>
            <p className="mt-0.5 text-[13px] font-bold text-slate-800">
              {kunjungan.penjamin ?? "Tidak Ditentukan"}
            </p>
            {kunjungan.noPenjamin ? (
              <p className="mt-0.5 font-mono text-[10px] text-slate-500">{kunjungan.noPenjamin}</p>
            ) : (
              <p className="mt-0.5 text-[10px] italic text-slate-400">No. kepesertaan belum diisi</p>
            )}
          </div>
        </div>

        {hasSEP ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2.5">
            <CheckCircle size={13} className="shrink-0 text-teal-600" />
            <div className="min-w-0">
              <p className="text-[8.5px] font-bold uppercase tracking-wider text-teal-600">SEP Aktif</p>
              <p className="mt-0.5 font-mono text-[11px] font-bold text-teal-800">{kunjungan.noSEP}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-slate-200 px-3.5 py-2.5">
            <AlertCircle size={13} className="shrink-0 text-slate-400" />
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Belum ada SEP</p>
              <p className="mt-0.5 text-[9.5px] text-slate-400">Buat melalui tab Update SEP</p>
            </div>
          </div>
        )}

      </div>
    </Card>
  );
}

// ─── Diagnosa card ────────────────────────────────────────────

const CODE_COLORS = [
  "bg-indigo-50 ring-indigo-200 text-indigo-700",
  "bg-teal-50 ring-teal-200 text-teal-700",
  "bg-sky-50 ring-sky-200 text-sky-700",
  "bg-emerald-50 ring-emerald-200 text-emerald-700",
];

function DiagnosaCard({ kunjungan, icdCodes }: { kunjungan: KunjunganRecord; icdCodes: string[] }) {
  const empty = icdCodes.length === 0 && !kunjungan.diagnosa;
  return (
    <Card delay={0.09}>
      <CardHead icon={Hash} iconCls="bg-teal-50 text-teal-600" title="Diagnosa" />
      <div className="p-4">
        {empty ? (
          <div className="flex flex-col items-center gap-2 py-5 text-center">
            <Hash size={18} className="text-slate-200" />
            <p className="text-[11px] font-medium text-slate-400">Belum ada diagnosa tercatat</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {icdCodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {icdCodes.map((code, i) => (
                  <div
                    key={code}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ring-1",
                      CODE_COLORS[i % CODE_COLORS.length],
                    )}
                  >
                    <span className="text-[8px] font-bold opacity-40">#{i + 1}</span>
                    <span className="font-mono text-[12px] font-black tracking-tight">{code}</span>
                  </div>
                ))}
              </div>
            )}
            {kunjungan.diagnosa && (
              <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">Deskripsi</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-700">{kunjungan.diagnosa}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Dokumen card ─────────────────────────────────────────────

function DokumenCard({ doc }: { doc: KunjunganRecord["dokumen"] }) {
  const items: { label: string; status: string | undefined; icon: React.ElementType }[] = [
    { label: "General Consent",  status: doc?.generalConsent,  icon: FileText      },
    { label: "Surat Rujukan",    status: doc?.rujukan,         icon: FilePen       },
    { label: "Pengantar Pasien", status: doc?.pengantarPasien, icon: ClipboardList },
  ];
  const completed = items.filter(
    ({ status }) => !!status && status !== "Tidak Ada" && status !== "Belum Ditandatangani",
  ).length;

  return (
    <Card delay={0.12}>
      <CardHead
        icon={FileText}
        iconCls="bg-sky-50 text-sky-600"
        title="Dokumen"
        extra={
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[9px] font-bold",
              completed === items.length
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500",
            )}
          >
            {completed}/{items.length} lengkap
          </span>
        }
      />
      <div className="divide-y divide-slate-50">
        {items.map(({ label, status, icon: DocIcon }) => {
          const ok = !!status && status !== "Tidak Ada" && status !== "Belum Ditandatangani";
          return (
            <div key={label} className="flex items-center gap-3 px-4 py-2.5">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  ok ? "bg-emerald-100" : "bg-slate-50",
                )}
              >
                {ok ? (
                  <CheckCircle size={13} className="text-emerald-600" />
                ) : (
                  <DocIcon size={12} className="text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-slate-700">{label}</p>
                <p className={cn("text-[10px]", ok ? "text-emerald-600" : "text-slate-400")}>
                  {status ?? "Tidak ada dokumen"}
                </p>
              </div>
              {ok && (
                <button className="shrink-0 rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-95">
                  Lihat
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Export ───────────────────────────────────────────────────

export function OverviewTab({ kunjungan, icdCodes }: Props) {
  return (
    <div className="space-y-3">
      <RingkasanCard kunjungan={kunjungan} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PenjaminCard kunjungan={kunjungan} />
        <DiagnosaCard kunjungan={kunjungan} icdCodes={icdCodes} />
      </div>
      <DokumenCard doc={kunjungan.dokumen} />
    </div>
  );
}
