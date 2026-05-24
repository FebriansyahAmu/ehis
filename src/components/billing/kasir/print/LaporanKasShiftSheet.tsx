"use client";

import {
  CheckCircle2, TrendingUp, TrendingDown, AlertTriangle,
} from "lucide-react";
import KopSurat from "../../invoice/modals/print/KopSurat";
import SignatureBlock from "../../invoice/modals/print/SignatureBlock";
import {
  fmtTanggalJam, fmtTanggalLong, terbilang, type PaperSize,
} from "../../invoice/modals/print/printShared";
import { fmtRupiah, METODE_CFG, METODE_ORDER } from "../../invoice/invoiceShared";
import { COUNTER_LIST } from "@/lib/billing/kasirShiftMock";
import {
  totalShiftAll, totalShiftNonTunai, expectedCashOnHand,
  formatDuration, type KasirShift,
} from "@/lib/billing/kasirShiftMock";

interface Props {
  shift: KasirShift;
  paper: PaperSize;
}

/**
 * LaporanKasShiftSheet — A4 sheet untuk arsip tutup shift.
 *
 * Struktur:
 *   1. KOP Surat RS
 *   2. Title strip "LAPORAN TUTUP KAS" + Shift ID + tanggal
 *   3. Identitas Shift (counter, kasir, supervisor, jam buka/tutup, durasi)
 *   4. Rincian Transaksi (5 metode + total + count)
 *   5. Rekonsiliasi Kas (Saldo Awal + Tunai − Refund = Expected vs Actual → Selisih)
 *   6. Catatan kasir
 *   7. Signature 2-col (Kasir / Supervisor)
 *
 * Compliance: BLUD Permendagri 27/2013 — laporan kas harian wajib di-arsip
 * dengan tanda tangan kasir + supervisor + lampiran selisih audit.
 */
