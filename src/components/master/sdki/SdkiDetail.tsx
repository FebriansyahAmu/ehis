"use client";

import { cn } from "@/lib/utils";
import { MasterDetailPanel, type MasterTab } from "@/components/master/shared";
import {
  type SdkiItem,
  isSdkiValid, sdkiInitials, getSdkiStatusCfg, countSdkiIntervensi,
} from "@/lib/master/sdkiMock";
import { SDKI_TABS, KATEGORI_CFG, JENIS_CFG, type SdkiTabKey } from "./sdkiShared";
import IdentitasTab from "./tabs/IdentitasTab";
import KlinisTab from "./tabs/KlinisTab";
import IntervensiTab from "./tabs/IntervensiTab";

interface Props {
  draft: SdkiItem;
  isNew: boolean;
  isDirty: boolean;
  tab: SdkiTabKey;
  onTabChange: (t: SdkiTabKey) => void;
  onPatch: (p: Partial<SdkiItem>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const SDKI_TAB_NAV: MasterTab<SdkiTabKey>[] = SDKI_TABS.map((t) => ({
  key: t.key,
  label: t.label,
  icon: t.icon,
  accentText: t.accentText,
}));

// ── Tab badge ────────────────────────────────────────────

function TabBadge({ tabKey, draft }: { tabKey: SdkiTabKey; draft: SdkiItem }) {
  if (tabKey === "klinis") {
    const count = draft.kriteriaHasil.length;
    if (count === 0) {
      return <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">0</span>;
    }
    return <span className="ml-1 rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">{count}</span>;
  }
  if (tabKey === "intervensi") {
    const count = countSdkiIntervensi(draft);
    if (count === 0) {
      return <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">—</span>;
    }
    return <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">{count}</span>;
  }
  return null;
}

// ── Header ───────────────────────────────────────────────

function HeaderContent({ draft, isNew }: { draft: SdkiItem; isNew: boolean }) {
  const katCfg = KATEGORI_CFG[draft.kategori];
  const jnsCfg = JENIS_CFG[draft.jenis];
  const stsCfg = getSdkiStatusCfg(draft.status);
  const initials = sdkiInitials(draft);
  const KatIcon = katCfg.icon;

  return (
    <>
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        isNew ? "bg-emerald-100 text-emerald-700" : cn(katCfg.bg, katCfg.text),
      )}>
        {isNew ? <span className="text-sm font-black">{initials}</span> : <KatIcon size={18} />}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-900">
            {draft.kode || <span className="italic text-slate-400">D.____</span>}
            {draft.nama && <span className="ml-2 font-normal text-slate-600">— {draft.nama}</span>}
          </p>
          {isNew && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              + Entri Baru
            </span>
          )}
        </div>
        {!isNew && (
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded px-1.5 py-0 text-[10px] font-semibold", katCfg.bg, katCfg.text)}>
              {katCfg.label}
            </span>
            <span className={cn("rounded px-1.5 py-0 text-[10px] font-semibold", jnsCfg.bg, jnsCfg.text)}>
              {jnsCfg.label}
            </span>
            {draft.subKategori && (
              <span className="text-[10px] text-slate-400">{draft.subKategori}</span>
            )}
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

export default function SdkiDetail({
  draft, isNew, isDirty, tab, onTabChange,
  onPatch, onSave, onCancel, onDelete,
}: Props) {
  const valid = isSdkiValid(draft, isNew);

  return (
    <MasterDetailPanel<SdkiTabKey>
      accent="rose"
      headerContent={<HeaderContent draft={draft} isNew={isNew} />}
      isNew={isNew}
      isDirty={isDirty}
      valid={valid}
      onSave={onSave}
      onCancel={onCancel}
      onDelete={onDelete}
      tabs={SDKI_TAB_NAV}
      activeTab={tab}
      onTabChange={onTabChange}
      renderTabBadge={(k) => <TabBadge tabKey={k} draft={draft} />}
      tabsAriaLabel="Detail diagnosa keperawatan"
    >
      {tab === "identitas"  && <IdentitasTab  draft={draft} onPatch={onPatch} />}
      {tab === "klinis"     && <KlinisTab     draft={draft} onPatch={onPatch} />}
      {tab === "intervensi" && <IntervensiTab draft={draft} onPatch={onPatch} />}
    </MasterDetailPanel>
  );
}
