"use client";

// ANT-ONSITE — Panel ringkasan data (di samping) agar pasien bisa verifikasi
// data benar/salah sepanjang langkah Penjamin → Poli/Dokter. Live dari wizard state.

import { motion } from "framer-motion";
import {
  IdCard,
  CalendarDays,
  Phone,
  MapPin,
  ShieldCheck,
  Wallet,
  FileCheck2,
  FileX2,
  Stethoscope,
  UserRound,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DOKTER_ONSITE, getPoli } from "@/lib/antrean/onsiteMock";
import type { CaraBayar, JenisPasienAntrean } from "@/lib/antrean/types";
import type { ApmPasien, ApmRujukan } from "./apmTypes";

export function PasienRingkasanPanel({
  pasien,
  jenisPasien,
  caraBayar,
  noKartu,
  rujukan,
  poliKode,
  kodedokter,
}: {
  pasien: ApmPasien;
  jenisPasien: JenisPasienAntrean;
  caraBayar: CaraBayar | null;
  noKartu?: string;
  rujukan: ApmRujukan | null;
  poliKode?: string;
  kodedokter?: string;
}) {
  const poliNama = poliKode ? getPoli(poliKode)?.nama : undefined;
  const dokterNama = kodedokter
    ? DOKTER_ONSITE.find((d) => d.kode === kodedokter)?.nama
    : undefined;

  const isBaru = jenisPasien === "Baru";

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="lg:sticky lg:top-2 self-start"
    >
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        {/* Header identitas */}
        <div className="flex items-center gap-3 bg-gradient-to-br from-slate-800 to-slate-900 px-5 py-4 text-white">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold">
            {pasien.nama.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight">{pasien.nama}</p>
            <span
              className={cn(
                "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                isBaru ? "bg-cyan-400/20 text-cyan-200" : "bg-indigo-400/20 text-indigo-200",
              )}
            >
              <UserRound className="h-3 w-3" /> Pasien {jenisPasien}
            </span>
          </div>
        </div>

        {/* Periksa data hint */}
        <p className="border-b border-slate-100 bg-amber-50/60 px-5 py-2 text-xs font-medium text-amber-700">
          Periksa data Anda. Bila keliru, tekan <span className="font-bold">Kembali</span>.
        </p>

        {/* Identitas */}
        <Section title="Identitas">
          {pasien.noRM && <Item icon={IdCard} label="No. RM" value={pasien.noRM} mono />}
          <Item icon={IdCard} label="NIK" value={pasien.nik || "—"} mono />
          {pasien.tempatLahir && pasien.tempatLahir !== "-" && (
            <Item icon={MapPin} label="Tempat Lahir" value={pasien.tempatLahir} />
          )}
          <Item icon={CalendarDays} label="Tgl Lahir" value={pasien.tglLahir || "—"} />
          {pasien.kontak && pasien.kontak !== "-" && (
            <Item icon={Phone} label="No. HP" value={pasien.kontak} />
          )}
        </Section>

        {/* Penjamin */}
        <Section title="Penjamin">
          {caraBayar ? (
            <Item
              icon={caraBayar === "BPJS" ? ShieldCheck : Wallet}
              label="Metode"
              value={caraBayar === "BPJS" ? "BPJS Kesehatan" : "Umum / Mandiri"}
            />
          ) : (
            <Pending label="Belum dipilih" />
          )}
          {caraBayar === "BPJS" && noKartu && (
            <Item icon={IdCard} label="No. Kartu" value={noKartu} mono />
          )}
          {caraBayar === "BPJS" &&
            (rujukan ? (
              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3 py-2">
                <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-700">Rujukan {rujukan.poliNama}</p>
                  <p className="truncate text-[11px] text-emerald-600">{rujukan.diagnosa}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <FileX2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden /> Tanpa rujukan
              </div>
            ))}
        </Section>

        {/* Tujuan */}
        <Section title="Tujuan" last>
          {poliNama ? (
            <Item icon={Stethoscope} label="Poli" value={poliNama} />
          ) : (
            <Pending label="Memilih poli…" />
          )}
          {dokterNama ? (
            <Item icon={CheckCircle2} label="Dokter" value={dokterNama} tone="indigo" />
          ) : poliNama ? (
            <Pending label="Memilih dokter…" />
          ) : null}
        </Section>
      </div>
    </motion.aside>
  );
}

// ── Pieces ─────────────────────────────────────────────────

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={cn("px-5 py-3.5", !last && "border-b border-slate-100")}>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  value,
  mono,
  tone = "default",
}: {
  icon: typeof IdCard;
  label: string;
  value: string;
  mono?: boolean;
  tone?: "default" | "indigo";
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon
        className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "indigo" ? "text-indigo-500" : "text-slate-300")}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <p className={cn("font-semibold text-slate-700", mono ? "font-mono text-xs" : "text-sm")}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Pending({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm italic text-slate-300">
      <span className="h-2 w-2 animate-pulse rounded-full bg-slate-300" />
      {label}
    </p>
  );
}
