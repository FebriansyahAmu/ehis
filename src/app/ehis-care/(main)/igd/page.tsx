import { Siren } from "lucide-react";
import type { Metadata } from "next";

import IGDWorkspace from "@/components/igd/IGDWorkspace";
import IGDTriaseButton from "@/components/igd/IGDTriaseButton";
import { requireCareService } from "@/lib/auth/requireCareService";

export const metadata: Metadata = { title: "IGD" };

export default async function IGDPage() {
  await requireCareService("/ehis-care/igd");
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <header className="animate-fade-in flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
              <Siren size={16} className="text-rose-600" aria-hidden="true" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Instalasi Gawat Darurat</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Order kunjungan, ruangan, dan pasien IGD — data dari pendaftaran &amp; master.
          </p>
        </div>
        <IGDTriaseButton />
      </header>

      {/* Workspace (fetch order + ruangan, stat, board) */}
      <div className="animate-fade-in" style={{ animationDelay: "60ms" }}>
        <IGDWorkspace />
      </div>
    </div>
  );
}
