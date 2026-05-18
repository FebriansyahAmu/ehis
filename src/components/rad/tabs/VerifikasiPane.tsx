"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, User, Calendar, Hash, CheckCircle2,
  Clock, UserCheck, Stethoscope, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type RadOrder, updateRadWorkflow } from "../radShared";

// ── Identity card ─────────────────────────────────────────

interface IdentCard {
  label: string;
  value: string;
  icon:  React.ElementType;
  check: boolean;
  onCheck: (v: boolean) => void;
}

function IdentityCard({ label, value, icon: Icon, check, onCheck }: IdentCard) {
  return (
    <motion.button
      type="button"
      onClick={() => onCheck(!check)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200 w-full",
        check
          ? "border-teal-400 bg-teal-50 shadow-sm shadow-teal-100"
          : "border-slate-200 bg-white hover:border-teal-200",
      )}
    >
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        check ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-400",
      )}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="truncate text-sm font-bold text-slate-900">{value}</p>
      </div>
      <div className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
        check ? "border-teal-500 bg-teal-500" : "border-slate-300",
      )}>
        {check && <CheckCircle2 size={13} className="text-white" />}
      </div>
    </motion.button>
  );
}

// ── Info card ─────────────────────────────────────────────

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={13} className="shrink-0 text-slate-400" />
      <div>
        <p className="text-[10px] text-slate-400">{label}</p>
        <p className="text-xs font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function VerifikasiPane({
  order, onStatusChange,
}: { order: RadOrder; onStatusChange: () => void }) {
  const isDone = order.diterima_oleh !== undefined ||
    ["Persiapan", "Akuisisi", "Expertise", "Verifikasi_Hasil", "Selesai"].includes(order.status);

  const [chkNama,   setChkNama]   = useState(isDone);
  const [chkTgl,    setChkTgl]    = useState(isDone);
  const [chkRM,     setChkRM]     = useState(isDone);
  const [petugas,   setPetugas]   = useState(order.diterima_oleh ?? "");
  const [waktu,     setWaktu]     = useState(order.timestamps.verifikasi?.slice(11, 16) ?? "");
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(isDone);

  const allChecked  = chkNama && chkTgl && chkRM;
  const canSubmit   = allChecked && petugas.trim().length >= 3 && !done;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const now = new Date().toISOString();
    updateRadWorkflow(order.id, {
      status: "Persiapan",
      diterima_oleh: petugas.trim(),
      timestamps: { verifikasi: now },
    });

    setDone(true);
    setLoading(false);
    onStatusChange();
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_280px]">

      {/* ── Left: verification form ── */}
      <div className="flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center gap-3 rounded-xl bg-teal-600 px-4 py-3 text-white">
          <ShieldCheck size={20} className="shrink-0" />
          <div>
            <p className="font-bold">Verifikasi Identitas Pasien</p>
            <p className="text-[11px] text-teal-200">Konfirmasi 2 dari 3 identitas · SKP 1 · JCI IPSG 1</p>
          </div>
        </div>

        {/* Identity cards */}
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 py-8"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200">
                <ShieldCheck size={28} className="text-white" />
              </div>
              <div className="text-center">
                <p className="font-bold text-emerald-800">Identitas Terverifikasi</p>
                <p className="text-sm text-emerald-600">
                  oleh <span className="font-semibold">{order.diterima_oleh ?? petugas}</span>
                </p>
                <p className="mt-1 text-[11px] text-emerald-500">
                  {order.timestamps.verifikasi
                    ? new Date(order.timestamps.verifikasi).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                    : "—"
                  }
                </p>
              </div>
              <div className="flex gap-2">
                {[
                  { label: "Nama", icon: User },
                  { label: "Tgl Lahir", icon: Calendar },
                  { label: "No. RM", icon: Hash },
                ].map(({ label, icon: Icon }) => (
                  <span key={label} className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    <Icon size={10} /> {label} ✓
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" className="flex flex-col gap-2.5">
              <IdentityCard
                label="Nama Lengkap" value={order.namaPasien} icon={User}
                check={chkNama} onCheck={setChkNama}
              />
              <IdentityCard
                label="Tanggal Lahir" value={fmt(order.tanggalLahir)} icon={Calendar}
                check={chkTgl} onCheck={setChkTgl}
              />
              <IdentityCard
                label="Nomor Rekam Medis" value={order.noRM} icon={Hash}
                check={chkRM} onCheck={setChkRM}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Petugas + Waktu */}
        {!done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <UserCheck size={12} />
                Nama Radiografer / Petugas
              </label>
              <input
                type="text"
                placeholder="Nama lengkap + gelar"
                value={petugas}
                onChange={(e) => setPetugas(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <Clock size={12} />
                Waktu Verifikasi
              </label>
              <input
                type="time"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </motion.div>
        )}

        {/* Warning if not all checked */}
        {!done && !allChecked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2"
          >
            <AlertCircle size={14} className="shrink-0 text-amber-600" />
            <p className="text-[11px] text-amber-700">
              Centang minimal 2 identitas sebelum melanjutkan
            </p>
          </motion.div>
        )}

        {/* Submit button */}
        {!done && (
          <motion.button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            whileHover={canSubmit ? { scale: 1.01 } : {}}
            whileTap={canSubmit ? { scale: 0.99 } : {}}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
              canSubmit
                ? "bg-teal-600 text-white shadow-md shadow-teal-200 hover:bg-teal-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed",
            )}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
              />
            ) : (
              <ShieldCheck size={16} />
            )}
            {loading ? "Menyimpan..." : "Konfirmasi Verifikasi Identitas"}
          </motion.button>
        )}
      </div>

      {/* ── Right: order info ── */}
      <div className="flex flex-col gap-3">

        {/* Order detail card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Detail Order</p>
          <div className="flex flex-col gap-3">
            <InfoRow label="No. Order"       value={order.noOrder}       icon={Hash}       />
            <InfoRow label="Dokter Pengirim" value={order.dokter}        icon={Stethoscope} />
            <InfoRow label="Asal Unit"       value={`${order.unitAsal}${order.noBed ? ` · ${order.noBed}` : ""}`} icon={UserCheck} />
            <InfoRow label="Tanggal / Jam"   value={`${order.tanggal} · ${order.jam}`} icon={Clock} />
          </div>
        </div>

        {/* Exam card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Pemeriksaan</p>
          <div className="flex flex-col gap-2">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-lg bg-teal-50 px-3 py-2">
                <p className="text-xs font-bold text-teal-800">{item.nama}</p>
                <p className="text-[10px] text-teal-600">{item.region} · {item.modalitas}</p>
                {item.withKontras && (
                  <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    + Kontras
                  </span>
                )}
              </div>
            ))}
          </div>
          {order.catatan && (
            <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-2">
              <p className="text-[10px] font-bold text-slate-400">Klinis / Indikasi</p>
              <p className="text-[11px] text-slate-600">{order.catatan}</p>
            </div>
          )}
        </div>

        {/* SKP info */}
        <div className="rounded-xl bg-teal-50 p-3">
          <p className="text-[10px] font-bold text-teal-800">SKP 1 · Ketepatan Identifikasi Pasien</p>
          <p className="mt-1 text-[10px] text-teal-600 leading-relaxed">
            Verifikasi menggunakan minimal 2 dari 3 identifier: Nama lengkap, Tanggal lahir, dan Nomor Rekam Medis.
            Tidak menggunakan nomor bed sebagai identifier.
          </p>
        </div>
      </div>
    </div>
  );
}
