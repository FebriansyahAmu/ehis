"use client";

// Wrapper board RJ: gabung kunjungan dari API (GET /kunjungan?unit=RawatJalan) dengan
// seed demo mock. Status puncak API → statusOverride (board tak punya entry queue untuk
// pasien API). Aksi panggil/terima/selesai untuk kartu API belum tertaut (endpoint
// call/complete belum dibangun) — fase berikutnya.

import { useEffect, useState } from "react";
import type { RJPatient } from "@/lib/data";
import { listKunjungan } from "@/lib/api/kunjungan";
import type { RJOrderStatus } from "@/lib/rawat-jalan/rjQueueStore";
import { dtoToRJPatient, orderFromStatus } from "./rjLiveApi";
import RJBoard from "./RJBoard";

export default function RJBoardLive({ seed }: { seed: RJPatient[] }) {
  const [live, setLive] = useState<RJPatient[]>([]);
  const [override, setOverride] = useState<Record<string, RJOrderStatus>>({});

  useEffect(() => {
    const ac = new AbortController();
    listKunjungan({ unit: "RawatJalan", limit: 50 }, ac.signal)
      .then(({ items }) => {
        setLive(items.map(dtoToRJPatient));
        setOverride(Object.fromEntries(items.map((it) => [it.id, orderFromStatus(it.status)])));
      })
      .catch(() => { /* board tetap tampil seed bila API gagal */ });
    return () => ac.abort();
  }, []);

  // Kunjungan API (nyata) di atas, seed demo di bawah. Ruang id berbeda → tak bentrok.
  return <RJBoard patients={[...live, ...seed]} statusOverride={override} />;
}
