"use client";

// Tab Klaim (V-Claim GET /Monitoring/Klaim/Tanggal/{tgl}/JnsPelayanan/{j}/Status/{s}): klaim per
// tanggal pulang. KETIGA status (proses verifikasi · pending · klaim) dimuat sekaligus untuk
// jenis pelayanan terpilih → ubin status yang sekaligus menjadi saringan, lengkap dengan jumlah
// dan nilai pengajuan — dulu harus menebak status dulu lalu klik Cari. Persentase persetujuan
// klaim layak tampil sebagai bilah <progress>. Tanggal digeser per hari dan dimuat otomatis.
// Klik baris → detail di Sheet (biaya rinci, INA-CBG, FPK). Status memuat diturunkan dari kunci.
// Komponen shadcn: Card · Item · Badge · Button · Input · Skeleton · Empty · Alert · Sheet.

import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { CircleCheck, Clock, ChevronLeft, ReceiptText, ScanSearch, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { DOT, type BadgeTone } from "@/components/bpjs/shared/badge";
import { GALAT_KONEKSI, tidakDitemukan } from "@/components/bpjs/shared/galat";
import { fmtTglPendek, geserHari, hariIniISO } from "@/components/bpjs/shared/tanggal";
import { BadgeNada, GalatVClaim, KARTU, KolomSaring, Meter, SegmenFilter, TanggalStepper } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import { monitoringKlaim } from "@/lib/bpjs/vClaimMonitoring";
import type { BPJSError, KlaimMonitoringStatusKode } from "@/lib/bpjs/bpjsShared";
import KlaimSheet, { type BarisKlaim } from "./KlaimSheet";
import { OPSI_JENIS, STATUS_KLAIM, UJI_KLAIM, angka, persen, rupiah, unduhCsv, type BukaHistori, type KodeJenis } from "./monitoringShared";
import { KepalaKartu, KerangkaDaftar, KosongData, PilihanUji, SaringKosong, TombolUnduh, useStatusAksi } from "./monitoringUi";

type Muatan = { ok: true; list: BarisKlaim[] } | { ok: false; error: BPJSError };
type Hasil = Muatan & { kunci: string };
type SaringStatus = "semua" | KlaimMonitoringStatusKode;

const IKON_STATUS: Record<KlaimMonitoringStatusKode, LucideIcon> = { "1": ScanSearch, "2": Clock, "3": CircleCheck };
const KOTAK_IKON: Partial<Record<BadgeTone, string>> = {
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
};

/** Ketiga status paralel untuk satu jenis pelayanan; 201 pada salah satu status = kosong. */
async function muat(tgl: string, jenis: KodeJenis): Promise<Muatan> {
  const semua = await Promise.all(STATUS_KLAIM.map((s) => monitoringKlaim(tgl, jenis, s.kode)));
  const list: BarisKlaim[] = [];
  for (let i = 0; i < semua.length; i++) {
    const res = semua[i];
    if (res.ok) list.push(...(res.value.response ?? []).map((k) => ({ ...k, st: STATUS_KLAIM[i] })));
    else if (!tidakDitemukan(res.error)) return { ok: false, error: res.error };
  }
  list.sort((a, b) => a.st.kode.localeCompare(b.st.kode) || a.peserta.nama.localeCompare(b.peserta.nama, "id"));
  return { ok: true, list };
}

function cocok(k: BarisKlaim, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return [k.peserta.nama, k.peserta.noKartu, k.peserta.noMR, k.noSEP, k.Inacbg.kode, k.Inacbg.nama, k.noFPK].some((v) => v.toLowerCase().includes(s));
}

function jumlahAju(list: readonly BarisKlaim[]): number {
  return list.reduce((s, k) => s + angka(k.biaya.byPengajuan), 0);
}

/** Ubin status = tombol saring (aria-pressed): titik warna + label + jumlah + nilai pengajuan. */
function UbinStatus({ label, tone, n, nilai, aktif, onClick }: { label: string; tone: BadgeTone; n: number; nilai: number; aktif: boolean; onClick: () => void }) {
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
      <span className="max-w-full truncate text-[11px] text-muted-foreground tabular-nums">{rupiah(nilai)}</span>
    </button>
  );
}

