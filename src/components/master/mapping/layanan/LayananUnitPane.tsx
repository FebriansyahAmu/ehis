"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity, MapPin, Link2, Search, Loader2, EyeOff, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { type TindakanKategori, type TindakanRecord, KATEGORI_CFG, KATEGORI_ORDER } from "@/lib/master/tindakanMock";
import type { AnyNode } from "@/components/master/ruangan/ruanganShared";
import { getTree } from "@/lib/api/ruangan";
import { listTindakan, type TindakanDTO } from "@/lib/api/master/tindakan";
import {
  type LayananUnitEdgeDTO,
  listAllLayanan, grantLayanan, revokeLayanan,
} from "@/lib/api/master/layananUnit";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import {
  type LayananMap,
  countAllLayanan, unitsFromTree, tindakanRecordsFromDTO,
  mapFromEdges, edgeKey, setPresence,
  readEdgeCache, writeEdgeCache, cacheEdge, uncacheEdge,
} from "./layananShared";
import LayananUnitMatrix from "./LayananUnitMatrix";
import LayananUnitMobileView from "./LayananUnitMobileView";
import LayananUnitTreePanel from "./LayananUnitTreePanel";

interface Props {
  /** Katalog tindakan dari SSR (API /master/tindakan). Absen → client fetch. */
  tindakan?: TindakanDTO[];
  /** Tree Ruangan dari SSR — kolom unit diturunkan dari Location aktif. Absen → client fetch. */
  tree?: AnyNode[];
  /** Edge mapping persist dari SSR (API /master/layanan-unit). Absen → client fetch. */
  layanan?: LayananUnitEdgeDTO[];
}

