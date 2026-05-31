"use client";

import { useState } from "react";
import { AlertCircle, Stethoscope, BedDouble, Shield, Info, CalendarPlus, Check, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PatientMaster, KunjunganRecord } from "@/lib/data";
import { addKunjungan } from "@/lib/registration/registrationStore";
import type { PendaftaranKunjunganInput } from "@/lib/registration/types";
import { emitTask, setStatus } from "@/lib/antrean/antreanStore";
import { ModalShell } from "../primitives";
import { PENJAMIN_CFG, POLI_OPTS } from "../config";

/** No. SEP dummy untuk pasien BPJS (mock — backend terbitkan via V-Claim). */
function genSEP(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `SEP-${ymd}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

type UnitDaftar = "IGD" | "Rawat Jalan" | "Rawat Inap";
type CaraMasuk = "Datang Sendiri" | "Rujukan Puskesmas" | "Rujukan RS" | "Transfer Internal";
type TriaseLevel = 1 | 2 | 3 | 4 | 5;

const CARA_MASUK_OPTS: CaraMasuk[] = [
  "Datang Sendiri", "Rujukan Puskesmas", "Rujukan RS", "Transfer Internal",
];

const TRIASE_CFG: Record<TriaseLevel, { label: string; idle: string; active: string }> = {
  1: { label: "I — Resusitasi", idle: "border-rose-200 bg-rose-50 text-rose-700", active: "border-rose-600 bg-rose-600 text-white" },
  2: { label: "II — Emergent", idle: "border-orange-200 bg-orange-50 text-orange-700", active: "border-orange-500 bg-orange-500 text-white" },
  3: { label: "III — Urgent", idle: "border-yellow-200 bg-yellow-50 text-yellow-700", active: "border-yellow-500 bg-yellow-500 text-white" },
  4: { label: "IV — Semi-Urgent", idle: "border-green-200 bg-green-50 text-green-700", active: "border-green-500 bg-green-500 text-white" },
  5: { label: "V — Non-Urgent", idle: "border-slate-200 bg-slate-50 text-slate-600", active: "border-slate-500 bg-slate-500 text-white" },
};

const UNIT_DAFTAR_CFG: {
  id: UnitDaftar;
  icon: typeof AlertCircle;
  label: string;
  desc: string;
  idle: string;
  active: string;
  dot: string;
}[] = [
  {
    id: "IGD",
    icon: AlertCircle,
    label: "IGD",
    desc: "Kegawatdaruratan",
    idle: "border-slate-100 hover:border-rose-200 hover:bg-rose-50/40",
    active: "border-rose-300 bg-rose-50 ring-2 ring-rose-100",
    dot: "bg-rose-500",
  },
  {
    id: "Rawat Jalan",
    icon: Stethoscope,
    label: "Rawat Jalan",
    desc: "Poli & konsultasi",
    idle: "border-slate-100 hover:border-sky-200 hover:bg-sky-50/40",
    active: "border-sky-300 bg-sky-50 ring-2 ring-sky-100",
    dot: "bg-sky-500",
  },
  {
    id: "Rawat Inap",
    icon: BedDouble,
    label: "Rawat Inap",
    desc: "Rawat di ruangan",
    idle: "border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40",
    active: "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100",
    dot: "bg-emerald-500",
  },
];

export function DaftarKunjunganModal({
  patient,
  onClose,
  kodebooking,
}: {
  patient: PatientMaster;
  onClose: () => void;
  /** ANT4 — bila dipicu dari Respon Kedatangan antrean: link + emit task 3. */
  kodebooking?: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [unit, setUnit] = useState<UnitDaftar>("Rawat Jalan");
  const [tanggal, setTanggal] = useState(today);
  const [jam, setJam] = useState(nowTime);
  const [caraMasuk, setCaraMasuk] = useState<CaraMasuk>("Datang Sendiri");
  const [noRujukan, setNoRujukan] = useState("");
  const [dokter, setDokter] = useState("");
  const [keluhan, setKeluhan] = useState("");
  const [triase, setTriase] = useState<TriaseLevel>(3);
  const [caraDatang, setCaraDatang] = useState("Jalan Kaki");
  const [poli, setPoli] = useState("Poli Umum");
  const [jenisKunj, setJenisKunj] = useState<"Baru" | "Lanjutan">("Baru");
  const [asalMasuk, setAsalMasuk] = useState("Dari Poli");
  const [kelasRawat, setKelasRawat] = useState("2");

  const [done, setDone] = useState(false);
  const [created, setCreated] = useState<KunjunganRecord | null>(null);

  const pjCfg = PENJAMIN_CFG[patient.penjamin.tipe];
  const isRujukan = caraMasuk === "Rujukan Puskesmas" || caraMasuk === "Rujukan RS";
  const isBPJS = patient.penjamin.tipe === "BPJS_Non_PBI" || patient.penjamin.tipe === "BPJS_PBI";

  function handleDaftar() {
    if (!keluhan.trim()) return;
    const input: PendaftaranKunjunganInput = {
      unit,
      tanggal,
      dokter: dokter.trim() || "—",
      keluhan: keluhan.trim(),
      caraMasuk,
      jenisKunjungan: jenisKunj,
      poli: unit === "Rawat Jalan" ? poli : undefined,
      kelas: unit === "Rawat Inap" ? kelasRawat : undefined,
      triase: unit === "IGD" ? triase : undefined,
      penjamin: pjCfg.label,
      noPenjamin: patient.penjamin.nomor,
      noSEP: isBPJS ? genSEP() : undefined,
      noRujukan: isRujukan ? noRujukan.trim() || undefined : undefined,
      kodebooking,
    };
    const rec = addKunjungan(patient.noRM, input);
    // ANT4 — bila dari Respon Kedatangan antrean: selesai admisi → menunggu poli.
    if (kodebooking) {
      emitTask(kodebooking, 3);
      setStatus(kodebooking, "MenungguPoli");
    }
    setCreated(rec);
    setDone(true);
  }

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
  const labelCls =
    "mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400";

  return (
    <ModalShell
      title="Pendaftaran Kunjungan Baru"
      subtitle={`${patient.name} · ${patient.noRM}`}
      onClose={onClose}
      size="lg"
    >
      {done && created ? (
        <SuccessPanel created={created} kodebooking={kodebooking} onClose={onClose} />
      ) : (
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 500 }}>
        {/* Left: Unit selector */}
        <div className="flex w-52 shrink-0 flex-col gap-2 border-r border-slate-100 bg-slate-50/80 p-3">
          <p className="px-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">Unit Kunjungan</p>
          {UNIT_DAFTAR_CFG.map((u) => {
            const isActive = unit === u.id;
            return (
              <button
                key={u.id}
                onClick={() => setUnit(u.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-left transition",
                  isActive ? u.active : u.idle,
                )}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-xs">
                  <u.icon size={14} className={isActive ? "text-slate-700" : "text-slate-400"} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold leading-tight text-slate-800">{u.label}</p>
                  <p className="text-[9px] leading-tight text-slate-400">{u.desc}</p>
                </div>
                {isActive && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", u.dot)} />}
              </button>
            );
          })}

          <div className="mt-auto rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-600">
              <Info size={9} /> Catatan
            </p>
            <p className="text-[10px] leading-relaxed text-amber-800">
              <span className="font-semibold">Lab & Radiologi</span> bukan kunjungan baru — dibuat sebagai order dari kunjungan aktif.
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {/* Waktu & Cara Masuk */}
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Waktu &amp; Cara Masuk</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tanggal</label>
                  <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Jam</label>
                  <input type="time" value={jam} onChange={(e) => setJam(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="mt-3">
                <label className={labelCls}>Cara Masuk</label>
                <div className="flex flex-wrap gap-1.5">
                  {CARA_MASUK_OPTS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setCaraMasuk(opt)}
                      className={cn(
                        "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                        caraMasuk === opt
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <AnimatePresence>
                {isRujukan && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="mt-3 overflow-hidden"
                  >
                    <label className={labelCls}>No. Surat Rujukan</label>
                    <input
                      type="text"
                      value={noRujukan}
                      onChange={(e) => setNoRujukan(e.target.value)}
                      placeholder="Nomor surat rujukan"
                      className={inputCls}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Unit-specific fields */}
            <AnimatePresence mode="wait">
              <motion.div
                key={unit}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3"
              >
                {unit === "IGD" && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detail IGD</p>
                    <div>
                      <label className={labelCls}>Level Triase</label>
                      <div className="flex flex-col gap-1.5">
                        {([1, 2, 3, 4, 5] as TriaseLevel[]).map((t) => {
                          const cfg = TRIASE_CFG[t];
                          const isActive = triase === t;
                          return (
                            <button
                              key={t}
                              onClick={() => setTriase(t)}
                              className={cn(
                                "flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-[11px] font-semibold transition",
                                isActive ? cfg.active : cfg.idle,
                              )}
                            >
                              <span>{cfg.label}</span>
                              {isActive && <Check size={12} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Cara Datang</label>
                      <div className="flex flex-wrap gap-1.5">
                        {["Jalan Kaki", "Ambulans", "Kendaraan Pribadi"].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setCaraDatang(opt)}
                            className={cn(
                              "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                              caraDatang === opt
                                ? "border-rose-400 bg-rose-50 text-rose-700"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {unit === "Rawat Jalan" && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detail Rawat Jalan</p>
                    <div>
                      <label className={labelCls}>Poli Tujuan</label>
                      <div className="relative">
                        <Building2 size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select value={poli} onChange={(e) => setPoli(e.target.value)} className={cn(inputCls, "pl-8")}>
                          {POLI_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Jenis Kunjungan</label>
                      <div className="flex gap-1.5">
                        {(["Baru", "Lanjutan"] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setJenisKunj(opt)}
                            className={cn(
                              "flex-1 cursor-pointer rounded-lg border py-2 text-[11px] font-semibold transition",
                              jenisKunj === opt
                                ? "border-sky-400 bg-sky-50 text-sky-700"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {unit === "Rawat Inap" && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detail Rawat Inap</p>
                    <div>
                      <label className={labelCls}>Asal Masuk</label>
                      <div className="flex flex-wrap gap-1.5">
                        {["Dari IGD", "Dari Poli", "Langsung"].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setAsalMasuk(opt)}
                            className={cn(
                              "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                              asalMasuk === opt
                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Kelas Rawat</label>
                      <div className="flex gap-1.5">
                        {([["1", "Kelas 1"], ["2", "Kelas 2"], ["3", "Kelas 3"], ["vip", "VIP"]] as [string, string][]).map(
                          ([val, lab]) => (
                            <button
                              key={val}
                              onClick={() => setKelasRawat(val)}
                              className={cn(
                                "flex-1 cursor-pointer rounded-lg border py-2 text-[11px] font-semibold transition",
                                kelasRawat === val
                                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                              )}
                            >
                              {lab}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div>
              <label className={labelCls}>Dokter Penanggung Jawab</label>
              <input
                type="text"
                value={dokter}
                onChange={(e) => setDokter(e.target.value)}
                placeholder="dr. Nama Dokter, Sp.X"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                Keluhan Utama <span className="font-normal normal-case text-rose-400">*</span>
              </label>
              <textarea
                value={keluhan}
                onChange={(e) => setKeluhan(e.target.value)}
                placeholder="Deskripsikan keluhan utama pasien..."
                rows={3}
                className={cn(inputCls, "resize-none")}
              />
            </div>

            <div>
              <label className={labelCls}>Penjamin</label>
              <div className={cn("flex items-center gap-3 rounded-xl border p-3", pjCfg.bg, pjCfg.border)}>
                <Shield size={14} className="shrink-0 text-slate-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">{pjCfg.label}</p>
                  {patient.penjamin.nomor && (
                    <p className="font-mono text-[10px] text-slate-500">{patient.penjamin.nomor}</p>
                  )}
                </div>
                <span className="shrink-0 text-[9px] italic text-slate-400">Dari rekam medis</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-[10px] text-slate-400">
              <span className="text-rose-400">*</span> Wajib diisi
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDaftar}
                disabled={!keluhan.trim()}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition",
                  keluhan.trim()
                    ? "cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
                    : "cursor-not-allowed bg-slate-100 text-slate-400",
                )}
              >
                <CalendarPlus size={13} /> Daftarkan Kunjungan
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </ModalShell>
  );
}

// ── Success panel (ANT4) ──────────────────────────────────────────────────────
function SuccessPanel({
  created,
  kodebooking,
  onClose,
}: {
  created: KunjunganRecord;
  kodebooking?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-12 text-center" style={{ minHeight: 500 }}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
        <Check size={28} className="text-emerald-600" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-lg font-black text-slate-900">Kunjungan Terdaftar</p>
        <p className="mt-1 text-sm text-slate-500">{created.unit} · {created.dokter}</p>
      </div>
      <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 px-8 py-5 text-left ring-1 ring-slate-200">
        <SuccessRow label="No. Kunjungan" value={created.noKunjungan} />
        <SuccessRow label="No. Pendaftaran" value={created.noPendaftaran} />
        {created.noSEP && <SuccessRow label="No. SEP" value={created.noSEP} />}
        {kodebooking && <SuccessRow label="Kode Booking" value={kodebooking} />}
      </div>
      {kodebooking && (
        <p className="max-w-xs text-xs text-emerald-600">
          Antrean diperbarui → status <span className="font-semibold">Menunggu Poli</span> (task 3 terkirim ke BPJS).
        </p>
      )}
      <button
        onClick={onClose}
        className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.98]"
      >
        Selesai
      </button>
    </div>
  );
}

function SuccessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-8">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="font-mono text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}
