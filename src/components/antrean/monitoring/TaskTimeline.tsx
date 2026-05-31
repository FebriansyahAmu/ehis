"use client";

// ANT5 — Timeline TaskID 1..7/99 per kodebooking + status kirim + aksi koreksi/re-send.

import { cn } from "@/lib/utils";
import { TASK_LABEL, TASK_SEQUENCE, type AntreanRecord, type TaskId, type TaskLog } from "@/lib/antrean/types";
import { KirimBadge, fmtClock } from "./monitoringShared";

export function TaskTimeline({ rec, onEdit }: { rec: AntreanRecord; onEdit: (t: TaskLog) => void }) {
  const seq = TASK_SEQUENCE[rec.jenisPasien];
  const has99 = rec.tasks.some((t) => t.taskid === 99);
  const ids: TaskId[] = has99 ? [...seq, 99] : [...seq];

  return (
    <ol className="flex flex-col">
      {ids.map((id, i) => {
        const t = rec.tasks.find((x) => x.taskid === id);
        const last = i === ids.length - 1;
        return (
          <li key={id} className="relative flex gap-3 pb-3 last:pb-0">
            {!last && <span className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200" />}
            <span
              className={cn(
                "z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full m-mini font-bold",
                t ? (id === 99 ? "bg-rose-500 text-white" : "bg-sky-600 text-white") : "border border-dashed border-slate-300 bg-white text-slate-300",
              )}
            >
              {id === 99 ? "!" : id}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={cn("m-xs font-semibold", t ? "text-slate-700" : "text-slate-400")}>{TASK_LABEL[id]}</p>
                {t && <KirimBadge status={t.kirim} />}
              </div>
              {t ? (
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 m-tiny text-slate-400">
                  <span className="tabular-nums">{fmtClock(t.waktu)}</span>
                  <span>· {t.attempts}× attempt</span>
                  <button type="button" onClick={() => onEdit(t)} className="font-semibold text-sky-600 hover:underline">
                    koreksi / re-send
                  </button>
                </div>
              ) : (
                <p className="m-tiny italic text-slate-300">belum dikirim</p>
              )}
              {t?.error && <p className="mt-0.5 m-mini text-rose-500">{t.error}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
