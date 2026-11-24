"use client";

// Panel hasil Cari SEP — 4 keadaan (kosong · memuat · ditemukan · galat).
// Ditemukan = "lembar SEP": nomor SEP (angka tabular) + salin, stempel status, diagnosa awal, deret badge
// berwarna (arti tetap, lihat sepShared) → 4 tanggal penting (masa berlaku memberi peringatan)
// → rincian (peserta, kelas, rujukan, kecelakaan, catatan) + linimasa dari data nyata → aksi.
// Komponen shadcn: Card · Empty · Skeleton · Badge · Button. Kartu tanpa garis (border-0,
// bayangan lembut) — selera visual modul BPJS.

import Link from "next/link";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  FileSearch,
  Lock,
  PencilLine,
  CalendarCheck,
  RefreshCw,
  RotateCcw,
  SearchX,
  ShieldAlert,
  Trash2,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { cn } from "@/lib/ui/utils";
import type { BPJSError, SEPRecordExt, SEPStatusInternal } from "@/lib/bpjs/bpjsShared";
import {
  BADGE,
  DOT,
  LAKA_LABEL,
  NAIK_KELAS_LABEL,
  PEMBIAYAAN_LABEL,
  STATUS_META,
  asalLabel,
  errorLabel,
  fmtTglPendek,
  fmtWaktu,
  klsLabel,
  sepTerbuka,
  sisaHari,
  type BadgeTone,
  type SEPResult,
} from "./sepShared";

const EASE = [0.22, 1, 0.36, 1] as const;
// Card shadcn tanpa garis & tanpa jarak bawaan (padding diatur per kartu).
const KARTU = "gap-0 border-0 py-0";

function Muncul({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Kosong / memuat / galat ───────────────────────────────

function Kosong() {
  return (
    <Muncul id="idle" className="h-full">
      <Empty className="h-full min-h-72 gap-3 rounded-xl bg-card p-8 text-card-foreground shadow-sm md:p-8">
        <EmptyHeader className="gap-1">
          <EmptyMedia variant="icon" className="mb-2 size-11 rounded-xl bg-emerald-50 text-emerald-700">
            <FileSearch className="size-5" aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle className="text-sm font-semibold tracking-normal">Belum ada SEP dibuka</EmptyTitle>
          <EmptyDescription className="max-w-xs text-xs/relaxed">
            Masukkan nomor SEP lalu tekan Enter untuk melihat status, tanggal penting, dan rinciannya
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </Muncul>
  );
}

function Memuat() {
  return (
    <Muncul id="loading" className="flex flex-col gap-3">
      <span className="sr-only">Memuat data SEP</span>
      <Card className={cn(KARTU, "gap-3 p-4")} aria-hidden="true">
        <div className="flex justify-between gap-3">
          <Skeleton className="h-6 w-56 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-2/3 rounded-lg" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-18 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]" aria-hidden="true">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </Muncul>
  );
}

const GALAT = {
  slate: { icon: "bg-muted text-muted-foreground", title: "text-foreground", Icon: SearchX },
  amber: { icon: "bg-amber-50 text-amber-700", title: "text-amber-900", Icon: AlertTriangle },
  rose: { icon: "bg-rose-50 text-rose-700", title: "text-rose-900", Icon: WifiOff },
} as const;

function Galat({ error, onRetry, onCariLagi }: { error: BPJSError; onRetry?: () => void; onCariLagi: () => void }) {
  const { title, desc, color, retryable, kode } = errorLabel(error);
  const t = GALAT[color];
  return (
    <Muncul id="error">
      <Card className={cn(KARTU, "items-start gap-4 p-5 sm:flex-row")}>
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", t.icon)}>
          <t.Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle role="heading" aria-level={2} className={cn("text-sm", t.title)}>
              {title}
            </CardTitle>
            {kode && (
              <Badge variant="secondary" className="text-[11px] text-muted-foreground tabular-nums">
                Kode {kode}
              </Badge>
            )}
          </div>
          <CardDescription className="mt-1 text-xs/relaxed">{desc}</CardDescription>
          <div className="mt-3 flex flex-wrap gap-2">
            {retryable && onRetry && (
              <Button size="sm" className="h-8 text-xs" onClick={onRetry}>
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Coba lagi
              </Button>
            )}
            <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={onCariLagi}>
              Ubah pencarian
            </Button>
          </div>
        </div>
      </Card>
    </Muncul>
  );
}

// ── Bagian kartu "ditemukan" ──────────────────────────────

const STATUS_ICON: Record<SEPStatusInternal, typeof CheckCircle2> = {
  Draft: PencilLine,
  Issued: CheckCircle2,
  Updated: RefreshCw,
  Suplesi: ShieldAlert,
  Closed: Lock,
  Deleted: Ban,
};

function Penanda({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <Badge className={cn("gap-1.5 px-2 py-0.5 font-medium", BADGE[tone])}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOT[tone])} />
      {children}
    </Badge>
  );
}

