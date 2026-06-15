// skalaRisikoService — Master Skala Risiko (skoring, kategori "Risiko", kode SR-NNNN).
// Tipis: delegasi ke factory generik makeSkalaService. Logika (JSONB map, counter, CRUD) di skalaService.

import { makeSkalaService } from "./skalaService";

export const skalaRisikoService = makeSkalaService({ kategori: "Risiko", scope: "SR" });
