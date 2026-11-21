"use client";

// GET by Nomor IHS (Playbook SATUSEHAT · API Catalogue Onboarding): `GET /Practitioner/{id}` ·
// `GET /Patient/{id}`. Ambil data SatuSehat apa adanya (NIK dimasker server) + tunjukkan data lokal
// pemilik IHS tsb dan kecocokannya dengan data yang sedang dilihat. Tidak mengubah peta.
// Dipakai: daftar data Prerequisites (cari bebas) & drawer detail (prefill IHS terpetakan).

import { useId, useRef, useState } from "react";
import { ChevronRight, CircleCheck, CircleSlash, Link2, Link2Off, ScanSearch, TriangleAlert } from "lucide-react";
import { lookupIhs, type IhsLookupDTO, type IhsLookupType } from "@/lib/api/fhir/ihsLookup";
import { Button, Pill, errMsg } from "../fhirShared";
import { Callout, IdChip, JsonView } from "../resource/resourceUi";
import { fmtDateTime } from "../resource/resourceTime";

/**
 * Contoh dari tabel data dummy Sandbox di halaman Playbook (hanya berlaku di Sandbox). Nama = yang TERTULIS di
 * Playbook; isi Sandbox dipakai bersama semua integrator & bisa sudah berubah (per 2026-11-21
 * `Practitioner/10009880728` berisi nakes lain, diperbarui 2026-01-29) → jangan jadikan nama sebagai patokan.
 */
const SANDBOX_CONTOH: Record<IhsLookupType, { ihs: string; namaPlaybook: string }> = {
  Practitioner: { ihs: "10009880728", namaPlaybook: "dr. Alexander" },
  Patient: { ihs: "P02478375538", namaPlaybook: "Ardianto Putra" },
};

/** SatuSehat menyamarkan nama di respons (mis. "NO** LA**"). */
const isMasked = (nama: string | null) => !!nama && nama.includes("*");

const IHS_RE = /^[A-Za-z0-9-]{3,64}$/;

const SYSTEM_LABEL: Record<string, string> = {
  nik: "NIK",
  "nik-ibu": "NIK Ibu",
  "ihs-number": "Nomor IHS",
  "nakes-his-number": "Nomor IHS Nakes",
  paspor: "Paspor",
  kk: "No. KK",
};

function systemLabel(system: string): string {
  const last = system.replace(/\/+$/, "").split("/").pop() ?? system;
  return SYSTEM_LABEL[last] ?? last;
}

const GENDER: Record<string, string> = { male: "Laki-laki", female: "Perempuan", other: "Lainnya", unknown: "Tidak diketahui" };