export default function LaporanKasShiftSheet({ shift, paper }: Props) {
  const counter = COUNTER_LIST.find((c) => c.id === shift.counter);
  const total = totalShiftAll(shift.totalByMetode);
  const totalNonTunai = totalShiftNonTunai(shift.totalByMetode);
  const expected = expectedCashOnHand(shift);
  const selisih = shift.selisih ?? 0;
  const selisihMode = selisih === 0 ? "balance" : selisih > 0 ? "surplus" : "minus";
  const duration = shift.tutupAt ? formatDuration(shift.bukaAt, shift.tutupAt) : "—";

  return (
    <article
      className="print-area mx-auto bg-white p-7 font-[system-ui,sans-serif] text-slate-900 shadow-sm"
      data-paper={paper}
    >
      <KopSurat />

      {/* Title strip */}
      <div className="page-break-avoid mt-5 text-center">
        <h2 className="text-[18px] font-bold uppercase tracking-[0.3em] text-slate-900">
          Laporan Tutup Kas
        </h2>
        <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-700">
          Shift ID: {shift.id}
        </p>
        <p className="text-[10.5px] text-slate-600">
          Dicetak {fmtTanggalJam(new Date().toISOString())}
        </p>
      </div>

      {/* Identitas Shift */}
      <section className="page-break-avoid mt-5">
        <SectionHeading>1. Identitas Shift</SectionHeading>
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 rounded border border-slate-300 bg-slate-50/40 px-4 py-3 text-[11.5px]">
          <Field label="Counter" value={`${counter?.nama ?? shift.counter} (${shift.counter})`} />
          <Field label="Lokasi" value={counter?.lokasi ?? "—"} />
          <Field label="Kasir" value={shift.kasirNama} bold />
          <Field label="Supervisor" value={shift.supervisor ?? "—"} />
          <Field label="Buka" value={fmtTanggalJam(shift.bukaAt)} mono />
          <Field label="Tutup" value={shift.tutupAt ? fmtTanggalJam(shift.tutupAt) : "—"} mono />
          <Field label="Durasi" value={duration} mono />
          <Field label="Total Transaksi" value={`${shift.totalTransaksi} transaksi`} mono />
        </div>
      </section>

      {/* Rincian Transaksi */}
      <section className="page-break-avoid mt-4">
        <SectionHeading>2. Rincian Transaksi per Metode Bayar</SectionHeading>
        <table className="mt-2 w-full border-collapse text-[11.5px]">
          <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-700">
            <tr>
              <th className="border border-slate-300 px-3 py-1.5 text-left">No</th>
              <th className="border border-slate-300 px-3 py-1.5 text-left">Metode</th>
              <th className="border border-slate-300 px-3 py-1.5 text-left">Keterangan</th>
              <th className="border border-slate-300 px-3 py-1.5 text-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {METODE_ORDER.map((m, idx) => {
              const nominal = shift.totalByMetode[m];
              const cfg = METODE_CFG[m];
              return (
                <tr key={m} className={nominal === 0 ? "text-slate-400" : ""}>
                  <td className="border border-slate-300 px-3 py-1.5 font-mono tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold">
                    {cfg.label}
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5 text-[10.5px] italic">
                    {cfg.hint}
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5 text-right font-mono tabular-nums">
                    {fmtRupiah(nominal)}
                  </td>
                </tr>
              );
            })}
            {/* Refund row */}
            {shift.totalRefund > 0 && (
              <tr className="text-rose-700">
                <td className="border border-slate-300 px-3 py-1.5 font-mono tabular-nums">−</td>
                <td className="border border-slate-300 px-3 py-1.5 font-semibold">Refund</td>
                <td className="border border-slate-300 px-3 py-1.5 text-[10.5px] italic">
                  Pengembalian dana ke pasien (asumsi: dibayar tunai)
                </td>
                <td className="border border-slate-300 px-3 py-1.5 text-right font-mono tabular-nums">
                  −{fmtRupiah(shift.totalRefund)}
                </td>
              </tr>
            )}
            {/* Total row */}
            <tr className="bg-slate-50 font-bold">
              <td className="border-2 border-slate-700 px-3 py-2" colSpan={3}>
                TOTAL PENERIMAAN BERSIH
              </td>
              <td className="border-2 border-slate-700 px-3 py-2 text-right font-mono tabular-nums">
                {fmtRupiah(total - shift.totalRefund)}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1.5 text-[10px] italic text-slate-600">
          Terbilang: <span className="font-medium not-italic">{terbilang(total - shift.totalRefund)}</span>
        </p>
      </section>

      {/* Rekonsiliasi Kas */}
      <section className="page-break-avoid mt-4">
        <SectionHeading>3. Rekonsiliasi Kas Tunai</SectionHeading>
        <table className="mt-2 w-full border-collapse text-[11.5px]">
          <tbody>
            <ReconRow label="Saldo Awal (kas fisik saat buka shift)" value={shift.bukaSaldoAwal} sign="+" />
            <ReconRow label="Penerimaan Tunai" value={shift.totalByMetode.Tunai} sign="+" />
            <ReconRow label="Refund Tunai (asumsi cash)" value={shift.totalRefund} sign="−" tone="rose" />
            <tr className="bg-amber-50 font-bold">
              <td className="border border-amber-300 px-3 py-1.5 text-amber-900">
                = Saldo Tunai Seharusnya (Expected)
              </td>
              <td className="border border-amber-300 px-3 py-1.5 text-right font-mono tabular-nums text-amber-900">
                {fmtRupiah(expected)}
              </td>
            </tr>
            <ReconRow label="Saldo Akhir Aktual (kas fisik saat tutup)" value={shift.tutupSaldoAkhir ?? 0} sign="" bold />
            <tr className={selisihToneCfg(selisihMode).rowCn + " font-bold"}>
              <td className={selisihToneCfg(selisihMode).cellCn + " text-[12px]"}>
                <span className="inline-flex items-center gap-1.5">
                  {selisihToneCfg(selisihMode).icon}
                  Selisih ({selisihToneCfg(selisihMode).label})
                </span>
              </td>
              <td className={selisihToneCfg(selisihMode).cellCn + " text-right font-mono text-[12px] tabular-nums"}>
                {selisih === 0 ? fmtRupiah(0) : `${selisih > 0 ? "+" : ""}${fmtRupiah(selisih)}`}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Total non-tunai info (untuk laporan rekonsiliasi bank) */}
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 rounded border border-slate-300 bg-slate-50/40 px-3 py-2 text-[10.5px]">
          <Field label="Total Non-Tunai" value={fmtRupiah(totalNonTunai)} mono />
          <Field label="Saldo Wajib Disetor (Tunai)" value={fmtRupiah(Math.max(0, expected))} mono bold />
        </div>
      </section>

      {/* Catatan */}
      <section className="page-break-avoid mt-4">
        <SectionHeading>4. Catatan Kasir & Supervisor</SectionHeading>
        <div className="mt-2 min-h-[60px] rounded border border-slate-300 bg-white px-3 py-2 text-[11px] leading-relaxed">
          {shift.tutupCatatan ? (
            <p className="italic text-slate-800">&ldquo;{shift.tutupCatatan}&rdquo;</p>
          ) : (
            <p className="italic text-slate-400">Tidak ada catatan tambahan.</p>
          )}
          {shift.bukaCatatan && (
            <p className="mt-1.5 text-[10px] italic text-slate-500">
              Catatan buka shift: &ldquo;{shift.bukaCatatan}&rdquo;
            </p>
          )}
        </div>
      </section>

      {/* Signature */}
      <SignatureBlock
        leftSlot={{ label: "Petugas Kasir", name: shift.kasirNama }}
        rightSlot={{ label: "Supervisor / Verifikator", name: shift.supervisor ?? "(........................)" }}
        lokasi="Jakarta"
        tanggalISO={shift.tutupAt ?? shift.bukaAt}
      />

      {/* Footer */}
      <footer className="page-break-avoid mt-6 border-t border-slate-300 pt-2 text-[9px] leading-snug text-slate-500">
        <p>
          Laporan ini sah & berlaku sebagai bukti tutup kas shift. Wajib di-arsip minimal 5 tahun
          per Permendagri 27/2013 (BLUD) dan UU PDP 27/2022 (audit finansial).
          Selisih ≠ 0 wajib dilampiri Berita Acara Audit oleh Supervisor Keuangan.
        </p>
        <p className="mt-1">
          Dicetak otomatis oleh sistem EHIS pada{" "}
          {fmtTanggalLong(new Date().toISOString())} · shift ref. <span className="font-mono">{shift.id}</span>
          {paper === "A5" && " · Format A5"}
        </p>
      </footer>
    </article>
  );
}

