"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { InvoiceDetail } from "../../invoiceShared";
import { fmtRupiah, KATEGORI_CFG } from "../../invoiceShared";
import {
  grandTotal, netAfterItemDiskon, totalGross, totalDiskonItem,
  ppnAmount, groupByKategori, sisaTagihan, saldoDeposit,
} from "@/lib/billing/invoiceCalc";
import KopSurat from "./KopSurat";
import SignatureBlock from "./SignatureBlock";
import { fmtTanggalShort, fmtTanggalJam, terbilang, type PaperSize } from "./printShared";

interface Props {
  detail: InvoiceDetail;
  paper: PaperSize;
  /** Nama kasir untuk signature (default ambil dari payment terbaru / "Petugas Kasir"). */
  kasirName?: string;
}

/**
 * InvoiceSheet — konten struk tagihan yang akan dicetak.
 *
 * Dibungkus `.print-area` di parent modal. Saat `window.print()` dipanggil,
 * `globals.css` @media print rule hide semua kecuali element ini.
 *
 * Layout: KOP · title strip · identitas pasien (2-col) · tabel rincian per
 * kategori · breakdown total · pembayaran history · sisa · tanda tangan.
 */
export default function InvoiceSheet({ detail, paper, kasirName }: Props) {
  // ── Derived totals ──
  const sections = useMemo(() => groupByKategori(detail.items), [detail.items]);
  const subtotal = useMemo(() => netAfterItemDiskon(detail.items), [detail.items]);
  const gross    = useMemo(() => totalGross(detail.items),       [detail.items]);
  const diskonItem = useMemo(() => totalDiskonItem(detail.items), [detail.items]);
  const diskonInv  = detail.diskonInvoice ?? 0;
  const afterDiskonInv = Math.max(0, subtotal - diskonInv);
  const ppn = useMemo(() => ppnAmount(afterDiskonInv, detail.ppnPct ?? 0), [afterDiskonInv, detail.ppnPct]);
  const materai = detail.materai ?? 0;
  const grand = useMemo(() => grandTotal(detail), [detail]);
  const dibayar = useMemo(() => saldoDeposit(detail), [detail]);
  const sisa = useMemo(() => sisaTagihan(detail), [detail]);

  // ── Kasir name for signature ──
  const lastPayment = useMemo(
    () => detail.payments.slice().sort((a, b) => b.tanggalISO.localeCompare(a.tanggalISO))[0],
    [detail.payments],
  );
  const effectiveKasir = kasirName ?? lastPayment?.kasir ?? "Petugas Kasir";

  return (
    <article
      className="print-area mx-auto bg-white p-6 font-[system-ui,sans-serif] text-slate-900 shadow-sm"
      data-paper={paper}
    >
      <KopSurat />

      {/* Title strip */}
      <div className="page-break-avoid mt-3 text-center">
        <h2 className="text-[15px] font-bold uppercase tracking-[0.18em] text-slate-900">
          Struk Tagihan Pasien
        </h2>
        <p className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-700">
          No. {detail.noTagihan} · Tgl. {fmtTanggalJam(detail.tanggalISO)}
        </p>
        <p className="font-mono text-[10px] tabular-nums text-slate-500">
          Kunjungan: {detail.noKunjungan}
        </p>
      </div>

      {/* Identitas pasien — 2-col compact */}
      <IdentitasGrid detail={detail} />

      {/* Tabel rincian per kategori */}
      <section className="mt-4">
        <SectionTitle title="Rincian Tagihan" />
        <table className="mt-1 w-full border-collapse text-[10.5px]">
          <thead>
            <tr className="border-y-2 border-slate-800 bg-slate-50 text-[10px] uppercase tracking-wide">
              <th className="px-1.5 py-1 text-left font-semibold">No</th>
              <th className="px-1.5 py-1 text-left font-semibold">Tgl</th>
              <th className="px-1.5 py-1 text-left font-semibold">Item</th>
              <th className="px-1.5 py-1 text-right font-semibold">Qty</th>
              <th className="px-1.5 py-1 text-left font-semibold">Satuan</th>
              <th className="px-1.5 py-1 text-right font-semibold">Harga</th>
              <th className="px-1.5 py-1 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sections.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-3 text-center italic text-slate-400">
                  Belum ada item charge
                </td>
              </tr>
            )}
            {sections.map((sec) => (
              <CategoryGroup
                key={sec.kategori}
                kategori={sec.kategori}
                items={sec.items}
                subtotal={sec.subtotal}
              />
            ))}
          </tbody>
        </table>
      </section>

      {/* Breakdown totals */}
      <section className="page-break-avoid mt-3 flex justify-end">
        <table className="text-[10.5px]">
          <tbody>
            <TotalRow label="Subtotal (gross)" value={fmtRupiah(gross)} />
            {diskonItem > 0 && (
              <TotalRow label="Diskon Item" value={`− ${fmtRupiah(diskonItem)}`} tone="rose" />
            )}
            <TotalRow label="Subtotal Setelah Diskon Item" value={fmtRupiah(subtotal)} />
            {diskonInv > 0 && (
              <TotalRow
                label="Diskon Invoice"
                value={`− ${fmtRupiah(diskonInv)}`}
                tone="rose"
                hint={detail.alasanDiskonInvoice}
              />
            )}
            {(detail.ppnPct ?? 0) > 0 && (
              <TotalRow label={`PPN ${detail.ppnPct}%`} value={fmtRupiah(ppn)} />
            )}
            {materai > 0 && (
              <TotalRow label="Materai" value={fmtRupiah(materai)} />
            )}
            <tr><td colSpan={2}><div className="my-1 border-t-2 border-slate-800" /></td></tr>
            <TotalRow label="GRAND TOTAL" value={fmtRupiah(grand)} emphasis />
            <tr>
              <td colSpan={2} className="pt-1 text-right text-[9.5px] italic text-slate-600">
                Terbilang: {terbilang(grand)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Pembayaran history */}
      {detail.payments.length > 0 && (
        <section className="page-break-avoid mt-4">
          <SectionTitle title="Riwayat Pembayaran" />
          <table className="mt-1 w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-y border-slate-700 bg-slate-50 uppercase tracking-wide">
                <th className="px-1.5 py-1 text-left font-semibold">Tgl</th>
                <th className="px-1.5 py-1 text-left font-semibold">Metode</th>
                <th className="px-1.5 py-1 text-left font-semibold">No Kwitansi</th>
                <th className="px-1.5 py-1 text-left font-semibold">Kasir</th>
                <th className="px-1.5 py-1 text-right font-semibold">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {detail.payments
                .slice()
                .sort((a, b) => a.tanggalISO.localeCompare(b.tanggalISO))
                .map((p) => (
                  <tr key={p.id} className={cn(
                    "border-b border-slate-200",
                    p.voided && "text-slate-400 line-through",
                  )}>
                    <td className="px-1.5 py-1 font-mono tabular-nums">{fmtTanggalShort(p.tanggalISO)}</td>
                    <td className="px-1.5 py-1">
                      {p.metode}
                      {p.bank && <span className="text-slate-500"> · {p.bank}</span>}
                      {p.kategori === "Refund" && <span className="ml-1 text-[8.5px] uppercase tracking-wider text-rose-700">(refund)</span>}
                    </td>
                    <td className="px-1.5 py-1 font-mono text-[9.5px] tabular-nums">{p.noKwitansi}</td>
                    <td className="px-1.5 py-1">{p.kasir}</td>
                    <td className={cn(
                      "px-1.5 py-1 text-right font-mono tabular-nums",
                      p.nominal < 0 && "text-rose-700",
                    )}>
                      {p.nominal < 0 ? "−" : ""}{fmtRupiah(Math.abs(p.nominal))}
                    </td>
                  </tr>
                ))}
              <tr className="border-t-2 border-slate-800 bg-slate-50 font-semibold">
                <td colSpan={4} className="px-1.5 py-1 text-right">Total Dibayar</td>
                <td className="px-1.5 py-1 text-right font-mono tabular-nums">{fmtRupiah(dibayar)}</td>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <td colSpan={4} className="px-1.5 py-1 text-right uppercase tracking-wide">Sisa Tagihan</td>
                <td className={cn(
                  "px-1.5 py-1 text-right font-mono tabular-nums",
                  sisa === 0 ? "text-emerald-700" : "text-rose-700",
                )}>
                  {fmtRupiah(sisa)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* Signature */}
      <SignatureBlock
        leftSlot={{ label: "Pasien / Penanggung Jawab", hint: detail.pasien.nama }}
        rightSlot={{ label: "Petugas Kasir", name: effectiveKasir }}
        lokasi="Jakarta"
        tanggalISO={new Date().toISOString()}
      />

      {/* Footer */}
      <footer className="mt-6 border-t border-slate-300 pt-2 text-[9px] leading-snug text-slate-500">
        <p>
          Struk ini sah & berlaku sebagai bukti pembayaran. Simpan untuk keperluan klaim asuransi /
          pertanggungjawaban keuangan.
        </p>
        <p>
          Dicetak otomatis oleh sistem EHIS pada {fmtTanggalJam(new Date().toISOString())} ·
          tidak memerlukan tanda tangan basah jika dilengkapi QR code (akan datang).
        </p>
      </footer>
    </article>
  );
}

