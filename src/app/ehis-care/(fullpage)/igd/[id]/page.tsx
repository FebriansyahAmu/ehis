import { notFound } from "next/navigation";
import type { Metadata } from "next";

import PatientHeader from "@/components/igd/PatientHeader";
import IGDRecordTabs from "@/components/igd/IGDRecordTabs";
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
  if (!patient) notFound();

  return (
    <div className="flex h-full flex-col">
      <PatientHeader patient={patient} />
      <IGDRecordTabs patient={patient} />
    </div>
  );
}
