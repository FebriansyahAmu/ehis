"use client";

// SpriRiwayatPanel — panel kanan "Riwayat SPRI" untuk pasien (semua SPRI lintas kunjungan, semua
// status). Data: GET /kunjungan/:id/spri (gate clinical.rekammedis:read). Pasien demo (non-UUID)
// → tak fetch (tampil placeholder). Refetch saat `refreshKey` berubah (mis. sesudah terbit baru).

import { useEffect, useState } from "react";
import {
  FileClock, Loader2, Inbox, Stethoscope, BedDouble, CalendarDays, Hash, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { listSpriRiwayat, type SpriDTO } from "@/lib/api/spri/spri";

const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  MenungguRef: { label: "Menunggu Ref", cls: "bg-amber-50 text-amber-700 ring-amber-200",     dot: "bg-amber-400" },
  Terbit:      { label: "Terbit",       cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  Dikonsumsi:  { label: "Dikonsumsi",   cls: "bg-sky-50 text-sky-700 ring-sky-200",           dot: "bg-sky-500" },
  Batal:       { label: "Dibatalkan",   cls: "bg-rose-50 text-rose-600 ring-rose-200",         dot: "bg-rose-400" },
  Tergantikan: { label: "Tergantikan",  cls: "bg-slate-100 text-slate-500 ring-slate-200",     dot: "bg-slate-400" },
};

function fmtTgl(ymd?: string): string {
  if (!ymd) return "—";
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
function fmtWaktu(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

export default function SpriRiwayatPanel({
  kunjunganId,
  isPersisted,
  refreshKey = 0,
}: {
  kunjunganId: string;
  isPersisted: boolean;
  refreshKey?: number;
}) {
  const [rows, setRows] = useState<SpriDTO[]>([]);
  const [loading, setLoading] = useState(isPersisted);

  useEffect(() => {
    if (!isPersisted) return; // demo (non-UUID) → tak fetch
    const ac = new AbortController();
    // setLoading(true) TIDAK dipanggil sinkron di body efek (react-hooks/set-state-in-effect);
    // loading awal = lazy useState(isPersisted). Refetch (refreshKey) → rows di-update di .then.
    listSpriRiwayat(kunjunganId, ac.signal)
      .then((r) => { setRows(r); setLoading(false); })
      .catch(() => setLoading(false));
    return () => ac.abort();
  }, [kunjunganId, isPersisted, refreshKey]);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <FileClock size={12} />
        </span>
        <p className="text-xs font-semibold text-slate-700">Riwayat SPRI</p>
        {isPersisted && rows.length > 0 && (
          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            {rows.length}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-3">
        {!isPersisted ? (
          <Placeholder text="Riwayat SPRI tampil untuk pasien nyata (bukan data contoh)." />
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
            <Loader2 size={15} className="animate-spin text-teal-500" />
            <span className="text-[12px]">Memuat riwayat SPRI…</span>
          </div>
        ) : rows.length === 0 ? (
          <Placeholder text="Belum ada SPRI untuk pasien ini. SPRI yang diterbitkan akan tampil di sini." />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {rows.map((s) => <SpriCard key={s.id} spri={s} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

function SpriCard({ spri }: { spri: SpriDTO }) {
  const cfg = STATUS_CFG[spri.status] ?? STATUS_CFG.MenungguRef;
  return (
    <li className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-2 border-b border-slate-50 px-3 py-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
            <Stethoscope size={12} className="shrink-0 text-violet-400" />
            <span className="truncate">{spri.dpjpNama}</span>
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-slate-400">{spri.noKunjungan}</p>
        </div>
        <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1", cfg.cls)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />{cfg.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-3 py-2">
        <Row icon={<BedDouble size={11} className="text-teal-400" />} label="Ruang">{spri.jenisPerawatan}</Row>
        <Row icon={<Activity size={11} className="text-violet-400" />} label="Poli">{spri.poliNama ?? "—"}</Row>
        <Row icon={<CalendarDays size={11} className="text-sky-400" />} label="Rencana">{fmtTgl(spri.tglRencanaRawat)}</Row>
        <Row icon={<Hash size={11} className="text-slate-400" />} label="No. Ref">
          {spri.noReferensi
            ? <span className="font-mono font-semibold text-emerald-700">{spri.noReferensi}</span>
            : <span className="text-amber-600">Belum terbit</span>}
        </Row>
      </div>
      {spri.indikasi && (
        <p className="mx-3 mb-2 line-clamp-2 rounded-md bg-slate-50 px-2 py-1 text-[10.5px] leading-snug text-slate-500">
          <span className="font-semibold text-slate-600">Indikasi: </span>{spri.indikasi}
        </p>
      )}
      <p className="border-t border-slate-50 px-3 py-1.5 text-[10px] text-slate-400">
        {spri.user || "—"} · {fmtWaktu(spri.createdAt)}
      </p>
    </li>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <span className="flex w-14 shrink-0 items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
        {icon}{label}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{children}</span>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-300">
        <Inbox size={20} />
      </span>
      <p className="max-w-56 text-[11px] leading-snug text-slate-400">{text}</p>
    </div>
  );
}
