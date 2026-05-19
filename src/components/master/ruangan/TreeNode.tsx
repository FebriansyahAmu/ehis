"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Building2, DoorOpen, Plus, Hospital,
  BedSingle, Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type AnyNode, type NodeType,
  NODE_CFG, getChildren, countDescendants, isRSRoot,
} from "./ruanganShared";

export type AddKind = "sub-org" | "location";

const ICON_MAP: Record<NodeType, React.ElementType> = {
  Organization: Building2,
  Location: DoorOpen,
};

interface TreeNodeProps {
  node: AnyNode;
  nodes: AnyNode[];
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parent: AnyNode, kind: AddKind) => void;
}

export default function TreeNode({
  node, nodes, depth, selectedId, onSelect, onAddChild,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isRoot = isRSRoot(node);
  const children = getChildren(nodes, node.id);
  const hasChildren = children.length > 0;
  const Icon = isRoot ? Hospital : ICON_MAP[node.type];
  const cfg = isRoot
    ? { iconBg: "bg-violet-50", iconText: "text-violet-600" }
    : NODE_CFG[node.type];
  const selected = selectedId === node.id;
  const inactive = node.type === "Organization" && !node.active;
  // Only Organization nodes can have children added (Location's beds are in panel)
  const canAddChild = node.type === "Organization";

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Sub-label per node type
  let subLabel: React.ReactNode = null;
  if (node.type === "Organization") {
    const total = countDescendants(nodes, node.id);
    subLabel = (
      <span className="text-[10px] text-slate-400">
        {isRoot ? "Org Root" : node.kode}
        {total > 0 && <> · {total} item</>}
      </span>
    );
  } else if (node.type === "Location") {
    subLabel = (
      <span className="flex items-center gap-1 text-[10px] text-slate-400">
        <span>{node.kode}</span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1 py-0.5 text-amber-700">
          <BedSingle size={8} />
          {node.beds.length}/{node.kapasitas}
        </span>
      </span>
    );
  }

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "group relative flex items-center gap-1.5 rounded-lg py-1.5 pr-2 transition-colors",
          selected ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-slate-50",
        )}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
      >
        {/* Expand chevron — fixed width slot */}
        <button
          type="button"
          onClick={() => hasChildren && setExpanded((e) => !e)}
          aria-label={hasChildren ? (expanded ? "Tutup" : "Buka") : undefined}
          disabled={!hasChildren}
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded transition",
            hasChildren ? "text-slate-400 hover:bg-slate-200 hover:text-slate-700" : "text-transparent",
          )}
        >
          <motion.span
            animate={{ rotate: expanded && hasChildren ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight size={12} />
          </motion.span>
        </button>

        {/* Click target — main body */}
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", cfg.iconBg)}>
            <Icon size={12} className={cfg.iconText} />
          </span>
          <span className="min-w-0 flex-1">
            <span className={cn(
              "block truncate text-xs font-semibold",
              inactive ? "text-slate-400 line-through" : "text-slate-800",
            )}>
              {node.name}
            </span>
            <span className="flex items-center gap-1.5">
              {subLabel}
              {inactive && (
                <span className="rounded-md bg-slate-100 px-1 py-0.5 text-[8px] font-bold uppercase text-slate-500">
                  Non-Aktif
                </span>
              )}
            </span>
          </span>
        </button>

        {/* Add child button + dropdown menu */}
        {canAddChild && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              title="Tambah child"
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-md transition-all",
                "text-slate-400 hover:bg-teal-100 hover:text-teal-700",
                selected || menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
              aria-label="Tambah child"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <Plus size={11} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  role="menu"
                  className="absolute right-0 top-6 z-30 flex w-44 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AddMenuItem
                    icon={DoorOpen}
                    label="Ruangan"
                    desc="Bangsal / kamar / poli"
                    onClick={() => { onAddChild(node, "location"); setMenuOpen(false); setExpanded(true); }}
                  />
                  <div className="border-t border-slate-100" />
                  <AddMenuItem
                    icon={Network}
                    label="Sub-Unit"
                    desc="Direktorat / instalasi"
                    onClick={() => { onAddChild(node, "sub-org"); setMenuOpen(false); setExpanded(true); }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Children — animated collapse */}
      <AnimatePresence initial={false}>
        {expanded && hasChildren && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                nodes={nodes}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                onAddChild={onAddChild}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-component ──

function AddMenuItem({
  icon: Icon, label, desc, onClick,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex items-start gap-2 px-3 py-2 text-left transition hover:bg-teal-50"
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
        <Icon size={11} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-800">{label}</p>
        <p className="mt-0.5 text-[9px] leading-tight text-slate-500">{desc}</p>
      </div>
    </button>
  );
}
