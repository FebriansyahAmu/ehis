"use client";

// Tampilan Layanan Unit untuk layar kecil (mobile/tablet, < lg). Matrix 2D tak nyaman disentuh →
// pakai drill-down per-unit (selaras pola SDM Assignment: pilih ruangan → toggle daftar). Alur:
// pilih Ruangan via chip scroll-x → daftar baris (grup kategori, termasuk grup Lab) dgn target
// sentuh lebar; tap = grant/revoke. State & persist tetap di pane induk (presentational + callback).

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Check, Minus, MapPin, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LayananMap, type LayananUnit, type LayananRow, type RowKategori,
  ROW_KATEGORI_CFG, ROW_KATEGORI_ORDER, groupRowsByKategori,
  hasLayanan, countRowsPerUnit, UNIT_CATEGORY_CFG,
} from "./layananShared";

interface Props {
  units: LayananUnit[];
  /** Baris sudah ter-filter pencarian di pane. */
  rows: LayananRow[];
  map: LayananMap;
  visibleKategori: Set<RowKategori>;
  onToggle: (rowId: string, unitKode: string) => void;
  onToggleColumn: (unitKode: string, granted: boolean) => void;
  /** Pilih semua per grup utk unit terpilih (rowIds grup × unit ini). */
  onToggleGroup: (rowIds: string[], unitKode: string, granted: boolean) => void;
}

