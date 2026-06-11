"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, MapPin, Link2, Search, RotateCcw, Loader2, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { type TindakanKategori, type TindakanRecord, KATEGORI_CFG, KATEGORI_ORDER } from "@/lib/master/tindakanMock";
import type { AnyNode } from "@/components/master/ruangan/ruanganShared";
import { getTree } from "@/lib/api/ruangan";
import { listTindakan, type TindakanDTO } from "@/lib/api/master/tindakan";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import {
  type LayananMap,
  initLayananMap, countAllLayanan, unitsFromTree, tindakanRecordsFromDTO,
} from "./layananShared";
import LayananUnitMatrix from "./LayananUnitMatrix";
import LayananUnitTreePanel from "./LayananUnitTreePanel";

interface Props {
  /** Katalog tindakan dari SSR (API /master/tindakan). Absen → client fetch. */
  tindakan?: TindakanDTO[];
  /** Tree Ruangan dari SSR — kolom unit diturunkan dari Location aktif. Absen → client fetch. */
  tree?: AnyNode[];
}

export default function LayananUnitPane({ tindakan, tree }: Props) {
  const seeded = useMemo(() => (tindakan ? tindakanRecordsFromDTO(tindakan) : []), [tindakan]);
  const seededUnitKodes = useMemo(() => new Set(unitsFromTree(tree ?? []).map((u) => u.kode)), [tree]);

  const [nodes, setNodes] = useState<AnyNode[]>(tree ?? []);
  const [allTindakan, setAllTindakan] = useState<TindakanRecord[]>(seeded);
  const [map, setMap] = useState<LayananMap>(() => initLayananMap(seeded, seededUnitKodes));
  const [loaded, setLoaded] = useState(!!(tree && tindakan));
  const [search, setSearch] = useState("");
  const [visibleKategori, setVisibleKategori] = useState<Set<TindakanKategori>>(
    () => new Set(KATEGORI_ORDER),
  );
  // Kolom unit yang DISEMBUNYIKAN dari matriks (default kosong = semua tampak).
  const [hiddenUnits, setHiddenUnits] = useState<Set<string>>(new Set());

  // Kolom unit = Location (Ruangan) aktif dari master Unit & Ruangan.
  const units = useMemo(() => unitsFromTree(nodes), [nodes]);
  const unitKodeSet = useMemo(() => new Set(units.map((u) => u.kode)), [units]);
  // Subset yang benar-benar dirender sebagai kolom matriks (setelah filter tree).
  const visibleUnits = useMemo(() => units.filter((u) => !hiddenUnits.has(u.kode)), [units, hiddenUnits]);

  // Fallback fetch bila SSR tak prefetch salah satu sumber (degradasi anggun).
  useEffect(() => {
    if (tree && tindakan) return;
    const ac = new AbortController();
    (async () => {
      try {
        const [treeRes, tindakanRes] = await Promise.all([
          tree ? null : getTree(ac.signal),
          tindakan ? null : listTindakan({ limit: 200 }, ac.signal),
        ]);
        if (ac.signal.aborted) return;
        const newNodes = treeRes ?? tree ?? [];
        const recs = tindakanRes ? tindakanRecordsFromDTO(tindakanRes.items) : seeded;
        if (treeRes) setNodes(treeRes);
        if (tindakanRes) setAllTindakan(recs);
        if (treeRes || tindakanRes) {
          const valid = new Set(unitsFromTree(newNodes).map((u) => u.kode));
          setMap(initLayananMap(recs, valid));
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat Layanan Unit", e instanceof ApiError ? e.message : undefined);
      } finally {
        if (!ac.signal.aborted) setLoaded(true);
      }
    })();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTindakan = useMemo(() => {
    if (!search.trim()) return allTindakan;
    const q = search.toLowerCase();
    return allTindakan.filter((t) =>
      t.nama.toLowerCase().includes(q) || t.kode.toLowerCase().includes(q),
    );
  }, [allTindakan, search]);

  const stats = useMemo(() => {
    const totalCells = allTindakan.length * units.length;
    const granted = countAllLayanan(map);
    const pct = totalCells ? Math.round((granted / totalCells) * 100) : 0;
    return { totalCells, granted, pct };
  }, [allTindakan, units, map]);

  const handleToggle = (tindakanId: string, unitKode: string) => {
    setMap((prev) => {
      const current = prev[tindakanId] ?? [];
      const has = current.includes(unitKode);
      return {
        ...prev,
        [tindakanId]: has ? current.filter((u) => u !== unitKode) : [...current, unitKode],
      };
    });
  };

  const handleToggleRow = (tindakanId: string, granted: boolean) => {
    const visKodes = visibleUnits.map((u) => u.kode);
    setMap((prev) => {
      const current = prev[tindakanId] ?? [];
      if (granted) {
        const set = new Set(current);
        for (const k of visKodes) set.add(k);
        return { ...prev, [tindakanId]: [...set] };
      }
      // Hapus hanya kolom yang tampak; mapping unit tersembunyi dibiarkan.
      const visSet = new Set(visKodes);
      return { ...prev, [tindakanId]: current.filter((k) => !visSet.has(k)) };
    });
  };

  // ── Visibilitas kolom (panel tree) ──────────────────────
  const toggleUnitVisible = (kode: string) =>
    setHiddenUnits((prev) => {
      const next = new Set(prev);
      if (next.has(kode)) next.delete(kode);
      else next.add(kode);
      return next;
    });

  const setUnitsVisible = (kodes: string[], visible: boolean) =>
    setHiddenUnits((prev) => {
      const next = new Set(prev);
      for (const k of kodes) {
        if (visible) next.delete(k);
        else next.add(k);
      }
      return next;
    });

  const showOnlyUnits = (kodes: string[]) => {
    const keep = new Set(kodes);
    setHiddenUnits(new Set(units.filter((u) => !keep.has(u.kode)).map((u) => u.kode)));
  };

  const handleToggleColumn = (unitKode: string, granted: boolean) => {
    setMap((prev) => {
      const next = { ...prev };
      for (const t of filteredTindakan) {
        if (!visibleKategori.has(t.kategori)) continue;
        const current = next[t.id] ?? [];
        const has = current.includes(unitKode);
        if (granted && !has) next[t.id] = [...current, unitKode];
        if (!granted && has) next[t.id] = current.filter((u) => u !== unitKode);
      }
      return next;
    });
  };

  const handleResetDefault = () => {
    if (!confirm("Reset semua mapping ke default berdasarkan katalog?")) return;
    setMap(initLayananMap(allTindakan, unitKodeSet));
  };

  const toggleKategoriVisibility = (cat: TindakanKategori) => {
    setVisibleKategori((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <PaneHeader stats={stats} totalTindakan={allTindakan.length} totalUnit={units.length} />

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        {loaded && units.length > 0 && (
          <LayananUnitTreePanel
            nodes={nodes}
            units={units}
            map={map}
            hiddenUnits={hiddenUnits}
            onToggleUnit={toggleUnitVisible}
            onSetUnits={setUnitsVisible}
            onShowOnly={showOnlyUnits}
            onShowAll={() => setHiddenUnits(new Set())}
            onHideAll={() => setHiddenUnits(new Set(units.map((u) => u.kode)))}
          />
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
          >
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari tindakan / kode..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <button
                type="button"
                onClick={handleResetDefault}
                className="flex items-center gap-1 rounded-lg border border-teal-200 bg-white px-2.5 py-1.5 m-mini font-semibold text-teal-700 transition hover:bg-teal-50"
              >
                <RotateCcw size={10} />
                Reset Default
              </button>
            </div>

            {/* Kategori filter chips */}
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <span className="m-mini font-semibold uppercase tracking-wide text-slate-400">
                Kategori:
              </span>
              {KATEGORI_ORDER.map((cat) => {
                const cfg = KATEGORI_CFG[cat];
                const active = visibleKategori.has(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleKategoriVisibility(cat)}
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 m-mini font-semibold transition",
                      active
                        ? cn("border-transparent", cfg.bg, cfg.text)
                        : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50",
                    )}
                  >
                    {cfg.short}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setVisibleKategori(new Set(KATEGORI_ORDER))}
                className="ml-1 rounded-md px-1.5 py-0.5 m-mini font-semibold text-teal-700 hover:bg-teal-50"
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setVisibleKategori(new Set())}
                className="rounded-md px-1.5 py-0.5 m-mini font-semibold text-slate-500 hover:bg-slate-100"
              >
                Kosong
              </button>
            </div>
          </motion.div>

          {/* Matrix */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {!loaded ? (
              <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-slate-400">
                <Loader2 size={16} className="animate-spin text-teal-500" />
                <span className="m-xs">Memuat tindakan & unit…</span>
              </div>
            ) : units.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center text-slate-400">
                <MapPin size={20} className="text-slate-300" />
                <p className="m-xs font-semibold text-slate-500">Belum ada Ruangan aktif</p>
                <p className="m-mini">Tambahkan Ruangan (Location) di master Unit &amp; Ruangan dulu.</p>
              </div>
            ) : visibleUnits.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center text-slate-400">
                <EyeOff size={20} className="text-slate-300" />
                <p className="m-xs font-semibold text-slate-500">Semua kolom unit disembunyikan</p>
                <p className="m-mini">Pilih unit di panel kiri untuk mulai memetakan.</p>
                <button
                  type="button"
                  onClick={() => setHiddenUnits(new Set())}
                  className="mt-1 rounded-lg border border-teal-200 bg-white px-3 py-1.5 m-mini font-semibold text-teal-700 transition hover:bg-teal-50"
                >
                  Tampilkan semua unit
                </button>
              </div>
            ) : (
              <LayananUnitMatrix
                tindakan={filteredTindakan}
                units={visibleUnits}
                map={map}
                visibleKategori={visibleKategori}
                onToggle={handleToggle}
                onToggleRow={handleToggleRow}
                onToggleColumn={handleToggleColumn}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function PaneHeader({
  stats, totalTindakan, totalUnit,
}: {
  stats: { granted: number; totalCells: number; pct: number };
  totalTindakan: number;
  totalUnit: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-base font-bold text-slate-900">Layanan Unit</h2>
          <p className="mt-0.5 m-tiny text-slate-500">
            Atur tindakan apa boleh dilakukan di unit mana. Kolom unit diambil dari Ruangan (Location)
            aktif di master Unit &amp; Ruangan. Klik judul kolom = toggle semua tindakan; klik judul baris = toggle semua unit.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Stat icon={Activity} label="Tindakan" value={`${totalTindakan}`}              cls="bg-teal-50 text-teal-600" />
          <Stat icon={MapPin}   label="Unit"     value={`${totalUnit}`}                  cls="bg-sky-50 text-sky-600" />
          <Stat icon={Link2}    label="Mapping"  value={`${stats.granted} (${stats.pct}%)`} cls="bg-emerald-50 text-emerald-600" />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({
  icon: Icon, label, value, cls,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  cls: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
      <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", cls)}>
        <Icon size={12} />
      </span>
      <div>
        <p className="m-mini font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="m-base font-black leading-none text-slate-900">{value}</p>
      </div>
    </div>
  );
}
