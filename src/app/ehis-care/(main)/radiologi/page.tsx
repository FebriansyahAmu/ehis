import type { Metadata } from "next";
import { Radiation } from "lucide-react";
import RadPageView from "@/components/rad/RadPageView";
import { requireCareService } from "@/lib/auth/requireCareService";

export const metadata: Metadata = { title: "Radiologi" };

// ── Page ───────────────────────────────────────────────────

export default async function RadiologiPage() {
  await requireCareService("/ehis-care/radiologi");
  const now   = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Page header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100">
              <Radiation size={18} className="text-teal-600" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Radiologi</h1>
              <p className="text-xs text-slate-400">Radiodiagnostik & Radioterapi · SNARS AP 6 · PMK 24/2020</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {today} · Pukul {now} · Data diperbarui otomatis
          </p>
        </div>
      </header>

      {/* Workflow guide */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Alur Pelayanan Radiologi · SNARS AP 6 · PMK 24/2020
        </p>
        <div className="flex min-w-150 items-start gap-1">
          {[
            {
              n: "01", label: "Pra-Pemeriksaan",
              items: ["Order dokter pengirim", "Verifikasi identitas (SKP 1)", "Persiapan pasien & kontras"],
            },
            {
              n: "02", label: "Pemeriksaan",
              items: ["Akuisisi gambar", "Pencatatan dosis (ALARA)", "Proteksi radiasi (BAPETEN)"],
            },
            {
              n: "03", label: "Pasca-Pemeriksaan",
              items: ["Expertise SpRad", "Pelaporan temuan kritis (≤30 mnt)", "Validasi & rilis laporan"],
            },
          ].map(({ n, label, items }, i) => (
            <div key={n} className="flex flex-1 items-start gap-1">
              <div className="flex-1 rounded-xl bg-teal-50 p-3 ring-1 ring-teal-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">{n}</span>
                  <p className="text-[11px] font-bold text-teal-800">{label}</p>
                </div>
                {items.map((item) => (
                  <p key={item} className="text-[10px] text-teal-700 leading-relaxed">· {item}</p>
                ))}
              </div>
              {i < 2 && (
                <div className="mt-4 text-slate-300">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Board */}
      <RadPageView />
    </div>
  );
}
