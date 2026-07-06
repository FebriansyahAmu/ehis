import type { Metadata } from "next";
import { Stethoscope } from "lucide-react";
import RJPageView from "@/components/rawat-jalan/RJPageView";
import { requireCareService } from "@/lib/auth/requireCareService";

export const metadata: Metadata = { title: "Rawat Jalan" };

// ── Page ──────────────────────────────────────────────────
// Worklist DB-driven (tanpa data mock). Statistik + census dari GET /kunjungan di RJPageView.

export default async function RawatJalanPage() {
  await requireCareService("/ehis-care/rawat-jalan");
  const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Header — tanpa tombol Kunjungan Baru (pendaftaran = wewenang loket /ehis-registration) */}
      <header className="animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
            <Stethoscope size={16} className="text-sky-600" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold text-slate-900">Rawat Jalan</h1>
        </div>
        <p className="mt-1 text-sm text-slate-400">Data per pukul {now}</p>
      </header>

      {/* Statistik + tab Order Masuk | Worklist Pasien | Konsultasi (data nyata) */}
      <section className="animate-fade-in" style={{ animationDelay: "120ms" }}>
        <RJPageView />
      </section>

    </div>
  );
}
