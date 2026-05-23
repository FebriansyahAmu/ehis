"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TextInput, type MasterAccent,
} from "@/components/master/shared";

interface Props {
  label: string;
  /** Hint tambahan di bawah label. */
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  accent: MasterAccent;
  placeholder?: string;
  /** Optional: lihat icon/dot di depan setiap row. */
  dot?: string;
  /** Compact: 1 baris saja per item. Default true. */
  compact?: boolean;
  /** Optional: empty state copy. */
  emptyHint?: string;
}

const ADD_BG: Record<MasterAccent, string> = {
  rose: "border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
  sky: "border-sky-200 bg-white text-sky-700 hover:bg-sky-50",
  teal: "border-teal-200 bg-white text-teal-700 hover:bg-teal-50",
  violet: "border-violet-200 bg-white text-violet-700 hover:bg-violet-50",
  emerald: "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
  amber: "border-amber-200 bg-white text-amber-700 hover:bg-amber-50",
  slate: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  pink: "border-pink-200 bg-white text-pink-700 hover:bg-pink-50",
};

/** Generic list editor — pakai untuk SLKI kriteria, SIKI per-kategori, dataMayor/Minor sub/obj. */
export default function ListEditor({
  label, hint, values, onChange, accent, placeholder = "Tambah baris…",
  dot, compact = true, emptyHint,
}: Props) {
  const add = () => onChange([...values, ""]);

  const update = (idx: number, v: string) => {
    onChange(values.map((x, i) => (i === idx ? v : x)));
  };

  const remove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {label}
            <span className="ml-1 font-mono text-[9px] text-slate-400">({values.length})</span>
          </p>
          {hint && <p className="text-[9.5px] text-slate-400">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={add}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition",
            ADD_BG[accent],
          )}
        >
          <Plus size={10} />
          Tambah
        </button>
      </div>

      {values.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5 text-center text-[10.5px] text-slate-500">
          {emptyHint ?? "Belum ada item. Klik Tambah untuk mulai."}
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          <AnimatePresence initial={false}>
            {values.map((v, idx) => (
              <motion.li
                key={idx}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-1"
              >
                {dot && (
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
                )}
                <span className="w-5 shrink-0 text-right font-mono text-[10px] text-slate-400">
                  {idx + 1}.
                </span>
                <div className="min-w-0 flex-1">
                  <TextInput
                    value={v}
                    onChange={(n) => update(idx, n)}
                    placeholder={placeholder}
                    maxW="max-w-none"
                    accent={accent}
                    className={compact ? "py-1" : undefined}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <IconBtn title="Naik" disabled={idx === 0} onClick={() => move(idx, -1)}>
                    <MoveUp size={10} />
                  </IconBtn>
                  <IconBtn title="Turun" disabled={idx === values.length - 1} onClick={() => move(idx, 1)}>
                    <MoveDown size={10} />
                  </IconBtn>
                  <IconBtn title="Hapus" variant="danger" onClick={() => remove(idx)}>
                    <Trash2 size={10} />
                  </IconBtn>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

// ── IconBtn ──

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
        "flex h-5 w-5 items-center justify-center rounded border transition outline-none focus-visible:ring-2",
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
