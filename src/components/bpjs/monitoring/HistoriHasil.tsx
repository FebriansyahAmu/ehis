"use client";

// Hasil histori pelayanan peserta (V-Claim GET /monitoring/HistoriPelayanan/NoKartu/{k}/tglMulai/
// {a}/tglAkhir/{b}) — termasuk pelayanan di faskes lain. Kepala: peserta + No. kartu (salin) +
// periode; ringkasan jumlah pelayanan, rawat inap (+ total hari rawat), rawat jalan, jumlah
// faskes. Riwayat dikelompokkan per bulan (terbaru dulu); tiap pelayanan punya ubin tanggal,
// jenis, kelas, masa rawat, diagnosa (kode + nama), poli, faskes, SEP & rujukan. Bila ada rawat
// inap dan rawat jalan, bisa disaring per jenis. Komponen shadcn: Item · Badge · Skeleton · Empty.

import { useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { SearchX, UserSearch } from "lucide-react";
import { Item, ItemContent } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { NAMA_BULAN, fmtTglPendek, parseTgl } from "@/components/bpjs/shared/tanggal";
import { BadgeNada, GalatVClaim, SegmenFilter } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import type { BPJSError, HistoriPelayananMonitoringItem } from "@/lib/bpjs/bpjsShared";
import { jenisLayanan, labelKelas, lamaRawat, opsiSaringJenis, pisahDiagnosa, type SaringJenis } from "./monitoringShared";
import { KosongData, UbinAngka } from "./monitoringUi";
import type { PeriodeHistori } from "./HistoriForm";

export interface CariHistori extends PeriodeHistori {
  kartu: string;
}

export type HasilHistori = { kunci: string; ok: true; list: HistoriPelayananMonitoringItem[] } | { kunci: string; ok: false; error: BPJSError };

function Pelayanan({ h, index }: { h: HistoriPelayananMonitoringItem; index: number }) {
  const jp = jenisLayanan(h.jnsPelayanan);
  const kelas = labelKelas(h.kelasRawat);
  const diag = pisahDiagnosa(h.diagnosa);
  const tgl = parseTgl(h.tglSep);
  const lama = jp.kode === "1" ? lamaRawat(h.tglSep, h.tglPlgSep) : null;
  return (
    <motion.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(index, 8) * 0.03 }}>
      <Item size="sm" className="flex-nowrap items-start gap-3 rounded-xl bg-slate-50/70 px-3 py-2.5 transition-colors hover:bg-slate-50">
        {/* Ubin tanggal dekoratif — tanggal lengkap ada di teks masa rawat. */}
        <span
          aria-hidden="true"
          className={cn(
            "flex w-11 shrink-0 flex-col items-center justify-center rounded-lg py-1.5",
            jp.kode === "1" ? "bg-cyan-100/70 text-cyan-900" : "bg-sky-100/70 text-sky-900",
          )}
        >
          <span className="text-sm leading-none font-semibold tabular-nums">{tgl?.getDate() ?? "—"}</span>
          <span className="mt-0.5 text-[10px]">{tgl ? NAMA_BULAN[tgl.getMonth()].slice(0, 3) : ""}</span>
        </span>
        <ItemContent className="min-w-0 gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <BadgeNada tone={jp.tone}>{jp.label}</BadgeNada>
            {kelas && <BadgeNada tone="slate">{kelas}</BadgeNada>}
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {fmtTglPendek(h.tglSep)}
              {h.tglPlgSep && h.tglPlgSep !== h.tglSep && (
                <>
                  <span aria-hidden="true"> → </span>
                  <span className="sr-only"> sampai </span>
                  {fmtTglPendek(h.tglPlgSep)}
                </>
              )}
              {lama !== null && <> · {lama} hari rawat</>}
            </span>
          </div>
          <p className="text-xs/relaxed">
            <span className="font-semibold tabular-nums">{diag.kode}</span>
            {diag.nama && <span> · {diag.nama}</span>}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {h.poli && <>Poli {h.poli} · </>}
            {h.ppkPelayanan}
          </p>
          <p className="flex min-w-0 flex-wrap items-center gap-x-1 text-[11px] text-muted-foreground tabular-nums">
            <span className="inline-flex items-center gap-0.5">
              SEP {h.noSep}
              <CopyButton value={h.noSep} label={`nomor SEP ${h.noSep}`} />
            </span>
            {h.noRujukan && <span className="truncate">· rujukan {h.noRujukan}</span>}
          </p>
        </ItemContent>
      </Item>
    </motion.li>
  );
}

function kelompokBulan(list: readonly HistoriPelayananMonitoringItem[]): [string, HistoriPelayananMonitoringItem[]][] {
  const peta = new Map<string, HistoriPelayananMonitoringItem[]>();
  for (const h of list) {
    const k = h.tglSep.slice(0, 7);
    const isi = peta.get(k);
    if (isi) isi.push(h);
    else peta.set(k, [h]);
  }
  return [...peta.entries()];
}