export function IhsLookupPanel({
  resourceType,
  defaultIhs,
  localId,
  compact,
}: {
  resourceType: IhsLookupType;
  /** Prefill (mis. IHS terpetakan data yang sedang dilihat). */
  defaultIhs?: string | null;
  /** Data lokal yang sedang dilihat → log tertaut + cek kecocokan peta. */
  localId?: string;
  /** Tanpa judul (dipakai di dalam tab drawer yang sudah berjudul). */
  compact?: boolean;
}) {
  const inputId = useId();
  const hintId = useId();
  const errId = useId();
  const headingId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [ihs, setIhs] = useState(defaultIhs ?? "");
  // Galat format baru tampil setelah interaksi (blur / submit), bukan saat mengetik.
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IhsLookupDTO | null>(null);
  const valid = IHS_RE.test(ihs.trim());
  const showInvalid = touched && !valid;
  const contoh = SANDBOX_CONTOH[resourceType];

  async function run() {
    const ihsId = ihs.trim();
    if (!IHS_RE.test(ihsId)) {
      setTouched(true);
      inputRef.current?.focus(); // galat diumumkan lewat aria-describedby saat fokus kembali
      return;
    }
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await lookupIhs({ resourceType, ihsId, localId }));
    } catch (e) {
      setResult(null);
      setError(errMsg(e) ?? "Permintaan ke server EHIS gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby={compact ? undefined : headingId} aria-label={compact ? `Ambil ${resourceType} by Nomor IHS` : undefined} className="flex flex-col gap-3">
      {!compact && (
        <div>
          <h3 id={headingId} className="text-sm font-bold text-slate-800">GET {resourceType} by Nomor IHS</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Ambil data {resourceType} langsung dari SatuSehat (<code className="font-mono">GET /{resourceType}/{"{id}"}</code>) — tidak mengubah peta lokal.
          </p>
        </div>
      )}

      <form
        noValidate
        onSubmit={(e) => { e.preventDefault(); void run(); }}
        className="flex flex-col gap-1.5"
      >
        <label htmlFor={inputId} className="text-[11px] font-semibold text-slate-600">Nomor IHS {resourceType}</label>
        {/* Hint format DI ATAS input agar tak tertutup popover autofill/keyboard. */}
        <p id={hintId} className="text-[11px] text-slate-400">
          Huruf/angka (3–64 karakter). Contoh dari tabel dummy Playbook:{" "}
          <button type="button" onClick={() => { setIhs(contoh.ihs); setTouched(false); }} className="rounded font-mono text-teal-700 underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-teal-300">
            {contoh.ihs}
          </button>{" "}
          — di Playbook tertulis {contoh.namaPlaybook}, tetapi isi Sandbox dipakai bersama dan bisa sudah berubah.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-lg border border-slate-200 bg-white transition focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-200">
            <span className="shrink-0 border-r border-slate-200 bg-slate-50 px-2.5 py-2 font-mono text-[11px] text-slate-500" aria-hidden>
              GET /{resourceType}/
            </span>
            <input
              ref={inputRef}
              id={inputId}
              value={ihs}
              onChange={(e) => setIhs(e.target.value)}
              onBlur={() => { if (ihs.trim() !== "") setTouched(true); }}
              placeholder={contoh.ihs}
              required
              autoComplete="off"
              spellCheck={false}
              aria-describedby={showInvalid ? `${hintId} ${errId}` : hintId}
              aria-invalid={showInvalid}
              className="min-w-0 flex-1 bg-transparent px-2.5 py-2 font-mono text-xs text-slate-800 outline-none placeholder:text-slate-300"
            />
          </div>
          <Button type="submit" icon={ScanSearch} loading={busy}>
            {busy ? "Mengambil…" : "Ambil"}
          </Button>
        </div>
        {showInvalid && (
          <p id={errId} className="flex items-center gap-1 text-[11px] font-medium text-rose-600">
            <TriangleAlert size={12} aria-hidden />
            Nomor IHS tidak valid — isi huruf/angka (boleh tanda hubung), 3–64 karakter, mis. {contoh.ihs}.
          </p>
        )}
      </form>

      {/* Region status ada sejak awal → hasil diumumkan sopan setelah "Ambil" (tanpa membacakan seluruh kartu). */}
      <p role="status" className="sr-only">
        {busy ? "" : result ? (result.found ? `${resourceType} ditemukan: ${result.ringkas?.nama ?? result.ihsId}` : `Tidak ditemukan: ${result.message ?? ""}`) : ""}
      </p>
      {error && (
        <div role="alert"><Callout tone="rose" icon={TriangleAlert}>{error}</Callout></div>
      )}
      {result && <ResultCard r={result} localId={localId} />}
    </section>
  );
}

