import type { Metadata } from "next";
import BandingDetailPage from "@/components/eklaim/banding/BandingDetailPage";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "E-Klaim · Detail Banding",
  description: "Detail pengajuan keberatan banding klaim BPJS / Asuransi",
};

export default async function BandingDetailRoute({ params }: RouteParams) {
  const { id } = await params;
  return <BandingDetailPage id={id} />;
}
