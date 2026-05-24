"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PiggyBank, Sparkles, CheckCircle2, AlertCircle, Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  METODE_CFG, METODE_ORDER, fmtRupiah,
  type MetodeBayar, type PaymentRecord,
} from "../../invoice/invoiceShared";
import { terbilang } from "@/lib/billing/terbilang";
import { inputCn, selectCn } from "../../invoice/modals/AddItemModal";
import {
  suggestDeposit, type PasienAdmisi,
} from "@/lib/billing/depositMock";
import EstimateChargeCard from "./EstimateChargeCard";

interface Props {
  pasien: PasienAdmisi;
  kasirName: string;
  onSubmit: (input: DepositSubmitInput) => void;
}

export interface DepositSubmitInput {
  pasien: PasienAdmisi;
  losUsed: number;
  nominal: number;
  payment: Omit<PaymentRecord, "id" | "noKwitansi">;
}

const BANK_OPTIONS = ["BCA", "Mandiri", "BNI", "BRI", "BSI", "CIMB"];

/**
 * Deposit Form — input deposit awal untuk pasien admisi.
 *
 * Auto-suggest nominal via `suggestDeposit(kelas, LOS, kategori, penjamin)`:
 *   base = rate per hari × LOS
 *   buffer = base × bufferPct (Umum 30% / Asuransi 20% / BPJS-Jamkesda 10%)
 *   total = base + buffer
 *
 * User bisa override LOS (slider/input) → recalculate live.
 * User bisa override nominal langsung.
 */
