"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Syringe, MapPin, Link2, Search, Loader2, EyeOff, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnyNode } from "@/components/master/ruangan/ruanganShared";
import {
  type BmhpKategori, type BmhpRecord,
  BMHP_KATEGORI_CFG, KATEGORI_BMHP_ORDER,
} from "@/lib/master/bmhpMock";
import { getTree } from "@/lib/api/ruangan";
import { fetchAllBmhp } from "@/lib/api/master/bmhp";
import {
  type FormulariumBmhpEdgeDTO,
  listAllFormulariumBmhp, grantFormulariumBmhp, revokeFormulariumBmhp,
} from "@/lib/api/master/formulariumBmhp";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import {
  type LayananMap,
  countAllLayanan, pharmacyUnitsFromTree, pharmacyTreeNodes, mapFromEdges, edgeKey, setPresence,
  readEdgeCache, writeEdgeCache, cacheEdge, uncacheEdge,
} from "./formulariumBmhpShared";
import FormulariumBmhpMatrix from "./FormulariumBmhpMatrix";
import LayananUnitTreePanel from "../layanan/LayananUnitTreePanel";

interface Props {
  /** Katalog BMHP dari SSR (API /master/bmhp). Absen → client fetch. */
  bmhp?: BmhpRecord[];
  /** Tree Ruangan dari SSR — kolom unit diturunkan dari Location aktif (farmasi). Absen → client fetch. */
  tree?: AnyNode[];
  /** Edge ketersediaan BMHP persist dari SSR (API /master/formularium-bmhp). Absen → client fetch. */
  formularium?: FormulariumBmhpEdgeDTO[];
}

