"use client";

import { cn } from "@/lib/utils";
import { MasterDetailPanel, type MasterTab } from "@/components/master/shared";
import {
  type TriaseRecord, isTriaseValid, triaseInitials, getTriaseStatusCfg,
} from "@/lib/master/triaseMock";
import { TRIASE_TABS, type TriaseTabKey } from "./triaseShared";
import IdentitasTab from "./tabs/IdentitasTab";
import MatrixTab from "./tabs/MatrixTab";

interface Props {
  draft: TriaseRecord;
  isNew: boolean;
  isDirty: boolean;
  tab: TriaseTabKey;
  onTabChange: (t: TriaseTabKey) => void;
  onPatch: (p: Partial<TriaseRecord>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const TRIASE_TAB_NAV: MasterTab<TriaseTabKey>[] = TRIASE_TABS.map((t) => ({
  key: t.key,
  label: t.label,
  icon: t.icon,
  accentText: t.accentText,
}));

// ── Tab completeness badge ───────────────────────────────

function TabBadge({ tabKey, draft }: { tabKey: TriaseTabKey; draft: TriaseRecord }) {
  if (tabKey === "matrix") {
    if (draft.levels.length === 0 || draft.parameters.length === 0) {
      return <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">—</span>;
    }
    const cells = draft.levels.length * draft.parameters.length;
    return <span className="ml-1 rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700">{cells} sel</span>;
  }
  return null;
}

// ── Header content ───────────────────────────────────────

function HeaderContent({ draft, isNew }: { draft: TriaseRecord; isNew: boolean }) {
  const stsCfg = getTriaseStatusCfg(draft.status);
  const initials = triaseInitials(draft);

  return (
    <>
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-[11px] font-black tracking-tight",
        isNew ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
      )}>
        {initials}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-900">
            {draft.nama || <span className="italic text-slate-400">Protokol baru…</span>}
          </p>
          {isNew && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              + Entri Baru
            </span>
          )}
        </div>
        {!isNew && (
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {draft.kode && (
              <span className="font-mono text-[10px] text-slate-400">{draft.kode}</span>
            )}
            <span className="text-[10px] text-slate-400">
              {draft.levels.length} level · {draft.parameters.length} parameter
            </span>
            <span className={cn(
              "flex items-center gap-1 rounded-full px-1.5 py-0 text-[10px] font-medium",
              stsCfg.bg, stsCfg.text,
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", stsCfg.dot)} />
              {stsCfg.label}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ── Component ────────────────────────────────────────────

export default function TriaseDetail({
  draft, isNew, isDirty, tab, onTabChange,
  onPatch, onSave, onCancel, onDelete,
}: Props) {
  const valid = isTriaseValid(draft, isNew);

  return (
    <MasterDetailPanel<TriaseTabKey>
      accent="amber"
      headerContent={<HeaderContent draft={draft} isNew={isNew} />}
      isNew={isNew}
      isDirty={isDirty}
      valid={valid}
      onSave={onSave}
      onCancel={onCancel}
      onDelete={onDelete}
      tabs={TRIASE_TAB_NAV}
      activeTab={tab}
      onTabChange={onTabChange}
      renderTabBadge={(k) => <TabBadge tabKey={k} draft={draft} />}
      tabsAriaLabel="Detail protokol triase"
    >
      {tab === "identitas" && <IdentitasTab draft={draft} onPatch={onPatch} />}
      {tab === "matrix"    && <MatrixTab    draft={draft} onPatch={onPatch} />}
    </MasterDetailPanel>
  );
}
