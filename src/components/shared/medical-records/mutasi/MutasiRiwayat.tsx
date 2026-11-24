"use client";

// Riwayat mutasi kunjungan (Selesai / Dibatalkan) sebagai timeline. Lembar transfer yang terisi
// ditampilkan ringkas di <details> (native, bisa dibuka keyboard); mutasi Selesai bisa diisi/diubah
// lembarnya.

import { ArrowRight, CheckCircle2, ClipboardList, History, XCircle } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { LembarTransferData, MutasiDTO } from "@/lib/api/mutasi";
import { fmtWaktu, lokasiLabel } from "./mutasiUi";

function LembarRingkas({ l }: { l: LembarTransferData }) {
  const ttv = [
    l.tdSistolik && l.tdDiastolik ? `TD ${l.tdSistolik}/${l.tdDiastolik}` : null,
    l.nadi ? `N ${l.nadi}` : null,
    l.respirasi ? `RR ${l.respirasi}` : null,
    l.suhu ? `S ${l.suhu}°C` : null,
    l.spo2 ? `SpO₂ ${l.spo2}%` : null,
    l.gcsE && l.gcsV && l.gcsM ? `GCS ${l.gcsE + l.gcsV + l.gcsM}` : null,
  ].filter(Boolean);
  const rows: [string, string | null | undefined][] = [
    ["Waktu transfer", fmtWaktu(l.waktuTransfer)],
    ["Diagnosa", l.diagnosa],
    ["Keadaan umum", [l.kondisiUmum, l.kesadaran].filter(Boolean).join(" · ") || null],
    ["Tanda vital", ttv.join(", ") || null],
    ["Alat terpasang", [...l.alatTerpasang, l.alatLain].filter(Boolean).join(", ") || null],
    ["Obat / cairan", l.obatCairan],
    ["Risiko", l.risiko.join(", ") || null],
    ["Perhatian", l.perhatian],
    ["Dokumen dibawa", l.dokumenDibawa.join(", ") || null],
    ["Pendamping", l.pendamping],
    ["Petugas penerima", l.petugasPenerima],
    ["Catatan", l.catatan],
  ];
  return (
    <dl className="mt-2 grid gap-x-3 gap-y-1 m-xs sm:grid-cols-[auto_minmax(0,1fr)]">
      {rows.filter(([, v]) => v).map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-slate-500">{k}</dt>
          <dd className="whitespace-pre-line text-slate-800">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MutasiRiwayat({ items, canEdit, onLembar }: {
  items: MutasiDTO[];
  canEdit: boolean;
  onLembar: (m: MutasiDTO) => void;
}) {
  return (
    <section aria-labelledby="mutasi-riwayat-title" className="flex min-w-0 flex-col gap-3">
      <h3 id="mutasi-riwayat-title" className="flex items-center gap-2 m-sm font-semibold text-slate-900">
        <History className="size-4 text-slate-500" aria-hidden="true" />
        Riwayat mutasi
        <span className="rounded-full bg-slate-100 px-2 py-0.5 m-tiny font-semibold tabular-nums text-slate-600">{items.length}</span>
      </h3>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center m-xs text-slate-500">
          Belum ada mutasi untuk kunjungan ini.
        </p>
      ) : (
        <ol className="relative flex flex-col gap-3 before:absolute before:top-2 before:bottom-2 before:left-[0.6875rem] before:w-px before:bg-slate-200">
          {items.map((m) => {
            const ok = m.status === "Selesai";
            return (
              <li key={m.id} className="relative pl-8">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-3 left-0 flex size-6 items-center justify-center rounded-full ring-4 ring-white",
                    ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {ok ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                </span>
                <article className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 m-tiny font-bold",
                      ok ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
                    )}>
                      {ok ? "Selesai" : "Dibatalkan"}
                    </span>
                    <time className="m-tiny text-slate-500">{fmtWaktu(ok ? m.selesaiAt : m.dibatalkanAt)}</time>
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 m-xs">
                    <span className="text-slate-600">{lokasiLabel(m.dari)}</span>
                    <ArrowRight className="size-3.5 text-slate-400" role="img" aria-label="ke" />
                    <span className="font-semibold text-slate-900">{lokasiLabel(m.ke)}</span>
                  </p>
                  <p className="mt-1 m-xs text-slate-600">{m.alasan}</p>
                  <p className="mt-1 m-tiny text-slate-500">
                    Diajukan {m.diajukanOleh}
                    {ok && m.selesaiOleh && <> · dipindahkan {m.selesaiOleh}</>}
                    {!ok && m.dibatalkanOleh && <> · dibatalkan {m.dibatalkanOleh}{m.alasanBatal ? ` — ${m.alasanBatal}` : ""}</>}
                  </p>

                  {(m.lembarTransfer || (ok && canEdit)) && (
                    <div className="mt-2.5 border-t border-slate-100 pt-2.5">
                      {m.lembarTransfer ? (
                        <details className="group">
                          <summary className="flex cursor-pointer list-none items-center gap-1.5 m-xs font-semibold text-sky-800 [&::-webkit-details-marker]:hidden">
                            <ClipboardList className="size-3.5" aria-hidden="true" />
                            Lembar transfer · {m.lembarDiisiOleh}
                            <span className="m-tiny font-normal text-slate-500 group-open:hidden">(lihat)</span>
                          </summary>
                          <LembarRingkas l={m.lembarTransfer} />
                          {ok && canEdit && (
                            <button type="button" onClick={() => onLembar(m)}
                              className="mt-2 m-xs font-semibold text-sky-800 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-sky-600"
                            >
                              Ubah lembar transfer
                            </button>
                          )}
                        </details>
                      ) : (
                        <button type="button" onClick={() => onLembar(m)}
                          className="inline-flex items-center gap-1.5 m-xs font-semibold text-sky-800 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-sky-600"
                        >
                          <ClipboardList className="size-3.5" aria-hidden="true" /> Isi lembar transfer (opsional)
                        </button>
                      )}
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
