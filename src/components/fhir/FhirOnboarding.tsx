"use client";

// Onboarding / Prerequisites SatuSehat — mengikuti Playbook Kemenkes "Orientasi/Onboarding/Prerequisites"
// (satusehat.kemkes.go.id/platform/docs/id/fhir/prerequisites/): 5 langkah sebelum mengirim data
// pendaftaran pasien & diagnosis, dengan penamaan resource persis seperti di playbook:
//   1. Autentikasi  ·  2. Registrasi Struktur Organisasi (Organization)  ·  3. Registrasi Struktur Lokasi
//   (Location)  ·  4. Nomor IHS untuk Tenaga Kesehatan (Practitioner)  ·  5. Nomor IHS Pasien (Patient).
// Organization/Location = resolve-first lalu POST/PUT; Practitioner/Patient = GET-only by NIK (RS tidak
// membuat data). Idempoten — aman dijalankan ulang (FHIR-RULES R8).

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Building2, CheckCircle2, ExternalLink, Info, KeyRound, ListX, MapPin, Play, RefreshCw, ShieldCheck,
  Stethoscope, Table2, UserRound, XCircle, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { useCan } from "@/components/auth/Can";
import {
  getOnboardingSummary, runOnboarding,
  type OnboardingJenis, type OnboardingRunDTO, type OnboardingSummaryDTO, type PrereqJenis,
} from "@/lib/api/fhir/onboarding";
import { PrereqDataList } from "./onboarding/PrereqDataList";
import { getFhirStatus, probeFhirToken, type FhirStatusDTO, type FhirTokenProbeDTO } from "@/lib/api/fhir/status";
import { resolvePatientBatch } from "@/lib/api/fhir/patient";
import {
  FhirShell, SectionCard, Pill, Button, EmptyState, SkeletonRows, Reveal,
  errMsg, isAbort, tableWrap, tableCls, thCls, tdCls, trCls, type Tone,
} from "./fhirShared";

const PLAYBOOK_URL = "https://satusehat.kemkes.go.id/platform/docs/id/fhir/prerequisites/";

type StepKey = "auth" | OnboardingJenis | "patient";

interface StepDef {
  key: StepKey;
  no: number;
  /** Nama resource FHIR persis seperti playbook (null = langkah non-resource). */
  resource: string | null;
  /** Judul langkah sesuai playbook. */
  judul: string;
  method: "POST" | "GET" | null;
  desc: string;
  icon: LucideIcon;
  needs?: OnboardingJenis;
}

const STEPS: StepDef[] = [
  {
    key: "auth", no: 1, resource: null, judul: "Autentikasi ke SATUSEHAT", method: null, icon: KeyRound,
    desc: "OAuth2 client credentials (client ID + secret dari DevHub) → access token untuk setiap request.",
  },
  {
    key: "organization", no: 2, resource: "Organization", judul: "Registrasi Struktur Organisasi", method: "POST", icon: Building2,
    desc: "Sub-organisasi RS (instalasi/departemen). Induk RS = Organization ID dari DevHub.",
  },
  {
    key: "location", no: 3, resource: "Location", judul: "Registrasi Struktur Lokasi", method: "POST", icon: MapPin,
    desc: "Sub-lokasi (ruangan, poli, bangsal) dengan managingOrganization = Organization unitnya.", needs: "organization",
  },
  {
    key: "practitioner", no: 4, resource: "Practitioner", judul: "Nomor IHS untuk Tenaga Kesehatan", method: "GET", icon: Stethoscope,
    desc: "Cari IHS tenaga kesehatan berdasarkan NIK (data SDMK). RS tidak membuat Practitioner.",
  },
  {
    key: "patient", no: 5, resource: "Patient", judul: "Nomor IHS Pasien", method: "GET", icon: UserRound,
    desc: "Cari IHS pasien berdasarkan NIK (Master Patient Index). Otomatis saat kirim, atau per batch di sini.",
  },
];

const RESOURCE_OF: Record<OnboardingJenis, string> = {
  organization: "Organization",
  location: "Location",
  practitioner: "Practitioner",
};

