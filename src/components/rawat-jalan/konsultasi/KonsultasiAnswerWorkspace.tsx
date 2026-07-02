"use client";

// Halaman jawab konsultasi (sisi KONSULTAN) — "rekam medis fokus": identitas pasien ringkas +
// panel konsultasi saja (tanpa 19 tab). Fetch GET /konsultasi/:id → DetailPane mode "konsultan"
// (Terima → Isi Jawaban → kirim; jawaban auto-CPPT ke kunjungan asal, server). Nama konsultan =
// sesi login (read-only). Gate clinical.konsultasi (lintas careUnit, scopeKunjungan:false).

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageSquare, User, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import {
  getKonsultasi, terimaKonsultasi, jawabKonsultasi, type KonsultasiWorklistDTO,
} from "@/lib/api/konsultasi/konsultasi";
import DetailPane from "@/components/shared/medical-records/konsultasi/DetailPane";
import {
  URGENCY_CONFIG, type KonsultasiJawaban,
} from "@/components/shared/medical-records/konsultasi/konsultasiShared";

const UNIT_LABEL: Record<string, string> = {
  IGD: "IGD", RawatInap: "Rawat Inap", RawatJalan: "Rawat Jalan",
};

export default function KonsultasiAnswerWorkspace({ konsultasiId }: { konsultasiId: string }) {
  const { session } = useSession();
  const [item,    setItem]    = useState<KonsultasiWorklistDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    getKonsultasi(konsultasiId, ac.signal)
      .then((dto) => { if (!ac.signal.aborted) setItem(dto); })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof ApiError ? e.message : "Gagal memuat konsultasi");
      })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [konsultasiId]);

  async function handleTerima() {
    try {
      setItem(await terimaKonsultasi(konsultasiId));
      toast.success("Konsultasi diterima", "Silakan isi jawaban konsultasi");
    } catch (e) {
      toast.error("Gagal menerima konsultasi", e instanceof ApiError ? e.message : undefined);
    }
  }

  async function handleJawab(j: KonsultasiJawaban) {
    try {
      setItem(await jawabKonsultasi(konsultasiId, {
        asesmen: j.asesmen,
        rekomendasi: j.rekomendasi,
        tindakLanjut: j.tindakLanjut,
        followUp: j.followUp || undefined,
        konsultan: undefined, // server otoritatif dari actor (sesi login)
      }));
      toast.success("Jawaban terkirim", "Tercatat otomatis di CPPT kunjungan asal");
    } catch (e) {
      toast.error("Gagal mengirim jawaban", e instanceof ApiError ? e.message : undefined);
      throw e; // form jawaban tetap terbuka (DetailPane)
    }
  }

  return (
    <>
      {/* ── Header bar ── */}
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 px-5 py-3">
          <Link
            href="/ehis-care/rawat-jalan"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft size={13} /> Rawat Jalan
          </Link>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
            <MessageSquare size={15} className="text-sky-600" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-slate-900">
              Jawab Konsultasi{item ? ` — ${item.smfNama}` : ""}
            </h1>
            <p className="text-[11px] text-slate-400">Worklist konsultan antar-SMF · SNARS SKP 2</p>
          </div>
          {item && (
            <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold", URGENCY_CONFIG[item.urgency].badge)}>
              {item.urgency}
            </span>
          )}
        </div>

        {/* Identitas pasien + konteks asal */}
        {item && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-100 bg-slate-50/60 px-5 py-2">
            <p className="text-xs font-bold text-slate-800">{item.pasienNama}</p>
            <p className="text-[11px] text-slate-500">{item.noRM} · {item.noKunjungan}</p>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
              Asal: {UNIT_LABEL[item.unitAsal] ?? item.unitAsal}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <User size={10} /> Peminta: {item.dokterPeminta}
            </span>
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden p-4">
        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs">Memuat konsultasi…</span>
          </div>
        ) : error || !item ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <AlertCircle size={22} className="text-rose-400" />
            <p className="text-sm font-semibold text-slate-700">Konsultasi tidak ditemukan</p>
            <p className="text-xs text-slate-400">{error ?? "Periksa kembali tautan worklist"}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <DetailPane
              item={item}
              onUpdate={() => undefined /* status dari server via handler */}
              actions="konsultan"
              konsultanNama={session?.namaTampil}
              onTerima={handleTerima}
              onJawab={handleJawab}
            />
          </div>
        )}
      </div>
    </>
  );
}
