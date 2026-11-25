"use client";

// Panel hasil cek kepesertaan — 4 keadaan (kosong · memuat · ditemukan · galat).
// Ditemukan: kartu identitas (garis status di atas + badge teks Aktif/Tidak aktif, nomor bisa
// disalin) → 4 fakta penjaminan (hak kelas disorot aksen sky, masa berlaku memberi peringatan
// amber ≤30 hari / rose bila lewat) → penanda khusus (PRB, COB, SKTM, Dinsos) → rincian → aksi.

import Link from "next/link";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CreditCard,
  FileSearch,
  RotateCcw,
  SearchX,
  ShieldCheck,
  ShieldX,
  UserSearch,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/utils";
import type { BPJSError, PesertaRecord } from "@/lib/bpjs/bpjsShared";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import {
  errorLabel,
  fmtTgl,
  inisial,
  masaBerlaku,
  rapikan,
  sexLabel,
  type KepesertaanResult,
} from "./kepesertaanShared";

const EASE = [0.22, 1, 0.36, 1] as const;
// Kartu tanpa garis tepi — dipisahkan dari latar oleh bayangan halus.
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

// ── Kosong ────────────────────────────────────────────────

function Kosong() {
  return (
    <Muncul id="idle" className={cn(PANEL, "flex h-full min-h-72 flex-col items-center justify-center gap-3 p-8 text-center")}>
      <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <UserSearch className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">Belum ada pencarian</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
          Isi nomor kartu (13 digit) atau NIK (16 digit), pilih tanggal SEP, lalu tekan Enter atau Cek kepesertaan
        </p>
      </div>
    </Muncul>
  );
}

// ── Memuat ────────────────────────────────────────────────

