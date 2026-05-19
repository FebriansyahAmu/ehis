"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserCheck, UserCog, Search, Plus, Pencil, Trash2,
  MoreVertical, Shield, UserX, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type PenggunaRecord, type UserRole, type UserStatus,
  PENGGUNA_MOCK, ROLE_CFG, STATUS_CFG, UNIT_LIST,
  fmtRelative, getUnitNama,
} from "./penggunaShared";
import PenggunaFormModal from "./PenggunaFormModal";

// ── Skeleton ───────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-4 w-44" />
          <Bone className="h-3 w-72" />
        </div>
        <Bone className="h-8 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
      <Bone className="h-[480px] rounded-2xl" />
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, iconCls, delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  iconCls: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconCls)}>
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-black leading-none text-slate-900">{value}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function PenggunaPage() {
  const [users, setUsers] = useState<PenggunaRecord[]>(PENGGUNA_MOCK);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PenggunaRecord | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [openMenuId]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (unitFilter !== "all" && !u.unitAssignment.includes(unitFilter)) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.nama.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, roleFilter, statusFilter, unitFilter, search]);

  const stats = useMemo(() => {
    const total = users.length;
    const aktif = users.filter((u) => u.status === "Aktif").length;
    const admin = users.filter((u) => u.role === "Admin").length;
    return { total, aktif, admin };
  }, [users]);

  const handleNewClick = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleEdit = (user: PenggunaRecord) => {
    setEditTarget(user);
    setModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSubmit = (next: PenggunaRecord) => {
    setUsers((prev) => {
      const exists = prev.find((u) => u.id === next.id);
      return exists ? prev.map((u) => (u.id === next.id ? next : u)) : [next, ...prev];
    });
  };

  const handleToggleStatus = (user: PenggunaRecord) => {
    const next: UserStatus = user.status === "Aktif" ? "Suspended" : "Aktif";
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: next } : u)));
    setOpenMenuId(null);
  };

  const handleDelete = (user: PenggunaRecord) => {
    if (!confirm(`Hapus pengguna "${user.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    setOpenMenuId(null);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <PageSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4 p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-600">
                  EHIS Master
                </p>
                <h1 className="mt-0.5 text-base font-bold text-slate-900">Pengguna Sistem</h1>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Kelola akun internal & hak akses modul EHIS — bukan FHIR resource.
                </p>
              </div>
              <button
                type="button"
                onClick={handleNewClick}
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]"
              >
                <Plus size={12} />
                Tambah Pengguna
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard icon={Users}     label="Total Pengguna" value={`${stats.total}`} sub={`${stats.aktif} aktif`}     iconCls="bg-teal-100 text-teal-600"     delay={0} />
              <StatCard icon={UserCheck} label="Aktif"          value={`${stats.aktif}`} sub="dapat login hari ini"        iconCls="bg-emerald-100 text-emerald-600" delay={0.07} />
              <StatCard icon={Shield}    label="Admin"          value={`${stats.admin}`} sub="akses penuh sistem"          iconCls="bg-rose-100 text-rose-600"     delay={0.14} />
            </div>

            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama / username / email..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-[11px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <FilterSelect
                value={roleFilter}
                onChange={(v) => setRoleFilter(v as UserRole | "all")}
                options={[["all", "Semua Role"], ...Object.entries(ROLE_CFG).map(([k, v]) => [k, v.label] as [string, string])]}
              />
              <FilterSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as UserStatus | "all")}
                options={[
                  ["all", "Semua Status"],
                  ["Aktif", "Aktif"],
                  ["Suspended", "Suspended"],
                  ["Non_Aktif", "Non-Aktif"],
                ]}
              />
              <FilterSelect
                value={unitFilter}
                onChange={setUnitFilter}
                options={[["all", "Semua Unit"], ...UNIT_LIST.map((u) => [u.kode, u.nama] as [string, string])]}
              />
            </motion.div>

            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {filtered.length === 0 ? (
                <EmptyTable />
              ) : (
                <UserTable
                  users={filtered}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  onEdit={handleEdit}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDelete}
                />
              )}
              <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[10px] text-slate-500">
                Menampilkan {filtered.length} dari {users.length} pengguna
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PenggunaFormModal
        open={modalOpen}
        initial={editTarget}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}

// ── Sub-Components ────────────────────────────────────────

function FilterSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pl-3 pr-7 text-[11px] font-medium text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 sm:w-auto"
      >
        {options.map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
      <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function UserTable({
  users, openMenuId, setOpenMenuId, onEdit, onToggleStatus, onDelete,
}: {
  users: PenggunaRecord[];
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onEdit: (u: PenggunaRecord) => void;
  onToggleStatus: (u: PenggunaRecord) => void;
  onDelete: (u: PenggunaRecord) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2.5">Pengguna</th>
            <th className="px-4 py-2.5">Role</th>
            <th className="px-4 py-2.5">Unit</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Login Terakhir</th>
            <th className="w-12 px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u, i) => (
            <UserRow
              key={u.id}
              user={u}
              index={i}
              menuOpen={openMenuId === u.id}
              onMenuToggle={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
              onEdit={() => onEdit(u)}
              onToggleStatus={() => onToggleStatus(u)}
              onDelete={() => onDelete(u)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({
  user, index, menuOpen, onMenuToggle, onEdit, onToggleStatus, onDelete,
}: {
  user: PenggunaRecord;
  index: number;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const role = ROLE_CFG[user.role];
  const status = STATUS_CFG[user.status];
  const initials = user.nama
    .replace(/^dr\.\s+/i, "")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <motion.tr
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.3) }}
      className="transition-colors hover:bg-slate-50/60"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-black text-slate-600">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-800">{user.nama}</p>
            <p className="truncate font-mono text-[10px] text-slate-400">
              @{user.username} · {user.email}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", role.bg, role.text)}>
          {role.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex max-w-[180px] flex-wrap gap-1">
          {user.unitAssignment.slice(0, 2).map((kode) => (
            <span key={kode} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
              {getUnitNama(kode)}
            </span>
          ))}
          {user.unitAssignment.length > 2 && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
              +{user.unitAssignment.length - 2}
            </span>
          )}
          {user.unitAssignment.length === 0 && (
            <span className="text-[10px] italic text-slate-400">tidak ada</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", status.bg, status.text)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          {status.label}
        </span>
      </td>
      <td className="px-4 py-3 text-[10px] text-slate-500">
        {fmtRelative(user.lastLogin)}
      </td>
      <td className="relative px-4 py-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle();
          }}
          aria-label="Aksi"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <MoreVertical size={13} />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-4 top-9 z-30 flex w-44 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
              role="menu"
            >
              <MenuItem icon={Pencil} label="Edit" onClick={onEdit} />
              <MenuItem
                icon={user.status === "Aktif" ? UserX : UserCog}
                label={user.status === "Aktif" ? "Suspend Akun" : "Aktifkan Akun"}
                onClick={onToggleStatus}
              />
              <div className="border-t border-slate-100" />
              <MenuItem icon={Trash2} label="Hapus" onClick={onDelete} danger />
            </motion.div>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
}

function MenuItem({
  icon: Icon, label, onClick, danger,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium transition",
        danger
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-700 hover:bg-slate-50",
      )}
    >
      <Icon size={11} />
      {label}
    </button>
  );
}

function EmptyTable() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <Users size={20} className="text-slate-400" />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-700">Tidak ada pengguna</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Tidak ada hasil dengan filter yang dipilih
        </p>
      </div>
    </div>
  );
}
