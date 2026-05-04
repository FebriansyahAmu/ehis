"use client";

import { cn } from "@/lib/utils";
import type { BillingRecord } from "@/lib/data";
import { ModalShell } from "../primitives";
import { UNIT_CFG, TAGIHAN_STATUS, fmtRp } from "../config";

export function BillingDetailModal({
  record,
  onClose,
}: {
  record: BillingRecord;
  onClose: () => void;
}) {
  const total = record.rincian.reduce((s, r) => s + r.qty * r.harga, 0);
  const uc = UNIT_CFG[record.unit];
  const UIcon = uc.icon;

  return (
    <ModalShell
      title={`Tagihan — ${record.unit}`}
      subtitle={`${record.noTagihan} · ${record.tanggal}`}
      onClose={onClose}
      size="md"
    >
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold", uc.bg, uc.text)}>
            <UIcon size={12} /> {record.unit}
          </span>
          <span className="font-mono text-[10px] text-slate-400">{record.noKunjungan}</span>
          <span className={cn("ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1", TAGIHAN_STATUS[record.status])}>
            {record.status}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Penjamin</span>
          <span className="font-medium text-slate-700">{record.penjamin}</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-2.5 text-left">Item</th>
                <th className="px-4 py-2.5 text-center">Qty</th>
                <th className="px-4 py-2.5 text-right">Harga</th>
                <th className="px-4 py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {record.rincian.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5 font-medium text-slate-700">{r.nama}</td>
                  <td className="px-4 py-2.5 text-center text-slate-500">{r.qty}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">{fmtRp(r.harga)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmtRp(r.qty * r.harga)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-600">Total</td>
                <td className="px-4 py-3 text-right text-sm font-black text-slate-900">{fmtRp(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {record.dibayar > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs">
            <span className="text-emerald-600">Dibayar</span>
            <span className="font-bold text-emerald-700">{fmtRp(record.dibayar)}</span>
          </div>
        )}
      </div>
      <div className="flex shrink-0 justify-end border-t border-slate-100 px-5 py-3">
        <button
          onClick={onClose}
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Tutup
        </button>
      </div>
    </ModalShell>
  );
}
