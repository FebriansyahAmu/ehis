import { notFound } from "next/navigation";
import type { Metadata } from "next";

import RIPatientHeader from "@/components/rawat-inap/RIPatientHeader";
import RIRecordTabs    from "@/components/rawat-inap/RIRecordTabs";
import { rawatInapPatientDetails } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const patient = rawatInapPatientDetails[id];
  return { title: patient ? `Rawat Inap · ${patient.name}` : "Pasien Tidak Ditemukan" };
}

export default async function RIPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = rawatInapPatientDetails[id];
  if (!patient) notFound();

  return (
    <div className="flex h-full flex-col">
      <RIPatientHeader patient={patient} />
      <RIRecordTabs    patient={patient} />
    </div>
  );
}