const OUTCOME: Record<string, { label: string; tone: Tone }> = {
  created: { label: "Dibuat", tone: "emerald" },
  updated: { label: "Diperbarui", tone: "sky" },
  resolved: { label: "Dipetakan", tone: "teal" },
  unchanged: { label: "Tetap", tone: "slate" },
  skipped: { label: "Dilewati", tone: "amber" },
  failed: { label: "Gagal", tone: "rose" },
};

// <progress> native (role progressbar implisit) dengan gaya kustom penuh. Pseudo-element WebKit & Firefox
// sengaja di kelas terpisah — selector gabungan membuat seluruh aturan diabaikan browser.
const PROGRESS_BASE =
  "block h-2 w-full appearance-none overflow-clip rounded-full border-0 bg-slate-100 [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-[inline-size] [&::-webkit-progress-value]:duration-500 [&::-moz-progress-bar]:rounded-full";
const PROGRESS_FILL = {
  done: "[&::-webkit-progress-value]:bg-emerald-500 [&::-moz-progress-bar]:bg-emerald-500",
  partial: "[&::-webkit-progress-value]:bg-teal-500 [&::-moz-progress-bar]:bg-teal-500",
};

function Coverage({ label, value, max }: { label: string; value: number; max: number }) {
  const done = max > 0 && value >= max;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-slate-500">Terpetakan</span>
        <span className="font-bold tabular-nums text-slate-900">{value} / {max}</span>
      </div>
      <progress
        value={value}
        max={Math.max(max, 1)}
        aria-label={`${label} terpetakan: ${value} dari ${max}`}
        className={cn(PROGRESS_BASE, done ? PROGRESS_FILL.done : PROGRESS_FILL.partial)}
      />
    </div>
  );
}

function StepCard({ step, done, children }: { step: StepDef; done: boolean; children: React.ReactNode }) {
  const Icon = step.icon;
  return (
    <li className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-3">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            done ? "bg-emerald-100 text-emerald-700" : "bg-teal-600 text-white",
          )}
        >
          {done ? <CheckCircle2 size={15} aria-label={`Langkah ${step.no} selesai`} /> : <span aria-label={`Langkah ${step.no}`}>{step.no}</span>}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-slate-900">
            {step.resource ? <code className="font-mono">{step.resource}</code> : "Autentikasi"}
            {step.method && <Pill label={step.method} tone={step.method === "POST" ? "sky" : "teal"} />}
          </h2>
          <p className="text-xs font-medium text-slate-600">{step.judul}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{step.desc}</p>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
          <Icon size={15} aria-hidden />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">{children}</div>
    </li>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      {ok ? <CheckCircle2 size={13} className="shrink-0 text-emerald-600" aria-hidden /> : <XCircle size={13} className="shrink-0 text-rose-600" aria-hidden />}
      <span className={ok ? "text-slate-700" : "font-medium text-rose-700"}>{label}</span>
      <span className="sr-only">{ok ? "tersedia" : "belum tersedia"}</span>
    </li>
  );
}

