import type { Metadata } from "next";

import PatientHeader from "@/components/igd/PatientHeader";
import IGDRecordTabs from "@/components/igd/IGDRecordTabs";
import IGDRecordResolver from "@/components/igd/IGDRecordResolver";
import { igdPatientDetails } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const patient = igdPatientDetails[id];
  return { title: patient ? `IGD · ${patient.name}` : "Pasien Tidak Ditemukan" };
}

export default async function IGDPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = igdPatientDetails[id];

  // Pasien demo (mock) → render langsung (SSR). Kunjungan DB nyata (id UUID, tak ada
  // di mock) → resolver klien fetch GET /kunjungan/:id + /patients/:id (klinis kosong).
  if (!patient) return <IGDRecordResolver id={id} />;

  return (
    <div className="flex h-full flex-col">
      <PatientHeader patient={patient} />
      <IGDRecordTabs patient={patient} />
    </div>
  );
}
