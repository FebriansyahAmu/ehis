"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Pencil, Check, X, Equal, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LayananRow, type RowKategori,
  ROW_KATEGORI_CFG, ROW_KATEGORI_ORDER, groupRowsByKategori,
} from "../layanan/layananShared";
import { fmtRupiahShort } from "@/lib/master/penjaminMock";
import {
  type TarifMap, type JenisRuanganTier, TIER_GROUP_CFG, getHarga,
} from "./tarifShared";

interface TarifMatrixProps {
  rows: LayananRow[];
  tiers: JenisRuanganTier[];
  map: TarifMap;
  penjaminKode: string;
  visibleKategori: Set<RowKategori>;
  /** value > 0 → upsert; value <= 0 → hapus tarif. rowId = tindakanId atau labTestId. */
  onEdit: (rowId: string, tierKey: string, value: number) => void;
  /** Samakan 1 harga ke SEMUA tier (kolom) untuk baris ini — tarif seragam lintas ruangan. */
  onFlatRate: (rowId: string, harga: number) => void;
}

export default function TarifMatrix({
  rows, tiers, map, penjaminKode, visibleKategori, onEdit, onFlatRate,
}: TarifMatrixProps) {
  const grouped = groupRowsByKategori(rows);
  const colCount = tiers.length + 1;
  // Grup yang DILIPAT (collapse). Default kosong → semua grup terbuka (collapse=false).
  const [collapsed, setCollapsed] = useState<Set<RowKategori>>(new Set());
  const toggleCollapse = (cat: RowKategori) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  if (tiers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <p className="m-xs text-slate-400">
          Belum ada tier ruangan. Konfigurasi Ruangan (kelas) di master Unit &amp; Ruangan dulu.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 min-w-65 border-b border-r border-slate-200 bg-white px-3 py-2 text-left">
                <span className="m-mini font-semibold uppercase tracking-wide text-slate-500">
                  Tindakan / Lab / Rad
                </span>
              </th>
              {tiers.map((t) => {
                const g = TIER_GROUP_CFG[t.group];
                return (
                  <th
                    key={t.key}
                    className={cn("min-w-24 border-b border-r border-slate-200 px-2 py-2 text-center", g.bg)}
                    title={t.label}
                  >
                    <p className={cn("m-mini font-bold uppercase tracking-wide", g.text)}>{t.short}</p>
                    <p className={cn("m-mini opacity-70", g.text)}>{t.label}</p>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {ROW_KATEGORI_ORDER.map((cat) => {
              const items = grouped.get(cat) ?? [];
              if (items.length === 0 || !visibleKategori.has(cat)) return null;
              return (
                <KategoriBlock
                  key={cat}
                  items={items}
                  catCfg={ROW_KATEGORI_CFG[cat]}
                  colCount={colCount}
                  tiers={tiers}
                  map={map}
                  penjaminKode={penjaminKode}
                  collapsed={collapsed.has(cat)}
                  onToggleCollapse={() => toggleCollapse(cat)}
                  onEdit={onEdit}
                  onFlatRate={onFlatRate}
                />
              );
            })}
            {visibleKategori.size === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-10 text-center m-xs text-slate-400">
                  Pilih minimal 1 kategori di toolbar untuk melihat matrix
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-4 py-2">
        <p className="m-mini text-slate-500">
          <span className="font-semibold uppercase tracking-wide">Tip:</span>{" "}
          Klik sel untuk edit harga inline. Kosongkan (0) untuk menghapus tarif. Kolom = jenis ruangan / kelas. Klik chevron grup untuk lipat.
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function KategoriBlock({
  items, catCfg, colCount, tiers, map, penjaminKode, collapsed, onToggleCollapse, onEdit, onFlatRate,
}: {
  items: LayananRow[];
  catCfg: typeof ROW_KATEGORI_CFG[RowKategori];
  colCount: number;
  tiers: JenisRuanganTier[];
  map: TarifMap;
  penjaminKode: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onEdit: (rowId: string, tierKey: string, value: number) => void;
  onFlatRate: (rowId: string, harga: number) => void;
}) {
  return (
    <>
      <tr>
        <td colSpan={colCount} className={cn("sticky left-0 border-b border-slate-200 px-2 py-1.5", catCfg.bg)}>
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? `Buka grup ${catCfg.label}` : `Lipat grup ${catCfg.label}`}
            aria-label={collapsed ? `Buka grup ${catCfg.label}` : `Lipat grup ${catCfg.label}`}
            aria-expanded={!collapsed}
            className="flex w-full items-center gap-1 text-left"
          >
            <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded transition hover:bg-black/5", catCfg.text)}>
              {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
            </span>
            <span className={cn("h-2 w-2 rounded-full", catCfg.dot)} />
            <span className={cn("m-mini font-bold uppercase tracking-wide", catCfg.text)}>{catCfg.label}</span>
            <span className={cn("m-mini opacity-70", catCfg.text)}>· {items.length} item</span>
          </button>
        </td>
      </tr>
      {!collapsed && items.map((r, i) => (
        <RowItem
          key={r.id}
          row={r}
          tiers={tiers}
          map={map}
          penjaminKode={penjaminKode}
          rowIndex={i}
          onEdit={onEdit}
          onFlatRate={onFlatRate}
        />
      ))}
    </>
  );
}

function RowItem({
  row, tiers, map, penjaminKode, rowIndex, onEdit, onFlatRate,
}: {
  row: LayananRow;
  tiers: JenisRuanganTier[];
  map: TarifMap;
  penjaminKode: string;
  rowIndex: number;
  onEdit: (rowId: string, tierKey: string, value: number) => void;
  onFlatRate: (rowId: string, harga: number) => void;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: Math.min(rowIndex * 0.01, 0.2) }}
      className="group hover:bg-slate-50/60"
    >
      <td className="sticky left-0 z-10 min-w-65 border-b border-r border-slate-200 bg-white px-3 py-1.5 group-hover:bg-slate-50/60">
        <div className="flex w-full items-start gap-2">
          <div className="min-w-0 flex-1">
            <span className="truncate m-xs font-semibold text-slate-800">{row.nama}</span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="font-mono m-mini text-slate-400">{row.subLabel || "—"}</span>
              {row.chip && (
                <span className={cn("rounded px-1 py-0 m-mini font-bold", row.chip.bg, row.chip.text)}>{row.chip.label}</span>
              )}
            </div>
          </div>
          <FlatRateButton tierCount={tiers.length} onApply={(harga) => onFlatRate(row.id, harga)} />
        </div>
      </td>
      {tiers.map((t) => {
        const value = getHarga(map, penjaminKode, row.id, t.key);
        return (
          <td key={t.key} className="border-b border-r border-slate-200 p-1 text-center">
            <TarifCell value={value} onSave={(v) => onEdit(row.id, t.key, v)} />
          </td>
        );
      })}
    </motion.tr>
  );
}

// Tombol "samakan tarif semua kolom" per tindakan — input 1 harga → terapkan ke semua tier.
// Popover di-PORTAL ke body (posisi fixed) → lepas dari stacking/overflow tabel (tak ketimpa
// group/baris berikutnya & tak terklip scroll). Tutup saat klik-luar/Escape/scroll/resize.
const POP_W = 224;

function FlatRateButton({ tierCount, onApply }: { tierCount: number; onApply: (harga: number) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - POP_W - 8);
    setCoords({ top: r.bottom + 4, left });
  };

  const openPop = () => { setDraft(""); place(); setOpen(true); };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onMove = () => setOpen(false); // scroll/resize → tutup (hindari popover ngambang)
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  const apply = () => {
    const n = Number(draft.replace(/[^\d]/g, ""));
    if (n > 0) onApply(n);
    setOpen(false);
    setDraft("");
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPop())}
        title="Samakan tarif untuk semua ruangan/kelas"
        aria-label="Samakan tarif semua kolom"
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition",
          open
            ? "border-amber-300 bg-amber-50 text-amber-700"
            : "border-transparent text-slate-300 opacity-0 hover:bg-amber-50 hover:text-amber-600 group-hover:opacity-100",
        )}
      >
        <Equal size={12} />
      </button>

      {open && coords && createPortal(
        <div
          ref={panelRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, width: POP_W }}
          className="z-200 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl"
        >
          <p className="mb-1.5 m-mini font-bold uppercase tracking-wide text-slate-400">
            Samakan ke {tierCount} kolom
          </p>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 focus-within:border-amber-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-100">
            <span className="m-mini font-semibold text-slate-400">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
              placeholder="cth. 150000"
              className="w-full bg-transparent py-1.5 m-xs font-mono text-slate-800 outline-none placeholder:text-slate-300"
            />
          </div>
          <button
            type="button"
            onClick={apply}
            disabled={!draft.replace(/[^\d]/g, "")}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-amber-600 py-1.5 m-mini font-semibold text-white transition hover:bg-amber-700 disabled:opacity-40"
          >
            <Equal size={11} /> Terapkan ke semua kolom
          </button>
          <p className="mt-1.5 m-mini leading-snug text-slate-400">
            Menimpa harga di semua ruangan/kelas pada penjamin aktif.
          </p>
        </div>,
        document.body,
      )}
    </>
  );
}

function TarifCell({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toString());

  const start = () => { setDraft(value ? value.toString() : ""); setEditing(true); };
  const commit = () => {
    const n = Number(draft.replace(/[^\d]/g, ""));
    onSave(Number.isFinite(n) ? n : 0);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-0.5">
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-full rounded border border-amber-300 bg-amber-50 px-1 py-0.5 m-mini font-mono text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
        />
        <button
          type="button"
          onClick={commit}
          className="flex h-5 w-5 items-center justify-center rounded text-emerald-600 hover:bg-emerald-50"
          title="Simpan (Enter)"
        >
          <Check size={11} />
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100"
          title="Batal (Esc)"
        >
          <X size={11} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className={cn(
        "group/cell mx-auto flex w-full items-center justify-center gap-1 rounded px-1.5 py-1 m-mini font-mono font-semibold transition hover:bg-amber-50 hover:text-amber-800",
        value > 0 ? "text-slate-700" : "text-slate-300",
      )}
      title={value ? `Rp ${value.toLocaleString("id-ID")}` : "Belum diisi — klik untuk set"}
    >
      <span>{fmtRupiahShort(value)}</span>
      <Pencil size={9} className="opacity-0 transition group-hover/cell:opacity-60" />
    </button>
  );
}
