import { notFound } from "next/navigation";
import type { Metadata } from "next";

import RIRecordShell    from "@/components/rawat-inap/RIRecordShell";
import RIRecordResolver from "@/components/rawat-inap/RIRecordResolver";
import { rawatInapPatientDetails } from "@/lib/data";

// id pasien DB = UUID v7; pasien demo/seed = "ri-1" dst → hanya UUID yang menempuh fallback DB.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const patient = rawatInapPatientDetails[id];
  return { title: patient ? `Rawat Inap · ${patient.name}` : "Rawat Inap" };
}

export default async function RIPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = rawatInapPatientDetails[id];

  // Pasien NYATA (kunjungan DB, id UUID) → resolver klien fetch kunjungan + pasien + master,
  // bangun RawatInapPatientDetail (klinis kosong), render rekam medis 19-tab penuh untuk mulai
  // pengisian. Pasien demo/seed (non-UUID) yang tak ada di mock → notFound.
  if (!patient) {
    if (UUID_RE.test(id)) return <RIRecordResolver id={id} />;
    notFound();
  }

  // Pasien demo/seed → shell dengan lifecycle lokal (Selesaikan/Batal Selesai tidak persist).
  return <RIRecordShell patient={patient} />;
}
