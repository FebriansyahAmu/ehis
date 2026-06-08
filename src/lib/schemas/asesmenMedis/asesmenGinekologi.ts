// Zod schema + DTO — Asesmen·Riwayat·Ginekologi (menstruasi + skrining Pap Smear/IVA).
// Mirror GinekologiPane. Append-only "latest wins". Semua field opsional.

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));
const optBool = z.boolean().nullish();

export const AsesmenGinekologiInput = z.object({
  statusMenstruasi: optStr,
  hpht: optStr,
  siklus: optStr,
  lamaMenstruasi: optStr,
  dismenorea: optBool,
  menoragia: optBool,
  keputihan: optBool,
  papSmear: optBool,
  papTahun: optStr,
  papHasil: optStr,
  iva: optBool,
  ivaTahun: optStr,
  ivaHasil: optStr,
  catatan: optStr,
});
export type AsesmenGinekologiInput = z.infer<typeof AsesmenGinekologiInput>;

export interface AsesmenGinekologiDTO {
  id: string;
  kunjunganId: string;
  statusMenstruasi: string | null;
  hpht: string | null;
  siklus: string | null;
  lamaMenstruasi: string | null;
  dismenorea: boolean | null;
  menoragia: boolean | null;
  keputihan: boolean | null;
  papSmear: boolean | null;
  papTahun: string | null;
  papHasil: string | null;
  iva: boolean | null;
  ivaTahun: string | null;
  ivaHasil: string | null;
  catatan: string | null;
  pemeriksa: string;
  authorUserId: string | null;
  createdAt: string;
}
