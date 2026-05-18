import type { Metadata } from "next";
import { FlaskConical, Clock, AlertTriangle, CheckCircle2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import LabPageView from "@/components/lab/LabPageView";
import { deriveLabOrders } from "@/components/lab/labShared";

export const metadata: Metadata = { title: "Laboratorium" };

// ── Stat badge ─────────────────────────────────────────────

function HeaderStat({
  icon, value, label, className,
}: {
  icon: React.ReactNode; value: number | string;
  label: string; className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm", className)}>
      <div className="text-slate-400">{icon}</div>
      <div>
        <p className="text-sm font-bold leading-none tabular-nums text-slate-900">{value}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{label}</p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function LaboratoriumPage() {
  const now    = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const today  = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

  const allOrders = deriveLabOrders();
  const cito      = allOrders.filter((o) => o.prioritas === "CITO" && o.status !== "Selesai" && o.status !== "Ditolak").length;
  const antrian   = allOrders.filter((o) => ["Menunggu", "Diterima"].includes(o.status)).length;
  const proses    = allOrders.filter((o) => ["Ambil Sampel", "Sampel Diterima", "Dianalisa", "Divalidasi"].includes(o.status)).length;
  const selesai   = allOrders.filter((o) => o.status === "Selesai").length;
  const hasCritical = allOrders.filter((o) => o.criticalNotifs?.some((n) => !n.confirmed)).length;

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

        {/* Stats row */}
        <div className="flex flex-wrap gap-2">
          {cito > 0 && (
            <HeaderStat
              icon={<Activity size={15} className="text-rose-500" />}
              value={cito}
              label="CITO Aktif"
              className="border-rose-200 ring-1 ring-rose-100"
            />
          )}
          {hasCritical > 0 && (
            <HeaderStat
              icon={<AlertTriangle size={15} className="text-rose-500" />}
              value={hasCritical}
              label="Nilai Kritis"
              className="border-rose-200 ring-1 ring-rose-100"
            />
          )}
          <HeaderStat
            icon={<Clock size={15} />}
            value={antrian}
            label="Antrian"
          />
          <HeaderStat
            icon={<FlaskConical size={15} />}
            value={proses}
            label="Diproses"
          />
          <HeaderStat
            icon={<CheckCircle2 size={15} className="text-emerald-500" />}
            value={selesai}
            label="Selesai"
          />
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
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">{n}</span>
                  <p className="text-[11px] font-bold text-sky-800">{label}</p>
                </div>
                {items.map((item) => (
                  <p key={item} className="text-[10px] text-sky-700 leading-relaxed">· {item}</p>
                ))}
              </div>
              {i < 2 && (
                <div className="mt-4 text-slate-300">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Board + QC Manajemen */}
      <LabPageView />
    </div>
  );
}
