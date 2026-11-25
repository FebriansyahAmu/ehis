"use client";

// BP7.3 Ketersediaan Kamar (Aplicares GET /bed/read + POST /bed/update): tempat tidur kosong per
// ruang rawat yang dilaporkan RS ke BPJS. Dulu tabel 8 kolom + banner "Tersinkronisasi" yang
// sebenarnya mengukur waktu MUAT HALAMAN, dan "Nonaktifkan maintenance" melaporkan tersedia =
// kapasitas penuh (pasien yang dirawat ikut dihitung kosong). Kini:
// • kesegaran dihitung per ruangan dari kapan laporannya terakhir DIKIRIM (≤ 15 menit = terkini),
//   teks relatif berdetak tiap 30 detik;
// • ringkasan (ruang, tempat tidur + bilah keterisian, tersedia, laporan terkini) + saring kelas
//   BPJS, status (perlu dikirim · penuh · ditutup), teks, unduh CSV;
// • "Kirim" per ruangan dan "Kirim semua" (berurutan, bilah progres + hasil diumumkan lewat live
//   region, yang gagal ditandai dan bisa dikirim ulang);
// • klik ruangan → Sheet: komposisi tempat tidur, form laporan (tersedia + rincian jenis kelamin),
//   tutup sementara / buka kembali (tersedia dipulihkan ke nilai sebelum ditutup).
// Mock tidak menyimpan perubahan → hasil kirim/tutup disimpan sebagai perubahan sesi di atas data.
// Komponen shadcn: Card · Item · Badge · Button · Input · Skeleton · Empty · Alert · Sheet · Dialog.

