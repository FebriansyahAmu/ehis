"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, KeyRound, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { type UserRole } from "@/components/master/pengguna/penggunaShared";
import {
  type RBACMap, type CrudAction,
  type PermissionLeaf, type PermissionModule,
  initRBACMap, toggleAction, setLeafAll, setModuleAll,
  countTotalGrants, ROLE_ORDER, PERMISSION_TREE,
} from "./rbacShared";
import RoleListPanel from "./RoleListPanel";
import PermissionMatrix from "./PermissionMatrix";

export default function RBACPane() {
  const [map, setMap] = useState<RBACMap>(() => initRBACMap());
  const [activeRole, setActiveRole] = useState<UserRole>("Dokter");
  const [search, setSearch] = useState("");

  const totalLeaves = useMemo(
    () => PERMISSION_TREE.reduce((sum, m) => sum + m.leaves.length, 0),
    [],
  );

  const activeStats = useMemo(() => countTotalGrants(map, activeRole), [map, activeRole]);

  const handleToggleAction = (leafKey: string, action: CrudAction) => {
    setMap((prev) => toggleAction(prev, activeRole, leafKey, action));
  };

  const handleToggleLeaf = (leaf: PermissionLeaf, grant: boolean) => {
    setMap((prev) => setLeafAll(prev, activeRole, leaf, grant));
  };

  const handleToggleModule = (module: PermissionModule, grant: boolean) => {
    setMap((prev) => setModuleAll(prev, activeRole, module, grant));
  };

  const handleResetRole = () => {
    if (!confirm(`Reset permission ${activeRole} ke default?`)) return;
    const fresh = initRBACMap();
    setMap((prev) => ({ ...prev, [activeRole]: fresh[activeRole] }));
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <PaneHeader
        totalRoles={ROLE_ORDER.length}
        totalPermissions={totalLeaves}
        activeGranted={activeStats.granted}
        activeTotal={activeStats.total}
      />

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
      >
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari permission (mis. 'cppt', 'lab.validate', 'billing')..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
          />
        </div>
      </motion.div>

      {/* Two-panel */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <RoleListPanel map={map} activeRole={activeRole} onSelect={setActiveRole} />
        <PermissionMatrix
          map={map}
          role={activeRole}
          search={search}
          onToggleAction={handleToggleAction}
          onToggleLeaf={handleToggleLeaf}
          onToggleModule={handleToggleModule}
          onResetRole={handleResetRole}
        />
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function PaneHeader({
  totalRoles, totalPermissions, activeGranted, activeTotal,
}: {
  totalRoles: number;
  totalPermissions: number;
  activeGranted: number;
  activeTotal: number;
}) {
  const pct = activeTotal ? Math.round((activeGranted / activeTotal) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-base font-bold text-slate-900">RBAC — Role × Permission</h2>
          <p className="mt-0.5 m-tiny text-slate-500">
            Atur CRUD + Export per modul untuk setiap role. Permission tree dipersist per role, source of truth tunggal.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Stat icon={ShieldCheck} label="Role"        value={`${totalRoles}`}                cls="bg-slate-100 text-slate-700" />
          <Stat icon={Lock}        label="Permission"  value={`${totalPermissions}`}          cls="bg-sky-50 text-sky-600" />
          <Stat icon={KeyRound}    label="Aktif Role"  value={`${activeGranted}/${activeTotal} (${pct}%)`} cls="bg-emerald-50 text-emerald-600" />
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
