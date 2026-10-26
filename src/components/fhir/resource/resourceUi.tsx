"use client";

// Primitif UI konsol Resource/Kunjungan: pill status payload, tombol salin, pohon JSON, drawer detail.

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Copy, ChevronRight, ChevronsDownUp, ChevronsUpDown, X, Braces, Info, Link2, TriangleAlert,
  CircleCheck, CircleDashed, RefreshCw, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PayloadStatus } from "@/lib/api/fhir/resources";
import { Pill, SkeletonRows, TONE_SOFT } from "../fhirShared";
import { PAYLOAD_STATUS, metaOf, summarize, groupTone } from "./resourceCatalog";

export const UNMAPPED = "(belum-terpetakan)";

const STATUS_ICON: Record<PayloadStatus, LucideIcon> = { synced: CircleCheck, changed: RefreshCw, new: CircleDashed };

export function PayloadStatusPill({ status, short }: { status: PayloadStatus; short?: boolean }) {
  const cfg = PAYLOAD_STATUS[status];
  const Icon = STATUS_ICON[status];
  return (
    <span title={cfg.hint} className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", TONE_SOFT[cfg.tone])}>
      <Icon size={11} aria-hidden />
      {short ? cfg.short : cfg.label}
    </span>
  );
}

export function CopyButton({ text, label = "Salin", className }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1400);
    } catch { /* clipboard ditolak browser — abaikan */ }
  }
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); void copy(); }}
      title={done ? "Tersalin" : label}
      aria-label={label}
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition outline-none hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-teal-300",
        done && "text-emerald-600",
        className,
      )}
    >
      {done ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
    </button>
  );
}

/** ID panjang (UUID/IHS) dipotong + tombol salin. */
export function IdChip({ value, muted }: { value: string | null | undefined; muted?: string }) {
  if (!value) return <span className="text-slate-400">{muted ?? "—"}</span>;
  const unmapped = value === UNMAPPED;
  return (
    <span className="inline-flex min-w-0 items-center gap-0.5">
      <code className={cn("truncate font-mono text-[11px]", unmapped ? "text-rose-600" : "text-slate-700")} title={value}>{value}</code>
      {!unmapped && <CopyButton text={value} label="Salin ID" />}
    </span>
  );
}

// ── JSON tree ───────────────────────────────────────────────

function Primitive({ v }: { v: unknown }) {
  if (v === null) return <span className="text-slate-400">null</span>;
  if (typeof v === "number") return <span className="text-sky-700">{v}</span>;
  if (typeof v === "boolean") return <span className="text-amber-700">{String(v)}</span>;
  const s = String(v);
  const tone =
    s === UNMAPPED || s.includes(UNMAPPED) ? "text-rose-600 font-semibold"
    : /^urn:uuid:|\/urn:uuid:/.test(s) ? "text-slate-500 italic"
    : /^[A-Z][A-Za-z]+\/[\w.-]+$/.test(s) ? "text-teal-700"
    : "text-emerald-800";
  return <span className={cn("break-all", tone)}>&quot;{s}&quot;</span>;
}

function JsonNode({ name, value, depth, openDepth }: { name?: string; value: unknown; depth: number; openDepth: number }) {
  const isArr = Array.isArray(value);
  const isObj = !!value && typeof value === "object";
  const [open, setOpen] = useState(depth < openDepth);
  const label = name !== undefined ? <span className="text-slate-500">{name}: </span> : null;

  if (!isObj) {
    return (
      <div className="pl-4 leading-relaxed">
        {label}<Primitive v={value} />
      </div>
    );
  }
  const entries = isArr ? (value as unknown[]).map((v, i) => [String(i), v] as const) : Object.entries(value as Record<string, unknown>);
  const [o, c] = isArr ? ["[", "]"] : ["{", "}"];
  return (
    <div className={cn(depth > 0 && "pl-4")}>
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        aria-expanded={open}
        className="-ml-4 inline-flex items-center gap-0.5 rounded text-left outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-300"
      >
        <ChevronRight size={12} className={cn("shrink-0 text-slate-400 transition", open && "rotate-90")} aria-hidden />
        {label}
        <span className="text-slate-400">{o}</span>
        {!open && <span className="px-1 text-[10.5px] text-slate-400">{entries.length} {isArr ? "item" : "field"} {c}</span>}
      </button>
      {open && (
        <>
          {entries.map(([k, v]) => <JsonNode key={k} name={isArr ? undefined : k} value={v} depth={depth + 1} openDepth={openDepth} />)}
          <div className="text-slate-400">{c}</div>
        </>
      )}
    </div>
  );
}

export function JsonView({ value, className }: { value: unknown; className?: string }) {
  const [openDepth, setOpenDepth] = useState(2);
  const [gen, setGen] = useState(0);
  const text = JSON.stringify(value, null, 2);
  const set = (d: number) => { setOpenDepth(d); setGen((g) => g + 1); };
  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-1.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <Braces size={12} aria-hidden /> JSON · {(text.length / 1024).toFixed(1)} KB
        </span>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => set(99)} title="Buka semua" aria-label="Buka semua" className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <ChevronsUpDown size={13} aria-hidden />
          </button>
          <button type="button" onClick={() => set(1)} title="Ciutkan" aria-label="Ciutkan" className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <ChevronsDownUp size={13} aria-hidden />
          </button>
          <CopyButton text={text} label="Salin JSON" />
        </div>
      </div>
      <div className="max-h-[60vh] overflow-auto px-3 py-2 pl-5 font-mono text-[11.5px]">
        <JsonNode key={gen} value={value} depth={0} openDepth={openDepth} />
      </div>
    </div>
  );
}

