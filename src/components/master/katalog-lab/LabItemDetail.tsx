"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabKatalogItem } from "@/lib/master/labCatalogMock";
import {
  LAB_TABS, KATEGORI_CFG, isLabItemValid, labItemInitials, getLabStatusCfg,
  hasCriticalConfig, hasDeltaConfig,
} from "./katalogLabShared";
import type { LabTabKey } from "./katalogLabShared";
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

// ── Tab completeness badge ────────────────────────────────

function TabBadge({ tabKey, draft }: { tabKey: LabTabKey; draft: LabKatalogItem }) {
  if (tabKey === "rujukan") {
    const n = draft.nilaiRujukan.length;
    if (n === 0) return <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">—</span>;
    return <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">{n}</span>;
  }
  if (tabKey === "delta") {
    const ok = hasCriticalConfig(draft) || hasDeltaConfig(draft);
    if (!ok) return <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">—</span>;
    return <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">✓</span>;
  }
  return null;
}

// ── Component ─────────────────────────────────────────────

export default function LabItemDetail({
  draft, isNew, isDirty, tab, onTabChange,
  onPatch, onSave, onCancel, onDelete,
}: Props) {
  const valid   = isLabItemValid(draft, isNew);
  const catCfg  = KATEGORI_CFG[draft.kategori];
  const stsCfg  = getLabStatusCfg(draft.status);
  const initials = labItemInitials(draft);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* Header — soft sky saat normal, emerald saat entri baru */}
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
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {!isNew && draft.kode && (
                  <span className="font-mono text-[10px] text-slate-400">{draft.kode}</span>
                )}
                {!isNew && (
                  <span className={cn("rounded px-1.5 py-0 text-[10px] font-semibold", catCfg?.bg, catCfg?.text)}>
                    {catCfg?.short}
                  </span>
                )}
                {!isNew && draft.satuan && (
                  <span className="text-[10px] text-slate-400">{draft.satuan}</span>
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
                className="rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                title="Hapus"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onCancel}
              disabled={!isDirty}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-30"
            >
              <X size={11} /> Batal
            </button>
            <button
              onClick={onSave}
              disabled={!isDirty || !valid}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition disabled:opacity-40",
                isNew ? "bg-emerald-600 hover:bg-emerald-700" : "bg-sky-600 hover:bg-sky-700",
              )}
            >
              <Check size={11} /> {isNew ? "Tambah" : "Simpan"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tab Nav */}
      <div className="flex shrink-0 gap-0.5 border-b border-slate-100 bg-slate-50/50 px-3 pt-2">
        {LAB_TABS.map((t) => {
          const active = tab === t.key;
          const Icon   = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-t-lg border border-transparent px-3 py-2 text-xs font-medium transition",
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
            {tab === "identitas" && (
              <LabIdentitasTab draft={draft} isNew={isNew} onPatch={onPatch} />
            )}
            {tab === "rujukan" && (
              <LabNilaiRujukanTab draft={draft} onPatch={onPatch} />
            )}
            {tab === "delta" && (
              <LabDeltaKritisTab draft={draft} onPatch={onPatch} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
