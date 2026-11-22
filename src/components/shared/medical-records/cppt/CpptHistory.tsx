"use client";

// Riwayat CPPT: cari + filter profesi (dalam <search>), toggle "Tindak lanjut" & "Belum diverifikasi"
// (dengan jumlah), dikelompokkan per tanggal dengan pemisah lengket. Daftar bergulir sendiri di layar
// lebar supaya form tetap terlihat berdampingan.

import { useId, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Flag, Loader2, NotebookPen, RotateCcw, Search, ShieldAlert, X } from "lucide-react";
import type { CPPTEntry, CPPTProfesi } from "@/lib/data";
import { cn } from "@/lib/ui/utils";
import { Select } from "@/components/shared/inputs";
import CPPTEntryCard from "../CPPTEntryCard";
import { PROFESI_LIST, dayLabel } from "../cpptShared";

const SEMUA = "Semua profesi";

/** Catatan yang masih menunggu co-sign DPJP. */
export function pendingVerification(e: CPPTEntry, serverMode: boolean, requiresVerification: boolean): boolean {
  if (e.verified) return false;
  if (serverMode) return e.verified === false;
  return requiresVerification || e.jenisCatatan === "TBAK";
}

function Toggle({ on, onClick, icon: Icon, label, count, tone }: {
  on: boolean;
  onClick: () => void;
  icon: typeof Flag;
  label: string;
  count: number;
  tone: "rose" | "amber";
}) {
  const t = tone === "rose"
    ? { on: "border-rose-300 bg-rose-50 text-rose-800", hover: "hover:border-rose-200 hover:text-rose-700", badge: "bg-rose-600 text-white" }
    : { on: "border-amber-300 bg-amber-50 text-amber-900", hover: "hover:border-amber-200 hover:text-amber-800", badge: "bg-amber-600 text-white" };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 m-xs font-medium transition",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600",
        on ? t.on : cn("border-slate-200 bg-white text-slate-600", t.hover),
      )}
    >
      <Icon className={cn("size-3.5", on && tone === "rose" && "fill-rose-500")} aria-hidden="true" />
      {label}
      <span className={cn("min-w-5 rounded-full px-1.5 text-center m-mini font-bold tabular-nums", count ? t.badge : "bg-slate-100 text-slate-500")}>
        {count}
      </span>
    </button>
  );
}

export interface CpptHistoryProps {
  entries: CPPTEntry[];
  loading: boolean;
  busy: boolean;
  error: string | null;
  onDismissError: () => void;
  editingId: string | null;
  flashId: string | null;
  requiresVerification: boolean;
  /** Mode DB: nama akun login (verifikator); undefined = mode demo. */
  serverVerifier: string | null | undefined;
  canDelete: (e: CPPTEntry) => boolean;
  onCopy: (e: CPPTEntry) => void;
  onEdit: (e: CPPTEntry) => void;
  onVerify: (id: string, verifiedBy: string, verifiedAt: string) => void;
  onFlag: (id: string) => void;
  onDelete: (e: CPPTEntry) => void;
}

