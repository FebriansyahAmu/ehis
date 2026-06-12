"use client";

// Panel kiri Layanan Unit — TREE dari Master Ruangan: Unit (Organization) header collapsible,
// Ruangan (Location) sebagai kolom matrix yang bisa di-tampil/sembunyikan via checkbox. Tujuan:
// saat Location banyak, user mempersempit kolom ke unit relevan ("fokus") agar mapping enak.
// Checkbox Org = tri-state (semua/sebagian/tak satu pun child tampak). Identitas kolom = `kode`.

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Building2, ChevronRight, Check, Minus, Crosshair, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isRSRoot, type AnyNode, type LocationNode, type OrganizationNode,
} from "@/components/master/ruangan/ruanganShared";
import {
  type LayananMap, type LayananUnit,
  UNIT_CATEGORY_CFG, UNIT_CATEGORY_ORDER, countTindakanPerUnit,
} from "./layananShared";

interface Props {
  nodes: AnyNode[];
  units: LayananUnit[];
  map: LayananMap;
  /** kode unit yang DISEMBUNYIKAN dari matrix (default kosong = semua tampak). */
  hiddenUnits: Set<string>;
  onToggleUnit: (kode: string) => void;
  onSetUnits: (kodes: string[], visible: boolean) => void;
  onShowOnly: (kodes: string[]) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

export default function LayananUnitTreePanel({
  nodes, units, map, hiddenUnits,
  onToggleUnit, onSetUnits, onShowOnly, onShowAll, onHideAll,
}: Props) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const unitByKode = useMemo(() => {
    const m = new Map<string, LayananUnit>();
    for (const u of units) m.set(u.kode, u);
    return m;
  }, [units]);

  // parentId → children (Organization dulu lalu Location; alfabet) — selaras RuanganTreePanel.
  const { childrenOf, rootChildren } = useMemo(() => {
    const m = new Map<string | null, AnyNode[]>();
    for (const n of nodes) {
      if (n.type === "Location" && n.active === false) continue;
      const pid = n.parentId ?? null;
      const arr = m.get(pid);
      if (arr) arr.push(n);
      else m.set(pid, [n]);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => {
        if (a.type !== b.type) return a.type === "Organization" ? -1 : 1;
        return a.name.localeCompare(b.name, "id");
      });
    }
    const root = nodes.find((n) => n.type === "Organization" && isRSRoot(n));
    const rc = (root ? m.get(root.id) : undefined) ?? m.get(null) ?? [];
    return { childrenOf: m, rootChildren: rc };
  }, [nodes]);

  const visibleCount = units.length - hiddenUnits.size;
  const q = search.trim().toLowerCase();

  const matchesLoc = (loc: LocationNode) =>
    !q || loc.name.toLowerCase().includes(q) || loc.kode.toLowerCase().includes(q);

  const orgHasMatch = (orgId: string): boolean => {
    const kids = childrenOf.get(orgId) ?? [];
    return kids.some((k) => (k.type === "Location" ? matchesLoc(k) : orgHasMatch(k.id)));
  };

  // Semua kode ruangan keturunan sebuah Organization (rekursif) — untuk tri-state + fokus.
  const descLocKodes = (orgId: string): string[] => {
    const out: string[] = [];
    for (const k of childrenOf.get(orgId) ?? []) {
      if (k.type === "Location") out.push(k.kode);
      else out.push(...descLocKodes(k.id));
    }
    return out;
  };

  const toggleCollapse = (id: string) =>
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
        const locKodes = descLocKodes(node.id);
        const shownInOrg = locKodes.filter((k) => !hiddenUnits.has(k)).length;
        const orgState: TriState =
          locKodes.length === 0 ? "off"
            : shownInOrg === 0 ? "off"
            : shownInOrg === locKodes.length ? "on"
            : "mixed";
        out.push(
          <OrgRow
            key={node.id}
            org={node}
            depth={depth}
            collapsed={isCollapsed}
            shown={shownInOrg}
            total={locKodes.length}
            state={orgState}
            onToggleCollapse={() => toggleCollapse(node.id)}
            onToggleCheck={() => onSetUnits(locKodes, orgState !== "on")}
            onFocus={() => onShowOnly(locKodes)}
          />,
        );
        if (!isCollapsed) out.push(...renderNodes(kids, depth + 1));
      } else {
        if (!matchesLoc(node)) continue;
        const u = unitByKode.get(node.kode);
        if (!u) continue; // Location non-aktif disaring di unitsFromTree
        out.push(
          <LocRow
            key={node.id}
            unit={u}
            depth={depth}
            count={countTindakanPerUnit(map, node.kode)}
            hidden={hiddenUnits.has(node.kode)}
            onToggle={() => onToggleUnit(node.kode)}
            onFocus={() => onShowOnly([node.kode])}
          />,
        );
      }
    }
    return out;
  }

  // Toggle satu jenis unit (Klinis/Poli/Penunjang): bila ada yang tersembunyi → tampilkan semua,
  // sebaliknya sembunyikan semua.
  const toggleCategory = (cat: LayananUnit["category"]) => {
    const kodes = units.filter((u) => u.category === cat).map((u) => u.kode);
    const anyHidden = kodes.some((k) => hiddenUnits.has(k));
    onSetUnits(kodes, anyHidden);
  };

  const rendered = renderNodes(rootChildren, 0);

  return (
    <aside className="hidden w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:flex lg:h-full lg:w-72">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="m-xs font-bold text-slate-800">Kolom Unit</p>
          <span className="rounded-full bg-teal-50 px-2 py-0.5 m-mini font-bold text-teal-700">
            {visibleCount}/{units.length}
          </span>
        </div>
        <p className="mt-0.5 m-tiny text-slate-400">Pilih unit/ruangan yang tampil sebagai kolom matriks.</p>
      </div>

      {/* Search + bulk actions */}
      <div className="shrink-0 space-y-2 px-2.5 pb-2 pt-2.5">
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari unit / ruangan..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={onShowAll}
            className="flex items-center gap-1 rounded-md border border-teal-200 bg-white px-2 py-1 m-mini font-semibold text-teal-700 transition hover:bg-teal-50"
          >
            <Eye size={10} /> Semua
          </button>
          <button
            type="button"
            onClick={onHideAll}
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 m-mini font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            <EyeOff size={10} /> Kosong
          </button>
          <span className="ml-auto m-mini text-slate-300">Jenis:</span>
          {UNIT_CATEGORY_ORDER.map((cat) => {
            const cfg = UNIT_CATEGORY_CFG[cat];
            const kodes = units.filter((u) => u.category === cat).map((u) => u.kode);
            if (kodes.length === 0) return null;
            const allShown = kodes.every((k) => !hiddenUnits.has(k));
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                title={`${cfg.label} — ${kodes.length} unit`}
                className={cn(
                  "rounded-md border px-1.5 py-1 m-mini font-bold transition",
                  allShown
                    ? cn("border-transparent", cfg.bg, cfg.text)
                    : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50",
                )}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {rootChildren.length === 0 ? (
          <p className="px-3 py-8 text-center m-xs text-slate-400">Belum ada unit / ruangan</p>
        ) : rendered.length === 0 ? (
          <p className="px-3 py-8 text-center m-xs text-slate-400">Tidak ada unit cocok</p>
        ) : (
          <div className="flex flex-col gap-0.5">{rendered}</div>
        )}
      </div>
    </aside>
  );
}

// ── Tri-state checkbox ───────────────────────────────────
type TriState = "on" | "off" | "mixed";

function VisCheckbox({ state, onClick, label }: { state: TriState; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === "mixed" ? "mixed" : state === "on"}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition",
        state === "off"
          ? "border-slate-300 bg-white hover:border-teal-400"
          : "border-teal-600 bg-teal-600 text-white hover:bg-teal-700",
      )}
    >
      {state === "on" && <Check size={10} strokeWidth={3} />}
      {state === "mixed" && <Minus size={10} strokeWidth={3} />}
    </button>
  );
}

