import type { Metadata } from "next";
import { Radiation, Clock, AlertTriangle, CheckCircle2, Activity, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import RadPageView from "@/components/rad/RadPageView";
import { deriveRadOrders } from "@/components/rad/radShared";

export const metadata: Metadata = { title: "Radiologi" };

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

export default function RadiologiPage() {
  const now   = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

  const allOrders = deriveRadOrders();
  const cito      = allOrders.filter((o) => o.prioritas === "CITO" && !["Selesai", "Ditolak"].includes(o.status)).length;
  const antrian   = allOrders.filter((o) => ["Menunggu", "Dijadwalkan", "Verifikasi"].includes(o.status)).length;
  const proses    = allOrders.filter((o) => ["Persiapan", "Akuisisi", "Expertise", "Verifikasi_Hasil"].includes(o.status)).length;
  const selesai   = allOrders.filter((o) => o.status === "Selesai").length;
  const hasCritical = allOrders.filter((o) =>
    (o.ekspertasi?.criticalFindings ?? []).some((f) => !f.confirmed)
  ).length;

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
              label="Temuan Kritis"
              className="border-rose-200 ring-1 ring-rose-100"
            />
          )}
          <HeaderStat
            icon={<Clock size={15} />}
            value={antrian}
            label="Antrian"
          />
          <HeaderStat
            icon={<Camera size={15} />}
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
