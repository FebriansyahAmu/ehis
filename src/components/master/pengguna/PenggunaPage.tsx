"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserCheck, UserCog, Search, Plus, Pencil, Trash2,
  MoreVertical, Shield, UserX, ChevronDown, UserPlus, Stethoscope, IdCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePopover } from "@/components/shared/inputs/popoverShared";
import {
  type PenggunaRecord, type UserRole, type UserStatus, type PegawaiLite,
  type PegawaiFormData, type AkunData,
  PEGAWAI_MOCK, ROLE_CFG, STATUS_CFG, UNIT_LIST,
  fmtRelative, getUnitNama, pegawaiFormToLite, namaTampilPegawai,
} from "./penggunaShared";
import { createPegawai, listPegawai, type PegawaiListItemDTO } from "@/lib/api/pegawai";
import { createUser, assignRoles, listUsers, userDtoToRecord, type UserListItemDTO } from "@/lib/api/users";
import PenggunaFormModal from "./PenggunaFormModal";
import PegawaiEditModal from "./PegawaiEditModal";

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

export default function PenggunaPage({
  initialUsers = [],
  initialPegawai = [],
  prefetched = false,
}: {
  /** Akun (DTO) hasil SSR — dipetakan ke PenggunaRecord saat seed (API-RULES §6.1). */
  initialUsers?: UserListItemDTO[];
  /** Pegawai (DTO) hasil SSR — disaring jadi baris "tanpa akun" saat seed. */
  initialPegawai?: PegawaiListItemDTO[];
  /** true = data awal datang dari SSR → lewati skeleton & fetch saat mount. */
  prefetched?: boolean;
} = {}) {
  // Akun = data real dari API (dbUsers). `users` hanya menampung baris optimistic (pra-refresh).
  const [users, setUsers] = useState<PenggunaRecord[]>([]);
  const [pegawaiList, setPegawaiList] = useState<PegawaiLite[]>(PEGAWAI_MOCK);
  // Akun real — seed dari SSR (UserListItemDTO → PenggunaRecord), lalu di-refresh client pasca-mutasi.
  const [dbUsers, setDbUsers] = useState<PenggunaRecord[]>(() => initialUsers.map(userDtoToRecord));
  // Pegawai tanpa akun login (baris kuning) — seed dari SSR.
  const [pegawaiNoAccount, setPegawaiNoAccount] = useState<PegawaiListItemDTO[]>(
    () => initialPegawai.filter((p) => !p.punyaAkun),
  );
  const [loaded, setLoaded] = useState(prefetched);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PenggunaRecord | null>(null);
  // "Buatkan Akun" untuk pegawai existing (baris kuning) → wizard mulai Step 2.
  const [provisionTarget, setProvisionTarget] = useState<PegawaiListItemDTO | null>(null);
  // "Ubah Data Pegawai" → modal edit detail pegawai (by id).
  const [editPegawaiId, setEditPegawaiId] = useState<string | null>(null);

  useEffect(() => {
    if (prefetched) return; // SSR → konten sudah siap, tak perlu skeleton
    const t = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(t);
  }, [prefetched]);

  // GET /api/v1/master/pegawai → pegawai yang belum punya akun (baris kuning). Gagal = diam
  // (tabel akun tetap tampil). Dipanggil saat mount + tiap modal ditutup (refresh pasca-provisioning).
  const refreshPegawai = useCallback(async (signal?: AbortSignal) => {
    try {
      const { items } = await listPegawai({ aktif: "true", limit: 50 }, signal);
      setPegawaiNoAccount(items.filter((p) => !p.punyaAkun));
    } catch {
      /* abaikan — endpoint mungkin belum siap / dibatalkan */
    }
  }, []);

  // GET /api/v1/auth/users → akun real (sudah dipetakan ke PenggunaRecord).
  const refreshUsers = useCallback(async (signal?: AbortSignal) => {
    try {
      const { items } = await listUsers({ limit: 50 }, signal);
      setDbUsers(items);
    } catch {
      /* abaikan */
    }
  }, []);

  useEffect(() => {
    if (prefetched) return; // data awal dari SSR (API-RULES §6.1) — refresh hanya pasca-mutasi modal
    const ac = new AbortController();
    void (async () => { await Promise.all([refreshPegawai(ac.signal), refreshUsers(ac.signal)]); })();
    return () => ac.abort();
  }, [prefetched, refreshPegawai, refreshUsers]);

  // Gabung akun real (DB) + demo mock; dedupe by id (real menang). Id-space disjoint → praktis concat.
  const allUsers = useMemo(() => {
    const byId = new Map<string, PenggunaRecord>();
    for (const u of dbUsers) byId.set(u.id, u);
    for (const u of users) if (!byId.has(u.id)) byId.set(u.id, u);
    return Array.from(byId.values());
  }, [dbUsers, users]);

  const filtered = useMemo(() => {
    return allUsers.filter((u) => {
      if (roleFilter !== "all" && !u.roles.includes(roleFilter)) return false;
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
  }, [allUsers, roleFilter, statusFilter, unitFilter, search]);

  // Baris pegawai-tanpa-akun: hanya tampil saat filter peran/status/unit = "Semua" (mereka tak
  // punya peran/status akun/unit-assignment), tetap hormati pencarian (nama/NIP).
  const filteredPegawai = useMemo(() => {
    if (roleFilter !== "all" || statusFilter !== "all" || unitFilter !== "all") return [];
    if (!search.trim()) return pegawaiNoAccount;
    const q = search.toLowerCase();
    return pegawaiNoAccount.filter(
      (p) => p.namaTampil.toLowerCase().includes(q) || p.nip.toLowerCase().includes(q),
    );
  }, [pegawaiNoAccount, roleFilter, statusFilter, unitFilter, search]);

  const stats = useMemo(() => {
    const total = allUsers.length;
    const aktif = allUsers.filter((u) => u.status === "Aktif").length;
    const admin = allUsers.filter((u) => u.roles.includes("Admin")).length;
    return { total, aktif, admin };
  }, [allUsers]);

  const handleNewClick = () => {
    setEditTarget(null);
    setProvisionTarget(null);
    setModalOpen(true);
  };

  const handleEdit = (user: PenggunaRecord) => {
    setProvisionTarget(null);
    setEditTarget(user);
    setModalOpen(true);
  };

  // "Buatkan Akun" dari baris kuning → wizard provisioning (pegawai sudah ada).
  const handleProvision = (pegawai: PegawaiListItemDTO) => {
    setEditTarget(null);
    setProvisionTarget(pegawai);
    setModalOpen(true);
  };

  // "Ubah Data Pegawai" → buka modal edit detail pegawai.
  const handleEditPegawai = (pegawaiId: string) => setEditPegawaiId(pegawaiId);

  // EDIT — perubahan akun (optimistic di kedua list; PATCH akun belum ada → revert saat refresh).
  const handleSubmit = (next: PenggunaRecord) => {
    setUsers((prev) => prev.map((u) => (u.id === next.id ? next : u)));
    setDbUsers((prev) => prev.map((u) => (u.id === next.id ? next : u)));
  };

  // ── Wizard Tambah Pengguna — tiap step "POST" terpisah ──
  // Step 1: buat Pegawai → POST /api/v1/master/pegawai (WIRED — server dedup NIK/NIP,
  // enkripsi NIK, kembalikan id asli). Error (CONFLICT/VALIDATION) dilempar → wizard tampilkan.
  const handleCreatePegawai = async (data: PegawaiFormData): Promise<string> => {
    const dto = await createPegawai(data);
    setPegawaiList((prev) => [pegawaiFormToLite(dto.id, data), ...prev]);
    return dto.id;
  };
  // Step 2: buat User tertaut pegawaiId → POST /api/v1/auth/users (WIRED — hash password,
  // username unik, 1 akun per pegawai). Login/JWT belum dibangun; ini provisioning saja.
  const handleCreateUser = async (pegawaiId: string, akun: AkunData): Promise<string> => {
    const dto = await createUser(pegawaiId, akun);
    const peg = pegawaiList.find((p) => p.id === pegawaiId);
    const rec: PenggunaRecord = {
      id: dto.id,
      pegawaiId,
      username: dto.username,
      nama: dto.namaTampil || (peg ? namaTampilPegawai(peg) : "—"),
      email: peg?.email ?? "",
      roles: [],
      unitAssignment: [],
      status: "Aktif",
      mustChangePassword: dto.mustChangePassword,
      lastLogin: null,
      createdAt: dto.createdAt,
      dokterId: peg?.isDokter ? `dr-${pegawaiId}` : undefined,
    };
    setUsers((prev) => [rec, ...prev]);
    return dto.id;
  };
  // Step 3: tetapkan peran + status → PATCH /api/v1/auth/users/:id/roles (WIRED — resolve key→Role).
  const handleAssignRoles = async (userId: string, roles: UserRole[], status: UserStatus): Promise<void> => {
    await assignRoles(userId, roles, status);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, roles, status } : u)));
  };

  const handleToggleStatus = (user: PenggunaRecord) => {
    const next: UserStatus = user.status === "Aktif" ? "Suspended" : "Aktif";
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: next } : u)));
    setDbUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: next } : u)));  };

  const handleDelete = (user: PenggunaRecord) => {
    if (!confirm(`Hapus pengguna "${user.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDbUsers((prev) => prev.filter((u) => u.id !== user.id));
    setUsers((prev) => prev.filter((u) => u.id !== user.id));  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={Users}     label="Total Pengguna" value={`${stats.total}`} sub={`${stats.aktif} aktif`}     iconCls="bg-teal-100 text-teal-600"     delay={0} />
              <StatCard icon={UserCheck} label="Aktif"          value={`${stats.aktif}`} sub="dapat login hari ini"        iconCls="bg-emerald-100 text-emerald-600" delay={0.07} />
              <StatCard icon={Shield}    label="Admin"          value={`${stats.admin}`} sub="akses penuh sistem"          iconCls="bg-rose-100 text-rose-600"     delay={0.14} />
              <StatCard icon={UserPlus}  label="Belum Berakun"  value={`${pegawaiNoAccount.length}`} sub="pegawai tanpa login" iconCls="bg-amber-100 text-amber-600" delay={0.21} />
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
              {filtered.length === 0 && filteredPegawai.length === 0 ? (
                <EmptyTable />
              ) : (
                <UserTable
                  users={filtered}
                  pegawai={filteredPegawai}
                  onEdit={handleEdit}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDelete}
                  onProvision={handleProvision}
                  onEditPegawai={handleEditPegawai}
                />
              )}
              <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[10px] text-slate-500">
                Menampilkan {filtered.length} dari {allUsers.length} pengguna
                {filteredPegawai.length > 0 && (
                  <span className="ml-1 text-amber-600">· {filteredPegawai.length} pegawai tanpa akun</span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PenggunaFormModal
        open={modalOpen}
        initial={editTarget}
        provisionPegawai={
          provisionTarget && {
            id: provisionTarget.id,
            namaLengkap: provisionTarget.namaLengkap,
            namaTampil: provisionTarget.namaTampil,
            nip: provisionTarget.nip,
            email: null,
            unitKerja: provisionTarget.unitKerja,
            statusPegawai: provisionTarget.statusPegawai,
            isDokter: provisionTarget.isDokter,
          }
        }
        onClose={() => { setModalOpen(false); setProvisionTarget(null); void refreshPegawai(); void refreshUsers(); }}
        onSubmit={handleSubmit}
        onCreatePegawai={handleCreatePegawai}
        onCreateUser={handleCreateUser}
        onAssignRoles={handleAssignRoles}
      />

      <PegawaiEditModal
        open={editPegawaiId !== null}
        pegawaiId={editPegawaiId}
        onClose={() => setEditPegawaiId(null)}
        onSaved={() => { void refreshPegawai(); void refreshUsers(); }}
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
  users, pegawai, onEdit, onToggleStatus, onDelete, onProvision, onEditPegawai,
}: {
  users: PenggunaRecord[];
  pegawai: PegawaiListItemDTO[];
  onEdit: (u: PenggunaRecord) => void;
  onToggleStatus: (u: PenggunaRecord) => void;
  onDelete: (u: PenggunaRecord) => void;
  onProvision: (p: PegawaiListItemDTO) => void;
  onEditPegawai: (pegawaiId: string) => void;
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
              onEdit={() => onEdit(u)}
              onToggleStatus={() => onToggleStatus(u)}
              onDelete={() => onDelete(u)}
              onEditPegawai={() => onEditPegawai(u.pegawaiId)}
            />
          ))}
          {pegawai.map((p, i) => (
            <PegawaiRow
              key={p.id}
              pegawai={p}
              index={users.length + i}
              onProvision={() => onProvision(p)}
              onEditPegawai={() => onEditPegawai(p.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Baris pegawai yang BARU DIDAFTARKAN (belum punya akun login) — latar kuning soft.
function PegawaiRow({
  pegawai, index, onProvision, onEditPegawai,
}: {
  pegawai: PegawaiListItemDTO;
  index: number;
  onProvision: () => void;
  onEditPegawai: () => void;
}) {
  const initials = pegawai.namaLengkap
    .replace(/^(dr|drg|prof|ns|apt)\.?\s+/i, "")
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
      className="bg-amber-50/70 transition-colors hover:bg-amber-100/60"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[10px] font-black text-amber-700">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-bold text-slate-800">{pegawai.namaTampil}</p>
              {pegawai.isDokter && <Stethoscope size={11} className="shrink-0 text-amber-500" />}
            </div>
            <p className="truncate font-mono text-[10px] text-slate-400">
              NIP {pegawai.nip}{pegawai.profesi ? ` · ${pegawai.profesi}` : ""}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          <IdCard size={10} /> Belum punya akun
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
          {pegawai.unitKerja || "—"}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Hanya pegawai
        </span>
      </td>
      <td className="px-4 py-3 text-[10px] italic text-slate-400">belum pernah</td>
      <td className="px-4 py-3">
        <RowActionsMenu tone="amber">
          <MenuItem icon={UserPlus} label="Buatkan Akun" onClick={onProvision} />
          <MenuItem icon={Pencil} label="Ubah Data Pegawai" onClick={onEditPegawai} />
        </RowActionsMenu>
      </td>
    </motion.tr>
  );
}

function UserRow({
  user, index, onEdit, onToggleStatus, onDelete, onEditPegawai,
}: {
  user: PenggunaRecord;
  index: number;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onEditPegawai: () => void;
}) {
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
        <div className="flex max-w-[200px] flex-wrap gap-1">
          {user.roles.slice(0, 2).map((r) => {
            const c = ROLE_CFG[r];
            return (
              <span key={r} className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", c.bg, c.text)}>
                {c.label}
              </span>
            );
          })}
          {user.roles.length > 2 && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
              +{user.roles.length - 2}
            </span>
          )}
        </div>
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
      <td className="px-4 py-3">
        <RowActionsMenu>
          <MenuItem icon={Pencil} label="Edit Akun" onClick={onEdit} />
          <MenuItem icon={IdCard} label="Ubah Data Pegawai" onClick={onEditPegawai} />
          <MenuItem
            icon={user.status === "Aktif" ? UserX : UserCog}
            label={user.status === "Aktif" ? "Suspend Akun" : "Aktifkan Akun"}
            onClick={onToggleStatus}
          />
          <div className="border-t border-slate-100" />
          <MenuItem icon={Trash2} label="Hapus" onClick={onDelete} danger />
        </RowActionsMenu>
      </td>
    </motion.tr>
  );
}

// Menu aksi baris (titik-tiga). Di-render via PORTAL + position:fixed (usePopover) agar
// LEPAS dari wrapper tabel ber-`overflow` → tak terpotong / tak menambah scrollbar.
function RowActionsMenu({
  tone = "slate", children,
}: {
  tone?: "slate" | "amber";
  children: React.ReactNode;
}) {
  const { open, setOpen, mounted, coords, triggerRef, popRef } = usePopover(176, 160);
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Aksi"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition",
          tone === "amber"
            ? "text-amber-500 hover:bg-amber-200/60 hover:text-amber-700"
            : "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
        )}
      >
        <MoreVertical size={13} />
      </button>
      {mounted && createPortal(
        <AnimatePresence>
          {open && coords && (
            <motion.div
              ref={popRef}
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{ position: "fixed", top: coords.top, left: coords.left, width: 176, zIndex: 60 }}
              onClick={() => setOpen(false)}
              role="menu"
              className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-900/10 ring-1 ring-black/5"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
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