function labelBulan(kunci: string): string {
  const [y, m] = kunci.split("-").map(Number);
  return m >= 1 && m <= 12 ? `${NAMA_BULAN[m - 1]} ${y}` : kunci;
}

export default function HistoriHasil({
  cari,
  memuat,
  hasil,
  onUlang,
  judulId,
  judulRef,
}: {
  cari: CariHistori | null;
  memuat: boolean;
  hasil: HasilHistori | null;
  onUlang: () => void;
  judulId: string;
  judulRef: RefObject<HTMLHeadingElement | null>;
}) {
  const [jenis, setJenis] = useState<SaringJenis>("semua");
  // Saringan kembali ke "Semua" setiap pencarian baru — pola adjust-on-render.
  const [kunciSaring, setKunciSaring] = useState(hasil?.kunci);
  if (hasil?.kunci !== kunciSaring) {
    setKunciSaring(hasil?.kunci);
    setJenis("semua");
  }

  const judul = (
    <h2 id={judulId} ref={judulRef} tabIndex={-1} className="text-sm font-semibold outline-none">
      Riwayat pelayanan
    </h2>
  );

  if (!cari) {
    return (
      <div className="flex flex-col gap-1 px-4">
        <div className="sr-only">{judul}</div>
        <KosongData
          ikon={UserSearch}
          judul="Riwayat pelayanan peserta"
          deskripsi="Masukkan No. kartu dan periode (paling lama 90 hari) untuk melihat SEP peserta, termasuk pelayanan di faskes lain."
        />
      </div>
    );
  }

  const periodeTeks = `${fmtTglPendek(cari.mulai)} – ${fmtTglPendek(cari.akhir)}`;

  if (memuat) {
    return (
      <div className="flex flex-col gap-3 px-4">
        {judul}
        <div className="flex flex-col gap-2" aria-hidden="true">
          <Skeleton className="h-12 rounded-xl" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (hasil && !hasil.ok) {
    return (
      <div className="flex flex-col gap-3 px-4">
        {judul}
        <GalatVClaim error={hasil.error} objek="Histori pelayanan" onUlang={onUlang} />
      </div>
    );
  }

  const list = hasil?.ok ? hasil.list : [];
  if (list.length === 0) {
    return (
      <div className="flex flex-col gap-1 px-4">
        {judul}
        <KosongData
          ikon={SearchX}
          judul="Tidak ada pelayanan"
          deskripsi={
            <>
              Kartu <span className="text-foreground tabular-nums">{cari.kartu}</span> tidak punya SEP pada {periodeTeks}
            </>
          }
        />
      </div>
    );
  }

  const nama = list[0].namaPeserta;
  const inap = list.filter((h) => jenisLayanan(h.jnsPelayanan).kode === "1");
  const hariRawat = inap.reduce((s, h) => s + (lamaRawat(h.tglSep, h.tglPlgSep) ?? 0), 0);
  const faskes = new Set(list.map((h) => h.ppkPelayanan)).size;
  const tampil = jenis === "semua" ? list : list.filter((h) => jenisLayanan(h.jnsPelayanan).kode === jenis);
  const inisial = nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="flex flex-col gap-3 px-4">
      {judul}

      <div className="flex flex-wrap items-center gap-3">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-semibold text-emerald-800">
          {inisial || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{nama}</p>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
            Kartu {cari.kartu}
            <CopyButton value={cari.kartu} label={`nomor kartu ${cari.kartu}`} />
          </p>
        </div>
        <BadgeNada tone="slate" className="tabular-nums">
          {periodeTeks}
        </BadgeNada>
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <UbinAngka label="Pelayanan" nilai={list.length} ket="SEP dalam periode" />
        <UbinAngka label="Rawat inap" nilai={inap.length} ket={inap.length > 0 ? `${hariRawat} hari rawat` : "—"} />
        <UbinAngka label="Rawat jalan" nilai={list.length - inap.length} ket="kunjungan" />
        <UbinAngka label="Faskes" nilai={faskes} ket={faskes > 1 ? "termasuk faskes lain" : "pemberi pelayanan"} />
      </dl>

      {inap.length > 0 && inap.length < list.length && (
        <SegmenFilter label="Saring jenis pelayanan" opsi={opsiSaringJenis(inap.length, list.length - inap.length)} value={jenis} onChange={setJenis} />
      )}

      <div className="flex flex-col gap-3">
        {kelompokBulan(tampil).map(([bulan, isi]) => (
          <section key={bulan} className="flex flex-col gap-1.5">
            <h3 className="px-1 text-[11px] font-medium text-muted-foreground tabular-nums">
              {labelBulan(bulan)} · {isi.length} pelayanan
            </h3>
            <ol className="flex flex-col gap-1.5">
              {isi.map((h, i) => (
                <Pelayanan key={h.noSep} h={h} index={i} />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