function Baris({ k, index, onBuka }: { k: BarisKlaim; index: number; onBuka: () => void }) {
  const Ikon = IKON_STATUS[k.st.kode];
  const setuju = angka(k.biaya.bySetujui);
  return (
    <motion.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(index, 8) * 0.025 }}>
      <Item asChild size="sm" className="w-full flex-nowrap items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 sm:items-center">
        <button type="button" onClick={onBuka} aria-haspopup="dialog">
          <span aria-hidden="true" className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", KOTAK_IKON[k.st.tone] ?? "bg-slate-100 text-slate-600")}>
            <Ikon className="size-4" />
          </span>
          <ItemContent className="min-w-0 gap-0.5">
            <ItemTitle className="w-full min-w-0 flex-wrap gap-x-2 gap-y-1 text-xs">
              <span className="truncate font-semibold">{k.peserta.nama}</span>
              <BadgeNada tone={k.st.tone} titik>
                {k.st.label}
              </BadgeNada>
              <BadgeNada tone="slate">Kelas {k.kelasRawat}</BadgeNada>
            </ItemTitle>
            <ItemDescription className="line-clamp-1 text-[11px] text-wrap tabular-nums">
              SEP {k.noSEP}
              {k.peserta.noMR && <> · RM {k.peserta.noMR}</>}
            </ItemDescription>
            <span className="block truncate text-[11px] text-muted-foreground" title={`${k.Inacbg.kode} · ${k.Inacbg.nama}`}>
              <span className="font-medium text-foreground tabular-nums">{k.Inacbg.kode}</span> · {k.Inacbg.nama}
            </span>
          </ItemContent>
          <span className="flex shrink-0 flex-col items-end gap-0.5 text-right tabular-nums">
            <span className="text-xs font-semibold">{rupiah(k.biaya.byPengajuan)}</span>
            <span className="text-[11px] text-muted-foreground">
              {setuju > 0 ? (
                <>
                  disetujui <span className="text-emerald-700">{rupiah(setuju)}</span>
                </>
              ) : (
                "belum disetujui"
              )}
            </span>
          </span>
        </button>
      </Item>
    </motion.li>
  );
}

