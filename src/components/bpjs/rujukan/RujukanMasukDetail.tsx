"use client";

// Detail satu rujukan masuk: nomor (bisa disalin) + status masa berlaku, rute perujuk → RS
// tujuan, bilah masa berlaku (<progress>), poli & diagnosa, PEMAKAIAN UNTUK SEP (V-Claim
// Jumlah SEP per Rujukan — dulu tak ditampilkan; status "Used/Aktif" di mock bukan data V-Claim),
// keluhan/catatan perujuk, dan peserta. Status memuat jumlah SEP diturunkan dari kunci data.
// Komponen shadcn: Card · Badge · Item · Skeleton.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, CircleAlert, FileCheck2, FilePlus2, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Item, ItemContent } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { fmtTglPendek } from "@/components/bpjs/shared/tanggal";
import { cn } from "@/lib/ui/utils";
import { jumlahSepPerRujukan } from "@/lib/bpjs/vClaimRujukan";
import type { BPJSError, RujukanRecord } from "@/lib/bpjs/bpjsShared";
import { BadgeNada, GalatRujukan, KARTU, Meter } from "./rujukanUi";
import { GALAT_KONEKSI, jenisPelayanan, statusBerlaku } from "./rujukanShared";

type Pemakaian = { kunci: string; ok: true; jumlah: number } | { kunci: string; ok: false; error: BPJSError };

