"use client";

// Tab "Ringkasan & Info" Detail Kunjungan — 4 Card shadcn: Kunjungan · Penjamin & SEP · Diagnosa ·
// Dokumen. DPJP/tanggal/cara masuk sudah di header (selalu terlihat), jadi tidak diulang di sini.

import {
  ArrowRight, CheckCircle2, CircleDashed, ClipboardList, FilePen, FileText, Hash, ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { KunjunganRecord, UnitKunjungan } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CopyValueButton from "@/components/shared/CopyValueButton";
import { UNIT_CFG } from "../shared";
import type { KunjunganTabId } from "../KunjunganTabs";

interface Props {
  kunjungan: KunjunganRecord;
  icdCodes: string[];
  /** Pindah ke tab lain (mis. Update SEP) — disediakan KunjunganTabs. */
  onNavigate?: (tab: KunjunganTabId) => void;
}

const isBlank = (v: string | undefined) => !v || !v.trim() || v.trim() === "—";

// ─── Kerangka kartu ───────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  action,
  className,
  children,
}: {
  title: string;
  icon: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      <CardHeader className="items-center gap-1 px-4 pt-3.5">
        <CardTitle className="flex items-center gap-2">
          <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Icon className="size-3.5" />
          </span>
          <h2 className="m-sm font-semibold text-slate-800">{title}</h2>
        </CardTitle>
        {action && <CardAction className="self-center">{action}</CardAction>}
      </CardHeader>
      <CardContent className="px-4 pt-3 pb-4">{children}</CardContent>
    </Card>
  );
}

const LABEL = "m-tiny font-medium text-slate-500";

// ─── Kunjungan ────────────────────────────────────────────────

function IdField({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-200/70">
      <dt className={LABEL}>{label}</dt>
      <dd className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "truncate font-mono font-semibold tabular-nums",
            primary ? "text-base text-sky-800" : "m-sm text-slate-800",
          )}
        >
          {value}
        </span>
        {!isBlank(value) && <CopyValueButton value={value} label={label} />}
      </dd>
    </div>
  );
}

function KunjunganCard({ kunjungan: k, className }: { kunjungan: KunjunganRecord; className?: string }) {
  const unit = UNIT_CFG[k.unit as UnitKunjungan];
  return (
    <Section title="Kunjungan" icon={ClipboardList} className={className}>
      <dl className="grid gap-2 sm:grid-cols-2">
        <IdField label="No. Pendaftaran" value={k.noPendaftaran} primary />
        <IdField label="No. Kunjungan" value={k.noKunjungan} />
      </dl>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <div>
          <dt className={LABEL}>Unit</dt>
          <dd className="mt-1">
            <Badge variant="outline" className={cn("border-transparent", unit?.bg, unit?.text)}>
              {k.unit}
            </Badge>
          </dd>
        </div>
        {!isBlank(k.poli) && (
          <div className="min-w-0">
            <dt className={LABEL}>Poli tujuan</dt>
            <dd className="m-sm mt-0.5 truncate font-medium text-slate-800">{k.poli}</dd>
          </div>
        )}
        {!isBlank(k.ruangan) && (
          <div className="min-w-0">
            <dt className={LABEL}>Ruangan</dt>
            <dd className="m-sm mt-0.5 truncate font-medium text-slate-800">{k.ruangan}</dd>
          </div>
        )}
      </dl>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <h3 className={LABEL}>Keluhan utama</h3>
        {isBlank(k.keluhan) ? (
          <p className="m-sm mt-1 italic text-slate-500">Belum diisi</p>
        ) : (
          <p className="m-sm mt-1 border-l-2 border-amber-300 pl-3 leading-relaxed text-slate-700">{k.keluhan}</p>
        )}
      </div>
    </Section>
  );
}

// ─── Penjamin & SEP ───────────────────────────────────────────

