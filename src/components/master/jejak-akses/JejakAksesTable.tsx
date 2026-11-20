"use client";

// Tabel riwayat akses rekam medis. <table> semantik (th scope=row = waktu) dalam wrapper region
// yang bisa digulir keyboard (tabIndex 0). Header kolom sticky; di wadah sempit (< 42rem, container
// query) baris berubah jadi kartu bertumpuk dengan label kolom disisipkan lewat ::before.

import { CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { AksesRekamMedisDTO } from "@/lib/api/audit/aksesRekamMedis";
import { JALUR_CFG, UNIT_LABEL, domainLabel, formatJam, formatWaktu } from "./jejakAksesShared";

// Sel: di mode kartu tampil blok dengan label kolom dari data-label.
const CELL =
  "px-3 py-2.5 align-top @max-2xl:block @max-2xl:px-3 @max-2xl:py-1 @max-2xl:before:mb-0.5 @max-2xl:before:block @max-2xl:before:text-xs @max-2xl:before:font-medium @max-2xl:before:text-slate-500 @max-2xl:before:content-[attr(data-label)]";

export function JejakAksesTable({
  items,
  mode,
  captionId,
  caption,
}: {
  items: AksesRekamMedisDTO[];
  /** pasien → kolom kedua = pegawai; pegawai → kolom kedua = pasien. */
  mode: "pasien" | "pegawai";
  captionId: string;
  caption: string;
}) {
  const kolomOrang = mode === "pasien" ? "Pegawai" : "Pasien";

  return (
    <div
      tabIndex={0}
      role="region"
      aria-labelledby={captionId}
      className="@container max-h-[min(640px,70vh)] overflow-auto rounded-lg border border-slate-200 bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
    >
      <table className="w-full border-separate border-spacing-0 text-left m-sm @max-2xl:block">
        <caption id={captionId} className="sr-only">
          {caption}
        </caption>
        <thead className="sticky top-0 z-10 bg-slate-50 @max-2xl:hidden">
          <tr className="m-xs text-slate-600">
            {["Waktu", kolomOrang, "Kunjungan", "Bagian dibuka", "Jalur akses", "Status"].map((h) => (
              <th key={h} scope="col" className="border-b border-slate-200 px-3 py-2 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="@max-2xl:block @max-2xl:space-y-2 @max-2xl:p-2">
          {items.map((a) => {
            const denied = a.outcome === "denied";
            const jalur = JALUR_CFG[a.jalur];
            const rowBg = denied ? "bg-rose-50" : "bg-white";
            return (
              <tr
                key={a.id}
                className={cn(
                  "@max-2xl:block @max-2xl:overflow-hidden @max-2xl:rounded-lg @max-2xl:border @max-2xl:border-slate-200 @max-2xl:pb-2",
                  rowBg,
                )}
              >
                <th
                  scope="row"
                  className={cn(
                    "sticky left-0 border-b border-slate-100 px-3 py-2.5 align-top font-normal whitespace-nowrap",
                    "@max-2xl:static @max-2xl:block @max-2xl:border-slate-200 @max-2xl:bg-slate-50",
                    rowBg,
                  )}
                >
                  <span className="block font-medium text-slate-900 tabular-nums">{formatWaktu(a.lastAt)}</span>
                  {a.hitCount > 1 && (
                    <span className="m-xs block text-slate-500 tabular-nums">
                      {a.hitCount}× sejak {formatJam(a.firstAt)}
                    </span>
                  )}
                </th>

                <td data-label={kolomOrang} className={cn(CELL, "border-b border-slate-100 @max-2xl:border-0")}>
                  {mode === "pasien" ? (
                    <>
                      <span className="block font-medium text-slate-800">{a.pegawai.nama ?? "Pengguna tanpa pegawai"}</span>
                      <span className="m-xs block text-slate-500">
                        {[a.pegawai.nip && `NIP ${a.pegawai.nip}`, a.roles.join(", ")].filter(Boolean).join(" · ")}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block font-medium text-slate-800">{a.pasien.nama ?? "—"}</span>
                      {a.pasien.noRm && (
                        <span className="m-xs block font-mono text-slate-500">RM {a.pasien.noRm}</span>
                      )}
                    </>
                  )}
                </td>

                <td data-label="Kunjungan" className={cn(CELL, "border-b border-slate-100 @max-2xl:border-0")}>
                  {a.kunjungan.noKunjungan ? (
                    <>
                      <span className="block font-mono text-slate-800">{a.kunjungan.noKunjungan}</span>
                      {a.unit && <span className="m-xs block text-slate-500">{UNIT_LABEL[a.unit] ?? a.unit}</span>}
                    </>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                <td data-label="Bagian dibuka" className={cn(CELL, "border-b border-slate-100 @max-2xl:border-0")}>
                  <ul role="list" className="flex flex-wrap gap-1">
                    {a.domains.map((d) => (
                      <li key={d} className="m-xs rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                        {domainLabel(d)}
                      </li>
                    ))}
                  </ul>
                </td>

                <td data-label="Jalur akses" className={cn(CELL, "border-b border-slate-100 @max-2xl:border-0")}>
                  <span
                    title={jalur.hint}
                    className={cn("m-xs inline-flex rounded-md px-2 py-0.5 font-medium whitespace-nowrap", jalur.className)}
                  >
                    {jalur.label}
                  </span>
                </td>

                <td data-label="Status" className={cn(CELL, "border-b border-slate-100 @max-2xl:border-0")}>
                  {denied ? (
                    <span className="inline-flex items-center gap-1 font-medium whitespace-nowrap text-rose-700">
                      <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
                      Ditolak
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-emerald-700">
                      <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                      Diizinkan
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
