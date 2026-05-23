"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, MoveUp, MoveDown, ListChecks, Sparkles, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TextInput, NumberInput, SectionGroup,
} from "@/components/master/shared";
import type {
  SkalaRecord, SkalaItem, SkalaOption,
} from "@/lib/master/skalaCommon";
import { deriveTotalMax } from "../skalaConfig";

interface Props {
  draft: SkalaRecord;
  onPatch: (p: Partial<SkalaRecord>) => void;
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ItemsTab({ draft, onPatch }: Props) {
  const isSingleMode = draft.scoringMode === "select_value";

  // Mode "select_value" hanya boleh punya 1 item (= NRS/GCS-total style).
  // Auto-create satu item kalau kosong di mode itu.
  const items = useMemo(() => {
    if (isSingleMode && draft.items.length === 0) return [];
    return draft.items;
  }, [draft.items, isSingleMode]);

  const commit = (next: SkalaItem[]) => {
    onPatch({
      items: next,
      totalMax: deriveTotalMax(next, draft.scoringMode),
    });
  };

  const addItem = () => {
    if (isSingleMode && items.length >= 1) return;
    const newItem: SkalaItem = {
      id: uid("itm"),
      label: items.length === 0 && isSingleMode ? "Pilih intensitas" : "",
      maxScore: 0,
      options: [],
    };
    commit([...items, newItem]);
  };

  const updateItem = (id: string, patch: Partial<SkalaItem>) => {
    commit(items.map((it) => {
      if (it.id !== id) return it;
      const merged = { ...it, ...patch };
      // Auto-derive maxScore dari options
      merged.maxScore = merged.options.reduce(
        (m, o) => (o.score > m ? o.score : m), 0,
      );
      return merged;
    }));
  };

  const removeItem = (id: string) => {
    commit(items.filter((it) => it.id !== id));
  };

  const moveItem = (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((it) => it.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    commit(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Info Bar */}
      <ModeHintBar mode={draft.scoringMode} itemCount={items.length} totalMax={draft.totalMax} />

      {/* Items list */}
      <SectionGroup
        title={isSingleMode ? "Daftar Nilai (1 item)" : "Item Skor"}
        icon={<ListChecks size={11} />}
        accent={{ bg: "bg-emerald-50", text: "text-emerald-700" }}
        action={
          <button
            type="button"
            onClick={addItem}
            disabled={isSingleMode && items.length >= 1}
            className={cn(
              "flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700 transition",
              "hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <Plus size={11} />
            {isSingleMode ? "Tambah Item" : "Tambah Item"}
          </button>
        }
      >
        {items.length === 0 ? (
          <EmptyItems isSingleMode={isSingleMode} onAdd={addItem} />
        ) : (
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {items.map((item, idx) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                >
                  <ItemCard
                    item={item}
                    index={idx}
                    isFirst={idx === 0}
                    isLast={idx === items.length - 1}
                    showReorder={!isSingleMode}
                    onUpdate={(p) => updateItem(item.id, p)}
                    onRemove={() => removeItem(item.id)}
                    onMove={(d) => moveItem(item.id, d)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </SectionGroup>
    </div>
  );
}

// ── Mode hint bar ────────────────────────────────────────

function ModeHintBar({
  mode, itemCount, totalMax,
}: {
  mode: SkalaRecord["scoringMode"];
  itemCount: number;
  totalMax: number;
}) {
  const isSingle = mode === "select_value";
  return (
    <div className={cn(
      "flex items-start gap-2 rounded-lg border px-3 py-2",
      isSingle
        ? "border-sky-200 bg-sky-50/70"
        : "border-emerald-200 bg-emerald-50/70",
    )}>
      <Info size={13} className={cn("mt-0.5 shrink-0", isSingle ? "text-sky-600" : "text-emerald-600")} />
      <div className="flex-1 text-[11px] leading-relaxed">
        <p className={cn("font-semibold", isSingle ? "text-sky-800" : "text-emerald-800")}>
          {isSingle ? "Mode: Pilih Satu Nilai" : "Mode: Jumlah Skor Item"}
        </p>
        <p className={cn(isSingle ? "text-sky-700" : "text-emerald-700")}>
          {isSingle
            ? "Buat 1 item dengan beberapa opsi nilai. User memilih satu langsung — tanpa penjumlahan. Cocok untuk NRS Pain (0–10), GCS-Total, atau skala kategorikal lain."
            : "Tambah beberapa item; user pilih 1 opsi per item, total = jumlah skor terpilih. Cocok untuk Barthel, Morse, Braden, MUST."}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-600">
          <span><strong className="font-mono text-slate-800">{itemCount}</strong> item</span>
          <span className="text-slate-300">·</span>
          <span>Total Max: <strong className="font-mono text-slate-800">{totalMax}</strong> poin</span>
        </div>
      </div>
    </div>
  );
}

// ── Empty items ──────────────────────────────────────────

function EmptyItems({ isSingleMode, onAdd }: { isSingleMode: boolean; onAdd: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
      <Sparkles className="mx-auto mb-2 text-slate-400" size={20} />
      <p className="text-xs font-semibold text-slate-600">Belum ada item</p>
      <p className="mt-0.5 text-[10.5px] text-slate-500">
        {isSingleMode
          ? "Tambah 1 item lalu definisikan opsi nilai (mis. 0..10 untuk NRS)."
          : "Tambah item penilaian, lalu definisikan opsi skor untuk masing-masing."}
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
      >
        <Plus size={12} />
        Tambah Item Pertama
      </button>
    </div>
  );
}

// ── Item card ────────────────────────────────────────────

interface ItemCardProps {
  item: SkalaItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  showReorder: boolean;
  onUpdate: (p: Partial<SkalaItem>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}

function ItemCard({
  item, index, isFirst, isLast, showReorder, onUpdate, onRemove, onMove,
}: ItemCardProps) {
  const addOption = () => {
    const newOpt: SkalaOption = {
      score: item.options.length > 0
        ? Math.max(...item.options.map((o) => o.score)) + 1
        : 0,
      label: "",
    };
    onUpdate({ options: [...item.options, newOpt] });
  };

  const updateOption = (idx: number, patch: Partial<SkalaOption>) => {
    const next = item.options.map((o, i) => (i === idx ? { ...o, ...patch } : o));
    onUpdate({ options: next });
  };

  const removeOption = (idx: number) => {
    onUpdate({ options: item.options.filter((_, i) => i !== idx) });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-[10px] font-black text-emerald-700">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <TextInput
            value={item.label}
            onChange={(v) => onUpdate({ label: v })}
            placeholder="Nama item (mis. Makan, Riwayat Jatuh, BMI)"
            maxW="max-w-none"
            accent="emerald"
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {showReorder && (
            <>
              <IconBtn
                title="Naik"
                disabled={isFirst}
                onClick={() => onMove(-1)}
              >
                <MoveUp size={11} />
              </IconBtn>
              <IconBtn
                title="Turun"
                disabled={isLast}
                onClick={() => onMove(1)}
              >
                <MoveDown size={11} />
              </IconBtn>
            </>
          )}
          <IconBtn
            title="Hapus item"
            onClick={onRemove}
            variant="danger"
          >
            <Trash2 size={11} />
          </IconBtn>
        </div>
      </header>

      <div className="p-3">
        {/* Options sub-list */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Opsi Skor
            <span className="ml-1.5 font-mono text-[9px] font-bold text-emerald-700">
              max {item.maxScore}
            </span>
          </p>
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            <Plus size={10} />
            Opsi
          </button>
        </div>

        {item.options.length === 0 ? (
          <div className="mt-2 rounded-md border border-dashed border-slate-200 bg-slate-50/60 px-3 py-3 text-center">
            <p className="text-[10.5px] text-slate-500">
              Belum ada opsi. Tambah opsi skor (mis. 0 = Tidak, 5 = Sedang, 10 = Mandiri).
            </p>
          </div>
        ) : (
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-16 px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Skor
                  </th>
                  <th className="px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Label
                  </th>
                  <th className="px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Detail (opsional)
                  </th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {item.options.map((opt, idx) => (
                  <OptionRow
                    key={idx}
                    opt={opt}
                    onUpdate={(p) => updateOption(idx, p)}
                    onRemove={() => removeOption(idx)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Option row ───────────────────────────────────────────

function OptionRow({
  opt, onUpdate, onRemove,
}: {
  opt: SkalaOption;
  onUpdate: (p: Partial<SkalaOption>) => void;
  onRemove: () => void;
}) {
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-2 py-1 align-top">
        <NumberInput
          value={opt.score}
          onChange={(v) => onUpdate({ score: v ?? 0 })}
          min={0}
          max={999}
          maxW="max-w-[80px]"
          accent="emerald"
        />
      </td>
      <td className="px-2 py-1 align-top">
        <TextInput
          value={opt.label}
          onChange={(v) => onUpdate({ label: v })}
          placeholder="Mis. Mandiri penuh"
          maxW="max-w-none"
          accent="emerald"
        />
      </td>
      <td className="px-2 py-1 align-top">
        <TextInput
          value={opt.detail ?? ""}
          onChange={(v) => onUpdate({ detail: v || undefined })}
          placeholder="Penjelasan tambahan"
          maxW="max-w-none"
          accent="emerald"
        />
      </td>
      <td className="px-1 py-1 text-center align-top">
        <IconBtn title="Hapus opsi" onClick={onRemove} variant="danger">
          <Trash2 size={10} />
        </IconBtn>
      </td>
    </tr>
  );
}

// ── IconBtn ──────────────────────────────────────────────

function IconBtn({
  children, onClick, disabled, title, variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-md border transition outline-none focus-visible:ring-2",
        disabled
          ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
          : variant === "danger"
            ? "border-rose-200 bg-white text-rose-600 hover:bg-rose-50 focus-visible:ring-rose-200"
            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 focus-visible:ring-slate-200",
      )}
    >
      {children}
    </button>
  );
}
