"use client";

// Antrean kirim SatuSehat (outbox, FH3–FH7) — job per kunjungan dari aksi klinis (terima/selesai/
// dispensing/validasi hasil). Jalankan antrean manual, antre ulang job gagal, sinkron ulang 1 kunjungan.

import { Fragment, useCallback, useEffect, useState } from "react";
import { ListChecks, Play, RefreshCw, RotateCcw, Send, ChevronDown, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { useCan } from "@/components/auth/Can";
import { listOutbox, runOutbox, retryOutboxJob, syncEncounterNow, type OutboxItemDTO } from "@/lib/api/fhir/outbox";
import {
  FhirShell, SectionCard, Pill, Button, EmptyState, SkeletonRows,
  errMsg, isAbort, fmtTime, FHIR_ACCENT, tableWrap, tableCls, thCls, tdCls, trCls, type Tone,
} from "./fhirShared";

type Status = OutboxItemDTO["status"];
const STATUSES: Status[] = ["Pending", "Sending", "Acked", "Failed", "Skipped"];
const STATUS_CFG: Record<Status, { label: string; tone: Tone }> = {
  Pending: { label: "Menunggu", tone: "sky" },
  Sending: { label: "Mengirim", tone: "teal" },
  Acked: { label: "Terkirim", tone: "emerald" },
  Failed: { label: "Gagal", tone: "rose" },
  Skipped: { label: "Dilewati", tone: "slate" },
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Refs = { refs?: { resourceType: string; op: string }[]; notes?: string[] };
type LastError = { message?: string; type?: string; status?: number; issues?: { code: string; diagnostics: string | null }[]; reason?: string };

export default function FhirAntrean() {
  const can = useCan();
  const [status, setStatus] = useState<Status | "">("");
  const [rows, setRows] = useState<OutboxItemDTO[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [kid, setKid] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await listOutbox({ status: status || undefined, limit: 100 }, signal);
      if (!signal?.aborted) setRows(data);
    } catch (e) {
      if (!isAbort(e)) toast.error("Gagal memuat antrean", errMsg(e));
    }
  }, [status]);

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  async function act(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
      await load();
    } finally {
      setBusy(null);
    }
  }

  const run = () => act("run", async () => {
    try {
      const r = await runOutbox(10);
      const msg = `${r.diproses} diproses · ${r.acked} terkirim · ${r.dijadwalUlang} dijadwal ulang · ${r.failed} gagal · ${r.skipped} dilewati`;
      if (r.failed) toast.warning("Antrean dijalankan", msg);
      else toast.success("Antrean dijalankan", msg);
    } catch (e) { toast.error("Gagal menjalankan antrean", errMsg(e)); }
  });

  const retry = (id: string) => act(`retry:${id}`, async () => {
    try { await retryOutboxJob(id); toast.success("Job diantre ulang"); } catch (e) { toast.error("Gagal antre ulang", errMsg(e)); }
  });

  const syncKunjungan = () => act("sync", async () => {
    try { await syncEncounterNow(kid.trim()); toast.success("Sinkron kunjungan diantre", "Jalankan antrean untuk mengirim."); setKid(""); }
    catch (e) { toast.error("Gagal mengantre kunjungan", errMsg(e)); }
  });

  const kidValid = UUID_RE.test(kid.trim());

  return (
    <FhirShell
      icon={ListChecks}
      title="Antrean Kirim"
      description="Job sinkron per kunjungan, dibuat otomatis saat pasien diterima/selesai, obat diserahkan, atau hasil penunjang divalidasi. Payload dibangun dari data terkini saat dikirim."
      actions={
        <>
          <Button variant="secondary" icon={RefreshCw} onClick={() => void load()}>Muat ulang</Button>
          {can("fhir.sync", "create") && <Button icon={Play} onClick={() => void run()} loading={busy === "run"}>Jalankan antrean</Button>}
        </>
      }
    >
      {can("fhir.sync", "create") && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (kidValid) void syncKunjungan(); }}
          className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sinkron ulang 1 kunjungan (ID kunjungan)</span>
            <input
              value={kid}
              onChange={(e) => setKid(e.target.value)}
              placeholder="UUID kunjungan, mis. 0199a1b2-…"
              aria-invalid={!!kid && !kidValid}
              className={cn(
                "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs outline-none transition placeholder:font-sans placeholder:text-slate-400",
                FHIR_ACCENT.focus, kid && !kidValid && "border-rose-300",
              )}
            />
          </label>
          <Button type="submit" variant="secondary" icon={Send} loading={busy === "sync"} disabled={!kidValid}>Antre sinkron</Button>
        </form>
      )}

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter status">
        {(["", ...STATUSES] as const).map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => { if (s !== status) { setRows(null); setStatus(s); } }}
            aria-pressed={status === s}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-teal-300",
              status === s ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            )}
          >
            {s ? STATUS_CFG[s].label : "Semua"}
          </button>
        ))}
      </div>

      <SectionCard title="Job" desc="100 job terbaru · klik baris untuk detail">
        {!rows ? <SkeletonRows rows={5} /> : rows.length === 0 ? (
          <EmptyState icon={Inbox} title="Antrean kosong" desc="Job muncul otomatis dari aksi klinis, atau antre manual lewat ID kunjungan." />
        ) : (
          <div className={tableWrap}>
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Dibuat</th>
                  <th className={thCls}>Kunjungan</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Coba</th>
                  <th className={thCls}>Berikutnya</th>
                  <th className={thCls}>Keterangan</th>
                  <th className={thCls}><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const err = (r.lastError ?? null) as LastError | null;
                  const refs = (r.ihsRefs ?? null) as Refs | null;
                  const summary = err?.message ?? err?.reason ?? (refs?.refs ? `${refs.refs.length} resource` : "");
                  const expanded = open === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr
                        className={cn(trCls, "cursor-pointer hover:bg-slate-50/70")}
                        onClick={() => setOpen(expanded ? null : r.id)}
                        aria-expanded={expanded}
                      >
                        <td className={cn(tdCls, "whitespace-nowrap tabular-nums text-slate-500")}>{fmtTime(r.createdAt)}</td>
                        <td className={cn(tdCls, "font-mono text-[11px]")} title={r.kunjunganId ?? ""}>{r.kunjunganId?.slice(0, 8) ?? "—"}…</td>
                        <td className={tdCls}><Pill label={STATUS_CFG[r.status].label} tone={STATUS_CFG[r.status].tone} dot /></td>
                        <td className={cn(tdCls, "tabular-nums")}>{r.attempts}</td>
                        <td className={cn(tdCls, "whitespace-nowrap tabular-nums text-slate-500")}>{r.status === "Pending" ? fmtTime(r.nextAttemptAt) : "—"}</td>
                        <td className={cn(tdCls, "max-w-90 truncate text-slate-500")}>{summary}</td>
                        <td className={cn(tdCls, "whitespace-nowrap text-right")} onClick={(e) => e.stopPropagation()}>
                          {(r.status === "Failed" || r.status === "Skipped") && can("fhir.sync", "update") && (
                            <Button variant="ghost" icon={RotateCcw} onClick={() => void retry(r.id)} loading={busy === `retry:${r.id}`}>Antre ulang</Button>
                          )}
                          <ChevronDown size={14} className={cn("ml-1 inline text-slate-300 transition", expanded && "rotate-180")} aria-hidden />
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                          <td colSpan={7} className="px-4 py-3">
                            <JobDetail err={err} refs={refs} trigger={r.trigger} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </FhirShell>
  );
}

