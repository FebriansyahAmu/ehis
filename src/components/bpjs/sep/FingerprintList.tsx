"use client";

// Daftar peserta yang sudah validasi sidik jari pada satu tanggal pelayanan (V-Claim GET /SEP/
// FingerPrint/list/tglPelayanan/{tgl}). Tanggal dipilih lewat DatePicker atau tombol geser hari,
// dan dimuat OTOMATIS saat berganti (dulu harus klik "Muat"). Saringan nama / kartu / SEP berjalan
// di klien. Aksi per baris: "Cek" mengisi form cek dengan peserta + tanggal itu, "Lihat SEP"
// membuka SEP di tab Cari. Status memuat diturunkan dari kunci data (tanpa setState sinkron di effect).
// Komponen shadcn: Item · Badge · Button · Input · Skeleton · Empty · Alert.

import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight, Fingerprint, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/shared/inputs";
import { listFingerPrint } from "@/lib/bpjs/vClaimSEP";
import type { BPJSError, FingerPrintListItem } from "@/lib/bpjs/bpjsShared";
import { fmtTglPendek, hariIniISO } from "./sepShared";
import { GALAT_KONEKSI } from "./suplesiShared";
import { GalatPeriksa } from "./tglPulangUi";
import { TGL_UJI, geserHari, namaPeserta } from "./fingerprintShared";

type Hasil = { kunci: string; ok: true; list: FingerPrintListItem[] } | { kunci: string; ok: false; error: BPJSError };
type Baris = FingerPrintListItem & { nama: string | null };

function cocok(b: Baris, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return b.noKartu.includes(s) || b.noSEP.toLowerCase().includes(s) || (b.nama?.toLowerCase().includes(s) ?? false);
}

function BarisPeserta({
  b,
  index,
  tgl,
  onCek,
  onBukaSEP,
}: {
  b: Baris;
  index: number;
  tgl: string;
  onCek: (kartu: string, tgl: string) => void;
  onBukaSEP?: (no: string) => void;
}) {
  const siapa = b.nama ?? `kartu ${b.noKartu}`;
  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index, 8) * 0.025 }}
    >
      <Item size="sm" className="flex-nowrap items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50">
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Fingerprint className="size-4" />
        </span>
        <ItemContent className="min-w-0 gap-0.5">
          <ItemTitle className="w-full min-w-0 text-xs">
            <span className="truncate font-semibold">{b.nama ?? "Peserta tanpa data lokal"}</span>
          </ItemTitle>
          <ItemDescription className="line-clamp-1 text-[11px] text-wrap tabular-nums">
            Kartu {b.noKartu} · SEP {b.noSEP}
          </ItemDescription>
        </ItemContent>
        <ItemActions className="shrink-0 gap-0.5">
          <Button variant="ghost" size="xs" onClick={() => onCek(b.noKartu, tgl)} className="text-emerald-700 hover:text-emerald-800">
            Cek<span className="sr-only"> sidik jari {siapa}</span>
          </Button>
          {onBukaSEP && (
            <Button variant="ghost" size="xs" onClick={() => onBukaSEP(b.noSEP)} className="text-muted-foreground">
              Lihat SEP<span className="sr-only"> {b.noSEP}</span>
              <ArrowUpRight aria-hidden="true" />
            </Button>
          )}
        </ItemActions>
      </Item>
    </motion.li>
  );
}

