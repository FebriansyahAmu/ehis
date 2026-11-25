"use client";

// Kartu "Koneksi web service" Beranda BPJS: satu ubin per layanan (V-Claim, Aplicares) berisi status
// sambungan, jejak 20 panggilan terakhir (kiri lama → kanan baru, warna + keterangan teks), dan
// ringkasan terakhir · hari ini · rata-rata. Dinilai dari panggilan EHIS yang tercatat — bukan uji
// koneksi terpisah — sehingga statusnya jujur: tanpa panggilan berarti "Belum ada panggilan".
// Komponen shadcn: Card · Badge · Button · Skeleton.

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KepalaKartu } from "@/components/bpjs/shared/daftarUi";
import { BadgeNada, KARTU } from "@/components/bpjs/shared/vclaimUi";
import { fmtDurasi, nadaDurasi, urlAudit } from "@/components/bpjs/audit/auditShared";
import { waktuRelatif } from "@/components/bpjs/aplicares/ketersediaanShared";
import { cn } from "@/lib/ui/utils";
import { JEJAK, LABEL_HASIL, LABEL_STATUS_LAYANAN, LAYANAN, hasilPanggilan, type HasilPanggilan, type RingkasLayanan } from "./berandaShared";

const WARNA: Record<HasilPanggilan, string> = {
  ok: "bg-emerald-500",
  gagal: "bg-amber-400",
  putus: "bg-rose-500",
};

const NADA_TEKS: Record<string, string> = { rose: "text-rose-700", amber: "text-amber-800" };

function Jejak({ r }: { r: RingkasLayanan }) {
  const kosong = JEJAK - r.jejak.length;
  const kategori = (["ok", "gagal", "putus"] as const).filter((k) => k === "ok" || r.hitung[k] > 0);
  return (
    <div className="flex flex-col gap-1.5">
      {/* Gambar saja — isinya dibacakan lewat keterangan teks di bawahnya. */}
      <div aria-hidden="true" className="flex h-7 items-end gap-0.5">
        {Array.from({ length: kosong }, (_, i) => (
          <span key={`kosong-${i}`} className="h-full flex-1 rounded-[3px] bg-slate-200/70" />
        ))}
        {r.jejak.map((e, i) => (
          <motion.span
            key={e.id}
            initial={{ scaleY: 0.3, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: i * 0.015 }}
            className={cn("h-full flex-1 origin-bottom rounded-[3px]", WARNA[hasilPanggilan(e)])}
          />
        ))}
      </div>
      {r.jejak.length > 0 ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground tabular-nums">
          <span className="sr-only">{r.jejak.length} panggilan terakhir:</span>
          {kategori.map((k) => (
            <span key={k} className="inline-flex items-center gap-1">
              <span aria-hidden="true" className={cn("size-2 rounded-xs", WARNA[k])} />
              {LABEL_HASIL[k]} <span className="font-medium text-foreground">{r.hitung[k]}</span>
            </span>
          ))}
          <span aria-hidden="true" className="ml-auto">
            terbaru →
          </span>
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">Belum ada panggilan tercatat di sesi ini.</p>
      )}
    </div>
  );
}

function Angka({ label, children, ket }: { label: string; children: ReactNode; ket?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="truncate text-xs font-semibold tabular-nums">{children}</dd>
      {ket && <dd className="truncate text-[11px] text-muted-foreground tabular-nums">{ket}</dd>}
    </div>
  );
}

function UbinLayanan({ r, cakupan, sekarang, bolehLog }: { r: RingkasLayanan; cakupan: string; sekarang: number; bolehLog: boolean }) {
  const s = LABEL_STATUS_LAYANAN[r.status];
  const nadaRata = r.rataMs !== null ? nadaDurasi(r.rataMs) : null;
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-xl bg-slate-50 p-3">
      <header className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-semibold">{r.layanan}</h3>
          <p className="text-[11px] text-pretty text-muted-foreground">{cakupan}</p>
        </div>
        <BadgeNada tone={s.tone} titik className="shrink-0 bg-white">
          {s.label}
        </BadgeNada>
      </header>

      <Jejak r={r} />

      <dl className="grid grid-cols-3 gap-2">
        <Angka label="Terakhir" ket={r.terakhir ? fmtDurasi(r.terakhir.durationMs) : undefined}>
          {r.terakhir ? <time dateTime={r.terakhir.timestamp}>{waktuRelatif(r.terakhir.timestamp, sekarang)}</time> : "—"}
        </Angka>
        <Angka label="Hari ini" ket={r.gagalHariIni > 0 ? <span className="text-rose-700">{r.gagalHariIni} gagal</span> : r.hariIni > 0 ? "tanpa gagal" : undefined}>
          {r.hariIni} panggilan
        </Angka>
        <Angka label="Rata-rata" ket={r.jejak.length > 0 ? `${r.jejak.length} terakhir` : undefined}>
          <span className={nadaRata ? NADA_TEKS[nadaRata] : undefined}>{r.rataMs !== null ? fmtDurasi(r.rataMs) : "—"}</span>
        </Angka>
      </dl>

      {bolehLog && (
        <footer className="-mb-1 flex justify-end">
          <Button asChild variant="ghost" size="xs" className="text-emerald-800 hover:bg-white hover:text-emerald-900">
            <Link href={urlAudit({ layanan: r.layanan })}>
              Lihat log<span className="sr-only"> {r.layanan}</span>
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </footer>
      )}
    </article>
  );
}

export default function KartuKoneksi({
  siap,
  layanan,
  sekarang,
  bolehLog,
}: {
  siap: boolean;
  layanan: readonly RingkasLayanan[];
  sekarang: number;
  /** Izin `bpjs.audit:read` — tautan "Lihat log" ke Audit trail. */
  bolehLog: boolean;
}) {
  const id = useId();
  return (
    <Card className={KARTU}>
      <section className="flex flex-col gap-3 py-4">
        <KepalaKartu
          judulId={`${id}-judul`}
          judul="Koneksi web service"
          deskripsi="Dinilai dari panggilan EHIS ke BPJS yang tercatat di sesi ini — bukan uji koneksi terpisah"
        />
        <div className="grid gap-2 px-4 sm:grid-cols-2">
          {!siap
            ? [0, 1].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)
            : layanan.map((r) => (
                <UbinLayanan key={r.layanan} r={r} cakupan={LAYANAN.find((l) => l.nama === r.layanan)?.cakupan ?? ""} sekarang={sekarang} bolehLog={bolehLog} />
              ))}
        </div>
      </section>
    </Card>
  );
}
