"use client";

import { cn } from "@/lib/utils";
import { MasterDetailPanel, type MasterTab } from "@/components/master/shared";
import type { LabKatalogItem } from "@/lib/master/labCatalogMock";
import {
  LAB_TABS, KATEGORI_CFG,
  isLabItemValid, labItemInitials, getLabStatusCfg,
  hasCriticalConfig, hasDeltaConfig,
  type LabTabKey,
} from "./katalogLabShared";
import LabIdentitasTab from "./tabs/LabIdentitasTab";
import LabNilaiRujukanTab from "./tabs/LabNilaiRujukanTab";
import LabDeltaKritisTab from "./tabs/LabDeltaKritisTab";

interface Props {
  draft: LabKatalogItem;
  isNew: boolean;
  isDirty: boolean;
  tab: LabTabKey;
  onTabChange: (t: LabTabKey) => void;
  onPatch: (p: Partial<LabKatalogItem>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const LAB_TAB_NAV: MasterTab<LabTabKey>[] = LAB_TABS.map((t) => ({
  key: t.key,
  label: t.label,
  icon: t.icon,
  accentText: t.accent.text,
}));

// ── Tab completeness badge ────────────────────────────────

function TabBadge({ tabKey, draft }: { tabKey: LabTabKey; draft: LabKatalogItem }) {
  if (tabKey === "rujukan") {
    const n = draft.nilaiRujukan.length;
    if (n === 0) {
      return <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">—</span>;
    }
    return <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">{n}</span>;
  }
  if (tabKey === "delta") {
    const ok = hasCriticalConfig(draft) || hasDeltaConfig(draft);
    if (!ok) {
      return <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">—</span>;
    }
    return <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">✓</span>;
  }
  return null;
}

// ── Header content (avatar + meta) ────────────────────────

function HeaderContent({ draft, isNew }: { draft: LabKatalogItem; isNew: boolean }) {
  const catCfg = KATEGORI_CFG[draft.kategori];
  const stsCfg = getLabStatusCfg(draft.status);
  const initials = labItemInitials(draft);

  return (
    <>
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black",
        isNew ? "bg-emerald-100 text-emerald-700" : cn(catCfg?.bg, catCfg?.text),
      )}>
        {initials}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-900">
            {draft.nama || <span className="italic text-slate-400">Pemeriksaan baru…</span>}
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
            <span className={cn("rounded px-1.5 py-0 text-[10px] font-semibold", catCfg?.bg, catCfg?.text)}>
              {catCfg?.short}
            </span>
            {draft.satuan && (
              <span className="text-[10px] text-slate-400">{draft.satuan}</span>
            )}
            <span className={cn("flex items-center gap-1 rounded-full px-1.5 py-0 text-[10px] font-medium", stsCfg.bg, stsCfg.text)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", stsCfg.dot)} />
              {stsCfg.label}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ── Component ─────────────────────────────────────────────

export default function LabItemDetail({
  draft, isNew, isDirty, tab, onTabChange,
  onPatch, onSave, onCancel, onDelete,
}: Props) {
  const valid = isLabItemValid(draft, isNew);

  return (
    <MasterDetailPanel<LabTabKey>
      accent="sky"
      headerContent={<HeaderContent draft={draft} isNew={isNew} />}
      isNew={isNew}
      isDirty={isDirty}
      valid={valid}
      onSave={onSave}
      onCancel={onCancel}
      onDelete={onDelete}
      tabs={LAB_TAB_NAV}
      activeTab={tab}
      onTabChange={onTabChange}
      renderTabBadge={(k) => <TabBadge tabKey={k} draft={draft} />}
      tabsAriaLabel="Detail pemeriksaan laboratorium"
    >
      {tab === "identitas" && <LabIdentitasTab draft={draft} isNew={isNew} onPatch={onPatch} />}
      {tab === "rujukan"   && <LabNilaiRujukanTab draft={draft} onPatch={onPatch} />}
      {tab === "delta"     && <LabDeltaKritisTab draft={draft} onPatch={onPatch} />}
    </MasterDetailPanel>
  );
}