function inisial(nama: string): string {
  return nama
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

function Faskes({ label, nama, kode, tujuan = false }: { label: string; nama: string; kode: string; tujuan?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-xl px-3 py-2.5", tujuan ? "bg-teal-50 text-teal-950" : "bg-slate-50")}>
      <p className={cn("text-[11px]", tujuan ? "text-teal-700" : "text-muted-foreground")}>{label}</p>
      <p className="truncate text-xs font-semibold">{nama}</p>
      <p className={cn("text-[11px] tabular-nums", tujuan ? "text-teal-700" : "text-muted-foreground")}>{kode}</p>
    </div>
  );
}

function PemakaianSep({ rujukan, kedaluwarsa }: { rujukan: RujukanRecord; kedaluwarsa: boolean }) {
  const [ulang, setUlang] = useState(0);
  const [hasil, setHasil] = useState<Pemakaian | null>(null);
  const kunci = `${rujukan.noRujukan}#${ulang}`;
  const memuat = hasil?.kunci !== kunci;

  useEffect(() => {
    let batal = false;
    jumlahSepPerRujukan(rujukan.asalRujukan === "FKTP" ? "1" : "2", rujukan.noRujukan)
      .then((res) => {
        if (batal) return;
        setHasil(res.ok ? { kunci, ok: true, jumlah: res.value.response?.jumlahSep ?? 0 } : { kunci, ok: false, error: res.error });
      })
      .catch(() => {
        if (!batal) setHasil({ kunci, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kunci, rujukan.asalRujukan, rujukan.noRujukan]);

  if (memuat) return <Skeleton className="h-14 rounded-xl" aria-hidden="true" />;
  if (hasil && !hasil.ok) return <GalatRujukan error={hasil.error} onUlang={() => setUlang((n) => n + 1)} />;
  const jumlah = hasil?.ok ? hasil.jumlah : 0;

  const isi = kedaluwarsa
    ? {
        box: "bg-rose-50 text-rose-950",
        Ikon: CircleAlert,
        judul: "Rujukan sudah tidak berlaku",
        teks: "Pasien perlu rujukan baru dari faskes perujuk sebelum SEP diterbitkan.",
      }
    : jumlah === 0
      ? {
          box: "bg-emerald-50 text-emerald-950",
          Ikon: FilePlus2,
          judul: "Belum pernah dipakai untuk SEP",
          teks: "Bisa dipakai untuk kunjungan pertama pasien di poli tujuan.",
        }
      : {
          box: "bg-sky-50 text-sky-950",
          Ikon: FileCheck2,
          judul: `Sudah dipakai untuk ${jumlah} SEP`,
          teks: "Kunjungan lanjutan biasanya memakai surat kontrol (Rencana Kontrol), bukan rujukan ini lagi.",
        };

  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl p-3", isi.box)}>
      <isi.Ikon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 text-xs/relaxed">
        <p className="font-semibold">{isi.judul}</p>
        <p className="opacity-90">{isi.teks}</p>
        {kedaluwarsa && jumlah > 0 && <p className="mt-0.5 text-[11px] opacity-75 tabular-nums">Tercatat {jumlah} SEP selama masa berlaku.</p>}
      </div>
    </div>
  );
}

export default function RujukanMasukDetail({ rujukan }: { rujukan: RujukanRecord }) {
  const berlaku = statusBerlaku(rujukan.masaBerlaku.from, rujukan.masaBerlaku.to);
  const jp = jenisPelayanan(rujukan.jnsPelayanan);
  const p = rujukan.peserta;
  const aktif = p.statusPeserta.kode === "0";

  return (
    <motion.div
      key={rujukan.noRujukan}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={cn(KARTU, "gap-4 p-4")}>
        {/* Kepala */}
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Rujukan {rujukan.asalRujukan === "FKTP" ? "dari FKTP" : "antar rumah sakit (FKRTL)"}</p>
            <div className="flex items-center gap-1">
              <h3 className="truncate text-sm font-semibold tracking-wide tabular-nums">{rujukan.noRujukan}</h3>
              <CopyButton value={rujukan.noRujukan} label={`nomor rujukan ${rujukan.noRujukan}`} />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <BadgeNada tone={berlaku.tone} titik>
              {berlaku.label}
            </BadgeNada>
            <BadgeNada tone={jp.tone}>{jp.label}</BadgeNada>
          </div>
        </div>

        {/* Rute */}
        <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <Faskes label="Perujuk" nama={rujukan.ppkAsal.nama} kode={rujukan.ppkAsal.kode} />
          <span className="flex justify-center text-teal-600" aria-hidden="true">
            <ArrowRight className="hidden size-4 sm:block" />
            <ArrowDown className="size-4 sm:hidden" />
          </span>
          <Faskes label="Dirujuk ke" nama={rujukan.ppkRujukan.nama} kode={rujukan.ppkRujukan.kode} tujuan />
        </div>

        {/* Masa berlaku */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Masa berlaku</span>
            <span className="tabular-nums">
              {fmtTglPendek(rujukan.masaBerlaku.from)} <span aria-hidden="true">→</span>
              <span className="sr-only">sampai</span> {fmtTglPendek(rujukan.masaBerlaku.to)}
            </span>
          </div>
          {berlaku.persen !== null && (
            <Meter value={berlaku.persen} max={100} tone={berlaku.tone} label={`Masa berlaku terpakai ${berlaku.persen} persen`} />
          )}
          <p className={cn("text-[11px] tabular-nums", berlaku.tone === "rose" ? "text-rose-700" : berlaku.tone === "amber" ? "text-amber-800" : "text-muted-foreground")}>
            {berlaku.detail}
          </p>
        </div>

        {/* Poli & diagnosa */}
        <dl className="grid gap-x-4 gap-y-3 text-xs sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">Poli tujuan</dt>
            <dd className="font-medium">
              {rujukan.poli.nama} <span className="font-normal text-muted-foreground tabular-nums">· {rujukan.poli.kode}</span>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">Diagnosa</dt>
            <dd className="font-medium">
              <span className="tabular-nums">{rujukan.diagnosa.kode}</span> <span className="font-normal">· {rujukan.diagnosa.nama}</span>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Kunjungan di perujuk</dt>
            <dd className="font-medium tabular-nums">{fmtTglPendek(rujukan.tglKunjungan)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Tanggal rujukan</dt>
            <dd className="font-medium tabular-nums">{fmtTglPendek(rujukan.tglRujukan)}</dd>
          </div>
        </dl>

        {/* Pemakaian untuk SEP */}
        <PemakaianSep rujukan={rujukan} kedaluwarsa={berlaku.tone === "rose"} />

        {/* Keluhan & catatan perujuk */}
        {(rujukan.keluhan || rujukan.catatan) && (
          <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 text-xs/relaxed">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Stethoscope className="size-3.5" aria-hidden="true" />
              Dari perujuk
            </p>
            {rujukan.keluhan && (
              <p>
                <span className="font-medium">Keluhan:</span> {rujukan.keluhan}
              </p>
            )}
            {rujukan.catatan && (
              <p>
                <span className="font-medium">Catatan:</span> {rujukan.catatan}
              </p>
            )}
          </div>
        )}

        {/* Peserta */}
        <Item variant="muted" size="sm" className="flex-nowrap gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 shadow-xs"
          >
            {inisial(p.nama)}
          </span>
          <ItemContent className="min-w-0 gap-0.5">
            <p className="truncate text-xs font-semibold">{p.nama}</p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              Kartu {p.noKartu} · {p.jenisPeserta.keterangan}
            </p>
          </ItemContent>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            <BadgeNada tone={aktif ? "emerald" : "rose"} titik>
              {aktif ? "Aktif" : p.statusPeserta.keterangan}
            </BadgeNada>
            <BadgeNada tone="slate" className="hidden sm:inline-flex">
              {p.hakKelas.keterangan}
            </BadgeNada>
          </div>
        </Item>
      </Card>
    </motion.div>
  );
}
