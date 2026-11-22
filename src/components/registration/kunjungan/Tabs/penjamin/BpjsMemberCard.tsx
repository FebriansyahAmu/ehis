"use client";

// Kartu peserta JKN hasil cek kepesertaan — bergaya kartu fisik (gradasi emerald = aktif, slate =
// tidak aktif) + daftar pemeriksaan otomatis: nama vs rekam medis, No. kartu vs jaminan tersimpan,
// status peserta. Tiap baris pemeriksaan = ikon + teks (warna bukan satu-satunya penanda).

import { motion } from "framer-motion";
import {
  AlertTriangle, BadgeCheck, Building2, CheckCircle2, Info, XCircle, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { BpjsData } from "../sep/sepTypes";
import { digitsOnly, fmtTanggal, groupDigits, isFullNoKartu, normName } from "./penjaminConfig";

type CheckTone = "ok" | "warn" | "bad" | "info";

const CHECK_TONE: Record<CheckTone, { Icon: LucideIcon; icon: string; text: string }> = {
  ok: { Icon: CheckCircle2, icon: "text-emerald-600", text: "text-slate-700" },
  warn: { Icon: AlertTriangle, icon: "text-amber-600", text: "text-amber-900" },
  bad: { Icon: XCircle, icon: "text-rose-600", text: "text-rose-800" },
  info: { Icon: Info, icon: "text-sky-600", text: "text-slate-700" },
};

function CheckRow({ tone, children }: { tone: CheckTone; children: React.ReactNode }) {
  const t = CHECK_TONE[tone];
  return (
    <li className="flex items-start gap-2">
      <t.Icon className={cn("mt-0.5 size-3.5 shrink-0", t.icon)} aria-hidden="true" />
      <span className={cn("m-xs leading-snug", t.text)}>{children}</span>
    </li>
  );
}

export function BpjsMemberCard({
  data, patientName, savedNoKartu,
}: {
  data: BpjsData;
  patientName: string;
  /** No. kartu tersimpan pasien (bisa termasker → tidak dibandingkan). */
  savedNoKartu: string;
}) {
  const aktif = data.status === "Aktif";
  const namaCocok = normName(data.nama) === normName(patientName);
  const saved = isFullNoKartu(savedNoKartu) ? digitsOnly(savedNoKartu) : "";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      aria-label={`Kartu peserta JKN ${data.nama}`}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* ── Muka kartu ── */}
      <div
        className={cn(
          "relative isolate overflow-hidden px-4 pt-3.5 pb-4 text-white",
          aktif ? "bg-linear-to-br from-emerald-700 via-emerald-700 to-teal-800" : "bg-linear-to-br from-slate-600 to-slate-800",
        )}
      >
        <span aria-hidden="true" className="absolute -top-12 -right-10 -z-10 size-36 rounded-full bg-white/10" />
        <span aria-hidden="true" className="absolute -right-2 -bottom-14 -z-10 size-28 rounded-full bg-white/5" />

        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 m-tiny font-semibold uppercase tracking-[0.14em] text-white/90">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            JKN · KIS
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 m-tiny font-bold shadow-sm",
              aktif ? "text-emerald-800" : "text-rose-700",
            )}
          >
            {aktif ? <CheckCircle2 className="size-3" aria-hidden="true" /> : <XCircle className="size-3" aria-hidden="true" />}
            {aktif ? "Aktif" : "Tidak aktif"}
          </span>
        </div>

        <p className="mt-3 text-lg leading-tight font-semibold">{data.nama}</p>
        <p className="mt-1 font-mono text-[15px] tracking-[0.12em] tabular-nums text-white/90">
          <span className="sr-only">No. kartu </span>
          {groupDigits(data.noKartu)}
        </p>
      </div>

      {/* ── Atribut kepesertaan ── */}
      <dl className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {[
          ["Jenis", data.jenis],
          ["Hak kelas", data.kelas],
          ["Berlaku s/d", fmtTanggal(data.berlakuSd)],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0 px-3 py-2.5">
            <dt className="m-tiny text-slate-500">{k}</dt>
            <dd className="mt-0.5 truncate m-sm font-semibold text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-start gap-2 px-4 py-2.5">
        <Building2 className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        <p className="min-w-0 m-xs text-slate-600">
          <span className="text-slate-500">FKTP · </span>
          <span className="font-medium text-slate-800">{data.fktp}</span>
        </p>
      </div>

      {/* ── Pemeriksaan otomatis ── */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
        <p className="m-tiny font-semibold uppercase tracking-wider text-slate-500">Pemeriksaan</p>
        <ul className="mt-2 space-y-1.5">
          {aktif ? (
            <CheckRow tone="ok">Peserta aktif — SEP dapat diterbitkan.</CheckRow>
          ) : (
            <CheckRow tone="bad">Peserta tidak aktif — SEP berisiko ditolak. Konfirmasi ke supervisor sebelum lanjut.</CheckRow>
          )}
          {namaCocok ? (
            <CheckRow tone="ok">Nama sesuai data rekam medis.</CheckRow>
          ) : (
            <CheckRow tone="warn">
              Nama di kartu berbeda dengan rekam medis (<b className="font-semibold">{patientName}</b>). Pastikan pasiennya sama.
            </CheckRow>
          )}
          {!saved ? (
            <CheckRow tone="info">Belum ada No. kartu tersimpan — kartu ini jadi jaminan utama pasien.</CheckRow>
          ) : saved === digitsOnly(data.noKartu) ? (
            <CheckRow tone="ok">Sama dengan No. kartu tersimpan.</CheckRow>
          ) : (
            <CheckRow tone="warn">
              Berbeda dari No. kartu tersimpan ({groupDigits(saved)}) — kartu ini akan menggantikannya sebagai jaminan utama.
            </CheckRow>
          )}
        </ul>
      </div>
    </motion.article>
  );
}
