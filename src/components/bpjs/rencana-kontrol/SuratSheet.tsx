"use client";

// Detail surat rencana kontrol / SPRI (V-Claim GET /RencanaKontrol/noSuratKontrol/{no}) di Sheet
// shadcn dari kanan — dulu tab "No. Surat" terpisah yang minta nomor diketik ulang. Isi: jadwal
// (tanggal + hari, poli, dokter), peserta, penerbit, SEP asal (rencana kontrol), dan data PRB
// yang terisi. Aksi: Ubah (membuka form dengan data surat ini) & Hapus (dialog konfirmasi di atas
// Sheet). Surat yang sudah dihapus pada sesi ini ditandai dan aksinya disembunyikan.
// Status memuat diturunkan dari kunci data. Komponen shadcn: Sheet · Badge · Button · Skeleton ·
// Alert.

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { CalendarClock, Pencil, Stethoscope, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { GALAT_KONEKSI, GALAT_TIDAK_ADA } from "@/components/bpjs/shared/galat";
import { fmtTglPendek, hariIniISO } from "@/components/bpjs/shared/tanggal";
import { BadgeNada, GalatVClaim } from "@/components/bpjs/shared/vclaimUi";
import { getNoSuratKontrol } from "@/lib/bpjs/vClaimRencanaKontrol";
import type { BPJSError, RKDetailRecord } from "@/lib/bpjs/bpjsShared";
import { PRB_FIELDS_BY_KODE, PRB_FIELD_LABELS, PRB_LABELS, nilaiPRB } from "./prbShared";
import { JENIS_SURAT, fmtTglHari, jadwalSurat, jenisDariKode, pisahKodeNama, type BarisSurat } from "./rencanaKontrolShared";

type Detail = { kunci: string; ok: true; data: RKDetailRecord } | { kunci: string; ok: false; error: BPJSError };

function Baris({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium">{children}</dd>
    </div>
  );
}

function Isi({ b, ulangKe, onUlang }: { b: BarisSurat; ulangKe: number; onUlang: () => void }) {
  const [hasil, setHasil] = useState<Detail | null>(null);
  const kunci = `${b.noSuratKontrol}#${ulangKe}`;
  const memuat = hasil?.kunci !== kunci;

  useEffect(() => {
    let batal = false;
    getNoSuratKontrol(b.noSuratKontrol)
      .then((res) => {
        if (batal) return;
        setHasil(
          res.ok && res.value.response
            ? { kunci, ok: true, data: res.value.response }
            : { kunci, ok: false, error: res.ok ? GALAT_TIDAK_ADA : res.error },
        );
      })
      .catch(() => {
        if (!batal) setHasil({ kunci, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kunci, b.noSuratKontrol]);

  if (memuat) {
    return (
      <div className="flex flex-col gap-3 px-4" aria-hidden="true">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }
  if (hasil && !hasil.ok) {
    return (
      <div className="px-4">
        <GalatVClaim error={hasil.error} objek="Surat" onUlang={onUlang} />
      </div>
    );
  }
  if (!hasil?.ok) return null;
  const d = hasil.data;
  const spri = jenisDariKode(d.jnsKontrol) === "spri";
  const diag = d.sep ? pisahKodeNama(d.sep.diagnosa) : null;
  const poliAsal = d.sep ? pisahKodeNama(d.sep.poli) : null;
  const prb = d.formPRB.kdStatusPRB;
  const kolomPrb = prb ? PRB_FIELDS_BY_KODE[prb].filter((f) => d.formPRB.data[f] !== null) : [];

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      {/* Jadwal */}
      <div className="flex flex-col gap-2 rounded-xl bg-emerald-50/70 p-3 text-emerald-950">
        <p className="text-[11px] text-emerald-800">Rencana {spri ? "rawat inap" : "kontrol"}</p>
        <p className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
          <CalendarClock className="size-4 text-emerald-700" aria-hidden="true" />
          {fmtTglHari(d.tglRencanaKontrol)}
        </p>
        <p className="text-xs">
          Poli <span className="font-medium">{d.namaPoliTujuan}</span>
          <span className="text-emerald-900/70 tabular-nums"> · {d.poliTujuan}</span>
        </p>
        <p className="flex items-center gap-1.5 text-xs">
          <Stethoscope className="size-3.5 text-emerald-700" aria-hidden="true" />
          {d.namaDokter}
        </p>
      </div>

      <dl className="flex flex-col gap-3">
        <Baris label="Peserta">
          {b.nama}
          {b.noKartu && <span className="block text-[11px] font-normal text-muted-foreground tabular-nums">Kartu {b.noKartu}</span>}
        </Baris>
        <Baris label="Diterbitkan">
          <span className="tabular-nums">{fmtTglPendek(d.tglTerbit)}</span>
          <span className="block text-[11px] font-normal text-muted-foreground">oleh {d.namaDokterPembuat}</span>
        </Baris>
        {b.terbitSEP && <Baris label="SEP kunjungan">{b.terbitSEP === "Sudah" ? "Sudah terbit" : "Belum terbit"}</Baris>}
      </dl>

      {d.sep && diag && poliAsal && (
        <section aria-label="SEP asal" className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold">SEP asal</h3>
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground tabular-nums">
              {d.sep.noSep}
              <CopyButton value={d.sep.noSep} label={`nomor SEP ${d.sep.noSep}`} />
            </span>
          </div>
          <dl className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-[11px] text-muted-foreground">Diagnosa</dt>
              <dd className="text-xs font-medium">
                <span className="tabular-nums">{diag.kode}</span>
                {diag.nama && <span className="font-normal"> · {diag.nama}</span>}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] text-muted-foreground">Poli asal</dt>
              <dd className="text-xs font-medium">{poliAsal.nama || poliAsal.kode}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] text-muted-foreground">Tanggal · jenis</dt>
              <dd className="text-xs font-medium tabular-nums">
                {fmtTglPendek(d.sep.tglSep)} · {d.sep.jnsPelayanan}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] text-muted-foreground">Perujuk</dt>
              <dd className="truncate text-xs font-medium">{d.sep.provPerujuk.nmProviderPerujuk || "—"}</dd>
            </div>
          </dl>
        </section>
      )}

      {!spri && (
        <section aria-label="Program Rujuk Balik" className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold">Program Rujuk Balik</h3>
          {prb ? (
            <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
              <p className="text-xs">
                <span className="font-medium">{PRB_LABELS[prb]}</span>
                <span className="text-muted-foreground tabular-nums"> · kode {prb}</span>
              </p>
              {kolomPrb.length > 0 ? (
                <dl className="grid gap-x-3 gap-y-1.5 sm:grid-cols-2">
                  {kolomPrb.map((f) => (
                    <div key={f} className="flex items-baseline justify-between gap-2 text-[11px]">
                      <dt className="text-muted-foreground">{PRB_FIELD_LABELS[f]}</dt>
                      <dd className="font-medium tabular-nums">{nilaiPRB(f, d.formPRB.data[f])}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-[11px] text-muted-foreground">Data klinis belum diisi</p>
              )}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 p-3 text-[11px] text-muted-foreground">Belum ada formulir PRB pada surat ini</p>
          )}
        </section>
      )}
    </div>
  );
}

export default function SuratSheet({
  surat,
  dihapus,
  onClose,
  onUbah,
  onHapus,
  judulRef,
}: {
  surat: BarisSurat | null;
  dihapus: boolean;
  onClose: () => void;
  onUbah: (b: BarisSurat) => void;
  onHapus: (b: BarisSurat) => void;
  judulRef: RefObject<HTMLHeadingElement | null>;
}) {
  // Surat terakhir tetap tampil selama animasi tutup (props sudah null) — pola adjust-on-render.
  const [tampil, setTampil] = useState(surat);
  if (surat !== null && surat !== tampil) setTampil(surat);
  const [ulang, setUlang] = useState(0);
  const keUbah = useRef(false);

  const j = tampil ? JENIS_SURAT[jenisDariKode(tampil.jnsKontrol)] : null;
  const jadwal = tampil ? jadwalSurat(tampil.tglRencanaKontrol, hariIniISO()) : null;

  return (
    <Sheet open={surat !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        data-accent="emerald"
        className="w-full gap-0 overflow-y-auto border-0 p-0 text-foreground sm:max-w-md"
        onOpenAutoFocus={() => {
          keUbah.current = false;
        }}
        onCloseAutoFocus={(e) => {
          // Ke form ubah: fokus diatur tab tujuan, bukan kembali ke baris yang tersembunyi.
          if (keUbah.current) e.preventDefault();
        }}
      >
        <SheetHeader className="gap-1 p-4 pr-12">
          <SheetDescription className="text-[11px]">Detail {j?.sebutan}</SheetDescription>
          <div className="flex min-w-0 items-center gap-1">
            <SheetTitle ref={judulRef} tabIndex={-1} className="truncate text-sm tracking-wide tabular-nums outline-none">
              {tampil?.noSuratKontrol}
            </SheetTitle>
            {tampil && <CopyButton value={tampil.noSuratKontrol} label={`nomor surat ${tampil.noSuratKontrol}`} />}
          </div>
          {j && jadwal && (
            <div className="flex flex-wrap gap-1.5">
              <BadgeNada tone={j.tone}>{j.label}</BadgeNada>
              {dihapus ? (
                <BadgeNada tone="rose">Dihapus</BadgeNada>
              ) : (
                <BadgeNada tone={jadwal.tone} titik>
                  {jadwal.label}
                </BadgeNada>
              )}
            </div>
          )}
        </SheetHeader>
        {tampil && <Isi key={tampil.noSuratKontrol} b={tampil} ulangKe={ulang} onUlang={() => setUlang((n) => n + 1)} />}
        {tampil && !dihapus && (
          <SheetFooter className="mt-auto flex-row justify-end gap-2 p-4 pt-0">
            <Button variant="ghost" size="sm" onClick={() => onHapus(tampil)} className="text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800">
              <Trash2 aria-hidden="true" />
              Hapus
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                keUbah.current = true;
                onUbah(tampil);
              }}
              className="text-xs"
            >
              <Pencil aria-hidden="true" />
              Ubah surat
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
