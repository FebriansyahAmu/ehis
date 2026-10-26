"use client";

// Pasien & NIK (FH2) — cek NIK ke SatuSehat tanpa menyimpan, dan resolve IHS massal untuk pasien
// yang belum terpetakan. Pasien ber-NIK hanya DI-RESOLVE (SatuSehat = pemilik master pasien, R15).

import { useState } from "react";
import { UserCheck, Search, Users, Play, IdCard, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { useCan } from "@/components/auth/Can";
import { lookupNik, resolvePatientBatch, type NikLookupDTO, type PatientBatchDTO } from "@/lib/api/fhir/patient";
import {
  FhirShell, SectionCard, Pill, Button, EmptyState, Reveal,
  errMsg, FHIR_ACCENT, tableWrap, tableCls, thCls, tdCls, trCls, type Tone,
} from "./fhirShared";

const STATUS_CFG: Record<string, { label: string; tone: Tone }> = {
  cached: { label: "Sudah terpetakan", tone: "slate" },
  resolved: { label: "Terpetakan", tone: "emerald" },
  not_found: { label: "NIK tak ditemukan", tone: "rose" },
  no_nik: { label: "Tanpa NIK", tone: "amber" },
  failed: { label: "Gagal", tone: "rose" },
};
const LIMITS = [25, 50, 100] as const;

export default function FhirPasien() {
  const can = useCan();
  const [nik, setNik] = useState("");
  const [looking, setLooking] = useState(false);
  const [found, setFound] = useState<NikLookupDTO | null>(null);
  const [limit, setLimit] = useState<(typeof LIMITS)[number]>(25);
  const [batching, setBatching] = useState(false);
  const [batch, setBatch] = useState<PatientBatchDTO | null>(null);

  const nikValid = /^\d{16}$/.test(nik);

  async function doLookup() {
    setLooking(true);
    try {
      setFound(await lookupNik(nik));
    } catch (e) {
      setFound(null);
      toast.error("Cek NIK gagal", errMsg(e));
    } finally {
      setLooking(false);
    }
  }

  async function doBatch() {
    setBatching(true);
    try {
      const r = await resolvePatientBatch(limit);
      setBatch(r);
      if (r.diproses === 0) toast.info("Tidak ada pasien yang perlu di-resolve");
      else toast.success("Resolve batch selesai", `${r.counts.resolved} terpetakan dari ${r.diproses} pasien`);
    } catch (e) {
      toast.error("Resolve batch gagal", errMsg(e));
    } finally {
      setBatching(false);
    }
  }

  return (
    <FhirShell
      icon={UserCheck}
      title="Pasien & NIK"
      description="Pasien ber-NIK dipetakan ke ID IHS SatuSehat (data Dukcapil). Pasien anonim (Mr.X), WNA, dan bayi tanpa NIK belum didukung."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Cek NIK */}
        <SectionCard title="Cek NIK" desc="Tanpa menyimpan · NIK dikirim lewat body & tercatat sebagai hash di audit">
          <form
            onSubmit={(e) => { e.preventDefault(); if (nikValid) void doLookup(); }}
            className="flex flex-col gap-3 p-4"
          >
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">NIK (16 digit)</span>
              <div className="flex gap-2">
                <input
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="3171xxxxxxxxxxxx"
                  aria-invalid={!!nik && !nikValid}
                  className={cn(
                    "min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tracking-wider outline-none transition placeholder:text-slate-300",
                    FHIR_ACCENT.focus,
                  )}
                />
                <Button type="submit" icon={Search} loading={looking} disabled={!nikValid || !can("fhir.sync", "read")}>Cek</Button>
              </div>
              <span className="text-[11px] text-slate-400">{nik.length}/16 digit</span>
            </label>

            <Reveal show={!!found}>
              {found && (
                found.found ? (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
                      <dt className="text-slate-500">IHS id</dt><dd className="font-mono font-semibold text-slate-900">{found.ihsId}</dd>
                      <dt className="text-slate-500">Nama</dt><dd className="text-slate-800">{found.nama ?? "— (tidak dikembalikan)"}</dd>
                      <dt className="text-slate-500">Jenis kelamin</dt><dd className="text-slate-800">{found.gender ?? "—"}</dd>
                      <dt className="text-slate-500">Tanggal lahir</dt><dd className="text-slate-800">{found.tanggalLahir ?? "—"}</dd>
                      <dt className="text-slate-500">Mode</dt><dd><Pill label={found.mode} tone={found.mode === "mock" ? "amber" : "sky"} /></dd>
                    </dl>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-xs text-rose-800">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
                    NIK tidak ditemukan di SatuSehat — periksa ulang NIK pasien.
                  </div>
                )
              )}
            </Reveal>
          </form>
        </SectionCard>

        {/* Batch */}
        <SectionCard title="Resolve massal" desc="Pasien yang belum terpetakan pada mode aktif, terbaru dulu · sekuensial (kuota SatuSehat)">
          <div className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Jumlah per jalan</span>
              <div className="flex gap-1" role="group" aria-label="Jumlah pasien per jalan">
                {LIMITS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLimit(l)}
                    aria-pressed={limit === l}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-semibold tabular-nums transition outline-none focus-visible:ring-2 focus-visible:ring-teal-300",
                      limit === l ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {can("fhir.sync", "create") && (
                <Button icon={Play} onClick={() => void doBatch()} loading={batching}>Jalankan</Button>
              )}
            </div>

            <Reveal show={!!batch}>
              {batch && (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(batch.counts).filter(([, v]) => v > 0).map(([k, v]) => (
                      <Pill key={k} label={`${STATUS_CFG[k].label} ${v}`} tone={STATUS_CFG[k].tone} />
                    ))}
                    {batch.diproses === 0 && <Pill label="Semua pasien ber-NIK sudah terpetakan" tone="emerald" />}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {batch.diproses} pasien · {batch.durationMs} ms{batch.sisa ? " · masih ada sisa — jalankan lagi" : ""}
                  </p>
                </div>
              )}
            </Reveal>
          </div>
        </SectionCard>
      </div>

      <Reveal show={!!batch && batch.perhatian.length > 0}>
        {batch && (
          <SectionCard title="Perlu perhatian" desc="Gagal, tidak ditemukan, tanpa NIK, atau identitas lokal berbeda dengan SatuSehat">
            {batch.perhatian.length === 0 ? (
              <EmptyState icon={Users} title="Tidak ada" />
            ) : (
              <div className={tableWrap}>
                <table className={tableCls}>
                  <thead>
                    <tr>
                      <th className={thCls}>No. RM</th>
                      <th className={thCls}>Status</th>
                      <th className={thCls}>IHS id</th>
                      <th className={thCls}>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.perhatian.map((p) => (
                      <tr key={p.patientId} className={trCls}>
                        <td className={cn(tdCls, "font-mono text-[11px]")}>
                          <span className="inline-flex items-center gap-1"><IdCard size={12} className="text-slate-400" aria-hidden />{p.noRm}</span>
                        </td>
                        <td className={tdCls}><Pill label={STATUS_CFG[p.status].label} tone={STATUS_CFG[p.status].tone} /></td>
                        <td className={cn(tdCls, "font-mono text-[11px]")}>{p.ihsId ?? "—"}</td>
                        <td className={cn(tdCls, "text-slate-500")}>{p.message ?? ""}</td>
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
