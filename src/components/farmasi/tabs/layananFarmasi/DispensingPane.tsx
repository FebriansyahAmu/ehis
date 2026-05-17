"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Package, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type FarmasiOrder, type FarmasiOrderItem } from "@/components/farmasi/farmasiShared";

// ── Helpers ───────────────────────────────────────────────

function fmtRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function StokBadge({ stok }: { stok?: number }) {
  if (stok === undefined) return null;
  const cls = stok > 50 ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : stok > 10 ? "bg-amber-50 text-amber-700 ring-amber-200"
    : "bg-rose-50 text-rose-700 ring-rose-200";
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1", cls)}>
      Stok: {stok}
    </span>
  );
}

// ── Row ───────────────────────────────────────────────────

interface RowProps {
  item:     FarmasiOrderItem;
  lotNo:    string;
  expDate:  string;
  labeled:  boolean;
  onChange: (field: "lotNo" | "expDate" | "labeled", val: string | boolean) => void;
}

function ItemRow({ item, lotNo, expDate, labeled, onChange }: RowProps) {
  const total = (item.hargaSatuan ?? 0) * item.jumlah;
  return (
    <motion.tr
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className={cn(
        "border-b border-slate-100 transition-colors hover:bg-slate-50/60",
        item.isHAM && "bg-rose-50/30",
      )}
    >
      {/* Drug name */}
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.isHAM && <AlertTriangle size={11} className="text-rose-500 shrink-0" />}
          <span className="text-xs font-semibold text-slate-800">{item.namaObat}</span>
          {item.kategori !== "Reguler" && (
            <span className={cn(
              "rounded px-1 text-[9px] font-bold",
              item.kategori === "Narkotika" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700",
            )}>{item.kategori.substring(0, 3).toUpperCase()}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-400">{item.rute} · {item.signa || item.dosis}</span>
          <StokBadge stok={item.stokTersedia} />
        </div>
      </td>

      {/* Qty + satuan */}
      <td className="px-3 py-3 text-center">
        <span className="text-sm font-bold text-slate-800">{item.jumlah}</span>
        <br />
        <span className="text-[10px] text-slate-400">{item.satuanObat ?? "Tab"}</span>
      </td>

      {/* Harga satuan */}
      <td className="px-3 py-3 text-right text-xs text-slate-600">
        {fmtRupiah(item.hargaSatuan ?? 0)}
      </td>

      {/* Total */}
      <td className="px-3 py-3 text-right text-xs font-semibold text-slate-800">
        {fmtRupiah(total)}
      </td>

      {/* Lot/Batch */}
      <td className="px-3 py-3">
        <input
          type="text"
          value={lotNo}
          onChange={(e) => onChange("lotNo", e.target.value)}
          placeholder="LOT-XXXX"
          className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-mono text-slate-600 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100"
        />
      </td>

      {/* Exp */}
      <td className="px-3 py-3">
        <input
          type="month"
          value={expDate}
          onChange={(e) => onChange("expDate", e.target.value)}
          className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-600 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100"
        />
      </td>

      {/* Label */}
      <td className="px-3 py-3 text-center">
        <input
          type="checkbox"
          checked={labeled}
          onChange={(e) => onChange("labeled", e.target.checked)}
          className="h-3.5 w-3.5 rounded border-slate-300 accent-sky-600"
          aria-label={`Label ${item.namaObat}`}
        />
      </td>
    </motion.tr>
  );
}

// ── Main ──────────────────────────────────────────────────

interface Props {
  order:    FarmasiOrder;
  onSave:   (items: FarmasiOrderItem[]) => void;
}

export default function DispensingPane({ order, onSave }: Props) {
  type RowState = { lotNo: string; expDate: string; labeled: boolean };
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(order.items.map((item) => [
      item.id,
      { lotNo: item.lotNo ?? "", expDate: item.expiredDate ?? "", labeled: item.labelDicetak ?? false },
    ])),
  );

  function updateRow(id: string, field: "lotNo" | "expDate" | "labeled", val: string | boolean) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  }

  function handleSave() {
    const updated: FarmasiOrderItem[] = order.items.map((item) => ({
      ...item,
      lotNo:        rows[item.id]?.lotNo    || undefined,
      expiredDate:  rows[item.id]?.expDate  || undefined,
      labelDicetak: rows[item.id]?.labeled  ?? false,
    }));
    onSave(updated);
  }

  const totalHarga = order.items.reduce((sum, item) => sum + (item.hargaSatuan ?? 0) * item.jumlah, 0);
  const allLabeled = order.items.every((item) => rows[item.id]?.labeled);
  const isLocked   = order.status === "Selesai";

  return (
    <div className="space-y-4">
      {/* Info row */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">Dokter Peresep:</span>
        <span>{order.dokterPeminta}</span>
        <span className="h-3 w-px bg-slate-300" />
        <span className="font-semibold text-slate-700">Unit / Ruangan:</span>
        <span>{order.unit}</span>
        <span className="h-3 w-px bg-slate-300" />
        <span className="font-semibold text-slate-700">Depo:</span>
        <span>{order.depo}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="py-2.5 pl-4 pr-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">Nama Obat</th>
              <th className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">Jml</th>
              <th className="px-3 py-2.5 text-right  text-[10px] font-bold uppercase tracking-wide text-slate-400">Hrg Satuan</th>
              <th className="px-3 py-2.5 text-right  text-[10px] font-bold uppercase tracking-wide text-slate-400">Total</th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Lot/Batch</th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Kedaluwarsa</th>
              <th className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">Label</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                lotNo={rows[item.id]?.lotNo    ?? ""}
                expDate={rows[item.id]?.expDate ?? ""}
                labeled={rows[item.id]?.labeled ?? false}
                onChange={(f, v) => updateRow(item.id, f, v)}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50/70">
              <td colSpan={3} className="py-3 pl-4 text-xs font-bold text-slate-600">
                Total Tagihan Obat
              </td>
              <td className="px-3 py-3 text-right text-sm font-black text-sky-700">
                {fmtRupiah(totalHarga)}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Status / action */}
      {isLocked ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-700">
            Dispensasi selesai — obat sudah diserahkan ke {order.serahTerima?.perawatPenerima}.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          {!allLabeled && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600">
              <Package size={12} />
              Belum semua obat diberi label etiket.
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={order.status !== "Ditelaah"}
            className="ml-auto flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Package size={14} />
            Simpan Dispensasi
          </button>
        </div>
      )}
    </div>
  );
}
