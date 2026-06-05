"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MousePointer2 } from "lucide-react";
import { type AnyNode, getChildren, getNodeById } from "./ruanganShared";
import OrganizationForm from "./forms/OrganizationForm";
import LocationForm from "./forms/LocationForm";

interface DetailPanelProps {
  selected: AnyNode | null;
  nodes: AnyNode[];
  onSave: (node: AnyNode) => void | Promise<void>;
  onDelete: (node: AnyNode) => void | Promise<void>;
}

export default function DetailPanel({
  selected, nodes, onSave, onDelete,
}: DetailPanelProps) {
  return (
    <section className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-5 py-5">
        <AnimatePresence mode="wait">
          {!selected ? (
            <EmptySelection key="empty" />
          ) : (
            <motion.div
              key={`${selected.id}:${selected.version ?? "draft"}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {renderForm(selected, nodes, onSave, onDelete)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function renderForm(
  selected: AnyNode,
  nodes: AnyNode[],
  onSave: (node: AnyNode) => void | Promise<void>,
  onDelete: (node: AnyNode) => void | Promise<void>,
) {
  const childCount = getChildren(nodes, selected.id).length;

  if (selected.type === "Organization") {
    return (
      <OrganizationForm
        node={selected}
        nodes={nodes}
        childCount={childCount}
        onSave={onSave}
        onDelete={onDelete}
      />
    );
  }

  // Location
  const parent = getNodeById(nodes, selected.parentId);
  return (
    <LocationForm
      node={selected}
      parentName={parent?.name ?? "—"}
      nodes={nodes}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}

function EmptySelection() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[500px] flex-col items-center justify-center gap-3 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 ring-4 ring-teal-100">
        <MousePointer2 size={22} className="text-teal-600" />
      </span>
      <div className="max-w-xs">
        <p className="text-sm font-bold text-slate-800">Belum ada yang dipilih</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Pilih RS Induk, unit, atau ruangan di panel kiri untuk melihat dan mengedit
          detail. Bed dikelola di dalam ruangan.
        </p>
      </div>
    </motion.div>
  );
}
