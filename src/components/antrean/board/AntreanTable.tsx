"use client";

// ANT2.2 + ANT2.3 — Tabel antrean. Dulu 12 kolom (kontak, tgl lahir, dsb.) yang tumpah ke samping;
// kini 7 kolom yang dipakai loket untuk memutuskan (antrean · pasien · poli · bayar · waktu ·
// status · aksi), sisanya di Sheet detail.
// • Tabel semantik: caption, th scope=col, nomor antrean = row header (th scope=row).
// • Wadah gulir = region bernama + tabIndex 0 (bisa digulir keyboard), header kolom lengket.
// • Wadah sempit (< 56rem, container query — bukan lebar layar) → tiap baris jadi kartu; header
//   kolom disembunyikan dan labelnya disisipkan per sel lewat ::before dari data-label.
// • Satu aksi utama per baris sesuai status (Panggil / Respon) + menu ⋯ (DropdownMenu shadcn).
//   Loket tertutup → tombol tetap bisa ditekan dan mengarahkan ke form Buka loket (aria-disabled).

import { useId } from "react";
import { motion } from "framer-motion";
import { BellRing, Eye, MoreHorizontal, PhoneCall, UserCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BadgeNada } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import { getPoli } from "@/lib/antrean/onsiteMock";
import { getPosConfig } from "@/lib/antrean/posStore";
import type { LoketSession, PanggilanRef } from "@/lib/antrean/loketStore";
import type { AntreanRecord } from "@/lib/antrean/types";
import {
  BayarBadge,
  JenisBadge,
  STATUS_TUNGGU,
  SUMBER_LABEL,
  StatusBadge,
  aksiAntrean,
  fmtDurasi,
  fmtJam,
  menitSejak,
  nadaTunggu,
  usiaTahun,
} from "./boardShared";

const KOLOM = ["Antrean", "Pasien", "Poli & dokter", "Bayar", "Waktu", "Status", "Aksi"] as const;

/** Sel data: garis bawah di tabel; di mode kartu jadi blok berlabel (data-label → ::before). */
const SEL = cn(
  "border-b border-slate-100 px-3 py-2.5 align-middle group-last:border-b-0",
  "@max-4xl:border-0 @max-4xl:p-0 @max-4xl:before:mb-0.5 @max-4xl:before:block @max-4xl:before:text-[11px] @max-4xl:before:text-muted-foreground @max-4xl:before:content-[attr(data-label)]",
);

const NADA_TEKS = { slate: "text-foreground", amber: "text-amber-800", rose: "text-rose-800" } as const;

export interface AksiBaris {
  onDetail: (rec: AntreanRecord) => void;
  onPanggil: (rec: AntreanRecord) => void;
  onPanggilUlang: (rec: AntreanRecord) => void;
  onRespon: (rec: AntreanRecord) => void;
  onBatal: (rec: AntreanRecord) => void;
  /** Aksi ditekan saat loket tertutup → arahkan petugas ke form Buka loket. */
  onPerluLoket: () => void;
}

