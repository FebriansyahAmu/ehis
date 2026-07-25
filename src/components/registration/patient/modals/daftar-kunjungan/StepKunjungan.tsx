"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimePicker } from "@/components/shared/inputs";
import { StepKunjunganIgd } from "./StepKunjunganIgd";
import { StepKunjunganRi } from "./StepKunjunganRi";
import { StepKunjunganRj } from "./StepKunjunganRj";
import {
  UNIT_DAFTAR_CFG,
  inputCls, labelCls,
  type KunjunganForm, type UnitDaftar, type SpriDpjpHint,
} from "./config";

const KELAS_OPTS: [string, string][] = [["1", "Kelas 1"], ["2", "Kelas 2"], ["3", "Kelas 3"], ["vip", "VIP"]];

/** Format "yyyy-MM-dd" → tanggal id-ID ringkas (mis. "Sen, 29 Jun 2026"). */
function fmtTgl(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y) return ymd || "—";
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

export function StepKunjungan({
  form, setForm, spriDpjp,
}: {
  form: KunjunganForm;
  setForm: React.Dispatch<React.SetStateAction<KunjunganForm>>;
  spriDpjp?: SpriDpjpHint;
}) {
  const set = <K extends keyof KunjunganForm>(k: K, v: KunjunganForm[K]) => setForm((f) => ({ ...f, [k]: v }));

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

      {/* Waktu kunjungan */}
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Waktu Kunjungan</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tanggal</label>
            {/* Tanggal TERKUNCI hari ini: SEP diterbitkan pada tgl pelayanan & tidak boleh
                di-backdate (ketentuan BPJS). Jam tetap dapat disesuaikan. */}
            <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              <CalendarDays size={14} className="shrink-0 text-slate-400" />
              <span className="flex-1 text-left font-medium text-slate-600">{fmtTgl(form.tanggal)}</span>
              <Lock size={12} className="shrink-0 text-slate-300" />
            </div>
            <p className="mt-1 text-[9.5px] leading-tight text-slate-400">Terkunci hari ini · SEP tidak dapat di-backdate.</p>
          </div>
          <div>
            <label className={labelCls}>Jam</label>
            <TimePicker value={form.jam} onChange={(v) => set("jam", v)} />
          </div>
        </div>
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
          {form.unit === "IGD" && <StepKunjunganIgd form={form} setForm={setForm} />}

          {form.unit === "Rawat Jalan" && <StepKunjunganRj form={form} setForm={setForm} />}

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
              {/* Ruangan + bed (di-reserve saat daftar) + DPJP ter-assign + peringatan SPRI */}
              <StepKunjunganRi form={form} setForm={setForm} spriDpjp={spriDpjp} />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* DPJP semua unit kini dari dokter ter-assign ruangan/poli (picker di dalam
          StepKunjunganIgd / StepKunjunganRi / StepKunjunganRj). */}
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
