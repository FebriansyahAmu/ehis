"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronRight, Stethoscope, ExternalLink, X,
  Pencil, Check, UserCog, Calendar, DoorOpen, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster, KunjunganRecord } from "@/lib/data";
import { UNIT_CFG, StatusBadge } from "./shared";

const sm    = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 placeholder:text-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition";
const smSel = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition cursor-pointer";
const lbl   = "mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400";

function InfoChip({ icon: Icon, label, value }: {
  icon:  React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={11} className="shrink-0 text-slate-400" />
      <span className="text-[10.5px] text-slate-400">{label}</span>
      <span className="text-[11px] font-semibold text-slate-700">{value || "—"}</span>
    </div>
  );
}

export function KunjunganDetailHeader({
  patient,
  kunjungan,
}: {
  patient:   PatientMaster;
  kunjungan: KunjunganRecord;
}) {
  const unit     = UNIT_CFG[kunjungan.unit];
  const initials = patient.name.split(" ").map(n => n[0]).slice(0, 2).join("");

  const [isEditing, setIsEditing] = useState(false);
  const [dokter,    setDokter]    = useState(kunjungan.dokter ?? "");
  const [tanggal,   setTanggal]   = useState(kunjungan.tanggal ?? "");
  const [caraMasuk, setCaraMasuk] = useState(kunjungan.caraMasuk ?? "");
  const [keluhan,   setKeluhan]   = useState(kunjungan.keluhan ?? "");

  const handleSave = () => setIsEditing(false);
  const handleCancel = () => {
    setDokter(kunjungan.dokter ?? "");
    setTanggal(kunjungan.tanggal ?? "");
    setCaraMasuk(kunjungan.caraMasuk ?? "");
    setKeluhan(kunjungan.keluhan ?? "");
    setIsEditing(false);
  };

  return (
    <header className="shrink-0 bg-white shadow-sm">

      {/* Unit accent strip */}
      <div className={cn("h-0.5 w-full", unit.accent)} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 px-5 py-2 text-[11px]">
        <Link href="/ehis-registration" className="text-slate-400 transition hover:text-slate-600">
          Beranda
        </Link>
        <ChevronRight size={10} className="shrink-0 text-slate-300" />
        <Link
          href={`/ehis-registration/pasien/${patient.noRM}`}
          className="max-w-35 truncate text-slate-400 transition hover:text-slate-600"
        >
          {patient.name}
        </Link>
        <ChevronRight size={10} className="shrink-0 text-slate-300" />
        <span className="font-medium text-slate-600">Detail kunjungan</span>
        <Link
          href="/ehis-registration"
          className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={12} />
        </Link>
      </div>

      {/* Patient identity row */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3 px-5 py-3"
      >
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-[13px] font-bold text-indigo-700 ring-2 ring-indigo-50">
          {initials}
        </div>

        {/* Name + IDs */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[15px] font-bold text-slate-900">{patient.name}</span>
            <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9.5px] text-slate-500">
              {patient.noRM}
            </span>
            <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold", unit.bg, unit.text)}>
              {kunjungan.unit}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-indigo-600">{kunjungan.noPendaftaran}</span>
            <span className="text-slate-200">·</span>
            <span className="text-[11px] text-slate-400">{tanggal}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/ehis-registration/pasien/${patient.noRM}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            <ArrowLeft size={12} />
            <span className="hidden sm:inline">Kembali</span>
          </Link>
          {kunjungan.klinisPath && (
            <Link
              href={kunjungan.klinisPath}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-100 active:scale-95"
            >
              <Stethoscope size={12} />
              <span className="hidden md:inline">Rekam Medis</span>
              <ExternalLink size={10} className="hidden md:block" />
            </Link>
          )}
          <StatusBadge status={kunjungan.status} />
        </div>
      </motion.div>

      {/* ── Info bar / Inline edit ── */}
      <div className="border-t border-emerald-100 bg-emerald-50/50 px-5">
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-3 py-2.5"
            >
              {/* Info chips */}
              <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1.5">
                <InfoChip icon={UserCog}  label="DPJP"       value={dokter}    />
                <span className="hidden h-3 w-px bg-slate-200 sm:block" />
                <InfoChip icon={Calendar} label="Tanggal"    value={tanggal}   />
                <span className="hidden h-3 w-px bg-slate-200 sm:block" />
                <InfoChip icon={DoorOpen} label="Cara masuk" value={caraMasuk} />
                {keluhan && (
                  <>
                    <span className="hidden h-3 w-px bg-slate-200 md:block" />
                    <div className="hidden items-center gap-1.5 md:flex">
                      <MessageSquare size={11} className="shrink-0 text-slate-400" />
                      <span className="max-w-56 truncate text-[11px] italic text-slate-400">
                        &ldquo;{keluhan}&rdquo;
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Edit trigger */}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[10.5px] font-semibold text-emerald-600 transition hover:border-emerald-400 hover:bg-emerald-100 hover:text-emerald-700 active:scale-95"
              >
                <Pencil size={10} />
                Edit
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3 py-3"
            >
              {/* Fields row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className={lbl}>DPJP</p>
                  <input
                    className={sm}
                    value={dokter}
                    onChange={e => setDokter(e.target.value)}
                    placeholder="Nama dokter penanggung jawab..."
                    autoFocus
                  />
                </div>
                <div>
                  <p className={lbl}>Tanggal Kunjungan</p>
                  <input
                    type="date"
                    className={sm}
                    value={tanggal}
                    onChange={e => setTanggal(e.target.value)}
                  />
                </div>
                <div>
                  <p className={lbl}>Cara Masuk</p>
                  <select
                    className={smSel}
                    value={caraMasuk}
                    onChange={e => setCaraMasuk(e.target.value)}
                  >
                    <option value="">Pilih cara masuk...</option>
                    <option>Rawat Jalan</option>
                    <option>IGD</option>
                    <option>Rujukan</option>
                    <option>Langsung</option>
                  </select>
                </div>
              </div>

              {/* Keluhan row */}
              <div>
                <p className={lbl}>Keluhan Utama</p>
                <input
                  className={sm}
                  value={keluhan}
                  onChange={e => setKeluhan(e.target.value)}
                  placeholder="Keluhan utama pasien..."
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pb-1">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky-700 active:scale-95"
                >
                  <Check size={11} />
                  Simpan
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
