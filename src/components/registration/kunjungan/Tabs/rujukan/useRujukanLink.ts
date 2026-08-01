"use client";

// Hook konsistensi Rujukan ⇄ SEP untuk tab Surat Rujukan (gerbang B). Membaca rujukan + SEP
// terbaru kunjungan (getKunjungan) + diagnosa klinis terkini (getDiagnosaUtama), lalu menyediakan
// `link()` yang meng-upsert bpjs.Rujukan + menyinkronkan SEP.diagAwal. Sumber kebenaran = server;
// tab TIDAK menyimpan store tandingan (hindari drift).

import { useCallback, useEffect, useState } from "react";
import { getKunjungan, getDiagnosaUtama, linkKunjunganRujukan } from "@/lib/api/kunjungan";
import type { RujukanDTO, SepDTO, LinkRujukanInput } from "@/lib/schemas/kunjungan";

/** Payload tautan rujukan (subset RujukanInput) — dipakai sub-panel Rujukan Masuk / Kontrol. */
export interface RujukanLinkPayload {
  sumber: "RujukanMasuk" | "KontrolPascaRanap" | "RujukanIGD";
  asalRujukan: "Faskes1" | "Faskes2";
  noRujukan: string;
  tglRujukan?: string;
  ppkRujukan?: string;
  diagnosaKode?: string;
  diagnosaNama?: string;
  poliTujuan?: string;
  noSepAsal?: string;
}

export interface DxRef { kode: string | null; nama: string | null }

export interface RujukanLinkState {
  loading: boolean;
  rujukan: RujukanDTO | null;
  sep: SepDTO | null;
  primaryDx: DxRef;
  linking: boolean;
  err: string | null;
  link: (payload: RujukanLinkPayload) => Promise<void>;
  refetch: () => void;
}

export function useRujukanLink(kunjunganId: string, enabled: boolean): RujukanLinkState {
  const [loading, setLoading]     = useState(enabled);
  const [rujukan, setRujukan]     = useState<RujukanDTO | null>(null);
  const [sep, setSep]             = useState<SepDTO | null>(null);
  const [primaryDx, setPrimaryDx] = useState<DxRef>({ kode: null, nama: null });
  const [linking, setLinking]     = useState(false);
  const [err, setErr]             = useState<string | null>(null);
  const [tick, setTick]           = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  // Muat rujukan + SEP + diagnosa klinis. setState HANYA di callback async (hindari cascading render).
  useEffect(() => {
    if (!enabled) return;
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const [k, dx] = await Promise.all([
          getKunjungan(kunjunganId, ac.signal),
          getDiagnosaUtama(kunjunganId, ac.signal).catch(() => ({ kode: null, nama: null })),
        ]);
        setRujukan(k.rujukan);
        setSep(k.sep);
        setPrimaryDx(dx);
      } catch {
        /* biarkan state sebelumnya — panel tampil pesan bila perlu */
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [kunjunganId, enabled, tick]);

  const link = useCallback(async (payload: RujukanLinkPayload) => {
    setLinking(true);
    setErr(null);
    try {
      const body: LinkRujukanInput = { ...payload, syncSep: true };
      await linkKunjunganRujukan(kunjunganId, body);
      refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menautkan rujukan ke SEP.");
    } finally {
      setLinking(false);
    }
  }, [kunjunganId, refetch]);

  return { loading, rujukan, sep, primaryDx, linking, err, link, refetch };
}
