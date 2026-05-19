"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Building2 } from "lucide-react";
import { type AnyNode, getChildren, countAllBeds } from "./ruanganShared";
import TreeNode, { type AddKind } from "./TreeNode";

interface TreePanelProps {
  nodes: AnyNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddRoot: () => void;
  onAddChild: (parent: AnyNode, kind: AddKind) => void;
}

export default function TreePanel({
  nodes, selectedId, onSelect, onAddRoot, onAddChild,
}: TreePanelProps) {
  const [search, setSearch] = useState("");

  const rootNodes = useMemo(() => getChildren(nodes, null), [nodes]);

  // Filter — flatten matching node ids + their ancestors
  const visibleIds = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const matched = nodes.filter((n) =>
      n.name.toLowerCase().includes(q) ||
      (("kode" in n) && n.kode.toLowerCase().includes(q)),
    );
    const ids = new Set<string>();
    for (const m of matched) {
      ids.add(m.id);
      let cur: AnyNode | undefined = m;
      while (cur?.parentId) {
        ids.add(cur.parentId);
        cur = nodes.find((n) => n.id === cur!.parentId);
      }
    }
    return ids;
  }, [nodes, search]);

  const filteredNodes = useMemo(() => {
    if (!visibleIds) return nodes;
    return nodes.filter((n) => visibleIds.has(n.id));
  }, [nodes, visibleIds]);

  const totalUnits = nodes.filter((n) => n.type === "Organization").length;
  const totalLoc = nodes.filter((n) => n.type === "Location").length;
  const totalBeds = countAllBeds(nodes);
  const totalInactive = nodes.filter((n) => n.type === "Organization" && !n.active).length;

  return (
    <aside className="flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-[360px] lg:shrink-0">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-xs font-bold text-slate-800">Hirarki Organisasi</p>
          <p className="text-[10px] text-slate-400">
            {totalUnits} unit · {totalLoc} ruangan · {totalBeds} bed
            {totalInactive > 0 && <> · <span className="text-slate-500">{totalInactive} non-aktif</span></>}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddRoot}
          title="Tambah Unit langsung di bawah RS Induk"
          className="flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]"
        >
          <Plus size={11} />
          Unit
        </button>
      </div>

      {/* Search */}
      <div className="shrink-0 px-3 pb-2 pt-3">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari unit / ruangan..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 text-[11px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 pt-1">
        {rootNodes.length === 0 ? (
          <EmptyState onAddRoot={onAddRoot} />
        ) : visibleIds && visibleIds.size === 0 ? (
          <p className="px-3 py-8 text-center text-[11px] text-slate-400">
            Tidak ada hasil untuk &quot;{search}&quot;
          </p>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col"
          >
            {getChildren(filteredNodes, null).map((root) => (
              <TreeNode
                key={root.id}
                node={root}
                nodes={filteredNodes}
                depth={0}
                selectedId={selectedId}
                onSelect={onSelect}
                onAddChild={onAddChild}
              />
            ))}
          </motion.div>
        )}
      </div>

    </aside>
  );
}

function EmptyState({ onAddRoot }: { onAddRoot: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 ring-4 ring-teal-100">
        <Building2 size={20} className="text-teal-600" />
      </span>
      <div>
        <p className="text-xs font-semibold text-slate-700">Belum ada unit</p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          Mulai dengan menambahkan unit / departemen pertama
        </p>
      </div>
      <button
        type="button"
        onClick={onAddRoot}
        className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-teal-700"
      >
        <Plus size={12} />
        Tambah Unit
      </button>
    </div>
  );
}
