"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity, MapPin, Link2, Search, Loader2, EyeOff, Check, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnyNode } from "@/components/master/ruangan/ruanganShared";
import { getTree } from "@/lib/api/ruangan";
import { listTindakan, type TindakanDTO } from "@/lib/api/master/tindakan";
import { listLabTest, type LabTestDTO } from "@/lib/api/master/labTest";
import {
  type LayananUnitEdgeDTO,
  listAllLayanan, grantLayanan, revokeLayanan,
} from "@/lib/api/master/layananUnit";
import {
  type LayananUnitLabEdgeDTO,
  listAllLayananLab, grantLayananLab, revokeLayananLab,
} from "@/lib/api/master/layananUnitLab";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import {
  type LayananMap, type LayananRow, type RowKategori, type LayananEdge,
  countAllLayanan, unitsFromTree, tindakanRecordsFromDTO,
  rowsFromTindakan, rowsFromLab, mapFromEdges, edgeKey, setPresence,
  tindakanToEdge, labToEdge,
  ROW_KATEGORI_ORDER, ROW_KATEGORI_CFG,
  readEdgeCache, writeEdgeCache, cacheEdge, uncacheEdge,
} from "./layananShared";
import LayananUnitMatrix from "./LayananUnitMatrix";
import LayananUnitMobileView from "./LayananUnitMobileView";
import LayananUnitTreePanel from "./LayananUnitTreePanel";

interface Props {
  /** Katalog tindakan dari SSR (API /master/tindakan). Absen → client fetch. */
  tindakan?: TindakanDTO[];
  /** Katalog laboratorium dari SSR (API /master/lab-test). Absen → client fetch. */
  lab?: LabTestDTO[];
  /** Tree Ruangan dari SSR — kolom unit diturunkan dari Location aktif. Absen → client fetch. */
  tree?: AnyNode[];
  /** Edge mapping Tindakan persist dari SSR (API /master/layanan-unit). Absen → client fetch. */
  layanan?: LayananUnitEdgeDTO[];
  /** Edge mapping Lab persist dari SSR (API /master/layanan-unit-lab). Absen → client fetch. */
  layananLab?: LayananUnitLabEdgeDTO[];
}

