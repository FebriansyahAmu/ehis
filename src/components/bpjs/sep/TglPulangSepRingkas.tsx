"use client";

// Lembar ringkas SEP di tab Update Tanggal Pulang — tampil sesudah "Periksa" agar petugas yakin
// SEP yang akan diubah memang SEP pasien yang benar (nomor, status, diagnosa, tanggal terbit,
// kartu/RM, jenis pelayanan, KLL). Komponen shadcn: Item · Badge · Button.

import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemFooter, ItemHeader } from "@/components/ui/item";
import { cn } from "@/lib/ui/utils";
import type { SEPRecordExt } from "@/lib/bpjs/bpjsShared";
import { BADGE, DOT, LAKA_LABEL, STATUS_META, fmtTglPendek, klsLabel, type BadgeTone } from "./sepShared";
import { sepKll } from "./updateTglPulangShared";

function Chip({ tone, children }: { tone: BadgeTone; children: string }) {
  return (
    <Badge className={cn("gap-1.5 px-2 font-medium", BADGE[tone])}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOT[tone])} />
      {children}
    </Badge>
  );
}

export default function TglPulangSepRingkas({ sep, onBukaSEP }: { sep: SEPRecordExt; onBukaSEP?: (no: string) => void }) {
  const meta = STATUS_META[sep.statusInternal];
  const ri = sep.jnsPelayanan === "1";
  const kll = sepKll(sep);

  const fakta: [string, string][] = [
    ["Terbit", fmtTglPendek(sep.tglTerbit)],
    ["Hak kelas", klsLabel(sep.klsRawat.klsRawatHak)],
    ["No. kartu", sep.noKartu],
    ["No. RM", sep.noMR || "—"],
  ];

  return (
    // Item bawaan = baris `flex-wrap` + header/footer `basis-full`. Untuk kartu vertikal: matikan
    // wrap & kembalikan basis ke `auto`, kalau tidak isi terlempar ke kolom kedua.
    <Item variant="muted" size="sm" className="flex-col flex-nowrap items-stretch gap-3 rounded-xl bg-slate-50 p-3">
      <ItemHeader className="basis-auto items-start">
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">SEP ditemukan</p>
          <p className="truncate text-sm font-semibold tracking-wide tabular-nums">{sep.noSEP}</p>
        </div>
        <Badge className={cn("shrink-0", BADGE[meta.tone])}>{meta.label}</Badge>
      </ItemHeader>

      <ItemContent className="flex-none gap-3">
        <p className="flex items-start gap-2 text-xs">
          <Badge className="shrink-0 rounded-md bg-emerald-50 px-1.5 font-semibold text-emerald-800 tabular-nums">
            {sep.diagAwal}
          </Badge>
          <span className="pt-0.5">{sep.diagAwalNama ?? "Nama diagnosa belum tersedia"}</span>
        </p>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          {fakta.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[11px] text-muted-foreground">{k}</dt>
              <dd className="truncate font-medium tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>

        <ul aria-label="Penanda SEP" className="flex flex-wrap gap-1.5">
          <li>
            <Chip tone={ri ? "cyan" : "sky"}>{ri ? "Rawat inap" : "Rawat jalan"}</Chip>
          </li>
          {kll && sep.jaminan && (
            <li>
              <Chip tone="amber">{LAKA_LABEL[sep.jaminan.lakaLantas as "1" | "2" | "3"]}</Chip>
            </li>
          )}
          {sep.tglPulang && (
            <li>
              <Chip tone="slate">{`Pulang ${fmtTglPendek(sep.tglPulang)}`}</Chip>
            </li>
          )}
        </ul>
      </ItemContent>

      {onBukaSEP && (
        <ItemFooter className="basis-auto justify-end">
          <Button type="button" variant="ghost" size="xs" onClick={() => onBukaSEP(sep.noSEP)} className="text-muted-foreground">
            Lihat detail SEP
            <ArrowUpRight aria-hidden="true" />
          </Button>
        </ItemFooter>
      )}
    </Item>
  );
}
