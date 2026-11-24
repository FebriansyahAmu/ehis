"use client";

// Mutasi yang menunggu pemindahan (bed tujuan sudah direservasi). Aksi dengan konfirmasi INLINE
// dua langkah (tanpa dialog bertumpuk): "Pasien sudah dipindahkan" → bed asal dilepas & tujuan
// ditempati; "Batalkan" → wajib alasan → reservasi dilepas.

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, ArrowDown, ArrowRight, BedSingle, CheckCircle2, ClipboardList, Clock3, Loader2, X,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { LokasiDTO, MutasiDTO } from "@/lib/api/mutasi";
import { fmtWaktu, kelasLabel } from "./mutasiUi";

function LokasiBox({ l, tone, title }: { l: LokasiDTO; tone: "from" | "to"; title: string }) {
  return (
    <div className={cn("min-w-0 rounded-xl px-3.5 py-3 ring-1 ring-inset", tone === "to" ? "bg-sky-50 ring-sky-200" : "bg-white ring-slate-200")}>
      <p className={cn("m-tiny font-semibold uppercase tracking-wider", tone === "to" ? "text-sky-800" : "text-slate-500")}>{title}</p>
      <p className="mt-0.5 truncate m-sm font-semibold text-slate-900">{l.ruanganNama ?? "Belum tercatat"}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 m-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          <BedSingle className="size-3.5" aria-hidden="true" />
          {l.bedKode ? `Bed ${l.bedKode}` : "Tanpa bed"}
        </span>
        {l.kelas && <span>· {kelasLabel(l.kelas)}</span>}
      </p>
    </div>
  );
}

