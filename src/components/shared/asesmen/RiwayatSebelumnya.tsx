"use client";

// Panel referensi "Riwayat Sebelumnya" (longitudinal, read-only) — di samping form Riwayat
// Medis, per sub-menu aktif. Menampilkan asesmen riwayat TERBARU per kunjungan, lintas semua
// kunjungan pasien (IGD/Poli/RI) + ringkasan. Continuity of care (SNARS AP 1.2).
//
// PRESENTASIONAL: data + state di-host oleh RiwayatPane (1 fetch + reload pasca-simpan), supaya
// entri yang baru disimpan langsung muncul (tanpa refresh). Switch sub-menu = ganti slice domain.

import { History, Loader2, AlertCircle, Stethoscope, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  RiwayatSebelumnyaDTO, RiwayatDomainKey, RiwayatEpisodeDTO,
} from "@/lib/api/asesmenMedis/riwayatSebelumnya";

const UNIT_BADGE: Record<string, string> = {
  IGD: "bg-rose-50 text-rose-700 ring-rose-200",
  RawatJalan: "bg-sky-50 text-sky-700 ring-sky-200",
  RawatInap: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function EpisodeCard({ ep }: { ep: RiwayatEpisodeDTO }) {
  const unitCls = UNIT_BADGE[ep.unit] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <div className={cn(
      "overflow-hidden rounded-xl border bg-white shadow-sm transition",
      ep.isCurrent ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200",
    )}>
      <div className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold ring-1", unitCls)}>{ep.unitLabel}</span>
          {ep.poli && <span className="text-[10px] font-medium text-slate-500">{ep.poli}</span>}
          <span className="font-mono text-[10px] text-slate-400">{ep.noKunjungan}</span>
          <span className="ml-auto font-mono text-[11px] font-semibold text-slate-500">{ep.tanggal}</span>
          {ep.isCurrent && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">Kunjungan Ini</span>
          )}
        </div>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700">{ep.summary}</p>
      </div>
      <div className="flex items-center gap-1 px-4 py-2 text-[11px] text-slate-400">
        <Stethoscope size={10} className="shrink-0" />
        <span className="italic">{ep.pemeriksa}</span>
      </div>
    </div>
  );
}

export default function RiwayatSebelumnya({
  data, state, domainKey, domainLabel, className,
}: {
  data: RiwayatSebelumnyaDTO | null;
  state: "loading" | "done" | "error";
  domainKey: RiwayatDomainKey;
  domainLabel: string;
  className?: string;
}) {
  const episodes = data?.domains[domainKey] ?? [];

  return (
    <section className={cn("flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <History size={13} className="text-slate-400" /> Riwayat Sebelumnya
        </span>
        {state === "done" && episodes.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{episodes.length}</span>
        )}
      </div>
      <p className="border-b border-slate-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-sky-600">{domainLabel}</p>

      {state === "loading" ? (
        <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
          <Loader2 size={15} className="animate-spin text-sky-500" />
          <span className="text-xs">Memuat riwayat…</span>
        </div>
      ) : state === "error" ? (
        <div className="flex items-center gap-2 px-4 py-6 text-xs text-rose-600">
          <AlertCircle size={14} className="shrink-0" /> Gagal memuat riwayat.
        </div>
      ) : episodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <FileText size={26} className="text-slate-300" />
          <p className="text-xs font-medium text-slate-500">Belum ada riwayat</p>
          <p className="text-[11px] text-slate-400">{domainLabel} dari kunjungan IGD / poli / rawat inap sebelumnya akan tampil di sini.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto p-3" style={{ maxHeight: 560 }}>
          {episodes.map((ep) => <EpisodeCard key={ep.kunjunganId} ep={ep} />)}
        </div>
      )}
    </section>
  );
}
