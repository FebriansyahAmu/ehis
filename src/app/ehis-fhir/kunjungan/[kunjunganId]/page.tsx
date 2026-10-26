import type { Metadata } from "next";
import FhirKunjunganDetail from "@/components/fhir/kunjungan/FhirKunjunganDetail";

export const metadata: Metadata = { title: "Detail Kunjungan — EHIS SatuSehat" };

export default async function Page({ params }: { params: Promise<{ kunjunganId: string }> }) {
  const { kunjunganId } = await params;
  return <FhirKunjunganDetail kunjunganId={kunjunganId} />;
}
