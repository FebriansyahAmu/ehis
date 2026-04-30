import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { patientMasterData } from "@/lib/data";
import KunjunganDetailPage from "@/components/pasien/KunjunganDetailPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; kunjunganId: string }>;
}): Promise<Metadata> {
  const { id, kunjunganId } = await params;
  const patient = patientMasterData[decodeURIComponent(id)];
  const k = patient?.riwayatKunjungan.find((x) => x.id === kunjunganId);
  return {
    title: k ? `Pendaftaran · ${k.noPendaftaran}` : "Kunjungan Tidak Ditemukan",
  };
}

export default async function KunjunganDetailRoute({
  params,
}: {
  params: Promise<{ id: string; kunjunganId: string }>;
}) {
  const { id, kunjunganId } = await params;
  const patient = patientMasterData[decodeURIComponent(id)];
  if (!patient) notFound();
  const kunjungan = patient.riwayatKunjungan.find((x) => x.id === kunjunganId);
  if (!kunjungan) notFound();
  return <KunjunganDetailPage patient={patient} kunjungan={kunjungan} />;
}
