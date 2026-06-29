"use client";

// Fallback detail Rawat Inap untuk kunjungan NYATA (id UUID belum ada di mock detail).
// Menghindari 404: tarik ringkasan admisi dari DB (GET /kunjungan/:id) + resolusi nama
// ruangan/DPJP dari master. Rekam medis klinis 19-tab penuh = migrasi terpisah.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BedDouble, Loader2, AlertCircle, Stethoscope, DoorOpen, Shield, CalendarDays,
  ClipboardList, FileText, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getKunjungan, type KunjunganDTO } from "@/lib/api/kunjungan";
import { getTree } from "@/lib/api/ruangan";
import { listDokter } from "@/lib/api/dokter";
import type { LocationNode } from "@/components/master/ruangan/ruanganShared";

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";

const PENJAMIN_LABEL: Record<string, string> = {
  BPJS_PBI: "BPJS PBI", BPJS_Non_PBI: "BPJS Non-PBI", Umum: "Umum / Mandiri", Asuransi: "Asuransi", Jamkesda: "Jamkesda",
};
const KELAS_LABEL: Record<string, string> = {
  VIP: "VIP", Kelas_1: "Kelas 1", Kelas_2: "Kelas 2", Kelas_3: "Kelas 3", ICU: "ICU", HCU: "HCU", Isolasi: "Isolasi",
};

export function RIDetailFallbackClient({ id }: { id: string }) {
  const [k, setK] = useState<KunjunganDTO | null>(null);
  const [ruanganNama, setRuanganNama] = useState<string | null>(null);
  const [dpjpNama, setDpjpNama] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;
    getKunjungan(id, ctrl.signal)
      .then(async (kun) => {
        if (cancelled) return;
        setK(kun);
        // Resolusi nama ruangan + DPJP (best-effort).
        const [tree, dokter] = await Promise.all([
          getTree(ctrl.signal).catch(() => [] as { type: string }[]),
          kun.dpjpId ? listDokter({ limit: 200 }, ctrl.signal).catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
        ]);
        if (cancelled) return;
        if (kun.ruanganId) {
          const room = (tree as LocationNode[]).find((n) => n.type === "Location" && n.id === kun.ruanganId);
          setRuanganNama(room?.name ?? null);
        }
        if (kun.dpjpId) {
          const d = dokter.items.find((x) => x.id === kun.dpjpId);
          setDpjpNama(d?.namaTampil ?? null);
        }
      })
      .catch((e) => { if (!cancelled && !isAbort(e)) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; ctrl.abort(); };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-slate-400">
        <Loader2 size={18} className="animate-spin text-emerald-500" />
        <span className="text-sm">Memuat rekam admisi…</span>
      </div>
    );
  }

  if (notFound || !k) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle size={32} className="text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">Kunjungan tidak ditemukan</p>
        <p className="max-w-sm text-xs text-slate-400">Data tidak tersedia atau di luar akses unit Anda.</p>
        <Link href="/ehis-care/rawat-inap" className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
          <ArrowLeft size={13} /> Kembali ke Rawat Inap
        </Link>
      </div>
    );
  }

  const admit = new Date(k.waktuKunjungan).toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const rows: { icon: typeof DoorOpen; label: string; value: string; mono?: boolean }[] = [
    { icon: DoorOpen, label: "Ruangan", value: ruanganNama ?? "—" },
    { icon: BedDouble, label: "Kelas", value: k.kelas ? (KELAS_LABEL[k.kelas] ?? k.kelas) : "—" },
    { icon: Stethoscope, label: "DPJP", value: dpjpNama ?? "Belum ditetapkan" },
    { icon: Shield, label: "Penjamin", value: PENJAMIN_LABEL[k.penjaminTipe] ?? k.penjaminTipe },
    { icon: CalendarDays, label: "Tanggal Masuk", value: admit },
    { icon: ClipboardList, label: "No. Kunjungan", value: k.noKunjungan, mono: true },
    { icon: FileText, label: "Diagnosa Masuk", value: k.diagnosaMasuk ? `${k.kodeIcdMasuk ?? ""} ${k.diagnosaMasuk}`.trim() : "—" },
    { icon: FileText, label: "No. SEP", value: k.sep?.noSep ?? "—", mono: true },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <Link href="/ehis-care/rawat-inap" aria-label="Kembali" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-base font-black text-emerald-700">
          {k.pasien.nama.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-slate-900">{k.pasien.nama}</h1>
          <p className="text-xs text-slate-400">
            <span className="font-mono">{k.pasien.noRm}</span> · Rawat Inap · {k.status}
          </p>
        </div>
        <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 sm:inline">
          Teradmisi
        </span>
      </div>

      {/* Info admisi */}
      <div className="p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((r) => (
            <div key={r.label} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <r.icon size={11} /> {r.label}
              </p>
              <p className={cn("mt-1 text-sm font-semibold text-slate-800", r.mono && "font-mono")}>{r.value}</p>
            </div>
          ))}
        </div>

        {/* Notice migrasi */}
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
          <Info size={15} className="mt-0.5 shrink-0 text-sky-500" />
          <div className="text-[12px] leading-relaxed text-sky-800">
            <p className="font-bold">Menampilkan ringkasan admisi.</p>
            <p className="text-sky-700">
              Rekam medis klinis lengkap (TTV, CPPT, Diagnosa, Asuhan Keperawatan, dll.) untuk pasien yang
              diadmisi via pendaftaran sedang dimigrasikan ke data nyata. Data klinis akan tampil di sini
              setelah migrasi rekam medis Rawat Inap selesai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
