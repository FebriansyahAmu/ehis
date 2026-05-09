"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Clock, UserCheck, FileText, ClipboardList,
  ChevronDown, ChevronUp, CheckSquare, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  URGENCY_CONFIG, STATUS_CONFIG, STATUS_STEPS, elapsedSince,
  type KonsultasiItem, type KonsultasiJawaban,
} from "./konsultasiShared";

interface Props {
  item: KonsultasiItem;
  onUpdate: (updated: KonsultasiItem) => void;
  onBack?: () => void;
}

const SBAR_SECTIONS = [
  { key: "situation"      as const, label: "S — Situation",      color: "bg-sky-50 text-sky-700 border-sky-200"      },
  { key: "background"     as const, label: "B — Background",     color: "bg-violet-50 text-violet-700 border-violet-200" },
  { key: "assessment"     as const, label: "A — Assessment",     color: "bg-amber-50 text-amber-700 border-amber-200"  },
  { key: "recommendation" as const, label: "R — Recommendation", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

const JAWABAN_FIELDS: { key: keyof Omit<KonsultasiJawaban,"followUp">; label: string; rows: number }[] = [
  { key: "asesmen",      label: "Asesmen Konsultan",  rows: 3 },
  { key: "rekomendasi",  label: "Rekomendasi",         rows: 4 },
  { key: "tindakLanjut", label: "Tindak Lanjut",       rows: 2 },
];

export default function DetailPane({ item, onUpdate, onBack }: Props) {
  const [sbarOpen,    setSbarOpen]   = useState(false);
  const [jawabMode,   setJawabMode]  = useState(false);
  const [cpptNotif,   setCpptNotif]  = useState(false);
  const [jawaban, setJawaban] = useState<Partial<KonsultasiJawaban>>({
    konsultan: item.dokterKonsultan ?? "",
    asesmen: "", rekomendasi: "", tindakLanjut: "", followUp: "",
  });

  const urgCfg = URGENCY_CONFIG[item.urgency];
  const statCfg = STATUS_CONFIG[item.status];
  const stepIdx = STATUS_STEPS.indexOf(item.status as typeof STATUS_STEPS[number]);

  function handleConfirmReceived() {
    onUpdate({ ...item, status: "Diterima", waktuDiterima: "10:30" });
  }

  function handleSubmitJawaban() {
    if (!jawaban.asesmen?.trim() || !jawaban.rekomendasi?.trim() || !jawaban.tindakLanjut?.trim()) return;
    onUpdate({
      ...item,
      status: "Dijawab",
      waktuDijawab: "11:00",
      jawaban: {
        konsultan:    jawaban.konsultan ?? item.dokterKonsultan ?? "dr. Konsultan",
        asesmen:      jawaban.asesmen,
        rekomendasi:  jawaban.rekomendasi,
        tindakLanjut: jawaban.tindakLanjut,
        followUp:     jawaban.followUp || undefined,
      },
    });
    setJawabMode(false);
  }

  function handleDpjpConfirm() {
    onUpdate({ ...item, status: "Selesai", waktuSelesai: "11:15" });
    setCpptNotif(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.18 }}
      className="flex h-full flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-2 flex items-center gap-1.5 text-xs text-sky-600 hover:underline"
          >
            <ArrowLeft size={12} /> Kembali ke daftar
          </button>
        )}
        <div className="flex flex-wrap items-start gap-3">
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold",
            item.status === "Selesai" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700",
          )}>
            {item.smfSingkatan}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{item.smfNama}</p>
            <p className="truncate text-xs text-slate-400">
              {item.dokterKonsultan ?? "Konsultan belum ditentukan"}
              &nbsp;·&nbsp;{item.tanggalRequest} {item.waktuRequest}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", urgCfg.badge)}>
              {item.urgency}
            </span>
            <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", statCfg.badge)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", statCfg.dot)} />
              {item.status}
            </span>
          </div>
        </div>

        {/* Status progress steps */}
        <div className="mt-4 flex items-center">
          {STATUS_STEPS.map((step, i) => {
            const past    = stepIdx > i;
            const current = stepIdx === i && item.status !== "Ditolak";
            const sCfg    = STATUS_CONFIG[step];
            return (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-1 flex-col items-center gap-1">
                  <motion.div
                    animate={{
                      backgroundColor: past ? "#10b981" : current ? "#0284c7" : "#e2e8f0",
                      scale: current ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                  >
                    {past
                      ? <CheckCircle2 size={13} className="text-white" />
                      : <span className={cn("text-[10px] font-bold", current ? "text-white" : "text-slate-400")}>{i + 1}</span>
                    }
                  </motion.div>
                  <span className={cn("text-[9px] font-semibold", past || current ? "text-slate-700" : "text-slate-400")}>
                    {step}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <motion.div
                    animate={{ backgroundColor: past ? "#10b981" : "#e2e8f0" }}
                    transition={{ duration: 0.4 }}
                    className="h-px flex-1"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">

        {/* CPPT notification */}
        <AnimatePresence>
          {cpptNotif && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200"
            >
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold text-emerald-700">Entry CPPT Dibuat Otomatis</p>
                <p className="text-[11px] text-emerald-600">
                  Jawaban konsultasi SMF {item.smfNama} oleh {item.jawaban?.konsultan} telah tercatat
                  di CPPT sebagai catatan profesi Konsultan.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Response time */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <Clock size={13} className="shrink-0 text-slate-400" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-600">
              Dikirim {elapsedSince(item.tanggalRequest, item.waktuRequest)} yang lalu
            </p>
            {item.waktuDiterima && (
              <p className="text-[11px] text-slate-400">
                Diterima {item.waktuDiterima}
                {item.waktuDijawab ? ` · Dijawab ${item.waktuDijawab}` : " · Menunggu jawaban"}
              </p>
            )}
          </div>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", urgCfg.badge)}>
            SLA {urgCfg.time}
          </span>
        </div>

        {/* SBAR collapsible */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <button
            onClick={() => setSbarOpen(v => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <ClipboardList size={13} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Permintaan SBAR</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                {item.dokterPeminta}
              </span>
            </div>
            {sbarOpen ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
          </button>
          <AnimatePresence>
            {sbarOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {SBAR_SECTIONS.map(({ key, label, color }) => (
                    <div key={key} className="px-4 py-3">
                      <span className={cn("mb-1.5 inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold", color)}>
                        {label}
                      </span>
                      <p className="text-xs leading-relaxed text-slate-700">{item[key]}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Jawaban display */}
        {item.jawaban && (
          <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-2 border-b border-emerald-100 px-4 py-3">
              <UserCheck size={13} className="text-emerald-600" />
              <div className="flex-1">
                <span className="text-xs font-semibold text-emerald-700">Jawaban Konsultasi</span>
                <span className="ml-2 text-[10px] text-emerald-600">{item.jawaban.konsultan}</span>
              </div>
              {item.waktuDijawab && (
                <span className="text-[10px] text-emerald-500">{item.tanggalRequest} {item.waktuDijawab}</span>
              )}
            </div>
            <div className="divide-y divide-emerald-100">
              <div className="px-4 py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">Asesmen</p>
                <p className="text-xs leading-relaxed text-slate-700">{item.jawaban.asesmen}</p>
              </div>
              <div className="px-4 py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">Rekomendasi</p>
                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-700">{item.jawaban.rekomendasi}</p>
              </div>
              <div className="px-4 py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">Tindak Lanjut</p>
                <p className="text-xs leading-relaxed text-slate-700">{item.jawaban.tindakLanjut}</p>
              </div>
              {item.jawaban.followUp && (
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Kontrol Kembali</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {item.jawaban.followUp}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inline jawaban form */}
        <AnimatePresence>
          {jawabMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden rounded-xl border border-sky-200 bg-sky-50"
            >
              <div className="border-b border-sky-200 px-4 py-3">
                <p className="text-xs font-semibold text-sky-700">Isi Jawaban Konsultasi</p>
                <p className="text-[11px] text-sky-500">
                  Diisi oleh: {item.dokterKonsultan ?? "Dokter Konsultan"}
                </p>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600">Nama Konsultan</label>
                  <input
                    value={jawaban.konsultan ?? ""}
                    onChange={e => setJawaban(p => ({ ...p, konsultan: e.target.value }))}
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                    placeholder="dr. Nama, Sp.XX"
                  />
                </div>
                {JAWABAN_FIELDS.map(({ key, label, rows }) => (
                  <div key={key}>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">{label} *</label>
                    <textarea
                      rows={rows}
                      value={(jawaban[key] as string) ?? ""}
                      onChange={e => setJawaban(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full resize-y rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none placeholder:text-slate-400 transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                      placeholder={`Isi ${label.toLowerCase()}...`}
                    />
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                    Kontrol / Follow Up <span className="font-normal text-slate-400">(opsional)</span>
                  </label>
                  <input
                    type="date"
                    value={jawaban.followUp ?? ""}
                    onChange={e => setJawaban(p => ({ ...p, followUp: e.target.value }))}
                    className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setJawabMode(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-slate-500 transition hover:bg-sky-100"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmitJawaban}
                    className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-700 active:scale-95"
                  >
                    <CheckSquare size={12} /> Kirim Jawaban
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action footer */}
      {!jawabMode && item.status !== "Selesai" && item.status !== "Ditolak" && (
        <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-3">
          {item.status === "Terkirim" && (
            <button
              onClick={handleConfirmReceived}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 active:scale-95"
            >
              <UserCheck size={14} />
              Konfirmasi Diterima (Konsultan)
            </button>
          )}
          {item.status === "Diterima" && (
            <button
              onClick={() => setJawabMode(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600 active:scale-95"
            >
              <FileText size={14} />
              Isi Jawaban Konsultasi
            </button>
          )}
          {item.status === "Dijawab" && (
            <button
              onClick={handleDpjpConfirm}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 active:scale-95"
            >
              <CheckCircle2 size={14} />
              Konfirmasi &amp; Tandatangani DPJP
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
