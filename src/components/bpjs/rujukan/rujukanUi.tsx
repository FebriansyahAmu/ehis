"use client";

// Potongan UI modul Rujukan. Isinya kini bersama halaman V-Claim lain (Monitoring, …) di
// bpjs/shared/vclaimUi — diekspor ulang agar import lama tetap jalan. GalatRujukan = GalatVClaim
// dengan kata benda default "Rujukan" (kode 201 → "Rujukan tidak ditemukan").

import type { ComponentProps } from "react";
import { GalatVClaim } from "@/components/bpjs/shared/vclaimUi";

export { BadgeNada, KARTU, KolomSaring, Meter, PeriodeStepper } from "@/components/bpjs/shared/vclaimUi";

export function GalatRujukan({ objek = "Rujukan", ...props }: ComponentProps<typeof GalatVClaim>) {
  return <GalatVClaim objek={objek} {...props} />;
}
