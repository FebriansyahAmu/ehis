"use client";

// BP8.1 Audit Trail BPJS: jejak setiap panggilan EHIS ke web service BPJS (V-Claim + Aplicares),
// dari `auditStore` (useSyncExternalStore — entri baru muncul langsung). Dulu: saringan tanggal
// TERTULIS di kode (26–30 Mei 2026) sehingga panggilan hari ini tak pernah tampil, tanggal dari
// `timestamp.slice(0, 10)` (UTC), tabel 10 kolom, tombol "Retry Request" yang hanya memunculkan
// toast, "stack trace" karangan, CSV tanpa pengaman. Kini:
// • periode cepat (Semua · Hari ini · 7 · 30 hari) dengan tanggal LOKAL;
// • ubin hasil (semua · berhasil · gagal) yang sekaligus menjadi saringan + ubin durasi;
//   endpoint paling sering gagal (sekali klik untuk menyaring);
// • saring layanan & metode (opsi kosong disembunyikan) + teks (endpoint, aktor, kode, key, ID);
// • daftar per HARI (judul lengket) dengan "Tampilkan lagi"; klik → Sheet detail (rantai percobaan
//   dengan idempotency key yang sama, sidik hash);
// • unduh CSV (aman formula injection) + cetak laporan A4 (template KOP RS) dari hasil saringan;
// • saringan awal bisa datang dari URL (`?periode=&hasil=&layanan=&q=`, tautan Beranda BPJS).
// Endpoint ber-nomor identitas disamarkan di sumbernya (`samarkanEndpoint`, UU PDP).
// Komponen shadcn: Card · Item · Badge · Button · Input · Skeleton · Empty · Sheet.

import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { MotionConfig } from "framer-motion";
import { ChevronDown, ListFilter, Printer, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSkeletonDelay } from "@/components/master/shared";
import { DOT, type BadgeTone } from "@/components/bpjs/shared/badge";
import { unduhCsv } from "@/components/bpjs/shared/csv";
import { KepalaKartu, KerangkaDaftar, KosongData, SaringKosong, TombolUnduh, UbinAngka, useStatusAksi } from "@/components/bpjs/shared/daftarUi";
import { KARTU, KolomSaring, SegmenFilter, type OpsiSegmen } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import { getAuditEntries, subscribeAudit } from "@/lib/bpjs/auditStore";
import type { BPJSAuditEntry, BPJSAuditMethod } from "@/lib/bpjs/bpjsShared";
import { seedAuditTrailMock } from "@/lib/bpjs/mock/auditTrailMock";
import AuditSheet from "./AuditSheet";
import BarisAudit from "./BarisAudit";
import CetakLaporanAudit from "./CetakLaporanAudit";
import {
  BATAS_LAMBAT_MS,
  OPSI_PERIODE,
  URUTAN_METODE,
  artiKode,
  dalamPeriode,
  fmtDurasi,
  hariLokal,
  jamLokal,
  judulHari,
  layananDari,
  nadaDurasi,
  rentangEntri,
  type Layanan,
  type Periode,
  type SaringAwal,
  type SaringHasil,
} from "./auditShared";

type Cetak = { entries: BPJSAuditEntry[]; periode: { from: string; to: string }; keterangan?: string };

const KOSONG: readonly BPJSAuditEntry[] = [];
const HALAMAN = 30;
/** Kapasitas ring buffer `auditStore` (entri tertua dibuang). */
const KAPASITAS_LOG = 200;

function UbinHasil({ label, tone, n, ket, aktif, onClick }: { label: string; tone: BadgeTone; n: number; ket: string; aktif: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={aktif}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col items-start gap-0.5 rounded-xl bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100",
        "aria-pressed:bg-white aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-emerald-600 aria-pressed:ring-inset",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 forced-colors:aria-pressed:underline",
      )}
    >
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOT[tone])} />
        {label}
      </span>
      <span className="text-base font-semibold tabular-nums">{n}</span>
      <span className="max-w-full truncate text-[11px] text-muted-foreground tabular-nums">{ket}</span>
    </button>
  );
}

function KerangkaHalaman() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="grid grid-cols-2 gap-2 px-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-17 rounded-xl" />
        ))}
      </div>
      <div className="px-2">
        <KerangkaDaftar baris={6} tinggi="h-12" />
      </div>
    </div>
  );
}

