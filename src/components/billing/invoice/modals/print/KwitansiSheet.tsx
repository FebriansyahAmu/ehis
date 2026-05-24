"use client";

import type { InvoiceDetail, PaymentRecord } from "../../invoiceShared";
import { fmtRupiah } from "../../invoiceShared";
import KopSurat from "./KopSurat";
import SignatureBlock from "./SignatureBlock";
import { fmtTanggalJam, terbilang, type PaperSize } from "./printShared";

interface Props {
  detail: InvoiceDetail;
  payment: PaymentRecord;
  paper: PaperSize;
}

/**
 * KwitansiSheet — bukti pembayaran per-record (single deposit / payment).
 *
 * Format Indonesian klasik:
 *   - "Telah diterima dari" + nama pasien
 *   - "Sejumlah" + nominal Rupiah besar
 *   - "Terbilang" italic Indonesian
 *   - "Untuk pembayaran" + ringkasan + ref invoice
 *   - Tanda tangan 2-kolom (penyetor kiri, kasir kanan)
 */
export default function KwitansiSheet({ detail, payment, paper }: Props) {
  const isRefund = payment.kategori === "Refund";
  const isVoided = payment.voided;
  const absNominal = Math.abs(payment.nominal);

  return (
    <article
      className="print-area mx-auto bg-white p-6 font-[system-ui,sans-serif] text-slate-900 shadow-sm"
      data-paper={paper}
    >
      <KopSurat />

      {/* Title strip */}
      <div className="page-break-avoid mt-4 text-center">
        <h2 className="text-[20px] font-bold uppercase tracking-[0.3em] text-slate-900">
          {isRefund ? "Kwitansi Refund" : "Kwitansi"}
        </h2>
        <p className="mt-1 font-mono text-[11.5px] tabular-nums text-slate-700">
          No. {payment.noKwitansi}
        </p>
        {isVoided && (
          <p className="mt-1 inline-block rounded border-2 border-rose-600 px-3 py-0.5 text-[10.5px] font-bold uppercase tracking-widest text-rose-700">
            VOIDED · TIDAK BERLAKU
          </p>
        )}
      </div>

      {/* Body */}
      <section className="page-break-avoid mt-5 space-y-3 text-[12px] leading-relaxed">
        <Row label="Telah diterima dari">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-900">
            {detail.pasien.nama}
          </p>
          <p className="font-mono text-[10.5px] text-slate-600">
            No RM: {detail.pasien.noRM}
          </p>
        </Row>

        <Row label="Sejumlah">
          <p className="font-mono text-[20px] font-bold tabular-nums text-slate-900">
            {isRefund ? "−" : ""}{fmtRupiah(absNominal)}
          </p>
        </Row>

        <Row label="Terbilang">
          <p className="rounded border-l-2 border-slate-700 bg-slate-50 px-3 py-1.5 text-[12px] italic text-slate-800">
            {terbilang(absNominal)}
          </p>
        </Row>

        <Row label="Untuk pembayaran">
          <p className="text-[11.5px] leading-snug text-slate-800">
            {isRefund
              ? "Pengembalian (refund) dana atas pembayaran sebelumnya"
              : payment.kategori === "Deposit"
                ? "Deposit / uang muka pelayanan kesehatan"
                : "Pembayaran biaya pelayanan kesehatan"}{" "}
            atas nama tagihan{" "}
            <span className="font-mono">{detail.noTagihan}</span>
            {" "}(kunjungan{" "}
            <span className="font-mono">{detail.noKunjungan}</span>
            {", "}{detail.unit} · Kelas {detail.kelas}
            {").  "}
          </p>
          {payment.catatan && (
            <p className="mt-1 text-[10.5px] italic text-slate-600">
              Catatan: &ldquo;{payment.catatan}&rdquo;
            </p>
          )}
        </Row>

        <Row label="Metode">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11px]">
            <span className="font-semibold">{payment.metode}</span>
            {payment.bank && <span>· Bank: <span className="font-semibold">{payment.bank}</span></span>}
            {payment.noRef && (
              <span>· No Ref: <span className="font-mono tabular-nums">{payment.noRef}</span></span>
            )}
          </div>
        </Row>

        <Row label="Tanggal terima">
          <p className="text-[11.5px]">
            {fmtTanggalJam(payment.tanggalISO)}
          </p>
        </Row>

        {payment.refundOf && (
          <Row label="Refund atas kwitansi">
            <p className="font-mono text-[11px] tabular-nums text-slate-700">
              {detail.payments.find((p) => p.id === payment.refundOf)?.noKwitansi ?? payment.refundOf}
            </p>
          </Row>
        )}
      </section>

      {/* Signature */}
      <SignatureBlock
        leftSlot={{
          label: isRefund ? "Penerima Refund" : "Penyetor / Pasien",
          hint: detail.pasien.nama,
        }}
        rightSlot={{ label: "Petugas Kasir", name: payment.kasir }}
        lokasi="Jakarta"
        tanggalISO={payment.tanggalISO}
      />

      {/* Footer */}
      <footer className="mt-6 border-t border-slate-300 pt-2 text-[9px] leading-snug text-slate-500">
        <p>
          Kwitansi ini sah & berlaku sebagai bukti pembayaran. Mohon disimpan untuk keperluan
          klaim asuransi / reimbursement. Jika ada perbedaan nominal harap segera laporkan ke kasir
          dalam waktu 1×24 jam.
        </p>
        <p>
          Dicetak otomatis oleh sistem EHIS pada{" "}
          {fmtTanggalJam(new Date().toISOString())} ·{" "}
          tagihan ref. <span className="font-mono">{detail.noTagihan}</span>
          {paper === "A5" && " · Format A5 (struk kasir)"}
        </p>
      </footer>
    </article>
  );
}

// ── Row helper ─────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-dotted border-slate-200 pb-2 last:border-0">
      <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

