"use client";

// Beranda konsol SatuSehat — kesehatan integrasi: mode & kelengkapan kredensial, token OAuth2,
// circuit breaker, antrean kirim, peta resource, dan panggilan terakhir (audit). Tanpa nilai rahasia (R1).

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Waypoints, KeyRound, Inbox, Network, RefreshCw, ShieldCheck, CheckCircle2, XCircle,
  Building2, ListChecks, UserCheck, ArrowRight, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { useCan } from "@/components/auth/Can";
import { getFhirStatus, probeFhirToken, type FhirStatusDTO } from "@/lib/api/fhir/status";
import {
  FhirShell, KpiCard, SectionCard, Pill, Button, EmptyState, SkeletonRows,
  errMsg, isAbort, fmtTime, tableWrap, tableCls, thCls, tdCls, trCls, type Tone,
} from "./fhirShared";

const MODE_TONE: Record<string, Tone> = { mock: "amber", sandbox: "sky", prod: "emerald", invalid: "rose" };
const MODE_LABEL: Record<string, string> = { mock: "Mock (tanpa jaringan)", sandbox: "Sandbox", prod: "Produksi", invalid: "Config tidak valid" };
const CIRCUIT_TONE: Record<string, Tone> = { closed: "emerald", "half-open": "amber", open: "rose" };
const OUTBOX_TONE: Record<string, Tone> = { Pending: "sky", Sending: "teal", Acked: "emerald", Failed: "rose", Skipped: "slate" };

const QUICK = [
  { href: "/ehis-fhir/onboarding", label: "Prerequisites", desc: "Organization · Location · Practitioner · Patient", icon: Building2 },
  { href: "/ehis-fhir/antrean", label: "Antrean Kirim", desc: "Job kunjungan & retry", icon: ListChecks },
  { href: "/ehis-fhir/pasien", label: "Pasien & NIK", desc: "Cek NIK · resolve IHS", icon: UserCheck },
] as const;

