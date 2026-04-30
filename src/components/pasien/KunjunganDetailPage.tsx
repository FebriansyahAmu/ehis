"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Shield,
  Printer,
  CheckCircle,
  XCircle,
  Trash2,
  ExternalLink,
  CreditCard,
  Package,
  Car,
  Calendar,
  RefreshCw,
  Hash,
  Stethoscope,
  ClipboardList,
  ChevronRight,
  Upload,
  X,
  AlertTriangle,
  FilePen,
  Info,
  Building2,
  MapPin,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster, KunjunganRecord, UnitKunjungan } from "@/lib/data";

// ─── Types ─────────────────────────────────────────────────

type ModalId =
  | "ubah-penjamin"
  | "ubah-paket"
  | "surat-rujukan"
  | "kecelakaan"
  | "update"
  | "update-sep"
  | "hapus"
  | null;

type TabId = "ringkasan" | "penjamin" | "diagnosa" | "dokumen";

interface Props {
  patient: PatientMaster;
  kunjungan: KunjunganRecord;
}

// ─── Constants ──────────────────────────────────────────────

const UNIT_CFG: Record<UnitKunjungan, { bg: string; text: string }> = {
  IGD: { bg: "bg-rose-100", text: "text-rose-700" },
  "Rawat Jalan": { bg: "bg-sky-100", text: "text-sky-700" },
  "Rawat Inap": { bg: "bg-emerald-100", text: "text-emerald-700" },
  Laboratorium: { bg: "bg-teal-100", text: "text-teal-700" },
  Radiologi: { bg: "bg-orange-100", text: "text-orange-700" },
  Farmasi: { bg: "bg-violet-100", text: "text-violet-700" },
};

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "ringkasan", label: "Ringkasan", icon: ClipboardList },
  { id: "penjamin", label: "Penjamin & SEP", icon: Shield },
  { id: "diagnosa", label: "Diagnosa", icon: Hash },
  { id: "dokumen", label: "Dokumen", icon: FileText },
];

// ─── Shared primitives ──────────────────────────────────────

function InfoCard({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-100 bg-slate-50/60 p-3.5", className)}>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div className="text-[13px] font-medium text-slate-800">{children}</div>
    </div>
  );
}