function PenjaminCard({
  kunjungan: k,
  onNavigate,
  className,
}: {
  kunjungan: KunjunganRecord;
  onNavigate?: Props["onNavigate"];
  className?: string;
}) {
  const isBpjs = /bpjs/i.test(k.penjamin ?? "");
  const noSep = k.noSEP?.trim();
  const noKartu = k.noPenjamin?.trim();

  return (
    <Section title="Penjamin & SEP" icon={ShieldCheck} className={className}>
      <dl className="space-y-3">
        <div>
          <dt className={LABEL}>Penjamin</dt>
          <dd className="m-sm mt-0.5 font-semibold text-slate-800">
            {isBlank(k.penjamin) ? <span className="font-normal italic text-slate-500">Belum ditentukan</span> : k.penjamin}
          </dd>
        </div>
        <div>
          <dt className={LABEL}>No. kartu</dt>
          <dd className="mt-0.5 flex items-center gap-1">
            {!noKartu || isBlank(noKartu) ? (
              <span className="m-sm italic text-slate-500">Belum diisi</span>
            ) : (
              <>
                <span className="m-sm font-mono font-medium tabular-nums text-slate-800">{noKartu}</span>
                <CopyValueButton value={noKartu} label="No. kartu penjamin" />
              </>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-3 border-t border-slate-100 pt-3">
        {noSep ? (
          <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-inset ring-emerald-200">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="m-tiny font-medium text-emerald-800">SEP terbit</p>
              <p className="m-sm truncate font-mono font-semibold tabular-nums text-emerald-900">{noSep}</p>
            </div>
            <CopyValueButton value={noSep} label="No. SEP" />
          </div>
        ) : isBpjs ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-3 py-2.5">
            <p className="m-sm flex items-center gap-2 font-medium text-slate-700">
              <CircleDashed className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
              Belum ada SEP
            </p>
            {onNavigate && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => onNavigate("update-sep")}
                className="mt-1 h-auto px-0 py-0 text-sky-700"
              >
                Buka Update SEP
                <ArrowRight aria-hidden="true" />
              </Button>
            )}
          </div>
        ) : (
          <p className="m-xs text-slate-500">SEP hanya untuk penjamin BPJS.</p>
        )}
      </div>
    </Section>
  );
}

// ─── Diagnosa ─────────────────────────────────────────────────

function DiagnosaCard({
  kunjungan: k,
  icdCodes,
  className,
}: {
  kunjungan: KunjunganRecord;
  icdCodes: string[];
  className?: string;
}) {
  const hasDesc = !isBlank(k.diagnosa);
  return (
    <Section
      title="Diagnosa"
      icon={Hash}
      className={className}
      action={
        icdCodes.length > 0 ? (
          <Badge variant="secondary" className="tabular-nums">
            {icdCodes.length} kode ICD-10
          </Badge>
        ) : undefined
      }
    >
      {icdCodes.length === 0 && !hasDesc ? (
        <p className="m-sm text-slate-500">Belum ada diagnosa tercatat.</p>
      ) : (
        <>
          {icdCodes.length > 0 && (
            <ul role="list" className="flex flex-wrap gap-1.5" aria-label="Kode ICD-10">
              {icdCodes.map((code) => (
                <li key={code}>
                  <Badge variant="outline" className="m-xs rounded-md border-slate-300 font-mono font-semibold text-slate-800">
                    {code}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          {hasDesc && <p className={cn("m-sm leading-relaxed text-slate-700", icdCodes.length > 0 && "mt-2.5")}>{k.diagnosa}</p>}
        </>
      )}
    </Section>
  );
}

// ─── Dokumen ──────────────────────────────────────────────────

function DokumenCard({ doc, className }: { doc: KunjunganRecord["dokumen"]; className?: string }) {
  const items: { label: string; status: string | undefined; icon: LucideIcon }[] = [
    { label: "General Consent", status: doc?.generalConsent, icon: FileText },
    { label: "Surat Rujukan", status: doc?.rujukan, icon: FilePen },
    { label: "Pengantar Pasien", status: doc?.pengantarPasien, icon: ClipboardList },
  ];
  const isOk = (s: string | undefined) => !!s && s !== "Tidak Ada" && s !== "Belum Ditandatangani";
  const done = items.filter((i) => isOk(i.status)).length;

  return (
    <Section
      title="Dokumen"
      icon={FileText}
      className={className}
      action={
        <Badge
          variant="outline"
          className={cn(
            "border-transparent tabular-nums",
            done === items.length ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
          )}
        >
          {done}/{items.length} lengkap
        </Badge>
      }
    >
      <ul role="list" className="-my-1 divide-y divide-slate-100">
        {items.map(({ label, status, icon: DocIcon }) => {
          const ok = isOk(status);
          return (
            <li key={label} className="flex items-center gap-3 py-2">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg",
                  ok ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400",
                )}
              >
                {ok ? <CheckCircle2 className="size-3.5" /> : <DocIcon className="size-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-sm font-medium text-slate-800">{label}</p>
                <p className={cn("m-xs", ok ? "text-emerald-700" : "text-slate-500")}>{status ?? "Belum tercatat"}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

// ─── Export ───────────────────────────────────────────────────

export function OverviewTab({ kunjungan, icdCodes, onNavigate }: Props) {
  return (
    <div className="mx-auto grid max-w-6xl gap-3 lg:grid-cols-5">
      <KunjunganCard kunjungan={kunjungan} className="lg:col-span-3" />
      <PenjaminCard kunjungan={kunjungan} onNavigate={onNavigate} className="lg:col-span-2" />
      <DiagnosaCard kunjungan={kunjungan} icdCodes={icdCodes} className="lg:col-span-3" />
      <DokumenCard doc={kunjungan.dokumen} className="lg:col-span-2" />
    </div>
  );
}
