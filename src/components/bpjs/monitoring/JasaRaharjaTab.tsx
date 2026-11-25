"use client";

// Tab Jasa Raharja (V-Claim GET /monitoring/JasaRaharja/JnsPelayanan/{j}/tglMulai/{a}/tglAkhir/
// {b}): klaim kecelakaan lalu lintas yang dijamin bersama Jasa Raharja, per bulan (penggeser
// periode, dimuat otomatis — dulu pilih jenis + dua tanggal lalu klik Cari). Rawat inap & rawat
// jalan dimuat sekaligus lalu disaring di klien. Ringkasan: jumlah klaim, total biaya dijamin,
// total dibayar. Tiap kartu: peserta, status dijamin & kirim (teks + warna), tanggal kejadian,
// register JR (salin), masa rawat, diagnosa, serapan plafon (bilah <progress>), jumlah dibayar,
// dan aksi "Histori". Status memuat diturunkan dari kunci data.
// Komponen shadcn: Card · Badge · Button · Input · Skeleton · Empty · Alert.

import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { CarFront, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BadgeTone } from "@/components/bpjs/shared/badge";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { GALAT_KONEKSI, tidakDitemukan } from "@/components/bpjs/shared/galat";
import { fmtTglPendek, geserPeriode, labelPeriode, periodeIni, rentangPeriode, type Periode } from "@/components/bpjs/shared/tanggal";
import { BadgeNada, GalatVClaim, KARTU, KolomSaring, Meter, PeriodeStepper, SegmenFilter } from "@/components/bpjs/shared/vclaimUi";
import { monitoringJasaRaharja } from "@/lib/bpjs/vClaimMonitoring";
import type { BPJSError, JasaRaharjaMonitoringItem } from "@/lib/bpjs/bpjsShared";
import { PERIODE_UJI_JR, angka, jenisLayanan, opsiSaringJenis, persen, rupiah, unduhCsv, type BukaHistori, type SaringJenis } from "./monitoringShared";
import { KepalaKartu, KerangkaDaftar, KosongData, PilihanUji, SaringKosong, TombolHistori, TombolUnduh, UbinAngka, useStatusAksi } from "./monitoringUi";

type Muatan = { ok: true; list: JasaRaharjaMonitoringItem[] } | { ok: false; error: BPJSError };
type Hasil = Muatan & { kunci: string };

/** RI + RJ paralel untuk satu bulan; 201 pada salah satu jenis = kosong. */
async function muat(p: Periode): Promise<Muatan> {
  const { mulai, akhir } = rentangPeriode(p);
  const semua = await Promise.all([monitoringJasaRaharja("1", mulai, akhir), monitoringJasaRaharja("2", mulai, akhir)]);
  const list: JasaRaharjaMonitoringItem[] = [];
  for (const res of semua) {
    if (res.ok) list.push(...(res.value.response ?? []));
    else if (!tidakDitemukan(res.error)) return { ok: false, error: res.error };
  }
  list.sort((a, b) => b.jasaRaharja.tglKejadian.localeCompare(a.jasaRaharja.tglKejadian));
  return { ok: true, list };
}

function statusDijamin(ket: string): { label: string; tone: BadgeTone } {
  return ket === "Dijamin" ? { label: "Dijamin", tone: "emerald" } : { label: ket || "Tidak dijamin", tone: "rose" };
}

function statusKirim(ket: string): { label: string; tone: BadgeTone } {
  if (ket === "Sukses") return { label: "Terkirim ke JR", tone: "emerald" };
  if (ket === "Pending") return { label: "Menunggu kirim", tone: "amber" };
  if (ket === "Gagal") return { label: "Gagal kirim", tone: "rose" };
  return { label: ket || "Status kirim tidak diketahui", tone: "slate" };
}

function cocok(j: JasaRaharjaMonitoringItem, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return [j.sep.peserta.nama, j.sep.peserta.noKartu, j.sep.peserta.noMR, j.sep.noSEP, j.jasaRaharja.noRegister, j.sep.diagnosa].some((v) =>
    v.toLowerCase().includes(s),
  );
}

