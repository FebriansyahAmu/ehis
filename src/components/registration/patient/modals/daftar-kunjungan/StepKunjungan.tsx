"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { POLI_OPTS } from "../../config";
import {
  CARA_MASUK_OPTS, TRIASE_CFG, UNIT_DAFTAR_CFG,
  inputCls, labelCls,
  type CaraMasuk, type KunjunganForm, type TriaseLevel, type UnitDaftar,
} from "./config";

const KELAS_OPTS: [string, string][] = [["1", "Kelas 1"], ["2", "Kelas 2"], ["3", "Kelas 3"], ["vip", "VIP"]];

export function StepKunjungan({
  form, setForm,
}: {
  form: KunjunganForm;
  setForm: React.Dispatch<React.SetStateAction<KunjunganForm>>;
}) {
  const set = <K extends keyof KunjunganForm>(k: K, v: KunjunganForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const isRujukan = form.caraMasuk === "Rujukan Puskesmas" || form.caraMasuk === "Rujukan RS";

  return (
    <div className="space-y-5">
      {/* Unit kunjungan */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Unit Kunjungan</p>
        <div className="grid grid-cols-3 gap-2">
          {UNIT_DAFTAR_CFG.map((u) => {
            const isActive = form.unit === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => set("unit", u.id as UnitDaftar)}
                className={cn(
                  "flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-3 text-left transition",
                  isActive ? u.active : u.idle,
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-xs">
                    <u.icon size={15} className={isActive ? "text-slate-700" : "text-slate-400"} />
                  </div>
                  {isActive && <span className={cn("h-2 w-2 rounded-full", u.dot)} />}
                </div>
                <div>
                  <p className="text-[12px] font-bold leading-tight text-slate-800">{u.label}</p>
                  <p className="text-[9px] leading-tight text-slate-400">{u.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Waktu & cara masuk */}
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Waktu &amp; Cara Masuk</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tanggal</label>
            <input type="date" value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Jam</label>
            <input type="time" value={form.jam} onChange={(e) => set("jam", e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="mt-3">
          <label className={labelCls}>Cara Masuk</label>
          <div className="flex flex-wrap gap-1.5">
            {CARA_MASUK_OPTS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set("caraMasuk", opt as CaraMasuk)}
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                  form.caraMasuk === opt
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
                value={form.noRujukan}
                onChange={(e) => set("noRujukan", e.target.value)}
                placeholder="Nomor surat rujukan"
                className={inputCls}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Unit-specific */}
      <AnimatePresence mode="wait">
        <motion.div
          key={form.unit}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3"
        >
          {form.unit === "IGD" && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detail IGD</p>
              <div>
                <label className={labelCls}>Level Triase</label>
                <div className="flex flex-col gap-1.5">
                  {([1, 2, 3, 4, 5] as TriaseLevel[]).map((t) => {
                    const cfg = TRIASE_CFG[t];
                    const isActive = form.triase === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set("triase", t)}
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
                      type="button"
                      onClick={() => set("caraDatang", opt)}
                      className={cn(
                        "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                        form.caraDatang === opt
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

          {form.unit === "Rawat Jalan" && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detail Rawat Jalan</p>
              <div>
                <label className={labelCls}>Poli Tujuan</label>
                <div className="relative">
                  <Building2 size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={form.poli} onChange={(e) => set("poli", e.target.value)} className={cn(inputCls, "pl-8")}>
                    {POLI_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {form.unit === "Rawat Inap" && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detail Rawat Inap</p>
              <div>
                <label className={labelCls}>Asal Masuk</label>
                <div className="flex flex-wrap gap-1.5">
                  {["Dari IGD", "Dari Poli", "Langsung"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => set("asalMasuk", opt)}
                      className={cn(
                        "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                        form.asalMasuk === opt
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
                  {KELAS_OPTS.map(([val, lab]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => set("kelasRawat", val)}
                      className={cn(
                        "flex-1 cursor-pointer rounded-lg border py-2 text-[11px] font-semibold transition",
                        form.kelasRawat === val
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                      )}
                    >
                      {lab}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dokter + keluhan */}
      <div>
        <label className={labelCls}>Dokter Penanggung Jawab</label>
        <input
          type="text"
          value={form.dokter}
          onChange={(e) => set("dokter", e.target.value)}
          placeholder="dr. Nama Dokter, Sp.X"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>
          Keluhan Utama <span className="font-normal normal-case text-slate-300">(opsional)</span>
        </label>
        <textarea
          value={form.keluhan}
          onChange={(e) => set("keluhan", e.target.value)}
          placeholder="Deskripsikan keluhan utama pasien..."
          rows={3}
          className={cn(inputCls, "resize-none")}
        />
      </div>
    </div>
  );
}
