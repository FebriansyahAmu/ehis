"use client";

// Riwayat job outbox 1 kunjungan — garis waktu vertikal (terbaru di atas).

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EncounterJobDTO } from "@/lib/api/fhir/resources";
import { Pill, type Tone } from "../fhirShared";
import { fmtDateTime } from "../resource/resourceTime";

const JOB: Record<string, { label: string; tone: Tone; dot: string }> = {
  Pending: { label: "Menunggu", tone: "sky", dot: "bg-sky-500" },
  Sending: { label: "Mengirim", tone: "teal", dot: "bg-teal-500" },
  Acked: { label: "Terkirim", tone: "emerald", dot: "bg-emerald-500" },
  Failed: { label: "Gagal", tone: "rose", dot: "bg-rose-500" },
  Skipped: { label: "Dilewati", tone: "slate", dot: "bg-slate-400" },
};

const TRIGGER: Record<string, string> = {
  receive: "Pasien diterima", complete: "Kunjungan selesai", reopen: "Batal selesai", cancel: "Kunjungan dibatalkan",
  manual: "Sinkron manual", dispense: "Obat diserahkan", diagnostic: "Hasil penunjang divalidasi",
};

type Err = { message?: string; reason?: string; issues?: { code: string; diagnostics: string | null }[] };
type Refs = { refs?: { resourceType: string; op: string }[]; notes?: string[] };

function triggerLabel(t: string): string {
  const key = t.split(".").at(-1) ?? t;
  return TRIGGER[key] ?? t;
}

export function JobTimeline({ jobs }: { jobs: EncounterJobDTO[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!jobs.length) return <p className="px-4 py-6 text-center text-xs text-slate-400">Belum ada job untuk kunjungan ini.</p>;

  return (
    <ol className="relative flex flex-col gap-0.5 px-4 py-3">
      {jobs.map((j, i) => {
        const cfg = JOB[j.status] ?? JOB.Skipped;
        const err = (j.lastError ?? null) as Err | null;
        const refs = (j.ihsRefs ?? null) as Refs | null;
        const changed = (refs?.refs ?? []).filter((r) => r.op !== "noop");
        const expandable = !!(err || refs);
        const isOpen = open === j.id;
        return (
          <li key={j.id} className="relative pl-5">
            {i < jobs.length - 1 && <span className="absolute left-1.25 top-4 h-full w-px bg-slate-200" aria-hidden />}
            <span className={cn("absolute left-0 top-1.5 h-2.75 w-2.75 rounded-full ring-2 ring-white", cfg.dot)} aria-hidden />
            <button
              type="button"
              disabled={!expandable}
              onClick={() => setOpen(isOpen ? null : j.id)}
              aria-expanded={expandable ? isOpen : undefined}
              className="flex w-full items-start justify-between gap-2 rounded-lg px-1.5 py-1 text-left transition enabled:hover:bg-slate-50"
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-slate-700">{triggerLabel(j.trigger)}</span>
                <span className="block text-[10.5px] text-slate-400">{fmtDateTime(j.createdAt)} · {j.attempts}× coba</span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <Pill label={cfg.label} tone={cfg.tone} />
                {expandable && <ChevronDown size={12} className={cn("text-slate-300 transition", isOpen && "rotate-180")} aria-hidden />}
              </span>
            </button>
            {isOpen && (
              <div className="mb-2 ml-1.5 mt-1 flex flex-col gap-1.5 text-[11px]">
                {err && (
                  <div className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-rose-800">
                    <p className="font-semibold">{err.message ?? err.reason}</p>
                    {err.issues?.length ? (
                      <ul className="mt-0.5 list-disc pl-4">{err.issues.map((x, n) => <li key={n}><code className="font-mono">{x.code}</code> {x.diagnostics}</li>)}</ul>
                    ) : null}
                  </div>
                )}
                {refs?.refs && (
                  <p className="text-slate-500">
                    {changed.length ? `${changed.length} resource dibuat/diperbarui` : "Tidak ada perubahan (semua sudah sesuai)"}
                  </p>
                )}
                {refs?.notes?.length ? <ul className="list-disc pl-4 text-amber-800">{refs.notes.map((n, k) => <li key={k}>{n}</li>)}</ul> : null}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