export default function FhirOnboarding() {
  const can = useCan();
  const canRun = can("fhir.sync", "create");
  const [summary, setSummary] = useState<OnboardingSummaryDTO | null>(null);
  const [status, setStatus] = useState<FhirStatusDTO | null>(null);
  const [running, setRunning] = useState<StepKey | null>(null);
  const [force, setForce] = useState(false);
  const [lastRun, setLastRun] = useState<OnboardingRunDTO | null>(null);
  const [probe, setProbe] = useState<FhirTokenProbeDTO | null>(null);
  // Daftar data + detail mentah per langkah (satu panel terbuka di bawah grid).
  const [dataJenis, setDataJenis] = useState<PrereqJenis | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const dataRef = useRef<HTMLDivElement>(null);

  function bukaData(jenis: PrereqJenis) {
    setDataJenis(jenis);
    requestAnimationFrame(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      dataRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  }

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const [s, st] = await Promise.all([getOnboardingSummary(signal), getFhirStatus(signal)]);
      if (!signal?.aborted) {
        setSummary(s);
        setStatus(st);
      }
    } catch (e) {
      if (!isAbort(e)) toast.error("Gagal memuat ringkasan Prerequisites", errMsg(e));
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  async function run(jenis: OnboardingJenis) {
    const res = RESOURCE_OF[jenis];
    setRunning(jenis);
    try {
      const r = await runOnboarding(jenis, jenis === "practitioner" ? { force } : {});
      setLastRun(r);
      const c = r.counts;
      const msg = `${c.created} dibuat · ${c.updated} diperbarui · ${c.resolved} dipetakan · ${c.failed} gagal`;
      if (c.failed) toast.warning(`Sinkron ${res} selesai dengan kegagalan`, msg);
      else toast.success(`Sinkron ${res} selesai`, msg);
      setRefreshKey((k) => k + 1);
      await load();
    } catch (e) {
      toast.error(`Sinkron ${res} gagal`, errMsg(e));
    } finally {
      setRunning(null);
    }
  }

  async function runProbe() {
    setRunning("auth");
    try {
      const r = await probeFhirToken();
      setProbe(r);
      if (r.ok) toast.success("Autentikasi berhasil", r.message);
      else toast.warning("Autentikasi gagal", r.message);
      await load();
    } catch (e) {
      toast.error("Uji token gagal", errMsg(e));
    } finally {
      setRunning(null);
    }
  }

  async function runPatientBatch() {
    setRunning("patient");
    try {
      const r = await resolvePatientBatch(25);
      const c = r.counts;
      const msg = `${c.resolved} dipetakan · ${c.not_found} tidak ditemukan · ${c.failed} gagal${r.sisa ? " · masih ada sisa" : ""}`;
      if (c.failed || c.not_found) toast.warning("Resolve Patient selesai dengan catatan", msg);
      else toast.success("Resolve Patient selesai", msg);
      setRefreshKey((k) => k + 1);
      await load();
    } catch (e) {
      toast.error("Resolve Patient gagal", errMsg(e));
    } finally {
      setRunning(null);
    }
  }

  const cfg = status?.config;
  const token = status?.token;
  const authReady = !!cfg && cfg.mode !== "invalid" && cfg.hasClientId && cfg.hasClientSecret && cfg.hasOrgId;
  const authDone = authReady && (cfg?.mode === "mock" || token?.cached === true || probe?.ok === true);

  function doneOf(key: StepKey): boolean {
    if (key === "auth") return authDone;
    if (!summary) return false;
    if (key === "patient") return summary.pasien.viaNik > 0 && summary.pasien.terpetakan >= summary.pasien.viaNik;
    const st = summary.perJenis[key];
    return st.lokal > 0 && st.terpetakan >= st.lokal;
  }

  return (
    <FhirShell
      icon={ShieldCheck}
      title="Onboarding / Prerequisites"
      description="Tahap persiapan sebelum mengirim data pendaftaran pasien dan diagnosis, mengikuti Playbook SATUSEHAT Kemenkes. Jalankan berurutan; pencarian dilakukan dulu sebelum membuat data sehingga aman diulang."
      actions={
        <div className="flex flex-wrap gap-2">
          <a
            href={PLAYBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            <ExternalLink size={14} aria-hidden />
            Playbook Kemenkes
            <span className="sr-only">(membuka tab baru)</span>
          </a>
          <Button variant="secondary" icon={RefreshCw} onClick={() => void load()}>Muat ulang</Button>
        </div>
      }
    >
      {summary && (
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Info size={13} aria-hidden /> Mode <Pill label={summary.mode} tone={summary.mode === "prod" ? "emerald" : summary.mode === "sandbox" ? "sky" : "amber"} />
          · Organization ID <code className="font-mono text-slate-700">{summary.orgId}</code> · peta terpisah per mode
        </p>
      )}

      <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Langkah Prerequisites SATUSEHAT">
        {STEPS.map((s) => {
          const done = doneOf(s.key);

          // ── 1. Autentikasi ──
          if (s.key === "auth") {
            return (
              <StepCard key={s.key} step={s} done={done}>
                {!cfg ? <SkeletonRows rows={3} /> : (
                  <>
                    <ul className="flex flex-col gap-1 text-xs">
                      <Check ok={cfg.mode !== "invalid"} label={`Mode ${cfg.mode}${cfg.host ? ` · ${cfg.host}` : ""}`} />
                      <Check ok={cfg.hasClientId} label="Client ID" />
                      <Check ok={cfg.hasClientSecret} label="Client secret" />
                      <Check ok={cfg.hasOrgId} label="Organization ID (DevHub)" />
                      <Check
                        ok={cfg.mode === "mock" || !!token?.cached}
                        label={
                          cfg.mode === "mock"
                            ? "Access token (mode mock — tanpa jaringan)"
                            : token?.cached
                              ? `Access token aktif · ${Math.round(token.expiresInSec / 60)} menit lagi`
                              : "Access token belum diminta"
                        }
                      />
                    </ul>
                    {cfg.error && <p className="rounded-lg bg-rose-50 px-2.5 py-2 text-xs text-rose-800">{cfg.error}</p>}
                    {probe && (
                      <p className={cn("text-xs", probe.ok ? "text-emerald-700" : "text-rose-700")}>
                        Uji terakhir: {probe.message} ({probe.durationMs} ms)
                      </p>
                    )}
                    {canRun && (
                      <div className="mt-auto">
                        <Button icon={KeyRound} variant="secondary" onClick={() => void runProbe()} loading={running === "auth"} disabled={!!running && running !== "auth"}>
                          Uji token
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </StepCard>
            );
          }

          // ── 5. Patient ──
          if (s.key === "patient") {
            const p = summary?.pasien;
            return (
              <StepCard key={s.key} step={s} done={done}>
                {!p ? <SkeletonRows rows={3} /> : (
                  <>
                    <Coverage label="Patient" value={p.terpetakan} max={p.viaNik} />
                    <p className="text-xs text-slate-500">
                      {p.viaNik} dari {p.total} pasien bisa dicari lewat NIK.
                      {p.total > p.viaNik && ` ${p.total - p.viaNik} lainnya (tanpa NIK, anonim, atau WNA) belum didukung.`}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      {canRun && (
                        <Button icon={Play} onClick={() => void runPatientBatch()} loading={running === "patient"} disabled={!!running && running !== "patient"}>
                          Resolve 25 pasien
                        </Button>
                      )}
                      <Button variant="secondary" icon={Table2} onClick={() => bukaData("patient")}>Lihat data</Button>
                      <Link href="/ehis-fhir/pasien" className="rounded text-xs font-semibold text-teal-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600">
                        Buka Pasien &amp; NIK →
                      </Link>
                    </div>
                  </>
                )}
              </StepCard>
            );
          }

          // ── 2–4. Organization · Location · Practitioner ──
          const jenis = s.key;
          const st = summary?.perJenis[jenis];
          const blocked = s.needs && summary ? summary.perJenis[s.needs].terpetakan === 0 : false;
          return (
            <StepCard key={s.key} step={s} done={done}>
              {!st ? <SkeletonRows rows={3} /> : (
                <>
                  <Coverage label={s.resource ?? jenis} value={st.terpetakan} max={st.lokal} />

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

                  {jenis === "practitioner" && (
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-300" />
                      Cari ulang yang sudah terpetakan (setelah koreksi NIK)
                    </label>
                  )}

                  {blocked && (
                    <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                      Jalankan langkah 2 (Organization) dulu — Location butuh managingOrganization yang sudah terpetakan.
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-2">
                    {canRun && (
                      <Button icon={Play} onClick={() => void run(jenis)} loading={running === jenis} disabled={!!running && running !== jenis}>
                        {s.method === "GET" ? `Cari IHS ${s.resource}` : `Sinkron ${s.resource}`}
                      </Button>
                    )}
                    <Button variant="secondary" icon={Table2} onClick={() => bukaData(jenis)}>Lihat data</Button>
                  </div>
                </>
              )}
            </StepCard>
          );
        })}
      </ol>

      <div ref={dataRef} className="scroll-mt-4">
        {dataJenis && (
          <PrereqDataList
            key={dataJenis}
            jenis={dataJenis}
            refreshKey={refreshKey}
            onClose={() => setDataJenis(null)}
            canSend={canRun}
            onItemSent={() => void load()}
          />
        )}
      </div>

      <Reveal show={!!lastRun}>
        {lastRun && (
          <SectionCard
            title={`Hasil terakhir · ${RESOURCE_OF[lastRun.jenis]}`}
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