type FaktaTone = "default" | "amber" | "rose";
const FAKTA_TONE: Record<FaktaTone, { box: string; value: string }> = {
  default: { box: "", value: "text-foreground" },
  amber: { box: "bg-amber-50", value: "text-amber-900" },
  rose: { box: "bg-rose-50", value: "text-rose-900" },
};

function Fakta({ label, value, sub, tone = "default" }: { label: string; value: ReactNode; sub?: ReactNode; tone?: FaktaTone }) {
  const t = FAKTA_TONE[tone];
  return (
    <Card className={cn(KARTU, "min-w-0 p-3", t.box)}>
      <CardDescription className="text-[11px] font-medium">{label}</CardDescription>
      <CardTitle className={cn("mt-1 truncate text-sm leading-normal", t.value)}>{value}</CardTitle>
      {sub && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function Bagian({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={cn(KARTU, "p-3", className)}>
      <CardHeader className="p-0">
        <CardTitle role="heading" aria-level={3} className="text-xs">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function Rincian({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
  return (
    <Bagian title={title}>
      <dl className="mt-2 space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 py-1 text-xs">
            <dt className="shrink-0 text-muted-foreground">{k}</dt>
            <dd className="min-w-0 truncate text-right font-medium">{v ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </Bagian>
  );
}

// Nomor/kode memakai Geist Sans (pilihan user) dengan angka tabular agar lebar digit seragam.
function Nomor({ children }: { children: ReactNode }) {
  return <span className="tabular-nums">{children}</span>;
}

interface Langkah {
  key: string;
  label: string;
  waktu?: string;
  oleh?: string;
  tone: BadgeTone;
  selesai: boolean;
}

function Linimasa({ sep }: { sep: SEPRecordExt }) {
  const terbuka = sepTerbuka(sep.statusInternal);
  const langkah: Langkah[] = [
    { key: "terbit", label: "Terbit", waktu: fmtTglPendek(sep.tglTerbit), oleh: sep.audit.createdBy, tone: "emerald", selesai: true },
  ];
  if (sep.audit.updatedAt) {
    langkah.push({ key: "ubah", label: "Diperbarui", waktu: fmtWaktu(sep.audit.updatedAt), oleh: sep.audit.updatedBy, tone: "blue", selesai: true });
  }
  if (sep.tglPulang) {
    langkah.push({ key: "pulang", label: "Pulang", waktu: fmtTglPendek(sep.tglPulang), tone: "cyan", selesai: true });
  } else if (sep.jnsPelayanan === "1" && terbuka) {
    langkah.push({ key: "pulang", label: "Menunggu tanggal pulang", tone: "amber", selesai: false });
  }
  if (sep.statusInternal === "Closed") {
    langkah.push({ key: "tutup", label: "Ditutup", tone: "slate", selesai: true });
  }
  if (sep.audit.deletedAt) {
    langkah.push({ key: "hapus", label: "Dihapus", waktu: fmtWaktu(sep.audit.deletedAt), oleh: sep.audit.deletedBy, tone: "rose", selesai: true });
  }

  return (
    <Bagian title="Linimasa">
      <ol className="mt-2.5 space-y-3">
        {langkah.map((l) => (
          <li key={l.key} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className={cn("mt-1 size-2 shrink-0 rounded-full", DOT[l.tone], !l.selesai && "opacity-40")}
            />
            <div className="min-w-0 text-xs">
              <p className={cn("font-medium", l.selesai ? "text-foreground" : "text-amber-800")}>{l.label}</p>
              {l.waktu && <p className="tabular-nums text-muted-foreground">{l.waktu}</p>}
              {l.oleh && <p className="truncate text-muted-foreground">oleh {l.oleh}</p>}
            </div>
          </li>
        ))}
      </ol>
    </Bagian>
  );
}

function Ditemukan({
  sep,
  onDelete,
  onCariLagi,
}: {
  sep: SEPRecordExt;
  onDelete: (sep: SEPRecordExt) => void;
  onCariLagi: () => void;
}) {
  const meta = STATUS_META[sep.statusInternal];
  const StatusIcon = STATUS_ICON[sep.statusInternal];
  const terbuka = sepTerbuka(sep.statusInternal);
  const ri = sep.jnsPelayanan === "1";
  const laka = sep.jaminan && sep.jaminan.lakaLantas !== "0" ? sep.jaminan : null;
  const naik = sep.klsRawat.klsRawatNaik;

  const penanda: { key: string; tone: BadgeTone; label: string }[] = [
    { key: "jns", tone: ri ? "cyan" : "sky", label: ri ? "Rawat inap" : "Rawat jalan" },
    { key: "kelas", tone: "slate", label: `Hak ${klsLabel(sep.klsRawat.klsRawatHak).toLowerCase()}` },
  ];
  if (naik) penanda.push({ key: "naik", tone: "indigo", label: `Naik ke ${NAIK_KELAS_LABEL[naik] ?? naik}` });
  if (sep.poli.eksekutif === "1") penanda.push({ key: "eks", tone: "indigo", label: "Poli eksekutif" });
  if (sep.cob?.cob === "1") penanda.push({ key: "cob", tone: "indigo", label: "COB" });
  if (sep.rujukan.noRujukan) penanda.push({ key: "rujuk", tone: "teal", label: `Rujukan ${asalLabel(sep.rujukan.asalRujukan)}` });
  if (laka) penanda.push({ key: "laka", tone: "amber", label: LAKA_LABEL[laka.lakaLantas as "1" | "2" | "3"] });
  if (sep.katarak?.katarak === "1") penanda.push({ key: "katarak", tone: "slate", label: "Katarak" });

  const sisa = sisaHari(sep.masaBerlaku.to);
  const berlakuTone: FaktaTone = !terbuka || sisa === null ? "default" : sisa < 0 ? "rose" : sisa <= 3 ? "amber" : "default";
  const berlakuSub =
    sisa === null ? undefined : !terbuka ? `Mulai ${fmtTglPendek(sep.masaBerlaku.from)}` : sisa < 0 ? `Lewat ${-sisa} hari` : sisa === 0 ? "Berakhir hari ini" : `${sisa} hari lagi`;

  return (
    <Muncul id={`found-${sep.noSEP}`} className="flex flex-col gap-3">
      {/* Lembar SEP */}
      <Card className={cn(KARTU, "p-4")}>
        <CardHeader className="flex flex-wrap items-start justify-between gap-3 p-0">
          <div className="min-w-0">
            <CardDescription className="text-[11px]">No. SEP</CardDescription>
            <div className="mt-0.5 flex items-center gap-1">
              <CardTitle role="heading" aria-level={2} className="text-lg leading-snug tracking-wide tabular-nums break-all">
                {sep.noSEP}
              </CardTitle>
              <CopyButton value={sep.noSEP} label="nomor SEP" />
            </div>
          </div>
          <Badge className={cn("gap-1.5 px-2.5 py-1 text-xs", BADGE[meta.tone])}>
            <StatusIcon aria-hidden="true" />
            {meta.label}
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="mt-3 flex items-start gap-2.5">
            <Badge className="shrink-0 rounded-lg bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800 tabular-nums">
              {sep.diagAwal}
            </Badge>
            <p className="text-sm">{sep.diagAwalNama ?? "Nama diagnosa belum tersedia"}</p>
          </div>

          <ul aria-label="Penanda SEP" className="mt-3 flex flex-wrap gap-1.5">
            {penanda.map((p) => (
              <li key={p.key}>
                <Penanda tone={p.tone}>{p.label}</Penanda>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Tanggal penting */}
      <section aria-label="Tanggal penting" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Fakta label="Tanggal terbit" value={fmtTglPendek(sep.tglTerbit)} sub={sep.audit.createdBy ? `oleh ${sep.audit.createdBy}` : undefined} />
        <Fakta label="Berlaku sampai" value={fmtTglPendek(sep.masaBerlaku.to)} sub={berlakuSub} tone={berlakuTone} />
        <Fakta
          label="Tanggal pulang"
          value={sep.tglPulang ? fmtTglPendek(sep.tglPulang) : ri ? "Belum pulang" : "—"}
          sub={!sep.tglPulang && ri && terbuka ? "Perbarui setelah pasien pulang" : undefined}
          tone={!sep.tglPulang && ri && terbuka ? "amber" : "default"}
        />
        <Fakta
          label="Poli tujuan"
          value={<Nomor>{sep.poli.tujuan}</Nomor>}
          sub={sep.dpjpLayan ? <>DPJP <Nomor>{sep.dpjpLayan}</Nomor></> : ri ? "Rawat inap, tanpa DPJP layan" : undefined}
        />
      </section>

      {/* Rincian + linimasa */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="grid content-start gap-3 sm:grid-cols-2">
          <Rincian
            title="Peserta"
            rows={[
              [
                "No. kartu",
                <span key="k" className="inline-flex items-center gap-1">
                  <Nomor>{sep.noKartu}</Nomor>
                  <CopyButton value={sep.noKartu} label="nomor kartu" />
                </span>,
              ],
              ["No. RM", sep.noMR ? <Nomor>{sep.noMR}</Nomor> : "—"],
              ["Telepon", sep.noTelp ? <Nomor>{sep.noTelp}</Nomor> : "—"],
            ]}
          />
          <Rincian
            title="Kelas rawat"
            rows={[
              ["Hak kelas", klsLabel(sep.klsRawat.klsRawatHak)],
              ["Naik ke", naik ? (NAIK_KELAS_LABEL[naik] ?? naik) : "Tidak naik kelas"],
              ...(naik
                ? ([
                    ["Pembiayaan", sep.klsRawat.pembiayaan ? (PEMBIAYAAN_LABEL[sep.klsRawat.pembiayaan] ?? "—") : "—"],
                    ["Penanggung jawab", sep.klsRawat.penanggungJawab ?? "—"],
                  ] as [string, ReactNode][])
                : []),
            ]}
          />
          {sep.rujukan.noRujukan && (
            <Rincian
              title="Rujukan"
              rows={[
                ["Asal", asalLabel(sep.rujukan.asalRujukan)],
                ["No. rujukan", <Nomor key="r">{sep.rujukan.noRujukan}</Nomor>],
                ["Tanggal", fmtTglPendek(sep.rujukan.tglRujukan)],
                ["PPK perujuk", sep.rujukan.ppkRujukan ? <Nomor>{sep.rujukan.ppkRujukan}</Nomor> : "—"],
              ]}
            />
          )}
          {laka && (
            <Rincian
              title="Jaminan kecelakaan"
              rows={[
                ["Jenis", LAKA_LABEL[laka.lakaLantas as "1" | "2" | "3"]],
                ["No. laporan polisi", laka.noLP ? <Nomor>{laka.noLP}</Nomor> : "—"],
                ["Tanggal kejadian", fmtTglPendek(laka.penjamin?.tglKejadian)],
                ["Keterangan", laka.penjamin?.keterangan ?? "—"],
              ]}
            />
          )}
          {sep.catatan && (
            <Bagian title="Catatan" className="sm:col-span-2">
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{sep.catatan}</p>
            </Bagian>
          )}
        </div>
        <Linimasa sep={sep} />
      </div>

      {/* Aksi */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {terbuka ? (
          <>
            <Button asChild size="sm" className="h-8 text-xs">
              <Link href={`/ehis-bpjs/vclaim/sep?tab=update-tgl&update=${encodeURIComponent(sep.noSEP)}`}>
                <CalendarCheck className="size-3.5" aria-hidden="true" />
                Update tgl pulang
              </Link>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 bg-rose-50 text-xs text-rose-700 hover:bg-rose-100"
              onClick={() => onDelete(sep)}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Hapus SEP
            </Button>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            SEP berstatus {meta.label.toLowerCase()} tidak bisa dihapus atau diubah tanggal pulangnya
          </p>
        )}
        <Button size="sm" variant="ghost" className="ml-auto h-8 text-xs" onClick={onCariLagi}>
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Cari SEP lain
        </Button>
      </div>
    </Muncul>
  );
}

// ── Export ────────────────────────────────────────────────

export default function SEPDetailCard({
  result,
  onRetry,
  onDelete,
  onCariLagi,
}: {
  result: SEPResult;
  onRetry?: () => void;
  onDelete: (sep: SEPRecordExt) => void;
  onCariLagi: () => void;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {result.status === "idle" && <Kosong key="idle" />}
      {result.status === "loading" && <Memuat key="loading" />}
      {result.status === "found" && (
        <Ditemukan key={`found-${result.sep.noSEP}`} sep={result.sep} onDelete={onDelete} onCariLagi={onCariLagi} />
      )}
      {result.status === "error" && <Galat key="error" error={result.error} onRetry={onRetry} onCariLagi={onCariLagi} />}
    </AnimatePresence>
  );
}
