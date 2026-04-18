import type { Metadata } from "next";
import { CreditCard } from "lucide-react";

export const metadata: Metadata = { title: "Billing" };

export default function EhisBillingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 ring-4 ring-amber-100">
        <CreditCard size={24} className="text-amber-600" />
      </span>
      <div className="text-center">
        <h1 className="text-lg font-bold text-slate-900">EHIS Billing</h1>
        <p className="mt-1 text-sm text-slate-500">
          Modul tagihan & pembayaran sedang dalam pengembangan.
        </p>
      </div>
    </div>
  );
}
