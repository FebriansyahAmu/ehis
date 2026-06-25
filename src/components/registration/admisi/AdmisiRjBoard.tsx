"use client";

// Admisi Rawat Jalan — daftar/riwayat pendaftaran poliklinik terkini (read-only monitoring).
// RJ tidak ber-gate SPRI/bed seperti Rawat Inap → ini feed aktivitas pendaftaran RJ, bukan
// worklist aksi. Data: GET /kunjungan?unit=RawatJalan (worklist cursor, urut createdAt desc).
// Klik baris → dashboard pasien. Accent teal (selaras modul Registrasi).

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search, Loader2, Inbox, Clock, ChevronRight, Stethoscope, Activity, CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { listKunjungan, type KunjunganListItemDTO } from "@/lib/api/kunjungan";

const FETCH_LIMIT = 25;
const ALL_STATUS = "Registered,Queued,InService,Completed,Closed,Billed,Claimed,Cancelled";

const STATUS_LABEL: Record<string, string> = {
  Registered: "Terdaftar", Queued: "Menunggu", InService: "Dalam Perawatan",
  Completed: "Selesai", Closed: "Selesai", Billed: "Selesai", Claimed: "Selesai",
  Cancelled: "Dibatalkan",
};

const STATUS_STYLE: Record<string, string> = {
  "Terdaftar":       "bg-sky-50 text-sky-700",
  "Menunggu":        "bg-amber-50 text-amber-700",
  "Dalam Perawatan": "bg-emerald-50 text-emerald-700",
  "Selesai":         "bg-slate-100 text-slate-500",
  "Dibatalkan":      "bg-slate-100 text-slate-400",
};

interface RjVisit {
  id: string;
  nama: string;
  noRM: string;
  poli: string | null;
  penjamin: string;
  status: string;
  rawStatus: string;
  time: string;
}

function toRjVisit(d: KunjunganListItemDTO): RjVisit {
  return {
    id: d.id,
    nama: d.pasien.nama,
    noRM: d.pasien.noRm,
    poli: d.poli,
    penjamin: d.penjaminTipe,
    status: STATUS_LABEL[d.status] ?? d.status,
    rawStatus: d.status,
    // waktuKunjungan disimpan apa-adanya (wall-clock dianggap UTC) → tampilkan UTC.
    time: new Date(d.waktuKunjungan).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }),
  };
}

export default function AdmisiRjBoard() {
  const [rows, setRows] = useState<RjVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  const refetch = useCallback(async (signal?: AbortSignal) => {
    try {
      const { items } = await listKunjungan({ unit: "RawatJalan", status: ALL_STATUS, limit: FETCH_LIMIT }, signal);
      if (!signal?.aborted) { setRows(items.map(toRjVisit)); setError(false); }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (!signal?.aborted) setError(true);
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
    return rows.filter((r) =>
      r.nama.toLowerCase().includes(q) || r.noRM.toLowerCase().includes(q) ||
      (r.poli ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const stats = useMemo(() => ({
    menunggu: rows.filter((r) => r.rawStatus === "Queued" || r.rawStatus === "Registered").length,
    proses: rows.filter((r) => r.rawStatus === "InService").length,
    total: rows.length,
  }), [rows]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] text-slate-400">
        Riwayat pendaftaran poliklinik terkini — klik baris untuk membuka dashboard pasien.
      </p>

      {/* Stat strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat icon={<Clock size={16} />} label="Menunggu" value={stats.menunggu} cls="border-amber-200 bg-amber-50 text-amber-700" dot="bg-amber-400" />
        <Stat icon={<Activity size={16} />} label="Dalam Perawatan" value={stats.proses} cls="border-emerald-200 bg-emerald-50 text-emerald-700" dot="bg-emerald-500" />
        <Stat icon={<CalendarDays size={16} />} label="Total Terkini" value={stats.total} cls="border-teal-200 bg-teal-50 text-teal-700" dot="bg-teal-500" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari pasien / No. RM / poli…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 size={16} className="animate-spin text-teal-500" /><span className="text-[13px]">Memuat pendaftaran rawat jalan…</span>
        </div>
      ) : error ? (
        <p className="py-12 text-center text-[13px] text-slate-400">Gagal memuat pendaftaran rawat jalan.</p>
      ) : filtered.length === 0 ? (
        <Empty hasQuery={search.trim().length > 0} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-50">
            {filtered.map((r, i) => <VisitRow key={r.id} v={r} index={i} />)}
          </div>
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

function VisitRow({ v, index }: { v: RjVisit; index: number }) {
  const initials = v.nama.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4), ease: "easeOut" }}
    >
      <Link
        href={`/ehis-registration/pasien/${encodeURIComponent(v.noRM)}`}
        className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-teal-50/60"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-[9px] font-black text-teal-700">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-800 transition-colors group-hover:text-teal-700">{v.nama}</p>
          <p className="font-mono text-[10px] text-slate-400">{v.noRM}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {v.poli && (
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold text-sky-600">
              <Stethoscope size={9} />{v.poli}
            </span>
          )}
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", STATUS_STYLE[v.status] ?? "bg-slate-100 text-slate-500")}>
            {v.status}
          </span>
        </div>
        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          <Clock size={9} className="text-slate-300" />
          <span className="text-[10px] text-slate-400">{v.time}</span>
        </div>
        <ChevronRight size={11} className="shrink-0 text-slate-300 transition-colors group-hover:text-teal-400" />
      </Link>
    </motion.div>
  );
}

function Empty({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
        {hasQuery ? <Search size={24} /> : <Inbox size={26} />}
      </span>
      <p className="text-sm font-semibold text-slate-600">
        {hasQuery ? "Tidak ada pendaftaran cocok" : "Belum ada pendaftaran rawat jalan"}
      </p>
      <p className="max-w-sm text-xs text-slate-400">
        {hasQuery
          ? "Coba kata kunci lain (nama, No. RM, atau poli)."
          : "Pendaftaran poliklinik terbaru akan muncul di sini sebagai riwayat aktivitas."}
      </p>
    </div>
  );
}
