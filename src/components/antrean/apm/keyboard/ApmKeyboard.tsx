"use client";

// ANT-ONSITE — On-screen keyboard (numeric pad / QWERTY) untuk kiosk sentuh.
// Muncul dari bawah saat ada field aktif. Mengetik di ujung nilai (tanpa caret).

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Delete, ArrowBigUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKioskKeyboard } from "./ApmKeyboardProvider";

const NUM_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

const QWERTY_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

export function ApmKeyboard() {
  const { active, close } = useKioskKeyboard();
  const [caps, setCaps] = useState(true);
  const open = active !== null;

  const press = (key: string) => {
    if (!active) return;
    const cur = active.getValue();
    let next: string;
    if (key === "BACK") next = cur.slice(0, -1);
    else if (key === "SPACE") next = `${cur} `;
    else next = cur + key;
    if (active.maxLength && next.length > active.maxLength) next = next.slice(0, active.maxLength);
    active.setValue(next);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="kb"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-slate-100/95 px-3 pb-4 pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur print:hidden"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            {/* Bar atas: tutup */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={close}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 active:bg-slate-100"
              >
                <ChevronDown className="h-4 w-4" /> Tutup
              </button>
            </div>

            {active?.layout === "numeric" ? (
              <NumericPad onPress={press} />
            ) : (
              <Qwerty caps={caps} onToggleCaps={() => setCaps((c) => !c)} onPress={press} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Tombol dasar ───────────────────────────────────────────

function Key({
  children,
  onClick,
  className,
  grow,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  grow?: boolean;
  tone?: "default" | "accent";
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={cn(
        "flex h-14 items-center justify-center rounded-xl text-xl font-semibold shadow-sm transition-colors",
        tone === "default" && "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 active:bg-slate-100",
        tone === "accent" && "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700",
        grow ? "flex-1" : "w-14",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

// ── Numpad ─────────────────────────────────────────────────

function NumericPad({ onPress }: { onPress: (k: string) => void }) {
  return (
    <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-2">
      {NUM_ROWS.flat().map((n) => (
        <Key key={n} grow onClick={() => onPress(n)}>
          {n}
        </Key>
      ))}
      <Key grow className="text-base" onClick={() => onPress("BACK")} tone="accent">
        <Delete className="h-6 w-6" />
      </Key>
      <Key grow onClick={() => onPress("0")}>
        0
      </Key>
      <span aria-hidden />
    </div>
  );
}

// ── QWERTY ─────────────────────────────────────────────────

function Qwerty({
  caps,
  onToggleCaps,
  onPress,
}: {
  caps: boolean;
  onToggleCaps: () => void;
  onPress: (k: string) => void;
}) {
  const render = (ch: string) => (/[a-z]/.test(ch) && caps ? ch.toUpperCase() : ch);
  return (
    <div className="flex flex-col gap-1.5">
      {QWERTY_ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5">
          {i === 3 && (
            <Key grow tone={caps ? "accent" : "default"} onClick={onToggleCaps} className="max-w-[68px] text-base">
              <ArrowBigUp className="h-6 w-6" />
            </Key>
          )}
          {row.map((ch) => (
            <Key key={ch} grow className="max-w-[56px]" onClick={() => onPress(render(ch))}>
              {render(ch)}
            </Key>
          ))}
          {i === 3 && (
            <Key grow tone="accent" onClick={() => onPress("BACK")} className="max-w-[68px]">
              <Delete className="h-6 w-6" />
            </Key>
          )}
        </div>
      ))}
      <div className="flex justify-center gap-1.5">
        <Key grow onClick={() => onPress("SPACE")} className="max-w-md">
          Spasi
        </Key>
      </div>
    </div>
  );
}
