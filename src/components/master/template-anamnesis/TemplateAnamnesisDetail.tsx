"use client";

import { useMemo } from "react";
import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { MasterDetailPanel } from "@/components/master/shared";
import {
  type TemplateAnamnesisItem,
  KATEGORI_CFG, CONTEXT_CFG, isTemplateValid,
} from "@/lib/master/templateAnamnesisMock";
import {
  TEMPLATE_TABS, type TemplateTabKey,
  tabCompleteness, getCompletenessBadge,
} from "./templateAnamnesisShared";
import IdentitasTab from "./tabs/IdentitasTab";
import KontenTab from "./tabs/KontenTab";
import PreviewTab from "./tabs/PreviewTab";

interface Props {
  draft: TemplateAnamnesisItem;
  isNew: boolean;
  isDirty: boolean;
  activeTab: TemplateTabKey;
  onTabChange: (tab: TemplateTabKey) => void;
  onPatch: <K extends keyof TemplateAnamnesisItem>(k: K, v: TemplateAnamnesisItem[K]) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function TemplateAnamnesisDetail({
  draft, isNew, isDirty, activeTab, onTabChange,
  onPatch, onSave, onCancel, onDelete,
}: Props) {
  const valid = useMemo(() => isTemplateValid(draft), [draft]);
  const katCfg = KATEGORI_CFG[draft.kategori];

  const tabs = useMemo(
    () =>
      TEMPLATE_TABS.map((t) => ({
        key: t.key,
        label: t.label,
        icon: t.icon,
      })),
    [],
  );

  const renderTabBadge = (k: TemplateTabKey) => {
    const state = tabCompleteness(draft, k);
    const cfg = getCompletenessBadge(state);
    return (
      <span className={cn("rounded-full px-1 text-[9px] font-bold", cfg.cls)}>{cfg.label}</span>
    );
  };

  return (
    <MasterDetailPanel
      accent="teal"
      isNew={isNew}
      isDirty={isDirty}
      valid={valid}
      onSave={onSave}
      onCancel={onCancel}
      onDelete={onDelete}
      newSaveLabel="Tambah Template"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      renderTabBadge={renderTabBadge}
      tabsAriaLabel="Tab template anamnesis"
      headerContent={
        <>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
            <Stethoscope size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="truncate text-sm font-bold text-slate-800">
                {draft.label || "Template Baru"}
              </h2>
              <span className={cn("rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase", katCfg.bg, katCfg.text)}>
                {katCfg.label}
              </span>
              {draft.contextTags.map((c) => {
                const cfg = CONTEXT_CFG[c];
                return (
                  <span
                    key={c}
                    className={cn("inline-flex items-center gap-1 rounded-full px-1.5 text-[9px] font-bold", cfg.bg, cfg.text)}
                  >
                    <span className={cn("h-1 w-1 rounded-full", cfg.dot)} />
                    {cfg.label}
                  </span>
                );
              })}
              {draft.status === "NonAktif" && (
                <span className="rounded-full bg-slate-200 px-1.5 text-[9px] font-bold uppercase text-slate-600">
                  Non-Aktif
                </span>
              )}
            </div>
            <p className="mt-0.5 line-clamp-1 text-[10.5px] text-slate-500">
              {draft.keluhanUtama || "Belum ada keluhan utama"}
            </p>
            {isDirty && (
              <p className="mt-0.5 text-[10px] font-semibold text-amber-600">
                ● Perubahan belum tersimpan
              </p>
            )}
          </div>
        </>
      }
    >
      {activeTab === "identitas" && <IdentitasTab draft={draft} onPatch={onPatch} />}
      {activeTab === "konten" && <KontenTab draft={draft} onPatch={onPatch} />}
      {activeTab === "preview" && <PreviewTab draft={draft} onPatch={onPatch} />}
    </MasterDetailPanel>
  );
}
