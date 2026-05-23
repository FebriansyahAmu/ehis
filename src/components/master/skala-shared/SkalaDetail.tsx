"use client";

import { cn } from "@/lib/utils";
import {
  MasterDetailPanel, type MasterTab, type MasterAccent,
} from "@/components/master/shared";
import type { SkalaRecord } from "@/lib/master/skalaCommon";
import {
  SKALA_TABS, MODUL_CFG, getSkalaStatusCfg,
  isSkalaValid, skalaInitials,
  type SkalaTabKey,
} from "./skalaConfig";
import IdentitasTab from "./tabs/IdentitasTab";
import ItemsTab from "./tabs/ItemsTab";
import InterpretasiTab from "./tabs/InterpretasiTab";

interface Props {
  accent: MasterAccent;
  /** Tailwind classes per accent — pre-resolved for new badge bg/text + chip styles. */
  singkatBadge: string;
  avatarBg: string;
  avatarText: string;

  draft: SkalaRecord;
  isNew: boolean;
  isDirty: boolean;
  tab: SkalaTabKey;
  onTabChange: (t: SkalaTabKey) => void;
  onPatch: (p: Partial<SkalaRecord>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const SKALA_TAB_NAV: MasterTab<SkalaTabKey>[] = SKALA_TABS.map((t) => ({
  key: t.key,
  label: t.label,
  icon: t.icon,
  accentText: t.accentText,
}));

// ── Tab completeness badge ───────────────────────────────

function TabBadge({ tabKey, draft }: { tabKey: SkalaTabKey; draft: SkalaRecord }) {
  if (tabKey === "items") {
    const count = draft.items.length;
    if (count === 0) {
      return <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">0</span>;
    }
    return <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">{count}</span>;
  }
  if (tabKey === "interpretasi") {
    const count = draft.interpretasi.length;
    if (count === 0) {
      return <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">—</span>;
    }
    return <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">{count} lvl</span>;
  }
  return null;
}

// ── Header content ───────────────────────────────────────

function HeaderContent({
  draft, isNew, singkatBadge, avatarBg, avatarText,
}: {
  draft: SkalaRecord;
  isNew: boolean;
  singkatBadge: string;
  avatarBg: string;
  avatarText: string;
}) {
  const stsCfg = getSkalaStatusCfg(draft.status);
  const initials = skalaInitials(draft);

  return (
    <>
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-[11px] font-black tracking-tight",
        isNew ? "bg-emerald-100 text-emerald-700" : cn(avatarBg, avatarText),
      )}>
        {initials}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-900">
            {draft.nama || <span className="italic text-slate-400">Skala baru…</span>}
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
            {draft.singkat && (
              <span className={cn(
                "rounded px-1.5 py-0 text-[10px] font-semibold",
                singkatBadge,
              )}>
                {draft.singkat}
              </span>
            )}
            <span className="text-[10px] text-slate-400">
              max {draft.totalMax} · {draft.items.length} item
            </span>
            {draft.konsumenModul.slice(0, 3).map((m) => {
              const cfg = MODUL_CFG[m];
              return (
                <span key={m} className={cn(
                  "rounded px-1.5 py-0 text-[10px] font-semibold",
                  cfg.bg, cfg.text,
                )}>
                  {cfg.label}
                </span>
              );
            })}
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

export default function SkalaDetail({
  accent, singkatBadge, avatarBg, avatarText,
  draft, isNew, isDirty, tab, onTabChange,
  onPatch, onSave, onCancel, onDelete,
}: Props) {
  const valid = isSkalaValid(draft, isNew);

  return (
    <MasterDetailPanel<SkalaTabKey>
      accent={accent}
      headerContent={
        <HeaderContent
          draft={draft}
          isNew={isNew}
          singkatBadge={singkatBadge}
          avatarBg={avatarBg}
          avatarText={avatarText}
        />
      }
      isNew={isNew}
      isDirty={isDirty}
      valid={valid}
      onSave={onSave}
      onCancel={onCancel}
      onDelete={onDelete}
      tabs={SKALA_TAB_NAV}
      activeTab={tab}
      onTabChange={onTabChange}
      renderTabBadge={(k) => <TabBadge tabKey={k} draft={draft} />}
      tabsAriaLabel="Detail skala"
    >
      {tab === "identitas"    && <IdentitasTab    accent={accent} draft={draft} onPatch={onPatch} />}
      {tab === "items"        && <ItemsTab        draft={draft} onPatch={onPatch} />}
      {tab === "interpretasi" && <InterpretasiTab draft={draft} onPatch={onPatch} />}
    </MasterDetailPanel>
  );
}
