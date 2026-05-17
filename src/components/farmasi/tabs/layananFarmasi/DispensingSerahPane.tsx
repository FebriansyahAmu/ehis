"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, Check, User, ClipboardList,
  Package, UserCheck, Tag, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type FarmasiOrder, type FarmasiOrderItem, type SerahTerima,
  getPatientInfo, getLASAPair,
} from "@/components/farmasi/farmasiShared";
import {
  StepProgress, SectionDivider, StepLabel,
  DrugContextCard, NarPsiVerif, TelaahAkhirItem,
} from "./dispensingSerahHelpers";

// ── Helpers ───────────────────────────────────────────────

function fmtRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
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

// ── Main ──────────────────────────────────────────────────

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
  const [lasaConfirmed,    setLasaConfirmed]    = useState<Record<string, boolean>>({});
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

  const hasNarPsi     = order.items.some((i) => i.kategori === "Narkotika" || i.kategori === "Psikotropika");
  const narPsiOk      = !hasNarPsi || (!!petugas2 && narConfirm);
  const totalHarga    = order.items.reduce((sum, i) => sum + (i.hargaSatuan ?? 0) * i.jumlah, 0);
  const allLabeled    = order.items.every((i) => rows[i.id]?.labeled);
  const allTelaahDone = order.items.every((i) => telaahAkhir[i.id]);
  const telaahCount   = order.items.filter((i) => telaahAkhir[i.id]).length;

  const lasaItems       = order.items.filter((i) => i.isLASA);
  const allLasaConfirmed = lasaItems.length === 0 || lasaItems.every((i) => lasaConfirmed[i.id]);

  const step1Done     = allLabeled && allLasaConfirmed;
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
      waktu:            new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      perawatPenerima:  penerima,
      apoteker:         "Apt. Dewi Rahayu, S.Farm",
      catatan:          catatan || undefined,
      petugas2NAR:      petugas2 || undefined,
      verifikatorAkhir: verifikatorAkhir || undefined,
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
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-bold text-emerald-700">Dispensasi & Penyerahan Selesai</p>
              <div className="mt-2 space-y-1 text-xs">
                {(
                  [
                    ["Penerima",       order.serahTerima.perawatPenerima],
                    ["Apoteker",       order.serahTerima.apoteker],
                    ["Waktu",          order.serahTerima.waktu],
                    ...(order.serahTerima.verifikatorAkhir ? [["Telaah Akhir",    order.serahTerima.verifikatorAkhir]] : []),
                    ...(order.serahTerima.petugas2NAR      ? [["Petugas NAR/PSI", order.serahTerima.petugas2NAR]]      : []),
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-emerald-500">{k}</p>
                    <p className="font-semibold text-emerald-800">{v}</p>
                  </div>
                ))}
              </div>
              {order.serahTerima.catatan && (
                <p className="mt-2 text-xs italic text-emerald-600">"{order.serahTerima.catatan}"</p>
              )}
            </div>
          </div>
        </div>

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

  // ── Active layout ──────────────────────────────────────

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_3fr] lg:items-start">

      {/* LEFT — order context (sticky) */}
      <div className="space-y-3 lg:sticky lg:top-4">
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
            <div className="text-slate-500"><span className="text-slate-400">Dokter: </span>{order.dokterPeminta}</div>
            <div className="flex items-center gap-3 text-slate-500">
              <span><span className="text-slate-400">Depo: </span>{order.depo}</span>
              <span className="h-3 w-px bg-slate-200" />
              <span><span className="text-slate-400">Unit: </span>{order.unit}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daftar Obat</p>
            <span className="text-[10px] font-bold text-slate-500">{telaahCount}/{order.items.length} telaah</span>
          </div>
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
                key={item.id} item={item}
                labeled={rows[item.id]?.labeled ?? false}
                telaahDone={!!telaahAkhir[item.id]}
              />
            ))}
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Tagihan</span>
              <span className="text-sm font-black text-sky-700">{fmtRupiah(totalHarga)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — workflow steps */}
      <div className="space-y-5">

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <StepProgress step1Done={step1Done} step2Done={step2Done} />
        </div>

        {/* ── STEP 1 ── */}
        <StepLabel n={1} label="Siapkan & Verifikasi Obat" done={step1Done} />

        <div className="space-y-2">
          {order.items.map((item) => {
            const rowLabeled   = rows[item.id]?.labeled ?? false;
            const lasaChecked  = !!lasaConfirmed[item.id];
            const pair         = item.isLASA ? getLASAPair(item.namaObat) : null;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
                className="space-y-0"
              >
                <div className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all",
                  item.isLASA && !lasaChecked ? "border-amber-200 bg-amber-50/20" :
                  item.isHAM && !rowLabeled ? "border-rose-200 bg-rose-50/30" :
                  rowLabeled ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-white",
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.isHAM  && <AlertTriangle size={9} className="text-rose-500 shrink-0" />}
                      {item.isLASA && <span className="rounded px-1 py-0 text-[8px] font-black bg-amber-100 text-amber-700">LASA</span>}
                      <span className="truncate text-xs font-semibold text-slate-800">{item.namaObat}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{item.dosis} · {item.rute}</p>
                  </div>

                  <input
                    type="text" value={rows[item.id]?.lotNo ?? ""}
                    onChange={(e) => updateRow(item.id, "lotNo", e.target.value)}
                    placeholder="LOT"
                    className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-mono text-slate-600 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100"
                  />
                  <input
                    type="month" value={rows[item.id]?.expDate ?? ""}
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
                        rowLabeled ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white hover:border-sky-400",
                      )}
                      title="Konfirmasi label etiket terpasang"
                    >
                      {rowLabeled ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 20 }}>
                          <Check size={11} className="text-white" />
                        </motion.div>
                      ) : (
                        <Tag size={10} className="text-slate-400" />
                      )}
                    </motion.button>
                    <span className="text-[8px] font-semibold text-slate-400">Label</span>
                  </div>

                  {/* LASA confirm toggle */}
                  {item.isLASA && (
                    <div className="flex shrink-0 flex-col items-center gap-0.5">
                      <motion.button
                        onClick={() => setLasaConfirmed((p) => ({ ...p, [item.id]: !lasaChecked }))}
                        whileTap={{ scale: 0.82 }}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg border-2 transition-all",
                          lasaChecked ? "border-emerald-500 bg-emerald-500" : "border-amber-400 bg-amber-50 hover:border-amber-500",
                        )}
                        title={`Konfirmasi LASA: bukan ${pair ?? "obat serupa"}`}
                      >
                        {lasaChecked ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 20 }}>
                            <Check size={11} className="text-white" />
                          </motion.div>
                        ) : (
                          <AlertTriangle size={9} className="text-amber-600" />
                        )}
                      </motion.button>
                      <span className="text-[8px] font-semibold text-amber-500">LASA</span>
                    </div>
                  )}
                </div>

                {/* LASA pair hint */}
                <AnimatePresence>
                  {item.isLASA && !lasaChecked && pair && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pl-3 pt-0.5 text-[10px] text-amber-600"
                    >
                      Konfirmasi bukan tertukar dengan: <span className="font-semibold">{pair}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Status pills */}
        <AnimatePresence>
          {!allLabeled && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-xs text-amber-600">
              <Package size={11} />
              {order.items.filter((i) => !rows[i.id]?.labeled).length} obat belum diberi label etiket.
            </motion.p>
          )}
          {allLabeled && !allLasaConfirmed && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle size={11} />
              {lasaItems.filter((i) => !lasaConfirmed[i.id]).length} obat LASA belum dikonfirmasi.
            </motion.p>
          )}
        </AnimatePresence>

        <SectionDivider />

        {/* ── STEP 2 ── */}
        <StepLabel n={2} label="Telaah Akhir Resep" done={step2Done} />

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
              <span className={cn("shrink-0 text-[10px] font-bold", allTelaahDone ? "text-emerald-600" : "text-sky-600")}>
                {telaahCount}/{order.items.length}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {order.items.map((item) => (
            <TelaahAkhirItem
              key={item.id} item={item} patientName={patientName}
              confirmed={!!telaahAkhir[item.id]}
              disabled={!step1Done}
              onConfirm={() => setTelaahAkhir((p) => ({ ...p, [item.id]: true }))}
            />
          ))}
        </div>

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
                type="text" value={verifikatorAkhir} onChange={(e) => setVerifikatorAkhir(e.target.value)}
                placeholder="Nama apoteker / TTK yang melakukan telaah akhir"
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <SectionDivider />

        <NarPsiVerif
          items={order.items} petugas2={petugas2} confirmed={narConfirm}
          onPetugas={setPetugas2} onConfirm={setNarConfirm}
        />
        {hasNarPsi && <SectionDivider />}

        {/* ── STEP 3 ── */}
        <StepLabel n={3} label="Serahkan ke Penerima" />

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

        {/* Edukasi */}
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
                key={i}
                onClick={() => setEdukasi((p) => p.map((v, idx) => idx === i ? !v : v))}
                whileHover={{ x: 1 }}
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
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 600, damping: 20 }}>
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

        {/* Items summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
            <ClipboardList size={11} /> Item yang Diserahkan ({order.items.length})
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {order.items.map((item) => (
              <div key={item.id} className={cn(
                "rounded-lg border px-2.5 py-1.5 text-xs",
                item.isHAM ? "border-rose-200 bg-rose-50" : item.isLASA ? "border-amber-200 bg-amber-50/50" : "border-slate-100 bg-slate-50",
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
