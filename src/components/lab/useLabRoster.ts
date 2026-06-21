"use client";

// Roster petugas Lab (SDM Assignment) untuk satu order — fetch sekali per order id. Dipakai:
// Penerimaan (cek penerima ter-assign), Entry Hasil (cek analis ter-assign), Validasi (dropdown
// dokter ter-assign). Gating UI ≠ enforcement; server tetap penjaga (route()).

import { useEffect, useMemo, useState, useCallback } from "react";
import { getLabRoster, type LabPetugasDTO } from "@/lib/api/lab/labRoster";

export function useLabRoster(orderId: string) {
  const [petugas, setPetugas] = useState<LabPetugasDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const rows = await getLabRoster(orderId, ac.signal);
        if (!ac.signal.aborted) setPetugas(rows);
      } catch {
        if (!ac.signal.aborted) setPetugas([]);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [orderId]);

  // Subset dokter (validator) — profesi mengandung "dokter" (Umum/Spesialis).
  const doctors = useMemo(
    () => petugas.filter((p) => (p.profesi ?? "").toLowerCase().includes("dokter")),
    [petugas],
  );

  /** true bila pegawai ada di roster Lab (ter-assign). */
  const isAssigned = useCallback(
    (pegawaiId?: string | null) => !!pegawaiId && petugas.some((p) => p.pegawaiId === pegawaiId),
    [petugas],
  );

  return { petugas, doctors, loading, isAssigned };
}