export default function FormulariumBmhpPane({ bmhp, tree, formularium }: Props) {
  const seededUnitKodes = useMemo(() => new Set(pharmacyUnitsFromTree(tree ?? []).map((u) => u.kode)), [tree]);
  // First paint: cache sesi (state terkini) bila ada, else snapshot SSR yang beku. Cegah flicker.
  const seededEdges = useMemo(
    () => mapFromEdges(readEdgeCache() ?? (formularium ?? []), seededUnitKodes),
    [formularium, seededUnitKodes],
  );

  const ssrComplete = !!(tree && bmhp && formularium);
  const [nodes, setNodes] = useState<AnyNode[]>(tree ?? []);
  const [allBmhp, setAllBmhp] = useState<BmhpRecord[]>(bmhp ?? []);
  const [map, setMap] = useState<LayananMap>(seededEdges.map);
  const [loaded, setLoaded] = useState(ssrComplete);
  const [search, setSearch] = useState("");
  const [visibleKategori, setVisibleKategori] = useState<Set<BmhpKategori>>(() => new Set(KATEGORI_BMHP_ORDER));
  const [hiddenUnits, setHiddenUnits] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(0);

  const edgeIndexRef = useRef<Map<string, string>>(seededEdges.index);
  const dirtyRef = useRef(false);

  // Kolom unit = HANYA Location berjenis Farmasi / Gudang Farmasi (lihat formulariumShared).
  const units = useMemo(() => pharmacyUnitsFromTree(nodes), [nodes]);
  const treeNodes = useMemo(() => pharmacyTreeNodes(nodes), [nodes]);
  const kodeToId = useMemo(() => new Map(units.map((u) => [u.kode, u.id])), [units]);
  const visibleUnits = useMemo(() => units.filter((u) => !hiddenUnits.has(u.kode)), [units, hiddenUnits]);

  // Reconcile-on-mount: edge SELALU fetch (sumber kebenaran centang); bmhp/tree bila SSR absen.
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const [treeRes, bmhpRes, edgeRes] = await Promise.all([
          tree ? null : getTree(ac.signal),
          bmhp ? null : fetchAllBmhp(ac.signal),
          listAllFormulariumBmhp(ac.signal),
        ]);
        if (ac.signal.aborted) return;
        const newNodes = treeRes ?? tree ?? [];
        if (treeRes) setNodes(treeRes);
        if (bmhpRes) setAllBmhp(bmhpRes);
        const valid = new Set(pharmacyUnitsFromTree(newNodes).map((u) => u.kode));
        const { map: nextMap, index } = mapFromEdges(edgeRes, valid);
        if (!dirtyRef.current) {
          setMap(nextMap);
          edgeIndexRef.current = index;
          writeEdgeCache(edgeRes);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat Ketersediaan BMHP", e instanceof ApiError ? e.message : undefined);
      } finally {
        if (!ac.signal.aborted) setLoaded(true);
      }
    })();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredBmhp = useMemo(() => {
    if (!search.trim()) return allBmhp;
    const q = search.toLowerCase();
    return allBmhp.filter((b) =>
      b.nama.toLowerCase().includes(q) ||
      (b.merek ?? "").toLowerCase().includes(q) ||
      b.kode.toLowerCase().includes(q),
    );
  }, [allBmhp, search]);

  const stats = useMemo(() => {
    const totalCells = allBmhp.length * units.length;
    const granted = countAllLayanan(map);
    const pct = totalCells ? Math.round((granted / totalCells) * 100) : 0;
    return { totalCells, granted, pct };
  }, [allBmhp, units, map]);

  // ── Persist grant/revoke (optimistik → server → revert yang gagal) ──────────
  type Change = { bmhpId: string; unitKode: string; granted: boolean };

  async function persistCell(c: Change): Promise<boolean> {
    const key = edgeKey(c.bmhpId, c.unitKode);
    const locationId = kodeToId.get(c.unitKode);
    if (!locationId) return false;
    try {
      if (c.granted) {
        if (edgeIndexRef.current.has(key)) return true; // sudah granted
        const edge = await grantFormulariumBmhp({ bmhpId: c.bmhpId, locationId });
        edgeIndexRef.current.set(key, edge.id);
        cacheEdge(edge);
      } else {
        const id = edgeIndexRef.current.get(key);
        if (!id) return true; // sudah tak ada
        await revokeFormulariumBmhp(id);
        edgeIndexRef.current.delete(key);
        uncacheEdge(c.bmhpId, c.unitKode);
      }
      return true;
    } catch {
      return false;
    }
  }

  async function applyChanges(changes: Change[]) {
    if (changes.length === 0) return;
    dirtyRef.current = true;
    setMap((prev) => {
      const next = { ...prev };
      for (const c of changes) next[c.bmhpId] = setPresence(next[c.bmhpId] ?? [], c.unitKode, c.granted);
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
      for (const c of failed) next[c.bmhpId] = setPresence(next[c.bmhpId] ?? [], c.unitKode, !c.granted);
      return next;
    });
    toast.error(
      failed.length === 1 ? "Gagal menyimpan perubahan" : `${failed.length} perubahan gagal disimpan`,
    );
  }

  const handleToggle = (bmhpId: string, unitKode: string) => {
    const granted = !(map[bmhpId] ?? []).includes(unitKode);
    void applyChanges([{ bmhpId, unitKode, granted }]);
  };

  const handleToggleRow = (bmhpId: string, granted: boolean) => {
    const current = map[bmhpId] ?? [];
    const changes = visibleUnits
      .filter((u) => current.includes(u.kode) !== granted)
      .map((u) => ({ bmhpId, unitKode: u.kode, granted }));
    void applyChanges(changes);
  };

  const handleToggleColumn = (unitKode: string, granted: boolean) => {
    const changes: Change[] = [];
    for (const b of filteredBmhp) {
      if (!visibleKategori.has(b.kategori)) continue;
      const has = (map[b.id] ?? []).includes(unitKode);
      if (has !== granted) changes.push({ bmhpId: b.id, unitKode, granted });
    }
    void applyChanges(changes);
  };

  const handleToggleGroup = (bmhpIds: string[], granted: boolean) => {
    const changes: Change[] = [];
    for (const bmhpId of bmhpIds) {
      const current = map[bmhpId] ?? [];
      for (const u of visibleUnits) {
        if (current.includes(u.kode) !== granted) changes.push({ bmhpId, unitKode: u.kode, granted });
      }
    }
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

  const toggleKategoriVisibility = (cat: BmhpKategori) =>
    setVisibleKategori((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <PaneHeader stats={stats} totalBmhp={allBmhp.length} totalUnit={units.length} saving={saving} />

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        {loaded && units.length > 0 && (
          <LayananUnitTreePanel
            nodes={treeNodes}
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
                  placeholder="Cari BMHP / kode / merek..."
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
              <span className="m-mini font-semibold uppercase tracking-wide text-slate-400">Kategori:</span>
              {KATEGORI_BMHP_ORDER.map((cat) => {
                const cfg = BMHP_KATEGORI_CFG[cat];
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
                onClick={() => setVisibleKategori(new Set(KATEGORI_BMHP_ORDER))}
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
                <span className="m-xs">Memuat BMHP & unit…</span>
              </div>
            ) : units.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center text-slate-400">
                <MapPin size={20} className="text-slate-300" />
                <p className="m-xs font-semibold text-slate-500">Belum ada lokasi Farmasi aktif</p>
                <p className="m-mini">Tambahkan Ruangan berjenis <b>Farmasi</b> atau <b>Gudang Farmasi</b> di master Unit &amp; Ruangan dulu.</p>
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
              <FormulariumBmhpMatrix
                bmhp={filteredBmhp}
                units={visibleUnits}
                map={map}
                visibleKategori={visibleKategori}
                onToggle={handleToggle}
                onToggleRow={handleToggleRow}
                onToggleColumn={handleToggleColumn}
                onToggleGroup={handleToggleGroup}
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
  stats, totalBmhp, totalUnit, saving,
}: {
  stats: { granted: number; totalCells: number; pct: number };
  totalBmhp: number;
  totalUnit: number;
  saving: number;
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
          <div className="flex items-center gap-2">
            <h2 className="m-base font-bold text-slate-900">Ketersediaan BMHP</h2>
            {saving > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 m-mini font-medium text-slate-500">
                <Loader2 size={9} className="animate-spin" /> Menyimpan…
              </span>
            )}
          </div>
          <p className="mt-0.5 m-tiny text-slate-500">
            Atur BMHP/BHP apa jadi <b>daftar standar depo</b> (distok &amp; boleh diminta) di lokasi farmasi
            mana. Baris dari Katalog BMHP; <b>kolom = Ruangan berjenis Farmasi / Gudang Farmasi</b>.
            Klik judul kolom = toggle semua BMHP; klik judul baris = toggle semua lokasi.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Stat icon={Syringe} label="BMHP"    value={`${totalBmhp}`}                     cls="bg-teal-50 text-teal-600" />
          <Stat icon={MapPin}  label="Lokasi"  value={`${totalUnit}`}                     cls="bg-sky-50 text-sky-600" />
          <Stat icon={Link2}   label="Mapping" value={`${stats.granted} (${stats.pct}%)`} cls="bg-emerald-50 text-emerald-600" />
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
