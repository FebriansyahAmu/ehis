"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Loader2, FlaskConical, ArrowLeft } from "lucide-react";
import { getLabOrder, type LabOrderWorklistDTO } from "@/lib/api/lab/labOrder";
import { ApiError } from "@/lib/api/client";
import { mapDbLabOrder, applyWorkflowOverlay, type LabOrder } from "./labShared";
import LabOrderHeader from "./LabOrderHeader";
import LabOrderTabs   from "./LabOrderTabs";

type View =
  | { kind: "loading" }
  | { kind: "ready"; order: LabOrder }
  | { kind: "notfound" }
  | { kind: "error"; msg: string };

// Detail order Lab (client) — fetch dari DB (medicalrecord.LabOrder via /lab/orders/:id), map ke
// LabOrder + tempel overlay workflow sesi. refresh = re-apply overlay (status/hasil/sampel terbaru).

export default function LabOrderDetail({ id }: { id: string }) {
  const [view, setView] = useState<View>({ kind: "loading" });
  const dtoRef = useRef<LabOrderWorklistDTO | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const dto = await getLabOrder(id, ac.signal);
        if (ac.signal.aborted) return;
        dtoRef.current = dto;
        setView({ kind: "ready", order: applyWorkflowOverlay(mapDbLabOrder(dto)) });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setView(e instanceof ApiError && e.status === 404
          ? { kind: "notfound" }
          : { kind: "error", msg: e instanceof ApiError ? e.message : "Gagal memuat order" });
      }
    })();
    return () => ac.abort();
  }, [id]);

  // Workflow pane mengubah overlay sesi (updateLabWorkflow) → re-map dari DTO + overlay terbaru.
  const refresh = useCallback(() => {
    if (!dtoRef.current) return;
    setView({ kind: "ready", order: applyWorkflowOverlay(mapDbLabOrder(dtoRef.current)) });
  }, []);

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
        <FlaskConical size={28} className="text-slate-300" aria-hidden="true" />
        <p className="font-medium text-slate-600">
          {view.kind === "notfound" ? "Order lab tidak ditemukan" : "Gagal memuat order"}
        </p>
        {view.kind === "error" && <p className="text-sm text-slate-400">{view.msg}</p>}
        <Link
          href="/ehis-care/laboratorium"
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
        >
          <ArrowLeft size={13} aria-hidden="true" />Kembali ke Laboratorium
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <LabOrderHeader order={view.order} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <LabOrderTabs order={view.order} onRefresh={refresh} />
      </div>
    </div>
  );
}