export function CpptHistory(p: CpptHistoryProps) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [profesi, setProfesi] = useState<CPPTProfesi | typeof SEMUA>(SEMUA);
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [onlyPending, setOnlyPending] = useState(false);

  const serverMode = p.serverVerifier !== undefined;
  const isPending = (e: CPPTEntry) => pendingVerification(e, serverMode, p.requiresVerification);
  const flaggedCount = p.entries.filter((e) => e.flagged).length;
  const pendingCount = p.entries.filter(isPending).length;
  const showPendingToggle = pendingCount > 0 || p.requiresVerification;
  const filterActive = !!query || profesi !== SEMUA || onlyFlagged || onlyPending;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return p.entries.filter((e) => {
      if (profesi !== SEMUA && e.profesi !== profesi) return false;
      if (onlyFlagged && !e.flagged) return false;
      if (onlyPending && !pendingVerification(e, serverMode, p.requiresVerification)) return false;
      if (!q) return true;
      return [e.penulis, e.subjektif, e.objektif, e.asesmen, e.planning, e.instruksi, e.tbakPemberi]
        .some((f) => f?.toLowerCase().includes(q));
    });
  }, [p.entries, p.requiresVerification, serverMode, query, profesi, onlyFlagged, onlyPending]);

  // Terbaru dulu; dikelompokkan per tanggal bila catatan bertanggal (selalu di mode DB).
  const groups = useMemo<{ key: string; label: string | null; items: CPPTEntry[] }[]>(() => {
    const dated = filtered.some((e) => e.tanggal);
    if (!dated) return [{ key: "all", label: null, items: filtered }];
    const sorted = [...filtered].sort((a, b) =>
      (b.tanggal ?? "").localeCompare(a.tanggal ?? "") || b.waktu.localeCompare(a.waktu));
    const map = new Map<string, CPPTEntry[]>();
    for (const e of sorted) {
      const k = e.tanggal ?? "";
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return [...map.entries()].map(([k, items]) => ({ key: k || "none", label: k ? dayLabel(k) : "Tanpa tanggal", items }));
  }, [filtered]);

  const resetFilters = () => { setQuery(""); setProfesi(SEMUA); setOnlyFlagged(false); setOnlyPending(false); };

  return (
    <section aria-labelledby={`${uid}-title`} className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={`${uid}-title`} className="m-sm font-semibold text-slate-900">Riwayat CPPT</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 m-tiny font-semibold tabular-nums text-slate-600">
          {filterActive ? `${filtered.length} dari ${p.entries.length}` : p.entries.length}
        </span>
        {p.busy && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 m-tiny font-medium text-slate-600">
            <Loader2 className="size-3 animate-spin" aria-hidden="true" /> Menyimpan…
          </span>
        )}
      </div>

      {p.error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
          <AlertTriangle className="size-3.5 shrink-0 text-rose-600" aria-hidden="true" />
          <p className="min-w-0 flex-1 m-xs font-medium text-rose-800">{p.error}</p>
          <button
            type="button"
            onClick={p.onDismissError}
            aria-label="Tutup pesan"
            className="rounded p-0.5 text-rose-500 transition hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-rose-600"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      <search className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <label htmlFor={`${uid}-q`} className="sr-only">Cari catatan CPPT</label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id={`${uid}-q`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari isi catatan atau penulis…"
            autoComplete="off"
            enterKeyHint="search"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-9 text-base text-slate-900 transition placeholder:text-slate-400 hover:border-slate-400 focus-visible:border-indigo-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-500/15 sm:h-9 sm:text-sm"
          />
        </div>
        <div className="sm:w-44">
          <Select
            value={profesi}
            onChange={(v) => setProfesi(v as CPPTProfesi | typeof SEMUA)}
            options={[SEMUA, ...PROFESI_LIST]}
          />
        </div>
      </search>

      <div className="flex flex-wrap items-center gap-1.5">
        <Toggle on={onlyFlagged} onClick={() => setOnlyFlagged((v) => !v)} icon={Flag} label="Tindak lanjut" count={flaggedCount} tone="rose" />
        {showPendingToggle && (
          <Toggle on={onlyPending} onClick={() => setOnlyPending((v) => !v)} icon={ShieldAlert} label="Belum diverifikasi" count={pendingCount} tone="amber" />
        )}
        {filterActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 m-xs font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-500"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" /> Reset filter
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:max-h-[calc(100dvh-17rem)] lg:overflow-y-auto lg:pr-1 lg:[scrollbar-gutter:stable]">
        {p.loading ? (
          <div aria-busy="true" aria-label="Memuat catatan CPPT" className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-xl border border-slate-200 bg-white motion-safe:animate-pulse">
                <div className="m-3 h-5 w-1/3 rounded bg-slate-100" />
                <div className="mx-3 h-3 w-5/6 rounded bg-slate-100" />
                <div className="mx-3 mt-2 h-3 w-2/3 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <NotebookPen className="size-5" />
            </span>
            {p.entries.length === 0 ? (
              <div>
                <p className="m-sm font-semibold text-slate-800">Belum ada catatan CPPT</p>
                <p className="mt-0.5 m-xs text-slate-500">Catatan pertama yang disimpan akan tampil di sini.</p>
              </div>
            ) : (
              <div>
                <p className="m-sm font-semibold text-slate-800">Tidak ada catatan yang cocok</p>
                <button type="button" onClick={resetFilters} className="mt-1 m-xs font-semibold text-indigo-700 underline-offset-2 hover:underline">
                  Reset filter
                </button>
              </div>
            )}
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.key} className="flex flex-col gap-2.5">
              {g.label && (
                <h3 className="sticky top-0 z-10 -mb-0.5 flex items-center gap-2 bg-slate-50/95 py-1 backdrop-blur supports-backdrop-filter:bg-slate-50/80">
                  <CalendarDays className="size-3.5 text-slate-400" aria-hidden="true" />
                  <span className="m-tiny font-bold uppercase tracking-wider text-slate-600">{g.label}</span>
                  <span className="m-tiny tabular-nums text-slate-400">{g.items.length} catatan</span>
                  <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
                </h3>
              )}
              {g.items.map((e, i) => (
                <CPPTEntryCard
                  key={e.id}
                  entry={e}
                  isEditing={p.editingId === e.id}
                  flash={p.flashId === e.id}
                  onCopy={p.onCopy}
                  onEdit={p.onEdit}
                  onVerify={p.onVerify}
                  onFlag={p.onFlag}
                  onDelete={p.onDelete}
                  canDelete={p.canDelete(e)}
                  requiresVerification={p.requiresVerification}
                  serverVerifier={p.serverVerifier}
                  delay={Math.min(i * 0.03, 0.18)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
