"use client";

// Panel referensi "Catatan Diagnosa Medis Sebelumnya" (longitudinal, read-only) — shared IGD/RI/RJ.
// Menampilkan diagnosa (semua tipe: Utama/Sekunder/Komplikasi/Komorbid) dari kunjungan-kunjungan
// SEBELUMNYA pasien yang sama, dikelompokkan per kunjungan (terbaru dulu). Diagnosa UTAMA diberi
// latar visual (rose) agar menonjol. Continuity of care (SNARS AP 1.2).
//
// kunjunganId UUID → tarik DB (GET /kunjungan/:id/diagnosa-sebelumnya). Non-UUID (demo) →
// contoh statis (tanpa network). Murni baca — tak ada aksi tulis.

import { useEffect, useState } from "react";
import { History, Loader2, AlertCircle, Stethoscope, Crown, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiagnosaTipe } from "@/lib/schemas/diagnosa/diagnosa";
import {
  getDiagnosaSebelumnya, type DiagnosaSebelumnyaEpisodeDTO,
} from "@/lib/api/diagnosa/diagnosa";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";

const UNIT_BADGE: Record<string, string> = {
  IGD: "bg-rose-50 text-rose-700 ring-rose-200",
  RawatJalan: "bg-sky-50 text-sky-700 ring-sky-200",
  RawatInap: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

// Badge tipe non-utama (Utama punya perlakuan khusus = kartu ber-latar).
const TIPE_BADGE: Record<DiagnosaTipe, string> = {
  Utama: "bg-rose-100 text-rose-700",
  Sekunder: "bg-sky-100 text-sky-700",
  Komplikasi: "bg-amber-100 text-amber-700",
  Komorbid: "bg-violet-100 text-violet-700",
};

// Contoh statis untuk pasien demo (non-UUID) — menjaga tampilan panel tanpa DB.
const DEMO_EPISODES: DiagnosaSebelumnyaEpisodeDTO[] = [
  {
    kunjunganId: "demo-rj", noKunjungan: "RJ/2026/0142", unit: "RawatJalan", unitLabel: "Rawat Jalan",
    poli: "Poli Jantung", tanggal: "2026-05-20",
    diagnosa: [
      { kodeIcd10: "I25.1", namaDiagnosis: "Penyakit jantung aterosklerotik", tipe: "Utama", status: "Pasti", pemeriksa: "dr. Ahmad Fauzi, Sp.JP" },
      { kodeIcd10: "I10", namaDiagnosis: "Hipertensi esensial (primer)", tipe: "Sekunder", status: "Pasti", pemeriksa: "dr. Ahmad Fauzi, Sp.JP" },
    ],
  },
  {
    kunjunganId: "demo-igd", noKunjungan: "IGD/2026/0098", unit: "IGD", unitLabel: "IGD",
    poli: null, tanggal: "2026-01-08",
    diagnosa: [
      { kodeIcd10: "R07.4", namaDiagnosis: "Nyeri dada, tidak spesifik", tipe: "Utama", status: "Pasti", pemeriksa: "dr. Rizal Akbar, Sp.EM" },
    ],
  },
];

function DiagRow({ d }: { d: DiagnosaSebelumnyaEpisodeDTO["diagnosa"][number] }) {
  const isUtama = d.tipe === "Utama";
  return (
    <div className={cn(
      "flex items-start gap-2 rounded-lg px-2.5 py-2",
      isUtama ? "border border-rose-200 bg-rose-50 ring-1 ring-rose-100" : "bg-slate-50",
    )}>
      {isUtama && <Crown size={12} className="mt-0.5 shrink-0 text-rose-500" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("font-mono text-[11px] font-bold", isUtama ? "text-rose-700" : "text-slate-600")}>
            {d.kodeIcd10}
          </span>
          <span className={cn("rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide", TIPE_BADGE[d.tipe])}>
            {d.tipe}
          </span>
          {d.status !== "Pasti" && (
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[8px] font-semibold text-slate-600">{d.status}</span>
          )}
        </div>
        <p className={cn("mt-0.5 text-[11px] font-medium leading-snug", isUtama ? "text-rose-900" : "text-slate-700")}>
          {d.namaDiagnosis}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
          <Stethoscope size={9} className="shrink-0" />
          <span className="truncate italic">{d.pemeriksa}</span>
        </p>
      </div>
    </div>
  );
}

function EpisodeCard({ ep }: { ep: DiagnosaSebelumnyaEpisodeDTO }) {
  const unitCls = UNIT_BADGE[ep.unit] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-3 py-2">
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold ring-1", unitCls)}>{ep.unitLabel}</span>
        {ep.poli && <span className="text-[10px] font-medium text-slate-500">{ep.poli}</span>}
        <span className="font-mono text-[10px] text-slate-400">{ep.noKunjungan}</span>
        <span className="ml-auto font-mono text-[11px] font-semibold text-slate-500">{ep.tanggal}</span>
      </div>
      <div className="flex flex-col gap-1.5 p-2.5">
        {ep.diagnosa.map((d, i) => <DiagRow key={`${d.kodeIcd10}-${i}`} d={d} />)}
      </div>
    </div>
  );
}

export default function DiagnosaSebelumnya({
  kunjunganId, className,
}: {
  kunjunganId?: string;
  className?: string;
}) {
  const persisted = !!kunjunganId && UUID_RE.test(kunjunganId);
  const [episodes, setEpisodes] = useState<DiagnosaSebelumnyaEpisodeDTO[] | null>(persisted ? null : DEMO_EPISODES);
  const [state, setState] = useState<"loading" | "done" | "error">(persisted ? "loading" : "done");

  useEffect(() => {
    if (!persisted) return;
    const ac = new AbortController();
    getDiagnosaSebelumnya(kunjunganId!, ac.signal)
      .then((dto) => {
        if (ac.signal.aborted) return;
        setEpisodes(dto.episodes);
        setState("done");
      })
      .catch((e) => { if (!isAbort(e) && !ac.signal.aborted) setState("error"); });
    return () => ac.abort();
  }, [kunjunganId, persisted]);

  const total = (episodes ?? []).reduce((n, e) => n + e.diagnosa.length, 0);

  return (
    <section className={cn(
      "flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs",
      className,
    )}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <History size={13} className="text-indigo-400" /> Diagnosa Medis Sebelumnya
        </span>
        {state === "done" && total > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{total}</span>
        )}
      </div>

      {state === "loading" ? (
        <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
          <Loader2 size={15} className="animate-spin text-sky-500" />
          <span className="text-xs">Memuat riwayat…</span>
        </div>
      ) : state === "error" ? (
        <div className="flex items-center gap-2 px-4 py-6 text-xs text-rose-600">
          <AlertCircle size={14} className="shrink-0" /> Gagal memuat diagnosa sebelumnya.
        </div>
      ) : !episodes || episodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <ClipboardList size={26} className="text-slate-300" />
          <p className="text-xs font-medium text-slate-500">Belum ada diagnosa sebelumnya</p>
          <p className="text-[11px] leading-snug text-slate-400">Diagnosa dari kunjungan IGD / poli / rawat inap terdahulu akan tampil di sini.</p>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 items-start gap-2.5 overflow-y-auto p-3 sm:grid-cols-2 xl:grid-cols-3">
          {episodes.map((ep) => <EpisodeCard key={ep.kunjunganId} ep={ep} />)}
        </div>
      )}
    </section>
  );
}
