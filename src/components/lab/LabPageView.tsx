"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listLabWorklist } from "@/lib/api/lab/labOrder";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import { mapDbLabOrder, applyWorkflowOverlay, type LabOrder } from "./labShared";
import LabBoard         from "./LabBoard";
import LabManajemenTabs from "./LabManajemenTabs";

type View = "worklist" | "manajemen";

export default function LabPageView() {
  const [view, setView]       = useState<View>("worklist");
  const [orders, setOrders]   = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async (signal?: AbortSignal) => {
    try {
      const rows = await listLabWorklist({}, signal);
      if (!signal?.aborted) setOrders(rows.map((d) => applyWorkflowOverlay(mapDbLabOrder(d))));
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Gagal memuat order lab", e instanceof ApiError ? e.message : undefined);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void refetch(ac.signal);
    return () => ac.abort();
  }, [refetch]);

  // Notifikasi worklist: jumlah order baru yang belum diterima Lab.
  const pendingCount = useMemo(() => orders.filter((o) => o.status === "Menunggu").length, [orders]);

  const TABS: { key: View; label: string; icon: typeof FlaskConical; badge?: number }[] = [
    { key: "worklist",  label: "Worklist Order",  icon: FlaskConical, badge: pendingCount },
    { key: "manajemen", label: "QC & Manajemen",  icon: Settings2 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold transition-all duration-150",
              view === key
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-sky-50 hover:text-sky-700",
            )}
          >
            <Icon size={13} />
            {label}
            {/* Notifikasi angka order (animasi) — order baru belum diterima */}
            <AnimatePresence>
              {badge ? (
                <motion.span
                  key={badge}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 16 }}
                  className={cn(
                    "ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums",
                    view === key ? "bg-white text-sky-700" : "bg-rose-500 text-white",
                  )}
                >
                  {badge}
                  {/* Pulse ring saat ada order baru */}
                  {view !== key && (
                    <motion.span
                      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-400"
                      animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                    />
                  )}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </button>
        ))}
      </div>

      {view === "worklist"  && <LabBoard orders={orders} loading={loading} onRefetch={refetch} />}
      {view === "manajemen" && <LabManajemenTabs />}
    </div>
  );
}
