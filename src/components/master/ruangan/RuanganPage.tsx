"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, BedSingle, DoorOpen, AlertTriangle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { RS_ROOT_ID } from "@/lib/master/rsConfig";
import {
  type AnyNode, type OrganizationNode, type LocationNode, type BedSubRecord,
  newId, getNodeById, isRSRoot, countAllBeds, genKode, unitKodes, ruanganKodes,
} from "./ruanganShared";
import * as ruanganApi from "@/lib/api/ruangan";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import TreePanel from "./TreePanel";
import DetailPanel from "./DetailPanel";
import ConfirmDialog from "./ConfirmDialog";
import type { AddKind } from "./TreeNode";

/** Pesan error aman dari server (envelope) untuk toast/alert. */
function errMsg(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return e instanceof Error ? e.message : "Terjadi kesalahan";
}

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
          <Bone className="h-3 w-64" />
        </div>
        <Bone className="h-8 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Bone className="h-[560px] w-full rounded-2xl lg:w-[360px]" />
        <Bone className="h-[560px] flex-1 rounded-2xl" />
      </div>
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

export default function RuanganPage() {
  const [nodes, setNodes] = useState<AnyNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnyNode | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Root RS asli dari pohon (UUID dari DB). Fallback RS_ROOT_ID bila pohon kosong.
  const rootId = useMemo(
    () => nodes.find((n) => n.type === "Organization" && (n as OrganizationNode).isRoot)?.id ?? RS_ROOT_ID,
    [nodes],
  );

  /** GET tree → state. Dipakai saat mount + resync pasca-mutasi (API-RULES §6.1). */
  const reload = useCallback(async (signal?: AbortSignal): Promise<AnyNode[]> => {
    const tree = await ruanganApi.getTree(signal);
    setNodes(tree);
    return tree;
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void (async () => {
      try {
        const tree = await reload(ac.signal);
        const root = tree.find((n) => n.type === "Organization" && (n as OrganizationNode).isRoot);
        setSelectedId((cur) => cur ?? root?.id ?? null);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) setLoadError(errMsg(e));
      } finally {
        setLoaded(true);
      }
    })();
    return () => ac.abort();
  }, [reload]);

  const selected = selectedId ? getNodeById(nodes, selectedId) ?? null : null;

  const stats = useMemo(() => {
    const units = nodes.filter((n) => n.type === "Organization" && !isRSRoot(n)).length;
    const unitsActive = nodes.filter((n) => n.type === "Organization" && !isRSRoot(n) && n.active).length;
    const rooms = nodes.filter((n) => n.type === "Location").length;
    const beds = countAllBeds(nodes);
    const bedsActive = nodes.reduce(
      (sum, n) => sum + (n.type === "Location" ? n.beds.filter((b) => b.status === "active").length : 0),
      0,
    );
    return { units, unitsActive, rooms, beds, bedsActive };
  }, [nodes]);

  /** Refetch tree lalu pilih node id tertentu (mis. node baru hasil create). */
  const reloadAndSelect = useCallback(async (id: string | null) => {
    await reload();
    if (id) setSelectedId(id);
  }, [reload]);

  // ── Mutations (wired) ──
  // Draft (version undefined) → POST create. Existing → PATCH (+ rekonsiliasi bed granular).
  const applySave = useCallback(async (next: AnyNode) => {
    if (next.type === "Organization") {
      const saved = next.version === undefined
        ? await ruanganApi.createUnit(next)
        : await ruanganApi.updateUnit(next);
      await reloadAndSelect(saved.id);
      return;
    }

    // Location
    if (next.version === undefined) {
      const created = await ruanganApi.createRuangan(next);
      for (const b of next.beds) await ruanganApi.addBed(created.id, b); // kapasitas sudah di-set
      await reloadAndSelect(created.id);
      return;
    }

    // Existing ruangan — diff bed dgn keadaan tersimpan. Urutan capacity-safe:
    //   delete (bebaskan slot) → PATCH ruangan (kapasitas) → update bed → add bed.
    const prev = getNodeById(nodes, next.id);
    const prevBeds = prev && prev.type === "Location" ? prev.beds : [];
    const nextIds = new Set(next.beds.map((b) => b.id));
    const prevById = new Map(prevBeds.map((b) => [b.id, b]));

    for (const b of prevBeds.filter((b) => !nextIds.has(b.id))) await ruanganApi.deleteBed(b.id);

    await ruanganApi.updateRuangan(next);

    const added: BedSubRecord[] = [];
    for (const b of next.beds) {
      const before = prevById.get(b.id);
      if (!before) { added.push(b); continue; } // bed baru (id sementara)
      if (before.name !== b.name || before.kode !== b.kode || before.status !== b.status) {
        await ruanganApi.updateBed(b);
      }
    }
    for (const b of added) await ruanganApi.addBed(next.id, b);
    await reloadAndSelect(next.id);
  }, [nodes, reloadAndSelect]);

  const handleSave = useCallback(async (next: AnyNode) => {
    const isCreate = next.version === undefined;
    const kind = next.type === "Organization" ? "Unit" : "Ruangan";
    try {
      await applySave(next);
      toast.success(isCreate ? `${kind} dibuat` : "Perubahan disimpan", next.name);
    } catch (e) {
      toast.error("Gagal menyimpan", errMsg(e)); // CONFLICT_VERSION / VALIDATION / kode dobel
      if (!isCreate) await reload(); // resync existing; create → pertahankan draft utk diperbaiki
      throw e; // biar form pertahankan `dirty` → bisa retry
    }
  }, [applySave, reload]);

  // Hapus 2-tahap: minta konfirmasi (ConfirmDialog) → eksekusi.
  const requestDelete = useCallback((target: AnyNode) => {
    if (isRSRoot(target)) return; // root read-only
    setDeleteTarget(target);
  }, []);

  const performDelete = useCallback(async () => {
    const target = deleteTarget;
    if (!target) return;
    const kind = target.type === "Organization" ? "Unit" : "Ruangan";

    // Draft (belum tersimpan) → cukup buang dari state lokal.
    if (target.version === undefined) {
      setNodes((prev) => prev.filter((n) => n.id !== target.id));
      if (selectedId === target.id) setSelectedId(rootId);
      setDeleteTarget(null);
      toast.success(`${kind} dibatalkan`, target.name);
      return;
    }
    setDeleting(true);
    try {
      if (target.type === "Organization") await ruanganApi.deleteUnit(target.id, target.version);
      else await ruanganApi.deleteRuangan(target.id, target.version);
      await reload();
      if (selectedId === target.id) setSelectedId(rootId);
      toast.success(`${kind} dihapus`, target.name);
      setDeleteTarget(null);
    } catch (e) {
      toast.error("Gagal menghapus", errMsg(e)); // FORBIDDEN_STATE (masih punya anak/bed) / CONFLICT_VERSION
      await reload();
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, selectedId, rootId, reload]);

  /** "+ Unit" di header tree — selalu tambah Unit langsung di bawah RS Induk */
  const handleAddRoot = () => {
    const newNode: OrganizationNode = {
      id: newId("org"),
      type: "Organization",
      name: "Unit Baru",
      kode: genKode("UN", unitKodes(nodes)),
      orgType: "dept",
      active: true,
      telp: "",
      alamat: {
        jalan: "", kelurahan: "", kecamatan: "", kota: "", provinsi: "", kodePos: "", kodeWilayah: "",
      },
      parentId: rootId,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedId(newNode.id);
  };

  /** "+" pada Organization → menu pilih Sub-Unit atau Ruangan */
  const handleAddChild = (parent: AnyNode, kind: AddKind) => {
    if (parent.type !== "Organization") return;

    if (kind === "sub-org") {
      const newNode: OrganizationNode = {
        id: newId("org"),
        type: "Organization",
        name: "Sub-Unit Baru",
        kode: genKode("UN", unitKodes(nodes)),
        orgType: "dept",
        active: true,
        telp: "",
        alamat: { ...parent.alamat },
        parentId: parent.id,
      };
      setNodes((prev) => [...prev, newNode]);
      setSelectedId(newNode.id);
      return;
    }

    // kind === "location"
    const newNode: LocationNode = {
      id: newId("loc"),
      type: "Location",
      name: "Ruangan Baru",
      kode: genKode("R", ruanganKodes(nodes)),
      locationType: "Rawat_Inap",
      kelas: "—",
      kapasitas: 4,
      parentId: parent.id,
      beds: [],
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedId(newNode.id);
  };

  return (
    <>
      <AnimatePresence mode="wait">
      {!loaded ? (
        <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
          <PageSkeleton />
        </motion.div>
      ) : loadError ? (
        <motion.div
          key="err"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-4 ring-rose-100">
            <AlertTriangle size={22} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">Gagal memuat data ruangan</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{loadError}</p>
          </div>
          <button
            type="button"
            onClick={() => { setLoaded(false); setLoadError(null); void reload().catch((e) => setLoadError(errMsg(e))).finally(() => setLoaded(true)); }}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]"
          >
            <RotateCw size={12} />
            Coba Lagi
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex h-full flex-col gap-4 p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-600">
                EHIS Master
              </p>
              <h1 className="mt-0.5 text-base font-bold text-slate-900">Unit & Ruangan</h1>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Kelola hirarki <span className="font-semibold">RS Induk → Unit (nested) → Ruangan</span>.{" "}
                Bed dikelola di panel ruangan.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              icon={Building2}
              label="Unit / Departemen"
              value={`${stats.units}`}
              sub={`${stats.unitsActive} aktif`}
              iconCls="bg-teal-100 text-teal-600"
              delay={0}
            />
            <StatCard
              icon={DoorOpen}
              label="Ruangan"
              value={`${stats.rooms}`}
              sub="lintas semua unit"
              iconCls="bg-sky-100 text-sky-600"
              delay={0.07}
            />
            <StatCard
              icon={BedSingle}
              label="Bed Terdaftar"
              value={`${stats.beds}`}
              sub={`${stats.bedsActive} aktif siap pakai`}
              iconCls="bg-amber-100 text-amber-600"
              delay={0.14}
            />
          </div>

          {/* Two-panel */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
            <TreePanel
              nodes={nodes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAddRoot={handleAddRoot}
              onAddChild={handleAddChild}
            />
            <DetailPanel
              selected={selected}
              nodes={nodes}
              onSave={handleSave}
              onDelete={requestDelete}
            />
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteTarget !== null}
        kindLabel={deleteTarget?.type === "Organization" ? "Unit" : "Ruangan"}
        name={deleteTarget?.name ?? ""}
        kode={deleteTarget?.kode}
        icon={deleteTarget?.type === "Organization" ? Building2 : DoorOpen}
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => { if (!deleting) setDeleteTarget(null); }}
      />
    </>
  );
}
