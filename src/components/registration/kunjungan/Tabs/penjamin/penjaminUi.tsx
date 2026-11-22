// Primitif kecil tab "Ubah Penjamin": judul langkah bernomor, callout berwarna semantik, chip detail.

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/ui/utils";

/** Judul langkah bernomor ("1 · Jenis penjamin") — angka hanya dekoratif, teks judul tetap terbaca. */
export function StepTitle({ n, title, desc, done }: { n: number; title: string; desc?: string; done?: boolean }) {
  return (
    <span className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className={cn(
          "mt-px flex size-6 shrink-0 items-center justify-center rounded-full m-tiny font-bold tabular-nums transition-colors",
          done ? "bg-emerald-600 text-white" : "bg-slate-900 text-white",
        )}
      >
        {done ? <CheckCircle2 className="size-3.5" /> : n}
      </span>
      <span className="min-w-0">
        <span className="block m-sm font-semibold text-slate-900">{title}</span>
        {desc && <span className="mt-0.5 block m-xs text-slate-500">{desc}</span>}
      </span>
    </span>
  );
}

type CalloutTone = "info" | "warning" | "danger" | "success" | "neutral";

const CALLOUT: Record<CalloutTone, { box: string; icon: string; Icon: LucideIcon }> = {
  info: { box: "bg-sky-50 text-sky-900 ring-sky-200", icon: "text-sky-600", Icon: Info },
  warning: { box: "bg-amber-50 text-amber-900 ring-amber-200", icon: "text-amber-600", Icon: AlertTriangle },
  danger: { box: "bg-rose-50 text-rose-900 ring-rose-200", icon: "text-rose-600", Icon: XCircle },
  success: { box: "bg-emerald-50 text-emerald-900 ring-emerald-200", icon: "text-emerald-600", Icon: CheckCircle2 },
  neutral: { box: "bg-slate-50 text-slate-700 ring-slate-200", icon: "text-slate-500", Icon: Info },
};

/** Kotak keterangan — ikon + teks (warna bukan satu-satunya penanda). */
export function Callout({
  tone, title, children, icon, action, className,
}: {
  tone: CalloutTone;
  title?: string;
  children?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  const c = CALLOUT[tone];
  const Icon = icon ?? c.Icon;
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl px-3.5 py-3 ring-1 ring-inset", c.box, className)}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", c.icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1 m-xs leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

type ChipTone = "plain" | "ok" | "muted" | "warn";

const CHIP: Record<ChipTone, string> = {
  plain: "border-slate-200 bg-white text-slate-700",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  muted: "border-dashed border-slate-300 bg-transparent text-slate-500",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
};

/** Chip detail ringkas (No. kartu, SEP, polis …) di kartu ringkasan. */
export function DetailChip({
  icon: Icon, children, tone = "plain", mono,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  tone?: ChipTone;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 m-tiny",
        CHIP[tone],
        mono && "font-mono tabular-nums",
      )}
    >
      {Icon && <Icon className="size-3 shrink-0" aria-hidden="true" />}
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Kelas input bersama — 16px di ponsel (cegah zoom iOS), 14px mulai sm. */
export const INPUT = cn(
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-900 shadow-xs transition sm:h-10 sm:text-sm",
  "placeholder:text-slate-400 hover:border-slate-400",
  "focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky-500/20",
  "aria-invalid:border-rose-500 aria-invalid:focus-visible:ring-rose-500/20",
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
);

/** Label field di atas input. */
export function FieldLabel({ htmlFor, children, optional }: { htmlFor: string; children: ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline gap-1.5 m-xs font-medium text-slate-700">
      {children}
      {optional && <span className="m-tiny font-normal text-slate-500">(opsional)</span>}
    </label>
  );
}
