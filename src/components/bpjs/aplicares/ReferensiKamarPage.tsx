"use client";

// BP7.1 Referensi Kamar (Aplicares GET /ref/kelas): kode kelas kamar resmi BPJS, dasar pemetaan
// kelas RS (Map kelas) dan laporan ketersediaan tempat tidur. Dulu tabel statis + kartu "status
// cache" yang tak pernah benar-benar menyimpan apa pun. Kini referensi DISIMPAN 24 jam di cache
// referensi BPJS (lib/bpjs/referenceCache, ikut tampil di Beranda); "Perbarui" mengambil ulang
// dari Aplicares. Tiap kelas menampilkan PEMAKAIANNYA di RS (kelas RS yang dipetakan + ruangan
// Aplicares dengan keterisian tempat tidur) → klik → detail di Sheet. Ruangan/pemetaan yang
// memakai kode di luar referensi ditandai. Saring per golongan (hak kelas JKN · naik kelas ·
// tanpa kelas) dan unduh CSV. Status memuat diturunkan dari kunci muat; saat diperbarui data
// lama tetap tampil (redup + aria-busy) sampai data baru datang.
// Komponen shadcn: Card · Item · Badge · Button · Skeleton · Empty · Alert · Sheet.

import { useEffect, useId, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import { AlertTriangle, BedDouble, Layers, RotateCw } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Item } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import type { BadgeTone } from "@/components/bpjs/shared/badge";
import { unduhCsv } from "@/components/bpjs/shared/csv";
import { KepalaKartu, KerangkaDaftar, KosongData, TombolUnduh, UbinAngka, useStatusAksi } from "@/components/bpjs/shared/daftarUi";
import { fmtWaktu } from "@/components/bpjs/shared/tanggal";
import { BadgeNada, GalatVClaim, KARTU, Meter, SegmenFilter, type OpsiSegmen } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import { getMapKelas, getRefKelas, listKamar } from "@/lib/bpjs/aplicaresAdapter";
import type { RefKelasAplicaresItem } from "@/lib/bpjs/bpjsContracts";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import { getCached, getCacheStatus, invalidate, setCached } from "@/lib/bpjs/referenceCache";
import KelasSheet, { type BarisKelas } from "./KelasSheet";
import {
  GOLONGAN_KELAS,
  PEMAKAIAN_KOSONG,
  URUTAN_GOLONGAN,
  golonganKelas,
  kelasLokalLabel,
  nadaKeterisian,
  namaKelasTampil,
  pemakaianPerKelas,
  type GolonganKelas,
  type PemakaianKelas,
} from "./aplicaresShared";

type Pakai = Map<string, PemakaianKelas>;
type Muatan = { ok: true; kelas: RefKelasAplicaresItem[]; diambil: string | null; pakai: Pakai | null } | { ok: false; error: BPJSError };
type Hasil = Muatan & { kunci: number };
type Saring = "semua" | GolonganKelas;

const CACHE = "kelas-aplicares";
const GALAT_SAMBUNGAN: BPJSError = { type: "NetworkError", message: "Koneksi ke Aplicares gagal", retryable: true };

const KOTAK_KODE: Partial<Record<BadgeTone, string>> = {
  emerald: "bg-emerald-50 text-emerald-800",
  indigo: "bg-indigo-50 text-indigo-800",
};

/** Referensi kelas: dari cache 24 jam bila ada (kecuali dipaksa), selain itu dari Aplicares. */
async function muatKelas(paksa: boolean): Promise<{ ok: true; list: RefKelasAplicaresItem[] } | { ok: false; error: BPJSError }> {
  if (paksa) invalidate(CACHE);
  const simpan = getCached<RefKelasAplicaresItem[]>(CACHE, "all");
  if (simpan) return { ok: true, list: simpan };
  const res = await getRefKelas();
  if (!res.ok) return { ok: false, error: res.error };
  const list = res.value.response ?? [];
  if (list.length > 0) setCached(CACHE, "all", list);
  return { ok: true, list };
}

/** Ruangan Aplicares + pemetaan kelas RS; null bila salah satu gagal (referensi tetap tampil). */
async function muatPemakaian(): Promise<Pakai | null> {
  const [kamar, peta] = await Promise.all([listKamar(), getMapKelas()]);
  if (!kamar.ok || !peta.ok) return null;
  return pemakaianPerKelas(kamar.value.response ?? [], peta.value.response ?? []);
}

