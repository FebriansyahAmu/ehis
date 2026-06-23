"use client";

// Roster petugas Rad (SDM Assignment) untuk satu order — fetch sekali per order id. Dipakai
// Verifikasi Identitas (cek penerima ter-assign). Gating UI ≠ enforcement; server tetap penjaga
// (route() + radAssignment). Selaras useLabRoster.

import { useEffect, useMemo, useState, useCallback } from "react";
import { getRadRoster, type RadPetugasDTO } from "@/lib/api/rad/radRoster";

export function useRadRoster(orderId: string) {
  const [petugas, setPetugas] = useState<RadPetugasDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const rows = await getRadRoster(orderId, ac.signal);
        if (!ac.signal.aborted) setPetugas(rows);
      } catch {
        if (!ac.signal.aborted) setPetugas([]);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [orderId]);

  // Subset dokter (radiolog) — profesi mengandung "dokter".
  const doctors = useMemo(
    () => petugas.filter((p) => (p.profesi ?? "").toLowerCase().includes("dokter")),
    [petugas],
  );

  /** true bila pegawai ada di roster Rad (ter-assign). */
  const isAssigned = useCallback(
    (pegawaiId?: string | null) => !!pegawaiId && petugas.some((p) => p.pegawaiId === pegawaiId),
    [petugas],
  );

  return { petugas, doctors, loading, isAssigned };
}
