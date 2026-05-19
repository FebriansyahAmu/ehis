"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Trash2, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ObatRecord,
  OBAT_KATEGORI_CFG, BENTUK_CFG, RUTE_CFG,
} from "@/lib/master/obatMock";
import {
  TAB_REGISTRY, type TabKey, type TabConfig,
  tabCompleteness, isObatValid, obatInitials,
} from "./katalogObatShared";
import IdentitasTab from "./tabs/IdentitasTab";
import KlasifikasiTab from "./tabs/KlasifikasiTab";
import KlinisTab from "./tabs/KlinisTab";
import HargaTab from "./tabs/HargaTab";

interface ObatDetailProps {
  draft: ObatRecord;
  isNew: boolean;
  isDirty: boolean;
  onPatch: (patch: Partial<ObatRecord>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function ObatDetail({
  draft, isNew, isDirty, onPatch, onSave, onCancel, onDelete,
}: ObatDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("identitas");
  const valid = isObatValid(draft);

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header card */}
      <DetailHeader
        draft={draft}
        isNew={isNew}
        isDirty={isDirty}
        valid={valid}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
      />

      {/* Tabs strip */}
      <div className="shrink-0 border-b border-slate-100 px-2 pt-2">
        <div className="flex flex-wrap gap-1 overflow-x-auto">
          {TAB_REGISTRY.map((cfg) => (
            <TabButton
              key={cfg.key}
              cfg={cfg}
              active={cfg.key === activeTab}
              completeness={tabCompleteness(draft, cfg.key)}
              onClick={() => setActiveTab(cfg.key)}
            />
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
            {activeTab === "identitas" && <IdentitasTab draft={draft} onPatch={onPatch} />}
            {activeTab === "klasifikasi" && <KlasifikasiTab draft={draft} onPatch={onPatch} />}
            {activeTab === "klinis" && <KlinisTab draft={draft} onPatch={onPatch} />}
            {activeTab === "harga" && <HargaTab draft={draft} onPatch={onPatch} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ── Sub-components ───────────────────────────────────────

function DetailHeader({
  draft, isNew, isDirty, valid, onSave, onCancel, onDelete,
}: {
  draft: ObatRecord;
  isNew: boolean;
  isDirty: boolean;
  valid: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const catCfg = OBAT_KATEGORI_CFG[draft.kategori];
  const bentukCfg = BENTUK_CFG[draft.bentuk];
  const ruteShort = draft.rute ? RUTE_CFG[draft.rute].short : null;

  return (
    <header className="shrink-0 border-b border-slate-100 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl m-sm font-bold",
            catCfg.bg, catCfg.text,
          )}>
            {obatInitials(draft)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className={cn(
                "m-mini font-semibold uppercase tracking-widest",
                isNew ? "text-violet-600" : "text-slate-400",
              )}>
                {isNew ? "Obat Baru" : "Edit Obat"}
              </p>
              {isDirty && !isNew && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0 m-mini font-bold text-amber-700">
                  Perubahan belum tersimpan
                </span>
              )}
            </div>
            <h2 className="mt-0.5 truncate m-base font-bold text-slate-900">
              {draft.namaGenerik || <span className="italic text-slate-400">Nama generik belum diisi</span>}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={cn("rounded px-1.5 py-0 m-mini font-semibold", catCfg.bg, catCfg.text)}>
                {catCfg.short}
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0 m-mini font-semibold text-slate-600">
                {bentukCfg.short}
              </span>
              {draft.kekuatan && (
                <span className="m-mini font-semibold text-slate-600">{draft.kekuatan}</span>
              )}
              {ruteShort && (
                <span className="rounded bg-sky-50 px-1.5 py-0 m-mini font-semibold text-sky-700">
                  {ruteShort}
                </span>
              )}
              {draft.isHAM && (
                <span className="rounded bg-rose-100 px-1.5 py-0 m-mini font-bold text-rose-700">HAM</span>
              )}
              {draft.isLASA && (
                <span className="rounded bg-amber-100 px-1.5 py-0 m-mini font-bold text-amber-700">LASA</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!isNew && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 m-mini font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              <Trash2 size={11} />
              Hapus
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 m-mini font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <X size={11} />
            Batal
          </button>
          <motion.button
            type="button"
            onClick={onSave}
            disabled={!valid || !isDirty}
            whileTap={valid && isDirty ? { scale: 0.97 } : undefined}
            className={cn(
              "flex items-center gap-1 rounded-lg px-3 py-1.5 m-mini font-semibold transition",
              valid && isDirty
                ? "bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            {valid && isDirty ? <Save size={11} /> : <CheckCircle2 size={11} />}
            {isNew ? "Buat Obat" : "Simpan"}
          </motion.button>
        </div>
      </div>
    </header>
  );
}

function TabButton({
  cfg, active, completeness, onClick,
}: {
  cfg: TabConfig;
  active: boolean;
  completeness: { filled: number; total: number; pct: number };
  onClick: () => void;
}) {
  const Icon = cfg.icon;
  const isComplete = completeness.pct === 100;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-1.5 transition",
        active
          ? cn("border-current", cfg.accent.text, cfg.accent.bg)
          : "border-transparent text-slate-500 hover:bg-slate-50",
      )}
    >
      <Icon size={11} />
      <span className="m-xs font-semibold">{cfg.short}</span>
      <span
        className={cn(
          "ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full m-mini font-bold",
          isComplete
            ? "bg-emerald-500 text-white"
            : active
              ? "bg-white text-slate-700 ring-1 ring-slate-200"
              : "bg-slate-200 text-slate-500",
        )}
        title={`${completeness.filled}/${completeness.total} field utama terisi`}
      >
        {isComplete ? "✓" : completeness.total === 0 ? "·" : completeness.filled}
      </span>
    </motion.button>
  );
}