export default function LayananUnitPane({ tindakan, tree, layanan }: Props) {
  const seeded = useMemo(() => (tindakan ? tindakanRecordsFromDTO(tindakan) : []), [tindakan]);
  const seededUnitKodes = useMemo(() => new Set(unitsFromTree(tree ?? []).map((u) => u.kode)), [tree]);
  // First paint: cache sesi (state terkini, sudah memuat edit sesi ini) bila ada, else snapshot SSR
  // yang beku. Mencegah flicker "muncul lalu hilang" saat remount antar sub-page.
  const seededEdges = useMemo(
    () => mapFromEdges(readEdgeCache() ?? layanan ?? [], seededUnitKodes),
    [layanan, seededUnitKodes],
  );

  const ssrComplete = !!(tree && tindakan && layanan);
  const [nodes, setNodes] = useState<AnyNode[]>(tree ?? []);
  const [allTindakan, setAllTindakan] = useState<TindakanRecord[]>(seeded);
  const [map, setMap] = useState<LayananMap>(seededEdges.map);
  const [loaded, setLoaded] = useState(ssrComplete);
  const [search, setSearch] = useState("");
  const [visibleKategori, setVisibleKategori] = useState<Set<TindakanKategori>>(
    () => new Set(KATEGORI_ORDER),
  );
  // Kolom unit yang DISEMBUNYIKAN dari matriks (default kosong = semua tampak).
  const [hiddenUnits, setHiddenUnits] = useState<Set<string>>(new Set());
  // Banyaknya edge yang sedang disimpan (in-flight) → indikator "menyimpan…".
  const [saving, setSaving] = useState(0);

  // Index edge `${tindakanId}|${ruanganKode}` → id (untuk revoke). Mutable, non-reaktif.
  const edgeIndexRef = useRef<Map<string, string>>(seededEdges.index);
  // Jadi true begitu user mengedit → reconcile-on-mount tak menimpa hasil optimistik in-flight.
  const dirtyRef = useRef(false);

  // Kolom unit = Location (Ruangan) aktif dari master Unit & Ruangan.
  const units = useMemo(() => unitsFromTree(nodes), [nodes]);
  // Peta kode → Location.id (resolve target persist saat toggle).
  const kodeToId = useMemo(() => new Map(units.map((u) => [u.kode, u.id])), [units]);
  // Subset yang benar-benar dirender sebagai kolom matriks (setelah filter tree).
  const visibleUnits = useMemo(() => units.filter((u) => !hiddenUnits.has(u.kode)), [units, hiddenUnits]);

  // Reconcile-on-mount. Seed SSR dipakai utk first paint instan, TAPI setiap kali pane ini mount
  // (termasuk saat balik dari sub-page lain — MappingHubPage remount via AnimatePresence) kita
  // tarik ulang edge TERBARU dari server. Tanpa ini, snapshot SSR yang beku bikin hasil grant/
  // revoke sesi ini "hilang" sampai hard refresh. tree/tindakan jarang berubah → hanya di-fetch
  // bila SSR tak menyediakannya; edge SELALU di-fetch ulang (sumber kebenaran centang).
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const [treeRes, tindakanRes, edgeRes] = await Promise.all([
          tree ? null : getTree(ac.signal),
          tindakan ? null : listTindakan({ limit: 200 }, ac.signal),
          listAllLayanan(ac.signal),
        ]);
        if (ac.signal.aborted) return;
        const newNodes = treeRes ?? tree ?? [];
        if (treeRes) setNodes(treeRes);
        if (tindakanRes) setAllTindakan(tindakanRecordsFromDTO(tindakanRes.items));
        const valid = new Set(unitsFromTree(newNodes).map((u) => u.kode));
        const { map: nextMap, index } = mapFromEdges(edgeRes, valid);
        // Jangan timpa bila user sudah menoggle selama fetch berlangsung (cegah clobber optimistik).
        if (!dirtyRef.current) {
          setMap(nextMap);
          edgeIndexRef.current = index;
          writeEdgeCache(edgeRes); // segarkan cache sesi → remount berikutnya seed dari sini
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

  // ── Persist grant/revoke (optimistik → server → revert yang gagal) ──────────
  type Change = { tindakanId: string; unitKode: string; granted: boolean };

  /** Simpan satu sel (grant/revoke) + sinkron index id-edge. Return sukses/gagal. */
  async function persistCell(c: Change): Promise<boolean> {
    const key = edgeKey(c.tindakanId, c.unitKode);
    const locationId = kodeToId.get(c.unitKode);
    if (!locationId) return false;
    try {
      if (c.granted) {
        if (edgeIndexRef.current.has(key)) return true; // sudah granted
        const edge = await grantLayanan({ tindakanId: c.tindakanId, locationId });
        edgeIndexRef.current.set(key, edge.id);
        cacheEdge(edge); // cache sesi ikut update → seed remount konsisten (tanpa flicker)
      } else {
        const id = edgeIndexRef.current.get(key);
        if (!id) return true; // sudah tak ada
        await revokeLayanan(id);
        edgeIndexRef.current.delete(key);
        uncacheEdge(c.tindakanId, c.unitKode);
      }
      return true;
    } catch {
      return false;
    }
  }

  /** Terapkan sekumpulan perubahan: optimistik → persist paralel → revert yang gagal. */
  async function applyChanges(changes: Change[]) {
    if (changes.length === 0) return;
    dirtyRef.current = true; // tandai sesi dirty → reconcile-on-mount tak menimpa edit ini
    setMap((prev) => {
      const next = { ...prev };
      for (const c of changes) next[c.tindakanId] = setPresence(next[c.tindakanId] ?? [], c.unitKode, c.granted);
      return next;
    });
    setSaving((n) => n + changes.length);
    const results = await Promise.allSettled(changes.map(persistCell));
    setSaving((n) => Math.max(0, n - changes.length));
    const failed = changes.filter((_, i) => {
      const r = results[i];
      return r.status === "rejected" || !r.value;
    });
    if (failed.length === 0) return;
    setMap((prev) => {
      const next = { ...prev };
      for (const c of failed) next[c.tindakanId] = setPresence(next[c.tindakanId] ?? [], c.unitKode, !c.granted);
      return next;
    });
    toast.error(
      failed.length === 1 ? "Gagal menyimpan perubahan" : `${failed.length} perubahan gagal disimpan`,
    );
  }

  const handleToggle = (tindakanId: string, unitKode: string) => {
    const granted = !(map[tindakanId] ?? []).includes(unitKode);
    void applyChanges([{ tindakanId, unitKode, granted }]);
  };

  const handleToggleRow = (tindakanId: string, granted: boolean) => {
    const current = map[tindakanId] ?? [];
    // Hanya kolom yang TAMPAK; unit tersembunyi tak diutak-atik.
    const changes = visibleUnits
      .filter((u) => current.includes(u.kode) !== granted)
      .map((u) => ({ tindakanId, unitKode: u.kode, granted }));
    void applyChanges(changes);
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
    const changes: Change[] = [];
    for (const t of filteredTindakan) {
      if (!visibleKategori.has(t.kategori)) continue;
      const has = (map[t.id] ?? []).includes(unitKode);
      if (has !== granted) changes.push({ tindakanId: t.id, unitKode, granted });
    }
    void applyChanges(changes);
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
              <div
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 m-mini font-semibold"
                aria-live="polite"
              >
                {saving > 0 ? (
                  <>
                    <Loader2 size={11} className="animate-spin text-teal-500" />
                    <span className="text-teal-600">Menyimpan…</span>
                  </>
                ) : (
                  <>
                    <Check size={11} className="text-emerald-500" />
                    <span className="text-slate-500">Tersimpan otomatis</span>
                  </>
                )}
              </div>
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
            ) : (
              <>
                {/* Desktop (lg+): matrix 2D + panel tree show/hide kolom */}
                <div className="hidden min-h-0 flex-1 lg:flex lg:flex-col">
                  {visibleUnits.length === 0 ? (
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
                </div>

                {/* Mobile / Tablet (< lg): drill-down per unit (pilih ruangan → toggle daftar) */}
                <div className="flex min-h-0 flex-1 flex-col lg:hidden">
                  <LayananUnitMobileView
                    units={units}
                    tindakan={filteredTindakan}
                    map={map}
                    visibleKategori={visibleKategori}
                    onToggle={handleToggle}
                    onToggleColumn={handleToggleColumn}
                  />
                </div>
              </>
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
