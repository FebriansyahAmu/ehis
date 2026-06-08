// Zod schema + DTO — Asesmen·Riwayat·Faktor Resiko (penyakit + perilaku beresiko).
// Mirror FaktorResikoPane. Append-only "latest wins". Multi-select = text[].

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));
const strArr = z.array(z.string().trim().min(1)).default([]);

export const AsesmenFaktorResikoInput = z.object({
  penyakit: strArr,
  penyakitLain: optStr,
  perilaku: strArr,
  perilakuLain: optStr,
});
export type AsesmenFaktorResikoInput = z.infer<typeof AsesmenFaktorResikoInput>;

export interface AsesmenFaktorResikoDTO {
  id: string;
  kunjunganId: string;
  penyakit: string[];
  penyakitLain: string | null;
  perilaku: string[];
  perilakuLain: string | null;
  pemeriksa: string;
  authorUserId: string | null;
  createdAt: string;
}
