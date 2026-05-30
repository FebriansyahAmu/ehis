import type { Metadata } from "next";
import { patientMasterData } from "@/lib/data";
import KunjunganResolver from "@/components/registration/KunjunganResolver";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; kunjunganId: string }>;
}): Promise<Metadata> {
  const { id, kunjunganId } = await params;
  const patient = patientMasterData[decodeURIComponent(id)];
  const k = patient?.riwayatKunjungan.find((x) => x.id === kunjunganId);
  return { title: k ? `Pendaftaran · ${k.noPendaftaran}` : "Kunjungan" };
}

export default async function KunjunganDetailRoute({
  params,
}: {
  params: Promise<{ id: string; kunjunganId: string }>;
}) {
  const { id, kunjunganId } = await params;
  return (
    <KunjunganResolver noRM={decodeURIComponent(id)} kunjunganId={kunjunganId} />
  );
}
