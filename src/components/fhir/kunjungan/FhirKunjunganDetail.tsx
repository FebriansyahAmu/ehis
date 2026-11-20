"use client";

// Detail SatuSehat 1 kunjungan: identitas + IHS, progres kirim, prasyarat, kartu semua resource
// (Terkirim / Berubah / Belum) dengan payload, dan riwayat job. Pratinjau tanpa memanggil SatuSehat.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Route, RefreshCw, Send, Zap, TriangleAlert, Info, ListChecks, Ban, UserRound, Stethoscope, MapPin, CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { useCan } from "@/components/auth/Can";
import { getEncounterDetail, type EncounterDetailDTO } from "@/lib/api/fhir/resources";
import { runOutbox, syncEncounterNow } from "@/lib/api/fhir/outbox";
import { Button, Pill, SectionCard, SkeletonRows, errMsg, isAbort, FHIR_ACCENT } from "../fhirShared";
import { Callout, IdChip } from "../resource/resourceUi";
import { fmtDateTime } from "../resource/resourceTime";
import { EncounterResourceGrid } from "./EncounterResourceGrid";
import { JobTimeline } from "./JobTimeline";
import { ENCOUNTER_TARGET_LABEL, KUNJUNGAN_STATUS_LABEL, UNIT_LABEL } from "./kunjunganShared";

const MODE: Record<string, { label: string; tone: "slate" | "amber" | "emerald" }> = {
  mock: { label: "Mock", tone: "slate" }, sandbox: { label: "Sandbox", tone: "amber" }, prod: { label: "Produksi", tone: "emerald" },
};

function ageOf(iso: string | null): string | null {
  if (!iso) return null;
  const b = new Date(iso);
  const n = new Date();
  let y = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) y--;
  return `${y} th`;
}

