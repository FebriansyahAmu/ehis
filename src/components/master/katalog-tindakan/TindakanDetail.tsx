"use client";

import { cn } from "@/lib/utils";
import { MasterDetailPanel, type MasterTab } from "@/components/master/shared";
import type { TindakanRecord } from "@/lib/master/tindakanMock";
import { KATEGORI_CFG, KOMPLEKSITAS_CFG } from "@/lib/master/tindakanMock";
import {
  TINDAKAN_TABS, tindakanInitials, isTindakanValid, getStatusCfg,
  type TindakanTabKey,
} from "./katalogTindakanShared";
import TindakanIdentitasTab from "./tabs/TindakanIdentitasTab";
import TindakanRelasiTab from "./tabs/TindakanRelasiTab";

interface Props {
  draft: TindakanRecord;
  isNew: boolean;
  isDirty: boolean;
  tab: TindakanTabKey;
  onTabChange: (t: TindakanTabKey) => void;
  onPatch: (p: Partial<TindakanRecord>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const TINDAKAN_TAB_NAV: MasterTab<TindakanTabKey>[] = TINDAKAN_TABS.map((t) => ({
  key: t.key,
  label: t.label,
  icon: t.icon,
  accentText: t.accent.text,
}));

// ── Header content (avatar + meta) ────────────────────────

function HeaderContent({ draft, isNew }: { draft: TindakanRecord; isNew: boolean }) {
  const catCfg = KATEGORI_CFG[draft.kategori];
  const stsCfg = getStatusCfg(draft.status);

  return (
    <>
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black",
        isNew
          ? "bg-emerald-100 text-emerald-700"
          : catCfg ? cn(catCfg.bg, catCfg.text) : "bg-slate-100 text-slate-400",
      )}>
        {draft.nama.trim() ? tindakanInitials(draft) : "??"}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="truncate text-sm font-bold text-slate-900">
            {draft.nama.trim() || <span className="italic text-slate-400">Tindakan Baru</span>}
          </p>
          {isNew && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              + Entri Baru
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[11px] text-slate-400">{draft.kode || "—"}</span>
          {!isNew && draft.kategori && catCfg && (
            <span className={cn("rounded px-1.5 py-0 text-[10px] font-semibold", catCfg.bg, catCfg.text)}>
              {catCfg.short}
            </span>
          )}
          {!isNew && draft.kompleksitas && (
            <span className={cn(
              "rounded px-1.5 py-0 text-[10px] font-medium",
              KOMPLEKSITAS_CFG[draft.kompleksitas].bg,
              KOMPLEKSITAS_CFG[draft.kompleksitas].text,
            )}>
              {draft.kompleksitas}
            </span>
          )}
          {!isNew && (
            <span className={cn("rounded px-1.5 py-0 text-[10px] font-medium", stsCfg.bg, stsCfg.text)}>
              {stsCfg.label}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

// ── Component ─────────────────────────────────────────────

export default function TindakanDetail({
  draft, isNew, isDirty, tab, onTabChange,
  onPatch, onSave, onCancel, onDelete,
}: Props) {
  const valid = isTindakanValid(draft, isNew);

  return (
    <MasterDetailPanel<TindakanTabKey>
      accent="teal"
      headerContent={<HeaderContent draft={draft} isNew={isNew} />}
      isNew={isNew}
      isDirty={isDirty}
      valid={valid}
      onSave={onSave}
      onCancel={onCancel}
      onDelete={onDelete}
      tabs={TINDAKAN_TAB_NAV}
      activeTab={tab}
      onTabChange={onTabChange}
      tabsAriaLabel="Detail tindakan medis"
    >
      {tab === "identitas" && <TindakanIdentitasTab draft={draft} isNew={isNew} onPatch={onPatch} />}
      {tab === "relasi"    && <TindakanRelasiTab draft={draft} onPatch={onPatch} />}
    </MasterDetailPanel>
  );
}
