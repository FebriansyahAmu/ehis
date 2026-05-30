"use client";

// ANT-ONSITE — Step akhir: struk antrean + cetak. Sukses → checkin sudah ter-emit
// (Baru T1/MenungguAdmisi · Lama T3/MenungguPoli) oleh orchestrator.

import { motion } from "framer-motion";
import { CheckCircle2, Printer, Home, Stethoscope, ClipboardList } from "lucide-react";
import type { AntreanRecord } from "@/lib/antrean/types";
import { KioskButton } from "../apmUi";

function jamFromMs(ms?: number): string {
  if (!ms) return "-";
  return new Date(ms).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function StepStruk({
  record,
  onSelesai,
}: {
  record: AntreanRecord;
  onSelesai: () => void;
}) {
  const isLama = record.jenisPasien === "Lama";
  const estJam = jamFromMs(record.estimasiDilayani);

  return (
    <>
      {/* ── Layar (disembunyikan saat cetak) ── */}
      <div className="flex flex-col items-center gap-7 pt-2 print:hidden">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
        >
          <CheckCircle2 className="h-11 w-11" aria-hidden />
        </motion.span>

        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Antrean Berhasil Diambil
          </h2>
          <p className="mt-2 text-lg text-slate-500">Silakan ambil & simpan struk Anda.</p>
        </div>

        {/* Tiket */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200"
        >
          <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 px-6 py-5 text-center text-white">
            <p className="text-sm font-medium uppercase tracking-wider text-indigo-100">
              Nomor Antrean
            </p>
            <p className="mt-1 text-6xl font-black tracking-tight tabular-nums">
              {record.nomorAntrean}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-6 py-5 text-sm">
            <Row label="Poli" value={record.poli} />
            <Row label="Dokter" value={record.dokter} />
            <Row label="Estimasi Dilayani" value={`± ${estJam}`} />
            <Row label="Penjamin" value={record.caraBayar} />
            <Row label="Jenis Pasien" value={record.jenisPasien} />
            <Row label="Nama" value={record.pasien.nama} />
            <Row label="Kode Booking" value={record.kodebooking} full mono />
          </dl>
        </motion.div>

        {/* Instruksi */}
        <div
          className={`flex w-full max-w-sm items-start gap-3 rounded-2xl p-4 text-sm ${
            isLama ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
          }`}
        >
          {isLama ? (
            <Stethoscope className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          ) : (
            <ClipboardList className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          )}
          <p>
            {isLama ? (
              <>
                Pendaftaran & SEP selesai otomatis. Silakan langsung menuju{" "}
                <span className="font-bold">ruang tunggu poli</span> dan tunggu panggilan.
              </>
            ) : (
              <>
                Silakan menunggu nomor Anda dipanggil ke{" "}
                <span className="font-bold">loket admisi</span> untuk melengkapi data & cetak SEP.
              </>
            )}
          </p>
        </div>

        <div className="flex w-full max-w-sm gap-4">
          <KioskButton variant="secondary" full icon={Printer} onClick={() => window.print()}>
            Cetak Ulang
          </KioskButton>
          <KioskButton variant="primary" full icon={Home} onClick={onSelesai}>
            Selesai
          </KioskButton>
        </div>
        <p className="text-xs text-slate-400">Layar akan kembali otomatis setelah beberapa saat.</p>
      </div>

      {/* ── Area cetak (hanya muncul saat print) ── */}
      <PrintTicket record={record} estJam={estJam} />
    </>
  );
}

function Row({
  label,
  value,
  full,
  mono,
}: {
  label: string;
  value: string;
  full?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`mt-0.5 font-semibold text-slate-700 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

/** Layout struk thermal 58mm — hanya terlihat saat window.print(). */
function PrintTicket({ record, estJam }: { record: AntreanRecord; estJam: string }) {
  return (
    <div className="hidden print:block">
      <div className="mx-auto max-w-[280px] px-2 py-3 text-center font-mono text-[12px] text-black">
        <p className="text-sm font-bold">RS SAKTI HUSADA</p>
        <p className="text-[10px]">Anjungan Pendaftaran Mandiri</p>
        <p className="my-1 text-[10px]">{record.tanggal}</p>
        <div className="my-2 border-y border-dashed border-black py-2">
          <p className="text-[10px]">NOMOR ANTREAN</p>
          <p className="text-4xl font-black">{record.nomorAntrean}</p>
        </div>
        <table className="w-full text-left text-[11px]">
          <tbody>
            <PrintRow label="Poli" value={record.poli} />
            <PrintRow label="Dokter" value={record.dokter} />
            <PrintRow label="Estimasi" value={`± ${estJam}`} />
            <PrintRow label="Penjamin" value={record.caraBayar} />
            <PrintRow label="Pasien" value={record.pasien.nama} />
            <PrintRow label="Jenis" value={record.jenisPasien} />
          </tbody>
        </table>
        <p className="mt-2 break-all text-[10px]">Booking: {record.kodebooking}</p>
        <p className="mt-2 text-[10px]">
          {record.jenisPasien === "Lama"
            ? "Silakan menuju ruang tunggu poli."
            : "Silakan menunggu panggilan loket admisi."}
        </p>
        <p className="mt-2 text-[10px]">Terima kasih · Semoga lekas sehat</p>
      </div>
    </div>
  );
}

function PrintRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="pr-2 align-top text-slate-600">{label}</td>
      <td className="font-semibold">: {value}</td>
    </tr>
  );
}
