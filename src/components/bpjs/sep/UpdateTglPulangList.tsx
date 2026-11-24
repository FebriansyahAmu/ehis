"use client";

// Riwayat update tanggal pulang per bulan (V-Claim GET /SEP/UpdTglPlg/list/bulan/tahun/filter).
// Periode dipilih dengan tombol geser bulan (bukan dropdown) dan dimuat OTOMATIS saat periode
// berganti atau sesudah form menyimpan (`refreshKey` — dulu diterima tapi diabaikan). Saringan
// No. SEP / kartu / nama berjalan di klien (instan, tanpa panggilan ulang ke BPJS).
// Baris tanpa garis (Item + jarak). Aksi: "Lihat" membuka SEP di tab Cari, "Ubah" memuat SEP itu
// ke form. Status memuat diturunkan dari kunci data (tanpa setState sinkron di effect).
// Komponen shadcn: Item · Badge · Button · Input · Skeleton · Empty · Alert.

import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarX2, ChevronLeft, ChevronRight, RotateCcw, Search, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/ui/utils";
import { listUpdateTglPulang } from "@/lib/bpjs/vClaimSEP";
import type { BPJSError, UpdateTglPulangListItem } from "@/lib/bpjs/bpjsShared";
import { BADGE, DOT, errorLabel, fmtTglPendek } from "./sepShared";
import {
  geserPeriode,
  labelPeriode,
  periodeIni,
  samaPeriode,
  selisihHari,
  statusPulangMeta,
  type Periode,
} from "./updateTglPulangShared";
import { NADA_ALERT } from "./tglPulangUi";

type Hasil =
  | { kunci: string; ok: true; list: UpdateTglPulangListItem[] }
  | { kunci: string; ok: false; error: BPJSError };

const GALAT_KONEKSI: BPJSError = {
  type: "BPJSMetaError",
  code: "503",
  message: "Koneksi ke V-Claim gagal",
  endpoint: "",
  retryable: true,
};

function cocok(it: UpdateTglPulangListItem, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return it.noSep.toLowerCase().includes(s) || it.noKartu.includes(s) || it.nama.toLowerCase().includes(s);
}

// ── Baris ─────────────────────────────────────────────────

function Baris({
  item,
  index,
  onBukaSEP,
  onUbah,
}: {
  item: UpdateTglPulangListItem;
  index: number;
  onBukaSEP?: (no: string) => void;
  onUbah?: (no: string) => void;
}) {
  const ri = item.jnsPelayanan === "1";
  const hari = selisihHari(item.tglSep, item.tglPulang);
  const st = statusPulangMeta(item.status);
  const tanggal = (
    <>
      {fmtTglPendek(item.tglSep)} <span aria-hidden="true">→</span>
      <span className="sr-only">sampai</span> <span className="font-medium text-foreground">{fmtTglPendek(item.tglPulang)}</span>
    </>
  );

  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index, 8) * 0.025 }}
    >
      <Item size="sm" className="flex-nowrap items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 sm:items-center">
        <ItemContent className="min-w-0 gap-0.5">
          <ItemTitle className="w-full min-w-0 flex-wrap gap-x-2 gap-y-1 text-xs">
            <span className="truncate font-semibold tracking-wide tabular-nums">{item.noSep}</span>
            <Badge className={cn("gap-1 px-1.5 text-[11px]", BADGE[ri ? "cyan" : "sky"])}>
              <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOT[ri ? "cyan" : "sky"])} />
              {ri ? "Rawat inap" : "Rawat jalan"}
            </Badge>
            {st && st.value !== "1" && <Badge className={cn("px-1.5 text-[11px]", BADGE[st.tone])}>{st.ringkas}</Badge>}
          </ItemTitle>
          <ItemDescription className="line-clamp-1 text-[11px] text-wrap">
            {item.nama} · <span className="tabular-nums">{item.noKartu}</span>
          </ItemDescription>
          <p className="text-[11px] text-muted-foreground tabular-nums sm:hidden">{tanggal}</p>
        </ItemContent>

        <ItemContent className="hidden flex-none items-end gap-0.5 text-right sm:flex">
          <p className="text-xs text-muted-foreground tabular-nums">{tanggal}</p>
          <p className="max-w-44 truncate text-[11px] text-muted-foreground">oleh {item.user}</p>
        </ItemContent>

        {hari !== null && hari >= 0 && (
          <Badge className="shrink-0 bg-emerald-50 px-2 text-[11px] text-emerald-800 tabular-nums">
            {hari} hari
          </Badge>
        )}

        <ItemActions className="shrink-0 gap-0.5">
          {onBukaSEP && (
            <Button variant="ghost" size="xs" onClick={() => onBukaSEP(item.noSep)} className="text-muted-foreground">
              Lihat<span className="sr-only"> SEP {item.noSep}</span>
            </Button>
          )}
          {onUbah && (
            <Button variant="ghost" size="xs" onClick={() => onUbah(item.noSep)} className="text-emerald-700 hover:text-emerald-800">
              Ubah<span className="sr-only"> tanggal pulang SEP {item.noSep}</span>
            </Button>
          )}
        </ItemActions>
      </Item>
    </motion.li>
  );
}