import { useEffect, useId, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import { AlertCircle, Bed, Check, RotateCw, Send, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Item, ItemActions } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { DOT, type BadgeTone } from "@/components/bpjs/shared/badge";
import { unduhCsv } from "@/components/bpjs/shared/csv";
import { KepalaKartu, KerangkaDaftar, KosongData, SaringKosong, TombolUnduh, UbinAngka, useStatusAksi } from "@/components/bpjs/shared/daftarUi";
import { fmtWaktu } from "@/components/bpjs/shared/tanggal";
import { BadgeNada, GalatVClaim, KARTU, KolomSaring, Meter, SegmenFilter, type OpsiSegmen } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import { listKamar, setMaintenance, updateKamar } from "@/lib/bpjs/aplicaresAdapter";
import type { AplicaresKamarRecord, BPJSError } from "@/lib/bpjs/bpjsShared";
import { GOLONGAN_KELAS, golonganKelas, kelasBPJSLabel, nadaKeterisian } from "./aplicaresShared";
import {
  BATAS_TERKINI_MENIT,
  LABEL_STATUS,
  kesegaran,
  nilaiSaatIni,
  perkiraanTersedia,
  statusRuang,
  tidakSiap,
  useSekarang,
  waktuRelatif,
  type BarisRuang,
  type NilaiLaporan,
} from "./ketersediaanShared";
import RuangSheet from "./RuangSheet";

type Hasil = { kunci: number; ok: true; list: AplicaresKamarRecord[] } | { kunci: number; ok: false; error: BPJSError };
type StatusKirim = "proses" | "ok" | "gagal";
type Massal = { total: number; selesai: number; gagal: number; jalan: boolean; waktu?: string };
type SaringStatus = "semua" | "perlu" | "penuh" | "tutup";

const GALAT_SAMBUNGAN: BPJSError = { type: "NetworkError", message: "Koneksi ke Aplicares gagal", retryable: true };
const URUTAN_KELAS = ["VVP", "VIP", "1", "2", "3", "NON"];

const KOTAK_KODE: Partial<Record<BadgeTone, string>> = {
  emerald: "bg-emerald-50 text-emerald-800",
  indigo: "bg-indigo-50 text-indigo-800",
};

function urutKelas(a: string, b: string): number {
  const ia = URUTAN_KELAS.indexOf(a);
  const ib = URUTAN_KELAS.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
}

function Baris({
  r,
  index,
  sekarang,
  kirim,
  onBuka,
  onKirim,
}: {
  r: BarisRuang;
  index: number;
  sekarang: number;
  kirim: StatusKirim | undefined;
  onBuka: () => void;
  onKirim: () => void;
}) {
  const g = GOLONGAN_KELAS[golonganKelas(r.kdKelas)];
  const st = statusRuang(r);
  const segar = kesegaran(r.lastSyncISO, sekarang);
  return (
    <motion.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(index, 8) * 0.025 }}>
      <Item size="sm" className="relative flex-nowrap items-center gap-1 rounded-xl p-0 transition-colors hover:bg-slate-50">
        <button
          type="button"
          onClick={onBuka}
          aria-haspopup="dialog"
          className="flex min-w-0 flex-1 items-start gap-3 rounded-xl px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:items-center"
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg px-1.5 text-xs font-semibold tabular-nums",
              KOTAK_KODE[g.tone] ?? "bg-slate-100 text-slate-700",
            )}
          >
            {r.kdKelas}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="truncate font-semibold">{r.namaRuang}</span>
              <span className="sr-only">{kelasBPJSLabel(r.kdKelas)},</span>
              {st !== "buka" && (
                <BadgeNada tone={LABEL_STATUS[st].tone} titik>
                  {LABEL_STATUS[st].label}
                </BadgeNada>
              )}
            </span>
            <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground tabular-nums">
              <span>{r.kodeRuang}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOT[segar.tone])} />
                {segar.terkini ? "" : <span className="sr-only">{segar.label}, </span>}
                dikirim {waktuRelatif(r.lastSyncISO, sekarang)}
              </span>
            </span>
          </span>
          <span className="flex w-24 shrink-0 flex-col items-end gap-1 text-right tabular-nums sm:w-40">
            <span className={cn("text-xs font-semibold", r.tersedia > 0 ? "text-emerald-800" : "text-muted-foreground")}>
              {st === "tutup" ? "Ditutup" : `${r.tersedia} tersedia`}
            </span>
            <Meter
              value={Math.min(r.terisi, r.kapasitas)}
              max={Math.max(r.kapasitas, 1)}
              tone={nadaKeterisian(r.terisi, r.kapasitas)}
              label={`Keterisian ${r.namaRuang}`}
            />
            <span className="text-[11px] text-muted-foreground">
              {r.terisi}/{r.kapasitas} terisi
            </span>
          </span>
        </button>
        <ItemActions className="shrink-0 pr-2">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onKirim}
            aria-disabled={kirim === "proses"}
            className={cn(
              "w-20 justify-start aria-disabled:cursor-wait",
              kirim === "gagal" ? "text-rose-700 hover:bg-rose-50 hover:text-rose-800" : "text-emerald-700 hover:text-emerald-800",
            )}
          >
            {kirim === "proses" ? (
              <Spinner className="size-3" aria-hidden="true" />
            ) : kirim === "ok" ? (
              <Check aria-hidden="true" />
            ) : kirim === "gagal" ? (
              <AlertCircle aria-hidden="true" />
            ) : (
              <Send aria-hidden="true" />
            )}
            {kirim === "proses" ? "Mengirim" : kirim === "gagal" ? "Ulangi" : "Kirim"}
            <span className="sr-only"> laporan {r.namaRuang} ke Aplicares</span>
          </Button>
        </ItemActions>
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

