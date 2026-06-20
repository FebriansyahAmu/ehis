"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, PackageX, ArrowLeft } from "lucide-react";
import { getFarmasiResep } from "@/lib/api/resep/resep";
import { ApiError } from "@/lib/api/client";
import { mapDbResepOrder, type FarmasiOrder } from "./farmasiShared";
import FarmasiOrderHeader from "./FarmasiOrderHeader";
import FarmasiOrderTabs   from "./FarmasiOrderTabs";

// View state diskriminasi (satu setState per cabang → hindari cascading render). Order tinggal
// di dalam `ready` agar transisi status dari tab (onOrderChange) langsung tercermin di header.
type View =
  | { kind: "loading" }
  | { kind: "ready"; order: FarmasiOrder }
  | { kind: "notfound" }
  | { kind: "error"; msg: string };

// ── Detail order Farmasi (client) — fetch dari DB (medicalrecord.ResepOrder via worklist),
//    lalu render header + tab pelayanan (telaah/dispensing). ──

export default function FarmasiOrderDetail({ id }: { id: string }) {
  const [view, setView] = useState<View>({ kind: "loading" });

  useEffect(() => {
    const ac = new AbortController();
    const run = async () => {
      try {
        const dto = await getFarmasiResep(id, ac.signal);
        if (!ac.signal.aborted) setView({ kind: "ready", order: mapDbResepOrder(dto) });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (!ac.signal.aborted) {
          setView(e instanceof ApiError && e.status === 404
            ? { kind: "notfound" }
            : { kind: "error", msg: e instanceof ApiError ? e.message : "Gagal memuat order" });
        }
      }
    };
    void run();
    return () => ac.abort();
  }, [id]);

  if (view.kind === "loading") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 size={20} className="animate-spin text-sky-500" aria-hidden="true" />
        <span className="text-sm">Memuat order…</span>
      </div>
    );
  }

  if (view.kind !== "ready") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <PackageX size={28} className="text-slate-300" aria-hidden="true" />
        <p className="font-medium text-slate-600">
          {view.kind === "notfound" ? "Order resep tidak ditemukan" : "Gagal memuat order"}
        </p>
        {view.kind === "error" && <p className="text-sm text-slate-400">{view.msg}</p>}
        <Link
          href="/ehis-care/farmasi"
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
        >
          <ArrowLeft size={13} aria-hidden="true" />Kembali ke Farmasi
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <FarmasiOrderHeader order={view.order} />
      <FarmasiOrderTabs   order={view.order} onOrderChange={(o) => setView({ kind: "ready", order: o })} />
    </div>
  );
}