function Baris({ k, index, onBuka }: { k: BarisKelas; index: number; onBuka: () => void }) {
  const g = GOLONGAN_KELAS[golonganKelas(k.kodekelas)];
  const p = k.pakai;
  const nama = namaKelasTampil(k.kodekelas, k.namakelas);
  return (
    <motion.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(index, 8) * 0.025 }}>
      <Item asChild size="sm" className="relative w-full flex-nowrap items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 sm:items-center">
        <button type="button" onClick={onBuka} aria-haspopup="dialog">
          <span
            aria-hidden="true"
            className={cn(
              "flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg px-1.5 text-xs font-semibold tabular-nums",
              KOTAK_KODE[g.tone] ?? "bg-slate-100 text-slate-700",
            )}
          >
            {k.kodekelas}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="truncate font-semibold">{nama}</span>
              <span className="sr-only">kode {k.kodekelas},</span>
              <BadgeNada tone={g.tone} titik>
                {g.label}
              </BadgeNada>
            </span>
            <span className="line-clamp-1 text-[11px] text-muted-foreground">
              {p === null
                ? "Pemakaian di RS belum bisa ditampilkan"
                : p.lokal.length > 0
                  ? `Kelas RS: ${p.lokal.map((m) => kelasLokalLabel(m.kdKelasLokal)).join(", ")}`
                  : "Belum dipetakan ke kelas RS"}
            </span>
          </span>
          {p && p.ruang.length > 0 ? (
            <span className="flex w-28 shrink-0 flex-col items-end gap-1 text-right tabular-nums sm:w-44">
              <span className="text-xs font-semibold text-emerald-800">{p.tersedia} tersedia</span>
              <Meter
                value={Math.min(p.terisi, p.kapasitas)}
                max={Math.max(p.kapasitas, 1)}
                tone={nadaKeterisian(p.terisi, p.kapasitas)}
                label={`Keterisian tempat tidur kelas ${k.kodekelas}`}
              />
              <span className="text-[11px] text-muted-foreground">
                {p.ruang.length} ruangan · {p.terisi}/{p.kapasitas} terisi
              </span>
            </span>
          ) : p ? (
            <span className="shrink-0 self-center text-[11px] text-muted-foreground">Belum ada ruangan</span>
          ) : null}
        </button>
      </Item>
    </motion.li>
  );
}

function KerangkaRingkasan() {
  return (
    <div className="grid grid-cols-2 gap-2 px-4 lg:grid-cols-4" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-17 rounded-xl" />
      ))}
    </div>
  );
}