export default function KetersediaanKamarPage() {
  const id = useId();
  const sekarang = useSekarang();
  const [muat, setMuat] = useState(0);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  // Perubahan sesi per kode ruang (mock tidak menyimpan hasil kirim/tutup).
  const [ubahan, setUbahan] = useState<Record<string, Partial<BarisRuang>>>({});
  const [kirim, setKirim] = useState<Record<string, StatusKirim>>({});
  const [massal, setMassal] = useState<Massal | null>(null);
  const [kelas, setKelas] = useState("semua");
  const [status, setStatus] = useState<SaringStatus>("semua");
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState<{ kode: string; buka: boolean } | null>(null);
  const aksi = useStatusAksi();
  const { umumkan } = aksi;
  const memuat = hasil?.kunci !== muat;

  useEffect(() => {
    let batal = false;
    listKamar()
      .then((res) => {
        if (batal) return;
        setHasil(res.ok ? { kunci: muat, ok: true, list: res.value.response ?? [] } : { kunci: muat, ok: false, error: res.error });
      })
      .catch(() => {
        if (!batal) setHasil({ kunci: muat, ok: false, error: GALAT_SAMBUNGAN });
      });
    return () => {
      batal = true;
    };
  }, [muat]);

  const data = hasil?.ok ? hasil : null;
  const rows: BarisRuang[] = (data?.list ?? []).map((r) => ({ ...r, ...ubahan[r.kodeRuang] }));

  // ── Aksi ──────────────────────────────────────────────

  function simpanUbahan(kode: string, u: Partial<BarisRuang>) {
    setUbahan((s) => ({ ...s, [kode]: { ...s[kode], ...u } }));
  }

  async function kirimRuang(r: BarisRuang, nilai: NilaiLaporan = nilaiSaatIni(r)): Promise<BPJSError | null> {
    setKirim((s) => ({ ...s, [r.kodeRuang]: "proses" }));
    try {
      const res = await updateKamar({ kdKelas: r.kdKelas, kodeRuang: r.kodeRuang, namaRuang: r.namaRuang, kapasitas: r.kapasitas, ...nilai });
      if (!res.ok) {
        setKirim((s) => ({ ...s, [r.kodeRuang]: "gagal" }));
        return res.error;
      }
      simpanUbahan(r.kodeRuang, { ...nilai, lastSyncISO: new Date().toISOString() });
      setKirim((s) => ({ ...s, [r.kodeRuang]: "ok" }));
      return null;
    } catch {
      setKirim((s) => ({ ...s, [r.kodeRuang]: "gagal" }));
      return GALAT_SAMBUNGAN;
    }
  }

  async function kirimSatu(r: BarisRuang) {
    if (kirim[r.kodeRuang] === "proses") return;
    const err = await kirimRuang(r);
    umumkan(err ? `Laporan ${r.namaRuang} gagal dikirim` : `Laporan ${r.namaRuang} terkirim ke Aplicares`);
  }

  async function kirimBanyak(daftar: BarisRuang[]) {
    if (massal?.jalan || daftar.length === 0) return;
    const total = daftar.length;
    let gagal = 0;
    setMassal({ total, selesai: 0, gagal: 0, jalan: true });
    // Berurutan (bukan paralel) agar tidak membanjiri batas panggilan per cons-id BPJS.
    for (const [i, r] of daftar.entries()) {
      if (await kirimRuang(r)) gagal += 1;
      setMassal({ total, selesai: i + 1, gagal, jalan: i + 1 < total, waktu: i + 1 < total ? undefined : new Date().toISOString() });
    }
    umumkan(gagal > 0 ? `${total - gagal} dari ${total} ruang terkirim, ${gagal} gagal` : `${total} ruang terkirim ke Aplicares`);
  }

  async function tutupRuang(r: BarisRuang, alasan: string): Promise<BPJSError | null> {
    try {
      const res = await setMaintenance({ kdKelas: r.kdKelas, kodeRuang: r.kodeRuang, namaRuang: r.namaRuang, kapasitas: r.kapasitas, aktif: true, alasan });
      if (!res.ok) return res.error;
      const waktu = new Date().toISOString();
      simpanUbahan(r.kodeRuang, {
        flagMaintenance: true,
        tersedia: 0,
        tersediaPria: undefined,
        tersediaWanita: undefined,
        tersediaPriaWanita: undefined,
        lastSyncISO: waktu,
        tutup: { alasan, sejak: waktu, tersediaSebelum: r.tersedia },
      });
      umumkan(`${r.namaRuang} ditutup sementara`);
      return null;
    } catch {
      return GALAT_SAMBUNGAN;
    }
  }

  async function bukaKembali(r: BarisRuang): Promise<BPJSError | null> {
    const tersedia = Math.min(r.tutup?.tersediaSebelum ?? perkiraanTersedia(r), Math.max(r.kapasitas - r.terisi, 0));
    try {
      const res = await setMaintenance({ kdKelas: r.kdKelas, kodeRuang: r.kodeRuang, namaRuang: r.namaRuang, kapasitas: r.kapasitas, aktif: false, tersedia });
      if (!res.ok) return res.error;
      simpanUbahan(r.kodeRuang, { flagMaintenance: false, tersedia, lastSyncISO: new Date().toISOString(), tutup: undefined });
      umumkan(`${r.namaRuang} dibuka kembali, ${tersedia} tempat tidur tersedia`);
      return null;
    } catch {
      return GALAT_SAMBUNGAN;
    }
  }

  // ── Turunan tampilan ──────────────────────────────────

  const segarPer = new Map(rows.map((r) => [r.kodeRuang, kesegaran(r.lastSyncISO, sekarang)]));
  const perlu = rows.filter((r) => !segarPer.get(r.kodeRuang)?.terkini);
  const terkini = rows.length - perlu.length;
  const kapasitas = rows.reduce((n, r) => n + r.kapasitas, 0);
  const terisi = rows.reduce((n, r) => n + r.terisi, 0);
  const tersedia = rows.reduce((n, r) => n + r.tersedia, 0);
  const ditutup = rows.filter((r) => statusRuang(r) === "tutup").length;
  const pct = kapasitas > 0 ? Math.round((terisi / kapasitas) * 100) : 0;

  const perKelas = Object.groupBy(rows, (r) => r.kdKelas);
  const opsiKelas: OpsiSegmen<string>[] = [
    { value: "semua", label: "Semua kelas", jumlah: rows.length },
    ...Object.keys(perKelas)
      .toSorted(urutKelas)
      .map((k) => ({ value: k, label: kelasBPJSLabel(k), jumlah: perKelas[k as keyof typeof perKelas]?.length ?? 0 })),
  ];
  const kelasAktif = opsiKelas.some((o) => o.value === kelas) ? kelas : "semua";
  const diKelas = kelasAktif === "semua" ? rows : rows.filter((r) => r.kdKelas === kelasAktif);

  const cocokStatus = (r: BarisRuang, s: SaringStatus) =>
    s === "semua" ? true : s === "perlu" ? !segarPer.get(r.kodeRuang)?.terkini : statusRuang(r) === s;
  const opsiStatus: OpsiSegmen<SaringStatus>[] = (
    [
      { value: "semua", label: "Semua status" },
      { value: "perlu", label: "Perlu dikirim" },
      { value: "penuh", label: "Penuh" },
      { value: "tutup", label: "Ditutup" },
    ] as const
  )
    .map((o) => ({ ...o, jumlah: diKelas.filter((r) => cocokStatus(r, o.value)).length }))
    .filter((o) => o.value === "semua" || o.jumlah > 0);
  const statusAktif = opsiStatus.some((o) => o.value === status) ? status : "semua";

  const kata = q.trim().toLowerCase();
  const tampil = diKelas
    .filter((r) => cocokStatus(r, statusAktif))
    .filter((r) => !kata || r.namaRuang.toLowerCase().includes(kata) || r.kodeRuang.toLowerCase().includes(kata));

  const gagalDaftar = rows.filter((r) => kirim[r.kodeRuang] === "gagal");
  const ruangSheet = sheet ? (rows.find((r) => r.kodeRuang === sheet.kode) ?? null) : null;

  function unduh() {
    unduhCsv(
      [
        ["Kode ruang", "Nama ruang", "Kelas BPJS", "Kapasitas", "Terisi", "Tersedia", "Tidak siap", "Status", "Terakhir dikirim"],
        ...tampil.map((r) => {
          const st = statusRuang(r);
          return [
            r.kodeRuang,
            r.namaRuang,
            kelasBPJSLabel(r.kdKelas),
            r.kapasitas,
            r.terisi,
            r.tersedia,
            tidakSiap(r),
            st === "buka" ? "Buka" : LABEL_STATUS[st].label,
            fmtWaktu(r.lastSyncISO),
          ];
        }),
      ],
      "ketersediaan-kamar-aplicares.csv",
    );
    umumkan(`CSV ${tampil.length} ruang diunduh`);
  }

  return (
    <MotionConfig reducedMotion="user">
      <div data-accent="emerald" className="flex flex-col gap-4 p-4 text-foreground sm:p-5">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Bed className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">Ketersediaan kamar</h1>
            <p className="text-xs text-muted-foreground">Tempat tidur kosong per ruang rawat yang dilaporkan RS ke BPJS sebagai informasi untuk peserta</p>
          </div>
          <Badge variant="secondary" className="bg-white text-[11px] text-muted-foreground shadow-xs">
            Aplicares
          </Badge>
        </header>

        <Card className={KARTU}>
          <section aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 py-4">
            <KepalaKartu
              judulId={`${id}-judul`}
              judul="Ruang rawat"
              deskripsi={`Kirim ulang laporan bila sudah lebih dari ${BATAS_TERKINI_MENIT} menit atau isinya berubah`}
            >
              <Button variant="ghost" size="xs" onClick={() => !memuat && setMuat((n) => n + 1)} aria-disabled={memuat} className="aria-disabled:opacity-60">
                <RotateCw aria-hidden="true" className={cn(memuat && "motion-safe:animate-spin")} />
                Muat ulang
              </Button>
              <Button
                size="xs"
                onClick={() => kirimBanyak(rows)}
                aria-disabled={massal?.jalan || rows.length === 0}
                className="bg-emerald-600 text-white hover:bg-emerald-700 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
              >
                <Send aria-hidden="true" />
                Kirim semua
                <span className="sr-only"> laporan ke Aplicares</span>
              </Button>
            </KepalaKartu>

            {massal && (
              <div className="mx-4 flex flex-col gap-1.5 rounded-xl bg-emerald-50/60 px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                  <span className="font-medium text-emerald-950 tabular-nums">
                    {massal.jalan
                      ? `Mengirim ke Aplicares… ${massal.selesai} dari ${massal.total}`
                      : `${massal.total - massal.gagal} dari ${massal.total} ruang terkirim${massal.waktu ? ` · ${fmtWaktu(massal.waktu)}` : ""}`}
                  </span>
                  <span className="flex items-center gap-1">
                    {massal.gagal > 0 && <span className="text-[11px] font-medium text-rose-700 tabular-nums">{massal.gagal} gagal</span>}
                    {!massal.jalan && massal.gagal > 0 && (
                      <Button variant="ghost" size="xs" onClick={() => kirimBanyak(gagalDaftar)} className="text-emerald-700">
                        <RotateCw aria-hidden="true" />
                        Kirim ulang yang gagal
                      </Button>
                    )}
                    {!massal.jalan && (
                      <Button variant="ghost" size="icon-xs" aria-label="Tutup ringkasan kirim" onClick={() => setMassal(null)}>
                        <X aria-hidden="true" />
                      </Button>
                    )}
                  </span>
                </div>
                <Meter value={massal.selesai} max={Math.max(massal.total, 1)} tone={massal.gagal > 0 ? "amber" : "emerald"} label="Progres kirim ke Aplicares" />
              </div>
            )}

            {!data && memuat ? (
              <>
                <KerangkaRingkasan />
                <div className="px-2">
                  <KerangkaDaftar baris={5} tinggi="h-15" />
                </div>
              </>
            ) : hasil && !hasil.ok ? (
              <div className="px-4">
                <GalatVClaim error={hasil.error} objek="Data kamar" layanan="Aplicares" onUlang={() => setMuat((n) => n + 1)} />
              </div>
            ) : rows.length === 0 ? (
              <KosongData ikon={Bed} judul="Belum ada ruang rawat di Aplicares" deskripsi="Ruang rawat inap dari master ruangan belum didaftarkan ke Aplicares." />
            ) : (
              <div className={cn("flex flex-col gap-3 transition-opacity", memuat && "opacity-60")}>
                <dl className="grid grid-cols-2 gap-2 px-4 lg:grid-cols-4">
                  <UbinAngka label="Ruang rawat" nilai={rows.length} ket={`${Object.keys(perKelas).length} kelas BPJS`} />
                  <UbinAngka label="Tempat tidur" nilai={kapasitas} ket={`${terisi} terisi (${pct}%)`}>
                    <Meter value={Math.min(terisi, kapasitas)} max={Math.max(kapasitas, 1)} tone={nadaKeterisian(terisi, kapasitas)} label={`Keterisian tempat tidur ${pct} persen`} />
                  </UbinAngka>
                  <UbinAngka label="Tersedia" nilai={tersedia} nada="emerald" ket={ditutup > 0 ? `${ditutup} ruang ditutup` : "siap untuk pasien baru"} />
                  <UbinAngka
                    label="Laporan terkini"
                    nilai={`${terkini}/${rows.length}`}
                    nada={terkini === rows.length ? "emerald" : "amber"}
                    ket={perlu.length > 0 ? `${perlu.length} ruang perlu dikirim` : `semua ≤ ${BATAS_TERKINI_MENIT} menit`}
                  />
                </dl>

                <div className="flex flex-wrap items-center gap-2 px-4">
                  <SegmenFilter label="Saring kelas BPJS" opsi={opsiKelas} value={kelasAktif} onChange={setKelas} />
                  <SegmenFilter label="Saring status ruangan" opsi={opsiStatus} value={statusAktif} onChange={setStatus} />
                </div>
                <div className="flex flex-wrap items-center gap-2 px-4">
                  <KolomSaring id={`${id}-q`} value={q} onChange={setQ} label="Saring nama atau kode ruang" placeholder="Saring nama atau kode ruang" />
                  <TombolUnduh onClick={unduh} jumlah={tampil.length} />
                </div>

                <div className="px-2">
                  {tampil.length === 0 ? (
                    <SaringKosong
                      pesan={
                        kata ? (
                          <>
                            Tidak ada ruang yang cocok dengan “<span className="text-foreground">{q.trim()}</span>”
                          </>
                        ) : (
                          "Tidak ada ruang dengan saringan ini"
                        )
                      }
                      onReset={() => {
                        setQ("");
                        setKelas("semua");
                        setStatus("semua");
                      }}
                    />
                  ) : (
                    <ul aria-label="Ruang rawat di Aplicares" className="flex flex-col gap-0.5">
                      {tampil.map((r, i) => (
                        <Baris
                          key={r.kodeRuang}
                          r={r}
                          index={i}
                          sekarang={sekarang}
                          kirim={kirim[r.kodeRuang]}
                          onBuka={() => setSheet({ kode: r.kodeRuang, buka: true })}
                          onKirim={() => kirimSatu(r)}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <p role="status" className="sr-only">
              {memuat ? "" : hasil && !hasil.ok ? "Data kamar gagal dimuat" : `${tampil.length} ruang rawat`}
            </p>
            <p role="status" className="sr-only">
              {aksi.teks}
            </p>
          </section>
        </Card>

        <RuangSheet
          ruang={ruangSheet}
          open={Boolean(sheet?.buka)}
          sekarang={sekarang}
          onClose={() => setSheet((s) => (s ? { ...s, buka: false } : s))}
          onKirim={kirimRuang}
          onTutup={tutupRuang}
          onBukaKembali={bukaKembali}
        />
      </div>
    </MotionConfig>
  );
}
