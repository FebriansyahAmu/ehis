"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Syringe, ClipboardCheck, AlertTriangle, CheckCircle2,
  XCircle, Beaker, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LabOrder, type AlasanPenolakan, type SpecimenInfo,
  ALASAN_PENOLAKAN, updateLabWorkflow,
} from "../labShared";

interface Props { order: LabOrder; onStatusChange: () => void }

type Step = "ambil" | "registrasi";

const KONDISI_OPTS = ["Baik", ...ALASAN_PENOLAKAN] as const;

// ── Section Header ────────────────────────────────────────

function SectionHeader({
  step, label, isDone, isActive,
}: { step: string; label: string; isDone: boolean; isActive: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl px-4 py-3",
      isDone    ? "bg-emerald-50 ring-1 ring-emerald-200" :
      isActive  ? "bg-sky-50 ring-1 ring-sky-200"        :
      "bg-slate-50 ring-1 ring-slate-200",
    )}>
      <div className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
        isDone   ? "bg-emerald-100 text-emerald-700" :
        isActive ? "bg-sky-100 text-sky-700"         :
        "bg-slate-200 text-slate-500",
      )}>
        {isDone ? <CheckCircle2 size={14} /> : step}
      </div>
      <p className={cn(
        "text-sm font-semibold",
        isDone ? "text-emerald-700" : isActive ? "text-sky-700" : "text-slate-400",
      )}>
        {label}
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function SampelPane({ order, onStatusChange }: Props) {
  const hasSpecimen = !!order.specimen;
  const hasTerima   = order.status !== "Menunggu" && order.status !== "Diterima" && order.status !== "Ambil Sampel";
  const isDitolak   = order.status === "Ditolak";

  const ambilDone  = hasSpecimen && !!order.specimen?.waktuAmbil;
  const terimaDone = hasTerima;

  // ── Step A: Ambil Sampel ────────────────────────────────
  const [jenisTube,  setJenisTube]  = useState(order.specimen?.jenisTube ?? "");
  const [volumeMl,   setVolumeMl]   = useState(order.specimen?.volumeMl  ?? "");
  const [waktuAmbil, setWaktuAmbil] = useState(order.specimen?.waktuAmbil ?? "");
  const [petugas,    setPetugas]    = useState(order.specimen?.petugas    ?? "");
  const [lokasi,     setLokasi]     = useState(order.specimen?.lokasi     ?? "");
  const [savingA,    setSavingA]    = useState(false);
  const [doneA,      setDoneA]      = useState(ambilDone);

  // ── Step B: Registrasi Sampel ───────────────────────────
  const [kondisi,      setKondisi]      = useState<typeof KONDISI_OPTS[number]>(
    (order.specimen?.kondisi as typeof KONDISI_OPTS[number]) ?? "Baik",
  );
  const [noReg,        setNoReg]        = useState(order.specimen?.noRegistrasi ?? "");
  const [waktuTerima,  setWaktuTerima]  = useState(order.specimen?.waktuTerima  ?? "");
  const [alasanLain,   setAlasanLain]   = useState("");
  const [savingB,      setSavingB]      = useState(false);
  const [doneB,        setDoneB]        = useState(terimaDone);
  const [showReject,   setShowReject]   = useState(false);
  const [instruksi,    setInstruksi]    = useState(order.penolakan?.instruksi ?? "");

  const isRejectable = kondisi !== "Baik" && kondisi !== undefined;

  function handleAmbil() {
    if (!jenisTube || !waktuAmbil || !petugas) return;
    setSavingA(true);
    setTimeout(() => {
      updateLabWorkflow(order.id, {
        status: "Ambil Sampel",
        specimen: { jenisTube, volumeMl, waktuAmbil, petugas, lokasi },
        timestamps: { ambil: `2026-05-18T${waktuAmbil}` },
      });
      setSavingA(false);
      setDoneA(true);
      onStatusChange();
    }, 500);
  }

  function handleTerima() {
    if (!noReg || !waktuTerima) return;
    setSavingB(true);
    setTimeout(() => {
      updateLabWorkflow(order.id, {
        status: "Sampel Diterima",
        specimen: {
          jenisTube, volumeMl, waktuAmbil, petugas, lokasi,
          kondisi: kondisi as SpecimenInfo["kondisi"],
          noRegistrasi: noReg, waktuTerima,
        },
        timestamps: { registrasi: `2026-05-18T${waktuTerima}` },
      });
      setSavingB(false);
      setDoneB(true);
      onStatusChange();
    }, 500);
  }

  function handleReject() {
    if (!kondisi || kondisi === "Baik") return;
    setSavingB(true);
    setTimeout(() => {
      updateLabWorkflow(order.id, {
        status: "Ditolak",
        specimen: { jenisTube, volumeMl, waktuAmbil, petugas, lokasi, kondisi: kondisi as AlasanPenolakan },
        penolakan: {
          alasan: kondisi === "Lainnya" ? alasanLain : kondisi,
          waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          petugas: noReg || "Lab Officer",
          instruksi,
        },
        timestamps: { registrasi: `2026-05-18T${waktuTerima || new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` },
      });
      setSavingB(false);
      setShowReject(false);
      setDoneB(true);
      onStatusChange();
    }, 500);
  }

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400";
  const labelCls = "block text-[11px] font-semibold text-slate-500 mb-1";

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_320px]">

      {/* Left — Steps */}
      <div className="space-y-4">

        {/* Step A */}
        <SectionHeader step="1" label="Pengambilan Sampel" isDone={doneA} isActive={!doneA} />

        <AnimatePresence>
          {!doneA ? (
            <motion.div
              key="formA"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Jenis Tabung / Wadah <span className="text-rose-400">*</span></label>
                  <input value={jenisTube} onChange={(e) => setJenisTube(e.target.value)} placeholder="Mis: EDTA ungu + SST II kuning" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Volume</label>
                  <input value={volumeMl} onChange={(e) => setVolumeMl(e.target.value)} placeholder="3 mL" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Waktu Ambil <span className="text-rose-400">*</span></label>
                  <input type="time" value={waktuAmbil} onChange={(e) => setWaktuAmbil(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Petugas Flebotomi <span className="text-rose-400">*</span></label>
                  <input value={petugas} onChange={(e) => setPetugas(e.target.value)} placeholder="Nama petugas / perawat" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Lokasi Ambil</label>
                  <input value={lokasi} onChange={(e) => setLokasi(e.target.value)} placeholder="V. antecubiti kanan" className={inputCls} />
                </div>
              </div>
              <button
                onClick={handleAmbil}
                disabled={!jenisTube || !waktuAmbil || !petugas || savingA}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-40"
              >
                <Syringe size={15} />
                {savingA ? "Menyimpan…" : "Konfirmasi Pengambilan Sampel"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="doneA"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm"
            >
              <p className="font-bold text-emerald-800">✓ Sampel diambil: {order.specimen?.waktuAmbil}</p>
              <p className="text-[11px] text-emerald-700">{order.specimen?.jenisTube} · {order.specimen?.petugas} · {order.specimen?.lokasi}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step B */}
        <SectionHeader step="2" label="Penerimaan & Registrasi Sampel di Lab" isDone={doneB && !isDitolak} isActive={doneA && !doneB} />

        <AnimatePresence>
          {doneA && !doneB && (
            <motion.div
              key="formB"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>No. Registrasi Lab <span className="text-rose-400">*</span></label>
                  <input value={noReg} onChange={(e) => setNoReg(e.target.value)} placeholder="REG/2026/05/XXXX" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Waktu Terima <span className="text-rose-400">*</span></label>
                  <input type="time" value={waktuTerima} onChange={(e) => setWaktuTerima(e.target.value)} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Kondisi Sampel <span className="text-rose-400">*</span></label>
                  <select
                    value={kondisi}
                    onChange={(e) => setKondisi(e.target.value as typeof KONDISI_OPTS[number])}
                    className={cn(inputCls, kondisi !== "Baik" && "border-rose-300 ring-1 ring-rose-200")}
                  >
                    {KONDISI_OPTS.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                {kondisi === "Lainnya" && (
                  <div className="col-span-2">
                    <label className={labelCls}>Keterangan Lainnya</label>
                    <input value={alasanLain} onChange={(e) => setAlasanLain(e.target.value)} className={inputCls} />
                  </div>
                )}
              </div>

              {isRejectable && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-rose-200 bg-rose-50 p-3"
                >
                  <div className="flex items-center gap-2 text-rose-700">
                    <AlertTriangle size={14} />
                    <p className="text-[12px] font-bold">Kondisi tidak memenuhi syarat — specimen akan ditolak</p>
                  </div>
                  <div className="mt-2">
                    <label className={cn(labelCls, "text-rose-600")}>Instruksi untuk Pengirim</label>
                    <textarea
                      value={instruksi}
                      onChange={(e) => setInstruksi(e.target.value)}
                      rows={2}
                      placeholder="Petunjuk pengambilan ulang..."
                      className={cn(inputCls, "resize-none text-[12px]")}
                    />
                  </div>
                </motion.div>
              )}

              <div className="flex gap-2">
                {!isRejectable ? (
                  <button
                    onClick={handleTerima}
                    disabled={!noReg || !waktuTerima || savingB}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-40"
                  >
                    <ClipboardCheck size={15} />
                    {savingB ? "Menyimpan…" : "Daftarkan Sampel"}
                  </button>
                ) : (
                  <button
                    onClick={handleReject}
                    disabled={savingB}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-40"
                  >
                    <XCircle size={15} />
                    {savingB ? "Memproses…" : "Tolak Specimen"}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Done state */}
        {doneB && !isDitolak && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
          >
            <p className="text-sm font-bold text-emerald-800">✓ Sampel terdaftar di laboratorium</p>
            <p className="text-[11px] text-emerald-700">
              No. Reg: {order.specimen?.noRegistrasi} · Terima: {order.specimen?.waktuTerima} · Kondisi: {order.specimen?.kondisi}
            </p>
          </motion.div>
        )}

        {/* Rejected state */}
        {isDitolak && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <div className="flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3">
              <XCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
              <div>
                <p className="text-sm font-bold text-rose-800">Specimen Ditolak</p>
                <p className="text-[12px] text-rose-700">Alasan: {order.penolakan?.alasan}</p>
                <p className="text-[12px] text-rose-700">Oleh: {order.penolakan?.petugas} · {order.penolakan?.waktu}</p>
                {order.penolakan?.instruksi && (
                  <p className="mt-1 text-[12px] text-rose-600">{order.penolakan.instruksi}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <RotateCcw size={13} className="text-amber-600" />
              <p className="text-[11px] text-amber-700 font-medium">
                Minta pengambilan ulang kepada unit pengirim dan buat order baru
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Right — Guide */}
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Kriteria Penolakan Sampel
          </h4>
          <div className="space-y-1.5 text-[11px]">
            {[
              { k: "Hemolisis",        d: "Sampel merah keruh, Hb terlepas dari eritrosit" },
              { k: "Lipemia",          d: "Serum keruh/putih seperti susu karena lemak" },
              { k: "Bekuan",           d: "Sampel membeku, tidak dapat dianalisa" },
              { k: "Volume Kurang",    d: "Volume tidak mencukupi untuk semua pemeriksaan" },
              { k: "Salah Tabung",     d: "Jenis tabung/antikoagulan tidak sesuai" },
              { k: "Label Rusak/Salah", d: "Label rusak, tulisan tidak terbaca, atau tidak cocok" },
            ].map(({ k, d }) => (
              <div key={k} className="flex gap-2">
                <span className="shrink-0 font-semibold text-rose-600 w-28">{k}</span>
                <span className="text-slate-500">{d}</span>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[10px] text-slate-400 border-t border-slate-100 pt-2">
            Ref: ISO 15189:2022 §5.4.5 · PMK 43/2013
          </p>
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
          <div className="flex items-start gap-2">
            <Beaker size={14} className="mt-0.5 text-sky-600" />
            <div className="text-[11px]">
              <p className="font-bold text-sky-800">Pemeriksaan yang Diminta</p>
              {order.items.map((i) => (
                <p key={i.id} className="mt-0.5 text-sky-700">· {i.nama} ({i.waktuTunggu})</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