export default function FhirBeranda() {
  const can = useCan();
  const [data, setData] = useState<FhirStatusDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const dto = await getFhirStatus(signal);
      if (!signal?.aborted) setData(dto);
    } catch (e) {
      if (!isAbort(e)) toast.error("Gagal memuat status SatuSehat", errMsg(e));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  async function probe() {
    setProbing(true);
    try {
      const r = await probeFhirToken();
      if (r.ok) toast.success("Uji token berhasil", `${r.message} · ${r.durationMs} ms`);
      else toast.error("Uji token gagal", r.message);
      await load();
    } catch (e) {
      toast.error("Uji token gagal", errMsg(e));
    } finally {
      setProbing(false);
    }
  }

  const cfg = data?.config;
  const outbox = data?.outbox;
  const mapped = data ? Object.values(data.resourceMap).reduce((a, b) => a + b, 0) : 0;

  return (
    <FhirShell
      icon={Waypoints}
      title="Beranda SatuSehat"
      description="Kesehatan integrasi FHIR R4 ke Platform SatuSehat (Kemenkes): mode koneksi, token, antrean kirim, dan jejak panggilan terakhir."
      actions={
        <>
          <Button variant="secondary" icon={RefreshCw} onClick={() => void load()} loading={loading && !!data}>Muat ulang</Button>
          {can("fhir.sync", "update") && (
            <Button icon={KeyRound} onClick={() => void probe()} loading={probing} title="Ambil token OAuth2 (gagal → jeda 60 dtk)">
              Uji Token
            </Button>
          )}
        </>
      }
    >
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={ShieldCheck} label="Mode" tone={MODE_TONE[cfg?.mode ?? "mock"]}
          value={cfg ? MODE_LABEL[cfg.mode] : "—"} sub={cfg?.host || "tanpa host (mock)"} />
        <KpiCard icon={KeyRound} label="Token OAuth2" tone={data?.token.cached ? "emerald" : data?.token.coolingDownSec ? "rose" : "slate"}
          value={data?.token.cached ? "Aktif" : data?.token.coolingDownSec ? `Jeda ${data.token.coolingDownSec} dtk` : "Belum ada"}
          sub={data?.token.cached ? `kedaluwarsa ±${Math.round(data.token.expiresInSec / 60)} mnt` : "diambil saat dibutuhkan"} />
        <KpiCard icon={Inbox} label="Antrean" tone={outbox?.Failed ? "rose" : outbox?.Pending ? "sky" : "emerald"}
          value={outbox ? `${outbox.Pending} menunggu` : "—"} sub={outbox ? `${outbox.Failed} gagal · ${outbox.Acked} terkirim` : undefined} />
        <KpiCard icon={Network} label="Resource terpetakan" value={mapped} sub={`mode ${cfg?.mode ?? "—"}`} />
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {QUICK.map((q) => (
          <Link key={q.href} href={q.href}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-teal-200 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600"><q.icon size={17} aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-slate-800">{q.label}</p>
              <p className="truncate text-[11px] text-slate-400">{q.desc}</p>
            </div>
            <ArrowRight size={14} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600" aria-hidden />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Konfigurasi */}
        <SectionCard title="Konfigurasi" desc="Dari env server — nilai rahasia tidak pernah ditampilkan">
          {!data ? <SkeletonRows rows={3} /> : (
            <ul className="flex flex-col gap-2 p-4 text-xs">
              <CfgRow label="SATUSEHAT_CLIENT_ID" ok={cfg!.hasClientId} />
              <CfgRow label="SATUSEHAT_CLIENT_SECRET" ok={cfg!.hasClientSecret} />
              <CfgRow label="SATUSEHAT_ORG_ID" ok={cfg!.hasOrgId} />
              {cfg!.error && <li className="rounded-lg bg-rose-50 px-2.5 py-2 text-rose-700">{cfg!.error}</li>}
              {cfg!.mode === "mock" && (
                <li className="rounded-lg bg-amber-50 px-2.5 py-2 text-amber-800">
                  Mode mock: semua respons disimulasikan & ID bertanda <code className="font-mono">mock-</code>. Set <code className="font-mono">SATUSEHAT_MODE=sandbox</code> + kredensial DevHub untuk uji nyata.
                </li>
              )}
            </ul>
          )}
        </SectionCard>

        {/* Circuit + Outbox */}
        <SectionCard title="Antrean & Circuit" desc="Status job kirim · pemutus sirkuit per layanan">
          {!data ? <SkeletonRows rows={3} /> : (
            <div className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.outbox).map(([k, v]) => <Pill key={k} label={`${k} ${v}`} tone={OUTBOX_TONE[k]} dot />)}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.circuits).map(([k, v]) => <Pill key={k} label={`${k}: ${v}`} tone={CIRCUIT_TONE[v]} />)}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Resource map */}
        <SectionCard title="Peta Resource" desc={`Lokal ↔ IHS id (mode ${cfg?.mode ?? "—"})`}>
          {!data ? <SkeletonRows rows={3} /> : Object.keys(data.resourceMap).length === 0 ? (
            <EmptyState icon={Network} title="Belum ada resource terpetakan" desc="Mulai dari Prerequisites: Organization → Location → Practitioner → Patient." />
          ) : (
            <ul className="grid grid-cols-2 gap-1.5 p-4">
              {Object.entries(data.resourceMap).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                  <span className="truncate text-slate-600">{k}</span>
                  <span className="font-bold tabular-nums text-slate-900">{v}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Audit */}
      <SectionCard title="Panggilan Terakhir" desc="20 panggilan terbaru ke SatuSehat (audit; NIK tersimpan sebagai hash)">
        {!data ? <SkeletonRows /> : data.recentCalls.length === 0 ? (
          <EmptyState icon={Activity} title="Belum ada panggilan" desc="Panggilan muncul setelah uji token, onboarding, atau antrean dijalankan." />
        ) : (
          <div className={tableWrap}>
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Waktu</th>
                  <th className={thCls}>Target</th>
                  <th className={thCls}>Endpoint</th>
                  <th className={thCls}>HTTP</th>
                  <th className={thCls}>Durasi</th>
                  <th className={thCls}>Hasil</th>
                </tr>
              </thead>
              <tbody>
                {data.recentCalls.map((c) => (
                  <tr key={c.id} className={trCls}>
                    <td className={cn(tdCls, "whitespace-nowrap tabular-nums text-slate-500")}>{fmtTime(c.startedAt)}</td>
                    <td className={tdCls}><Pill label={`${c.mode}·${c.target}`} tone={MODE_TONE[c.mode] ?? "slate"} /></td>
                    <td className={cn(tdCls, "font-mono text-[11px]")}>
                      <span className="mr-1.5 font-semibold text-slate-500">{c.method}</span>{c.endpoint}
                    </td>
                    <td className={cn(tdCls, "tabular-nums")}>{c.responseStatus}</td>
                    <td className={cn(tdCls, "tabular-nums text-slate-500")}>{c.durationMs} ms</td>
                    <td className={tdCls}>
                      {c.success ? <Pill label="OK" tone="emerald" /> : <Pill label={c.errorType ?? "Gagal"} tone="rose" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </FhirShell>
  );
}

function CfgRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <code className="truncate font-mono text-[11px] text-slate-600">{label}</code>
      {ok ? (
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><CheckCircle2 size={13} aria-hidden /> terisi</span>
      ) : (
        <span className="inline-flex items-center gap-1 font-semibold text-slate-400"><XCircle size={13} aria-hidden /> kosong</span>
      )}
    </li>
  );
}
