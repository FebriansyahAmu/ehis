"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  applyAuditFilters, defaultAuditFilters, exportAuditCsv,
  getAuditEventsForInvoice, uniqueActors,
  type AuditEvent, type AuditFilterState,
} from "@/lib/billing/auditTrail";
import type { InvoiceDetail } from "../invoiceShared";
import AuditFilterBar from "./audit/AuditFilterBar";
import AuditTimeline from "./audit/AuditTimeline";

interface Props {
  detail: InvoiceDetail;
  /** Event NYATA dari billing.AuditLog (KunjunganInvoiceDetail). Absen → fallback mock (route lama). */
  events?: AuditEvent[];
  /** Sedang memuat audit dari server — tampilkan spinner alih-alih timeline kosong. */
  loading?: boolean;
}

/**
 * Tab 4 — Riwayat Audit (BL2.5 + Slice 2g).
 *
 * Read-only timeline semua mutasi invoice (PMK 269/2008 + UU PDP 27/2022 audit trail).
 * Filter by actor / action type / date range. Export ke CSV.
 *
 * Source: `events` (NYATA, billing.AuditLog via GET /kunjungan/:id/billing/audit) bila diberikan;
 * else `getAuditEventsForInvoice(invoiceId)` mock (dipakai route lama /tagihan/[id]).
 */
export default function RiwayatAuditTab({ detail, events, loading }: Props) {
  const allEvents = useMemo(
    () => events ?? getAuditEventsForInvoice(detail.id),
    [events, detail.id],
  );
  const actors = useMemo(() => uniqueActors(allEvents), [allEvents]);

  const [filters, setFilters] = useState<AuditFilterState>(() => defaultAuditFilters());

  const filteredEvents = useMemo(
    () => applyAuditFilters(allEvents, filters),
    [allEvents, filters],
  );

  const hasActiveFilters =
    filters.actors.length > 0
    || filters.actions.length > 0
    || !!filters.dateFrom
    || !!filters.dateTo;

  const handleReset = () => setFilters(defaultAuditFilters());

  const handleExport = () => {
    exportAuditCsv(filteredEvents, detail.noTagihan);
    console.log("[BL2.5] Export audit CSV:", filteredEvents.length, "events");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3.5 px-5 py-4"
        >
          <AuditFilterBar
            filters={filters}
            onChange={setFilters}
            onReset={handleReset}
            onExport={handleExport}
            actors={actors}
            totalEvents={allEvents.length}
            filteredEvents={filteredEvents.length}
          />

          {loading && allEvents.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[12.5px]">Memuat riwayat audit…</span>
            </div>
          ) : (
            <AuditTimeline
              events={filteredEvents}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleReset}
            />
          )}

          {/* Footer disclaimer */}
          <p className="pb-2 text-center text-[10.5px] text-slate-400">
            Audit trail bersifat <strong>immutable</strong> sesuai UU PDP 27/2022 ·
            retensi minimum 5 tahun. Semua aksi finansial otomatis ter-log.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
