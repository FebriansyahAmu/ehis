"use client";

// 1 baris log pengiriman = <details> native (disclosure: keyboard, Find-in-page, state terbuka bebas
// per baris). Isi request/response baru diambil saat baris dibuka (lazy) — daftar tetap ringan.

import { useEffect, useId, useRef, useState } from "react";
import { ChevronRight, Info, Layers, RotateCw, ScissorsLineDashed, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSendLog, type SendLogDetailDTO, type SendLogRowDTO, type SendLogTarget } from "@/lib/api/fhir/sendLog";
import { Button, Pill, SkeletonRows, errMsg, isAbort } from "../fhirShared";
import { Callout, CopyButton, IdChip, JsonView } from "../resource/resourceUi";
import { fmtDateTime, fmtRelative } from "../resource/resourceTime";
import { METHOD_TONE, bundleEntry, fmtBytes, fmtDuration, fullPath, statusLabel, statusTone } from "./sendLogFormat";

type View = "entry" | "bundle";

export function SendLogEntry({ row, focus, retensiHari }: { row: SendLogRowDTO; focus: SendLogTarget; retensiHari: number }) {
  const [state, setState] = useState<{ d: SendLogDetailDTO | null; error: string | null } | null>(null);
  const [view, setView] = useState<View>("entry");
  const acRef = useRef<AbortController | null>(null);
  const path = fullPath(row);

  useEffect(() => () => acRef.current?.abort(), []);

  function load() {
    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;
    setState(null);
    getSendLog(row.id, focus, ac.signal)
      .then((d) => { if (!ac.signal.aborted) setState({ d, error: null }); })
      .catch((e) => { if (!isAbort(e)) setState({ d: null, error: errMsg(e) ?? "Gagal memuat isi log" }); });
  }

  function onToggle(e: React.SyntheticEvent<HTMLDetailsElement>) {
    if (e.currentTarget.open && !state?.d) load();
  }

  const d = state?.d ?? null;
  const showEntry = !!(d?.viaBundle && d.entryIndex && view === "entry");
  const reqBody = d ? (showEntry ? bundleEntry(d.request.body, d.entryIndex) : d.request.body) : null;
  const resBody = d ? (showEntry ? bundleEntry(d.response.body, d.entryIndex) : d.response.body) : null;

  return (
    <li>
      <details className="group" onToggle={onToggle}>
        <summary
          className={cn(
            "flex cursor-pointer list-none flex-col gap-1 px-3 py-2.5 outline-none transition-colors hover:bg-slate-50",
            "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 [&::-webkit-details-marker]:hidden",
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <ChevronRight
              size={14}
              className="shrink-0 text-slate-400 transition-transform group-open:rotate-90 motion-reduce:transition-none"
              aria-hidden
            />
            <Pill label={row.method} tone={METHOD_TONE[row.method] ?? "slate"} />
            <Pill label={statusLabel(row)} tone={statusTone(row)} dot />
            <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-700" title={path}>{path}</code>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-slate-400">{fmtDuration(row.durationMs)}</span>
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-[22px] text-[11px] text-slate-500">
            <time dateTime={row.startedAt} title={fmtRelative(row.startedAt)}>{fmtDateTime(row.startedAt)}</time>
            <span aria-hidden>·</span>
            <span>{row.actorNama ?? row.actor}</span>
            {row.viaBundle && (
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-px font-medium text-sky-700">
                <Layers size={11} aria-hidden />
                Bundle{row.entryIndex ? ` · entry ${row.entryIndex}/${row.entryCount ?? "?"}` : ""}
              </span>
            )}
            {row.retryCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-px font-medium text-amber-700">
                <RotateCw size={11} aria-hidden /> {row.retryCount}× ulang
              </span>
            )}
            {!row.hasBody && <span className="text-slate-400">· isi tidak tersimpan</span>}
          </span>
        </summary>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-3 py-3">
          {!state ? (
            <SkeletonRows rows={3} />
          ) : state.error ? (
            <div className="flex flex-wrap items-center gap-2">
              <Callout tone="rose" icon={TriangleAlert}>{state.error}</Callout>
              <Button variant="secondary" icon={RotateCw} onClick={load}>Coba lagi</Button>
            </div>
          ) : d && (
            <>
              {!d.hasBody && (
                <Callout tone="slate" icon={Info}>
                  Isi request/response tidak tersimpan — log sebelum fitur ini, melewati retensi {retensiHari} hari, atau pencatatan isi dimatikan.
                </Callout>
              )}
              {d.truncated && (
                <Callout tone="amber" icon={ScissorsLineDashed}>Isi melebihi batas simpan — ditampilkan terpotong sebagai teks.</Callout>
              )}
              {d.viaBundle && d.entryIndex && <ViewSwitch value={view} onChange={setView} entry={d.entryIndex} count={d.entryCount} />}

              <BodyBlock
                title="Request"
                badge={<Pill label={d.method} tone={METHOD_TONE[d.method] ?? "slate"} />}
                line={path}
                bytes={showEntry ? null : d.request.bytes}
                body={reqBody}
                empty={d.method === "GET" ? "Tanpa body — permintaan GET." : "Tanpa body."}
              />
              <BodyBlock
                title="Response"
                badge={<Pill label={statusLabel(d)} tone={statusTone(d)} dot />}
                line={d.success ? (d.ihsId ? `IHS id ${d.ihsId}` : "Diterima SatuSehat") : (d.errorType ?? "Ditolak")}
                bytes={showEntry ? null : d.response.bytes}
                body={resBody}
                empty="Tanpa body respons."
              />

              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white p-3 text-xs sm:grid-cols-2">
                <Meta label="Waktu">{new Date(d.startedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium" })}</Meta>
                <Meta label="Durasi">{fmtDuration(d.durationMs)}{d.retryCount ? ` · ${d.retryCount}× ulang` : ""}</Meta>
                <Meta label="Pelaku">{d.actorNama ?? d.actor}</Meta>
                <Meta label="Mode">{d.mode}</Meta>
                <Meta label="Endpoint (template)"><code className="font-mono text-[11px]">{d.endpoint}</code></Meta>
                <Meta label="ID log"><IdChip value={d.id} /></Meta>
              </dl>
            </>
          )}
        </div>
      </details>
    </li>
  );
}

function ViewSwitch({ value, onChange, entry, count }: { value: View; onChange: (v: View) => void; entry: number; count: number | null }) {
  const name = useId();
  const opts: { v: View; label: string }[] = [
    { v: "entry", label: `Entry data ini (#${entry})` },
    { v: "bundle", label: `Bundle lengkap${count ? ` (${count} entry)` : ""}` },
  ];
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">Tampilan isi Bundle</legend>
      <div className="inline-flex rounded-lg bg-slate-200/60 p-0.5">
        {opts.map((o) => (
          <label key={o.v} className="relative">
            <input type="radio" name={name} value={o.v} checked={value === o.v} onChange={() => onChange(o.v)} className="peer sr-only" />
            <span className="inline-flex h-7 cursor-pointer items-center rounded-md px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 peer-checked:bg-white peer-checked:text-teal-800 peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-teal-600">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function BodyBlock({ title, badge, line, bytes, body, empty }: {
  title: string;
  badge: React.ReactNode;
  line: string;
  bytes: number | null;
  body: unknown;
  empty: string;
}) {
  const size = fmtBytes(bytes);
  return (
    <section className="flex min-w-0 flex-col gap-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
        {badge}
        <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-600" title={line}>{line}</code>
        {size && <span className="shrink-0 text-[10.5px] text-slate-400">{size}</span>}
        <CopyButton text={line} label={`Salin ${title.toLowerCase()} baris`} />
      </div>
      {body === null || body === undefined ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-400">{empty}</p>
      ) : typeof body === "string" ? (
        <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap break-all rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-[11px] text-slate-700">{body}</pre>
      ) : (
        <JsonView value={body} />
      )}
    </section>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 min-w-0 truncate text-slate-700">{children}</dd>
    </div>
  );
}
