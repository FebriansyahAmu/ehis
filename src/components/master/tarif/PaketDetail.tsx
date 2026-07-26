"use client";

import { useState } from "react";
import { Save, Trash2, Plus, X, Package, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  type PaketDraft, PAKET_KATEGORI, PAKET_BADGE, PAKET_STATUS, statusCfg,
} from "./paketMasterShared";
import { fmtIDR } from "./tarifShared";

const INPUT = cn(
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800",
  "outline-none placeholder:text-slate-400 transition",
  "hover:border-slate-300 focus:border-teal-400 focus:ring-1 focus:ring-teal-100",
);
const LABEL = "block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1";

type Tab = "identitas" | "komposisi";

interface Props {
  draft:    PaketDraft;
  isNew:    boolean;
  isDirty:  boolean;
  busy:     boolean;
  onPatch:  (p: Partial<PaketDraft>) => void;
  onSave:   () => void;
  onCancel: () => void;
  onDelete: () => void;
}

/** Harga setelah diskon (untuk preview). */
function finalUmum(d: PaketDraft): number {
  const disc = d.diskonPct ? Math.round(d.hargaUmum * d.diskonPct / 100) : 0;
  return d.hargaUmum - disc;
}

// ── Right-panel widgets ──────────────────────────────────────

function PaketPreviewCard({ draft }: { draft: PaketDraft }) {
  const stsCfg = statusCfg(draft.status);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col items-center gap-2 bg-teal-50 px-4 pt-5 pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm ring-1 ring-teal-200">
          <Package size={22} className="text-teal-700" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold leading-snug text-teal-800">
            {draft.nama || "Nama Paket"}
          </p>
          <div className="mt-1 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="font-mono text-[10px] text-slate-500">{draft.kode || "Auto"}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", stsCfg.bg, stsCfg.text)}>
              {stsCfg.label}
            </span>
            {draft.badge && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-700">
                {draft.badge}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50">
        <div className="px-3 py-3 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Item</p>
          <p className="mt-0.5 text-base font-black text-slate-700">{draft.items.length}</p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Diskon</p>
          <p className="mt-0.5 text-base font-black text-teal-700">{draft.diskonPct ?? 0}%</p>
        </div>
      </div>

      {draft.hargaUmum > 0 && (
        <div className="border-b border-slate-100 px-4 py-3 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Tarif Paket Umum</p>
          <p className="mt-0.5 text-base font-black text-teal-700">{fmtIDR(finalUmum(draft))}</p>
          {!!draft.diskonPct && (
            <p className="text-[10px] text-slate-400 line-through">{fmtIDR(draft.hargaUmum)}</p>
          )}
          {draft.hargaBpjs != null && (
            <p className="text-[10px] text-sky-600 font-semibold">BPJS: {fmtIDR(draft.hargaBpjs)}</p>
          )}
        </div>
      )}

      <div className="divide-y divide-slate-50 px-4 py-1">
        <div className="py-2.5">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Kategori</span>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-600">{draft.kategori}</p>
        </div>
        {draft.deskripsi && (
          <div className="py-2.5">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Deskripsi</span>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{draft.deskripsi}</p>
          </div>
        )}
        {!draft.nama && (
          <p className="py-3 text-center text-[11px] italic text-slate-400">Isi form untuk melihat preview</p>
        )}
      </div>
    </div>
  );
}