function Tulang({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-muted motion-safe:animate-pulse", className)} />;
}

function Memuat() {
  return (
    <Muncul id="loading" className="flex flex-col gap-3" >
      <span className="sr-only">Memuat data peserta</span>
      <div className={cn(PANEL, "p-4")}>
        <div className="flex items-center gap-3">
          <Tulang className="size-10" />
          <div className="flex-1 space-y-2">
            <Tulang className="h-4 w-1/3" />
            <Tulang className="h-3 w-1/2" />
          </div>
          <Tulang className="h-5 w-16 rounded-full" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Tulang className="h-9" />
          <Tulang className="h-9" />
          <Tulang className="h-9" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Tulang key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Tulang className="h-32 rounded-xl" />
        <Tulang className="h-32 rounded-xl" />
      </div>
    </Muncul>
  );
}

// ── Galat ─────────────────────────────────────────────────

const TONE_GALAT = {
  slate: { icon: "bg-muted text-muted-foreground", title: "text-foreground", Icon: SearchX },
  amber: { icon: "bg-amber-50 text-amber-700", title: "text-amber-900", Icon: AlertTriangle },
  rose: { icon: "bg-rose-50 text-rose-700", title: "text-rose-900", Icon: WifiOff },
} as const;

function Galat({ error, onRetry, onCariLagi }: { error: BPJSError; onRetry?: () => void; onCariLagi: () => void }) {
  const { title, desc, tone, retryable, kode } = errorLabel(error);
  const t = TONE_GALAT[tone];
  return (
    <Muncul id="error" className={cn(PANEL, "flex flex-col items-start gap-4 p-5 sm:flex-row")}>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", t.icon)}>
        <t.Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("text-sm font-semibold", t.title)}>{title}</p>
          {kode && (
            <Badge variant="secondary" className="text-[11px] text-muted-foreground tabular-nums">
              Kode {kode}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {retryable && onRetry && (
            <Button size="sm" onClick={onRetry}>
              <RotateCcw aria-hidden="true" />
              Coba lagi
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={onCariLagi}>
            Ubah pencarian
          </Button>
        </div>
      </div>
    </Muncul>
  );
}

// ── Ditemukan ─────────────────────────────────────────────

function IdCell({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1">
        <span className="truncate text-sm text-foreground tabular-nums">{value ?? "—"}</span>
        {value && <CopyButton value={value} label={label} />}
      </dd>
    </div>
  );
}

type Tone = "default" | "primary" | "amber" | "rose";

const TONE_FAKTA: Record<Tone, { box: string; value: string; bar: string }> = {
  default: { box: "", value: "text-foreground", bar: "bg-emerald-500" },
  primary: { box: "bg-sky-50", value: "text-sky-900", bar: "bg-sky-500" },
  amber: { box: "bg-amber-50", value: "text-amber-900", bar: "bg-amber-500" },
  rose: { box: "bg-rose-50", value: "text-rose-900", bar: "bg-rose-500" },
};

function Fakta({
  label,
  value,
  sub,
  tone = "default",
  besar,
  porsi,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  tone?: Tone;
  besar?: boolean;
  /** 0–1 → bilah tipis di bawah (mis. sisa masa berlaku). */
  porsi?: number;
}) {
  const t = TONE_FAKTA[tone];
  return (
    <div className={cn(PANEL, "min-w-0 p-3", t.box)}>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 truncate font-semibold", besar ? "text-lg leading-6" : "text-sm", t.value)} title={value}>
        {value}
      </p>
      {sub && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p>}
      {porsi !== undefined && (
        <div aria-hidden="true" className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn("h-full origin-left", t.bar)}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: porsi }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          />
        </div>
      )}
    </div>
  );
}

function sisaTeks(hari: number): string {
  if (hari > 365) return `±${Math.floor(hari / 365)} tahun lagi`;
  if (hari > 60) return `±${Math.round(hari / 30)} bulan lagi`;
  return `${hari} hari lagi`;
}

function Rincian({ title, rows, className }: { title: string; rows: [string, ReactNode][]; className?: string }) {
  return (
    <section className={cn(PANEL, "p-3", className)}>
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

function Ditemukan({ peserta, onCariLagi }: { peserta: PesertaRecord; onCariLagi: () => void }) {
  const aktif = peserta.statusPeserta.kode === "0";
  const cob = peserta.cob.nmAsuransi !== null;
  const info = peserta.informasi;
  const masa = masaBerlaku(peserta.tglTMT, peserta.tglTAT);

  const masaTone: Tone =
    !aktif || (masa.sisaHari !== null && masa.sisaHari < 0) ? "rose" : masa.sisaHari !== null && masa.sisaHari <= 30 ? "amber" : "default";
  const masaValue =
    masa.sisaHari === null ? "Tidak tercantum" : masa.sisaHari < 0 ? "Sudah berakhir" : `s.d. ${fmtTgl(peserta.tglTAT)}`;
  const masaSub =
    masa.sisaHari === null ? "TAT kosong di V-Claim" : masa.sisaHari < 0 ? `Berakhir ${fmtTgl(peserta.tglTAT)}` : sisaTeks(masa.sisaHari);

  const penanda: { key: string; label: string; cls: string }[] = [
    info.prolanisPRB && { key: "prb", label: `Prolanis PRB · ${info.prolanisPRB}`, cls: "bg-teal-50 text-teal-800" },
    cob && { key: "cob", label: `COB · ${peserta.cob.nmAsuransi}`, cls: "bg-sky-50 text-sky-800" },
    info.noSKTM && { key: "sktm", label: `SKTM · ${info.noSKTM}`, cls: "bg-amber-50 text-amber-800" },
    info.dinsos && { key: "dinsos", label: `Dinsos · ${info.dinsos}`, cls: "bg-amber-50 text-amber-800" },
  ].filter(Boolean) as { key: string; label: string; cls: string }[];

  return (
    <Muncul id="found" className="flex flex-col gap-3">
      {/* Identitas */}
      <section aria-labelledby="peserta-nama" className={cn(PANEL, "overflow-hidden")}>
        <div aria-hidden="true" className={cn("h-1", aktif ? "bg-emerald-500" : "bg-rose-500")} />
        <div className="flex flex-wrap items-start gap-3 px-4 pt-4 pb-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground"
          >
            {inisial(peserta.nama)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="peserta-nama" className="truncate text-base font-semibold text-foreground">
              {peserta.nama}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {sexLabel(peserta.sex)} · lahir {fmtTgl(peserta.tglLahir)} · {peserta.umur.umurSekarang}
            </p>
          </div>
          <Badge
            className={cn("gap-1.5 px-2.5 py-1", aktif ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}
          >
            {aktif ? <ShieldCheck aria-hidden="true" /> : <ShieldX aria-hidden="true" />}
            {aktif ? "Aktif" : "Tidak aktif"}
            <span className="sr-only">({peserta.statusPeserta.keterangan})</span>
          </Badge>
        </div>
        <div className="space-y-2 px-4 pb-4">
          <dl className="grid gap-3 rounded-lg bg-slate-50 px-3 py-2.5 sm:grid-cols-3">
            <IdCell label="No. kartu" value={peserta.noKartu} />
            <IdCell label="NIK" value={peserta.nik} />
            <IdCell label="No. RM" value={peserta.mr.noMR} />
          </dl>
          {!aktif && (
            <p className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
              <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              Kepesertaan tidak aktif. Periksa tunggakan iuran atau masa berlaku sebelum menerbitkan SEP.
            </p>
          )}
        </div>
      </section>

      {/* Fakta penjaminan */}
      <section aria-label="Ringkasan penjaminan" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Fakta label="Hak kelas" value={`Kelas ${peserta.hakKelas.kode}`} sub={rapikan(peserta.hakKelas.keterangan)} tone="primary" besar />
        <Fakta label="Jenis peserta" value={rapikan(peserta.jenisPeserta.keterangan)} sub={`Kode ${peserta.jenisPeserta.kode}`} />
        <Fakta label="Masa berlaku" value={masaValue} sub={masaSub} tone={masaTone} porsi={aktif ? masa.porsi : 0} />
        <Fakta
          label="FKTP terdaftar"
          value={rapikan(peserta.provUmum.nmProvider)}
          sub={<span className="tabular-nums">{peserta.provUmum.kdProvider}</span>}
        />
      </section>

      {/* Penanda khusus */}
      {penanda.length > 0 && (
        <ul aria-label="Penanda khusus" className="flex flex-wrap gap-1.5">
          {penanda.map((p) => (
            <li key={p.key}>
              <Badge className={cn("px-2 py-0.5", p.cls)}>
                {p.label}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {/* Rincian */}
      <div className={cn("grid gap-3", cob ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
        <Rincian
          title="Data kepesertaan"
          rows={[
            ["Mulai tanggungan (TMT)", fmtTgl(peserta.tglTMT)],
            ["Akhir tanggungan (TAT)", fmtTgl(peserta.tglTAT)],
            ["Cetak kartu", fmtTgl(peserta.tglCetakKartu)],
            ["Umur saat pelayanan", peserta.umur.umurSaatPelayanan],
          ]}
        />
        <Rincian
          title="Kontak & informasi"
          rows={[
            ["Telepon", peserta.mr.noTelepon ? <span className="tabular-nums">{peserta.mr.noTelepon}</span> : "—"],
            ["Prolanis PRB", info.prolanisPRB ?? "—"],
            ["No. SKTM", info.noSKTM ?? "—"],
            ["Dinsos", info.dinsos ?? "—"],
          ]}
        />
        {cob && (
          <Rincian
            title="COB · asuransi tambahan"
            rows={[
              ["Asuransi", peserta.cob.nmAsuransi],
              ["No. polis", peserta.cob.noAsuransi ? <span className="tabular-nums">{peserta.cob.noAsuransi}</span> : "—"],
              ["TMT", fmtTgl(peserta.cob.tglTMT)],
              ["TAT", fmtTgl(peserta.cob.tglTAT)],
            ]}
          />
        )}
      </div>

      {/* Aksi */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {aktif ? (
          <Button asChild size="sm">
            <Link href={`/ehis-registration?peserta=${peserta.noKartu}`}>
              <CreditCard aria-hidden="true" />
              Buat SEP
            </Link>
          </Button>
        ) : (
          <Button size="sm" disabled title="Peserta tidak aktif">
            <CreditCard aria-hidden="true" />
            Buat SEP
          </Button>
        )}
        <Button asChild size="sm" variant="secondary" className="bg-white shadow-sm hover:bg-slate-50">
          <Link href={`/ehis-bpjs/vclaim/rujukan?kartu=${peserta.noKartu}`}>
            <FileSearch aria-hidden="true" />
            Cari rujukan
            <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={onCariLagi} className="ml-auto">
          <RotateCcw aria-hidden="true" />
          Cari peserta lain
        </Button>
      </div>
    </Muncul>
  );
}

// ── Export ────────────────────────────────────────────────

export default function PesertaDetailCard({
  result,
  onRetry,
  onCariLagi,
}: {
  result: KepesertaanResult;
  onRetry?: () => void;
  onCariLagi: () => void;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {result.status === "idle" && <Kosong key="idle" />}
      {result.status === "loading" && <Memuat key="loading" />}
      {result.status === "found" && <Ditemukan key={`found-${result.peserta.noKartu}`} peserta={result.peserta} onCariLagi={onCariLagi} />}
      {result.status === "error" && <Galat key="error" error={result.error} onRetry={onRetry} onCariLagi={onCariLagi} />}
    </AnimatePresence>
  );
}
