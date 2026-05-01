import Link from "next/link";
import type { Patient, PatientStatus } from "@/lib/data";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<PatientStatus, string> = {
  Selesai: "bg-emerald-50 text-emerald-700",
  Menunggu: "bg-amber-50 text-amber-700",
  "Dalam Perawatan": "bg-sky-50 text-sky-700",
  Kritis: "bg-rose-50 text-rose-700",
};

const STATUS_DOT: Record<PatientStatus, string> = {
  Selesai: "bg-emerald-500",
  Menunggu: "bg-amber-500",
  "Dalam Perawatan": "bg-sky-500",
  Kritis: "bg-rose-500",
};

interface PatientTableProps {
  patients: Patient[];
}

export default function PatientTable({ patients }: PatientTableProps) {
  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="font-semibold text-slate-800">Pasien Terbaru</h2>
        <Link
          href="/ehis-registration/pasien"
          className="text-sm font-medium text-indigo-600 transition hover:text-indigo-800"
        >
          Lihat semua →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table
          className="w-full min-w-160 text-sm"
          aria-label="Daftar pasien terbaru"
        >
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["No. RM", "Nama Pasien", "Unit", "Dokter", "Jam", "Status"].map(
                (h) => (
                  <th
                    key={h}
                    scope="col"
                    className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((p, i) => (
              <tr
                key={p.id}
                className="animate-fade-in transition hover:bg-slate-50"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-slate-400">
                  {p.noRM}
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.age} tahun</p>
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                  {p.unit}
                </td>
                <td className="px-5 py-3.5">
                  <p className="max-w-50 truncate text-slate-600">{p.doctor}</p>
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 font-mono text-slate-600">
                  {p.time}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      STATUS_STYLE[p.status],
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        STATUS_DOT[p.status],
                      )}
                      aria-hidden="true"
                    />
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
