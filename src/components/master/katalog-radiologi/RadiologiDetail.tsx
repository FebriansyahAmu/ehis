"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
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

// ── Tab completeness badge ────────────────────────────────

function TabBadge({ tabKey, draft }: { tabKey: RadTabKey; draft: RadCatalogRecord }) {
  if (tabKey === "persiapan") {
    const drlReady   = hasDRLConfig(draft);
    const kontrasReady = usesKontras(draft);
    const filled = drlReady || kontrasReady || (draft.persiapan.kontraindikasi.length > 0);
    if (!filled) return <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">—</span>;
    return <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">✓</span>;
  }
  if (tabKey === "template") {
    const filled = !!draft.reportingTemplate.templateTemuan?.trim();
    if (!filled) return <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">—</span>;
    return <span className="ml-1 rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">✓</span>;
  }
  return null;
}

// ── Component ─────────────────────────────────────────────

export default function RadiologiDetail({
  draft, isNew, isDirty, tab, onTabChange,
  onPatch, onSave, onCancel, onDelete,
}: Props) {
  const valid   = isRadCatalogValid(draft, isNew);
  const modCfg  = MODALITAS_CFG[draft.modalitas];
  const stsCfg  = getRadStatusCfg(draft.status);
  const initials = radItemInitials(draft);
  const ModIcon = modCfg.icon;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* Header — soft slate saat normal, emerald saat entri baru */}
      <motion.div
        animate={{
          backgroundColor: isNew ? "rgb(240 253 244)" : "rgb(248 250 252 / 0.6)",
          borderColor:     isNew ? "rgb(187 247 208)" : "rgb(241 245 249)",
        }}
        transition={{ duration: 0.25 }}
        className="shrink-0 border-b px-4 py-3"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Avatar + meta */}
          <div className="flex min-w-0 items-center gap-3">
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
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {!isNew && draft.kode && (
                  <span className="font-mono text-[10px] text-slate-400">{draft.kode}</span>
                )}
                {!isNew && (
                  <span className={cn("rounded px-1.5 py-0 text-[10px] font-semibold", modCfg.bg, modCfg.text)}>
                    {modCfg.short}
                  </span>
                )}
                {!isNew && (
                  <span className="text-[10px] text-slate-400">{REGION_LABEL[draft.region]}</span>
                )}
                {!isNew && (
                  <span className={cn("flex items-center gap-1 rounded-full px-1.5 py-0 text-[10px] font-medium", stsCfg.bg, stsCfg.text)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", stsCfg.dot)} />
                    {stsCfg.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            {onDelete && (
              <button
                onClick={onDelete}
                className="rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                title="Hapus"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onCancel}
              disabled={!isDirty}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-30 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <X size={11} /> Batal
            </button>
            <button
              onClick={onSave}
              disabled={!isDirty || !valid}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                isNew
                  ? "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-300"
                  : "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-300",
              )}
            >
              <Check size={11} /> {isNew ? "Tambah" : "Simpan"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tab Nav */}
      <div role="tablist" aria-label="Detail pemeriksaan radiologi" className="flex shrink-0 gap-0.5 border-b border-slate-100 bg-slate-50/50 px-3 pt-2">
        {RAD_TABS.map((t) => {
          const active = tab === t.key;
          const Icon   = t.icon;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-t-lg border border-transparent px-3 py-2 text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-rose-200",
                active
                  ? cn("border-slate-200 border-b-white bg-white text-slate-800 shadow-sm", t.accent.text)
                  : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
              )}
            >
              <Icon size={12} />
              {t.label}
              <TabBadge tabKey={t.key} draft={draft} />
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="p-4"
          >
            {tab === "identitas" && <IdentitasTab draft={draft} onPatch={onPatch} />}
            {tab === "persiapan" && <PersiapanDRLTab draft={draft} onPatch={onPatch} />}
            {tab === "template"  && <ReportingTemplateTab draft={draft} onPatch={onPatch} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
