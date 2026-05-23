"use client";

import { cn } from "@/lib/utils";
import { MasterDetailPanel, type MasterTab } from "@/components/master/shared";
import type { RadCatalogRecord } from "@/lib/master/radCatalogMock";
import {
  RAD_TABS, MODALITAS_CFG, REGION_LABEL,
  isRadCatalogValid, radItemInitials, getRadStatusCfg,
  hasDRLConfig, usesKontras,
  type RadTabKey,
} from "./katalogRadiologiShared";
import IdentitasTab from "./tabs/IdentitasTab";
import PersiapanDRLTab from "./tabs/PersiapanDRLTab";
import ReportingTemplateTab from "./tabs/ReportingTemplateTab";

interface Props {
  draft: RadCatalogRecord;
  isNew: boolean;
  isDirty: boolean;
  tab: RadTabKey;
  onTabChange: (t: RadTabKey) => void;
  onPatch: (p: Partial<RadCatalogRecord>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

// Tab list ditransformasi sekali dari `RAD_TABS` (yang membawa accent per-tab).
const RAD_TAB_NAV: MasterTab<RadTabKey>[] = RAD_TABS.map((t) => ({
  key: t.key,
  label: t.label,
  icon: t.icon,
  accentText: t.accent.text,
}));

// ── Tab completeness badge ────────────────────────────────

function TabBadge({ tabKey, draft }: { tabKey: RadTabKey; draft: RadCatalogRecord }) {
  if (tabKey === "persiapan") {
    const filled =
      hasDRLConfig(draft) ||
      usesKontras(draft) ||
      draft.persiapan.kontraindikasi.length > 0;
    if (!filled) {
      return <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">—</span>;
    }
    return <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">✓</span>;
  }
  if (tabKey === "template") {
    const filled = !!draft.reportingTemplate.templateTemuan?.trim();
    if (!filled) {
      return <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">—</span>;
    }
    return <span className="ml-1 rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">✓</span>;
  }
  return null;
}

// ── Header content (avatar + meta) ────────────────────────

function HeaderContent({ draft, isNew }: { draft: RadCatalogRecord; isNew: boolean }) {
  const modCfg = MODALITAS_CFG[draft.modalitas];
  const stsCfg = getRadStatusCfg(draft.status);
  const initials = radItemInitials(draft);
  const ModIcon = modCfg.icon;

  return (
    <>
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        isNew ? "bg-emerald-100 text-emerald-700" : cn(modCfg.bg, modCfg.text),
      )}>
        {isNew
          ? <span className="text-sm font-black">{initials}</span>
          : <ModIcon size={18} />}
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
            <span className={cn("rounded px-1.5 py-0 text-[10px] font-semibold", modCfg.bg, modCfg.text)}>
              {modCfg.short}
            </span>
            <span className="text-[10px] text-slate-400">{REGION_LABEL[draft.region]}</span>
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

export default function RadiologiDetail({
  draft, isNew, isDirty, tab, onTabChange,
  onPatch, onSave, onCancel, onDelete,
}: Props) {
  const valid = isRadCatalogValid(draft, isNew);

  return (
    <MasterDetailPanel<RadTabKey>
      accent="rose"
      headerContent={<HeaderContent draft={draft} isNew={isNew} />}
      isNew={isNew}
      isDirty={isDirty}
      valid={valid}
      onSave={onSave}
      onCancel={onCancel}
      onDelete={onDelete}
      tabs={RAD_TAB_NAV}
      activeTab={tab}
      onTabChange={onTabChange}
      renderTabBadge={(k) => <TabBadge tabKey={k} draft={draft} />}
      tabsAriaLabel="Detail pemeriksaan radiologi"
    >
      {tab === "identitas" && <IdentitasTab draft={draft} onPatch={onPatch} />}
      {tab === "persiapan" && <PersiapanDRLTab draft={draft} onPatch={onPatch} />}
      {tab === "template"  && <ReportingTemplateTab draft={draft} onPatch={onPatch} />}
    </MasterDetailPanel>
  );
}
