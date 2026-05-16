"use client";

import { Plus, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KecelakaanDraft, KendaraanItem } from "./kecelakaanTypes";
import { JENIS_KENDARAAN, MEKANISME_KLL } from "./kecelakaanTypes";

// ─── Field styles ─────────────────────────────────────────────

const sm    = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 placeholder:text-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition";
const smSel = "w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition cursor-pointer";
const lbl   = "mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400";

// ─── Kendaraan row ────────────────────────────────────────────

function KendaraanRow({
  item,
  index,
  onUpdate,
  onRemove,
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

// ─── KLLPanel ─────────────────────────────────────────────────

export function KLLPanel({
  draft,
  setDraft,
}: {
  draft:    KecelakaanDraft;
  setDraft: React.Dispatch<React.SetStateAction<KecelakaanDraft>>;
}) {
  const addKendaraan = () =>
    setDraft(d => ({
      ...d,
      kendaraan: [...d.kendaraan, { jenis: "", noPol: "", peran: "Korban" }],
    }));

  const updateKendaraan = (i: number, patch: Partial<KendaraanItem>) =>
    setDraft(d => ({
      ...d,
      kendaraan: d.kendaraan.map((k, idx) => (idx === i ? { ...k, ...patch } : k)),
    }));

  const removeKendaraan = (i: number) =>
    setDraft(d => ({
      ...d,
      kendaraan: d.kendaraan.filter((_, idx) => idx !== i),
    }));

  return (
    <div className="space-y-3">
      {/* Jasa Raharja info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
        <Info size={13} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="text-[11px] font-bold text-amber-800">Ditanggung Jasa Raharja</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-amber-700">
            Kecelakaan lalu lintas dijamin PT Jasa Raharja sesuai UU No. 34/1964 dan PP 18/1965.
            Laporan Polisi (LP) wajib dilampirkan untuk proses klaim santunan.
          </p>
        </div>
      </div>

      {/* Laporan Kepolisian */}
      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
          Laporan Kepolisian
        </p>
        <div className="grid grid-cols-2 gap-3">
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
