import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

export const metadata: Metadata = { title: "Registrasi" };

export default function EhisRegistrationPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 ring-4 ring-sky-100">
        <ClipboardList size={24} className="text-sky-600" />
      </span>
      <div className="text-center">
        <h1 className="text-lg font-bold text-slate-900">EHIS Registration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Modul registrasi pasien sedang dalam pengembangan.
        </p>
      </div>
    </div>
  );
}