function JobDetail({ err, refs, trigger }: { err: LastError | null; refs: Refs | null; trigger: string }) {
  const byType = new Map<string, number>();
  for (const r of refs?.refs ?? []) if (r.op !== "noop") byType.set(r.resourceType, (byType.get(r.resourceType) ?? 0) + 1);
  return (
    <div className="flex flex-col gap-2 text-xs">
      <p className="text-slate-500">Trigger <code className="font-mono text-slate-700">{trigger}</code></p>
      {err && (
        <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-rose-800">
          <p className="font-semibold">{err.message ?? err.reason}</p>
          {(err.type || err.status) && <p className="mt-0.5 text-rose-700/80">{[err.type, err.status].filter(Boolean).join(" · ")}</p>}
          {err.issues?.length ? (
            <ul className="mt-1 list-disc pl-4">
              {err.issues.map((i, n) => <li key={n}><code className="font-mono">{i.code}</code> {i.diagnostics}</li>)}
            </ul>
          ) : null}
        </div>
      )}
      {byType.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[...byType].map(([t, n]) => <Pill key={t} label={`${t} ${n}`} tone="emerald" />)}
        </div>
      )}
      {refs?.refs && byType.size === 0 && <p className="text-slate-500">Tidak ada perubahan — semua resource sudah sesuai SatuSehat.</p>}
      {refs?.notes?.length ? (
        <ul className="list-disc pl-4 text-amber-800">
          {refs.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      ) : null}
    </div>
  );
}
