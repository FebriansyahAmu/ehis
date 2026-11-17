"use client";

// Peringatan NON-BLOKIR sebelum Selesaikan Kunjungan (FHIR-GAP FG-93 — keputusan user 2026-11-17: peringatan
// dulu). Keluhan utama belum berkode SNOMED → setelah rekam medis terkunci, Encounter SatuSehat tertahan
// `in-progress` (syarat diagnosis CC, docs/fhir-mapping/L03) sampai Batal Selesai. Tampil HANYA bila
// bermasalah; gagal memuat → diam (tak pernah menghalangi penyelesaian). Opsi "wajibkan kode sebelum
// complete" = temuan terbuka FG-98.

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAnamnesis } from "@/lib/api/asesmenMedis/anamnesis";

// id kunjungan DB = UUID; pasien demo ("igd-1") tak punya anamnesis di DB → tanpa peringatan.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Masalah = "tanpa-anamnesis" | "tanpa-kode";

export default function KeluhanKodeWarning({ kunjunganId, className }: { kunjunganId: string; className?: string }) {
  const [masalah, setMasalah] = useState<Masalah | null>(null);

  useEffect(() => {
    if (!UUID_RE.test(kunjunganId)) return;
    const ac = new AbortController();
    getAnamnesis(kunjunganId, ac.signal)
      .then((dto) => {
        if (ac.signal.aborted) return;
        setMasalah(!dto ? "tanpa-anamnesis" : dto.keluhanSnomed ? null : "tanpa-kode");
      })
      .catch(() => { /* diam — peringatan bersifat bantuan, bukan gerbang */ });
    return () => ac.abort();
  }, [kunjunganId]);

  if (!masalah) return null;

  return (
    <div
      role="status"
      className={cn("flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5", className)}
    >
      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
      <div className="flex flex-col gap-0.5 text-[11px] leading-relaxed text-amber-800">
        <p className="font-semibold">
          {masalah === "tanpa-anamnesis" ? "Anamnesis belum diisi" : "Keluhan utama belum diberi kode SNOMED"}
        </p>
        <p>
          Kunjungan tetap bisa diselesaikan, tetapi <b>tidak akan terkirim berstatus selesai</b> ke SatuSehat.
          Setelah terkunci, perbaikannya perlu Batal Selesai — lengkapi dulu di <b>Asesmen › Anamnesis</b> bila memungkinkan.
        </p>
      </div>
    </div>
  );
}
