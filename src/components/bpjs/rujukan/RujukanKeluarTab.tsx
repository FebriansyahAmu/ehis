"use client";

// Tab Rujukan keluar: rujukan dari RS ini ke faskes lain (V-Claim GET /Rujukan/Keluar/List/
// tglMulai/{a}/tglAkhir/{b}) per bulan — dulu tidak ada di halaman ini sama sekali. Periode
// digeser per bulan dan dimuat OTOMATIS; saringan nama/kartu/nomor/tujuan di klien. Klik baris →
// detail di Sheet kanan. Membuat rujukan keluar tetap dari Disposisi Rawat Jalan (Rujuk Eksternal).
// Status memuat diturunkan dari kunci data. Komponen shadcn: Card · Item · Badge · Button · Input ·
// Skeleton · Empty · Sheet.

import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight, Info, Send, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtTglPendek, geserPeriode, labelPeriode, periodeIni, rentangPeriode, type Periode } from "@/components/bpjs/shared/tanggal";
import { listRujukanKeluar } from "@/lib/bpjs/vClaimRujukan";
import type { BPJSError, RujukanKeluarListItem } from "@/lib/bpjs/bpjsShared";
import RujukanKeluarSheet from "./RujukanKeluarSheet";
import { BadgeNada, GalatRujukan, KARTU, KolomSaring, PeriodeStepper } from "./rujukanUi";
import { GALAT_KONEKSI, PERIODE_UJI, jenisPelayanan } from "./rujukanShared";

type Hasil = { kunci: string; ok: true; list: RujukanKeluarListItem[] } | { kunci: string; ok: false; error: BPJSError };

function cocok(r: RujukanKeluarListItem, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return [r.nama, r.noKartu, r.noRujukan, r.noSep, r.namaPpkDirujuk].some((v) => v.toLowerCase().includes(s));
}

function Baris({ r, index, onBuka }: { r: RujukanKeluarListItem; index: number; onBuka: () => void }) {
  const jp = jenisPelayanan(r.jnsPelayanan);
  return (
    <motion.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(index, 8) * 0.025 }}>
      <Item asChild size="sm" className="w-full flex-nowrap items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 sm:items-center">
        <button type="button" onClick={onBuka} aria-haspopup="dialog">
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Send className="size-3.5" />
          </span>
          <ItemContent className="min-w-0 gap-0.5">
            <ItemTitle className="w-full min-w-0 flex-wrap gap-x-2 gap-y-1 text-xs">
              <span className="truncate font-semibold">{r.nama}</span>
              <BadgeNada tone={jp.tone}>{jp.label}</BadgeNada>
            </ItemTitle>
            <ItemDescription className="line-clamp-1 text-[11px] text-wrap">
              <span aria-hidden="true">→ </span>
              <span className="sr-only">dirujuk ke </span>
              <span className="font-medium text-teal-800">{r.namaPpkDirujuk}</span>
            </ItemDescription>
            <p className="truncate text-[11px] text-muted-foreground tabular-nums">
              {r.noRujukan} · kartu {r.noKartu}
            </p>
          </ItemContent>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
            {fmtTglPendek(r.tglRujukan)}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </span>
        </button>
      </Item>
    </motion.li>
  );
}

