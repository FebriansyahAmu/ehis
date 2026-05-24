"use client";

import { motion } from "framer-motion";
import { FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah } from "../../invoice/invoiceShared";
import type { PasienAdmisi } from "@/lib/billing/depositMock";

interface Props {
  pasien: PasienAdmisi;
  nominal: number;
  metode: string;
}

/**
 * Preview draft invoice yang akan dibuat saat deposit di-submit.
 *
 * 1 invoice draft dengan:
 *   - status = "Draft"
 *   - 1 payment record (kategori "Deposit")
 *   - 0 charge items (akan ditambah via BL6 charge ingestion saat klinis selesai)
 */
export default function DraftInvoicePreview({ pasien, nominal, metode }: Props) {
  const targetNoTagihan = `INV/${new Date().getFullYear()}/${
    String(new Date().getMonth() + 1).padStart(2, "0")
  }/NEXT`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      aria-label="Preview Draft Invoice"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
          <FileText size={13} />
        </span>
        <div>
          <h3 className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
            Yang Akan Dibuat
          </h3>
          <p className="text-[10.5px] text-slate-500">
            Setelah submit, sistem buat invoice draft + record deposit pertama
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-2.5 px-4 py-3">
        <RowItem
          icon={<FileText size={11} className="text-amber-600" />}
          label="Invoice baru"
          value={targetNoTagihan}
          hint="status Draft (belum final)"
          mono
        />
        <RowItem
          icon={<span className="font-mono text-[10px] font-bold text-sky-600">#1</span>}
          label="Payment record"
          value={`Deposit · ${metode} · ${fmtRupiah(nominal)}`}
          hint="No kwitansi auto-generate"
        />
        <RowItem
          icon={<span className="font-mono text-[10px] text-slate-400">∅</span>}
          label="Charge items"
          value="0 item"
          hint="Akan diisi auto dari Lab/Rad/Farmasi/Tindakan (BL6)"
          muted
        />
        <RowItem
          icon={<ArrowRight size={11} className="text-emerald-600" />}
          label="Saldo Deposit Awal"
          value={fmtRupiah(nominal)}
          hint="Mengurangi sisa tagihan saat charge masuk"
          accent="emerald"
        />
      </div>

      {/* Footer disclaimer */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-[10px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
        Setelah deposit dibuka, pasien <strong>{pasien.pasien.nama}</strong> hilang dari list
        admisi pending. Lihat invoice di tab <em>Tagihan</em>.
      </div>
    </motion.section>
  );
}

// ── Row item ───────────────────────────────────────────

function RowItem({
  icon, label, value, hint, mono, muted, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  mono?: boolean;
  muted?: boolean;
  accent?: "emerald";
}) {
  const valueTone = accent === "emerald"
    ? "text-emerald-700 dark:text-emerald-300 font-bold"
    : muted
      ? "text-slate-400"
      : "text-slate-800 dark:text-slate-100 font-semibold";

  return (
    <div className="grid grid-cols-[24px_1fr] gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
        <p className={cn(
          "text-[12px]",
          mono && "font-mono tabular-nums",
          valueTone,
        )}>
          {value}
        </p>
        <p className="text-[9.5px] text-slate-400">{hint}</p>
      </div>
    </div>
  );
}
