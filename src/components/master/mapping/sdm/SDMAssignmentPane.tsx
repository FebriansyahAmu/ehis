"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Building2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type AssignmentMap, type SDMItem, type UnitItem,
  deriveSDMList, deriveUnitList, initAssignmentMap, countTotalAssignments,
} from "./sdmShared";
import UnitListPanel from "./UnitListPanel";
import SDMRosterPanel from "./SDMRosterPanel";
import BulkMoveModal from "./BulkMoveModal";

export default function SDMAssignmentPane() {
  const initialSDM = useMemo(() => deriveSDMList(), []);
  const units = useMemo(() => deriveUnitList(), []);

  const [assignments, setAssignments] = useState<AssignmentMap>(() =>
    initAssignmentMap(initialSDM),
  );
  const [selectedUnitKode, setSelectedUnitKode] = useState<string | null>(
    units[0]?.kode ?? null,
  );
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [bulkMoveIds, setBulkMoveIds] = useState<string[]>([]);

  const selectedUnit = useMemo(
    () => units.find((u) => u.kode === selectedUnitKode) ?? null,
    [units, selectedUnitKode],
  );

  const stats = useMemo(() => {
    const totalSDM = initialSDM.length;
    const totalAssignments = countTotalAssignments(assignments);
    const unitsWithSDM = units.filter(
      (u) => Object.values(assignments).some((arr) => arr.includes(u.kode)),
    ).length;
    return { totalSDM, totalAssignments, unitsWithSDM };
  }, [initialSDM, assignments, units]);

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
    () => initialSDM.filter((s) => bulkMoveIds.includes(s.id)),
    [initialSDM, bulkMoveIds],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Pane Header — title + stats inline (no long scroll) */}
      <PaneHeader stats={stats} />

      {/* Two-panel body */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <UnitListPanel
          units={units}
          assignments={assignments}
          selectedKode={selectedUnitKode}
          onSelect={setSelectedUnitKode}
        />
        {selectedUnit ? (
          <SDMRosterPanel
            unit={selectedUnit}
            allSDM={initialSDM}
            assignments={assignments}
            onToggle={handleToggle}
            onOpenBulkMove={handleOpenBulkMove}
          />
        ) : (
          <EmptyUnitSelection />
        )}
      </div>

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
          <h2 className="text-sm font-bold text-slate-900">SDM Assignment</h2>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Pilih unit di kiri → tambah / lepas SDM di kanan. Bulk action di-aktifkan saat
            ada SDM dipilih.
          </p>
        </div>
        <div className="flex gap-2">
          <Stat icon={Users}     label="Total SDM"   value={stats.totalSDM}        cls="bg-teal-50 text-teal-600" />
          <Stat icon={Link2}     label="Assignment" value={stats.totalAssignments} cls="bg-emerald-50 text-emerald-600" />
          <Stat icon={Building2} label="Unit Aktif"  value={stats.unitsWithSDM}    cls="bg-sky-50 text-sky-600" />
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
        <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-black leading-none text-slate-900">{value}</p>
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
        <p className="mt-3 text-xs font-semibold text-slate-700">Pilih unit di kiri</p>
        <p className="mt-1 text-[10px] text-slate-400">untuk melihat & mengelola SDM</p>
      </div>
    </section>
  );
}