function ResultCard({ r, localId }: { r: IhsLookupDTO; localId?: string }) {
  const s = r.ringkas;
  // Patient by ID di SatuSehat hanya mengembalikan identifier + meta (nama/kelamin/tgl lahir tak disertakan).
  const minimal = !!s && !s.nama && !s.gender && !s.birthDate;
  return (
    <div className="flex flex-col gap-3">
      {!r.found ? (
        <Callout tone={r.status === "404" || r.status === "410" ? "amber" : "rose"} icon={r.status === "404" ? CircleSlash : TriangleAlert}>
          <b>{r.status === "ERR" ? "Gagal" : `HTTP ${r.status}`}</b> — {r.message}
        </Callout>
      ) : s && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
            <div className="min-w-0">
              <p className={s.nama ? "truncate text-sm font-bold text-slate-900" : "truncate text-sm font-semibold italic text-slate-500"}>
                {s.nama ?? "Nama tidak disertakan dalam respons"}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                <span className="font-mono">{r.resourceType}/{r.ihsId}</span>
                {s.versionId && <span>· versi {s.versionId}</span>}
                {s.lastUpdated && <span>· diperbarui {fmtDateTime(s.lastUpdated)}</span>}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill label={`HTTP ${r.status} · ${r.durationMs} ms`} tone="emerald" dot />
              {s.active !== null && <Pill label={s.active ? "Aktif" : "Nonaktif"} tone={s.active ? "teal" : "slate"} />}
              <Pill label={`Mode ${r.mode}`} tone={r.mode === "prod" ? "emerald" : r.mode === "sandbox" ? "amber" : "slate"} />
            </div>
          </div>

          {isMasked(s.nama) && (
            <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
              Nama disamarkan oleh SatuSehat (tanda *), bukan oleh EHIS. Cocokkan data lewat Nomor IHS atau NIK, bukan nama.
            </p>
          )}
          {minimal && (
            <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
              SatuSehat hanya mengembalikan identifier &amp; meta untuk {r.resourceType} by ID — nama, jenis kelamin, dan tanggal lahir tidak disertakan.
              Identitas lengkap ada di hasil pencarian by NIK.
            </p>
          )}
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 p-3 text-xs sm:grid-cols-2">
            {!minimal && <Meta label="Jenis kelamin">{s.gender ? (GENDER[s.gender] ?? s.gender) : "—"}</Meta>}
            {!minimal && <Meta label="Tanggal lahir">{s.birthDate ?? "—"}</Meta>}
            {s.identifiers.map((i) => (
              <Meta key={`${i.system}|${i.value}`} label={systemLabel(i.system)}>
                <span className="font-mono text-[11px]" title={i.system}>{i.value}</span>
              </Meta>
            ))}
            {s.kualifikasi.length > 0 && <Meta label="Kualifikasi">{s.kualifikasi.join(" · ")}</Meta>}
          </dl>
        </div>
      )}

      <MappingNote r={r} localId={localId} />

      {r.resource !== null && r.resource !== undefined && (
        <details className="group rounded-xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 [&::-webkit-details-marker]:hidden">
            <ChevronRight size={13} className="shrink-0 text-slate-400 transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden />
            Respons JSON SatuSehat (NIK dimasker)
          </summary>
          <div className="border-t border-slate-100 p-2">
            <JsonView value={r.resource} />
          </div>
        </details>
      )}
    </div>
  );
}

function MappingNote({ r, localId }: { r: IhsLookupDTO; localId?: string }) {
  if (r.lokal) {
    const self = localId && r.lokal.localId === localId;
    return (
      <Callout tone={r.cocok === false ? "amber" : "emerald"} icon={r.cocok === false ? Link2Off : Link2}>
        {self
          ? <>IHS ini <b>terpetakan ke data ini</b> ({r.lokal.label}{r.lokal.sub ? ` · ${r.lokal.sub}` : ""}).</>
          : <>IHS ini terpetakan ke data lokal <b>{r.lokal.label}</b>{r.lokal.sub ? ` · ${r.lokal.sub}` : ""} <IdChip value={r.lokal.localId} />
            {localId && r.cocok === false && <> — <b>data yang sedang dilihat terpetakan ke IHS lain</b>; periksa kemungkinan data ganda.</>}</>}
      </Callout>
    );
  }
  if (localId && r.cocok === false) {
    return <Callout tone="amber" icon={Link2Off}>Data ini terpetakan ke <b>IHS lain</b>, bukan {r.ihsId}.</Callout>;
  }
  return (
    <Callout tone="slate" icon={r.found ? CircleCheck : CircleSlash}>
      IHS {r.ihsId} belum dipetakan ke data lokal mana pun (mode {r.mode}). Pemetaan dilakukan lewat <b>Cari IHS</b> (GET by NIK).
    </Callout>
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
