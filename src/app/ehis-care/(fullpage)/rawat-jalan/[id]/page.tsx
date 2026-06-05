import { notFound } from "next/navigation";
import type { Metadata } from "next";

import RJPatientHeader from "@/components/rawat-jalan/RJPatientHeader";
import RJRecordTabs    from "@/components/rawat-jalan/RJRecordTabs";
import RJRecordResolver from "@/components/rawat-jalan/RJRecordResolver";
import { rawatJalanPatientDetails } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const patient = rawatJalanPatientDetails[id];
  return { title: patient ? `Rawat Jalan · ${patient.name}` : "Pasien Tidak Ditemukan" };
}

export default async function RJPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = rawatJalanPatientDetails[id];

  // Pasien demo (mock) → render langsung (SSR). Kunjungan DB nyata (id UUID, tak ada
  // di mock) → resolver klien fetch GET /kunjungan/:id + /patients/:id.
  if (!patient) return <RJRecordResolver id={id} />;

  return (
    <div className="flex h-full flex-col">
      <RJPatientHeader patient={patient} />
      <RJRecordTabs    patient={patient} />
    </div>
  );
}
