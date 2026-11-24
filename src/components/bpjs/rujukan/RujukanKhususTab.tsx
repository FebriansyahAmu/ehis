"use client";

// Tab Rujukan khusus (V-Claim GET /Rujukan/Khusus/List/Bulan/{b}/Tahun/{t}): rujukan untuk kasus
// tertentu (mis. kanker, jantung intervensi, cuci darah) dengan diagnosa & prosedur tambahan.
// Periode digeser per bulan dan dimuat OTOMATIS (dulu pilih bulan + ketik tahun + klik Cari);
// tiap baris menampilkan masa berlaku (berlaku/segera berakhir/kedaluwarsa) dan aksi Hapus lewat
// dialog konfirmasi. Mock hapus tidak mengubah data → baris ditandai "Dihapus" selama sesi.
// Status memuat diturunkan dari kunci data. Komponen shadcn: Card · Item · Badge · Button · Input ·
// Skeleton · Empty · Dialog.

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookMarked, ChevronLeft, ChevronRight, Info, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { fmtTglPendek, geserPeriode, labelPeriode, periodeIni, type Periode } from "@/components/bpjs/shared/tanggal";
import { cn } from "@/lib/ui/utils";
import { listRujukanKhusus } from "@/lib/bpjs/vClaimRujukan";
import type { BPJSError, RujukanKhususListItem } from "@/lib/bpjs/bpjsShared";
import HapusRujukanKhususDialog from "./HapusRujukanKhususDialog";
import { BadgeNada, GalatRujukan, KARTU, KolomSaring, Meter, PeriodeStepper } from "./rujukanUi";
import { GALAT_KONEKSI, PERIODE_UJI, statusBerlaku } from "./rujukanShared";

type Hasil = { kunci: string; ok: true; list: RujukanKhususListItem[] } | { kunci: string; ok: false; error: BPJSError };

function cocok(r: RujukanKhususListItem, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return [r.nmpst, r.nokapst, r.norujukan, r.idrujukan, r.diagppk].some((v) => v.toLowerCase().includes(s));
}

function Baris({
  r,
  index,
  dihapus,
  onHapus,
}: {
  r: RujukanKhususListItem;
  index: number;
  dihapus: boolean;
  onHapus: () => void;
}) {
  const b = statusBerlaku(r.tglrujukan_awal, r.tglrujukan_berakhir);
  return (
    <motion.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(index, 8) * 0.025 }}>
      <Item
        size="sm"
        className={cn(
          "flex-col flex-nowrap items-stretch gap-2 rounded-xl px-3 py-2.5 transition-colors sm:flex-row sm:items-center",
          dihapus ? "bg-rose-50/60" : "hover:bg-slate-50",
        )}
      >
        <ItemContent className="min-w-0 gap-0.5">
          <ItemTitle className="w-full min-w-0 flex-wrap gap-x-2 gap-y-1 text-xs">
            <span className={cn("truncate font-semibold", dihapus && "line-through decoration-rose-400")}>{r.nmpst}</span>
            <BadgeNada tone="slate" className="tabular-nums">
              {r.diagppk}
            </BadgeNada>
            {dihapus ? (
              <BadgeNada tone="rose">Dihapus</BadgeNada>
            ) : (
              <BadgeNada tone={b.tone} titik>
                {b.label}
              </BadgeNada>
            )}
          </ItemTitle>
          <ItemDescription className="flex min-w-0 items-center gap-1 text-[11px] text-wrap tabular-nums">
            <span className="truncate">
              Kartu {r.nokapst} · ID {r.idrujukan} · {r.norujukan}
            </span>
            <CopyButton value={r.norujukan} label={`nomor rujukan ${r.norujukan}`} />
          </ItemDescription>
        </ItemContent>

        <div className="flex shrink-0 items-center gap-3 sm:w-56">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {fmtTglPendek(r.tglrujukan_awal)} <span aria-hidden="true">→</span>
              <span className="sr-only">sampai</span> {fmtTglPendek(r.tglrujukan_berakhir)}
            </p>
            {b.persen !== null && !dihapus && (
              <Meter value={b.persen} max={100} tone={b.tone} label={`Masa berlaku rujukan ${r.nmpst} terpakai ${b.persen} persen`} className="mt-1" />
            )}
          </div>
          {!dihapus && (
            <ItemActions className="shrink-0">
              <Button size="xs" variant="secondary" onClick={onHapus} className="bg-rose-50 text-rose-700 hover:bg-rose-100">
                <Trash2 aria-hidden="true" />
                Hapus<span className="sr-only"> rujukan khusus {r.nmpst}</span>
              </Button>
            </ItemActions>
          )}
        </div>
      </Item>
    </motion.li>
  );
}

