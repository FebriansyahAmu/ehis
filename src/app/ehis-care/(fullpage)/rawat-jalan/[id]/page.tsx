import { notFound } from "next/navigation";
import type { Metadata } from "next";

import RJPatientHeader from "@/components/rawat-jalan/RJPatientHeader";
import RJRecordTabs    from "@/components/rawat-jalan/RJRecordTabs";
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
  if (!patient) notFound();

  return (
    <div className="flex h-full flex-col">
      <RJPatientHeader patient={patient} />
      <RJRecordTabs    patient={patient} />
    </div>
  );
}