// ── Identitas pasien grid ──────────────────────────────

function IdentitasGrid({ detail }: { detail: InvoiceDetail }) {
  const rows: Array<[string, string]> = [
    ["Nama", detail.pasien.nama],
    ["No RM", detail.pasien.noRM],
    ["Jenis Kelamin", detail.pasien.gender === "L" ? "Laki-laki" : "Perempuan"],
    ["Usia", `${detail.pasien.age} tahun`],
    ["Unit Pelayanan", detail.unit],
    ["Kelas Rawat", detail.kelas],
    ["Penjamin", detail.penjamin.nama],
    ["No SEP", detail.penjamin.noSEP ?? "—"],
    ["DPJP", detail.dpjp],
    ["No Kunjungan", detail.noKunjungan],
  ];
  // Render 2 kolom
  const mid = Math.ceil(rows.length / 2);
  const left = rows.slice(0, mid);
  const right = rows.slice(mid);

  return (
    <section className="page-break-avoid mt-3 rounded border border-slate-300 bg-slate-50/40 p-3 text-[10.5px]">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
        Identitas Pasien
      </p>
      <div className="grid grid-cols-2 gap-x-4">
        <IdColumn rows={left} />
        <IdColumn rows={right} />
      </div>
    </section>
  );
}

function IdColumn({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="space-y-0.5">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[100px_1fr] gap-2 leading-snug">
          <dt className="text-slate-600">{label}</dt>
          <dd className="text-slate-900">: {value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ── Section title ──────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-800">
      {title}
    </h3>
  );
}

// ── Category group rows ────────────────────────────────

function CategoryGroup({
  kategori, items, subtotal,
}: {
  kategori: keyof typeof KATEGORI_CFG;
  items: { id: string; tanggalISO: string; nama: string; qty: number; satuan: string; hargaSatuan: number; diskonItem?: number; voided?: boolean }[];
  subtotal: number;
}) {
  const cfg = KATEGORI_CFG[kategori];
  let runningNo = 0;
  return (
    <>
      <tr className="bg-slate-100">
        <td colSpan={7} className="px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-800">
          {cfg.label}
        </td>
      </tr>
      {items.map((it) => {
        if (it.voided) return null;  // print clean — voided di-skip
        runningNo += 1;
        const gross = it.qty * it.hargaSatuan;
        const net = Math.max(0, gross - (it.diskonItem ?? 0));
        return (
          <tr key={it.id} className="border-b border-slate-100">
            <td className="px-1.5 py-0.5 align-top font-mono tabular-nums">{runningNo}</td>
            <td className="px-1.5 py-0.5 align-top font-mono tabular-nums">{fmtTanggalShort(it.tanggalISO)}</td>
            <td className="px-1.5 py-0.5 align-top">
              {it.nama}
              {it.diskonItem && it.diskonItem > 0 && (
                <span className="ml-1 text-[9px] italic text-rose-700">
                  (diskon −{fmtRupiah(it.diskonItem)})
                </span>
              )}
            </td>
            <td className="px-1.5 py-0.5 align-top text-right font-mono tabular-nums">{it.qty}</td>
            <td className="px-1.5 py-0.5 align-top">{it.satuan}</td>
            <td className="px-1.5 py-0.5 align-top text-right font-mono tabular-nums">{fmtRupiah(it.hargaSatuan)}</td>
            <td className="px-1.5 py-0.5 align-top text-right font-mono font-semibold tabular-nums">{fmtRupiah(net)}</td>
          </tr>
        );
      })}
      <tr className="border-b-2 border-slate-300 bg-slate-50/60 text-[10px] font-semibold">
        <td colSpan={6} className="px-1.5 py-1 text-right uppercase tracking-wide text-slate-700">
          Subtotal {cfg.label}
        </td>
        <td className="px-1.5 py-1 text-right font-mono tabular-nums">{fmtRupiah(subtotal)}</td>
      </tr>
    </>
  );
}

// ── Total row ──────────────────────────────────────────

function TotalRow({
  label, value, tone = "default", emphasis, hint,
}: {
  label: string;
  value: string;
  tone?: "default" | "rose";
  emphasis?: boolean;
  hint?: string;
}) {
  return (
    <tr>
      <td className={cn(
        "pr-3 text-right",
        emphasis ? "py-1 text-[12.5px] font-bold uppercase tracking-wider" : "py-0.5",
      )}>
        {label}
        {hint && (
          <span className="ml-1 block text-[9px] italic text-slate-500">{hint}</span>
        )}
      </td>
      <td className={cn(
        "min-w-[120px] text-right font-mono tabular-nums",
        emphasis ? "py-1 text-[13px] font-bold" : "py-0.5",
        tone === "rose" && "text-rose-700",
      )}>
        {value}
      </td>
    </tr>
  );
}
