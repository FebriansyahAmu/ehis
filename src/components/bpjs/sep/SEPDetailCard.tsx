"use client";

// Panel hasil Cari SEP — 4 keadaan (kosong · memuat · ditemukan · galat).
// Ditemukan = "lembar SEP": nomor SEP mono + salin, stempel status, diagnosa awal, deret badge
// berwarna (arti tetap, lihat sepShared) → 4 tanggal penting (masa berlaku memberi peringatan)
// → rincian (peserta, kelas, rujukan, kecelakaan, catatan) + linimasa dari data nyata → aksi.

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
const PANEL = "rounded-xl bg-card shadow-sm";

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
    <Muncul id="idle" className={cn(PANEL, "flex h-full min-h-72 flex-col items-center justify-center gap-3 p-8 text-center")}>
      <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <FileSearch className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">Belum ada SEP dibuka</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
          Masukkan nomor SEP lalu tekan Enter untuk melihat status, tanggal penting, dan rinciannya
        </p>
      </div>
    </Muncul>
  );
}

function Tulang({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-muted motion-safe:animate-pulse", className)} />;
}

function Memuat() {
  return (
    <Muncul id="loading" className="flex flex-col gap-3">
      <span className="sr-only">Memuat data SEP</span>
      <div className={cn(PANEL, "space-y-3 p-4")}>
        <div className="flex justify-between gap-3">
          <Tulang className="h-6 w-56" />
          <Tulang className="h-6 w-20 rounded-full" />
        </div>
        <Tulang className="h-5 w-2/3" />
        <div className="flex gap-1.5">
          <Tulang className="h-5 w-20 rounded-full" />
          <Tulang className="h-5 w-24 rounded-full" />
          <Tulang className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Tulang key={i} className="h-18 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <Tulang className="h-40 rounded-xl" />
        <Tulang className="h-40 rounded-xl" />
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
    <Muncul id="error" className={cn(PANEL, "flex flex-col items-start gap-4 p-5 sm:flex-row")}>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", t.icon)}>
        <t.Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("text-sm font-semibold", t.title)}>{title}</p>
          {kode && (
            <Badge variant="secondary" className="font-mono text-[11px] text-muted-foreground">
              Kode {kode}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
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
    <div className={cn(PANEL, "min-w-0 p-3", t.box)}>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-semibold", t.value)}>{value}</p>
      {sub && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Rincian({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
  return (
    <section className={cn(PANEL, "p-3")}>
      <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      <dl className="mt-2 space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 py-1 text-xs">
            <dt className="shrink-0 text-muted-foreground">{k}</dt>
            <dd className="min-w-0 truncate text-right font-medium text-foreground">{v ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono">{children}</span>;
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
    <section aria-labelledby="linimasa-judul" className={cn(PANEL, "p-3")}>
      <h3 id="linimasa-judul" className="text-xs font-semibold text-foreground">
        Linimasa
      </h3>
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
    </section>
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
      <section aria-labelledby="sep-nomor" className={cn(PANEL, "p-4")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">No. SEP</p>
            <div className="mt-0.5 flex items-center gap-1">
              <h2 id="sep-nomor" className="font-mono text-lg font-semibold tracking-wide break-all text-foreground">
                {sep.noSEP}
              </h2>
              <CopyButton value={sep.noSEP} label="nomor SEP" />
            </div>
          </div>
          <Badge className={cn("gap-1.5 px-2.5 py-1 text-xs", BADGE[meta.tone])}>
            <StatusIcon aria-hidden="true" />
            {meta.label}
          </Badge>
        </div>

        <div className="mt-3 flex items-start gap-2.5">
          <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-800">
            {sep.diagAwal}
          </span>
          <p className="text-sm text-foreground">{sep.diagAwalNama ?? "Nama diagnosa belum tersedia"}</p>
        </div>

        <ul aria-label="Penanda SEP" className="mt-3 flex flex-wrap gap-1.5">
          {penanda.map((p) => (
            <li key={p.key}>
              <Penanda tone={p.tone}>{p.label}</Penanda>
            </li>
          ))}
        </ul>
      </section>

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
          value={<Mono>{sep.poli.tujuan}</Mono>}
          sub={sep.dpjpLayan ? <>DPJP <Mono>{sep.dpjpLayan}</Mono></> : ri ? "Rawat inap, tanpa DPJP layan" : undefined}
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
                  <Mono>{sep.noKartu}</Mono>
                  <CopyButton value={sep.noKartu} label="nomor kartu" />
                </span>,
              ],
              ["No. RM", sep.noMR ? <Mono>{sep.noMR}</Mono> : "—"],
              ["Telepon", sep.noTelp ? <Mono>{sep.noTelp}</Mono> : "—"],
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
                ["No. rujukan", <Mono key="r">{sep.rujukan.noRujukan}</Mono>],
                ["Tanggal", fmtTglPendek(sep.rujukan.tglRujukan)],
                ["PPK perujuk", sep.rujukan.ppkRujukan ? <Mono>{sep.rujukan.ppkRujukan}</Mono> : "—"],
              ]}
            />
          )}
          {laka && (
            <Rincian
              title="Jaminan kecelakaan"
              rows={[
                ["Jenis", LAKA_LABEL[laka.lakaLantas as "1" | "2" | "3"]],
                ["No. laporan polisi", laka.noLP ? <Mono>{laka.noLP}</Mono> : "—"],
                ["Tanggal kejadian", fmtTglPendek(laka.penjamin?.tglKejadian)],
                ["Keterangan", laka.penjamin?.keterangan ?? "—"],
              ]}
            />
          )}
          {sep.catatan && (
            <section className={cn(PANEL, "p-3 sm:col-span-2")}>
              <h3 className="text-xs font-semibold text-foreground">Catatan</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{sep.catatan}</p>
            </section>
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
