import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { patientMasterData } from "@/lib/data";
import PatientDashboard from "@/components/pasien/PatientDashboard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const patient = patientMasterData[decodeURIComponent(id)];
  return {
    title: patient ? `Pasien · ${patient.name}` : "Pasien Tidak Ditemukan",
  };
}

export default async function PatientDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = patientMasterData[decodeURIComponent(id)];
  if (!patient) notFound();

  return <PatientDashboard patient={patient} />;
}
