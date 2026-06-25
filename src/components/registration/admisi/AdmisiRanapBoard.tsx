"use client";

// Worklist Admisi Rawat Inap — daftar SPRI (Surat Perintah Rawat Inap) yang terbit dari IGD,
// belum dikonsumsi. Petugas admisi: (1) "Revisi & Kirim Ulang" → retry No. Referensi ke BPJS
// (saat kepesertaan aktif kembali); (2) "Daftar Rawat Inap" → deep-link ke dashboard pasien
// (modal Pendaftaran Kunjungan Baru pra-isi RI; konsumsi SPRI setelah terdaftar).
// Data: GET /spri · aksi: PATCH /spri/:id/revisi. Accent teal (selaras modul Registrasi).

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BedDouble, Search, Loader2, Inbox, Send, RefreshCw, Hash, Stethoscope,
  Activity, CheckCircle2, Clock, CalendarDays, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { listSpri, reviseSpri, type SpriDTO } from "@/lib/api/spri/spri";

function fmtDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_CFG: Record<string, { label: string; badge: string; dot: string }> = {
  MenungguRef: { label: "Menunggu Ref BPJS", badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", dot: "bg-amber-400" },
  Terbit:      { label: "Ref Terbit",         badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
};

export default function AdmisiRanapBoard() {
  const [rows, setRows] = useState<SpriDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const refetch = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await listSpri({}, signal);
      if (!signal?.aborted) setRows(data);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Gagal memuat worklist admisi", e instanceof ApiError ? e.message : undefined);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void refetch(ac.signal);
    return () => ac.abort();
  }, [refetch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((s) =>
      s.namaPasien.toLowerCase().includes(q) || s.noRM.toLowerCase().includes(q) ||
      s.dpjpNama.toLowerCase().includes(q) || (s.poliNama ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const stats = useMemo(() => ({
    menunggu: rows.filter((s) => s.status === "MenungguRef").length,
    siap: rows.filter((s) => s.status === "Terbit").length,
    total: rows.length,
  }), [rows]);

  async function doRevise(id: string) {
    setBusyId(id);
    try {
      const dto = await reviseSpri(id);
      if (dto.noReferensi) toast.success("No. Referensi terbit", `${dto.noReferensi}`);
      else toast.info("BPJS masih bermasalah", "Referensi belum terbit — coba lagi nanti.");
      await refetch();
    } catch (e) {
      toast.error("Gagal mengirim ulang SPRI", e instanceof ApiError ? e.message : undefined);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold text-slate-900">Admisi Rawat Inap</h1>
        <p className="mt-0.5 text-xs text-slate-400">
          SPRI yang terbit dari IGD — revisi No. Referensi BPJS &amp; daftarkan kunjungan Rawat Inap.
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat icon={<Clock size={16} />} label="Menunggu Ref BPJS" value={stats.menunggu} cls="border-amber-200 bg-amber-50 text-amber-700" dot="bg-amber-400" />
        <Stat icon={<CheckCircle2 size={16} />} label="Siap Admisi (Ref Terbit)" value={stats.siap} cls="border-emerald-200 bg-emerald-50 text-emerald-700" dot="bg-emerald-500" />
        <Stat icon={<BedDouble size={16} />} label="Total Antre Admisi" value={stats.total} cls="border-teal-200 bg-teal-50 text-teal-700" dot="bg-teal-500" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari pasien / No. RM / DPJP / poli…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 size={16} className="animate-spin text-teal-500" /><span className="text-[13px]">Memuat worklist admisi…</span>
        </div>
      ) : filtered.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <SpriCard key={s.id} spri={s} busy={busyId === s.id} onRevise={() => doRevise(s.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-komponen ──────────────────────────────────────────

function Stat({ icon, label, value, cls, dot }: { icon: React.ReactNode; label: string; value: number; cls: string; dot: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", cls)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60">{icon}</span>
      <div>
        <p className="text-xl font-bold leading-none tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs font-medium opacity-80">{label}</p>
      </div>
      <span className={cn("ml-auto h-2 w-2 rounded-full", dot)} />
    </div>
  );
}

function SpriCard({ spri, busy, onRevise }: { spri: SpriDTO; busy: boolean; onRevise: () => void }) {
  const cfg = STATUS_CFG[spri.status] ?? STATUS_CFG.MenungguRef;
  const daftarHref = `/ehis-registration/pasien/${encodeURIComponent(spri.noRM)}?daftar=ranap&spri=${encodeURIComponent(spri.id)}`;
  return (
    <motion.div
      layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-800">{spri.namaPasien}</p>
          <p className="font-mono text-[11px] text-slate-400">RM {spri.noRM} · {spri.noKunjungan}</p>
        </div>
        <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", cfg.badge)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />{cfg.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 px-3.5 py-3">
        <Row icon={<Stethoscope size={13} className="text-violet-400" />} label="DPJP">{spri.dpjpNama}</Row>
        <Row icon={<BedDouble size={13} className="text-teal-400" />} label="Jenis Rawat">{spri.jenisPerawatan}</Row>
        <Row icon={<Activity size={13} className="text-violet-400" />} label="SMF / Poli">
          {spri.poliNama ? (
            <span>{spri.poliNama} {spri.poliKode && <span className="font-mono text-[10px] text-slate-400">({spri.poliKode})</span>}</span>
          ) : <span className="text-slate-400">—</span>}
        </Row>
        <Row icon={<CalendarDays size={13} className="text-sky-400" />} label="Rencana Rawat">{fmtDate(spri.tglRencanaRawat)}</Row>
        <Row icon={<Hash size={13} className="text-slate-400" />} label="No. Referensi">
          {spri.noReferensi
            ? <span className="font-mono font-semibold text-emerald-700">{spri.noReferensi}</span>
            : <span className="text-amber-600">Belum terbit (BPJS)</span>}
        </Row>
        {spri.indikasi && (
          <p className="mt-0.5 line-clamp-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] leading-snug text-slate-500">
            <span className="font-semibold text-slate-600">Indikasi: </span>{spri.indikasi}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-slate-100 px-3.5 py-2.5">
        {spri.status === "MenungguRef" && (
          <button
            type="button" onClick={onRevise} disabled={busy}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition",
              busy ? "cursor-not-allowed border-slate-200 text-slate-300" : "border-amber-300 text-amber-700 hover:bg-amber-50",
            )}
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Revisi &amp; Kirim Ulang
          </button>
        )}
        <Link
          href={daftarHref}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          <Send size={13} /> Daftar Rawat Inap <ArrowRight size={12} />
        </Link>
      </div>
    </motion.div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="flex w-24 shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {icon}{label}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{children}</span>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300"><Inbox size={26} /></span>
      <p className="text-sm font-semibold text-slate-600">Belum ada SPRI menunggu admisi</p>
      <p className="max-w-sm text-xs text-slate-400">
        SPRI yang diterbitkan dari IGD (status pulang Rawat Inap) akan muncul di sini untuk didaftarkan ke ruang rawat inap.
      </p>
    </div>
  );
}
