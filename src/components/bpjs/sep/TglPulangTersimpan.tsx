"use client";

// Tampilan sesudah tanggal pulang tersimpan: judul difokuskan (dibacakan pembaca layar), ringkasan
// tanggal/status/lama rawat, aksi Lihat SEP & Update SEP lain. Komponen shadcn: Empty · Button.

import { useEffect, useRef } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { SEPRecordExt } from "@/lib/bpjs/bpjsShared";
import { fmtTgl } from "./sepShared";
import { labelLamaRawat, selisihHari, statusPulangMeta, type IsianPulang } from "./updateTglPulangShared";

export default function TglPulangTersimpan({
  sep,
  isian,
  onBukaSEP,
  mulaiLagi,
}: {
  sep: SEPRecordExt;
  isian: IsianPulang;
  onBukaSEP?: (noSEP: string) => void;
  mulaiLagi: () => void;
}) {
  const judulRef = useRef<HTMLHeadingElement>(null);
  const st = statusPulangMeta(isian.status);
  const lama = labelLamaRawat(selisihHari(sep.tglTerbit, isian.tglPulang));

  useEffect(() => {
    judulRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      <Empty className="gap-3 p-0 pt-2 md:p-0 md:pt-2">
        <EmptyHeader className="gap-1">
          <EmptyMedia variant="icon" className="mb-2 size-11 rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle className="text-sm font-semibold tracking-normal">
            <h3 ref={judulRef} tabIndex={-1} className="outline-none">
              Tanggal pulang tersimpan
            </h3>
          </EmptyTitle>
          <EmptyDescription className="text-xs">
            SEP <span className="font-medium text-foreground tabular-nums">{sep.noSEP}</span> sudah diperbarui di
            V-Claim BPJS
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-950">
        <div>
          <dt className="text-[11px] text-emerald-800">Tanggal pulang</dt>
          <dd className="font-semibold tabular-nums">{fmtTgl(isian.tglPulang)}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-emerald-800">Status pulang</dt>
          <dd className="font-semibold">{st?.label ?? "—"}</dd>
        </div>
        {lama && (
          <div className="col-span-2">
            <dt className="sr-only">Lama rawat</dt>
            <dd className="text-emerald-800">{lama}</dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap justify-center gap-2">
        {onBukaSEP && (
          <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => onBukaSEP(sep.noSEP)}>
            Lihat SEP
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={mulaiLagi}>
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Update SEP lain
        </Button>
      </div>
    </div>
  );
}
