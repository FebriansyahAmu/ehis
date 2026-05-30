import type { Metadata } from "next";
import { patientMasterData } from "@/lib/data";
import PatientResolver from "@/components/registration/PatientResolver";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const patient = patientMasterData[decodeURIComponent(id)];
  // Pasien baru (hanya di registrationStore client) → judul generik.
  return { title: patient ? `Pasien · ${patient.name}` : "Pasien" };
}

export default async function PatientDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientResolver id={decodeURIComponent(id)} />;
}
