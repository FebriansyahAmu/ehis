"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, Check, User, ClipboardList,
  Package, ShieldCheck, Users, ClipboardCheck, UserCheck, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type FarmasiOrder, type FarmasiOrderItem, type SerahTerima,
  getPatientInfo,
} from "@/components/farmasi/farmasiShared";

// ── Formatters ────────────────────────────────────────────

function fmtRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);
}

// ── Step progress (top of right panel) ───────────────────

interface StepProgressProps { step1Done: boolean; step2Done: boolean }

function StepProgress({ step1Done, step2Done }: StepProgressProps) {
  const steps = [
    { n: 1, label: "Siapkan", done: step1Done },
    { n: 2, label: "Telaah Akhir", done: step2Done },
    { n: 3, label: "Serah Terima", done: false },
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
          {i < 2 && (
            <div className="mx-2 flex-1 border-t-2 border-dashed border-slate-200 min-w-3" />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Section divider ───────────────────────────────────────

function SectionDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 border-t border-dashed border-slate-200" />
      <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      <div className="flex-1 border-t border-dashed border-slate-200" />
    </div>
  );
}

// ── Step label ────────────────────────────────────────────

function StepLabel({ n, label, done }: { n: number; label: string; done?: boolean }) {
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

// ── Left panel: drug context card ────────────────────────

function DrugContextCard({
  item, labeled, telaahDone,
}: { item: FarmasiOrderItem; labeled: boolean; telaahDone: boolean }) {
  const borderCls = telaahDone
    ? "border-emerald-200 bg-emerald-50/50"
    : labeled
    ? "border-sky-200 bg-sky-50/30"
    : "border-slate-200 bg-white";

  return (
    <motion.div
      layout
      className={cn("rounded-xl border-2 px-3 py-2.5 transition-colors duration-300", borderCls)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.isHAM && <AlertTriangle size={9} className="text-rose-500 shrink-0" />}
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
          <span className="font-semibold text-slate-600">
            {fmtRupiah(item.hargaSatuan * item.jumlah)}
          </span>
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

function NarPsiVerif({ items, petugas2, confirmed, onPetugas, onConfirm }: NarPsiVerifProps) {
  const restricted = items.filter((i) =>
    i.kategori === "Narkotika" || i.kategori === "Psikotropika",
  );
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
              confirmed
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-amber-300",
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

function TelaahAkhirItem({ item, patientName, confirmed, disabled, onConfirm }: TelaahAkhirItemProps) {
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
            <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              ✓ Terverifikasi
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="p-3.5"
          >
            {/* Drug header */}
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
              <span className="ml-auto text-[10px] text-slate-400">
                {item.jumlah} {item.satuanObat ?? "Tab"}
              </span>
            </div>

            {/* 5 Benar grid */}
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

            {/* Confirm button */}
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

// ── Edukasi items ─────────────────────────────────────────

const EDUKASI_ITEMS = [
  "Cara penggunaan dan aturan pakai telah dijelaskan",
  "Efek samping umum telah disampaikan",
  "Cara penyimpanan obat telah diinformasikan",
  "Pasien / keluarga memahami instruksi",
];

// ── Props ─────────────────────────────────────────────────

interface Props {
  order:    FarmasiOrder;
  onSubmit: (orderId: string, items: FarmasiOrderItem[], serahTerima: SerahTerima) => void;
}

export default function DispensingSerahPane({ order, onSubmit }: Props) {
  type RowState = { lotNo: string; expDate: string; labeled: boolean };

  const patientInfo = getPatientInfo(order.noRM);
  const patientName = patientInfo?.namaPasien ?? "—";

  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(order.items.map((item) => [
      item.id,
      { lotNo: item.lotNo ?? "", expDate: item.expiredDate ?? "", labeled: item.labelDicetak ?? false },
    ])),
  );
  const [telaahAkhir,      setTelaahAkhir]      = useState<Record<string, boolean>>({});
  const [verifikatorAkhir, setVerifikatorAkhir] = useState("");
  const [penerima,         setPenerima]         = useState("");
  const [edukasi,          setEdukasi]          = useState<boolean[]>(() => EDUKASI_ITEMS.map(() => false));
  const [catatan,          setCatatan]          = useState("");
  const [petugas2,         setPetugas2]         = useState("");
  const [narConfirm,       setNarConfirm]       = useState(false);
  const [submitted,        setSubmitted]        = useState(false);

  function updateRow(id: string, field: "lotNo" | "expDate" | "labeled", val: string | boolean) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  }

  function confirmTelaahItem(id: string) {
    setTelaahAkhir((prev) => ({ ...prev, [id]: true }));
  }

  function toggleEdukasi(i: number) {
    setEdukasi((prev) => prev.map((v, idx) => idx === i ? !v : v));
  }

  const hasNarPsi     = order.items.some((i) => i.kategori === "Narkotika" || i.kategori === "Psikotropika");
  const narPsiOk      = !hasNarPsi || (!!petugas2 && narConfirm);
  const totalHarga    = order.items.reduce((sum, i) => sum + (i.hargaSatuan ?? 0) * i.jumlah, 0);
  const allLabeled    = order.items.every((i) => rows[i.id]?.labeled);
  const allTelaahDone = order.items.every((i) => telaahAkhir[i.id]);
  const telaahCount   = order.items.filter((i) => telaahAkhir[i.id]).length;
  const step1Done     = allLabeled;
  const step2Done     = allTelaahDone && !!verifikatorAkhir;
  const edukasiDone   = edukasi.filter(Boolean).length;
  const isLocked      = order.status === "Selesai" || submitted;
  const canSubmit     = order.status === "Siap Diserahkan" || order.status === "Ditelaah";
  const readyToSubmit = !!(penerima && canSubmit && narPsiOk && step2Done);

  function handleSubmit() {
    if (!readyToSubmit) return;
    const updatedItems: FarmasiOrderItem[] = order.items.map((item) => ({
      ...item,
      lotNo:        rows[item.id]?.lotNo   || undefined,
      expiredDate:  rows[item.id]?.expDate || undefined,
      labelDicetak: rows[item.id]?.labeled ?? false,
    }));
    const data: SerahTerima = {
      waktu:             new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      perawatPenerima:   penerima,
      apoteker:          "Apt. Dewi Rahayu, S.Farm",
      catatan:           catatan || undefined,
      petugas2NAR:       petugas2 || undefined,
      verifikatorAkhir:  verifikatorAkhir || undefined,
    };
    onSubmit(order.id, updatedItems, data);
    setSubmitted(true);
  }

  // ── Completed view ─────────────────────────────────────

  if (isLocked && order.serahTerima) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]"
      >
        {/* Left: summary */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-bold text-emerald-700">Dispensasi & Penyerahan Selesai</p>
              <div className="mt-2 space-y-1 text-xs">
                <div>
                  <p className="text-emerald-500">Penerima</p>
                  <p className="font-semibold text-emerald-800">{order.serahTerima.perawatPenerima}</p>
                </div>
                <div>
                  <p className="text-emerald-500">Apoteker</p>
                  <p className="font-semibold text-emerald-800">{order.serahTerima.apoteker}</p>
                </div>
                <div>
                  <p className="text-emerald-500">Waktu</p>
                  <p className="font-semibold text-emerald-800">{order.serahTerima.waktu}</p>
                </div>
                {order.serahTerima.verifikatorAkhir && (
                  <div>
                    <p className="text-emerald-500">Telaah Akhir oleh</p>
                    <p className="font-semibold text-emerald-800">{order.serahTerima.verifikatorAkhir}</p>
                  </div>
                )}
                {order.serahTerima.petugas2NAR && (
                  <div>
                    <p className="text-emerald-500">Petugas NAR/PSI</p>
                    <p className="font-semibold text-emerald-800">{order.serahTerima.petugas2NAR}</p>
                  </div>
                )}
              </div>
              {order.serahTerima.catatan && (
                <p className="mt-2 text-xs italic text-emerald-600">"{order.serahTerima.catatan}"</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: drug list */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            Obat Diserahkan ({order.items.length})
          </p>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-xs font-medium text-slate-700">{item.namaObat}</span>
                <span className="text-[11px] text-slate-400">
                  {item.jumlah} {item.satuanObat ?? "Tab"} · {item.rute}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Active 2-panel layout ──────────────────────────────

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_3fr] lg:items-start">

      {/* ═══════════════════════════════════════════
          LEFT PANEL — Order context (sticky)
      ═══════════════════════════════════════════ */}
      <div className="space-y-3 lg:sticky lg:top-4">

        {/* Order info */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Info Order</p>
          <div className="space-y-1.5 text-xs">
            {patientInfo && (
              <div className="flex items-center gap-2">
                <User size={10} className="text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-800">{patientInfo.namaPasien}</span>
                {patientInfo.jenisKelamin && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                    {patientInfo.jenisKelamin}
                  </span>
                )}
              </div>
            )}
            <div className="text-slate-500">
              <span className="text-slate-400">Dokter: </span>{order.dokterPeminta}
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <span><span className="text-slate-400">Depo: </span>{order.depo}</span>
              <span className="h-3 w-px bg-slate-200" />
              <span><span className="text-slate-400">Unit: </span>{order.unit}</span>
            </div>
          </div>
        </div>

        {/* Drug reference list */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Daftar Obat
            </p>
            <span className="text-[10px] font-bold text-slate-500">
              {telaahCount}/{order.items.length} telaah
            </span>
          </div>

          {/* Mini progress */}
          <div className="mb-3 h-1 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              animate={{ width: `${order.items.length ? (telaahCount / order.items.length) * 100 : 0}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={cn("h-full rounded-full", allTelaahDone ? "bg-emerald-500" : "bg-sky-400")}
            />
          </div>

          <div className="space-y-2">
            {order.items.map((item) => (
              <DrugContextCard
                key={item.id}
                item={item}
                labeled={rows[item.id]?.labeled ?? false}
                telaahDone={!!telaahAkhir[item.id]}
              />
            ))}
          </div>

          {/* Total */}
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Tagihan</span>
              <span className="text-sm font-black text-sky-700">{fmtRupiah(totalHarga)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════
          RIGHT PANEL — Workflow steps
      ═══════════════════════════════════════════ */}
      <div className="space-y-5">

        {/* Step progress indicator */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <StepProgress step1Done={step1Done} step2Done={step2Done} />
        </div>

        {/* ── STEP 1: Siapkan & Verifikasi ── */}
        <StepLabel n={1} label="Siapkan & Verifikasi Obat" done={step1Done} />

        <div className="space-y-2">
          {order.items.map((item) => {
            const rowLabeled = rows[item.id]?.labeled ?? false;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all",
                  item.isHAM && !rowLabeled ? "border-rose-200 bg-rose-50/30" : "",
                  rowLabeled ? "border-emerald-200 bg-emerald-50/30" : !item.isHAM ? "border-slate-200 bg-white" : "",
                )}
              >
                {/* Drug name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {item.isHAM && <AlertTriangle size={9} className="text-rose-500 shrink-0" />}
                    <span className="truncate text-xs font-semibold text-slate-800">{item.namaObat}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{item.dosis} · {item.rute}</p>
                </div>

                {/* Lot/Batch */}
                <input
                  type="text"
                  value={rows[item.id]?.lotNo ?? ""}
                  onChange={(e) => updateRow(item.id, "lotNo", e.target.value)}
                  placeholder="LOT"
                  className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-mono text-slate-600 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100"
                />

                {/* Exp date */}
                <input
                  type="month"
                  value={rows[item.id]?.expDate ?? ""}
                  onChange={(e) => updateRow(item.id, "expDate", e.target.value)}
                  className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] text-slate-600 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100"
                />

                {/* Label toggle */}
                <div className="flex shrink-0 flex-col items-center gap-0.5">
                  <motion.button
                    onClick={() => updateRow(item.id, "labeled", !rowLabeled)}
                    whileTap={{ scale: 0.82 }}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg border-2 transition-all",
                      rowLabeled
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-slate-300 bg-white hover:border-sky-400",
                    )}
                    aria-label={`Label ${item.namaObat}`}
                    title="Konfirmasi label etiket terpasang"
                  >
                    {rowLabeled ? (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 600, damping: 20 }}
                      >
                        <Check size={11} className="text-white" />
                      </motion.div>
                    ) : (
                      <Tag size={10} className="text-slate-400" />
                    )}
                  </motion.button>
                  <span className="text-[8px] font-semibold text-slate-400">Label</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Label status pill */}
        <AnimatePresence>
          {!allLabeled && (
            <motion.p
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-xs text-amber-600"
            >
              <Package size={11} />
              {order.items.filter((i) => !rows[i.id]?.labeled).length} obat belum diberi label etiket.
            </motion.p>
          )}
        </AnimatePresence>

        <SectionDivider />

        {/* ── STEP 2: Telaah Akhir ── */}
        <StepLabel n={2} label="Telaah Akhir Resep" done={step2Done} />

        {/* Info + progress */}
        <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/60 px-3.5 py-2.5">
          <ClipboardCheck size={13} className="shrink-0 text-sky-600" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-sky-700">SNARS PKPO 5.1 — Verifikasi 5 Benar</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1 h-1 overflow-hidden rounded-full bg-sky-100">
                <motion.div
                  animate={{ width: `${order.items.length ? (telaahCount / order.items.length) * 100 : 0}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={cn("h-full rounded-full", allTelaahDone ? "bg-emerald-500" : "bg-sky-400")}
                />
              </div>
              <span className={cn(
                "shrink-0 text-[10px] font-bold",
                allTelaahDone ? "text-emerald-600" : "text-sky-600",
              )}>
                {telaahCount}/{order.items.length}
              </span>
            </div>
          </div>
        </div>

        {/* Per-item cards */}
        <div className="space-y-2">
          {order.items.map((item) => (
            <TelaahAkhirItem
              key={item.id}
              item={item}
              patientName={patientName}
              confirmed={!!telaahAkhir[item.id]}
              disabled={!step1Done}
              onConfirm={() => confirmTelaahItem(item.id)}
            />
          ))}
        </div>

        {/* Verifikator — muncul setelah semua item terverifikasi */}
        <AnimatePresence>
          {allTelaahDone && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}
              className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4"
            >
              <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <UserCheck size={12} />
                Telaah Akhir Dilakukan Oleh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={verifikatorAkhir}
                onChange={(e) => setVerifikatorAkhir(e.target.value)}
                placeholder="Nama apoteker / TTK yang melakukan telaah akhir"
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <SectionDivider />

        {/* NAR/PSI (conditional) */}
        <NarPsiVerif
          items={order.items}
          petugas2={petugas2}
          confirmed={narConfirm}
          onPetugas={setPetugas2}
          onConfirm={setNarConfirm}
        />
        {hasNarPsi && <SectionDivider />}

        {/* ── STEP 3: Serah Terima ── */}
        <StepLabel n={3} label="Serahkan ke Penerima" />

        {/* Penerima + catatan */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-600">
              <User size={10} /> Nama Penerima <span className="text-rose-500">*</span>
            </label>
            <input
              type="text" value={penerima} onChange={(e) => setPenerima(e.target.value)}
              placeholder="Perawat / pasien / keluarga"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Catatan Penyerahan</label>
            <input
              type="text" value={catatan} onChange={(e) => setCatatan(e.target.value)}
              placeholder="Mis: pasien mengerti cara injeksi"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>

        {/* Edukasi checklist */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Edukasi Pasien</p>
            <span className={cn("text-[10px] font-bold", edukasiDone === EDUKASI_ITEMS.length ? "text-emerald-600" : "text-slate-400")}>
              {edukasiDone}/{EDUKASI_ITEMS.length}
            </span>
          </div>
          <div className="mb-3 h-1 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              animate={{ width: `${(edukasiDone / EDUKASI_ITEMS.length) * 100}%` }}
              transition={{ duration: 0.35 }}
              className={cn("h-full rounded-full", edukasiDone === EDUKASI_ITEMS.length ? "bg-emerald-500" : "bg-sky-400")}
            />
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {EDUKASI_ITEMS.map((item, i) => (
              <motion.button
                key={i} onClick={() => toggleEdukasi(i)} whileHover={{ x: 1 }}
                className={cn(
                  "flex items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-all",
                  edukasi[i] ? "bg-emerald-50/70" : "hover:bg-slate-50",
                )}
              >
                <div className={cn(
                  "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border-2 transition-all",
                  edukasi[i] ? "border-emerald-500 bg-emerald-500" : "border-slate-300",
                )}>
                  <AnimatePresence>
                    {edukasi[i] && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 600, damping: 20 }}
                      >
                        <Check size={8} className="text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className={cn(
                  "text-xs leading-relaxed transition-colors",
                  edukasi[i] ? "text-emerald-600/80 line-through" : "text-slate-700",
                )}>{item}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Item summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
            <ClipboardList size={11} /> Item yang Diserahkan ({order.items.length})
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {order.items.map((item) => (
              <div key={item.id} className={cn(
                "rounded-lg border px-2.5 py-1.5 text-xs",
                item.isHAM ? "border-rose-200 bg-rose-50" : "border-slate-100 bg-slate-50",
              )}>
                <p className="truncate font-semibold text-slate-800">{item.namaObat}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{item.jumlah} {item.satuanObat ?? "Tab"} · {item.rute}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileHover={readyToSubmit ? { scale: 1.01 } : {}}
          whileTap={readyToSubmit ? { scale: 0.98 } : {}}
          onClick={handleSubmit}
          disabled={!readyToSubmit}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
            readyToSubmit
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-200 hover:bg-emerald-700"
              : "cursor-not-allowed bg-slate-100 text-slate-400",
          )}
        >
          <Package size={16} />
          Dispensasi & Serahkan Obat
        </motion.button>

        {/* Gate warnings */}
        <AnimatePresence>
          {!canSubmit && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center text-xs text-amber-600">
              Selesaikan Telaah Resep terlebih dahulu.
            </motion.p>
          )}
          {canSubmit && !step2Done && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center text-xs text-amber-600">
              Selesaikan Telaah Akhir Resep (Step 2) terlebih dahulu.
            </motion.p>
          )}
          {canSubmit && step2Done && !narPsiOk && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center text-xs text-amber-600">
              Lengkapi verifikasi Narkotika/Psikotropika terlebih dahulu.
            </motion.p>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