function RightTitle({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="h-px flex-1 bg-slate-100" />
      <p className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>
      <span className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

function StatusBadge({ status }: { status: KunjunganRecord["status"] }) {
  const cfg = {
    Aktif: { cls: "bg-sky-100 text-sky-700 ring-1 ring-sky-300", dot: true },
    Selesai: { cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300", dot: false },
    Dibatalkan: { cls: "bg-slate-100 text-slate-500 ring-1 ring-slate-300", dot: false },
  }[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold", cfg.cls)}>
      {cfg.dot && (
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
      )}
      {status}
    </span>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  sublabel,
  variant = "default",
  onClick,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  variant?: "default" | "warning" | "danger";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const iconCls = {
    default: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
    warning: "bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
    danger: "bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white",
  }[variant];

  const containerCls = {
    default: "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50",
    warning: "border-amber-100 bg-amber-50/40 hover:border-amber-200 hover:shadow-md hover:shadow-amber-50",
    danger: "border-rose-100 bg-rose-50/40 hover:border-rose-200 hover:shadow-md hover:shadow-rose-50",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150",
        containerCls,
        disabled && "cursor-not-allowed opacity-40 hover:border-slate-200! hover:bg-white! hover:shadow-none!",
      )}
    >
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150", iconCls)}>
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold leading-tight text-slate-700">{label}</p>
        {sublabel && <p className="mt-0.5 text-[10px] text-slate-400">{sublabel}</p>}
      </div>
      <ChevronRight size={12} className="shrink-0 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5" />
    </button>
  );
}

function PrintBtn({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-all duration-150",
        "hover:border-slate-300 hover:shadow-sm",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-all duration-150 group-hover:bg-slate-800 group-hover:text-white">
        <Printer size={13} />
      </div>
      <span className="flex-1 text-[12px] font-medium text-slate-600">{label}</span>
    </button>
  );
}

// ─── Tab navigation ─────────────────────────────────────────

function TabNav({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-100/80 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition-all duration-150",
            active === tab.id
              ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          <tab.icon size={12} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Tab contents ───────────────────────────────────────────

function RingkasanTab({
  kunjungan,
  unit,
}: {
  kunjungan: KunjunganRecord;
  unit: { bg: string; text: string };
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <InfoCard label="No. Pendaftaran">
          <span className="font-mono font-bold text-indigo-700">{kunjungan.noPendaftaran}</span>
        </InfoCard>
        <InfoCard label="No. Kunjungan">
          <span className="font-mono text-slate-600">{kunjungan.noKunjungan}</span>
        </InfoCard>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <InfoCard label="Tanggal">
          <span className="text-[12px]">{kunjungan.tanggal}</span>
        </InfoCard>
        <InfoCard label="Unit Layanan">
          <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold", unit.bg, unit.text)}>
            {kunjungan.unit}
          </span>
        </InfoCard>
        <InfoCard label="Cara Masuk">
          <span className="text-[12px]">{kunjungan.caraMasuk ?? "—"}</span>
        </InfoCard>
      </div>

      <InfoCard label="Dokter Penanggungjawab">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50">
            <Stethoscope size={13} className="text-indigo-600" />
          </div>
          <span>{kunjungan.dokter}</span>
        </div>
      </InfoCard>

      <div className="rounded-xl border border-slate-100 bg-linear-to-br from-slate-50 to-white p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Keluhan Utama
        </p>
        <p className="text-[13px] leading-relaxed text-slate-700">{kunjungan.keluhan}</p>
      </div>
    </div>
  );
}

function PenjaminTab({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const hasSEP = !!kunjungan.noSEP;

  return (
    <div className="space-y-3">
      {/* Insurance card — gradient visual */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-800 p-5 text-white shadow-lg shadow-indigo-200/60">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 right-4 h-24 w-24 rounded-full bg-white/5" />
        <div className="absolute right-20 top-4 h-12 w-12 rounded-full bg-white/5" />
        <div className="relative">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-300">
                Jenis Penjamin
              </p>
              <p className="mt-0.5 text-base font-bold">
                {kunjungan.penjamin ?? "Tidak Ditentukan"}
              </p>
            </div>
            <Shield size={22} className="opacity-30" />
          </div>
          {kunjungan.noPenjamin ? (
            <div>
              <p className="mb-0.5 text-[9px] font-semibold text-indigo-300">No. Kepesertaan</p>
              <p className="font-mono text-sm tracking-wider">{kunjungan.noPenjamin}</p>
            </div>
          ) : (
            <p className="text-[11px] italic text-indigo-300">No. kepesertaan belum diisi</p>
          )}
        </div>
      </div>

      {/* SEP status */}
      {hasSEP ? (
        <div className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50 p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100">
              <FileText size={14} className="text-emerald-600" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
              Surat Eligibilitas Peserta (SEP)
            </p>
          </div>
          <p className="font-mono text-lg font-bold tracking-wider text-emerald-800">
            {kunjungan.noSEP}
          </p>
          <p className="mt-1 text-[10px] text-emerald-600">SEP aktif</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <FileText size={20} className="text-slate-400" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-slate-600">Belum ada SEP</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Buat SEP melalui menu Ubah Penjamin
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DiagnosaTab({
  kunjungan,
  icdCodes,
}: {
  kunjungan: KunjunganRecord;
  icdCodes: string[];
}) {
  const empty = icdCodes.length === 0 && !kunjungan.diagnosa;

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Hash size={24} className="text-slate-400" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-slate-600">Belum ada diagnosa</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Diagnosa akan tersedia setelah pemeriksaan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {icdCodes.length > 0 && (
        <div>
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Kode ICD-10
          </p>
          <div className="flex flex-wrap gap-2">
            {icdCodes.map((code, i) => (
              <div
                key={code}
                className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-linear-to-br from-indigo-50 to-violet-50 px-3.5 py-2.5"
              >
                <span className="text-[9px] font-bold text-indigo-400">#{i + 1}</span>
                <span className="font-mono text-[13px] font-bold text-indigo-700">{code}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {kunjungan.diagnosa && (
        <div className="rounded-xl border border-slate-100 bg-linear-to-br from-slate-50 to-white p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Deskripsi Diagnosa
          </p>
          <p className="text-[13px] leading-relaxed text-slate-700">{kunjungan.diagnosa}</p>
        </div>
      )}
    </div>
  );
}

function DokumenTab({ doc }: { doc: KunjunganRecord["dokumen"] }) {
  const items: { label: string; status: string | undefined }[] = [
    { label: "General Consent", status: doc?.generalConsent },
    { label: "Surat Rujukan", status: doc?.rujukan },
    { label: "Pengantar Pasien", status: doc?.pengantarPasien },
  ];

  return (
    <div className="space-y-2.5">
      {items.map(({ label, status }) => {
        const ok = !!status && status !== "Tidak Ada" && status !== "Belum Ditandatangani";
        return (
          <div
            key={label}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border p-4 transition",
              ok
                ? "border-emerald-100 bg-linear-to-r from-emerald-50/70 to-teal-50/40"
                : "border-slate-100 bg-slate-50/40",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  ok ? "bg-emerald-100" : "bg-slate-100",
                )}
              >
                {ok ? (
                  <CheckCircle size={18} className="text-emerald-600" />
                ) : (
                  <XCircle size={18} className="text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-[12px] font-semibold text-slate-700">{label}</p>
                <p className={cn("mt-0.5 text-[10px] font-medium", ok ? "text-emerald-600" : "text-slate-400")}>
                  {status ?? "Tidak Ada"}
                </p>
              </div>
            </div>
            {ok && (
              <button className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-indigo-600 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
                <FileText size={11} />
                Lihat
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Modal shell ────────────────────────────────────────────

function ModalShell({
  title,
  subtitle,
  icon: Icon,
  onClose,
  children,
  footer,
  variant = "default",
  size = "md",
  noPadding = false,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "danger" | "warning";
  size?: "sm" | "md" | "lg" | "xl";
  noPadding?: boolean;
}) {
  const maxW = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];

  const accentCls =
    variant === "danger"
      ? "from-rose-500 to-rose-600"
      : variant === "warning"
        ? "from-amber-400 to-orange-500"
        : "from-indigo-500 to-violet-600";

  const iconCls =
    variant === "danger"
      ? "bg-rose-100 text-rose-600"
      : variant === "warning"
        ? "bg-amber-100 text-amber-600"
        : "bg-indigo-100 text-indigo-600";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className={cn(
          "flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5",
          maxW,
        )}
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={cn("h-1 w-full shrink-0 bg-linear-to-r", accentCls)} />
        <div className="flex shrink-0 items-start gap-3.5 border-b border-slate-100 px-5 py-4">
          {Icon && (
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconCls)}>
              <Icon size={17} />
            </div>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-[14px] font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {noPadding ? (
          <div className="flex flex-1 overflow-hidden">{children}</div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        )}

        {footer && (
          <div className="flex shrink-0 items-center border-t border-slate-100 bg-slate-50/80 px-5 py-3.5">
            {footer}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Two-panel sidebar nav (shared pattern) ──────────────────

function PanelSidebarNav<T extends string>({
  sections,
  active,
  onChange,
  activeColor = "indigo",
}: {
  sections: { id: T; label: string; icon: React.ElementType; desc: string; iconBg: string; iconText: string }[];
  active: T;
  onChange: (id: T) => void;
  activeColor?: "indigo" | "amber";
}) {
  const idx = sections.findIndex((s) => s.id === active);
  const activeBg = activeColor === "amber" ? "bg-amber-600 shadow-amber-200" : "bg-indigo-600 shadow-indigo-200";
  const dotActive = activeColor === "amber" ? "bg-amber-500" : "bg-indigo-500";
  const dotIdle = activeColor === "amber" ? "bg-amber-200 hover:bg-amber-300" : "bg-slate-300 hover:bg-slate-400";
  const dotText = activeColor === "amber" ? "text-amber-400" : "text-slate-400";

  return (
    <>
      <nav className="flex flex-col gap-1 p-3">
        {sections.map((s) => {
          const SIcon = s.icon;
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-xl p-3 text-left transition-all duration-150",
                isActive ? `${activeBg} shadow-sm text-white` : "text-slate-500 hover:bg-white hover:shadow-xs",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition",
                  isActive ? "bg-white/20" : s.iconBg,
                )}
              >
                <SIcon size={12} className={isActive ? "text-white" : s.iconText} />
              </div>
              <div className="min-w-0">
                <p className={cn("text-[11px] font-bold leading-tight", isActive ? "text-white" : "text-slate-700")}>
                  {s.label}
                </p>
                <p className={cn("mt-0.5 text-[10px] leading-tight", isActive ? "text-white/60" : "text-slate-400")}>
                  {s.desc}
                </p>
              </div>
              {isActive && <span className="ml-auto mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center justify-center gap-1.5 pb-4">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={cn(
              "h-1.5 cursor-pointer rounded-full transition-all duration-200",
              active === s.id ? `w-5 ${dotActive}` : `w-1.5 ${dotIdle}`,
            )}
          />
        ))}
        <span className={cn("ml-1 text-[10px]", dotText)}>
          {idx + 1}/{sections.length}
        </span>
      </div>
    </>
  );
}

// ─── Two-panel footer nav ─────────────────────────────────────

function PanelFooter<T extends string>({
  sections,
  active,
  onChange,
  onClose,
  saveLabel,
}: {
  sections: { id: T }[];
  active: T;
  onChange: (id: T) => void;
  onClose: () => void;
  saveLabel?: string;
}) {
  const idx = sections.findIndex((s) => s.id === active);
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex gap-2">
        <button
          disabled={idx === 0}
          onClick={() => onChange(sections[idx - 1].id)}
          className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50 disabled:cursor-default disabled:opacity-30"
        >
          ← Sebelumnya
        </button>
        <button
          disabled={idx === sections.length - 1}
          onClick={() => onChange(sections[idx + 1].id)}
          className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50 disabled:cursor-default disabled:opacity-30"
        >
          Selanjutnya →
        </button>
      </div>
      <div className="flex gap-2">
        <BtnCancel onClick={onClose} />
        <BtnSave label={saveLabel} />
      </div>
    </div>
  );
}

// ─── Form primitives ────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition";
const selectCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition cursor-pointer";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function FormSection({
  label,
  icon: Icon,
  children,
  variant = "default",
}: {
  label?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  variant?: "default" | "warning" | "info";
}) {
  const cfg = {
    default: "border-slate-100 bg-slate-50/60",
    warning: "border-amber-100 bg-amber-50/40",
    info: "border-indigo-100 bg-indigo-50/30",
  }[variant];

  return (
    <div className={cn("mb-4 rounded-xl border p-4 last:mb-0", cfg)}>
      {(label || Icon) && (
        <div className="mb-3.5 flex items-center gap-2 border-b border-slate-200 pb-3">
          {Icon && <Icon size={12} className="text-slate-400" />}
          {label && (
            <p className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400">
              {label}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function IconInput({
  icon: Icon,
  readOnly,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ElementType }) {
  return (
    <div className="relative">
      {Icon && (
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon size={14} />
        </div>
      )}
      <input
        readOnly={readOnly}
        className={cn(
          inputCls,
          Icon && "pl-10",
          readOnly && "cursor-not-allowed bg-slate-50 text-slate-500",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function IconSelect({
  icon: Icon,
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {Icon && (
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon size={14} />
        </div>
      )}
      <select className={cn(selectCls, Icon && "pl-10", className)} {...props}>
        {children}
      </select>
    </div>
  );
}

function BtnSave({ label = "Simpan Perubahan" }: { label?: string }) {
  return (
    <button className="rounded-xl bg-linear-to-b from-indigo-500 to-indigo-600 px-5 py-2 text-[12px] font-bold text-white shadow-sm shadow-indigo-200 transition hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md hover:shadow-indigo-200">
      {label}
    </button>
  );
}

function BtnCancel({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50"
    >
      Batal
    </button>
  );
}

// ─── Modal contents ─────────────────────────────────────────

function UbahPenjaminModal({
  kunjungan,
  onClose,
}: {
  kunjungan: KunjunganRecord;
  onClose: () => void;
}) {
  type SecId = "penjamin" | "sep";
  const [sec, setSec] = useState<SecId>("penjamin");
  const unit = UNIT_CFG[kunjungan.unit];

  const SECTIONS: {
    id: SecId; label: string; icon: React.ElementType; desc: string;
    iconBg: string; iconText: string;
  }[] = [
    { id: "penjamin", label: "Data Penjamin", icon: CreditCard, desc: "Jenis & no. kepesertaan", iconBg: "bg-sky-100", iconText: "text-sky-600" },
    { id: "sep", label: "Data SEP", icon: FileText, desc: "Nomor SEP & tanggal pelayanan", iconBg: "bg-indigo-100", iconText: "text-indigo-600" },
  ];

  return (
    <ModalShell
      title="Ubah Penjamin & Pembuatan SEP"
      subtitle="Perbarui data penjamin dan Surat Eligibilitas Peserta kunjungan ini"
      icon={CreditCard}
      onClose={onClose}
      size="xl"
      noPadding
      footer={<PanelFooter sections={SECTIONS} active={sec} onChange={setSec} onClose={onClose} />}
    >
      {/* ── Left sidebar ── */}
      <div className="flex w-56 shrink-0 flex-col border-r border-slate-100 bg-slate-50/80">
        {/* Visit mini card */}
        <div className="flex flex-col gap-2.5 border-b border-slate-100 px-4 py-5">
          <span className={cn("inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[10px] font-bold", unit.bg, unit.text)}>
            {kunjungan.unit}
          </span>
          <div>
            <p className="font-mono text-[13px] font-bold text-slate-800">{kunjungan.noPendaftaran}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{kunjungan.tanggal}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-2">
            <Shield size={11} className="shrink-0 text-indigo-500" />
            <span className="text-[10px] font-semibold leading-tight text-indigo-700">
              {kunjungan.penjamin ?? "Belum diatur"}
            </span>
          </div>
          {kunjungan.noSEP ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-2">
              <CheckCircle size={11} className="shrink-0 text-emerald-500" />
              <span className="font-mono text-[9px] font-bold text-emerald-700 truncate">{kunjungan.noSEP}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
              <XCircle size={11} className="shrink-0 text-slate-400" />
              <span className="text-[10px] text-slate-400">Belum ada SEP</span>
            </div>
          )}
        </div>

        <PanelSidebarNav sections={SECTIONS} active={sec} onChange={setSec} />
      </div>

      {/* ── Right content ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {sec === "penjamin" && (
          <div>
            <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100">
                <CreditCard size={14} className="text-sky-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Data Penjamin</p>
                <p className="text-[10px] text-slate-400">Jenis penjamin dan nomor kepesertaan pasien</p>
              </div>
            </div>
            <div className="space-y-4">
              <FormField label="Jenis Penjamin">
                <IconSelect icon={Shield} defaultValue={kunjungan.penjamin ?? ""}>
                  <option>BPJS Non-PBI</option>
                  <option>BPJS PBI</option>
                  <option>Umum / Mandiri</option>
                  <option>Asuransi Swasta</option>
                  <option>Jamkesda</option>
                </IconSelect>
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Nomor Kepesertaan">
                  <IconInput icon={Hash} defaultValue={kunjungan.noPenjamin ?? ""} placeholder="Nomor kepesertaan" />
                </FormField>
                <FormField label="Kelas Rawat">
                  <IconSelect icon={Layers}>
                    <option>Kelas 1</option>
                    <option>Kelas 2</option>
                    <option>Kelas 3</option>
                  </IconSelect>
                </FormField>
              </div>
              <div className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3">
                <p className="text-[10px] leading-relaxed text-sky-700">
                  Perubahan jenis penjamin akan mempengaruhi penagihan dan laporan BPJS. Pastikan data sesuai dengan kartu kepesertaan pasien.
                </p>
              </div>
            </div>
          </div>
        )}

        {sec === "sep" && (
          <div>
            <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
                <FileText size={14} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Data SEP</p>
                <p className="text-[10px] text-slate-400">Surat Eligibilitas Peserta BPJS Kesehatan</p>
              </div>
            </div>

            {kunjungan.noSEP ? (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <CheckCircle size={14} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-700">SEP Sudah Terdaftar</p>
                  <p className="font-mono text-[11px] text-emerald-600">{kunjungan.noSEP}</p>
                </div>
              </div>
            ) : (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <AlertTriangle size={14} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-700">Belum Ada SEP</p>
                  <p className="text-[11px] text-amber-600">Isi form di bawah untuk membuat SEP baru</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <FormField label="Nomor SEP">
                <IconInput icon={Hash} defaultValue={kunjungan.noSEP ?? ""} placeholder="Contoh: 0000000001100231" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Tanggal SEP">
                  <IconInput icon={Calendar} type="date" />
                </FormField>
                <FormField label="Jenis Pelayanan">
                  <IconSelect icon={ClipboardList}>
                    <option>Rawat Darurat</option>
                    <option>Rawat Jalan Tingkat Lanjut</option>
                    <option>Rawat Inap Tingkat Lanjut</option>
                  </IconSelect>
                </FormField>
              </div>
              <FormField label="Diagnosa Primer (ICD-10)">
                <IconInput icon={Hash} placeholder="Contoh: J06.9" />
              </FormField>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function UbahPaketModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell
      title="Ubah Paket Layanan"
      subtitle="Ganti paket layanan untuk kunjungan ini"
      icon={Package}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <BtnCancel onClick={onClose} />
          <BtnSave />
        </div>
      }
    >
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
          <Package size={15} className="text-indigo-600" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-indigo-800">Perubahan Paket Layanan</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-indigo-600">
            Ubah paket layanan akan mempengaruhi tarif dan item tagihan kunjungan. Pastikan perubahan sudah mendapat persetujuan dokter.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <FormField label="Paket Layanan Baru">
          <IconSelect icon={Package}>
            <option>IGD Non Bedah</option>
            <option>IGD Bedah</option>
            <option>Rawat Jalan Spesialis</option>
            <option>Rawat Inap Kelas 1</option>
            <option>Rawat Inap Kelas 2</option>
            <option>Rawat Inap Kelas 3</option>
            <option>Paket Khusus Jantung</option>
            <option>Paket Khusus Onkologi</option>
          </IconSelect>
        </FormField>
        <FormField label="Alasan Perubahan">
          <IconSelect icon={Info}>
            <option>Perubahan kondisi klinis</option>
            <option>Permintaan pasien</option>
            <option>Kesalahan input awal</option>
            <option>Lainnya</option>
          </IconSelect>
        </FormField>
        <FormField label="Keterangan Tambahan">
          <textarea
            className={cn(inputCls, "min-h-24 resize-none")}
            placeholder="Catatan perubahan paket layanan..."
          />
        </FormField>
      </div>
    </ModalShell>
  );
}

function SuratRujukanModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell
      title="Surat Rujukan"
      subtitle="Input atau unggah surat rujukan pasien"
      icon={FilePen}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <BtnCancel onClick={onClose} />
          <BtnSave label="Simpan Rujukan" />
        </div>
      }
    >
      <div className="space-y-4">
        <FormField label="No. Surat Rujukan">
          <IconInput icon={Hash} placeholder="Nomor surat rujukan dari fasyankes" />
        </FormField>
        <FormField label="Asal Fasyankes">
          <IconInput icon={Building2} placeholder="Nama fasilitas kesehatan perujuk" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tanggal Rujukan">
            <IconInput icon={Calendar} type="date" />
          </FormField>
          <FormField label="Masa Berlaku">
            <IconInput icon={Calendar} type="date" />
          </FormField>
        </div>
        <FormField label="Dokumen Rujukan">
          <div className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 transition hover:border-indigo-300 hover:bg-indigo-50/40">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
              <Upload size={18} className="text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-[12px] text-slate-500">
                Drag &amp; drop atau{" "}
                <span className="font-semibold text-indigo-600">pilih file</span>
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">PDF, JPG, PNG — maks. 5 MB</p>
            </div>
          </div>
        </FormField>
      </div>
    </ModalShell>
  );
}

function KecelakaanModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell
      title="Data Kecelakaan"
      subtitle="Isi data kecelakaan untuk kunjungan ini"
      icon={Car}
      onClose={onClose}
      variant="warning"
      footer={<><BtnCancel onClick={onClose} /><BtnSave /></>}
    >
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-linear-to-br from-amber-50 to-orange-50 p-3.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100">
          <Info size={14} className="text-amber-600" />
        </div>
        <p className="text-[11px] leading-relaxed text-amber-700">
          Data kecelakaan akan dilaporkan ke instansi terkait sesuai regulasi BPJS Ketenagakerjaan dan Jasa Raharja.
        </p>
      </div>

      <FormSection label="Identifikasi Kejadian" icon={AlertTriangle} variant="warning">
        <FormField label="Jenis Kecelakaan">
          <IconSelect icon={Car}>
            <option>Kecelakaan Lalu Lintas</option>
            <option>Kecelakaan Kerja</option>
            <option>Kecelakaan Lainnya</option>
          </IconSelect>
        </FormField>
        <FormField label="Tanggal Kejadian">
          <IconInput icon={Calendar} type="date" />
        </FormField>
        <FormField label="Lokasi Kejadian">
          <IconInput icon={MapPin} placeholder="Lokasi terjadinya kecelakaan" />
        </FormField>
      </FormSection>

      <FormSection label="Data Pertanggungan" icon={Shield}>
        <FormField label="Nomor LP (Laporan Polisi)">
          <IconInput icon={Hash} placeholder="Opsional — jika ada" />
        </FormField>
        <FormField label="Pihak Penjamin Kecelakaan">
          <IconSelect icon={Shield}>
            <option>Jasa Raharja</option>
            <option>BPJS Ketenagakerjaan</option>
            <option>Asuransi Swasta</option>
            <option>Ditanggung Sendiri</option>
          </IconSelect>
        </FormField>
        <FormField label="Kronologi Singkat">
          <textarea
            className={cn(inputCls, "min-h-20 resize-none")}
            placeholder="Uraikan kronologi kecelakaan secara singkat..."
          />
        </FormField>
      </FormSection>
    </ModalShell>
  );
}

function UpdateModal({
  kunjungan,
  onClose,
}: {
  kunjungan: KunjunganRecord;
  onClose: () => void;
}) {
  return (
    <ModalShell
      title="Update Data Kunjungan"
      subtitle="Perbarui informasi kunjungan"
      icon={RefreshCw}
      onClose={onClose}
      footer={<><BtnCancel onClick={onClose} /><BtnSave /></>}
    >
      <FormField label="Tanggal Kunjungan">
        <IconInput icon={Calendar} type="date" />
      </FormField>
      <FormField label="Dokter Penanggungjawab">
        <IconInput icon={Stethoscope} defaultValue={kunjungan.dokter} />
      </FormField>
      <FormField label="Cara Masuk">
        <IconSelect icon={ClipboardList} defaultValue={kunjungan.caraMasuk ?? ""}>
          <option>Datang Sendiri</option>
          <option>Rujukan Poli</option>
          <option>Rujukan Luar RS</option>
          <option>Order Dokter</option>
          <option>Ambulans</option>
        </IconSelect>
      </FormField>
      <FormField label="Status Kunjungan">
        <IconSelect icon={RefreshCw} defaultValue={kunjungan.status}>
          <option>Aktif</option>
          <option>Selesai</option>
          <option>Dibatalkan</option>
        </IconSelect>
      </FormField>
      <FormField label="Alasan Perubahan">
        <textarea
          className={cn(inputCls, "min-h-20 resize-none")}
          placeholder="Catatan alasan perubahan data..."
        />
      </FormField>
    </ModalShell>
  );
}

function UpdateSEPModal({
  kunjungan,
  onClose,
}: {
  kunjungan: KunjunganRecord;
  onClose: () => void;
}) {
  return (
    <ModalShell
      title="Update Tanggal Pulang SEP"
      subtitle="Perbarui tanggal pulang pada data SEP BPJS"
      icon={Calendar}
      onClose={onClose}
      variant="warning"
      footer={<><BtnCancel onClick={onClose} /><BtnSave /></>}
    >
      <FormSection label="No. SEP" icon={FileText} variant="info">
        <p className="font-mono text-sm font-bold tracking-wider text-indigo-700">
          {kunjungan.noSEP ?? "—"}
        </p>
        <p className="mt-0.5 text-[10px] text-indigo-400">Nomor SEP tidak dapat diubah</p>
      </FormSection>

      <FormField label="Tanggal Pulang">
        <IconInput icon={Calendar} type="date" />
      </FormField>
      <FormField label="Cara Pulang">
        <IconSelect icon={ClipboardList}>
          <option>Sembuh</option>
          <option>Atas Permintaan Sendiri (APS)</option>
          <option>Dirujuk ke Fasyankes Lain</option>
          <option>Meninggal di RS</option>
          <option>Lainnya</option>
        </IconSelect>
      </FormField>
      <FormField label="Kondisi Saat Pulang">
        <IconSelect icon={Info}>
          <option>Baik</option>
          <option>Sedang</option>
          <option>Buruk</option>
        </IconSelect>
      </FormField>
    </ModalShell>
  );
}

function HapusModal({
  kunjungan,
  onClose,
}: {
  kunjungan: KunjunganRecord;
  onClose: () => void;
}) {
  const [confirm, setConfirm] = useState("");
  const ready = confirm === "HAPUS";

  return (
    <ModalShell
      title="Hapus Kunjungan"
      subtitle={`${kunjungan.noPendaftaran} · ${kunjungan.tanggal}`}
      icon={Trash2}
      onClose={onClose}
      variant="danger"
      footer={
        <>
          <BtnCancel onClick={onClose} />
          <button
            disabled={!ready}
            className={cn(
              "rounded-xl px-5 py-2 text-[12px] font-bold transition",
              ready
                ? "bg-linear-to-b from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-200 hover:from-rose-600 hover:to-rose-700 hover:shadow-md"
                : "cursor-not-allowed bg-rose-200 text-rose-400",
            )}
          >
            Hapus Kunjungan
          </button>
        </>
      }
    >
      {/* Central danger icon */}
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 ring-8 ring-rose-50">
          <Trash2 size={28} className="text-rose-600" />
        </div>
        <h3 className="text-[15px] font-bold text-slate-800">
          Hapus Data Ini Secara Permanen?
        </h3>
        <p className="mt-1.5 max-w-xs text-[12px] leading-relaxed text-slate-500">
          Semua rekam medis, billing, dan dokumen yang terkait dengan kunjungan ini akan ikut
          terhapus dan tidak dapat dipulihkan.
        </p>
      </div>

      {/* Visit info */}
      <div className="mb-5 overflow-hidden rounded-xl border border-rose-200 bg-rose-50">
        <div className="flex items-center justify-between border-b border-rose-100 px-4 py-2.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">
            No. Pendaftaran
          </span>
          <span className="font-mono text-[12px] font-bold text-rose-800">
            {kunjungan.noPendaftaran}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">
            Tanggal
          </span>
          <span className="text-[12px] text-rose-700">{kunjungan.tanggal}</span>
        </div>
      </div>

      <FormField label='Ketik "HAPUS" untuk konfirmasi'>
        <input
          className={cn(
            inputCls,
            "border-rose-200 text-center font-mono tracking-widest focus:border-rose-400 focus:ring-rose-100",
            ready && "border-rose-400 bg-rose-50 text-rose-700",
          )}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value.toUpperCase())}
          placeholder="H A P U S"
          maxLength={5}
        />
        {confirm.length > 0 && !ready && (
          <p className="mt-1.5 text-center text-[10px] text-rose-400">
            {5 - confirm.length} karakter lagi...
          </p>
        )}
        {ready && (
          <p className="mt-1.5 text-center text-[10px] font-bold text-rose-600">
            ✓ Konfirmasi berhasil — siap dihapus
          </p>
        )}
      </FormField>
    </ModalShell>
  );
}

function ActionModal({
  id,
  kunjungan,
  onClose,
}: {
  id: NonNullable<ModalId>;
  kunjungan: KunjunganRecord;
  onClose: () => void;
}) {
  switch (id) {
    case "ubah-penjamin":
      return <UbahPenjaminModal kunjungan={kunjungan} onClose={onClose} />;
    case "ubah-paket":
      return <UbahPaketModal onClose={onClose} />;
    case "surat-rujukan":
      return <SuratRujukanModal onClose={onClose} />;
    case "kecelakaan":
      return <KecelakaanModal onClose={onClose} />;
    case "update":
      return <UpdateModal kunjungan={kunjungan} onClose={onClose} />;
    case "update-sep":
      return <UpdateSEPModal kunjungan={kunjungan} onClose={onClose} />;
    case "hapus":
      return <HapusModal kunjungan={kunjungan} onClose={onClose} />;
  }
}

// ─── Main component ─────────────────────────────────────────

export default function KunjunganDetailPage({ patient, kunjungan }: Props) {
  const [modal, setModal] = useState<ModalId>(null);
  const [activeTab, setActiveTab] = useState<TabId>("ringkasan");
  const open = (id: NonNullable<ModalId>) => setModal(id);
  const close = () => setModal(null);

  const unit = UNIT_CFG[kunjungan.unit];
  const icdCodes =
    kunjungan.kodeICD
      ?.split(",")
      .map((c) => c.trim())
      .filter(Boolean) ?? [];
  const doc = kunjungan.dokumen;
  const hasSEP = !!kunjungan.noSEP;

  return (
    <div className="flex h-full flex-col bg-slate-50">

      {/* ── Header ── */}
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={`/ehis-care/pasien/${patient.noRM}`}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <ArrowLeft size={14} />
              Kembali
            </Link>
            <div className="h-5 w-px shrink-0 bg-slate-200" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-bold text-slate-800">{patient.name}</span>
                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                  {patient.noRM}
                </span>
                <span className="shrink-0 text-slate-300">·</span>
                <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold", unit.bg, unit.text)}>
                  {kunjungan.unit}
                </span>
                <span className="shrink-0 text-slate-300">·</span>
                <span className="shrink-0 text-[12px] text-slate-500">{kunjungan.tanggal}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Detail Pendaftaran</span>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-[11px] font-bold text-indigo-600">
                  {kunjungan.noPendaftaran}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {kunjungan.klinisPath && (
              <Link
                href={kunjungan.klinisPath}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-100"
              >
                <Stethoscope size={13} />
                Rekam Medis Klinis
                <ExternalLink size={11} />
              </Link>
            )}
            <StatusBadge status={kunjungan.status} />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left column — tabbed content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-3">
            <TabNav active={activeTab} onChange={setActiveTab} />
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === "ringkasan" && (
                  <RingkasanTab kunjungan={kunjungan} unit={unit} />
                )}
                {activeTab === "penjamin" && <PenjaminTab kunjungan={kunjungan} />}
                {activeTab === "diagnosa" && (
                  <DiagnosaTab kunjungan={kunjungan} icdCodes={icdCodes} />
                )}
                {activeTab === "dokumen" && <DokumenTab doc={doc} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right column — actions */}
        <div className="flex w-72 shrink-0 flex-col gap-5 overflow-y-auto border-l border-slate-200 bg-white p-5">

          {/* Mini visit summary */}
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-linear-to-br from-slate-50 to-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", unit.bg, unit.text)}>
                {kunjungan.unit}
              </span>
              <StatusBadge status={kunjungan.status} />
            </div>
            <div className="px-4 py-3">
              <p className="font-mono text-[12px] font-bold text-indigo-600">
                {kunjungan.noPendaftaran}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{kunjungan.tanggal}</p>
            </div>
          </div>

          {/* Aksi Kunjungan */}
          <div>
            <RightTitle label="Aksi Kunjungan" />
            <div className="space-y-2">
              <ActionBtn
                icon={CreditCard}
                label="Ubah Penjamin / Pembuatan SEP"
                sublabel="Perbarui data jaminan & SEP"
                onClick={() => open("ubah-penjamin")}
              />
              <ActionBtn
                icon={Package}
                label="Ubah Paket"
                sublabel="Ganti paket layanan"
                onClick={() => open("ubah-paket")}
              />
              <ActionBtn
                icon={FilePen}
                label="Surat Rujukan"
                sublabel="Input / unggah rujukan"
                onClick={() => open("surat-rujukan")}
              />
              <ActionBtn
                icon={Car}
                label="Kecelakaan"
                sublabel="Isi data kecelakaan"
                variant="warning"
                onClick={() => open("kecelakaan")}
              />
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200" />

          {/* Manajemen Data */}
          <div>
            <RightTitle label="Manajemen Data" />
            <div className="space-y-2">
              <ActionBtn
                icon={RefreshCw}
                label="Update Kunjungan"
                sublabel="Ubah data kunjungan"
                onClick={() => open("update")}
              />
              <ActionBtn
                icon={Calendar}
                label="Update Tanggal Pulang SEP"
                sublabel={hasSEP ? "Perbarui tgl pulang BPJS" : "Tidak ada SEP"}
                variant="warning"
                onClick={() => open("update-sep")}
                disabled={!hasSEP}
              />
              <ActionBtn
                icon={Trash2}
                label="Hapus Kunjungan"
                sublabel="Hapus secara permanen"
                variant="danger"
                onClick={() => open("hapus")}
              />
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200" />

          {/* Cetak Dokumen */}
          <div>
            <RightTitle label="Cetak Dokumen" />
            <div className="space-y-2">
              <PrintBtn label="Bukti Pendaftaran" />
              <PrintBtn label="Barcode Pasien" />
              <PrintBtn label="Trecert" />
              <PrintBtn label="SEP" disabled={!hasSEP} />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <ActionModal id={modal} kunjungan={kunjungan} onClose={close} />
        )}
      </AnimatePresence>
    </div>
  );
}