export default function RujukanKhususTab() {
  const id = useId();
  const [periode, setPeriode] = useState<Periode>(periodeIni);
  const [q, setQ] = useState("");
  const [ulang, setUlang] = useState(0);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [target, setTarget] = useState<RujukanKhususListItem | null>(null);
  const [terhapus, setTerhapus] = useState<ReadonlySet<string>>(() => new Set());
  const judulRef = useRef<HTMLHeadingElement>(null);

  const kunci = `${periode.tahun}-${periode.bulan}#${ulang}`;
  const memuat = hasil?.kunci !== kunci;

  useEffect(() => {
    let batal = false;
    listRujukanKhusus(periode.bulan, periode.tahun)
      .then((res) => {
        if (batal) return;
        setHasil(res.ok ? { kunci, ok: true, list: res.value.response?.rujukan ?? [] } : { kunci, ok: false, error: res.error });
      })
      .catch(() => {
        if (!batal) setHasil({ kunci, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kunci, periode.bulan, periode.tahun]);

  const list = hasil && hasil.ok && !memuat ? hasil.list : [];
  const tampil = list.filter((r) => cocok(r, q.trim()));
  const aktif = list.filter((r) => !terhapus.has(r.idrujukan) && statusBerlaku(r.tglrujukan_awal, r.tglrujukan_berakhir).tone !== "rose").length;

  return (
    <div className="p-4 sm:p-5">
      <Card className={KARTU}>
        <section aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 py-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4">
            <div className="min-w-0 flex-1">
              <h2 id={`${id}-judul`} ref={judulRef} tabIndex={-1} className="text-sm font-semibold outline-none">
                Rujukan khusus
              </h2>
              <p className="text-xs text-muted-foreground">Rujukan kasus tertentu per bulan terbit</p>
            </div>
            <PeriodeStepper periode={periode} onChange={setPeriode} />
          </div>

          <p className="mx-4 flex items-start gap-2 rounded-xl bg-teal-50/70 p-3 text-xs/relaxed text-teal-950">
            <Info className="mt-0.5 size-3.5 shrink-0 text-teal-700" aria-hidden="true" />
            <span>
              Rujukan khusus dipakai untuk kasus tertentu (mis. kanker, jantung intervensi, cuci darah) dengan diagnosa &amp;
              prosedur tambahan, dan berlaku sampai tanggal akhirnya.
            </span>
          </p>

          {!memuat && list.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-4">
              <KolomSaring id={`${id}-q`} value={q} onChange={setQ} label="Saring nama, kartu, nomor, atau diagnosa" placeholder="Saring nama, kartu, nomor, atau diagnosa" />
              <ul aria-label="Ringkasan periode" className="flex flex-wrap gap-1.5">
                <li>
                  <Badge variant="secondary" className="text-[11px] tabular-nums">
                    {list.length} rujukan
                  </Badge>
                </li>
                <li>
                  <BadgeNada tone={aktif > 0 ? "emerald" : "slate"} className="tabular-nums">
                    {aktif} masih berlaku
                  </BadgeNada>
                </li>
              </ul>
            </div>
          )}

          <div className="px-2">
            {memuat ? (
              <div className="flex flex-col gap-1.5 px-1" aria-hidden="true">
                {[0, 1, 2].map((i) => (
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
                    <BookMarked className="size-5" aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm font-semibold tracking-normal">Belum ada rujukan khusus</EmptyTitle>
                  <EmptyDescription className="text-xs">Tidak ada rujukan khusus yang terbit pada {labelPeriode(periode)}</EmptyDescription>
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
                <ul aria-label={`Rujukan khusus ${labelPeriode(periode)}`} className="flex flex-col gap-0.5">
                  {tampil.map((r, i) => (
                    <Baris key={r.idrujukan} r={r} index={i} dihapus={terhapus.has(r.idrujukan)} onHapus={() => setTarget(r)} />
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
            {memuat ? "" : hasil && !hasil.ok ? "Daftar gagal dimuat" : `${list.length} rujukan khusus pada ${labelPeriode(periode)}`}
          </p>
        </section>
      </Card>

      <HapusRujukanKhususDialog
        target={target}
        onClose={() => setTarget(null)}
        onDeleted={(idr) => setTerhapus((s) => new Set(s).add(idr))}
        fokusSesudah={() => judulRef.current?.focus()}
      />
    </div>
  );
}