function PaketSummaryCard({ draft }: { draft: PaketDraft }) {
  const disc = draft.diskonPct ? Math.round(draft.hargaUmum * draft.diskonPct / 100) : 0;
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col items-center gap-1 bg-teal-50 px-4 py-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-teal-500">Ringkasan Komposisi</p>
        <p className="text-xl font-black text-teal-800">{draft.items.length} Item</p>
      </div>

      {draft.items.length > 0 ? (
        <div className="divide-y divide-slate-50 px-4 py-1">
          {draft.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2 py-2.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-teal-100 text-[8px] font-bold text-teal-700">
                  {i + 1}
                </span>
                <span className="truncate text-[11px] font-medium text-slate-700">{item.nama || "—"}</span>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-teal-600">×{item.qty}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-4 py-6 text-center text-[11px] italic text-slate-400">
          Tambahkan item untuk melihat ringkasan
        </p>
      )}

      {draft.hargaUmum > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Harga Umum</span>
            <span className="font-semibold text-slate-700">{fmtIDR(draft.hargaUmum)}</span>
          </div>
          {disc > 0 && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Diskon {draft.diskonPct}%</span>
              <span className="font-semibold text-rose-500">− {fmtIDR(disc)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-xs">
            <span className="font-bold text-slate-700">Total Umum</span>
            <span className="font-black text-teal-700">{fmtIDR(finalUmum(draft))}</span>
          </div>
          {draft.hargaBpjs != null && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Tarif BPJS</span>
              <span className="font-semibold text-sky-600">{fmtIDR(draft.hargaBpjs)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────

export default function PaketDetail({
  draft, isNew, isDirty, busy, onPatch, onSave, onCancel, onDelete,
}: Props) {
  const [tab,     setTab]     = useState<Tab>("identitas");
  const [newNama, setNewNama] = useState("");

  const stsCfg = statusCfg(draft.status);
  const valid  = !!draft.nama.trim() && draft.hargaUmum > 0;

  const addItem = () => {
    const n = newNama.trim();
    if (!n) return;
    onPatch({ items: [...draft.items, { nama: n, qty: 1 }] });
    setNewNama("");
  };
  const updateItemNama = (idx: number, nama: string) =>
    onPatch({ items: draft.items.map((it, i) => i === idx ? { ...it, nama } : it) });
  const updateQty = (idx: number, qty: number) =>
    onPatch({ items: draft.items.map((it, i) => i === idx ? { ...it, qty } : it) });
  const removeItem = (idx: number) =>
    onPatch({ items: draft.items.filter((_, i) => i !== idx) });

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* Header strip */}
      <div className="shrink-0 border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50">
              <Package size={16} className="text-teal-700" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-snug text-slate-900">
                {draft.nama || (isNew ? "Paket Baru" : "—")}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-slate-400">{draft.kode || "Auto"}</span>
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", stsCfg.bg, stsCfg.text)}>
                  {stsCfg.label}
                </span>
              </div>
            </div>
          </div>
          {isDirty && (
            <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-600 ring-1 ring-amber-200">
              Belum tersimpan
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-1">
          {(["identitas", "komposisi"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold transition",
                tab === t ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
              )}
            >
              {t === "identitas" ? "Identitas" : `Komposisi (${draft.items.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — full-width grid layout */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            className="h-full overflow-y-auto">

            {tab === "identitas" && (
              <div className="grid h-full grid-cols-[1fr_260px]">

                {/* Left: form */}
                <div className="space-y-4 overflow-y-auto border-r border-slate-100 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Kode Paket</label>
                      {/* Kode AUTO-GEN server (PKT-NNNN) — tidak dapat diedit. */}
                      <div className="flex h-8.5 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
                        <Sparkles size={12} className="shrink-0 text-teal-500" />
                        <span className="font-mono text-xs text-slate-600">
                          {draft.kode || "Otomatis saat disimpan"}
                        </span>
                        <span className="ml-auto rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">AUTO</span>
                      </div>
                    </div>
                    <div>
                      <label className={LABEL}>Status</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {PAKET_STATUS.map((s) => (
                          <button key={s.value} onClick={() => onPatch({ status: s.value })}
                            className={cn(
                              "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition",
                              draft.status === s.value
                                ? cn(s.bg, s.text, "border-transparent")
                                : "border-slate-200 text-slate-500 hover:border-slate-300",
                            )}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Nama Paket<span className="ml-0.5 text-rose-500">*</span></label>
                    <input value={draft.nama} onChange={(e) => onPatch({ nama: e.target.value })}
                      placeholder="Nama paket layanan" className={INPUT} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Kategori</label>
                      <select value={draft.kategori} onChange={(e) => onPatch({ kategori: e.target.value })}
                        className={cn(INPUT, "cursor-pointer")}>
                        {PAKET_KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Badge (opsional)</label>
                      <select value={draft.badge ?? ""} onChange={(e) => onPatch({ badge: e.target.value || null })}
                        className={cn(INPUT, "cursor-pointer")}>
                        <option value="">— Tidak ada —</option>
                        {PAKET_BADGE.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Deskripsi</label>
                    <textarea value={draft.deskripsi} onChange={(e) => onPatch({ deskripsi: e.target.value })}
                      rows={3} placeholder="Keterangan singkat tentang paket ini..."
                      className={cn(INPUT, "resize-none")} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Diskon (%)</label>
                      <input type="number" min={0} max={100}
                        value={draft.diskonPct ?? ""} onChange={(e) => onPatch({ diskonPct: e.target.value ? Number(e.target.value) : null })}
                        className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Tarif BPJS (Rp)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">Rp</span>
                        <input type="number" min={0}
                          value={draft.hargaBpjs ?? ""} onChange={(e) => onPatch({ hargaBpjs: e.target.value ? Number(e.target.value) : null })}
                          className={cn(INPUT, "pl-8")} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Harga Paket Umum (Rp)<span className="ml-0.5 text-rose-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">Rp</span>
                      <input type="number" min={0}
                        value={draft.hargaUmum || ""} onChange={(e) => onPatch({ hargaUmum: Number(e.target.value) })}
                        className={cn(INPUT, "pl-8")} />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">Harga paket yang ditagihkan (sudah termasuk seluruh item).</p>
                  </div>
                </div>

                {/* Right: preview card */}
                <div className="overflow-y-auto bg-slate-50/30 p-4">
                  <PaketPreviewCard draft={draft} />
                </div>
              </div>
            )}

            {tab === "komposisi" && (
              <div className="grid h-full grid-cols-[1fr_260px]">

                {/* Left: items */}
                <div className="space-y-4 overflow-y-auto border-r border-slate-100 p-5">
                  <div className="space-y-1.5">
                    {draft.items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                        <Package size={20} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-xs text-slate-400">Belum ada item — tambahkan layanan di bawah</p>
                      </div>
                    ) : (
                      draft.items.map((item, idx) => (
                        <div key={idx}
                          className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-[10px] font-bold text-teal-700">
                            {idx + 1}
                          </span>
                          <input
                            value={item.nama}
                            onChange={(e) => updateItemNama(idx, e.target.value)}
                            placeholder="Nama layanan…"
                            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-200 focus:border-teal-300 focus:bg-white"
                          />
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQty(idx, Math.max(1, item.qty - 1))}
                              className="h-6 w-6 rounded text-center text-xs font-bold text-slate-400 hover:bg-slate-200 transition">−</button>
                            <span className="w-6 text-center text-xs font-semibold text-slate-700">{item.qty}</span>
                            <button onClick={() => updateQty(idx, item.qty + 1)}
                              className="h-6 w-6 rounded text-center text-xs font-bold text-slate-400 hover:bg-slate-200 transition">+</button>
                          </div>
                          <button onClick={() => removeItem(idx)}
                            className="text-slate-300 hover:text-rose-500 transition"><X size={13} /></button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add item (free text) */}
                  <div className="flex items-center gap-2">
                    <input
                      value={newNama}
                      onChange={(e) => setNewNama(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                      placeholder="Tambah layanan (mis. Darah Lengkap)…"
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 placeholder:text-slate-400"
                    />
                    <button onClick={addItem} disabled={!newNama.trim()}
                      className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-40 transition">
                      <Plus size={12} /> Tambah
                    </button>
                  </div>
                </div>

                {/* Right: summary card */}
                <div className="overflow-y-auto bg-slate-50/30 p-4">
                  <PaketSummaryCard draft={draft} />
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
        {!isNew ? (
          <button onClick={onDelete} disabled={busy}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 disabled:opacity-40 transition">
            <Trash2 size={12} /> Hapus
          </button>
        ) : <div />}
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={!isDirty || busy}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition">
            Batal
          </button>
          <button onClick={onSave} disabled={!isDirty || !valid || busy}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-40 transition">
            <Save size={12} /> {busy ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