export default function DepositForm({ pasien, kasirName, onSubmit }: Props) {
  const [losDays, setLosDays] = useState<number>(pasien.estimasiLOS ?? 5);
  const [metode, setMetode] = useState<MetodeBayar>("Tunai");
  const [nominalOverride, setNominalOverride] = useState<string>("");
  const [bank, setBank] = useState("");
  const [noRef, setNoRef] = useState("");
  const [catatan, setCatatan] = useState("");
  const [touched, setTouched] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Suggested calculation
  const suggested = useMemo(
    () => suggestDeposit({
      kelas: pasien.kelas,
      losDays,
      kategori: pasien.kategori,
      penjaminTipe: pasien.penjamin.tipe,
    }),
    [pasien, losDays],
  );

  // Active nominal = override if set, else suggested.total
  const nominalNum = useMemo(() => {
    if (nominalOverride.trim() !== "") {
      return Number(nominalOverride.replace(/[^\d]/g, "")) || 0;
    }
    return suggested.total;
  }, [nominalOverride, suggested.total]);

  // Reset form saat pasien berubah
  useEffect(() => {
    setLosDays(pasien.estimasiLOS ?? 5);
    setMetode("Tunai");
    setNominalOverride("");
    setBank("");
    setNoRef("");
    setCatatan("");
    setTouched(false);
    setJustSubmitted(false);
  }, [pasien.id, pasien.estimasiLOS]);

  const errors = {
    nominal: nominalNum <= 0 ? "Nominal harus > 0" : null,
    noRef:
      (metode === "Transfer" || metode === "EDC" || metode === "QRIS") && noRef.trim() === ""
        ? `No referensi wajib untuk ${metode}` : null,
    bank:
      (metode === "Transfer" || metode === "EDC") && bank.trim() === ""
        ? "Pilih bank" : null,
  };
  const hasError = Object.values(errors).some(Boolean);

  const submit = () => {
    setTouched(true);
    if (hasError) return;
    onSubmit({
      pasien,
      losUsed: losDays,
      nominal: nominalNum,
      payment: {
        tanggalISO: new Date().toISOString().slice(0, 16),
        metode,
        nominal: nominalNum,
        kategori: "Deposit",
        source: "Deposit",
        kasir: kasirName,
        bank: bank || undefined,
        noRef: noRef || undefined,
        catatan: catatan || `Deposit awal admisi ${pasien.kategori}`,
      },
    });
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 1500);
  };

  const useSuggested = () => {
    setNominalOverride("");
  };

  const needBank = metode === "Transfer" || metode === "EDC";
  const needRef = metode === "Transfer" || metode === "EDC" || metode === "QRIS";

  return (
    <section
      aria-label="Form Deposit Awal"
      className="overflow-hidden rounded-xl border-2 border-amber-300 bg-white shadow-md dark:border-amber-800 dark:bg-slate-900"
    >
      {/* Header context */}
      <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 via-amber-50/40 to-white px-4 py-3 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-slate-900">
        <div className="flex items-center gap-2">
          <PiggyBank size={16} className="text-amber-600" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Deposit Awal · {pasien.kategori}
          </p>
        </div>
        <p className="mt-0.5 text-[13.5px] font-bold text-slate-800 dark:text-slate-100">
          {pasien.pasien.nama}{" "}
          <span className="font-mono text-[10.5px] font-normal text-slate-500">
            · {pasien.pasien.noRM}
          </span>
        </p>
        <p className="font-mono text-[10.5px] text-slate-500">
          {pasien.noKunjungan} · {pasien.unit} · {pasien.kelas} · {pasien.penjamin.nama}
        </p>
      </div>

      {/* Body */}
      <div className="space-y-3 px-4 py-3">
        {/* LOS adjust */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Estimasi Length of Stay (LOS)
            </p>
            <span className="font-mono text-[12px] font-bold tabular-nums text-slate-800 dark:text-slate-100">
              {losDays} hari
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={losDays}
            onChange={(e) => setLosDays(Number(e.target.value))}
            className="mt-1 w-full accent-amber-600"
          />
          <div className="flex justify-between text-[9.5px] text-slate-400">
            <span>1h</span>
            <span>15h</span>
            <span>30h</span>
          </div>
        </div>

        {/* Rencana charge estimasi — re-calc live saat LOS berubah */}
        <EstimateChargeCard
          kelas={pasien.kelas}
          losDays={losDays}
          penjaminTipe={pasien.penjamin.tipe}
          admisiKategori={pasien.kategori}
        />

        {/* Suggested breakdown card */}
        <div className="rounded-lg border border-sky-200 bg-sky-50/40 px-3 py-2.5 dark:border-sky-900/40 dark:bg-sky-950/15">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Calculator size={12} className="text-sky-600" />
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                Saran Sistem
              </p>
            </div>
            {nominalOverride.trim() !== "" && (
              <button
                type="button"
                onClick={useSuggested}
                className="text-[10px] text-sky-700 hover:underline dark:text-sky-300"
              >
                ← Pakai saran
              </button>
            )}
          </div>
          <p className="mt-0.5 text-[10.5px] text-slate-600 dark:text-slate-400">
            {suggested.rateInfo} = <span className="font-mono">{fmtRupiah(suggested.base)}</span>
            {" + "}buffer <span className="font-mono">{fmtRupiah(suggested.buffer)}</span>
          </p>
          <p className="mt-1 font-mono text-[16px] font-bold tabular-nums text-sky-700 dark:text-sky-300">
            {fmtRupiah(suggested.total)}
          </p>
        </div>

        {/* Metode segmented */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Metode
          </p>
          <div className="grid grid-cols-5 gap-1">
            {METODE_ORDER.map((m) => {
              const cfg = METODE_CFG[m];
              const Icon = cfg.icon;
              const active = metode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMetode(m); setBank(""); setNoRef(""); }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-md border px-1 py-1.5 text-[10.5px] font-medium transition-all",
                    active
                      ? cn("ring-1", cfg.bg, cfg.text, cfg.ring, "border-transparent")
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
                  )}
                >
                  <Icon size={13} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nominal input */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Nominal Deposit
            </p>
            <span className="text-[9.5px] text-slate-400">
              {nominalOverride.trim() !== "" ? "manual override" : "ikut saran sistem"}
            </span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={nominalOverride !== "" ? nominalOverride : suggested.total.toString()}
            onChange={(e) => setNominalOverride(e.target.value.replace(/[^\d]/g, ""))}
            placeholder={String(suggested.total)}
            className={cn(
              inputCn,
              "text-right font-mono text-[18px] font-bold tabular-nums",
              touched && errors.nominal && "border-rose-300",
            )}
          />
          <p className="mt-0.5 text-[10.5px] italic text-slate-500">
            {nominalNum > 0 ? terbilang(nominalNum) : "—"}
          </p>
          {touched && errors.nominal && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] text-rose-600">
              <AlertCircle size={11} />
              {errors.nominal}
            </p>
          )}
        </div>

        {/* Conditional bank + noRef */}
        {(needBank || needRef) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-2 gap-2"
          >
            {needBank && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Bank
                </p>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className={cn(selectCn, touched && errors.bank && "border-rose-300")}
                >
                  <option value="">— Pilih bank —</option>
                  {BANK_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}
            {needRef && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  No Referensi
                </p>
                <input
                  type="text"
                  value={noRef}
                  onChange={(e) => setNoRef(e.target.value)}
                  placeholder={metode === "QRIS" ? "QRIS-XXX" : "TRF-XXX"}
                  className={cn(inputCn, "font-mono", touched && errors.noRef && "border-rose-300")}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* Catatan opsional */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Catatan (opsional)
          </p>
          <input
            type="text"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder={`mis. deposit awal admisi ${pasien.kategori}`}
            className={inputCn}
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={submit}
          disabled={justSubmitted}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all active:scale-[0.98]",
            justSubmitted
              ? "bg-emerald-600"
              : "bg-amber-600 hover:bg-amber-700",
          )}
        >
          {justSubmitted ? (
            <>
              <CheckCircle2 size={14} />
              Deposit Tercatat!
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Buka Deposit {fmtRupiah(nominalNum)}
            </>
          )}
        </button>
      </div>
    </section>
  );
}
