"use client";

// Tab Kunjungan (V-Claim GET /Monitoring/Kunjungan/Tanggal/{tgl}/JnsPelayanan/{1|2}): SEP yang
// terbit pada satu tanggal. Rawat inap & rawat jalan dimuat SEKALIGUS (dua panggilan paralel)
// lalu disaring di klien dengan jumlah per jenis — dulu harus memilih jenis lalu klik Cari.
// Tanggal digeser per hari dan dimuat otomatis. Tiap baris: peserta, jenis, kelas, diagnosa,
// poli, tanggal pulang + aksi "Histori" (tab Histori pelayanan untuk peserta itu). Unduh CSV
// mengikuti saringan. Status memuat diturunkan dari kunci data.
// Komponen shadcn: Card · Item · Badge · Button · Input · Skeleton · Empty · Alert.

import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { BedDouble, CalendarSearch, ChevronLeft, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { GALAT_KONEKSI, tidakDitemukan } from "@/components/bpjs/shared/galat";
import { fmtTglPendek, geserHari, hariIniISO } from "@/components/bpjs/shared/tanggal";
import { BadgeNada, GalatVClaim, KARTU, KolomSaring, SegmenFilter, TanggalStepper } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import { monitoringKunjungan } from "@/lib/bpjs/vClaimMonitoring";
import type { BPJSError, KunjunganMonitoringItem } from "@/lib/bpjs/bpjsShared";
import {
  UJI_KUNJUNGAN,
  jenisLayanan,
  labelKelas,
  opsiSaringJenis,
  unduhCsv,
  type BukaHistori,
  type SaringJenis,
} from "./monitoringShared";
import { KepalaKartu, KerangkaDaftar, KosongData, PilihanUji, SaringKosong, TombolHistori, TombolUnduh, useStatusAksi } from "./monitoringUi";

type Muatan = { ok: true; list: KunjunganMonitoringItem[] } | { ok: false; error: BPJSError };
type Hasil = Muatan & { kunci: string };

/** RI + RJ paralel; 201 (tidak ada data) pada salah satu jenis = daftar kosong. */
async function muat(tgl: string): Promise<Muatan> {
  const semua = await Promise.all([monitoringKunjungan(tgl, "1"), monitoringKunjungan(tgl, "2")]);
  const list: KunjunganMonitoringItem[] = [];
  for (const res of semua) {
    if (res.ok) list.push(...(res.value.response ?? []));
    else if (!tidakDitemukan(res.error)) return { ok: false, error: res.error };
  }
  list.sort((a, b) => a.jnsPelayanan.localeCompare(b.jnsPelayanan) || a.nama.localeCompare(b.nama, "id"));
  return { ok: true, list };
}

function cocok(k: KunjunganMonitoringItem, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return [k.nama, k.noKartu, k.noSep, k.diagnosa, k.poli ?? ""].some((v) => v.toLowerCase().includes(s));
}

function Baris({ k, index, onHistori }: { k: KunjunganMonitoringItem; index: number; onHistori?: BukaHistori }) {
  const jp = jenisLayanan(k.jnsPelayanan);
  const kelas = labelKelas(k.kelasRawat);
  const Ikon = jp.kode === "1" ? BedDouble : Stethoscope;
  return (
    <motion.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(index, 8) * 0.025 }}>
      <Item size="sm" className="flex-nowrap items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 sm:items-center">
        <span
          aria-hidden="true"
          className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", jp.kode === "1" ? "bg-cyan-50 text-cyan-700" : "bg-sky-50 text-sky-700")}
        >
          <Ikon className="size-4" />
        </span>
        <ItemContent className="min-w-0 gap-0.5">
          <ItemTitle className="w-full min-w-0 flex-wrap gap-x-2 gap-y-1 text-xs">
            <span className="truncate font-semibold">{k.nama}</span>
            <BadgeNada tone={jp.tone}>{jp.label}</BadgeNada>
            {kelas && <BadgeNada tone="slate">{kelas}</BadgeNada>}
          </ItemTitle>
          <ItemDescription className="flex min-w-0 items-center gap-1 text-[11px] text-wrap tabular-nums">
            <span className="truncate">
              SEP {k.noSep} · kartu {k.noKartu}
            </span>
            <CopyButton value={k.noSep} label={`nomor SEP ${k.noSep}`} />
          </ItemDescription>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            Diagnosa <span className="font-medium text-foreground">{k.diagnosa}</span>
            {k.poli && <> · Poli {k.poli}</>} · pulang {fmtTglPendek(k.tglPlgSep)}
          </p>
        </ItemContent>
        <ItemActions className="shrink-0">
          <TombolHistori kartu={k.noKartu} acuan={k.tglSep} nama={k.nama} onHistori={onHistori} />
        </ItemActions>
      </Item>
    </motion.li>
  );
}

