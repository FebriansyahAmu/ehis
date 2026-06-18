"use client";

// Konteks katalog asesmen (master) untuk dropdown AllergyPane/RiwayatPane di AsesmenMedisTab.
// Fetch SEKALI dari /api/v1/master/asesmen-tersedia (gate clinical.rekammedis:read) → bangun
// daftar opsi per kategori. FALLBACK ke konstanta lama (asesmenShared) saat DB belum termuat /
// gagal / offline → tanpa kedip kosong & tanpa regresi. Provider dipasang di AsesmenMedisTab.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { listAsesmenTersedia, type AsesmenItemDTO } from "@/lib/api/master/asesmenKatalog";
import {
  type AllergyCategory,
  QUICK_PICKS, REACTIONS, SNOMED_CODES,
  PENYAKIT_DAHULU_LIST, PENYAKIT_BERESIKO, PERILAKU_BERESIKO,
  PENYAKIT_KELUARGA_LIST, ANGGOTA_KELUARGA, METODE_KB, JENIS_PERSALINAN,
} from "./asesmenShared";

export interface AsesmenKatalogValue {
  loaded: boolean; // fetch DB selesai (sukses/gagal)
  fromDb: boolean; // memakai data DB (bukan fallback konstanta)
  quickPicks: Record<AllergyCategory, string[]>;
  reactions: string[];
  snomedCodes: { code: string; display: string }[];
  penyakitDahulu: string[];
  penyakitBeresiko: string[];
  penyakitKeluarga: string[];
  perilakuBeresiko: string[];
  anggotaKeluarga: string[];
  metodeKB: string[];
  jenisPersalinan: string[];
}

// Fallback = konstanta lama (asesmenShared). Dipakai sebelum/gagal fetch DB.
const FALLBACK: AsesmenKatalogValue = {
  loaded: false,
  fromDb: false,
  quickPicks: QUICK_PICKS,
  reactions: REACTIONS,
  snomedCodes: SNOMED_CODES,
  penyakitDahulu: PENYAKIT_DAHULU_LIST,
  penyakitBeresiko: PENYAKIT_BERESIKO,
  penyakitKeluarga: PENYAKIT_KELUARGA_LIST,
  perilakuBeresiko: PERILAKU_BERESIKO,
  anggotaKeluarga: ANGGOTA_KELUARGA,
  metodeKB: [...METODE_KB],
  jenisPersalinan: JENIS_PERSALINAN,
};

const Ctx = createContext<AsesmenKatalogValue>(FALLBACK);

/** Hook konsumsi katalog asesmen (opsi dropdown). Aman tanpa provider → fallback konstanta. */
export const useAsesmenKatalog = () => useContext(Ctx);

// Bangun daftar opsi dari item DB; per-kategori fallback ke konstanta bila kosong (defensif).
function buildFromDb(items: AsesmenItemDTO[]): AsesmenKatalogValue {
  const by = (k: AsesmenItemDTO["kategori"]) => items.filter((i) => i.kategori === k).map((i) => i.nama);
  const pick = (list: string[], fb: string[]) => (list.length ? list : fb);
  const snomed = items
    .filter((i) => i.snomedCode)
    .map((i) => ({ code: i.snomedCode as string, display: i.nama }));
  return {
    loaded: true,
    fromDb: true,
    quickPicks: {
      // Kategori "Obat" tak lagi dari katalog asesmen — AllergyPane menariknya dari Katalog Obat
      // (master.obat) + BZA. Nilai ini cuma fallback agar tipe lengkap; tak dirender utk Obat.
      Obat:    QUICK_PICKS.Obat,
      Makanan: pick(by("AllergenMakanan"), QUICK_PICKS.Makanan),
      Lainnya: pick(by("AllergenLainnya"), QUICK_PICKS.Lainnya),
    },
    reactions:        pick(by("ReaksiAlergi"), REACTIONS),
    snomedCodes:      snomed.length ? snomed : SNOMED_CODES,
    penyakitDahulu:   pick(by("PenyakitDahulu"), PENYAKIT_DAHULU_LIST),
    penyakitBeresiko: pick(by("PenyakitBeresiko"), PENYAKIT_BERESIKO),
    penyakitKeluarga: pick(by("PenyakitKeluarga"), PENYAKIT_KELUARGA_LIST),
    perilakuBeresiko: pick(by("PerilakuBeresiko"), PERILAKU_BERESIKO),
    anggotaKeluarga:  pick(by("AnggotaKeluarga"), ANGGOTA_KELUARGA),
    metodeKB:         pick(by("MetodeKB"), [...METODE_KB]),
    jenisPersalinan:  pick(by("JenisPersalinan"), JENIS_PERSALINAN),
  };
}

export function AsesmenKatalogProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<AsesmenKatalogValue>(FALLBACK);

  useEffect(() => {
    const ac = new AbortController();
    listAsesmenTersedia({}, ac.signal)
      .then((items) => {
        if (ac.signal.aborted) return;
        setValue(items.length ? buildFromDb(items) : (v) => ({ ...v, loaded: true }));
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setValue((v) => ({ ...v, loaded: true })); // gagal → tetap fallback
      });
    return () => ac.abort();
  }, []);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
