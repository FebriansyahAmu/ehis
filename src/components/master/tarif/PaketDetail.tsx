"use client";

import { useState } from "react";
import { Save, Trash2, Search, Plus, X, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PaketLayanan, TarifRecord } from "@/lib/master/tarifMock";
import { STATUS_CFG, STATUS_LIST, KATEGORI_CFG, fmtIDR, fmtIDRShort, calcPaketTotal } from "./tarifShared";

const INPUT = cn(
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800",
  "outline-none placeholder:text-slate-400 transition",
  "hover:border-slate-300 focus:border-teal-400 focus:ring-1 focus:ring-teal-100",
);
const LABEL = "block text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1";

type Tab = "identitas" | "komposisi";

interface Props {
  draft:     PaketLayanan;
  isNew:     boolean;
  isDirty:   boolean;
  allTarifs: TarifRecord[];
  onPatch:   (p: Partial<PaketLayanan>) => void;
  onSave:    () => void;
  onCancel:  () => void;
  onDelete:  () => void;
}

// ── Right-panel widgets ──────────────────────────────────────

function PaketPreviewCard({ draft }: { draft: PaketLayanan }) {
  const stsCfg = STATUS_CFG[draft.status];
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
            <span className="font-mono text-[10px] text-slate-500">{draft.kode || "—"}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", stsCfg.bg, stsCfg.text)}>
              {stsCfg.label}
            </span>
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
          <p className="mt-0.5 text-base font-black text-teal-700">{draft.diskon ?? 0}%</p>
        </div>
      </div>

      {draft.tarifUmum > 0 && (
        <div className="border-b border-slate-100 px-4 py-3 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Tarif Paket Umum</p>
          <p className="mt-0.5 text-base font-black text-teal-700">{fmtIDR(draft.tarifUmum)}</p>
          {draft.tarifBPJS && (
            <p className="text-[10px] text-sky-600 font-semibold">BPJS: {fmtIDR(draft.tarifBPJS)}</p>
          )}
        </div>
      )}

      <div className="divide-y divide-slate-50 px-4 py-1">
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

function PaketSummaryCard({
  draft, allTarifs,
}: { draft: PaketLayanan; allTarifs: TarifRecord[] }) {
  const baseTotal = calcPaketTotal(draft.items, allTarifs);
  const diskonRp  = draft.diskon ? Math.round(baseTotal * draft.diskon / 100) : 0;
  const finalUmum = baseTotal - diskonRp;
  const maxVal    = baseTotal || 1;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col items-center gap-1 bg-teal-50 px-4 py-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-teal-500">Ringkasan Komposisi</p>
        <p className="text-xl font-black text-teal-800">{draft.items.length} Item</p>
      </div>

      {draft.items.length > 0 && (
        <div className="divide-y divide-slate-50 px-4 py-1">
          {draft.items.map((item) => {
            const t = allTarifs.find((x) => x.id === item.tarifId);
            if (!t) return null;
            const cfg = KATEGORI_CFG[t.kategori];
            const subtotal = t.tarifUmum * item.qty;
            const pct = Math.round((subtotal / maxVal) * 100);
            return (
              <div key={item.tarifId} className="py-2.5">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <cfg.icon size={11} className={cfg.text} />
                    <span className="truncate text-[11px] font-semibold text-slate-700">{t.nama}</span>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-teal-600">{fmtIDRShort(subtotal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className={cn("h-full rounded-full", cfg.bg.replace("-50", "-400"))}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400">×{item.qty}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {baseTotal > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-semibold text-slate-700">{fmtIDR(baseTotal)}</span>
          </div>
          {diskonRp > 0 && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Diskon {draft.diskon}%</span>
              <span className="font-semibold text-rose-500">− {fmtIDR(diskonRp)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-xs">
            <span className="font-bold text-slate-700">Total Umum</span>
            <span className="font-black text-teal-700">{fmtIDR(finalUmum)}</span>
          </div>
        </div>
      )}

      {draft.items.length === 0 && (
        <p className="px-4 py-6 text-center text-[11px] italic text-slate-400">
          Tambahkan item untuk melihat ringkasan
        </p>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────

export default function PaketDetail({
  draft, isNew, isDirty, allTarifs, onPatch, onSave, onCancel, onDelete,
}: Props) {
  const [tab,     setTab]     = useState<Tab>("identitas");
  const [addQ,    setAddQ]    = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const stsCfg = STATUS_CFG[draft.status];
  const valid  = !!draft.kode.trim() && !!draft.nama.trim() && draft.items.length > 0;

  const addableItems = allTarifs.filter(
    (t) => !draft.items.some((i) => i.tarifId === t.id) &&
      (!addQ || t.nama.toLowerCase().includes(addQ.toLowerCase()) ||
       t.kode.toLowerCase().includes(addQ.toLowerCase()))
  );

  const updateQty = (tarifId: string, qty: number) => {
    onPatch({ items: draft.items.map((i) => i.tarifId === tarifId ? { ...i, qty } : i) });
  };
  const removeItem = (tarifId: string) => {
    onPatch({ items: draft.items.filter((i) => i.tarifId !== tarifId) });
  };
  const addItem = (tarifId: string) => {
    onPatch({ items: [...draft.items, { tarifId, qty: 1 }] });
    setAddQ(""); setShowAdd(false);
  };

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
                <span className="text-[10px] font-mono text-slate-400">{draft.kode || "—"}</span>
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
                      <label className={LABEL}>Kode Paket<span className="ml-0.5 text-rose-500">*</span></label>
                      <input value={draft.kode} onChange={(e) => onPatch({ kode: e.target.value })}
                        placeholder="cth. PKT-MCU-01" className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Status</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {STATUS_LIST.map((s) => (
                          <button key={s} onClick={() => onPatch({ status: s })}
                            className={cn(
                              "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition",
                              draft.status === s
                                ? cn(STATUS_CFG[s].bg, STATUS_CFG[s].text, "border-transparent")
                                : "border-slate-200 text-slate-500 hover:border-slate-300",
                            )}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Nama Paket<span className="ml-0.5 text-rose-500">*</span></label>
                    <input value={draft.nama} onChange={(e) => onPatch({ nama: e.target.value })}
                      placeholder="Nama paket layanan" className={INPUT} />
                  </div>

                  <div>
                    <label className={LABEL}>Deskripsi</label>
                    <textarea value={draft.deskripsi ?? ""} onChange={(e) => onPatch({ deskripsi: e.target.value || undefined })}
                      rows={3} placeholder="Keterangan singkat tentang paket ini..."
                      className={cn(INPUT, "resize-none")} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Diskon (%)</label>
                      <input type="number" min={0} max={100}
                        value={draft.diskon ?? ""} onChange={(e) => onPatch({ diskon: e.target.value ? Number(e.target.value) : undefined })}
                        className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Tarif BPJS (Rp)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">Rp</span>
                        <input type="number" min={0}
                          value={draft.tarifBPJS ?? ""} onChange={(e) => onPatch({ tarifBPJS: e.target.value ? Number(e.target.value) : undefined })}
                          className={cn(INPUT, "pl-8")} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Override Tarif Umum (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">Rp</span>
                      <input type="number" min={0}
                        value={draft.tarifUmum || ""} onChange={(e) => onPatch({ tarifUmum: Number(e.target.value) })}
                        className={cn(INPUT, "pl-8")} />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">Kosongkan untuk menggunakan total otomatis dari komposisi item</p>
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
                        <p className="text-xs text-slate-400">Belum ada item — tambahkan dari katalog</p>
                      </div>
                    ) : (
                      draft.items.map((item) => {
                        const t = allTarifs.find((x) => x.id === item.tarifId);
                        if (!t) return null;
                        const cfg = KATEGORI_CFG[t.kategori];
                        return (
                          <div key={item.tarifId}
                            className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", cfg.bg)}>
                              <cfg.icon size={12} className={cfg.text} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-slate-700">{t.nama}</p>
                              <p className="text-[10px] font-mono text-slate-400">{t.kode}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateQty(item.tarifId, Math.max(1, item.qty - 1))}
                                className="h-6 w-6 rounded text-center text-xs font-bold text-slate-400 hover:bg-slate-200 transition">−</button>
                              <span className="w-6 text-center text-xs font-semibold text-slate-700">{item.qty}</span>
                              <button onClick={() => updateQty(item.tarifId, item.qty + 1)}
                                className="h-6 w-6 rounded text-center text-xs font-bold text-slate-400 hover:bg-slate-200 transition">+</button>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-teal-600">{fmtIDRShort(t.tarifUmum * item.qty)}</p>
                              {item.qty > 1 && (
                                <p className="text-[9px] text-slate-400">{fmtIDRShort(t.tarifUmum)} / item</p>
                              )}
                            </div>
                            <button onClick={() => removeItem(item.tarifId)}
                              className="text-slate-300 hover:text-rose-500 transition"><X size={13} /></button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add from catalog */}
                  <div>
                    <button onClick={() => setShowAdd((v) => !v)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-800 transition">
                      <Plus size={12} /> Tambah dari Katalog
                    </button>
                    <AnimatePresence>
                      {showAdd && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} className="mt-2 overflow-hidden">
                          <div className="relative mb-2">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input value={addQ} onChange={(e) => setAddQ(e.target.value)}
                              placeholder="Cari tarif..." autoFocus
                              className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-700 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 placeholder:text-slate-400" />
                          </div>
                          <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-100 divide-y divide-slate-50">
                            {addableItems.slice(0, 12).map((t) => {
                              const cfg = KATEGORI_CFG[t.kategori];
                              return (
                                <button key={t.id} onClick={() => addItem(t.id)}
                                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-teal-50 transition">
                                  <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded", cfg.bg)}>
                                    <cfg.icon size={10} className={cfg.text} />
                                  </div>
                                  <span className="flex-1 truncate text-xs text-slate-700">{t.nama}</span>
                                  <span className="shrink-0 text-[10px] font-semibold text-teal-600">{fmtIDRShort(t.tarifUmum)}</span>
                                </button>
                              );
                            })}
                            {addableItems.length === 0 && (
                              <p className="px-3 py-3 text-[10px] text-slate-400 text-center">Semua tarif sudah ditambahkan</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Right: summary card */}
                <div className="overflow-y-auto bg-slate-50/30 p-4">
                  <PaketSummaryCard draft={draft} allTarifs={allTarifs} />
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
        {!isNew ? (
          <button onClick={onDelete}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition">
            <Trash2 size={12} /> Hapus
          </button>
        ) : <div />}
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={!isDirty}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition">
            Batal
          </button>
          <button onClick={onSave} disabled={!isDirty || !valid}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-40 transition">
            <Save size={12} /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