function KartuJR({ j, index, onHistori }: { j: JasaRaharjaMonitoringItem; index: number; onHistori?: BukaHistori }) {
  const { sep, jasaRaharja: jr } = j;
  const jp = jenisLayanan(sep.jnsPelayanan);
  const dijamin = statusDijamin(jr.ketStatusDijamin);
  const kirim = statusKirim(jr.ketStatusDikirim);
  const nilaiJamin = angka(jr.biayaDijamin);
  const plafon = angka(jr.plafon);
  const serap = persen(nilaiJamin, plafon);
  const judulId = `jr-${sep.noSEP}`;
  return (
    <motion.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(index, 8) * 0.03 }}>
      <article aria-labelledby={judulId} className="flex h-full flex-col gap-3 rounded-xl bg-slate-50/80 p-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 id={judulId} className="truncate text-xs font-semibold">
              {sep.peserta.nama}
            </h3>
            <p className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
              <span className="truncate">
                SEP {sep.noSEP}
                {sep.peserta.noMR && <> · RM {sep.peserta.noMR}</>}
              </span>
              <CopyButton value={sep.noSEP} label={`nomor SEP ${sep.noSEP}`} />
            </p>
          </div>
          <TombolHistori kartu={sep.peserta.noKartu} acuan={sep.tglSEP} nama={sep.peserta.nama} onHistori={onHistori} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <BadgeNada tone={dijamin.tone} titik>
            {dijamin.label}
          </BadgeNada>
          <BadgeNada tone={kirim.tone}>{kirim.label}</BadgeNada>
          <BadgeNada tone={jp.tone}>{jp.label}</BadgeNada>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">Kejadian</dt>
            <dd className="font-medium tabular-nums">{fmtTglPendek(jr.tglKejadian)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">Register JR</dt>
            <dd className="flex min-w-0 items-center gap-0.5 font-medium tabular-nums">
              <span className="truncate">{jr.noRegister}</span>
              <CopyButton value={jr.noRegister} label={`nomor register Jasa Raharja ${jr.noRegister}`} />
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">Masa rawat</dt>
            <dd className="font-medium tabular-nums">
              {fmtTglPendek(sep.tglSEP)}
              {sep.tglPlgSEP && sep.tglPlgSEP !== sep.tglSEP && (
                <>
                  <span aria-hidden="true"> → </span>
                  <span className="sr-only"> sampai </span>
                  {fmtTglPendek(sep.tglPlgSEP)}
                </>
              )}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">Diagnosa</dt>
            <dd className="font-medium tabular-nums">
              {sep.diagnosa}
              {sep.poli && <span className="font-normal text-muted-foreground"> · poli {sep.poli}</span>}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-col gap-1.5 rounded-lg bg-white px-2.5 py-2 shadow-xs">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-[11px]">
            <span className="text-muted-foreground">Dijamin dari plafon</span>
            <span className="font-medium tabular-nums">
              {rupiah(nilaiJamin)} / {rupiah(plafon)}
            </span>
          </div>
          {serap !== null && (
            <Meter
              value={Math.min(nilaiJamin, plafon)}
              max={Math.max(plafon, 1)}
              tone={serap >= 100 ? "rose" : serap >= 80 ? "amber" : "emerald"}
              label={`Serapan plafon Jasa Raharja ${serap} persen`}
            />
          )}
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-[11px]">
            <span className="text-muted-foreground">Dibayar Jasa Raharja</span>
            <span className="font-semibold text-emerald-800 tabular-nums">{rupiah(jr.jmlDibayar)}</span>
          </div>
        </div>
      </article>
    </motion.li>
  );
}

