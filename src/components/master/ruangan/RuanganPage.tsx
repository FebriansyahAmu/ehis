"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, BedSingle, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { RS_ROOT_ID } from "@/lib/master/rsConfig";
import {
  type AnyNode, type OrganizationNode, type LocationNode,
  RUANGAN_MOCK, newId, getNodeById, isRSRoot, countAllBeds,
} from "./ruanganShared";
import TreePanel from "./TreePanel";
import DetailPanel from "./DetailPanel";
import type { AddKind } from "./TreeNode";

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
  const [nodes, setNodes] = useState<AnyNode[]>(RUANGAN_MOCK);
  const [selectedId, setSelectedId] = useState<string | null>(RS_ROOT_ID);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(t);
  }, []);

  const selected = selectedId ? getNodeById(nodes, selectedId) ?? null : null;

  const stats = useMemo(() => {
    const units = nodes.filter((n) => n.type === "Organization" && n.id !== RS_ROOT_ID).length;
    const unitsActive = nodes.filter((n) => n.type === "Organization" && n.id !== RS_ROOT_ID && n.active).length;
    const rooms = nodes.filter((n) => n.type === "Location").length;
    const beds = countAllBeds(nodes);
    const bedsActive = nodes.reduce(
      (sum, n) => sum + (n.type === "Location" ? n.beds.filter((b) => b.status === "active").length : 0),
      0,
    );
    return { units, unitsActive, rooms, beds, bedsActive };
  }, [nodes]);

  // ── Mutations ──
  const handleSave = (next: AnyNode) => {
    setNodes((prev) => prev.map((n) => (n.id === next.id ? next : n)));
  };

  const handleDelete = (target: AnyNode) => {
    if (isRSRoot(target)) return; // protected
    if (!confirm(`Hapus "${target.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setNodes((prev) => prev.filter((n) => n.id !== target.id));
    if (selectedId === target.id) setSelectedId(null);
  };

  /** "+ Unit" di header tree — selalu tambah Unit langsung di bawah RS Induk */
  const handleAddRoot = () => {
    const newNode: OrganizationNode = {
      id: newId("org"),
      type: "Organization",
      name: "Unit Baru",
      kode: "",
      orgType: "dept",
      active: true,
      telp: "",
      alamat: {
        jalan: "", kelurahan: "", kecamatan: "", kota: "", provinsi: "", kodePos: "", kodeWilayah: "",
      },
      parentId: RS_ROOT_ID,
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
        kode: "",
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
      kode: "",
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
              onDelete={handleDelete}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
