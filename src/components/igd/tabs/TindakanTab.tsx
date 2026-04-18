import { Plus } from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";

export default function TindakanTab({ patient }: { patient: IGDPatientDetail }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Tindakan IGD</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {patient.tindakan.length}
          </span>
        </div>
        <button className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700">
          <Plus size={13} />
          Tambah Tindakan
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {patient.tindakan.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Belum ada tindakan yang dicatat
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-130 text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nama Tindakan</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Kode</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Waktu</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Dilakukan Oleh</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">Jml</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patient.tindakan.map((item, idx) => (
                  <tr key={item.id}
                    className="animate-fade-in transition hover:bg-slate-50"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-800">{item.nama}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">{item.kode}</td>
                    <td className="px-4 py-2.5 text-slate-600">{item.waktu}</td>
                    <td className="px-4 py-2.5 text-slate-600">{item.dilakukanOleh}</td>
                    <td className="px-4 py-2.5 text-center text-slate-700">{item.jumlah}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
