"use client";

/**
 * Tab navigation horizontal untuk panel detail master.
 *
 * Dipakai oleh `MasterDetailPanel`, tapi dipisah supaya bisa dipakai standalone
 * pada layout lain (mis. workflow tabs di Mapping Hub).
 *
 * Pemakaian:
 *   <MasterTabNav<MyTabKey>
 *     accent="rose"
 *     tabs={MY_TABS}
 *     active={tab}
 *     onChange={setTab}
 *     renderBadge={(t) => <CompletenessBadge tabKey={t} ... />}
 *   />
 *
 * Tab config menggunakan `accentText` opsional per item supaya active-color
 * bisa berbeda per-tab (mis. Identitas=rose, Persiapan=amber, Template=sky).
 * Jika tidak diset, pakai accent default panel.
 */

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { getAccent, type MasterAccent } from "./masterAccent";

export interface MasterTab<K extends string> {
  key: K;
  label: string;
  icon: LucideIcon;
  /** Override text color saat active. Default pakai `accent` panel. */
  accentText?: string;
  /** Disabled state — tab tidak bisa diklik. */
  disabled?: boolean;
}

export interface MasterTabNavProps<K extends string> {
  accent?: MasterAccent;
  tabs: ReadonlyArray<MasterTab<K>>;
  active: K;
  onChange: (key: K) => void;
  /** Optional render function untuk badge di belakang label tiap tab. */
  renderBadge?: (tabKey: K) => React.ReactNode;
  /** Aria label untuk tablist. */
  ariaLabel?: string;
  className?: string;
}

export default function MasterTabNav<K extends string>({
  accent = "rose",
  tabs,
  active,
  onChange,
  renderBadge,
  ariaLabel = "Tab navigation",
  className,
}: MasterTabNavProps<K>) {
  const a = getAccent(accent);

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex shrink-0 gap-0.5 border-b border-slate-100 bg-slate-50/50 px-3 pt-2",
        className,
      )}
    >
      {tabs.map((t) => {
        const isActive = active === t.key;
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={isActive}
            disabled={t.disabled}
            onClick={() => !t.disabled && onChange(t.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-t-lg border border-transparent px-3 py-2 text-xs font-medium transition outline-none focus-visible:ring-2",
              a.ringFocus,
              t.disabled && "cursor-not-allowed opacity-40",
              isActive
                ? cn(
                    "border-slate-200 border-b-white bg-white text-slate-800 shadow-sm",
                    t.accentText ?? a.textAccent,
                  )
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
            )}
          >
            <Icon size={12} />
            {t.label}
            {renderBadge && renderBadge(t.key)}
          </button>
        );
      })}
    </div>
  );
}
