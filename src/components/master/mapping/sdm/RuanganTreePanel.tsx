"use client";

// Panel kiri SDM Assignment — TREE penuh dari Master Ruangan: Unit (Organization) sebagai header
// collapsible, Ruangan (Location) sebagai baris terpilih (target penugasan SDM). Bed tidak jadi
// node (penugasan = level ruangan) tapi jumlahnya ditampilkan sebagai meta. Search memfilter
// ruangan + auto-expand. Identitas assignment = `kode` ruangan.

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Building2, DoorOpen, ChevronRight, BedDouble } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isRSRoot, type AnyNode, type LocationNode, type OrganizationNode,
} from "@/components/master/ruangan/ruanganShared";
import type { AssignmentMap } from "./sdmShared";
import { countSDMPerUnit } from "./sdmShared";

interface RuanganTreePanelProps {
  nodes: AnyNode[];
  assignments: AssignmentMap;
  selectedKode: string | null;
  onSelect: (kode: string) => void;
}

export default function RuanganTreePanel({
  nodes, assignments, selectedKode, onSelect,
}: RuanganTreePanelProps) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // parentId → children (Organization dulu, lalu Location; alfabet nama).
  const { childrenOf, rootChildren } = useMemo(() => {
    const map = new Map<string | null, AnyNode[]>();
    for (const n of nodes) {
      if (n.type === "Location" && n.active === false) continue; // selaras ruanganFromTree
      const pid = n.parentId ?? null;
      const arr = map.get(pid);
      if (arr) arr.push(n);
      else map.set(pid, [n]);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        if (a.type !== b.type) return a.type === "Organization" ? -1 : 1;
        return a.name.localeCompare(b.name, "id");
      });
    }
    const root = nodes.find((n) => n.type === "Organization" && isRSRoot(n));
    const rootChildren = (root ? map.get(root.id) : undefined) ?? map.get(null) ?? [];
    return { childrenOf: map, rootChildren };
  }, [nodes]);

  // Count SDM per ruangan + maksimum (untuk lebar progress bar).
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nodes) {
      if (n.type === "Location" && n.active !== false) m.set(n.kode, countSDMPerUnit(assignments, n.kode));
    }
    return m;
  }, [nodes, assignments]);
  const maxCount = useMemo(() => Math.max(1, ...counts.values()), [counts]);
  const totalRuangan = counts.size;

  const q = search.trim().toLowerCase();

  const matchesLoc = (loc: LocationNode) =>
    !q || loc.name.toLowerCase().includes(q) || loc.kode.toLowerCase().includes(q);

  const orgHasMatch = (orgId: string): boolean => {
    const kids = childrenOf.get(orgId) ?? [];
    return kids.some((k) => (k.type === "Location" ? matchesLoc(k) : orgHasMatch(k.id)));
  };

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function renderNodes(list: AnyNode[], depth: number): React.ReactNode[] {
    const out: React.ReactNode[] = [];
    for (const node of list) {
      if (node.type === "Organization") {
        if (q && !orgHasMatch(node.id)) continue;
        const kids = childrenOf.get(node.id) ?? [];
        const isCollapsed = !q && collapsed.has(node.id);
        const childLocs = countDescendantLocs(node.id);
        out.push(
          <OrgRow
            key={node.id}
            org={node}
            depth={depth}
            collapsed={isCollapsed}
            childCount={childLocs}
            onToggle={() => toggle(node.id)}
          />,
        );
        if (!isCollapsed) out.push(...renderNodes(kids, depth + 1));
      } else {
        if (!matchesLoc(node)) continue;
        out.push(
          <LocRow
            key={node.id}
            loc={node}
            depth={depth}
            count={counts.get(node.kode) ?? 0}
            maxCount={maxCount}
            selected={selectedKode === node.kode}
            onClick={() => onSelect(node.kode)}
          />,
        );
      }
    }
    return out;
  }

  function countDescendantLocs(orgId: string): number {
    const kids = childrenOf.get(orgId) ?? [];
    let n = 0;
    for (const k of kids) n += k.type === "Location" ? 1 : countDescendantLocs(k.id);
    return n;
  }

  return (
    <aside className="flex h-full w-full shrink-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-[300px]">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-3 py-2.5">
        <p className="m-xs font-bold text-slate-800">Unit & Ruangan</p>
        <p className="m-tiny text-slate-400">{totalRuangan} ruangan · pilih untuk kelola SDM</p>
      </div>

      {/* Search */}
      <div className="shrink-0 px-2.5 pb-2 pt-2.5">
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari ruangan..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {rootChildren.length === 0 ? (
          <p className="px-3 py-8 text-center m-xs text-slate-400">Belum ada unit / ruangan</p>
        ) : (
          (() => {
            const rendered = renderNodes(rootChildren, 0);
            return rendered.length === 0 ? (
              <p className="px-3 py-8 text-center m-xs text-slate-400">Tidak ada ruangan cocok</p>
            ) : (
              <div className="flex flex-col gap-0.5">{rendered}</div>
            );
          })()
        )}
      </div>
    </aside>
  );
}

// ── Org header row ───────────────────────────────────────
function OrgRow({
  org, depth, collapsed, childCount, onToggle,
}: {
  org: OrganizationNode;
  depth: number;
  collapsed: boolean;
  childCount: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{ paddingLeft: depth * 12 + 6 }}
      className="group flex w-full items-center gap-1.5 rounded-lg py-1.5 pr-2 text-left transition-colors hover:bg-slate-50"
    >
      <ChevronRight
        size={13}
        className={cn("shrink-0 text-slate-400 transition-transform", !collapsed && "rotate-90")}
      />
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <Building2 size={11} />
      </span>
      <span className="min-w-0 flex-1 truncate m-xs font-bold uppercase tracking-wide text-slate-600">
        {org.name}
      </span>
      <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 m-mini font-semibold text-slate-400">
        {childCount}
      </span>
    </button>
  );
}

// ── Ruangan (Location) selectable row ────────────────────
function LocRow({
  loc, depth, count, maxCount, selected, onClick,
}: {
  loc: LocationNode;
  depth: number;
  count: number;
  maxCount: number;
  selected: boolean;
  onClick: () => void;
}) {
  const pct = Math.round((count / maxCount) * 100);
  const bedCount = loc.beds?.length ?? 0;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
      style={{ paddingLeft: depth * 12 + 8 }}
      className={cn(
        "group flex w-full items-center gap-2 rounded-lg py-2 pr-2 text-left transition-colors",
        selected ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-slate-50",
      )}
    >
      <span className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
        selected ? "bg-teal-200 text-teal-700" : "bg-sky-50 text-sky-600",
      )}>
        <DoorOpen size={12} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={cn("truncate m-xs font-semibold", selected ? "text-teal-800" : "text-slate-800")}>
            {loc.name}
          </p>
          {bedCount > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 m-mini text-slate-400">
              <BedDouble size={9} /> {bedCount}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={cn("h-full", count > 0 ? "bg-teal-500" : "bg-slate-200")}
            />
          </div>
          <span className={cn(
            "shrink-0 font-mono m-mini font-semibold",
            count > 0 ? "text-teal-700" : "text-slate-400",
          )}>
            {count}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
