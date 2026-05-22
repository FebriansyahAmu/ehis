/**
 * Accent class lookup untuk Master Template Layer.
 *
 * Setiap halaman master memilih satu `MasterAccent` (rose/sky/teal/violet/emerald/amber/slate/pink),
 * lalu komponen shared (`MasterPageLayout`, `MasterListPanel`, dst) memakai mapping di sini
 * untuk derive class Tailwind yang konsisten — tidak perlu mengulang `bg-rose-50 text-rose-700 ...`
 * di tiap pemanggilan.
 *
 * Pola palette per accent:
 *   - bg50/100/600/700           → background scale
 *   - text600/700/800            → text scale
 *   - border200/300              → border idle/hover
 *   - ring100/200/300            → focus / active ring
 *   - dot                        → status dot 1.5×1.5
 *   - softBg/softText            → chip/badge soft (xx-50 + xx-700)
 */

export type MasterAccent =
  | "rose"
  | "sky"
  | "teal"
  | "violet"
  | "emerald"
  | "amber"
  | "slate"
  | "pink";

export interface AccentClasses {
  /** Solid background untuk button primer */
  bgSolid: string;
  /** Hover untuk button primer */
  bgSolidHover: string;
  /** Soft background (50) untuk chip/section header */
  softBg: string;
  /** Soft text (700) untuk chip/section header */
  softText: string;
  /** Border idle (200) */
  borderIdle: string;
  /** Border hover (300) */
  borderHover: string;
  /** Ring focus (200) */
  ringFocus: string;
  /** Ring tipis active (100) */
  ringActive: string;
  /** Text accent untuk link / eyebrow / icon */
  textAccent: string;
  /** Dot status (500) */
  dot: string;
  /** Active list row left-border */
  activeBorderL: string;
  /** Active list row background */
  activeBg: string;
  /** Active list row text */
  activeText: string;
}

export const ACCENT_MAP: Record<MasterAccent, AccentClasses> = {
  rose: {
    bgSolid: "bg-rose-600",
    bgSolidHover: "hover:bg-rose-700",
    softBg: "bg-rose-50",
    softText: "text-rose-700",
    borderIdle: "border-rose-200",
    borderHover: "hover:border-rose-300",
    ringFocus: "focus-visible:ring-rose-200",
    ringActive: "ring-rose-100",
    textAccent: "text-rose-600",
    dot: "bg-rose-500",
    activeBorderL: "border-l-rose-500",
    activeBg: "bg-rose-50",
    activeText: "text-rose-800",
  },
  sky: {
    bgSolid: "bg-sky-600",
    bgSolidHover: "hover:bg-sky-700",
    softBg: "bg-sky-50",
    softText: "text-sky-700",
    borderIdle: "border-sky-200",
    borderHover: "hover:border-sky-300",
    ringFocus: "focus-visible:ring-sky-200",
    ringActive: "ring-sky-100",
    textAccent: "text-sky-600",
    dot: "bg-sky-500",
    activeBorderL: "border-l-sky-500",
    activeBg: "bg-sky-50",
    activeText: "text-sky-800",
  },
  teal: {
    bgSolid: "bg-teal-600",
    bgSolidHover: "hover:bg-teal-700",
    softBg: "bg-teal-50",
    softText: "text-teal-700",
    borderIdle: "border-teal-200",
    borderHover: "hover:border-teal-300",
    ringFocus: "focus-visible:ring-teal-200",
    ringActive: "ring-teal-100",
    textAccent: "text-teal-600",
    dot: "bg-teal-500",
    activeBorderL: "border-l-teal-500",
    activeBg: "bg-teal-50",
    activeText: "text-teal-800",
  },
  violet: {
    bgSolid: "bg-violet-600",
    bgSolidHover: "hover:bg-violet-700",
    softBg: "bg-violet-50",
    softText: "text-violet-700",
    borderIdle: "border-violet-200",
    borderHover: "hover:border-violet-300",
    ringFocus: "focus-visible:ring-violet-200",
    ringActive: "ring-violet-100",
    textAccent: "text-violet-600",
    dot: "bg-violet-500",
    activeBorderL: "border-l-violet-500",
    activeBg: "bg-violet-50",
    activeText: "text-violet-800",
  },
  emerald: {
    bgSolid: "bg-emerald-600",
    bgSolidHover: "hover:bg-emerald-700",
    softBg: "bg-emerald-50",
    softText: "text-emerald-700",
    borderIdle: "border-emerald-200",
    borderHover: "hover:border-emerald-300",
    ringFocus: "focus-visible:ring-emerald-200",
    ringActive: "ring-emerald-100",
    textAccent: "text-emerald-600",
    dot: "bg-emerald-500",
    activeBorderL: "border-l-emerald-500",
    activeBg: "bg-emerald-50",
    activeText: "text-emerald-800",
  },
  amber: {
    bgSolid: "bg-amber-600",
    bgSolidHover: "hover:bg-amber-700",
    softBg: "bg-amber-50",
    softText: "text-amber-700",
    borderIdle: "border-amber-200",
    borderHover: "hover:border-amber-300",
    ringFocus: "focus-visible:ring-amber-200",
    ringActive: "ring-amber-100",
    textAccent: "text-amber-600",
    dot: "bg-amber-500",
    activeBorderL: "border-l-amber-500",
    activeBg: "bg-amber-50",
    activeText: "text-amber-800",
  },
  slate: {
    bgSolid: "bg-slate-700",
    bgSolidHover: "hover:bg-slate-800",
    softBg: "bg-slate-100",
    softText: "text-slate-700",
    borderIdle: "border-slate-200",
    borderHover: "hover:border-slate-300",
    ringFocus: "focus-visible:ring-slate-300",
    ringActive: "ring-slate-100",
    textAccent: "text-slate-600",
    dot: "bg-slate-500",
    activeBorderL: "border-l-slate-500",
    activeBg: "bg-slate-100",
    activeText: "text-slate-800",
  },
  pink: {
    bgSolid: "bg-pink-600",
    bgSolidHover: "hover:bg-pink-700",
    softBg: "bg-pink-50",
    softText: "text-pink-700",
    borderIdle: "border-pink-200",
    borderHover: "hover:border-pink-300",
    ringFocus: "focus-visible:ring-pink-200",
    ringActive: "ring-pink-100",
    textAccent: "text-pink-600",
    dot: "bg-pink-500",
    activeBorderL: "border-l-pink-500",
    activeBg: "bg-pink-50",
    activeText: "text-pink-800",
  },
};

