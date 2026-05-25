"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, CheckCircle2, AlertTriangle, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { type RadOrder, type ValidasiData, updateRadWorkflow, fmtDate } from "../radShared";
import { ingestRadOrder } from "@/lib/billing/chargeIngest";

// ── Report display (read-only) ────────────────────────────

function ReportSection({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-sm leading-relaxed text-slate-800">{value}</p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function ValidasiPane({
  order, onStatusChange,
}: { order: RadOrder; onStatusChange: () => void }) {
  const saved  = order.validasi;
  const eksper = order.ekspertasi;
  const isDone = saved?.isDone || order.status === "Selesai";

  const [catatan,     setCatatan]     = useState(saved?.catatan ?? "");
  const [checkKlinis, setCheckKlinis] = useState(saved?.checkKlinis ?? false);
  const [checkLen,    setCheckLen]    = useState(saved?.checkLengkap ?? false);
  const [validator,   setValidator]   = useState(saved?.validator ?? eksper?.spradNama ?? "");
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(isDone);

  const canSubmit = checkKlinis && checkLen && validator.trim().length >= 3 && !done;

  const handleValidasi = async () => {
    if (!canSubmit) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const now = new Date().toISOString();
    const data: ValidasiData = {
      catatan: catatan.trim() || undefined,
      checkKlinis, checkLengkap: checkLen,
      validator: validator.trim(),
      waktu: now, isDone: true,
    };
    updateRadWorkflow(order.id, {
      status: "Selesai",
      validasi: data,
      timestamps: { verifikasiHasil: now, rilis: now },
    });
    // BL6.1 — silent wiring ke Billing. Idempotent (dedupe by sourceRef).
    const result = ingestRadOrder({
      ...order,
      status: "Selesai",
      timestamps: { ...order.timestamps, verifikasiHasil: now, rilis: now },
    });
    if (result.ok && result.added > 0) {
      // eslint-disable-next-line no-console
      console.info(
        `[Billing] Rad ${order.noOrder} → invoice ${result.invoiceId} (+${result.added} charges, ${result.skipped} skipped)`,
      );
    }
    setDone(true);
    setLoading(false);
    onStatusChange();
  };

  const hasCritical = (eksper?.criticalFindings ?? []).length > 0;
  const unconfirmed = (eksper?.criticalFindings ?? []).filter((f) => !f.confirmed).length;

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_280px]">

      {/* ── Left: laporan review ── */}
      <div className="flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center gap-3 rounded-xl bg-cyan-600 px-4 py-3 text-white">
          <Award size={20} className="shrink-0" />
          <div>
            <p className="font-bold">Validasi & Rilis Laporan</p>
            <p className="text-[11px] text-cyan-200">Review & TTD SpRad · SNARS AP 6 · ISO 15189</p>
          </div>
        </div>

        {/* Unconfirmed critical warning */}
        {!done && hasCritical && unconfirmed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <AlertTriangle size={16} className="shrink-0 text-rose-600" />
            <p className="text-[12px] text-rose-700 font-medium">
              {unconfirmed} temuan kritis belum dikonfirmasi. Kembali ke Expertise untuk konfirmasi.
            </p>
          </motion.div>
        )}

        {/* Laporan review */}
        {eksper ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileText size={14} className="text-slate-400" />
              <p className="text-[11px] font-bold text-slate-500">Laporan Radiologi — Review</p>
              <span className="ml-auto rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                {order.items[0]?.modalitas}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <ReportSection label="Indikasi Klinis"     value={eksper.indikasiKlinis} />
              <ReportSection label="Teknik Pemeriksaan"  value={eksper.teknik}          />
              <ReportSection label="Temuan"              value={eksper.temuan}          />
              <ReportSection label="Kesan / Konklusi"   value={eksper.kesan}           />
              <ReportSection label="Saran"               value={eksper.saran}           />
            </div>

            {hasCritical && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="mb-1 text-[11px] font-bold text-rose-700">Temuan Kritis</p>
                {eksper.criticalFindings.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 text-[11px]">
                    {f.confirmed
                      ? <CheckCircle2 size={11} className="text-emerald-500" />
                      : <AlertTriangle size={11} className="text-rose-500" />
                    }
                    <span className={f.confirmed ? "text-emerald-700" : "text-rose-700"}>
                      {f.kategori}
                      {f.confirmed && ` — via ${f.metode} ke ${f.namaDokter}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2">
              <User size={13} className="text-teal-600" />
              <div>
                <p className="text-[11px] font-bold text-teal-800">{eksper.spradNama}</p>
                <p className="text-[10px] text-teal-600">{eksper.spradSIP}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-slate-400">
            <FileText size={24} className="text-slate-300" />
            <p className="text-sm">Laporan expertise belum tersedia</p>
          </div>
        )}

        {/* Done state */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200">
                <Award size={24} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-emerald-800">Laporan Divalidasi & Dirilis</p>
                <p className="text-sm text-emerald-600">
                  oleh {saved?.validator ?? validator}
                </p>
                <p className="text-[11px] text-emerald-500">
                  {saved?.waktu ? new Date(saved.waktu).toLocaleString("id-ID") : "—"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right: validation form ── */}
      <div className="flex flex-col gap-3">

        {/* Checklist */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-[11px] font-bold text-slate-600">Checklist Validasi SpRad</p>

          <div className="flex flex-col gap-2.5">
            {([
              { key: "klinis",  state: checkKlinis, setter: setCheckKlinis, label: "Laporan konsisten dengan indikasi klinis",   sub: "Temuan sesuai presentasi klinis pasien"        },
              { key: "lengkap", state: checkLen,    setter: setCheckLen,    label: "Laporan lengkap dan sesuai standar",          sub: "Semua bagian terisi: teknik, temuan, kesan"    },
            ] as { key: string; state: boolean; setter: (v: boolean) => void; label: string; sub: string }[]).map(({ key, state, setter, label, sub }) => (
              <button
                key={key}
                type="button"
                disabled={done}
                onClick={() => setter(!state)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                  state
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-teal-200",
                  done && "opacity-60 cursor-not-allowed",
                )}
              >
                <div className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  state ? "border-emerald-500 bg-emerald-500" : "border-slate-300",
                )}>
                  {state && <CheckCircle2 size={11} className="text-white" />}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-slate-700">{label}</p>
                  <p className="text-[10px] text-slate-400">{sub}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Catatan validator */}
          <div className="mt-4">
            <label className="mb-1.5 block text-[11px] font-bold text-slate-500">Catatan SpRad (Opsional)</label>
            <textarea
              rows={3}
              disabled={done}
              placeholder="Tambahan catatan klinis atau koreksi minor..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:opacity-60"
            />
          </div>

          {/* Validator name */}
          <div className="mt-3">
            <label className="mb-1 block text-[11px] font-bold text-slate-500">Nama Validator (SpRad) *</label>
            <input
              type="text"
              disabled={done}
              placeholder="dr. Nama SpRad"
              value={validator}
              onChange={(e) => setValidator(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:opacity-60"
            />
          </div>

          {/* Submit */}
          {!done && (
            <motion.button
              onClick={handleValidasi}
              disabled={!canSubmit || loading}
              whileHover={canSubmit ? { scale: 1.01 } : {}}
              whileTap={canSubmit ? { scale: 0.99 } : {}}
              className={cn(
                "mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
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
              ) : <Award size={16} />}
              {loading ? "Merilis..." : "Validasi & Rilis Laporan"}
            </motion.button>
          )}
        </div>

        {/* Patient info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Pasien</p>
          <div className="space-y-1.5 text-[11px]">
            {[
              { label: "Nama",     value: order.namaPasien  },
              { label: "No. RM",   value: order.noRM        },
              { label: "Tgl Lahir",value: fmtDate(order.tanggalLahir) },
              { label: "Dokter",   value: order.dokter      },
              { label: "No. Order",value: order.noOrder     },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-400">{label}</span>
                <span className="font-semibold text-slate-700 text-right max-w-[130px] truncate">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SNARS info */}
        <div className="rounded-xl bg-teal-50 p-3">
          <p className="text-[10px] font-bold text-teal-800">SNARS AP 6 · Standar Validasi</p>
          <p className="mt-1 text-[10px] text-teal-600 leading-relaxed">
            Laporan radiologi wajib ditandatangani oleh dokter spesialis radiologi sebelum dirilis ke rekam medis pasien.
          </p>
        </div>
      </div>
    </div>
  );
}
