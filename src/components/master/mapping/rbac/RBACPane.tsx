"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, KeyRound, Search, Save, Loader2, RotateCcw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type UserRole } from "@/components/master/pengguna/penggunaShared";
import { fetchRbacMatrix, saveRoleGrants } from "@/lib/api/rbac";
import { ApiError } from "@/lib/api/client";
import {
  type RBACMap, type CrudAction,
  type PermissionLeaf, type PermissionModule,
  mapFromGrants, grantsForRole, toggleAction, setLeafAll, setModuleAll,
  countTotalGrants, ROLE_ORDER, PERMISSION_TREE,
} from "./rbacShared";
import RoleListPanel from "./RoleListPanel";
import PermissionMatrix from "./PermissionMatrix";

export default function RBACPane() {
  const [map, setMap] = useState<RBACMap | null>(null);   // working copy
  const [saved, setSaved] = useState<RBACMap | null>(null); // last persisted (server)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>("Dokter");
  const [search, setSearch] = useState("");

  // Muat matriks dari DB (source of truth runtime = auth.role_permissions).
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const m = mapFromGrants((await fetchRbacMatrix(ac.signal)).grants);
        setMap(m);
        setSaved(JSON.parse(JSON.stringify(m)));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof ApiError ? e.message : "Gagal memuat matriks RBAC.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const totalLeaves = useMemo(
    () => PERMISSION_TREE.reduce((sum, m) => sum + m.leaves.length, 0),
    [],
  );
  const activeStats = useMemo(
    () => (map ? countTotalGrants(map, activeRole) : { granted: 0, total: 0 }),
    [map, activeRole],
  );
  const dirty = useMemo(
    () =>
      !!map && !!saved &&
      grantsForRole(map, activeRole).join("|") !== grantsForRole(saved, activeRole).join("|"),
    [map, saved, activeRole],
  );

  const handleToggleAction = (leafKey: string, action: CrudAction) =>
    setMap((prev) => (prev ? toggleAction(prev, activeRole, leafKey, action) : prev));
  const handleToggleLeaf = (leaf: PermissionLeaf, grant: boolean) =>
    setMap((prev) => (prev ? setLeafAll(prev, activeRole, leaf, grant) : prev));
  const handleToggleModule = (module: PermissionModule, grant: boolean) =>
    setMap((prev) => (prev ? setModuleAll(prev, activeRole, module, grant) : prev));

  /** Buang perubahan role aktif → kembali ke versi tersimpan. */
  const handleResetRole = () => {
    if (!saved) return;
    setMap((prev) => (prev ? { ...prev, [activeRole]: JSON.parse(JSON.stringify(saved[activeRole])) } : prev));
  };

  const handleSave = useCallback(async () => {
    if (!map || saving) return;
    setSaving(true);
    setError(null);
    try {
      const kodes = await saveRoleGrants(activeRole, grantsForRole(map, activeRole));
      const rec = mapFromGrants({ [activeRole]: kodes })[activeRole];
      setMap((prev) => (prev ? { ...prev, [activeRole]: rec } : prev));
      setSaved((prev) => (prev ? { ...prev, [activeRole]: rec } : prev));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal menyimpan permission.");
    } finally {
      setSaving(false);
    }
  }, [map, saving, activeRole]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <PaneHeader
        totalRoles={ROLE_ORDER.length}
        totalPermissions={totalLeaves}
        activeGranted={activeStats.granted}
        activeTotal={activeStats.total}
        activeRole={activeRole}
        dirty={dirty}
        saving={saving}
        canSave={!!map}
        onSave={handleSave}
        onReset={handleResetRole}
      />

      {error && (
        <div role="alert" className="flex shrink-0 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 m-xs text-rose-700">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

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
      {loading || !map ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
          <Loader2 size={18} className="mr-2 animate-spin" /> <span className="m-sm">Memuat matriks RBAC…</span>
        </div>
      ) : (
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
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function PaneHeader({
  totalRoles, totalPermissions, activeGranted, activeTotal,
  activeRole, dirty, saving, canSave, onSave, onReset,
}: {
  totalRoles: number;
  totalPermissions: number;
  activeGranted: number;
  activeTotal: number;
  activeRole: UserRole;
  dirty: boolean;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
  onReset: () => void;
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
            Atur CRUD + Export per modul untuk setiap role. Tersimpan ke DB & langsung berlaku (sesi aktif ≤30m).
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Stat icon={ShieldCheck} label="Role"        value={`${totalRoles}`}                cls="bg-slate-100 text-slate-700" />
          <Stat icon={Lock}        label="Permission"  value={`${totalPermissions}`}          cls="bg-sky-50 text-sky-600" />
          <Stat icon={KeyRound}    label="Aktif Role"  value={`${activeGranted}/${activeTotal} (${pct}%)`} cls="bg-emerald-50 text-emerald-600" />
          <div className="ml-1 flex items-center gap-1.5">
            {dirty && (
              <button
                onClick={onReset}
                disabled={saving}
                title="Batalkan perubahan role ini"
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-2 m-xs font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RotateCcw size={12} />
              </button>
            )}
            <button
              onClick={onSave}
              disabled={!canSave || !dirty || saving}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 m-xs font-semibold text-white transition",
                !canSave || !dirty || saving
                  ? "cursor-not-allowed bg-slate-300"
                  : "bg-teal-600 hover:bg-teal-700 active:scale-[0.98]",
              )}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {saving ? "Menyimpan…" : dirty ? `Simpan ${activeRole}` : "Tersimpan"}
            </button>
          </div>
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
