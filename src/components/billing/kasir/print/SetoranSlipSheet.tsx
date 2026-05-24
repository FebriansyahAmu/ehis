"use client";

import KopSurat from "../../invoice/modals/print/KopSurat";
import SignatureBlock from "../../invoice/modals/print/SignatureBlock";
import {
  fmtTanggalJam, fmtTanggalLong, terbilang, type PaperSize,
} from "../../invoice/modals/print/printShared";
import { fmtRupiah } from "../../invoice/invoiceShared";
import { COUNTER_LIST, type KasirShift } from "@/lib/billing/kasirShiftMock";

interface Props {
  shift: KasirShift;
  paper: PaperSize;
}

/**
 * SetoranSlipSheet — A5 default (compact, 1 halaman), bukti serah-terima
 * kas tunai dari kasir ke bendahara/keuangan.
 *
 * Wajib di-print 2 copy: 1 untuk kasir, 1 untuk keuangan (arsip 5 tahun
 * per Permendagri 27/2013 BLUD).
 */
export default function SetoranSlipSheet({ shift, paper }: Props) {
  const setoran = shift.setoran;
  if (!setoran) {
    return (
      <article className="print-area mx-auto bg-white p-6 text-center text-slate-500" data-paper={paper}>
        <p className="italic">Shift ini belum dicatat setorannya.</p>
      </article>
    );
  }
  const counter = COUNTER_LIST.find((c) => c.id === shift.counter);

  return (
    <article
      className="print-area mx-auto bg-white p-6 font-[system-ui,sans-serif] text-slate-900 shadow-sm"
      data-paper={paper}
    >
      <KopSurat />

      {/* Title strip */}
      <div className="page-break-avoid mt-4 text-center">
        <h2 className="text-[18px] font-bold uppercase tracking-[0.3em] text-slate-900">
          Slip Setoran Kas
        </h2>
        <p className="mt-1 font-mono text-[12px] tabular-nums text-slate-700">
          No. {setoran.noSetor}
        </p>
      </div>

      {/* Body */}
      <section className="page-break-avoid mt-5 space-y-3 text-[12px] leading-relaxed">
        <Row label="Telah diterima dari">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-900">
            {shift.kasirNama}
          </p>
          <p className="text-[10.5px] text-slate-600">
            Petugas Kasir · Counter {counter?.nama ?? shift.counter} ({shift.counter})
          </p>
        </Row>

        <Row label="Diterima oleh">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-900">
            {setoran.penerima}
          </p>
        </Row>

        <Row label="Sejumlah">
          <p className="font-mono text-[20px] font-bold tabular-nums text-slate-900">
            {fmtRupiah(setoran.nominal)}
          </p>
        </Row>

        <Row label="Terbilang">
          <p className="rounded border-l-2 border-slate-700 bg-slate-50 px-3 py-1.5 text-[12px] italic text-slate-800">
            {terbilang(setoran.nominal)}
          </p>
        </Row>

        <Row label="Sumber kas">
          <p className="text-[11.5px] leading-snug text-slate-800">
            Hasil penerimaan kas tunai shift{" "}
            <span className="font-mono">{shift.id}</span> · Counter{" "}
            <span className="font-semibold">{counter?.nama ?? shift.counter}</span>{" "}
            (dibuka {fmtTanggalJam(shift.bukaAt)} · ditutup{" "}
            {shift.tutupAt ? fmtTanggalJam(shift.tutupAt) : "—"}).
          </p>
          {shift.selisih !== undefined && shift.selisih !== 0 && (
            <p className="mt-1 text-[10.5px] italic text-slate-600">
              Catatan selisih shift: {shift.selisih > 0 ? "+" : ""}{fmtRupiah(shift.selisih)} —{" "}
              telah dilaporkan ke supervisor.
            </p>
          )}
        </Row>

        <Row label="Tanggal serah">
          <p className="text-[11.5px]">
            {fmtTanggalLong(setoran.tanggalSerah)} · pukul{" "}
            <span className="font-mono">
              {new Date(setoran.tanggalSerah).toLocaleTimeString("id-ID", {
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </p>
        </Row>

        {setoran.catatan && (
          <Row label="Catatan">
            <p className="text-[10.5px] italic text-slate-700">&ldquo;{setoran.catatan}&rdquo;</p>
          </Row>
        )}
      </section>

      {/* Signature */}
      <SignatureBlock
        leftSlot={{
          label: "Penyetor / Kasir",
          name: shift.kasirNama,
          hint: shift.counter,
        }}
        rightSlot={{
          label: "Penerima / Bendahara",
          name: setoran.penerima,
        }}
        lokasi="Jakarta"
        tanggalISO={setoran.tanggalSerah}
      />

      {/* Footer */}
      <footer className="page-break-avoid mt-6 border-t border-slate-300 pt-2 text-[9px] leading-snug text-slate-500">
        <p>
          Slip ini sah sebagai bukti serah-terima kas. Wajib dicetak 2 copy:
          1 untuk kasir, 1 untuk bendahara (arsip minimal 5 tahun per Permendagri 27/2013).
          Selisih nominal harap dilaporkan dalam waktu 1×24 jam.
        </p>
        <p className="mt-1">
          Dicetak otomatis oleh sistem EHIS pada{" "}
          {fmtTanggalJam(new Date().toISOString())} ·{" "}
          shift ref. <span className="font-mono">{shift.id}</span>
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
