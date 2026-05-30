"use client";

/**
 * ReconciliationPrintTemplate — A4 print-only template EK7.4.
 *
 * Hidden on screen (display:none). Activated by window.print() dari DetailHeader.
 * Uses global @media print injection via <style> tag to isolate print area.
 * Format: A4 portrait, KOP RS, tabel klaim + ringkasan selisih + signature row.
 */

import type { ReconciliationRecord } from "@/lib/eklaim/eklaimShared";
import { formatRupiah } from "@/lib/eklaim/money";
import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";

import {
  getReconViewStatus,
  RECON_STATUS_CFG,
  getPenjaminDisplay,
  getConfidenceCfg,
  findClaimById,
  fmtDateShort,
  fmtDatetime,
} from "./reconciliationShared";

const PRINT_ID = "recon-print-area";

export default function ReconciliationPrintTemplate({
  record,
}: {
  record: ReconciliationRecord;
}) {
  const status = getReconViewStatus(record);
  const statusCfg = RECON_STATUS_CFG[status];
  const penjamin = getPenjaminDisplay(record.penjaminId);

  const totalMatched = record.matchedClaims.reduce(
    (acc, m) => acc + m.amount,
    0n,
  );
  const totalTarifRS = record.matchedClaims.reduce((acc, m) => {
    const c = findClaimById(m.claimId);
    return acc + (c?.tarifRS ?? 0n);
  }, 0n);
  const totalApproved = record.matchedClaims.reduce((acc, m) => {
    const c = findClaimById(m.claimId);
    return acc + (c?.approvedAmount ?? 0n);
  }, 0n);
  const selisih = record.selisih ?? 0n;
  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Inject @media print isolation — hides screen UI, shows only this area */}
      <style>{`
        @media print {
          body > * { visibility: hidden; }
          #${PRINT_ID}, #${PRINT_ID} * { visibility: visible; }
          #${PRINT_ID} { position: fixed; inset: 0; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      <div id={PRINT_ID} className="hidden print:block">
        {/* A4 page container */}
        <div className="w-[794px] min-h-[1123px] bg-white p-8 font-sans text-slate-900">
          <KopSuratEklaim variant="full" />

          {/* Report title */}
          <div className="mt-5 border-b border-slate-300 pb-3 text-center">
            <h2 className="text-[14px] font-bold uppercase tracking-wide">
              LAPORAN REKONSILIASI TRANSFER PEMBAYARAN
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              No. Transfer: {record.noTransfer} &nbsp;·&nbsp; Penjamin:{" "}
              {penjamin.label} &nbsp;·&nbsp; Periode: {record.periodeKlaim}
            </p>
          </div>

          {/* Transfer info */}
          <div className="mt-4">
            <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Informasi Transfer
            </h3>
            <table className="w-full border-collapse text-[11px]">
              <tbody>
                {(
                  [
                    ["No. Transfer", record.noTransfer],
                    ["Nominal Transfer", formatRupiah(record.nominalTransfer)],
                    ["Bank", record.bank],
                    ["Penjamin", penjamin.label],
                    ["Tanggal Transfer", fmtDateShort(record.tanggalTransfer)],
                    ["Periode Klaim", record.periodeKlaim],
                    ["Status Rekonsiliasi", statusCfg.label],
                    ["Diselesaikan Oleh", record.completedBy ?? "—"],
                    [
                      "Diselesaikan Pada",
                      record.completedAt
                        ? fmtDatetime(record.completedAt)
                        : "—",
                    ],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <tr key={label} className="border-b border-slate-100">
                    <td className="w-[180px] py-1 pr-4 font-medium text-slate-500">
                      {label}
                    </td>
                    <td className="py-1 text-slate-900">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Matched claims table */}
          <div className="mt-5">
            <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Daftar Klaim Tercocokkan ({record.matchedClaims.length})
            </h3>
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-100">
                  {[
                    "No",
                    "No. Klaim",
                    "Pasien",
                    "Diagnosa",
                    "Confidence",
                    "Tarif RS",
                    "Disetujui",
                    "Dibayar",
                    "Selisih",
                  ].map((h) => (
                    <th
                      key={h}
                      className="border border-slate-300 px-2 py-1 text-left font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {record.matchedClaims.map((match, idx) => {
                  const claim = findClaimById(match.claimId);
                  const approved = claim?.approvedAmount;
                  const selisihKlaim =
                    approved !== undefined ? approved - match.amount : undefined;
                  const confCfg = getConfidenceCfg(match.matchingConfidence);
                  return (
                    <tr
                      key={match.claimId}
                      className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                    >
                      <td className="border border-slate-200 px-2 py-1 text-center">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 font-mono">
                        {claim?.noKlaim ?? match.claimId}
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        {claim?.pasienId ?? "—"}
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        {claim?.diagnosaPrimer?.kode ?? "—"}
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        {confCfg.label}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-right font-mono">
                        {claim ? formatRupiah(claim.tarifRS) : "—"}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-right font-mono">
                        {approved !== undefined ? formatRupiah(approved) : "—"}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-right font-mono font-bold">
                        {formatRupiah(match.amount)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-right font-mono">
                        {selisihKlaim === undefined
                          ? "—"
                          : selisihKlaim === 0n
                            ? "Nihil"
                            : (selisihKlaim > 0n ? "+" : "-") +
                              formatRupiah(
                                selisihKlaim < 0n
                                  ? -selisihKlaim
                                  : selisihKlaim,
                              )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td
                    colSpan={5}
                    className="border border-slate-300 px-2 py-1.5 text-right font-semibold"
                  >
                    Total
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                    {formatRupiah(totalTarifRS)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                    {totalApproved > 0n ? formatRupiah(totalApproved) : "—"}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                    {formatRupiah(totalMatched)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                    {selisih > 0n ? formatRupiah(selisih) : "Nihil"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Selisih note */}
          {selisih > 0n && (
            <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-[11px]">
              <p className="font-bold text-amber-800">Catatan Selisih:</p>
              <p className="mt-0.5 text-amber-700">
                Nominal Transfer ({formatRupiah(record.nominalTransfer)}) ≠
                Total Dicocokkan ({formatRupiah(totalMatched)}). Selisih:{" "}
                {formatRupiah(selisih)}. Status penanganan:{" "}
                <strong>{record.statusSelisih ?? "Pending"}</strong>.
              </p>
            </div>
          )}

          {/* Signature row */}
          <div className="mt-10 grid grid-cols-3 gap-6 text-center text-[11px]">
            {["Tim Klaim", "Kepala Keuangan", "Direktur RS"].map((role) => (
              <div key={role}>
                <p>Yang bertanda tangan,</p>
                <div className="mb-[56px]" />
                <div className="border-b border-slate-700" />
                <p className="mt-1 font-semibold">{role}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 border-t border-slate-200 pt-2 text-center text-[9px] text-slate-400">
            Dicetak: {today} &nbsp;·&nbsp; EHIS SIMRS &nbsp;·&nbsp; Dokumen
            dihasilkan secara elektronik — tidak memerlukan tanda tangan basah
          </div>
        </div>
      </div>
    </>
  );
}
