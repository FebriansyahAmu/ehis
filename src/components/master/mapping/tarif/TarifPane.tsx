"use client";

// Tarif Matrix — REAL data (SSR hybrid, 2026-06-12). Baris = Katalog Tindakan DB (persis Layanan
// Unit). Kolom = tier "Jenis Ruangan" derive dari master Ruangan tree, difilter per penjamin (KRIS).
// Sel = harga master.TarifTindakan; edit = upsert/delete optimistik + reconcile. Selaras LayananUnitPane.

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BadgePercent, Building2, TrendingUp, Search, Calculator, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type TindakanKategori, KATEGORI_CFG, KATEGORI_ORDER,
} from "@/lib/master/tindakanMock";
import {
  PENJAMIN_TIPE_CFG, fmtRupiahShort,
} from "@/lib/master/penjaminMock";
import type { AnyNode } from "@/components/master/ruangan/ruanganShared";
import { getTree } from "@/lib/api/ruangan";
import { listTindakan, type TindakanDTO } from "@/lib/api/master/tindakan";
import {
  listAllTarif, upsertTarif, deleteTarif, type TarifTindakanDTO,
} from "@/lib/api/master/tarifTindakan";
import {
  type TarifMap, type JenisRuanganTier, type TarifPenjamin,
  TARIF_PENJAMIN, tiersFromTree, validTiersForPenjamin, mapFromEdges, getCell, setCell, clearCell,
  calcStats, tindakanRecordsFromDTO, roundIDR,
} from "./tarifShared";
import { toast } from "@/lib/ui/toastStore";
import TarifMatrix from "./TarifMatrix";
import BulkAdjustModal from "./BulkAdjustModal";

const PENDING = "__pending__";

interface Props {
  /** Katalog tindakan dari SSR (baris). Absen → client fetch. */
  tindakan?: TindakanDTO[];
  /** Tree Ruangan dari SSR (derive tier kolom). Absen → client fetch. */
  tree?: AnyNode[];
  /** Edge tarif dari SSR (seed map). Selalu di-reconcile client utk id segar. */
  tarif?: TarifTindakanDTO[];
}

