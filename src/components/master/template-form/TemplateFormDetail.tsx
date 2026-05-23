"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type TemplateFormItem,
  JENIS_CFG, isTemplateFormValid,
} from "@/lib/master/templateFormMock";
import SBARPane from "./panes/SBARPane";
import ICRisikoPane from "./panes/ICRisikoPane";
import SuratPane from "./panes/SuratPane";
import QuickTextPane from "./panes/QuickTextPane";

interface Props {
  draft: TemplateFormItem;
  isNew: boolean;
  isDirty: boolean;
  onPatch: (patch: Partial<TemplateFormItem>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  existingShortcuts: string[];
}

export default function TemplateFormDetail({
  draft, isNew, isDirty,
  onPatch, onSave, onCancel, onDelete,
  existingShortcuts,
}: Props) {
  const valid = useMemo(() => isTemplateFormValid(draft), [draft]);
  const cfg = JENIS_CFG[draft.jenis];
  const Icon = cfg.icon;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <motion.div
        animate={{
          backgroundColor: isNew ? "rgb(240 253 244)" : "rgb(248 250 252 / 0.6)",
          borderColor:     isNew ? "rgb(187 247 208)" : "rgb(241 245 249)",
        }}
        transition={{ duration: 0.25 }}
        className="shrink-0 border-b px-4 py-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", cfg.bg, cfg.text)}>
              <Icon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="truncate text-sm font-bold text-slate-800">
                  {draft.label || `Template ${cfg.short} Baru`}
                </h2>
                <span className={cn("rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase", cfg.bg, cfg.text)}>
                  {cfg.label}
                </span>
                {isNew && (
                  <span className="rounded-full bg-emerald-100 px-1.5 text-[9px] font-bold uppercase text-emerald-700">
                    Baru
                  </span>
                )}
                {draft.status === "NonAktif" && (
                  <span className="rounded-full bg-slate-200 px-1.5 text-[9px] font-bold uppercase text-slate-600">
                    Non-Aktif
                  </span>
                )}
              </div>
              {isDirty && (
                <p className="mt-0.5 text-[10px] font-semibold text-amber-600">
                  ● Perubahan belum tersimpan
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                aria-label="Hapus"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              disabled={!isDirty}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-30"
            >
              <X size={11} /> Batal
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!isDirty || !valid}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition disabled:opacity-40",
                isNew
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : cn(cfg.text.replace("text-", "bg-").replace("-700", "-600"), "hover:opacity-90"),
              )}
            >
              <Check size={11} /> {isNew ? `Tambah ${cfg.short}` : "Simpan"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Body — pane per jenis */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={draft.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="p-4"
          >
            {draft.jenis === "sbar" && (
              <SBARPane draft={draft} onPatch={onPatch as (p: Partial<typeof draft>) => void} />
            )}
            {draft.jenis === "ic-risiko" && (
              <ICRisikoPane draft={draft} onPatch={onPatch as (p: Partial<typeof draft>) => void} />
            )}
            {draft.jenis === "surat" && (
              <SuratPane draft={draft} onPatch={onPatch as (p: Partial<typeof draft>) => void} />
            )}
            {draft.jenis === "quick-text" && (
              <QuickTextPane
                draft={draft}
                onPatch={onPatch as (p: Partial<typeof draft>) => void}
                existingShortcuts={existingShortcuts.filter((s) => s !== draft.shortcut)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