export default function FhirKunjunganDetail({ kunjunganId }: { kunjunganId: string }) {
  const can = useCan();
  const [d, setD] = useState<EncounterDetailDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"queue" | "send" | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const x = await getEncounterDetail(kunjunganId, signal);
      if (!signal?.aborted) { setD(x); setError(null); }
    } catch (e) {
      if (!isAbort(e)) setError(errMsg(e) ?? "Gagal memuat kunjungan");
    }
  }, [kunjunganId]);

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  async function queue(sendNow: boolean) {
    setBusy(sendNow ? "send" : "queue");
    try {
      await syncEncounterNow(kunjunganId);
      if (sendNow) {
        const r = await runOutbox(10);
        const msg = `${r.acked} terkirim · ${r.failed} gagal · ${r.skipped} dilewati · ${r.dijadwalUlang} dijadwal ulang`;
        if (r.failed) toast.warning("Antrean dijalankan", msg); else toast.success("Antrean dijalankan", msg);
      } else {
        toast.success("Sinkron diantre", "Job akan dikirim saat antrean dijalankan.");
      }
      await load();
    } catch (e) {
      toast.error("Gagal mengirim", errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  const back = (
    <Link href="/ehis-fhir/kunjungan" className="inline-flex items-center gap-1 self-start text-xs font-semibold text-slate-500 transition hover:text-teal-700">
      <ArrowLeft size={13} aria-hidden /> Semua kunjungan
    </Link>
  );

  if (error && !d) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        {back}
        <Callout tone="rose" icon={TriangleAlert}>{error}</Callout>
      </div>
    );
  }
  if (!d) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        {back}
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        <div className="rounded-2xl border border-slate-200 bg-white"><SkeletonRows rows={6} /></div>
      </div>
    );
  }

  const k = d.kunjungan;
  const total = d.resources.length;
  const pct = total ? Math.round((d.counts.synced / total) * 100) : 0;
  const mode = MODE[d.mode] ?? { label: d.mode, tone: "slate" as const };
  const canSend = can("fhir.sync", "create") && !!d.target;
  const age = ageOf(k.pasien.tanggalLahir);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {back}

      {/* ── Hero ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 bg-linear-to-br from-teal-50/80 via-white to-white p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", FHIR_ACCENT.bg, FHIR_ACCENT.text)}>
              <Route size={22} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-600">Kunjungan · {k.noKunjungan}</p>
              <h1 className="mt-0.5 truncate text-xl font-bold text-slate-900">{k.pasien.nama}</h1>
              <p className="text-xs text-slate-500">
                RM {k.pasien.noRm}{k.pasien.gender ? ` · ${k.pasien.gender}` : ""}{age ? ` · ${age}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Pill label={UNIT_LABEL[k.unit] ?? k.unit} tone="teal" />
                <Pill label={KUNJUNGAN_STATUS_LABEL[k.status] ?? k.status} />
                {d.target && <Pill label={`Encounter: ${ENCOUNTER_TARGET_LABEL[d.target] ?? d.target}`} tone="sky" />}
                <Pill label={`Lingkungan ${mode.label}`} tone={mode.tone} dot />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={() => { setD(null); void load(); }}>Muat ulang</Button>
            {canSend && <Button variant="secondary" icon={Send} loading={busy === "queue"} disabled={!!busy} onClick={() => void queue(false)}>Antre sinkron</Button>}
            {canSend && <Button icon={Zap} loading={busy === "send"} disabled={!!busy} onClick={() => void queue(true)}>Kirim sekarang</Button>}
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-t border-slate-100 px-4 py-3 text-xs sm:grid-cols-2 sm:px-5 lg:grid-cols-4">
          <Fact icon={Stethoscope} label="Practitioner (DPJP)" value={k.dpjp ?? "—"} />
          <Fact icon={MapPin} label="Location" value={k.ruangan ?? "—"} />
          <Fact icon={CalendarClock} label="Masuk → Selesai" value={`${fmtDateTime(k.dilayaniAt ?? k.waktuKunjungan)} → ${k.selesaiAt ? fmtDateTime(k.selesaiAt) : "…"}`} />
          <Fact icon={UserRound} label="IHS Patient" value={<IdChip value={k.pasien.ihsId} muted="belum di-resolve" />} />
          <Fact icon={Route} label="IHS Encounter" value={<IdChip value={d.encounterIhsId} muted="belum terkirim" />} />
          <Fact icon={ListChecks} label="ID kunjungan" value={<IdChip value={k.id} />} />
        </dl>
      </section>

      {/* ── Progres ── */}
      {d.target && total > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Progres kirim">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Progres kirim</p>
              <p className="text-lg font-black text-slate-900">
                {d.counts.synced} <span className="text-sm font-semibold text-slate-400">dari {total} resource terkirim</span>
              </p>
            </div>
            <p className="text-3xl font-black tabular-nums text-teal-700">{pct}%</p>
          </div>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${d.counts.synced} terkirim, ${d.counts.changed} berubah, ${d.counts.new} belum`}>
            <span className="bg-emerald-500 transition-all" style={{ width: `${(d.counts.synced / total) * 100}%` }} />
            <span className="bg-amber-400 transition-all" style={{ width: `${(d.counts.changed / total) * 100}%` }} />
            <span className="bg-sky-300 transition-all" style={{ width: `${(d.counts.new / total) * 100}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <Legend dot="bg-emerald-500" label="Terkirim" n={d.counts.synced} />
            <Legend dot="bg-amber-400" label="Berubah — kirim ulang" n={d.counts.changed} />
            <Legend dot="bg-sky-300" label="Belum terkirim" n={d.counts.new} />
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-3">
          {d.skipReason && <Callout tone="slate" icon={Ban}><b>Belum ada yang dikirim.</b> {d.skipReason}.</Callout>}
          {d.blockers.length > 0 && (
            <Callout tone="rose" icon={TriangleAlert}>
              <p className="font-semibold">Prasyarat belum lengkap — job kirim akan gagal sampai dilengkapi</p>
              <ul className="mt-1 list-disc pl-4">{d.blockers.map((b, i) => <li key={i}>{b}</li>)}</ul>
              <Link href="/ehis-fhir/onboarding" className="mt-1 inline-block font-semibold underline">Buka Prerequisites →</Link>
            </Callout>
          )}
          {d.infos.map((msg, i) => <Callout key={i} tone="sky" icon={Info}>{msg}</Callout>)}
          {!d.skipReason && (
            <EncounterResourceGrid resources={d.resources} orphans={d.orphans} counts={d.counts} />
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          {d.notes.length > 0 && (
            <SectionCard title="Data dilewati" desc="Tidak dikirim karena data belum memenuhi syarat SatuSehat">
              <ul className="flex flex-col gap-1.5 px-4 py-3 text-[11.5px] leading-snug text-amber-800">
                {d.notes.map((n, i) => (
                  <li key={i} className="flex items-start gap-1.5"><TriangleAlert size={12} className="mt-0.5 shrink-0 text-amber-500" aria-hidden />{n}</li>
                ))}
              </ul>
            </SectionCard>
          )}
          <SectionCard title="Riwayat job" desc={`${d.jobs.length} job terakhir`}>
            <JobTimeline jobs={d.jobs} />
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Route; label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon size={13} className="mt-0.5 shrink-0 text-slate-400" aria-hidden />
      <div className="min-w-0">
        <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
        <dd className="mt-0.5 min-w-0 truncate text-slate-700">{value}</dd>
      </div>
    </div>
  );
}

function Legend({ dot, label, n }: { dot: string; label: string; n: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", dot)} aria-hidden />
      {label} <b className="tabular-nums text-slate-700">{n}</b>
    </span>
  );
}