export default function KunjunganTab({ onHistori }: { onHistori?: BukaHistori }) {
  const id = useId();
  const [tgl, setTgl] = useState(hariIniISO);
  const [jenis, setJenis] = useState<SaringJenis>("semua");
  const [q, setQ] = useState("");
  const [ulang, setUlang] = useState(0);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const aksi = useStatusAksi();

  const kunci = `${tgl}#${ulang}`;
  const memuat = hasil?.kunci !== kunci;

  useEffect(() => {
    let batal = false;
    muat(tgl)
      .then((m) => {
        if (!batal) setHasil({ ...m, kunci });
      })
      .catch(() => {
        if (!batal) setHasil({ kunci, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kunci, tgl]);

  const list = hasil && hasil.ok && !memuat ? hasil.list : [];
  const ri = list.filter((k) => k.jnsPelayanan === "R.Inap").length;
  const rj = list.length - ri;
  const kata = q.trim();
  const tampil = list.filter((k) => (jenis === "semua" || jenisLayanan(k.jnsPelayanan).kode === jenis) && cocok(k, kata));

  function unduh() {
    unduhCsv(
      [
        ["No. SEP", "No. kartu", "Nama", "Jenis pelayanan", "Kelas", "Diagnosa", "Poli", "Tgl SEP", "Tgl pulang", "No. rujukan"],
        ...tampil.map((k) => [k.noSep, k.noKartu, k.nama, jenisLayanan(k.jnsPelayanan).label, k.kelasRawat, k.diagnosa, k.poli ?? "", k.tglSep, k.tglPlgSep, k.noRujukan]),
      ],
      `kunjungan-bpjs-${tgl}.csv`,
    );
    aksi.umumkan(`CSV ${tampil.length} kunjungan diunduh`);
  }

  return (
    <div className="p-4 sm:p-5">
      <Card className={KARTU}>
        <section aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 py-4">
          <KepalaKartu judulId={`${id}-judul`} judul="Kunjungan peserta" deskripsi="SEP yang terbit pada satu tanggal, rawat inap dan rawat jalan sekaligus">
            <TanggalStepper id={`${id}-tgl`} value={tgl} onChange={setTgl} label="Tanggal SEP" />
          </KepalaKartu>

          {!memuat && list.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-4">
              <SegmenFilter label="Saring jenis pelayanan" opsi={opsiSaringJenis(ri, rj)} value={jenis} onChange={setJenis} />
              <KolomSaring id={`${id}-q`} value={q} onChange={setQ} label="Saring nama, kartu, SEP, diagnosa, atau poli" placeholder="Saring nama, kartu, SEP, diagnosa" />
              <TombolUnduh onClick={unduh} jumlah={tampil.length} />
            </div>
          )}

          <div className="px-2">
            {memuat ? (
              <KerangkaDaftar baris={4} />
            ) : hasil && !hasil.ok ? (
              <div className="px-2">
                <GalatVClaim error={hasil.error} objek="Kunjungan" onUlang={() => setUlang((n) => n + 1)} />
              </div>
            ) : list.length === 0 ? (
              <KosongData ikon={CalendarSearch} judul="Belum ada kunjungan" deskripsi={`Tidak ada SEP yang terbit pada ${fmtTglPendek(tgl)}`}>
                <Button variant="secondary" size="xs" onClick={() => setTgl((t) => geserHari(t, -1))}>
                  <ChevronLeft aria-hidden="true" />
                  Lihat {fmtTglPendek(geserHari(tgl, -1))}
                </Button>
                <PilihanUji>
                  {UJI_KUNJUNGAN.map((u) => (
                    <Button key={u.tgl} variant="ghost" size="xs" onClick={() => setTgl(u.tgl)} className="text-emerald-700 tabular-nums">
                      {fmtTglPendek(u.tgl)}
                      <span className="font-normal text-muted-foreground">· {u.ket}</span>
                    </Button>
                  ))}
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
                    `Tidak ada kunjungan ${jenis === "1" ? "rawat inap" : "rawat jalan"} pada tanggal ini`
                  )
                }
                onReset={() => {
                  setQ("");
                  setJenis("semua");
                }}
              />
            ) : (
              <>
                <ul aria-label={`Kunjungan ${fmtTglPendek(tgl)}`} className="flex flex-col gap-0.5">
                  {tampil.map((k, i) => (
                    <Baris key={k.noSep} k={k} index={i} onHistori={onHistori} />
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
                ? "Data kunjungan gagal dimuat"
                : `${list.length} kunjungan pada ${fmtTglPendek(tgl)}: ${ri} rawat inap, ${rj} rawat jalan`}
          </p>
          <p role="status" className="sr-only">
            {aksi.teks}
          </p>
        </section>
      </Card>
    </div>
  );
}
