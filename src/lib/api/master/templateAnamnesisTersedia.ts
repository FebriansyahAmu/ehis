// API konsumen KLINIS — template anamnesis "tersedia" per modul (picker AnamnesisPane).
// GET /api/v1/master/template-anamnesis-tersedia?modul=IGD|RI|RJ (gate clinical.rekammedis:read).

import { api } from "@/lib/api/client";
import type { AnamnesisTemplateDTO, ModulContextDTO } from "@/lib/schemas/master/templateAnamnesis";

export type { AnamnesisTemplateDTO, ModulContextDTO };

/** Daftar template Aktif relevan dengan `modul` (field pre-fill form anamnesis). */
export async function listAnamnesisTemplate(
  modul: ModulContextDTO, signal?: AbortSignal,
): Promise<AnamnesisTemplateDTO[]> {
  const { data } = await api.get<AnamnesisTemplateDTO[]>(
    "/master/template-anamnesis-tersedia", { query: { modul }, signal },
  );
  return data;
}