// ── Komponen ──────────────────────────────────────────────

export default function UpdateTglPulangList({
  refreshKey = 0,
  onBukaSEP,
  onUbah,
}: {
  /** Naikkan untuk memuat ulang (mis. sesudah form menyimpan). */
  refreshKey?: number;
  onBukaSEP?: (noSEP: string) => void;
  onUbah?: (noSEP: string) => void;
}) {
  const id = useId();
  const sekarang = periodeIni();
  const [periode, setPeriode] = useState<Periode>(sekarang);
  const [q, setQ] = useState("");
  const [ulang, setUlang] = useState(0);
  const [hasil, setHasil] = useState<Hasil | null>(null);

  const kunci = `${periode.tahun}-${periode.bulan}-${refreshKey}-${ulang}`;
  const memuat = hasil?.kunci !== kunci;
  const bulanIni = samaPeriode(periode, sekarang);

  useEffect(() => {
    let batal = false;
    listUpdateTglPulang(periode.bulan, periode.tahun, "")
      .then((res) => {
        if (batal) return;
        setHasil(
          res.ok
            ? { kunci, ok: true, list: res.value.response?.list ?? [] }
            : { kunci, ok: false, error: res.error },
        );
      })
      .catch(() => {
        if (!batal) setHasil({ kunci, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kunci, periode.bulan, periode.tahun]);

  function geser(langkah: number) {
    if (langkah > 0 && bulanIni) return; // tidak ke masa depan
    setPeriode((p) => geserPeriode(p, langkah));
  }

  const list = hasil && hasil.ok && !memuat ? hasil.list : [];
  const tampil = list.filter((it) => cocok(it, q.trim()));
  const lama = list.map((it) => selisihHari(it.tglSep, it.tglPulang)).filter((n): n is number => n !== null && n >= 0);
  const rerata = lama.length ? Math.round((lama.reduce((a, b) => a + b, 0) / lama.length) * 10) / 10 : null;
  const meninggal = list.filter((it) => it.status === "4").length;

  return (
    <section aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 py-4">
      {/* Kepala: judul + periode */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4">
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-judul`} className="text-sm font-semibold">
            Riwayat pembaruan
          </h2>
          <p className="text-xs text-muted-foreground">Tanggal pulang yang sudah dikirim ke V-Claim</p>
        </div>
        <div role="group" aria-label="Periode" className="flex items-center gap-0.5 rounded-xl bg-slate-100 p-1">
          <Button variant="ghost" size="icon-xs" aria-label="Bulan sebelumnya" onClick={() => geser(-1)} className="hover:bg-white">
            <ChevronLeft className="size-3.5" aria-hidden="true" />
          </Button>
          <span aria-live="polite" className="min-w-28 px-1 text-center text-xs font-medium tabular-nums">
            {labelPeriode(periode)}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Bulan berikutnya"
            aria-disabled={bulanIni}
            onClick={() => geser(1)}
            className="hover:bg-white aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent"
          >
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
        {!bulanIni && (
          <Button variant="ghost" size="xs" onClick={() => setPeriode(sekarang)} className="text-emerald-700">
            Bulan ini
          </Button>
        )}
      </div>

      {/* Saring + ringkasan */}
      <div className="flex flex-wrap items-center gap-2 px-4">
        <div className="relative min-w-48 flex-1">
          <label htmlFor={`${id}-q`} className="sr-only">
            Saring No. SEP, No. kartu, atau nama
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id={`${id}-q`}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Saring No. SEP, kartu, atau nama"
            className="h-8 rounded-lg border-0 bg-slate-100 pl-8 text-xs shadow-none placeholder:text-muted-foreground/70 focus-visible:bg-white focus-visible:ring-ring/40 md:text-xs"
          />
        </div>
        {!memuat && list.length > 0 && (
          <ul aria-label="Ringkasan periode" className="flex flex-wrap gap-1.5">
            <li>
              <Badge variant="secondary" className="text-[11px] tabular-nums">
                {list.length} SEP
              </Badge>
            </li>
            {rerata !== null && (
              <li>
                <Badge className="bg-emerald-50 text-[11px] text-emerald-800 tabular-nums">rata-rata {rerata} hari</Badge>
              </li>
            )}
            {meninggal > 0 && (
              <li>
                <Badge className="bg-rose-50 text-[11px] text-rose-800 tabular-nums">{meninggal} meninggal</Badge>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Isi */}
      <div className="px-2">
        {memuat ? (
          <div className="flex flex-col gap-1.5 px-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : hasil && !hasil.ok ? (
          <GalatMuat error={hasil.error} onUlang={() => setUlang((n) => n + 1)} />
        ) : list.length === 0 ? (
          <Empty className="gap-3 p-6 md:p-8">
            <EmptyHeader className="gap-1">
              <EmptyMedia variant="icon" className="mb-2 size-10 rounded-xl bg-slate-100 text-slate-500">
                <CalendarX2 className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle className="text-sm font-semibold tracking-normal">Belum ada pembaruan</EmptyTitle>
              <EmptyDescription className="text-xs">
                Tidak ada tanggal pulang yang dikirim pada {labelPeriode(periode)}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="secondary" size="xs" onClick={() => geser(-1)}>
                <ChevronLeft aria-hidden="true" />
                Lihat {labelPeriode(geserPeriode(periode, -1))}
              </Button>
            </EmptyContent>
          </Empty>
        ) : tampil.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <p className="text-xs text-muted-foreground">
              Tidak ada yang cocok dengan “<span className="text-foreground">{q.trim()}</span>”
            </p>
            <Button variant="ghost" size="xs" onClick={() => setQ("")}>
              <X aria-hidden="true" />
              Hapus saringan
            </Button>
          </div>
        ) : (
          <>
            <ul aria-label={`Pembaruan ${labelPeriode(periode)}`} className="flex flex-col gap-0.5">
              {tampil.map((it, i) => (
                <Baris key={it.noSep} item={it} index={i} onBukaSEP={onBukaSEP} onUbah={onUbah} />
              ))}
            </ul>
            {q.trim() && (
              <p className="px-3 pt-2 text-[11px] text-muted-foreground tabular-nums">
                Menampilkan {tampil.length} dari {list.length}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function GalatMuat({ error, onUlang }: { error: BPJSError; onUlang: () => void }) {
  const { title, desc, color, kode } = errorLabel(error);
  return (
    <div className="px-2">
      <Alert role="note" className={cn("rounded-xl border-0 p-3 [&>svg]:size-4", NADA_ALERT[color])}>
        <AlertTriangle aria-hidden="true" />
        <AlertTitle className="text-xs font-semibold">
          {title}
          {kode && <span className="ml-1.5 font-normal opacity-70 tabular-nums">Kode {kode}</span>}
        </AlertTitle>
        <AlertDescription className="text-xs/relaxed text-current">
          <p>{desc}</p>
          <Button type="button" size="xs" variant="secondary" onClick={onUlang} className="mt-1 bg-white">
            <RotateCcw aria-hidden="true" />
            Muat ulang
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
