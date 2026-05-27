"use client";

/**
 * CalculatorParamsPanel — Right panel: parameters + Hitung button (EK4.1).
 *
 * Widgets:
 *   - Tingkat Kompetensi RS → 4 colorful tiles (iDRG/Compare mode)
 *   - Kelas Pasien → dropdown (INA-CBG Legacy mode only)
 *   - Tipe Pelayanan → 3-tab segmented
 *   - LOS / Age / Gender → compact inline row
 *   - Cara Pulang → select dropdown
 *   - Tarif RS Manual → optional input for margin comparison
 *   - Hitung button + validation feedback
 */

import { Loader2, Zap, AlertCircle, Building2, BedDouble, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import {
  CARA_PULANG_OPTIONS,
  KELAS_LEGACY_OPTIONS,
  TINGKAT_TILES,
  TIPE_OPTIONS,
  canCalculate,
  type CalcStatus,
  type CalculatorFormState,
} from "./calculatorShared";

interface Props {
  form: CalculatorFormState;
  setForm: React.Dispatch<React.SetStateAction<CalculatorFormState>>;
  calcStatus: CalcStatus;
  onCalculate: () => void;
}

// ── Style helpers ──────────────────────────────────────

const LABEL_CLS = "block text-[11.5px] font-bold text-slate-600 mb-1";
const SELECT_CLS =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 transition-colors focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100";
const NUMBER_CLS =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 tabular-nums transition-colors focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100";

export default function CalculatorParamsPanel({ form, setForm, calcStatus, onCalculate }: Props) {
  const isLoading = calcStatus === "loading";
  const validation = canCalculate(form);
  const showKompetensi = form.mode !== "ina-cbg";
  const showKelas = form.mode === "ina-cbg";

  const set = <K extends keyof CalculatorFormState>(k: K, v: CalculatorFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Calc button text
  const btnLabel =
    form.mode === "compare" ? "Compare iDRG + INA-CBG" :
    form.mode === "ina-cbg"  ? "Hitung INA-CBG"         :
                               "Hitung iDRG";

  const btnAccent =
    form.mode === "compare" ? "from-sky-500 to-sky-700 hover:from-sky-600 hover:to-sky-800 focus-visible:ring-sky-500/40" :
    form.mode === "ina-cbg"  ? "from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 focus-visible:ring-amber-500/40" :
                               "from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800 focus-visible:ring-teal-500/40";

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="px-4 py-3 sm:px-5">

        {/* ── Tingkat Kompetensi RS (iDRG / Compare) ── */}
        {showKompetensi && (
          <div className="mb-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Building2 size={11} strokeWidth={2.4} className="text-teal-600" />
              <label className="text-[11.5px] font-bold text-slate-600">
                Tingkat Kompetensi RS
              </label>
              <span className="ml-auto text-[10px] text-slate-400">Perpres 59/2024</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {TINGKAT_TILES.map((t, i) => {
                const active = form.tingkatKompetensiRS === t.value;
                return (
                  <motion.button
                    key={t.value}
                    type="button"
                    onClick={() => set("tingkatKompetensiRS", t.value)}
                    disabled={isLoading}
                    whileHover={{ scale: active ? 1 : 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.04 }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-1.5 py-2 text-center transition-all duration-150",
                      active
                        ? `bg-linear-to-b ${t.fromBg} ${t.toBg} border-current ${t.textActive} shadow-sm ring-2 ${t.ringActive}`
                        : "border-slate-200 bg-slate-50/60 text-slate-500 hover:border-slate-300 hover:bg-slate-100/60",
                    )}
                  >
                    <span className="text-[12px] font-extrabold leading-tight">{t.label}</span>
                    <span className="text-[10px] opacity-70">{t.desc}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Kelas Pasien (INA-CBG only) ── */}
        {showKelas && (
          <div className="mb-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <BedDouble size={11} strokeWidth={2.4} className="text-amber-600" />
              <label className={LABEL_CLS} style={{ marginBottom: 0 }}>Kelas Rawat Pasien</label>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {KELAS_LEGACY_OPTIONS.map((k) => {
                const active = form.kelasLegacy === k.value;
                return (
                  <button
                    key={k.value}
                    type="button"
                    onClick={() => set("kelasLegacy", k.value)}
                    disabled={isLoading}
                    className={cn(
                      "rounded-xl border-2 py-1.5 text-[12px] font-bold transition-all",
                      active
                        ? "border-amber-400 bg-amber-50 text-amber-800 shadow-sm ring-1 ring-amber-300"
                        : "border-slate-200 bg-slate-50/60 text-slate-500 hover:border-amber-300 hover:bg-amber-50/40",
                    )}
                  >
                    {k.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Row: Tipe + Cara Pulang ── */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS}>Tipe Pelayanan</label>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              {TIPE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set("tipePelayanan", t.value)}
                  disabled={isLoading}
                  className={cn(
                    "flex-1 py-1.5 text-[11.5px] font-semibold transition-colors",
                    form.tipePelayanan === t.value
                      ? "bg-teal-600 text-white"
                      : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {t.value}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Cara Pulang</label>
            <select
              value={form.caraPulang}
              onChange={(e) => set("caraPulang", e.target.value as typeof form.caraPulang)}
              disabled={isLoading}
              className={SELECT_CLS}
            >
              {CARA_PULANG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Row: LOS / Age / Gender ── */}
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div>
            <label className={LABEL_CLS}>
              <span className="flex items-center gap-1">
                LOS <span className="text-slate-400 font-normal">(hari)</span>
              </span>
            </label>
            <input
              type="number"
              min={0}
              max={365}
              value={form.los}
              onChange={(e) => set("los", parseInt(e.target.value) || 0)}
              disabled={isLoading}
              className={NUMBER_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>
              <span className="flex items-center gap-1">
                Usia <span className="text-slate-400 font-normal">(thn)</span>
              </span>
            </label>
            <input
              type="number"
              min={0}
              max={150}
              value={form.age}
              onChange={(e) => set("age", parseInt(e.target.value) || 0)}
              disabled={isLoading}
              className={NUMBER_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Jenis Kelamin</label>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              {(["L", "P"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => set("gender", g)}
                  disabled={isLoading}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1 py-1.5 text-[12px] font-bold transition-colors",
                    form.gender === g
                      ? g === "L"
                        ? "bg-sky-600 text-white"
                        : "bg-rose-500 text-white"
                      : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <Users size={10} strokeWidth={2.5} />
                  {g === "L" ? "Laki" : "Perempuan"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tarif RS Manual (optional) ── */}
        <div className="mb-4">
          <label className={LABEL_CLS}>
            <span className="flex items-center gap-1">
              Tarif RS
              <span className="rounded-md bg-slate-100 px-1 py-0.5 text-[10px] font-medium text-slate-500">
                Opsional · untuk margin
              </span>
            </span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-[12px] font-semibold text-slate-400">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={form.tarifRSInput}
              onChange={(e) => {
                const num = e.target.value.replace(/[^0-9]/g, "");
                const fmt = num ? Number(num).toLocaleString("id-ID") : "";
                set("tarifRSInput", fmt);
              }}
              disabled={isLoading}
              placeholder="0"
              className={cn(NUMBER_CLS, "pl-8")}
            />
          </div>
        </div>

        {/* ── Hitung Button ── */}
        <div className="space-y-2">
          <motion.button
            type="button"
            onClick={onCalculate}
            disabled={isLoading || !validation.ok}
            whileHover={!isLoading && validation.ok ? { scale: 1.01 } : {}}
            whileTap={!isLoading && validation.ok ? { scale: 0.98 } : {}}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2",
              validation.ok && !isLoading
                ? `bg-linear-to-br ${btnAccent} text-white active:scale-[0.98]`
                : "cursor-not-allowed bg-slate-100 text-slate-400 ring-1 ring-slate-200",
            )}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} strokeWidth={2.4} className="animate-spin" />
                Menghitung...
              </>
            ) : (
              <>
                <Zap size={14} strokeWidth={2.4} />
                {btnLabel}
                <ArrowRight size={13} strokeWidth={2.4} />
              </>
            )}
          </motion.button>

          {/* Validation message */}
          {!validation.ok && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-[11.5px] text-amber-700"
            >
              <AlertCircle size={11} strokeWidth={2.4} />
              {validation.reason}
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}
