"use client";

// Struk thermal kiosk APM digambar dengan kode — momen visual Beranda Antrean.
// Menampilkan nomor terakhir yang diambil pasien di anjungan (data store, tanpa nama
// pasien: layar ini dilihat sekilas di area loket). Tepi bergerigi = mask radial;
// bayangan lewat drop-shadow di pembungkus agar mengikuti bentuk yang ter-mask.

import type { CSSProperties } from "react";
import type { AntreanRecord } from "@/lib/antrean/types";
import { useRsProfil } from "@/lib/master/rsProfilClient";
import { fmtJam } from "@/components/antrean/board/boardShared";

const TEPI_SOBEK = [
  "radial-gradient(5px at 50% 0, #0000 96%, #000) top / 12px 51% repeat-x",
  "radial-gradient(5px at 50% 100%, #0000 96%, #000) bottom / 12px 51% repeat-x",
].join(", ");

const KERTAS: CSSProperties = { mask: TEPI_SOBEK, WebkitMask: TEPI_SOBEK };

function Perforasi() {
  return <hr className="my-3 border-0 border-t border-dashed border-slate-300" />;
}

export function StrukKiosk({ record, tanggal }: { record: AntreanRecord | null; tanggal: string }) {
  const rs = useRsProfil();

  return (
    <figure className="flex flex-col items-center gap-4">
      <div className="-rotate-1 drop-shadow-[0_8px_16px_rgba(15,23,42,0.08)]">
        <div style={KERTAS} className="w-60 bg-white px-5 py-6 font-mono text-slate-800">
          <p className="text-center m-xs font-semibold leading-tight">{rs.nama}</p>
          <p className="mt-1 text-center m-tiny text-slate-500">Anjungan pendaftaran mandiri</p>
          <p className="text-center m-tiny text-slate-500">{tanggal}</p>

          <Perforasi />

          <p className="text-center m-tiny text-slate-500">Nomor antrean</p>
          <p className="mt-1 text-center text-5xl font-semibold leading-none tabular-nums text-slate-900">
            {record?.nomorAntrean ?? "—"}
          </p>

          <Perforasi />

          {record ? (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 m-tiny">
              <dt className="text-slate-500">Poli</dt>
              <dd className="truncate">{record.poli}</dd>
              <dt className="text-slate-500">Dokter</dt>
              <dd className="truncate">{record.dokter}</dd>
              <dt className="text-slate-500">Estimasi</dt>
              <dd className="tabular-nums">± {fmtJam(record.estimasiDilayani)}</dd>
              <dt className="text-slate-500">Penjamin</dt>
              <dd>{record.caraBayar}</dd>
            </dl>
          ) : (
            <p className="py-2 text-center m-tiny text-slate-500">Belum ada nomor dari kiosk hari ini</p>
          )}

          {record && (
            <>
              <Perforasi />
              <p className="break-all text-center m-tiny text-slate-500">{record.kodebooking}</p>
            </>
          )}
        </div>
      </div>
      <figcaption className="m-xs text-slate-500">
        {record ? (
          <>
            Struk terakhir dari kiosk · diambil pukul <span className="tabular-nums">{fmtJam(record.createdAt)}</span>
          </>
        ) : (
          "Struk muncul di sini setelah pasien mengambil nomor"
        )}
      </figcaption>
    </figure>
  );
}