export function AntreanTable({
  rows,
  caption,
  session,
  panggilan,
  sekarang,
  aksi,
}: {
  rows: AntreanRecord[];
  caption: string;
  session: LoketSession | null;
  panggilan: Record<string, PanggilanRef>;
  sekarang: number;
  aksi: AksiBaris;
}) {
  const id = useId();
  return (
    <div
      role="region"
      tabIndex={0}
      aria-labelledby={`${id}-caption`}
      className="@container max-h-[min(40rem,70dvh)] overflow-auto rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
    >
      <table className="w-full border-separate border-spacing-0 text-left text-xs @max-4xl:block">
        <caption id={`${id}-caption`} className="sr-only">
          {caption}
        </caption>
        <thead className="sticky top-0 z-10 bg-white @max-4xl:hidden">
          <tr>
            {KOLOM.map((k) => (
              <th
                key={k}
                scope="col"
                className="border-b border-slate-100 px-3 py-2 text-[11px] font-medium whitespace-nowrap text-muted-foreground last:text-right"
              >
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="@max-4xl:flex @max-4xl:flex-col @max-4xl:gap-2">
          {rows.map((rec, i) => (
            <Baris
              key={rec.kodebooking}
              rec={rec}
              index={i}
              sekarang={sekarang}
              session={session}
              panggilanRef={panggilan[rec.kodebooking]}
              aksi={aksi}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function namaLoket(ref: PanggilanRef): string | null {
  return getPosConfig(ref.pos)?.loket.find((l) => l.kode === ref.loket)?.nama ?? null;
}

function Baris({
  rec,
  index,
  sekarang,
  session,
  panggilanRef,
  aksi,
}: {
  rec: AntreanRecord;
  index: number;
  sekarang: number;
  session: LoketSession | null;
  panggilanRef?: PanggilanRef;
  aksi: AksiBaris;
}) {
  const a = aksiAntrean(rec);
  const loketAktif = session !== null;
  const poliNama = rec.kodepoli ? (getPoli(rec.kodepoli)?.nama ?? rec.poli) : rec.poli;
  const tunggu = STATUS_TUNGGU.includes(rec.status) ? menitSejak(rec.createdAt, sekarang) : null;
  const usia = usiaTahun(rec.pasien.tglLahir, sekarang);
  const recalls = panggilanRef?.recalls ?? 0;
  const diLoketIni =
    rec.status === "DipanggilAdmisi" && !!session && panggilanRef?.pos === session.pos && panggilanRef?.loket === session.loket;
  const selesai = a.terminal;

  /** Loket tertutup → arahkan ke form Buka loket; terbuka → jalankan aksi. */
  const jalankan = (fn: (r: AntreanRecord) => void) => () => (loketAktif ? fn(rec) : aksi.onPerluLoket());

  // Aksi utama: Panggil (menunggu admisi) atau Respon (sudah dipanggil / di admisi / menunggu poli).
  const utama = a.panggil
    ? { label: "Panggil", ikon: PhoneCall, sr: ` ${rec.nomorAntrean} ke loket`, run: jalankan(aksi.onPanggil) }
    : a.respon
      ? { label: "Respon", ikon: UserCheck, sr: ` kedatangan ${rec.pasien.nama}`, run: jalankan(aksi.onRespon) }
      : null;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index, 10) * 0.02 }}
      className={cn(
        "group transition-colors hover:bg-slate-50/80",
        "@max-4xl:grid @max-4xl:grid-cols-2 @max-4xl:gap-x-3 @max-4xl:gap-y-2.5 @max-4xl:rounded-xl @max-4xl:bg-slate-50 @max-4xl:p-3",
        diLoketIni && "bg-blue-50/60 hover:bg-blue-50 @max-4xl:bg-blue-50/70",
      )}
    >
      {/* Antrean — row header */}
      <th scope="row" className={cn(SEL, "font-normal whitespace-nowrap @max-4xl:col-span-2 @max-4xl:before:hidden")}>
        <span className="flex items-center gap-2 @max-4xl:justify-between">
          <span className={cn("text-sm font-semibold tabular-nums", selesai ? "text-muted-foreground" : "text-foreground")}>
            {rec.nomorAntrean}
          </span>
          <span className="flex flex-wrap items-center gap-1 @4xl:hidden">
            <StatusBadge status={rec.status} />
          </span>
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1">
          <JenisBadge jenis={rec.jenisPasien} />
          <span className="text-[11px] text-muted-foreground">{SUMBER_LABEL[rec.sumber]}</span>
        </span>
      </th>

      {/* Pasien */}
      <td data-label="Pasien" className={cn(SEL, "@max-4xl:col-span-2")}>
        <button
          type="button"
          onClick={() => aksi.onDetail(rec)}
          aria-haspopup="dialog"
          className="max-w-full truncate rounded-sm text-left text-xs font-medium underline-offset-2 outline-none hover:text-emerald-800 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          {rec.pasien.nama}
          <span className="sr-only">, lihat detail antrean {rec.nomorAntrean}</span>
        </button>
        <p className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground tabular-nums">
          {rec.pasien.noRM ? <span>{rec.pasien.noRM}</span> : <span className="font-medium text-amber-800">Belum punya No. RM</span>}
          {usia !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span>{usia} th</span>
            </>
          )}
        </p>
      </td>

      {/* Poli & dokter */}
      <td data-label="Poli & dokter" className={cn(SEL, "min-w-0 @max-4xl:col-span-2")}>
        <p className="truncate font-medium">{poliNama}</p>
        <p className="max-w-56 truncate text-[11px] text-muted-foreground">{rec.dokter}</p>
      </td>

      {/* Bayar */}
      <td data-label="Bayar" className={SEL}>
        <BayarBadge caraBayar={rec.caraBayar} />
      </td>

      {/* Waktu */}
      <td data-label="Waktu" className={cn(SEL, "whitespace-nowrap tabular-nums")}>
        {tunggu !== null ? (
          <p className={cn("font-medium", NADA_TEKS[nadaTunggu(tunggu) as keyof typeof NADA_TEKS] ?? "text-foreground")}>
            Tunggu {fmtDurasi(tunggu)}
          </p>
        ) : (
          <p>Ambil {fmtJam(rec.createdAt)}</p>
        )}
        <p className="text-[11px] text-muted-foreground">Est. poli {fmtJam(rec.estimasiDilayani)}</p>
      </td>

      {/* Status */}
      <td data-label="Status" className={cn(SEL, "@max-4xl:hidden")}>
        <StatusBadge status={rec.status} />
        {panggilanRef && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
            {recalls > 0 && <BellRing className="size-3 text-amber-700" aria-hidden="true" />}
            {recalls > 0 ? `${recalls + 1}× dipanggil` : (namaLoket(panggilanRef) ?? "Dipanggil")}
          </p>
        )}
      </td>

      {/* Aksi */}
      <td className={cn(SEL, "text-right whitespace-nowrap @max-4xl:col-span-2 @max-4xl:before:hidden")}>
        <div className="inline-flex items-center gap-1">
          {utama ? (
            <Button
              type="button"
              size="xs"
              onClick={utama.run}
              aria-disabled={!loketAktif}
              className={cn(
                "bg-emerald-600 text-white hover:bg-emerald-700",
                !loketAktif && "bg-emerald-600/45 hover:bg-emerald-600/60",
              )}
            >
              <utama.ikon aria-hidden="true" />
              {utama.label}
              <span className="sr-only">{utama.sr}</span>
            </Button>
          ) : (
            <BadgeNada tone="slate" className="bg-transparent px-0 text-muted-foreground">
              {a.diLayanan ? "Di layanan" : "Selesai diproses"}
            </BadgeNada>
          )}
          <MenuBaris rec={rec} loketAktif={loketAktif} aksi={aksi} jalankan={jalankan} />
        </div>
      </td>
    </motion.tr>
  );
}

function MenuBaris({
  rec,
  loketAktif,
  aksi,
  jalankan,
}: {
  rec: AntreanRecord;
  loketAktif: boolean;
  aksi: AksiBaris;
  jalankan: (fn: (r: AntreanRecord) => void) => () => void;
}) {
  const a = aksiAntrean(rec);
  const adaAksiLoket = a.panggil || a.ulang || a.respon || a.batal;
  return (
    // modal={false}: Dialog/Sheet yang dibuka dari item menu tidak tertahan kunci pointer-events
    // milik menu yang sedang menutup (masalah umum Radix saat dua lapisan modal bertukar).
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground data-[state=open]:bg-slate-100 data-[state=open]:text-foreground">
          <MoreHorizontal aria-hidden="true" />
          <span className="sr-only">Aksi lain antrean {rec.nomorAntrean}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl border-0 p-1 shadow-lg ring-1 ring-slate-200/70">
        {!loketAktif && adaAksiLoket && (
          <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">Buka loket untuk memproses antrean</DropdownMenuLabel>
        )}
        <DropdownMenuItem className="text-xs" onSelect={() => aksi.onDetail(rec)}>
          <Eye aria-hidden="true" />
          Lihat detail
        </DropdownMenuItem>
        {a.panggil && (
          <DropdownMenuItem className="text-xs" disabled={!loketAktif} onSelect={jalankan(aksi.onPanggil)}>
            <PhoneCall aria-hidden="true" />
            Panggil ke loket
          </DropdownMenuItem>
        )}
        {a.ulang && (
          <DropdownMenuItem className="text-xs" disabled={!loketAktif} onSelect={jalankan(aksi.onPanggilUlang)}>
            <BellRing aria-hidden="true" />
            Panggil ulang
          </DropdownMenuItem>
        )}
        {a.respon && (
          <DropdownMenuItem className="text-xs" disabled={!loketAktif} onSelect={jalankan(aksi.onRespon)}>
            <UserCheck aria-hidden="true" />
            Respon kedatangan
          </DropdownMenuItem>
        )}
        {a.batal && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="text-xs" disabled={!loketAktif} onSelect={jalankan(aksi.onBatal)}>
              <XCircle aria-hidden="true" />
              Batal / tidak hadir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
