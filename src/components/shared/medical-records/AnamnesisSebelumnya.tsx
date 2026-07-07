"use client";

// Panel referensi "Anamnesis Sebelumnya" (longitudinal, read-only) — shared IGD/RI/RJ.
// Menampilkan anamnesis TERBARU per kunjungan, lintas semua kunjungan pasien (IGD/Poli/RI):
// keluhan utama, RPS, status generalis, obat, pemeriksa. Continuity of care (SNARS AP 1.2).
//
// kunjunganId UUID → tarik DB (GET /kunjungan/:id/anamnesis-sebelumnya). Non-UUID (demo) →
// contoh statis (tanpa network). Murni baca — tak ada aksi tulis.

import { useEffect, useState } from "react";
import {
  History, ChevronDown, Loader2, AlertCircle, Stethoscope, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRiwayatAnamnesis, type AnamnesisRiwayatEpisodeDTO } from "@/lib/api/asesmenMedis/anamnesis";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";

const UNIT_BADGE: Record<string, string> = {
  IGD: "bg-rose-50 text-rose-700 ring-rose-200",
  RawatJalan: "bg-sky-50 text-sky-700 ring-sky-200",
  RawatInap: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

// Contoh statis untuk pasien demo (non-UUID) — menjaga tampilan panel tanpa DB.
const DEMO_EPISODES: AnamnesisRiwayatEpisodeDTO[] = [
  {
    kunjunganId: "demo-igd", noKunjungan: "IGD/2026/0098", unit: "IGD", unitLabel: "IGD",
    poli: null, tanggal: "2026-01-08", isCurrent: false, pemeriksa: "dr. Rizal Akbar, Sp.EM",
    keluhanUtama: "Nyeri dada kiri menjalar ke lengan",
    rps: "Nyeri dada kiri sejak 2 jam SMRS, menjalar ke lengan kiri, disertai keringat dingin. Riwayat hipertensi.",
    statusGeneralis: "Tampak sakit sedang, kesadaran kompos mentis, akral dingin.",
    obatSaatIni: "Amlodipine 10 mg, Bisoprolol 2.5 mg",
  },
];

function EpisodeCard({ ep }: { ep: AnamnesisRiwayatEpisodeDTO }) {
  const [open, setOpen] = useState(false);
  const unitCls = UNIT_BADGE[ep.unit] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <div className={cn(
      "overflow-hidden rounded-xl border bg-white shadow-sm",
      ep.isCurrent ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200",
    )}>
      <div className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold ring-1", unitCls)}>
            {ep.unitLabel}
          </span>
          {ep.poli && <span className="text-[10px] font-medium text-slate-500">{ep.poli}</span>}
          <span className="font-mono text-[10px] text-slate-400">{ep.noKunjungan}</span>
          <span className="ml-auto font-mono text-[11px] font-semibold text-slate-500">{ep.tanggal}</span>
          {ep.isCurrent && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">Kunjungan Ini</span>
          )}
        </div>
        <p className="mt-1 text-xs font-bold text-slate-800">{ep.keluhanUtama}</p>
      </div>

      <div className="px-4 py-3">
        <p className={cn("text-xs leading-relaxed text-slate-600", !open && "line-clamp-3")}>{ep.rps}</p>

        {open && (
          <div className="mt-2 space-y-1.5 rounded-lg bg-slate-50 p-2.5">
            {([
              ["Status Generalis", ep.statusGeneralis],
              ["Obat Saat Ini", ep.obatSaatIni],
            ] as const).filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{k}</p>
                <p className="text-xs leading-relaxed text-slate-700">{v}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1 text-[11px] text-slate-400">
            <Stethoscope size={10} className="shrink-0" />
            <span className="italic">{ep.pemeriksa}</span>
          </p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-expanded={open}
          >
            {open ? "Tutup" : "Selengkapnya"}
            <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnamnesisSebelumnya({
  kunjunganId, className,
}: {
  kunjunganId: string;
  className?: string;
}) {
  const persisted = UUID_RE.test(kunjunganId);
  const [episodes, setEpisodes] = useState<AnamnesisRiwayatEpisodeDTO[] | null>(persisted ? null : DEMO_EPISODES);
  const [state, setState] = useState<"loading" | "done" | "error">(persisted ? "loading" : "done");

  // State awal sudah "loading" saat persisted (rekam medis = 1 kunjungan/halaman, kunjunganId
  // stabil) → tak perlu setState sinkron di body efek (cascading-render lint).
  useEffect(() => {
    if (!persisted) return;
    const ac = new AbortController();
    getRiwayatAnamnesis(kunjunganId, ac.signal)
      .then((dto) => {
        if (ac.signal.aborted) return;
        setEpisodes(dto.episodes);
        setState("done");
      })
      .catch((e) => { if (!isAbort(e) && !ac.signal.aborted) setState("error"); });
    return () => ac.abort();
  }, [kunjunganId, persisted]);

  const total = episodes?.length ?? 0;

  return (
    // Pinned di sisi form: self-start + sticky agar panel tetap terlihat saat form panjang
    // digulir; tinggi ikut viewport (bukan fixed) → daftar panjang bisa digulir penuh, tak
    // terpotong. Di mobile (stacked) → cap 70vh, gulir internal.
    <section className={cn(
      "flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
      "self-start md:sticky md:top-0 md:max-h-[calc(100dvh-7rem)]",
      className,
    )}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <History size={13} className="text-slate-400" /> Anamnesis Sebelumnya
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
          <AlertCircle size={14} className="shrink-0" /> Gagal memuat riwayat anamnesis.
        </div>
      ) : !episodes || episodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <FileText size={26} className="text-slate-300" />
          <p className="text-xs font-medium text-slate-500">Belum ada anamnesis sebelumnya</p>
          <p className="text-[11px] text-slate-400">Anamnesis dari kunjungan IGD / poli / rawat inap akan tampil di sini.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
          {episodes.map((ep) => <EpisodeCard key={ep.kunjunganId} ep={ep} />)}
        </div>
      )}
    </section>
  );
}
