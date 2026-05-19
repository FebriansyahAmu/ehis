"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, CheckCheck, Square, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_CFG, type UserRole } from "@/components/master/pengguna/penggunaShared";
import {
  type RBACMap, type CrudAction,
  PERMISSION_TREE, ACTION_CFG, type PermissionLeaf, type PermissionModule,
  hasAction, countLeafGrants, countModuleGrants,
} from "./rbacShared";

interface PermissionMatrixProps {
  map: RBACMap;
  role: UserRole;
  search: string;
  onToggleAction: (leafKey: string, action: CrudAction) => void;
  onToggleLeaf: (leaf: PermissionLeaf, grant: boolean) => void;
  onToggleModule: (module: PermissionModule, grant: boolean) => void;
  onResetRole: () => void;
}

export default function PermissionMatrix({
  map, role, search,
  onToggleAction, onToggleLeaf, onToggleModule, onResetRole,
}: PermissionMatrixProps) {
  const cfg = ROLE_CFG[role];

  const filteredTree = search.trim()
    ? PERMISSION_TREE.map((m) => ({
        ...m,
        leaves: m.leaves.filter((l) =>
          l.label.toLowerCase().includes(search.toLowerCase()) ||
          l.key.toLowerCase().includes(search.toLowerCase()),
        ),
      })).filter((m) => m.leaves.length > 0)
    : PERMISSION_TREE;

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header strip */}
      <header className={cn("shrink-0 border-b border-slate-100 px-4 py-2.5", cfg.bg)}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className={cn("m-mini font-medium uppercase tracking-widest opacity-70", cfg.text)}>
              Permission untuk role
            </p>
            <h3 className={cn("m-base font-bold", cfg.text)}>{cfg.label}</h3>
          </div>
          <button
            type="button"
            onClick={onResetRole}
            className={cn(
              "rounded-md border bg-white/70 px-2.5 py-1 m-mini font-semibold transition hover:bg-white",
              cfg.text, "border-current/30",
            )}
          >
            Reset Default Role
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {filteredTree.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="m-sm text-slate-400">Tidak ada permission cocok pencarian</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTree.map((module) => (
              <ModuleAccordion
                key={module.key}
                module={module}
                map={map}
                role={role}
                onToggleAction={onToggleAction}
                onToggleLeaf={onToggleLeaf}
                onToggleModule={onToggleModule}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2 m-mini text-slate-500">
          <span className="font-semibold uppercase tracking-wide">Action:</span>
          {(["read", "create", "update", "delete", "export"] as CrudAction[]).map((a) => {
            const acfg = ACTION_CFG[a];
            return (
              <span key={a} className="inline-flex items-center gap-1">
                <span className={cn("flex h-4 w-4 items-center justify-center rounded font-bold m-mini", acfg.bg, acfg.text)}>
                  {acfg.short}
                </span>
                {acfg.label}
              </span>
            );
          })}
        </div>
      </footer>
    </section>
  );
}

// ── Sub-components ───────────────────────────────────────

function ModuleAccordion({
  module, map, role, onToggleAction, onToggleLeaf, onToggleModule,
}: {
  module: PermissionModule;
  map: RBACMap;
  role: UserRole;
  onToggleAction: (leafKey: string, action: CrudAction) => void;
  onToggleLeaf: (leaf: PermissionLeaf, grant: boolean) => void;
  onToggleModule: (module: PermissionModule, grant: boolean) => void;
}) {
  const count = countModuleGrants(map, role, module);
  const allGranted = count.granted === count.total;
  const someGranted = count.granted > 0;
  const [expanded, setExpanded] = useState(someGranted);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          {expanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
          <Folder size={12} className="text-slate-500" />
          <span className="m-xs font-bold text-slate-800">{module.label}</span>
          <span className="m-mini text-slate-400">· {module.leaves.length} sub-modul</span>
        </button>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "rounded px-1.5 py-0 m-mini font-mono font-bold",
            allGranted ? "bg-emerald-100 text-emerald-700"
              : someGranted ? "bg-amber-100 text-amber-700"
              : "bg-slate-100 text-slate-400",
          )}>
            {count.granted}/{count.total}
          </span>
          <button
            type="button"
            onClick={() => onToggleModule(module, true)}
            title="Grant semua di modul ini"
            className="flex h-6 w-6 items-center justify-center rounded-md text-emerald-600 transition hover:bg-emerald-50"
          >
            <CheckCheck size={11} />
          </button>
          <button
            type="button"
            onClick={() => onToggleModule(module, false)}
            title="Revoke semua di modul ini"
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100"
          >
            <Square size={11} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="divide-y divide-slate-100">
              {module.leaves.map((leaf) => (
                <LeafRow
                  key={leaf.key}
                  leaf={leaf}
                  map={map}
                  role={role}
                  onToggleAction={onToggleAction}
                  onToggleLeaf={onToggleLeaf}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LeafRow({
  leaf, map, role, onToggleAction, onToggleLeaf,
}: {
  leaf: PermissionLeaf;
  map: RBACMap;
  role: UserRole;
  onToggleAction: (leafKey: string, action: CrudAction) => void;
  onToggleLeaf: (leaf: PermissionLeaf, grant: boolean) => void;
}) {
  const granted = countLeafGrants(map, role, leaf);
  const allGranted = granted === leaf.actions.length;

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1.5 transition hover:bg-slate-50/60">
      <button
        type="button"
        onClick={() => onToggleLeaf(leaf, !allGranted)}
        className="flex flex-1 items-center gap-2 text-left"
        title="Klik toggle semua action"
      >
        <span className={cn(
          "h-1.5 w-1.5 rounded-full transition",
          allGranted ? "bg-emerald-500" : granted > 0 ? "bg-amber-400" : "bg-slate-300",
        )} />
        <span className="m-xs font-semibold text-slate-700">{leaf.label}</span>
        <span className="m-mini text-slate-400 font-mono">{leaf.key}</span>
      </button>
      <div className="flex items-center gap-1">
        {leaf.actions.map((a) => {
          const acfg = ACTION_CFG[a];
          const granted = hasAction(map, role, leaf.key, a);
          return (
            <button
              key={a}
              type="button"
              onClick={() => onToggleAction(leaf.key, a)}
              title={`${acfg.label} — ${granted ? "Granted" : "Not granted"}`}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md border-2 font-bold m-mini transition",
                granted
                  ? cn(acfg.bg, acfg.text, "border-transparent")
                  : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              {acfg.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
