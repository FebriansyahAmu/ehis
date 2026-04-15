import { notFound } from "next/navigation";
import { igdPatientDetails } from "@/app/lib/data";
import PatientHeader from "./_components/PatientHeader";
import IGDRecordTabs from "./_components/IGDRecordTabs";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = igdPatientDetails[id];
  return { title: patient ? `IGD · ${patient.name}` : "Pasien Tidak Ditemukan" };
}

export default async function IGDPatientPage({ params }: { params: Promise<{ id: string }> }) {
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
