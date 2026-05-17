"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, ClipboardCheck, Users, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { type FarmasiOrder, type FarmasiOrderItem } from "@/components/farmasi/farmasiShared";

// ── Step progress (top strip) ─────────────────────────────

interface StepProgressProps { step1Done: boolean; step2Done: boolean }

export function StepProgress({ step1Done, step2Done }: StepProgressProps) {
  const steps = [
    { n: 1, label: "Siapkan",    done: step1Done  },
    { n: 2, label: "Telaah Akhir", done: step2Done },
    { n: 3, label: "Serah Terima", done: false     },
  ];
  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <motion.div
              animate={step.done ? { scale: [1, 1.25, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black shadow-sm transition-all",
                step.done ? "bg-emerald-500 text-white" : "bg-sky-600 text-white",
              )}
            >
              {step.done ? <Check size={8} /> : step.n}
            </motion.div>
            <span className={cn(
              "text-[11px] font-semibold hidden sm:block",
              step.done ? "text-emerald-600" : "text-slate-500",
            )}>
              {step.label}
            </span>
          </div>
          {i < 2 && <div className="mx-2 flex-1 border-t-2 border-dashed border-slate-200 min-w-3" />}
        </div>
      ))}
    </div>
  );
}

// ── Section divider ───────────────────────────────────────

export function SectionDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 border-t border-dashed border-slate-200" />
      <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      <div className="flex-1 border-t border-dashed border-slate-200" />
    </div>
  );
}

// ── Step label ────────────────────────────────────────────

export function StepLabel({ n, label, done }: { n: number; label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black transition-all",
        done ? "bg-emerald-500 text-white" : "bg-sky-600 text-white",
      )}>
        {done ? <Check size={8} /> : n}
      </div>
      <p className={cn("text-sm font-bold", done ? "text-emerald-700" : "text-slate-700")}>{label}</p>
    </div>
  );
}

// ── Drug context card (left panel) ────────────────────────

function fmtRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function DrugContextCard({ item, labeled, telaahDone }: {
  item: FarmasiOrderItem; labeled: boolean; telaahDone: boolean;
}) {
  const borderCls = telaahDone
    ? "border-emerald-200 bg-emerald-50/50"
    : labeled ? "border-sky-200 bg-sky-50/30" : "border-slate-200 bg-white";

  return (
    <motion.div layout className={cn("rounded-xl border-2 px-3 py-2.5 transition-colors duration-300", borderCls)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.isHAM && <AlertTriangle size={9} className="text-rose-500 shrink-0" />}
            {item.isLASA && (
              <span className="rounded px-1 py-0 text-[8px] font-black bg-amber-100 text-amber-700">LASA</span>
            )}
            <p className="text-xs font-semibold text-slate-800 truncate">{item.namaObat}</p>
          </div>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {item.jumlah} {item.satuanObat ?? "Tab"} · {item.rute}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {item.kategori !== "Reguler" && (
            <span className={cn(
              "rounded px-1.5 py-0.5 text-[8px] font-black",
              item.kategori === "Narkotika" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700",
            )}>
              {item.kategori.substring(0, 3).toUpperCase()}
            </span>
          )}
          <AnimatePresence>
            {telaahDone && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-black text-emerald-700"
              >
                ✓ 5B
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      {item.hargaSatuan !== undefined && (
        <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px]">
          <span className="text-slate-400">{fmtRupiah(item.hargaSatuan)}/unit</span>
          <span className="font-semibold text-slate-600">{fmtRupiah(item.hargaSatuan * item.jumlah)}</span>
        </div>
      )}
    </motion.div>
  );
}

// ── NAR/PSI double-sign ───────────────────────────────────

interface NarPsiVerifProps {
  items:     FarmasiOrder["items"];
  petugas2:  string;
  confirmed: boolean;
  onPetugas: (v: string) => void;
  onConfirm: (v: boolean) => void;
}

export function NarPsiVerif({ items, petugas2, confirmed, onPetugas, onConfirm }: NarPsiVerifProps) {
  const restricted = items.filter((i) => i.kategori === "Narkotika" || i.kategori === "Psikotropika");
  if (restricted.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border-2 p-4 transition-colors",
        confirmed ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200 bg-amber-50/40",
      )}
    >
      <div className="flex items-start gap-2.5">
        <ShieldCheck size={15} className={cn("mt-0.5 shrink-0", confirmed ? "text-emerald-600" : "text-amber-600")} />
        <div className="flex-1">
          <p className={cn("text-xs font-bold", confirmed ? "text-emerald-700" : "text-amber-700")}>
            Verifikasi Narkotika / Psikotropika
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">PMK 3/2015 · Double-check dua petugas</p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {restricted.map((item) => (
          <span key={item.id} className={cn(
            "rounded-lg border px-2 py-0.5 text-[10px] font-semibold",
            item.kategori === "Narkotika"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-amber-200 bg-amber-50 text-amber-700",
          )}>
            {item.kategori === "Narkotika" ? "NAR" : "PSI"} · {item.namaObat}
          </span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div>
          <label className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-slate-600">
            <Users size={9} /> Petugas Pendamping <span className="text-rose-500">*</span>
          </label>
          <input
            type="text" value={petugas2} onChange={(e) => onPetugas(e.target.value)}
            placeholder="Nama AA / apoteker kedua"
            className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100"
          />
        </div>
        <div className="flex items-end">
          <motion.button
            onClick={() => onConfirm(!confirmed)} whileHover={{ x: 1 }}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border-2 px-2.5 py-1.5 text-left text-xs transition-all",
              confirmed ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-amber-300",
            )}
          >
            <div className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all",
              confirmed ? "border-emerald-500 bg-emerald-500" : "border-slate-300",
            )}>
              {confirmed && <Check size={9} className="text-white" />}
            </div>
            <span>Double-check selesai</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Telaah Akhir — per-item 5 Benar card ─────────────────