// ── Sub-components ─────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-slate-400 pb-0.5 text-[11.5px] font-bold uppercase tracking-wider text-slate-800">
      {children}
    </h3>
  );
}

function Field({
  label, value, mono = false, bold = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 text-[11px] leading-snug">
      <dt className="text-slate-500">{label}</dt>
      <dd className={
        (mono ? "font-mono tabular-nums " : "") +
        (bold ? "font-semibold " : "") +
        "text-slate-800"
      }>
        : {value}
      </dd>
    </div>
  );
}

function ReconRow({
  label, value, sign, tone, bold = false,
}: {
  label: string;
  value: number;
  sign: "+" | "−" | "";
  tone?: "rose";
  bold?: boolean;
}) {
  const toneCn = tone === "rose" ? "text-rose-700" : "text-slate-800";
  return (
    <tr className={bold ? "font-semibold" : ""}>
      <td className={"border border-slate-300 px-3 py-1.5 " + toneCn}>
        <span className="mr-2 inline-block w-3 font-mono text-slate-500">{sign}</span>
        {label}
      </td>
      <td className={"border border-slate-300 px-3 py-1.5 text-right font-mono tabular-nums " + toneCn}>
        {fmtRupiah(value)}
      </td>
    </tr>
  );
}

function selisihToneCfg(mode: "balance" | "surplus" | "minus"): {
  label: string;
  rowCn: string;
  cellCn: string;
  icon: React.ReactNode;
} {
  if (mode === "balance") {
    return {
      label: "Balance",
      rowCn: "bg-emerald-50",
      cellCn: "border-2 border-emerald-400 px-3 py-2 text-emerald-800",
      icon: <CheckCircle2 size={13} className="text-emerald-700" />,
    };
  }
  if (mode === "surplus") {
    return {
      label: "Surplus",
      rowCn: "bg-sky-50",
      cellCn: "border-2 border-sky-400 px-3 py-2 text-sky-800",
      icon: <TrendingUp size={13} className="text-sky-700" />,
    };
  }
  return {
    label: "Minus — Audit Required",
    rowCn: "bg-rose-50",
    cellCn: "border-2 border-rose-400 px-3 py-2 text-rose-800",
    icon: <AlertTriangle size={13} className="text-rose-700" />,
  };
}
