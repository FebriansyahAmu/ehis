"use client";

// Panel detail tab SEP Internal: rujukan internal satu SEP — rute poli asal → tujuan (teal =
// rujukan, arti tetap di modul SEP), tanggal, dokter tujuan, diagnosa, no. surat (bisa disalin),
// penunjang, pencatat; aksi Hapus membuka dialog konfirmasi. Rujukan yang sudah dihapus di sesi ini
// tetap tampil bertanda "Dihapus" (mock tidak mengubah data, jadi muat ulang akan memunculkannya lagi).
// Komponen shadcn: Card · Item · Badge · Button · Empty · Skeleton · Alert.

import type { Ref } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowRightLeft, ArrowUpRight, RotateCcw, Trash2, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { cn } from "@/lib/ui/utils";
import type { SEPInternalItem } from "@/lib/bpjs/bpjsShared";
import { BADGE, errorLabel, fmtTglPendek } from "./sepShared";
import { kunciRujukan, namaPoli, type HasilInternal } from "./sepInternalShared";

const KARTU = "gap-0 border-0 py-0";

function Rujukan({
  noSep,
  it,
  dihapus,
  index,
  onHapus,
}: {
  noSep: string;
  it: SEPInternalItem;
  dihapus: boolean;
  index: number;
  onHapus: (it: SEPInternalItem) => void;
}) {
  const fakta: [string, string][] = [
    ["Dokter tujuan", it.nmdokter || "—"],
    ["Diagnosa", `${it.diagppk} · ${it.nmdiag}`],
  ];
  if (it.nmpenunjang) fakta.push(["Penunjang", it.nmpenunjang]);

  return (
    <motion.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Item
        size="sm"
        className={cn(
          "flex-col flex-nowrap items-stretch gap-3 rounded-xl p-3 transition-colors",
          dihapus ? "bg-rose-50/60" : "bg-slate-50",
        )}
      >
        {/* Rute */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="sr-only">Dari</span>
          <Badge className={cn("px-2 text-[11px]", BADGE.slate)}>{namaPoli(it.nmpoliasal)}</Badge>
          <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">ke</span>
          <Badge className={cn("px-2 text-[11px]", BADGE.teal)}>{namaPoli(it.nmtujuanrujuk)}</Badge>
          <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{fmtTglPendek(it.tglrujukinternal)}</span>
        </div>

        <dl className="grid gap-x-3 gap-y-2 text-xs sm:grid-cols-2">
          {fakta.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[11px] text-muted-foreground">{k}</dt>
              <dd className="truncate font-medium tabular-nums">{v}</dd>
            </div>
          ))}
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">No. surat</dt>
            <dd className="flex items-center gap-1">
              <span className="truncate font-medium tabular-nums">{it.nosurat}</span>
              <CopyButton value={it.nosurat} label={`nomor surat ${it.nosurat}`} />
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
            Dicatat {it.fuser ? `oleh ${it.fuser}` : ""} · {fmtTglPendek(it.fdate)}
          </p>
          {dihapus ? (
            <Badge className={cn("px-2 text-[11px]", BADGE.rose)}>Dihapus</Badge>
          ) : (
            <Button
              size="xs"
              variant="secondary"
              onClick={() => onHapus(it)}
              className="bg-rose-50 text-rose-700 hover:bg-rose-100"
            >
              <Trash2 aria-hidden="true" />
              Hapus<span className="sr-only"> rujukan ke {namaPoli(it.nmtujuanrujuk)}, SEP {noSep}</span>
            </Button>
          )}
        </div>
      </Item>
    </motion.li>
  );
}

export default function SEPInternalDetail({
  hasil,
  terhapus,
  judulRef,
  onUlang,
  onHapus,
  onBukaSEP,
}: {
  hasil: HasilInternal;
  terhapus: ReadonlySet<string>;
  /** Judul panel (tabIndex -1) — tujuan fokus sesudah dialog hapus ditutup. */
  judulRef: Ref<HTMLHeadingElement>;
  onUlang: () => void;
  onHapus: (it: SEPInternalItem) => void;
  onBukaSEP?: (noSEP: string) => void;
}) {
  if (hasil.status === "idle") {
    return (
      <Empty className="h-full min-h-72 gap-3 rounded-xl bg-card p-8 text-card-foreground shadow-sm md:p-8">
        <EmptyHeader className="gap-1">
          <EmptyMedia variant="icon" className="mb-2 size-11 rounded-xl bg-teal-50 text-teal-700">
            <ArrowRightLeft className="size-5" aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle className="text-sm font-semibold tracking-normal">Belum ada SEP dipilih</EmptyTitle>
          <EmptyDescription className="max-w-xs text-xs/relaxed">
            Cari nomor SEP atau pilih dari daftar untuk melihat rujukan internalnya
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (hasil.status === "loading") {
    return (
      <Card className={cn(KARTU, "gap-3 p-4")} aria-hidden="true">
        <Skeleton className="h-6 w-56 rounded-lg" />
        <Skeleton className="h-32 rounded-xl" />
      </Card>
    );
  }

  if (hasil.status === "error") {
    const { title, desc, kode } = errorLabel(hasil.error);
    return (
      <Alert className="rounded-xl border-0 bg-rose-50 p-4 text-rose-900 shadow-sm [&>svg]:size-4">
        <WifiOff aria-hidden="true" />
        <AlertTitle className="text-sm font-semibold">
          {title}
          {kode && <span className="ml-1.5 text-xs font-normal opacity-70 tabular-nums">Kode {kode}</span>}
        </AlertTitle>
        <AlertDescription className="text-xs/relaxed text-current">
          <p>
            {desc} <span className="tabular-nums">({hasil.no})</span>
          </p>
          <Button type="button" size="xs" variant="secondary" onClick={onUlang} className="mt-1 bg-white">
            <RotateCcw aria-hidden="true" />
            Coba lagi
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const aktif = hasil.list.filter((it) => !terhapus.has(kunciRujukan(hasil.no, it))).length;

  return (
    <Card className={KARTU}>
      <CardHeader className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-sm">
            <h2 ref={judulRef} tabIndex={-1} className="outline-none">
              Rujukan internal
            </h2>
            <Badge variant="secondary" className="px-1.5 text-[11px] tabular-nums">
              {aktif}
            </Badge>
          </CardTitle>
          <CardDescription className="mt-0.5 text-xs">
            SEP <span className="font-medium text-foreground tabular-nums">{hasil.no}</span>
          </CardDescription>
        </div>
        {onBukaSEP && (
          <Button variant="ghost" size="xs" onClick={() => onBukaSEP(hasil.no)} className="text-muted-foreground">
            Lihat SEP
            <ArrowUpRight aria-hidden="true" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-3">
        {hasil.list.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-3 py-6 text-center text-xs text-muted-foreground">
            SEP ini tidak punya rujukan internal
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {hasil.list.map((it, i) => (
              <Rujukan
                key={kunciRujukan(hasil.no, it)}
                noSep={hasil.no}
                it={it}
                index={i}
                dihapus={terhapus.has(kunciRujukan(hasil.no, it))}
                onHapus={onHapus}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