// ── Org header row ───────────────────────────────────────
function OrgRow({
  org, depth, collapsed, shown, total, state, onToggleCollapse, onToggleCheck, onFocus,
}: {
  org: OrganizationNode;
  depth: number;
  collapsed: boolean;
  shown: number;
  total: number;
  state: TriState;
  onToggleCollapse: () => void;
  onToggleCheck: () => void;
  onFocus: () => void;
}) {
  return (
    <div
      style={{ paddingLeft: depth * 12 + 4 }}
      className="group flex items-center gap-1.5 rounded-lg py-1.5 pr-1.5 transition-colors hover:bg-slate-50"
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Buka" : "Tutup"}
        className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600"
      >
        <ChevronRight size={13} className={cn("transition-transform", !collapsed && "rotate-90")} />
      </button>
      <VisCheckbox state={state} onClick={onToggleCheck} label={`Tampilkan semua ruangan ${org.name}`} />
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <Building2 size={10} />
        </span>
        <span className="min-w-0 flex-1 truncate m-xs font-bold uppercase tracking-wide text-slate-600">
          {org.name}
        </span>
      </button>
      {total > 0 && (
        <button
          type="button"
          onClick={onFocus}
          title="Fokus — tampilkan hanya unit ini"
          className="shrink-0 rounded p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-teal-50 hover:text-teal-600"
        >
          <Crosshair size={12} />
        </button>
      )}
      <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 m-mini font-semibold text-slate-400">
        {shown}/{total}
      </span>
    </div>
  );
}

// ── Ruangan (Location) row ───────────────────────────────
function LocRow({
  unit, depth, count, hidden, onToggle, onFocus,
}: {
  unit: LayananUnit;
  depth: number;
  count: number;
  hidden: boolean;
  onToggle: () => void;
  onFocus: () => void;
}) {
  const cfg = UNIT_CATEGORY_CFG[unit.category];
  return (
    <motion.div
      whileTap={{ scale: 0.995 }}
      style={{ paddingLeft: depth * 12 + 6 }}
      className={cn(
        "group flex items-center gap-2 rounded-lg py-1.5 pr-1.5 transition-colors",
        hidden ? "opacity-55 hover:bg-slate-50" : "hover:bg-slate-50",
      )}
    >
      <VisCheckbox
        state={hidden ? "off" : "on"}
        onClick={onToggle}
        label={`${hidden ? "Tampilkan" : "Sembunyikan"} kolom ${unit.nama}`}
      />
      <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.dot)} />
        <span className={cn("truncate m-xs font-semibold", hidden ? "text-slate-400 line-through" : "text-slate-800")}>
          {unit.nama}
        </span>
      </button>
      <button
        type="button"
        onClick={onFocus}
        title="Fokus — tampilkan hanya kolom ini"
        className="shrink-0 rounded p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-teal-50 hover:text-teal-600"
      >
        <Crosshair size={11} />
      </button>
      <span
        className={cn(
          "shrink-0 rounded px-1.5 py-0.5 font-mono m-mini font-bold",
          count > 0 ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-400",
        )}
        title={`${count} tindakan ter-mapping`}
      >
        {count}
      </span>
    </motion.div>
  );
}
