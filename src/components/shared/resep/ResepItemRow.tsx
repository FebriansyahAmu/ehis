"use client";

import { useState } from "react";
import { Pill, Pencil, Trash2, X, Check, AlertCircle, AlertTriangle, PowerOff } from "lucide-react";
import type { ResepRIItem } from "@/lib/data";
import { cn } from "@/lib/utils";
import { KATEGORI_BADGE, SIGNA_OPTIONS, ATURAN_WAKTU, RUTE_OPTIONS, type AlergiObatRef } from "./resepShared";
import { Select } from "@/components/shared/inputs/Select";

interface Props {
  item:           ResepRIItem;
  index:          number;
  onRemove:       () => void;
  onEdit:         (updated: ResepRIItem) => void;
  onToggleAktif:  () => void;
  alergiHit?:     AlergiObatRef | null;
}

const INPUT_CLS = "h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200";

export default function ResepItemRow({ item, index, onRemove, onEdit, onToggleAktif, alergiHit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState({ ...item });

  const d = <K extends keyof ResepRIItem>(k: K, v: ResepRIItem[K]) =>
    setDraft((p) => ({ ...p, [k]: v }));

  function save() { onEdit(draft); setEditing(false); }
  function cancel() { setDraft({ ...item }); setEditing(false); }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border shadow-xs transition-all duration-200",
        !item.aktif
          ? "border-slate-100 bg-white opacity-60"
          : alergiHit
            ? "border-rose-300 bg-rose-50 ring-1 ring-rose-200"
            : "border-slate-200 bg-white",
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 p-3">
        <span className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          item.aktif ? "bg-indigo-50 text-indigo-500" : "bg-slate-100 text-slate-400",
        )}>
          <Pill size={14} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-xs font-semibold text-slate-800">{item.namaObat}</p>
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", KATEGORI_BADGE[item.kategori])}>
              {item.kategori}
            </span>
            {!item.aktif && (
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-400 ring-1 ring-slate-200">
                Dihentikan
              </span>
            )}
            {item.kategori !== "Reguler" && item.aktif && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                <AlertCircle size={9} />Perlu persetujuan khusus
              </span>
            )}
            {alergiHit && item.aktif && (
              <span
                title={`Berpotensi alergi terhadap ${alergiHit.allergen}`}
                className="flex items-center gap-0.5 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white"
              >
                <AlertTriangle size={9} /> Alergi
              </span>
            )}
          </div>
          {!editing && (
            <p className="mt-0.5 text-[11px] text-slate-500">
              {item.dosis}
              {item.dosisSekali && (
                <>
                  <span className="mx-1 text-slate-300">·</span>
                  <span className="text-slate-600">{item.dosisSekali}/minum</span>
                </>
              )}
              <span className="mx-1 text-slate-300">·</span>
              <span className="font-semibold text-indigo-600">{item.signa}</span>
              <span className="mx-1 text-slate-300">·</span>
              {item.aturanPakai}
              <span className="mx-1 text-slate-300">·</span>
              {item.rute}
              <span className="mx-1 text-slate-300">·</span>
              {item.durasiHari} hari
              {item.keterangan && (
                <span className="ml-1 italic text-slate-400">({item.keterangan})</span>
              )}
            </p>
          )}
          {!editing && alergiHit && item.aktif && (
            <p className="mt-1 flex items-start gap-1 text-[10px] font-medium text-rose-700">
              <AlertTriangle size={10} className="mt-0.5 shrink-0" />
              <span>
                Riwayat alergi: <span className="font-bold">{alergiHit.allergen}</span>
                {alergiHit.reactions.length > 0 && <> — efek: {alergiHit.reactions.join(", ")}</>}
              </span>
            </p>
          )}
        </div>

        {!editing && (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
              ×{item.jumlah}
            </span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
              title="Edit"
            >
              <Pencil size={10} />
            </button>
            <button
              type="button"
              onClick={onToggleAktif}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md border transition",
                item.aktif
                  ? "border-slate-200 text-slate-400 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
                  : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
              )}
              title={item.aktif ? "Hentikan" : "Aktifkan kembali"}
            >
              <PowerOff size={10} />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
              title="Hapus"
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Inline edit */}
      {editing && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-3 pb-3 pt-2.5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-indigo-500">Edit Order Obat</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Signa</p>
              <Select value={draft.signa} onChange={(v) => d("signa", v)}
                options={SIGNA_OPTIONS.map((s) => ({ value: s.val, label: s.val }))} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Waktu</p>
              <Select value={draft.aturanPakai} onChange={(v) => d("aturanPakai", v)} options={[...ATURAN_WAKTU]} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Jumlah</p>
              <input type="number" min={1} value={draft.jumlah}
                onChange={(e) => d("jumlah", Math.max(1, Number(e.target.value)))} className={INPUT_CLS} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Durasi (hari)</p>
              <input type="number" min={1} value={draft.durasiHari}
                onChange={(e) => d("durasiHari", Math.max(1, Number(e.target.value)))} className={INPUT_CLS} />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Rute</p>
              <Select value={draft.rute} onChange={(v) => d("rute", v)} options={[...RUTE_OPTIONS]} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Dosis Sekali Minum</p>
              <input value={draft.dosisSekali ?? ""} onChange={(e) => d("dosisSekali", e.target.value)}
                placeholder="Mis: 1 tablet" className={INPUT_CLS} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Keterangan</p>
              <input value={draft.keterangan ?? ""} onChange={(e) => d("keterangan", e.target.value)}
                placeholder="Catatan tambahan..." className={INPUT_CLS} />
            </div>
          </div>
          <div className="mt-2.5 flex justify-end gap-1.5">
            <button onClick={cancel}
              className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 px-3 text-[11px] text-slate-500 hover:bg-slate-100">
              <X size={10} /> Batal
            </button>
            <button onClick={save}
              className="flex h-7 items-center gap-1 rounded-lg bg-indigo-600 px-3 text-[11px] font-semibold text-white hover:bg-indigo-700">
              <Check size={10} /> Simpan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
