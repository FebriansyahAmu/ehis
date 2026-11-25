"use client";

// Ringkasan identitas hasil "Periksa" di form surat: SEP asal (rencana kontrol, V-Claim GET
// /RencanaKontrol/nosep/{noSEP}) atau peserta (SPRI, GET /Peserta/nokartu/{k}). Kartu lembut tanpa
// garis: nama + No. kartu (salin), diagnosa & poli asal (kode dipisah jadi badge), tanggal SEP,
// jenis pelayanan, perujuk / status kepesertaan + hak kelas + FKTP.
// Komponen shadcn: Badge (lewat BadgeNada).

import type { ReactNode } from "react";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { fmtTglPendek } from "@/components/bpjs/shared/tanggal";
import { BadgeNada } from "@/components/bpjs/shared/vclaimUi";
import type { PesertaRecord, SEPUntukRKRecord } from "@/lib/bpjs/bpjsShared";
import { pisahKodeNama } from "./rencanaKontrolShared";

function inisial(nama: string): string {
  return (
    nama
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

function Kepala({ nama, kartu, children }: { nama: string; kartu: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-semibold text-emerald-800">
        {inisial(nama)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{nama}</p>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
          Kartu {kartu}
          <CopyButton value={kartu} label={`nomor kartu ${kartu}`} />
        </p>
      </div>
      {children && <div className="flex flex-wrap gap-1.5">{children}</div>}
    </div>
  );
}

function Pasangan({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-xs font-medium">{children}</dd>
    </div>
  );
}

export function KartuSep({ sep }: { sep: SEPUntukRKRecord }) {
  const diag = pisahKodeNama(sep.diagnosa);
  const poli = pisahKodeNama(sep.poli);
  const inap = sep.jnsPelayanan === "Rawat Inap";
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
      <Kepala nama={sep.peserta.nama} kartu={sep.peserta.noKartu}>
        <BadgeNada tone={inap ? "cyan" : "sky"}>{sep.jnsPelayanan}</BadgeNada>
      </Kepala>
      <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
        <Pasangan label="Diagnosa">
          <span className="tabular-nums">{diag.kode}</span>
          {diag.nama && <span className="font-normal"> · {diag.nama}</span>}
        </Pasangan>
        <Pasangan label="Poli asal">
          {poli.nama || poli.kode}
          {poli.nama && <span className="font-normal text-muted-foreground tabular-nums"> · {poli.kode}</span>}
        </Pasangan>
        <Pasangan label="Tanggal SEP">
          <span className="tabular-nums">{fmtTglPendek(sep.tglSep)}</span>
        </Pasangan>
        <Pasangan label="Perujuk">
          {sep.provPerujuk.nmProviderPerujuk || "—"}
          {sep.provPerujuk.noRujukan && (
            <span className="block truncate font-normal text-muted-foreground tabular-nums">Rujukan {sep.provPerujuk.noRujukan}</span>
          )}
        </Pasangan>
      </dl>
    </div>
  );
}

export function KartuPeserta({ peserta }: { peserta: PesertaRecord }) {
  const aktif = peserta.statusPeserta.kode === "0";
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
      <Kepala nama={peserta.nama} kartu={peserta.noKartu}>
        <BadgeNada tone={aktif ? "emerald" : "rose"} titik>
          {aktif ? "Aktif" : peserta.statusPeserta.keterangan}
        </BadgeNada>
      </Kepala>
      <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
        <Pasangan label="Hak kelas">{peserta.hakKelas.keterangan}</Pasangan>
        <Pasangan label="Jenis peserta">{peserta.jenisPeserta.keterangan}</Pasangan>
        <Pasangan label="Tanggal lahir">
          <span className="tabular-nums">{fmtTglPendek(peserta.tglLahir)}</span>
          <span className="font-normal text-muted-foreground"> · {peserta.sex === "L" ? "Laki-laki" : "Perempuan"}</span>
        </Pasangan>
        <Pasangan label="FKTP">{peserta.provUmum.nmProvider}</Pasangan>
      </dl>
    </div>
  );
}
