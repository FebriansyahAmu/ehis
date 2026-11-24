"use client";

// Tab "Mutasi" — SATU komponen bersama untuk rekam medis IGD & Rawat Inap. Pindah ruangan/bed
// dalam kunjungan yang sama, dua tahap seperti admisi RI:
//   1. Ajukan  → bed tujuan direservasi (bed asal tetap ditempati)
//   2. Pindah  → konfirmasi pasien sudah tiba: bed asal dilepas, header ikut berubah
// + lembar transfer pasien (opsional) untuk mutasi yang diajukan / sudah selesai.
// Pasien demo (id non-UUID) → hanya keterangan (mutasi butuh kunjungan nyata di database).

import { useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import { AlertTriangle, BedSingle, Info, Loader2, MapPin, RefreshCw } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "@/lib/ui/toastStore";
import {
  ajukanMutasi, batalkanMutasi, getMutasiOpsi, getMutasiState, selesaikanMutasi, simpanLembarTransfer,
  type AjukanMutasiInput, type LembarTransferInput, type MutasiDTO, type MutasiOpsiDTO, type MutasiStateDTO,
} from "@/lib/api/mutasi";
import { AjukanMutasiForm } from "./AjukanMutasiForm";
import { LembarTransferForm } from "./LembarTransferForm";
import { MutasiRiwayat } from "./MutasiRiwayat";
import { PendingMutasiCard } from "./PendingMutasiCard";
import { errMsg, kelasLabel } from "./mutasiUi";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function MutasiTab({ kunjunganId, unitLabel }: {
  kunjunganId: string;
  /** "IGD" / "Rawat Inap" — untuk teks petunjuk. */
  unitLabel: string;
}) {
  const isDb = UUID_RE.test(kunjunganId);
  const { session } = useSession();
  const [state, setState] = useState<MutasiStateDTO | null>(null);
  const [opsi, setOpsi] = useState<MutasiOpsiDTO | null>(null);
  const [loading, setLoading] = useState(isDb);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lembarFor, setLembarFor] = useState<MutasiDTO | null>(null);
  const [formKey, setFormKey] = useState(0);
  const lembarRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const [s, o] = await Promise.all([getMutasiState(kunjunganId, signal), getMutasiOpsi(kunjunganId, signal)]);
      setState(s);
      setOpsi(o);
      setLoadError(null);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setLoadError(errMsg(e, "Gagal memuat data mutasi"));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [kunjunganId]);

  useEffect(() => {
    if (!isDb) return;
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [isDb, load]);

  // Buka lembar transfer → gulir ke form.
  useEffect(() => {
    if (!lembarFor) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    lembarRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [lembarFor]);

  const run = async (fn: () => Promise<MutasiDTO>, okTitle: string, okMsg?: (m: MutasiDTO) => string) => {
    setBusy(true);
    setActionError(null);
    try {
      const m = await fn();
      toast.success(okTitle, okMsg?.(m));
      await load();
      return m;
    } catch (e) {
      setActionError(errMsg(e, "Aksi mutasi gagal"));
      await load();
      return null;
    } finally {
      setBusy(false);
    }
  };

  if (!isDb) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
        <Info className="mt-0.5 size-5 shrink-0 text-sky-600" aria-hidden="true" />
        <div>
          <p className="m-sm font-semibold text-slate-800">Mutasi ruangan/bed</p>
          <p className="mt-0.5 m-xs">Tersedia untuk kunjungan {unitLabel} yang tercatat di database (bukan pasien demo).</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-12 m-xs text-slate-500">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Memuat data mutasi…
      </div>
    );
  }

  if (loadError || !state) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <AlertTriangle className="size-5 shrink-0 text-rose-600" aria-hidden="true" />
        <p className="min-w-0 flex-1 m-xs font-medium text-rose-800">{loadError ?? "Data mutasi tidak tersedia"}</p>
        <button type="button" onClick={() => { setLoading(true); void load(); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 m-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" /> Coba lagi
        </button>
      </div>
    );
  }

  const dilayani = state.kunjunganStatus === "InService";
  const { lokasi, pending } = state;

  const ajukan = async (input: AjukanMutasiInput) => {
    const m = await run(() => ajukanMutasi(kunjunganId, input), "Mutasi diajukan", (x) =>
      `Bed tujuan ${x.ke.ruanganNama}${x.ke.bedKode ? ` · ${x.ke.bedKode}` : ""} direservasi`);
    if (m) setFormKey((k) => k + 1);
  };

  const saveLembar = async (input: LembarTransferInput) => {
    if (!lembarFor) return;
    const m = await run(() => simpanLembarTransfer(kunjunganId, lembarFor.id, input), "Lembar transfer disimpan");
    if (m) setLembarFor(null);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Mutasi ruangan / bed</h2>
            <p className="mt-0.5 m-xs text-slate-500">
              {state.unit === "IGD"
                ? "Pindah pasien ke ruangan IGD lain atau ke bed rawat inap (penempatan). Admisi rawat inap tetap lewat SPRI."
                : `Pindah pasien antar ruangan / bed ${unitLabel}, termasuk ICU, HCU, dan isolasi.`}
            </p>
          </div>
        </header>

        {actionError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden="true" />
            <p className="min-w-0 flex-1 m-xs font-medium text-rose-800">{actionError}</p>
            <button type="button" onClick={() => setActionError(null)} className="m-tiny font-semibold text-rose-700 hover:underline">Tutup</button>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            {/* Lokasi sekarang */}
            <section aria-label="Lokasi pasien saat ini" className="flex flex-wrap items-center gap-3 rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
              <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <MapPin className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-tiny font-semibold uppercase tracking-wider text-sky-800">Lokasi pasien saat ini</p>
                <p className="truncate text-[15px] font-semibold text-slate-900">{lokasi.ruanganNama ?? "Belum tercatat"}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 m-xs font-semibold text-slate-700">
                  <BedSingle className="size-3.5" aria-hidden="true" />
                  {lokasi.bedKode ? `Bed ${lokasi.bedKode}` : "Tanpa bed"}
                </span>
                {lokasi.kelas && (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 m-xs font-semibold text-slate-700">{kelasLabel(lokasi.kelas)}</span>
                )}
              </div>
            </section>

            {!dilayani && !pending && (
              <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 m-xs text-slate-600 ring-1 ring-inset ring-slate-200">
                <Info className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
                Mutasi hanya untuk pasien yang sedang dilayani — kunjungan ini sudah selesai atau belum diterima.
              </p>
            )}

            {pending ? (
              <PendingMutasiCard
                m={pending}
                unit={state.unit}
                busy={busy}
                canAct={dilayani}
                onSelesai={() => void run(() => selesaikanMutasi(kunjunganId, pending.id), "Pasien dipindahkan", (x) =>
                  `Sekarang di ${x.ke.ruanganNama}${x.ke.bedKode ? ` · Bed ${x.ke.bedKode}` : ""}`)}
                onBatal={(alasan) => void run(() => batalkanMutasi(kunjunganId, pending.id, { alasan }), "Mutasi dibatalkan", () => "Reservasi bed dilepas")}
                onLembar={() => setLembarFor(pending)}
              />
            ) : dilayani && opsi ? (
              <AjukanMutasiForm key={formKey} rooms={opsi.rooms} lokasi={lokasi} unit={state.unit} busy={busy} onSubmit={(i) => void ajukan(i)} />
            ) : null}
          </div>

          <MutasiRiwayat items={state.riwayat} canEdit={dilayani} onLembar={setLembarFor} />
        </div>

        {lembarFor && (
          <div ref={lembarRef} className="scroll-mt-4">
            <LembarTransferForm
              key={lembarFor.id}
              m={lembarFor}
              kunjunganId={kunjunganId}
              penulis={session?.namaTampil ?? null}
              busy={busy}
              onSave={(i) => void saveLembar(i)}
              onClose={() => setLembarFor(null)}
            />
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
