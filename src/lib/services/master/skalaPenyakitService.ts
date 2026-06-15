// skalaPenyakitService — Master Skala Penyakit (klasifikasi/staging klinis, kategori "Penyakit",
// kode SP-NNNN). Tipis: delegasi ke factory generik makeSkalaService (sama dgn Risiko, beda config).
// Isi: NYHA · Killip · TIMI · ECOG · Grade histologi (klasifikasi tervalidasi yg dikonsumsi
// tab Penilaian Jantung/Kanker via /master/skala-tersedia?kategori=Penyakit).

import { makeSkalaService } from "./skalaService";

export const skalaPenyakitService = makeSkalaService({ kategori: "Penyakit", scope: "SP" });