/** Helper: ambil class set untuk satu accent. */
export function getAccent(accent: MasterAccent = "rose"): AccentClasses {
  return ACCENT_MAP[accent];
}

/**
 * Gradient empty-state per accent — pair gradient lembut yang konsisten dengan accent.
 * Dipakai oleh MasterEmptyState.
 */
export const EMPTY_GRADIENT: Record<MasterAccent, string> = {
  rose:    "from-rose-50/60 via-white to-amber-50/40",
  sky:     "from-sky-50/60 via-white to-cyan-50/40",
  teal:    "from-teal-50/60 via-white to-emerald-50/40",
  violet:  "from-violet-50/60 via-white to-fuchsia-50/40",
  emerald: "from-emerald-50/60 via-white to-teal-50/40",
  amber:   "from-amber-50/60 via-white to-orange-50/40",
  slate:   "from-slate-50/80 via-white to-slate-50/40",
  pink:    "from-pink-50/60 via-white to-rose-50/40",
};

/** Ring + shadow untuk icon hero di empty state. */
export const EMPTY_ICON_RING: Record<MasterAccent, string> = {
  rose:    "ring-rose-100",
  sky:     "ring-sky-100",
  teal:    "ring-teal-100",
  violet:  "ring-violet-100",
  emerald: "ring-emerald-100",
  amber:   "ring-amber-100",
  slate:   "ring-slate-100",
  pink:    "ring-pink-100",
};

/**
 * Class set lengkap (static, purge-safe) untuk `focus-within:` di search input.
 * Dipakai oleh MasterListPanel.
 */
export const SEARCH_FOCUS_WITHIN: Record<MasterAccent, string> = {
  rose:    "focus-within:border-rose-300 focus-within:ring-rose-100",
  sky:     "focus-within:border-sky-300 focus-within:ring-sky-100",
  teal:    "focus-within:border-teal-300 focus-within:ring-teal-100",
  violet:  "focus-within:border-violet-300 focus-within:ring-violet-100",
  emerald: "focus-within:border-emerald-300 focus-within:ring-emerald-100",
  amber:   "focus-within:border-amber-300 focus-within:ring-amber-100",
  slate:   "focus-within:border-slate-300 focus-within:ring-slate-100",
  pink:    "focus-within:border-pink-300 focus-within:ring-pink-100",
};

/**
 * Hover state untuk dashed-border "Tambah" CTA: border tebal + soft bg.
 * Dipakai oleh MasterListPanel.
 */
export const ADD_CTA_HOVER: Record<MasterAccent, string> = {
  rose:    "hover:border-rose-400 hover:bg-rose-50",
  sky:     "hover:border-sky-400 hover:bg-sky-50",
  teal:    "hover:border-teal-400 hover:bg-teal-50",
  violet:  "hover:border-violet-400 hover:bg-violet-50",
  emerald: "hover:border-emerald-400 hover:bg-emerald-50",
  amber:   "hover:border-amber-400 hover:bg-amber-50",
  slate:   "hover:border-slate-400 hover:bg-slate-50",
  pink:    "hover:border-pink-400 hover:bg-pink-50",
};

/**
 * Border idle untuk dashed-border "Tambah" CTA — agak gelap supaya kontras dengan bg.
 */
export const ADD_CTA_BORDER: Record<MasterAccent, string> = {
  rose:    "border-rose-300",
  sky:     "border-sky-300",
  teal:    "border-teal-300",
  violet:  "border-violet-300",
  emerald: "border-emerald-300",
  amber:   "border-amber-300",
  slate:   "border-slate-300",
  pink:    "border-pink-300",
};