export default function FingerprintList({
  onCek,
  onBukaSEP,
}: {
  onCek: (kartu: string, tgl: string) => void;
  onBukaSEP?: (noSEP: string) => void;
}) {
  const id = useId();
  const hariIni = hariIniISO();
  const [tgl, setTgl] = useState(hariIni);
  const [q, setQ] = useState("");
  const [ulang, setUlang] = useState(0);
  const [hasil, setHasil] = useState<Hasil | null>(null);

  const kunci = `${tgl}#${ulang}`;
  const memuat = hasil?.kunci !== kunci;
  const diHariIni = tgl >= hariIni;

  useEffect(() => {
    let batal = false;
    listFingerPrint(tgl)
      .then((res) => {
        if (batal) return;
        setHasil(res.ok ? { kunci, ok: true, list: res.value.response?.list ?? [] } : { kunci, ok: false, error: res.error });
      })
      .catch(() => {
        if (!batal) setHasil({ kunci, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kunci, tgl]);

  function geser(n: number) {
    if (n > 0 && diHariIni) return; // tidak ke masa depan
    setTgl((t) => geserHari(t, n));
  }

  const list: Baris[] = hasil && hasil.ok && !memuat ? hasil.list.map((it) => ({ ...it, nama: namaPeserta(it.noKartu) })) : [];
  const tampil = list.filter((b) => cocok(b, q.trim()));

  return (
    <section aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 py-4">
      {/* Kepala: judul + tanggal */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4">
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-judul`} className="text-sm font-semibold">
            Sudah validasi sidik jari
          </h2>
          <p className="text-xs text-muted-foreground">Peserta yang memvalidasi sidik jari pada tanggal pelayanan</p>
        </div>
        <div role="group" aria-label="Tanggal pelayanan" className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Hari sebelumnya" onClick={() => geser(-1)} className="text-muted-foreground">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <label htmlFor={`${id}-tgl`} className="sr-only">
            Tanggal pelayanan
          </label>
          <div className="w-44">
            <DatePicker id={`${id}-tgl`} value={tgl} onChange={(v) => v && setTgl(v)} variant="filled" clearable={false} />
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Hari berikutnya"
            aria-disabled={diHariIni}
            onClick={() => geser(1)}
            className="text-muted-foreground aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
          {!diHariIni && (
            <Button variant="ghost" size="xs" onClick={() => setTgl(hariIni)} className="text-emerald-700">
              Hari ini
            </Button>
          )}
        </div>
      </div>

      {/* Saring + ringkasan */}
      {!memuat && list.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4">
          <div className="relative min-w-48 flex-1">
            <label htmlFor={`${id}-q`} className="sr-only">
              Saring nama, No. kartu, atau No. SEP
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id={`${id}-q`}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Saring nama, kartu, atau SEP"
              className="h-8 rounded-lg border-0 bg-slate-100 pl-8 text-xs shadow-none placeholder:text-muted-foreground/70 focus-visible:bg-white focus-visible:ring-ring/40 md:text-xs"
            />
          </div>
          <Badge className="bg-emerald-50 text-[11px] text-emerald-800 tabular-nums">{list.length} peserta</Badge>
        </div>
      )}

      {/* Isi */}
      <div className="px-2">
        {memuat ? (
          <div className="flex flex-col gap-1.5 px-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : hasil && !hasil.ok ? (
          <div className="px-2">
            <GalatPeriksa error={hasil.error} onUlang={() => setUlang((n) => n + 1)} />
          </div>
        ) : list.length === 0 ? (
          <Empty className="gap-3 p-6 md:p-8">
            <EmptyHeader className="gap-1">
              <EmptyMedia variant="icon" className="mb-2 size-10 rounded-xl bg-slate-100 text-slate-500">
                <Fingerprint className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle className="text-sm font-semibold tracking-normal">Belum ada validasi</EmptyTitle>
              <EmptyDescription className="text-xs">
                Tidak ada peserta yang memvalidasi sidik jari pada {fmtTglPendek(tgl)}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="gap-2">
              <Button variant="secondary" size="xs" onClick={() => geser(-1)}>
                <ChevronLeft aria-hidden="true" />
                Lihat {fmtTglPendek(geserHari(tgl, -1))}
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Data uji:</span>
                {TGL_UJI.map((t) => (
                  <Button key={t} variant="ghost" size="xs" onClick={() => setTgl(t)} className="text-emerald-700 tabular-nums">
                    {fmtTglPendek(t)}
                  </Button>
                ))}
              </div>
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
            <ul aria-label={`Validasi sidik jari ${fmtTglPendek(tgl)}`} className="flex flex-col gap-0.5">
              {tampil.map((b, i) => (
                <BarisPeserta key={b.noSEP} b={b} index={i} tgl={tgl} onCek={onCek} onBukaSEP={onBukaSEP} />
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

      <p role="status" className="sr-only">
        {memuat ? "" : hasil && !hasil.ok ? "Daftar gagal dimuat" : `${list.length} peserta sudah validasi pada ${fmtTglPendek(tgl)}`}
      </p>
    </section>
  );
}
