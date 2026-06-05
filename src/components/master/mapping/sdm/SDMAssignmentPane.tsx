"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Building2, Link2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import { getTree } from "@/lib/api/ruangan";
import { listDokter, type DokterListItemDTO } from "@/lib/api/dokter";
import type { AnyNode } from "@/components/master/ruangan/ruanganShared";
import {
  type AssignmentMap, type SDMItem,
  deriveSDMList, ruanganFromTree, initAssignmentMap, countTotalAssignments,
} from "./sdmShared";
import RuanganTreePanel from "./RuanganTreePanel";
import SDMRosterPanel from "./SDMRosterPanel";
import BulkMoveModal from "./BulkMoveModal";

interface SDMAssignmentPaneProps {
  /** Tree Ruangan dari SSR (API-RULES §6.1). Ada → first paint langsung; absen → client fetch. */
  initialTree?: AnyNode[];
  /** Daftar dokter (API /master/dokter) dari SSR. Absen → client fetch. */
  initialDokters?: DokterListItemDTO[];
}

export default function SDMAssignmentPane({ initialTree, initialDokters }: SDMAssignmentPaneProps) {
  // Tree REAL dari master/ruangan. SSR hybrid: pakai initialTree bila ada, else fetch client
  // (degradasi anggun). `units` (ruangan datar) diturunkan utk roster/bulk-move/stats; tree
  // mentah (`nodes`) diteruskan ke panel kiri untuk tampilan Unit → Ruangan.
  const prefetched = initialTree != null;
  const [nodes, setNodes] = useState<AnyNode[]>(initialTree ?? []);
  const [unitsLoading, setUnitsLoading] = useState(!prefetched);
  const [unitsErr, setUnitsErr] = useState<string | null>(null);

  const units = useMemo(() => ruanganFromTree(nodes), [nodes]);

  // SDM = dokter REAL (API /master/dokter, didaftarkan di Dokter & Nakes) + pengguna mock.
  // SSR hybrid: pakai initialDokters bila ada, else fetch client.
  const [dokters, setDokters] = useState<DokterListItemDTO[]>(initialDokters ?? []);
  const sdmList = useMemo(() => deriveSDMList(dokters), [dokters]);

  const [assignments, setAssignments] = useState<AssignmentMap>(() =>
    initAssignmentMap(deriveSDMList(initialDokters ?? [])),
  );
  const [selectedUnitKode, setSelectedUnitKode] = useState<string | null>(null);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [bulkMoveIds, setBulkMoveIds] = useState<string[]>([]);

  useEffect(() => {
    if (prefetched) return; // sudah dari SSR — tak perlu fetch
    const ctrl = new AbortController();
    setUnitsLoading(true);
    getTree(ctrl.signal)
      .then((tree) => { setNodes(tree); setUnitsErr(null); })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setUnitsErr(e instanceof ApiError ? e.message : "Gagal memuat daftar ruangan");
      })
      .finally(() => setUnitsLoading(false));
    return () => ctrl.abort();
  }, [prefetched]);

  useEffect(() => {
    if (initialDokters != null) return; // sudah dari SSR
    const ctrl = new AbortController();
    listDokter({ limit: 50 }, ctrl.signal)
      .then(({ items }) => setDokters(items))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        /* roster dokter kosong bila gagal — abaikan (pengguna mock tetap tampil) */
      });
    return () => ctrl.abort();
  }, [initialDokters]);

  // Sinkronkan assignment map saat SDM list berubah (pertahankan edit yang sudah ada).
  useEffect(() => {
    setAssignments((prev) => {
      const base = initAssignmentMap(sdmList);
      for (const k of Object.keys(base)) if (prev[k]) base[k] = prev[k];
      return base;
    });
  }, [sdmList]);

  // Pilih ruangan pertama begitu data tersedia (sekali, bila belum ada pilihan).
  useEffect(() => {
    setSelectedUnitKode((cur) => cur ?? units[0]?.kode ?? null);
  }, [units]);

  const selectedUnit = useMemo(
    () => units.find((u) => u.kode === selectedUnitKode) ?? null,
    [units, selectedUnitKode],
  );

  const stats = useMemo(() => {
    const totalSDM = sdmList.length;
    const totalAssignments = countTotalAssignments(assignments);
    const unitsWithSDM = units.filter(
      (u) => Object.values(assignments).some((arr) => arr.includes(u.kode)),
    ).length;
    return { totalSDM, totalAssignments, unitsWithSDM };
  }, [sdmList, assignments, units]);

  const handleToggle = (sdmId: string, unitKode: string) => {
    setAssignments((prev) => {
      const current = prev[sdmId] ?? [];
      const has = current.includes(unitKode);
      return {
        ...prev,
        [sdmId]: has ? current.filter((u) => u !== unitKode) : [...current, unitKode],
      };
    });
  };

  const handleOpenBulkMove = (ids: string[]) => {
    setBulkMoveIds(ids);
    setBulkMoveOpen(true);
  };

  const handleBulkMoveConfirm = (toKode: string, alsoRemove: boolean) => {
    if (!selectedUnit) return;
    const fromKode = selectedUnit.kode;
    setAssignments((prev) => {
      const next = { ...prev };
      for (const id of bulkMoveIds) {
        const units = next[id] ?? [];
        let updated = [...units];
        if (alsoRemove) updated = updated.filter((u) => u !== fromKode);
        if (!updated.includes(toKode)) updated.push(toKode);
        next[id] = updated;
      }
      return next;
    });
    setBulkMoveOpen(false);
    setBulkMoveIds([]);
  };

  const bulkMoveSDMs: SDMItem[] = useMemo(
    () => sdmList.filter((s) => bulkMoveIds.includes(s.id)),
    [sdmList, bulkMoveIds],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Pane Header — title + stats inline (no long scroll) */}
      <PaneHeader stats={stats} />

      {/* Two-panel body */}
      {unitsLoading ? (
        <UnitsLoading />
      ) : unitsErr ? (
        <UnitsError message={unitsErr} />
      ) : units.length === 0 ? (
        <UnitsEmpty />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
          <RuanganTreePanel
            nodes={nodes}
            assignments={assignments}
            selectedKode={selectedUnitKode}
            onSelect={setSelectedUnitKode}
          />
          {selectedUnit ? (
            <SDMRosterPanel
              unit={selectedUnit}
              allSDM={sdmList}
              assignments={assignments}
              onToggle={handleToggle}
              onOpenBulkMove={handleOpenBulkMove}
            />
          ) : (
            <EmptyUnitSelection />
          )}
        </div>
      )}

      {/* Bulk move modal */}
      {selectedUnit && (
        <BulkMoveModal
          open={bulkMoveOpen}
          fromUnit={selectedUnit}
          selectedSDMs={bulkMoveSDMs}
          availableUnits={units}
          onClose={() => setBulkMoveOpen(false)}
          onConfirm={handleBulkMoveConfirm}
        />
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function PaneHeader({
  stats,
}: {
  stats: { totalSDM: number; totalAssignments: number; unitsWithSDM: number };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="m-base font-bold text-slate-900">SDM Assignment</h2>
          <p className="mt-0.5 m-tiny text-slate-500">
            Pilih ruangan di kiri → tambah / lepas SDM di kanan. Bulk action di-aktifkan saat
            ada SDM dipilih.
          </p>
        </div>
        <div className="flex gap-2">
          <Stat icon={Users}     label="Total SDM"   value={stats.totalSDM}        cls="bg-teal-50 text-teal-600" />
          <Stat icon={Link2}     label="Assignment" value={stats.totalAssignments} cls="bg-emerald-50 text-emerald-600" />
          <Stat icon={Building2} label="Ruangan Aktif" value={stats.unitsWithSDM}  cls="bg-sky-50 text-sky-600" />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({
  icon: Icon, label, value, cls,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
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

function EmptyUnitSelection() {
  return (
    <section className="flex h-full min-w-0 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
          <Building2 size={20} className="text-slate-400" />
        </span>
        <p className="mt-3 m-sm font-semibold text-slate-700">Pilih ruangan di kiri</p>
        <p className="mt-1 m-tiny text-slate-400">untuk melihat & mengelola SDM</p>
      </div>
    </section>
  );
}

// ── Unit fetch states ────────────────────────────────────

function StateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="text-center">{children}</div>
    </div>
  );
}

function UnitsLoading() {
  return (
    <StateShell>
      <Loader2 size={22} className="mx-auto animate-spin text-teal-500" />
      <p className="mt-3 m-sm font-semibold text-slate-600">Memuat ruangan…</p>
      <p className="mt-1 m-tiny text-slate-400">mengambil data dari Master Ruangan</p>
    </StateShell>
  );
}

function UnitsError({ message }: { message: string }) {
  return (
    <StateShell>
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
        <AlertCircle size={20} className="text-rose-500" />
      </span>
      <p className="mt-3 m-sm font-semibold text-rose-600">Gagal memuat ruangan</p>
      <p className="mt-1 m-tiny text-slate-400">{message}</p>
    </StateShell>
  );
}

function UnitsEmpty() {
  return (
    <StateShell>
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <Building2 size={20} className="text-slate-400" />
      </span>
      <p className="mt-3 m-sm font-semibold text-slate-700">Belum ada ruangan</p>
      <p className="mt-1 m-tiny text-slate-400">
        Tambahkan ruangan lebih dulu di <span className="font-semibold text-slate-600">Master → Unit &amp; Ruangan</span>.
      </p>
    </StateShell>
  );
}
