// API master Template Anamnesis (browser). Tipe DI-REUSE dari schema server. Endpoint:
//   /api/v1/master/template-anamnesis      (GET list+cursor · POST create)
//   /api/v1/master/template-anamnesis/:id  (PATCH · DELETE)

import { api } from "@/lib/api/client";
import type {
  CreateTemplateAnamnesisInput, UpdateTemplateAnamnesisInput,
  TemplateAnamnesisQuery, TemplateAnamnesisDTO,
} from "@/lib/schemas/master/templateAnamnesis";

export type {
  CreateTemplateAnamnesisInput, UpdateTemplateAnamnesisInput,
  TemplateAnamnesisQuery, TemplateAnamnesisDTO,
};

export interface TemplateAnamnesisListPage {
  items: TemplateAnamnesisDTO[];
  cursor: string | null; // null = halaman terakhir
}

/** GET — list terfilter (q/kategori/modul/status) + keyset cursor. */
export async function listTemplateAnamnesis(
  query: TemplateAnamnesisQuery = {}, signal?: AbortSignal,
): Promise<TemplateAnamnesisListPage> {
  const { data, meta } = await api.get<TemplateAnamnesisDTO[]>("/master/template-anamnesis", {
    query: {
      q: query.q,
      kategori: query.kategori,
      modul: query.modul,
      status: query.status,
      cursor: query.cursor,
      limit: query.limit,
    },
    signal,
  });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** POST — tambah 1 template. */
export async function createTemplateAnamnesis(
  input: CreateTemplateAnamnesisInput, signal?: AbortSignal,
): Promise<TemplateAnamnesisDTO> {
  const { data } = await api.post<TemplateAnamnesisDTO>("/master/template-anamnesis", input, { signal });
  return data;
}

/** PATCH — ubah 1 template (parsial). */
export async function updateTemplateAnamnesis(
  id: string, input: UpdateTemplateAnamnesisInput, signal?: AbortSignal,
): Promise<TemplateAnamnesisDTO> {
  const { data } = await api.patch<TemplateAnamnesisDTO>(
    `/master/template-anamnesis/${encodeURIComponent(id)}`, input, { signal },
  );
  return data;
}

/** DELETE — soft-delete 1 template. */
export async function deleteTemplateAnamnesis(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/template-anamnesis/${encodeURIComponent(id)}`, { signal });
}