export default function TarifPane({ tindakan, tree, tarif }: Props) {
  const [allTindakan, setAllTindakan] = useState(() => (tindakan ? tindakanRecordsFromDTO(tindakan) : []));
  const [derivedTiers, setDerivedTiers] = useState<JenisRuanganTier[]>(() => (tree ? tiersFromTree(tree) : []));
  const [map, setMap] = useState<TarifMap>(() => mapFromEdges(tarif ?? []));
  const [loading, setLoading] = useState(!tindakan || !tree);
  const [busy, setBusy] = useState(false);

  const firstEnabled = TARIF_PENJAMIN.find((p) => p.enabled) ?? TARIF_PENJAMIN[0];
  const [activeKode, setActiveKode] = useState(firstEnabled?.kode ?? "");
  const [search, setSearch] = useState("");
  const [visibleKategori, setVisibleKategori] = useState<Set<TindakanKategori>>(() => new Set(KATEGORI_ORDER));
  const [bulkOpen, setBulkOpen] = useState(false);

  // Hindari reconcile-on-mount menimpa edit optimistik in-flight.
  const dirtyRef = useRef(false);

  const activePenjamin: TarifPenjamin = useMemo(
    () => TARIF_PENJAMIN.find((p) => p.kode === activeKode && p.enabled) ?? firstEnabled,
    [activeKode, firstEnabled],
  );

  const visibleTiers = useMemo(
    () => validTiersForPenjamin(activePenjamin.tipe, derivedTiers),
    [activePenjamin.tipe, derivedTiers],
  );

  // ── Reconcile-on-mount: tarif edge SELALU fetch (id segar); tindakan/tree bila SSR absen ──
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const [treeRes, tindakanRes, tarifRes] = await Promise.all([
          tree ? null : getTree(ac.signal),
          tindakan ? null : listTindakan({ limit: 200 }, ac.signal),
          listAllTarif(ac.signal),
        ]);
        if (treeRes) setDerivedTiers(tiersFromTree(treeRes as AnyNode[]));
        if (tindakanRes) setAllTindakan(tindakanRecordsFromDTO(tindakanRes.items));
        if (!dirtyRef.current) setMap(mapFromEdges(tarifRes));
      } catch {
        /* pertahankan SSR seed */
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = async () => {
    try {
      setMap(mapFromEdges(await listAllTarif()));
    } catch {
      /* pertahankan state terakhir */
    }
  };

  // ── Filter baris ──
  const filteredTindakan = useMemo(() => {
    if (!search.trim()) return allTindakan;
    const q = search.toLowerCase();
    return allTindakan.filter((t) => t.nama.toLowerCase().includes(q) || t.kode.toLowerCase().includes(q));
  }, [allTindakan, search]);

  const visibleIds = useMemo(
    () => filteredTindakan.filter((t) => visibleKategori.has(t.kategori)).map((t) => t.id),
    [filteredTindakan, visibleKategori],
  );
  const visibleTierKeys = useMemo(() => visibleTiers.map((t) => t.key), [visibleTiers]);

  const stats = useMemo(
    () => calcStats(map, activeKode, visibleIds, visibleTierKeys),
    [map, activeKode, visibleIds, visibleTierKeys],
  );

  // ── Persist 1 sel (upsert > 0 / delete <= 0) optimistik ──
  const handleEdit = (tindakanId: string, tierKey: string, value: number) => {
    dirtyRef.current = true;
    const existing = getCell(map, activeKode, tindakanId, tierKey);

    if (value <= 0) {
      if (!existing) return;
      setMap((m) => clearCell(m, activeKode, tindakanId, tierKey));
      if (existing.id !== PENDING) {
        deleteTarif(existing.id).catch(() => {
          toast.error("Gagal menghapus tarif");
          void reload();
        });
      }
      return;
    }

    setMap((m) => setCell(m, activeKode, tindakanId, tierKey, { id: existing?.id ?? PENDING, harga: value }));
    setBusy(true);
    upsertTarif({ tindakanId, penjaminKode: activeKode, jenisRuangan: tierKey, harga: value })
      .then((dto) => setMap((m) => setCell(m, activeKode, tindakanId, tierKey, { id: dto.id, harga: dto.harga })))
      .catch(() => { toast.error("Gagal menyimpan tarif"); void reload(); })
      .finally(() => setBusy(false));
  };

  // ── Flat-rate: samakan 1 tindakan ke SEMUA tier (sheet penjamin aktif) ──
  // Untuk tindakan ber-harga seragam lintas ruangan/kelas (pasang infus, EKG, akses IV, dll).
  const handleFlatRate = (tindakanId: string, harga: number) => {
    if (harga <= 0) return;
    dirtyRef.current = true;
    let next = map;
    const jobs: Promise<unknown>[] = [];
    for (const tier of visibleTiers) {
      const cell = getCell(next, activeKode, tindakanId, tier.key);
      next = setCell(next, activeKode, tindakanId, tier.key, { id: cell?.id ?? PENDING, harga });
      jobs.push(
        upsertTarif({ tindakanId, penjaminKode: activeKode, jenisRuangan: tier.key, harga })
          .then((dto) => setMap((m) => setCell(m, activeKode, tindakanId, tier.key, { id: dto.id, harga: dto.harga }))),
      );
    }
    if (jobs.length === 0) return;
    setMap(next);
    setBusy(true);
    Promise.allSettled(jobs)
      .then((res) => {
        const fail = res.filter((r) => r.status === "rejected").length;
        if (fail > 0) { toast.error(`${fail} tarif gagal disimpan`); void reload(); }
        else toast.success(`Tarif disamakan ke ${jobs.length} kolom`);
      })
      .finally(() => setBusy(false));
  };

  // ── Bulk adjust % (sel terisi di scope terlihat) ──
  const handleBulkAdjust = (percent: number) => {
    dirtyRef.current = true;
    const factor = 1 + percent / 100;
    const jobs: Promise<unknown>[] = [];
    let next = map;
    for (const tId of visibleIds) {
      for (const tier of visibleTiers) {
        const cell = getCell(next, activeKode, tId, tier.key);
        if (!cell || cell.harga <= 0) continue;
        const harga = roundIDR(cell.harga * factor);
        next = setCell(next, activeKode, tId, tier.key, { id: cell.id, harga });
        jobs.push(
          upsertTarif({ tindakanId: tId, penjaminKode: activeKode, jenisRuangan: tier.key, harga })
            .then((dto) => setMap((m) => setCell(m, activeKode, tId, tier.key, { id: dto.id, harga: dto.harga }))),
        );
      }
    }
    if (jobs.length === 0) { toast.info("Tak ada tarif terisi di tampilan ini"); return; }
    setMap(next);
    setBusy(true);
    Promise.allSettled(jobs)
      .then((res) => {
        const fail = res.filter((r) => r.status === "rejected").length;
        if (fail > 0) { toast.error(`${fail} tarif gagal disimpan`); void reload(); }
        else toast.success(`${jobs.length} tarif disesuaikan ${percent > 0 ? "+" : ""}${percent}%`);
      })
      .finally(() => setBusy(false));
  };

  const toggleKategori = (cat: TindakanKategori) =>
    setVisibleKategori((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });

  // Jumlah sel terisi di scope terlihat (untuk modal bulk).
  const affectedCount = useMemo(() => {
    let n = 0;
    for (const tId of visibleIds) for (const tier of visibleTiers) {
      if ((getCell(map, activeKode, tId, tier.key)?.harga ?? 0) > 0) n++;
    }
    return n;
  }, [map, activeKode, visibleIds, visibleTiers]);

  if (!activePenjamin) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <PaneHeader
        stats={stats}
        totalTindakan={allTindakan.length}
        totalTier={visibleTiers.length}
        busy={busy}
        loading={loading}
      />

      {/* Penjamin tabs (sheet selector) */}
      <motion.div
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.03 }}
        className="shrink-0 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm"
      >
        <div className="flex items-center gap-1">
          {TARIF_PENJAMIN.map((p) => {
            const cfg = PENJAMIN_TIPE_CFG[p.tipe];
            const active = p.kode === activeKode && p.enabled;
            const disabled = !p.enabled;
            return (
              <button
                key={p.kode}
                type="button"
                disabled={disabled}
                onClick={() => p.enabled && setActiveKode(p.kode)}
                title={disabled ? p.note : undefined}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 m-xs font-semibold transition",
                  disabled
                    ? "cursor-not-allowed text-slate-300"
                    : active
                      ? cn(cfg.bg, cfg.text, "ring-1 ring-amber-200")
                      : "text-slate-500 hover:bg-slate-50",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", disabled ? "bg-slate-300" : cfg.dot)} />
                  <span>{p.nama}</span>
                  {disabled ? (
                    <span className="rounded bg-slate-100 px-1 m-mini font-semibold text-slate-400">Nonaktif</span>
                  ) : (
                    <span className={cn("rounded px-1 m-mini font-mono", active ? "bg-white/60" : "bg-slate-100")}>
                      {p.kode}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          <span className="ml-1.5 hidden items-center gap-1 m-mini text-slate-400 sm:flex">
            · Tarif PERDA berlaku semua jaminan
          </span>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
        className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tindakan / kode ICD-9..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
            />
          </div>
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 m-mini font-semibold text-white transition hover:bg-amber-700"
          >
            <Calculator size={11} /> Bulk Update
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="m-mini font-semibold uppercase tracking-wide text-slate-400">Kategori:</span>
          {KATEGORI_ORDER.map((cat) => {
            const cfg = KATEGORI_CFG[cat];
            const active = visibleKategori.has(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleKategori(cat)}
                className={cn(
                  "rounded-md border px-1.5 py-0.5 m-mini font-semibold transition",
                  active ? cn("border-transparent", cfg.bg, cfg.text) : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50",
                )}
              >
                {cfg.short}
              </button>
            );
          })}
          <button type="button" onClick={() => setVisibleKategori(new Set(KATEGORI_ORDER))} className="ml-1 rounded-md px-1.5 py-0.5 m-mini font-semibold text-amber-700 hover:bg-amber-50">Semua</button>
          <button type="button" onClick={() => setVisibleKategori(new Set())} className="rounded-md px-1.5 py-0.5 m-mini font-semibold text-slate-500 hover:bg-slate-100">Kosong</button>
        </div>
      </motion.div>

      {/* Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
        className="flex min-h-0 flex-1 flex-col"
      >
        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs text-slate-500 shadow-sm">
            <Loader2 size={14} className="animate-spin" /> Memuat tarif…
          </div>
        ) : (
          <TarifMatrix
            tindakan={filteredTindakan}
            tiers={visibleTiers}
            map={map}
            penjaminKode={activeKode}
            visibleKategori={visibleKategori}
            onEdit={handleEdit}
            onFlatRate={handleFlatRate}
          />
        )}
      </motion.div>

      <BulkAdjustModal
        open={bulkOpen}
        penjamin={activePenjamin}
        affectedCount={affectedCount}
        onClose={() => setBulkOpen(false)}
        onConfirm={handleBulkAdjust}
      />
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function PaneHeader({
  stats, totalTindakan, totalTier, busy, loading,
}: {
  stats: { count: number; filled: number; total: number; avg: number; min: number; max: number };
  totalTindakan: number;
  totalTier: number;
  busy: boolean;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="m-base font-bold text-slate-900">Tarif Matrix</h2>
            {busy && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 m-mini font-medium text-slate-500"><Loader2 size={9} className="animate-spin" /> Menyimpan…</span>}
            {loading && !busy && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 m-mini font-medium text-slate-500"><Loader2 size={9} className="animate-spin" /> Memuat…</span>}
          </div>
          <p className="mt-0.5 m-tiny text-slate-500">
            Tindakan × Penjamin × Jenis Ruangan. Pilih penjamin → klik sel untuk edit harga inline (auto-save).
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Stat icon={BadgePercent} label="Tindakan" value={`${totalTindakan}`} cls="bg-amber-50 text-amber-600" />
          <Stat icon={Building2}    label="Tier"     value={`${totalTier}`}     cls="bg-sky-50 text-sky-600" />
          <Stat icon={TrendingUp}   label="Avg Tarif" value={stats.count ? fmtRupiahShort(stats.avg) : "—"} cls="bg-emerald-50 text-emerald-600" />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ icon: Icon, label, value, cls }: { icon: IconComponent; label: string; value: string; cls: string }) {
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