export default function LayananUnitMobileView({
  units, rows, map, visibleKategori, onToggle, onToggleColumn, onToggleGroup,
}: Props) {
  // Pilihan user (null = belum pilih). Unit aktif efektif DI-DERIVE saat render (bukan effect) →
  // pilihan dipakai bila masih valid, else jatuh ke unit pertama. Hindari setState-in-effect.
  const [selectedKode, setSelectedKode] = useState<string | null>(null);
  const selectedUnit = useMemo(() => {
    if (selectedKode) {
      const found = units.find((u) => u.kode === selectedKode);
      if (found) return found;
    }
    return units[0] ?? null;
  }, [units, selectedKode]);

  // Baris yang tampak = lolos filter kategori (pencarian sudah diterapkan di pane).
  const visible = useMemo(
    () => rows.filter((r) => visibleKategori.has(r.kategori)),
    [rows, visibleKategori],
  );
  const grouped = useMemo(() => groupRowsByKategori(visible), [visible]);

  const grantedCount = selectedUnit
    ? visible.filter((r) => hasLayanan(map, r.id, selectedUnit.kode)).length
    : 0;
  const allGranted = visible.length > 0 && grantedCount === visible.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Unit picker — chip scroll-x */}
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/60 px-2.5 py-2">
        <p className="mb-1.5 px-0.5 m-mini font-semibold uppercase tracking-wide text-slate-400">
          Pilih Unit / Ruangan
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {units.map((u) => {
            const cfg = UNIT_CATEGORY_CFG[u.category];
            const count = countRowsPerUnit(map, u.kode);
            const active = u.kode === selectedUnit?.kode;
            return (
              <button
                key={u.kode}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedKode(u.kode)}
                className={cn(
                  "flex shrink-0 snap-start items-center gap-1.5 rounded-xl border px-2.5 py-1.5 transition",
                  active
                    ? "border-teal-500 bg-teal-50 ring-2 ring-teal-200"
                    : cn("bg-white hover:bg-slate-50", cfg.border),
                )}
              >
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.dot)} />
                <span className={cn("m-xs font-bold", active ? "text-teal-800" : "text-slate-700")}>
                  {u.short}
                </span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 font-mono m-mini font-bold",
                    count > 0 ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-400",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedUnit ? (
        <>
          {/* Header unit aktif + bulk Semua/Kosong */}
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3 py-2">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                UNIT_CATEGORY_CFG[selectedUnit.category].bg,
                UNIT_CATEGORY_CFG[selectedUnit.category].text,
              )}
            >
              <Building2 size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate m-xs font-bold text-slate-800">{selectedUnit.nama}</p>
              <p className="m-mini text-slate-400">
                {grantedCount}/{visible.length} layanan boleh dilakukan di sini
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                disabled={visible.length === 0 || allGranted}
                onClick={() => onToggleColumn(selectedUnit.kode, true)}
                className="rounded-lg border border-teal-200 bg-white px-2.5 py-1.5 m-mini font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-40"
              >
                Semua
              </button>
              <button
                type="button"
                disabled={grantedCount === 0}
                onClick={() => onToggleColumn(selectedUnit.kode, false)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 m-mini font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Kosong
              </button>
            </div>
          </div>

          {/* Daftar baris (grup kategori) */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {visible.length === 0 ? (
              <p className="px-4 py-10 text-center m-xs text-slate-400">
                Tidak ada baris — sesuaikan pencarian / filter kategori di atas.
              </p>
            ) : (
              ROW_KATEGORI_ORDER.map((cat) => {
                const items = grouped.get(cat) ?? [];
                if (items.length === 0 || !visibleKategori.has(cat)) return null;
                const cfg = ROW_KATEGORI_CFG[cat];
                const isLab = cat === "Laboratorium";
                // State "Pilih Semua" grup utk unit terpilih.
                const grantedInGroup = items.filter((r) => hasLayanan(map, r.id, selectedUnit.kode)).length;
                const groupState: "none" | "partial" | "all" =
                  grantedInGroup === 0 ? "none" : grantedInGroup === items.length ? "all" : "partial";
                return (
                  <div key={cat}>
                    <div
                      className={cn(
                        "sticky top-0 z-10 flex items-center gap-1.5 px-3 py-1.5",
                        cfg.bg,
                      )}
                    >
                      {isLab ? (
                        <FlaskConical size={11} className={cfg.text} />
                      ) : (
                        <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                      )}
                      <span className={cn("m-mini font-bold uppercase tracking-wide", cfg.text)}>
                        {cfg.label}
                      </span>
                      <span className={cn("m-mini opacity-70", cfg.text)}>· {items.length}</span>
                      <button
                        type="button"
                        onClick={() => onToggleGroup(items.map((r) => r.id), selectedUnit.kode, groupState !== "all")}
                        title={`${groupState === "all" ? "Kosongkan" : "Pilih"} semua ${cfg.label} di ${selectedUnit.nama}`}
                        aria-label={`${groupState === "all" ? "Kosongkan" : "Pilih"} semua ${cfg.label} di ${selectedUnit.nama}`}
                        className="ml-auto flex items-center gap-1 rounded-md border border-white/60 bg-white/70 px-1.5 py-0.5 m-mini font-semibold text-slate-600 transition hover:bg-white"
                      >
                        <span
                          className={cn(
                            "flex h-3.5 w-3.5 items-center justify-center rounded border-2 transition",
                            groupState === "none"
                              ? "border-slate-300 bg-white"
                              : "border-teal-600 bg-teal-600 text-white",
                          )}
                        >
                          {groupState === "all" && <Check size={9} strokeWidth={3} />}
                          {groupState === "partial" && <Minus size={9} strokeWidth={3} />}
                        </span>
                        Semua
                      </button>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {items.map((row) => {
                        const granted = hasLayanan(map, row.id, selectedUnit.kode);
                        return (
                          <li key={row.id}>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.995 }}
                              aria-pressed={granted}
                              aria-label={`${row.nama} di ${selectedUnit.nama}: ${granted ? "boleh" : "tidak boleh"}`}
                              onClick={() => onToggle(row.id, selectedUnit.kode)}
                              className={cn(
                                "flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left transition",
                                granted ? "bg-teal-50/40 hover:bg-teal-50/70" : "hover:bg-slate-50",
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <span className="flex items-center gap-1 truncate m-xs font-semibold text-slate-800">
                                  {row.kind === "lab" && <FlaskConical size={11} className="shrink-0 text-cyan-600" />}
                                  {row.nama}
                                </span>
                                <span className="mt-0.5 flex items-center gap-1.5">
                                  <span className="font-mono m-mini text-slate-400">{row.subLabel}</span>
                                  {row.chip && (
                                    <span className={cn("rounded px-1 py-0 m-mini font-bold", row.chip.bg, row.chip.text)}>
                                      {row.chip.label}
                                    </span>
                                  )}
                                </span>
                              </div>
                              <span
                                className={cn(
                                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 transition",
                                  granted
                                    ? "border-teal-600 bg-teal-600 text-white"
                                    : "border-slate-200 bg-white",
                                )}
                              >
                                {granted && <Check size={13} strokeWidth={3} />}
                              </span>
                            </motion.button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-6 text-center text-slate-400">
          <MapPin size={20} className="text-slate-300" />
          <p className="m-xs font-semibold text-slate-500">Pilih unit di atas</p>
          <p className="m-mini">untuk mulai memetakan layanan.</p>
        </div>
      )}
    </div>
  );
}
