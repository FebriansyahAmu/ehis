"use client";

import { useMemo } from "react";
import type { InvoiceDetail, PaymentRecord } from "../invoiceShared";
import { grandTotal, sisaTagihan } from "@/lib/billing/invoiceCalc";
import { totalDibayar } from "@/lib/billing/paymentCalc";
import PaymentSummaryCard from "./payment/PaymentSummaryCard";
import PaymentForm from "./payment/PaymentForm";
import PaymentHistoryList from "./payment/PaymentHistoryList";
import type { PaymentRowAction } from "./payment/PaymentRow";

interface Props {
  detail: InvoiceDetail;
  onAddPayment: (payment: Omit<PaymentRecord, "id" | "noKwitansi">) => void;
  onRowAction: (action: PaymentRowAction, payment: PaymentRecord) => void;
}

export default function PembayaranTab({ detail, onAddPayment, onRowAction }: Props) {
  const grand   = useMemo(() => grandTotal(detail), [detail]);
  const dibayar = useMemo(() => totalDibayar(detail.payments), [detail.payments]);
  const sisaG   = useMemo(() => Math.max(0, grand - dibayar), [grand, dibayar]);
  const sisaInv = useMemo(() => sisaTagihan(detail), [detail]);

  // sisa untuk form: pakai sisaInvoice (yang sudah include header dibayar untuk fallback);
  // dengan payments tersedia, gunakan grand-dibayar.
  const sisaForm = detail.payments.length > 0 ? sisaG : sisaInv;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 px-5 py-4">
          {/* Top summary strip */}
          <PaymentSummaryCard
            grand={grand}
            dibayar={dibayar}
            sisa={sisaForm}
          />

          {/* 2-col layout: form (lg sticky-left 380px) + history (flex 1) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <div className="lg:sticky lg:top-2 lg:self-start">
              <PaymentForm
                sisaTagihan={sisaForm}
                onSubmit={onAddPayment}
              />
            </div>

            <div className="min-h-[60vh]">
              <PaymentHistoryList
                payments={detail.payments}
                onAction={onRowAction}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
