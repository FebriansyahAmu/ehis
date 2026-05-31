"use client";

// ANT2.2 + ANT2.3 — Tabel antrean + aksi baris (Panggil · Respon Kedatangan · Batal).
// Aksi nonaktif bila loket belum dibuka.

import { motion } from "framer-motion";
import { PhoneCall, BellRing, UserCheck, XCircle, Ticket, Clock, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPoli } from "@/lib/antrean/onsiteMock";
import { loketLabel } from "@/lib/antrean/posStore";
import type { PanggilanRef } from "@/lib/antrean/loketStore";
import type { AntreanRecord } from "@/lib/antrean/types";
import { StatusBadge, JenisBadge, BayarBadge, fmtJam, fmtTglLahir } from "./boardShared";

const COLS = [
  "Pos · Loket",
  "Jenis",
  "No. Antrean",
  "Poli Tujuan",
  "Dokter",
  "Bayar",
  "No. RM",
  "Nama",
  "Kontak",
  "Tgl Lahir",
  "Status",
  "Aksi",
];

export function AntreanTable({
  rows,
  loketAktif,
  panggilan,
  onPanggil,
  onPanggilUlang,
  onRespon,
  onBatal,
}: {
  rows: AntreanRecord[];
  loketAktif: boolean;
  panggilan: Record<string, PanggilanRef>;
  onPanggil: (rec: AntreanRecord) => void;
  onPanggilUlang: (rec: AntreanRecord) => void;
  onRespon: (rec: AntreanRecord) => void;
  onBatal: (rec: AntreanRecord) => void;
}) {
  if (rows.length === 0) return <EmptyState />;

  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {COLS.map((c) => (
              <th
                key={c}
                className="whitespace-nowrap px-3 py-2.5 m-tiny font-bold uppercase tracking-wide text-slate-400 last:text-right"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((rec, i) => (
            <Row
              key={rec.kodebooking}
              rec={rec}
              index={i}
              loketAktif={loketAktif}
              panggilanRef={panggilan[rec.kodebooking]}
              onPanggil={onPanggil}
              onPanggilUlang={onPanggilUlang}
              onRespon={onRespon}
              onBatal={onBatal}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  rec,
  index,
  loketAktif,
  panggilanRef,
  onPanggil,
  onPanggilUlang,
  onRespon,
  onBatal,
}: {
  rec: AntreanRecord;
  index: number;
  loketAktif: boolean;
  panggilanRef?: PanggilanRef;
  onPanggil: (rec: AntreanRecord) => void;
  onPanggilUlang: (rec: AntreanRecord) => void;
  onRespon: (rec: AntreanRecord) => void;
  onBatal: (rec: AntreanRecord) => void;
}) {
  const poliNama = rec.kodepoli ? getPoli(rec.kodepoli)?.nama ?? rec.poli : rec.poli;
  const terminal = rec.status === "Selesai" || rec.status === "Batal" || rec.status === "TidakHadir";
  const sudahDipanggil = rec.status === "DipanggilAdmisi" || rec.status === "DilayaniAdmisi";
  const isDipanggil = rec.status === "DipanggilAdmisi";
  const canPanggil = loketAktif && rec.status === "MenungguAdmisi";
  const canUlang = loketAktif && isDipanggil;
  const canRespon = loketAktif && (sudahDipanggil || rec.status === "MenungguPoli");
  const recalls = panggilanRef?.recalls ?? 0;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className={cn(
        "border-b border-slate-100 align-middle transition-colors last:border-0",
        rec.status === "Selesai" ? "bg-emerald-50/60 hover:bg-emerald-50" : "hover:bg-sky-50/30",
      )}
    >
      {/* Pos · Loket */}
      <td className="whitespace-nowrap px-3 py-2.5 m-xs text-slate-500">
        {panggilanRef ? loketLabel(panggilanRef.pos, panggilanRef.loket) : <span className="text-slate-300">—</span>}
      </td>

      {/* Jenis */}
      <td className="px-3 py-2.5"><JenisBadge jenis={rec.jenisPasien} /></td>

      {/* No. Antrean */}
      <td className="whitespace-nowrap px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 m-base font-extrabold tabular-nums text-sky-700">
          <Ticket className="h-3.5 w-3.5 text-sky-400" />
          {rec.nomorAntrean}
        </span>
      </td>

      {/* Poli Tujuan: angka antrian / estimasi jam / nama poli */}
      <td className="px-3 py-2.5">
        <p className="m-sm font-semibold text-slate-700">{poliNama}</p>
        <p className="flex items-center gap-2 m-tiny text-slate-400">
          <span className="tabular-nums">Antrian #{rec.angkaAntrean}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {fmtJam(rec.estimasiDilayani)}
          </span>
        </p>
      </td>

      {/* Dokter */}
      <td className="px-3 py-2.5 m-xs text-slate-600">{rec.dokter}</td>

      {/* Bayar */}
      <td className="px-3 py-2.5"><BayarBadge caraBayar={rec.caraBayar} /></td>

      {/* No. RM */}
      <td className="whitespace-nowrap px-3 py-2.5 m-xs font-mono text-slate-500">
        {rec.pasien.noRM ?? <span className="text-slate-300">baru</span>}
      </td>

      {/* Nama */}
      <td className="px-3 py-2.5 m-sm font-semibold text-slate-700">{rec.pasien.nama}</td>

      {/* Kontak */}
      <td className="whitespace-nowrap px-3 py-2.5 m-xs text-slate-500">{rec.pasien.kontak ?? "—"}</td>

      {/* Tgl Lahir */}
      <td className="whitespace-nowrap px-3 py-2.5 m-xs text-slate-500">{fmtTglLahir(rec.pasien.tglLahir)}</td>

      {/* Status */}
      <td className="px-3 py-2.5">
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={rec.status} />
          {recalls > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 m-mini font-semibold text-amber-700">
              <BellRing className="h-3 w-3" /> Dipanggil {recalls + 1}×
            </span>
          )}
        </div>
      </td>

      {/* Aksi */}
      <td className="whitespace-nowrap px-3 py-2.5 text-right">
        {terminal ? (
          <span className="m-tiny italic text-slate-300">selesai diproses</span>
        ) : (
          <div className="inline-flex items-center gap-1">
            {isDipanggil ? (
              <ActionBtn
                title={loketAktif ? "Panggil ulang (pasien belum hadir)" : "Buka loket dahulu"}
                icon={BellRing}
                tone="amber"
                disabled={!canUlang}
                onClick={() => onPanggilUlang(rec)}
              />
            ) : (
              <ActionBtn
                title={canPanggil ? "Panggil ke loket" : sudahDipanggil ? "Sudah dipanggil" : "Hanya untuk Menunggu Admisi"}
                icon={PhoneCall}
                tone="sky"
                disabled={!canPanggil}
                onClick={() => onPanggil(rec)}
              />
            )}
            <ActionBtn
              title={loketAktif ? "Respon kedatangan → registrasi" : "Buka loket dahulu"}
              icon={UserCheck}
              tone="emerald"
              disabled={!canRespon}
              onClick={() => onRespon(rec)}
            />
            <ActionBtn
              title={loketAktif ? "Batal / tidak hadir" : "Buka loket dahulu"}
              icon={XCircle}
              tone="rose"
              disabled={!loketAktif}
              onClick={() => onBatal(rec)}
            />
          </div>
        )}
      </td>
    </motion.tr>
  );
}

const TONE: Record<string, string> = {
  sky: "text-sky-600 hover:bg-sky-50",
  amber: "text-amber-600 hover:bg-amber-50",
  emerald: "text-emerald-600 hover:bg-emerald-50",
  rose: "text-rose-600 hover:bg-rose-50",
};

function ActionBtn({
  title,
  icon: Icon,
  tone,
  disabled,
  onClick,
}: {
  title: string;
  icon: typeof PhoneCall;
  tone: keyof typeof TONE;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        disabled ? "cursor-not-allowed text-slate-300" : TONE[tone],
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white py-16 ring-1 ring-slate-200">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Ticket className="h-7 w-7" />
      </span>
      <p className="m-base font-bold text-slate-600">Belum ada antrean</p>
      <p className="max-w-sm text-center m-xs text-slate-400">
        Antrean dari kiosk APM & Mobile JKN akan tampil di sini. Luncurkan layar kiosk untuk membuat antrean onsite.
      </p>
      <Link
        href="/ehis-antrian/apm"
        target="_blank"
        className="mt-1 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 m-sm font-semibold text-white transition hover:bg-sky-700"
      >
        <MonitorSmartphone className="h-4 w-4" /> Buka Mode APM
      </Link>
    </div>
  );
}
