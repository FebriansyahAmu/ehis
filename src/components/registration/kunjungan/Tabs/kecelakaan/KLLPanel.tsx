"use client";

import { Plus, X, Info, AlertCircle, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { KecelakaanDraft, KendaraanItem, StatusLP, StatusKoordinasiJR } from "./kecelakaanTypes";
import {
  JENIS_KENDARAAN, MEKANISME_KLL,
  STATUS_LP_CONFIG, STATUS_JR_CONFIG,
} from "./kecelakaanTypes";

// ─── Field styles ─────────────────────────────────────────────

const sm    = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 placeholder:text-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition";
const smSel = "w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition cursor-pointer";
const lbl   = "mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400";

// ─── Kendaraan row ────────────────────────────────────────────

function KendaraanRow({
  item, index, onUpdate, onRemove,
}: {
  item:     KendaraanItem;
  index:    number;
  onUpdate: (i: number, patch: Partial<KendaraanItem>) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="flex items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
      <div className="min-w-0 flex-1">
        <p className={lbl}>Jenis Kendaraan</p>
        <select
          className={smSel}
          value={item.jenis}
          onChange={e => onUpdate(index, { jenis: e.target.value })}
        >
          <option value="">Pilih jenis...</option>
          {JENIS_KENDARAAN.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
      </div>
      <div className="w-28 shrink-0">
        <p className={lbl}>No. Polisi</p>
        <input
          className={sm}
          placeholder="B 1234 ABC"
          value={item.noPol}
          onChange={e => onUpdate(index, { noPol: e.target.value.toUpperCase() })}
        />
      </div>
      <div className="w-28 shrink-0">
        <p className={lbl}>Peran</p>
        <select
          className={smSel}
          value={item.peran}
          onChange={e => onUpdate(index, { peran: e.target.value as KendaraanItem["peran"] })}
        >
          <option value="Korban">Korban</option>
          <option value="Pelaku">Pelaku</option>
          <option value="Keterlibatan">Keterlibatan</option>
        </select>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-200 text-rose-400 transition hover:bg-rose-50 active:scale-95"
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ─── Status chip row ──────────────────────────────────────────

function ChipRow<T extends string>({
  options,
  config,
  value,
  onChange,
}: {
  options:  T[];
  config:   Record<T, { label: string; chipCls: string; dot: string }>;
  value:    T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(s => {
        const cfg      = config[s];
        const isActive = value === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10.5px] font-semibold transition active:scale-95",
              isActive
                ? cfg.chipCls
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <div className={cn("h-1.5 w-1.5 rounded-full", isActive ? cfg.dot : "bg-slate-300")} />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── KLLPanel ─────────────────────────────────────────────────

export function KLLPanel({
  draft,
  setDraft,
}: {
  draft:    KecelakaanDraft;
  setDraft: React.Dispatch<React.SetStateAction<KecelakaanDraft>>;
}) {
  const addKendaraan = () =>
    setDraft(d => ({ ...d, kendaraan: [...d.kendaraan, { jenis: "", noPol: "", peran: "Korban" }] }));

  const updateKendaraan = (i: number, patch: Partial<KendaraanItem>) =>
    setDraft(d => ({
      ...d,
      kendaraan: d.kendaraan.map((k, idx) => (idx === i ? { ...k, ...patch } : k)),
    }));

  const removeKendaraan = (i: number) =>
    setDraft(d => ({ ...d, kendaraan: d.kendaraan.filter((_, idx) => idx !== i) }));

  const lpStatuses: StatusLP[]           = ["belum", "proses", "ada"];
  const jrStatuses: StatusKoordinasiJR[] = ["belum", "dijadwalkan", "verifikasi"];

  return (
    <div className="space-y-3">

      {/* Jasa Raharja info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
        <Info size={13} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="text-[11px] font-bold text-amber-800">Ditanggung Jasa Raharja</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-amber-700">
            Dijamin PT Jasa Raharja (UU 34/1964 · PP 18/1965).
            Plafon: <span className="font-semibold">Rp 20 jt luka / Rp 50 jt meninggal–cacat tetap</span>.
            Proses klaim dapat berjalan <span className="font-semibold">paralel</span> dengan perawatan — LP bukan syarat mutlak untuk mulai klaim.
          </p>
        </div>
      </div>

      {/* Laporan Kepolisian */}
      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
          Laporan Kepolisian
        </p>

        <div>
          <p className={lbl}>Status Laporan Polisi (LP)</p>
          <ChipRow
            options={lpStatuses}
            config={STATUS_LP_CONFIG}
            value={draft.statusLP}
            onChange={v => setDraft(d => ({ ...d, statusLP: v }))}
          />
        </div>

        {/* Tip when LP missing */}
        <AnimatePresence>
          {(draft.statusLP === "belum" || draft.statusLP === "proses") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 p-2.5">
                <AlertCircle size={11} className="mt-0.5 shrink-0 text-sky-500" />
                <p className="text-[9.5px] leading-relaxed text-sky-700">
                  LP belum ada? Isi <span className="font-semibold">Kronologi Kejadian</span> di bawah sebagai
                  dokumen pengganti sementara. Klaim Jasa Raharja tetap dapat diproses untuk kasus ringan–sedang.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LP fields — only when LP sudah ada */}
        <AnimatePresence>
          {draft.statusLP === "ada" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <p className={lbl}>Nomor LP</p>
                  <input
                    className={sm}
                    placeholder="LP/XXXX/XX/XXXX/POLDA"
                    value={draft.noLapPol}
                    onChange={e => setDraft(d => ({ ...d, noLapPol: e.target.value }))}
                  />
                </div>
                <div>
                  <p className={lbl}>Satuan Kepolisian</p>
                  <input
                    className={sm}
                    placeholder="Polres / Polsek..."
                    value={draft.satuanPolisi}
                    onChange={e => setDraft(d => ({ ...d, satuanPolisi: e.target.value }))}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mekanisme trauma */}
        <div>
          <p className={lbl}>Mekanisme Trauma</p>
          <select
            className={smSel}
            value={draft.mekanismeTrauma}
            onChange={e => setDraft(d => ({ ...d, mekanismeTrauma: e.target.value }))}
          >
            <option value="">Pilih mekanisme...</option>
            {MEKANISME_KLL.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Penjamin */}
      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <div className="flex items-center gap-2">
          <Shield size={11} className="text-slate-400" />
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600">Penjamin</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10.5px] font-bold text-amber-700">
            Jasa Raharja
          </span>
          <span className="text-[9.5px] text-slate-400">Penjamin utama · otomatis</span>
        </div>

        <div>
          <p className={lbl}>Penjamin Lanjutan (setelah plafon JR habis)</p>
          <select
            className={smSel}
            value={draft.penjaminLanjutan}
            onChange={e => setDraft(d => ({ ...d, penjaminLanjutan: e.target.value }))}
          >
            <option value="">Tidak Ada / Belum Diketahui</option>
            <option value="bpjs">BPJS Kesehatan</option>
            <option value="umum">Umum / Mandiri</option>
            <option value="asuransi">Asuransi Swasta</option>
          </select>
        </div>
      </div>

      {/* Koordinasi Jasa Raharja */}
      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
          Koordinasi Jasa Raharja
        </p>
        <ChipRow
          options={jrStatuses}
          config={STATUS_JR_CONFIG}
          value={draft.statusKoordinasiJR}
          onChange={v => setDraft(d => ({ ...d, statusKoordinasiJR: v }))}
        />
      </div>

      {/* Kendaraan terlibat */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
              Kendaraan Terlibat
            </p>
            {draft.kendaraan.length > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                {draft.kendaraan.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={addKendaraan}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          >
            <Plus size={10} /> Tambah
          </button>
        </div>

        {draft.kendaraan.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 py-5 text-center text-[10px] text-slate-400">
            Belum ada kendaraan ditambahkan
          </p>
        ) : (
          <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            {draft.kendaraan.map((k, i) => (
              <KendaraanRow
                key={i}
                item={k}
                index={i}
                onUpdate={updateKendaraan}
                onRemove={removeKendaraan}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