export default function LayananUnitPane({ tindakan, lab, tree, layanan, layananLab }: Props) {
  const seededTindakan = useMemo(() => (tindakan ? tindakanRecordsFromDTO(tindakan) : []), [tindakan]);
  const seededUnitKodes = useMemo(() => new Set(unitsFromTree(tree ?? []).map((u) => u.kode)), [tree]);
  // First paint: cache sesi (state terkini, sudah memuat edit sesi ini) bila ada, else snapshot SSR
  // (Tindakan + Lab digabung) yang beku. Mencegah flicker "muncul lalu hilang" saat remount.
  const seededEdges = useMemo(() => {
    const fromSSR: LayananEdge[] = [
      ...(layanan ?? []).map(tindakanToEdge),
      ...(layananLab ?? []).map(labToEdge),
    ];
    return mapFromEdges(readEdgeCache() ?? fromSSR, seededUnitKodes);
  }, [layanan, layananLab, seededUnitKodes]);

  const ssrComplete = !!(tree && tindakan && lab && layanan && layananLab);
  const [nodes, setNodes] = useState<AnyNode[]>(tree ?? []);
  const [allTindakan, setAllTindakan] = useState(seededTindakan);
  const [allLab, setAllLab] = useState<LabTestDTO[]>(lab ?? []);
  const [map, setMap] = useState<LayananMap>(seededEdges.map);
  const [loaded, setLoaded] = useState(ssrComplete);
  const [search, setSearch] = useState("");
  const [visibleKategori, setVisibleKategori] = useState<Set<RowKategori>>(
    () => new Set(ROW_KATEGORI_ORDER),
  );
  // Kolom unit yang DISEMBUNYIKAN dari matriks (default kosong = semua tampak).
  const [hiddenUnits, setHiddenUnits] = useState<Set<string>>(new Set());
  // Banyaknya edge yang sedang disimpan (in-flight) → indikator "menyimpan…".
  const [saving, setSaving] = useState(0);

  // Index edge `${rowId}|${ruanganKode}` → id (untuk revoke). Mutable, non-reaktif.
  const edgeIndexRef = useRef<Map<string, string>>(seededEdges.index);
  // Jadi true begitu user mengedit → reconcile-on-mount tak menimpa hasil optimistik in-flight.
  const dirtyRef = useRef(false);

  // Baris matriks = Tindakan (per kategori) + Lab (grup "Tindakan Laboratorium").
  const allRows = useMemo<LayananRow[]>(
    () => [...rowsFromTindakan(allTindakan), ...rowsFromLab(allLab)],
    [allTindakan, allLab],
  );
  // rowId → jenis (tindakan|lab) → menentukan endpoint persist saat toggle.
  const kindById = useMemo(() => new Map(allRows.map((r) => [r.id, r.kind])), [allRows]);

  // Kolom unit = Location (Ruangan) aktif dari master Unit & Ruangan.
  const units = useMemo(() => unitsFromTree(nodes), [nodes]);
  // Peta kode → Location.id (resolve target persist saat toggle).
  const kodeToId = useMemo(() => new Map(units.map((u) => [u.kode, u.id])), [units]);
  // Subset yang benar-benar dirender sebagai kolom matriks (setelah filter tree).
  const visibleUnits = useMemo(() => units.filter((u) => !hiddenUnits.has(u.kode)), [units, hiddenUnits]);

  // Reconcile-on-mount. Seed SSR dipakai utk first paint instan, TAPI setiap kali pane ini mount
  // (termasuk saat balik dari sub-page lain — MappingHubPage remount via AnimatePresence) kita
  // tarik ulang edge TERBARU dari server. Tanpa ini, snapshot SSR yang beku bikin hasil grant/
  // revoke sesi ini "hilang" sampai hard refresh. tree/tindakan/lab jarang berubah → hanya di-fetch
  // bila SSR tak menyediakannya; edge SELALU di-fetch ulang (sumber kebenaran centang).
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const [treeRes, tindakanRes, labRes, edgeRes, labEdgeRes] = await Promise.all([
          tree ? null : getTree(ac.signal),
          tindakan ? null : listTindakan({ limit: 200 }, ac.signal),
          lab ? null : listLabTest({ status: "Aktif", limit: 200 }, ac.signal),
          listAllLayanan(ac.signal),
          listAllLayananLab(ac.signal),
        ]);
        if (ac.signal.aborted) return;
        const newNodes = treeRes ?? tree ?? [];
        if (treeRes) setNodes(treeRes);
        if (tindakanRes) setAllTindakan(tindakanRecordsFromDTO(tindakanRes.items));
        if (labRes) setAllLab(labRes.items);
        const valid = new Set(unitsFromTree(newNodes).map((u) => u.kode));
        const edges: LayananEdge[] = [...edgeRes.map(tindakanToEdge), ...labEdgeRes.map(labToEdge)];
        const { map: nextMap, index } = mapFromEdges(edges, valid);
        // Jangan timpa bila user sudah menoggle selama fetch berlangsung (cegah clobber optimistik).
        if (!dirtyRef.current) {
          setMap(nextMap);
          edgeIndexRef.current = index;
          writeEdgeCache(edges); // segarkan cache sesi → remount berikutnya seed dari sini
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

  const filteredRows = useMemo(() => {
    if (!search.trim()) return allRows;
    const q = search.toLowerCase();
    return allRows.filter((r) => r.searchText.includes(q));
  }, [allRows, search]);

  const stats = useMemo(() => {
    const totalCells = allRows.length * units.length;
    const granted = countAllLayanan(map);
    const pct = totalCells ? Math.round((granted / totalCells) * 100) : 0;
    return { totalCells, granted, pct };
  }, [allRows, units, map]);

  const labCount = useMemo(() => allRows.filter((r) => r.kind === "lab").length, [allRows]);

  // ── Persist grant/revoke (optimistik → server → revert yang gagal) ──────────
  type Change = { rowId: string; unitKode: string; granted: boolean };

  /** Simpan satu sel (grant/revoke) + sinkron index id-edge. Route endpoint per jenis baris. */
  async function persistCell(c: Change): Promise<boolean> {
    const key = edgeKey(c.rowId, c.unitKode);
    const locationId = kodeToId.get(c.unitKode);
    if (!locationId) return false;
    const kind = kindById.get(c.rowId) ?? "tindakan";
    try {
      if (c.granted) {
        if (edgeIndexRef.current.has(key)) return true; // sudah granted
        const edge: LayananEdge = kind === "lab"
          ? labToEdge(await grantLayananLab({ labTestId: c.rowId, locationId }))
          : tindakanToEdge(await grantLayanan({ tindakanId: c.rowId, locationId }));
        edgeIndexRef.current.set(key, edge.id);
        cacheEdge(edge); // cache sesi ikut update → seed remount konsisten (tanpa flicker)
      } else {
        const id = edgeIndexRef.current.get(key);
        if (!id) return true; // sudah tak ada
        if (kind === "lab") await revokeLayananLab(id);
        else await revokeLayanan(id);
        edgeIndexRef.current.delete(key);
        uncacheEdge(c.rowId, c.unitKode);
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
      for (const c of changes) next[c.rowId] = setPresence(next[c.rowId] ?? [], c.unitKode, c.granted);
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
      for (const c of failed) next[c.rowId] = setPresence(next[c.rowId] ?? [], c.unitKode, !c.granted);
      return next;
    });
    toast.error(
      failed.length === 1 ? "Gagal menyimpan perubahan" : `${failed.length} perubahan gagal disimpan`,
    );
  }

  const handleToggle = (rowId: string, unitKode: string) => {
    const granted = !(map[rowId] ?? []).includes(unitKode);
    void applyChanges([{ rowId, unitKode, granted }]);
  };

  const handleToggleRow = (rowId: string, granted: boolean) => {
    const current = map[rowId] ?? [];
    // Hanya kolom yang TAMPAK; unit tersembunyi tak diutak-atik.
    const changes = visibleUnits
      .filter((u) => current.includes(u.kode) !== granted)
      .map((u) => ({ rowId, unitKode: u.kode, granted }));
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
    for (const r of filteredRows) {
      if (!visibleKategori.has(r.kategori)) continue;
      const has = (map[r.id] ?? []).includes(unitKode);
      if (has !== granted) changes.push({ rowId: r.id, unitKode, granted });
    }
    void applyChanges(changes);
  };

  // Pilih semua per GRUP (desktop): semua baris grup × semua kolom unit TAMPAK.
  const handleToggleGroup = (rowIds: string[], granted: boolean) => {
    const changes: Change[] = [];
    for (const rowId of rowIds) {
      const current = map[rowId] ?? [];
      for (const u of visibleUnits) {
        if (current.includes(u.kode) !== granted) changes.push({ rowId, unitKode: u.kode, granted });
      }
    }
    void applyChanges(changes);
  };

  // Pilih semua per GRUP untuk SATU unit (mobile drill-down): semua baris grup × unit terpilih.
  const handleToggleGroupUnit = (rowIds: string[], unitKode: string, granted: boolean) => {
    const changes: Change[] = [];
    for (const rowId of rowIds) {
      if ((map[rowId] ?? []).includes(unitKode) !== granted) changes.push({ rowId, unitKode, granted });
    }
    void applyChanges(changes);
  };

  const toggleKategoriVisibility = (cat: RowKategori) => {
    setVisibleKategori((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <PaneHeader stats={stats} totalRows={allRows.length} totalUnit={units.length} labCount={labCount} />

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
                  placeholder="Cari tindakan / tes lab / kode..."
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
              {ROW_KATEGORI_ORDER.map((cat) => {
                const cfg = ROW_KATEGORI_CFG[cat];
                const active = visibleKategori.has(cat);
                const isLab = cat === "Laboratorium";
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleKategoriVisibility(cat)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 m-mini font-semibold transition",
                      active
                        ? cn("border-transparent", cfg.bg, cfg.text)
                        : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50",
                    )}
                  >
                    {isLab && <FlaskConical size={9} />}
                    {cfg.short}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setVisibleKategori(new Set(ROW_KATEGORI_ORDER))}
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
                <span className="m-xs">Memuat tindakan, tes lab & unit…</span>
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
                      rows={filteredRows}
                      units={visibleUnits}
                      map={map}
                      visibleKategori={visibleKategori}
                      onToggle={handleToggle}
                      onToggleRow={handleToggleRow}
                      onToggleColumn={handleToggleColumn}
                      onToggleGroup={handleToggleGroup}
                    />
                  )}
                </div>

                {/* Mobile / Tablet (< lg): drill-down per unit (pilih ruangan → toggle daftar) */}
                <div className="flex min-h-0 flex-1 flex-col lg:hidden">
                  <LayananUnitMobileView
                    units={units}
                    rows={filteredRows}
                    map={map}
                    visibleKategori={visibleKategori}
                    onToggle={handleToggle}
                    onToggleColumn={handleToggleColumn}
                    onToggleGroup={handleToggleGroupUnit}
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
  stats, totalRows, totalUnit, labCount,
}: {
  stats: { granted: number; totalCells: number; pct: number };
  totalRows: number;
  totalUnit: number;
  labCount: number;
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
            Atur tindakan &amp; tes laboratorium apa boleh dilakukan di unit mana. Baris diambil dari
            Katalog Tindakan + Katalog Laboratorium; kolom dari Ruangan (Location) aktif. Klik judul
            kolom = toggle semua baris; klik judul baris = toggle semua unit.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Stat icon={Activity}     label="Baris"   value={`${totalRows}`}                      cls="bg-teal-50 text-teal-600" />
          <Stat icon={FlaskConical} label="Tes Lab" value={`${labCount}`}                       cls="bg-cyan-50 text-cyan-600" />
          <Stat icon={MapPin}       label="Unit"    value={`${totalUnit}`}                      cls="bg-sky-50 text-sky-600" />
          <Stat icon={Link2}        label="Mapping" value={`${stats.granted} (${stats.pct}%)`}  cls="bg-emerald-50 text-emerald-600" />
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
