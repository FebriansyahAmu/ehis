"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Pencil, Check, X, Equal, ChevronDown, ChevronRight, Layers, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LayananRow, type RowKategori,
  ROW_KATEGORI_CFG, ROW_KATEGORI_ORDER, groupRowsByKategori,
} from "../layanan/layananShared";
import { fmtRupiahShort } from "@/lib/master/penjaminMock";
import {
  type TarifMap, type TarifCell, type TarifInput, type JenisRuanganTier, TIER_GROUP_CFG, getCell,
} from "./tarifShared";
import { usePopover } from "@/components/shared/inputs/popoverShared";

interface TarifMatrixProps {
  rows: LayananRow[];
  tiers: JenisRuanganTier[];
  map: TarifMap;
  penjaminKode: string;
  visibleKategori: Set<RowKategori>;
  /** input.harga > 0 → upsert; <= 0 → hapus tarif. Input bawa rincian komponen (PMK 85). */
  onEdit: (rowId: string, tierKey: string, input: TarifInput) => void;
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
          Klik sel → set <span className="font-semibold">Total saja</span> atau <span className="font-semibold">Rinci komponen</span> (Sarana + Medis + Paramedis, total = jumlah). Ikon <Layers size={9} className="inline text-amber-500" /> = tarif terinci. Tombol = samakan ke semua kolom · chevron grup untuk lipat.
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
  onEdit: (rowId: string, tierKey: string, input: TarifInput) => void;
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
  onEdit: (rowId: string, tierKey: string, input: TarifInput) => void;
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
        const cell = getCell(map, penjaminKode, row.id, t.key);
        return (
          <td key={t.key} className="border-b border-r border-slate-200 p-1 text-center">
            <TarifCellEditor cell={cell} onSave={(input) => onEdit(row.id, t.key, input)} />
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

// Editor sel tarif — popover (portal) dengan 2 mode: TOTAL saja atau RINCI komponen
// (Jasa Sarana + Medis + Paramedis, PMK 85). Mode rinci → total = auto-sum (read-only).
const onlyDigits = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;

function TarifCellEditor({ cell, onSave }: { cell?: TarifCell; onSave: (input: TarifInput) => void }) {
  const value = cell?.harga ?? 0;
  const hasBreakdown = cell?.jasaSarana != null;
  const { open, setOpen, mounted, coords, width, triggerRef, popRef } = usePopover(232, 320);

  const [mode, setMode] = useState<"total" | "rinci">(hasBreakdown ? "rinci" : "total");
  const [total, setTotal] = useState("");
  const [sarana, setSarana] = useState("");
  const [medis, setMedis] = useState("");
  const [paramedis, setParamedis] = useState("");

  const openEditor = () => {
    setMode(cell?.jasaSarana != null ? "rinci" : "total");
    setTotal(value ? String(value) : "");
    setSarana(cell?.jasaSarana != null ? String(cell.jasaSarana) : "");
    setMedis(cell?.jasaMedis != null ? String(cell.jasaMedis) : "");
    setParamedis(cell?.jasaParamedis != null ? String(cell.jasaParamedis) : "");
    setOpen(true);
  };

  const sumRinci = onlyDigits(sarana) + onlyDigits(medis) + onlyDigits(paramedis);

  const save = () => {
    if (mode === "rinci") {
      onSave({ harga: sumRinci, jasaSarana: onlyDigits(sarana), jasaMedis: onlyDigits(medis), jasaParamedis: onlyDigits(paramedis) });
    } else {
      onSave({ harga: onlyDigits(total), jasaSarana: null, jasaMedis: null, jasaParamedis: null });
    }
    setOpen(false);
  };
  const clear = () => { onSave({ harga: 0, jasaSarana: null, jasaMedis: null, jasaParamedis: null }); setOpen(false); };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openEditor())}
        className={cn(
          "group/cell mx-auto flex w-full items-center justify-center gap-1 rounded px-1.5 py-1 m-mini font-mono font-semibold transition hover:bg-amber-50 hover:text-amber-800",
          value > 0 ? "text-slate-700" : "text-slate-300",
          open && "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
        )}
        title={value ? `Rp ${value.toLocaleString("id-ID")}${hasBreakdown ? " · terinci" : ""}` : "Belum diisi — klik untuk set"}
      >
        <span>{fmtRupiahShort(value)}</span>
        {hasBreakdown
          ? <Layers size={9} className="shrink-0 text-amber-500" />
          : <Pencil size={9} className="opacity-0 transition group-hover/cell:opacity-60" />}
      </button>

      {mounted && open && coords && createPortal(
        <div
          ref={popRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, width }}
          className="z-200 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl"
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setOpen(false); }}
        >
          {/* Mode toggle */}
          <div className="mb-2 flex rounded-lg bg-slate-100 p-0.5">
            {(["total", "rinci"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 m-mini font-semibold transition",
                  mode === m ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
                )}
              >
                {m === "total" ? "Total saja" : "Rinci komponen"}
              </button>
            ))}
          </div>

          {mode === "total" ? (
            <KompInput label="Harga Total" autoFocus value={total} onChange={setTotal} />
          ) : (
            <div className="flex flex-col gap-1.5">
              <KompInput label="Jasa Sarana" hint="alat · BHP · sarana RS" autoFocus value={sarana} onChange={setSarana} />
              <KompInput label="Jasa Medis" hint="porsi dokter (remunerasi)" value={medis} onChange={setMedis} />
              <KompInput label="Jasa Paramedis" hint="porsi perawat (remunerasi)" value={paramedis} onChange={setParamedis} />
              <div className="mt-0.5 flex items-center justify-between rounded-lg bg-amber-50 px-2 py-1.5">
                <span className="m-mini font-semibold uppercase tracking-wide text-amber-700">Total</span>
                <span className="font-mono m-xs font-bold text-amber-800">Rp {sumRinci.toLocaleString("id-ID")}</span>
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={save}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-600 py-1.5 m-mini font-semibold text-white transition hover:bg-amber-700"
            >
              <Check size={11} /> Simpan
            </button>
            {cell && (
              <button
                type="button"
                onClick={clear}
                title="Hapus tarif sel ini"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-500 transition hover:bg-rose-50"
              >
                <Trash2 size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Tutup (Esc)"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50"
            >
              <X size={12} />
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

// Field angka rupiah kecil untuk editor sel (label + input numerik).
function KompInput({
  label, hint, value, onChange, autoFocus,
}: { label: string; hint?: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="flex items-baseline justify-between gap-1">
        <span className="m-mini font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        {hint && <span className="m-mini text-slate-400">{hint}</span>}
      </span>
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 focus-within:border-amber-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-100">
        <span className="m-mini font-semibold text-slate-400">Rp</span>
        <input
          type="text"
          inputMode="numeric"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-full bg-transparent py-1.5 m-xs font-mono text-slate-800 outline-none placeholder:text-slate-300"
        />
      </div>
    </label>
  );
}
