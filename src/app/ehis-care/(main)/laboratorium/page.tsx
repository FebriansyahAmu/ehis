import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";
import LabPageView from "@/components/lab/LabPageView";

export const metadata: Metadata = { title: "Laboratorium" };

// ── Page ───────────────────────────────────────────────────
// Worklist + statistik dibaca dari DB (medicalrecord.LabOrder) di LabPageView/LabBoard — tanpa mock.

export default function LaboratoriumPage() {
  const now   = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Page header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100">
              <FlaskConical size={18} className="text-sky-600" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Laboratorium Klinik</h1>
              <p className="text-xs text-slate-400">Total Testing Process · ISO 15189:2022 · SNARS AP 5</p>
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
          Alur Total Testing Process (TTP) · ISO 15189:2022
        </p>
        <div className="flex min-w-150 items-start gap-1">
          {[
            { n: "01", label: "Pra-Analitik", items: ["Order dokter", "Verifikasi identitas (SKP 1)", "Pengambilan sampel"] },
            { n: "02", label: "Analitik",     items: ["Registrasi & labeling", "Pemeriksaan", "QC internal"] },
            { n: "03", label: "Pasca-Analitik", items: ["Validasi SpPK", "Pelaporan kritis", "Rilis ke RM"] },
          ].map(({ n, label, items }, i) => (
            <div key={n} className="flex flex-1 items-start gap-1">
              <div className="flex-1 rounded-xl bg-sky-50 p-3 ring-1 ring-sky-100">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">{n}</span>
                  <p className="text-[11px] font-bold text-sky-800">{label}</p>
                </div>
                {items.map((item) => (
                  <p key={item} className="text-[10px] leading-relaxed text-sky-700">· {item}</p>
                ))}
              </div>
              {i < 2 && <div className="mt-4 text-slate-300">→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Board + QC Manajemen */}
      <LabPageView />
    </div>
  );
}