export function PendingMutasiCard({
  m, unit, busy, canAct, onSelesai, onBatal, onLembar,
}: {
  m: MutasiDTO;
  /** Unit kunjungan — perubahan kelas hanya relevan untuk Rawat Inap (akomodasi). */
  unit: string;
  busy: boolean;
  /** Kunjungan sedang dilayani (bukan terkunci) → aksi tersedia. */
  canAct: boolean;
  onSelesai: () => void;
  onBatal: (alasan: string) => void;
  onLembar: () => void;
}) {
  const uid = useId();
  const [confirm, setConfirm] = useState<"selesai" | "batal" | null>(null);
  const [alasan, setAlasan] = useState("");
  const [alasanErr, setAlasanErr] = useState(false);
  const kelasBerubah = unit === "RawatInap" && !!m.dari.kelas && !!m.ke.kelas && m.dari.kelas !== m.ke.kelas;

  const confirmBatal = () => {
    if (alasan.trim().length < 3) { setAlasanErr(true); return; }
    onBatal(alasan.trim());
  };

  return (
    <section aria-labelledby={`${uid}-title`} className="overflow-hidden rounded-2xl border-2 border-amber-300 bg-amber-50/40 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-100/60 px-4 py-3 sm:px-5">
        <span aria-hidden="true" className="relative flex size-2.5">
          <span className="absolute inline-flex size-full rounded-full bg-amber-500 motion-safe:animate-ping" />
          <span className="relative inline-flex size-2.5 rounded-full bg-amber-600" />
        </span>
        <h3 id={`${uid}-title`} className="m-sm font-semibold text-amber-950">Mutasi menunggu pemindahan</h3>
        <span className="rounded-full bg-white px-2 py-0.5 m-tiny font-semibold text-amber-900 ring-1 ring-amber-300">
          Bed tujuan direservasi
        </span>
        <span className="ml-auto inline-flex items-center gap-1 m-tiny text-amber-900/80">
          <Clock3 className="size-3.5" aria-hidden="true" />
          {fmtWaktu(m.diajukanAt)} · {m.diajukanOleh}
        </span>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <LokasiBox l={m.dari} tone="from" title="Dari" />
          <span aria-hidden="true" className="flex justify-center text-amber-600">
            <ArrowDown className="size-5 sm:hidden" />
            <ArrowRight className="hidden size-5 sm:block" />
          </span>
          <LokasiBox l={m.ke} tone="to" title="Ke" />
        </div>

        {kelasBerubah && (
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 m-xs text-amber-950 ring-1 ring-inset ring-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
            <span>
              Kelas kamar berubah <b className="font-semibold">{kelasLabel(m.dari.kelas)} → {kelasLabel(m.ke.kelas)}</b>. Setelah
              pindah, akomodasi di tagihan mengikuti kelas baru (kecuali pasien titipan — tetap hak kelas).
            </span>
          </p>
        )}

        <dl className="grid gap-x-4 gap-y-2 m-xs sm:grid-cols-[auto_minmax(0,1fr)]">
          <dt className="text-slate-500">Alasan</dt>
          <dd className="font-medium text-slate-800">{m.alasan}</dd>
          {m.catatan && (
            <>
              <dt className="text-slate-500">Catatan</dt>
              <dd className="whitespace-pre-line text-slate-700">{m.catatan}</dd>
            </>
          )}
          <dt className="text-slate-500">Lembar transfer</dt>
          <dd className="flex flex-wrap items-center gap-2">
            {m.lembarTransfer ? (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-800">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Sudah diisi · {m.lembarDiisiOleh}
              </span>
            ) : (
              <span className="text-slate-600">Belum diisi (opsional)</span>
            )}
            {canAct && (
              <button
                type="button"
                onClick={onLembar}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 m-xs font-semibold text-sky-800 underline-offset-2 hover:bg-sky-50 hover:underline focus-visible:outline-2 focus-visible:outline-sky-600"
              >
                <ClipboardList className="size-3.5" aria-hidden="true" />
                {m.lembarTransfer ? "Lihat / ubah" : "Isi lembar transfer"}
              </button>
            )}
          </dd>
        </dl>
      </div>

      {canAct && (
        <div className="border-t border-amber-200 bg-white/70 px-4 py-3 sm:px-5">
          <AnimatePresence mode="wait" initial={false}>
            {confirm === null && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end"
              >
                <button
                  type="button"
                  onClick={() => { setConfirm("batal"); setAlasan(""); setAlasanErr(false); }}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 m-xs font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-600"
                >
                  <X className="size-4" aria-hidden="true" /> Batalkan mutasi
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm("selesai")}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 m-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" /> Pasien sudah dipindahkan
                </button>
              </motion.div>
            )}

            {confirm === "selesai" && (
              <motion.div key="selesai" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                role="group" aria-label="Konfirmasi pemindahan" className="flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <p className="min-w-0 flex-1 m-xs text-slate-700">
                  Konfirmasi pasien sudah tiba di <b className="font-semibold">{m.ke.ruanganNama}{m.ke.bedKode ? ` · Bed ${m.ke.bedKode}` : ""}</b>?
                  {m.dari.bedKode && <> Bed asal <b className="font-semibold">{m.dari.bedKode}</b> akan dilepas.</>}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setConfirm(null)} disabled={busy}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-lg px-3.5 m-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-500 sm:flex-none"
                  >
                    Kembali
                  </button>
                  <button type="button" onClick={onSelesai} disabled={busy} autoFocus
                    className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 m-xs font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-70 sm:flex-none"
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
                    Ya, pindahkan
                  </button>
                </div>
              </motion.div>
            )}

            {confirm === "batal" && (
              <motion.div key="batal" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                role="group" aria-label="Batalkan mutasi" className="flex flex-col gap-2.5"
              >
                <label htmlFor={`${uid}-batal`} className="m-xs font-medium text-slate-700">
                  Alasan pembatalan <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id={`${uid}-batal`}
                    type="text"
                    autoFocus
                    maxLength={300}
                    value={alasan}
                    onChange={(e) => { setAlasan(e.target.value); if (alasanErr) setAlasanErr(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); confirmBatal(); } }}
                    aria-invalid={alasanErr || undefined}
                    aria-describedby={alasanErr ? `${uid}-batal-err` : undefined}
                    placeholder="Mis. kondisi berubah, bed tujuan tidak siap"
                    className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus-visible:border-rose-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-rose-500/15 aria-invalid:border-rose-500 sm:text-sm"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setConfirm(null)} disabled={busy}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg px-3.5 m-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-500 sm:flex-none"
                    >
                      Kembali
                    </button>
                    <button type="button" onClick={confirmBatal} disabled={busy}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 m-xs font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-wait disabled:opacity-70 sm:flex-none"
                    >
                      {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                      Batalkan & lepas bed
                    </button>
                  </div>
                </div>
                {alasanErr && <p id={`${uid}-batal-err`} className="m-xs font-medium text-rose-700">Tuliskan alasan pembatalan.</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