export default function AuditTrailPage({ awal = {} }: { awal?: SaringAwal }) {
  const id = useId();
  const siap = useSkeletonDelay(400);
  const log = useSyncExternalStore(subscribeAudit, getAuditEntries, () => KOSONG);
  // Saringan awal dari URL (tautan Beranda BPJS); route me-remount halaman bila parameternya berubah.
  const [periode, setPeriode] = useState<Periode>(awal.periode ?? "semua");
  const [hasil, setHasil] = useState<SaringHasil>(awal.hasil ?? "semua");
  const [layanan, setLayanan] = useState<"semua" | Layanan>(awal.layanan ?? "semua");
  const [metode, setMetode] = useState<"semua" | BPJSAuditMethod>("semua");
  const [q, setQ] = useState(awal.q ?? "");
  const [batas, setBatas] = useState(HALAMAN);
  const [buka, setBuka] = useState<BPJSAuditEntry | null>(null);
  const [cetak, setCetak] = useState<Cetak | null>(null);
  const aksi = useStatusAksi();
  const { umumkan } = aksi;
  const selesaiCetak = useCallback(() => setCetak(null), []);

  // Seed data uji sekali (idempoten) — entri nyata dari adapter tetap tercatat di store yang sama.
  useEffect(() => {
    seedAuditTrailMock();
  }, []);

  const kata = q.trim().toLowerCase();

  // "Tampilkan lagi" kembali ke halaman pertama setiap saringan berubah (adjust-on-render).
  const kunciSaring = [periode, hasil, layanan, metode, kata].join("|");
  const [kunciLama, setKunciLama] = useState(kunciSaring);
  if (kunciLama !== kunciSaring) {
    setKunciLama(kunciSaring);
    setBatas(HALAMAN);
  }

  // ── Penyaringan ────────────────────────────────────────

  const urut = log.toSorted((a, b) => b.timestamp.localeCompare(a.timestamp));
  const cocokKata = (e: BPJSAuditEntry) =>
    !kata || [e.endpoint, e.actor, e.actorRole, e.responseCode, e.id, e.idempotencyKey ?? "", e.errorType ?? ""].some((s) => s.toLowerCase().includes(kata));
  const dasar = urut.filter((e) => dalamPeriode(e, periode) && cocokKata(e));

  const opsiLayanan: OpsiSegmen<"semua" | Layanan>[] = [
    { value: "semua", label: "Semua layanan", jumlah: dasar.length },
    ...(["V-Claim", "Aplicares"] as const)
      .map((l) => ({ value: l, label: l, jumlah: dasar.filter((e) => layananDari(e.endpoint) === l).length }))
      .filter((o) => o.jumlah > 0),
  ];
  const layananAktif = opsiLayanan.some((o) => o.value === layanan) ? layanan : "semua";
  const diLayanan = layananAktif === "semua" ? dasar : dasar.filter((e) => layananDari(e.endpoint) === layananAktif);

  const opsiMetode: OpsiSegmen<"semua" | BPJSAuditMethod>[] = [
    { value: "semua", label: "Semua metode", jumlah: diLayanan.length },
    ...URUTAN_METODE.map((m) => ({ value: m, label: m, jumlah: diLayanan.filter((e) => e.method === m).length })).filter((o) => o.jumlah > 0),
  ];
  const metodeAktif = opsiMetode.some((o) => o.value === metode) ? metode : "semua";
  const tersaring = metodeAktif === "semua" ? diLayanan : diLayanan.filter((e) => e.method === metodeAktif);

  const nBerhasil = tersaring.filter((e) => e.success).length;
  const nGagal = tersaring.length - nBerhasil;
  const persen = (n: number) => (tersaring.length > 0 ? Math.round((n / tersaring.length) * 100) : 0);
  const rata = tersaring.length > 0 ? Math.round(tersaring.reduce((n, e) => n + e.durationMs, 0) / tersaring.length) : 0;
  const nLambat = tersaring.filter((e) => e.durationMs >= BATAS_LAMBAT_MS).length;
  const nHari = new Set(tersaring.map((e) => hariLokal(e.timestamp))).size;

  const tampil = hasil === "semua" ? tersaring : tersaring.filter((e) => (hasil === "ok" ? e.success : !e.success));
  const terlihat = tampil.slice(0, batas);
  const sisa = tampil.length - terlihat.length;
  const perHari = Map.groupBy(terlihat, (e) => hariLokal(e.timestamp));
  const jumlahPerHari = Object.groupBy(tampil, (e) => hariLokal(e.timestamp));

  // Endpoint paling sering gagal (dalam saringan, sebelum saring hasil).
  const gagalPer = Object.entries(Object.groupBy(tersaring.filter((e) => !e.success), (e) => e.endpoint))
    .map(([endpoint, list]) => ({ endpoint, n: list?.length ?? 0 }))
    .toSorted((a, b) => b.n - a.n);
  const teratas = gagalPer[0];

  // ── Aksi ───────────────────────────────────────────────

  function labelSaring(): string | undefined {
    const bagian = [
      periode !== "semua" ? OPSI_PERIODE.find((o) => o.value === periode)?.label : null,
      hasil === "ok" ? "Berhasil" : hasil === "gagal" ? "Gagal" : null,
      layananAktif !== "semua" ? layananAktif : null,
      metodeAktif !== "semua" ? metodeAktif : null,
      kata ? `cari “${q.trim()}”` : null,
    ].filter(Boolean);
    return bagian.length > 0 ? bagian.join(" · ") : undefined;
  }

  function hapusSaringan() {
    setPeriode("semua");
    setHasil("semua");
    setLayanan("semua");
    setMetode("semua");
    setQ("");
  }

  function saringEndpoint(endpoint: string) {
    setBuka(null);
    setHasil("semua");
    setQ(endpoint);
    umumkan(`Menampilkan panggilan ke ${endpoint}`);
  }

  function unduh() {
    unduhCsv(
      [
        ["Waktu", "Layanan", "Metode", "Endpoint", "Kode", "Arti kode", "Hasil", "Durasi (ms)", "Aktor", "Peran", "Idempotency key", "Jenis galat", "Percobaan ulang", "ID entri"],
        ...tampil.map((e) => [
          `${hariLokal(e.timestamp)} ${jamLokal(e.timestamp)}`,
          layananDari(e.endpoint),
          e.method,
          e.endpoint,
          e.responseCode,
          artiKode(e.responseCode),
          e.success ? "Berhasil" : "Gagal",
          e.durationMs,
          e.actor,
          e.actorRole,
          e.idempotencyKey ?? "",
          e.errorType ?? "",
          e.retryCount ?? "",
          e.id,
        ]),
      ],
      "audit-trail-bpjs.csv",
    );
    umumkan(`CSV ${tampil.length} panggilan diunduh`);
  }

  function mulaiCetak() {
    const rentang = rentangEntri(tampil);
    if (!rentang) return;
    setCetak({ entries: [...tampil], periode: rentang, keterangan: labelSaring() });
  }

  return (
    <MotionConfig reducedMotion="user">
      <div data-accent="emerald" className="flex flex-col gap-4 p-4 text-foreground sm:p-5">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <ScrollText className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">Audit trail</h1>
            <p className="text-xs text-muted-foreground">Jejak setiap panggilan EHIS ke web service BPJS (V-Claim dan Aplicares) untuk penelusuran dan kepatuhan UU PDP</p>
          </div>
          <Badge variant="secondary" className="bg-white text-[11px] text-muted-foreground shadow-xs">
            UU PDP 27/2022
          </Badge>
        </header>

        <Card className={KARTU}>
          <section aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 py-4">
            <KepalaKartu
              judulId={`${id}-judul`}
              judul="Log panggilan"
              deskripsi={`Diperbarui langsung setiap ada panggilan · ${log.length} dari maks ${KAPASITAS_LOG} panggilan terakhir tersimpan di sesi ini`}
            >
              <SegmenFilter label="Periode" opsi={OPSI_PERIODE} value={periode} onChange={setPeriode} />
            </KepalaKartu>

            {!siap ? (
              <KerangkaHalaman />
            ) : log.length === 0 ? (
              <KosongData ikon={ScrollText} judul="Belum ada panggilan BPJS" deskripsi="Setiap panggilan ke V-Claim dan Aplicares akan tercatat di sini." />
            ) : (
              <>
                <div className="grid gap-2 px-4 lg:grid-cols-[3fr_1fr]">
                  <div role="group" aria-label="Saring hasil panggilan" className="grid grid-cols-3 gap-2">
                    <UbinHasil label="Semua" tone="slate" n={tersaring.length} ket={`dalam ${nHari} hari`} aktif={hasil === "semua"} onClick={() => setHasil("semua")} />
                    <UbinHasil label="Berhasil" tone="emerald" n={nBerhasil} ket={`${persen(nBerhasil)}%`} aktif={hasil === "ok"} onClick={() => setHasil("ok")} />
                    <UbinHasil label="Gagal" tone="rose" n={nGagal} ket={`${persen(nGagal)}%`} aktif={hasil === "gagal"} onClick={() => setHasil("gagal")} />
                  </div>
                  <dl className="grid">
                    <UbinAngka
                      label="Rata-rata durasi"
                      nilai={fmtDurasi(rata)}
                      nada={nadaDurasi(rata) === "rose" ? "rose" : nadaDurasi(rata) === "amber" ? "amber" : undefined}
                      ket={nLambat > 0 ? `${nLambat} lambat (≥ ${BATAS_LAMBAT_MS / 1000} dtk)` : "tidak ada yang lambat"}
                    />
                  </dl>
                </div>

                {teratas && (
                  <div className="mx-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-rose-50/70 px-3 py-2 text-xs text-rose-950">
                    <span className="text-[11px] font-medium text-rose-800">Paling sering gagal</span>
                    <span className="min-w-0 flex-1 truncate font-medium tabular-nums" title={teratas.endpoint}>
                      {teratas.endpoint}
                    </span>
                    <span className="text-[11px] text-rose-800 tabular-nums">{teratas.n}×</span>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        setQ(teratas.endpoint);
                        setHasil("gagal");
                      }}
                      className="text-rose-800 hover:bg-rose-100 hover:text-rose-900"
                    >
                      <ListFilter aria-hidden="true" />
                      Saring<span className="sr-only"> panggilan gagal ke {teratas.endpoint}</span>
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 px-4">
                  <SegmenFilter label="Saring layanan" opsi={opsiLayanan} value={layananAktif} onChange={setLayanan} />
                  <SegmenFilter label="Saring metode" opsi={opsiMetode} value={metodeAktif} onChange={setMetode} />
                </div>
                <div className="flex flex-wrap items-center gap-2 px-4">
                  <KolomSaring id={`${id}-q`} value={q} onChange={setQ} label="Saring endpoint, aktor, kode, idempotency key, atau ID" placeholder="Saring endpoint, aktor, kode, key" />
                  <TombolUnduh onClick={unduh} jumlah={tampil.length} />
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => {
                      if (tampil.length > 0) mulaiCetak();
                    }}
                    aria-disabled={tampil.length === 0}
                    className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                  >
                    <Printer aria-hidden="true" />
                    Cetak laporan
                  </Button>
                </div>

                <div className="px-2">
                  {tampil.length === 0 ? (
                    <SaringKosong pesan="Tidak ada panggilan dengan saringan ini" onReset={hapusSaringan} />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {[...perHari].map(([hari, list]) => {
                        const semuaHari = jumlahPerHari[hari] ?? [];
                        const gagalHari = semuaHari.filter((e) => !e.success).length;
                        return (
                          <section key={hari} aria-labelledby={`${id}-${hari}`} className="flex flex-col gap-0.5">
                            <h3
                              id={`${id}-${hari}`}
                              className="sticky top-0 z-10 flex flex-wrap items-baseline justify-between gap-x-3 bg-white/95 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
                            >
                              {judulHari(hari)}
                              <span className="text-[11px] font-normal text-muted-foreground tabular-nums">
                                {semuaHari.length} panggilan
                                {gagalHari > 0 && <span className="text-rose-700"> · {gagalHari} gagal</span>}
                              </span>
                            </h3>
                            <ul className="flex flex-col gap-0.5">
                              {list.map((e, i) => (
                                <BarisAudit key={e.id} e={e} index={i} onBuka={() => setBuka(e)} />
                              ))}
                            </ul>
                          </section>
                        );
                      })}
                      {sisa > 0 && (
                        <div className="flex justify-center pb-1">
                          <Button variant="ghost" size="xs" onClick={() => setBatas((b) => b + HALAMAN)} className="text-emerald-700">
                            <ChevronDown aria-hidden="true" />
                            Tampilkan {Math.min(HALAMAN, sisa)} lagi
                            <span className="font-normal text-muted-foreground tabular-nums">· sisa {sisa}</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <p role="status" className="sr-only">
              {siap ? `${tampil.length} panggilan` : ""}
            </p>
            <p role="status" className="sr-only">
              {aksi.teks}
            </p>
          </section>
        </Card>

        <AuditSheet entri={buka} semua={log} onClose={() => setBuka(null)} onSaringEndpoint={saringEndpoint} />
        {cetak && <CetakLaporanAudit entries={cetak.entries} periode={cetak.periode} keterangan={cetak.keterangan} onSelesai={selesaiCetak} />}
      </div>
    </MotionConfig>
  );
}