export default function RujukanKeluarTab() {
  const id = useId();
  const [periode, setPeriode] = useState<Periode>(periodeIni);
  const [q, setQ] = useState("");
  const [ulang, setUlang] = useState(0);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [buka, setBuka] = useState<string | null>(null);

  const kunci = `${periode.tahun}-${periode.bulan}#${ulang}`;
  const memuat = hasil?.kunci !== kunci;

  useEffect(() => {
    let batal = false;
    const { mulai, akhir } = rentangPeriode(periode);
    listRujukanKeluar(mulai, akhir)
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
  }, [kunci, periode]);

  const list = hasil && hasil.ok && !memuat ? [...hasil.list].sort((a, b) => b.tglRujukan.localeCompare(a.tglRujukan)) : [];
  const tampil = list.filter((r) => cocok(r, q.trim()));
  const ri = list.filter((r) => r.jnsPelayanan === "1").length;
  const tujuan = new Set(list.map((r) => r.ppkDirujuk)).size;

  return (
    <div className="p-4 sm:p-5">
      <Card className={KARTU}>
        <section aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 py-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4">
            <div className="min-w-0 flex-1">
              <h2 id={`${id}-judul`} className="text-sm font-semibold">
                Rujukan keluar
              </h2>
              <p className="text-xs text-muted-foreground">Pasien yang dirujuk dari RS ini ke faskes lain</p>
            </div>
            <PeriodeStepper periode={periode} onChange={setPeriode} />
          </div>

          <p className="mx-4 flex items-start gap-2 rounded-xl bg-teal-50/70 p-3 text-xs/relaxed text-teal-950">
            <Info className="mt-0.5 size-3.5 shrink-0 text-teal-700" aria-hidden="true" />
            <span>
              Rujukan keluar dibuat dari <strong className="font-semibold">Disposisi Rawat Jalan → Rujuk Eksternal</strong>. Di sini
              untuk memantau dan membuka detailnya.
            </span>
          </p>

          {!memuat && list.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-4">
              <KolomSaring id={`${id}-q`} value={q} onChange={setQ} label="Saring nama, kartu, nomor, atau faskes tujuan" placeholder="Saring nama, kartu, nomor, atau tujuan" />
              <ul aria-label="Ringkasan periode" className="flex flex-wrap gap-1.5">
                <li>
                  <Badge variant="secondary" className="text-[11px] tabular-nums">
                    {list.length} rujukan
                  </Badge>
                </li>
                {ri > 0 && (
                  <li>
                    <BadgeNada tone="cyan" className="tabular-nums">
                      {ri} rawat inap
                    </BadgeNada>
                  </li>
                )}
                <li>
                  <BadgeNada tone="teal" className="tabular-nums">
                    {tujuan} faskes tujuan
                  </BadgeNada>
                </li>
              </ul>
            </div>
          )}

          <div className="px-2">
            {memuat ? (
              <div className="flex flex-col gap-1.5 px-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : hasil && !hasil.ok ? (
              <div className="px-2">
                <GalatRujukan error={hasil.error} onUlang={() => setUlang((n) => n + 1)} />
              </div>
            ) : list.length === 0 ? (
              <Empty className="gap-3 p-6 md:p-8">
                <EmptyHeader className="gap-1">
                  <EmptyMedia variant="icon" className="mb-2 size-10 rounded-xl bg-slate-100 text-slate-500">
                    <Send className="size-5" aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm font-semibold tracking-normal">Belum ada rujukan keluar</EmptyTitle>
                  <EmptyDescription className="text-xs">Tidak ada pasien yang dirujuk keluar pada {labelPeriode(periode)}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="flex-row flex-wrap justify-center gap-1.5">
                  <Button variant="secondary" size="xs" onClick={() => setPeriode((p) => geserPeriode(p, -1))}>
                    <ChevronLeft aria-hidden="true" />
                    Lihat {labelPeriode(geserPeriode(periode, -1))}
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => setPeriode({ ...PERIODE_UJI })} className="text-emerald-700">
                    Data uji: {labelPeriode(PERIODE_UJI)}
                    <ChevronRight aria-hidden="true" />
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
                <ul aria-label={`Rujukan keluar ${labelPeriode(periode)}`} className="flex flex-col gap-0.5">
                  {tampil.map((r, i) => (
                    <Baris key={r.noRujukan} r={r} index={i} onBuka={() => setBuka(r.noRujukan)} />
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
            {memuat ? "" : hasil && !hasil.ok ? "Daftar gagal dimuat" : `${list.length} rujukan keluar pada ${labelPeriode(periode)}`}
          </p>
        </section>
      </Card>

      <RujukanKeluarSheet noRujukan={buka} onClose={() => setBuka(null)} />
    </div>
  );
}
