"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, CheckCircle2, ClipboardList, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { type FarmasiOrder, type FarmasiOrderItem, type SerahTerima } from "@/components/farmasi/farmasiShared";

interface Props {
  order:    FarmasiOrder;
  onSubmit: (orderId: string, items: FarmasiOrderItem[], serahTerima: SerahTerima) => void;
}

const EDUKASI_ITEMS = [
  "Cara penggunaan dan aturan pakai obat telah dijelaskan",
  "Efek samping umum dan cara mengatasinya telah disampaikan",
  "Cara penyimpanan obat yang benar telah diinformasikan",
  "Pasien / keluarga memahami dan dapat mengulang instruksi",
];

export default function SerahTerimaPane({ order, onSubmit }: Props) {
  const [penerima, setPenerima] = useState("");
  const [edukasi,  setEdukasi]  = useState<boolean[]>(() => EDUKASI_ITEMS.map(() => false));
  const [catatan,       setCatatan]       = useState("");
  const [submitted,     setSubmitted]     = useState(false);

  const isLocked   = order.status === "Selesai" || submitted;
  const canSubmit  = order.status === "Siap Diserahkan" || order.status === "Ditelaah";
  const edukasiDone = edukasi.filter(Boolean).length;

  function toggleEdukasi(i: number) {
    setEdukasi((prev) => prev.map((v, idx) => idx === i ? !v : v));
  }

  function handleSubmit() {
    if (!penerima) return;
    const data: SerahTerima = {
      waktu:           new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      perawatPenerima: penerima,
      apoteker:        "Apt. Dewi Rahayu, S.Farm",
      catatan:         catatan || undefined,
    };
    onSubmit(order.id, order.items, data);
    setSubmitted(true);
  }

  // ── Completed view ─────────────────────────────────────

  if (isLocked && order.serahTerima) {
    return (
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-500" />
          <div>
            <p className="font-bold text-emerald-700">Obat Telah Diserahkan</p>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-emerald-700">
              <div>
                <p className="text-emerald-500">Penerima</p>
                <p className="font-semibold">{order.serahTerima.perawatPenerima}</p>
              </div>
              <div>
                <p className="text-emerald-500">Apoteker</p>
                <p className="font-semibold">{order.serahTerima.apoteker}</p>
              </div>
              <div>
                <p className="text-emerald-500">Waktu</p>
                <p className="font-semibold">{order.serahTerima.waktu}</p>
              </div>
            </div>
            {order.serahTerima.catatan && (
              <p className="mt-2 text-xs italic text-emerald-600">"{order.serahTerima.catatan}"</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            Obat yang Diserahkan ({order.items.length})
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

  // ── Active form ────────────────────────────────────────

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-600">
          <User size={11} aria-hidden="true" />
          Nama Penerima <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={penerima}
          onChange={(e) => setPenerima(e.target.value)}
          placeholder="Nama perawat / pasien / keluarga"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      {/* Edukasi checklist */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Edukasi Pasien</p>
          <span className={cn(
            "text-[10px] font-bold",
            edukasiDone === EDUKASI_ITEMS.length ? "text-emerald-600" : "text-slate-400",
          )}>
            {edukasiDone}/{EDUKASI_ITEMS.length}
          </span>
        </div>

        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            animate={{ width: `${(edukasiDone / EDUKASI_ITEMS.length) * 100}%` }}
            transition={{ duration: 0.35 }}
            className={cn(
              "h-full rounded-full",
              edukasiDone === EDUKASI_ITEMS.length ? "bg-emerald-500" : "bg-sky-400",
            )}
          />
        </div>

        <div className="space-y-1">
          {EDUKASI_ITEMS.map((item, i) => (
            <motion.button
              key={i}
              onClick={() => toggleEdukasi(i)}
              whileHover={{ x: 2 }}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-all duration-150",
                edukasi[i] ? "bg-emerald-50/70" : "hover:bg-slate-50",
              )}
            >
              <div className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all duration-200",
                edukasi[i]
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-slate-300 hover:border-sky-400",
              )}>
                <AnimatePresence>
                  {edukasi[i] && (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 600, damping: 20 }}
                    >
                      <Check size={9} className="text-white" />
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
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <ClipboardList size={12} aria-hidden="true" />
          Item yang Diserahkan ({order.items.length})
        </p>
        <div className="grid grid-cols-2 gap-2">
          {order.items.map((item) => (
            <div key={item.id} className={cn(
              "rounded-lg border px-3 py-2 text-xs",
              item.isHAM ? "border-rose-200 bg-rose-50" : "border-slate-100 bg-slate-50",
            )}>
              <p className="truncate font-semibold text-slate-800">{item.namaObat}</p>
              <p className="mt-0.5 text-slate-400">{item.jumlah} {item.satuanObat ?? "Tab"}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-500">Catatan Penyerahan (opsional)</label>
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          rows={2}
          placeholder="Mis: Pasien mengerti cara injeksi insulin mandiri"
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      <motion.button
        whileHover={penerima && canSubmit ? { scale: 1.01 } : {}}
        whileTap={penerima && canSubmit ? { scale: 0.98 } : {}}
        onClick={handleSubmit}
        disabled={!penerima || !canSubmit}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
          penerima && canSubmit
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-200 hover:bg-emerald-700"
            : "cursor-not-allowed bg-slate-100 text-slate-400",
        )}
      >
        <Handshake size={16} />
        Serahkan Obat kepada Penerima
      </motion.button>

      {!canSubmit && (
        <p className="text-center text-xs text-amber-600">
          Selesaikan Telaah Resep dan Dispensasi terlebih dahulu.
        </p>
      )}
    </div>
  );
}