const LIMA_BENAR = [
  { id: "pasien" as const, label: "Pasien" },
  { id: "obat"   as const, label: "Obat"   },
  { id: "dosis"  as const, label: "Dosis"  },
  { id: "rute"   as const, label: "Rute"   },
  { id: "waktu"  as const, label: "Waktu"  },
];

interface TelaahAkhirItemProps {
  item:        FarmasiOrderItem;
  patientName: string;
  confirmed:   boolean;
  disabled:    boolean;
  onConfirm:   () => void;
}

export function TelaahAkhirItem({ item, patientName, confirmed, disabled, onConfirm }: TelaahAkhirItemProps) {
  const values: Record<typeof LIMA_BENAR[number]["id"], string> = {
    pasien: patientName,
    obat:   item.namaObat,
    dosis:  item.dosis || "—",
    rute:   item.rute,
    waktu:  item.signa || "—",
  };

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.35, type: "spring", damping: 28, stiffness: 280 } }}
      className={cn(
        "overflow-hidden rounded-xl border-2 transition-colors duration-300",
        confirmed ? "border-emerald-200 bg-emerald-50/50"
          : disabled ? "border-slate-100 bg-slate-50/60"
          : "border-slate-200 bg-white shadow-sm",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {confirmed ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="flex items-center gap-3 px-4 py-3"
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.05 }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"
            >
              <Check size={11} className="text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-800 truncate">{item.namaObat}</p>
              <p className="mt-0.5 text-[10px] text-emerald-600">
                5 Benar · {item.dosis || item.signa} · {item.rute}
              </p>
            </div>
            {item.isHAM && (
              <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-600">HAM</span>
            )}
            {item.isLASA && (
              <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600">LASA</span>
            )}
            <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">✓ Terverifikasi</span>
          </motion.div>
        ) : (
          <motion.div
            key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="p-3.5"
          >
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              {item.isHAM && (
                <div className="flex h-4 w-4 items-center justify-center rounded bg-rose-100">
                  <AlertTriangle size={9} className="text-rose-600" />
                </div>
              )}
              <p className={cn("text-sm font-bold", disabled ? "text-slate-400" : "text-slate-800")}>
                {item.namaObat}
              </p>
              {item.kategori !== "Reguler" && (
                <span className={cn(
                  "rounded px-1.5 py-0.5 text-[8px] font-black",
                  item.kategori === "Narkotika" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700",
                )}>
                  {item.kategori.substring(0, 3).toUpperCase()}
                </span>
              )}
              {item.isLASA && (
                <span className="rounded px-1.5 py-0.5 text-[8px] font-black bg-amber-100 text-amber-700">LASA</span>
              )}
              <span className="ml-auto text-[10px] text-slate-400">{item.jumlah} {item.satuanObat ?? "Tab"}</span>
            </div>

            <div className="mb-3.5 grid grid-cols-5 gap-1">
              {LIMA_BENAR.map(({ id, label }, idx) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: disabled ? 0.4 : 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex flex-col items-center rounded-lg border border-sky-100 bg-gradient-to-b from-sky-50 to-white px-1 py-2 text-center"
                >
                  <div className="mb-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sky-500">
                    <Check size={7} className="text-white" />
                  </div>
                  <p className="mb-0.5 text-[7px] font-black uppercase tracking-widest text-sky-500">{label}</p>
                  <p className="text-[9px] font-semibold leading-snug text-slate-700 line-clamp-2" title={values[id]}>
                    {values[id]}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={disabled ? undefined : onConfirm}
              whileHover={!disabled ? { scale: 1.01, y: -1 } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
              disabled={disabled}
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all",
                disabled
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-sky-600 text-white shadow-sm shadow-sky-200 hover:bg-sky-700",
              )}
            >
              <ClipboardCheck size={12} />
              Konfirmasi 5 Benar
            </motion.button>

            {disabled && (
              <p className="mt-1.5 text-center text-[10px] text-amber-600">
                Selesaikan label obat (Step 1) terlebih dahulu.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