export default function ReferensiKamarPage() {
  const id = useId();
  const [muat, setMuat] = useState({ n: 0, paksa: false });
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [saring, setSaring] = useState<Saring>("semua");
  const [buka, setBuka] = useState<BarisKelas | null>(null);
  const aksi = useStatusAksi();
  const { umumkan } = aksi;
  const memuat = hasil?.kunci !== muat.n;

  useEffect(() => {
    let batal = false;
    Promise.all([muatKelas(muat.paksa), muatPemakaian().catch(() => null)])
      .then(([kelas, pakai]) => {
        if (batal) return;
        if (!kelas.ok) {
          setHasil({ kunci: muat.n, ok: false, error: kelas.error });
          return;
        }
        setHasil({ kunci: muat.n, ok: true, kelas: kelas.list, pakai, diambil: getCacheStatus(CACHE).lastSyncISO ?? null });
        if (muat.paksa) umumkan(`Referensi kelas diperbarui, ${kelas.list.length} kelas`);
      })
      .catch(() => {
        if (!batal) setHasil({ kunci: muat.n, ok: false, error: GALAT_SAMBUNGAN });
      });
    return () => {
      batal = true;
    };
  }, [muat, umumkan]);

  const muatUlang = (paksa: boolean) => {
    if (!memuat) setMuat((m) => ({ n: m.n + 1, paksa }));
  };

  // Data terakhir yang berhasil tetap tampil selama memuat ulang.
  const data = hasil?.ok ? hasil : null;
  const kelas = data?.kelas ?? [];
  const pakai = data?.pakai ?? null;
  const baris: BarisKelas[] = kelas.map((r) => ({ ...r, pakai: pakai ? (pakai.get(r.kodekelas) ?? PEMAKAIAN_KOSONG) : null }));

  const perGolongan = Object.groupBy(baris, (b) => golonganKelas(b.kodekelas));
  const opsi: OpsiSegmen<Saring>[] = [
    { value: "semua", label: "Semua", jumlah: baris.length },
    ...URUTAN_GOLONGAN.filter((g) => (perGolongan[g]?.length ?? 0) > 0).map((g) => ({
      value: g,
      label: GOLONGAN_KELAS[g].label,
      jumlah: perGolongan[g]?.length ?? 0,
    })),
  ];
  // Opsi tanpa isi tidak ditampilkan → saringan yang isinya hilang sesudah diperbarui kembali ke "Semua".
  const aktif: Saring = opsi.some((o) => o.value === saring) ? saring : "semua";
  const tampil = aktif === "semua" ? baris : (perGolongan[aktif] ?? []);

  // Ringkasan pemakaian (hanya kode yang ada di referensi).
  const dipakai = baris.filter((b) => (b.pakai?.ruang.length ?? 0) > 0);
  const jumlahRuang = dipakai.reduce((n, b) => n + (b.pakai?.ruang.length ?? 0), 0);
  const kapasitas = dipakai.reduce((n, b) => n + (b.pakai?.kapasitas ?? 0), 0);
  const terisi = dipakai.reduce((n, b) => n + (b.pakai?.terisi ?? 0), 0);
  const tersedia = dipakai.reduce((n, b) => n + (b.pakai?.tersedia ?? 0), 0);
  const pctTerisi = kapasitas > 0 ? Math.round((terisi / kapasitas) * 100) : 0;

  // Ruangan / pemetaan RS yang memakai kode di luar referensi Aplicares.
  const kodeRef = new Set(kelas.map((r) => r.kodekelas));
  const asing = pakai ? [...pakai].filter(([kode]) => !kodeRef.has(kode)) : [];

  function unduh() {
    unduhCsv(
      [
        ["Kode kelas", "Nama kelas", "Golongan", "Kelas RS", "Jumlah ruangan", "Kapasitas", "Terisi", "Tersedia"],
        ...tampil.map((b) => [
          b.kodekelas,
          namaKelasTampil(b.kodekelas, b.namakelas),
          GOLONGAN_KELAS[golonganKelas(b.kodekelas)].label,
          b.pakai?.lokal.map((m) => kelasLokalLabel(m.kdKelasLokal)).join("; ") ?? "",
          b.pakai?.ruang.length ?? "",
          b.pakai?.kapasitas ?? "",
          b.pakai?.terisi ?? "",
          b.pakai?.tersedia ?? "",
        ]),
      ],
      "referensi-kelas-kamar-aplicares.csv",
    );
    umumkan(`CSV ${tampil.length} kelas kamar diunduh`);
  }

  return (
    <MotionConfig reducedMotion="user">
      <div data-accent="emerald" className="flex flex-col gap-4 p-4 text-foreground sm:p-5">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <BedDouble className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">Referensi kamar</h1>
            <p className="text-xs text-muted-foreground">Kode kelas kamar resmi BPJS untuk pemetaan kelas RS dan laporan ketersediaan tempat tidur</p>
          </div>
          <Badge variant="secondary" className="bg-white text-[11px] text-muted-foreground shadow-xs">
            Aplicares
          </Badge>
        </header>

        <Card className={KARTU}>
          <section aria-labelledby={`${id}-judul`} aria-busy={memuat} className="flex flex-col gap-3 py-4">
            <KepalaKartu judulId={`${id}-judul`} judul="Kelas kamar BPJS" deskripsi="Pilih kelas untuk melihat kelas RS dan ruangan yang memakainya">
              {data?.diambil && (
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  Diambil <time dateTime={data.diambil}>{fmtWaktu(data.diambil)}</time>
                </span>
              )}
              <Button
                variant="secondary"
                size="xs"
                onClick={() => muatUlang(true)}
                aria-disabled={memuat}
                className="aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
              >
                <RotateCw aria-hidden="true" className={cn(memuat && "motion-safe:animate-spin")} />
                {memuat ? "Memuat…" : "Perbarui"}
                <span className="sr-only"> referensi dari Aplicares</span>
              </Button>
            </KepalaKartu>

            {!data && memuat ? (
              <>
                <KerangkaRingkasan />
                <div className="px-2">
                  <KerangkaDaftar baris={6} tinggi="h-15" />
                </div>
              </>
            ) : hasil && !hasil.ok && !memuat ? (
              <div className="px-4">
                <GalatVClaim error={hasil.error} objek="Referensi kelas" layanan="Aplicares" onUlang={() => muatUlang(false)} />
              </div>
            ) : kelas.length === 0 ? (
              <KosongData ikon={BedDouble} judul="Referensi kelas kosong" deskripsi="Aplicares tidak mengirim kode kelas kamar. Coba perbarui beberapa saat lagi.">
                <Button variant="secondary" size="xs" onClick={() => muatUlang(true)}>
                  <RotateCw aria-hidden="true" />
                  Perbarui
                </Button>
              </KosongData>
            ) : (
              <div className={cn("flex flex-col gap-3 transition-opacity", memuat && "opacity-60")}>
                {pakai ? (
                  <dl className="grid grid-cols-2 gap-2 px-4 lg:grid-cols-4">
                    <UbinAngka label="Kelas BPJS" nilai={kelas.length} ket="kode dari referensi Aplicares" />
                    <UbinAngka label="Dipakai RS" nilai={`${dipakai.length} kelas`} ket={`${jumlahRuang} ruangan terlapor`} />
                    <UbinAngka label="Tempat tidur" nilai={kapasitas} ket={`${terisi} terisi (${pctTerisi}%)`}>
                      <Meter value={Math.min(terisi, kapasitas)} max={Math.max(kapasitas, 1)} tone={nadaKeterisian(terisi, kapasitas)} label={`Keterisian tempat tidur ${pctTerisi} persen`} />
                    </UbinAngka>
                    <UbinAngka label="Tersedia" nilai={tersedia} nada="emerald" ket="siap untuk pasien baru" />
                  </dl>
                ) : (
                  <Alert role="note" className="mx-4 w-auto rounded-xl border-0 bg-amber-50 p-3 text-amber-900 [&>svg]:size-4">
                    <AlertTriangle aria-hidden="true" />
                    <AlertTitle className="text-xs font-semibold">Pemakaian di RS belum bisa ditampilkan</AlertTitle>
                    <AlertDescription className="text-xs/relaxed text-current">
                      <p>Data ruangan Aplicares dan pemetaan kelas RS gagal dimuat. Referensi kelas tetap bisa dipakai.</p>
                      <Button type="button" size="xs" variant="secondary" onClick={() => muatUlang(false)} className="mt-1 bg-white">
                        <RotateCw aria-hidden="true" />
                        Coba lagi
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {asing.length > 0 && (
                  <Alert role="note" className="mx-4 w-auto rounded-xl border-0 bg-amber-50 p-3 text-amber-900 [&>svg]:size-4">
                    <AlertTriangle aria-hidden="true" />
                    <AlertTitle className="text-xs font-semibold">Ada kode kelas di luar referensi</AlertTitle>
                    <AlertDescription className="text-xs/relaxed text-current">
                      <p>Kode ini tidak ada di referensi Aplicares sehingga laporan ketersediaannya bisa ditolak BPJS. Perbaiki pemetaannya di Map kelas.</p>
                      <ul className="mt-1 flex flex-col gap-0.5 tabular-nums">
                        {asing.map(([kode, p]) => (
                          <li key={kode}>
                            <span className="font-semibold">{kode}</span> · {p.ruang.length} ruangan · {p.lokal.length} pemetaan kelas RS
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 px-4">
                  <SegmenFilter label="Saring golongan kelas" opsi={opsi} value={aktif} onChange={setSaring} />
                  <TombolUnduh onClick={unduh} jumlah={tampil.length} />
                </div>

                <div className="px-2">
                  <ul aria-label="Kelas kamar BPJS" className="flex flex-col gap-0.5">
                    {tampil.map((b, i) => (
                      <Baris key={b.kodekelas} k={b} index={i} onBuka={() => setBuka(b)} />
                    ))}
                  </ul>
                </div>

                <div className="mx-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5">
                  <p className="min-w-0 flex-1 basis-60 text-[11px]/relaxed text-muted-foreground">
                    Kode ini menjadi pilihan kelas BPJS saat memetakan kelas RS dan saat melaporkan ketersediaan tempat tidur ke Aplicares.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Button asChild variant="ghost" size="xs" className="text-emerald-700 hover:text-emerald-800">
                      <Link href="/ehis-bpjs/aplicares/map-kelas">
                        <Layers aria-hidden="true" />
                        Map kelas
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="xs" className="text-emerald-700 hover:text-emerald-800">
                      <Link href="/ehis-bpjs/aplicares/ketersediaan">
                        <BedDouble aria-hidden="true" />
                        Ketersediaan
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <p role="status" className="sr-only">
              {memuat ? "" : hasil && !hasil.ok ? "Referensi kelas gagal dimuat" : `${tampil.length} kelas kamar`}
            </p>
            <p role="status" className="sr-only">
              {aksi.teks}
            </p>
          </section>
        </Card>

        <KelasSheet kelas={buka} onClose={() => setBuka(null)} />
      </div>
    </MotionConfig>
  );
}