// ── Referensi di payload ────────────────────────────────────

export interface PayloadRef { field: string; reference: string; display?: string }

/** Kumpulkan semua `{reference}` (dangkal 3 tingkat) — siapa yang ditunjuk resource ini. */
export function collectRefs(payload: unknown): PayloadRef[] {
  const out: PayloadRef[] = [];
  const walk = (v: unknown, path: string, depth: number) => {
    if (!v || typeof v !== "object" || depth > 3) return;
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}[${i}]`, depth + 1)); return; }
    const o = v as Record<string, unknown>;
    if (typeof o.reference === "string") {
      out.push({ field: path, reference: o.reference, display: typeof o.display === "string" ? o.display : undefined });
      return;
    }
    for (const [k, x] of Object.entries(o)) walk(x, path ? `${path}.${k}` : k, depth + 1);
  };
  walk(payload, "", 0);
  return out;
}

// ── Drawer detail ───────────────────────────────────────────

export interface DrawerMeta { label: string; value: React.ReactNode }

export function ResourceDrawer({
  open, onClose, resourceType, status, payload, note, meta, loading, error, footer,
}: {
  open: boolean;
  onClose: () => void;
  resourceType: string;
  status: PayloadStatus | null;
  payload: unknown;
  note?: string | null;
  meta: DrawerMeta[];
  loading?: boolean;
  error?: string | null;
  footer?: React.ReactNode;
}) {
  const [tab, setTab] = useState<"ringkasan" | "json">("ringkasan");
  const closeRef = useRef<HTMLButtonElement>(null);
  const m = metaOf(resourceType);
  const Icon = m.icon;
  const sum = payload ? summarize(resourceType, payload) : null;
  const refs = payload ? collectRefs(payload) : [];

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Detail ${m.label}`}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" onClick={onClose} />
          <motion.aside
            initial={{ x: 32, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 32, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
          >
            <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TONE_SOFT[groupTone(m.group)])}>
                <Icon size={18} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{resourceType} · {m.label}</p>
                <h2 className="mt-0.5 truncate text-base font-bold text-slate-900">{sum?.title ?? m.label}</h2>
                {sum?.subtitle && <p className="truncate text-xs text-slate-500">{sum.subtitle}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {status && <PayloadStatusPill status={status} />}
                  {sum?.chips.map((c) => <Pill key={c} label={c} />)}
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition outline-none hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-teal-300"
              >
                <X size={16} aria-hidden />
              </button>
            </header>

            <div className="flex gap-1 border-b border-slate-100 px-5" role="tablist">
              {(["ringkasan", "json"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  disabled={t === "json" && !payload}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-2 text-xs font-semibold transition outline-none disabled:cursor-not-allowed disabled:opacity-40",
                    tab === t ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-800",
                  )}
                >
                  {t === "ringkasan" ? "Ringkasan" : "Payload JSON"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading ? <SkeletonRows rows={6} /> : error ? (
                <Callout tone="rose" icon={TriangleAlert}>{error}</Callout>
              ) : tab === "json" && payload ? (
                <JsonView value={payload} />
              ) : (
                <div className="flex flex-col gap-4">
                  {status && <Callout tone={PAYLOAD_STATUS[status].tone} icon={STATUS_ICON[status]}>{PAYLOAD_STATUS[status].hint}.</Callout>}
                  {note && <Callout tone="slate" icon={Info}>{note}</Callout>}

                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                    {sum?.when && <MetaItem label="Waktu klinis" value={sum.when} />}
                    {meta.map((x) => <MetaItem key={x.label} {...x} />)}
                  </dl>

                  {refs.length > 0 && (
                    <div>
                      <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <Link2 size={12} aria-hidden /> Referensi ({refs.length})
                      </h3>
                      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                        {refs.map((r) => (
                          <li key={`${r.field}|${r.reference}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 px-3 py-2 text-xs">
                            <span className="min-w-0">
                              <span className="font-mono text-[10.5px] text-slate-400">{r.field}</span>
                              {r.display && <span className="ml-2 font-medium text-slate-700">{r.display}</span>}
                            </span>
                            <IdChip value={r.reference} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {payload ? (
                    <button type="button" onClick={() => setTab("json")} className="self-start text-xs font-semibold text-teal-700 hover:underline">
                      Lihat payload JSON lengkap →
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function MetaItem({ label, value }: DrawerMeta) {
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 min-w-0 truncate text-xs text-slate-700">{value}</dd>
    </div>
  );
}

export function Callout({ tone, icon: Icon, children }: { tone: keyof typeof TONE_SOFT; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs leading-relaxed", TONE_SOFT[tone])}>
      <Icon size={14} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
