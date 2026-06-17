"use client";

// Hook konsumsi Status Enum master untuk dropdown KLINIS yang FREE-STRING.
// Fetch SEKALI per grup (cache modul, dedupe lintas mount/komponen) dari
// /status-enum-tersedia (gate clinical.rekammedis:read). FALLBACK ke konstanta mock
// (STATUS_ENUM_GROUPS, entri Aktif) saat belum termuat/gagal → tanpa kedip kosong.
//
// PENTING: hanya untuk field yang DISIMPAN sebagai string bebas. Field bertipe union
// (KesadaranPF/KU/RIKelas/Disposisi/HubunganPenanda) TIDAK boleh memakai ini — nilainya
// dijamin compile-time oleh union. Lihat docs/BACKEND-MASTER-TEMPLATE&ENUM.md §5.

import { useEffect, useState } from "react";
import { listStatusEnumTersedia, type EnumEntryDTO } from "@/lib/api/master/statusEnum";
import { STATUS_ENUM_GROUPS, type StatusEnumKey } from "@/lib/master/statusEnumMock";

export interface EnumOption {
  kode: string;
  label: string;
  deskripsi?: string;
  tone: string;
  icon?: string;
}

export interface UseStatusEnum {
  options: EnumOption[];
  labels: string[];
  loaded: boolean; // fetch DB selesai (sukses/gagal)
  fromDb: boolean; // memakai data DB (bukan fallback konstanta)
}

// Cache hasil per grup (dedupe lintas mount). inflight = dedupe fetch paralel.
const cache = new Map<StatusEnumKey, EnumOption[]>();
const inflight = new Map<StatusEnumKey, Promise<EnumOption[]>>();

function dtoToOption(d: EnumEntryDTO): EnumOption {
  return { kode: d.kode, label: d.label, deskripsi: d.deskripsi, tone: d.tone, icon: d.icon };
}

/** Fallback dari mock master (entri Aktif grup). Dipakai sebelum/gagal fetch DB. */
function fallback(groupKey: StatusEnumKey): EnumOption[] {
  const g = STATUS_ENUM_GROUPS.find((x) => x.key === groupKey);
  if (!g) return [];
  return g.entries
    .filter((e) => e.status === "Aktif")
    .map((e) => ({ kode: e.kode, label: e.label, deskripsi: e.deskripsi, tone: e.tone, icon: e.icon }));
}

export function useStatusEnum(groupKey: StatusEnumKey): UseStatusEnum {
  const [options, setOptions] = useState<EnumOption[]>(() => cache.get(groupKey) ?? fallback(groupKey));
  const [loaded, setLoaded] = useState<boolean>(() => cache.has(groupKey));
  const [fromDb, setFromDb] = useState<boolean>(() => cache.has(groupKey));

  useEffect(() => {
    if (cache.has(groupKey)) return; // sudah dari init (cache hit)
    let alive = true;

    let p = inflight.get(groupKey);
    if (!p) {
      p = listStatusEnumTersedia({ groupKey })
        .then((rows) => {
          const opts = rows.map(dtoToOption);
          cache.set(groupKey, opts);
          return opts;
        })
        .finally(() => inflight.delete(groupKey));
      inflight.set(groupKey, p);
    }

    p.then((opts) => {
      if (!alive) return;
      setOptions(opts);
      setLoaded(true);
      setFromDb(true);
    }).catch(() => {
      if (!alive) return;
      setLoaded(true); // gagal → tetap fallback (options awal)
    });

    return () => { alive = false; };
  }, [groupKey]);

  return { options, labels: options.map((o) => o.label), loaded, fromDb };
}
