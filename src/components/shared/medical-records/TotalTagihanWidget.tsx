"use client";

// Total Tagihan (header rekam medis IGD/RI/RJ) — chip akumulasi biaya SEMUA order klinis
// kunjungan: Tindakan + Resep + Lab + Radiologi + BMHP. Order Dibatalkan tak dihitung.
//
// Sumber = tabel order DB (kunjungan UUID): getTindakanMedis + listResep/Lab/Bmhp/Rad. Reaktif via
// recordBus domain "order" (di-emit dari API client saat create/cancel/update) → chip re-akumulasi
// tanpa refresh halaman. Pasien demo (non-UUID) → dari ORDERS_MOCK (indikatif; sebagian tanpa tarif).
//
// Berbeda dari BillingMiniWidget (yang membaca invoice billing/sisa bayar): ini ESTIMASI biaya
// dari order klinis langsung — lengkap walau charge-ingest billing belum penuh (BL6 ~80%).

import { useEffect, useMemo, useState } from "react";
import { Wallet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listResep } from "@/lib/api/resep/resep";
import { listLabOrders } from "@/lib/api/lab/labOrder";
import { listBmhpOrders } from "@/lib/api/bmhpOrder/bmhpOrder";
import { listRadOrders } from "@/lib/api/rad/radOrder";
import { getTindakanMedis } from "@/lib/api/tindakanMedis/tindakanMedis";
import { useRecordVersion } from "@/lib/realtime/recordBus";
import { fmtRupiahShort } from "@/lib/master/penjaminMock";
import {
  ORDERS_MOCK, costByType, mergeDbOrders, fmtRp,
} from "./daftarOrder/daftarOrderShared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Rincian akumulasi per baris breakdown + grand total. */
interface Breakdown {
  Tindakan: number;
  Resep: number;
  Lab: number;
  Radiologi: number;
  BMHP: number;
  total: number;
}

const EMPTY: Breakdown = { Tindakan: 0, Resep: 0, Lab: 0, Radiologi: 0, BMHP: 0, total: 0 };

const ROWS: { key: keyof Omit<Breakdown, "total">; label: string; dot: string }[] = [
  { key: "Tindakan",  label: "Tindakan",  dot: "bg-fuchsia-400" },
  { key: "Resep",     label: "Resep",     dot: "bg-indigo-400"  },
  { key: "Lab",       label: "Laboratorium", dot: "bg-sky-400"  },
  { key: "Radiologi", label: "Radiologi", dot: "bg-teal-400"    },
  { key: "BMHP",      label: "BMHP",      dot: "bg-amber-400"   },
];

/** Akumulasi biaya order dari DB (UUID) atau mock (demo), reaktif atas domain "order". */
function useTotalTagihan(kunjunganId: string, noRM: string): { data: Breakdown; loading: boolean } {
  const isPersisted = UUID_RE.test(kunjunganId);
  const orderVersion = useRecordVersion(kunjunganId, "order", isPersisted);

  const mock = useMemo<Breakdown>(() => {
    if (isPersisted) return EMPTY;
    const orders = ORDERS_MOCK[noRM] ?? [];
    const { byType, total } = costByType(orders);
    return { Tindakan: 0, Resep: byType.Resep, Lab: byType.Lab, Radiologi: byType.Radiologi, BMHP: byType.BMHP, total };
  }, [isPersisted, noRM]);

  const [data, setData] = useState<Breakdown>(mock);
  const [loading, setLoading] = useState(isPersisted);

  useEffect(() => {
    if (!isPersisted) { setData(mock); setLoading(false); return; }
    const ac = new AbortController();
    (async () => {
      try {
        const [resep, lab, bmhp, rad, tindakan] = await Promise.all([
          listResep(kunjunganId, ac.signal),
          listLabOrders(kunjunganId, ac.signal),
          listBmhpOrders(kunjunganId, ac.signal),
          listRadOrders(kunjunganId, ac.signal),
          getTindakanMedis(kunjunganId, ac.signal),
        ]);
        if (ac.signal.aborted) return;
        const { byType } = costByType(mergeDbOrders(resep, lab, bmhp, rad));
        const tindakanTotal = tindakan.reduce((s, t) => s + (t.harga ?? 0) * t.jumlah, 0);
        setData({
          Tindakan: tindakanTotal,
          Resep: byType.Resep, Lab: byType.Lab, Radiologi: byType.Radiologi, BMHP: byType.BMHP,
          total: tindakanTotal + byType.Resep + byType.Lab + byType.Radiologi + byType.BMHP,
        });
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

  return (
    <div className="group relative shrink-0">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10.5px] font-semibold ring-1 transition",
          empty && !loading
            ? "bg-slate-100 text-slate-500 ring-slate-200"
            : "bg-indigo-50 text-indigo-700 ring-indigo-200 group-hover:bg-indigo-100",
        )}
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <Wallet size={11} />}
        <span className="hidden sm:inline">Total Tagihan</span>
        <span className="font-mono tabular-nums">
          {loading ? "…" : empty ? "—" : `Rp ${fmtRupiahShort(data.total)}`}
        </span>
      </div>

      {/* Popover rincian per jenis (hover) */}
      {!loading && !empty && (
        <div className="pointer-events-none absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-3 opacity-0 shadow-xl transition duration-150 group-hover:opacity-100">
          <div className="mb-2 flex items-center gap-1.5">
            <Wallet size={12} className="text-indigo-500" />
            <p className="text-[11px] font-bold text-slate-700">Estimasi Tagihan Order</p>
          </div>
          <div className="flex flex-col gap-1">
            {ROWS.filter((r) => data[r.key] > 0).map((r) => (
              <div key={r.key} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className={cn("h-1.5 w-1.5 rounded-full", r.dot)} />
                  {r.label}
                </span>
                <span className="font-mono tabular-nums text-slate-700">{fmtRp(data[r.key])}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-[11px] font-semibold text-slate-500">Total</span>
            <span className="font-mono text-xs font-extrabold tabular-nums text-indigo-700">{fmtRp(data.total)}</span>
          </div>
          <p className="mt-1.5 text-[9.5px] leading-tight text-slate-400">
            Akumulasi order aktif · order dibatalkan tak dihitung
          </p>
        </div>
      )}
    </div>
  );
}
