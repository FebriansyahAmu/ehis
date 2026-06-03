"use client";

// Wrapper board RJ: gabung kunjungan dari API (GET /kunjungan?unit=RawatJalan) dengan
// seed demo mock. Status puncak + callState API → order board (statusOverride). Aksi
// Panggil/Terima/Selesai/Batal/Ulang untuk kartu API → transisi server (PATCH
// /kunjungan/:id/status), version-guarded, lalu patch item lokal dari respons.

import { useEffect, useMemo, useRef, useState } from "react";
import type { RJPatient } from "@/lib/data";
import { listKunjungan, transitionKunjungan, type KunjunganListItemDTO } from "@/lib/api/kunjungan";
import { ApiError } from "@/lib/api/client";
import type { RJOrderStatus } from "@/lib/rawat-jalan/rjQueueStore";
import { dtoToRJPatient, orderFromStatus } from "./rjLiveApi";
import RJBoard, { type BoardApiAction } from "./RJBoard";

export default function RJBoardLive({ seed }: { seed: RJPatient[] }) {
  const [items, setItems] = useState<KunjunganListItemDTO[]>([]);
  const pending = useRef<Set<string>>(new Set()); // cegah aksi ganda in-flight per id

  useEffect(() => {
    const ac = new AbortController();
    listKunjungan({ unit: "RawatJalan", limit: 50 }, ac.signal)
      .then((res) => setItems(res.items))
      .catch(() => { /* board tetap tampil seed bila API gagal */ });
    return () => ac.abort();
  }, []);

  // Derivasi dari item mentah (sumber kebenaran version/callState/recallCount).
  const live = useMemo<RJPatient[]>(() => items.map(dtoToRJPatient), [items]);
  const statusOverride = useMemo<Record<string, RJOrderStatus>>(
    () => Object.fromEntries(items.map((it) => [it.id, orderFromStatus(it.status, it.callState)])),
    [items],
  );
  const recallOverride = useMemo<Record<string, number>>(
    () => Object.fromEntries(items.map((it) => [it.id, it.recallCount])),
    [items],
  );

  // Aksi kartu API → transisi server (version-guarded) → patch item dari respons.
  async function onApiAction(p: RJPatient, action: BoardApiAction) {
    if (pending.current.has(p.id)) return { ok: false, message: "Aksi sedang diproses…" };
    const item = items.find((it) => it.id === p.id);
    if (!item) return { ok: false, message: "Data kunjungan tidak ditemukan" };

    pending.current.add(p.id);
    try {
      const u = await transitionKunjungan(p.id, action, item.version);
      // Patch field yang berubah saja — pertahankan pasien (gender/tglLahir) dari list DTO.
      setItems((prev) =>
        prev.map((it) =>
          it.id === p.id
            ? { ...it, status: u.status, callState: u.callState, recallCount: u.recallCount, version: u.version }
            : it,
        ),
      );
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Gagal memproses aksi";
      return { ok: false, message };
    } finally {
      pending.current.delete(p.id);
    }
  }

  // Kunjungan API (nyata) di atas, seed demo di bawah. Ruang id berbeda → tak bentrok.
  return (
    <RJBoard
      patients={[...live, ...seed]}
      statusOverride={statusOverride}
      recallOverride={recallOverride}
      onApiAction={onApiAction}
    />
  );
}
