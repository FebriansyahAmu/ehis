"use client";

import { useState, useMemo } from "react";
import { patientMasterData } from "@/lib/data";
import type { TipePenjamin } from "@/lib/data";
import { PasienListControls } from "./PasienListControls";
import { PasienListTable } from "./PasienListTable";

const PAGE_SIZE = 8;

export type FilterPenjamin = "Semua" | TipePenjamin;
export type FilterStatus   = "Semua" | "Aktif" | "Selesai";

const MONTH_MAP: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, Mei: 5, Jun: 6,
  Jul: 7, Agt: 8, Sep: 9, Okt: 10, Nov: 11, Des: 12,
  Januari: 1, Februari: 2, Maret: 3, April: 4, Juni: 6, Juli: 7,
  Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12,
};

function parseDate(s: string): number {
  const parts = s.trim().split(/\s+/);
  if (parts.length >= 3) {
    const d = parseInt(parts[0]);
    const m = MONTH_MAP[parts[1]] ?? 1;
    const y = parseInt(parts[2]);
    return new Date(y, m - 1, d).getTime();
  }
  return 0;
}

export default function PasienListPage() {
  const [query,          setQuery]          = useState("");
  const [filterPenjamin, setFilterPenjamin] = useState<FilterPenjamin>("Semua");
  const [filterStatus,   setFilterStatus]   = useState<FilterStatus>("Semua");
  const [page,           setPage]           = useState(1);

  const allPatients = useMemo(() =>
    Object.values(patientMasterData).sort((a, b) => {
      const aDate = a.riwayatKunjungan[0]
        ? parseDate(a.riwayatKunjungan[0].tanggal)
        : parseDate(a.terdaftar);
      const bDate = b.riwayatKunjungan[0]
        ? parseDate(b.riwayatKunjungan[0].tanggal)
        : parseDate(b.terdaftar);
      return bDate - aDate;
    }),
  []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPatients.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.noRM.toLowerCase().includes(q) && !p.nik.includes(q))
        return false;
      if (filterPenjamin !== "Semua" && p.penjamin.tipe !== filterPenjamin)
        return false;
      const hasActive = p.riwayatKunjungan.some((k) => k.status === "Aktif");
      if (filterStatus === "Aktif"   && !hasActive) return false;
      if (filterStatus === "Selesai" &&  hasActive) return false;
      return true;
    });
  }, [allPatients, query, filterPenjamin, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: allPatients.length,
    aktif: allPatients.filter((p) => p.riwayatKunjungan.some((k) => k.status === "Aktif")).length,
    bpjs:  allPatients.filter((p) => p.penjamin.tipe.startsWith("BPJS")).length,
    umum:  allPatients.filter((p) => p.penjamin.tipe === "Umum").length,
  }), [allPatients]);

  function handleQuery(v: string)                  { setQuery(v);          setPage(1); }
  function handlePenjamin(v: FilterPenjamin)        { setFilterPenjamin(v); setPage(1); }
  function handleStatus(v: FilterStatus)            { setFilterStatus(v);  setPage(1); }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PasienListControls
        stats={stats}
        query={query}
        onQuery={handleQuery}
        filterPenjamin={filterPenjamin}
        filterStatus={filterStatus}
        onFilterPenjamin={handlePenjamin}
        onFilterStatus={handleStatus}
      />
      <PasienListTable
        patients={paginated}
        total={filtered.length}
        page={safePage}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
        onPage={setPage}
      />
    </div>
  );
}