export default function KlaimTab({ onHistori }: { onHistori?: BukaHistori }) {
  const id = useId();
  const [tgl, setTgl] = useState(hariIniISO);
  const [jenis, setJenis] = useState<KodeJenis>("1");
  const [status, setStatus] = useState<SaringStatus>("semua");
  const [q, setQ] = useState("");
  const [ulang, setUlang] = useState(0);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [buka, setBuka] = useState<BarisKlaim | null>(null);
  const aksi = useStatusAksi();

  const kunci = `${tgl}|${jenis}#${ulang}`;
  const memuat = hasil?.kunci !== kunci;

  useEffect(() => {
    let batal = false;
    muat(tgl, jenis)
      .then((m) => {
        if (!batal) setHasil({ ...m, kunci });
      })
      .catch(() => {
        if (!batal) setHasil({ kunci, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kunci, tgl, jenis]);

  const list = hasil && hasil.ok && !memuat ? hasil.list : [];
  const kata = q.trim();
  const tampil = list.filter((k) => (status === "semua" || k.st.kode === status) && cocok(k, kata));
  const labelJenis = OPSI_JENIS.find((o) => o.value === jenis)?.label.toLowerCase() ?? "";

  // Persetujuan dihitung dari klaim yang sudah layak saja (yang lain belum punya nilai disetujui).
  const layak = list.filter((k) => k.st.kode === "3");
  const ajuLayak = jumlahAju(layak);
  const setujuLayak = layak.reduce((s, k) => s + angka(k.biaya.bySetujui), 0);
  const pct = persen(setujuLayak, ajuLayak);

  function unduh() {
    unduhCsv(
      [
        ["No. SEP", "No. kartu", "Nama", "No. RM", "Status", "INA-CBG", "Deskripsi INA-CBG", "Poli", "Kelas", "Pengajuan", "Tarif INA-CBG", "Tarif RS", "Top-up", "Disetujui", "No. FPK", "Tgl SEP", "Tgl pulang"],
        ...tampil.map((k) => [
          k.noSEP,
          k.peserta.noKartu,
          k.peserta.nama,
          k.peserta.noMR,
          k.st.label,
          k.Inacbg.kode,
          k.Inacbg.nama,
          k.poli,
          k.kelasRawat,
          angka(k.biaya.byPengajuan),
          angka(k.biaya.byTarifGruper),
          angka(k.biaya.byTarifRS),
          angka(k.biaya.byTopup),
          angka(k.biaya.bySetujui),
          k.noFPK,
          k.tglSep,
          k.tglPulang,
        ]),
      ],
      `klaim-bpjs-${jenis === "1" ? "ri" : "rj"}-${tgl}.csv`,
    );
    aksi.umumkan(`CSV ${tampil.length} klaim diunduh`);
  }

  return (
    <div className="p-4 sm:p-5">
      <Card className={KARTU}>
        <section aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 py-4">
          <KepalaKartu judulId={`${id}-judul`} judul="Status klaim" deskripsi="Klaim per tanggal pulang: proses verifikasi, pending, dan layak bayar">
            <SegmenFilter label="Jenis pelayanan" opsi={OPSI_JENIS} value={jenis} onChange={setJenis} />
            <TanggalStepper id={`${id}-tgl`} value={tgl} onChange={setTgl} label="Tanggal pulang" />
          </KepalaKartu>

          {!memuat && list.length > 0 && (
            <>
              <div role="group" aria-label="Saring status klaim" className="grid grid-cols-2 gap-2 px-4 lg:grid-cols-4">
                <UbinStatus label="Semua status" tone="slate" n={list.length} nilai={jumlahAju(list)} aktif={status === "semua"} onClick={() => setStatus("semua")} />
                {STATUS_KLAIM.map((s) => {
                  const isi = list.filter((k) => k.st.kode === s.kode);
                  return (
                    <UbinStatus key={s.kode} label={s.label} tone={s.tone} n={isi.length} nilai={jumlahAju(isi)} aktif={status === s.kode} onClick={() => setStatus(s.kode)} />
                  );
                })}
              </div>

              {pct !== null && (
                <div className="mx-4 flex flex-col gap-1.5 rounded-xl bg-emerald-50/60 px-3 py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs">
                    <span className="font-medium text-emerald-950">Persetujuan klaim layak {pct}%</span>
                    <span className="text-[11px] text-emerald-900/80 tabular-nums">
                      {rupiah(setujuLayak)} disetujui dari {rupiah(ajuLayak)} · selisih {rupiah(ajuLayak - setujuLayak)}
                    </span>
                  </div>
                  <Meter value={Math.min(setujuLayak, ajuLayak)} max={Math.max(ajuLayak, 1)} tone={pct >= 90 ? "emerald" : pct >= 75 ? "amber" : "rose"} label={`Persetujuan klaim layak ${pct} persen`} />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 px-4">
                <KolomSaring id={`${id}-q`} value={q} onChange={setQ} label="Saring nama, kartu, RM, SEP, INA-CBG, atau FPK" placeholder="Saring nama, kartu, SEP, INA-CBG, FPK" />
                <TombolUnduh onClick={unduh} jumlah={tampil.length} />
              </div>
            </>
          )}

          <div className="px-2">
            {memuat ? (
              <KerangkaDaftar baris={4} />
            ) : hasil && !hasil.ok ? (
              <div className="px-2">
                <GalatVClaim error={hasil.error} objek="Klaim" onUlang={() => setUlang((n) => n + 1)} />
              </div>
            ) : list.length === 0 ? (
              <KosongData ikon={ReceiptText} judul="Belum ada klaim" deskripsi={`Tidak ada klaim ${labelJenis} dengan tanggal pulang ${fmtTglPendek(tgl)}`}>
                <Button variant="secondary" size="xs" onClick={() => setTgl((t) => geserHari(t, -1))}>
                  <ChevronLeft aria-hidden="true" />
                  Lihat {fmtTglPendek(geserHari(tgl, -1))}
                </Button>
                <PilihanUji>
                  {UJI_KLAIM.map((u) => (
                    <Button
                      key={`${u.tgl}-${u.jenis}`}
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        setJenis(u.jenis);
                        setTgl(u.tgl);
                      }}
                      className="text-emerald-700 tabular-nums"
                    >
                      {fmtTglPendek(u.tgl)}
                      <span className="font-normal text-muted-foreground">
                        · {u.jenis === "1" ? "RI" : "RJ"} {u.ket.toLowerCase()}
                      </span>
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
                    `Tidak ada klaim berstatus ${STATUS_KLAIM.find((s) => s.kode === status)?.label.toLowerCase()} pada tanggal ini`
                  )
                }
                onReset={() => {
                  setQ("");
                  setStatus("semua");
                }}
              />
            ) : (
              <>
                <ul aria-label={`Klaim ${labelJenis} pulang ${fmtTglPendek(tgl)}`} className="flex flex-col gap-0.5">
                  {tampil.map((k, i) => (
                    <Baris key={k.noSEP} k={k} index={i} onBuka={() => setBuka(k)} />
                  ))}
                </ul>
                {tampil.length < list.length && (
                  <p className="px-3 pt-2 text-[11px] text-muted-foreground tabular-nums">
                    Menampilkan {tampil.length} dari {list.length} · {rupiah(jumlahAju(tampil))}
                  </p>
                )}
              </>
            )}
          </div>

          <p role="status" className="sr-only">
            {memuat
              ? ""
              : hasil && !hasil.ok
                ? "Data klaim gagal dimuat"
                : `${list.length} klaim ${labelJenis} pulang ${fmtTglPendek(tgl)}${STATUS_KLAIM.map((s) => `, ${list.filter((k) => k.st.kode === s.kode).length} ${s.label.toLowerCase()}`).join("")}`}
          </p>
          <p role="status" className="sr-only">
            {aksi.teks}
          </p>
        </section>
      </Card>

      <KlaimSheet klaim={buka} onClose={() => setBuka(null)} onHistori={onHistori} />
    </div>
  );
}