export default function JasaRaharjaTab({ onHistori }: { onHistori?: BukaHistori }) {
  const id = useId();
  const [periode, setPeriode] = useState<Periode>(periodeIni);
  const [jenis, setJenis] = useState<SaringJenis>("semua");
  const [q, setQ] = useState("");
  const [ulang, setUlang] = useState(0);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const aksi = useStatusAksi();

  const kunci = `${periode.tahun}-${periode.bulan}#${ulang}`;
  const memuat = hasil?.kunci !== kunci;

  useEffect(() => {
    let batal = false;
    muat(periode)
      .then((m) => {
        if (!batal) setHasil({ ...m, kunci });
      })
      .catch(() => {
        if (!batal) setHasil({ kunci, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kunci, periode]);

  const list = hasil && hasil.ok && !memuat ? hasil.list : [];
  const ri = list.filter((j) => j.sep.jnsPelayanan === "1").length;
  const kata = q.trim();
  const tampil = list.filter((j) => (jenis === "semua" || j.sep.jnsPelayanan === jenis) && cocok(j, kata));
  const nDijamin = list.filter((j) => j.jasaRaharja.ketStatusDijamin === "Dijamin").length;
  const totalJamin = list.reduce((s, j) => s + angka(j.jasaRaharja.biayaDijamin), 0);
  const totalBayar = list.reduce((s, j) => s + angka(j.jasaRaharja.jmlDibayar), 0);
  const pctBayar = persen(totalBayar, totalJamin);

  function unduh() {
    unduhCsv(
      [
        ["No. SEP", "No. kartu", "Nama", "No. RM", "Jenis pelayanan", "Tgl kejadian", "No. register JR", "Status dijamin", "Status kirim", "Biaya dijamin", "Plafon", "Dibayar", "Diagnosa", "Poli", "Tgl SEP", "Tgl pulang"],
        ...tampil.map(({ sep, jasaRaharja: jr }) => [
          sep.noSEP,
          sep.peserta.noKartu,
          sep.peserta.nama,
          sep.peserta.noMR,
          jenisLayanan(sep.jnsPelayanan).label,
          jr.tglKejadian,
          jr.noRegister,
          jr.ketStatusDijamin,
          jr.ketStatusDikirim,
          angka(jr.biayaDijamin),
          angka(jr.plafon),
          angka(jr.jmlDibayar),
          sep.diagnosa,
          sep.poli,
          sep.tglSEP,
          sep.tglPlgSEP,
        ]),
      ],
      `jasa-raharja-${periode.tahun}-${String(periode.bulan).padStart(2, "0")}.csv`,
    );
    aksi.umumkan(`CSV ${tampil.length} klaim Jasa Raharja diunduh`);
  }

  return (
    <div className="p-4 sm:p-5">
      <Card className={KARTU}>
        <section aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 py-4">
          <KepalaKartu judulId={`${id}-judul`} judul="Jaminan Jasa Raharja" deskripsi="Klaim kecelakaan lalu lintas per bulan SEP terbit">
            <PeriodeStepper periode={periode} onChange={setPeriode} />
          </KepalaKartu>

          <p className="mx-4 flex items-start gap-2 rounded-xl bg-amber-50/70 p-3 text-xs/relaxed text-amber-950">
            <Info className="mt-0.5 size-3.5 shrink-0 text-amber-700" aria-hidden="true" />
            <span>
              Pada kecelakaan lalu lintas, Jasa Raharja menjamin lebih dulu sampai plafon; kelebihan biayanya dijamin BPJS Kesehatan.
            </span>
          </p>

          {!memuat && list.length > 0 && (
            <>
              <dl className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-3">
                <UbinAngka label="Klaim kecelakaan" nilai={list.length} ket={`${nDijamin} dijamin · ${list.length - nDijamin} tidak dijamin`} />
                <UbinAngka label="Biaya dijamin" nilai={rupiah(totalJamin)} ket="total semua klaim" />
                <UbinAngka label="Dibayar Jasa Raharja" nilai={rupiah(totalBayar)} nada="emerald" ket={pctBayar !== null ? `${pctBayar}% dari biaya dijamin` : undefined} />
              </dl>
              <div className="flex flex-wrap items-center gap-2 px-4">
                <SegmenFilter label="Saring jenis pelayanan" opsi={opsiSaringJenis(ri, list.length - ri)} value={jenis} onChange={setJenis} />
                <KolomSaring id={`${id}-q`} value={q} onChange={setQ} label="Saring nama, kartu, RM, SEP, register JR, atau diagnosa" placeholder="Saring nama, kartu, SEP, register JR" />
                <TombolUnduh onClick={unduh} jumlah={tampil.length} />
              </div>
            </>
          )}

          <div className="px-2">
            {memuat ? (
              <div className="grid gap-2 px-2 md:grid-cols-2" aria-hidden="true">
                <KerangkaDaftar baris={1} tinggi="h-56" />
                <KerangkaDaftar baris={1} tinggi="h-56" />
              </div>
            ) : hasil && !hasil.ok ? (
              <div className="px-2">
                <GalatVClaim error={hasil.error} objek="Data Jasa Raharja" onUlang={() => setUlang((n) => n + 1)} />
              </div>
            ) : list.length === 0 ? (
              <KosongData ikon={CarFront} judul="Belum ada klaim Jasa Raharja" deskripsi={`Tidak ada jaminan kecelakaan dengan SEP terbit ${labelPeriode(periode)}`}>
                <Button variant="secondary" size="xs" onClick={() => setPeriode((p) => geserPeriode(p, -1))}>
                  <ChevronLeft aria-hidden="true" />
                  Lihat {labelPeriode(geserPeriode(periode, -1))}
                </Button>
                <PilihanUji>
                  <Button variant="ghost" size="xs" onClick={() => setPeriode({ ...PERIODE_UJI_JR })} className="text-emerald-700">
                    {labelPeriode(PERIODE_UJI_JR)}
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </PilihanUji>
              </KosongData>
            ) : tampil.length === 0 ? (
              <SaringKosong
                pesan={
                  kata ? (
                    <>
                      Tidak ada yang cocok dengan “<span className="text-foreground">{kata}</span>”
                    </>
                  ) : (
                    `Tidak ada klaim ${jenis === "1" ? "rawat inap" : "rawat jalan"} pada periode ini`
                  )
                }
                onReset={() => {
                  setQ("");
                  setJenis("semua");
                }}
              />
            ) : (
              <>
                <ul aria-label={`Klaim Jasa Raharja ${labelPeriode(periode)}`} className="grid gap-2 px-2 md:grid-cols-2 2xl:grid-cols-3">
                  {tampil.map((j, i) => (
                    <KartuJR key={j.sep.noSEP} j={j} index={i} onHistori={onHistori} />
                  ))}
                </ul>
                {tampil.length < list.length && (
                  <p className="px-3 pt-2 text-[11px] text-muted-foreground tabular-nums">
                    Menampilkan {tampil.length} dari {list.length}
                  </p>
                )}
              </>
            )}
          </div>

          <p role="status" className="sr-only">
            {memuat
              ? ""
              : hasil && !hasil.ok
                ? "Data Jasa Raharja gagal dimuat"
                : `${list.length} klaim Jasa Raharja pada ${labelPeriode(periode)}`}
          </p>
          <p role="status" className="sr-only">
            {aksi.teks}
          </p>
        </section>
      </Card>
    </div>
  );
}
