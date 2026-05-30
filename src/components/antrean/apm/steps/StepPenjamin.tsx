"use client";

// ANT-ONSITE — Step penjamin: BPJS / Umum.
// BPJS → no. kartu (autofill by NIK) + cek rujukan (mock V-Claim) → pilih.
// Umum → lewati cek rujukan (kuota non-JKN).

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Wallet,
  CreditCard,
  Search,
  FileCheck2,
  FileX2,
  ArrowRight,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { findPesertaByNik } from "@/lib/bpjs/mock/pesertaMock";
import { findRujukansByKartu } from "@/lib/bpjs/mock/rujukanMock";
import { cn } from "@/lib/utils";
import type { CaraBayar, JenisPasienAntrean } from "@/lib/antrean/types";
import { ChoiceCard, KioskButton, KioskField } from "../apmUi";
import { KioskInput } from "../keyboard/KioskInput";
import type { ApmPasien, ApmRujukan } from "../apmTypes";

export interface PenjaminValue {
  caraBayar: CaraBayar;
  noKartu?: string;
  rujukan: ApmRujukan | null;
}

type Phase = "choose" | "bpjs";

function toApmRujukan(r: ReturnType<typeof findRujukansByKartu>[number]): ApmRujukan {
  return {
    noRujukan: r.noRujukan,
    poliKode: r.poli.kode,
    poliNama: r.poli.nama,
    diagnosa: `${r.diagnosa.kode} · ${r.diagnosa.nama}`,
    asalRujukan: r.asalRujukan,
    berlakuSampai: r.masaBerlaku.to,
  };
}

export function StepPenjamin({
  pasien,
  jenisPasien,
  onSubmit,
}: {
  pasien: ApmPasien;
  jenisPasien: JenisPasienAntrean;
  onSubmit: (value: PenjaminValue) => void;
}) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [noKartu, setNoKartu] = useState("");
  const [rujukanList, setRujukanList] = useState<ApmRujukan[] | null>(null);
  const [selected, setSelected] = useState<ApmRujukan | null>(null);

  const enterBpjs = () => {
    // Autofill no. kartu dari NIK bila peserta ditemukan (pasien lama umumnya ada).
    const peserta = findPesertaByNik(pasien.nik);
    if (peserta) setNoKartu(peserta.noKartu);
    setPhase("bpjs");
  };

  const cekRujukan = () => {
    const hasil = findRujukansByKartu(noKartu)
      .filter((r) => r.status !== "Expired")
      .map(toApmRujukan);
    setRujukanList(hasil);
    setSelected(null);
  };

  // ── Pilih BPJS / Umum ──────────────────────────────────
  if (phase === "choose") {
    return (
      <div className="flex flex-col items-center gap-9 pt-4">
        <Heading
          nama={pasien.nama}
          subtitle="Pilih metode penjaminan untuk kunjungan ini."
        />
        <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
          <ChoiceCard
            title="BPJS Kesehatan"
            subtitle="Memerlukan kartu JKN & surat rujukan aktif"
            icon={ShieldCheck}
            accent="indigo"
            className="p-8"
            onClick={enterBpjs}
          />
          <ChoiceCard
            title="Umum / Mandiri"
            subtitle="Pembayaran pribadi atau asuransi lain"
            icon={Wallet}
            accent="cyan"
            className="p-8"
            onClick={() => onSubmit({ caraBayar: "Umum", rujukan: null })}
          />
        </div>
      </div>
    );
  }

  // ── BPJS: kartu + rujukan ──────────────────────────────
  const sudahCek = rujukanList !== null;
  const adaRujukan = (rujukanList?.length ?? 0) > 0;

  return (
    <div className="flex flex-col items-center gap-7 pt-2">
      <Heading nama={pasien.nama} subtitle="Verifikasi kartu BPJS dan surat rujukan Anda." />

      <div className="w-full max-w-xl">
        <KioskField label="Nomor Kartu BPJS / JKN">
          <div className="flex gap-3">
            <div className="flex-1">
              <KioskInput
                value={noKartu}
                onChange={(val) => {
                  setNoKartu(val);
                  setRujukanList(null);
                  setSelected(null);
                }}
                layout="numeric"
                inputMode="numeric"
                maxLength={13}
                placeholder="00012345678…"
                leftIcon={<CreditCard className="h-6 w-6" aria-hidden />}
              />
            </div>
            <KioskButton
              variant="secondary"
              icon={Search}
              disabled={!noKartu.trim()}
              onClick={cekRujukan}
              className="px-6 py-4"
            >
              Cek
            </KioskButton>
          </div>
        </KioskField>
      </div>

      {/* Hasil cek rujukan */}
      {sudahCek && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          {adaRujukan ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <FileCheck2 className="h-5 w-5" aria-hidden />
                {rujukanList!.length} rujukan aktif ditemukan — pilih salah satu:
              </div>
              {rujukanList!.map((r) => (
                <RujukanCard
                  key={r.noRujukan}
                  rujukan={r}
                  selected={selected?.noRujukan === r.noRujukan}
                  onSelect={() => setSelected(r)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-amber-50 p-6 text-center ring-1 ring-amber-200">
              <FileX2 className="h-8 w-8 text-amber-500" aria-hidden />
              <p className="text-base font-semibold text-amber-700">
                Tidak ada rujukan aktif untuk nomor kartu ini.
              </p>
              <p className="text-sm text-amber-600">
                Anda dapat melanjutkan tanpa rujukan — petugas akan memverifikasi di loket.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Aksi lanjut */}
      {sudahCek && (
        <KioskButton
          variant="primary"
          icon={ArrowRight}
          disabled={adaRujukan && !selected}
          onClick={() =>
            onSubmit({ caraBayar: "BPJS", noKartu: noKartu.trim(), rujukan: selected })
          }
          className="w-full max-w-xl"
        >
          {adaRujukan ? "Lanjut dengan Rujukan Terpilih" : "Lanjut Tanpa Rujukan"}
        </KioskButton>
      )}

      <p className="text-xs text-slate-400">
        {jenisPasien === "Lama"
          ? "Nomor kartu diisi otomatis dari data Anda — periksa kembali bila perlu."
          : "Masukkan nomor kartu BPJS Anda lalu tekan Cek."}
      </p>
    </div>
  );
}

function Heading({ nama, subtitle }: { nama: string; subtitle: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">{nama}</p>
      <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-800">Metode Penjamin</h2>
      <p className="mt-2 text-lg text-slate-500">{subtitle}</p>
    </div>
  );
}

function RujukanCard({
  rujukan,
  selected,
  onSelect,
}: {
  rujukan: ApmRujukan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center gap-4 rounded-2xl bg-white p-4 text-left ring-1 transition-all",
        selected
          ? "ring-2 ring-indigo-600 shadow-md"
          : "ring-slate-200 hover:ring-slate-300 hover:shadow-sm",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400",
        )}
      >
        {selected ? <CheckCircle2 className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-slate-800">Poli {rujukan.poliNama}</p>
        <p className="truncate text-sm text-slate-500">{rujukan.diagnosa}</p>
        <p className="mt-0.5 text-xs text-slate-400">
          {rujukan.asalRujukan} · No. {rujukan.noRujukan} · berlaku s/d {rujukan.berlakuSampai}
        </p>
      </div>
    </button>
  );
}
