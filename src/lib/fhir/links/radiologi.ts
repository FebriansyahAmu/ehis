// L17 radiologi — gerbang ServiceRequest rad (S6a). Murni, tanpa I/O.
// Contoh resmi RJ/IGD/RI: SR rad selalu membawa identifier[1] ACSN + orderDetail modality DICOM. ACSN
// adalah kunci DICOM router mencocokkan ImagingStudy ke order → SR rad tanpa ACSN sah ditahan.

import { dicomModalityOf } from "../conceptMap";
import { isAcsnValid } from "@/lib/services/rad/acsn";
import type { Issue } from "./types";

export interface RadSrItem {
  id: string;
  nama: string;
  acsn: string | null;
  modalitas: string;
}

export type RadSrSiap = { ok: true; acsn: string; modality: string | null } | { ok: false; issue: Issue };

export function radSrSiap(it: RadSrItem): RadSrSiap {
  if (!isAcsnValid(it.acsn)) {
    return {
      ok: false,
      issue: {
        link: "L17", resourceType: "ServiceRequest", localId: it.id,
        code: it.acsn ? "kode-tidak-valid" : "kode-kosong",
        message: it.acsn
          ? `ACSN "${it.acsn}" pemeriksaan "${it.nama}" tidak sesuai format (maks 16 karakter) — ditahan`
          : `Pemeriksaan radiologi "${it.nama}" belum punya ACSN — ditahan`,
      },
    };
  }
  return { ok: true, acsn: it.acsn, modality: dicomModalityOf(it.modalitas) };
}
