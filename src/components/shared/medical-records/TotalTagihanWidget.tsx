"use client";

// Total Tagihan (header rekam medis IGD/RI/RJ) — chip akumulasi biaya kunjungan.
//
// Pasien NYATA (kunjungan UUID): sumber = PROYEKSI billing via endpoint klinis
// /kunjungan/:id/billing/ringkas (gate clinical.rekammedis:read) → breakdown per kategori
// (Akomodasi + Tindakan + Lab + Rad + Obat & BMHP + Jasa Dokter + Lain-lain), total = subtotal.
// Angka ini IDENTIK dengan tagihan nyata (BillingMiniWidget "Sisa") → selaras. Reaktif via
// recordBus domain "order". Pasien demo (non-UUID) → dari ORDERS_MOCK (indikatif; tanpa akomodasi).
//
// Berbeda dari BillingMiniWidget (SISA = grandTotal − pembayaran): ini = TOTAL/gross charges.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Wallet, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBillingRingkas } from "@/lib/api/billing/invoice";
import { useRecordVersion } from "@/lib/realtime/recordBus";
import { fmtRupiahShort } from "@/lib/master/penjaminMock";
import { ORDERS_MOCK, costByType, fmtRp } from "./daftarOrder/daftarOrderShared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Kategori proyeksi billing → label + warna dot (urutan tampil di popover).
const KATEGORI_CFG: { key: string; label: string; dot: string }[] = [
  { key: "Akomodasi",   label: "Akomodasi",     dot: "bg-violet-400"  },
  { key: "Tindakan",    label: "Tindakan",      dot: "bg-fuchsia-400" },
  { key: "Jasa Dokter", label: "Jasa Dokter",   dot: "bg-rose-400"    },
  { key: "Lab",         label: "Laboratorium",  dot: "bg-sky-400"     },
  { key: "Rad",         label: "Radiologi",     dot: "bg-teal-400"    },
  { key: "Obat & BMHP", label: "Obat & BMHP",   dot: "bg-indigo-400"  },
  { key: "Lain-lain",   label: "Lain-lain",     dot: "bg-amber-400"   },
];

interface Akumulasi {
  byKat: Record<string, number>;
  total: number;
}

const EMPTY: Akumulasi = { byKat: {}, total: 0 };

/** Akumulasi biaya dari proyeksi billing (UUID) atau mock (demo), reaktif atas domain "order". */
function useTotalTagihan(kunjunganId: string, noRM: string): { data: Akumulasi; loading: boolean } {
  const isPersisted = UUID_RE.test(kunjunganId);
  const orderVersion = useRecordVersion(kunjunganId, "order", isPersisted);

  // Demo (non-UUID): dari ORDERS_MOCK → petakan ke kategori proyeksi (Resep+BMHP = Obat & BMHP).
  const mock = useMemo<Akumulasi>(() => {
    if (isPersisted) return EMPTY;
    const { byType, total } = costByType(ORDERS_MOCK[noRM] ?? []);
    return {
      byKat: {
        "Lab": byType.Lab,
        "Rad": byType.Radiologi,
        "Obat & BMHP": byType.Resep + byType.BMHP,
      },
      total,
    };
  }, [isPersisted, noRM]);

  const [data, setData] = useState<Akumulasi>(mock);
  const [loading, setLoading] = useState(isPersisted);

  useEffect(() => {
    if (!isPersisted) { setData(mock); setLoading(false); return; }
    const ac = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const r = await getBillingRingkas(kunjunganId, ac.signal);
        if (ac.signal.aborted) return;
        const byKat: Record<string, number> = {};
        for (const b of r.byKategori) byKat[b.kategori] = b.total;
        setData({ byKat, total: r.subtotal });
      } catch {
        /* diam — chip advisory, kegagalan tak menghalangi rekam medis */
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunjunganId, isPersisted, orderVersion]);

  return { data, loading };
}

export default function TotalTagihanWidget({ kunjunganId, noRM }: { kunjunganId: string; noRM: string }) {
  const { data, loading } = useTotalTagihan(kunjunganId, noRM);
  const empty = data.total <= 0;
  const isPersisted = UUID_RE.test(kunjunganId);
  const rows = KATEGORI_CFG.filter((r) => (data.byKat[r.key] ?? 0) > 0);

  const chipCls = cn(
    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10.5px] font-semibold ring-1 transition",
    empty && !loading
      ? "bg-slate-100 text-slate-500 ring-slate-200"
      : "bg-indigo-50 text-indigo-700 ring-indigo-200 group-hover:bg-indigo-100",
    isPersisted && "cursor-pointer",
  );
  const chipInner = (
    <>
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Wallet size={11} />}
      <span className="hidden sm:inline">Total Tagihan</span>
      <span className="font-mono tabular-nums">
        {loading ? "…" : empty ? "—" : `Rp ${fmtRupiahShort(data.total)}`}
      </span>
      {isPersisted && !loading && (
        <ChevronRight size={10} className="opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
      )}
    </>
  );

  return (
    <div className="group relative shrink-0">
      {isPersisted ? (
        <Link
          href={`/ehis-billing/tagihan/kunjungan/${encodeURIComponent(kunjunganId)}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Buka rincian tagihan (proyeksi order + akomodasi)"
          className={chipCls}
        >
          {chipInner}
        </Link>
      ) : (
        <div className={chipCls}>{chipInner}</div>
      )}

      {/* Popover rincian per kategori (hover) */}
      {!loading && !empty && (
        <div className="pointer-events-none absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-3 opacity-0 shadow-xl transition duration-150 group-hover:opacity-100">
          <div className="mb-2 flex items-center gap-1.5">
            <Wallet size={12} className="text-indigo-500" />
            <p className="text-[11px] font-bold text-slate-700">Rincian Tagihan</p>
          </div>
          <div className="flex flex-col gap-1">
            {rows.map((r) => (
              <div key={r.key} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className={cn("h-1.5 w-1.5 rounded-full", r.dot)} />
                  {r.label}
                </span>
                <span className="font-mono tabular-nums text-slate-700">{fmtRp(data.byKat[r.key] ?? 0)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-[11px] font-semibold text-slate-500">Total</span>
            <span className="font-mono text-xs font-extrabold tabular-nums text-indigo-700">{fmtRp(data.total)}</span>
          </div>
          <p className="mt-1.5 text-[9.5px] leading-tight text-slate-400">
            {isPersisted
              ? "Proyeksi order + akomodasi · sebelum diskon/pembayaran"
              : "Estimasi order · order dibatalkan tak dihitung"}
          </p>
        </div>
      )}
    </div>
  );
}
