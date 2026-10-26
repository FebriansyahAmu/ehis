"use client";

// Onboarding SatuSehat (FH1) — petakan master RS ke SatuSehat: Organisasi (sub-unit) → Ruangan
// (Location, butuh Organisasi) → Nakes (Practitioner, GET-only by NIK). Idempoten: aman diulang (R8).

import { useCallback, useEffect, useState } from "react";
import { Building2, DoorOpen, Stethoscope, Play, RefreshCw, ListX, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { useCan } from "@/components/auth/Can";
import {
  getOnboardingSummary, runOnboarding,
  type OnboardingJenis, type OnboardingRunDTO, type OnboardingSummaryDTO,
} from "@/lib/api/fhir/onboarding";
import {
  FhirShell, SectionCard, Pill, Button, EmptyState, SkeletonRows, Reveal,
  errMsg, isAbort, tableWrap, tableCls, thCls, tdCls, trCls, type Tone,
} from "./fhirShared";

const STEPS: { jenis: OnboardingJenis; label: string; desc: string; icon: typeof Building2; needs?: OnboardingJenis }[] = [
  { jenis: "organization", label: "1 · Organisasi", desc: "Sub-unit RS (instalasi/departemen) → Organization. Induk RS = Org ID DevHub.", icon: Building2 },
  { jenis: "location", label: "2 · Ruangan", desc: "Ruangan → Location, dikelola Organization unitnya.", icon: DoorOpen, needs: "organization" },
  { jenis: "practitioner", label: "3 · Nakes", desc: "Pegawai ber-profesi kesehatan → resolve IHS Practitioner via NIK (tidak membuat data).", icon: Stethoscope },
];

const OUTCOME: Record<string, { label: string; tone: Tone }> = {
  created: { label: "Dibuat", tone: "emerald" },
  updated: { label: "Diperbarui", tone: "sky" },
  resolved: { label: "Dipetakan", tone: "teal" },
  unchanged: { label: "Tetap", tone: "slate" },
  skipped: { label: "Dilewati", tone: "amber" },
  failed: { label: "Gagal", tone: "rose" },
};

export default function FhirOnboarding() {
  const can = useCan();
  const canRun = can("fhir.sync", "create");
  const [summary, setSummary] = useState<OnboardingSummaryDTO | null>(null);
  const [running, setRunning] = useState<OnboardingJenis | null>(null);
  const [force, setForce] = useState(false);
  const [lastRun, setLastRun] = useState<OnboardingRunDTO | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const s = await getOnboardingSummary(signal);
      if (!signal?.aborted) setSummary(s);
    } catch (e) {
      if (!isAbort(e)) toast.error("Gagal memuat ringkasan onboarding", errMsg(e));
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  async function run(jenis: OnboardingJenis) {
    setRunning(jenis);
    try {
      const r = await runOnboarding(jenis, jenis === "practitioner" ? { force } : {});
      setLastRun(r);
      const c = r.counts;
      const msg = `${c.created} dibuat · ${c.updated} diperbarui · ${c.resolved} dipetakan · ${c.failed} gagal`;
      if (c.failed) toast.warning(`Sinkron ${jenis} selesai dengan kegagalan`, msg);
      else toast.success(`Sinkron ${jenis} selesai`, msg);
      await load();
    } catch (e) {
      toast.error(`Sinkron ${jenis} gagal`, errMsg(e));
    } finally {
      setRunning(null);
    }
  }

  return (
    <FhirShell
      icon={Building2}
      title="Onboarding SatuSehat"
      description="Petakan data master RS ke SatuSehat secara berurutan. Pencarian dilakukan dulu sebelum membuat data (anti-ganda); aman dijalankan ulang."
      actions={<Button variant="secondary" icon={RefreshCw} onClick={() => void load()}>Muat ulang</Button>}
    >
      {summary && (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Info size={13} aria-hidden /> Mode <Pill label={summary.mode} tone={summary.mode === "prod" ? "emerald" : summary.mode === "sandbox" ? "sky" : "amber"} />
          · Org ID <code className="font-mono text-slate-700">{summary.orgId}</code> · peta terpisah per mode
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {STEPS.map((s) => {
          const st = summary?.perJenis[s.jenis];
          const pct = st && st.lokal ? Math.round((st.terpetakan / st.lokal) * 100) : 0;
          const blocked = s.needs && summary ? summary.perJenis[s.needs].terpetakan === 0 : false;
          return (
            <SectionCard
              key={s.jenis}
              title={s.label}
              desc={s.desc}
              action={<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600"><s.icon size={15} aria-hidden /></span>}
            >
              {!st ? <SkeletonRows rows={3} /> : (
                <div className="flex flex-col gap-3 p-4">
                  <div>
                    <div className="mb-1 flex items-baseline justify-between text-xs">
                      <span className="text-slate-500">Terpetakan</span>
                      <span className="font-bold tabular-nums text-slate-900">{st.terpetakan} / {st.lokal}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${s.label} terpetakan`}>
                      <div className={cn("h-full rounded-full transition-all duration-500", pct === 100 ? "bg-emerald-500" : "bg-teal-500")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {st.belum.length > 0 && (
                    <details className="group rounded-lg border border-slate-100 bg-slate-50/60 text-xs">
                      <summary className="cursor-pointer select-none px-2.5 py-1.5 font-semibold text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-teal-300">
                        {st.lokal - st.terpetakan} belum terpetakan
                      </summary>
                      <ul className="max-h-40 overflow-auto px-2.5 pb-2">
                        {st.belum.map((b) => (
                          <li key={b.localId} className="flex gap-2 py-0.5">
                            <code className="shrink-0 font-mono text-[10.5px] text-slate-400">{b.kode}</code>
                            <span className="truncate text-slate-600">{b.nama}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {s.jenis === "practitioner" && (
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-300" />
                      Resolve ulang yang sudah terpetakan (setelah koreksi NIK)
                    </label>
                  )}

                  {blocked && <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-800">Jalankan Organisasi dulu — ruangan butuh unit yang sudah terpetakan.</p>}

                  {canRun && (
                    <Button icon={Play} onClick={() => void run(s.jenis)} loading={running === s.jenis} disabled={!!running && running !== s.jenis}>
                      Jalankan sinkron
                    </Button>
                  )}
                </div>
              )}
            </SectionCard>
          );
        })}
      </div>

      <Reveal show={!!lastRun}>
        {lastRun && (
          <SectionCard
            title={`Hasil terakhir · ${lastRun.jenis}`}
            desc={`${lastRun.total} item diproses dalam ${lastRun.durationMs} ms (mode ${lastRun.mode}) — item "Tetap" tidak ditampilkan`}
            action={
              <div className="flex flex-wrap justify-end gap-1">
                {Object.entries(lastRun.counts).filter(([, v]) => v > 0).map(([k, v]) => (
                  <Pill key={k} label={`${OUTCOME[k].label} ${v}`} tone={OUTCOME[k].tone} />
                ))}
              </div>
            }
          >
            {lastRun.items.length === 0 ? (
              <EmptyState icon={ListX} title="Tidak ada perubahan" desc="Semua item sudah sesuai dengan SatuSehat." />
            ) : (
              <div className={tableWrap}>
                <table className={tableCls}>
                  <thead>
                    <tr>
                      <th className={thCls}>Kode</th>
                      <th className={thCls}>Nama</th>
                      <th className={thCls}>Hasil</th>
                      <th className={thCls}>IHS id</th>
                      <th className={thCls}>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastRun.items.map((it) => (
                      <tr key={it.localId} className={trCls}>
                        <td className={cn(tdCls, "font-mono text-[11px] text-slate-500")}>{it.kode}</td>
                        <td className={tdCls}>{it.nama}</td>
                        <td className={tdCls}><Pill label={OUTCOME[it.outcome].label} tone={OUTCOME[it.outcome].tone} /></td>
                        <td className={cn(tdCls, "font-mono text-[11px]")}>{it.ihsId ?? "—"}</td>
                        <td className={cn(tdCls, "text-slate-500")}>{it.message ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}
      </Reveal>
    </FhirShell>
  );
}
